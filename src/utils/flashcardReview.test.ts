import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scheduleReview } from '../components/ProvinceFlashcards';

const now = Date.UTC(2026, 0, 1);
test('missed cards are rescheduled soon', () => {
  const next = scheduleReview(undefined, 'again', now);
  assert.equal(next.repetitions, 0);
  assert.equal(next.due, now + 60_000);
});
test('successful recall increases intervals', () => {
  const first = scheduleReview(undefined, 'good', now);
  const second = scheduleReview(first, 'good', now);
  assert.equal(first.intervalDays, 1);
  assert.equal(second.intervalDays, 3);
});
test('hard response uses shorter interval', () => {
  const next = scheduleReview({ due: now, intervalDays: 5, repetitions: 2 }, 'hard', now);
  assert.equal(next.intervalDays, 6);
});
