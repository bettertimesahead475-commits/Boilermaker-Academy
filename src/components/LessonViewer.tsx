import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  ClipboardCheck,
  HelpCircle,
  Wrench,
} from 'lucide-react';
import { Lesson } from '../types/academy';
import { findGlossaryEntryByTerm } from '../utils/glossarySearch';
import { TechnicalDiagram } from './TechnicalDiagrams';

interface LessonViewerProps {
  lesson: Lesson;
  isCompleted: boolean;
  previousScore?: number;
  bookmarkedFormulas: string[];
  onToggleBookmarkFormula: (formulaId: string) => void;
  onCompleteLesson: (lessonId: string, scorePct: number) => void;
  onBack: () => void;
  onAskAiAboutLesson: (prompt: string) => void;
  onOpenGlossary?: (entryId: string) => void;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  lesson,
  isCompleted,
  previousScore,
  bookmarkedFormulas,
  onToggleBookmarkFormula,
  onCompleteLesson,
  onBack,
  onAskAiAboutLesson,
  onOpenGlossary,
}) => {
  const [kcAnswers, setKcAnswers] = useState<Record<string, number>>({});
  const [finalAnswers, setFinalAnswers] = useState<Record<string, number>>({});
  const [submittedFinal, setSubmittedFinal] = useState(false);

  const handleSubmitFinal = () => {
    setSubmittedFinal(true);
    let correct = 0;
    lesson.finalAssessment.forEach((q) => {
      if (finalAnswers[q.id] === q.correctIndex) correct++;
    });
    const pct = Math.round((correct / lesson.finalAssessment.length) * 100);
    onCompleteLesson(lesson.id, pct);
  };

  const finalCorrectCount = lesson.finalAssessment.filter((q) => finalAnswers[q.id] === q.correctIndex).length;
  const finalPct = Math.round((finalCorrectCount / lesson.finalAssessment.length) * 100);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2A394A]">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-medium text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Level {lesson.level} Modules
          </button>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-amber-400">{lesson.moduleCode}</span>
            <span aria-hidden="true">·</span>
            <span>Level {lesson.level}</span>
            <span aria-hidden="true">·</span>
            <span>{lesson.domain}</span>
            <span aria-hidden="true">·</span>
            <span>{lesson.verificationTag}</span>
            {isCompleted && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 font-semibold">
                  Completed {previousScore !== undefined ? `(${previousScore}%)` : ''}
                </span>
              </>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white text-balance">{lesson.title}</h1>
        </div>

        <button
          type="button"
          onClick={() =>
            onAskAiAboutLesson(
              `Walk me through "${lesson.title}" (${lesson.moduleCode}) with a practical shop/field example and quiz me on the key formula.`
            )
          }
          className="px-4 py-2 rounded-md bg-[#182433] border border-[#2A394A] hover:border-amber-500/60 text-sm font-medium text-slate-100 transition-colors whitespace-nowrap"
        >
          Ask AI Instructor About This Lesson
        </button>
      </div>

      {/* 1. Learning Objectives */}
      <section className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-amber-400">01. Learning Objectives</h2>
          <span className="text-xs font-mono text-slate-400">{lesson.rsosTasks.join(' · ')}</span>
        </div>
        <ul className="space-y-2 text-sm text-slate-200">
          {lesson.learningObjectives.map((obj, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{obj}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 2. Clear Explanations in Plain Canadian English */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">02. Core Trade Explanation (Shop-to-Classroom)</h2>
        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-3 text-sm sm:text-base text-slate-200 leading-relaxed">
          {lesson.plainEnglishExplanation.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
      </section>

      {/* 3. Proper Technical Terminology */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">03. Essential Technical Terminology</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {lesson.technicalTerms.map((item) => {
            const matched = findGlossaryEntryByTerm(item.term);
            return (
              <div key={item.term} className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-amber-300">{item.term}</p>
                  {matched && onOpenGlossary && (
                    <button
                      type="button"
                      onClick={() => onOpenGlossary(matched.id)}
                      className="text-[11px] font-mono text-sky-400 hover:underline shrink-0"
                    >
                      Glossary Card →
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed">{item.definition}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Relevant Formulas */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">04. Formulas & Constants</h2>
        <div className="space-y-3">
          {lesson.formulas.map((f) => {
            const bookmarked = bookmarkedFormulas.includes(f.id);
            return (
              <div key={f.id} className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">{f.title}</span>
                  <button
                    type="button"
                    onClick={() => onToggleBookmarkFormula(f.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                      bookmarked
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'border-[#2A394A] text-slate-300 hover:bg-[#182433]'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    {bookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                </div>
                <p className="font-mono text-base sm:text-lg text-amber-400 bg-[#0A111A] px-3.5 py-2.5 rounded border border-[#1E293B]">
                  {f.expression}
                </p>
                <p className="text-xs text-slate-300">{f.variables}</p>
                <p className="text-xs font-mono text-slate-400">{f.unitsNote}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Worked Examples */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">05. Step-by-Step Worked Examples</h2>
        <div className="space-y-4">
          {lesson.workedExamples.map((ex, idx) => (
            <div key={idx} className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-3">
              <h3 className="text-base font-semibold text-white">{ex.title}</h3>
              <p className="text-sm text-slate-300">{ex.scenario}</p>
              <div className="text-xs font-mono text-slate-400 flex flex-wrap gap-3">
                {ex.given.map((g, i) => (
                  <span key={i} className="bg-[#0A111A] px-2.5 py-1 rounded border border-[#1E293B]">
                    {g}
                  </span>
                ))}
              </div>
              <ol className="space-y-1.5 text-sm font-mono text-slate-200 bg-[#0A111A] p-4 rounded border border-[#1E293B]">
                {ex.steps.map((st, sIdx) => (
                  <li key={sIdx}>{st}</li>
                ))}
              </ol>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-sm font-mono font-semibold text-emerald-400">Result: {ex.finalAnswer}</span>
                {ex.shopNote && <span className="text-xs text-slate-400">{ex.shopNote}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Interactive Diagram */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">06. Interactive Technical Diagram</h2>
        <TechnicalDiagram diagramId={lesson.diagramId} caption={lesson.diagramCaption} />
      </section>

      {/* 7. Realistic Industrial Scenario */}
      <section className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2 text-sky-400">
          <Wrench className="w-4 h-4" />
          <h2 className="text-lg font-bold">07. Realistic Shop / Field Scenario — {lesson.industrialScenario.title}</h2>
        </div>
        <p className="text-sm text-slate-200">{lesson.industrialScenario.context}</p>
        <p className="text-sm font-medium text-amber-300">Key Takeaway: {lesson.industrialScenario.keyTakeaway}</p>
        {lesson.industrialScenario.safetyNotice && (
          <div className="p-3 rounded bg-amber-950/35 border border-amber-600/50 text-xs text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{lesson.industrialScenario.safetyNotice}</span>
          </div>
        )}
      </section>

      {/* 8. Common Mistakes */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">08. Common Shop & Exam Mistakes</h2>
        <div className="space-y-3">
          {lesson.commonMistakes.map((m, idx) => (
            <div key={idx} className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-mono text-red-400">COMMON TRAP</p>
                <p className="text-sm text-slate-200 mt-1">{m.habit}</p>
              </div>
              <div>
                <p className="text-xs font-mono text-emerald-400">CORRECT PRACTICE</p>
                <p className="text-sm text-slate-200 mt-1">{m.correction}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Knowledge Checks (Instant Feedback) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white">09. Quick Knowledge Checks</h2>
        </div>
        <div className="space-y-4">
          {lesson.knowledgeChecks.map((kc) => {
            const chosen = kcAnswers[kc.id];
            const answered = chosen !== undefined;
            return (
              <div key={kc.id} className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-3">
                <p className="text-sm font-medium text-white">{kc.prompt}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {kc.options.map((opt, oIdx) => {
                    const isSelected = chosen === oIdx;
                    const isCorrect = oIdx === kc.correctIndex;
                    let cls = 'border-[#2A394A] bg-[#0A111A] text-slate-200 hover:bg-[#182433]';
                    if (answered) {
                      if (isCorrect) cls = 'border-emerald-500 bg-emerald-950/40 text-emerald-200';
                      else if (isSelected) cls = 'border-red-500 bg-red-950/40 text-red-200';
                    }
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => setKcAnswers((prev) => ({ ...prev, [kc.id]: oIdx }))}
                        className={`text-left px-3.5 py-2.5 rounded border text-sm transition-colors ${cls}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {answered && (
                  <div className="text-xs text-slate-300 bg-[#0A111A] p-3 rounded border border-[#1E293B]">
                    <strong className={chosen === kc.correctIndex ? 'text-emerald-400' : 'text-amber-400'}>
                      {chosen === kc.correctIndex ? 'Correct: ' : 'Review: '}
                    </strong>
                    {kc.explanation}
                    {kc.formulaUsed && <span className="block font-mono text-amber-300 mt-1">Formula: {kc.formulaUsed}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. Final Lesson Assessment */}
      <section className="bg-[#111B27] border border-amber-500/40 rounded-lg p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">10. Final Lesson Assessment</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {lesson.finalAssessment.length} Questions · Saves to Progress Record
          </span>
        </div>

        <div className="space-y-4">
          {lesson.finalAssessment.map((q, idx) => {
            const chosen = finalAnswers[q.id];
            return (
              <div key={q.id} className="bg-[#0A111A] border border-[#2A394A] rounded-md p-4 space-y-3">
                <p className="text-sm font-medium text-white">
                  {idx + 1}. {q.prompt}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = chosen === oIdx;
                    const isCorrect = oIdx === q.correctIndex;
                    let cls = 'border-[#2A394A] text-slate-200 hover:bg-[#182433]';
                    if (submittedFinal) {
                      if (isCorrect) cls = 'border-emerald-500 bg-emerald-950/40 text-emerald-200';
                      else if (isSelected) cls = 'border-red-500 bg-red-950/40 text-red-200';
                    } else if (isSelected) {
                      cls = 'border-amber-400 bg-amber-500/15 text-amber-200';
                    }
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        disabled={submittedFinal}
                        onClick={() => setFinalAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                        className={`w-full text-left px-3.5 py-2 rounded border text-sm transition-colors ${cls}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {submittedFinal && (
                  <p className="text-xs text-slate-300 pt-1">
                    <span className={chosen === q.correctIndex ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                      {chosen === q.correctIndex ? 'Correct — ' : 'Incorrect — '}
                    </span>
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {!submittedFinal ? (
          <button
            type="button"
            disabled={Object.keys(finalAnswers).length < lesson.finalAssessment.length}
            onClick={handleSubmitFinal}
            className="px-5 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-semibold text-sm transition-colors"
          >
            Submit Lesson Assessment & Mark Complete
          </button>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-md bg-[#0A111A] border border-emerald-600/50">
            <div>
              <p className="text-sm font-semibold text-white">
                Lesson Score: <span className="font-mono text-amber-400">{finalPct}%</span> ({finalCorrectCount}/{lesson.finalAssessment.length})
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved to your study profile. Personal study target is configurable in Dashboard/Exams.
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-md bg-[#182433] border border-[#2A394A] text-sm font-medium text-white hover:border-amber-400"
            >
              Return to Curriculum
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
