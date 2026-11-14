import React, { useMemo, useState } from 'react';
import { Bookmark, BookOpen, Flame, Search, X } from 'lucide-react';
import { GLOSSARY_BY_ID, GLOSSARY_CATEGORIES, GLOSSARY_ENTRIES } from '../data/glossaryData';
import { GlossaryCategory, GlossaryRegister } from '../types/academy';
import { getGlossaryAutocomplete, searchGlossary } from '../utils/glossarySearch';

interface GlossaryViewProps {
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
  onOpenDrawerEntry: (id: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenSimulatorPreset: (exerciseId: string) => void;
}

const ALPHABET = ['All', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export const GlossaryView: React.FC<GlossaryViewProps> = ({
  bookmarkedIds,
  onToggleBookmark,
  onOpenDrawerEntry,
  onOpenLesson,
  onOpenSimulatorPreset,
}) => {
  const [query, setQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [category, setCategory] = useState<GlossaryCategory | 'All'>('All');
  const [letter, setLetter] = useState<string>('All');
  const [register, setRegister] = useState<GlossaryRegister | 'All'>('All');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [definitionMode, setDefinitionMode] = useState<'beginner' | 'advanced'>('beginner');

  const autocompleteItems = useMemo(() => getGlossaryAutocomplete(query, 6), [query]);

  const filtered = useMemo(
    () =>
      searchGlossary(GLOSSARY_ENTRIES, {
        query,
        category,
        letter,
        register,
        bookmarkedOnly,
        bookmarkedIds,
      }),
    [query, category, letter, register, bookmarkedOnly, bookmarkedIds]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-[#2A394A]">
        <div>
          <p className="text-xs font-mono text-amber-400">
            ONTARIO 428A · CANADIAN BOILERMAKER & WELDING REFERENCE · {GLOSSARY_ENTRIES.length} ENTRIES
          </p>
          <h1 className="text-3xl font-bold text-white mt-1">Technical Trade Glossary</h1>
          <p className="text-sm text-slate-400 mt-1">
            Distinguishes formal CSA/ASME terminology from jobsite shop slang, with beginner & advanced explanations.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#111B27] p-1 rounded border border-[#2A394A]">
          <button
            type="button"
            onClick={() => setDefinitionMode('beginner')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              definitionMode === 'beginner'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Beginner Plain-English
          </button>
          <button
            type="button"
            onClick={() => setDefinitionMode('advanced')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              definitionMode === 'advanced'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Advanced Code & Theory
          </button>
        </div>
      </div>

      {/* Instant Search + Register + Bookmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        <div className="lg:col-span-6 relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onFocus={() => setShowAutocomplete(true)}
              onBlur={() => window.setTimeout(() => setShowAutocomplete(false), 180)}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowAutocomplete(true);
              }}
              placeholder="Search term, acronym (E7018, DCEP, WLL, PWHT), or keyword..."
              className="w-full bg-[#111B27] border border-[#2A394A] focus:border-amber-500 rounded-md pl-10 pr-9 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {showAutocomplete && autocompleteItems.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[#0D1622] border border-[#2A394A] rounded-md shadow-xl overflow-hidden">
              {autocompleteItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={() => {
                    setQuery(item.term);
                    setShowAutocomplete(false);
                    onOpenDrawerEntry(item.id);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#182433] border-b last:border-b-0 border-[#1E293B] flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="text-sm font-semibold text-amber-300">{item.term}</span>
                    <span className="text-xs text-slate-400 ml-2">{item.fullMeaning}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 shrink-0">{item.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 flex flex-wrap items-center gap-2">
          {(['All', 'Formal Technical', 'Shop Slang'] as const).map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => setRegister(reg)}
              className={`px-3 py-2 rounded-md border text-xs font-medium transition-colors whitespace-nowrap ${
                register === reg
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold'
                  : 'bg-[#111B27] border-[#2A394A] text-slate-300 hover:bg-[#182433]'
              }`}
            >
              {reg === 'All' ? 'All Registers' : reg}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setBookmarkedOnly((v) => !v)}
            className={`px-3 py-2 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              bookmarkedOnly
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                : 'bg-[#111B27] border-[#2A394A] text-slate-300 hover:bg-[#182433]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Bookmarked ({bookmarkedIds.length})
          </button>
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCategory('All')}
          className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
            category === 'All'
              ? 'bg-[#182433] border-amber-400 text-amber-300'
              : 'bg-[#111B27] border-[#2A394A] text-slate-400 hover:text-white'
          }`}
        >
          All Categories ({GLOSSARY_ENTRIES.length})
        </button>
        {GLOSSARY_CATEGORIES.map((cat) => {
          const count = GLOSSARY_ENTRIES.filter((e) => e.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                category === cat
                  ? 'bg-[#182433] border-amber-400 text-amber-300'
                  : 'bg-[#111B27] border-[#2A394A] text-slate-400 hover:text-white'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* A-Z Browse Bar */}
      <div className="bg-[#111B27] border border-[#2A394A] rounded-md p-2 flex flex-wrap gap-1">
        {ALPHABET.map((ch) => (
          <button
            key={ch}
            type="button"
            onClick={() => setLetter(ch)}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
              letter === ch
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:bg-[#182433] hover:text-white'
            }`}
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <span>Showing {filtered.length} matching entries</span>
        {(query || category !== 'All' || letter !== 'All' || register !== 'All' || bookmarkedOnly) && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('All');
              setLetter('All');
              setRegister('All');
              setBookmarkedOnly(false);
            }}
            className="text-amber-400 hover:underline"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Glossary Cards */}
      {filtered.length === 0 ? (
        <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-8 text-center text-sm text-slate-400">
          No glossary entries match your current filter. Try clearing the letter or category filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((entry) => {
            const isBookmarked = bookmarkedIds.includes(entry.id);
            return (
              <article
                key={entry.id}
                className="bg-[#111B27] border border-[#2A394A] hover:border-amber-500/50 rounded-lg p-5 flex flex-col justify-between gap-4 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono text-amber-400">
                        {entry.category} · {entry.register}
                      </p>
                      <h2 className="text-xl font-bold text-white mt-0.5">
                        <button
                          type="button"
                          onClick={() => onOpenDrawerEntry(entry.id)}
                          className="text-left hover:text-amber-300 transition-colors"
                        >
                          {entry.term}
                        </button>
                      </h2>
                      <p className="text-xs text-slate-400">{entry.fullMeaning}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(entry.id)}
                      className={`p-1.5 rounded border transition-colors shrink-0 ${
                        isBookmarked
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-[#2A394A] text-slate-400 hover:text-white'
                      }`}
                      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark entry'}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed">
                    {definitionMode === 'beginner' ? entry.beginnerDefinition : entry.advancedDefinition}
                  </p>

                  {entry.canadianNote && (
                    <p className="text-xs text-sky-300 bg-[#0A111A] px-3 py-2 rounded border border-sky-800/50">
                      Canadian Note: {entry.canadianNote}
                    </p>
                  )}

                  <p className="text-xs text-slate-400">
                    <span className="font-mono text-slate-300">Jobsite: </span>
                    {entry.jobsiteExample}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-[#1E293B]">
                  {entry.relatedTermIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-mono text-slate-500 mr-1">Related:</span>
                      {entry.relatedTermIds.map((relId) => {
                        const rel = GLOSSARY_BY_ID[relId];
                        if (!rel) return null;
                        return (
                          <button
                            key={relId}
                            type="button"
                            onClick={() => onOpenDrawerEntry(rel.id)}
                            className="px-2 py-0.5 rounded bg-[#0A111A] border border-[#2A394A] hover:border-amber-400 text-slate-300"
                          >
                            {rel.term}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      {entry.lessonId ? (
                        <button
                          type="button"
                          onClick={() => onOpenLesson(entry.lessonId!)}
                          className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Learn This Topic
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded bg-[#0A111A] border border-[#2A394A] text-xs text-slate-500">
                          Lesson coming soon
                        </span>
                      )}

                      {entry.simulatorPresetId && (
                        <button
                          type="button"
                          onClick={() => onOpenSimulatorPreset(entry.simulatorPresetId!)}
                          className="px-3 py-1.5 rounded bg-[#182433] border border-amber-500/50 hover:bg-amber-500/15 text-amber-300 font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          3D Sim
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenDrawerEntry(entry.id)}
                      className="text-xs font-medium text-sky-400 hover:underline whitespace-nowrap"
                    >
                      Full Card →
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
