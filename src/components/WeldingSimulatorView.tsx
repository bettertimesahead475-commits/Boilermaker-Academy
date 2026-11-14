import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Bot,
  Camera,
  CheckCircle2,
  Eye,
  Flame,
  Gamepad2,
  Hammer,
  History,
  Play,
  RotateCcw,
  Sliders,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  CameraPreset,
  ElectrodeSpec,
  GraphicsQuality,
  JointPrep,
  MachineSettings,
  Polarity,
  TrainingMode,
  WeldInstantMetrics,
  WeldPerformanceReport,
  WeldSamplePoint,
  WeldingPosition,
  WeldingProcess,
  WeldingSessionRecord,
} from '../types/academy';
import { weldAudio } from '../utils/weldAudio';
import {
  computeEffectiveAmperage,
  computeInstantWeldPhysics,
  ELECTRODE_PROFILES,
  evaluateWeldSession,
  getDefaultMachineSettings,
  getRecommendedAmpRange,
  PROCESS_ELECTRODES,
  WELD_DEFECT_QUIZ,
  WELDING_EXERCISES,
  WELDING_POSITIONS,
} from '../utils/weldingPhysics';
import { GlossaryLink } from './GlossaryDrawer';
import { TechnicalDiagram } from './TechnicalDiagrams';
import { LivePose, WeldingScene3D } from './WeldingScene3D';

interface WeldingSimulatorViewProps {
  initialExerciseId?: string;
  onClearInitialExercise?: () => void;
  weldingSessions: WeldingSessionRecord[];
  onSaveWeldingSession: (session: WeldingSessionRecord) => void;
  onOpenGlossary: (entryId: string) => void;
}

type SimTab = 'booth' | 'defects' | 'theory' | 'history';

const LOCAL_SESSIONS_KEY = 'boilermaker_428a_welding_sessions_v1';

export const WeldingSimulatorView: React.FC<WeldingSimulatorViewProps> = ({
  initialExerciseId,
  onClearInitialExercise,
  weldingSessions,
  onSaveWeldingSession,
  onOpenGlossary,
}) => {
  const [activeTab, setActiveTab] = useState<SimTab>('booth');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    initialExerciseId ?? WELDING_EXERCISES[0].id
  );
  const [trainingMode, setTrainingMode] = useState<TrainingMode>('guided');

  const activeExercise = useMemo(
    () => WELDING_EXERCISES.find((e) => e.id === selectedExerciseId) ?? WELDING_EXERCISES[0],
    [selectedExerciseId]
  );

  const [settings, setSettings] = useState<MachineSettings>(() =>
    getDefaultMachineSettings(WELDING_EXERCISES[0])
  );

  const [pose, setPose] = useState<LivePose>({
    progress: 0.08,
    lateralOffsetMm: 0,
    arcLengthMm: 2.1,
    travelAngleDeg: 14,
    workAngleDeg: 45,
    electrodeRemainingPct: 100,
  });

  const [arcActive, setArcActive] = useState(false);
  const [samples, setSamples] = useState<WeldSamplePoint[]>([]);
  const [slagChipped, setSlagChipped] = useState(false);
  const [showDefectOverlay, setShowDefectOverlay] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('first-person');
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>('medium');
  const [muted, setMuted] = useState(false);
  const [gamepadConnected, setGamepadConnected] = useState<string | null>(null);
  const [report, setReport] = useState<WeldPerformanceReport | null>(null);

  // Replay state
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);

  // Optional Gemini AI debrief state
  const [aiCoaching, setAiCoaching] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Defect Lab & Theory Quiz states
  const [defectAnswers, setDefectAnswers] = useState<Record<string, number>>({});
  const [theoryStep, setTheoryStep] = useState<'positions' | 'symbols'>('positions');

  // Refs for real-time 60fps simulation loop
  const arcActiveRef = useRef(arcActive);
  arcActiveRef.current = arcActive;
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const keysPressedRef = useRef<Set<string>>(new Set());
  const prevProgressRef = useRef(pose.progress);
  const lastSampleTimeRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const liveSpeedIpmRef = useRef(6.5);

  // Sync preset if opened from Glossary / external link
  useEffect(() => {
    if (!initialExerciseId) return;
    const ex = WELDING_EXERCISES.find((e) => e.id === initialExerciseId);
    if (ex) {
      setSelectedExerciseId(ex.id);
      setTrainingMode(ex.modeDefault);
      setSettings(getDefaultMachineSettings(ex));
      resetCoupon(ex);
    }
    onClearInitialExercise?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialExerciseId]);

  const resetCoupon = useCallback((exerciseOverride = activeExercise) => {
    setArcActive(false);
    weldAudio.stopArc();
    setIsReplaying(false);
    setReplayIndex(0);
    setSamples([]);
    setSlagChipped(false);
    setShowDefectOverlay(false);
    setReport(null);
    setAiCoaching(null);
    startTimeRef.current = null;
    prevProgressRef.current = 0.08;
    const posMeta =
      WELDING_POSITIONS.find((p) => p.id === exerciseOverride.recommendedPosition) ??
      WELDING_POSITIONS[0];
    setPose({
      progress: 0.08,
      lateralOffsetMm: 0,
      arcLengthMm: Number(
        ((exerciseOverride.targetArcLengthMm[0] + exerciseOverride.targetArcLengthMm[1]) / 2).toFixed(1)
      ),
      travelAngleDeg: Math.round(
        (exerciseOverride.targetTravelAngleDeg[0] + exerciseOverride.targetTravelAngleDeg[1]) / 2
      ),
      workAngleDeg: posMeta.idealWorkAngleDeg,
      electrodeRemainingPct: 100,
    });
  }, [activeExercise]);

  const selectExercise = (exId: string) => {
    const ex = WELDING_EXERCISES.find((e) => e.id === exId) ?? WELDING_EXERCISES[0];
    setSelectedExerciseId(ex.id);
    setTrainingMode(ex.modeDefault);
    setSettings(getDefaultMachineSettings(ex));
    resetCoupon(ex);
  };

  // Sync Web Audio mute
  useEffect(() => {
    weldAudio.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    return () => {
      weldAudio.stopArc();
    };
  }, []);

  // Compute live instant physics for HUD
  const instantMetrics: WeldInstantMetrics = useMemo(
    () =>
      computeInstantWeldPhysics(settings, {
        arcLengthMm: pose.arcLengthMm,
        travelAngleDeg: pose.travelAngleDeg,
        workAngleDeg: pose.workAngleDeg,
        travelSpeedIpm: liveSpeedIpmRef.current,
        lateralOffsetMm: pose.lateralOffsetMm,
        electrodeRemainingPct: pose.electrodeRemainingPct,
      }),
    [settings, pose]
  );

  // Start / Stop Arc Audio cleanly
  useEffect(() => {
    if (arcActive && !isReplaying) {
      weldAudio.startArc(settings.process);
    } else {
      weldAudio.stopArc();
    }
  }, [arcActive, isReplaying, settings.process]);

  useEffect(() => {
    if (arcActive && !isReplaying) {
      weldAudio.updateArc(instantMetrics.arcStability, pose.arcLengthMm);
    }
  }, [arcActive, isReplaying, instantMetrics.arcStability, pose.arcLengthMm]);

  // Keyboard bindings (Spacebar weld trigger, Q/E travel angle, A/D work angle, W/S arc length, Left/Right travel)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'booth' || isReplaying) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      keysPressedRef.current.add(k);
      if (k === ' ') {
        e.preventDefault();
        setArcActive(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysPressedRef.current.delete(k);
      if (k === ' ') {
        setArcActive(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [activeTab, isReplaying]);

  // Gamepad API detection
  useEffect(() => {
    const onConnect = (e: GamepadEvent) => setGamepadConnected(e.gamepad.id);
    const onDisconnect = () => setGamepadConnected(null);
    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);
    return () => {
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
    };
  }, []);

  // Main real-time simulation loop (keyboard/gamepad control + bead deposition + travel speed + burn-off)
  useEffect(() => {
    let rafId = 0;
    let lastFrame = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      if (activeTab === 'booth' && !isReplaying) {
        const keys = keysPressedRef.current;
        let pDelta = 0;
        let latDelta = 0;
        let arcDelta = 0;
        let travelAngleDelta = 0;
        let workAngleDelta = 0;

        if (keys.has('arrowright')) pDelta += dt * 0.036; // ~6.5 IPM along 6-in coupon
        if (keys.has('arrowleft')) pDelta -= dt * 0.036;
        if (keys.has('w')) arcDelta -= dt * 2.2;
        if (keys.has('s')) arcDelta += dt * 2.2;
        if (keys.has('q')) travelAngleDelta -= dt * 28;
        if (keys.has('e')) travelAngleDelta += dt * 28;
        if (keys.has('a')) workAngleDelta -= dt * 32;
        if (keys.has('d')) workAngleDelta += dt * 32;

        // Gamepad polling if attached
        try {
          const pads = navigator.getGamepads ? navigator.getGamepads() : [];
          const gp = pads?.[0];
          if (gp) {
            const dead = (v: number) => (Math.abs(v) < 0.14 ? 0 : v);
            pDelta += dead(gp.axes[0] ?? 0) * dt * 0.045;
            latDelta += dead(gp.axes[1] ?? 0) * dt * 6;
            workAngleDelta += dead(gp.axes[2] ?? 0) * dt * 35;
            arcDelta += dead(gp.axes[3] ?? 0) * dt * 2.4;
            const rtPressed = (gp.buttons[7]?.value ?? 0) > 0.35 || gp.buttons[0]?.pressed;
            if (rtPressed && !arcActiveRef.current) setArcActive(true);
            else if (!rtPressed && arcActiveRef.current && !keys.has(' ')) {
              // Only release if trigger was governing
            }
          }
        } catch {
          // ignore
        }

        const currentPose = poseRef.current;
        const currArc = arcActiveRef.current;

        // Apply pose nudges if any
        if (pDelta !== 0 || latDelta !== 0 || arcDelta !== 0 || travelAngleDelta !== 0 || workAngleDelta !== 0 || currArc) {
          const isRod = settingsRef.current.process === 'SMAW' || settingsRef.current.process === 'PIPE';
          const burnRatePctPerSec = isRod && currArc ? 1.85 : 0; // ~54s full rod burn
          const nextRem = Math.max(0, currentPose.electrodeRemainingPct - burnRatePctPerSec * dt);

          const nextProgress = Math.max(0.02, Math.min(0.98, currentPose.progress + pDelta));
          const deltaInches = Math.abs(nextProgress - prevProgressRef.current) * 6.0;
          prevProgressRef.current = nextProgress;

          // Compute instantaneous travel speed in IPM (smoothed)
          const instSpeedIpm = dt > 0 ? (deltaInches / dt) * 60 : 0;
          if (currArc) {
            // Smooth moving average; if stationary while arc on, speed drops cleanly toward 1.5 IPM
            liveSpeedIpmRef.current =
              liveSpeedIpmRef.current * 0.88 + Math.max(1.2, Math.min(20, instSpeedIpm)) * 0.12;
          }

          const nextPose: LivePose = {
            progress: nextProgress,
            lateralOffsetMm: Math.max(-5.5, Math.min(5.5, currentPose.lateralOffsetMm + latDelta)),
            arcLengthMm: Math.max(0.6, Math.min(7.5, Number((currentPose.arcLengthMm + arcDelta).toFixed(2)))),
            travelAngleDeg: Math.max(-25, Math.min(35, currentPose.travelAngleDeg + travelAngleDelta)),
            workAngleDeg: Math.max(15, Math.min(120, currentPose.workAngleDeg + workAngleDelta)),
            electrodeRemainingPct: nextRem,
          };

          if (
            pDelta !== 0 ||
            latDelta !== 0 ||
            arcDelta !== 0 ||
            travelAngleDelta !== 0 ||
            workAngleDelta !== 0 ||
            burnRatePctPerSec > 0
          ) {
            setPose(nextPose);
          }

          // Sample weld bead deposition roughly every 95 ms while arc is active and rod not spent
          if (currArc && nextRem > 1 && now - lastSampleTimeRef.current >= 95) {
            lastSampleTimeRef.current = now;
            if (startTimeRef.current === null) startTimeRef.current = now;
            const tMs = Math.round(now - startTimeRef.current);
            const metrics = computeInstantWeldPhysics(settingsRef.current, {
              arcLengthMm: nextPose.arcLengthMm,
              travelAngleDeg: nextPose.travelAngleDeg,
              workAngleDeg: nextPose.workAngleDeg,
              travelSpeedIpm: liveSpeedIpmRef.current,
              lateralOffsetMm: nextPose.lateralOffsetMm,
              electrodeRemainingPct: nextPose.electrodeRemainingPct,
            });

            const sample: WeldSamplePoint = {
              tMs,
              progress: nextPose.progress,
              lateralOffsetMm: nextPose.lateralOffsetMm,
              arcLengthMm: nextPose.arcLengthMm,
              travelAngleDeg: nextPose.travelAngleDeg,
              workAngleDeg: nextPose.workAngleDeg,
              travelSpeedIpm: Number(liveSpeedIpmRef.current.toFixed(1)),
              arcStability: metrics.arcStability,
              heatInputKjPerIn: metrics.heatInputKjPerIn,
              beadWidthMm: metrics.beadWidthMm,
              reinforcementMm: metrics.reinforcementMm,
              penetrationMm: metrics.penetrationMm,
              fusionScore: metrics.fusionIndex,
              defects: metrics.defects,
            };

            setSamples((prev) => (prev.length >= 300 ? prev : [...prev, sample]));
          }
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [activeTab, isReplaying]);

  // Replay timer loop
  useEffect(() => {
    if (!isReplaying || samples.length === 0) return;
    const interval = window.setInterval(() => {
      setReplayIndex((idx) => {
        if (idx >= samples.length - 1) {
          setIsReplaying(false);
          return idx;
        }
        return idx + 1;
      });
    }, 85);
    return () => window.clearInterval(interval);
  }, [isReplaying, samples.length]);

  const displayedSamples = useMemo(() => {
    if (!isReplaying && replayIndex === 0) return samples;
    if (isReplaying || replayIndex > 0) return samples.slice(0, replayIndex + 1);
    return samples;
  }, [samples, isReplaying, replayIndex]);

  const effectivePose: LivePose = useMemo(() => {
    if ((isReplaying || replayIndex > 0) && samples[replayIndex]) {
      const s = samples[replayIndex];
      return {
        progress: s.progress,
        lateralOffsetMm: s.lateralOffsetMm,
        arcLengthMm: s.arcLengthMm,
        travelAngleDeg: s.travelAngleDeg,
        workAngleDeg: s.workAngleDeg,
        electrodeRemainingPct: Math.max(15, 100 - (replayIndex / Math.max(1, samples.length)) * 55),
      };
    }
    return pose;
  }, [isReplaying, replayIndex, samples, pose]);

  const handleEvaluateAndSave = () => {
    setArcActive(false);
    weldAudio.stopArc();
    const evalReport = evaluateWeldSession(
      settings,
      samples,
      trainingMode === 'free' ? undefined : activeExercise
    );
    setReport(evalReport);
    setShowDefectOverlay(true);

    if (samples.length >= 4) {
      const record: WeldingSessionRecord = {
        id: `weld-${Date.now()}`,
        exerciseId: activeExercise.id,
        exerciseTitle:
          trainingMode === 'free'
            ? `Free Practice · ${settings.process} ${settings.electrode} ${settings.position}`
            : activeExercise.title,
        mode: trainingMode,
        completedAt: new Date().toISOString(),
        settings: { ...settings },
        report: evalReport,
        samples: [...samples],
      };

      try {
        const existingRaw = localStorage.getItem(LOCAL_SESSIONS_KEY);
        const existing = existingRaw ? (JSON.parse(existingRaw) as WeldingSessionRecord[]) : [];
        localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify([record, ...existing].slice(0, 25)));
      } catch {
        // ignore quota errors
      }
      onSaveWeldingSession(record);
    }
  };

  const handleAskAiCoach = async () => {
    if (!report) return;
    setAiLoading(true);
    setAiCoaching(null);
    try {
      const prompt = `Review my simulated ${settings.process} (${settings.electrode}) weld in ${settings.position} (${settings.jointPrep}):
- Settings: ${computeEffectiveAmperage(settings)} A, ${settings.polarity}, dia ${settings.electrodeDiameterIn}", plate ${settings.materialThicknessIn}"
- Overall Sim Score: ${report.overallScore}% (Stability ${report.arcStabilityScore}%, Angles ${report.angleAccuracyScore}%, Speed ${report.travelSpeedScore}%, Arc Length ${report.arcLengthScore}%, Fusion ${report.fusionQualityScore}%)
- Avg Heat Input: ${report.avgHeatInputKjPerIn} kJ/in | Speed: ${report.avgTravelSpeedIpm} IPM | Arc Length: ${report.avgArcLengthMm} mm
- Flagged issues: ${report.mistakes.join('; ') || 'None'}
Give concise shop-floor coaching tips and one Ontario 428A exam reminder related to this joint.`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: prompt }],
          activeTopic: `3D Welding Simulator — ${settings.process} ${settings.electrode} ${settings.position}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiCoaching(
          data.error ||
            'AI Coach unavailable offline (no GEMINI_API_KEY configured). Deterministic local evaluation above remains fully active.'
        );
      } else {
        setAiCoaching(data.reply);
      }
    } catch {
      setAiCoaching(
        'Offline mode: Server AI endpoint unreachable. Use the local deterministic inspection report above.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleProcessChange = (proc: WeldingProcess) => {
    const allowedElectrodes = PROCESS_ELECTRODES[proc];
    const nextElec = allowedElectrodes[0];
    const prof = ELECTRODE_PROFILES[nextElec];
    const defaultDia = prof.defaultDiameterIn;
    const ampWin = prof.ampWindowByDiameter[defaultDia] ?? [100, 140];
    setSettings((prev) => ({
      ...prev,
      process: proc,
      electrode: nextElec,
      polarity: prof.preferredPolarities[0],
      electrodeDiameterIn: defaultDia,
      amperage: Math.round((ampWin[0] + ampWin[1]) / 2),
      voltage: proc === 'FCAW-G' ? 25.5 : proc === 'FCAW-S' ? 20.5 : 21.0,
      wireFeedSpeedIpm: proc === 'FCAW-G' ? 290 : proc === 'FCAW-S' ? 195 : 220,
      gasFlowCfh: proc === 'FCAW-G' || proc === 'GMAW' || proc === 'GTAW' ? 35 : 0,
    }));
  };

  const handleElectrodeChange = (elec: ElectrodeSpec) => {
    const prof = ELECTRODE_PROFILES[elec];
    const ampWin = prof.ampWindowByDiameter[prof.defaultDiameterIn] ?? [100, 140];
    setSettings((prev) => ({
      ...prev,
      electrode: elec,
      polarity: prof.preferredPolarities[0],
      electrodeDiameterIn: prof.defaultDiameterIn,
      amperage: Math.round((ampWin[0] + ampWin[1]) / 2),
    }));
  };

  const handlePositionChange = (pos: WeldingPosition) => {
    const meta = WELDING_POSITIONS.find((p) => p.id === pos) ?? WELDING_POSITIONS[0];
    setSettings((prev) => ({
      ...prev,
      position: pos,
      jointPrep: meta.jointDefault,
    }));
    setPose((prev) => ({ ...prev, workAngleDeg: meta.idealWorkAngleDeg }));
  };

  const loadHistoryReplay = (rec: WeldingSessionRecord) => {
    setSettings(rec.settings);
    setSamples(rec.samples);
    setReport(rec.report);
    setSlagChipped(true);
    setShowDefectOverlay(true);
    setReplayIndex(0);
    setIsReplaying(true);
    setActiveTab('booth');
  };

  const combinedSessions = useMemo(() => {
    const ids = new Set(weldingSessions.map((s) => s.id));
    let localExtra: WeldingSessionRecord[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_SESSIONS_KEY);
      if (raw) {
        localExtra = (JSON.parse(raw) as WeldingSessionRecord[]).filter((s) => !ids.has(s.id));
      }
    } catch {
      // ignore
    }
    return [...weldingSessions, ...localExtra];
  }, [weldingSessions]);

  const effectiveAmps = computeEffectiveAmperage(settings);
  const [recMinA, recMaxA] = getRecommendedAmpRange(settings);
  const isCV = settings.process === 'FCAW-G' || settings.process === 'FCAW-S' || settings.process === 'GMAW';
  const needsGas = settings.process === 'FCAW-G' || settings.process === 'GMAW' || settings.process === 'GTAW';
  const activePosMeta = WELDING_POSITIONS.find((p) => p.id === settings.position) ?? WELDING_POSITIONS[0];

  return (
    <div className="space-y-5">
      {/* Header & Top Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2A394A]">
        <div>
          <p className="text-xs font-mono text-amber-400">
            INTERACTIVE 3D WORKSHOP · ONTARIO 428A PRACTICAL TRAINING SIMULATOR
          </p>
          <h1 className="text-3xl font-bold text-white mt-0.5">3D Welding Training Simulator</h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulated parameter-driven physics for educational training only — does not replace CWB, TSSA, or ASME code qualification.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-[#111B27] p-1 rounded-md border border-[#2A394A]">
          {(
            [
              ['booth', '3D Welding Booth', Flame],
              ['defects', 'Defect ID Lab', AlertTriangle],
              ['theory', 'Blueprints & Positions', Sliders],
              ['history', `Saved Passes (${combinedSessions.length})`, History],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === id
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white hover:bg-[#182433]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: LIVE 3D WELDING BOOTH */}
      {activeTab === 'booth' && (
        <div className="space-y-4">
          {/* Training Mode & Exercise Selector Strip */}
          <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(['guided', 'free', 'skills-test'] as TrainingMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTrainingMode(m)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors whitespace-nowrap ${
                    trainingMode === m
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-[#0A111A] border-[#2A394A] text-slate-300 hover:bg-[#182433]'
                  }`}
                >
                  {m === 'guided' ? 'Guided Training' : m === 'free' ? 'Free Practice' : 'Skills Test'}
                </button>
              ))}

              <select
                value={selectedExerciseId}
                onChange={(e) => selectExercise(e.target.value)}
                aria-label="Select welding training exercise"
                className="bg-[#0A111A] border border-[#2A394A] rounded px-3 py-1.5 text-xs text-white font-medium max-w-[340px]"
              >
                {WELDING_EXERCISES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {gamepadConnected && (
                <span className="text-emerald-400 font-mono flex items-center gap-1">
                  <Gamepad2 className="w-3.5 h-3.5" /> Controller Ready
                </span>
              )}
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="px-2.5 py-1.5 rounded bg-[#0A111A] border border-[#2A394A] text-slate-200 hover:border-amber-400 flex items-center gap-1"
              >
                {muted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                {muted ? 'Muted' : 'Arc Audio'}
              </button>
              <select
                value={graphicsQuality}
                onChange={(e) => setGraphicsQuality(e.target.value as GraphicsQuality)}
                aria-label="Graphics quality"
                className="bg-[#0A111A] border border-[#2A394A] rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="low">Graphics: Low</option>
                <option value="medium">Graphics: Medium</option>
                <option value="high">Graphics: High</option>
              </select>
            </div>
          </div>

          {/* Main Simulator Grid: 3D Viewport + Controls */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            {/* Left 8 Columns: 3D Canvas + Live HUD + Action Bar */}
            <div className="xl:col-span-8 space-y-3">
              {/* Viewport Container (no backdrop-blur over WebGL canvas) */}
              <div className="relative h-[430px] sm:h-[520px] rounded-lg overflow-hidden border border-[#2A394A] bg-[#090e15]">
                <WeldingScene3D
                  settings={settings}
                  pose={effectivePose}
                  arcActive={arcActive || (isReplaying && samples.length > 0)}
                  instantMetrics={instantMetrics}
                  samples={displayedSamples}
                  slagChipped={slagChipped}
                  showDefectOverlay={showDefectOverlay}
                  cameraPreset={cameraPreset}
                  graphicsQuality={graphicsQuality}
                  isReplaying={isReplaying}
                  onAimJoint={(prog, lat) => {
                    const deltaInches = Math.abs(prog - prevProgressRef.current) * 6.0;
                    if (deltaInches > 0.002) {
                      liveSpeedIpmRef.current = Number(
                        Math.max(1.5, Math.min(18, liveSpeedIpmRef.current * 0.8 + deltaInches * 85)).toFixed(1)
                      );
                    }
                    prevProgressRef.current = prog;
                    setPose((prev) => ({
                      ...prev,
                      progress: prog,
                      lateralOffsetMm: lat,
                    }));
                  }}
                  onSetTrigger={(on) => setArcActive(on)}
                />

                {/* Top-Left Telemetry Readout Strip (Solid opaque dark card, zero blur) */}
                <div className="pointer-events-none absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="pointer-events-auto bg-[#0A111A]/95 border border-[#2A394A] rounded px-3 py-1.5 flex flex-wrap items-center gap-3 text-xs font-mono">
                    <span className="text-amber-400 font-bold">
                      <GlossaryLink termIdOrName={settings.process} onOpenGlossary={onOpenGlossary} />
                      {' · '}
                      <GlossaryLink termIdOrName={settings.electrode} onOpenGlossary={onOpenGlossary} />
                    </span>
                    <span className="text-slate-300">
                      <GlossaryLink termIdOrName={settings.position.split('-')[0]} label={settings.position} onOpenGlossary={onOpenGlossary} />
                    </span>
                    <span className="text-slate-300">
                      {effectiveAmps} A · {instantMetrics.arcVoltageLive} V ·{' '}
                      <GlossaryLink termIdOrName={settings.polarity} onOpenGlossary={onOpenGlossary} />
                    </span>
                    <span className={arcActive ? 'text-sky-300 font-bold' : 'text-slate-400'}>
                      {isReplaying ? 'REPLAY' : arcActive ? 'ARC ON' : 'READY'}
                    </span>
                  </div>

                  {/* Camera Presets */}
                  <div className="pointer-events-auto flex items-center gap-1 bg-[#0A111A]/95 border border-[#2A394A] rounded p-1">
                    <Camera className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
                    {(
                      [
                        ['first-person', 'Helmet'],
                        ['side', 'Side'],
                        ['overhead', 'Top'],
                        ['orbit', 'Inspect Orbit'],
                      ] as [CameraPreset, string][]
                    ).map(([preset, lbl]) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCameraPreset(preset)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          cameraPreset === preset
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom Live Technique Indicators Bar */}
                <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2">
                  <div className="bg-[#0A111A]/95 border border-[#2A394A] rounded px-3 py-2 grid grid-cols-3 sm:grid-cols-6 gap-3 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-400 block">Travel Ang</span>
                      <span className="text-white font-semibold">{effectivePose.travelAngleDeg}°</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Work Ang</span>
                      <span className="text-white font-semibold">{effectivePose.workAngleDeg}°</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Speed</span>
                      <span className="text-white font-semibold">{liveSpeedIpmRef.current.toFixed(1)} IPM</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Arc Gap</span>
                      <span
                        className={
                          effectivePose.arcLengthMm > 3.8
                            ? 'text-red-400 font-semibold'
                            : 'text-emerald-400 font-semibold'
                        }
                      >
                        {effectivePose.arcLengthMm.toFixed(1)} mm
                      </span>
                    </div>
                    <div>
                      <GlossaryLink
                        termIdOrName="heat-input"
                        label="Heat Input"
                        onOpenGlossary={onOpenGlossary}
                        className="text-slate-400 pointer-events-auto"
                      />
                      <span className="text-amber-300 font-semibold block">
                        {instantMetrics.heatInputKjPerIn} kJ/in
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Consistency</span>
                      <span
                        className={
                          instantMetrics.fusionIndex >= 80
                            ? 'text-emerald-400 font-semibold'
                            : 'text-amber-400 font-semibold'
                        }
                      >
                        {instantMetrics.fusionIndex}%
                      </span>
                    </div>
                  </div>

                  {/* Mobile / Touch Hold-to-Weld Trigger Button */}
                  <button
                    type="button"
                    onPointerDown={() => setArcActive(true)}
                    onPointerUp={() => setArcActive(false)}
                    onPointerLeave={() => setArcActive(false)}
                    className={`pointer-events-auto px-4 py-2.5 rounded-md font-bold text-xs tracking-wide border transition-colors whitespace-nowrap ${
                      arcActive
                        ? 'bg-sky-500 border-sky-300 text-slate-950'
                        : 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950'
                    }`}
                  >
                    {arcActive ? 'ARC ACTIVE (RELEASE TO STOP)' : 'HOLD TO WELD (OR SPACE / DRAG)'}
                  </button>
                </div>
              </div>

              {/* Action Strip Below Viewport */}
              <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSlagChipped((c) => !c);
                      weldAudio.playChipSlagSound();
                    }}
                    disabled={samples.length === 0}
                    className="px-3 py-1.5 rounded bg-[#182433] border border-[#2A394A] hover:border-amber-400 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1.5"
                  >
                    <Hammer className="w-3.5 h-3.5 text-amber-400" />
                    {slagChipped ? 'Restore Slag Layer' : 'Chip Slag'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDefectOverlay((v) => !v)}
                    disabled={samples.length === 0}
                    className={`px-3 py-1.5 rounded border text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 ${
                      showDefectOverlay
                        ? 'bg-red-950/50 border-red-500 text-red-200'
                        : 'bg-[#182433] border-[#2A394A] text-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showDefectOverlay ? 'Hide Defect Pins' : 'Inspect Defects'}
                  </button>

                  {(settings.process === 'SMAW' || settings.process === 'PIPE') && (
                    <button
                      type="button"
                      onClick={() => setPose((p) => ({ ...p, electrodeRemainingPct: 100 }))}
                      className="px-3 py-1.5 rounded bg-[#182433] border border-[#2A394A] hover:border-amber-400 text-xs font-medium text-slate-200"
                    >
                      Change Rod ({Math.round(pose.electrodeRemainingPct)}%)
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => resetCoupon()}
                    className="px-3 py-1.5 rounded bg-[#182433] border border-[#2A394A] hover:border-slate-400 text-xs font-medium text-slate-300 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Fresh Plate
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {samples.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isReplaying) {
                          setIsReplaying(false);
                        } else {
                          setReplayIndex(0);
                          setIsReplaying(true);
                        }
                      }}
                      className="px-3 py-1.5 rounded bg-[#182433] border border-sky-500/50 hover:bg-sky-500/15 text-xs font-semibold text-sky-300 flex items-center gap-1.5"
                    >
                      {isReplaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isReplaying ? 'Stop Replay' : 'Replay Weld'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleEvaluateAndSave}
                    className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    Inspect & Score Pass
                  </button>
                </div>
              </div>

              {/* Replay Scrub Bar when samples exist */}
              {samples.length > 2 && (
                <div className="bg-[#111B27] border border-[#2A394A] rounded-lg px-4 py-2.5 flex items-center gap-3 text-xs font-mono">
                  <span className="text-slate-400 shrink-0">Weld Timeline ({samples.length} pts):</span>
                  <input
                    type="range"
                    min={0}
                    max={samples.length - 1}
                    value={isReplaying || replayIndex > 0 ? replayIndex : samples.length - 1}
                    onChange={(e) => {
                      setIsReplaying(false);
                      setReplayIndex(Number(e.target.value));
                    }}
                    className="flex-1 accent-amber-500"
                    aria-label="Scrub weld replay timeline"
                  />
                  <span className="text-amber-400 shrink-0">
                    {((samples[samples.length - 1]?.progress - samples[0]?.progress) * 6).toFixed(1)} in
                  </span>
                </div>
              )}

              {/* Live Warnings Banner */}
              {instantMetrics.warnings.length > 0 && (
                <div className="bg-amber-950/35 border border-amber-600/50 rounded-lg p-3 space-y-1 text-xs text-amber-200">
                  {instantMetrics.warnings.map((w, i) => (
                    <p key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* Post-Weld Inspection Report */}
              {report && (
                <div className="bg-[#111B27] border border-emerald-600/50 rounded-lg p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2A394A]">
                    <div>
                      <p className="text-xs font-mono text-emerald-400">SIMULATED POST-WELD INSPECTION REPORT</p>
                      <h2 className="text-2xl font-bold text-white mt-0.5">
                        Overall Score: <span className="font-mono text-amber-400">{report.overallScore}%</span> ·{' '}
                        {report.weldLengthInches} in Bead
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleAskAiCoach()}
                      disabled={aiLoading}
                      className="px-3.5 py-2 rounded bg-[#182433] border border-[#2A394A] hover:border-amber-400 text-xs font-semibold text-white flex items-center gap-1.5"
                    >
                      <Bot className="w-4 h-4 text-amber-400" />
                      {aiLoading ? 'Analyzing Pass...' : 'AI Weld Coach Debrief (Optional)'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
                    {[
                      ['Arc Stability', report.arcStabilityScore],
                      ['Angles', report.angleAccuracyScore],
                      ['Travel Speed', report.travelSpeedScore],
                      ['Arc Length', report.arcLengthScore],
                      ['Fusion', report.fusionQualityScore],
                    ].map(([lbl, val]) => (
                      <div key={lbl as string} className="bg-[#0A111A] border border-[#2A394A] rounded p-2.5">
                        <span className="text-slate-400 block">{lbl}</span>
                        <span className="text-base font-bold text-white">{val}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Defect Counts Strip */}
                  <div className="flex flex-wrap gap-3 text-xs font-mono text-slate-300 bg-[#0A111A] p-3 rounded border border-[#1E293B]">
                    <span>
                      <GlossaryLink termIdOrName="undercut" onOpenGlossary={onOpenGlossary} />:{' '}
                      <strong className={report.defectCounts.undercut > 2 ? 'text-red-400' : 'text-emerald-400'}>
                        {report.defectCounts.undercut}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      <GlossaryLink termIdOrName="porosity" onOpenGlossary={onOpenGlossary} />:{' '}
                      <strong className={report.defectCounts.porosity > 1 ? 'text-red-400' : 'text-emerald-400'}>
                        {report.defectCounts.porosity}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      <GlossaryLink termIdOrName="overlap" onOpenGlossary={onOpenGlossary} />:{' '}
                      <strong className={report.defectCounts.overlap > 2 ? 'text-red-400' : 'text-emerald-400'}>
                        {report.defectCounts.overlap}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      <GlossaryLink termIdOrName="incomplete-fusion" label="LOF" onOpenGlossary={onOpenGlossary} />:{' '}
                      <strong className={report.defectCounts.incompleteFusion > 2 ? 'text-red-400' : 'text-emerald-400'}>
                        {report.defectCounts.incompleteFusion}
                      </strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <p className="font-mono text-red-400">DETECTED TECHNIQUE & SETUP ISSUES</p>
                      {report.mistakes.length === 0 ? (
                        <p className="text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Clean pass — no major defect zones flagged.
                        </p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-1 text-slate-200">
                          {report.mistakes.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-mono text-emerald-400">RECOMMENDED CORRECTIONS</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-200">
                        {report.corrections.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {aiCoaching && (
                    <div className="bg-[#0A111A] border border-amber-500/40 rounded p-3.5 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      <p className="font-mono text-amber-400 mb-1">OPTIONAL GEMINI WELD COACH DEBRIEF</p>
                      {aiCoaching}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 font-mono">{report.simulationDisclaimer}</p>
                </div>
              )}
            </div>

            {/* Right 4 Columns: Welding Machine Console, Direct Pose Sliders & Guided Checklist */}
            <div className="xl:col-span-4 space-y-4">
              {/* Guided Instructions */}
              {trainingMode === 'guided' && (
                <div className="bg-[#111B27] border border-amber-500/40 rounded-lg p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-amber-400">Guided Exercise Brief</h2>
                    <span className="text-[11px] font-mono text-slate-400">Pass &ge; {activeExercise.passThreshold}%</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{activeExercise.canadianCodeNote}</p>
                  <ol className="list-decimal pl-4 space-y-1 text-xs text-slate-200">
                    {activeExercise.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Direct Technique & Joint Travel Sliders (works great alongside mouse/touch/keyboard) */}
              <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Torch / Stinger Pose Controls</h2>
                  <span className="text-[11px] font-mono text-slate-400">Keys: Q/E · A/D · W/S · Arrows</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-0.5">
                      <span>Seam Progress (Drag along joint or slide)</span>
                      <span className="font-mono text-amber-400">{(pose.progress * 6).toFixed(2)} in / 6 in</span>
                    </div>
                    <input
                      type="range"
                      min={0.02}
                      max={0.98}
                      step={0.01}
                      value={pose.progress}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        const delta = Math.abs(next - prevProgressRef.current) * 6.0;
                        if (delta > 0) liveSpeedIpmRef.current = Math.min(16, Math.max(2, delta * 90));
                        prevProgressRef.current = next;
                        setPose((p) => ({ ...p, progress: next }));
                      }}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-0.5">
                      <span>Travel Angle (Drag + / Push -)</span>
                      <span className="font-mono text-white">{pose.travelAngleDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min={-25}
                      max={35}
                      step={1}
                      value={pose.travelAngleDeg}
                      onChange={(e) => setPose((p) => ({ ...p, travelAngleDeg: Number(e.target.value) }))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-0.5">
                      <span>Work Angle (Ideal {activePosMeta.idealWorkAngleDeg}°)</span>
                      <span className="font-mono text-white">{pose.workAngleDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={115}
                      step={1}
                      value={pose.workAngleDeg}
                      onChange={(e) => setPose((p) => ({ ...p, workAngleDeg: Number(e.target.value) }))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-0.5">
                      <span>Arc Length (Target ~1.8–3.0 mm)</span>
                      <span className="font-mono text-white">{pose.arcLengthMm.toFixed(1)} mm</span>
                    </div>
                    <input
                      type="range"
                      min={0.8}
                      max={6.5}
                      step={0.1}
                      value={pose.arcLengthMm}
                      onChange={(e) => setPose((p) => ({ ...p, arcLengthMm: Number(e.target.value) }))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Welding Machine Settings Panel */}
              <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-3">
                <h2 className="text-sm font-bold text-white">Welding Power Source & Coupon Setup</h2>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Process</label>
                    <select
                      value={settings.process}
                      onChange={(e) => handleProcessChange(e.target.value as WeldingProcess)}
                      className="w-full bg-[#0A111A] border border-[#2A394A] rounded px-2.5 py-1.5 text-white"
                    >
                      <option value="SMAW">SMAW (Stick)</option>
                      <option value="FCAW-G">FCAW-G (Gas Flux-Core)</option>
                      <option value="FCAW-S">FCAW-S (Self-Shielded)</option>
                      <option value="GMAW">GMAW (MIG Ready)</option>
                      <option value="GTAW">GTAW (TIG Ready)</option>
                      <option value="PIPE">PIPE (Open Root Ready)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Electrode / Wire</label>
                    <select
                      value={settings.electrode}
                      onChange={(e) => handleElectrodeChange(e.target.value as ElectrodeSpec)}
                      className="w-full bg-[#0A111A] border border-[#2A394A] rounded px-2.5 py-1.5 text-white"
                    >
                      {PROCESS_ELECTRODES[settings.process].map((el) => (
                        <option key={el} value={el}>
                          {el} ({ELECTRODE_PROFILES[el].csaClass})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Position</label>
                    <select
                      value={settings.position}
                      onChange={(e) => handlePositionChange(e.target.value as WeldingPosition)}
                      className="w-full bg-[#0A111A] border border-[#2A394A] rounded px-2.5 py-1.5 text-white"
                    >
                      {WELDING_POSITIONS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Joint Prep</label>
                    <select
                      value={settings.jointPrep}
                      onChange={(e) => setSettings((s) => ({ ...s, jointPrep: e.target.value as JointPrep }))}
                      className="w-full bg-[#0A111A] border border-[#2A394A] rounded px-2.5 py-1.5 text-white"
                    >
                      <option value="t-fillet">T-Fillet Corner</option>
                      <option value="v-groove">Single-V Groove</option>
                      <option value="lap">Lap Joint</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Polarity</label>
                    <select
                      value={settings.polarity}
                      onChange={(e) => setSettings((s) => ({ ...s, polarity: e.target.value as Polarity }))}
                      className="w-full bg-[#0A111A] border border-[#2A394A] rounded px-2.5 py-1.5 text-white"
                    >
                      <option value="DCEP">DCEP (Reverse +)</option>
                      <option value="DCEN">DCEN (Straight -)</option>
                      <option value="AC">AC Alternating</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Plate Thickness</label>
                    <select
                      value={settings.materialThicknessIn}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, materialThicknessIn: Number(e.target.value) }))
                      }
                      className="w-full bg-[#0A111A] border border-[#2A394A] rounded px-2.5 py-1.5 text-white"
                    >
                      <option value={0.25}>1/4 in (6.4 mm)</option>
                      <option value={0.375}>3/8 in (9.5 mm)</option>
                      <option value={0.5}>1/2 in (12.7 mm)</option>
                      <option value={0.75}>3/4 in (19.1 mm)</option>
                    </select>
                  </div>
                </div>

                {/* Diameter */}
                <div className="text-xs">
                  <label className="text-slate-400 block mb-1">Electrode / Wire Diameter</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(ELECTRODE_PROFILES[settings.electrode].ampWindowByDiameter).map((dKey) => {
                      const dNum = Number(dKey);
                      const label =
                        dNum === 0.09375
                          ? '3/32"'
                          : dNum === 0.125
                          ? '1/8"'
                          : dNum === 0.15625
                          ? '5/32"'
                          : dNum === 0.0625
                          ? '1/16"'
                          : `${dNum}"`;
                      return (
                        <button
                          key={dKey}
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, electrodeDiameterIn: dNum }))}
                          className={`px-2.5 py-1 rounded border font-mono ${
                            settings.electrodeDiameterIn === dNum
                              ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                              : 'bg-[#0A111A] border-[#2A394A] text-slate-300'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amperage / Voltage / WFS / Gas */}
                <div className="space-y-2.5 text-xs pt-1">
                  {!isCV ? (
                    <div>
                      <div className="flex justify-between text-slate-300 mb-0.5">
                        <span>Amperage (Rec: {recMinA}–{recMaxA} A)</span>
                        <span className="font-mono text-amber-400">{settings.amperage} A</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={240}
                        step={5}
                        value={settings.amperage}
                        onChange={(e) => setSettings((s) => ({ ...s, amperage: Number(e.target.value) }))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between text-slate-300 mb-0.5">
                          <span>Machine Voltage (CV)</span>
                          <span className="font-mono text-amber-400">{settings.voltage.toFixed(1)} V</span>
                        </div>
                        <input
                          type="range"
                          min={16}
                          max={32}
                          step={0.5}
                          value={settings.voltage}
                          onChange={(e) => setSettings((s) => ({ ...s, voltage: Number(e.target.value) }))}
                          className="w-full accent-amber-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-300 mb-0.5">
                          <span>Wire Feed Speed (Eff. ~{effectiveAmps} A)</span>
                          <span className="font-mono text-amber-400">{settings.wireFeedSpeedIpm} IPM</span>
                        </div>
                        <input
                          type="range"
                          min={130}
                          max={450}
                          step={10}
                          value={settings.wireFeedSpeedIpm}
                          onChange={(e) =>
                            setSettings((s) => ({ ...s, wireFeedSpeedIpm: Number(e.target.value) }))
                          }
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </>
                  )}

                  {needsGas && (
                    <div>
                      <div className="flex justify-between text-slate-300 mb-0.5">
                        <span>Shielding Gas Flow (30–40 CFH)</span>
                        <span className="font-mono text-sky-400">{settings.gasFlowCfh} CFH</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        step={5}
                        value={settings.gasFlowCfh}
                        onChange={(e) => setSettings((s) => ({ ...s, gasFlowCfh: Number(e.target.value) }))}
                        className="w-full accent-sky-400"
                      />
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 border-t border-[#1E293B] pt-2">
                  {ELECTRODE_PROFILES[settings.electrode].notes}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WELD DEFECT IDENTIFICATION LAB */}
      {activeTab === 'defects' && (
        <div className="space-y-4">
          <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5">
            <h2 className="text-xl font-bold text-white">Visual Weld Defect Diagnosis & Troubleshooting Lab</h2>
            <p className="text-xs text-slate-400 mt-1">
              Click any underlined defect term to open the Canadian Boilermaker Glossary without losing quiz progress.
            </p>
          </div>

          <div className="space-y-4">
            {WELD_DEFECT_QUIZ.map((item, idx) => {
              const chosen = defectAnswers[item.id];
              const answered = chosen !== undefined;
              return (
                <div key={item.id} className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono text-amber-400">
                      CASE {idx + 1} · {item.defectName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 bg-[#0A111A] p-3 rounded border border-[#1E293B]">
                    Visual Clue: {item.visualClue}
                  </p>
                  <p className="text-sm font-semibold text-white">{item.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.options.map((opt, oIdx) => {
                      const isSel = chosen === oIdx;
                      const isCor = oIdx === item.correctIndex;
                      let cls = 'border-[#2A394A] bg-[#0A111A] text-slate-200 hover:bg-[#182433]';
                      if (answered) {
                        if (isCor) cls = 'border-emerald-500 bg-emerald-950/40 text-emerald-200';
                        else if (isSel) cls = 'border-red-500 bg-red-950/40 text-red-200';
                      }
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setDefectAnswers((p) => ({ ...p, [item.id]: oIdx }))}
                          className={`text-left px-3.5 py-2.5 rounded border text-xs transition-colors ${cls}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {answered && (
                    <p className="text-xs text-slate-300 pt-1">
                      <strong className={chosen === item.correctIndex ? 'text-emerald-400' : 'text-amber-400'}>
                        {chosen === item.correctIndex ? 'Correct: ' : 'Review: '}
                      </strong>
                      {item.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: POSITIONS & BLUEPRINT WELDING SYMBOLS */}
      {activeTab === 'theory' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTheoryStep('positions')}
              className={`px-4 py-2 rounded text-xs font-semibold border ${
                theoryStep === 'positions'
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-[#111B27] border-[#2A394A] text-slate-300'
              }`}
            >
              1G–6G & 1F–4F Positions
            </button>
            <button
              type="button"
              onClick={() => setTheoryStep('symbols')}
              className={`px-4 py-2 rounded text-xs font-semibold border ${
                theoryStep === 'symbols'
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-[#111B27] border-[#2A394A] text-slate-300'
              }`}
            >
              AWS / CSA Welding Symbols
            </button>
          </div>
          <TechnicalDiagram diagramId={theoryStep === 'positions' ? 'welding-positions' : 'welding-symbols'} />
        </div>
      )}

      {/* TAB 4: SAVED WELD PASS HISTORY & REPLAY */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {combinedSessions.length === 0 ? (
            <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-8 text-center text-sm text-slate-400">
              No saved simulator passes yet. Weld a bead in the 3D Welding Booth and click "Inspect & Score Pass" to save and replay it here.
            </div>
          ) : (
            combinedSessions.map((rec) => (
              <div
                key={rec.id}
                className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-xs font-mono text-amber-400">
                    {rec.settings.process} · {rec.settings.electrode} · {rec.settings.position} ·{' '}
                    {new Date(rec.completedAt).toLocaleString()}
                  </p>
                  <h3 className="text-base font-bold text-white">{rec.exerciseTitle}</h3>
                  <p className="text-xs font-mono text-slate-400">
                    Score: <strong className="text-white">{rec.report.overallScore}%</strong> ·{' '}
                    Heat Input: {rec.report.avgHeatInputKjPerIn} kJ/in · Length: {rec.report.weldLengthInches} in
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadHistoryReplay(rec)}
                  className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Load & Replay in 3D
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
