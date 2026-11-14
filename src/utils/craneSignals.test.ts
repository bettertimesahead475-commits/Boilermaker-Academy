import assert from 'node:assert/strict';
import test from 'node:test';
import { CRANE_SIGNAL_CARDS } from '../data/craneSignals.ts';
import { RIGGING_SCENARIOS } from '../data/riggingScenarios.ts';
import { SignalFlashcardProgress } from '../types/academy';
import {
  applySignalSrsReview,
  buildQuizOptionsForSignal,
  filterCraneSignals,
  scoreSignalIdentification,
  shuffleSignalIds,
  toggleSignalBookmark,
} from './craneSignalsLogic.ts';

function emptyProgress(): SignalFlashcardProgress {
  return {
    knownIds: [],
    practiceIds: [],
    bookmarkedIds: [],
    srsNextDue: {},
    quizAttempts: 0,
    quizCorrect: 0,
  };
}

test('crane signals dataset contains >= 11 verified ASME/OHSA signals and >= 10 rigging scenarios', () => {
  assert.ok(CRANE_SIGNAL_CARDS.length >= 11);
  assert.ok(RIGGING_SCENARIOS.length >= 10);
  const emergency = CRANE_SIGNAL_CARDS.find((c) => c.id === 'emergency-stop');
  assert.ok(emergency);
  assert.equal(emergency.mappedSimulatorCommand, 'emergency-stop');
});

test('SRS flashcard actions update knownIds, practiceIds, srsNextDue, and bookmarks', () => {
  let prog = emptyProgress();
  prog = applySignalSrsReview(prog, 'hoist', 'know', new Date('2026-05-01T12:00:00Z'));
  assert.deepEqual(prog.knownIds, ['hoist']);
  assert.deepEqual(prog.practiceIds, []);
  assert.ok(prog.srsNextDue['hoist'].startsWith('2026-05-04'));

  prog = applySignalSrsReview(prog, 'hoist', 'practice', new Date('2026-05-01T12:00:00Z'));
  assert.deepEqual(prog.knownIds, []);
  assert.deepEqual(prog.practiceIds, ['hoist']);

  prog = toggleSignalBookmark(prog, 'emergency-stop');
  assert.deepEqual(prog.bookmarkedIds, ['emergency-stop']);
  prog = toggleSignalBookmark(prog, 'emergency-stop');
  assert.deepEqual(prog.bookmarkedIds, []);
});

test('filtering, missed queue, shuffling, and blind quiz identification scoring work deterministically', () => {
  let prog = emptyProgress();
  prog = applySignalSrsReview(prog, 'stop', 'practice');

  const mobileOnly = filterCraneSignals(CRANE_SIGNAL_CARDS, 'All', 'Mobile Crane', false, prog);
  assert.ok(mobileOnly.some((c) => c.id === 'boom-up'));
  assert.ok(!mobileOnly.some((c) => c.id === 'trolley-travel'));

  const missedOnly = filterCraneSignals(CRANE_SIGNAL_CARDS, 'All', 'All', true, prog);
  assert.equal(missedOnly.length, 1);
  assert.equal(missedOnly[0].id, 'stop');

  const shuffled = shuffleSignalIds(CRANE_SIGNAL_CARDS.map((c) => c.id), 7);
  assert.equal(shuffled.length, CRANE_SIGNAL_CARDS.length);

  const options = buildQuizOptionsForSignal('stop', CRANE_SIGNAL_CARDS);
  assert.equal(options.length, 4);
  assert.ok(options.some((o) => o.id === 'stop'));
  assert.ok(options.some((o) => o.id === 'emergency-stop'));

  const wrongAttempt = scoreSignalIdentification(prog, 'stop', 'emergency-stop');
  assert.equal(wrongAttempt.isCorrect, false);
  assert.equal(wrongAttempt.updatedProgress.quizAttempts, 1);
  assert.equal(wrongAttempt.updatedProgress.quizCorrect, 0);

  const rightAttempt = scoreSignalIdentification(wrongAttempt.updatedProgress, 'stop', 'stop');
  assert.equal(rightAttempt.isCorrect, true);
  assert.equal(rightAttempt.updatedProgress.quizAttempts, 2);
  assert.equal(rightAttempt.updatedProgress.quizCorrect, 1);
  assert.ok(rightAttempt.updatedProgress.knownIds.includes('stop'));
});
