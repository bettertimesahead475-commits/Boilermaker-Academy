import { Question, TopicDomain } from '../types/academy';
import { DIAGNOSTIC_QUESTIONS } from './diagnosticQuestions';
import { LEVEL_1_LESSONS } from './lessonsLevel1';
import { LEVEL_2_LESSONS } from './lessonsLevel2';
import { LEVEL_3_LESSONS } from './lessonsLevel3';

export const ALL_LESSONS = [...LEVEL_1_LESSONS, ...LEVEL_2_LESSONS, ...LEVEL_3_LESSONS];

const EXTRA_L2_L3_REDSEAL_QUESTIONS: Question[] = [
  // LEVEL 2 EXTRA
  {
    id: 'l2-ex-1',
    level: 2,
    domain: 'Rigging',
    knowledgeType: 'Theoretical',
    prompt: 'A 20,000 lb exchanger shell has lifting lugs 20 ft apart. Its Centre of Gravity is 6 ft from Lug A and 14 ft from Lug B. What vertical load does Lug A carry?',
    options: ['14,000 lb', '6,000 lb', '10,000 lb', '12,000 lb'],
    correctIndex: 0,
    explanation: 'Lug A carries (20,000 × 14) ÷ 20 = 14,000 lb (the lug closest to the CG carries the larger share).',
    formula: 'L_A = (W × d_B) / D',
    lessonId: 'l2-rigging-cg-charts',
  },
  {
    id: 'l2-ex-2',
    level: 2,
    domain: 'Rigging',
    knowledgeType: 'Practical',
    prompt: 'A mobile crane load chart lists 28,000 lb gross capacity at a 40 ft radius. Your hook block weighs 1,100 lb, stowed jib deduction is 600 lb, and slings/shackles weigh 500 lb. What is the maximum payload you can lift?',
    options: ['25,800 lb', '28,000 lb', '26,900 lb', '26,300 lb'],
    correctIndex: 0,
    explanation: 'Total deductions = 1,100 + 600 + 500 = 2,200 lb. Net payload = 28,000 - 2,200 = 25,800 lb.',
    formula: 'Net Capacity = Gross Chart Capacity - All Deductions',
    lessonId: 'l2-rigging-cg-charts',
  },
  {
    id: 'l2-ex-3',
    level: 2,
    domain: 'Rigging',
    knowledgeType: 'Theoretical',
    prompt: 'With 6 parts of line and 6 active sheaves at 5% friction per sheave, what is the estimated lead line pull for a 30,000 lb load?',
    options: ['6,500 lb', '5,000 lb', '7,500 lb', '5,800 lb'],
    correctIndex: 0,
    explanation: 'Ideal pull = 30,000 ÷ 6 = 5,000 lb. Multiplier = 1 + (0.05 × 6) = 1.30. Pull = 5,000 × 1.30 = 6,500 lb.',
    formula: 'Lead Pull = (W / Parts) × (1 + f × Sheaves)',
    lessonId: 'l2-rigging-reeving',
  },
  {
    id: 'l2-ex-4',
    level: 2,
    domain: 'Fabrication',
    knowledgeType: 'Theoretical',
    prompt: 'Which pattern development method is used to lay out a 4-piece 90° mitered pipe elbow?',
    options: ['Parallel-line development', 'Radial-line development', 'Triangulation', 'Conic projection'],
    correctIndex: 0,
    explanation: 'Cylindrical elbows and tee branches have parallel surface elements, making Parallel-Line Development exact.',
    lessonId: 'l2-fab-plate-layout',
  },
  {
    id: 'l2-ex-5',
    level: 2,
    domain: 'Metallurgy',
    knowledgeType: 'Theoretical',
    prompt: 'A 100 ft run of carbon steel steam piping heats up by 300°F (α = 6.5 × 10⁻⁶ /°F). How much does the pipe expand in length?',
    options: ['2.34 in', '1.17 in', '3.90 in', '0.78 in'],
    correctIndex: 0,
    explanation: 'L = 100 × 12 = 1,200 in. ΔL = 1,200 × 6.5×10⁻⁶ × 300 = 2.34 in.',
    formula: 'ΔL = L × α × ΔT',
    lessonId: 'l2-metallurgy-distortion',
  },
  {
    id: 'l2-ex-6',
    level: 2,
    domain: 'Metallurgy',
    knowledgeType: 'Practical',
    prompt: 'To minimize angular distortion in a thick 1-1/2" structural plate butt weld where both sides are accessible, which joint preparation is best?',
    options: [
      'Double-V groove welded alternately on both sides',
      'Single-V groove with 60° included angle welded from one side only',
      'Square-butt joint welded at maximum amperage',
      'Single-bevel welded with continuous high-weave passes',
    ],
    correctIndex: 0,
    explanation: 'A balanced Double-V groove cuts weld metal volume in half compared to Single-V and balances shrinkage forces across the neutral axis.',
    lessonId: 'l2-metallurgy-distortion',
  },
  {
    id: 'l2-ex-7',
    level: 2,
    domain: 'Industrial Equipment',
    knowledgeType: 'Practical',
    prompt: 'Which boiler component raises steam temperature ABOVE saturation temperature before sending it to a turbine?',
    options: ['Superheater', 'Economizer', 'Mud Drum', 'Attemperator drain'],
    correctIndex: 0,
    explanation: 'A superheater adds sensible heat to dry saturated steam leaving the steam drum.',
    lessonId: 'l2-equipment-vessels-exchangers',
  },
  {
    id: 'l2-ex-8',
    level: 2,
    domain: 'Welding',
    knowledgeType: 'Theoretical',
    prompt: 'Calculate the arc welding heat input for SMAW running at 24 Volts, 130 Amps, and 6 inches per minute travel speed.',
    options: ['31.2 kJ/in', '18.7 kJ/in', '52.0 kJ/in', '15.6 kJ/in'],
    correctIndex: 0,
    explanation: 'HI = (24 × 130 × 60) ÷ (6 × 1000) = 187,200 ÷ 6,000 = 31.2 kJ/in.',
    formula: 'HI = (V × A × 60) / (S × 1000)',
    lessonId: 'l1-welding-oxy-smaw',
  },

  // LEVEL 3 & RED SEAL EXTRA
  {
    id: 'l3-ex-1',
    level: 3,
    domain: 'Rigging',
    knowledgeType: 'Practical',
    prompt: 'During a two-crane tail-up of a heavy vertical vessel from horizontal to upright, when does the main crane carry 100% of the vessel weight?',
    options: [
      'As the vessel approaches vertical (near 85°–90°) and the tailing crane is slacked off',
      'Only at 45° tilt angle',
      'At 0° horizontal lift-off',
      'It never exceeds 50% if both cranes stay hooked',
    ],
    correctIndex: 0,
    explanation: 'Once vertical, the entire vessel weight hangs plumb beneath the top trunnions on the main crane.',
    lessonId: 'l3-advanced-lift-planning',
  },
  {
    id: 'l3-ex-2',
    level: 3,
    domain: 'Industrial Equipment',
    knowledgeType: 'Practical',
    prompt: 'When mechanically rolling boiler tubes into a drum seat, why are serrated grooves machined inside the tubesheet hole?',
    options: [
      'Tube metal flows into the grooves during expansion, dramatically increasing pull-out strength and leak tightness',
      'To allow condensate to drain out behind the tube',
      'To let the tube slide freely during thermal expansion',
      'To reduce the torque required on the expander mandrel by 80%',
    ],
    correctIndex: 0,
    explanation: 'Tube hole grooves create mechanical interlocking rings as the tube wall expands plastically into them.',
    lessonId: 'l3-vessel-boiler-installation',
  },
  {
    id: 'l3-ex-3',
    level: 3,
    domain: 'Industrial Equipment',
    knowledgeType: 'Theoretical',
    prompt: 'Why is the bottom outer perimeter ring of a large API-style aboveground storage tank made of thicker "annular" plate than the interior floor plates?',
    options: [
      'To resist high bending and overturning stresses at the shell-to-bottom corner weld',
      'To serve as a sacrificial corrosion strip for roof rainwater',
      'To make field tacking easier without strongbacks',
      'Because central floor plates never contact stored product',
    ],
    correctIndex: 0,
    explanation: 'The shell-to-bottom corner junction sees concentrated bending moments from hydrostatic pressure and seismic/wind overturning.',
    lessonId: 'l3-vessel-boiler-installation',
  },
  {
    id: 'l3-ex-4',
    level: 3,
    domain: 'Metallurgy',
    knowledgeType: 'Theoretical',
    prompt: 'Which two NDE methods are volumetric (capable of detecting internal sub-surface flaws deep inside thick pressure vessel butt welds)?',
    options: [
      'Radiographic Testing (RT) and Ultrasonic Testing (UT)',
      'Magnetic Particle (MT) and Liquid Penetrant (PT)',
      'Visual Testing (VT) and Vacuum Box Testing',
      'Hardness Testing and Spark Testing',
    ],
    correctIndex: 0,
    explanation: 'RT and UT penetrate the weld thickness; VT, PT, and MT detect surface or very shallow near-surface flaws.',
    lessonId: 'l3-advanced-metallurgy-pwht',
  },
  {
    id: 'l3-ex-5',
    level: 3,
    domain: 'Metallurgy',
    knowledgeType: 'Practical',
    prompt: 'What is the primary metallurgical purpose of Post-Weld Heat Treatment (PWHT) on thick P-1 carbon steel or P-4/P-5 chrome-moly pressure vessels?',
    options: [
      'Relieves locked-in residual welding stresses and tempers hard HAZ martensite below the lower critical temperature',
      'Melts the weld cap flat to eliminate grinding',
      'Increases tensile strength above 150,000 psi via quenching',
      'Carburizes the inner vessel surface for corrosion resistance',
    ],
    correctIndex: 0,
    explanation: 'Sub-critical PWHT relaxes residual stress and restores HAZ ductility/toughness.',
    lessonId: 'l3-advanced-metallurgy-pwht',
  },
  {
    id: 'l3-ex-6',
    level: 3,
    domain: 'Mathematics',
    knowledgeType: 'Practical',
    prompt: 'A 3D pipe rolling offset has Run = 24", Rise = 12", and Set = 9". What is the exact centre-to-centre Travel?',
    options: ['28.28 in', '45.00 in', '26.83 in', '31.50 in'],
    correctIndex: 0,
    explanation: 'True Offset = √(12² + 9²) = √225 = 15". Travel = √(24² + 15²) = √(576 + 225) = √801 = 28.30 in (closest 28.28 in? Wait: √801 = 28.30 in!). Let us verify exact arithmetic.',
    formula: 'Travel = √(Run² + Rise² + Set²)',
    lessonId: 'l3-advanced-math-redseal',
  },
  {
    id: 'l3-ex-7',
    level: 3,
    domain: 'Blueprint Reading',
    knowledgeType: 'Practical',
    prompt: 'On an ASME pressure vessel drawing, what does "PWHT" combined with "100% RT" in the Weld Map / General Notes require before hydrostatic testing?',
    options: [
      'Full radiographic examination of designated seams and code stress-relief heat treatment prior to final hydrotest',
      'Only visual inspection followed by pneumatic soap test',
      'Dye penetrant check after hydrotesting only',
      'Spot radiography of 10% of nozzle tack welds',
    ],
    correctIndex: 0,
    explanation: 'PWHT and 100% RT must be completed and accepted before final pressure testing (and final RT is typically performed after PWHT per code).',
    lessonId: 'l3-advanced-metallurgy-pwht',
  },
  {
    id: 'l3-ex-8',
    level: 3,
    domain: 'Safety',
    knowledgeType: 'Practical',
    prompt: 'Before executing a blind lift (where the crane operator cannot see the load or landing zone), what communication rule applies?',
    options: [
      'A dedicated qualified signaller using reliable radio or relay signals maintains continuous communication with the operator, with an immediate STOP rule if signal is lost',
      'Any apprentice on the ground can shout hand directions to the operator',
      'The crane operator operates at half speed without a signaller',
      'Only horn blasts are permitted during blind picks',
    ],
    correctIndex: 0,
    explanation: 'Only one designated qualified signaller directs the crane; if communication breaks at any instant, the operator must stop all motion immediately.',
    lessonId: 'l3-advanced-lift-planning',
  },
  {
    id: 'l3-ex-9',
    level: 3,
    domain: 'Fabrication',
    knowledgeType: 'Practical',
    prompt: 'Why must nozzle cutouts on heavy pressure vessel shells be smoothly ground and free of sharp thermal-cut notches prior to welding?',
    options: [
      'Sharp notches act as stress risers that can initiate brittle cracking under welding thermal stress or cyclic pressure',
      'To increase the weld throat size automatically',
      'Because oxy-fuel slag increases magnetic permeability',
      'To allow E6010 rods to weld without preheat',
    ],
    correctIndex: 0,
    explanation: 'Removing the heat-affected thermal-cut edge and grinding smooth eliminates micro-cracks and stress concentrators.',
    lessonId: 'l3-vessel-boiler-installation',
  },
];

// Fix exact math on l3-ex-6 so options match √801 = 28.30 in precisely!
EXTRA_L2_L3_REDSEAL_QUESTIONS[13] = {
  id: 'l3-ex-6',
  level: 3,
  domain: 'Mathematics',
  knowledgeType: 'Practical',
  prompt: 'A 3D pipe rolling offset has Run = 20", Rise = 12", and Set = 9". What is the exact centre-to-centre Travel?',
  options: ['25.00 in', '41.00 in', '23.35 in', '29.15 in'],
  correctIndex: 0,
  explanation: 'True Offset = √(12² + 9²) = √225 = 15". Travel = √(20² + 15²) = √(400 + 225) = √625 = 25.00 in.',
  formula: 'Travel = √(Run² + Rise² + Set²)',
  lessonId: 'l3-advanced-math-redseal',
};

// Deterministic Trade-Math & Rigging Variation Generator for up to 100-question mock exams
function buildAlgorithmicQuestions(seedOffset = 0): Question[] {
  const generated: Question[] = [];

  // 10 Sling Tension Variations
  const slingCases = [
    { w: 12000, deg: 30, ans: '12,000 lb', d1: '6,000 lb', d2: '8,485 lb', d3: '10,392 lb' },
    { w: 14000, deg: 45, ans: '9,899 lb', d1: '7,000 lb', d2: '14,000 lb', d3: '8,083 lb' },
    { w: 18000, deg: 60, ans: '10,392 lb', d1: '9,000 lb', d2: '12,728 lb', d3: '18,000 lb' },
    { w: 8000, deg: 30, ans: '8,000 lb', d1: '4,000 lb', d2: '5,657 lb', d3: '16,000 lb' },
    { w: 22000, deg: 45, ans: '15,556 lb', d1: '11,000 lb', d2: '22,000 lb', d3: '12,702 lb' },
  ];
  slingCases.forEach((c, idx) => {
    generated.push({
      id: `gen-rig-${idx + 1}-${seedOffset}`,
      level: idx % 2 === 0 ? 1 : 2,
      domain: 'Rigging',
      knowledgeType: 'Theoretical',
      prompt: `A ${c.w.toLocaleString()} lb boiler casing is lifted with a symmetrical 2-leg bridle at a ${c.deg}° horizontal sling angle. What is the tension in each sling leg?`,
      options: [c.ans, c.d1, c.d2, c.d3],
      correctIndex: 0,
      explanation: `Vertical share = ${(c.w / 2).toLocaleString()} lb. Divide by sin(${c.deg}°) to get ${c.ans}.`,
      formula: 'T = (W / 2) ÷ sin(θ)',
      lessonId: 'l1-rigging-basics',
    });
  });

  // 5 Plate Weight Variations
  const plateCases = [
    { l: 96, w: 48, t: 0.5, ans: '653 lb', d1: '1,307 lb', d2: '490 lb', d3: '817 lb' },
    { l: 120, w: 60, t: 0.75, ans: '1,531 lb', d1: '2,042 lb', d2: '1,021 lb', d3: '1,225 lb' },
    { l: 72, w: 36, t: 1.0, ans: '735 lb', d1: '540 lb', d2: '980 lb', d3: '1,470 lb' },
    { l: 96, w: 60, t: 0.375, ans: '613 lb', d1: '817 lb', d2: '408 lb', d3: '1,225 lb' },
    { l: 144, w: 48, t: 0.5, ans: '980 lb', d1: '1,960 lb', d2: '735 lb', d3: '1,140 lb' },
  ];
  plateCases.forEach((p, idx) => {
    generated.push({
      id: `gen-plate-${idx + 1}-${seedOffset}`,
      level: 1,
      domain: 'Mathematics',
      knowledgeType: 'Practical',
      prompt: `Estimate the weight of a carbon steel plate measuring ${p.w}" × ${p.l}" × ${p.t}" thick (0.2836 lb/in³).`,
      options: [p.ans, p.d1, p.d2, p.d3],
      correctIndex: 0,
      explanation: `Volume = ${p.w} × ${p.l} × ${p.t} = ${(p.w * p.l * p.t).toLocaleString()} in³ × 0.2836 = ${p.ans}.`,
      formula: 'W = L × W × t × 0.2836',
      lessonId: 'l1-math-geometry-pythagoras',
    });
  });

  // 5 Shell Stretch-out Variations
  const shellCases = [
    { od: 36, t: 0.5, ans: '111.53 in', d1: '113.10 in', d2: '109.96 in', d3: '114.67 in' },
    { od: 60, t: 0.75, ans: '186.14 in', d1: '188.50 in', d2: '183.78 in', d3: '190.85 in' },
    { od: 84, t: 1.0, ans: '260.75 in', d1: '263.89 in', d2: '257.61 in', d3: '267.04 in' },
    { od: 42, t: 0.375, ans: '130.77 in', d1: '131.95 in', d2: '129.59 in', d3: '133.12 in' },
    { od: 72, t: 0.5, ans: '224.62 in', d1: '226.19 in', d2: '223.05 in', d3: '227.77 in' },
  ];
  shellCases.forEach((s, idx) => {
    generated.push({
      id: `gen-shell-${idx + 1}-${seedOffset}`,
      level: 2,
      domain: 'Fabrication',
      knowledgeType: 'Practical',
      prompt: `What plate stretch-out length is needed to roll a ${s.od}" OD vessel shell using ${s.t}" thick plate?`,
      options: [s.ans, s.d1, s.d2, s.d3],
      correctIndex: 0,
      explanation: `Mean Diameter = ${s.od} - ${s.t} = ${s.od - s.t} in. Stretch-out = π × ${s.od - s.t} = ${s.ans}.`,
      formula: 'L = π × (OD - t)',
      lessonId: 'l1-math-geometry-pythagoras',
    });
  });

  // 5 CG Distribution Variations
  const cgCases = [
    { w: 18000, d1: 4, d2: 8, ans: '12,000 lb', o1: '6,000 lb', o2: '9,000 lb', o3: '13,500 lb' },
    { w: 25000, d1: 5, d2: 15, ans: '18,750 lb', o1: '6,250 lb', o2: '12,500 lb', o3: '15,000 lb' },
    { w: 30000, d1: 6, d2: 9, ans: '18,000 lb', o1: '12,000 lb', o2: '15,000 lb', o3: '20,000 lb' },
    { w: 16000, d1: 3, d2: 5, ans: '10,000 lb', o1: '6,000 lb', o2: '8,000 lb', o3: '12,000 lb' },
    { w: 40000, d1: 8, d2: 12, ans: '24,000 lb', o1: '16,000 lb', o2: '20,000 lb', o3: '28,000 lb' },
  ];
  cgCases.forEach((cg, idx) => {
    generated.push({
      id: `gen-cg-${idx + 1}-${seedOffset}`,
      level: 2,
      domain: 'Rigging',
      knowledgeType: 'Theoretical',
      prompt: `A ${cg.w.toLocaleString()} lb boiler module has lugs ${cg.d1 + cg.d2} ft apart. Its CG sits ${cg.d1} ft from Lug A and ${cg.d2} ft from Lug B. What vertical load is on Lug A?`,
      options: [cg.ans, cg.o1, cg.o2, cg.o3],
      correctIndex: 0,
      explanation: `Lug A = (${cg.w.toLocaleString()} × ${cg.d2}) ÷ ${cg.d1 + cg.d2} = ${cg.ans}.`,
      formula: 'L_A = (W × d_B) / D',
      lessonId: 'l2-rigging-cg-charts',
    });
  });

  // 5 Pythagorean / Pipe Offset Variations
  const triCases = [
    { run: 12, rise: 16, ans: '20.00 in', d1: '28.00 in', d2: '14.00 in', d3: '22.63 in' },
    { run: 15, rise: 20, ans: '25.00 in', d1: '35.00 in', d2: '21.21 in', d3: '28.28 in' },
    { run: 16, rise: 30, ans: '34.00 in', d1: '46.00 in', d2: '23.00 in', d3: '32.00 in' },
    { run: 14, rise: 14, ans: '19.80 in', d1: '28.00 in', d2: '14.00 in', d3: '21.00 in' },
    { run: 21, rise: 28, ans: '35.00 in', d1: '49.00 in', d2: '24.50 in', d3: '31.50 in' },
  ];
  triCases.forEach((tr, idx) => {
    generated.push({
      id: `gen-tri-${idx + 1}-${seedOffset}`,
      level: 1,
      domain: 'Mathematics',
      knowledgeType: 'Practical',
      prompt: `A pipe offset has a horizontal run of ${tr.run}" and a vertical rise of ${tr.rise}". What is the centre-to-centre travel?`,
      options: [tr.ans, tr.d1, tr.d2, tr.d3],
      correctIndex: 0,
      explanation: `c = √(${tr.run}² + ${tr.rise}²) = ${tr.ans}.`,
      formula: 'c = √(a² + b²)',
      lessonId: 'l1-math-geometry-pythagoras',
    });
  });

  // 5 Unit Conversion Variations
  const convCases = [
    { q: 'Convert 42 1/2 inches to millimetres.', ans: '1,079.5 mm', d1: '1,066.8 mm', d2: '1,092.2 mm', d3: '1,016.0 mm' },
    { q: 'Convert 2,540 millimetres to inches.', ans: '100.00 in', d1: '96.50 in', d2: '105.00 in', d3: '83.33 in' },
    { q: 'Convert 4,500 lb to kilograms.', ans: '2,041 kg', d1: '9,921 kg', d2: '2,250 kg', d3: '1,850 kg' },
    { q: 'Convert 300 psi hydrotest pressure to kilopascals (kPa).', ans: '2,068 kPa', d1: '43.5 kPa', d2: '1,500 kPa', d3: '2,400 kPa' },
    { q: 'Convert a preheat temperature of 300°F to Celsius.', ans: '148.9 °C', d1: '166.7 °C', d2: '121.1 °C', d3: '185.0 °C' },
  ];
  convCases.forEach((cv, idx) => {
    generated.push({
      id: `gen-conv-${idx + 1}-${seedOffset}`,
      level: 1,
      domain: 'Mathematics',
      knowledgeType: 'Theoretical',
      prompt: cv.q,
      options: [cv.ans, cv.d1, cv.d2, cv.d3],
      correctIndex: 0,
      explanation: `Applying exact metric-imperial conversion gives ${cv.ans}.`,
      lessonId: 'l1-math-fractions-conversions',
    });
  });

  // Shuffle options deterministically per question so answer isn't always index 0
  return generated.map((q, idx) => {
    const shift = (idx + seedOffset) % 4;
    if (shift === 0) return q;
    const opts = [...q.options] as [string, string, string, string];
    const correctText = opts[0];
    const rotated: [string, string, string, string] = [
      opts[(4 - shift) % 4],
      opts[(5 - shift) % 4],
      opts[(6 - shift) % 4],
      opts[(7 - shift) % 4],
    ];
    return {
      ...q,
      options: rotated,
      correctIndex: rotated.indexOf(correctText),
    };
  });
}

export function getMasterQuestionPool(): Question[] {
  const lessonFinalQs = ALL_LESSONS.flatMap((l) => l.finalAssessment);
  const basePool = [
    ...DIAGNOSTIC_QUESTIONS,
    ...lessonFinalQs,
    ...EXTRA_L2_L3_REDSEAL_QUESTIONS,
    ...buildAlgorithmicQuestions(1),
    ...buildAlgorithmicQuestions(2),
  ];

  // Deduplicate by prompt text so users never see identical duplicate prompts in one exam
  const seen = new Set<string>();
  const unique: Question[] = [];
  for (const q of basePool) {
    const key = q.prompt.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(q);
    }
  }
  return unique;
}

export function buildExamQuestions(params: {
  mode: 'level1' | 'level2' | 'level3' | 'combined' | 'redseal' | 'topic';
  count: 10 | 25 | 50 | 100;
  topic?: TopicDomain;
}): Question[] {
  const pool = getMasterQuestionPool();
  let filtered: Question[] = [];

  if (params.mode === 'level1') {
    filtered = pool.filter((q) => q.level === 1);
  } else if (params.mode === 'level2') {
    filtered = pool.filter((q) => q.level === 2 || q.level === 1);
    // Prioritize Level 2 first
    filtered.sort((a, b) => (a.level === 2 ? -1 : 1) - (b.level === 2 ? -1 : 1));
  } else if (params.mode === 'level3') {
    filtered = pool.filter((q) => q.level === 3 || q.level === 2);
    filtered.sort((a, b) => (a.level === 3 ? -1 : 1) - (b.level === 3 ? -1 : 1));
  } else if (params.mode === 'topic' && params.topic) {
    filtered = pool.filter((q) => q.domain === params.topic);
  } else {
    // Combined or RedSeal mixes all 3 levels
    filtered = [...pool];
  }

  // Deterministic Fisher-Yates style shuffle seeded lightly by time so each test feels fresh
  const copy = [...filtered];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  // If count exceeds filtered size (e.g. single topic 50q or 100q), supplement from remaining pool cleanly or cap gracefully
  if (copy.length >= params.count) {
    return copy.slice(0, params.count);
  }

  const remainingPool = pool.filter((q) => !copy.some((c) => c.id === q.id));
  return [...copy, ...remainingPool].slice(0, Math.min(params.count, pool.length));
}
