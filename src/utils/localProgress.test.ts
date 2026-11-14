import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readLocalProgress, resetLocalProgress, saveLocalProgress } from './localProgress';

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
