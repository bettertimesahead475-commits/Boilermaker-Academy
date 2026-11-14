import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Target,
} from 'lucide-react';
import { DIAGNOSTIC_QUESTIONS } from '../data/diagnosticQuestions';
import { buildExamQuestions } from '../data/examQuestions';
import { AssessmentResult, Question, TopicDomain } from '../types/academy';
import { ALL_DOMAINS, scoreAssessment } from '../utils/scoring';

interface ExamSimulatorProps {
  initialMode?: 'diagnostic' | 'practice';
  practiceTargetPct: number;
  onUpdateTargetPct: (pct: number) => void;
  onSaveAssessment: (result: AssessmentResult) => void;
  onOpenLesson: (lessonId: string) => void;
  existingDiagnostic: AssessmentResult | null;
}

export const ExamSimulator: React.FC<ExamSimulatorProps> = ({
  initialMode = 'practice',
  practiceTargetPct,
  onUpdateTargetPct,
  onSaveAssessment,
  onOpenLesson,
  existingDiagnostic,
}) => {
  const [stage, setStage] = useState<'setup' | 'active' | 'results'>('setup');
  const [examMode, setExamMode] = useState<'diagnostic' | 'level1' | 'level2' | 'level3' | 'combined' | 'redseal' | 'topic'>(
    initialMode === 'diagnostic' ? 'diagnostic' : 'level1'
  );
  const [questionCount, setQuestionCount] = useState<10 | 25 | 50 | 100>(initialMode === 'diagnostic' ? 50 : 25);
  const [selectedTopic, setSelectedTopic] = useState<TopicDomain>('Mathematics');
  const [timed, setTimed] = useState<boolean>(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [lastResult, setLastResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    if (initialMode === 'diagnostic') {
      setExamMode('diagnostic');
      setQuestionCount(50);
    }
  }, [initialMode]);

  useEffect(() => {
    if (stage !== 'active') return;
    const id = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [stage]);

  const startSession = (forcedMode?: typeof examMode) => {
    const modeToUse = forcedMode ?? examMode;
    let qList: Question[] = [];
    if (modeToUse === 'diagnostic') {
      qList = DIAGNOSTIC_QUESTIONS;
    } else {
      qList = buildExamQuestions({
        mode: modeToUse,
        count: questionCount,
        topic: modeToUse === 'topic' ? selectedTopic : undefined,
      });
    }
    setExamMode(modeToUse);
    setQuestions(qList);
    setCurrentIndex(0);
    setAnswers({});
    setElapsedSeconds(0);
    setLastResult(null);
    setStage('active');
  };

  const finishExam = () => {
    const titleMap: Record<typeof examMode, string> = {
      diagnostic: '50-Question Level 1 Comprehensive Diagnostic',
      level1: `Level 1 (Basic) Practice Exam (${questions.length}Q)`,
      level2: `Level 2 (Intermediate) Practice Exam (${questions.length}Q)`,
      level3: `Level 3 (Advanced) Practice Exam (${questions.length}Q)`,
      combined: `Combined 428A Apprenticeship Assessment (${questions.length}Q)`,
      redseal: `Red Seal-Style Boilermaker Mock Exam (${questions.length}Q)`,
      topic: `${selectedTopic} Focused Drill (${questions.length}Q)`,
    };

    const result = scoreAssessment({
      id: `exam-${Date.now()}`,
      title: titleMap[examMode],
      mode: examMode,
      timed,
      durationSeconds: elapsedSeconds,
      questions,
      selectedAnswers: answers,
      targetPct: practiceTargetPct,
    });
    setLastResult(result);
    onSaveAssessment(result);
    setStage('results');
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timeLimitSec = questions.length * 108; // 1.8 min per question realistic Red Seal pacing

  if (stage === 'active' && questions.length > 0) {
    const currentQ = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="space-y-6 max-w-4xl">
        {/* Exam Header */}
        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-amber-400">
              {examMode === 'diagnostic' ? 'DIAGNOSTIC ASSESSMENT' : 'PRACTICE EXAMINATION'} · {currentQ.domain} · {currentQ.knowledgeType}
            </p>
            <p className="text-sm font-semibold text-white mt-0.5 tabular-nums">
              Question {currentIndex + 1} of {questions.length} ({answeredCount} answered)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm font-mono text-slate-200 tabular-nums">
              <Clock className="w-4 h-4 text-amber-400" />
              {timed ? `${formatTime(Math.max(0, timeLimitSec - elapsedSeconds))} left` : formatTime(elapsedSeconds)}
            </div>
            <button
              type="button"
              onClick={finishExam}
              className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
            >
              Finish & Score
            </button>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-6 space-y-5">
          <p className="text-base sm:text-lg font-medium text-white leading-relaxed">{currentQ.prompt}</p>
          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => {
              const selected = answers[currentQ.id] === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: idx }))}
                  className={`w-full text-left px-4 py-3 rounded-md border text-sm transition-colors flex items-start gap-3 ${
                    selected
                      ? 'border-amber-400 bg-amber-500/15 text-white font-medium'
                      : 'border-[#2A394A] bg-[#0A111A] text-slate-200 hover:bg-[#182433]'
                  }`}
                >
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#182433] text-amber-400 shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#2A394A]">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="px-4 py-2 rounded-md border border-[#2A394A] text-sm text-slate-200 hover:bg-[#182433] disabled:opacity-40"
            >
              Previous
            </button>

            <div className="flex flex-wrap gap-1 max-w-md justify-center">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-7 h-7 rounded text-xs font-mono transition-colors ${
                    idx === currentIndex
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : answers[q.id] !== undefined
                      ? 'bg-sky-900/60 text-sky-200 border border-sky-700'
                      : 'bg-[#0A111A] text-slate-400 border border-[#2A394A]'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="px-4 py-2 rounded-md bg-[#182433] border border-[#2A394A] text-sm text-white hover:border-amber-400"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={finishExam}
                className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm"
              >
                Submit All Answers
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'results' && lastResult) {
    const metGoal = lastResult.percentage >= lastResult.targetPct;
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2A394A]">
          <div>
            <p className="text-xs font-mono text-amber-400">ASSESSMENT REPORT</p>
            <h1 className="text-3xl font-bold text-white">{lastResult.title}</h1>
          </div>
          <button
            type="button"
            onClick={() => setStage('setup')}
            className="px-4 py-2 rounded-md bg-[#182433] border border-[#2A394A] text-sm text-white hover:border-amber-400 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Configure Another Exam
          </button>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4">
            <p className="text-xs text-slate-400">Total Score</p>
            <p className="text-3xl font-bold font-mono text-amber-400 tabular-nums mt-1">
              {lastResult.percentage}%
            </p>
            <p className="text-xs font-mono text-slate-400 mt-1">
              {lastResult.totalCorrect} / {lastResult.totalQuestions} correct
            </p>
          </div>
          <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4">
            <p className="text-xs text-slate-400">Personal Study Goal ({lastResult.targetPct}%)</p>
            <p className={`text-lg font-semibold mt-2 ${metGoal ? 'text-emerald-400' : 'text-amber-300'}`}>
              {metGoal ? 'Study Target Met' : 'Below Study Target'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Study benchmark only — not an official STO pass mark</p>
          </div>
          <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4">
            <p className="text-xs text-slate-400">Practical Application</p>
            <p className="text-2xl font-bold font-mono text-sky-400 tabular-nums mt-1">
              {lastResult.practicalPercentage}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Shop & field execution items</p>
          </div>
          <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4">
            <p className="text-xs text-slate-400">Classroom Theory</p>
            <p className="text-2xl font-bold font-mono text-white tabular-nums mt-1">
              {lastResult.theoreticalPercentage}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Math, codes & technical principles</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-3.5 rounded-md bg-[#111B27] border border-[#2A394A] text-xs text-slate-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Important Regulatory Note: Strong scores on unofficial practice tests identify study readiness only and do not guarantee exemption-exam eligibility or passing status. Official 428A exemption criteria and Red Seal scoring are governed solely by Skilled Trades Ontario.
          </span>
        </div>

        {/* Topic-by-Topic Breakdown Table */}
        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2A394A]">
            <h2 className="text-lg font-bold text-white">Topic-by-Topic Performance & Classification</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0A111A] text-xs font-mono text-slate-400 border-b border-[#2A394A]">
                <tr>
                  <th className="px-4 py-2.5">Domain</th>
                  <th className="px-4 py-2.5">Score</th>
                  <th className="px-4 py-2.5">Practical</th>
                  <th className="px-4 py-2.5">Theory</th>
                  <th className="px-4 py-2.5">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {lastResult.domainBreakdown.map((d) => (
                  <tr key={d.domain} className="hover:bg-[#182433]/60">
                    <td className="px-4 py-2.5 font-medium text-white">{d.domain}</td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-amber-400">
                      {d.percentage}% ({d.correct}/{d.total})
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-slate-300">
                      {d.practicalTotal > 0 ? `${d.practicalCorrect}/${d.practicalTotal}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-slate-300">
                      {d.theoreticalTotal > 0 ? `${d.theoreticalCorrect}/${d.theoreticalTotal}` : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs font-semibold ${
                          d.classification === 'Strong'
                            ? 'text-emerald-400'
                            : d.classification === 'Competent'
                            ? 'text-sky-400'
                            : d.classification === 'Needs review'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {d.classification}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">Detailed Question Review & Lesson Links</h2>
          {questions.map((q, idx) => {
            const ans = lastResult.answers.find((a) => a.questionId === q.id);
            const isCorrect = ans?.isCorrect ?? false;
            return (
              <div key={q.id} className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className={isCorrect ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                    Q{idx + 1} · {isCorrect ? 'CORRECT' : 'INCORRECT'} · {q.domain} ({q.knowledgeType})
                  </span>
                  {q.lessonId && (
                    <button
                      type="button"
                      onClick={() => onOpenLesson(q.lessonId!)}
                      className="text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Review Lesson
                    </button>
                  )}
                </div>
                <p className="text-sm font-medium text-white">{q.prompt}</p>
                <p className="text-xs text-slate-300">
                  Your answer:{' '}
                  <span className={isCorrect ? 'text-emerald-300' : 'text-red-300'}>
                    {ans && ans.selectedIndex >= 0 ? q.options[ans.selectedIndex] : 'Unanswered'}
                  </span>{' '}
                  · Correct answer: <span className="text-emerald-300 font-semibold">{q.options[q.correctIndex]}</span>
                </p>
                <p className="text-xs text-slate-300 bg-[#0A111A] p-3 rounded border border-[#1E293B]">
                  {q.explanation}
                  {q.formula && <span className="block font-mono text-amber-300 mt-1">Formula: {q.formula}</span>}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // SETUP SCREEN
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-4 border-b border-[#2A394A]">
        <h1 className="text-3xl font-bold text-white">Practice Exam & Diagnostic Engine</h1>
        <p className="text-sm text-slate-400 mt-1">
          Original questions aligned with Ontario 428A (Levels 1–3) and Red Seal Construction Boilermaker standards.
        </p>
      </div>

      {/* Diagnostic Banner */}
      <div className="bg-[#111B27] border border-amber-500/40 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <p className="text-xs font-mono text-amber-400">STEP 1 · GAP ANALYSIS</p>
          <h2 className="text-xl font-bold text-white">50-Question Level 1 & Foundational Diagnostic</h2>
          <p className="text-sm text-slate-300">
            Assesses Mathematics, Rigging, Blueprints, Welding, Metallurgy, Fabrication, Industrial Equipment, and Safety independently—splitting Practical vs. Theoretical readiness to build your individualized 7-day study plan.
          </p>
          {existingDiagnostic && (
            <p className="text-xs font-mono text-emerald-400 pt-1">
              Last diagnostic completed: {existingDiagnostic.percentage}% overall · Weak areas:{' '}
              {existingDiagnostic.weakDomains.length ? existingDiagnostic.weakDomains.join(', ') : 'None flagged'}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => startSession('diagnostic')}
          className="px-5 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <Play className="w-4 h-4" />
          {existingDiagnostic ? 'Retake 50Q Diagnostic' : 'Start 50Q Diagnostic'}
        </button>
      </div>

      {/* Custom Exam Builder */}
      <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-5">
        <h2 className="text-xl font-bold text-white">Configure Custom Practice Exam</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Examination Scope</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'level1', label: 'Level 1 (Basic)' },
                { id: 'level2', label: 'Level 2 (Intermediate)' },
                { id: 'level3', label: 'Level 3 (Advanced)' },
                { id: 'combined', label: 'Combined 428A' },
                { id: 'redseal', label: 'Red Seal Mock' },
                { id: 'topic', label: 'Topic-Specific' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setExamMode(m.id as typeof examMode)}
                  className={`px-3 py-2 rounded-md border text-xs font-medium text-left transition-colors ${
                    examMode === m.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-[#0A111A] border-[#2A394A] text-slate-300 hover:bg-[#182433]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Question Count</label>
              <div className="grid grid-cols-4 gap-2">
                {([10, 25, 50, 100] as const).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2 rounded-md border font-mono text-xs transition-colors ${
                      questionCount === cnt && examMode !== 'diagnostic'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                        : 'bg-[#0A111A] border-[#2A394A] text-slate-300 hover:bg-[#182433]'
                    }`}
                  >
                    {cnt}Q
                  </button>
                ))}
              </div>
            </div>

            {examMode === 'topic' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Focus Topic</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value as TopicDomain)}
                  className="w-full bg-[#0A111A] border border-[#2A394A] rounded-md px-3 py-2 text-sm text-white"
                >
                  {ALL_DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={timed}
                  onChange={(e) => setTimed(e.target.checked)}
                  className="accent-amber-400"
                />
                <span>Timed Exam Mode (~1.8 min/question)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Study Goal %:</span>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={practiceTargetPct}
                  onChange={(e) => onUpdateTargetPct(Math.max(50, Math.min(100, Number(e.target.value) || 80)))}
                  className="w-16 bg-[#0A111A] border border-[#2A394A] rounded px-2 py-1 font-mono text-white tabular-nums"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#2A394A]">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            The {practiceTargetPct}% target is a personal study benchmark, not an official Skilled Trades Ontario passing standard.
          </p>
          <button
            type="button"
            onClick={() => startSession(examMode === 'diagnostic' ? 'level1' : examMode)}
            className="px-5 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            Launch Practice Exam
          </button>
        </div>
      </div>
    </div>
  );
};
