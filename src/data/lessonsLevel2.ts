import { Lesson } from '../types/academy';

export const LEVEL_2_LESSONS: Lesson[] = [
  {
    id: 'l2-rigging-cg-charts',
    level: 2,
    moduleCode: '428A-L2-01',
    title: 'Intermediate Rigging: Centre of Gravity, Unequal Loads & Crane Load Charts',
    domain: 'Rigging',
    estimatedMinutes: 45,
    verificationTag: 'Verified 428A / RSOS',
    rsosTasks: ['Task B-6 (Plans lift)', 'Task B-7 (Rigs load)', 'Task B-8 (Hoists load)'],
    learningObjectives: [
      'Calculate pick-point reaction loads when the Centre of Gravity (CG) is offset from geometric centre.',
      'Determine crane net capacity by deducting all rigging, hook block, jib, and spreader bar weights from gross chart capacity.',
      'Explain tipping vs structural failure zones on mobile crane load charts and outrigger setup requirements.',
    ],
    plainEnglishExplanation: [
      'In Level 1 you assumed symmetrical loads where the hook sat dead-centre. In real boilermaker work—exchanger bundles with heavy channel ends, eccentric boiler headers, or pumps mounted on skids—the Centre of Gravity is almost never in the middle.',
      'Remember the moment rule: the pick point CLOSEST to the Centre of Gravity carries the BIGGEST share of the weight. That is why the numerator for Left Pick Load uses the OPPOSITE distance d₂: L₁ = (W × d₂) / D.',
      'For Crane Load Charts, exams love testing "Gross vs Net Capacity". Every pound hanging below the boom tip—main block, headache ball, wire rope below boom tip, stowed/erected jib deduction, spreader beam, shackles, and slings—counts as part of the Gross Load.',
    ],
    technicalTerms: [
      { term: 'Centre of Gravity (CG)', definition: 'Single theoretical point through which the entire gravitational weight of an object acts; a suspended load always tilts until its CG hangs directly below the crane hook.' },
      { term: 'Gross vs Net Capacity', definition: 'Gross capacity is the number printed on the crane chart; Net capacity = Gross Capacity minus all load-handling deductions (blocks, slings, jib, etc.).' },
      { term: 'Load Radius', definition: 'Horizontal distance from the crane’s centre of rotation (turntable pin) to the centreline of the suspended load.' },
      { term: 'Quadrants of Operation', definition: 'Charted zones around a mobile crane (Over Rear, Over Side, 360°) where capacities differ based on carrier stability.' },
    ],
    formulas: [
      {
        id: 'f-l2-cg',
        title: 'Unequal Two-Point Pick Distribution',
        expression: 'L₁ = (W × d₂) / (d₁ + d₂)   |   L₂ = (W × d₁) / (d₁ + d₂)',
        variables: 'd₁ = horizontal distance Pick 1 to CG, d₂ = horizontal distance Pick 2 to CG',
        unitsNote: 'Always verify L₁ + L₂ = W.',
        domain: 'Rigging',
      },
      {
        id: 'f-l2-netcap',
        title: 'Crane Net Capacity Check',
        expression: 'Total Gross Load = Payload + Block + Ball + Slings/Shackles + Spreader + Jib Deduction',
        variables: 'Compare Total Gross Load against Gross Chart Capacity at governing Boom Length & Radius',
        unitsNote: 'Always round UP to the next higher radius and boom length on the chart.',
        domain: 'Rigging',
      },
    ],
    workedExamples: [
      {
        title: 'Off-Centre Heat Exchanger Bundle Lift',
        scenario: 'A 24,000 lb shell-and-tube exchanger is 18 ft between lifting lugs. Its Centre of Gravity is 6 ft from the heavy channel-end lug (Lug A) and 12 ft from the rear lug (Lug B).',
        given: ['W = 24,000 lb', 'd_A = 6 ft', 'd_B = 12 ft', 'Total span D = 18 ft'],
        steps: [
          '1. Load on Lug A (uses opposite distance d_B = 12 ft): L_A = (24,000 × 12) ÷ 18 = 16,000 lb.',
          '2. Load on Lug B (uses opposite distance d_A = 6 ft): L_B = (24,000 × 6) ÷ 18 = 8,000 lb.',
          '3. Note: If rigged with identical-length slings to a single hook, Lug A would sit higher or drag until CG aligned under the hook. Use an offset spreader beam or unequal sling lengths calculated to keep the vessel level.',
        ],
        finalAnswer: 'Lug A carries 16,000 lb (66.7%); Lug B carries 8,000 lb (33.3%).',
      },
    ],
    diagramId: 'crane-components',
    diagramCaption: 'Mobile Crane Geometry & Load Chart Zones — inspect boom length, load radius from centre of rotation, and tipping/structural zones.',
    industrialScenario: {
      title: 'Selecting Between Two Boom Configurations on a Plant Turnaround',
      context: 'You need to pick an 18,500 lb economizer bank at a 45 ft radius. The crane chart lists a 60 ft boom at 21,200 lb gross, and your block + ball + rigging + stowed jib deductions total 3,100 lb.',
      keyTakeaway: 'Net capacity = 21,200 - 3,100 = 18,100 lb—which is 400 lb SHORT of your 18,500 lb payload! You cannot make that pick at 45 ft radius; move the crane closer or use a larger crane.',
      safetyNotice: 'Never interpolate between load chart columns or exceed rated chart capacity; boom deflection increases actual radius once the load leaves the ground.',
    },
    commonMistakes: [
      {
        habit: 'Interpolating halfway between 40 ft and 50 ft radius values on a crane load chart.',
        correction: 'Crane charts are NEVER interpolated. If your radius is 42 ft, you MUST use the next larger radius (50 ft) column.',
      },
    ],
    knowledgeChecks: [
      {
        id: 'kc-l2-cg-1',
        prompt: 'If a crane’s actual operating radius is 37 ft and the load chart shows columns for 35 ft and 40 ft, which column governs?',
        options: ['40 ft column', '35 ft column', 'Average of 35 ft and 40 ft', 'Either column if wind is under 15 km/h'],
        correctIndex: 0,
        explanation: 'Always round UP to the next higher radius and longer boom length on a crane load chart.',
      },
    ],
    finalAssessment: [
      {
        id: 'fa-l2-cg-1',
        level: 2,
        domain: 'Rigging',
        knowledgeType: 'Theoretical',
        prompt: 'A 15,000 lb boiler header is 15 ft between pick points, with CG located 5 ft from the left pick point. What vertical load is on the left pick point?',
        options: ['10,000 lb', '5,000 lb', '7,500 lb', '12,500 lb'],
        correctIndex: 0,
        explanation: 'd₁ = 5 ft, d₂ = 10 ft. Left load = (15,000 × 10) ÷ 15 = 10,000 lb.',
        lessonId: 'l2-rigging-cg-charts',
      },
    ],
  },
  {
    id: 'l2-rigging-reeving',
    level: 2,
    moduleCode: '428A-L2-02',
    title: 'Mechanical Advantage, Block & Tackle, Reeving & Industrial Jacking',
    domain: 'Rigging',
    estimatedMinutes: 35,
    verificationTag: 'Verified 428A / RSOS',
    rsosTasks: ['Task B-7 (Rigs load)', 'Task B-8 (Hoists load)'],
    learningObjectives: [
      'Calculate theoretical and friction-adjusted mechanical advantage for pulley and reeving blocks.',
      'Determine parts of line required for a given single-line WLL and locate the dead-end (becket).',
      'Apply hydraulic jacking, cribbing, and synchronous lift balancing principles safely.',
    ],
    plainEnglishExplanation: [
      'Boilermakers regularly drift heavy turbine casings, drag tube bundles, and reeve crane blocks. Understanding Parts of Line keeps you from overloading a tugger winch or burning up a wire rope.',
      'Count the ropes supporting the MOVABLE block to get the Theoretical Mechanical Advantage. Then add ~5% to 10% friction per active sheave depending on bearings—because friction steals real pulling power on every sheave turn.',
    ],
    technicalTerms: [
      { term: 'Parts of Line', definition: 'Number of wire rope segments supporting the lower traveling block (equals theoretical MA).' },
      { term: 'Lead Line', definition: 'Live line traveling from the final upper sheave back to the hoist drum or winch.' },
      { term: 'Becket (Dead End)', definition: 'Anchor wedge socket where the stationary end of the reeved line terminates.' },
      { term: 'Fleet Angle', definition: 'Angle between the wire rope entering a drum/sheave and the perpendicular line to the drum axis (excessive fleet angle causes flange wear and poor spooling).' },
    ],
    formulas: [
      {
        id: 'f-l2-reeve',
        title: 'Friction-Adjusted Lead Line Pull',
        expression: 'Pull = (W / Parts) × (1 + f × Sheaves)',
        variables: 'f = friction decimal per sheave (0.04 roller, 0.08 bronze bushing)',
        unitsNote: 'Lead line pull must never exceed single-line WLL.',
        domain: 'Rigging',
      },
    ],
    workedExamples: [
      {
        title: 'Sizing Parts of Line on a 10,000 lb Tugger',
        scenario: 'You need to hoist a 34,000 lb boiler economizer section using a winch rated for 8,000 lb single-line pull and sheaves with 5% friction each.',
        given: ['Load = 34,000 lb', 'Max single-line pull = 8,000 lb', 'Friction = 5% (0.05) per sheave'],
        steps: [
          '1. Ideal check: 34,000 ÷ 8,000 = 4.25 → need at least 5 parts ignoring friction.',
          '2. Test 5 parts (5 sheaves): (34,000 ÷ 5) × (1 + 0.05×5) = 6,800 × 1.25 = 8,500 lb (OVER 8,000 lb limit!).',
          '3. Test 6 parts (6 sheaves): (34,000 ÷ 6) × (1 + 0.05×6) = 5,667 × 1.30 = 7,367 lb (SAFE ≤ 8,000 lb).',
        ],
        finalAnswer: 'Use 6 parts of line (dead-end on upper block).',
      },
    ],
    diagramId: 'block-and-tackle',
    diagramCaption: 'Interactive Block & Tackle / Reeving Visualizer — compare 2-, 4-, and 6-part reeving paths, dead-end locations, and lead-line tension.',
    industrialScenario: {
      title: 'Cribbing Under Hydraulic Jacks During Drum Alignment',
      context: 'Using four 50-ton hydraulic jacks to level a steam drum saddle.',
      keyTakeaway: 'Never trust hydraulic seals alone—follow the lift continuously with hardwood cribbing (or mechanical locking collars) within 1/4" to 1/2" of the load at all times.',
    },
    commonMistakes: [
      {
        habit: 'Assuming 4 parts of line on a 40,000 lb load puts 10,000 lb on the lead line.',
        correction: 'Friction adds roughly 20–30% on multi-sheave blocks, pushing actual lead line pull to ~12,000–13,000 lb.',
      },
    ],
    knowledgeChecks: [
      {
        id: 'kc-l2-rv-1',
        prompt: 'In a block-and-tackle system with an ODD number of parts of line (e.g., 5 parts), where is the dead end anchored?',
        options: ['On the lower traveling block', 'On the upper stationary block', 'On the winch drum', 'On a side snatch block'],
        correctIndex: 0,
        explanation: 'Even parts dead-end on the upper block; odd parts dead-end on the lower traveling block.',
      },
    ],
    finalAssessment: [
      {
        id: 'fa-l2-rv-1',
        level: 2,
        domain: 'Rigging',
        knowledgeType: 'Theoretical',
        prompt: 'A 24,000 lb load is lifted with 4 parts of line across 4 sheaves at 5% friction per sheave. What is the estimated lead line pull?',
        options: ['7,200 lb', '6,000 lb', '8,400 lb', '5,000 lb'],
        correctIndex: 0,
        explanation: 'Ideal = 24,000 ÷ 4 = 6,000 lb. Friction factor = 1 + (0.05 × 4) = 1.20. Pull = 6,000 × 1.20 = 7,200 lb.',
        lessonId: 'l2-rigging-reeving',
      },
    ],
  },
  {
    id: 'l2-fab-plate-layout',
    level: 2,
    moduleCode: '428A-L2-03',
    title: 'Intermediate Blueprints, Fabrication Tolerances & Pattern Development',
    domain: 'Fabrication',
    estimatedMinutes: 45,
    verificationTag: 'Verified 428A / RSOS',
    rsosTasks: ['Task C-10 (Performs fabrication)', 'Task C-11 (Assembles and fits)'],
    learningObjectives: [
      'Develop flat patterns for mitered elbows, eccentric pipe branches, and conical reducers using Parallel-Line, Radial-Line, and Triangulation methods.',
      'Interpret pressure vessel out-of-roundness tolerances, nozzle projection tolerances, and GD&T concentricity/flatness symbols.',
      'Lay out bend lines using neutral-axis K-factors and bend deductions.',
    ],
    plainEnglishExplanation: [
      'Level 2 takes you from square plates into three-dimensional transitions: cones, mitered elbows, and saddle branches. Every layout technique falls into one of three geometric families:',
      '1) Parallel-Line Development (for cylinders, elbows, tee-branches—anything with parallel edges). 2) Radial-Line Development (for concentric cones and pyramids whose edges converge to an apex). 3) Triangulation (for square-to-round transitions and eccentric cones where no single apex exists).',
    ],
    technicalTerms: [
      { term: 'Parallel-Line Development', definition: 'Dividing a circular view into 12 or 16 equal spaces to project true element heights onto a flat stretch-out baseline.' },
      { term: 'Radial-Line Development', definition: 'Swing-arc layout using true slant height from a cone’s apex to develop concentric frustums.' },
      { term: 'Triangulation', definition: 'Breaking a non-parallel transition surface (like a square-to-round hopper) into adjacent flat triangles using true lengths.' },
      { term: 'Ordinate', definition: 'Perpendicular height measured up from a baseline to plot a curved cut profile.' },
    ],
    formulas: [
      {
        id: 'f-l2-cone',
        title: 'Concentric Cone Slant Height & Arc Angle',
        expression: 'Slant S = √(H² + (R - r)²)   |   Sector Angle θ = 360° × (R / S_full)',
        variables: 'H = vertical frustum height, R = large radius, r = small radius, S_full = full slant height to apex',
        unitsNote: 'Use mean radii (to plate centreline) for thick plate cones.',
        domain: 'Fabrication',
      },
    ],
    workedExamples: [
      {
        title: 'Selecting the Correct Pattern Development Method',
        scenario: 'A shop drawing calls for: (A) a 90° 3-piece mitered duct elbow, (B) a concentric conical hopper, and (C) an offset square-to-round transition.',
        given: ['Three distinct sheet/plate shapes'],
        steps: [
          '1. Mitered elbow → Parallel-Line Development (elements remain parallel to pipe axis).',
          '2. Concentric cone → Radial-Line Development (all seam elements converge to one apex).',
          '3. Offset square-to-round → Triangulation (requires true-length diagrams for each diagonal leg).',
        ],
        finalAnswer: 'A = Parallel-Line, B = Radial-Line, C = Triangulation.',
      },
    ],
    diagramId: 'plate-layout',
    diagramCaption: 'Interactive Plate Layout & Development — compare Parallel-Line 12-space cylinder stretch-out vs Radial-Line cone frustum sector.',
    industrialScenario: {
      title: 'Rolling Heavy Cone Segments Without Waste',
      context: 'Laying out a 3/4" thick SA-516 Gr. 70 conical transition from a 72" ID shell down to a 36" ID nozzle.',
      keyTakeaway: 'Always calculate cone angles using mean diameters (ID + t) and verify roll-direction orientation relative to plate mill rolling direction.',
    },
    commonMistakes: [
      {
        habit: 'Projecting foreshortened elevation lines directly onto a triangulation pattern.',
        correction: 'In triangulation, tilted lines on orthographic views are foreshortened—always build a right-triangle True-Length Diagram (Plan Length + Vertical Height) before swinging arcs.',
      },
    ],
    knowledgeChecks: [
      {
        id: 'kc-l2-lay-1',
        prompt: 'Which layout method is required for an offset square-to-round boiler duct transition?',
        options: ['Triangulation', 'Parallel-line development', 'Radial-line development', 'Direct circumferential projection'],
        correctIndex: 0,
        explanation: 'Square-to-round transitions lack parallel elements or a single cone apex, requiring triangulation.',
      },
    ],
    finalAssessment: [
      {
        id: 'fa-l2-lay-1',
        level: 2,
        domain: 'Fabrication',
        knowledgeType: 'Theoretical',
        prompt: 'A concentric cone frustum has a vertical height of 24", a large mean radius of 18", and a small mean radius of 8". What is the slant height of the frustum wall?',
        options: ['26.0 in', '34.0 in', '22.0 in', '28.8 in'],
        correctIndex: 0,
        explanation: 'Δr = 18 - 8 = 10". Slant = √(24² + 10²) = √676 = 26.0 in.',
        lessonId: 'l2-fab-plate-layout',
      },
    ],
  },
  {
    id: 'l2-metallurgy-distortion',
    level: 2,
    moduleCode: '428A-L2-04',
    title: 'Welding Metallurgy, Distortion Control, Weld Defects & WPS Interpretation',
    domain: 'Metallurgy',
    estimatedMinutes: 40,
    verificationTag: 'Supplementary Trade Theory',
    rsosTasks: ['Task A-5 (Performs cutting and welding)', 'Task C-12 (Fastens components)'],
    learningObjectives: [
      'Explain thermal expansion/contraction mechanics and apply backstep, skip, balanced double-V, and pre-set distortion controls.',
      'Differentiate welding discontinuities/defects (lack of fusion, undercut, porosity, slag inclusion, hydrogen cracking) and root causes.',
      'Read essential vs non-essential variables on an ASME Section IX / CSA W47.1 Welding Procedure Specification (WPS).',
    ],
    plainEnglishExplanation: [
      'Every welder knows weld metal shrinks as it freezes and cools—pulling flanges out of square and bowing waterwall panels. Level 2 metallurgy explains why that happens and how to prove it with thermal expansion math.',
      'Heat Affected Zone (HAZ) metallurgy matters heavily in pressure work: rapid cooling in hardenable steel traps brittle martensite right next to the weld toe. Combining controlled preheat, interpass temperature, low-hydrogen consumables, and qualified WPS heat input keeps the joint ductile.',
    ],
    technicalTerms: [
      { term: 'Heat-Affected Zone (HAZ)', definition: 'Unmelted base metal adjacent to the weld whose microstructure and properties were altered by welding heat.' },
      { term: 'Carbon Equivalent (CE)', definition: 'Formula estimating steel hardenability and cold-cracking susceptibility based on C, Mn, Cr, Mo, V, Ni, Cu.' },
      { term: 'Essential Variable (ASME IX)', definition: 'WPS parameter (such as P-number, F-number, thickness range, PWHT) whose change beyond limits requires requalifying the PQR.' },
      { term: 'Angular Distortion', definition: 'Upward folding of plates caused by wider weld shrinkage near the top surface than the root.' },
    ],
    formulas: [
      {
        id: 'f-l2-therm',
        title: 'Linear Thermal Expansion',
        expression: 'ΔL = L × α × ΔT',
        variables: 'α_CS ≈ 6.5×10⁻⁶ /°F (11.7×10⁻⁶ /°C), α_304SS ≈ 9.6×10⁻⁶ /°F (17.3×10⁻⁶ /°C)',
        unitsNote: '300-series stainless expands ~50% more than carbon steel and conducts heat slower—causing greater distortion.',
        domain: 'Metallurgy',
      },
    ],
    workedExamples: [
      {
        title: 'Calculating Pipe Growth During Preheat / Steam Service',
        scenario: 'An 80 ft run of 304 stainless steel process piping is installed at 70°F and operates at 470°F (ΔT = 400°F). Calculate total linear growth.',
        given: ['L = 80 ft = 960 in', 'α = 9.6 × 10⁻⁶ /°F', 'ΔT = 400°F'],
        steps: [
          '1. Convert length to inches: 80 × 12 = 960 in.',
          '2. Multiply: 960 × 0.0000096 × 400 = 3.686 in.',
        ],
        finalAnswer: '+3.69 inches (over 3 5/8" of axial growth!)',
      },
    ],
    diagramId: 'welding-joints',
    diagramCaption: 'Joint Types, Groove Geometry & Distortion Vectors — see how balanced double-V bevels neutralize angular pull.',
    industrialScenario: {
      title: 'Preventing Flange Warpage on a 24" Nozzle',
      context: 'Welding a 24" 300# weld-neck flange onto a nozzle neck without a fixture.',
      keyTakeaway: 'Tack at 4 quadrants, weld balanced opposing quadrants using minimal weave/heat input, and verify flange face flatness with a straightedge before final pass.',
    },
    commonMistakes: [
      {
        habit: 'Cooling hot structural or pressure welds rapidly with a wet rag or compressed air.',
        correction: 'Quenching creates thermal shock and brittle martensite—always allow controlled slow cooling per WPS.',
      },
    ],
    knowledgeChecks: [
      {
        id: 'kc-l2-met-1',
        prompt: 'Why does 304 stainless steel distort noticeably more than carbon steel during identical TIG/MIG welding?',
        options: [
          'Higher thermal expansion coefficient (~50% greater) and lower thermal conductivity',
          'Lower melting point by 1,000°F',
          'Magnetic arc blow from austenitic grain structure',
          'Higher density requiring triple amperage',
        ],
        correctIndex: 0,
        explanation: 'Austenitic stainless traps heat locally (low conductivity) and expands ~50% more per degree than carbon steel.',
      },
    ],
    finalAssessment: [
      {
        id: 'fa-l2-met-1',
        level: 2,
        domain: 'Metallurgy',
        knowledgeType: 'Theoretical',
        prompt: 'Which weld discontinuity is primarily caused by damp low-hydrogen electrodes, high restraint, and rapid cooling in high-CE steel?',
        options: [
          'Hydrogen-induced cold cracking (underbead/HAZ cracking)',
          'Tungsten inclusion',
          'Excessive weld reinforcement',
          'Arc strike spatter',
        ],
        correctIndex: 0,
        explanation: 'Diffusible hydrogen + brittle HAZ microstructure + residual tensile stress = hydrogen cold cracking.',
        lessonId: 'l2-metallurgy-distortion',
      },
    ],
  },
  {
    id: 'l2-equipment-vessels-exchangers',
    level: 2,
    moduleCode: '428A-L2-05',
    title: 'Boiler Components, Storage Tanks, Pressure Vessels & Heat Exchangers',
    domain: 'Industrial Equipment',
    estimatedMinutes: 40,
    verificationTag: 'Verified 428A / RSOS',
    rsosTasks: ['Task C-11 (Assembles and fits)', 'Task D-13 (Services vessels)', 'Task D-14 (Removes components)'],
    learningObjectives: [
      'Identify TEMA shell-and-tube heat exchanger parts: channel cover, stationary/floating tubesheets, pass partitions, baffles, and tie rods.',
      'Explain vessel head types (hemispherical, 2:1 ellipsoidal, torispherical ASME F&D, flat) and support styles (skirts vs saddles).',
      'Describe bolted storage tank vs API welded tank construction components (annular ring, wind girder, floating roof seals).',
    ],
    plainEnglishExplanation: [
      'Whether pulling a U-tube bundle during an Alberta turnaround or setting a new package boiler in Ontario, you need exact component terminology for drawings, rigging plans, and Level 2 exams.',
      'Know the difference between fixed-tubesheet, U-tube, and floating-head exchangers—specifically how each handles differential thermal expansion between shell and tubes.',
    ],
    technicalTerms: [
      { term: '2:1 Ellipsoidal Head', definition: 'Standard pressure vessel head whose major-to-minor axis ratio is 2:1 (dish depth = ID / 4 plus straight flange).' },
      { term: 'Floating Tubesheet', definition: 'Internal tubesheet free to slide axially inside the shell cover so the tube bundle can expand/contract without buckling.' },
      { term: 'Saddle Support (Fixed vs Sliding)', definition: 'Horizontal vessel cradles where one saddle is anchored tight and the other uses slotted bolt holes to permit axial thermal growth.' },
      { term: 'Wind Girder', definition: 'Circumferential stiffening ring near the top of open-top or thin-wall storage tanks preventing shell buckling under wind load.' },
    ],
    formulas: [
      {
        id: 'f-l2-ellip-head',
        title: '2:1 Ellipsoidal Head Dish Depth & Volume',
        expression: 'Dish Depth = ID / 4   |   Volume (1 head) = (π × ID³) / 24',
        variables: 'ID = inside diameter; add straight flange (SF) for overall head height',
        unitsNote: 'Two 2:1 heads equal π × ID³ / 12.',
        domain: 'Industrial Equipment',
      },
    ],
    workedExamples: [
      {
        title: 'Inspecting Horizontal Vessel Saddle Anchor Bolts',
        scenario: 'During installation of a 60 ft horizontal deaerator on two concrete piers, both saddles have slotted anchor holes.',
        given: ['60 ft vessel heated to 250°F in operation'],
        steps: [
          '1. Tighten anchor nuts snug at the Fixed Saddle (typically near main piping riser).',
          '2. At the Sliding Saddle, leave double-nutted anchor bolts slightly backed off with slide plates/Teflon pads so the vessel expands freely without cracking concrete piers.',
        ],
        finalAnswer: 'One fixed saddle + one sliding saddle accommodates longitudinal thermal growth.',
      },
    ],
    diagramId: 'heat-exchanger',
    diagramCaption: 'Interactive Shell-and-Tube Heat Exchanger & Pressure Vessel Explorer — toggle between TEMA Heat Exchanger internals and ASME Vessel Anatomy.',
    industrialScenario: {
      title: 'Tube Bundle Extraction & Gasket Surface Protection',
      context: 'Pulling a 14,000 lb exchanger bundle with a hydraulic bundle extractor.',
      keyTakeaway: 'Never pry against precision serrated gasket seating surfaces (confining faces) or roll a bundle directly on thin baffle edges—use cradle rollers and protective flange covers.',
    },
    commonMistakes: [
      {
        habit: 'Torquing down the sliding-end anchor bolts of a long horizontal vessel tight to the pier.',
        correction: 'Locking both saddles binds thermal expansion and shears anchor bolts or buckles vessel saddles.',
      },
    ],
    knowledgeChecks: [
      {
        id: 'kc-l2-eq-1',
        prompt: 'Which TEMA heat exchanger design allows the tube bundle to be completely removed for external shell-side cleaning while also accommodating thermal expansion?',
        options: ['Floating-head exchanger', 'Fixed-tubesheet exchanger', 'Double-pipe hairpin', 'Plate-and-frame cooler'],
        correctIndex: 0,
        explanation: 'Floating-head designs allow full bundle removal AND independent thermal expansion (U-tube bundles also remove and expand, though interior U-bends are harder to clean mechanically).',
      },
    ],
    finalAssessment: [
      {
        id: 'fa-l2-eq-1',
        level: 2,
        domain: 'Industrial Equipment',
        knowledgeType: 'Theoretical',
        prompt: 'What is the internal dish depth (excluding straight flange) of a 96" ID 2:1 ellipsoidal vessel head?',
        options: ['24 in', '48 in', '16 in', '32 in'],
        correctIndex: 0,
        explanation: 'For a 2:1 ellipsoidal head, dish depth = ID ÷ 4 = 96 ÷ 4 = 24 inches.',
        lessonId: 'l2-equipment-vessels-exchangers',
      },
    ],
  },
];
