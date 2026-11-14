import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RIGGING_LOADS,
  RIGGING_SCENARIOS,
  RIGGING_SHACKLES,
  RIGGING_SLINGS,
} from '../data/riggingScenarios.ts';
import {
  calculateRiggingStatics,
  createInitialSimState,
  evaluateRiggingAttempt,
  ftToM,
  issueCraneCommand,
  lbToKg,
  stepRiggingSimulation,
} from './riggingPhysics.ts';

function getFixtures() {
  const symBeam = RIGGING_LOADS.find((l) => l.id === 'load-sym-beam')!;
  const offsetLoad = RIGGING_LOADS.find((l) => l.id === 'load-offset-assembly')!;
  const frameLoad = RIGGING_LOADS.find((l) => l.id === 'load-structural-frame')!;
  const sling58 = RIGGING_SLINGS.find((s) => s.id === 'wr-five-eighths-12')!;
  const slingHalf = RIGGING_SLINGS.find((s) => s.id === 'wr-half-10')!;
  const slingDamaged = RIGGING_SLINGS.find((s) => s.id === 'wr-damaged-frayed')!;
  const shackleBolt = RIGGING_SHACKLES.find((s) => s.id === 'shackle-bolt-3-4')!;
  const shackleSmall = RIGGING_SHACKLES.find((s) => s.id === 'shackle-screw-1-2')!;
  return { symBeam, offsetLoad, frameLoad, sling58, slingHalf, slingDamaged, shackleBolt, shackleSmall };
}

test('symmetric 2-leg sling angle & tension matches T = W / (2 sin theta)', () => {
  const { symBeam, sling58, shackleBolt } = getFixtures();
  // L-mid (-6 ft) and R-mid (+6 ft) => half-span = 6 ft, sling length = 12 ft => cos(theta)=0.5 => theta=60 deg
  const config = {
    loadId: symBeam.id,
    slingId: sling58.id,
    shackleId: shackleBolt.id,
    hitchType: 'vertical' as const,
    legCount: 2 as const,
    leftPointId: 'L-mid',
    rightPointId: 'R-mid',
    leftLengthFt: 12,
    rightLengthFt: 12,
    hookOffsetXFt: 0,
    hookOffsetZFt: 0,
    useSpreaderBeam: false,
    useEdgeSofteners: true,
    shacklePinTightened: true,
    inspectedHardware: true,
    tagLineAttached: true,
  };

  const res = calculateRiggingStatics(symBeam, config, sling58, shackleBolt);
  assert.equal(res.valid, true);
  assert.ok(Math.abs(res.leftLeg.horizontalAngleDeg - 60) < 0.3, `Expected 60 deg, got ${res.leftLeg.horizontalAngleDeg}`);
  assert.ok(Math.abs(res.rightLeg.horizontalAngleDeg - 60) < 0.3);
  const expectedTension = symBeam.weightLb / (2 * Math.sin((60 * Math.PI) / 180));
  assert.ok(Math.abs(res.leftLeg.tensionLb - expectedTension) < 25, `Expected ~${expectedTension}, got ${res.leftLeg.tensionLb}`);
  assert.equal(res.predictedStaticTiltDeg, 0);
});

test('asymmetric CG offset creates unequal leg loading and predictable load tilt', () => {
  const { offsetLoad, sling58, shackleBolt } = getFixtures();
  // Symmetric +/-6 ft lugs on load with CG = -2.2 ft
  const config = {
    loadId: offsetLoad.id,
    slingId: sling58.id,
    shackleId: shackleBolt.id,
    hitchType: 'vertical' as const,
    legCount: 2 as const,
    leftPointId: 'L-mid',
    rightPointId: 'R-mid',
    leftLengthFt: 10,
    rightLengthFt: 10,
    hookOffsetXFt: 0,
    hookOffsetZFt: 0,
    useSpreaderBeam: false,
    useEdgeSofteners: true,
    shacklePinTightened: true,
    inspectedHardware: true,
    tagLineAttached: true,
  };

  const res = calculateRiggingStatics(offsetLoad, config, sling58, shackleBolt);
  assert.equal(res.valid, true);
  // Left CG (-2.2 ft) -> left side heavier -> left leg carries >60% and tilt angle is positive (left dips down)
  assert.ok(res.leftLeg.tensionLb > res.rightLeg.tensionLb);
  assert.ok(res.predictedVerticalShareLeftPct > 60);
  assert.ok(Math.abs(res.predictedStaticTiltDeg) > 10);
});

test('indeterminate 4-leg rigid load warns and never divides tension blindly by 4', () => {
  const { frameLoad, slingHalf, shackleBolt } = getFixtures();
  const config = {
    loadId: frameLoad.id,
    slingId: slingHalf.id,
    shackleId: shackleBolt.id,
    hitchType: 'vertical' as const,
    legCount: 4 as const,
    leftPointId: 'L-corner',
    rightPointId: 'R-corner',
    leftLengthFt: 12,
    rightLengthFt: 12,
    hookOffsetXFt: 0,
    hookOffsetZFt: 0,
    useSpreaderBeam: false,
    useEdgeSofteners: true,
    shacklePinTightened: true,
    inspectedHardware: true,
    tagLineAttached: true,
  };
  const res = calculateRiggingStatics(frameLoad, config, slingHalf, shackleBolt);
  assert.equal(res.indeterminateWarning, true);
  assert.equal(res.effectiveLoadBearingLegs, 2);
  // Tension per active leg must be >= W / (2 * sin theta), NOT W / 4!
  assert.ok(res.leftLeg.tensionLb > frameLoad.weightLb / 2);
});

test('equipment rating & safety checks flag damaged sling, choker derate, and shallow angle', () => {
  const { symBeam, slingDamaged, slingHalf, shackleSmall } = getFixtures();
  const badDamaged = calculateRiggingStatics(
    symBeam,
    {
      loadId: symBeam.id,
      slingId: slingDamaged.id,
      shackleId: shackleSmall.id,
      hitchType: 'choker',
      legCount: 2,
      leftPointId: 'L-outer',
      rightPointId: 'R-outer',
      leftLengthFt: 9.2,
      rightLengthFt: 9.2,
      hookOffsetXFt: 0,
      hookOffsetZFt: 0,
      useSpreaderBeam: false,
      useEdgeSofteners: false,
      shacklePinTightened: false,
      inspectedHardware: false,
      tagLineAttached: false,
    },
    slingDamaged,
    shackleSmall
  );
  assert.equal(badDamaged.willFailOnLift, true);
  assert.ok(badDamaged.warnings.some((w) => w.code === 'DAMAGED_SLING'));
  assert.ok(badDamaged.warnings.some((w) => w.code === 'UNSECURED_SHACKLE'));
  assert.ok(badDamaged.warnings.some((w) => w.code === 'SHARP_EDGE_UNPROTECTED'));
  assert.ok(badDamaged.minHorizontalAngleDeg < 35);
  // Choker WLL of 1/2" wire rope is 3750 lb
  assert.equal(slingHalf.chokerWllLb, 3750);
});

test('physics simulation is 100% deterministic, supports Emergency Stop, and reproduces failures identically', () => {
  const scen9 = RIGGING_SCENARIOS.find((s) => s.id === 'scen-09-angle-challenge')!;
  const load = RIGGING_LOADS.find((l) => l.id === scen9.initialConfig.loadId)!;
  const sling = RIGGING_SLINGS.find((s) => s.id === scen9.initialConfig.slingId)!;
  const shackle = RIGGING_SHACKLES.find((sh) => sh.id === scen9.initialConfig.shackleId)!;
  const statics = calculateRiggingStatics(load, scen9.initialConfig, sling, shackle);

  const runSequence = () => {
    let sim = createInitialSimState(load, scen9.initialConfig, statics, scen9.targetZoneXFt, scen9.targetZoneZFt);
    sim = issueCraneCommand(sim, 'hoist', load, scen9.initialConfig, statics, scen9.targetZoneXFt, scen9.targetZoneZFt);
    for (let i = 0; i < 140; i++) {
      sim = stepRiggingSimulation(sim, 1 / 60, load, scen9.initialConfig, statics, sling, shackle, {
        environment: 'indoor-shop',
      });
    }
    return sim;
  };

  const run1 = runSequence();
  const run2 = runSequence();

  assert.equal(run1.failed, true);
  assert.equal(run1.failureCause, 'sling-overload-angle');
  assert.equal(run1.failureCause, run2.failureCause);
  assert.equal(run1.frames.length, run2.frames.length);
  assert.equal(run1.failureAnalysis?.timeOfFailureSec, run2.failureAnalysis?.timeOfFailureSec);

  // Test Emergency Stop override on valid Scenario 1
  const scen1 = RIGGING_SCENARIOS[0];
  const l1 = RIGGING_LOADS.find((l) => l.id === scen1.initialConfig.loadId)!;
  const s1 = RIGGING_SLINGS.find((s) => s.id === scen1.initialConfig.slingId)!;
  const sh1 = RIGGING_SHACKLES.find((sh) => sh.id === scen1.initialConfig.shackleId)!;
  const fixedCfg = { ...scen1.initialConfig, leftPointId: 'L-mid', rightPointId: 'R-mid', leftLengthFt: 12, rightLengthFt: 12, inspectedHardware: true };
  const st1 = calculateRiggingStatics(l1, fixedCfg, s1, sh1);
  let validSim = createInitialSimState(l1, fixedCfg, st1, scen1.targetZoneXFt, scen1.targetZoneZFt);
  validSim = issueCraneCommand(validSim, 'hoist', l1, fixedCfg, st1, scen1.targetZoneXFt, scen1.targetZoneZFt);
  for (let i = 0; i < 90; i++) {
    validSim = stepRiggingSimulation(validSim, 1 / 60, l1, fixedCfg, st1, s1, sh1, { environment: 'indoor-shop' });
  }
  const heightBeforeEstop = validSim.hookYFt;
  validSim = issueCraneCommand(validSim, 'emergency-stop', l1, fixedCfg, st1, scen1.targetZoneXFt, scen1.targetZoneZFt);
  assert.equal(validSim.phase, 'emergency-stopped');
  assert.equal(validSim.emergencyStopLatched, true);
  for (let i = 0; i < 30; i++) {
    validSim = stepRiggingSimulation(validSim, 1 / 60, l1, fixedCfg, st1, s1, sh1, { environment: 'indoor-shop' });
  }
  assert.equal(validSim.hookYFt, heightBeforeEstop);
});

test('full pick-and-place crane workflow passes scenario assessment rubric and unit helpers convert cleanly', () => {
  const scen1 = RIGGING_SCENARIOS[0];
  const load = RIGGING_LOADS.find((l) => l.id === scen1.initialConfig.loadId)!;
  const sling = RIGGING_SLINGS.find((s) => s.id === scen1.initialConfig.slingId)!;
  const shackle = RIGGING_SHACKLES.find((sh) => sh.id === scen1.initialConfig.shackleId)!;
  const goodCfg = {
    ...scen1.initialConfig,
    leftPointId: 'L-mid',
    rightPointId: 'R-mid',
    leftLengthFt: 12,
    rightLengthFt: 12,
    inspectedHardware: true,
  };
  const statics = calculateRiggingStatics(load, goodCfg, sling, shackle);
  let sim = createInitialSimState(load, goodCfg, statics, scen1.targetZoneXFt, scen1.targetZoneZFt);

  // 1. Test Lift holds automatically near 0.55 ft above deck
  sim = issueCraneCommand(sim, 'test-lift', load, goodCfg, statics, scen1.targetZoneXFt, scen1.targetZoneZFt);
  for (let i = 0; i < 160; i++) {
    sim = stepRiggingSimulation(sim, 1 / 60, load, goodCfg, statics, sling, shackle, { environment: 'indoor-shop' });
  }
  assert.equal(sim.phase, 'test-lift-hold');

  // 2. Hoist clear, Bridge Right to +9 ft, Lower onto target pad
  sim = issueCraneCommand(sim, 'hoist', load, goodCfg, statics, scen1.targetZoneXFt, scen1.targetZoneZFt);
  for (let i = 0; i < 90; i++) {
    sim = stepRiggingSimulation(sim, 1 / 60, load, goodCfg, statics, sling, shackle, { environment: 'indoor-shop' });
  }
  sim = issueCraneCommand(sim, 'bridge-right', load, goodCfg, statics, scen1.targetZoneXFt, scen1.targetZoneZFt);
  for (let i = 0; i < 170; i++) {
    sim = stepRiggingSimulation(sim, 1 / 60, load, goodCfg, statics, sling, shackle, { environment: 'indoor-shop' });
  }
  sim = issueCraneCommand(sim, 'lower', load, goodCfg, statics, scen1.targetZoneXFt, scen1.targetZoneZFt);
  for (let i = 0; i < 200; i++) {
    sim = stepRiggingSimulation(sim, 1 / 60, load, goodCfg, statics, sling, shackle, { environment: 'indoor-shop' });
  }
  assert.equal(sim.landedInTarget, true);

  const evalRecord = evaluateRiggingAttempt(sim, statics, scen1, 'assessment', goodCfg, false);
  assert.equal(evalRecord.passed, true);
  assert.equal(evalRecord.scorePct, 100);

  // Metric conversion sanity
  assert.ok(Math.abs(lbToKg(1000) - 453.592) < 0.01);
  assert.ok(Math.abs(ftToM(10) - 3.048) < 0.001);
});

test('signal-controlled crane stops safely on communication timeout', () => {
  const scen10 = RIGGING_SCENARIOS.find((s) => s.id === 'scen-10-hand-signals-lift')!;
  const load = RIGGING_LOADS.find((l) => l.id === scen10.initialConfig.loadId)!;
  const sling = RIGGING_SLINGS.find((s) => s.id === scen10.initialConfig.slingId)!;
  const shackle = RIGGING_SHACKLES.find((sh) => sh.id === scen10.initialConfig.shackleId)!;
  const statics = calculateRiggingStatics(load, scen10.initialConfig, sling, shackle);

  let sim = createInitialSimState(load, scen10.initialConfig, statics, scen10.targetZoneXFt, scen10.targetZoneZFt);
  sim = issueCraneCommand(sim, 'hoist', load, scen10.initialConfig, statics, scen10.targetZoneXFt, scen10.targetZoneZFt);
  for (let i = 0; i < 260; i++) {
    // 4.33 seconds without refreshing signal
    sim = stepRiggingSimulation(sim, 1 / 60, load, scen10.initialConfig, statics, sling, shackle, {
      environment: 'indoor-shop',
      requiresSignalControl: true,
    });
  }
  assert.equal(sim.signalCommsLost, true);
  assert.equal(sim.activeCommand, 'stop');
});
