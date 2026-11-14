import { describe, expect, it } from 'vitest';
import { scheduleReview } from '../components/ProvinceFlashcards';

describe('flashcard review scheduling', () => {
  const now = Date.UTC(2026, 0, 1);
  it('reschedules missed cards soon', () => {
    const next = scheduleReview(undefined, 'again', now);
    expect(next.repetitions).toBe(0);
    expect(next.due).toBe(now + 60_000);
  });
  it('increases intervals after successful recall', () => {
    const first = scheduleReview(undefined, 'good', now);
    const second = scheduleReview(first, 'good', now);
    expect(first.intervalDays).toBe(1);
    expect(second.intervalDays).toBe(3);
  });
  it('does not turn a hard response into a long interval', () => {
    const next = scheduleReview({ due: now, intervalDays: 5, repetitions: 2 }, 'hard', now);
    expect(next.intervalDays).toBe(6);
  });
});
