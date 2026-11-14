import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateBendAllowance,
  calculateCentreOfGravity,
  calculateMechanicalAdvantage,
  calculatePipeWeight,
  calculatePlateWeight,
  calculateRightTriangle,
  calculateSlingTension,
  calculateThermalExpansion,
  convertUnits,
} from './calculations.ts';

test('calculateSlingTension: 2-leg 10,000 lb load at 30 degrees yields 10,000 lb per leg and warning at <45 deg', () => {
  const res = calculateSlingTension({
    loadWeight: 10000,
    numLegs: 2,
    horizontalAngleDeg: 30,
    unit: 'imperial',
  });
  assert.equal(res.valid, true);
  assert.equal(res.primaryValue, '10,000 lb');
  assert.ok(res.warnings.length >= 1);
});

test('calculateSlingTension: rejects angle below 0 or above 90', () => {
  const res = calculateSlingTension({
    loadWeight: 5000,
    numLegs: 2,
    horizontalAngleDeg: 0,
    unit: 'imperial',
  });
  assert.equal(res.valid, false);
});

test('calculateSlingTension: 4-leg rigid load defaults to 2 effective legs and critical warning <30 deg', () => {
  const res = calculateSlingTension({
    loadWeight: 8000,
    numLegs: 4,
    horizontalAngleDeg: 25,
    unit: 'imperial',
  });
  assert.equal(res.valid, true);
  assert.ok(res.warnings.some((w) => w.includes('CRITICAL HAZARD')));
});

test('calculatePlateWeight: carbon steel 48x96x0.5 in matches ~653 lb', () => {
  const res = calculatePlateWeight({
    length: 96,
    width: 48,
    thickness: 0.5,
    material: 'carbon_steel',
    unit: 'imperial',
  });
  assert.equal(res.valid, true);
  // 96 * 48 * 0.5 * 0.2836 = 653.4144 -> 653.4 lb
  assert.equal(res.primaryValue, '653.4 lb');
});

test('calculateCentreOfGravity: asymmetric pick points sum to total weight', () => {
  const res = calculateCentreOfGravity({
    totalWeight: 12000,
    distFromLeftToCG: 4,
    distFromRightToCG: 8,
    unit: 'imperial',
  });
  assert.equal(res.valid, true);
  assert.equal(res.primaryValue, '8,000 lb');
});

test('calculatePipeWeight: validates impossible wall thickness >= OD/2', () => {
  const bad = calculatePipeWeight({
    od: 4,
    wallThickness: 2.1,
    length: 20,
    unit: 'imperial',
  });
  assert.equal(bad.valid, false);
});

test('calculateMechanicalAdvantage: 4 parts of line with 4 sheaves @ 5% friction', () => {
  const res = calculateMechanicalAdvantage({
    loadWeight: 10000,
    partsOfLine: 4,
    numSheaves: 4,
    frictionPerSheavePct: 5,
    unit: 'imperial',
  });
  assert.equal(res.valid, true);
  // (10000/4) * (1 + 0.05*4) = 2500 * 1.2 = 3000 lb
  assert.equal(res.primaryValue, '3,000 lb');
});

test('calculateRightTriangle: 3-4-5 triangle computes 5 travel', () => {
  const res = calculateRightTriangle({ run: 3, rise: 4, unit: 'imperial' });
  assert.equal(res.valid, true);
  assert.equal(res.primaryValue, '5 in');
});

test('calculateThermalExpansion & convertUnits & calculateBendAllowance', () => {
  const exp = calculateThermalExpansion({
    length: 100,
    deltaTemp: 200,
    material: 'carbon_steel',
    unit: 'imperial',
  });
  assert.equal(exp.valid, true);
  // 100*12 * 6.5e-6 * 200 = 1.56 in
  assert.equal(exp.primaryValue, '+1.56 in');

  const conv = convertUnits({ value: 10, conversionType: 'in_to_mm' });
  assert.equal(conv.primaryValue, '254 mm');

  const ba = calculateBendAllowance({
    insideBendRadius: 0.5,
    thickness: 0.25,
    bendAngleDeg: 90,
    kFactor: 0.4,
    unit: 'imperial',
  });
  assert.equal(ba.valid, true);
});
