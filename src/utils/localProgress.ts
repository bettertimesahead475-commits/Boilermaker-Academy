import type { StudentProgress } from '../types/academy';

export const DEFAULT_PROGRESS: StudentProgress = {
  profile: {
    name: 'Boilermaker Student',
    age: 0,
    yearsShopExperience: 0,
    previousLocal: '',
    currentLocal: '',
    weldingTickets: [],
    targetPath: 'Canadian Boilermaker / Red Seal Preparation',
  },
  currentStudyLevel: 1,
  completedLessonIds: [],
  lessonAssessmentScores: {},
  diagnosticResult: null,
  assessmentHistory: [],
  weakSubjects: ['Mathematics', 'Rigging', 'Blueprint Reading'],
  studyNotes: [],
  uploadedDocs: [],
  studySchedule: [
    {
      day: 'Day 1 (Mon)',
      focusDomain: 'Mathematics',
      recommendedLessonId: 'l1-math-fractions-conversions',
      taskDescription: 'Complete 50-question diagnostic or start Trade Math I (Fractions, Decimals & Metric Conversions)',
      targetMinutes: 45,
      completed: false,
    },
    {
      day: 'Day 2 (Tue)',
      focusDomain: 'Mathematics',
      recommendedLessonId: 'l1-math-geometry-pythagoras',
      taskDescription: 'Trade Math II: Geometry, Cylinder Volumes & Pythagorean Pipe Offsets',
      targetMinutes: 45,
      completed: false,
    },
    {
      day: 'Day 3 (Wed)',
      focusDomain: 'Rigging',
      recommendedLessonId: 'l1-rigging-basics',
      taskDescription: 'Sling Tension Angles, L/H Ratio & Choker/Basket Derating Drills',
      targetMinutes: 45,
      completed: false,
    },
    {
      day: 'Day 4 (Thu)',
      focusDomain: 'Blueprint Reading',
      recommendedLessonId: 'l1-blueprint-basics',
      taskDescription: 'Third-Angle Orthographic Views & AWS/CSA Welding Symbol Practice',
      targetMinutes: 45,
      completed: false,
    },
    {
      day: 'Day 5 (Fri)',
      focusDomain: 'Industrial Equipment',
      recommendedLessonId: 'l1-boilers-steel-id',
      taskDescription: 'Fire-Tube vs Water-Tube Boilers, Drums, Downcomers & SA-516 Traceability',
      targetMinutes: 45,
      completed: false,
    },
    {
      day: 'Day 6 (Sat)',
      focusDomain: 'Safety',
      recommendedLessonId: 'l1-safety-foundations',
      taskDescription: 'Ontario OHSA, Confined Space Reg. 632/05, WHMIS 2015 & LOTO Review',
      targetMinutes: 60,
      completed: false,
    },
    {
      day: 'Day 7 (Sun)',
      focusDomain: 'Welding',
      recommendedLessonId: 'l1-welding-oxy-smaw',
      taskDescription: '25-Question Level 1 Practice Exam + Formula Sheet Review',
      targetMinutes: 60,
      completed: false,
    },
  ],
  bookmarkedFormulas: ['f-sling-tension', 'f-plate-weight', 'f-mean-circ', 'f-pythagoras'],
  weldingSessions: [],
  riggingSessions: [],
  signalProgress: {
    knownIds: [],
    practiceIds: [],
    bookmarkedIds: ['hoist', 'stop', 'emergency-stop'],
    srsNextDue: {},
    quizAttempts: 0,
    quizCorrect: 0,
  },
  bookmarkedGlossaryIds: ['e7018', 'dcep', 'undercut', 'heat-input', 'wll', 'sling-angle'],
  dailyStudySeconds: {},
  practiceTargetPct: 80,
  lastUpdatedAt: new Date().toISOString(),
};

const KEY = 'boilermaker-academy-progress-device-v1';
export function readLocalProgress(): StudentProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_PROGRESS);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid progress');
    const data = parsed as Partial<StudentProgress>;
    return {
      ...structuredClone(DEFAULT_PROGRESS), ...data,
      profile: { ...DEFAULT_PROGRESS.profile, ...(data.profile || {}) },
      completedLessonIds: Array.isArray(data.completedLessonIds) ? data.completedLessonIds : [],
      assessmentHistory: Array.isArray(data.assessmentHistory) ? data.assessmentHistory : [],
      studyNotes: Array.isArray(data.studyNotes) ? data.studyNotes : [],
      dailyStudySeconds: data.dailyStudySeconds && typeof data.dailyStudySeconds === 'object' ? data.dailyStudySeconds : {},
    };
  } catch { return structuredClone(DEFAULT_PROGRESS); }
}
export function saveLocalProgress(progress: StudentProgress): void {
  localStorage.setItem(KEY, JSON.stringify({ ...progress, lastUpdatedAt: new Date().toISOString() }));
}
export function resetLocalProgress(): StudentProgress {
  const fresh = structuredClone(DEFAULT_PROGRESS);
  saveLocalProgress(fresh);
  return fresh;
}

/** Validates the structure of a portable progress backup before replacing local data. */
export function parseProgressBackup(input: string): StudentProgress {
  if (input.length > 5_000_000) throw new Error('Backup exceeds the 5 MB limit.');
  let parsed: unknown;
  try { parsed = JSON.parse(input); } catch { throw new Error('Backup is not valid JSON.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Backup must contain a progress object.');
  const p = parsed as Record<string, unknown>;
  if (!p.profile || typeof p.profile !== 'object' || Array.isArray(p.profile)) throw new Error('Backup has no student profile.');
  const profile = p.profile as Record<string, unknown>;
  if (typeof profile.name !== 'string' || profile.name.length > 200) throw new Error('Backup has an invalid student name.');
  if (typeof profile.age !== 'number' || !Number.isFinite(profile.age) || profile.age < 0 || profile.age > 120) throw new Error('Backup has an invalid student age.');
  if (!Array.isArray(p.completedLessonIds) || !p.completedLessonIds.every(x => typeof x === 'string')) throw new Error('Backup has invalid completed lessons.');
  if (!Array.isArray(p.assessmentHistory) || !Array.isArray(p.studyNotes)) throw new Error('Backup is missing study history or notes.');
  if (!p.dailyStudySeconds || typeof p.dailyStudySeconds !== 'object' || Array.isArray(p.dailyStudySeconds)) throw new Error('Backup has invalid study-time records.');
  if (!Object.values(p.dailyStudySeconds).every(x => typeof x === 'number' && Number.isFinite(x) && x >= 0)) throw new Error('Backup contains invalid study durations.');
  if (p.completedLessonIds.length > 10000 || p.assessmentHistory.length > 10000 || p.studyNotes.length > 10000) throw new Error('Backup contains too many records.');
  if (!p.studyNotes.every(x => x && typeof x === 'object' && typeof x.title === 'string' && typeof x.content === 'string')) throw new Error('Backup has malformed study notes.');
  if (!Array.isArray(p.weldingSessions) || !Array.isArray(p.riggingSessions)) throw new Error('Backup is missing simulator session arrays.');
  if (p.currentStudyLevel !== 1 && p.currentStudyLevel !== 2 && p.currentStudyLevel !== 3) throw new Error('Backup has an invalid study level.');
  return { ...structuredClone(DEFAULT_PROGRESS), ...p } as StudentProgress;
}

/** Calendar-day key in the student's own timezone, avoiding UTC date rollover. */
export function getLocalStudyDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Prevents an unattended, open browser tab from inflating study-time statistics. */
export function isStudyActivityRecent(lastActivityMs: number, nowMs: number, idleLimitMs = 5 * 60 * 1000): boolean {
  return Number.isFinite(lastActivityMs) && Number.isFinite(nowMs)
    && nowMs >= lastActivityMs && nowMs - lastActivityMs <= idleLimitMs;
}
