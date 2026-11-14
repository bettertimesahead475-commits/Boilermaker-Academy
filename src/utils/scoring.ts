import {
  AssessmentResult,
  DomainClassification,
  DomainPerformance,
  Question,
  StudyDayPlan,
  TopicDomain,
} from '../types/academy';

export const ALL_DOMAINS: TopicDomain[] = [
  'Mathematics',
  'Rigging',
  'Blueprint Reading',
  'Welding',
  'Metallurgy',
  'Fabrication',
  'Industrial Equipment',
  'Safety',
];

export function classifyPerformance(percentage: number): DomainClassification {
  if (percentage >= 85) return 'Strong';
  if (percentage >= 70) return 'Competent';
  if (percentage >= 50) return 'Needs review';
  return 'Requires instruction';
}

export function scoreAssessment(params: {
  id: string;
  title: string;
  mode: AssessmentResult['mode'];
  timed: boolean;
  durationSeconds: number;
  questions: Question[];
  selectedAnswers: Record<string, number>;
  targetPct: number;
}): AssessmentResult {
  const { id, title, mode, timed, durationSeconds, questions, selectedAnswers, targetPct } = params;

  const domainMap = new Map<
    TopicDomain,
    {
      correct: number;
      total: number;
      practicalCorrect: number;
      practicalTotal: number;
      theoreticalCorrect: number;
      theoreticalTotal: number;
    }
  >();

  let totalCorrect = 0;
  let practicalCorrect = 0;
  let practicalTotal = 0;
  let theoreticalCorrect = 0;
  let theoreticalTotal = 0;

  const answers = questions.map((q) => {
    const selectedIndex = selectedAnswers[q.id] ?? -1;
    const isCorrect = selectedIndex === q.correctIndex;
    if (isCorrect) totalCorrect++;

    if (q.knowledgeType === 'Practical') {
      practicalTotal++;
      if (isCorrect) practicalCorrect++;
    } else {
      theoreticalTotal++;
      if (isCorrect) theoreticalCorrect++;
    }

    const entry = domainMap.get(q.domain) ?? {
      correct: 0,
      total: 0,
      practicalCorrect: 0,
      practicalTotal: 0,
      theoreticalCorrect: 0,
      theoreticalTotal: 0,
    };

    entry.total++;
    if (isCorrect) entry.correct++;
    if (q.knowledgeType === 'Practical') {
      entry.practicalTotal++;
      if (isCorrect) entry.practicalCorrect++;
    } else {
      entry.theoreticalTotal++;
      if (isCorrect) entry.theoreticalCorrect++;
    }
    domainMap.set(q.domain, entry);

    return { questionId: q.id, selectedIndex, isCorrect };
  });

  const domainBreakdown: DomainPerformance[] = [];
  for (const domain of ALL_DOMAINS) {
    const entry = domainMap.get(domain);
    if (!entry || entry.total === 0) continue;
    const percentage = Math.round((entry.correct / entry.total) * 100);
    domainBreakdown.push({
      domain,
      correct: entry.correct,
      total: entry.total,
      percentage,
      classification: classifyPerformance(percentage),
      practicalCorrect: entry.practicalCorrect,
      practicalTotal: entry.practicalTotal,
      theoreticalCorrect: entry.theoreticalCorrect,
      theoreticalTotal: entry.theoreticalTotal,
    });
  }

  const weakDomains = domainBreakdown
    .filter((d) => d.classification === 'Requires instruction' || d.classification === 'Needs review')
    .sort((a, b) => a.percentage - b.percentage)
    .map((d) => d.domain);

  const percentage = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;

  return {
    id,
    title,
    mode,
    timed,
    durationSeconds,
    completedAt: new Date().toISOString(),
    totalCorrect,
    totalQuestions: questions.length,
    percentage,
    targetPct,
    domainBreakdown,
    practicalPercentage: practicalTotal > 0 ? Math.round((practicalCorrect / practicalTotal) * 100) : 0,
    theoreticalPercentage: theoreticalTotal > 0 ? Math.round((theoreticalCorrect / theoreticalTotal) * 100) : 0,
    weakDomains,
    answers,
  };
}

export function generateSevenDayPlan(
  domainBreakdown: DomainPerformance[],
  lessonByDomain: Record<TopicDomain, string>
): StudyDayPlan[] {
  const days = ['Day 1 (Mon)', 'Day 2 (Tue)', 'Day 3 (Wed)', 'Day 4 (Thu)', 'Day 5 (Fri)', 'Day 6 (Sat)', 'Day 7 (Sun)'];
  const sorted = [...domainBreakdown].sort((a, b) => a.percentage - b.percentage);

  const fallbackOrder: TopicDomain[] = [
    'Mathematics',
    'Rigging',
    'Blueprint Reading',
    'Industrial Equipment',
    'Metallurgy',
    'Fabrication',
    'Welding',
  ];

  const prioritizedDomains: TopicDomain[] =
    sorted.length > 0 ? sorted.map((d) => d.domain) : fallbackOrder;

  return days.map((day, idx) => {
    const domain = prioritizedDomains[idx % prioritizedDomains.length];
    const perf = sorted.find((s) => s.domain === domain);
    const statusNote = perf
      ? `${perf.classification} (${perf.percentage}% diagnostic)`
      : 'Scheduled baseline review';

    return {
      day,
      focusDomain: domain,
      recommendedLessonId: lessonByDomain[domain] ?? 'l1-math-fractions',
      taskDescription:
        idx === 6
          ? `25-question mixed review test & formula sheet consolidation (${domain})`
          : `Complete ${domain} module + worked math/theory problems — ${statusNote}`,
      targetMinutes: idx >= 5 ? 60 : 45,
      completed: false,
    };
  });
}

export function calculateStudyReadiness(params: {
  completedLessonIds: string[];
  totalLessons: number;
  diagnosticResult: AssessmentResult | null;
  assessmentHistory: AssessmentResult[];
}): {
  overallCoveragePct: number;
  estimatedReadinessPct: number;
  domainProficiency: Record<TopicDomain, number>;
} {
  const { completedLessonIds, totalLessons, diagnosticResult, assessmentHistory } = params;
  const overallCoveragePct = totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0;

  const domainScores: Record<TopicDomain, number[]> = {
    Mathematics: [],
    Rigging: [],
    'Blueprint Reading': [],
    Welding: [],
    Metallurgy: [],
    Fabrication: [],
    'Industrial Equipment': [],
    Safety: [],
  };

  if (diagnosticResult) {
    for (const d of diagnosticResult.domainBreakdown) {
      domainScores[d.domain].push(d.percentage);
    }
  }

  for (const res of assessmentHistory) {
    for (const d of res.domainBreakdown) {
      // Weight newer practice assessments
      domainScores[d.domain].push(d.percentage);
    }
  }

  const domainProficiency = {} as Record<TopicDomain, number>;
  let sum = 0;
  let count = 0;
  for (const dom of ALL_DOMAINS) {
    const arr = domainScores[dom];
    if (arr.length > 0) {
      const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      domainProficiency[dom] = avg;
      sum += avg;
      count++;
    } else {
      domainProficiency[dom] = 0;
    }
  }

  const avgAssessment = count > 0 ? sum / count : 0;
  const estimatedReadinessPct =
    count > 0 ? Math.round(avgAssessment * 0.7 + overallCoveragePct * 0.3) : Math.round(overallCoveragePct * 0.3);

  return {
    overallCoveragePct,
    estimatedReadinessPct,
    domainProficiency,
  };
}
