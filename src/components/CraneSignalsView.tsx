import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  GitCompare,
  HelpCircle,
  Pause,
  Play,
  RotateCw,
  Shuffle,
  Volume2,
} from 'lucide-react';
import { CRANE_SIGNAL_CARDS } from '../data/craneSignals';
import { CraneSignalId, SignalFlashcardProgress } from '../types/academy';
import {
  applySignalSrsReview,
  buildQuizOptionsForSignal,
  filterCraneSignals,
  scoreSignalIdentification,
  shuffleSignalIds,
  speakSignalInstruction,
  toggleSignalBookmark,
} from '../utils/craneSignalsLogic';
import { GlossaryLink } from './GlossaryDrawer';
import { SignalPersonScene3D } from './SignalPersonScene3D';

interface CraneSignalsViewProps {
  signalProgress: SignalFlashcardProgress;
  onUpdateSignalProgress: (next: SignalFlashcardProgress) => void;
  onPracticeSignalsInSimulator: () => void;
  onOpenGlossary?: (entryId: string) => void;
}

type SignalModeTab = 'study' | 'compare' | 'quiz';

export const CraneSignalsView: React.FC<CraneSignalsViewProps> = ({
  signalProgress,
  onUpdateSignalProgress,
  onPracticeSignalsInSimulator,
  onOpenGlossary,
}) => {
  const [modeTab, setModeTab] = useState<SignalModeTab>('study');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Beginner' | 'Advanced'>('All');
  const [applicabilityFilter, setApplicabilityFilter] = useState<
    'All' | 'Overhead & Gantry' | 'Mobile Crane'
  >('All');
  const [reviewMissedOnly, setReviewMissedOnly] = useState(false);

  const [shuffleSeed, setShuffleSeed] = useState<number>(0);
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [slowMotion, setSlowMotion] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(true);
  const [audioNote, setAudioNote] = useState<string | null>(null);

  // Compare Similar Signals state
  const [comparePrimaryId, setComparePrimaryId] = useState<CraneSignalId>('stop');
  const [compareSecondaryId, setCompareSecondaryId] = useState<CraneSignalId>('emergency-stop');

  // Blind Identification Quiz state
  const [quizTargetId, setQuizTargetId] = useState<CraneSignalId>('hoist');
  const [quizSelectedId, setQuizSelectedId] = useState<CraneSignalId | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<{ correct: boolean; message: string } | null>(null);

  const filteredDeck = useMemo(() => {
    const base = filterCraneSignals(
      CRANE_SIGNAL_CARDS,
      difficultyFilter,
      applicabilityFilter,
      reviewMissedOnly,
      signalProgress
    );
    const working = base.length > 0 ? base : CRANE_SIGNAL_CARDS;
    if (shuffleSeed === 0) return working;
    const orderedIds = shuffleSignalIds(
      working.map((c) => c.id),
      shuffleSeed
    );
    return orderedIds
      .map((id) => working.find((c) => c.id === id)!)
      .filter(Boolean);
  }, [difficultyFilter, applicabilityFilter, reviewMissedOnly, signalProgress, shuffleSeed]);

  const safeIndex = Math.min(cardIndex, Math.max(0, filteredDeck.length - 1));
  const activeStudyCard = filteredDeck[safeIndex] ?? CRANE_SIGNAL_CARDS[0];

  const active3DSignalId: CraneSignalId =
    modeTab === 'quiz'
      ? quizTargetId
      : modeTab === 'compare'
      ? comparePrimaryId
      : activeStudyCard.id;

  const quizOptions = useMemo(
    () => buildQuizOptionsForSignal(quizTargetId, CRANE_SIGNAL_CARDS),
    [quizTargetId]
  );

  const comparePrimary =
    CRANE_SIGNAL_CARDS.find((c) => c.id === comparePrimaryId) ?? CRANE_SIGNAL_CARDS[2];
  const compareSecondary =
    CRANE_SIGNAL_CARDS.find((c) => c.id === compareSecondaryId) ?? CRANE_SIGNAL_CARDS[3];

  const handlePlayVoice = (script: string) => {
    const ok = speakSignalInstruction(script);
    setAudioNote(
      ok
        ? 'Speaking ASME signal description via browser audio.'
        : 'Browser speech synthesis unavailable; read step-by-step posture below.'
    );
  };

  const handleMarkSrs = (outcome: 'know' | 'practice') => {
    const next = applySignalSrsReview(signalProgress, activeStudyCard.id, outcome);
    onUpdateSignalProgress(next);
    setFlipped(false);
    setCardIndex((prev) => (prev + 1) % filteredDeck.length);
  };

  const handleAnswerQuiz = (chosenId: CraneSignalId) => {
    if (quizSelectedId !== null) return;
    setQuizSelectedId(chosenId);
    const { isCorrect, updatedProgress } = scoreSignalIdentification(
      signalProgress,
      quizTargetId,
      chosenId
    );
    onUpdateSignalProgress(updatedProgress);
    const targetCard = CRANE_SIGNAL_CARDS.find((c) => c.id === quizTargetId)!;
    setQuizFeedback({
      correct: isCorrect,
      message: isCorrect
        ? `Correct — ${targetCard.name}: ${targetCard.movementSummary}`
        : `Incorrect — That animation shows "${targetCard.name}". ${targetCard.movementSummary}`,
    });
  };

  const handleNextQuizSignal = () => {
    const currentIdx = CRANE_SIGNAL_CARDS.findIndex((c) => c.id === quizTargetId);
    const nextIdx = (currentIdx + 3) % CRANE_SIGNAL_CARDS.length;
    setQuizTargetId(CRANE_SIGNAL_CARDS[nextIdx].id);
    setQuizSelectedId(null);
    setQuizFeedback(null);
  };

  const quizAccuracyPct =
    signalProgress.quizAttempts > 0
      ? Math.round((signalProgress.quizCorrect / signalProgress.quizAttempts) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header & Top Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2A394A]">
        <div>
          <p className="text-xs font-mono text-amber-400">
            ASME B30.2 / B30.5 · ONTARIO OHSA REG. 213/91 · IHSA CONVENTIONS
          </p>
          <h1 className="text-3xl font-bold text-white tracking-wide mt-1">
            Crane Hand Signals Training Centre
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Interactive 3D animated signalperson, SRS visual flashcards, similar-signal comparison, and blind recognition drills.
            {onOpenGlossary && (
              <span className="ml-2 text-xs text-slate-300">
                Related:{' '}
                <GlossaryLink termIdOrName="tag-line" label="Tag Line" onOpenGlossary={onOpenGlossary} />
                {' · '}
                <GlossaryLink termIdOrName="wll" onOpenGlossary={onOpenGlossary} />
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onPracticeSignalsInSimulator}
          className="px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <span>Command Crane in 3D Rigging Lab</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Tabs + Progress Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-[#111B27] border border-[#2A394A] rounded-lg">
          {(
            [
              { id: 'study', label: '3D Signalperson & Flashcards' },
              { id: 'compare', label: 'Compare Similar Signals' },
              { id: 'quiz', label: 'Identify Signal Test' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setModeTab(t.id)}
              className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                modeTab === t.id
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
          <span>
            Mastered:{' '}
            <strong className="text-emerald-400 tabular-nums">
              {signalProgress.knownIds.length}/{CRANE_SIGNAL_CARDS.length}
            </strong>
          </span>
          <span>
            Need Practice:{' '}
            <strong className="text-amber-400 tabular-nums">{signalProgress.practiceIds.length}</strong>
          </span>
          <span>
            Quiz Score:{' '}
            <strong className="text-sky-400 tabular-nums">
              {signalProgress.quizAttempts > 0
                ? `${quizAccuracyPct}% (${signalProgress.quizCorrect}/${signalProgress.quizAttempts})`
                : '—'}
            </strong>
          </span>
        </div>
      </div>

      {/* Main Two-Zone Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive 3D Signalperson Stage */}
        <div className="lg:col-span-6 bg-[#111B27] border border-[#2A394A] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2A394A] flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-mono text-amber-400 truncate">
                {modeTab === 'quiz'
                  ? 'BLIND SIGNAL IDENTIFICATION — WATCH MOTION'
                  : modeTab === 'compare'
                  ? `3D VIEW: ${comparePrimary.name.toUpperCase()}`
                  : `${activeStudyCard.applicability.toUpperCase()}`}
              </p>
              <h2 className="text-base font-bold text-white truncate">
                {modeTab === 'quiz' ? 'Name This Crane Hand Signal' : activeStudyCard.name}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="px-2.5 py-1.5 rounded bg-[#0A111A] border border-[#2A394A] hover:border-amber-400 text-xs text-slate-200 flex items-center gap-1 whitespace-nowrap"
              >
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {playing ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                onClick={() => setSlowMotion((s) => !s)}
                className={`px-2.5 py-1.5 rounded border text-xs font-mono whitespace-nowrap ${
                  slowMotion
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-[#0A111A] border-[#2A394A] text-slate-300 hover:border-amber-400'
                }`}
              >
                {slowMotion ? '0.4x Slow' : '1.0x Live'}
              </button>
              {modeTab !== 'quiz' && (
                <button
                  type="button"
                  onClick={() =>
                    handlePlayVoice(
                      modeTab === 'compare'
                        ? comparePrimary.spokenScript
                        : activeStudyCard.spokenScript
                    )
                  }
                  className="px-2.5 py-1.5 rounded bg-[#0A111A] border border-[#2A394A] hover:border-amber-400 text-xs text-sky-300 flex items-center gap-1 whitespace-nowrap"
                  title="Audio explanation"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Audio
                </button>
              )}
            </div>
          </div>

          <div className="h-[380px] sm:h-[430px] w-full bg-[#0D1622]">
            <SignalPersonScene3D
              signalId={active3DSignalId}
              slowMotion={slowMotion}
              playing={playing}
            />
          </div>

          <div className="px-4 py-2.5 bg-[#0A111A] border-t border-[#2A394A] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>Drag canvas to orbit camera around signalperson · Scroll to zoom</span>
            {audioNote && <span className="text-sky-400">{audioNote}</span>}
          </div>
        </div>

        {/* Right: Mode-Specific Interactive Deck */}
        <div className="lg:col-span-6 space-y-4">
          {modeTab === 'study' && (
            <>
              {/* Filter Bar */}
              <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Filter signal difficulty"
                    value={difficultyFilter}
                    onChange={(e) => {
                      setDifficultyFilter(e.target.value as typeof difficultyFilter);
                      setCardIndex(0);
                      setFlipped(false);
                    }}
                    className="bg-[#0A111A] border border-[#2A394A] rounded px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="All">All Levels</option>
                    <option value="Beginner">Beginner Core</option>
                    <option value="Advanced">Advanced / Mobile</option>
                  </select>
                  <select
                    aria-label="Filter crane type"
                    value={applicabilityFilter}
                    onChange={(e) => {
                      setApplicabilityFilter(e.target.value as typeof applicabilityFilter);
                      setCardIndex(0);
                      setFlipped(false);
                    }}
                    className="bg-[#0A111A] border border-[#2A394A] rounded px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="All">All Crane Types</option>
                    <option value="Overhead & Gantry">Overhead & Gantry</option>
                    <option value="Mobile Crane">Mobile Crane</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewMissedOnly((r) => !r);
                      setCardIndex(0);
                    }}
                    className={`px-2.5 py-1.5 rounded border text-xs whitespace-nowrap ${
                      reviewMissedOnly
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-[#0A111A] border-[#2A394A] text-slate-300'
                    }`}
                  >
                    Missed ({signalProgress.practiceIds.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShuffleSeed((s) => s + 1);
                      setCardIndex(0);
                      setFlipped(false);
                    }}
                    className="px-2.5 py-1.5 rounded bg-[#0A111A] border border-[#2A394A] hover:border-amber-400 text-xs text-slate-200 flex items-center gap-1 whitespace-nowrap"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    Shuffle
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSignalProgress(
                        toggleSignalBookmark(signalProgress, activeStudyCard.id)
                      )
                    }
                    className={`p-1.5 rounded border ${
                      signalProgress.bookmarkedIds.includes(activeStudyCard.id)
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-[#0A111A] border-[#2A394A] text-slate-400'
                    }`}
                    title="Bookmark signal"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Flashcard Body */}
              <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-400">
                  <span>
                    CARD {safeIndex + 1} / {filteredDeck.length} · {activeStudyCard.standardReference}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className="text-amber-400 hover:underline flex items-center gap-1 font-sans font-medium"
                  >
                    {flipped ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {flipped ? 'Show Front Cue' : 'Flip for Meaning & Safety'}
                  </button>
                </div>

                {!flipped ? (
                  <div className="space-y-4 py-2">
                    <div className="p-4 rounded-md bg-[#0A111A] border border-[#2A394A] space-y-2">
                      <p className="text-xs font-mono text-sky-400">SIGNAL NAME & APPLICABILITY</p>
                      <h3 className="text-2xl font-bold text-white">{activeStudyCard.name}</h3>
                      <p className="text-xs text-slate-400">
                        Crane Applicability: <strong className="text-slate-200">{activeStudyCard.applicability}</strong>
                      </p>
                    </div>
                    <div className="p-4 rounded-md bg-[#0D1622] border border-[#2A394A] space-y-1.5">
                      <p className="text-xs font-mono text-amber-400">HAND & ARM MOVEMENT</p>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {activeStudyCard.movementSummary}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-1">
                    <div className="p-3.5 rounded-md bg-[#0A111A] border border-[#2A394A]">
                      <p className="text-xs font-mono text-emerald-400">OPERATIONAL MEANING</p>
                      <p className="text-sm text-white mt-1">{activeStudyCard.operationalMeaning}</p>
                    </div>
                    <div className="p-3.5 rounded-md bg-[#0A111A] border border-[#2A394A]">
                      <p className="text-xs font-mono text-sky-400">DETAILED POSTURE</p>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {activeStudyCard.stepByStepPosture}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-md bg-amber-950/25 border border-amber-700/50">
                      <p className="text-xs font-mono text-amber-400">SAFETY CONSIDERATIONS</p>
                      <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                        {activeStudyCard.safetyConsiderations}
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation & SRS Review Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#2A394A]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFlipped(false);
                        setCardIndex((prev) => (prev - 1 + filteredDeck.length) % filteredDeck.length);
                      }}
                      className="px-3 py-2 rounded bg-[#0A111A] border border-[#2A394A] hover:border-slate-500 text-xs text-slate-200 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFlipped(false);
                        setCardIndex((prev) => (prev + 1) % filteredDeck.length);
                      }}
                      className="px-3 py-2 rounded bg-[#0A111A] border border-[#2A394A] hover:border-slate-500 text-xs text-slate-200 flex items-center gap-1"
                    >
                      Next
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarkSrs('practice')}
                      className="px-3 py-2 rounded bg-amber-500/15 border border-amber-500/50 hover:bg-amber-500/25 text-xs font-medium text-amber-300 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Need Practice
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkSrs('know')}
                      className="px-3.5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Know It
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Signal Selector Strip */}
              <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-3.5">
                <p className="text-xs font-mono text-slate-400 mb-2">QUICK JUMP SIGNALS</p>
                <div className="flex flex-wrap gap-1.5">
                  {filteredDeck.map((c, idx) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCardIndex(idx);
                        setFlipped(false);
                      }}
                      className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                        c.id === activeStudyCard.id
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : signalProgress.knownIds.includes(c.id)
                          ? 'bg-emerald-950/40 border border-emerald-700/50 text-emerald-300'
                          : 'bg-[#0A111A] border border-[#2A394A] text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {modeTab === 'compare' && (
            <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Compare Similar Signals</h3>
              </div>
              <p className="text-xs text-slate-400">
                Select two easily confused signals side-by-side. Click either signal to load it onto the 3D animated Signalperson.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Active 3D Signal (Left)</label>
                  <select
                    value={comparePrimaryId}
                    onChange={(e) => setComparePrimaryId(e.target.value as CraneSignalId)}
                    className="w-full bg-[#0A111A] border border-amber-500/50 rounded px-3 py-2 text-xs text-white"
                  >
                    {CRANE_SIGNAL_CARDS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.applicability})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Comparison Signal (Right)</label>
                  <select
                    value={compareSecondaryId}
                    onChange={(e) => setCompareSecondaryId(e.target.value as CraneSignalId)}
                    className="w-full bg-[#0A111A] border border-[#2A394A] rounded px-3 py-2 text-xs text-white"
                  >
                    {CRANE_SIGNAL_CARDS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.applicability})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[comparePrimary, compareSecondary].map((sig, i) => (
                  <div
                    key={`${sig.id}-${i}`}
                    className={`p-3.5 rounded-md border space-y-2 ${
                      i === 0
                        ? 'bg-[#0A111A] border-amber-500/50'
                        : 'bg-[#0D1622] border-[#2A394A]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white">{sig.name}</span>
                      {i === 1 && (
                        <button
                          type="button"
                          onClick={() => setComparePrimaryId(sig.id)}
                          className="text-xs text-amber-400 hover:underline whitespace-nowrap"
                        >
                          Animate in 3D →
                        </button>
                      )}
                    </div>
                    <p className="text-xs font-mono text-sky-400">{sig.applicability}</p>
                    <p className="text-xs text-slate-200">{sig.movementSummary}</p>
                    <p className="text-xs text-slate-400">{sig.operationalMeaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {modeTab === 'quiz' && (
            <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Identify the Signal</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">Blind 3D Recognition</span>
              </div>
              <p className="text-xs text-slate-300">
                Observe the 3D animated Signalperson on the left (rotate camera or use Slow Motion if needed), then select the matching ASME B30.2 / B30.5 signal:
              </p>

              <div className="space-y-2">
                {quizOptions.map((opt) => {
                  const isChosen = quizSelectedId === opt.id;
                  const isTarget = quizTargetId === opt.id;
                  let style =
                    'bg-[#0A111A] border-[#2A394A] text-slate-200 hover:border-amber-400';
                  if (quizSelectedId !== null) {
                    if (isTarget) {
                      style = 'bg-emerald-950/50 border-emerald-500 text-emerald-200';
                    } else if (isChosen) {
                      style = 'bg-red-950/50 border-red-500 text-red-200';
                    } else {
                      style = 'bg-[#0A111A] border-[#1E293B] text-slate-500';
                    }
                  }
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={quizSelectedId !== null}
                      onClick={() => handleAnswerQuiz(opt.id)}
                      className={`w-full text-left px-4 py-3 rounded-md border text-sm font-medium transition-colors flex items-center justify-between ${style}`}
                    >
                      <span>{opt.name}</span>
                      <span className="text-xs font-mono text-slate-400">{opt.applicability}</span>
                    </button>
                  );
                })}
              </div>

              {quizFeedback && (
                <div
                  className={`p-3.5 rounded-md border text-xs space-y-2 ${
                    quizFeedback.correct
                      ? 'bg-emerald-950/35 border-emerald-700/60 text-emerald-200'
                      : 'bg-red-950/35 border-red-700/60 text-red-200'
                  }`}
                >
                  <p className="font-semibold">{quizFeedback.message}</p>
                  <button
                    type="button"
                    onClick={handleNextQuizSignal}
                    className="px-3.5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    Next Signal Challenge
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
