import { CraneSignalCard } from '../types/academy';

export const CRANE_SIGNAL_CARDS: CraneSignalCard[] = [
  {
    id: 'hoist',
    name: 'Hoist',
    difficulty: 'Beginner',
    applicability: 'Both Overhead & Mobile',
    standardReference: 'ASME B30.2 / B30.5 · Ontario OHSA Reg. 213/91',
    movementSummary: 'With forearm vertical and forefinger pointing up, move hand in small horizontal circles.',
    stepByStepPosture:
      'Raise right elbow near shoulder height with forearm vertical, index finger pointing straight upward, and rotate wrist/hand in continuous small horizontal circles.',
    operationalMeaning: 'Raise the hoist hook and load vertically upward at normal operating speed.',
    safetyConsiderations:
      'Confirm load is directly under the crane hook (plumb) and clear of pinch points before signalling Hoist. Stop immediately if rigging snags.',
    similarSignalIds: ['move-slowly', 'lower', 'use-main-hoist'],
    mappedSimulatorCommand: 'hoist',
    spokenScript:
      'Hoist. Hold forearm vertical with forefinger pointing up, and move hand in small horizontal circles.',
  },
  {
    id: 'lower',
    name: 'Lower',
    difficulty: 'Beginner',
    applicability: 'Both Overhead & Mobile',
    standardReference: 'ASME B30.2 / B30.5 · Ontario OHSA Reg. 213/91',
    movementSummary: 'With arm extended downward and forefinger pointing down, move hand in small horizontal circles.',
    stepByStepPosture:
      'Extend arm straight downward beside your body, point index finger down toward the deck, and trace small horizontal circles.',
    operationalMeaning: 'Lower the hook block and suspended load smoothly downward.',
    safetyConsiderations:
      'Ensure cribbing, dunnage, or laydown pad is ready and feet/hands are completely clear of the landing zone.',
    similarSignalIds: ['hoist', 'move-slowly', 'boom-down'],
    mappedSimulatorCommand: 'lower',
    spokenScript:
      'Lower. Extend arm downward with forefinger pointing down, and move hand in small horizontal circles.',
  },
  {
    id: 'stop',
    name: 'Stop',
    difficulty: 'Beginner',
    applicability: 'Both Overhead & Mobile',
    standardReference: 'ASME B30.2 / B30.5 · Ontario OHSA Reg. 213/91',
    movementSummary: 'With one arm extended horizontally and palm down, move arm back and forth horizontally.',
    stepByStepPosture:
      'Extend one arm out to your side at shoulder height with palm facing down, and sweep the arm horizontally back and forth.',
    operationalMeaning: 'Halt current crane motion smoothly and hold load in position.',
    safetyConsiderations:
      'Keep arm crisp and visible in operator line of sight. Never confuse single-arm Stop with two-arm Emergency Stop.',
    similarSignalIds: ['emergency-stop', 'dog-everything'],
    mappedSimulatorCommand: 'stop',
    spokenScript:
      'Stop. Extend one arm horizontally with palm facing down, and sweep back and forth horizontally.',
  },
  {
    id: 'emergency-stop',
    name: 'Emergency Stop',
    difficulty: 'Beginner',
    applicability: 'Both Overhead & Mobile',
    standardReference: 'ASME B30.2 / B30.5 · Ontario OHSA Reg. 213/91',
    movementSummary: 'With BOTH arms extended horizontally and palms down, move both arms back and forth rapidly.',
    stepByStepPosture:
      'Extend BOTH arms straight out horizontally at shoulder level with palms facing downward, sweeping both arms vigorously back and forth.',
    operationalMeaning: 'Immediately arrest all crane functions using emergency brake/stop.',
    safetyConsiderations:
      'ANY person on site may give an Emergency Stop signal and the operator MUST obey it immediately.',
    similarSignalIds: ['stop', 'dog-everything'],
    mappedSimulatorCommand: 'emergency-stop',
    spokenScript:
      'Emergency Stop. Extend both arms horizontally with palms down, and move both arms back and forth.',
  },
  {
    id: 'move-slowly',
    name: 'Move Slowly',
    difficulty: 'Beginner',
    applicability: 'Both Overhead & Mobile',
    standardReference: 'ASME B30.2 / B30.5 · IHSA Rigging Manual',
    movementSummary: 'Use one hand to give the desired motion signal while holding the other palm stationary in front of it.',
    stepByStepPosture:
      'Hold your left hand flat and stationary just above/in front of your right hand while your right hand gives a subtle Hoist or Lower circle.',
    operationalMeaning: 'Creep or inch the load slowly for precision fit-up, test lift, or landing on cribbing.',
    safetyConsiderations:
      'Essential during initial 6-inch test lift, flange alignment, and seating heavy vessels onto saddles.',
    similarSignalIds: ['hoist', 'lower'],
    mappedSimulatorCommand: 'test-lift',
    spokenScript:
      'Move Slowly. Use one hand to give any motion signal, and place the other hand motionless in front of the hand giving the motion signal.',
  },
  {
    id: 'travel',
    name: 'Travel (Bridge / Crawler)',
    difficulty: 'Beginner',
    applicability: 'Overhead & Gantry',
    standardReference: 'ASME B30.2 Overhead & Gantry Cranes',
    movementSummary: 'Arm extended forward, hand open and slightly raised, make pushing motion in direction of travel.',
    stepByStepPosture:
      'Extend arm forward toward the direction of bridge travel with hand open, fingers together, palm facing outward, making repeated pushing motions.',
    operationalMeaning: 'Move the overhead crane bridge along the runway rails in the indicated direction.',
    safetyConsiderations:
      'Verify runway path is clear of workers, ladders, and elevated work platforms before signalling bridge travel.',
    similarSignalIds: ['trolley-travel', 'swing'],
    mappedSimulatorCommand: 'bridge-right',
    spokenScript:
      'Bridge Travel. Extend arm forward with hand open and slightly raised, making pushing motions in the direction of travel.',
  },
  {
    id: 'trolley-travel',
    name: 'Trolley Travel',
    difficulty: 'Beginner',
    applicability: 'Overhead & Gantry',
    standardReference: 'ASME B30.2 Overhead & Gantry Cranes',
    movementSummary: 'Palm up, fingers closed, thumb pointing in direction of motion, jerk hand horizontally.',
    stepByStepPosture:
      'Hold hand at chest/shoulder height with palm upward, fingers curled into palm, and thumb pointing firmly toward the desired trolley direction with short horizontal jerks.',
    operationalMeaning: 'Move the overhead trolley across the bridge girder toward the thumb direction.',
    safetyConsiderations:
      'Distinguish carefully from Boom Up/Down (mobile crane): thumb points horizontally along the bridge girder for overhead trolley travel.',
    similarSignalIds: ['travel', 'boom-up', 'boom-down'],
    mappedSimulatorCommand: 'trolley-fwd',
    spokenScript:
      'Trolley Travel. Hold palm up with fingers closed and thumb pointing in the direction of trolley motion, jerking hand horizontally.',
  },
  {
    id: 'swing',
    name: 'Swing',
    difficulty: 'Beginner',
    applicability: 'Mobile Crane',
    standardReference: 'ASME B30.5 Mobile & Locomotive Cranes',
    movementSummary: 'Arm extended horizontally, point with forefinger in the direction of boom swing.',
    stepByStepPosture:
      'Extend arm straight out horizontally at shoulder level and point distinctly with your index finger toward the direction the crane upperworks should swing.',
    operationalMeaning: 'Rotate/slew a mobile or jib crane boom in the pointed direction.',
    safetyConsiderations:
      'Applies to rotating mobile/tower/jib cranes—not standard overhead bridge cranes. Watch tail-swing clearance.',
    similarSignalIds: ['travel', 'stop'],
    spokenScript:
      'Swing. Extend arm horizontally and point with forefinger in the direction of swing of the boom.',
  },
  {
    id: 'boom-up',
    name: 'Raise Boom (Boom Up)',
    difficulty: 'Advanced',
    applicability: 'Mobile Crane',
    standardReference: 'ASME B30.5 Mobile & Locomotive Cranes',
    movementSummary: 'Arm extended, fingers closed, thumb pointing upward.',
    stepByStepPosture:
      'Extend arm out horizontally/slightly forward with fingers closed into a fist and thumb pointing straight UP.',
    operationalMeaning: 'Boom up (decrease operating radius, raise boom tip angle).',
    safetyConsiderations:
      'Mobile crane signal only. Remember booming up raises the hook slightly and reduces radius; watch two-blocking near the boom tip.',
    similarSignalIds: ['boom-down', 'trolley-travel'],
    spokenScript:
      'Raise Boom. Extend arm with fingers closed and thumb pointing upward.',
  },
  {
    id: 'boom-down',
    name: 'Lower Boom (Boom Down)',
    difficulty: 'Advanced',
    applicability: 'Mobile Crane',
    standardReference: 'ASME B30.5 Mobile & Locomotive Cranes',
    movementSummary: 'Arm extended, fingers closed, thumb pointing downward.',
    stepByStepPosture:
      'Extend arm out horizontally/slightly forward with fingers closed into a fist and thumb pointing straight DOWN.',
    operationalMeaning: 'Boom down (increase operating radius, lower boom tip).',
    safetyConsiderations:
      'Mobile crane signal only. Increasing radius sharply reduces rated mobile crane load-chart capacity.',
    similarSignalIds: ['boom-up', 'lower'],
    spokenScript:
      'Lower Boom. Extend arm with fingers closed and thumb pointing downward.',
  },
  {
    id: 'use-main-hoist',
    name: 'Use Main Hoist',
    difficulty: 'Advanced',
    applicability: 'Both Overhead & Mobile',
    standardReference: 'ASME B30.2 / B30.5 · IHSA Rigging Manual',
    movementSummary: 'Tap fist on top of hard hat/head, then give the regular hoist/lower signal.',
    stepByStepPosture:
      'Tap the top of your hard hat clearly with a closed fist two or three times before transitioning into the standard Hoist or Lower signal.',
    operationalMeaning: 'Select and operate the primary (heavy-capacity) hoist drum.',
    safetyConsiderations:
      'Prevents inadvertently hoisting heavy boiler components on a lighter auxiliary whip line.',
    similarSignalIds: ['use-aux-hoist', 'hoist'],
    mappedSimulatorCommand: 'take-slack',
    spokenScript:
      'Use Main Hoist. Tap fist on head, then use regular signals.',
  },
  {
    id: 'use-aux-hoist',
    name: 'Use Auxiliary Hoist (Whip Line)',
    difficulty: 'Advanced',
    applicability: 'Both Overhead & Mobile',
    standardReference: 'ASME B30.2 / B30.5 · IHSA Rigging Manual',
    movementSummary: 'Tap elbow with one hand, then give the regular hoist/lower signal.',
    stepByStepPosture:
      'Place one hand firmly on your bent elbow (tapping the elbow) to indicate the auxiliary/whip line, then give the required motion signal.',
    operationalMeaning: 'Select and operate the auxiliary (fast single-part whip) hoist.',
    safetyConsiderations:
      'Never exceed auxiliary whip line rated capacity when dual-hooked for vessel upending or tailing.',
    similarSignalIds: ['use-main-hoist', 'hoist'],
    spokenScript:
      'Use Auxiliary Hoist. Tap elbow with one hand, then use regular signals.',
  },
  {
    id: 'dog-everything',
    name: 'Dog Everything (Lock & Hold)',
    difficulty: 'Advanced',
    applicability: 'Both Overhead & Mobile',
    standardReference: 'ASME B30.2 / B30.5 · Ontario OHSA',
    movementSummary: 'Clasp hands together in front of body at waist/chest height.',
    stepByStepPosture:
      'Clasp both hands firmly together in front of your torso and hold steady.',
    operationalMeaning: 'Set brakes/dogs and hold crane completely stationary until further instruction.',
    safetyConsiderations:
      'Used when pausing work with a rigged hook or waiting for crew alignment; does not replace lowering load to deck for unattended breaks.',
    similarSignalIds: ['stop', 'emergency-stop'],
    mappedSimulatorCommand: 'stop',
    spokenScript:
      'Dog Everything. Clasp hands in front of body to lock and hold all crane motions.',
  },
];
