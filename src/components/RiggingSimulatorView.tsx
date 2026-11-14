import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  GitCompare,
  Hand,
  OctagonAlert,
  Pause,
  Play,
  RotateCcw,
  Save,
  ShieldAlert,
  SkipBack,
  SkipForward,
  Sliders,
} from 'lucide-react';
import {
  RIGGING_LOADS,
  RIGGING_SCENARIOS,
  RIGGING_SHACKLES,
  RIGGING_SLINGS,
} from '../data/riggingScenarios';
import {
  CraneCommand,
  EnvironmentMode,
  RiggingCameraPreset,
  RiggingConfiguration,
  RiggingSessionRecord,
  RiggingSimulationState,
  RiggingTrainingMode,
  UnitDisplayMode,
} from '../types/academy';
import {
  calculateRiggingStatics,
  createInitialSimState,
  evaluateRiggingAttempt,
  formatLength,
  formatWeight,
  issueCraneCommand,
  stepRiggingSimulation,
} from '../utils/riggingPhysics';
import { GlossaryLink } from './GlossaryDrawer';
import { RiggingScene3D } from './RiggingScene3D';

interface RiggingSimulatorViewProps {
  riggingSessions: RiggingSessionRecord[];
  onSaveRiggingSession: (record: RiggingSessionRecord) => void;
  onOpenGlossary?: (entryId: string) => void;
  onNavigateCraneSignals?: () => void;
  initialSignalMode?: boolean;
}

interface LiftSnapshot {
  label: string;
  minAngleDeg: number;
  maxTensionLb: number;
  peakTiltDeg: number;
  failed: boolean;
  failureTitle: string;
  leftPointId: string;
  rightPointId: string;
  leftLengthFt: number;
  rightLengthFt: number;
}

type DeckTab = 'setup' | 'statics' | 'coach';

export const RiggingSimulatorView: React.FC<RiggingSimulatorViewProps> = ({
  riggingSessions,
  onSaveRiggingSession,
  onOpenGlossary,
  onNavigateCraneSignals,
  initialSignalMode = false,
}) => {
  const [trainingMode, setTrainingMode] = useState<RiggingTrainingMode>('guided');
  const [scenarioId, setScenarioId] = useState<string>(RIGGING_SCENARIOS[0].id);
  const scenario = useMemo(
    () => RIGGING_SCENARIOS.find((s) => s.id === scenarioId) ?? RIGGING_SCENARIOS[0],
    [scenarioId]
  );

  const [config, setConfig] = useState<RiggingConfiguration>(scenario.initialConfig);
  const [environment, setEnvironment] = useState<EnvironmentMode>(scenario.environment);
  const [unit, setUnit] = useState<UnitDisplayMode>('imperial');
  const [cameraPreset, setCameraPreset] = useState<RiggingCameraPreset>('orbit');
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [hideCalculations, setHideCalculations] = useState<boolean>(false);
  const [signalControlMode, setSignalControlMode] = useState<boolean>(
    initialSignalMode || Boolean(scenario.requiresSignalControl)
  );
  const [activePickSide, setActivePickSide] = useState<'left' | 'right'>('left');
  const [deckTab, setDeckTab] = useState<DeckTab>('setup');
  const [usedSignalModeInAttempt, setUsedSignalModeInAttempt] = useState<boolean>(
    initialSignalMode || Boolean(scenario.requiresSignalControl)
  );

  // Selected catalog items
  const load = useMemo(
    () => RIGGING_LOADS.find((l) => l.id === config.loadId) ?? RIGGING_LOADS[0],
    [config.loadId]
  );
  const sling = useMemo(
    () => RIGGING_SLINGS.find((s) => s.id === config.slingId) ?? RIGGING_SLINGS[0],
    [config.slingId]
  );
  const shackle = useMemo(
    () => RIGGING_SHACKLES.find((sh) => sh.id === config.shackleId) ?? RIGGING_SHACKLES[0],
    [config.shackleId]
  );

  // Live Statics Calculation
  const statics = useMemo(
    () => calculateRiggingStatics(load, config, sling, shackle),
    [load, config, sling, shackle]
  );

  // Dynamic Physics State
  const [simState, setSimState] = useState<RiggingSimulationState>(() =>
    createInitialSimState(
      load,
      config,
      statics,
      scenario.targetZoneXFt,
      scenario.targetZoneZFt
    )
  );

  // Replay State
  const [replayMode, setReplayMode] = useState<boolean>(false);
  const [replayPlaying, setReplayPlaying] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [replaySpeed, setReplaySpeed] = useState<0.25 | 0.5 | 1>(0.5);

  // Before / After Comparison Snapshots
  const [baselineSnapshot, setBaselineSnapshot] = useState<LiftSnapshot | null>(null);
  const [latestEvaluation, setLatestEvaluation] = useState<RiggingSessionRecord | null>(null);

  // AI Rigging Coach State
  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Refs for fixed-timestep RAF physics loop
  const simRef = useRef(simState);
  simRef.current = simState;
  const loadRef = useRef(load);
  loadRef.current = load;
  const configRef = useRef(config);
  configRef.current = config;
  const staticsRef = useRef(statics);
  staticsRef.current = statics;
  const slingRef = useRef(sling);
  slingRef.current = sling;
  const shackleRef = useRef(shackle);
  shackleRef.current = shackle;
  const envRef = useRef(environment);
  envRef.current = environment;
  const signalReqRef = useRef(signalControlMode);
  signalReqRef.current = signalControlMode;

  // Reset sim cleanly when scenario changes
  const handleSelectScenario = useCallback((nextId: string) => {
    const found = RIGGING_SCENARIOS.find((s) => s.id === nextId) ?? RIGGING_SCENARIOS[0];
    setScenarioId(found.id);
    setConfig(found.initialConfig);
    setEnvironment(found.environment);
    const sigOn = Boolean(found.requiresSignalControl);
    setSignalControlMode(sigOn);
    setUsedSignalModeInAttempt(sigOn);
    setReplayMode(false);
    setReplayPlaying(false);
    setLatestEvaluation(null);
    setAiReply(null);

    const nextLoad = RIGGING_LOADS.find((l) => l.id === found.initialConfig.loadId) ?? RIGGING_LOADS[0];
    const nextSling = RIGGING_SLINGS.find((s) => s.id === found.initialConfig.slingId) ?? RIGGING_SLINGS[0];
    const nextShackle = RIGGING_SHACKLES.find((sh) => sh.id === found.initialConfig.shackleId) ?? RIGGING_SHACKLES[0];
    const nextStatics = calculateRiggingStatics(nextLoad, found.initialConfig, nextSling, nextShackle);
    setSimState(
      createInitialSimState(
        nextLoad,
        found.initialConfig,
        nextStatics,
        found.targetZoneXFt,
        found.targetZoneZFt
      )
    );
  }, []);

  // Re-initialize grounded simulation if student changes load shape while grounded
  const updateConfig = useCallback((updater: (prev: RiggingConfiguration) => RiggingConfiguration) => {
    setConfig((prev) => {
      const next = updater(prev);
      if (simRef.current.phase === 'grounded' || simRef.current.phase === 'failed') {
        const l = RIGGING_LOADS.find((item) => item.id === next.loadId) ?? loadRef.current;
        const sl = RIGGING_SLINGS.find((item) => item.id === next.slingId) ?? slingRef.current;
        const sh = RIGGING_SHACKLES.find((item) => item.id === next.shackleId) ?? shackleRef.current;
        const st = calculateRiggingStatics(l, next, sl, sh);
        setSimState(
          createInitialSimState(
            l,
            next,
            st,
            simRef.current.targetZoneXFt,
            simRef.current.targetZoneZFt
          )
        );
        setReplayMode(false);
      }
      return next;
    });
  }, []);

  // Fixed-timestep Physics Loop (60Hz accumulator)
  useEffect(() => {
    if (replayMode) return;
    let rafId = 0;
    let lastTime = performance.now();
    let acc = 0;

    const tick = (now: number) => {
      const elapsed = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      acc += elapsed;

      const s = simRef.current;
      const isIdleCommand =
        s.activeCommand === 'idle' ||
        s.activeCommand === 'stop' ||
        s.activeCommand === 'emergency-stop';
      const isSettled =
        Math.abs(s.loadVy) < 0.02 &&
        Math.abs(s.swingXDeg) < 0.15 &&
        Math.abs(s.swingXVel) < 0.15 &&
        Math.abs(s.swingZDeg) < 0.15 &&
        Math.abs(s.swingZVel) < 0.15 &&
        Math.abs(s.tiltZVelDeg) < 0.15;
      const shouldStep =
        s.failed
          ? s.loadYFt > loadRef.current.heightFt / 2 + 0.02
          : !isIdleCommand || (!isSettled && s.phase !== 'grounded' && !s.emergencyStopLatched);

      if (shouldStep && acc >= 1 / 60) {
        let updated = s;
        while (acc >= 1 / 60) {
          updated = stepRiggingSimulation(
            updated,
            1 / 60,
            loadRef.current,
            configRef.current,
            staticsRef.current,
            slingRef.current,
            shackleRef.current,
            {
              environment: envRef.current,
              requiresSignalControl: signalReqRef.current,
            }
          );
          acc -= 1 / 60;
        }
        setSimState(updated);
      } else if (!shouldStep) {
        acc = 0;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [replayMode]);

  // Replay playback timer
  useEffect(() => {
    if (!replayMode || !replayPlaying) return;
    const intervalMs = Math.round((1000 / 60) / replaySpeed);
    const id = window.setInterval(() => {
      setReplayIndex((prev) => {
        if (prev + 1 >= simRef.current.frames.length) {
          setReplayPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, Math.max(12, intervalMs));
    return () => window.clearInterval(id);
  }, [replayMode, replayPlaying, replaySpeed]);

  // Optional HTML5 Gamepad polling (for bridge/trolley/hoist/E-stop)
  useEffect(() => {
    let lastPadCmd = '';
    const padTimer = window.setInterval(() => {
      if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
      const pads = navigator.getGamepads();
      const gp = pads?.[0];
      if (!gp) return;
      if (gp.buttons[1]?.pressed) {
        if (lastPadCmd !== 'emergency-stop') {
          lastPadCmd = 'emergency-stop';
          handleIssueCommand('emergency-stop', false);
        }
        return;
      }
      const axX = gp.axes[0] ?? 0;
      const axY = gp.axes[1] ?? 0;
      let nextCmd: CraneCommand | null = null;
      if (gp.buttons[0]?.pressed) nextCmd = 'hoist';
      else if (gp.buttons[2]?.pressed) nextCmd = 'lower';
      else if (axX < -0.55) nextCmd = 'bridge-left';
      else if (axX > 0.55) nextCmd = 'bridge-right';
      else if (axY < -0.55) nextCmd = 'trolley-back';
      else if (axY > 0.55) nextCmd = 'trolley-fwd';

      if (nextCmd && nextCmd !== lastPadCmd) {
        lastPadCmd = nextCmd;
        handleIssueCommand(nextCmd, false);
      } else if (!nextCmd && lastPadCmd && lastPadCmd !== 'stop') {
        lastPadCmd = 'stop';
        handleIssueCommand('stop', false);
      }
    }, 140);
    return () => window.clearInterval(padTimer);
  }, []);

  const handleIssueCommand = (command: CraneCommand, viaSignal = false) => {
    setReplayMode(false);
    setReplayPlaying(false);
    if (viaSignal) {
      setUsedSignalModeInAttempt(true);
    }
    setSimState((prev) =>
      issueCraneCommand(
        prev,
        command,
        loadRef.current,
        configRef.current,
        staticsRef.current,
        scenario.targetZoneXFt,
        scenario.targetZoneZFt
      )
    );
  };

  const handleSelect3DPoint = (pointId: string, side: 'left' | 'right') => {
    updateConfig((prev) => {
      if (side === 'left') {
        return { ...prev, leftPointId: pointId };
      }
      return { ...prev, rightPointId: pointId };
    });
  };

  const captureCurrentSnapshot = (label: string): LiftSnapshot => {
    const peakTilt = Math.max(
      Math.abs(statics.predictedStaticTiltDeg),
      ...simState.frames.map((f) => Math.abs(f.tiltZDeg))
    );
    const peakTension = Math.max(
      statics.maxTensionLb,
      ...simState.frames.map((f) => Math.max(f.liveTensionLeftLb, f.liveTensionRightLb))
    );
    return {
      label,
      minAngleDeg: statics.minHorizontalAngleDeg,
      maxTensionLb: Math.round(peakTension),
      peakTiltDeg: Math.round(peakTilt * 10) / 10,
      failed: simState.failed || statics.willFailOnLift,
      failureTitle: simState.failureAnalysis?.title ?? (statics.willFailOnLift ? 'Predicted Overload/Defect' : 'Safe Nominal'),
      leftPointId: config.leftPointId,
      rightPointId: config.rightPointId,
      leftLengthFt: config.leftLengthFt,
      rightLengthFt: config.rightLengthFt,
    };
  };

  const currentSnapshot = useMemo(() => captureCurrentSnapshot('Current Setup'), [statics, simState, config]);

  const handleEvaluateAndSave = () => {
    const record = evaluateRiggingAttempt(
      simState,
      statics,
      scenario,
      trainingMode,
      config,
      usedSignalModeInAttempt
    );
    setLatestEvaluation(record);
    onSaveRiggingSession(record);
  };

  const handleAskAiRiggingCoach = async (customPrompt?: string) => {
    const questionText = (customPrompt ?? aiQuestion).trim() ||
      'Analyze my current rigging geometry, sling tensions, CG tilt, and tell me what needs fixing before hoisting.';
    setAiLoading(true);
    setAiReply(null);

    const groundTruthSummary = `SIMULATOR GROUND TRUTH (DO NOT CONTRADICT):
- Scenario: ${scenario.title} (${trainingMode} mode)
- Load: ${load.name}, Gross Weight = ${load.weightLb} lb, CG Offset X = ${load.cgOffsetXFt} ft
- Sling: ${sling.name} (${sling.condition}), Hitch = ${config.hitchType}, Effective WLL = ${statics.leftLeg.effectiveWllLb} lb
- Shackle: ${shackle.name} (WLL = ${shackle.wllLb} lb, Pin Tightened = ${config.shacklePinTightened})
- Spreader Beam = ${config.useSpreaderBeam}, Edge Softeners = ${config.useEdgeSofteners}, Tag Line = ${config.tagLineAttached}
- Left Leg: Point ${config.leftPointId}, Length ${config.leftLengthFt} ft, Angle ${statics.leftLeg.horizontalAngleDeg} deg, Tension ${statics.leftLeg.tensionLb} lb (${statics.leftLeg.utilizationPct}% WLL)
- Right Leg: Point ${config.rightPointId}, Length ${config.rightLengthFt} ft, Angle ${statics.rightLeg.horizontalAngleDeg} deg, Tension ${statics.rightLeg.tensionLb} lb (${statics.rightLeg.utilizationPct}% WLL)
- Predicted Static Tilt = ${statics.predictedStaticTiltDeg} deg, Hook-to-CG Offset = ${statics.hookToCgOffsetXFt} ft
- Indeterminate Multi-Leg Warning = ${statics.indeterminateWarning}
- Failure Occurred = ${simState.failed ? `${simState.failureAnalysis?.title}: ${simState.failureAnalysis?.primaryReason}` : 'None'}`;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeTopic: '3D Rigging & Crane Lift Simulator (428A)',
          messages: [
            {
              role: 'user',
              text: `${groundTruthSummary}\n\nStudent Question: ${questionText}\nNote: Explain strictly from these exact simulator figures and clearly remind that this is an educational simulation, not an engineered lift plan.`,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error('Offline fallback');
      const data = (await res.json()) as { reply?: string };
      setAiReply(data.reply ?? 'No reply returned.');
    } catch {
      // Deterministic grounded local fallback when GEMINI_API_KEY isn't active
      const issues = statics.warnings.map((w) => `• ${w.message} → ${w.recommendation}`).join('\n');
      setAiReply(
        `Simulated Engineering Review (${load.name} · ${load.weightLb.toLocaleString()} lb):\n` +
          `• Left Leg: ${statics.leftLeg.tensionLb.toLocaleString()} lb @ ${statics.leftLeg.horizontalAngleDeg}° (${statics.leftLeg.utilizationPct}% WLL)\n` +
          `• Right Leg: ${statics.rightLeg.tensionLb.toLocaleString()} lb @ ${statics.rightLeg.horizontalAngleDeg}° (${statics.rightLeg.utilizationPct}% WLL)\n` +
          `• Predicted Tilt: ${statics.predictedStaticTiltDeg}° (Hook-to-CG offset ${statics.hookToCgOffsetXFt} ft)\n` +
          (issues ? `\nActive Findings:\n${issues}` : '\n• All calculated checks are inside simulated safe bounds. Run a 6-inch Test Lift to confirm level balance.') +
          '\n\n(Educational simulation feedback only — actual lifts require certified load charts and qualified supervision.)'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const activeFrame =
    replayMode && simState.frames.length > 0
      ? simState.frames[Math.min(replayIndex, simState.frames.length - 1)]
      : simState.frames[simState.frames.length - 1];

  const isAssessment = trainingMode === 'assessment';

  return (
    <div className="space-y-5">
      {/* Header & Mode Strip */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#2A394A]">
        <div>
          <p className="text-xs font-mono text-amber-400">
            ONTARIO 428A RIGGING LAB · DETERMINISTIC RIGID-BODY & STATICS SIMULATION
          </p>
          <h1 className="text-3xl font-bold text-white tracking-wide mt-1">
            3D Rigging & Crane Lift Simulator
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Educational simulation only — never use simulated results as a substitute for certified equipment load charts, engineered lift plans, or Ontario OHSA Reg. 213/91 supervision.
            {onOpenGlossary && (
              <span className="ml-2 text-slate-300">
                Glossary:{' '}
                <GlossaryLink termIdOrName="wll" onOpenGlossary={onOpenGlossary} />
                {' · '}
                <GlossaryLink termIdOrName="sling-angle" label="Sling Angle" onOpenGlossary={onOpenGlossary} />
                {' · '}
                <GlossaryLink termIdOrName="centre-of-gravity" label="CG" onOpenGlossary={onOpenGlossary} />
                {' · '}
                <GlossaryLink termIdOrName="spreader-bar" label="Spreader" onOpenGlossary={onOpenGlossary} />
              </span>
            )}
          </p>
        </div>

        {/* Unit & Exam Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center p-1 bg-[#111B27] border border-[#2A394A] rounded-md">
            <button
              type="button"
              onClick={() => setUnit('imperial')}
              className={`px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap ${
                unit === 'imperial' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
              }`}
            >
              lb / ft
            </button>
            <button
              type="button"
              onClick={() => setUnit('metric')}
              className={`px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap ${
                unit === 'metric' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
              }`}
            >
              kg / m
            </button>
          </div>

          <button
            type="button"
            onClick={() => setEnvironment((e) => (e === 'indoor-shop' ? 'outdoor-yard' : 'indoor-shop'))}
            className="px-3 py-1.5 rounded-md bg-[#111B27] border border-[#2A394A] hover:border-amber-400 text-xs font-medium text-slate-200 whitespace-nowrap"
          >
            {environment === 'indoor-shop' ? 'Indoor Fab Shop' : 'Outdoor Yard'}
          </button>

          <button
            type="button"
            onClick={() => setHideCalculations((h) => !h)}
            className={`px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap ${
              hideCalculations
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-[#111B27] border-[#2A394A] text-slate-200 hover:border-amber-400'
            }`}
          >
            {hideCalculations ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {hideCalculations ? 'Calcs Hidden (Exam)' : 'Hide Calcs'}
          </button>
        </div>
      </div>

      {/* Mode Switch & 10-Scenario Selector */}
      <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'guided', label: 'Guided Rigging' },
              { id: 'free', label: 'Free Practice' },
              { id: 'assessment', label: 'Skills Assessment' },
              { id: 'certification-prep', label: 'Cert Challenge Prep (Unofficial)' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setTrainingMode(m.id);
                if (m.id === 'assessment') {
                  setHideCalculations(true);
                }
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                trainingMode === m.id
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-[#0A111A] border border-[#2A394A] text-slate-300 hover:border-slate-500'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 min-w-[260px] flex-1 max-w-md">
          <label htmlFor="rigging-scenario-select" className="text-xs font-mono text-slate-400 shrink-0">
            SCENARIO:
          </label>
          <select
            id="rigging-scenario-select"
            value={scenario.id}
            onChange={(e) => handleSelectScenario(e.target.value)}
            className="w-full bg-[#0A111A] border border-[#2A394A] rounded-md px-3 py-1.5 text-xs text-white"
          >
            {RIGGING_SCENARIOS.map((sc) => (
              <option key={sc.id} value={sc.id}>
                #{sc.number} · {sc.title} ({sc.difficulty})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main 2-Zone Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / CENTER: 3D Viewport + Crane Operator & Replay Deck */}
        <div className="lg:col-span-7 space-y-4">
          {/* 3D Canvas Container */}
          <div className="bg-[#111B27] border border-[#2A394A] rounded-lg overflow-hidden">
            {/* Viewport Toolbar */}
            <div className="px-3.5 py-2.5 border-b border-[#2A394A] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Camera className="w-3.5 h-3.5 text-amber-400 mr-1" />
                {(['orbit', 'inspector', 'overhead', 'side'] as RiggingCameraPreset[]).map((cam) => (
                  <button
                    key={cam}
                    type="button"
                    onClick={() => setCameraPreset(cam)}
                    className={`px-2 py-1 rounded text-xs capitalize whitespace-nowrap ${
                      cameraPreset === cam
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'bg-[#0A111A] text-slate-300 border border-[#2A394A]'
                    }`}
                  >
                    {cam}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowOverlays((v) => !v)}
                  className={`px-2 py-1 rounded text-xs whitespace-nowrap ml-1 ${
                    showOverlays
                      ? 'bg-sky-500/20 border border-sky-500/60 text-sky-300'
                      : 'bg-[#0A111A] border border-[#2A394A] text-slate-400'
                  }`}
                >
                  {showOverlays ? 'CG Marker: ON' : 'CG Marker: OFF'}
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">3D Click Assigns:</span>
                <button
                  type="button"
                  onClick={() => setActivePickSide('left')}
                  className={`px-2 py-0.5 rounded font-mono ${
                    activePickSide === 'left'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-[#0A111A] text-slate-300 border border-[#2A394A]'
                  }`}
                >
                  Left Leg
                </button>
                <button
                  type="button"
                  onClick={() => setActivePickSide('right')}
                  className={`px-2 py-0.5 rounded font-mono ${
                    activePickSide === 'right'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-[#0A111A] text-slate-300 border border-[#2A394A]'
                  }`}
                >
                  Right Leg
                </button>
              </div>
            </div>

            {/* Live WebGL Scene */}
            <div className="h-[400px] sm:h-[460px] w-full bg-[#0c131d]">
              <RiggingScene3D
                load={load}
                config={config}
                statics={statics}
                frame={activeFrame}
                environment={environment}
                targetZoneXFt={scenario.targetZoneXFt}
                targetZoneZFt={scenario.targetZoneZFt}
                cameraPreset={cameraPreset}
                showOverlays={showOverlays}
                activePickSide={activePickSide}
                onSelectAttachmentPoint={handleSelect3DPoint}
              />
            </div>

            {/* Live Telemetry Strip (below canvas, never blurred over canvas) */}
            <div className="px-4 py-2.5 bg-[#0A111A] border-t border-[#2A394A] grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-400 block">PHASE</span>
                <span
                  className={`font-semibold uppercase ${
                    (replayMode ? activeFrame.failed : simState.failed)
                      ? 'text-red-400'
                      : (replayMode ? activeFrame.phase : simState.phase) === 'emergency-stopped'
                      ? 'text-red-300'
                      : (replayMode ? activeFrame.phase : simState.phase) === 'landed-target'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {replayMode ? activeFrame.phase : simState.phase}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">LOAD CLEARANCE</span>
                <span className="text-white tabular-nums">
                  {formatLength(Math.max(0, activeFrame.loadYFt - load.heightFt / 2), unit)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">LIVE TILT</span>
                <span
                  className={`tabular-nums ${
                    Math.abs(activeFrame.tiltZDeg) > scenario.maxAllowedTiltDeg
                      ? 'text-red-400 font-bold'
                      : 'text-slate-100'
                  }`}
                >
                  {activeFrame.tiltZDeg.toFixed(1)}°
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">LEFT / RIGHT LIVE</span>
                <span className="text-sky-300 tabular-nums">
                  {hideCalculations
                    ? 'HIDDEN'
                    : `${formatWeight(activeFrame.liveTensionLeftLb, unit)} / ${formatWeight(
                        activeFrame.liveTensionRightLb,
                        unit
                      )}`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">BRIDGE X / Z</span>
                <span className="text-slate-200 tabular-nums">
                  {activeFrame.craneXFt.toFixed(1)} / {activeFrame.craneZFt.toFixed(1)} ft
                </span>
              </div>
            </div>
          </div>

          {/* Crane Operator Controls + Always-Accessible EMERGENCY STOP */}
          <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Crane Operator Console
                </h2>
                <button
                  type="button"
                  onClick={() => setSignalControlMode((s) => !s)}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 whitespace-nowrap border ${
                    signalControlMode
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-[#0A111A] border-[#2A394A] text-slate-300'
                  }`}
                >
                  <Hand className="w-3.5 h-3.5" />
                  {signalControlMode ? 'Hand-Signal Mode: ON' : 'Direct Control Mode'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {onNavigateCraneSignals && (
                  <button
                    type="button"
                    onClick={onNavigateCraneSignals}
                    className="text-xs text-sky-400 hover:underline whitespace-nowrap"
                  >
                    Open Signal Trainer →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleIssueCommand('emergency-stop', signalControlMode)}
                  className="px-3.5 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                >
                  <OctagonAlert className="w-4 h-4" />
                  EMERGENCY STOP
                </button>
              </div>
            </div>

            {simState.signalCommsLost && (
              <div className="p-2.5 rounded bg-amber-950/50 border border-amber-600 text-xs text-amber-200">
                Signal communication timeout (&gt;3.8s without signal update): crane automatically executed safe Stop per Ontario Reg. 213/91.
              </div>
            )}

            {!signalControlMode ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => handleIssueCommand('take-slack')}
                  className="px-2.5 py-2 rounded bg-[#0A111A] border border-[#2A394A] hover:border-amber-400 text-xs font-medium text-white whitespace-nowrap"
                >
                  Take Slack
                </button>
                <button
                  type="button"
                  onClick={() => handleIssueCommand('test-lift')}
                  className="px-2.5 py-2 rounded bg-sky-500/15 border border-sky-500/50 hover:bg-sky-500/25 text-xs font-semibold text-sky-200 whitespace-nowrap"
                >
                  Test Lift (6&quot;)
                </button>
                <button
                  type="button"
                  onClick={() => handleIssueCommand('hoist')}
                  className="px-2.5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs whitespace-nowrap"
                >
                  Hoist Up
                </button>
                <button
                  type="button"
                  onClick={() => handleIssueCommand('lower')}
                  className="px-2.5 py-2 rounded bg-[#0A111A] border border-[#2A394A] hover:border-amber-400 text-xs font-medium text-white whitespace-nowrap"
                >
                  Lower
                </button>
                <button
                  type="button"
                  onClick={() => handleIssueCommand('stop')}
                  className="px-2.5 py-2 rounded bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white whitespace-nowrap"
                >
                  Stop
                </button>
                <button
                  type="button"
                  onClick={() => handleIssueCommand('bridge-left')}
                  className="px-2.5 py-2 rounded bg-[#0A111A] border border-[#2A394A] hover:border-amber-400 text-xs text-slate-200 whitespace-nowrap"
                >
                  ← Bridge Left
                </button>
                <button
                  type="button"
                  onClick={() => handleIssueCommand('bridge-right')}
                  className="px-2.5 py-2 rounded bg-[#0A111A] border border-[#2A394A] hover:border-amber-400 text-xs text-slate-200 whitespace-nowrap"
                >
                  Bridge Right →
                </button>
                <button
                  type="button"
                  onClick={() => handleIssueCommand('trolley-fwd')}
                  className="px-2.5 py-2 rounded bg-[#0A111A] border border-[#2A394A] hover:border-amber-400 text-xs text-slate-200 whitespace-nowrap"
                >
                  Trolley Fwd (+Z)
                </button>
                <button
                  type="button"
                  onClick={() => handleIssueCommand('trolley-back')}
                  className="px-2.5 py-2 rounded bg-[#0A111A] border border-[#2A394A] hover:border-amber-400 text-xs text-slate-200 whitespace-nowrap"
                >
                  Trolley Back (-Z)
                </button>
                <button
                  type="button"
                  onClick={() => handleIssueCommand('reset')}
                  className="px-2.5 py-2 rounded bg-[#0A111A] border border-[#2A394A] hover:border-red-400 text-xs text-slate-300 flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Lift
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">
                  Issue ASME B30.2 crane hand signals (refresh signals while moving to prevent comms-loss stop):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Main Hoist (Take Slack)', cmd: 'take-slack' as CraneCommand },
                    { label: 'Move Slowly (Test Lift)', cmd: 'test-lift' as CraneCommand },
                    { label: 'Hoist (Circle Up)', cmd: 'hoist' as CraneCommand },
                    { label: 'Lower (Circle Down)', cmd: 'lower' as CraneCommand },
                    { label: 'Travel Left', cmd: 'bridge-left' as CraneCommand },
                    { label: 'Travel Right', cmd: 'bridge-right' as CraneCommand },
                    { label: 'Trolley Fwd (+Z)', cmd: 'trolley-fwd' as CraneCommand },
                    { label: 'Trolley Back (-Z)', cmd: 'trolley-back' as CraneCommand },
                    { label: 'Stop (1 Arm Sweep)', cmd: 'stop' as CraneCommand },
                    { label: 'Reset Lift', cmd: 'reset' as CraneCommand },
                  ].map((sig) => (
                    <button
                      key={sig.label}
                      type="button"
                      onClick={() => handleIssueCommand(sig.cmd, true)}
                      className="px-2.5 py-2 rounded bg-[#0A111A] border border-amber-500/35 hover:border-amber-400 text-xs font-medium text-amber-200 whitespace-nowrap truncate"
                    >
                      {sig.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Failure Analysis & Replay + Before/After Comparison */}
          {(simState.failureAnalysis || simState.frames.length > 4) && (
            <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Lift Replay & Failure Analysis ({simState.frames.length} frames)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setReplayMode((r) => !r);
                      setReplayPlaying(false);
                      setReplayIndex(0);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium border whitespace-nowrap ${
                      replayMode
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold'
                        : 'bg-[#0A111A] border-[#2A394A] text-slate-200'
                    }`}
                  >
                    {replayMode ? 'Exit Replay → Live' : 'Enter Replay'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaselineSnapshot(captureCurrentSnapshot('Baseline Lift'))}
                    className="px-2.5 py-1 rounded bg-[#0A111A] border border-[#2A394A] hover:border-sky-400 text-xs text-sky-300 whitespace-nowrap"
                  >
                    Save Baseline
                  </button>
                </div>
              </div>

              {replayMode && (
                <div className="p-3 rounded-md bg-[#0A111A] border border-[#2A394A] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setReplayPlaying(false);
                          setReplayIndex((i) => Math.max(0, i - 5));
                        }}
                        className="p-1.5 rounded border border-[#2A394A] text-slate-200 hover:border-amber-400"
                        title="Step Back"
                      >
                        <SkipBack className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplayPlaying((p) => !p)}
                        className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-semibold text-xs flex items-center gap-1"
                      >
                        {replayPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {replayPlaying ? 'Pause' : 'Play'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplayPlaying(false);
                          setReplayIndex((i) => Math.min(simState.frames.length - 1, i + 5));
                        }}
                        className="p-1.5 rounded border border-[#2A394A] text-slate-200 hover:border-amber-400"
                        title="Step Forward"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      {([0.25, 0.5, 1] as const).map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setReplaySpeed(spd)}
                          className={`px-2 py-0.5 rounded text-xs font-mono ${
                            replaySpeed === spd
                              ? 'bg-sky-500 text-slate-950 font-bold'
                              : 'bg-[#111B27] text-slate-300 border border-[#2A394A]'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, simState.frames.length - 1)}
                    value={replayIndex}
                    onChange={(e) => {
                      setReplayPlaying(false);
                      setReplayIndex(Number(e.target.value));
                    }}
                    className="w-full accent-amber-500"
                  />
                </div>
              )}

              {simState.failureAnalysis && simState.failureAnalysis.occurred && (
                <div className="p-4 rounded-md bg-red-950/35 border border-red-700/70 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{simState.failureAnalysis.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleIssueCommand('reset')}
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                    >
                      Retry Original Setup
                    </button>
                  </div>
                  <p className="text-xs text-red-100">
                    <strong>Overloaded / Failed Part:</strong> {simState.failureAnalysis.overloadedPart} ·{' '}
                    <strong>Cause:</strong> {simState.failureAnalysis.primaryReason}
                  </p>
                  <p className="text-xs text-slate-300">{simState.failureAnalysis.physicsExplanation}</p>
                  <ul className="space-y-1 text-xs text-amber-200">
                    {simState.failureAnalysis.recommendedCorrections.map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {baselineSnapshot && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[baselineSnapshot, currentSnapshot].map((snap, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-md border ${
                        idx === 0
                          ? 'bg-[#0A111A] border-[#2A394A]'
                          : 'bg-[#0D1622] border-sky-500/40'
                      }`}
                    >
                      <p className="font-mono text-amber-400 font-semibold">{snap.label}</p>
                      <p className="text-slate-300 mt-1">
                        Picks: {snap.leftPointId} ({snap.leftLengthFt} ft) / {snap.rightPointId} ({snap.rightLengthFt} ft)
                      </p>
                      <p className="font-mono text-white mt-1 tabular-nums">
                        Min Angle: {snap.minAngleDeg}° · Peak Tension: {formatWeight(snap.maxTensionLb, unit)} · Tilt: {snap.peakTiltDeg}°
                      </p>
                      <p className={`mt-1 font-semibold ${snap.failed ? 'text-red-400' : 'text-emerald-400'}`}>
                        {snap.failureTitle}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Setup, Live Statics & AI Coach / Grading Deck */}
        <div className="lg:col-span-5 space-y-4">
          {/* Deck Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#111B27] border border-[#2A394A] rounded-lg">
            {(
              [
                { id: 'setup', label: '1. Rigging Setup', icon: Sliders },
                { id: 'statics', label: '2. Statics & CG', icon: ClipboardCheck },
                { id: 'coach', label: '3. Coach & Score', icon: Bot },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDeckTab(tab.id)}
                  className={`py-2 px-2 rounded text-xs font-medium flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors ${
                    deckTab === tab.id
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: RIGGING SETUP */}
          {deckTab === 'setup' && (
            <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-4">
              {/* Load Specification Box */}
              <div className="p-3 rounded-md bg-[#0A111A] border border-[#2A394A] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-amber-400">LOAD PROFILE</span>
                  <span className="text-xs font-mono text-white tabular-nums">
                    {formatWeight(load.weightLb, unit)}
                  </span>
                </div>
                {trainingMode === 'free' ? (
                  <select
                    aria-label="Select training load"
                    value={config.loadId}
                    onChange={(e) => {
                      const nextLoad =
                        RIGGING_LOADS.find((l) => l.id === e.target.value) ?? RIGGING_LOADS[0];
                      updateConfig((prev) => ({
                        ...prev,
                        loadId: nextLoad.id,
                        leftPointId: nextLoad.attachmentPoints[0].id,
                        rightPointId:
                          nextLoad.attachmentPoints[nextLoad.attachmentPoints.length - 1].id,
                      }));
                    }}
                    className="w-full bg-[#111B27] border border-[#2A394A] rounded px-2.5 py-1.5 text-xs text-white"
                  >
                    {RIGGING_LOADS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({formatWeight(l.weightLb, unit)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-bold text-white">{load.name}</p>
                )}
                <p className="text-xs text-slate-400">
                  Dims: {formatLength(load.lengthFt, unit, 1)} L × {formatLength(load.widthFt, unit, 1)} W × {formatLength(load.heightFt, unit, 1)} H · CG X: {formatLength(load.cgOffsetXFt, unit, 2)}
                </p>
              </div>

              {/* Sling & Shackle Hardware */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Sling Type & Capacity</label>
                  <select
                    aria-label="Sling type"
                    value={config.slingId}
                    onChange={(e) => updateConfig((p) => ({ ...p, slingId: e.target.value }))}
                    className="w-full bg-[#0A111A] border border-[#2A394A] rounded px-2.5 py-2 text-xs text-white"
                  >
                    {RIGGING_SLINGS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({formatWeight(s.verticalWllLb, unit)} Vert)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Shackle Hardware</label>
                    <select
                      aria-label="Shackle hardware"
                      value={config.shackleId}
                      onChange={(e) => updateConfig((p) => ({ ...p, shackleId: e.target.value }))}
                      className="w-full bg-[#0A111A] border border-[#2A394A] rounded px-2 py-2 text-xs text-white"
                    >
                      {RIGGING_SHACKLES.map((sh) => (
                        <option key={sh.id} value={sh.id}>
                          {sh.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Hitch & Bridle Legs</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        aria-label="Hitch type"
                        value={config.hitchType}
                        onChange={(e) =>
                          updateConfig((p) => ({
                            ...p,
                            hitchType: e.target.value as RiggingConfiguration['hitchType'],
                          }))
                        }
                        className="bg-[#0A111A] border border-[#2A394A] rounded px-2 py-2 text-xs text-white"
                      >
                        <option value="vertical">Vertical</option>
                        <option value="choker">Choker</option>
                        <option value="basket">Basket</option>
                      </select>
                      <select
                        aria-label="Leg count"
                        value={config.legCount}
                        onChange={(e) =>
                          updateConfig((p) => ({
                            ...p,
                            legCount: Number(e.target.value) as 2 | 3 | 4,
                          }))
                        }
                        className="bg-[#0A111A] border border-[#2A394A] rounded px-2 py-2 text-xs text-white"
                      >
                        <option value={2}>2-Leg</option>
                        <option value={3}>3-Leg</option>
                        <option value={4}>4-Leg</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attachment Points & Sling Lengths */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#2A394A]">
                <div>
                  <label className="block text-xs text-sky-300 mb-1">Left Pick Point (A)</label>
                  <select
                    aria-label="Left attachment point"
                    value={config.leftPointId}
                    onChange={(e) => updateConfig((p) => ({ ...p, leftPointId: e.target.value }))}
                    className="w-full bg-[#0A111A] border border-[#2A394A] rounded px-2 py-1.5 text-xs text-white"
                  >
                    {load.attachmentPoints.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>Left Length</span>
                      <span className="text-white tabular-nums">{formatLength(config.leftLengthFt, unit, 1)}</span>
                    </div>
                    <input
                      aria-label="Left sling length"
                      type="range"
                      min={6}
                      max={18}
                      step={0.5}
                      value={config.leftLengthFt}
                      onChange={(e) =>
                        updateConfig((p) => ({ ...p, leftLengthFt: Number(e.target.value) }))
                      }
                      className="w-full accent-sky-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-amber-300 mb-1">Right Pick Point (B)</label>
                  <select
                    aria-label="Right attachment point"
                    value={config.rightPointId}
                    onChange={(e) => updateConfig((p) => ({ ...p, rightPointId: e.target.value }))}
                    className="w-full bg-[#0A111A] border border-[#2A394A] rounded px-2 py-1.5 text-xs text-white"
                  >
                    {load.attachmentPoints.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>Right Length</span>
                      <span className="text-white tabular-nums">{formatLength(config.rightLengthFt, unit, 1)}</span>
                    </div>
                    <input
                      aria-label="Right sling length"
                      type="range"
                      min={6}
                      max={18}
                      step={0.5}
                      value={config.rightLengthFt}
                      onChange={(e) =>
                        updateConfig((p) => ({ ...p, rightLengthFt: Number(e.target.value) }))
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Hardware & Inspection Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#2A394A] text-xs">
                <label className="flex items-center gap-2 p-2 rounded bg-[#0A111A] border border-[#2A394A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.useSpreaderBeam}
                    onChange={(e) =>
                      updateConfig((p) => ({ ...p, useSpreaderBeam: e.target.checked }))
                    }
                    className="accent-amber-500"
                  />
                  <span className="text-slate-200">Spreader Beam (90° drops)</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded bg-[#0A111A] border border-[#2A394A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.useEdgeSofteners}
                    onChange={(e) =>
                      updateConfig((p) => ({ ...p, useEdgeSofteners: e.target.checked }))
                    }
                    className="accent-amber-500"
                  />
                  <span className="text-slate-200">Edge Softeners Fitted</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded bg-[#0A111A] border border-[#2A394A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.shacklePinTightened}
                    onChange={(e) =>
                      updateConfig((p) => ({ ...p, shacklePinTightened: e.target.checked }))
                    }
                    className="accent-amber-500"
                  />
                  <span className="text-slate-200">Shackle Pins Tightened</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded bg-[#0A111A] border border-[#2A394A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.tagLineAttached}
                    onChange={(e) =>
                      updateConfig((p) => ({ ...p, tagLineAttached: e.target.checked }))
                    }
                    className="accent-amber-500"
                  />
                  <span className="text-slate-200">Tag Line Attached</span>
                </label>
              </div>

              <label className="flex items-center gap-2.5 p-2.5 rounded-md bg-emerald-950/20 border border-emerald-700/40 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={config.inspectedHardware}
                  onChange={(e) =>
                    updateConfig((p) => ({ ...p, inspectedHardware: e.target.checked }))
                  }
                  className="accent-emerald-400"
                />
                <span className="text-emerald-200 font-medium">
                  Pre-Lift Inspection Complete (verified tags, wire strands, shackle pin & clear bay)
                </span>
              </label>
            </div>
          )}

          {/* TAB 2: LIVE STATICS & CG */}
          {deckTab === 'statics' && (
            <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-4">
              {hideCalculations ? (
                <div className="p-6 text-center space-y-3 bg-[#0A111A] border border-amber-500/40 rounded-md">
                  <EyeOff className="w-7 h-7 text-amber-400 mx-auto" />
                  <p className="text-sm font-bold text-white">Exam Mode: Live Calculations Hidden</p>
                  <p className="text-xs text-slate-400">
                    Calculate sling tensions and angles manually from geometry ({formatWeight(load.weightLb, unit)}, spread{' '}
                    {formatLength(statics.totalHorizontalSpreadFt, unit)}), or toggle calculations back on above.
                  </p>
                </div>
              ) : !statics.valid ? (
                <div className="p-4 rounded bg-red-950/40 border border-red-700 text-xs text-red-200">
                  {statics.geometryError}
                </div>
              ) : (
                <>
                  {/* KPI Readout Cards */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded bg-[#0A111A] border border-[#2A394A]">
                      <span className="text-slate-400">Left Leg Tension (A)</span>
                      <p className="text-lg font-bold font-mono text-sky-400 tabular-nums mt-0.5">
                        {formatWeight(statics.leftLeg.tensionLb, unit)}
                      </p>
                      <span className="text-slate-400 font-mono">
                        {statics.leftLeg.horizontalAngleDeg}° · {statics.leftLeg.utilizationPct}% WLL
                      </span>
                    </div>
                    <div className="p-3 rounded bg-[#0A111A] border border-[#2A394A]">
                      <span className="text-slate-400">Right Leg Tension (B)</span>
                      <p className="text-lg font-bold font-mono text-amber-400 tabular-nums mt-0.5">
                        {formatWeight(statics.rightLeg.tensionLb, unit)}
                      </p>
                      <span className="text-slate-400 font-mono">
                        {statics.rightLeg.horizontalAngleDeg}° · {statics.rightLeg.utilizationPct}% WLL
                      </span>
                    </div>
                    <div className="p-3 rounded bg-[#0A111A] border border-[#2A394A]">
                      <span className="text-slate-400">Predicted CG Tilt</span>
                      <p className="text-base font-bold font-mono text-white tabular-nums mt-0.5">
                        {statics.predictedStaticTiltDeg}°
                      </p>
                      <span className="text-slate-400">
                        Share: {statics.predictedVerticalShareLeftPct}% / {statics.predictedVerticalShareRightPct}%
                      </span>
                    </div>
                    <div className="p-3 rounded bg-[#0A111A] border border-[#2A394A]">
                      <span className="text-slate-400">Spread / Hook Height</span>
                      <p className="text-base font-bold font-mono text-white tabular-nums mt-0.5">
                        {formatLength(statics.totalHorizontalSpreadFt, unit, 1)} /{' '}
                        {formatLength(statics.hookHeightAbovePickFt, unit, 1)}
                      </p>
                      <span className="text-slate-400">
                        Effective WLL: {formatWeight(statics.leftLeg.effectiveWllLb, unit)}
                      </span>
                    </div>
                  </div>

                  {/* Warnings List */}
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {statics.warnings.length === 0 ? (
                      <div className="p-3 rounded bg-emerald-950/30 border border-emerald-700/50 text-xs text-emerald-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>All statics & hardware checks are within simulated limits.</span>
                      </div>
                    ) : (
                      statics.warnings.map((w, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded border text-xs space-y-0.5 ${
                            w.severity === 'critical'
                              ? 'bg-red-950/35 border-red-700/60 text-red-200'
                              : 'bg-amber-950/35 border-amber-700/60 text-amber-200'
                          }`}
                        >
                          <p className="font-semibold">{w.message}</p>
                          <p className="text-slate-300">{w.recommendation}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: COACH, SCENARIO HINTS, GRADING & AI INSTRUCTOR */}
          {deckTab === 'coach' && (
            <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-mono text-amber-400">
                  SCENARIO #{scenario.number} OBJECTIVE
                </p>
                <p className="text-sm font-semibold text-white">{scenario.title}</p>
                <p className="text-xs text-slate-300">{scenario.objective}</p>
                <p className="text-xs text-slate-400 italic">{scenario.canadianCodeNote}</p>
              </div>

              {!isAssessment && (
                <div className="p-3 rounded bg-[#0A111A] border border-[#2A394A] space-y-1.5">
                  <p className="text-xs font-mono text-sky-400">GUIDED INSTRUCTOR HINTS</p>
                  {scenario.guidedHints.map((h, i) => (
                    <p key={i} className="text-xs text-slate-300">
                      • {h}
                    </p>
                  ))}
                </div>
              )}

              {isAssessment && (
                <div className="p-3 rounded bg-amber-950/30 border border-amber-700/50 text-xs text-amber-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Skills Assessment Active: Hints disabled. Rig, test-lift, and land inside the green pad.</span>
                </div>
              )}

              {/* Evaluate & Persist Score */}
              <div className="space-y-2.5 pt-1 border-t border-[#2A394A]">
                <button
                  type="button"
                  onClick={handleEvaluateAndSave}
                  className="w-full py-2.5 px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Grade & Save Lift Attempt ({riggingSessions.length} Saved)
                </button>

                {latestEvaluation && (
                  <div
                    className={`p-3 rounded-md border text-xs space-y-2 ${
                      latestEvaluation.passed
                        ? 'bg-emerald-950/35 border-emerald-600/60 text-emerald-100'
                        : 'bg-amber-950/35 border-amber-600/60 text-amber-100'
                    }`}
                  >
                    <p className="font-bold">
                      Assessment Result: {latestEvaluation.scorePct}% ({latestEvaluation.passed ? 'PASS' : 'NEEDS CORRECTION'})
                    </p>
                    <ul className="space-y-1">
                      {latestEvaluation.criteriaBreakdown.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className={c.passed ? 'text-emerald-400' : 'text-red-400'}>
                            {c.passed ? '✓' : '✗'}
                          </span>
                          <span>
                            <strong>{c.label}:</strong> {c.detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Grounded AI Rigging Instructor */}
              <div className="space-y-2 pt-2 border-t border-[#2A394A]">
                <p className="text-xs font-mono text-amber-400">AI RIGGING INSTRUCTOR (SIMULATOR-GROUNDED)</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask about sling tension, CG tilt, or shackle choice..."
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    className="flex-1 bg-[#0A111A] border border-[#2A394A] rounded px-2.5 py-1.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={() => void handleAskAiRiggingCoach()}
                    className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs whitespace-nowrap"
                  >
                    {aiLoading ? 'Analyzing...' : 'Ask AI'}
                  </button>
                </div>
                {aiReply && (
                  <div className="p-3 rounded bg-[#0A111A] border border-[#2A394A] text-xs text-slate-200 whitespace-pre-wrap max-h-[180px] overflow-y-auto">
                    {aiReply}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
