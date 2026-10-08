import assert from 'assert';

// Realistic sample decisions list from backend
const sampleUserDecisions = [
  {
    id: 'dec-1',
    title: 'Cloud Infrastructure Migration',
    question: 'Should we migrate to Supabase?',
    status: 'COMPLETED',
    created_at: '2026-10-01T10:00:00Z',
    alternatives: [
      { id: 'alt-1', name: 'Supabase Cloud' },
      { id: 'alt-2', name: 'Self-Hosted AWS' }
    ],
    decision_results: [
      {
        recommended_alternative_id: 'alt-1',
        overall_score: 88.5,
        risk_score: 22.4,
        risk_level: 'LOW',
        confidence: 86,
        ranking_json: [
          { alternative: { id: 'alt-1', name: 'Supabase Cloud' }, rank: 1 }
        ]
      }
    ]
  },
  {
    id: 'dec-2',
    title: 'Frontend Framework 2026',
    question: 'Which framework should we standardize on?',
    status: 'ACTIVE',
    created_at: '2026-10-03T12:00:00Z',
    alternatives: [
      { id: 'alt-3', name: 'React + Vite' },
      { id: 'alt-4', name: 'Next.js 15' }
    ],
    decision_results: [
      {
        recommended_alternative_id: 'alt-3',
        overall_score: 92.0,
        risk_score: 65.0,
        risk_level: 'HIGH',
        confidence: 90,
        ranking_json: [
          { alternative: { id: 'alt-3', name: 'React + Vite' }, rank: 1 }
        ]
      }
    ]
  },
  {
    id: 'dec-3',
    title: 'Mobile App Architecture',
    question: 'Flutter or React Native for cross-platform app?',
    status: 'DRAFT',
    created_at: '2026-10-05T09:00:00Z',
    alternatives: [
      { id: 'alt-5', name: 'Flutter' },
      { id: 'alt-6', name: 'React Native' }
    ],
    decision_results: [] // Not yet calculated
  }
];

function runDashboardCalculations(decisions) {
  // 1. Total Decisions
  const totalDecisions = decisions.length;

  // 2. Completed Decisions
  const completedDecisions = decisions.filter(
    d => (d.decision_results && d.decision_results.length > 0) || d.status === 'COMPLETED'
  ).length;

  // 3. Average Confidence
  const confidences = decisions
    .map(d => d.decision_results?.[0]?.confidence)
    .filter(c => c !== null && c !== undefined && !isNaN(c));
  const avgConfidence = confidences.length > 0
    ? Math.round(confidences.reduce((a, b) => a + Number(b), 0) / confidences.length)
    : null;

  // 4. High Risk Decisions
  const highRiskDecisions = decisions.filter(
    d => d.decision_results?.[0]?.risk_level?.toUpperCase() === 'HIGH'
  ).length;

  // 5. Risk Distribution
  const riskDistribution = { low: 0, medium: 0, high: 0, unanalyzed: 0 };
  decisions.forEach(d => {
    const r = d.decision_results?.[0]?.risk_level?.toUpperCase();
    if (r === 'LOW') riskDistribution.low += 1;
    else if (r === 'MEDIUM') riskDistribution.medium += 1;
    else if (r === 'HIGH') riskDistribution.high += 1;
    else riskDistribution.unanalyzed += 1;
  });

  // 6. Most frequent alternative
  const winnerCounts = {};
  decisions.forEach(d => {
    const res = d.decision_results?.[0];
    if (res?.ranking_json?.[0]?.alternative?.name) {
      const name = res.ranking_json[0].alternative.name;
      winnerCounts[name] = (winnerCounts[name] || 0) + 1;
    }
  });

  return {
    totalDecisions,
    completedDecisions,
    avgConfidence,
    highRiskDecisions,
    riskDistribution,
    winnerCounts
  };
}

function testDashboardSuite() {
  console.log('====================================================');
  console.log('   PHASE 14: DASHBOARD METRICS CALCULATION TEST     ');
  console.log('====================================================\n');

  // Test populated dataset
  const metrics = runDashboardCalculations(sampleUserDecisions);
  console.log('--- Summary Cards from Real Data ---');
  console.log('1. Total Decisions:', metrics.totalDecisions);
  assert.strictEqual(metrics.totalDecisions, 3);

  console.log('2. Completed Decisions:', metrics.completedDecisions);
  assert.strictEqual(metrics.completedDecisions, 2);

  console.log('3. Average Confidence:', metrics.avgConfidence + '%');
  assert.strictEqual(metrics.avgConfidence, 88); // (86 + 90) / 2 = 88

  console.log('4. High Risk Decisions:', metrics.highRiskDecisions);
  assert.strictEqual(metrics.highRiskDecisions, 1);

  console.log('\n--- Insights Panel from Real Data ---');
  console.log('Risk Distribution:', metrics.riskDistribution);
  assert.strictEqual(metrics.riskDistribution.low, 1);
  assert.strictEqual(metrics.riskDistribution.high, 1);
  assert.strictEqual(metrics.riskDistribution.unanalyzed, 1);

  console.log('Winner Frequencies:', metrics.winnerCounts);
  assert.strictEqual(Object.keys(metrics.winnerCounts).length, 2);

  // Test empty dataset (new user)
  console.log('\n--- Empty Dataset Behavior (New User) ---');
  const emptyMetrics = runDashboardCalculations([]);
  assert.strictEqual(emptyMetrics.totalDecisions, 0);
  assert.strictEqual(emptyMetrics.completedDecisions, 0);
  assert.strictEqual(emptyMetrics.avgConfidence, null);
  assert.strictEqual(emptyMetrics.highRiskDecisions, 0);
  console.log('✓ Handled empty user data gracefully with zero hardcoded numbers');

  console.log('\n====================================================');
  console.log('   ALL PHASE 14 DASHBOARD CHECKS PASSED!            ');
  console.log('====================================================\n');
}

testDashboardSuite();
