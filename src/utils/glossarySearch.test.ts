import assert from 'node:assert/strict';
import test from 'node:test';
import { GLOSSARY_BY_ID, GLOSSARY_CATEGORIES, GLOSSARY_ENTRIES } from '../data/glossaryData.ts';
import { LEVEL_1_LESSONS } from '../data/lessonsLevel1.ts';
import { LEVEL_2_LESSONS } from '../data/lessonsLevel2.ts';
import { LEVEL_3_LESSONS } from '../data/lessonsLevel3.ts';
import { findGlossaryEntryByTerm, getGlossaryAutocomplete, searchGlossary } from './glossarySearch.ts';

const VALID_LESSON_IDS = new Set(
  [...LEVEL_1_LESSONS, ...LEVEL_2_LESSONS, ...LEVEL_3_LESSONS].map((l) => l.id)
);

test('Technical glossary has >= 150 unique entries across all 8 categories', () => {
  assert.ok(GLOSSARY_ENTRIES.length >= 150, `Expected >= 150 entries, got ${GLOSSARY_ENTRIES.length}`);
  const ids = new Set(GLOSSARY_ENTRIES.map((e) => e.id));
  assert.equal(ids.size, GLOSSARY_ENTRIES.length, 'Glossary IDs must be unique');
  for (const cat of GLOSSARY_CATEGORIES) {
    const count = GLOSSARY_ENTRIES.filter((e) => e.category === cat).length;
    assert.ok(count >= 10, `Category ${cat} should have solid coverage, found ${count}`);
  }
});

test('All glossary lessonId and relatedTermIds links resolve cleanly with zero broken links', () => {
  for (const entry of GLOSSARY_ENTRIES) {
    if (entry.lessonId !== null) {
      assert.ok(
        VALID_LESSON_IDS.has(entry.lessonId),
        `Broken lessonId "${entry.lessonId}" in glossary entry "${entry.id}"`
      );
    }
    for (const relId of entry.relatedTermIds) {
      assert.ok(
        Boolean(GLOSSARY_BY_ID[relId]),
        `Broken relatedTermId "${relId}" in glossary entry "${entry.id}"`
      );
    }
  }
});

test('Glossary search, A-Z filter, register distinction, and autocomplete work accurately', () => {
  const e7018Results = searchGlossary(GLOSSARY_ENTRIES, { query: 'E7018' });
  assert.ok(e7018Results.length >= 1);
  assert.equal(e7018Results[0].id, 'e7018');

  const slangResults = searchGlossary(GLOSSARY_ENTRIES, { register: 'Shop Slang' });
  assert.ok(slangResults.length >= 15);
  assert.ok(slangResults.every((e) => e.register === 'Shop Slang'));

  const numericResults = searchGlossary(GLOSSARY_ENTRIES, { letter: '#' });
  assert.ok(numericResults.some((e) => e.id === '1g'));

  const auto = getGlossaryAutocomplete('smaw');
  assert.ok(auto.length >= 1 && auto[0].id === 'smaw');

  assert.equal(findGlossaryEntryByTerm('DCEP')?.id, 'dcep');
});
