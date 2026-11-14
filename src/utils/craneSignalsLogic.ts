import {
  CraneSignalCard,
  CraneSignalId,
  SignalFlashcardProgress,
} from '../types/academy';
import { CRANE_SIGNAL_CARDS } from '../data/craneSignals.ts';

export function filterCraneSignals(
  cards: CraneSignalCard[],
  difficultyFilter: 'All' | 'Beginner' | 'Advanced',
  applicabilityFilter: 'All' | 'Overhead & Gantry' | 'Mobile Crane',
  reviewMissedOnly: boolean,
  progress: SignalFlashcardProgress
): CraneSignalCard[] {
  return cards.filter((card) => {
    const normalizedDiff =
      card.difficulty === 'Beginner' ? 'Beginner' : 'Advanced';
    if (difficultyFilter !== 'All' && normalizedDiff !== difficultyFilter) {
      return false;
    }
    if (
      applicabilityFilter !== 'All' &&
      card.applicability !== 'Both Overhead & Mobile' &&
      card.applicability !== applicabilityFilter
    ) {
      return false;
    }
    if (reviewMissedOnly && !progress.practiceIds.includes(card.id)) {
      return false;
    }
    return true;
  });
}

export function shuffleSignalIds(ids: CraneSignalId[], seedOffset = 0): CraneSignalId[] {
  const copy = [...ids];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(((Math.sin(i + 1 + seedOffset) + 1) * 0.5) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function applySignalSrsReview(
  progress: SignalFlashcardProgress,
  signalId: CraneSignalId,
  outcome: 'know' | 'practice',
  now: Date = new Date()
): SignalFlashcardProgress {
  const knownSet = new Set(progress.knownIds);
  const practiceSet = new Set(progress.practiceIds);
  const nextDue = new Date(now);

  if (outcome === 'know') {
    knownSet.add(signalId);
    practiceSet.delete(signalId);
    nextDue.setDate(nextDue.getDate() + 3); // 3-day spaced interval
  } else {
    practiceSet.add(signalId);
    knownSet.delete(signalId);
    nextDue.setMinutes(nextDue.getMinutes() + 10); // short review interval
  }

  return {
    ...progress,
    knownIds: Array.from(knownSet),
    practiceIds: Array.from(practiceSet),
    srsNextDue: {
      ...progress.srsNextDue,
      [signalId]: nextDue.toISOString(),
    },
  };
}

export function toggleSignalBookmark(
  progress: SignalFlashcardProgress,
  signalId: CraneSignalId
): SignalFlashcardProgress {
  const exists = progress.bookmarkedIds.includes(signalId);
  return {
    ...progress,
    bookmarkedIds: exists
      ? progress.bookmarkedIds.filter((id) => id !== signalId)
      : [...progress.bookmarkedIds, signalId],
  };
}

export function scoreSignalIdentification(
  progress: SignalFlashcardProgress,
  targetSignalId: CraneSignalId,
  chosenSignalId: CraneSignalId
): { isCorrect: boolean; updatedProgress: SignalFlashcardProgress } {
  const isCorrect = targetSignalId === chosenSignalId;
  const srsUpdated = applySignalSrsReview(
    progress,
    targetSignalId,
    isCorrect ? 'know' : 'practice'
  );
  return {
    isCorrect,
    updatedProgress: {
      ...srsUpdated,
      quizAttempts: progress.quizAttempts + 1,
      quizCorrect: progress.quizCorrect + (isCorrect ? 1 : 0),
    },
  };
}

export function buildQuizOptionsForSignal(
  targetId: CraneSignalId,
  pool: CraneSignalCard[] = CRANE_SIGNAL_CARDS
): CraneSignalCard[] {
  const target = pool.find((c) => c.id === targetId) ?? pool[0];
  const distractors: CraneSignalCard[] = [];

  for (const simId of target.similarSignalIds) {
    const found = pool.find((c) => c.id === simId);
    if (found && found.id !== target.id && distractors.length < 3) {
      distractors.push(found);
    }
  }
  for (const card of pool) {
    if (
      card.id !== target.id &&
      !distractors.some((d) => d.id === card.id) &&
      distractors.length < 3
    ) {
      distractors.push(card);
    }
  }

  const combined = [target, ...distractors];
  // Deterministic ordering by id char sum so UI doesn't jump uncontrollably across renders
  return combined.sort((a, b) => a.name.localeCompare(b.name));
}

export function speakSignalInstruction(script: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(script);
    utter.rate = 0.96;
    utter.pitch = 1.0;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}
