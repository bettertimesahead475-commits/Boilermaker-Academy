import React, { useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  Download,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import { MASTER_FORMULA_SHEET } from '../data/curriculumMap';
import { ALL_LESSONS } from '../data/examQuestions';
import { ApprenticeshipLevel, StudentProgress, StudyNote, TopicDomain } from '../types/academy';
import { ALL_DOMAINS, calculateStudyReadiness, classifyPerformance } from '../utils/scoring';

interface StudyNotesViewProps {
  progress: StudentProgress;
  onAddNote: (note: StudyNote) => void;
  onDeleteNote: (id: string) => void;
  onToggleBookmarkFormula: (id: string) => void;
}

export const StudyNotesView: React.FC<StudyNotesViewProps> = ({
  progress,
  onAddNote,
  onDeleteNote,
  onToggleBookmarkFormula,
}) => {
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<TopicDomain>('Mathematics');
  const [level, setLevel] = useState<ApprenticeshipLevel>(1);
  const [content, setContent] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onAddNote({
      id: `note-${Date.now()}`,
      title: title.trim(),
      domain,
      level,
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    });
    setTitle('');
    setContent('');
  };

  const allKnownFormulas = [
    ...MASTER_FORMULA_SHEET,
    ...ALL_LESSONS.flatMap((l) => l.formulas),
  ].filter((f, idx, arr) => arr.findIndex((x) => x.id === f.id) === idx);

  const bookmarkedItems = allKnownFormulas.filter((f) => progress.bookmarkedFormulas.includes(f.id));

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="pb-4 border-b border-[#2A394A]">
        <h1 className="text-3xl font-bold text-white">Study Notes & Bookmarked Formulas</h1>
        <p className="text-sm text-slate-400 mt-1">
          Saved persistently on the server so your notes, formulas, and uploaded document summaries stay across sessions.
        </p>
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleSave} className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-4">
        <h2 className="text-lg font-bold text-white">New Shop / Classroom Note</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Note title (e.g., Crane Chart Deductions)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="sm:col-span-2 bg-[#0A111A] border border-[#2A394A] rounded-md px-3 py-2 text-sm text-white"
          />
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as TopicDomain)}
            className="bg-[#0A111A] border border-[#2A394A] rounded-md px-3 py-2 text-sm text-white"
          >
            {ALL_DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value) as ApprenticeshipLevel)}
            className="bg-[#0A111A] border border-[#2A394A] rounded-md px-3 py-2 text-sm text-white"
          >
            <option value={1}>Level 1 (Basic)</option>
            <option value={2}>Level 2 (Intermediate)</option>
            <option value={3}>Level 3 (Advanced)</option>
          </select>
        </div>
        <textarea
          rows={3}
          placeholder="Write formulas, mnemonic reminders, or turnaround lessons..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-[#0A111A] border border-[#2A394A] rounded-md px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          disabled={!title.trim() || !content.trim()}
          className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-semibold text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Save Note
        </button>
      </form>

      {/* Saved Notes List */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">Saved Notes ({progress.studyNotes.length})</h2>
        {progress.studyNotes.length === 0 ? (
          <p className="text-sm text-slate-400 bg-[#111B27] border border-[#2A394A] rounded-lg p-5">
            No notes saved yet. Add your first note above.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {progress.studyNotes.map((n) => (
              <div key={n.id} className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-mono text-amber-400">
                      Level {n.level} · {n.domain}
                    </p>
                    <h3 className="text-base font-semibold text-white">{n.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteNote(n.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookmarked Formulas */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">Bookmarked Formulas ({bookmarkedItems.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookmarkedItems.map((f) => (
            <div key={f.id} className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">{f.title}</span>
                <button
                  type="button"
                  onClick={() => onToggleBookmarkFormula(f.id)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Bookmark className="w-3.5 h-3.5 fill-amber-400" />
                  Remove
                </button>
              </div>
              <p className="font-mono text-sm text-amber-300 bg-[#0A111A] p-2.5 rounded border border-[#1E293B]">
                {f.expression}
              </p>
              <p className="text-xs text-slate-400">{f.variables}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Uploaded Document Archive */}
      {progress.uploadedDocs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">Uploaded Document References ({progress.uploadedDocs.length})</h2>
          <div className="space-y-3">
            {progress.uploadedDocs.map((d) => (
              <div key={d.id} className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <span className="text-sm font-semibold text-white">{d.fileName}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {d.category} · {new Date(d.uploadedAt).toLocaleDateString('en-CA')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{d.aiSummary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ProgressReportsViewProps {
  progress: StudentProgress;
  onResetProgress: () => void;
}

export const ProgressReportsView: React.FC<ProgressReportsViewProps> = ({ progress, onResetProgress }) => {
  const readiness = calculateStudyReadiness({
    completedLessonIds: progress.completedLessonIds,
    totalLessons: ALL_LESSONS.length,
    diagnosticResult: progress.diagnosticResult,
    assessmentHistory: progress.assessmentHistory,
  });

  const totalStudyMinutes = Math.round(
    Object.values(progress.dailyStudySeconds).reduce((a, b) => a + b, 0) / 60
  );

  const exportReport = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boilermaker-428a-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2A394A]">
        <div>
          <h1 className="text-3xl font-bold text-white">Progress & Readiness Reports</h1>
          <p className="text-sm text-slate-400 mt-1">
            Comprehensive analytics across Level 1–3 modules, diagnostic results, and practice exam history.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportReport}
            className="px-4 py-2 rounded-md bg-[#182433] border border-[#2A394A] text-xs font-medium text-white hover:border-amber-400 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <button
            type="button"
            onClick={onResetProgress}
            className="px-4 py-2 rounded-md border border-red-800/60 text-xs font-medium text-red-300 hover:bg-red-950/40"
          >
            Reset Study Data
          </button>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="p-4 rounded-lg bg-[#111B27] border border-amber-500/40 text-xs text-slate-300 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          Unofficial readiness estimates reflect your self-paced practice performance and lesson completion only. They do not represent formal trade qualifications, Skilled Trades Ontario exemption approval, or Red Seal certification.
        </span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4">
          <p className="text-xs text-slate-400">Overall Curriculum</p>
          <p className="text-2xl font-bold font-mono text-white tabular-nums mt-1">{readiness.overallCoveragePct}%</p>
        </div>
        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4">
          <p className="text-xs text-slate-400">Est. Study Readiness</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1">{readiness.estimatedReadinessPct}%</p>
        </div>
        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4">
          <p className="text-xs text-slate-400">Assessments Taken</p>
          <p className="text-2xl font-bold font-mono text-sky-400 tabular-nums mt-1">
            {progress.assessmentHistory.length + (progress.diagnosticResult ? 1 : 0)}
          </p>
        </div>
        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4">
          <p className="text-xs text-slate-400">Cumulative Study Time</p>
          <p className="text-2xl font-bold font-mono text-amber-400 tabular-nums mt-1">{totalStudyMinutes} min</p>
        </div>
      </div>

      {/* Domain Proficiency Table */}
      <div className="bg-[#111B27] border border-[#2A394A] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2A394A]">
          <h2 className="text-lg font-bold text-white">8-Domain Classification Summary</h2>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-[#0A111A] text-xs font-mono text-slate-400 border-b border-[#2A394A]">
            <tr>
              <th className="px-4 py-2.5">Domain</th>
              <th className="px-4 py-2.5">Proficiency</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {ALL_DOMAINS.map((d) => {
              const score = readiness.domainProficiency[d];
              return (
                <tr key={d}>
                  <td className="px-4 py-2.5 font-medium text-white">{d}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-amber-400">
                    {score > 0 ? `${score}%` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">
                    {score > 0 ? classifyPerformance(score) : 'Pending assessment'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Assessment History */}
      <div className="bg-[#111B27] border border-[#2A394A] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2A394A]">
          <h2 className="text-lg font-bold text-white">Assessment History Log</h2>
        </div>
        {progress.assessmentHistory.length === 0 && !progress.diagnosticResult ? (
          <p className="p-5 text-sm text-slate-400">No assessments completed yet. Start with the 50Q Level 1 Diagnostic.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0A111A] text-xs font-mono text-slate-400 border-b border-[#2A394A]">
                <tr>
                  <th className="px-4 py-2.5">Assessment</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Score</th>
                  <th className="px-4 py-2.5">Practical / Theory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {[...(progress.diagnosticResult ? [progress.diagnosticResult] : []), ...progress.assessmentHistory].map(
                  (a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2.5 text-white font-medium">{a.title}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-400">
                        {new Date(a.completedAt).toLocaleDateString('en-CA')}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-amber-400">
                        {a.percentage}% ({a.totalCorrect}/{a.totalQuestions})
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-300 tabular-nums">
                        {a.practicalPercentage}% / {a.theoreticalPercentage}%
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3D Rigging Simulator & Crane Hand Signals History */}
      <div className="bg-[#111B27] border border-[#2A394A] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2A394A] flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-white">3D Rigging Lab & Crane Hand Signals</h2>
          <span className="text-xs font-mono text-amber-400">
            Signals Mastered: {progress.signalProgress?.knownIds?.length ?? 0} · Lifts Logged:{' '}
            {progress.riggingSessions?.length ?? 0}
          </span>
        </div>
        {!progress.riggingSessions || progress.riggingSessions.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">
            No 3D rigging lifts logged yet. Complete scenarios in the 3D Rigging Lab to record safety and tension performance.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0A111A] text-xs font-mono text-slate-400 border-b border-[#2A394A]">
                <tr>
                  <th className="px-4 py-2.5">Scenario</th>
                  <th className="px-4 py-2.5">Mode</th>
                  <th className="px-4 py-2.5">Score</th>
                  <th className="px-4 py-2.5">Min Angle / Peak Tilt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {progress.riggingSessions.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 text-white font-medium">{r.scenarioTitle}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400 uppercase">{r.mode}</td>
                    <td
                      className={`px-4 py-2.5 font-mono tabular-nums ${
                        r.passed ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {r.scorePct}% ({r.passed ? 'PASS' : 'REVIEW'})
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-300 tabular-nums">
                      {r.minAngleDeg.toFixed(1)}° / {r.peakTiltDeg.toFixed(1)}°
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
