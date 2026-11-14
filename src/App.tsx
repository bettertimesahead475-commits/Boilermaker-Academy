import React, { useCallback, useEffect, useState } from 'react';
import {
  Anchor,
  BarChart3,
  BookA,
  BookOpen,
  Bot,
  Layers3,
  Calculator,
  ClipboardCheck,
  Compass,
  Flame,
  Hand,
  LayoutDashboard,
  Layers,
  Menu,
  NotebookPen,
  Sparkles,
  X,
} from 'lucide-react';
import { ProvinceFlashcards } from './components/ProvinceFlashcards';
import { AiInstructorView } from './components/AiInstructorView';
import { CalculatorsView } from './components/CalculatorsView';
import { CraneSignalsView } from './components/CraneSignalsView';
import { ExamSimulator } from './components/ExamSimulator';
import { GlossaryDrawer } from './components/GlossaryDrawer';
import { GlossaryView } from './components/GlossaryView';
import { LessonViewer } from './components/LessonViewer';
import { RiggingSimulatorView } from './components/RiggingSimulatorView';
import { StudyDashboard } from './components/StudyDashboard';
import { ProgressReportsView, StudyNotesView } from './components/StudyNotesAndReports';
import { LevelCurriculumView, WeldingAndBlueprintsHub } from './components/WeldingAndBlueprintsHub';
import { WeldingSimulatorView } from './components/WeldingSimulatorView';
import { LESSON_BY_DOMAIN_DEFAULT } from './data/curriculumMap';
import { ALL_LESSONS } from './data/examQuestions';
import {
  ApprenticeshipLevel,
  AssessmentResult,
  NavSection,
  RiggingSessionRecord,
  SignalFlashcardProgress,
  StudentProgress,
  StudyNote,
  UploadedDocumentRef,
  WeldingSessionRecord,
} from './types/academy';
import { getLocalStudyDateKey, readLocalProgress, resetLocalProgress, saveLocalProgress } from './utils/localProgress';
import { generateSevenDayPlan } from './utils/scoring';

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'level1', label: 'Level 1', icon: BookOpen },
  { id: 'level2', label: 'Level 2', icon: Layers },
  { id: 'level3', label: 'Level 3', icon: Layers },
  { id: 'exams', label: 'Practice Exams', icon: ClipboardCheck },
  { id: 'flashcards', label: 'Flashcards · 3 Provinces', icon: Layers3 },
  { id: 'calculators', label: 'Rigging Calculators', icon: Calculator },
  { id: 'rigging-sim', label: '3D Rigging Lab', icon: Anchor },
  { id: 'crane-signals', label: 'Crane Signals', icon: Hand },
  { id: 'welding-sim', label: '3D Welding Sim', icon: Sparkles },
  { id: 'welding', label: 'Welding Theory', icon: Flame },
  { id: 'blueprints', label: 'Blueprint Reading', icon: Compass },
  { id: 'glossary', label: 'Technical Glossary', icon: BookA },

  { id: 'notes', label: 'Study Notes', icon: NotebookPen },
  { id: 'reports', label: 'Progress Reports', icon: BarChart3 },
];

export default function App() {
  const [section, setSection] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [examInitialMode, setExamInitialMode] = useState<'diagnostic' | 'practice'>('practice');
  const [aiQueuedPrompt, setAiQueuedPrompt] = useState<string | undefined>(undefined);
  const [glossaryDrawerEntryId, setGlossaryDrawerEntryId] = useState<string | null>(null);
  const [simPresetExerciseId, setSimPresetExerciseId] = useState<string | undefined>(undefined);
  const [riggingLaunchSignals, setRiggingLaunchSignals] = useState<boolean>(false);

  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    setLoading(true);
    try { setProgress(readLocalProgress()); setSyncError(null); }
    catch { setSyncError('Unable to load device-local study progress.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadProgress(); }, [loadProgress]);

  const persistProgress = useCallback(async (updated: StudentProgress) => {
    try { saveLocalProgress(updated); setProgress(updated); setSyncError(null); }
    catch { setSyncError('Device storage is full or unavailable. Changes were not saved.'); }
  }, []);

  // Credit study time only while the Academy tab is visible and focused.
  // Date keys follow the student's local calendar, not UTC midnight.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
      setProgress((prev) => {
        if (!prev) return prev;
        const todayKey = getLocalStudyDateKey(new Date());
        const updated: StudentProgress = {
          ...prev,
          dailyStudySeconds: {
            ...prev.dailyStudySeconds,
            [todayKey]: (prev.dailyStudySeconds[todayKey] ?? 0) + 30,
          },
        };
        try {
          saveLocalProgress(updated);
          setSyncError(null);
        } catch {
          setSyncError('Device storage is full or unavailable. Study time was not saved.');
        }
        return updated;
      });
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const navigateTo = (target: NavSection) => {
    setActiveLessonId(null);
    setSection(target);
    setMobileMenuOpen(false);
    if (target === 'exams') setExamInitialMode('practice');
  };

  const openLesson = (lessonId: string) => {
    const found = ALL_LESSONS.find((l) => l.id === lessonId);
    if (!found) return;
    setActiveLessonId(lessonId);
    setSection(found.level === 1 ? 'level1' : found.level === 2 ? 'level2' : 'level3');
    setMobileMenuOpen(false);
  };

  const startDiagnostic = () => {
    setActiveLessonId(null);
    setExamInitialMode('diagnostic');
    setSection('exams');
    setMobileMenuOpen(false);
  };

  const handleCompleteLesson = (lessonId: string, scorePct: number) => {
    if (!progress) return;
    const completed = progress.completedLessonIds.includes(lessonId)
      ? progress.completedLessonIds
      : [...progress.completedLessonIds, lessonId];
    void persistProgress({
      ...progress,
      completedLessonIds: completed,
      lessonAssessmentScores: {
        ...progress.lessonAssessmentScores,
        [lessonId]: scorePct,
      },
    });
  };

  const handleSaveAssessment = (result: AssessmentResult) => {
    if (!progress) return;
    if (result.mode === 'diagnostic') {
      const plan = generateSevenDayPlan(result.domainBreakdown, LESSON_BY_DOMAIN_DEFAULT);
      void persistProgress({
        ...progress,
        diagnosticResult: result,
        weakSubjects: result.weakDomains.length ? result.weakDomains : progress.weakSubjects,
        studySchedule: plan,
      });
    } else {
      const weakFromExam = result.weakDomains.length ? result.weakDomains : progress.weakSubjects;
      void persistProgress({
        ...progress,
        assessmentHistory: [result, ...progress.assessmentHistory],
        weakSubjects: weakFromExam,
      });
    }
  };

  const handleToggleBookmarkFormula = (formulaId: string) => {
    if (!progress) return;
    const exists = progress.bookmarkedFormulas.includes(formulaId);
    const next = exists
      ? progress.bookmarkedFormulas.filter((id) => id !== formulaId)
      : [...progress.bookmarkedFormulas, formulaId];
    void persistProgress({ ...progress, bookmarkedFormulas: next });
  };

  const handleAddNote = (note: StudyNote) => {
    if (!progress) return;
    void persistProgress({ ...progress, studyNotes: [note, ...progress.studyNotes] });
  };

  const handleDeleteNote = (id: string) => {
    if (!progress) return;
    void persistProgress({
      ...progress,
      studyNotes: progress.studyNotes.filter((n) => n.id !== id),
    });
  };

  const handleSaveUploadedDoc = (doc: UploadedDocumentRef) => {
    if (!progress) return;
    void persistProgress({ ...progress, uploadedDocs: [doc, ...progress.uploadedDocs] });
  };

  const handleToggleScheduleDay = (dayIndex: number) => {
    if (!progress) return;
    const nextSchedule = progress.studySchedule.map((item, idx) =>
      idx === dayIndex ? { ...item, completed: !item.completed } : item
    );
    void persistProgress({ ...progress, studySchedule: nextSchedule });
  };

  const handleSaveWeldingSession = (session: WeldingSessionRecord) => {
    if (!progress) return;
    const existing = progress.weldingSessions ?? [];
    void persistProgress({
      ...progress,
      weldingSessions: [session, ...existing].slice(0, 30),
    });
  };

  const handleSaveRiggingSession = (session: RiggingSessionRecord) => {
    if (!progress) return;
    const existing = progress.riggingSessions ?? [];
    void persistProgress({
      ...progress,
      riggingSessions: [session, ...existing].slice(0, 30),
    });
  };

  const handleUpdateSignalProgress = (nextSignals: SignalFlashcardProgress) => {
    if (!progress) return;
    void persistProgress({
      ...progress,
      signalProgress: nextSignals,
    });
  };

  const handleToggleGlossaryBookmark = (entryId: string) => {
    if (!progress) return;
    const existing = progress.bookmarkedGlossaryIds ?? [];
    const next = existing.includes(entryId)
      ? existing.filter((id) => id !== entryId)
      : [...existing, entryId];
    void persistProgress({ ...progress, bookmarkedGlossaryIds: next });
  };

  const handleOpenSimulatorPreset = (exerciseId: string) => {
    setSimPresetExerciseId(exerciseId);
    setActiveLessonId(null);
    setSection('welding-sim');
    setMobileMenuOpen(false);
  };

  const handleResetProgress = async () => {
    if (!window.confirm('Permanently delete all study progress saved on this device? Export a backup first. This cannot be undone.')) return;
    try { setProgress(resetLocalProgress()); setSyncError(null); }
    catch { setSyncError('Unable to reset device-local progress.'); }
  };

  const activeLesson = activeLessonId ? ALL_LESSONS.find((l) => l.id === activeLessonId) ?? null : null;

  return (
    <div className="min-h-screen bg-[#0A111A] text-slate-100 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Navigation Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] shrink-0 bg-[#0D1622] border-r border-[#2A394A] flex flex-col transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-5 py-4 border-b border-[#2A394A] flex items-center justify-between">
          <div>
            <p className="font-display text-xl font-bold text-white tracking-wide leading-none">
              Boilermaker Academy
            </p>
            <p className="text-xs font-mono text-amber-400 mt-1">Canadian Boilermaker · Red Seal</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:bg-[#182433] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#2A394A] text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-200 truncate">
            {progress ? progress.profile.currentLocal : 'Boilermaker Student'}
          </p>
          <p className="font-mono text-slate-400">
            Target: {progress ? `${progress.practiceTargetPct}% study goal` : '80% study goal'}
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Clean 3-Zone Top Header */}
        <header className="sticky top-0 z-30 bg-[#0A111A]/95 backdrop-blur border-b border-[#2A394A] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded border border-[#2A394A] text-slate-200 hover:bg-[#182433]"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-slate-300 truncate whitespace-nowrap">
              {activeLesson
                ? `Level ${activeLesson.level} · ${activeLesson.moduleCode}`
                : NAV_ITEMS.find((n) => n.id === section)?.label}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setGlossaryDrawerEntryId((prev) => prev ?? 'e7018')}
              className="px-3 py-2 rounded-md bg-[#182433] border border-[#2A394A] hover:border-amber-400 text-slate-100 font-medium text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <BookA className="w-3.5 h-3.5 text-amber-400" />
              Glossary
            </button>
            <button
              type="button"
              onClick={startDiagnostic}
              className="px-3.5 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
            >
              50Q Diagnostic
            </button>
          </div>
        </header>

        {/* Sync Error Alert if Backend Unreachable */}
        {syncError && (
          <div className="mx-4 sm:mx-8 mt-4 p-3 rounded-md bg-red-950/60 border border-red-700 text-xs text-red-200 flex items-center justify-between gap-3">
            <span>{syncError}</span>
            <button type="button" onClick={() => void loadProgress()} className="underline font-semibold shrink-0">
              Retry Sync
            </button>
          </div>
        )}

        {/* Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1360px] w-full mx-auto">
          {loading || !progress ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-44 bg-[#111B27] rounded-lg border border-[#2A394A]" />
              <div className="grid grid-cols-4 gap-4">
                <div className="h-24 bg-[#111B27] rounded-lg border border-[#2A394A]" />
                <div className="h-24 bg-[#111B27] rounded-lg border border-[#2A394A]" />
                <div className="h-24 bg-[#111B27] rounded-lg border border-[#2A394A]" />
                <div className="h-24 bg-[#111B27] rounded-lg border border-[#2A394A]" />
              </div>
            </div>
          ) : activeLesson ? (
            <LessonViewer
              lesson={activeLesson}
              isCompleted={progress.completedLessonIds.includes(activeLesson.id)}
              previousScore={progress.lessonAssessmentScores[activeLesson.id]}
              bookmarkedFormulas={progress.bookmarkedFormulas}
              onToggleBookmarkFormula={handleToggleBookmarkFormula}
              onCompleteLesson={handleCompleteLesson}
              onBack={() => setActiveLessonId(null)}
              onOpenGlossary={(id) => setGlossaryDrawerEntryId(id)}
            />
          ) : section === 'flashcards' ? (
            <ProvinceFlashcards />
          ) : section === 'dashboard' ? (
            <StudyDashboard
              progress={progress}
              onNavigate={navigateTo}
              onStartDiagnostic={startDiagnostic}
              onOpenLesson={openLesson}
              onChangeLevel={(lvl: ApprenticeshipLevel) =>
                void persistProgress({ ...progress, currentStudyLevel: lvl })
              }
              onToggleScheduleDay={handleToggleScheduleDay}
            />
          ) : section === 'level1' || section === 'level2' || section === 'level3' ? (
            <LevelCurriculumView
              level={section === 'level1' ? 1 : section === 'level2' ? 2 : 3}
              completedLessonIds={progress.completedLessonIds}
              lessonScores={progress.lessonAssessmentScores}
              onOpenLesson={openLesson}
              onGoToUpload={() => navigateTo('instructor')}
            />
          ) : section === 'exams' ? (
            <ExamSimulator
              initialMode={examInitialMode}
              practiceTargetPct={progress.practiceTargetPct}
              onUpdateTargetPct={(pct) => void persistProgress({ ...progress, practiceTargetPct: pct })}
              onSaveAssessment={handleSaveAssessment}
              onOpenLesson={openLesson}
              existingDiagnostic={progress.diagnosticResult}
            />
          ) : section === 'calculators' ? (
            <CalculatorsView
              bookmarkedFormulas={progress.bookmarkedFormulas}
              onToggleBookmarkFormula={handleToggleBookmarkFormula}
              onOpenGlossary={(id) => setGlossaryDrawerEntryId(id)}
              onOpenRiggingSim={() => {
                setRiggingLaunchSignals(false);
                navigateTo('rigging-sim');
              }}
            />
          ) : section === 'rigging-sim' ? (
            <RiggingSimulatorView
              riggingSessions={progress.riggingSessions ?? []}
              onSaveRiggingSession={handleSaveRiggingSession}
              onOpenGlossary={(id) => setGlossaryDrawerEntryId(id)}
              onNavigateCraneSignals={() => navigateTo('crane-signals')}
              initialSignalMode={riggingLaunchSignals}
            />
          ) : section === 'crane-signals' ? (
            <CraneSignalsView
              signalProgress={
                progress.signalProgress ?? {
                  knownIds: [],
                  practiceIds: [],
                  bookmarkedIds: [],
                  srsNextDue: {},
                  quizAttempts: 0,
                  quizCorrect: 0,
                }
              }
              onUpdateSignalProgress={handleUpdateSignalProgress}
              onPracticeSignalsInSimulator={() => {
                setRiggingLaunchSignals(true);
                navigateTo('rigging-sim');
              }}
              onOpenGlossary={(id) => setGlossaryDrawerEntryId(id)}
            />
          ) : section === 'welding-sim' ? (
            <WeldingSimulatorView
              initialExerciseId={simPresetExerciseId}
              onClearInitialExercise={() => setSimPresetExerciseId(undefined)}
              weldingSessions={progress.weldingSessions ?? []}
              onSaveWeldingSession={handleSaveWeldingSession}
              onOpenGlossary={(id) => setGlossaryDrawerEntryId(id)}
            />
          ) : section === 'welding' || section === 'blueprints' ? (
            <WeldingAndBlueprintsHub
              mode={section}
              onOpenLesson={openLesson}
              onStartTopicExam={() => {
                setExamInitialMode('practice');
                setSection('exams');
              }}
              onOpenSimulator={() => navigateTo('welding-sim')}
              onOpenGlossary={(id) => setGlossaryDrawerEntryId(id)}
            />
          ) : section === 'glossary' ? (
            <GlossaryView
              bookmarkedIds={progress.bookmarkedGlossaryIds ?? []}
              onToggleBookmark={handleToggleGlossaryBookmark}
              onOpenDrawerEntry={(id) => setGlossaryDrawerEntryId(id)}
              onOpenLesson={openLesson}
              onOpenSimulatorPreset={handleOpenSimulatorPreset}
            />
          ) : section === 'instructor' ? (
            <AiInstructorView
              currentLevel={progress.currentStudyLevel}
              weakSubjects={progress.weakSubjects}
              initialPrompt={aiQueuedPrompt}
              onClearInitialPrompt={() => setAiQueuedPrompt(undefined)}
              uploadedDocs={progress.uploadedDocs}
              onSaveUploadedDoc={handleSaveUploadedDoc}
            />
          ) : section === 'notes' ? (
            <StudyNotesView
              progress={progress}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              onToggleBookmarkFormula={handleToggleBookmarkFormula}
            />
          ) : (
            <ProgressReportsView progress={progress} onResetProgress={handleResetProgress} onImportProgress={persistProgress} />
          )}
        </main>
      </div>

      {/* Non-interruptive Slide-Over Glossary Drawer */}
      <GlossaryDrawer
        entryId={glossaryDrawerEntryId}
        bookmarkedIds={progress?.bookmarkedGlossaryIds ?? []}
        onClose={() => setGlossaryDrawerEntryId(null)}
        onSelectEntry={(id) => setGlossaryDrawerEntryId(id)}
        onToggleBookmark={handleToggleGlossaryBookmark}
        onOpenLesson={openLesson}
        onOpenSimulatorPreset={handleOpenSimulatorPreset}
      />
    </div>
  );
}
