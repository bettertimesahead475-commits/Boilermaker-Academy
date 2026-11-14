import { GLOSSARY_BY_ID, GLOSSARY_ENTRIES } from '../data/glossaryData';
import { GlossaryCategory, GlossaryEntry, GlossaryRegister } from '../types/academy';

export interface GlossaryFilterOptions {
  query?: string;
  category?: GlossaryCategory | 'All';
  letter?: string | 'All';
  register?: GlossaryRegister | 'All';
  bookmarkedOnly?: boolean;
  bookmarkedIds?: string[];
}

export function searchGlossary(
  entries: GlossaryEntry[] = GLOSSARY_ENTRIES,
  options: GlossaryFilterOptions = {}
): GlossaryEntry[] {
  const q = (options.query ?? '').trim().toLowerCase();
  const category = options.category ?? 'All';
  const letter = options.letter ?? 'All';
  const register = options.register ?? 'All';
  const bookmarkedSet = new Set(options.bookmarkedIds ?? []);

  return entries
    .filter((entry) => {
      if (category !== 'All' && entry.category !== category) return false;
      if (register !== 'All' && entry.register !== register) return false;
      if (options.bookmarkedOnly && !bookmarkedSet.has(entry.id)) return false;
      if (letter !== 'All') {
        const firstChar = entry.term.replace(/^["'\s]+/, '').charAt(0).toUpperCase();
        if (letter === '#') {
          if (!/[0-9]/.test(firstChar)) return false;
        } else if (firstChar !== letter.toUpperCase()) {
          return false;
        }
      }
      if (!q) return true;

      const haystack = [
        entry.term,
        entry.acronym ?? '',
        entry.fullMeaning,
        entry.category,
        entry.beginnerDefinition,
        entry.advancedDefinition,
        entry.jobsiteExample,
        entry.canadianNote ?? '',
        ...(entry.keywords ?? []),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    })
    .sort((a, b) => {
      if (!q) return a.term.localeCompare(b.term);
      // Rank exact acronym/term prefix matches first
      const aTerm = a.term.toLowerCase();
      const bTerm = b.term.toLowerCase();
      const aStarts = aTerm.startsWith(q) || (a.acronym?.toLowerCase().startsWith(q) ?? false);
      const bStarts = bTerm.startsWith(q) || (b.acronym?.toLowerCase().startsWith(q) ?? false);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.term.localeCompare(b.term);
    });
}

export function getGlossaryAutocomplete(query: string, limit = 8): GlossaryEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return searchGlossary(GLOSSARY_ENTRIES, { query: trimmed }).slice(0, limit);
}

export function getGlossaryEntry(id: string): GlossaryEntry | undefined {
  return GLOSSARY_BY_ID[id];
}

export function findGlossaryEntryByTerm(termOrId: string): GlossaryEntry | undefined {
  if (GLOSSARY_BY_ID[termOrId]) return GLOSSARY_BY_ID[termOrId];
  const norm = termOrId.trim().toLowerCase();
  return GLOSSARY_ENTRIES.find(
    (e) =>
      e.term.toLowerCase() === norm ||
      e.acronym?.toLowerCase() === norm ||
      e.id.toLowerCase() === norm
  );
}
