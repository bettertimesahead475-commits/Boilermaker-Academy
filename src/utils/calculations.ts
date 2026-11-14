export type UnitSystem = 'imperial' | 'metric';

export interface CalculationResult {
  valid: boolean;
  error?: string;
  warnings: string[];
  primaryLabel: string;
  primaryValue: string;
  secondaryMetrics: { label: string; value: string }[];
  formula: string;
  assumptions: string[];
  steps: string[];
  safetyNotice: string;
}

const RIGGING_SAFETY_NOTICE =
  'Educational calculation only. Actual lifts must follow manufacturer load charts, ASME B30 / CSA / Ontario OHSA Reg. 213/91 requirements, engineered lift plans where required, and competent rigging supervision.';

const FABRICATION_SAFETY_NOTICE =
  'Educational estimate only. Verify exact material mill test reports (MTRs), corrosion allowances, and applicable ASME / CSA code requirements before cutting or welding.';

function round(val: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

function fmt(val: number, decimals = 2): string {
  return round(val, decimals).toLocaleString('en-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

// 1. Sling Tension Calculator
export function calculateSlingTension(params: {
  loadWeight: number;
  numLegs: 1 | 2 | 3 | 4;
  horizontalAngleDeg: number;
  unit: UnitSystem;
  effectiveLegs?: number; // For 4-leg rigid load often treated as 2 or 3 load-bearing legs
}): CalculationResult {
  const { loadWeight, numLegs, horizontalAngleDeg, unit } = params;
  const forceUnit = unit === 'imperial' ? 'lb' : 'kg';
  const warnings: string[] = [];

  if (!Number.isFinite(loadWeight) || loadWeight <= 0) {
    return {
      valid: false,
      error: 'Load weight must be greater than zero.',
      warnings,
      primaryLabel: 'Tension per Sling Leg',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'T = (W / n_eff) / sin(θ)',
      assumptions: [],
      steps: [],
      safetyNotice: RIGGING_SAFETY_NOTICE,
    };
  }
  if (!Number.isFinite(horizontalAngleDeg) || horizontalAngleDeg <= 0 || horizontalAngleDeg > 90) {
    return {
      valid: false,
      error: 'Horizontal sling angle must be strictly between 0° and 90°.',
      warnings,
      primaryLabel: 'Tension per Sling Leg',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'T = (W / n_eff) / sin(θ)',
      assumptions: [],
      steps: [],
      safetyNotice: RIGGING_SAFETY_NOTICE,
    };
  }

  // Standard rigging rule: on a rigid 3- or 4-leg bridle without equalizer/turnbuckles, assume only 2 legs carry the full load unless engineered otherwise.
  const defaultEff = numLegs >= 3 ? 2 : numLegs;
  const effLegs = params.effectiveLegs && params.effectiveLegs >= 1 && params.effectiveLegs <= numLegs
    ? params.effectiveLegs
    : defaultEff;

  if (numLegs >= 3 && effLegs > 2) {
    warnings.push(
      `Assuming ${effLegs} load-bearing legs on a rigid load can overload two opposite legs if sling lengths or pick points vary slightly. Standard practice treats 3- and 4-leg rigid bridles as 2 effective load-bearing legs.`
    );
  }
  if (horizontalAngleDeg < 30) {
    warnings.push(
      `CRITICAL HAZARD: Sling angle ${horizontalAngleDeg}° is below 30° horizontal. Tension exceeds 200% of vertical share and creates severe crushing/lateral forces. Do not rig below 30° without an engineered lift plan and spreader bar.`
    );
  } else if (horizontalAngleDeg < 45) {
    warnings.push(
      `Caution: Sling angle ${horizontalAngleDeg}° is below the recommended 45°–60° shop minimum. Consider longer slings or a spreader beam.`
    );
  }

  const rad = (horizontalAngleDeg * Math.PI) / 180;
  const sinTheta = Math.sin(rad);
  const loadAngleFactor = 1 / sinTheta;
  const verticalShare = loadWeight / effLegs;
  const tensionPerLeg = verticalShare * loadAngleFactor;
  const horizontalForcePerLeg = tensionPerLeg * Math.cos(rad);
  const totalSlingStressPct = (tensionPerLeg / loadWeight) * 100;

  return {
    valid: true,
    warnings,
    primaryLabel: 'Tension per Effective Sling Leg',
    primaryValue: `${fmt(tensionPerLeg)} ${forceUnit}`,
    secondaryMetrics: [
      { label: 'Load Angle Factor (1 / sin θ)', value: `${fmt(loadAngleFactor, 3)}×` },
      { label: 'Vertical Share per Leg', value: `${fmt(verticalShare)} ${forceUnit}` },
      { label: 'Horizontal Compression Force', value: `${fmt(horizontalForcePerLeg)} ${forceUnit}` },
      { label: 'Effective Load-Bearing Legs', value: `${effLegs} of ${numLegs}` },
      { label: 'Single-Leg % of Total Load', value: `${fmt(totalSlingStressPct, 1)}%` },
    ],
    formula: 'T = (W / n_eff) × (1 / sin(θ))',
    assumptions: [
      'Symmetrical bridle with centre of gravity centred between pick points.',
      `Effective legs = ${effLegs} (rigid-load rigging convention for ${numLegs}-leg hitches).`,
      'Static load; dynamic shock loading and wind loads are excluded.',
    ],
    steps: [
      `1. Determine vertical share per effective leg: ${fmt(loadWeight)} ${forceUnit} ÷ ${effLegs} = ${fmt(verticalShare)} ${forceUnit}`,
      `2. Compute Load Angle Factor (LAF): 1 ÷ sin(${horizontalAngleDeg}°) = 1 ÷ ${fmt(sinTheta, 4)} = ${fmt(loadAngleFactor, 3)}`,
      `3. Multiply vertical share by LAF: ${fmt(verticalShare)} × ${fmt(loadAngleFactor, 3)} = ${fmt(tensionPerLeg)} ${forceUnit}`,
      `4. Check horizontal inward force on attachment: ${fmt(tensionPerLeg)} × cos(${horizontalAngleDeg}°) = ${fmt(horizontalForcePerLeg)} ${forceUnit}`,
    ],
    safetyNotice: RIGGING_SAFETY_NOTICE,
  };
}

// 2. Load Weight Estimator (composite volume & material density)
export function calculateLoadWeight(params: {
  volumeValue: number; // cu ft or m3
  material: 'carbon_steel' | 'stainless_steel' | 'aluminum' | 'cast_iron' | 'water';
  unit: UnitSystem;
}): CalculationResult {
  const { volumeValue, material, unit } = params;
  const warnings: string[] = [];
  if (!Number.isFinite(volumeValue) || volumeValue <= 0) {
    return {
      valid: false,
      error: 'Volume must be greater than zero.',
      warnings,
      primaryLabel: 'Estimated Load Weight',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'W = V × ρ',
      assumptions: [],
      steps: [],
      safetyNotice: RIGGING_SAFETY_NOTICE,
    };
  }

  const densities: Record<
    typeof material,
    { label: string; imperialLbPerCuFt: number; metricKgPerM3: number }
  > = {
    carbon_steel: { label: 'Carbon Steel (A36 / SA-516)', imperialLbPerCuFt: 490, metricKgPerM3: 7850 },
    stainless_steel: { label: 'Austenitic Stainless (304/316)', imperialLbPerCuFt: 501, metricKgPerM3: 8030 },
    aluminum: { label: 'Aluminum Alloy', imperialLbPerCuFt: 169, metricKgPerM3: 2700 },
    cast_iron: { label: 'Grey Cast Iron', imperialLbPerCuFt: 450, metricKgPerM3: 7200 },
    water: { label: 'Fresh Water (Hydrotest)', imperialLbPerCuFt: 62.4, metricKgPerM3: 1000 },
  };

  const mat = densities[material];
  const density = unit === 'imperial' ? mat.imperialLbPerCuFt : mat.metricKgPerM3;
  const totalWeight = volumeValue * density;
  const shortTons = unit === 'imperial' ? totalWeight / 2000 : totalWeight / 907.185;
  const metricTonnes = unit === 'imperial' ? totalWeight * 0.000453592 : totalWeight / 1000;
  const unitLabel = unit === 'imperial' ? 'lb' : 'kg';
  const volUnit = unit === 'imperial' ? 'ft³' : 'm³';
  const densUnit = unit === 'imperial' ? 'lb/ft³' : 'kg/m³';

  return {
    valid: true,
    warnings,
    primaryLabel: 'Estimated Load Weight',
    primaryValue: `${fmt(totalWeight)} ${unitLabel}`,
    secondaryMetrics: [
      { label: 'Material', value: mat.label },
      { label: 'Density Used', value: `${fmt(density, 1)} ${densUnit}` },
      { label: 'Short Tons (2,000 lb)', value: `${fmt(shortTons, 2)} tons` },
      { label: 'Metric Tonnes (1,000 kg)', value: `${fmt(metricTonnes, 2)} t` },
    ],
    formula: 'W = Volume × Material Density',
    assumptions: [
      'Solid uniform cross-section without internal voids or weld overlay allowance.',
      'Add rigging hardware weight (shackles, spreader bar, headache ball, hook block) separately when sizing crane capacity.',
    ],
    steps: [
      `1. Identify density of ${mat.label}: ${fmt(density, 1)} ${densUnit}`,
      `2. Multiply volume by density: ${fmt(volumeValue, 3)} ${volUnit} × ${fmt(density, 1)} = ${fmt(totalWeight)} ${unitLabel}`,
      `3. Convert to tons/tonnes: ${fmt(shortTons, 2)} short tons (${fmt(metricTonnes, 2)} metric tonnes)`,
    ],
    safetyNotice: RIGGING_SAFETY_NOTICE,
  };
}

// 3. Centre of Gravity & Unequal Load Distribution
export function calculateCentreOfGravity(params: {
  totalWeight: number;
  distFromLeftToCG: number; // d1
  distFromRightToCG: number; // d2
  unit: UnitSystem;
}): CalculationResult {
  const { totalWeight, distFromLeftToCG, distFromRightToCG, unit } = params;
  const forceUnit = unit === 'imperial' ? 'lb' : 'kg';
  const lenUnit = unit === 'imperial' ? 'ft' : 'm';
  const warnings: string[] = [];

  if (totalWeight <= 0 || distFromLeftToCG <= 0 || distFromRightToCG <= 0) {
    return {
      valid: false,
      error: 'Total weight and both horizontal distances to the CG must be greater than zero.',
      warnings,
      primaryLabel: 'Heavier Pick Point Load',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'L1 = W × d2 / (d1 + d2)',
      assumptions: [],
      steps: [],
      safetyNotice: RIGGING_SAFETY_NOTICE,
    };
  }

  const totalSpan = distFromLeftToCG + distFromRightToCG;
  const leftPickLoad = (totalWeight * distFromRightToCG) / totalSpan;
  const rightPickLoad = (totalWeight * distFromLeftToCG) / totalSpan;
  const heavierSide = leftPickLoad >= rightPickLoad ? 'Left Pick Point' : 'Right Pick Point';
  const heavierLoad = Math.max(leftPickLoad, rightPickLoad);
  const ratio = Math.max(leftPickLoad, rightPickLoad) / Math.min(leftPickLoad, rightPickLoad);

  if (ratio > 2) {
    warnings.push(
      `Significant CG offset: ${heavierSide} carries ${fmt((heavierLoad / totalWeight) * 100, 1)}% of the load. Adjust sling lengths or use a chain fall/equalizer beam so the hook stays directly above the CG.`
    );
  }

  return {
    valid: true,
    warnings,
    primaryLabel: `Heavier Point (${heavierSide})`,
    primaryValue: `${fmt(heavierLoad)} ${forceUnit}`,
    secondaryMetrics: [
      { label: 'Left Pick Point Vertical Load (L1)', value: `${fmt(leftPickLoad)} ${forceUnit}` },
      { label: 'Right Pick Point Vertical Load (L2)', value: `${fmt(rightPickLoad)} ${forceUnit}` },
      { label: 'Total Span (D = d1 + d2)', value: `${fmt(totalSpan)} ${lenUnit}` },
      { label: 'Left / Right Share %', value: `${fmt((leftPickLoad / totalWeight) * 100, 1)}% / ${fmt((rightPickLoad / totalWeight) * 100, 1)}%` },
    ],
    formula: 'L₁ = (W × d₂) / D   and   L₂ = (W × d₁) / D',
    assumptions: [
      'Pick points are at the same elevation and crane hook is positioned vertically over the CG.',
      'Static equilibrium (ΣM = 0 and ΣFy = 0).',
    ],
    steps: [
      `1. Total span between pick points: D = ${fmt(distFromLeftToCG)} + ${fmt(distFromRightToCG)} = ${fmt(totalSpan)} ${lenUnit}`,
      `2. Left pick load (uses opposite distance d₂): L₁ = (${fmt(totalWeight)} × ${fmt(distFromRightToCG)}) ÷ ${fmt(totalSpan)} = ${fmt(leftPickLoad)} ${forceUnit}`,
      `3. Right pick load (uses opposite distance d₁): L₂ = (${fmt(totalWeight)} × ${fmt(distFromLeftToCG)}) ÷ ${fmt(totalSpan)} = ${fmt(rightPickLoad)} ${forceUnit}`,
      `4. Verify sum: ${fmt(leftPickLoad)} + ${fmt(rightPickLoad)} = ${fmt(leftPickLoad + rightPickLoad)} ${forceUnit}`,
    ],
    safetyNotice: RIGGING_SAFETY_NOTICE,
  };
}

// 4. Mechanical Advantage & Block-and-Tackle
export function calculateMechanicalAdvantage(params: {
  loadWeight: number;
  partsOfLine: number;
  numSheaves: number;
  frictionPerSheavePct: number;
  unit: UnitSystem;
}): CalculationResult {
  const { loadWeight, partsOfLine, numSheaves, frictionPerSheavePct, unit } = params;
  const forceUnit = unit === 'imperial' ? 'lb' : 'kg';
  const warnings: string[] = [];

  if (loadWeight <= 0 || partsOfLine < 1 || numSheaves < 0 || frictionPerSheavePct < 0 || frictionPerSheavePct > 25) {
    return {
      valid: false,
      error: 'Enter valid positive load, parts of line (≥ 1), sheaves (≥ 0), and friction (0–25% per sheave).',
      warnings,
      primaryLabel: 'Lead Line Pull Required',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'P = W / MA_effective',
      assumptions: [],
      steps: [],
      safetyNotice: RIGGING_SAFETY_NOTICE,
    };
  }

  const frictionDecimal = frictionPerSheavePct / 100;
  // Standard trade approximation: Line Pull = (W / parts) * (1 + friction)^numSheaves, or W * (1 + f*N) / parts
  // Using compound sheave friction: Ideal Pull * (1 + f)^sheaves, or standard Ontario/Rigging manual additive: (W + W * f * sheaves) / parts
  const additiveFactor = 1 + frictionDecimal * numSheaves;
  const leadLinePull = (loadWeight / partsOfLine) * additiveFactor;
  const idealPull = loadWeight / partsOfLine;
  const effectiveMA = loadWeight / leadLinePull;
  const efficiencyPct = (effectiveMA / partsOfLine) * 100;

  if (partsOfLine > 12) {
    warnings.push('High parts of line (>12) significantly reduce efficiency due to cumulative sheave friction.');
  }

  return {
    valid: true,
    warnings,
    primaryLabel: 'Estimated Lead Line Pull',
    primaryValue: `${fmt(leadLinePull)} ${forceUnit}`,
    secondaryMetrics: [
      { label: 'Theoretical MA (Parts of Line)', value: `${partsOfLine}:1` },
      { label: 'Effective Mechanical Advantage', value: `${fmt(effectiveMA, 2)}:1` },
      { label: 'Ideal Frictionless Line Pull', value: `${fmt(idealPull)} ${forceUnit}` },
      { label: 'System Efficiency', value: `${fmt(efficiencyPct, 1)}%` },
    ],
    formula: 'Lead Pull = (W / Parts) × (1 + f × Sheaves)',
    assumptions: [
      `Using standard rigging handbook additive sheave friction allowance of ${frictionPerSheavePct}% per sheave across ${numSheaves} active sheaves.`,
      'Bearing type matters: bronze bushings typically add ~8–10% per sheave; roller bearings ~2–4% per sheave.',
    ],
    steps: [
      `1. Ideal frictionless pull: ${fmt(loadWeight)} ÷ ${partsOfLine} = ${fmt(idealPull)} ${forceUnit}`,
      `2. Friction multiplier across ${numSheaves} sheaves: 1 + (${fmt(frictionDecimal, 3)} × ${numSheaves}) = ${fmt(additiveFactor, 3)}`,
      `3. Actual lead line pull: ${fmt(idealPull)} × ${fmt(additiveFactor, 3)} = ${fmt(leadLinePull)} ${forceUnit}`,
      `4. Effective MA: ${fmt(loadWeight)} ÷ ${fmt(leadLinePull)} = ${fmt(effectiveMA, 2)}:1`,
    ],
    safetyNotice: RIGGING_SAFETY_NOTICE,
  };
}

// 5. Reeving Systems (Minimum Parts of Line for given Wire Rope WLL)
export function calculateReevingSystem(params: {
  totalLoad: number;
  singleLineWLL: number;
  frictionPerSheavePct: number;
  unit: UnitSystem;
}): CalculationResult {
  const { totalLoad, singleLineWLL, frictionPerSheavePct, unit } = params;
  const forceUnit = unit === 'imperial' ? 'lb' : 'kg';
  const warnings: string[] = [];

  if (totalLoad <= 0 || singleLineWLL <= 0 || frictionPerSheavePct < 0 || frictionPerSheavePct > 20) {
    return {
      valid: false,
      error: 'Total load and single-line WLL must be positive; friction must be 0–20%.',
      warnings,
      primaryLabel: 'Minimum Parts of Line',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'Parts ≥ Load / Single-Line WLL (adjusted for sheave friction)',
      assumptions: [],
      steps: [],
      safetyNotice: RIGGING_SAFETY_NOTICE,
    };
  }

  const idealParts = Math.ceil(totalLoad / singleLineWLL);
  const f = frictionPerSheavePct / 100;
  // Find minimum parts N where lead line pull (totalLoad / N) * (1 + f * N) <= singleLineWLL
  let requiredParts = idealParts;
  while (requiredParts <= 32) {
    const pull = (totalLoad / requiredParts) * (1 + f * requiredParts);
    if (pull <= singleLineWLL) break;
    requiredParts++;
  }

  if (requiredParts > 32) {
    warnings.push('Single-line WLL is too low for this load even at 32 parts of line. Increase rope diameter or grade.');
  }

  const resultingPull = (totalLoad / requiredParts) * (1 + f * requiredParts);
  const utilizationPct = (resultingPull / singleLineWLL) * 100;

  return {
    valid: true,
    warnings,
    primaryLabel: 'Recommended Parts of Line',
    primaryValue: `${requiredParts} Parts`,
    secondaryMetrics: [
      { label: 'Ideal Parts (Ignoring Friction)', value: `${idealParts} Parts` },
      { label: 'Estimated Lead Line Pull', value: `${fmt(resultingPull)} ${forceUnit}` },
      { label: 'Single-Line WLL Utilization', value: `${fmt(utilizationPct, 1)}%` },
      { label: 'Becket / Dead-End Location', value: requiredParts % 2 === 0 ? 'Upper Block (Boom Head)' : 'Lower Traveling Block' },
    ],
    formula: 'Lead Pull = (W / N) × (1 + f × N) ≤ Single-Line WLL',
    assumptions: [
      'Assumes N active sheaves roughly equal to N parts of line.',
      'Even parts dead-end at upper boom head; odd parts dead-end at lower hook block.',
    ],
    steps: [
      `1. Divide load by single-line WLL: ${fmt(totalLoad)} ÷ ${fmt(singleLineWLL)} = ${fmt(totalLoad / singleLineWLL, 2)} (rounds up to ${idealParts} ideal parts)`,
      `2. Test friction-adjusted lead pull at N = ${requiredParts}: (${fmt(totalLoad)} ÷ ${requiredParts}) × (1 + ${fmt(f, 3)} × ${requiredParts}) = ${fmt(resultingPull)} ${forceUnit}`,
      `3. Confirm ${fmt(resultingPull)} ${forceUnit} ≤ ${fmt(singleLineWLL)} ${forceUnit} single-line WLL`,
    ],
    safetyNotice: RIGGING_SAFETY_NOTICE,
  };
}

// 6. Cylinder Volume & Shell Surface Area
export function calculateCylinderVolume(params: {
  diameter: number;
  heightOrLength: number;
  unit: UnitSystem;
}): CalculationResult {
  const { diameter, heightOrLength, unit } = params;
  const lenUnit = unit === 'imperial' ? 'ft' : 'm';
  const volUnit = unit === 'imperial' ? 'ft³' : 'm³';
  const areaUnit = unit === 'imperial' ? 'ft²' : 'm²';

  if (diameter <= 0 || heightOrLength <= 0) {
    return {
      valid: false,
      error: 'Diameter and length/height must be greater than zero.',
      warnings: [],
      primaryLabel: 'Cylinder Volume',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'V = π × r² × h',
      assumptions: [],
      steps: [],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  }

  const r = diameter / 2;
  const crossSectionArea = Math.PI * r * r;
  const volume = crossSectionArea * heightOrLength;
  const lateralShellArea = Math.PI * diameter * heightOrLength;
  const totalSurfaceArea = lateralShellArea + 2 * crossSectionArea;

  return {
    valid: true,
    warnings: [],
    primaryLabel: 'Internal Cylinder Volume',
    primaryValue: `${fmt(volume, 2)} ${volUnit}`,
    secondaryMetrics: [
      { label: 'Radius (r)', value: `${fmt(r, 3)} ${lenUnit}` },
      { label: 'Cross-Sectional Area', value: `${fmt(crossSectionArea, 2)} ${areaUnit}` },
      { label: 'Lateral Shell Area (πDh)', value: `${fmt(lateralShellArea, 2)} ${areaUnit}` },
      { label: 'Total Closed Surface Area', value: `${fmt(totalSurfaceArea, 2)} ${areaUnit}` },
    ],
    formula: 'V = π × r² × h  (or 0.7854 × D² × h)',
    assumptions: ['Flat ends; use inside diameter (ID) for internal capacity and mean diameter for shell plate layout.'],
    steps: [
      `1. Radius: r = ${fmt(diameter, 3)} ÷ 2 = ${fmt(r, 3)} ${lenUnit}`,
      `2. Base Area: A = π × (${fmt(r, 3)})² = ${fmt(crossSectionArea, 3)} ${areaUnit}`,
      `3. Volume: V = ${fmt(crossSectionArea, 3)} × ${fmt(heightOrLength, 3)} = ${fmt(volume, 2)} ${volUnit}`,
      `4. Lateral Shell Area: π × ${fmt(diameter, 3)} × ${fmt(heightOrLength, 3)} = ${fmt(lateralShellArea, 2)} ${areaUnit}`,
    ],
    safetyNotice: FABRICATION_SAFETY_NOTICE,
  };
}

// 7. Steel Plate Weight
export function calculatePlateWeight(params: {
  length: number; // inches in imperial, mm in metric
  width: number;  // inches in imperial, mm in metric
  thickness: number; // inches in imperial, mm in metric
  material: 'carbon_steel' | 'stainless_steel' | 'aluminum';
  unit: UnitSystem;
}): CalculationResult {
  const { length, width, thickness, material, unit } = params;
  const warnings: string[] = [];

  if (length <= 0 || width <= 0 || thickness <= 0) {
    return {
      valid: false,
      error: 'Length, width, and thickness must all be greater than zero.',
      warnings,
      primaryLabel: 'Plate Weight',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'W = L × W × t × ρ',
      assumptions: [],
      steps: [],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  }

  if (unit === 'imperial') {
    // inputs in inches; carbon steel = 0.2836 lb/in3 (40.8 lb/ft2 per inch thick)
    const densityMap = {
      carbon_steel: { name: 'Carbon Steel', lbPerIn3: 0.2836, psfPerInch: 40.84 },
      stainless_steel: { name: 'Stainless Steel', lbPerIn3: 0.290, psfPerInch: 41.76 },
      aluminum: { name: 'Aluminum', lbPerIn3: 0.0975, psfPerInch: 14.04 },
    };
    const mat = densityMap[material];
    const volumeIn3 = length * width * thickness;
    const weightLb = volumeIn3 * mat.lbPerIn3;
    const areaSqFt = (length * width) / 144;
    const weightKg = weightLb * 0.453592;

    return {
      valid: true,
      warnings,
      primaryLabel: 'Estimated Plate Weight',
      primaryValue: `${fmt(weightLb, 1)} lb`,
      secondaryMetrics: [
        { label: 'Metric Equivalent', value: `${fmt(weightKg, 1)} kg` },
        { label: 'Plate Surface Area', value: `${fmt(areaSqFt, 2)} ft²` },
        { label: 'Weight per sq. ft.', value: `${fmt(thickness * mat.psfPerInch, 2)} lb/ft²` },
      ],
      formula: 'W (lb) = L(in) × W(in) × t(in) × Density(lb/in³)',
      assumptions: [`${mat.name} density = ${mat.lbPerIn3} lb/in³ (${mat.psfPerInch} lb/ft² per inch thickness).`],
      steps: [
        `1. Volume in cubic inches: ${fmt(length, 2)} × ${fmt(width, 2)} × ${fmt(thickness, 3)} = ${fmt(volumeIn3, 2)} in³`,
        `2. Multiply by density (${mat.lbPerIn3} lb/in³): ${fmt(volumeIn3, 2)} × ${mat.lbPerIn3} = ${fmt(weightLb, 1)} lb`,
        `3. Shop shortcut check: ${fmt(areaSqFt, 2)} ft² × (${fmt(thickness, 3)}" × ${mat.psfPerInch} lb/ft²) = ${fmt(areaSqFt * thickness * mat.psfPerInch, 1)} lb`,
      ],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  } else {
    // Metric inputs in mm
    const densityMap = {
      carbon_steel: { name: 'Carbon Steel', kgPerM3: 7850, kgPerM2PerMm: 7.85 },
      stainless_steel: { name: 'Stainless Steel', kgPerM3: 8030, kgPerM2PerMm: 8.03 },
      aluminum: { name: 'Aluminum', kgPerM3: 2700, kgPerM2PerMm: 2.70 },
    };
    const mat = densityMap[material];
    const areaM2 = (length / 1000) * (width / 1000);
    const weightKg = areaM2 * thickness * mat.kgPerM2PerMm;
    const weightLb = weightKg * 2.20462;

    return {
      valid: true,
      warnings,
      primaryLabel: 'Estimated Plate Weight',
      primaryValue: `${fmt(weightKg, 1)} kg`,
      secondaryMetrics: [
        { label: 'Imperial Equivalent', value: `${fmt(weightLb, 1)} lb` },
        { label: 'Plate Area', value: `${fmt(areaM2, 3)} m²` },
        { label: 'Unit Mass', value: `${fmt(thickness * mat.kgPerM2PerMm, 2)} kg/m²` },
      ],
      formula: 'W (kg) = L(m) × W(m) × t(mm) × 7.85 (steel)',
      assumptions: [`${mat.name}: ${mat.kgPerM2PerMm} kg/m² per mm thickness.`],
      steps: [
        `1. Area in m²: (${fmt(length, 1)} ÷ 1000) × (${fmt(width, 1)} ÷ 1000) = ${fmt(areaM2, 4)} m²`,
        `2. Multiply by thickness (mm) and unit mass: ${fmt(areaM2, 4)} × ${fmt(thickness, 2)} × ${mat.kgPerM2PerMm} = ${fmt(weightKg, 1)} kg`,
      ],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  }
}

// 8. Pipe Weight (Empty & Water-Filled)
export function calculatePipeWeight(params: {
  od: number; // inches or mm
  wallThickness: number; // inches or mm
  length: number; // feet or meters
  unit: UnitSystem;
}): CalculationResult {
  const { od, wallThickness, length, unit } = params;
  const warnings: string[] = [];

  if (od <= 0 || wallThickness <= 0 || length <= 0) {
    return {
      valid: false,
      error: 'OD, wall thickness, and length must be greater than zero.',
      warnings,
      primaryLabel: 'Pipe Weight (Empty)',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'lb/ft = 10.69 × (OD - t) × t',
      assumptions: [],
      steps: [],
      safetyNotice: RIGGING_SAFETY_NOTICE,
    };
  }

  if (wallThickness * 2 >= od) {
    return {
      valid: false,
      error: 'Impossible pipe geometry: 2 × wall thickness cannot be greater than or equal to OD.',
      warnings,
      primaryLabel: 'Pipe Weight (Empty)',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'ID = OD - 2t',
      assumptions: [],
      steps: [],
      safetyNotice: RIGGING_SAFETY_NOTICE,
    };
  }

  const id = od - 2 * wallThickness;
  if (unit === 'imperial') {
    // Classic pipefitter/boilermaker formula: lb/ft = 10.69 * (OD - t) * t (carbon steel)
    const lbPerFt = 10.69 * (od - wallThickness) * wallThickness;
    const emptyWeight = lbPerFt * length;
    // Water weight per ft = 0.340 * ID^2 (since pi/4 * ID^2 / 144 * 62.4 = 0.3403)
    const waterLbPerFt = 0.3403 * id * id;
    const waterWeight = waterLbPerFt * length;
    const fullWeight = emptyWeight + waterWeight;

    return {
      valid: true,
      warnings,
      primaryLabel: 'Total Pipe Weight (Empty)',
      primaryValue: `${fmt(emptyWeight, 1)} lb`,
      secondaryMetrics: [
        { label: 'Unit Pipe Weight', value: `${fmt(lbPerFt, 2)} lb/ft` },
        { label: 'Inside Diameter (ID)', value: `${fmt(id, 3)} in` },
        { label: 'Water Weight if Full', value: `${fmt(waterWeight, 1)} lb` },
        { label: 'Flooded Total Weight', value: `${fmt(fullWeight, 1)} lb` },
      ],
      formula: 'lb/ft = 10.69 × (OD - t) × t',
      assumptions: ['Carbon steel density 490 lb/ft³ (0.2836 lb/in³).', 'Water density 62.4 lb/ft³.'],
      steps: [
        `1. Mean diameter: OD - t = ${fmt(od, 3)} - ${fmt(wallThickness, 3)} = ${fmt(od - wallThickness, 3)} in`,
        `2. Unit steel weight: 10.69 × ${fmt(od - wallThickness, 3)} × ${fmt(wallThickness, 3)} = ${fmt(lbPerFt, 2)} lb/ft`,
        `3. Empty pipe weight: ${fmt(lbPerFt, 2)} × ${fmt(length, 2)} ft = ${fmt(emptyWeight, 1)} lb`,
        `4. Internal water weight (ID = ${fmt(id, 3)} in): 0.3403 × (${fmt(id, 3)})² × ${fmt(length, 2)} = ${fmt(waterWeight, 1)} lb`,
      ],
      safetyNotice: RIGGING_SAFETY_NOTICE,
    };
  } else {
    // Metric: kg/m = 0.02466 * (OD_mm - t_mm) * t_mm
    const kgPerM = 0.0246615 * (od - wallThickness) * wallThickness;
    const emptyWeight = kgPerM * length;
    const waterKgPerM = (Math.PI / 4) * (id / 1000) * (id / 1000) * 1000;
    const waterWeight = waterKgPerM * length;

    return {
      valid: true,
      warnings,
      primaryLabel: 'Total Pipe Weight (Empty)',
      primaryValue: `${fmt(emptyWeight, 1)} kg`,
      secondaryMetrics: [
        { label: 'Unit Pipe Weight', value: `${fmt(kgPerM, 2)} kg/m` },
        { label: 'Inside Diameter (ID)', value: `${fmt(id, 1)} mm` },
        { label: 'Water Weight if Full', value: `${fmt(waterWeight, 1)} kg` },
        { label: 'Flooded Total Weight', value: `${fmt(emptyWeight + waterWeight, 1)} kg` },
      ],
      formula: 'kg/m = 0.02466 × (OD - t) × t',
      assumptions: ['Carbon steel 7,850 kg/m³; OD and wall thickness in mm, length in m.'],
      steps: [
        `1. Unit steel mass: 0.02466 × (${fmt(od, 1)} - ${fmt(wallThickness, 1)}) × ${fmt(wallThickness, 1)} = ${fmt(kgPerM, 2)} kg/m`,
        `2. Empty pipe mass: ${fmt(kgPerM, 2)} × ${fmt(length, 2)} m = ${fmt(emptyWeight, 1)} kg`,
        `3. Water mass (ID = ${fmt(id, 1)} mm): ${fmt(waterWeight, 1)} kg`,
      ],
      safetyNotice: RIGGING_SAFETY_NOTICE,
    };
  }
}

// 9. Tank Capacity Calculator
export function calculateTankCapacity(params: {
  diameter: number; // ft or m
  shellLengthOrHeight: number; // ft or m
  headType: 'flat' | 'ellipsoidal_2to1';
  unit: UnitSystem;
}): CalculationResult {
  const { diameter, shellLengthOrHeight, headType, unit } = params;
  if (diameter <= 0 || shellLengthOrHeight <= 0) {
    return {
      valid: false,
      error: 'Tank diameter and shell height/length must be greater than zero.',
      warnings: [],
      primaryLabel: 'Tank Capacity',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'V_shell = πr²h',
      assumptions: [],
      steps: [],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  }

  const r = diameter / 2;
  const shellVol = Math.PI * r * r * shellLengthOrHeight;
  // Volume of TWO 2:1 ellipsoidal heads = 2 * (pi/12 * D^3 / 2) = pi * D^3 / 12
  const twoHeadsVol = headType === 'ellipsoidal_2to1' ? (Math.PI * Math.pow(diameter, 3)) / 12 : 0;
  const totalVol = shellVol + twoHeadsVol;

  if (unit === 'imperial') {
    const usGallons = totalVol * 7.48052;
    const impGallons = totalVol * 6.22884;
    const bblOil = usGallons / 42;
    const waterLb = totalVol * 62.4;

    return {
      valid: true,
      warnings: [],
      primaryLabel: 'Total Tank Capacity',
      primaryValue: `${fmt(usGallons, 0)} US gal`,
      secondaryMetrics: [
        { label: 'Imperial Gallons', value: `${fmt(impGallons, 0)} Imp gal` },
        { label: 'Cubic Feet', value: `${fmt(totalVol, 1)} ft³` },
        { label: 'Petroleum Barrels (42 gal)', value: `${fmt(bblOil, 1)} bbl` },
        { label: 'Water Weight (Hydrotest)', value: `${fmt(waterLb, 0)} lb` },
      ],
      formula: headType === 'ellipsoidal_2to1' ? 'V = πr²L + (πD³ / 12)' : 'V = πr²H',
      assumptions: ['Uses inside diameter (ID). 1 ft³ = 7.48052 US gal = 6.22884 Imp gal.'],
      steps: [
        `1. Cylindrical shell volume: π × (${fmt(r, 2)})² × ${fmt(shellLengthOrHeight, 2)} = ${fmt(shellVol, 2)} ft³`,
        headType === 'ellipsoidal_2to1'
          ? `2. Add two 2:1 ellipsoidal heads: (π × ${fmt(diameter, 2)}³) ÷ 12 = ${fmt(twoHeadsVol, 2)} ft³`
          : '2. Flat heads: 0 ft³ additional head volume',
        `3. Total volume: ${fmt(totalVol, 2)} ft³ × 7.48052 = ${fmt(usGallons, 0)} US gallons`,
      ],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  } else {
    const litres = totalVol * 1000;
    const waterKg = litres;
    return {
      valid: true,
      warnings: [],
      primaryLabel: 'Total Tank Capacity',
      primaryValue: `${fmt(litres, 0)} L`,
      secondaryMetrics: [
        { label: 'Cubic Meters', value: `${fmt(totalVol, 2)} m³` },
        { label: 'US Gallons', value: `${fmt(litres * 0.264172, 0)} gal` },
        { label: 'Water Mass (Hydrotest)', value: `${fmt(waterKg, 0)} kg` },
      ],
      formula: headType === 'ellipsoidal_2to1' ? 'V = πr²L + (πD³ / 12)' : 'V = πr²H',
      assumptions: ['Uses inside diameter (ID). 1 m³ = 1,000 Litres.'],
      steps: [
        `1. Shell volume: π × (${fmt(r, 2)})² × ${fmt(shellLengthOrHeight, 2)} = ${fmt(shellVol, 3)} m³`,
        headType === 'ellipsoidal_2to1'
          ? `2. Two 2:1 heads: (π × ${fmt(diameter, 2)}³) ÷ 12 = ${fmt(twoHeadsVol, 3)} m³`
          : '2. Flat ends: 0 m³ head volume',
        `3. Total capacity: ${fmt(totalVol, 3)} m³ × 1,000 = ${fmt(litres, 0)} L`,
      ],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  }
}

// 10. Circumference & Plate Roll Allowance (Mean Diameter)
export function calculateCircumferenceAndRoll(params: {
  diameterType: 'OD' | 'ID';
  diameterValue: number;
  plateThickness: number;
  unit: UnitSystem;
}): CalculationResult {
  const { diameterType, diameterValue, plateThickness, unit } = params;
  const lenUnit = unit === 'imperial' ? 'in' : 'mm';
  const warnings: string[] = [];

  if (diameterValue <= 0 || plateThickness < 0) {
    return {
      valid: false,
      error: 'Diameter must be positive and plate thickness cannot be negative.',
      warnings,
      primaryLabel: 'Plate Cut Stretch-Out Length',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'L_stretch = π × D_mean',
      assumptions: [],
      steps: [],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  }

  if (diameterType === 'OD' && plateThickness * 2 >= diameterValue) {
    return {
      valid: false,
      error: 'Plate thickness × 2 cannot equal or exceed Outside Diameter.',
      warnings,
      primaryLabel: 'Plate Cut Stretch-Out Length',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'D_mean = OD - t',
      assumptions: [],
      steps: [],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  }

  const meanDiameter = diameterType === 'OD' ? diameterValue - plateThickness : diameterValue + plateThickness;
  const stretchOutLength = Math.PI * meanDiameter;
  const od = diameterType === 'OD' ? diameterValue : diameterValue + 2 * plateThickness;
  const id = diameterType === 'ID' ? diameterValue : diameterValue - 2 * plateThickness;

  if (plateThickness / meanDiameter > 0.05) {
    warnings.push('Heavy-wall shell (t/D > 5%): Verify neutral-axis shift (K-factor) on thick rolled plates with your shop supervisor.');
  }

  return {
    valid: true,
    warnings,
    primaryLabel: 'Plate Stretch-Out Length (Mean Circumference)',
    primaryValue: `${fmt(stretchOutLength, 3)} ${lenUnit}`,
    secondaryMetrics: [
      { label: 'Mean Diameter (Neutral Axis)', value: `${fmt(meanDiameter, 3)} ${lenUnit}` },
      { label: 'Outside Diameter (OD)', value: `${fmt(od, 3)} ${lenUnit}` },
      { label: 'Inside Diameter (ID)', value: `${fmt(id, 3)} ${lenUnit}` },
      { label: 'Quarter-Point Chord Layout', value: `${fmt(stretchOutLength / 4, 3)} ${lenUnit}` },
    ],
    formula: diameterType === 'OD' ? 'L = π × (OD - t)' : 'L = π × (ID + t)',
    assumptions: ['Neutral axis located at 50% plate thickness (K = 0.50).', 'Does not add bevel/weld root gap trim allowance.'],
    steps: [
      `1. Calculate Mean Diameter: ${diameterType === 'OD' ? `${fmt(diameterValue, 3)} - ${fmt(plateThickness, 3)}` : `${fmt(diameterValue, 3)} + ${fmt(plateThickness, 3)}`} = ${fmt(meanDiameter, 3)} ${lenUnit}`,
      `2. Multiply by π: π × ${fmt(meanDiameter, 3)} = ${fmt(stretchOutLength, 3)} ${lenUnit}`,
      `3. Quartering for nozzle layout: ${fmt(stretchOutLength, 3)} ÷ 4 = ${fmt(stretchOutLength / 4, 3)} ${lenUnit}`,
    ],
    safetyNotice: FABRICATION_SAFETY_NOTICE,
  };
}

// 11. Bend Allowance & Setback
export function calculateBendAllowance(params: {
  insideBendRadius: number;
  thickness: number;
  bendAngleDeg: number;
  kFactor: number;
  unit: UnitSystem;
}): CalculationResult {
  const { insideBendRadius, thickness, bendAngleDeg, kFactor, unit } = params;
  const lenUnit = unit === 'imperial' ? 'in' : 'mm';

  if (insideBendRadius < 0 || thickness <= 0 || bendAngleDeg <= 0 || bendAngleDeg > 180 || kFactor <= 0 || kFactor >= 1) {
    return {
      valid: false,
      error: 'Check inputs: thickness > 0, angle (0–180°), K-factor (0.01–0.99).',
      warnings: [],
      primaryLabel: 'Bend Allowance (BA)',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'BA = (π / 180) × θ × (R + K × t)',
      assumptions: [],
      steps: [],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  }

  const ba = (Math.PI / 180) * bendAngleDeg * (insideBendRadius + kFactor * thickness);
  const halfAngleRad = ((bendAngleDeg / 2) * Math.PI) / 180;
  const outsideSetback = Math.tan(halfAngleRad) * (insideBendRadius + thickness);
  const bendDeduction = 2 * outsideSetback - ba;

  return {
    valid: true,
    warnings: [],
    primaryLabel: 'Bend Allowance (BA)',
    primaryValue: `${fmt(ba, 3)} ${lenUnit}`,
    secondaryMetrics: [
      { label: 'Outside Setback (OSSB)', value: `${fmt(outsideSetback, 3)} ${lenUnit}` },
      { label: 'Bend Deduction (BD)', value: `${fmt(bendDeduction, 3)} ${lenUnit}` },
      { label: 'Neutral Axis Radius', value: `${fmt(insideBendRadius + kFactor * thickness, 3)} ${lenUnit}` },
    ],
    formula: 'BA = (π / 180) × A × (R_inside + K × t)',
    assumptions: [`K-factor = ${kFactor} (typical air-bending mild steel K ≈ 0.33–0.45).`],
    steps: [
      `1. Neutral axis radius: R + (K × t) = ${fmt(insideBendRadius, 3)} + (${kFactor} × ${fmt(thickness, 3)}) = ${fmt(insideBendRadius + kFactor * thickness, 3)} ${lenUnit}`,
      `2. Bend Allowance: (π / 180) × ${bendAngleDeg}° × ${fmt(insideBendRadius + kFactor * thickness, 3)} = ${fmt(ba, 3)} ${lenUnit}`,
      `3. Outside Setback: tan(${bendAngleDeg / 2}°) × (${fmt(insideBendRadius + thickness, 3)}) = ${fmt(outsideSetback, 3)} ${lenUnit}`,
    ],
    safetyNotice: FABRICATION_SAFETY_NOTICE,
  };
}

// 12. Thermal Expansion & Contraction
export function calculateThermalExpansion(params: {
  length: number; // ft or m
  deltaTemp: number; // °F or °C
  material: 'carbon_steel' | 'stainless_304' | 'chrome_moly';
  unit: UnitSystem;
}): CalculationResult {
  const { length, deltaTemp, material, unit } = params;
  if (length <= 0) {
    return {
      valid: false,
      error: 'Original length must be greater than zero.',
      warnings: [],
      primaryLabel: 'Length Change (ΔL)',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'ΔL = L × α × ΔT',
      assumptions: [],
      steps: [],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  }

  // Coefficient of linear thermal expansion
  const coeffs = {
    carbon_steel: { name: 'Carbon Steel', perF: 6.5e-6, perC: 11.7e-6 },
    stainless_304: { name: '304 Stainless Steel', perF: 9.6e-6, perC: 17.3e-6 },
    chrome_moly: { name: 'Chrome-Moly (P11/P22)', perF: 7.2e-6, perC: 13.0e-6 },
  };
  const mat = coeffs[material];

  if (unit === 'imperial') {
    const lengthIn = length * 12;
    const deltaLIn = lengthIn * mat.perF * deltaTemp;
    return {
      valid: true,
      warnings: Math.abs(deltaLIn) > 2 ? ['Large thermal movement (>2 in): Ensure expansion loops, sliding shoes, or spring hangers are properly set.'] : [],
      primaryLabel: 'Thermal Length Change (ΔL)',
      primaryValue: `${deltaLIn >= 0 ? '+' : ''}${fmt(deltaLIn, 3)} in`,
      secondaryMetrics: [
        { label: 'Coefficient (α)', value: `${(mat.perF * 1e6).toFixed(1)} × 10⁻⁶ /°F` },
        { label: 'Length in Inches', value: `${fmt(lengthIn, 1)} in` },
        { label: 'In Fractions (approx 1/16")', value: `${Math.round(deltaLIn * 16)}/16 in` },
      ],
      formula: 'ΔL = L(in) × α × ΔT(°F)',
      assumptions: [`Average linear expansion coefficient for ${mat.name}.`],
      steps: [
        `1. Convert length to inches: ${fmt(length, 2)} ft × 12 = ${fmt(lengthIn, 1)} in`,
        `2. Multiply L × α × ΔT: ${fmt(lengthIn, 1)} × ${mat.perF.toExponential(2)} × ${deltaTemp}°F = ${fmt(deltaLIn, 4)} in`,
      ],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  } else {
    const lengthMm = length * 1000;
    const deltaLMm = lengthMm * mat.perC * deltaTemp;
    return {
      valid: true,
      warnings: Math.abs(deltaLMm) > 50 ? ['Large thermal movement (>50 mm): Verify expansion joint travel and anchor clearances.'] : [],
      primaryLabel: 'Thermal Length Change (ΔL)',
      primaryValue: `${deltaLMm >= 0 ? '+' : ''}${fmt(deltaLMm, 2)} mm`,
      secondaryMetrics: [
        { label: 'Coefficient (α)', value: `${(mat.perC * 1e6).toFixed(1)} × 10⁻⁶ /°C` },
        { label: 'Length in mm', value: `${fmt(lengthMm, 0)} mm` },
      ],
      formula: 'ΔL = L(mm) × α × ΔT(°C)',
      assumptions: [`Average linear expansion coefficient for ${mat.name}.`],
      steps: [
        `1. Convert length to mm: ${fmt(length, 2)} m × 1000 = ${fmt(lengthMm, 0)} mm`,
        `2. Multiply L × α × ΔT: ${fmt(lengthMm, 0)} × ${mat.perC.toExponential(2)} × ${deltaTemp}°C = ${fmt(deltaLMm, 2)} mm`,
      ],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  }
}

// 13. Unit Conversions
export function convertUnits(params: {
  value: number;
  conversionType:
    | 'in_to_mm'
    | 'mm_to_in'
    | 'ft_to_m'
    | 'm_to_ft'
    | 'lb_to_kg'
    | 'kg_to_lb'
    | 'psi_to_kpa'
    | 'kpa_to_psi'
    | 'f_to_c'
    | 'c_to_f'
    | 'usgal_to_l'
    | 'l_to_usgal';
}): CalculationResult {
  const { value, conversionType } = params;
  if (!Number.isFinite(value)) {
    return {
      valid: false,
      error: 'Enter a valid numeric value.',
      warnings: [],
      primaryLabel: 'Converted Value',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: '',
      assumptions: [],
      steps: [],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  }

  const map: Record<
    typeof conversionType,
    { label: string; calc: (v: number) => number; outUnit: string; inUnit: string; formula: string; step: (v: number, r: number) => string }
  > = {
    in_to_mm: { label: 'Inches → Millimetres', calc: (v) => v * 25.4, outUnit: 'mm', inUnit: 'in', formula: 'mm = in × 25.4', step: (v, r) => `${v} in × 25.4 = ${fmt(r, 3)} mm` },
    mm_to_in: { label: 'Millimetres → Inches', calc: (v) => v / 25.4, outUnit: 'in', inUnit: 'mm', formula: 'in = mm ÷ 25.4', step: (v, r) => `${v} mm ÷ 25.4 = ${fmt(r, 4)} in` },
    ft_to_m: { label: 'Feet → Metres', calc: (v) => v * 0.3048, outUnit: 'm', inUnit: 'ft', formula: 'm = ft × 0.3048', step: (v, r) => `${v} ft × 0.3048 = ${fmt(r, 4)} m` },
    m_to_ft: { label: 'Metres → Feet', calc: (v) => v / 0.3048, outUnit: 'ft', inUnit: 'm', formula: 'ft = m ÷ 0.3048', step: (v, r) => `${v} m ÷ 0.3048 = ${fmt(r, 4)} ft` },
    lb_to_kg: { label: 'Pounds → Kilograms', calc: (v) => v * 0.45359237, outUnit: 'kg', inUnit: 'lb', formula: 'kg = lb × 0.4536', step: (v, r) => `${v} lb × 0.4536 = ${fmt(r, 2)} kg` },
    kg_to_lb: { label: 'Kilograms → Pounds', calc: (v) => v * 2.2046226, outUnit: 'lb', inUnit: 'kg', formula: 'lb = kg × 2.2046', step: (v, r) => `${v} kg × 2.2046 = ${fmt(r, 2)} lb` },
    psi_to_kpa: { label: 'PSI → Kilopascals (kPa)', calc: (v) => v * 6.89476, outUnit: 'kPa', inUnit: 'psi', formula: 'kPa = psi × 6.895', step: (v, r) => `${v} psi × 6.89476 = ${fmt(r, 2)} kPa` },
    kpa_to_psi: { label: 'Kilopascals (kPa) → PSI', calc: (v) => v / 6.89476, outUnit: 'psi', inUnit: 'kPa', formula: 'psi = kPa ÷ 6.895', step: (v, r) => `${v} kPa ÷ 6.89476 = ${fmt(r, 2)} psi` },
    f_to_c: { label: 'Fahrenheit → Celsius', calc: (v) => ((v - 32) * 5) / 9, outUnit: '°C', inUnit: '°F', formula: '°C = (°F - 32) × 5/9', step: (v, r) => `(${v} - 32) × 5 ÷ 9 = ${fmt(r, 1)} °C` },
    c_to_f: { label: 'Celsius → Fahrenheit', calc: (v) => (v * 9) / 5 + 32, outUnit: '°F', inUnit: '°C', formula: '°F = (°C × 9/5) + 32', step: (v, r) => `(${v} × 9 ÷ 5) + 32 = ${fmt(r, 1)} °F` },
    usgal_to_l: { label: 'US Gallons → Litres', calc: (v) => v * 3.78541, outUnit: 'L', inUnit: 'US gal', formula: 'L = US gal × 3.7854', step: (v, r) => `${v} gal × 3.78541 = ${fmt(r, 2)} L` },
    l_to_usgal: { label: 'Litres → US Gallons', calc: (v) => v / 3.78541, outUnit: 'US gal', inUnit: 'L', formula: 'US gal = L ÷ 3.7854', step: (v, r) => `${v} L ÷ 3.78541 = ${fmt(r, 2)} US gal` },
  };

  const conv = map[conversionType];
  const result = conv.calc(value);

  return {
    valid: true,
    warnings: [],
    primaryLabel: conv.label,
    primaryValue: `${fmt(result, 3)} ${conv.outUnit}`,
    secondaryMetrics: [
      { label: 'Input Value', value: `${fmt(value, 3)} ${conv.inUnit}` },
      { label: 'Conversion Formula', value: conv.formula },
    ],
    formula: conv.formula,
    assumptions: ['Exact international conversion factors.'],
    steps: [`1. Apply formula: ${conv.step(value, result)}`],
    safetyNotice: FABRICATION_SAFETY_NOTICE,
  };
}

// 14. Right-Triangle & Pipe/Structural Offset Calculator
export function calculateRightTriangle(params: {
  run: number; // side a
  rise: number; // side b
  unit: UnitSystem;
}): CalculationResult {
  const { run, rise, unit } = params;
  const lenUnit = unit === 'imperial' ? 'in' : 'mm';
  if (run <= 0 || rise <= 0) {
    return {
      valid: false,
      error: 'Both Run and Rise (Offset) must be greater than zero.',
      warnings: [],
      primaryLabel: 'Travel (Hypotenuse)',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'c = √(a² + b²)',
      assumptions: [],
      steps: [],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  }

  const travel = Math.hypot(run, rise);
  const angleFromRun = (Math.atan2(rise, run) * 180) / Math.PI;
  const angleFromRise = 90 - angleFromRun;

  return {
    valid: true,
    warnings: [],
    primaryLabel: 'Travel (Hypotenuse c)',
    primaryValue: `${fmt(travel, 3)} ${lenUnit}`,
    secondaryMetrics: [
      { label: 'Angle θ (from Run)', value: `${fmt(angleFromRun, 2)}°` },
      { label: 'Complementary Angle (from Rise)', value: `${fmt(angleFromRise, 2)}°` },
      { label: '45° Check (1.414 × Offset)', value: Math.abs(run - rise) < 0.01 ? 'Exact 45° Mitre/Offset' : 'Non-45° Triangle' },
    ],
    formula: 'c = √(Run² + Rise²)   |   θ = arctan(Rise / Run)',
    assumptions: ['90° right triangle geometry. For pipe centre-to-centre travel, subtract fitting take-offs for cut length.'],
    steps: [
      `1. Square both legs: ${fmt(run, 3)}² + ${fmt(rise, 3)}² = ${fmt(run * run, 2)} + ${fmt(rise * rise, 2)} = ${fmt(run * run + rise * rise, 2)}`,
      `2. Take square root for Travel: √(${fmt(run * run + rise * rise, 2)}) = ${fmt(travel, 3)} ${lenUnit}`,
      `3. Calculate angle θ: arctan(${fmt(rise, 3)} ÷ ${fmt(run, 3)}) = ${fmt(angleFromRun, 2)}°`,
    ],
    safetyNotice: FABRICATION_SAFETY_NOTICE,
  };
}

// 15. Basic Weld Volume & Electrode Estimator
export function calculateWeldVolume(params: {
  jointType: 'fillet' | 'single_v_groove';
  legOrThickness: number; // fillet leg size or plate thickness (in or mm)
  weldLength: number; // ft or m
  rootGap: number; // in or mm (for groove)
  includedAngleDeg: number; // for groove
  unit: UnitSystem;
}): CalculationResult {
  const { jointType, legOrThickness, weldLength, rootGap, includedAngleDeg, unit } = params;
  if (legOrThickness <= 0 || weldLength <= 0) {
    return {
      valid: false,
      error: 'Size/thickness and weld length must be greater than zero.',
      warnings: [],
      primaryLabel: 'Estimated Weld Metal Weight',
      primaryValue: '—',
      secondaryMetrics: [],
      formula: 'Weight = Area × Length × Density',
      assumptions: [],
      steps: [],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  }

  let areaInSqInOrSqMm = 0;
  let areaDesc = '';

  if (jointType === 'fillet') {
    // Fillet area = 0.5 * leg^2 * 1.1 (10% convexity allowance)
    areaInSqInOrSqMm = 0.5 * legOrThickness * legOrThickness * 1.1;
    areaDesc = `0.5 × ${legOrThickness}² × 1.10 (10% face reinforcement)`;
  } else {
    const halfAngleRad = ((includedAngleDeg / 2) * Math.PI) / 180;
    const grooveArea = legOrThickness * rootGap + legOrThickness * legOrThickness * Math.tan(halfAngleRad);
    areaInSqInOrSqMm = grooveArea * 1.15; // 15% cap/root reinforcement
    areaDesc = `[(t × gap) + (t² × tan(${includedAngleDeg / 2}°))] × 1.15`;
  }

  if (unit === 'imperial') {
    const lengthIn = weldLength * 12;
    const volumeIn3 = areaInSqInOrSqMm * lengthIn;
    const weldMetalLb = volumeIn3 * 0.2836;
    // SMAW E7018 deposition efficiency ~ 65%
    const smawRodLb = weldMetalLb / 0.65;
    return {
      valid: true,
      warnings: [],
      primaryLabel: 'Deposited Weld Metal',
      primaryValue: `${fmt(weldMetalLb, 2)} lb`,
      secondaryMetrics: [
        { label: 'Cross-Section Area', value: `${fmt(areaInSqInOrSqMm, 4)} in²` },
        { label: 'Weld Volume', value: `${fmt(volumeIn3, 2)} in³` },
        { label: 'Est. SMAW Rod Purchased (65% eff.)', value: `${fmt(smawRodLb, 2)} lb` },
      ],
      formula: 'W_weld = Area(in²) × Length(in) × 0.2836 lb/in³',
      assumptions: ['Carbon steel weld metal (0.2836 lb/in³). SMAW electrode purchase weight assumes 65% deposition efficiency (stub + spatter + slag loss).'],
      steps: [
        `1. Cross-sectional area: ${areaDesc} = ${fmt(areaInSqInOrSqMm, 4)} in²`,
        `2. Volume: ${fmt(areaInSqInOrSqMm, 4)} in² × (${fmt(weldLength, 2)} ft × 12) = ${fmt(volumeIn3, 2)} in³`,
        `3. Deposited metal weight: ${fmt(volumeIn3, 2)} × 0.2836 = ${fmt(weldMetalLb, 2)} lb`,
        `4. Electrode required (÷ 0.65): ${fmt(smawRodLb, 2)} lb`,
      ],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  } else {
    const lengthMm = weldLength * 1000;
    const volumeCm3 = (areaInSqInOrSqMm * lengthMm) / 1000;
    const weldMetalKg = (volumeCm3 * 7.85) / 1000;
    const smawRodKg = weldMetalKg / 0.65;

    return {
      valid: true,
      warnings: [],
      primaryLabel: 'Deposited Weld Metal',
      primaryValue: `${fmt(weldMetalKg, 2)} kg`,
      secondaryMetrics: [
        { label: 'Cross-Section Area', value: `${fmt(areaInSqInOrSqMm, 1)} mm²` },
        { label: 'Weld Volume', value: `${fmt(volumeCm3, 1)} cm³` },
        { label: 'Est. SMAW Rod Purchased (65% eff.)', value: `${fmt(smawRodKg, 2)} kg` },
      ],
      formula: 'W_weld (kg) = Area(mm²) × Length(m) × 0.00785',
      assumptions: ['Carbon steel weld metal (7.85 g/cm³); SMAW deposition efficiency ~65%.'],
      steps: [
        `1. Cross-sectional area: ${areaDesc} = ${fmt(areaInSqInOrSqMm, 1)} mm²`,
        `2. Volume: ${fmt(areaInSqInOrSqMm, 1)} mm² × ${fmt(lengthMm, 0)} mm ÷ 1000 = ${fmt(volumeCm3, 1)} cm³`,
        `3. Deposited weld mass: ${fmt(volumeCm3, 1)} × 7.85 ÷ 1000 = ${fmt(weldMetalKg, 2)} kg`,
      ],
      safetyNotice: FABRICATION_SAFETY_NOTICE,
    };
  }
}
