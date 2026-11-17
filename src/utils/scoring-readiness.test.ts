import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateStudyReadiness } from './scoring';

const baseline = { completedLessonIds: [] as string[], totalLessons: 4, diagnosticResult: null, assessmentHistory: [] };

test('readiness is not inferred from completed lessons without an assessment', () => {
  const result = calculateStudyReadiness({ ...baseline, completedLessonIds: ['a', 'b'] });
  assert.equal(result.overallCoveragePct, 50);
  assert.equal(result.estimatedReadinessPct, 0);
});

test('duplicate lesson IDs do not inflate completion percentage', () => {
  const result = calculateStudyReadiness({ ...baseline, completedLessonIds: ['a', 'a', 'b', 'b', 'c', 'd', 'd'] });
  assert.equal(result.overallCoveragePct, 100);
  assert.equal(result.estimatedReadinessPct, 0);
});

test('empty curriculum never reports completed coverage', () => {
  const result = calculateStudyReadiness({ ...baseline, totalLessons: 0, completedLessonIds: ['a'] });
  assert.equal(result.overallCoveragePct, 0);
});
