import {
  ElectrodeSpec,
  JointPrep,
  MachineSettings,
  Polarity,
  WeldDefectFlags,
  WeldInstantMetrics,
  WeldPerformanceReport,
  WeldSamplePoint,
  WeldingPosition,
  WeldingProcess,
  WeldingTrainingExercise,
} from '../types/academy';

export interface ElectrodeProfile {
  spec: ElectrodeSpec;
  csaClass: string;
  process: WeldingProcess;
  preferredPolarities: Polarity[];
  slags: boolean;
  slagColor: string;
  defaultDiameterIn: number;
  ampWindowByDiameter: Record<number, [number, number]>;
  nominalArcLengthMm: [number, number];
  nominalTravelAngleDeg: [number, number]; // Drag for SMAW/FCAW, Push for GMAW/GTAW
  penetrationFactor: number;
  depositionFactor: number;
  verticalDownAllowed: boolean;
  notes: string;
}

export const ELECTRODE_PROFILES: Record<ElectrodeSpec, ElectrodeProfile> = {
  E6010: {
    spec: 'E6010',
    csaClass: 'E4310',
    process: 'SMAW',
    preferredPolarities: ['DCEP'],
    slags: true,
    slagColor: '#3f2e24',
    defaultDiameterIn: 0.125,
    ampWindowByDiameter: {
      0.09375: [60, 90],
      0.125: [75, 130],
      0.15625: [110, 175],
    },
    nominalArcLengthMm: [2.0, 3.8],
    nominalTravelAngleDeg: [10, 20],
    penetrationFactor: 1.35,
    depositionFactor: 0.78,
    verticalDownAllowed: true,
    notes: 'Cellulosic sodium flux (DCEP only). Fast-freeze puddle, deep keyhole penetration for open-root pipe and dirty steel.',
  },
  E6011: {
    spec: 'E6011',
    csaClass: 'E4311',
    process: 'SMAW',
    preferredPolarities: ['DCEP', 'AC'],
    slags: true,
    slagColor: '#44352a',
    defaultDiameterIn: 0.125,
    ampWindowByDiameter: {
      0.09375: [60, 95],
      0.125: [80, 135],
      0.15625: [115, 180],
    },
    nominalArcLengthMm: [2.0, 3.8],
    nominalTravelAngleDeg: [10, 20],
    penetrationFactor: 1.25,
    depositionFactor: 0.82,
    verticalDownAllowed: true,
    notes: 'Cellulosic potassium flux (AC or DCEP). Similar fast-freeze dig to E6010, runs smoothly on AC transformers.',
  },
  E6013: {
    spec: 'E6013',
    csaClass: 'E4313',
    process: 'SMAW',
    preferredPolarities: ['AC', 'DCEN', 'DCEP'],
    slags: true,
    slagColor: '#564c44',
    defaultDiameterIn: 0.125,
    ampWindowByDiameter: {
      0.09375: [65, 100],
      0.125: [85, 135],
      0.15625: [120, 175],
    },
    nominalArcLengthMm: [1.8, 3.5],
    nominalTravelAngleDeg: [10, 25],
    penetrationFactor: 0.82,
    depositionFactor: 0.96,
    verticalDownAllowed: true,
    notes: 'High-titania potassium (rutile) general-purpose rod. Soft arc, shallow penetration, easy slag peel on thin plate.',
  },
  E7018: {
    spec: 'E7018',
    csaClass: 'E4918',
    process: 'SMAW',
    preferredPolarities: ['DCEP', 'AC'],
    slags: true,
    slagColor: '#2d2d30',
    defaultDiameterIn: 0.125,
    ampWindowByDiameter: {
      0.09375: [75, 110],
      0.125: [105, 150],
      0.15625: [145, 205],
    },
    nominalArcLengthMm: [1.5, 3.0],
    nominalTravelAngleDeg: [10, 18],
    penetrationFactor: 1.0,
    depositionFactor: 1.12,
    verticalDownAllowed: false,
    notes: 'Low-hydrogen iron-powder flux (DCEP/AC). Hold tight arc; keep dry in 250–300°F rod oven. Never run vertical-down on structural/pressure work.',
  },
  'E71T-8': {
    spec: 'E71T-8',
    csaClass: 'E491T-8',
    process: 'FCAW-S',
    preferredPolarities: ['DCEN'],
    slags: true,
    slagColor: '#36322f',
    defaultDiameterIn: 0.068,
    ampWindowByDiameter: {
      0.045: [120, 185],
      0.068: [165, 260],
      0.078: [190, 290],
    },
    nominalArcLengthMm: [2.2, 4.2],
    nominalTravelAngleDeg: [10, 25],
    penetrationFactor: 1.05,
    depositionFactor: 1.32,
    verticalDownAllowed: false,
    notes: 'Self-shielded FCAW-S (DCEN). No shielding bottle required—built for breezy field structural erection.',
  },
  'E71T-1': {
    spec: 'E71T-1',
    csaClass: 'E491T-9',
    process: 'FCAW-G',
    preferredPolarities: ['DCEP'],
    slags: true,
    slagColor: '#3d3530',
    defaultDiameterIn: 0.045,
    ampWindowByDiameter: {
      0.045: [155, 255],
      0.052: [185, 290],
      0.0625: [220, 340],
    },
    nominalArcLengthMm: [2.0, 3.8],
    nominalTravelAngleDeg: [10, 20],
    penetrationFactor: 1.15,
    depositionFactor: 1.48,
    verticalDownAllowed: false,
    notes: 'Gas-shielded FCAW-G (DCEP + CO2 or 75/25 Ar-CO2). High shop deposition rate; check gas flow (30–40 CFH) to prevent wormhole porosity.',
  },
  'ER70S-6': {
    spec: 'ER70S-6',
    csaClass: 'ER49S-6',
    process: 'GMAW',
    preferredPolarities: ['DCEP'],
    slags: false,
    slagColor: '#52525b',
    defaultDiameterIn: 0.035,
    ampWindowByDiameter: {
      0.035: [110, 210],
      0.045: [160, 280],
    },
    nominalArcLengthMm: [1.8, 3.5],
    nominalTravelAngleDeg: [-15, 10],
    penetrationFactor: 0.95,
    depositionFactor: 1.25,
    verticalDownAllowed: true,
    notes: 'Solid MIG wire (DCEP + Ar/CO2). Architecture-ready GMAW mode with minimal post-weld slag cleanup.',
  },
  'ER70S-2': {
    spec: 'ER70S-2',
    csaClass: 'ER49S-2',
    process: 'GTAW',
    preferredPolarities: ['DCEN'],
    slags: false,
    slagColor: '#52525b',
    defaultDiameterIn: 0.09375,
    ampWindowByDiameter: {
      0.0625: [55, 115],
      0.09375: [90, 165],
      0.125: [130, 220],
    },
    nominalArcLengthMm: [1.5, 2.8],
    nominalTravelAngleDeg: [-20, -8],
    penetrationFactor: 1.1,
    depositionFactor: 0.65,
    verticalDownAllowed: false,
    notes: 'Triple-deoxidized TIG/Pipe filler wire (DCEN + 100% Argon). Ready for precision pipe root passes.',
  },
};

export const PROCESS_ELECTRODES: Record<WeldingProcess, ElectrodeSpec[]> = {
  SMAW: ['E7018', 'E6010', 'E6011', 'E6013'],
  'FCAW-S': ['E71T-8'],
  'FCAW-G': ['E71T-1'],
  GMAW: ['ER70S-6'],
  GTAW: ['ER70S-2'],
  PIPE: ['E6010', 'E7018', 'ER70S-2'],
};

export const WELDING_POSITIONS: {
  id: WeldingPosition;
  label: string;
  jointDefault: JointPrep;
  idealWorkAngleDeg: number;
  description: string;
}[] = [
  { id: '1F', label: '1F · Flat Fillet', jointDefault: 't-fillet', idealWorkAngleDeg: 45, description: 'Horizontal axis, weld deposited from above in a 45° cradle.' },
  { id: '2F', label: '2F · Horizontal Fillet', jointDefault: 't-fillet', idealWorkAngleDeg: 45, description: 'Horizontal seam along vertical leg and flat plate; aim slightly toward bottom plate.' },
  { id: '3F-UP', label: '3F · Vertical-Up Fillet', jointDefault: 't-fillet', idealWorkAngleDeg: 45, description: 'Vertical seam welded upward against gravity; tight arc and controlled shelf.' },
  { id: '3F-DOWN', label: '3F · Vertical-Down Fillet', jointDefault: 't-fillet', idealWorkAngleDeg: 45, description: 'Fast downward travel; use fast-freeze rods (E6010/E6011), never E7018 on pressure/structural.' },
  { id: '4F', label: '4F · Overhead Fillet', jointDefault: 't-fillet', idealWorkAngleDeg: 45, description: 'Welded from underside; keep puddle small, short arc length, crisp travel speed.' },
  { id: '1G', label: '1G · Flat Groove', jointDefault: 'v-groove', idealWorkAngleDeg: 90, description: 'Plates flat, weld axis horizontal, deposited from top side.' },
  { id: '2G', label: '2G · Horizontal Groove', jointDefault: 'v-groove', idealWorkAngleDeg: 85, description: 'Vertical plates, horizontal seam; compensate slightly upward against gravity sag.' },
  { id: '3G-UP', label: '3G · Vertical-Up Groove', jointDefault: 'v-groove', idealWorkAngleDeg: 90, description: 'Vertical plates, weld progresses upward; watch toes to avoid undercut.' },
  { id: '3G-DOWN', label: '3G · Vertical-Down Groove', jointDefault: 'v-groove', idealWorkAngleDeg: 90, description: 'Vertical plates welded downward; suited to E6010/E6011 downhill root/hot passes.' },
  { id: '4G', label: '4G · Overhead Groove', jointDefault: 'v-groove', idealWorkAngleDeg: 90, description: 'Plates overhead; fight gravity crown by keeping arc tight and steady.' },
];

export const WELDING_EXERCISES: WeldingTrainingExercise[] = [
  {
    id: 'ex-smaw-e7018-1f',
    title: 'Level 1 Guided · SMAW E7018 1F Flat Fillet',
    level: 1,
    modeDefault: 'guided',
    recommendedProcess: 'SMAW',
    recommendedElectrode: 'E7018',
    recommendedPosition: '1F',
    recommendedJoint: 't-fillet',
    targetAmpsRange: [115, 135],
    targetTravelSpeedIpm: [5.5, 8.0],
    targetTravelAngleDeg: [10, 18],
    targetWorkAngleDeg: [40, 50],
    targetArcLengthMm: [1.6, 2.8],
    recommendedPolarity: 'DCEP',
    recommendedDiameterIn: 0.125,
    recommendedThicknessIn: 0.375,
    canadianCodeNote: 'CSA W48 E4918 / AWS E7018 · Keep rod tight in the root corner; avoid long-arcing on strike.',
    steps: [
      'Confirm DCEP polarity, 1/8" (0.125") E7018 rod, and 120–130 A on 3/8" plate.',
      'Hold a 45° work angle splitting the T-joint corner and 12–15° drag angle.',
      'Strike the arc cleanly, establish a steady puddle, and maintain a tight ~2 mm arc length.',
      'Feed the rod steadily inward as it burns down while traveling at 6–7 IPM.',
      'Pause briefly at the end to fill the crater, break arc, and chip slag to inspect toes.',
    ],
    passThreshold: 75,
  },
  {
    id: 'ex-smaw-e7018-1g',
    title: 'Level 1 Guided · SMAW E7018 1G Flat V-Groove',
    level: 1,
    modeDefault: 'guided',
    recommendedProcess: 'SMAW',
    recommendedElectrode: 'E7018',
    recommendedPosition: '1G',
    recommendedJoint: 'v-groove',
    targetAmpsRange: [115, 140],
    targetTravelSpeedIpm: [5.0, 7.5],
    targetTravelAngleDeg: [10, 18],
    targetWorkAngleDeg: [85, 95],
    targetArcLengthMm: [1.6, 2.8],
    recommendedPolarity: 'DCEP',
    recommendedDiameterIn: 0.125,
    recommendedThicknessIn: 0.375,
    canadianCodeNote: 'Simulate a single-V groove fill/cap pass. Maintain 90° work angle perpendicular to plate surface.',
    steps: [
      'Select 1G Flat Groove, V-groove prep, 1/8" E7018 at 125 A DCEP.',
      'Keep work angle near 90° so both bevel walls fuse evenly.',
      'Maintain consistent speed and tight arc length from start tab to run-off.',
    ],
    passThreshold: 75,
  },
  {
    id: 'ex-smaw-e6010-2g',
    title: 'Level 2 Guided · SMAW E6010 2G Horizontal Groove',
    level: 2,
    modeDefault: 'guided',
    recommendedProcess: 'SMAW',
    recommendedElectrode: 'E6010',
    recommendedPosition: '2G',
    recommendedJoint: 'v-groove',
    targetAmpsRange: [85, 110],
    targetTravelSpeedIpm: [6.0, 9.0],
    targetTravelAngleDeg: [10, 20],
    targetWorkAngleDeg: [80, 90],
    targetArcLengthMm: [2.0, 3.4],
    recommendedPolarity: 'DCEP',
    recommendedDiameterIn: 0.125,
    recommendedThicknessIn: 0.375,
    canadianCodeNote: '2G gravity pulls molten puddle downward; aim ~5° upward into top bevel wall to prevent bottom overlap.',
    steps: [
      'Set 1/8" E6010 on DCEP at ~95 A for controlled root/hot pass penetration.',
      'Tilt work angle slightly upward (~83°–86°) to support puddle shelf against gravity.',
      'Maintain steady travel speed so slag stays behind the arc.',
    ],
    passThreshold: 75,
  },
  {
    id: 'ex-smaw-e7018-3f-up',
    title: 'Level 2 Guided · SMAW E7018 3F Vertical-Up Fillet',
    level: 2,
    modeDefault: 'guided',
    recommendedProcess: 'SMAW',
    recommendedElectrode: 'E7018',
    recommendedPosition: '3F-UP',
    recommendedJoint: 't-fillet',
    targetAmpsRange: [95, 115],
    targetTravelSpeedIpm: [3.8, 5.8],
    targetTravelAngleDeg: [5, 15],
    targetWorkAngleDeg: [40, 50],
    targetArcLengthMm: [1.5, 2.5],
    recommendedPolarity: 'DCEP',
    recommendedDiameterIn: 0.125,
    recommendedThicknessIn: 0.375,
    canadianCodeNote: 'Drop amperage ~10–15% below flat position. Tight arc prevents slag roll-over and excessive crown.',
    steps: [
      'Lower current to 100–110 A on 1/8" E7018 DCEP for vertical-up control.',
      'Point electrode slightly upward (5–12° push/upward tilt) to hold the puddle shelf.',
      'Use small side-to-side toe pauses or steady stringer upward without rushing.',
    ],
    passThreshold: 75,
  },
  {
    id: 'ex-smaw-e6010-3g-down',
    title: 'Level 2 Guided · SMAW E6010 3G Vertical-Down Progression',
    level: 2,
    modeDefault: 'guided',
    recommendedProcess: 'SMAW',
    recommendedElectrode: 'E6010',
    recommendedPosition: '3G-DOWN',
    recommendedJoint: 'v-groove',
    targetAmpsRange: [95, 120],
    targetTravelSpeedIpm: [7.5, 11.5],
    targetTravelAngleDeg: [15, 28],
    targetWorkAngleDeg: [85, 95],
    targetArcLengthMm: [1.8, 3.0],
    recommendedPolarity: 'DCEP',
    recommendedDiameterIn: 0.125,
    recommendedThicknessIn: 0.25,
    canadianCodeNote: 'Downhill progression outruns slag using fast-freeze E6010. Keep speed crisp so slag does not trap ahead of puddle.',
    steps: [
      'Select 3G-DOWN with E6010 (1/8", DCEP, 105 A).',
      'Angle electrode upward ~20° drag-back so arc force blows slag away from leading edge.',
      'Travel briskly (8–10 IPM) downward while keeping a tight arc.',
    ],
    passThreshold: 75,
  },
  {
    id: 'ex-fcaw-g-2f',
    title: 'Level 2 Shop · FCAW-G (E71T-1) 2F Horizontal Fillet',
    level: 2,
    modeDefault: 'guided',
    recommendedProcess: 'FCAW-G',
    recommendedElectrode: 'E71T-1',
    recommendedPosition: '2F',
    recommendedJoint: 't-fillet',
    targetAmpsRange: [175, 225],
    targetVoltageRange: [24, 27],
    targetWfsRange: [260, 340],
    targetTravelSpeedIpm: [8.5, 12.5],
    targetTravelAngleDeg: [10, 20],
    targetWorkAngleDeg: [40, 50],
    targetArcLengthMm: [2.0, 3.5],
    recommendedPolarity: 'DCEP',
    recommendedDiameterIn: 0.045,
    recommendedThicknessIn: 0.5,
    canadianCodeNote: 'CV DCEP with shielding gas (35 CFH). "If there is slag, you drag" — use 10–20° drag angle to prevent slag inclusions.',
    steps: [
      'Confirm FCAW-G (E71T-1, 0.045"), 25.5 V, 300 IPM wire feed, and 35 CFH gas flow.',
      'Use a 12–18° drag angle (never heavy push with flux-cored wire).',
      'Maintain smooth 9–11 IPM travel speed along the horizontal fillet.',
    ],
    passThreshold: 75,
  },
  {
    id: 'ex-fcaw-s-3g',
    title: 'Level 3 Field · FCAW-S (E71T-8) 3G Vertical-Up',
    level: 3,
    modeDefault: 'guided',
    recommendedProcess: 'FCAW-S',
    recommendedElectrode: 'E71T-8',
    recommendedPosition: '3G-UP',
    recommendedJoint: 'v-groove',
    targetAmpsRange: [165, 210],
    targetVoltageRange: [19.5, 22.0],
    targetWfsRange: [170, 230],
    targetTravelSpeedIpm: [5.5, 8.5],
    targetTravelAngleDeg: [8, 18],
    targetWorkAngleDeg: [85, 95],
    targetArcLengthMm: [2.2, 3.8],
    recommendedPolarity: 'DCEN',
    recommendedDiameterIn: 0.068,
    recommendedThicknessIn: 0.5,
    canadianCodeNote: 'E71T-8 runs on DCEN (straight polarity) with no external gas cylinder—widely used in field tank & structural erection.',
    steps: [
      'Verify DCEN polarity and lower voltage (~20.5 V) for out-of-position puddle control.',
      'Hold steady upward progression without excessive weave width.',
    ],
    passThreshold: 75,
  },
  {
    id: 'ex-smaw-e7018-4f',
    title: 'Level 3 Overhead · SMAW E7018 4F Overhead Fillet',
    level: 3,
    modeDefault: 'guided',
    recommendedProcess: 'SMAW',
    recommendedElectrode: 'E7018',
    recommendedPosition: '4F',
    recommendedJoint: 't-fillet',
    targetAmpsRange: [105, 125],
    targetTravelSpeedIpm: [5.5, 8.0],
    targetTravelAngleDeg: [8, 16],
    targetWorkAngleDeg: [38, 48],
    targetArcLengthMm: [1.4, 2.5],
    recommendedPolarity: 'DCEP',
    recommendedDiameterIn: 0.125,
    recommendedThicknessIn: 0.375,
    canadianCodeNote: '4F Overhead: shorten arc length to let arc plasma force push molten metal up into the root.',
    steps: [
      'Set 1/8" E7018 DCEP around 115 A.',
      'Keep arc tight (< 2.4 mm) and avoid hovering too long in one spot.',
    ],
    passThreshold: 78,
  },
  {
    id: 'ex-smaw-e7018-4g-test',
    title: 'Skills Test · SMAW E7018 4G Overhead Groove Inspection',
    level: 3,
    modeDefault: 'skills-test',
    recommendedProcess: 'SMAW',
    recommendedElectrode: 'E7018',
    recommendedPosition: '4G',
    recommendedJoint: 'v-groove',
    targetAmpsRange: [105, 125],
    targetTravelSpeedIpm: [5.2, 7.6],
    targetTravelAngleDeg: [8, 16],
    targetWorkAngleDeg: [85, 95],
    targetArcLengthMm: [1.4, 2.5],
    recommendedPolarity: 'DCEP',
    recommendedDiameterIn: 0.125,
    recommendedThicknessIn: 0.375,
    canadianCodeNote: 'Simulated skills test (for training feedback only—not an official CWB/TSSA qualification test).',
    steps: [
      'Configure machine parameters correctly without guided target bands.',
      'Complete a uniform, defect-free 4G overhead pass scoring >= 80%.',
    ],
    passThreshold: 80,
  },
];

export interface InstantPoseInput {
  arcLengthMm: number;
  travelAngleDeg: number;
  workAngleDeg: number;
  travelSpeedIpm: number;
  lateralOffsetMm: number;
  electrodeRemainingPct: number;
}

export function getDefaultMachineSettings(exercise?: WeldingTrainingExercise): MachineSettings {
  const ex = exercise ?? WELDING_EXERCISES[0];
  const avgAmps = Math.round((ex.targetAmpsRange[0] + ex.targetAmpsRange[1]) / 2);
  const avgVolts = ex.targetVoltageRange
    ? Number(((ex.targetVoltageRange[0] + ex.targetVoltageRange[1]) / 2).toFixed(1))
    : 23.0;
  const avgWfs = ex.targetWfsRange
    ? Math.round((ex.targetWfsRange[0] + ex.targetWfsRange[1]) / 2)
    : 280;
  return {
    process: ex.recommendedProcess,
    electrode: ex.recommendedElectrode,
    position: ex.recommendedPosition,
    jointPrep: ex.recommendedJoint,
    polarity: ex.recommendedPolarity,
    amperage: avgAmps,
    voltage: avgVolts,
    wireFeedSpeedIpm: avgWfs,
    electrodeDiameterIn: ex.recommendedDiameterIn,
    materialThicknessIn: ex.recommendedThicknessIn,
    gasFlowCfh: ex.recommendedProcess === 'FCAW-G' || ex.recommendedProcess === 'GMAW' || ex.recommendedProcess === 'GTAW' ? 35 : 0,
  };
}

export function getRecommendedAmpRange(settings: MachineSettings): [number, number] {
  const profile = ELECTRODE_PROFILES[settings.electrode];
  const exact = profile.ampWindowByDiameter[settings.electrodeDiameterIn];
  if (exact) return exact;
  const entries = Object.values(profile.ampWindowByDiameter);
  return entries[0] ?? [90, 140];
}

export function computeEffectiveAmperage(settings: MachineSettings): number {
  if (settings.process === 'FCAW-G' || settings.process === 'FCAW-S' || settings.process === 'GMAW') {
    // Wire feed speed largely governs amperage on CV machines (~0.55-0.85 A per IPM depending on wire dia)
    const diaScale = settings.electrodeDiameterIn >= 0.062 ? 0.92 : settings.electrodeDiameterIn >= 0.045 ? 0.68 : 0.56;
    return Math.round(settings.wireFeedSpeedIpm * diaScale + (settings.voltage - 20) * 3);
  }
  return settings.amperage;
}

export function computeInstantWeldPhysics(
  settings: MachineSettings,
  pose: InstantPoseInput
): WeldInstantMetrics {
  const profile = ELECTRODE_PROFILES[settings.electrode];
  const [minAmp, maxAmp] = getRecommendedAmpRange(settings);
  const amps = computeEffectiveAmperage(settings);

  // Arc voltage: CC SMAW/GTAW rises with arc length; CV FCAW/GMAW stays close to machine voltage
  const isCV = settings.process === 'FCAW-G' || settings.process === 'FCAW-S' || settings.process === 'GMAW';
  const arcVoltageLive = isCV
    ? Number((settings.voltage + (pose.arcLengthMm - 2.8) * 0.45).toFixed(1))
    : Number((18.5 + amps * 0.032 + pose.arcLengthMm * 1.9).toFixed(1));

  const safeSpeed = Math.max(1.2, pose.travelSpeedIpm);
  const heatInputKjPerIn = Number(((arcVoltageLive * amps * 60) / (safeSpeed * 1000)).toFixed(2));

  const warnings: string[] = [];
  let stability = 96;

  // Polarity validation
  const polarityOk = profile.preferredPolarities.includes(settings.polarity);
  if (!polarityOk) {
    stability -= 32;
    warnings.push(
      `Wrong polarity (${settings.polarity}) for ${settings.electrode}. Recommended: ${profile.preferredPolarities.join(' or ')}.`
    );
  }

  // Vertical-down check for E7018 / FCAW
  const isVertDown = settings.position === '3F-DOWN' || settings.position === '3G-DOWN';
  if (isVertDown && !profile.verticalDownAllowed) {
    stability -= 22;
    warnings.push(`${settings.electrode} is not suited for vertical-down progression (risk of slag entrapment and weak fusion).`);
  }

  // Electrode consumed check
  if (pose.electrodeRemainingPct <= 4 && (settings.process === 'SMAW' || settings.process === 'PIPE')) {
    stability -= 25;
    warnings.push('Electrode stub reached — change rod.');
  }

  // Arc length stability
  const [minArc, maxArc] = profile.nominalArcLengthMm;
  if (pose.arcLengthMm < 1.0) {
    stability -= 35;
    warnings.push('Arc length too tight — electrode sticking into puddle.');
  } else if (pose.arcLengthMm > maxArc + 1.8) {
    stability -= 32;
    warnings.push('Long-arcing detected — excessive spatter, undercut, and porosity risk.');
  } else if (pose.arcLengthMm > maxArc) {
    stability -= 14;
  } else if (pose.arcLengthMm < minArc) {
    stability -= 8;
  }

  // Current window vs electrode diameter
  if (amps < minAmp - 15) {
    stability -= 24;
    warnings.push(`Current (${amps} A) too cold for ${settings.electrodeDiameterIn}" ${settings.electrode}.`);
  } else if (amps < minAmp) {
    stability -= 10;
  } else if (amps > maxAmp + 20) {
    stability -= 24;
    warnings.push(`Current (${amps} A) too hot for ${settings.electrodeDiameterIn}" ${settings.electrode}.`);
  } else if (amps > maxAmp) {
    stability -= 10;
  }

  // Shielding gas check for gas-shielded processes
  const needsGas = settings.process === 'FCAW-G' || settings.process === 'GMAW' || settings.process === 'GTAW';
  const missingGas = needsGas && settings.gasFlowCfh < 20;
  if (missingGas) {
    stability -= 28;
    warnings.push(`Shielding gas flow (${settings.gasFlowCfh} CFH) too low for ${settings.process} — severe porosity risk.`);
  }

  // Angle penalties
  const posMeta = WELDING_POSITIONS.find((p) => p.id === settings.position) ?? WELDING_POSITIONS[0];
  const workErr = Math.abs(pose.workAngleDeg - posMeta.idealWorkAngleDeg);
  const [minTravelDeg, maxTravelDeg] = profile.nominalTravelAngleDeg;
  const travelErr =
    pose.travelAngleDeg < minTravelDeg
      ? minTravelDeg - pose.travelAngleDeg
      : pose.travelAngleDeg > maxTravelDeg
      ? pose.travelAngleDeg - maxTravelDeg
      : 0;

  if (workErr > 18) stability -= 12;
  if (travelErr > 15) stability -= 12;

  // Position gravity factor
  const outOfPosition = settings.position.startsWith('3') || settings.position.startsWith('4');
  const posHeatMultiplier = outOfPosition ? 0.92 : 1.0;

  // Bead geometry (mm)
  const rawWidth =
    (4.2 + (heatInputKjPerIn * 0.14) * profile.depositionFactor) *
    (1 + Math.max(-0.25, Math.min(0.35, (6.5 - safeSpeed) * 0.05))) *
    (1 + Math.max(0, pose.arcLengthMm - 2.5) * 0.08);

  const beadWidthMm = Number(Math.max(3.5, Math.min(18.0, rawWidth)).toFixed(1));

  const rawReinforcement =
    (1.4 + (amps / Math.max(40, safeSpeed * 12)) * 1.15 * profile.depositionFactor) *
    (outOfPosition ? 1.12 : 1.0);
  const reinforcementMm = Number(Math.max(0.5, Math.min(6.0, rawReinforcement)).toFixed(1));

  const rawPenetration =
    (1.2 + (amps / 100) * 1.6 * profile.penetrationFactor * posHeatMultiplier) *
    (polarityOk ? 1.0 : 0.65) *
    (1 - Math.max(0, pose.arcLengthMm - 3.5) * 0.12) *
    (safeSpeed > 11 ? 0.8 : 1.0);
  const penetrationMm = Number(Math.max(0.4, Math.min(8.0, rawPenetration)).toFixed(1));

  // Defect detection rules
  const thicknessMm = settings.materialThicknessIn * 25.4;
  const excessiveHeat = heatInputKjPerIn > 45 || amps > maxAmp + 12;
  const coldHeat = heatInputKjPerIn < 14 || amps < minAmp - 10;

  const undercut =
    (amps > maxAmp && safeSpeed > 8.5) ||
    (pose.arcLengthMm > maxArc + 1.2 && amps >= minAmp) ||
    (workErr > 16 && amps > minAmp) ||
    (outOfPosition && amps > maxAmp - 5 && safeSpeed < 4.0);

  const porosity =
    missingGas ||
    pose.arcLengthMm > maxArc + 1.5 ||
    (!polarityOk && settings.process === 'SMAW' && pose.arcLengthMm > 3.2);

  const overlap =
    (safeSpeed < 3.4 && coldHeat) ||
    (outOfPosition && safeSpeed < 3.0 && heatInputKjPerIn > 38) ||
    (workErr > 22 && safeSpeed < 5.0);

  const excessiveBuildup = safeSpeed < 3.5 || reinforcementMm > 4.1;

  const incompleteFusion =
    coldHeat ||
    !polarityOk ||
    Math.abs(pose.lateralOffsetMm) > 3.2 ||
    (isVertDown && !profile.verticalDownAllowed) ||
    penetrationMm < 1.2;

  const burnThrough =
    heatInputKjPerIn > 58 && thicknessMm <= 6.5 && safeSpeed < 4.5;

  const arcBlowOrErratic = stability < 65;

  if (undercut) warnings.push('Undercut forming along toe — lower amps, shorten arc, or adjust work angle.');
  if (overlap) warnings.push('Cold lap / overlap risk — increase current or keep arc on leading edge.');
  if (excessiveBuildup) warnings.push('Excessive convex crown — increase travel speed.');
  if (burnThrough) warnings.push('Excessive heat input on thin plate — risk of burn-through.');

  let fusionIndex = 96;
  if (undercut) fusionIndex -= 16;
  if (porosity) fusionIndex -= 24;
  if (overlap) fusionIndex -= 18;
  if (excessiveBuildup) fusionIndex -= 12;
  if (incompleteFusion) fusionIndex -= 22;
  if (burnThrough) fusionIndex -= 28;
  fusionIndex = Math.max(15, Math.min(100, Math.round(fusionIndex)));

  const clampedStability = Math.max(10, Math.min(100, Math.round(stability)));
  const spatterIntensity = Math.min(
    1,
    Math.max(
      0.08,
      (pose.arcLengthMm > maxArc ? 0.35 : 0.1) +
        (amps > maxAmp ? 0.25 : 0) +
        (!polarityOk ? 0.35 : 0) +
        (settings.electrode === 'E6010' || settings.electrode === 'E71T-8' ? 0.15 : 0)
    )
  );

  const defects: WeldDefectFlags = {
    undercut,
    porosity,
    overlap,
    excessiveBuildup,
    incompleteFusion,
    burnThrough,
    arcBlowOrErratic,
  };

  return {
    arcActive: true,
    arcVoltageLive,
    arcStability: clampedStability,
    heatInputKjPerIn,
    beadWidthMm,
    reinforcementMm,
    penetrationMm,
    fusionIndex,
    spatterIntensity,
    defects,
    warnings: Array.from(new Set(warnings)),
  };
}

export function evaluateWeldSession(
  settings: MachineSettings,
  samples: WeldSamplePoint[],
  exercise?: WeldingTrainingExercise
): WeldPerformanceReport {
  if (samples.length === 0) {
    return {
      overallScore: 0,
      arcStabilityScore: 0,
      angleAccuracyScore: 0,
      travelSpeedScore: 0,
      arcLengthScore: 0,
      fusionQualityScore: 0,
      avgHeatInputKjPerIn: 0,
      avgTravelSpeedIpm: 0,
      avgArcLengthMm: 0,
      avgTravelAngleDeg: 0,
      avgWorkAngleDeg: 0,
      weldLengthInches: 0,
      defectCounts: {
        undercut: 0,
        porosity: 0,
        overlap: 0,
        excessiveBuildup: 0,
        incompleteFusion: 0,
        burnThrough: 0,
      },
      mistakes: ['No weld bead was deposited along the joint.'],
      corrections: ['Hold down the weld trigger/spacebar and travel steadily along the joint seam.'],
      simulationDisclaimer:
        'Simulated educational welding metrics only — does not constitute real CWB, ASME Section IX, or TSSA weld inspection or certification.',
    };
  }

  const profile = ELECTRODE_PROFILES[settings.electrode];
  const posMeta = WELDING_POSITIONS.find((p) => p.id === settings.position) ?? WELDING_POSITIONS[0];

  const targetSpeed = exercise?.targetTravelSpeedIpm ?? [5.5, 8.5];
  const targetTravel = exercise?.targetTravelAngleDeg ?? profile.nominalTravelAngleDeg;
  const targetWork = exercise?.targetWorkAngleDeg ?? [posMeta.idealWorkAngleDeg - 6, posMeta.idealWorkAngleDeg + 6];
  const targetArc = exercise?.targetArcLengthMm ?? profile.nominalArcLengthMm;

  const n = samples.length;
  let sumStability = 0;
  let sumFusion = 0;
  let sumHeat = 0;
  let sumSpeed = 0;
  let sumArc = 0;
  let sumTravelAngle = 0;
  let sumWorkAngle = 0;
  let angleScoreAccum = 0;
  let speedScoreAccum = 0;
  let arcScoreAccum = 0;

  const defectCounts = {
    undercut: 0,
    porosity: 0,
    overlap: 0,
    excessiveBuildup: 0,
    incompleteFusion: 0,
    burnThrough: 0,
  };

  for (const s of samples) {
    sumStability += s.arcStability;
    sumFusion += s.fusionScore;
    sumHeat += s.heatInputKjPerIn;
    sumSpeed += s.travelSpeedIpm;
    sumArc += s.arcLengthMm;
    sumTravelAngle += s.travelAngleDeg;
    sumWorkAngle += s.workAngleDeg;

    const workMid = (targetWork[0] + targetWork[1]) / 2;
    const travelMid = (targetTravel[0] + targetTravel[1]) / 2;
    const workPenalty = Math.max(0, Math.abs(s.workAngleDeg - workMid) - 5) * 2.5;
    const travelPenalty = Math.max(0, Math.abs(s.travelAngleDeg - travelMid) - 5) * 2.0;
    const seamPenalty = Math.max(0, Math.abs(s.lateralOffsetMm) - 1.5) * 6;
    angleScoreAccum += Math.max(20, 100 - workPenalty - travelPenalty - seamPenalty);

    const speedMid = (targetSpeed[0] + targetSpeed[1]) / 2;
    const speedHalfSpan = (targetSpeed[1] - targetSpeed[0]) / 2;
    const speedOut = Math.max(0, Math.abs(s.travelSpeedIpm - speedMid) - speedHalfSpan);
    speedScoreAccum += Math.max(20, 100 - speedOut * 18);

    const arcMid = (targetArc[0] + targetArc[1]) / 2;
    const arcHalfSpan = (targetArc[1] - targetArc[0]) / 2;
    const arcOut = Math.max(0, Math.abs(s.arcLengthMm - arcMid) - arcHalfSpan);
    arcScoreAccum += Math.max(15, 100 - arcOut * 28);

    if (s.defects.undercut) defectCounts.undercut++;
    if (s.defects.porosity) defectCounts.porosity++;
    if (s.defects.overlap) defectCounts.overlap++;
    if (s.defects.excessiveBuildup) defectCounts.excessiveBuildup++;
    if (s.defects.incompleteFusion) defectCounts.incompleteFusion++;
    if (s.defects.burnThrough) defectCounts.burnThrough++;
  }

  const arcStabilityScore = Math.round(sumStability / n);
  const angleAccuracyScore = Math.round(angleScoreAccum / n);
  const travelSpeedScore = Math.round(speedScoreAccum / n);
  const arcLengthScore = Math.round(arcScoreAccum / n);
  const fusionQualityScore = Math.round(sumFusion / n);

  // Coverage span along 6-inch coupon
  const minP = Math.min(...samples.map((s) => s.progress));
  const maxP = Math.max(...samples.map((s) => s.progress));
  const coverageRatio = Math.max(0, Math.min(1, maxP - minP));
  const weldLengthInches = Number((coverageRatio * 6.0).toFixed(2));
  const lengthPenalty = coverageRatio < 0.7 ? Math.round((0.7 - coverageRatio) * 40) : 0;

  const overallScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        arcStabilityScore * 0.2 +
          angleAccuracyScore * 0.2 +
          travelSpeedScore * 0.2 +
          arcLengthScore * 0.2 +
          fusionQualityScore * 0.2 -
          lengthPenalty
      )
    )
  );

  const avgHeatInputKjPerIn = Number((sumHeat / n).toFixed(2));
  const avgTravelSpeedIpm = Number((sumSpeed / n).toFixed(1));
  const avgArcLengthMm = Number((sumArc / n).toFixed(2));
  const avgTravelAngleDeg = Math.round(sumTravelAngle / n);
  const avgWorkAngleDeg = Math.round(sumWorkAngle / n);

  const mistakes: string[] = [];
  const corrections: string[] = [];

  if (!profile.preferredPolarities.includes(settings.polarity)) {
    mistakes.push(`Incorrect polarity (${settings.polarity}) selected for ${settings.electrode}.`);
    corrections.push(`Switch polarity to ${profile.preferredPolarities.join(' or ')} before striking the arc.`);
  }
  if (defectCounts.undercut > Math.max(2, n * 0.15)) {
    mistakes.push('Undercut observed along the weld toes.');
    corrections.push('Hold a tighter arc length, reduce amperage slightly, or dwell slightly longer at toes.');
  }
  if (defectCounts.porosity > Math.max(1, n * 0.1)) {
    mistakes.push('Porosity pockets detected in weld bead.');
    corrections.push(
      settings.process === 'FCAW-G' || settings.process === 'GMAW' || settings.process === 'GTAW'
        ? 'Check shielding gas regulator (30–40 CFH) and keep nozzle close to the joint.'
        : 'Shorten your arc length—long-arcing pulls atmospheric nitrogen into the molten puddle.'
    );
  }
  if (defectCounts.excessiveBuildup > Math.max(2, n * 0.2)) {
    mistakes.push(`Excessive bead crown/buildup (avg speed ${avgTravelSpeedIpm} IPM).`);
    corrections.push(`Increase travel speed toward ${targetSpeed[0]}–${targetSpeed[1]} IPM so the puddle stays flat and uniform.`);
  }
  if (defectCounts.incompleteFusion > Math.max(2, n * 0.18)) {
    mistakes.push('Zones of incomplete fusion or centerline drift detected.');
    corrections.push('Stay centered on the joint root, verify adequate amperage for plate thickness, and watch puddle tie-in on both walls.');
  }
  if (defectCounts.overlap > Math.max(2, n * 0.15)) {
    mistakes.push('Overlap / cold lap where weld metal rolled over unfused base metal.');
    corrections.push('Raise current or keep the arc leading the front edge of the molten puddle.');
  }
  if (coverageRatio < 0.7) {
    mistakes.push(`Short weld coupon coverage (${weldLengthInches} in of 6.00 in joint welded).`);
    corrections.push('Complete at least 4.5–5.5 inches of continuous travel to evaluate bead consistency.');
  }

  if (mistakes.length === 0) {
    corrections.push('Solid bead profile and heat input control. Try advancing to out-of-position 3F/3G or 4F/4G joints next.');
  }

  return {
    overallScore,
    arcStabilityScore,
    angleAccuracyScore,
    travelSpeedScore,
    arcLengthScore,
    fusionQualityScore,
    avgHeatInputKjPerIn,
    avgTravelSpeedIpm,
    avgArcLengthMm,
    avgTravelAngleDeg,
    avgWorkAngleDeg,
    weldLengthInches,
    defectCounts,
    mistakes,
    corrections,
    simulationDisclaimer:
      'Simulated educational welding metrics only — does not constitute real CWB, ASME Section IX, or TSSA weld inspection or certification.',
  };
}

export interface DefectQuizQuestion {
  id: string;
  defectName: string;
  visualClue: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export const WELD_DEFECT_QUIZ: DefectQuizQuestion[] = [
  {
    id: 'dq-undercut',
    defectName: 'External Undercut',
    visualClue: 'A continuous groove melted into the base metal directly along the upper toe of a 2F/3F fillet, leaving a sharp notch unfilled by weld metal.',
    question: 'Which adjustment most effectively eliminates toe undercut in SMAW E7018?',
    options: [
      'Reduce excessive amperage, tighten arc length, and pause briefly on the toes to fill the groove',
      'Double travel speed and lengthen arc to 6 mm',
      'Switch E7018 to vertical-down progression',
      'Increase voltage above 32 V while pushing at 35 degrees',
    ],
    correctIndex: 0,
    explanation: 'Undercut happens when high arc energy melts the base plate toe without letting filler metal wash back in. Lowering amps slightly, shortening the arc, and pausing at toes cures it.',
  },
  {
    id: 'dq-porosity',
    defectName: 'Cluster / Wormhole Porosity',
    visualClue: 'Pinholes and elongated gas cavities breaking through the top surface of an FCAW-G (E71T-1) shop weld.',
    question: 'On a shop FCAW-G joint, what is the first machine/setup check when sudden surface porosity appears?',
    options: [
      'Verify shielding gas cylinder valve, hose leaks, nozzle spatter blockage, and 30–40 CFH flow rate',
      'Increase wire-feed speed by 150 IPM',
      'Switch from DCEP to AC polarity',
      'Chip the slag faster while the bead is still orange',
    ],
    correctIndex: 0,
    explanation: 'Loss of shielding gas (empty bottle, wind draft, clogged diffuser, or kinked hose) starves the molten pool of CO2/Argon protection, causing immediate gas porosity.',
  },
  {
    id: 'dq-slag-inclusion',
    defectName: 'Linear Slag Inclusion',
    visualClue: 'Subsurface dark non-metallic pockets trapped along the root corner of a multi-pass groove weld (revealed on RT/bend test).',
    question: 'How does welding technique cause slag inclusions in SMAW or FCAW?',
    options: [
      'Pushing the puddle instead of dragging ("if there is slag, you drag") or failing to clean interpass slag thoroughly',
      'Using an overly tight work angle of exactly 90 degrees in 1G',
      'Storing E7018 electrodes inside a heated 275°F rod oven',
      'Preheating thick SA-516 plate to 200°F',
    ],
    correctIndex: 0,
    explanation: 'A push angle forces molten slag ahead of the arc where the weld freezes over it. Always drag slag-forming processes (SMAW/FCAW) 10–20° and wire-wheel interpass toes clean.',
  },
  {
    id: 'dq-cold-lap',
    defectName: 'Overlap (Cold Lap)',
    visualClue: 'Weld metal protrudes over the base plate toe like a mushroom shelf with zero fusion underneath.',
    question: 'What is the primary cause of weld overlap / cold lap?',
    options: [
      'Low amperage / insufficient heat input combined with slow travel letting molten metal spill onto cold base plate',
      'Excessive preheat temperature on thin plate',
      'Too steep a bevel angle (75° included)',
      'Using DCEP on E6010 open root',
    ],
    correctIndex: 0,
    explanation: 'Cold lap occurs when filler metal melts faster than the base metal wets out—often from low amps, slow speed, or poor work angle.',
  },
  {
    id: 'dq-hydrogen-crack',
    defectName: 'Delayed Cold Cracking (HAZ)',
    visualClue: 'Fine underbead crack appearing 12–24 hours after welding thick 1-1/4" SA-516 Gr. 70 pressure vessel shell.',
    question: 'Which combination prevents hydrogen-induced cold cracking in carbon steel vessel fabrication?',
    options: [
      'Properly baked low-hydrogen E7018 rods, dry clean joint prep, and code-specified preheat/interpass temperature',
      'Quenching the weld immediately with compressed air and water',
      'Welding with damp E6013 rods straight out of an open cardboard box',
      'Increasing travel speed to 25 IPM to eliminate heat input',
    ],
    correctIndex: 0,
    explanation: 'Hydrogen cracking requires diffusible hydrogen + tensile stress + susceptible hard HAZ microstructure. Low-H consumables plus preheat slow cooling and let hydrogen diffuse out.',
  },
];
