import assert from 'node:assert/strict';
import test from 'node:test';
import { Question } from '../types/academy';
import { calculateStudyReadiness, classifyPerformance, generateSevenDayPlan, scoreAssessment } from './scoring.ts';

test('classifyPerformance thresholds match Strong / Competent / Needs review / Requires instruction', () => {
  assert.equal(classifyPerformance(90), 'Strong');
  assert.equal(classifyPerformance(85), 'Strong');
  assert.equal(classifyPerformance(78), 'Competent');
  assert.equal(classifyPerformance(70), 'Competent');
  assert.equal(classifyPerformance(55), 'Needs review');
  assert.equal(classifyPerformance(49), 'Requires instruction');
});

test('scoreAssessment separates practical vs theoretical and flags weak domains', () => {
  const qs: Question[] = [
    {
      id: 'q1',
      level: 1,
      domain: 'Mathematics',
      knowledgeType: 'Theoretical',
      prompt: 'Math Q1',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
      explanation: 'Exp',
    },
    {
      id: 'q2',
      level: 1,
      domain: 'Mathematics',
      knowledgeType: 'Theoretical',
      prompt: 'Math Q2',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 1,
      explanation: 'Exp',
    },
    {
      id: 'q3',
      level: 1,
      domain: 'Welding',
      knowledgeType: 'Practical',
      prompt: 'Weld Q1',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 2,
      explanation: 'Exp',
    },
  ];

  const result = scoreAssessment({
    id: 'test-1',
    title: 'Sample',
    mode: 'diagnostic',
    timed: false,
    durationSeconds: 120,
    questions: qs,
    selectedAnswers: { q1: 1, q2: 0, q3: 2 }, // 0/2 math, 1/1 welding
    targetPct: 80,
  });

  assert.equal(result.totalCorrect, 1);
  assert.equal(result.percentage, 33);
  assert.equal(result.practicalPercentage, 100);
  assert.equal(result.theoreticalPercentage, 0);
  assert.deepEqual(result.weakDomains, ['Mathematics']);
});

test('generateSevenDayPlan creates 7 prioritized days and readiness tracks completion', () => {
  const plan = generateSevenDayPlan(
    [
      {
        domain: 'Mathematics',
        correct: 2,
        total: 8,
        percentage: 25,
        classification: 'Requires instruction',
        practicalCorrect: 1,
        practicalTotal: 2,
        theoreticalCorrect: 1,
        theoreticalTotal: 6,
      },
      {
        domain: 'Welding',
        correct: 7,
        total: 7,
        percentage: 100,
        classification: 'Strong',
        practicalCorrect: 5,
        practicalTotal: 5,
        theoreticalCorrect: 2,
        theoreticalTotal: 2,
      },
    ],
    {
      Mathematics: 'l1-math-fractions',
      Rigging: 'l1-rigging-basics',
      'Blueprint Reading': 'l1-blueprints',
      Welding: 'l1-welding-smaw',
      Metallurgy: 'l1-steel-id',
      Fabrication: 'l1-fab-layout',
      'Industrial Equipment': 'l1-boilers-intro',
      Safety: 'l1-safety-whmis',
    }
  );
  assert.equal(plan.length, 7);
  assert.equal(plan[0].focusDomain, 'Mathematics');

  const readiness = calculateStudyReadiness({
    completedLessonIds: ['l1-math-fractions', 'l1-rigging-basics'],
    totalLessons: 10,
    diagnosticResult: null,
    assessmentHistory: [],
  });
  assert.equal(readiness.overallCoveragePct, 20);
});
