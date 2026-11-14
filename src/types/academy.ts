export type TopicDomain =
  | 'Mathematics'
  | 'Rigging'
  | 'Blueprint Reading'
  | 'Welding'
  | 'Metallurgy'
  | 'Fabrication'
  | 'Industrial Equipment'
  | 'Safety';

export type ApprenticeshipLevel = 1 | 2 | 3;

export type KnowledgeType = 'Practical' | 'Theoretical';

export type DomainClassification =
  | 'Strong'
  | 'Competent'
  | 'Needs review'
  | 'Requires instruction';

export type NavSection =
  | 'dashboard'
  | 'level1'
  | 'level2'
  | 'level3'
  | 'exams'
  | 'calculators'
  | 'rigging-sim'
  | 'crane-signals'
  | 'welding'
  | 'welding-sim'
  | 'blueprints'
  | 'glossary'
  | 'instructor'
  | 'notes'
  | 'reports';

export type DiagramId =
  | 'welding-positions'
  | 'welding-processes'
  | 'welding-joints'
  | 'welding-symbols'
  | 'sling-angles'
  | 'lifting-arrangements'
  | 'block-and-tackle'
  | 'crane-components'
  | 'pressure-vessel'
  | 'boiler-types'
  | 'heat-exchanger'
  | 'tank-construction'
  | 'orthographic-projection'
  | 'isometric-drawing'
  | 'plate-layout';

export interface TechnicalTerm {
  term: string;
  definition: string;
}

export interface FormulaItem {
  id: string;
  title: string;
  expression: string;
  variables: string;
  unitsNote: string;
  domain: TopicDomain;
}

export interface WorkedExample {
  title: string;
  scenario: string;
  given: string[];
  steps: string[];
  finalAnswer: string;
  shopNote?: string;
}

export interface KnowledgeCheckItem {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  formulaUsed?: string;
}

export interface Question {
  id: string;
  level: ApprenticeshipLevel | 'RedSeal';
  domain: TopicDomain;
  knowledgeType: KnowledgeType;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  formula?: string;
  lessonId?: string;
}

export interface Lesson {
  id: string;
  level: ApprenticeshipLevel;
  moduleCode: string;
  title: string;
  domain: TopicDomain;
  estimatedMinutes: number;
  verificationTag: 'Verified 428A / RSOS' | 'Supplementary Trade Theory' | 'Pending Official STO PDF Verification';
  rsosTasks: string[];
  learningObjectives: string[];
  plainEnglishExplanation: string[];
  technicalTerms: TechnicalTerm[];
  formulas: FormulaItem[];
  workedExamples: WorkedExample[];
  diagramId: DiagramId;
  diagramCaption: string;
  industrialScenario: {
    title: string;
    context: string;
    keyTakeaway: string;
    safetyNotice?: string;
  };
  commonMistakes: {
    habit: string;
    correction: string;
  }[];
  knowledgeChecks: KnowledgeCheckItem[];
  finalAssessment: Question[];
}

export interface CurriculumOutcome {
  id: string;
  level: ApprenticeshipLevel;
  code: string;
  title: string;
  domain: TopicDomain;
  sourceAuthority: string;
  verificationStatus:
    | 'Verified STO / RSOS Framework'
    | 'Supplementary Educational Alignment'
    | 'Pending Official STO PDF Verification';
  rsosAlignment: string;
  linkedLessonId?: string;
}

export interface DomainPerformance {
  domain: TopicDomain;
  correct: number;
  total: number;
  percentage: number;
  classification: DomainClassification;
  practicalCorrect: number;
  practicalTotal: number;
  theoreticalCorrect: number;
  theoreticalTotal: number;
}

export interface AssessmentResult {
  id: string;
  title: string;
  mode: 'diagnostic' | 'level1' | 'level2' | 'level3' | 'combined' | 'redseal' | 'topic';
  timed: boolean;
  durationSeconds: number;
  completedAt: string;
  totalCorrect: number;
  totalQuestions: number;
  percentage: number;
  targetPct: number;
  domainBreakdown: DomainPerformance[];
  practicalPercentage: number;
  theoreticalPercentage: number;
  weakDomains: TopicDomain[];
  answers: {
    questionId: string;
    selectedIndex: number;
    isCorrect: boolean;
  }[];
}

export interface StudyNote {
  id: string;
  title: string;
  domain: TopicDomain;
  level: ApprenticeshipLevel;
  content: string;
  updatedAt: string;
}

export interface UploadedDocumentRef {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: 'STO Curriculum PDF' | 'WPS / Welding' | 'Fabrication Drawing' | 'Notes / Textbook Photo';
  uploadedAt: string;
  aiSummary: string;
  generatedQuestions?: Question[];
}

export interface StudyDayPlan {
  day: string;
  focusDomain: TopicDomain;
  recommendedLessonId: string;
  taskDescription: string;
  targetMinutes: number;
  completed: boolean;
}

export interface StudentProfile {
  name: string;
  age: number;
  yearsShopExperience: number;
  previousLocal: string;
  currentLocal: string;
  weldingTickets: string[];
  targetPath: string;
}

export interface StudentProgress {
  profile: StudentProfile;
  currentStudyLevel: ApprenticeshipLevel;
  completedLessonIds: string[];
  lessonAssessmentScores: Record<string, number>;
  diagnosticResult: AssessmentResult | null;
  assessmentHistory: AssessmentResult[];
  weakSubjects: TopicDomain[];
  studyNotes: StudyNote[];
  uploadedDocs: UploadedDocumentRef[];
  studySchedule: StudyDayPlan[];
  bookmarkedFormulas: string[];
  weldingSessions: WeldingSessionRecord[];
  riggingSessions: RiggingSessionRecord[];
  signalProgress: SignalFlashcardProgress;
  bookmarkedGlossaryIds: string[];
  dailyStudySeconds: Record<string, number>;
  practiceTargetPct: number;
  lastUpdatedAt: string;
}

// ============================================================================
// 3D WELDING TRAINING SIMULATOR TYPES
// ============================================================================

export type WeldingProcess = 'SMAW' | 'FCAW-S' | 'FCAW-G' | 'GMAW' | 'GTAW' | 'PIPE';

export type ElectrodeSpec =
  | 'E6010'
  | 'E6011'
  | 'E6013'
  | 'E7018'
  | 'E71T-8'
  | 'E71T-1'
  | 'ER70S-6'
  | 'ER70S-2';

export type WeldingPosition =
  | '1G'
  | '2G'
  | '3G-UP'
  | '3G-DOWN'
  | '4G'
  | '1F'
  | '2F'
  | '3F-UP'
  | '3F-DOWN'
  | '4F';

export type JointPrep = 'v-groove' | 't-fillet' | 'lap';
export type Polarity = 'DCEP' | 'DCEN' | 'AC';
export type GraphicsQuality = 'low' | 'medium' | 'high';
export type CameraPreset = 'first-person' | 'side' | 'overhead' | 'orbit';
export type TrainingMode = 'guided' | 'free' | 'skills-test';

export interface MachineSettings {
  process: WeldingProcess;
  electrode: ElectrodeSpec;
  position: WeldingPosition;
  jointPrep: JointPrep;
  polarity: Polarity;
  amperage: number;
  voltage: number; // Applicable for FCAW / GMAW
  wireFeedSpeedIpm: number; // Applicable for FCAW / GMAW
  electrodeDiameterIn: number; // e.g., 0.09375 (3/32"), 0.125 (1/8"), 0.15625 (5/32"), 0.045
  materialThicknessIn: number; // e.g., 0.25, 0.375, 0.5, 0.75
  gasFlowCfh: number; // Applicable for FCAW-G / GMAW / GTAW
}

export interface WeldDefectFlags {
  undercut: boolean;
  porosity: boolean;
  overlap: boolean;
  excessiveBuildup: boolean;
  incompleteFusion: boolean;
  burnThrough: boolean;
  arcBlowOrErratic: boolean;
}

export interface WeldSamplePoint {
  tMs: number;
  progress: number; // 0..1 along joint seam
  lateralOffsetMm: number; // cross-seam weave / drift from centerline
  arcLengthMm: number;
  travelAngleDeg: number; // drag/push angle
  workAngleDeg: number; // angle from plate/bisector
  travelSpeedIpm: number;
  arcStability: number; // 0..100
  heatInputKjPerIn: number;
  beadWidthMm: number;
  reinforcementMm: number;
  penetrationMm: number;
  fusionScore: number; // 0..100
  defects: WeldDefectFlags;
}

export interface WeldInstantMetrics {
  arcActive: boolean;
  arcVoltageLive: number;
  arcStability: number;
  heatInputKjPerIn: number;
  beadWidthMm: number;
  reinforcementMm: number;
  penetrationMm: number;
  fusionIndex: number;
  spatterIntensity: number; // 0..1
  defects: WeldDefectFlags;
  warnings: string[];
}

export interface WeldPerformanceReport {
  overallScore: number;
  arcStabilityScore: number;
  angleAccuracyScore: number;
  travelSpeedScore: number;
  arcLengthScore: number;
  fusionQualityScore: number;
  avgHeatInputKjPerIn: number;
  avgTravelSpeedIpm: number;
  avgArcLengthMm: number;
  avgTravelAngleDeg: number;
  avgWorkAngleDeg: number;
  weldLengthInches: number;
  defectCounts: {
    undercut: number;
    porosity: number;
    overlap: number;
    excessiveBuildup: number;
    incompleteFusion: number;
    burnThrough: number;
  };
  mistakes: string[];
  corrections: string[];
  simulationDisclaimer: string;
}

export interface WeldingSessionRecord {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  mode: TrainingMode;
  completedAt: string;
  settings: MachineSettings;
  report: WeldPerformanceReport;
  samples: WeldSamplePoint[];
}

export interface WeldingTrainingExercise {
  id: string;
  title: string;
  level: ApprenticeshipLevel;
  modeDefault: TrainingMode;
  recommendedProcess: WeldingProcess;
  recommendedElectrode: ElectrodeSpec;
  recommendedPosition: WeldingPosition;
  recommendedJoint: JointPrep;
  targetAmpsRange: [number, number];
  targetVoltageRange?: [number, number];
  targetWfsRange?: [number, number];
  targetTravelSpeedIpm: [number, number];
  targetTravelAngleDeg: [number, number];
  targetWorkAngleDeg: [number, number];
  targetArcLengthMm: [number, number];
  recommendedPolarity: Polarity;
  recommendedDiameterIn: number;
  recommendedThicknessIn: number;
  canadianCodeNote: string;
  steps: string[];
  passThreshold: number;
}

// ============================================================================
// SEARCHABLE TECHNICAL GLOSSARY TYPES
// ============================================================================

export type GlossaryCategory =
  | 'Welding Processes'
  | 'Positions, Joints & Consumables'
  | 'Metallurgy, Defects & NDE'
  | 'Boilers, Vessels & Piping'
  | 'Rigging & Hoisting'
  | 'Blueprints & Layout'
  | 'Canadian Standards, Safety & 428A'
  | 'Shop & Field Expressions';

export type GlossaryRegister = 'Formal Technical' | 'Shop Slang';

export interface GlossaryEntry {
  id: string;
  term: string;
  acronym?: string;
  fullMeaning: string;
  category: GlossaryCategory;
  register: GlossaryRegister;
  canadianNote?: string;
  beginnerDefinition: string;
  advancedDefinition: string;
  jobsiteExample: string;
  relatedTermIds: string[];
  lessonId: string | null;
  simulatorPresetId?: string;
  diagramId?: DiagramId;
  keywords?: string[];
}

// ============================================================================
// 3D RIGGING & CRANE LIFT SIMULATOR TYPES (PHASE 4)
// ============================================================================

export type UnitDisplayMode = 'imperial' | 'metric';
export type EnvironmentMode = 'indoor-shop' | 'outdoor-yard';
export type RiggingCameraPreset = 'orbit' | 'inspector' | 'overhead' | 'side';
export type RiggingTrainingMode =
  | 'guided'
  | 'free'
  | 'assessment'
  | 'certification-prep';

export type RiggingSlingCategory =
  | 'wire-rope'
  | 'synthetic-web'
  | 'alloy-chain';

export type RiggingHitchType = 'vertical' | 'choker' | 'basket';
export type ShackleKind = 'bolt-type' | 'screw-pin';
export type EquipmentCondition = 'serviceable' | 'damaged-frayed' | 'missing-tag';

export interface RiggingSlingSpec {
  id: string;
  name: string;
  category: RiggingSlingCategory;
  sizeLabel: string;
  verticalWllLb: number;
  chokerWllLb: number;
  basketWllLb: number;
  designFactor: number; // simulated educational DF (e.g. 5:1 wire/synthetic, 4:1 chain)
  defaultLengthFt: number;
  condition: EquipmentCondition;
  notes: string;
}

export interface RiggingShackleSpec {
  id: string;
  name: string;
  kind: ShackleKind;
  pinSizeIn: string;
  wllLb: number;
  allowSideLoadDeratePct: number; // side-load capability note
  pinSecuredDefault: boolean;
  condition: EquipmentCondition;
}

export type LoadShapeKind =
  | 'i-beam'
  | 'uneven-beam'
  | 'offset-assembly'
  | 'pipe-spool'
  | 'plate-bundle'
  | 'structural-frame'
  | 'cylindrical-vessel';

export interface AttachmentPointDef {
  id: string;
  label: string;
  localXFt: number; // relative to load geometric center
  localYFt: number; // top attachment plane height relative to load center
  localZFt: number;
  isEngineeredLug: boolean;
  requiresSoftener?: boolean;
}

export interface LoadDefinition {
  id: string;
  name: string;
  shape: LoadShapeKind;
  lengthFt: number;
  widthFt: number;
  heightFt: number;
  weightLb: number;
  cgOffsetXFt: number; // +X right of geometric center, -X left
  cgOffsetYFt: number;
  cgOffsetZFt: number;
  sharpEdges: boolean;
  isRigidStructure: boolean;
  attachmentPoints: AttachmentPointDef[];
  description: string;
  shopNote: string;
}

export interface RiggingConfiguration {
  loadId: string;
  slingId: string;
  shackleId: string;
  hitchType: RiggingHitchType;
  legCount: 2 | 3 | 4;
  leftPointId: string;
  rightPointId: string;
  leftLengthFt: number;
  rightLengthFt: number;
  hookOffsetXFt: number; // manual hook shift relative to geometric center before lift
  hookOffsetZFt: number;
  useSpreaderBeam: boolean;
  useEdgeSofteners: boolean;
  shacklePinTightened: boolean;
  inspectedHardware: boolean;
  tagLineAttached: boolean;
}

export interface LegCalculation {
  legLabel: 'Left Leg (A)' | 'Right Leg (B)';
  pointId: string;
  lengthFt: number;
  horizontalSpanFt: number;
  verticalDropFt: number;
  horizontalAngleDeg: number;
  tensionLb: number;
  effectiveWllLb: number;
  utilizationPct: number;
  status: 'safe' | 'caution' | 'critical' | 'overload';
}

export interface RiggingWarning {
  severity: 'info' | 'caution' | 'critical';
  code: string;
  message: string;
  recommendation: string;
}

export interface RiggingStaticsResult {
  valid: boolean;
  geometryError?: string;
  totalLoadWeightLb: number;
  hookHeightAbovePickFt: number;
  totalHorizontalSpreadFt: number;
  leftLeg: LegCalculation;
  rightLeg: LegCalculation;
  maxTensionLb: number;
  minHorizontalAngleDeg: number;
  cgPositionXFt: number;
  hookToCgOffsetXFt: number;
  predictedStaticTiltDeg: number;
  predictedVerticalShareLeftPct: number;
  predictedVerticalShareRightPct: number;
  indeterminateWarning: boolean;
  effectiveLoadBearingLegs: number;
  overloadedComponent: 'none' | 'left-sling' | 'right-sling' | 'shackle' | 'connection' | 'geometry';
  willFailOnLift: boolean;
  predictedFailureReason: string | null;
  warnings: RiggingWarning[];
}

export type CraneCommand =
  | 'take-slack'
  | 'test-lift'
  | 'hoist'
  | 'lower'
  | 'stop'
  | 'emergency-stop'
  | 'bridge-left'
  | 'bridge-right'
  | 'trolley-fwd'
  | 'trolley-back'
  | 'reset';

export type CraneLiftPhase =
  | 'grounded'
  | 'taking-slack'
  | 'test-lift-hold'
  | 'suspended'
  | 'lowering'
  | 'landed-target'
  | 'stopped'
  | 'emergency-stopped'
  | 'failed';

export type LiftFailureCause =
  | 'none'
  | 'sling-overload-angle'
  | 'sling-overload-asymmetric'
  | 'shackle-overload'
  | 'damaged-hardware-failure'
  | 'unsecured-connection-slip'
  | 'sharp-edge-cut'
  | 'excessive-tilt-drop'
  | 'obstacle-collision';

export interface RiggingSimFrame {
  tSec: number;
  phase: CraneLiftPhase;
  craneXFt: number; // bridge position
  craneZFt: number; // trolley position
  hookYFt: number; // hook height above floor
  loadXFt: number;
  loadYFt: number; // center of load height above floor
  loadZFt: number;
  tiltZDeg: number; // roll/tilt around Z axis (caused by X CG offset / unequal legs)
  tiltXDeg: number; // pitch around X axis
  swingXDeg: number; // pendulum sway angle X
  swingZDeg: number; // pendulum sway angle Z
  velYFtPerSec: number;
  liveTensionLeftLb: number;
  liveTensionRightLb: number;
  dynamicFactor: number;
  slackRemainingFt: number;
  grounded: boolean;
  collisionActive: boolean;
  failed: boolean;
  failureCause: LiftFailureCause;
}

export interface LiftFailureAnalysis {
  occurred: boolean;
  cause: LiftFailureCause;
  title: string;
  overloadedPart: string;
  primaryReason: string;
  physicsExplanation: string;
  recommendedCorrections: string[];
  peakLeftTensionLb: number;
  peakRightTensionLb: number;
  peakTiltDeg: number;
  timeOfFailureSec: number | null;
}

export interface RiggingSimulationState {
  phase: CraneLiftPhase;
  activeCommand: CraneCommand | 'idle';
  tSec: number;
  craneXFt: number;
  craneZFt: number;
  hookYFt: number;
  loadXFt: number;
  loadYFt: number;
  loadZFt: number;
  loadVx: number;
  loadVy: number;
  loadVz: number;
  tiltZDeg: number;
  tiltZVelDeg: number;
  tiltXDeg: number;
  swingXDeg: number;
  swingXVel: number;
  swingZDeg: number;
  swingZVel: number;
  liveTensionLeftLb: number;
  liveTensionRightLb: number;
  dynamicFactor: number;
  slackRemainingFt: number;
  collisionCount: number;
  collisionDetail: string | null;
  failed: boolean;
  failureCause: LiftFailureCause;
  emergencyStopLatched: boolean;
  targetZoneXFt: number;
  targetZoneZFt: number;
  landedInTarget: boolean;
  lastSignalIssuedAtSec: number | null;
  signalCommsLost: boolean;
  frames: RiggingSimFrame[];
  failureAnalysis: LiftFailureAnalysis | null;
}

export interface RiggingScenario {
  id: string;
  number: number;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Certification Prep';
  environment: EnvironmentMode;
  objective: string;
  initialConfig: RiggingConfiguration;
  targetZoneXFt: number;
  targetZoneZFt: number;
  maxAllowedTiltDeg: number;
  minAllowedAngleDeg: number;
  requiresSignalControl?: boolean;
  requiresTagLine?: boolean;
  guidedHints: string[];
  canadianCodeNote: string;
  passCriteriaSummary: string;
}

export interface RiggingSessionRecord {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  mode: RiggingTrainingMode;
  completedAt: string;
  passed: boolean;
  scorePct: number;
  maxTensionLb: number;
  minAngleDeg: number;
  peakTiltDeg: number;
  failureCause: LiftFailureCause;
  criteriaBreakdown: {
    label: string;
    passed: boolean;
    detail: string;
  }[];
}

// ============================================================================
// CRANE HAND SIGNALS TRAINING CENTRE TYPES (PHASE 4)
// ============================================================================

export type CraneSignalId =
  | 'hoist'
  | 'lower'
  | 'stop'
  | 'emergency-stop'
  | 'swing'
  | 'boom-up'
  | 'boom-down'
  | 'travel'
  | 'trolley-travel'
  | 'move-slowly'
  | 'use-main-hoist'
  | 'use-aux-hoist'
  | 'dog-everything';

export type CraneApplicability = 'Overhead & Gantry' | 'Mobile Crane' | 'Both Overhead & Mobile';

export interface CraneSignalCard {
  id: CraneSignalId;
  name: string;
  difficulty: 'Beginner' | 'Advanced';
  applicability: CraneApplicability;
  standardReference: string;
  movementSummary: string;
  stepByStepPosture: string;
  operationalMeaning: string;
  safetyConsiderations: string;
  similarSignalIds: CraneSignalId[];
  mappedSimulatorCommand?: CraneCommand;
  spokenScript: string;
}

export interface SignalFlashcardProgress {
  knownIds: CraneSignalId[];
  practiceIds: CraneSignalId[];
  bookmarkedIds: CraneSignalId[];
  srsNextDue: Record<string, string>;
  quizAttempts: number;
  quizCorrect: number;
}

