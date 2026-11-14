import { Lesson } from '../types/academy';

export const LEVEL_3_LESSONS: Lesson[] = [
  {
    id: 'l3-advanced-lift-planning',
    level: 3,
    moduleCode: '428A-L3-01',
    title: 'Advanced Lift Planning, Multi-Crane Lifting & Vessel Tail-Up',
    domain: 'Rigging',
    estimatedMinutes: 45,
    verificationTag: 'Verified 428A / RSOS',
    rsosTasks: ['Task B-6 (Plans lift)', 'Task B-8 (Hoists load)', 'Task B-9 (Performs post-lift activities)'],
    learningObjectives: [
      'Calculate shifting load shares during a two-crane vessel tail-up (vertical erection from horizontal skids).',
      'Identify critical lift triggers requiring formal engineered lift plans (percentage of chart capacity, tandem picks, blind picks, over live lines).',
      'Analyze complex equalizer beam, multi-part reeving, and wind/ground-bearing considerations.',
    ],
    plainEnglishExplanation: [
      'Level 3 rigging moves from single-crane picks to engineered multi-crane erections—such as tailing a 90 ft fractionating tower or steam drum from horizontal transport cradles to vertical anchor bolts.',
      'During a tail-up, the main crane picks the top trunnions while the tailing crane holds the bottom skirt. As the vessel rotates upward from 0° toward 90°, the main crane steadily absorbs more load—and if the tail crane walks in poorly or lets its line go out of plumb, massive side-load forces hit the boom.',
    ],
    technicalTerms: [
      { term: 'Tandem / Dual-Crane Lift', definition: 'Lift shared simultaneously by two cranes; typically governed by a written engineered lift plan and reduced crane utilization limits (often 75%–85% of chart).' },
      { term: 'Tailing Crane', definition: 'Secondary crane supporting the base/skirt of a horizontal vessel as the main crane lifts it vertical.' },
      { term: 'Two-Blocking', definition: 'Hazardous collision between the traveling hook block/ball and the boom tip sheaves; prevented by anti-two-block (ATB) devices.' },
      { term: 'Ground Bearing Pressure', definition: 'Outrigger float load divided by mat contact area; mats must distribute force below soil bearing capacity.' },
    ],
    formulas: [
      {
        id: 'f-l3-mat',
        title: 'Outrigger Mat Bearing Pressure',
        expression: 'P_soil (psi) = Outrigger Reaction (lb) ÷ Mat Area (in²)',
        variables: 'Peak single-outrigger load often occurs when swinging boom directly over one outrigger corner',
        unitsNote: 'Verify timber/steel crane pads prevent ground shear near trenches or buried piping.',
        domain: 'Rigging',
      },
    ],
    workedExamples: [
      {
        title: 'Load Shift During Vertical Vessel Tail-Up',
        scenario: 'A uniform 100,000 lb column is lifted from horizontal using top trunnions (main crane) and a bottom skirt tailing beam (tail crane).',
        given: ['Uniform CG at mid-length', 'Main crane stays plumb over top trunnions'],
        steps: [
          '1. When horizontal (0°): Main crane ≈ 50,000 lb; Tail crane ≈ 50,000 lb.',
          '2. At ~45° tilt: Main crane continues carrying ~50,000 lb if CG stays centred horizontally between trunnion and skirt pin, UNTIL the tail crane is slacked off or CG passes under the top pin.',
          '3. As the vessel reaches vertical (~85–90°), the main crane carries 100,000 lb (100%) and the tail crane is unhooked.',
        ],
        finalAnswer: 'Main crane must be sized for 100% of total weight + rigging at final vertical radius.',
      },
    ],
    diagramId: 'crane-components',
    diagramCaption: 'Engineered Lift & Crane Radius Geometry — check boom clearance, tail-swing radius, and outrigger pad distribution.',
    industrialScenario: {
      title: 'Recognizing Critical Lift Triggers on Site',
      context: 'Your crew is preparing a tandem lift over an active plant pipe rack at 78% of one crane’s chart capacity.',
      keyTakeaway: 'Tandem lifts, lifts over live process equipment, and high chart utilization (>75%–80% per site standard) require a formal engineered lift plan signed by a competent/qualified engineer before rigging begins.',
      safetyNotice: 'Never attempt a multi-crane or tail-up lift using rules of thumb alone; engineered lift plans and dedicated lift directors govern.',
    },
    commonMistakes: [
      {
        habit: 'Assuming a tandem lift splits weight 50/50 at every angle without keeping hoist lines strictly plumb.',
        correction: 'Any non-vertical hoist line introduces horizontal side-loading on crane booms, which booms are NOT designed to resist.',
      },
    ],
    knowledgeChecks: [
      {
        id: 'kc-l3-rig-1',
        prompt: 'Why must the hoist lines of BOTH cranes remain vertically plumb throughout a vessel tail-up?',
        options: [
          'Out-of-plumb lines create dangerous side-loading on crane booms',
          'To keep the anti-two-block weight submerged',
          'To double the wire rope breaking strength',
          'Because drum brakes only hold vertical loads',
        ],
        correctIndex: 0,
        explanation: 'Crane booms are engineered for vertical compressive/bending loads, not lateral side-pull; the tail crane must travel/boom in smoothly to keep lines plumb.',
      },
    ],
    finalAssessment: [
      {
        id: 'fa-l3-rig-1',
        level: 3,
        domain: 'Rigging',
        knowledgeType: 'Practical',
        prompt: 'During a critical lift, an outrigger exerts 96,000 lb onto a 4 ft × 4 ft crane mat (16 ft² = 2,304 in²). What is the approximate soil bearing pressure?',
        options: ['41.7 psi (6,000 psf)', '24.0 psi', '83.3 psi', '12.5 psi'],
        correctIndex: 0,
        explanation: '96,000 lb ÷ 2,304 in² = 41.67 psi (or 96,000 ÷ 16 ft² = 6,000 lb/ft²).',
        lessonId: 'l3-advanced-lift-planning',
      },
    ],
  },
  {
    id: 'l3-vessel-boiler-installation',
    level: 3,
    moduleCode: '428A-L3-02',
    title: 'Pressure Vessel Construction, Boiler Installation, Tube Rolling & Tank Erection',
    domain: 'Industrial Equipment',
    estimatedMinutes: 45,
    verificationTag: 'Verified 428A / RSOS',
    rsosTasks: ['Task C-11 (Assembles and fits)', 'Task C-12 (Fastens components)', 'Task D-13 (Services vessels)'],
    learningObjectives: [
      'Explain boiler tube rolling/expanding theory (wall reduction %, flaring/beading, torque control) and tube-plugging procedures.',
      'Sequence field-erected aboveground storage tank assembly (bottom annular plate, shell courses, 1-2-3-4 course plumbing, roof rafters).',
      'Outline hydrostatic and pneumatic pressure testing principles and safety exclusion precautions.',
    ],
    plainEnglishExplanation: [
      'Tube expanding (rolling) is signature boilermaker craft. When rolling a boiler or heat-exchanger tube into a tubesheet, you aren’t squashing it blindly—you expand the tube OD until it contacts the hole wall and then plastically deform the tube wall by a controlled percentage (typically 5%–8% wall reduction for carbon steel, verified with inside micrometer and torque-controlled roller).',
      'Over-rolling work-hardens the tube and cracks or distorts the tubesheet ligaments; under-rolling leaks during hydrotest.',
    ],
    technicalTerms: [
      { term: 'Wall Reduction %', definition: 'Controlled thinning of tube wall thickness during mechanical rolling into a grooved or plain tubesheet hole.' },
      { term: 'Ligament', definition: 'Metal bridge remaining between adjacent tube holes in a drum or tubesheet.' },
      { term: 'Hydrostatic Test', definition: 'Code pressure test filling a vessel with incompressible liquid (usually water) to verify structural integrity and leak tightness.' },
      { term: 'Annular Bottom Plate', definition: 'Thicker outer perimeter ring of bottom plates supporting the vertical shell wall of a large field-erected storage tank.' },
    ],
    formulas: [
      {
        id: 'f-l3-tube-roll',
        title: 'Target Expanded Tube ID',
        expression: 'Target ID = Hole_ID - 2t + (2t × %Reduction)',
        variables: 'Hole_ID = tubesheet bore, t = measured tube wall thickness, %Reduction = target wall thinning (e.g. 0.06)',
        unitsNote: 'Always measure actual hole ID and tube wall with micrometers before setting rolling torque.',
        domain: 'Industrial Equipment',
      },
    ],
    workedExamples: [
      {
        title: 'Calculating Target Rolled ID for a Boiler Tube',
        scenario: 'A 2.000" OD tube with 0.120" wall thickness fits into a 2.015" tubesheet hole. Target wall reduction is 6%.',
        given: ['Hole ID = 2.015"', 'Tube wall t = 0.120" (2t = 0.240")', 'Target reduction = 6% of 0.240" = 0.0144"'],
        steps: [
          '1. Initial tube ID before rolling: 2.000 - 0.240 = 1.760".',
          '2. Tube ID at metal-to-metal contact (zero reduction): 2.015 - 0.240 = 1.775".',
          '3. Add 6% thinning of double-wall (0.06 × 0.240 = 0.0144"): 1.775 + 0.0144 = 1.7894".',
        ],
        finalAnswer: 'Target rolled inside diameter ≈ 1.789 in.',
      },
    ],
    diagramId: 'tank-construction',
    diagramCaption: 'Field-Erected Storage Tank & Pressure Vessel Anatomy — inspect annular ring, staggered vertical shell seams, and wind girder.',
    industrialScenario: {
      title: 'Why Hydrostatic Testing Is Far Safer Than Pneumatic Testing',
      context: 'An apprentice asks why we spend hours venting air and filling a huge vessel with water instead of pressurizing with plant air.',
      keyTakeaway: 'Water is nearly incompressible—if a weld fails under hydrotest, pressure drops instantly. Compressed air stores enormous explosive energy; pneumatic tests require extreme exclusion zones and special code justification.',
    },
    commonMistakes: [
      {
        habit: 'Running vertical weld seams directly in line between adjacent tank shell courses.',
        correction: 'Stagger vertical seams by at least 1/3 plate length (or code minimum, e.g., ≥ 5× thickness / API 650 minimum) to avoid continuous weak planes.',
      },
    ],
    knowledgeChecks: [
      {
        id: 'kc-l3-inst-1',
        prompt: 'What happens if a boilermaker severely over-rolls tubes in a heat exchanger tubesheet?',
        options: [
          'Work-hardens tubes and distorts/cracks the tubesheet ligaments between holes',
          'Increases heat transfer efficiency by 20%',
          'Eliminates the need for a hydrotest',
          'Converts carbon steel into austenitic stainless',
        ],
        correctIndex: 0,
        explanation: 'Excessive expansion compresses and distorts adjacent ligaments, loosening neighbouring already-rolled tubes.',
      },
    ],
    finalAssessment: [
      {
        id: 'fa-l3-inst-1',
        level: 3,
        domain: 'Industrial Equipment',
        knowledgeType: 'Practical',
        prompt: 'When hydrostatically testing a tall boiler or vertical column, what must be done at the highest point of the vessel during filling?',
        options: [
          'Open high-point vents until all air pockets are bled out and solid water flows',
          'Cap all top nozzles tight to trap an air cushion',
          'Heat the water above 212°F first',
          'Disconnect the pressure gauge until full pressure is reached',
        ],
        correctIndex: 0,
        explanation: 'Trapped air compresses and stores dangerous energy while skewing gauge stability; always vent high points completely.',
        lessonId: 'l3-vessel-boiler-installation',
      },
    ],
  },
  {
    id: 'l3-advanced-metallurgy-pwht',
    level: 3,
    moduleCode: '428A-L3-03',
    title: 'Advanced Metallurgy, PWHT, NDE Defect Analysis & Code Overview',
    domain: 'Metallurgy',
    estimatedMinutes: 40,
    verificationTag: 'Pending Official STO PDF Verification',
    rsosTasks: ['Task A-5 (Performs cutting and welding)', 'Task D-13 (Services vessels)'],
    learningObjectives: [
      'Explain the purpose, soaking temperature, and heating/cooling rate controls of Post-Weld Heat Treatment (PWHT / stress relief).',
      'Compare Non-Destructive Examination (NDE) methods: VT, PT, MT, UT (including PAUT), and RT—strengths and limitations.',
      'Understand the educational roles of ASME BPVC Sections I, VIII, IX, B31.1/B31.3, and CSA W47.1/W59/B51 (always refer to current governed code books for production work).',
    ],
    plainEnglishExplanation: [
      'In thick-wall chrome-moly (P11/P22) headers or heavy pressure vessels, welding leaves behind locked-in residual stress and hard HAZ zones. Post-Weld Heat Treatment (PWHT) heats the weld zone below the lower critical transformation temperature (so the steel doesn’t austenitize), allowing residual stresses to relax and tempering brittle martensite.',
      'For NDE, remember which test sees surface vs volumetric flaws: Dye Penetrant (PT) and Magnetic Particle (MT) find SURFACE/near-surface cracks (MT only on ferromagnetic steel!). Ultrasonic (UT) and Radiography (RT) inspect INTERNAL volume—with UT excelling at planar cracks/lack-of-fusion and RT excelling at volumetric porosity/slag.',
    ],
    technicalTerms: [
      { term: 'PWHT (Stress Relieving)', definition: 'Controlled sub-critical heating, soaking (typically ~1 hr per inch of thickness), and controlled cooling to relieve residual welding stress and temper the HAZ.' },
      { term: 'NDE — Surface vs Volumetric', definition: 'VT/PT/MT detect surface-breaking flaws; RT/UT detect internal volumetric or planar discontinuities.' },
      { term: 'ASME Section IX / CSA B51', definition: 'ASME IX governs welding/brazing procedure and welder qualification; CSA B51 is the Canadian Boiler, Pressure Vessel, and Pressure Piping Code.' },
    ],
    formulas: [
      {
        id: 'f-l3-pwht',
        title: 'Typical PWHT Soak Time Concept (Educational Rule)',
        expression: 'Soak Time ≈ 1 hr per inch of thickness (check exact governing code table)',
        variables: 'Always verify exact minimum temperature, hold time, and max °F/hr ramp rates in the governing ASME/CSA WPS & Code Edition',
        unitsNote: 'Do NOT invent code numbers on the job—consult the engineered PWHT procedure.',
        domain: 'Metallurgy',
      },
    ],
    workedExamples: [
      {
        title: 'Selecting NDE for Austenitic Stainless vs Carbon Steel Fillet Welds',
        scenario: 'QC needs surface crack inspection on two nozzle reinforcing pad fillet welds: one on SA-516 carbon steel, one on 316L stainless steel.',
        given: ['SA-516 is ferromagnetic', '316L is non-magnetic austenitic'],
        steps: [
          '1. On SA-516 carbon steel: Magnetic Particle Testing (MT) quickly detects surface and slight subsurface cracks.',
          '2. On 316L stainless steel: MT will NOT work because 316L is non-magnetic—use Liquid Penetrant Testing (PT).',
        ],
        finalAnswer: 'MT for ferromagnetic carbon steel; PT for non-magnetic 316L stainless.',
      },
    ],
    diagramId: 'welding-processes',
    diagramCaption: 'Process & Inspection Reference — compare GTAW, SMAW, GMAW, FCAW applications across carbon and alloy pressure piping.',
    industrialScenario: {
      title: 'Why You Never Weld Attachments After PWHT Without Re-Heat-Treating',
      context: 'Someone notices a missing insulation clip on a chrome-moly drum after final PWHT.',
      keyTakeaway: 'Welding onto a stress-relieved vessel re-introduces untempered hard HAZ zones and high residual stress—requiring engineering approval and repeat PWHT.',
    },
    commonMistakes: [
      {
        habit: 'Specifying Magnetic Particle (MT) inspection on 304/316 stainless steel or Inconel.',
        correction: 'MT only works on ferromagnetic materials (carbon and ferritic/martensitic alloy steels). Use PT for austenitic stainless, aluminum, or nickel alloys.',
      },
    ],
    knowledgeChecks: [
      {
        id: 'kc-l3-met-1',
        prompt: 'Which NDE method cannot be used on non-magnetic 304L stainless steel welds?',
        options: ['Magnetic Particle Testing (MT)', 'Liquid Penetrant Testing (PT)', 'Radiographic Testing (RT)', 'Visual Testing (VT)'],
        correctIndex: 0,
        explanation: '304L stainless is non-magnetic; MT requires ferromagnetic material.',
      },
    ],
    finalAssessment: [
      {
        id: 'fa-l3-met-1',
        level: 3,
        domain: 'Metallurgy',
        knowledgeType: 'Theoretical',
        prompt: 'Which Canadian standard governs the construction, inspection, and provincial registration of boilers, pressure vessels, and pressure piping?',
        options: ['CSA B51', 'CSA W59', 'ASME B30.9', 'Ontario Reg. 632/05'],
        correctIndex: 0,
        explanation: 'CSA B51 is the Canadian Boiler, Pressure Vessel, and Pressure Piping Code (working alongside ASME BPVC and provincial authorities such as TSSA in Ontario / ABSA in Alberta).',
        lessonId: 'l3-advanced-metallurgy-pwht',
      },
    ],
  },
  {
    id: 'l3-advanced-math-redseal',
    level: 3,
    moduleCode: '428A-L3-04',
    title: 'Advanced Trade Math & Red Seal Exam Synthesis',
    domain: 'Mathematics',
    estimatedMinutes: 45,
    verificationTag: 'Supplementary Trade Theory',
    rsosTasks: ['Integrates RSOS MWAs A, B, C, and D'],
    learningObjectives: [
      'Solve compound pipe/structural rolling offsets using 3D Pythagoras (Travel = √(Run² + Set² + Rise²)).',
      'Compute bend allowances, composite vessel volumes (cylinder + 2:1 heads), and weld metal deposition estimates.',
      'Apply exam pacing and elimination strategies for 100-question Red Seal-style assessments.',
    ],
    plainEnglishExplanation: [
      'Red Seal math rarely stops at one step. Instead of asking just "What is the weight of a plate?", it asks: "Calculate the empty weight of this rolled shell course plus two 2:1 heads, then find the tension in each leg of a 4-leg bridle at 45°."',
      'Break every multi-step Red Seal question into 3 clean numbered steps on scrap paper—never skip writing down units—and check whether the question asks for EMPTY weight, HYDROTEST (water-filled) weight, or TOTAL RIGGED weight.',
    ],
    technicalTerms: [
      { term: 'Rolling Offset (3D)', definition: 'Pipe or structural diagonal changing elevation (Rise), horizontal advance (Run), and sideways shift (Set) simultaneously.' },
      { term: 'True Offset', definition: 'Combined 2D perpendicular offset √(Rise² + Set²) before calculating final Travel with Run.' },
      { term: 'Deposition Efficiency', definition: 'Ratio of actual weld metal deposited to total weight of electrode/wire consumed (SMAW ≈ 60–65%, FCAW ≈ 80–85%, GMAW ≈ 92–97%).' },
    ],
    formulas: [
      {
        id: 'f-l3-roll-offset',
        title: '3D Rolling Offset Travel',
        expression: 'True Offset = √(Rise² + Set²)   |   Travel = √(Run² + Rise² + Set²)',
        variables: 'All three orthogonal dimensions in identical units',
        unitsNote: 'Verify elbow angle via arctan(True Offset ÷ Run).',
        domain: 'Mathematics',
      },
    ],
    workedExamples: [
      {
        title: 'Multi-Step Vessel Weight + Sling Tension Synthesis',
        scenario: 'A 6 ft ID × 10 ft long horizontal tank filled with water (ignore steel weight for this step) needs an estimate of water weight and tension per leg on a 2-leg 60° bridle.',
        given: ['ID = 6 ft (r = 3 ft)', 'L = 10 ft', 'Water = 62.4 lb/ft³', 'Angle = 60°'],
        steps: [
          '1. Volume: π × 3² × 10 = 282.74 ft³.',
          '2. Water weight: 282.74 × 62.4 = 17,643 lb.',
          '3. Vertical share per leg: 17,643 ÷ 2 = 8,821.5 lb.',
          '4. Tension at 60° (LAF = 1.1547): 8,821.5 × 1.1547 = 10,186 lb per leg.',
        ],
        finalAnswer: '10,186 lb tension per sling leg.',
      },
    ],
    diagramId: 'isometric-drawing',
    diagramCaption: '3D Rolling Offset & Isometric Piping Projection — visualize Run, Set, and Rise orthogonal legs forming the rolling box diagonal.',
    industrialScenario: {
      title: 'Pacing a 100-Question Red Seal Certification Exam',
      context: 'Red Seal exams typically allow around 3 to 4 hours for 100–125 questions (~1.8 minutes per question).',
      keyTakeaway: 'Never spend 8 minutes stuck on one rolling-offset calculation on your first pass. Flag heavy math questions, sweep all quick theory/safety/welding questions first, then return with clear focus.',
    },
    commonMistakes: [
      {
        habit: 'Forgetting to square BOTH Rise and Set in a 3D rolling offset.',
        correction: 'Always compute True Offset = √(Rise² + Set²) first, then Travel = √(Run² + True Offset²).',
      },
    ],
    knowledgeChecks: [
      {
        id: 'kc-l3-math-1',
        prompt: 'A pipe rolling offset has a Rise of 12", a Set of 16", and a Run of 15". What is the True Offset and final Travel?',
        options: ['True Offset = 20", Travel = 25"', 'True Offset = 28", Travel = 43"', 'True Offset = 14", Travel = 21"', 'True Offset = 20", Travel = 35"'],
        correctIndex: 0,
        explanation: 'True Offset = √(12² + 16²) = √400 = 20". Travel = √(20² + 15²) = √625 = 25".',
      },
    ],
    finalAssessment: [
      {
        id: 'fa-l3-math-1',
        level: 3,
        domain: 'Mathematics',
        knowledgeType: 'Practical',
        prompt: 'What is the bend allowance for a 90° bend in 1/4" (0.250") steel plate with a 1/2" (0.500") inside radius and K-factor of 0.40?',
        options: ['0.942 in', '1.178 in', '0.785 in', '1.571 in'],
        correctIndex: 0,
        explanation: 'BA = (π/180) × 90 × (0.500 + 0.40 × 0.250) = 1.5708 × 0.600 = 0.9425 in.',
        lessonId: 'l3-advanced-math-redseal',
      },
    ],
  },
];
