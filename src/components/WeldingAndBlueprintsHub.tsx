import React, { useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, ExternalLink, FileWarning, Flame } from 'lucide-react';
import { CURRICULUM_MAP, OFFICIAL_SOURCES } from '../data/curriculumMap';
import { ALL_LESSONS } from '../data/examQuestions';
import { ApprenticeshipLevel, DiagramId } from '../types/academy';
import { GlossaryLink } from './GlossaryDrawer';
import { TechnicalDiagram } from './TechnicalDiagrams';

interface LevelCurriculumViewProps {
  level: ApprenticeshipLevel;
  completedLessonIds: string[];
  lessonScores: Record<string, number>;
  onOpenLesson: (lessonId: string) => void;
  onGoToUpload: () => void;
}

export const LevelCurriculumView: React.FC<LevelCurriculumViewProps> = ({
  level,
  completedLessonIds,
  lessonScores,
  onOpenLesson,
  onGoToUpload,
}) => {
  const [vesselImgErr, setVesselImgErr] = useState(false);

  const levelLessons = ALL_LESSONS.filter((l) => l.level === level);
  const levelOutcomes = CURRICULUM_MAP.filter((o) => o.level === level);

  const titles: Record<ApprenticeshipLevel, { heading: string; code: string; sub: string }> = {
    1: {
      heading: 'Level 1 — Basic (CBMB)',
      code: '240 Nominal In-School Hours · Trade Foundations',
      sub: 'Covers trade math, rigging fundamentals, basic blueprints & welding symbols, WHMIS/LOTO/confined spaces, oxy-fuel cutting, SMAW electrodes, and boiler basics.',
    },
    2: {
      heading: 'Level 2 — Intermediate (CBMI)',
      code: '240 Nominal In-School Hours · Layout, CG & Metallurgy',
      sub: 'Covers centre of gravity, crane load charts, reeving & mechanical advantage, parallel/radial pattern development, welding distortion, and heat exchangers.',
    },
    3: {
      heading: 'Level 3 — Advanced (CBMA)',
      code: '240 Nominal In-School Hours · Complex Lifts, Vessels & Red Seal',
      sub: 'Covers multi-crane tail-ups, tube rolling & storage tank erection, PWHT/NDE defect analysis, ASME/CSA overview, and Red Seal synthesis math.',
    },
  };

  return (
    <div className="space-y-6">
      {/* Level Header with optional pressure vessel photo on Level 2/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 bg-[#111B27] border border-[#2A394A] rounded-lg p-6 flex flex-col justify-between space-y-3">
          <div>
            <p className="text-xs font-mono text-amber-400">{titles[level].code}</p>
            <h1 className="text-3xl font-bold text-white mt-1">{titles[level].heading}</h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">{titles[level].sub}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2">
            <span>
              Modules Completed: <strong className="text-white">{levelLessons.filter((l) => completedLessonIds.includes(l.id)).length} / {levelLessons.length}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={onGoToUpload} className="text-amber-400 hover:underline">
              Upload Official STO 428A Level {level} PDF →
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#111B27] border border-[#2A394A] rounded-lg overflow-hidden min-h-[160px] relative">
          {!vesselImgErr ? (
            <img
              src="/src/assets/images/pressure_vessel_bay_1794687590827.jpg"
              alt="Boiler drum and shell-and-tube heat exchanger assembly in heavy industrial bay"
              referrerPolicy="no-referrer"
              onError={() => setVesselImgErr(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#0D1622] flex items-center justify-center p-4 text-xs font-mono text-slate-400">
              ONTARIO 428A · LEVEL {level}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Lesson Cards */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">Instructional Modules ({levelLessons.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {levelLessons.map((lesson) => {
            const done = completedLessonIds.includes(lesson.id);
            const score = lessonScores[lesson.id];
            return (
              <div
                key={lesson.id}
                className="bg-[#111B27] border border-[#2A394A] hover:border-amber-500/60 rounded-lg p-5 flex flex-col justify-between gap-4 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-amber-400">{lesson.moduleCode} · {lesson.domain}</span>
                    <span className={done ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                      {done ? `Completed (${score ?? 100}%)` : `~${lesson.estimatedMinutes} min`}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{lesson.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{lesson.learningObjectives[0]}</p>
                  <p className="text-xs font-mono text-slate-500">{lesson.verificationTag} · {lesson.rsosTasks[0]}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenLesson(lesson.id)}
                  className="w-full py-2 px-3 rounded bg-[#182433] hover:bg-amber-500 hover:text-slate-950 text-white text-xs font-semibold flex items-center justify-between transition-colors"
                >
                  <span>{done ? 'Review Lesson & Assessment' : 'Open Full 10-Part Lesson'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Curriculum Verification Map */}
      <div className="bg-[#111B27] border border-[#2A394A] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2A394A] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Ontario 428A & Red Seal RSOS Curriculum Map (Level {level})</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Distinguishes verified STO/RSOS frameworks from supplementary instruction and unverified unit PDFs.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToUpload}
            className="px-3 py-1.5 rounded border border-amber-500/50 text-xs font-medium text-amber-300 hover:bg-amber-500/10 flex items-center gap-1.5"
          >
            <FileWarning className="w-3.5 h-3.5" />
            Verify with Official PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0A111A] font-mono text-slate-400 border-b border-[#2A394A]">
              <tr>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Outcome / Competency</th>
                <th className="px-4 py-2.5">RSOS Alignment</th>
                <th className="px-4 py-2.5">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {levelOutcomes.map((o) => (
                <tr key={o.id} className="hover:bg-[#182433]/40">
                  <td className="px-4 py-3 font-mono text-amber-400 whitespace-nowrap">{o.code}</td>
                  <td className="px-4 py-3 text-slate-100 font-medium">{o.title}</td>
                  <td className="px-4 py-3 text-slate-400">{o.rsosAlignment}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        o.verificationStatus === 'Verified STO / RSOS Framework'
                          ? 'text-emerald-400'
                          : o.verificationStatus === 'Pending Official STO PDF Verification'
                          ? 'text-amber-300'
                          : 'text-sky-400'
                      }
                    >
                      {o.verificationStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reference Authorities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {OFFICIAL_SOURCES.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="bg-[#111B27] border border-[#2A394A] hover:border-slate-500 rounded-lg p-4 space-y-1 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-white">{s.name}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
            <p className="text-xs text-slate-400">{s.verifiedDetails}</p>
            <p className="text-xs font-mono text-amber-400 pt-0.5">{s.status}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

interface HubProps {
  mode: 'welding' | 'blueprints';
  onOpenLesson: (lessonId: string) => void;
  onStartTopicExam: () => void;
  onOpenSimulator?: () => void;
  onOpenGlossary?: (entryId: string) => void;
}

export const WeldingAndBlueprintsHub: React.FC<HubProps> = ({
  mode,
  onOpenLesson,
  onStartTopicExam,
  onOpenSimulator,
  onOpenGlossary,
}) => {
  const weldingDiagrams: DiagramId[] = ['welding-positions', 'welding-processes', 'welding-joints', 'welding-symbols'];
  const blueprintDiagrams: DiagramId[] = ['orthographic-projection', 'isometric-drawing', 'welding-symbols', 'plate-layout'];
  const list = mode === 'welding' ? weldingDiagrams : blueprintDiagrams;
  const [selectedDiagram, setSelectedDiagram] = useState<DiagramId>(list[0]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2A394A]">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {mode === 'welding' ? 'Welding Theory, Electrodes & Metallurgy Hub' : 'Blueprint Reading & Layout Hub'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {mode === 'welding'
              ? 'SMAW, FCAW, GMAW, GTAW processes, CSA W48 / AWS A5.1 classifications, preheat, PWHT, and NDE inspection.'
              : 'Third-angle orthographic projections, 30° isometric spools, AWS/CSA welding symbols, and shell/cone pattern layouts.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {mode === 'welding' && onOpenSimulator && (
            <button
              type="button"
              onClick={onOpenSimulator}
              className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4" />
              Launch 3D Welding Sim
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenLesson(mode === 'welding' ? 'l1-welding-oxy-smaw' : 'l1-blueprint-basics')}
            className="px-4 py-2 rounded-md bg-[#182433] border border-[#2A394A] text-xs font-medium text-white hover:border-amber-400 flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            Open Full Lesson
          </button>
          <button
            type="button"
            onClick={onStartTopicExam}
            className="px-4 py-2 rounded-md bg-[#182433] border border-[#2A394A] hover:border-amber-400 text-white font-semibold text-xs"
          >
            Practice Quiz
          </button>
        </div>
      </div>

      {/* Interactive Diagram Selector */}
      <div className="flex flex-wrap gap-2">
        {list.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDiagram(d)}
            className={`px-3.5 py-2 rounded-md border text-xs font-medium transition-colors ${
              selectedDiagram === d
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold'
                : 'bg-[#111B27] border-[#2A394A] text-slate-300 hover:bg-[#182433]'
            }`}
          >
            {d.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      <TechnicalDiagram diagramId={selectedDiagram} />

      {/* Quick Reference Matrix */}
      {mode === 'welding' ? (
        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2A394A]">
            <h2 className="text-lg font-bold text-white">CSA W48 / AWS A5.1 Quick Boilermaker Electrode Reference</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0A111A] font-mono text-slate-400 border-b border-[#2A394A]">
                <tr>
                  <th className="px-4 py-2.5">AWS Class</th>
                  <th className="px-4 py-2.5">CSA W48</th>
                  <th className="px-4 py-2.5">Flux / Polarity</th>
                  <th className="px-4 py-2.5">Primary Boilermaker Use</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                <tr>
                  <td className="px-4 py-2.5 font-mono text-amber-400">
                    {onOpenGlossary ? <GlossaryLink termIdOrName="e6010" onOpenGlossary={onOpenGlossary} /> : 'E6010'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-300">E4310</td>
                  <td className="px-4 py-2.5 text-slate-300">High-cellulose sodium · DCEP</td>
                  <td className="px-4 py-2.5 text-slate-200">Open-root pipe & dirty/painted repair work; deep keyhole penetration</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-amber-400">
                    {onOpenGlossary ? <GlossaryLink termIdOrName="e7018" onOpenGlossary={onOpenGlossary} /> : 'E7018'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-300">E4918</td>
                  <td className="px-4 py-2.5 text-slate-300">Low-hydrogen iron powder · DCEP/AC</td>
                  <td className="px-4 py-2.5 text-slate-200">Code pressure vessels, structural steel, fill/cap passes (rod oven required)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-amber-400">
                    {onOpenGlossary ? <GlossaryLink termIdOrName="e7024" onOpenGlossary={onOpenGlossary} /> : 'E7024'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-300">E4924</td>
                  <td className="px-4 py-2.5 text-slate-300">Heavy iron powder · AC/DC (Flat/Horiz)</td>
                  <td className="px-4 py-2.5 text-slate-200">High-deposition shop fillets (flat & horizontal fillets only)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-amber-400">
                    {onOpenGlossary ? <GlossaryLink termIdOrName="e71t-1" onOpenGlossary={onOpenGlossary} /> : 'E71T-1'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-300">E491T-9</td>
                  <td className="px-4 py-2.5 text-slate-300">FCAW-G rutile · CV DCEP + CO₂/Mix</td>
                  <td className="px-4 py-2.5 text-slate-200">All-position high-productivity structural & vessel shop fabrication</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <p className="font-mono text-amber-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              ORTHOGRAPHIC RULES
            </p>
            <p className="text-slate-300 leading-relaxed">
              North American drawings use Third-Angle Projection: Top view sits directly above Front view; Right-Side view sits directly to the right.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-mono text-sky-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              WELDING SYMBOL RULES
            </p>
            <p className="text-slate-300 leading-relaxed">
              Below reference line = Arrow Side. Above line = Other Side. Left of symbol = Size. Right = Length–Pitch. Open circle = All around. Black flag = Field weld.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              PATTERN DEVELOPMENT
            </p>
            <p className="text-slate-300 leading-relaxed">
              Parallel-Line for elbows & tees; Radial-Line for concentric cones; Triangulation for offset square-to-round transitions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
