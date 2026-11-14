import React, { useEffect, useMemo, useState } from 'react';
import { ALL_LESSONS } from '../data/examQuestions';
import type { TopicDomain } from '../types/academy';

type Province = 'ON' | 'AB' | 'NS';
type Rating = 'again' | 'hard' | 'good';
interface Review { due: number; intervalDays: number; repetitions: number }
interface Card { id: string; front: string; back: string; domain: TopicDomain; level: number }
const PROVINCES: Record<Province, { label: string; pathway: string; note: string }> = {
  ON: { label: 'Ontario', pathway: 'Construction Boilermaker (428A)', note: 'Ontario pathway. Confirm current apprenticeship requirements with Skilled Trades Ontario.' },
  AB: { label: 'Alberta', pathway: 'Boilermaker', note: 'Alberta pathway. Confirm period and examination requirements with Alberta Apprenticeship and Industry Training.' },
  NS: { label: 'Nova Scotia', pathway: 'Boilermaker', note: 'Nova Scotia pathway. Confirm apprenticeship and certification requirements with the Nova Scotia Apprenticeship Agency.' },
};
const STORAGE_KEY = 'boilermaker-academy-flashcard-reviews-v1';
const PROVINCE_KEY = 'boilermaker-academy-province-v1';
function readReviews(): Record<string, Review> {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch { return {}; }
}
function makeCards(): Card[] {
  return ALL_LESSONS.flatMap(lesson => lesson.technicalTerms.map((term, index) => ({
    id: lesson.id + ':term:' + index,
    front: term.term,
    back: term.definition,
    domain: lesson.domain,
    level: lesson.level,
  })));
}
export function scheduleReview(previous: Review | undefined, rating: Rating, now: number): Review {
  const reps = rating === 'again' ? 0 : (previous?.repetitions ?? 0) + 1;
  const intervalDays = rating === 'again' ? 0 : rating === 'hard'
    ? Math.max(1, Math.round((previous?.intervalDays || 1) * 1.2))
    : reps === 1 ? 1 : reps === 2 ? 3 : Math.max(4, Math.round((previous?.intervalDays || 3) * 2.1));
  return { repetitions: reps, intervalDays, due: now + (rating === 'again' ? 60_000 : intervalDays * 86_400_000) };
}
export const ProvinceFlashcards: React.FC = () => {
  const [province, setProvince] = useState<Province>(() => {
    const saved = localStorage.getItem(PROVINCE_KEY);
    return saved === 'AB' || saved === 'NS' ? saved : 'ON';
  });
  const [domain, setDomain] = useState<string>('All subjects');
  const [level, setLevel] = useState<string>('All levels');
  const [reviews, setReviews] = useState<Record<string, Review>>(readReviews);
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [dueOnly, setDueOnly] = useState(false);
  const cards = useMemo(makeCards, []);
  const subjects = useMemo(() => [...new Set(cards.map(card => card.domain))].sort(), [cards]);
  const visible = useMemo(() => cards.filter(card =>
    (domain === 'All subjects' || card.domain === domain) &&
    (level === 'All levels' || String(card.level) === level) &&
    (!dueOnly || !reviews[card.id] || reviews[card.id].due <= Date.now())
  ), [cards, domain, level, dueOnly, reviews]);
  const card = visible[position % Math.max(visible.length, 1)];
  useEffect(() => { localStorage.setItem(PROVINCE_KEY, province); }, [province]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { setPosition(0); setRevealed(false); }, [domain, level, dueOnly]);
  function rate(rating: Rating) {
    if (!card) return;
    setReviews(prev => ({ ...prev, [card.id]: scheduleReview(prev[card.id], rating, Date.now()) }));
    setRevealed(false);
    setPosition(prev => dueOnly ? prev : prev + 1);
  }
  return <section className="space-y-5" aria-label="Provincial flashcard study">
    <div className="rounded-xl border border-[#2A394A] bg-[#111B27] p-6 space-y-3">
      <p className="text-xs uppercase tracking-widest text-amber-400">National Red Seal foundation · Provincial pathways</p>
      <h1 className="text-3xl font-bold">Trade Flashcards</h1>
      <p className="text-slate-300">Review technical terminology from the Academy's existing Level 1–3 lessons. No AI API required.</p>
      <label className="block text-sm font-semibold" htmlFor="province-pathway">Training province</label>
      <select id="province-pathway" value={province} onChange={e => setProvince(e.target.value as Province)}
        className="w-full max-w-sm rounded-md bg-[#182433] border border-[#405167] p-3 text-white">
        {Object.entries(PROVINCES).map(([code, p]) => <option key={code} value={code}>{p.label} — {p.pathway}</option>)}
      </select>
      <p className="text-sm text-slate-300">{PROVINCES[province].note}</p>
      <p className="text-xs text-amber-300">Shared trade-theory content is not a substitute for province-specific regulatory instruction or an official certification exam.</p>
    </div>
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm">Subject <select aria-label="Filter subject" value={domain} onChange={e => setDomain(e.target.value)} className="block mt-1 rounded bg-[#182433] border border-[#405167] p-2">
        {['All subjects', ...subjects].map(d => <option key={d}>{d}</option>)}
      </select></label>
      <label className="text-sm">Level <select aria-label="Filter level" value={level} onChange={e => setLevel(e.target.value)} className="block mt-1 rounded bg-[#182433] border border-[#405167] p-2">
        {['All levels', '1', '2', '3'].map(l => <option key={l}>{l}</option>)}
      </select></label>
      <label className="flex items-center gap-2 text-sm pb-2"><input type="checkbox" checked={dueOnly} onChange={e => setDueOnly(e.target.checked)} /> Due / new cards only</label>
    </div>
    <div className="rounded-xl border border-[#405167] bg-[#111B27] p-6 min-h-[280px] flex flex-col justify-between gap-5">
      {card ? <>
        <div><p className="text-sm text-amber-400">{card.domain} · Level {card.level} · Card {(position % visible.length) + 1} of {visible.length}</p>
          <h2 className="text-2xl font-bold mt-5">{card.front}</h2>
          {revealed && <p className="text-lg text-slate-200 mt-6 whitespace-pre-wrap">{card.back}</p>}
        </div>
        {revealed ? <div className="flex flex-wrap gap-2">
          <button onClick={() => rate('again')} className="rounded bg-red-800 px-4 py-3">Again</button>
          <button onClick={() => rate('hard')} className="rounded bg-amber-700 px-4 py-3">Hard</button>
          <button onClick={() => rate('good')} className="rounded bg-emerald-700 px-4 py-3">Got it</button>
        </div> : <button onClick={() => setRevealed(true)} className="self-start rounded bg-amber-500 text-slate-950 font-bold px-5 py-3">Reveal answer</button>}
      </> : <p>No cards match these filters. Change the filters or turn off due-only mode.</p>}
    </div>
    <div className="flex justify-between items-center gap-3">
      <button disabled={!visible.length} onClick={() => { setPosition(p => (p + visible.length - 1) % visible.length); setRevealed(false); }} className="rounded border border-[#405167] px-4 py-2 disabled:opacity-40">Previous</button>
      <p className="text-xs text-slate-400">Review history is saved on this device only, not to a student account.</p>
      <button disabled={!visible.length} onClick={() => { setPosition(p => p + 1); setRevealed(false); }} className="rounded border border-[#405167] px-4 py-2 disabled:opacity-40">Next</button>
    </div>
  </section>;
};
