import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeEffectiveAmperage,
  computeInstantWeldPhysics,
  evaluateWeldSession,
  getDefaultMachineSettings,
  WELDING_EXERCISES,
} from './weldingPhysics.ts';
import { MachineSettings, WeldSamplePoint } from '../types/academy.ts';

test('computeInstantWeldPhysics calculates exact heat input formula (V * A * 60) / (S * 1000)', () => {
  const settings: MachineSettings = {
    ...getDefaultMachineSettings(WELDING_EXERCISES[0]),
    process: 'FCAW-G',
    electrode: 'E71T-1',
    polarity: 'DCEP',
    voltage: 25.0,
    wireFeedSpeedIpm: 300, // 300 * 0.68 + (25-20)*3 = 204 + 15 = 219 A
    electrodeDiameterIn: 0.045,
    gasFlowCfh: 35,
  };
  const effectiveA = computeEffectiveAmperage(settings);
  assert.equal(effectiveA, 219);

  const metrics = computeInstantWeldPhysics(settings, {
    arcLengthMm: 2.8,
    travelAngleDeg: 15,
    workAngleDeg: 45,
    travelSpeedIpm: 10,
    lateralOffsetMm: 0,
    electrodeRemainingPct: 100,
  });

  // arcVoltageLive at arcLength 2.8 is exact 25.0 V
  const expectedHi = Number(((25.0 * 219 * 60) / (10 * 1000)).toFixed(2));
  assert.equal(metrics.heatInputKjPerIn, expectedHi);
  assert.equal(metrics.defects.porosity, false);
});

test('FCAW-G with low shielding gas triggers porosity defect and stability penalty', () => {
  const settings: MachineSettings = {
    ...getDefaultMachineSettings(WELDING_EXERCISES[5]),
    process: 'FCAW-G',
    electrode: 'E71T-1',
    polarity: 'DCEP',
    gasFlowCfh: 5, // Starved gas!
  };

  const metrics = computeInstantWeldPhysics(settings, {
    arcLengthMm: 2.6,
    travelAngleDeg: 15,
    workAngleDeg: 45,
    travelSpeedIpm: 10,
    lateralOffsetMm: 0,
    electrodeRemainingPct: 100,
  });

  assert.equal(metrics.defects.porosity, true);
  assert.ok(metrics.warnings.some((w) => w.toLowerCase().includes('gas')));
});

test('E7018 vertical-down warns against code violation and flags incomplete fusion risk', () => {
  const settings: MachineSettings = {
    ...getDefaultMachineSettings(WELDING_EXERCISES[0]),
    electrode: 'E7018',
    position: '3F-DOWN',
    polarity: 'DCEP',
  };

  const metrics = computeInstantWeldPhysics(settings, {
    arcLengthMm: 2.0,
    travelAngleDeg: 14,
    workAngleDeg: 45,
    travelSpeedIpm: 6.5,
    lateralOffsetMm: 0,
    electrodeRemainingPct: 90,
  });

  assert.equal(metrics.defects.incompleteFusion, true);
  assert.ok(metrics.warnings.some((w) => w.toLowerCase().includes('vertical-down')));
});

test('High amperage + long arc + fast travel produces undercut and evaluates lower report score', () => {
  const settings: MachineSettings = {
    ...getDefaultMachineSettings(WELDING_EXERCISES[0]),
    amperage: 185, // Too hot for 1/8 E7018
  };

  const badInstant = computeInstantWeldPhysics(settings, {
    arcLengthMm: 5.5,
    travelAngleDeg: 15,
    workAngleDeg: 45,
    travelSpeedIpm: 11,
    lateralOffsetMm: 0,
    electrodeRemainingPct: 80,
  });

  assert.equal(badInstant.defects.undercut, true);
  assert.equal(badInstant.defects.porosity, true);

  const sample: WeldSamplePoint = {
    tMs: 1000,
    progress: 0.8,
    lateralOffsetMm: 0,
    arcLengthMm: 5.5,
    travelAngleDeg: 15,
    workAngleDeg: 45,
    travelSpeedIpm: 11,
    arcStability: badInstant.arcStability,
    heatInputKjPerIn: badInstant.heatInputKjPerIn,
    beadWidthMm: badInstant.beadWidthMm,
    reinforcementMm: badInstant.reinforcementMm,
    penetrationMm: badInstant.penetrationMm,
    fusionScore: badInstant.fusionIndex,
    defects: badInstant.defects,
  };

  const report = evaluateWeldSession(settings, [sample], WELDING_EXERCISES[0]);
  assert.ok(report.overallScore < 75);
  assert.ok(report.simulationDisclaimer.toLowerCase().includes('simulated'));
});
