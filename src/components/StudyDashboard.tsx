import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  ShieldAlert,
  Target,
} from 'lucide-react';
import { ALL_LESSONS } from '../data/examQuestions';
import { ApprenticeshipLevel, NavSection, StudentProgress, TopicDomain } from '../types/academy';
import { ALL_DOMAINS, calculateStudyReadiness, classifyPerformance } from '../utils/scoring';

interface StudyDashboardProps {
  progress: StudentProgress;
  onNavigate: (section: NavSection) => void;
  onStartDiagnostic: () => void;
  onOpenLesson: (lessonId: string) => void;
  onChangeLevel: (lvl: ApprenticeshipLevel) => void;
  onToggleScheduleDay: (dayIndex: number) => void;
}

export const StudyDashboard: React.FC<StudyDashboardProps> = ({
  progress,
  onNavigate,
  onStartDiagnostic,
  onOpenLesson,
  onChangeLevel,
  onToggleScheduleDay,
}) => {
  const [imgError, setImgError] = useState(false);

  const readiness = calculateStudyReadiness({
    completedLessonIds: progress.completedLessonIds,
    totalLessons: ALL_LESSONS.length,
    diagnosticResult: progress.diagnosticResult,
    assessmentHistory: progress.assessmentHistory,
  });

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayMinutes = Math.round((progress.dailyStudySeconds[todayKey] ?? 0) / 60);

  // Determine recommended next lesson based on weak subjects and incomplete lessons
  const weakPriority = progress.weakSubjects;
  const recommendedLesson =
    ALL_LESSONS.find(
      (l) => weakPriority.includes(l.domain) && !progress.completedLessonIds.includes(l.id)
    ) ??
    ALL_LESSONS.find((l) => !progress.completedLessonIds.includes(l.id)) ??
    ALL_LESSONS[0];

  const getDomainValue = (dom: TopicDomain) => readiness.domainProficiency[dom] ?? 0;

  return (
    <div className="space-y-6">
      {/* Hero Banner Split (2-column stretched alignment) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-[#111B27] border border-[#2A394A] rounded-lg p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-400">
              <span>ONTARIO 428A STUDY WORKBENCH</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">{progress.profile.currentLocal}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">Former {progress.profile.previousLocal}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-wide text-balance">
              Targeted Classroom Theory & Exemption Exam Readiness
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Tailored for {progress.profile.yearsShopExperience} years of shop fabrication, SMAW/FCAW/pipe welding, and Alberta field experience. Focuses on classroom math, rigging calculations, blueprint symbols, and Canadian code theory rather than beginner hand-holding.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onStartDiagnostic}
              className="px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <ClipboardList className="w-4 h-4" />
              {progress.diagnosticResult ? 'Retake 50Q Diagnostic' : 'Start 50Q Diagnostic'}
            </button>
            <button
              type="button"
              onClick={() => onOpenLesson(recommendedLesson.id)}
              className="px-3.5 py-2.5 rounded-md bg-[#182433] border border-[#2A394A] hover:border-amber-400 text-sm font-medium text-white flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <span>Next: {recommendedLesson.moduleCode}</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('rigging-sim')}
              className="px-3.5 py-2.5 rounded-md bg-[#182433] border border-[#2A394A] hover:border-amber-400 text-sm font-medium text-amber-300 transition-colors whitespace-nowrap"
            >
              3D Rigging Lab
            </button>
            <button
              type="button"
              onClick={() => onNavigate('crane-signals')}
              className="px-3.5 py-2.5 rounded-md bg-[#182433] border border-[#2A394A] hover:border-amber-400 text-sm font-medium text-sky-300 transition-colors whitespace-nowrap"
            >
              Crane Signals
            </button>
            <button
              type="button"
              onClick={() => onNavigate('welding-sim')}
              className="px-3.5 py-2.5 rounded-md bg-[#182433] border border-[#2A394A] hover:border-amber-400 text-sm font-medium text-amber-300 transition-colors whitespace-nowrap"
            >
              3D Welding Sim
            </button>
            <button
              type="button"
              onClick={() => onNavigate('glossary')}
              className="px-3.5 py-2.5 rounded-md bg-[#182433] border border-[#2A394A] hover:border-amber-400 text-sm font-medium text-slate-200 transition-colors whitespace-nowrap"
            >
              Trade Glossary
            </button>
          </div>
        </div>

        {/* Shop Image Panel with resilient CSS fallback */}
        <div className="lg:col-span-5 bg-[#111B27] border border-[#2A394A] rounded-lg overflow-hidden relative min-h-[220px]">
          {!imgError ? (
            <img
              src="/src/assets/images/hero_boilermaker_shop_1794687590238.jpg"
              alt="Industrial boilermaker shop with cylindrical pressure vessel on turning rolls and 50T overhead rigging"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0F1B2B] to-[#1A283A] flex flex-col items-center justify-center p-6 text-center">
              <p className="font-mono text-xs text-amber-400">428A · CONSTRUCTION BOILERMAKER</p>
              <p className="text-lg font-bold text-white mt-1">Ontario Exemption & Red Seal Prep</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A111A]/95 via-[#0A111A]/35 to-transparent flex flex-col justify-end p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-mono text-amber-400">ACTIVE TARGET LEVEL</p>
                <p className="text-lg font-bold text-white">Level {progress.currentStudyLevel} — {progress.currentStudyLevel === 1 ? 'Basic (CBMB)' : progress.currentStudyLevel === 2 ? 'Intermediate (CBMI)' : 'Advanced (CBMA)'}</p>
              </div>
              <div className="flex gap-1 bg-[#0A111A]/85 p-1 rounded border border-[#2A394A]">
                {([1, 2, 3] as ApprenticeshipLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onChangeLevel(lvl)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      progress.currentStudyLevel === lvl
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    L{lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4">
          <p className="text-xs text-slate-400">Lessons Completed</p>
          <p className="text-3xl font-bold font-mono text-white tabular-nums mt-1">
            {progress.completedLessonIds.length}{' '}
            <span className="text-base text-slate-400">/ {ALL_LESSONS.length}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">{readiness.overallCoveragePct}% curriculum coverage</p>
        </div>

        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4">
          <p className="text-xs text-slate-400">Daily Study Time</p>
          <p className="text-3xl font-bold font-mono text-amber-400 tabular-nums mt-1 flex items-center gap-2">
            <span>{todayMinutes}m</span>
            <Clock className="w-5 h-5 text-slate-500" />
          </p>
          <p className="text-xs text-slate-400 mt-1">Logged persistently on disk</p>
        </div>

        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4">
          <p className="text-xs text-slate-400">Practice Exam Average</p>
          <p className="text-3xl font-bold font-mono text-sky-400 tabular-nums mt-1">
            {progress.assessmentHistory.length > 0
              ? `${Math.round(
                  progress.assessmentHistory.reduce((acc, a) => acc + a.percentage, 0) /
                    progress.assessmentHistory.length
                )}%`
              : progress.diagnosticResult
              ? `${progress.diagnosticResult.percentage}%`
              : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {progress.assessmentHistory.length} practice runs · Goal {progress.practiceTargetPct}%
          </p>
        </div>

        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4">
          <p className="text-xs text-slate-400">Estimated Study Readiness</p>
          <p className="text-3xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
            {readiness.estimatedReadinessPct}%
          </p>
          <p className="text-xs text-slate-400 mt-1">Unofficial self-study indicator only</p>
        </div>
      </div>

      {/* Core Proficiencies + Diagnostic Domain Gap Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-white">Domain Proficiency & Gap Breakdown</h2>
              <p className="text-xs text-slate-400">
                Mathematics, Rigging, Welding, and all 428A domains tracked from diagnostic & practice tests.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="text-xs font-medium text-amber-400 hover:underline"
            >
              Full Progress Report →
            </button>
          </div>

          {/* Highlighted Core 3 */}
          <div className="grid grid-cols-3 gap-3 pb-2">
            {(['Mathematics', 'Rigging', 'Welding'] as TopicDomain[]).map((core) => {
              const score = getDomainValue(core);
              return (
                <div key={core} className="bg-[#0A111A] border border-[#2A394A] rounded-md p-3">
                  <p className="text-xs text-slate-400">{core}</p>
                  <p className="text-2xl font-bold font-mono text-white tabular-nums mt-0.5">
                    {score > 0 ? `${score}%` : '—'}
                  </p>
                  <p className="text-xs font-mono text-amber-400 mt-0.5">
                    {score > 0 ? classifyPerformance(score) : 'Pending diagnostic'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* All 8 Domain Bars */}
          <div className="space-y-3">
            {ALL_DOMAINS.map((dom) => {
              const val = getDomainValue(dom);
              const label = val > 0 ? classifyPerformance(val) : 'Not assessed';
              const barColor =
                val >= 85
                  ? 'bg-emerald-500'
                  : val >= 70
                  ? 'bg-sky-500'
                  : val >= 50
                  ? 'bg-amber-500'
                  : val > 0
                  ? 'bg-red-500'
                  : 'bg-slate-700';

              return (
                <div key={dom} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{dom}</span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {val > 0 ? `${val}% · ${label}` : label}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#0A111A] overflow-hidden border border-[#1E293B]">
                    <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${Math.max(val, 2)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: 7-Day Individualized Study Schedule */}
        <div className="lg:col-span-5 bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">7-Day Study Schedule</h2>
              <p className="text-xs text-slate-400">Prioritized around your weakest classroom theory topics.</p>
            </div>
            <Target className="w-5 h-5 text-amber-400" />
          </div>

          <div className="space-y-2.5">
            {progress.studySchedule.map((item, idx) => (
              <div
                key={item.day}
                className={`p-3 rounded-md border transition-colors ${
                  item.completed
                    ? 'bg-emerald-950/20 border-emerald-700/40'
                    : 'bg-[#0A111A] border-[#2A394A]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => onToggleScheduleDay(idx)}
                      className="mt-1 accent-amber-400"
                    />
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-amber-400 font-semibold">{item.day}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-300">{item.focusDomain}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400">{item.targetMinutes} min</span>
                      </div>
                      <p className={`text-xs mt-1 ${item.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {item.taskDescription}
                      </p>
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={() => onOpenLesson(item.recommendedLessonId)}
                    className="text-xs font-medium text-sky-400 hover:underline shrink-0"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Action & Regulatory Guardrail Notice */}
      <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3 max-w-3xl">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-white">Exemption Eligibility & Curriculum Verification Notice</p>
            <p>
              Official Ontario Construction Boilermaker (428A) credit transfers, classroom exemption approvals, and Red Seal exam admission are governed exclusively by Skilled Trades Ontario and approved Training Delivery Agents. Use the Curriculum Map in Levels 1–3 to upload and cross-check any official STO PDF documents.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('calculators')}
            className="px-3.5 py-2 rounded border border-[#2A394A] text-xs font-medium text-slate-200 hover:bg-[#182433]"
          >
            Open Rigging Calculators
          </button>
          <button
            type="button"
            onClick={() => onNavigate('instructor')}
            className="px-3.5 py-2 rounded bg-[#182433] border border-amber-500/40 text-xs font-medium text-amber-300 hover:bg-amber-500/10 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ask AI Instructor
          </button>
        </div>
      </div>
    </div>
  );
};
