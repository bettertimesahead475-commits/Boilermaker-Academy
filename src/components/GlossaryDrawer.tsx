import React, { useState } from 'react';
import { Bookmark, BookOpen, Compass, Flame, Layers, X } from 'lucide-react';
import { GLOSSARY_BY_ID } from '../data/glossaryData';
import { DiagramId, GlossaryEntry } from '../types/academy';
import { findGlossaryEntryByTerm } from '../utils/glossarySearch';
import { TechnicalDiagram } from './TechnicalDiagrams';

interface GlossaryDrawerProps {
  entryId: string | null;
  bookmarkedIds: string[];
  onClose: () => void;
  onSelectEntry: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenSimulatorPreset: (exerciseId: string) => void;
}

export const GlossaryDrawer: React.FC<GlossaryDrawerProps> = ({
  entryId,
  bookmarkedIds,
  onClose,
  onSelectEntry,
  onToggleBookmark,
  onOpenLesson,
  onOpenSimulatorPreset,
}) => {
  const [detailLevel, setDetailLevel] = useState<'beginner' | 'advanced'>('beginner');
  const [showDiagram, setShowDiagram] = useState(false);

  if (!entryId) return null;
  const entry: GlossaryEntry | undefined = GLOSSARY_BY_ID[entryId];
  if (!entry) return null;

  const isBookmarked = bookmarkedIds.includes(entry.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55" onClick={onClose}>
      <aside
        className="w-full max-w-lg h-full bg-[#0D1622] border-l border-[#2A394A] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Glossary definition for ${entry.term}`}
      >
        <div className="px-5 py-4 border-b border-[#2A394A] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-mono text-amber-400">
              {entry.category} · {entry.register}
            </p>
            <h2 className="text-2xl font-bold text-white mt-0.5">{entry.term}</h2>
            <p className="text-xs text-slate-300 mt-0.5">{entry.fullMeaning}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleBookmark(entry.id)}
              className={`p-2 rounded border text-xs transition-colors ${
                isBookmarked
                  ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                  : 'border-[#2A394A] text-slate-300 hover:bg-[#182433]'
              }`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark term'}
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded border border-[#2A394A] text-slate-300 hover:text-white hover:bg-[#182433]"
              aria-label="Close glossary drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Beginner / Advanced Level Toggle */}
          <div className="flex items-center justify-between gap-2 bg-[#0A111A] p-1 rounded border border-[#2A394A]">
            <button
              type="button"
              onClick={() => setDetailLevel('beginner')}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold transition-colors ${
                detailLevel === 'beginner'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Plain-Language Definition
            </button>
            <button
              type="button"
              onClick={() => setDetailLevel('advanced')}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold transition-colors ${
                detailLevel === 'advanced'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Advanced Code & Theory
            </button>
          </div>

          <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-3">
            <p className="text-sm text-slate-100 leading-relaxed">
              {detailLevel === 'beginner' ? entry.beginnerDefinition : entry.advancedDefinition}
            </p>
            {entry.canadianNote && (
              <div className="p-3 rounded bg-[#0A111A] border border-sky-700/50 text-xs text-sky-200">
                <span className="font-mono text-sky-400 block mb-0.5">CANADIAN / ONTARIO 428A NOTE</span>
                {entry.canadianNote}
              </div>
            )}
          </div>

          <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-1.5">
            <p className="text-xs font-mono text-amber-400">JOBSITE / SHOP EXAMPLE</p>
            <p className="text-sm text-slate-200 leading-relaxed">{entry.jobsiteExample}</p>
          </div>

          {/* Learning & Simulator Actions */}
          <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-4 space-y-3">
            <p className="text-xs font-mono text-slate-400">ACADEMY INTEGRATION</p>
            <div className="flex flex-wrap gap-2">
              {entry.lessonId ? (
                <button
                  type="button"
                  onClick={() => {
                    onOpenLesson(entry.lessonId!);
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Learn This Topic
                </button>
              ) : (
                <span className="px-3.5 py-2 rounded bg-[#0A111A] border border-[#2A394A] text-xs text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Lesson coming soon
                </span>
              )}

              {entry.simulatorPresetId && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenSimulatorPreset(entry.simulatorPresetId!);
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded bg-[#182433] border border-amber-500/50 hover:bg-amber-500/15 text-amber-300 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Practice in 3D Simulator
                </button>
              )}

              {entry.diagramId && (
                <button
                  type="button"
                  onClick={() => setShowDiagram((s) => !s)}
                  className="px-3.5 py-2 rounded bg-[#182433] border border-[#2A394A] hover:border-sky-400 text-slate-200 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  {showDiagram ? 'Hide Diagram' : 'View Diagram'}
                </button>
              )}
            </div>

            {showDiagram && entry.diagramId && (
              <div className="pt-2">
                <TechnicalDiagram diagramId={entry.diagramId as DiagramId} />
              </div>
            )}
          </div>

          {/* Related Terminology Cross-Links */}
          {entry.relatedTermIds.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-mono text-slate-400">RELATED TERMINOLOGY</p>
              <div className="flex flex-wrap gap-2">
                {entry.relatedTermIds.map((relId) => {
                  const rel = GLOSSARY_BY_ID[relId];
                  if (!rel) return null;
                  return (
                    <button
                      key={relId}
                      type="button"
                      onClick={() => {
                        setShowDiagram(false);
                        onSelectEntry(rel.id);
                      }}
                      className="px-3 py-1.5 rounded bg-[#182433] border border-[#2A394A] hover:border-amber-400 text-xs text-slate-200 transition-colors"
                    >
                      {rel.term}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

interface GlossaryLinkProps {
  termIdOrName: string;
  label?: string;
  onOpenGlossary: (entryId: string) => void;
  className?: string;
}

export const GlossaryLink: React.FC<GlossaryLinkProps> = ({
  termIdOrName,
  label,
  onOpenGlossary,
  className = '',
}) => {
  const found = findGlossaryEntryByTerm(termIdOrName);
  if (!found) return <span className={className}>{label ?? termIdOrName}</span>;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpenGlossary(found.id);
      }}
      className={`underline decoration-amber-500/60 decoration-dotted underline-offset-4 hover:text-amber-300 transition-colors text-left ${className}`}
      title={`Open glossary: ${found.fullMeaning}`}
    >
      {label ?? found.term}
    </button>
  );
};
