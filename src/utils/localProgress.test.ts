import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLocalStudyDateKey, isStudyActivityRecent, parseProgressBackup, readLocalProgress, resetLocalProgress, saveLocalProgress } from './localProgress';

const records = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => { records.set(key, value); },
    removeItem: (key: string) => { records.delete(key); },
  },
});

test('new students start with generic progress and no personal profile', () => {
  records.clear();
  const fresh = readLocalProgress();
  assert.equal(fresh.profile.name, 'Boilermaker Student');
  assert.equal(fresh.profile.age, 0);
  assert.equal(fresh.studyNotes.length, 0);
});

test('device progress saves and resets without shared server state', () => {
  records.clear();
  const fresh = readLocalProgress();
  saveLocalProgress({ ...fresh, completedLessonIds: ['lesson-example'] });
  assert.deepEqual(readLocalProgress().completedLessonIds, ['lesson-example']);
  assert.deepEqual(resetLocalProgress().completedLessonIds, []);
});

test('invalid local data falls back to a safe initial record', () => {
  records.clear();
  records.set('boilermaker-academy-progress-device-v1', '{invalid');
  assert.equal(readLocalProgress().profile.name, 'Boilermaker Student');
});

test('accepts a valid portable backup', () => {
  const original = readLocalProgress();
  const imported = parseProgressBackup(JSON.stringify(original));
  assert.equal(imported.profile.name, original.profile.name);
});

test('rejects invalid or incomplete backups', () => {
  assert.throws(() => parseProgressBackup('[]'));
  assert.throws(() => parseProgressBackup('{"profile":{}}'));
  assert.throws(() => parseProgressBackup('{invalid'));
});

test('rejects malformed profile, study durations and note records', () => {
  const fresh = readLocalProgress();
  assert.throws(() => parseProgressBackup(JSON.stringify({ ...fresh, profile: { ...fresh.profile, age: -1 } })));
  assert.throws(() => parseProgressBackup(JSON.stringify({ ...fresh, dailyStudySeconds: { today: '100' } })));
  assert.throws(() => parseProgressBackup(JSON.stringify({ ...fresh, studyNotes: [null] })));
});

test('local study calendar date is formatted without UTC conversion', () => {
  const date = new Date(2026, 10, 14, 23, 59);
  assert.equal(getLocalStudyDateKey(date), '2026-11-14');
});

test('study time pauses after five minutes without interaction', () => {
  assert.equal(isStudyActivityRecent(1000, 1000 + 30_000), true);
  assert.equal(isStudyActivityRecent(1000, 1000 + 5 * 60_000), true);
  assert.equal(isStudyActivityRecent(1000, 1000 + 5 * 60_000 + 1), false);
  assert.equal(isStudyActivityRecent(1000, 999), false);
});

test('rejects invalid nested scores and signal progress rather than importing broken state', () => {
  const fresh = readLocalProgress();
  assert.throws(() => parseProgressBackup(JSON.stringify({ ...fresh, lessonAssessmentScores: { test: 'excellent' } })));
  assert.throws(() => parseProgressBackup(JSON.stringify({ ...fresh, signalProgress: { ...fresh.signalProgress, knownIds: null } })));
  assert.throws(() => parseProgressBackup(JSON.stringify({ ...fresh, practiceTargetPct: 150 })));
  assert.throws(() => parseProgressBackup(JSON.stringify({ ...fresh, profile: { ...fresh.profile, weldingTickets: 'SMAW' } })));
});
