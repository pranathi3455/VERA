/**
 * VERA Complete Local System Test Suite
 * 
 * Tests:
 * - Full 18-step functional flow
 * - Multi-user isolation & security boundary
 * - Edge cases (equal values, missing evidence, invalid weights, single alternative, expired JWT, Gemini fallback)
 */

import jwt from 'jsonwebtoken';
import { executeDecisionEngine, normalizeValue } from './src/services/decisionEngine.js';
import { generateDecisionInterpretation } from './src/services/geminiService.js';

const API_BASE = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET;

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, options);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, ok: res.ok, body };
}

async function runCompleteTest() {
  console.log('====================================================');
  console.log('   VERA FULL SYSTEM END-TO-END VERIFICATION TEST    ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      throw new Error(message);
    }
    console.log(`✓ PASSED: ${message}`);
    passed++;
  }

  // ==============================================================
  // 1. APPLICATION STARTS
  // ==============================================================
  console.log('--- Step 1: Application Health & Availability ---');
  const healthRes = await request('/api/health');
  assert(healthRes.status === 200, 'Backend API health check returns 200');
  assert(healthRes.body?.database?.connected === true, 'Database connection verified');

  const frontendRes = await fetch('http://localhost:5173');
  assert(frontendRes.status === 200, 'Frontend Vite dev server is responding at port 5173');

  // ==============================================================
  // 2. REGISTRATION
  // ==============================================================
  console.log('\n--- Step 2: User Registration ---');
  const timestamp = Date.now();
  const userAEmail = `analyst_a_${timestamp}@vera.test`;
  const userBEmail = `analyst_b_${timestamp}@vera.test`;

  const regARes = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Analyst Alpha',
      email: userAEmail,
      password: 'Password123!'
    })
  });
  assert(regARes.status === 201, `User A registered successfully (${regARes.status})`);
  assert(Boolean(regARes.body?.data?.token), 'User A received JWT token on registration');
  const userAToken = regARes.body?.data?.token;
  const userAId = regARes.body?.data?.user?.id;

  // ==============================================================
  // 3. LOGIN
  // ==============================================================
  console.log('\n--- Step 3: User Login ---');
  const loginARes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userAEmail,
      password: 'Password123!'
    })
  });
  assert(loginARes.status === 200, 'User A logged in successfully');
  assert(loginARes.body?.data?.user?.email === userAEmail, 'User A profile retrieved correctly');
  assert(!loginARes.body?.data?.user?.password_hash, 'Password hash is NOT exposed in login response');

  // ==============================================================
  // 4. LOGOUT & CURRENT USER SESSION
  // ==============================================================
  console.log('\n--- Step 4: Current Session Verification ---');
  const meRes = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${userAToken}` }
  });
  assert(meRes.status === 200, 'Session verified via /api/auth/me');
  assert(meRes.body?.data?.user?.email === userAEmail, 'Session belongs to User A');

  // ==============================================================
  // 5. DASHBOARD (Initial Empty State)
  // ==============================================================
  console.log('\n--- Step 5: Dashboard Initial Empty State ---');
  const dashRes = await request('/api/decisions', {
    headers: { Authorization: `Bearer ${userAToken}` }
  });
  assert(dashRes.status === 200, 'Fetched initial decisions list');
  assert(Array.isArray(dashRes.body?.data) && dashRes.body.data.length === 0, 'New user starts with 0 decisions (empty state)');

  // ==============================================================
  // 6, 7, 8, 9: CREATE DECISION, CRITERIA, WEIGHTS, ALTERNATIVES
  // ==============================================================
  console.log('\n--- Steps 6, 7, 8, 9: Create Decision Framework ---');
  const createDecisionPayload = {
    title: 'Cloud Data Warehouse Selection',
    question: 'Which cloud analytics platform best satisfies our organizational throughput and cost requirements?',
    description: 'Empirical multi-criteria evaluation comparing managed data warehouse architectures.',
    criteria: [
      { name: 'Cost Efficiency', weight: 40, direction: 'LOWER_IS_BETTER', description: 'Total monthly compute and storage billing ($)' },
      { name: 'Query Speed', weight: 35, direction: 'HIGHER_IS_BETTER', description: 'TPC-DS 99-query throughput benchmark score' },
      { name: 'Concurrency Scale', weight: 25, direction: 'HIGHER_IS_BETTER', description: 'Peak parallel concurrent queries supported without queueing' }
    ],
    alternatives: [
      { name: 'Snowflake', description: 'Multi-cluster shared data architecture with auto-suspend' },
      { name: 'Google BigQuery', description: 'Serverless columnar analysis engine with slotted execution' },
      { name: 'Amazon Redshift Serverless', description: 'Automated scaling data warehouse cluster' }
    ]
  };

  const createRes = await request('/api/decisions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createDecisionPayload)
  });
  assert(createRes.status === 201, 'Decision created successfully (201)');
  const decision = createRes.body?.data;
  assert(decision.criteria?.length === 3, 'Created 3 weighted criteria');
  assert(decision.alternatives?.length === 3, 'Created 3 candidate alternatives');
  const decisionId = decision.id;

  // ==============================================================
  // 10. EVIDENCE ATTACHMENT
  // ==============================================================
  console.log('\n--- Step 10: Evidence Attachment ---');
  const ev1Payload = {
    title: 'BigQuery Standard TPC-DS Benchmark Run',
    source: 'Internal Architecture Lab Test',
    sourceType: 'Dataset',
    evidenceDirection: 'SUPPORTING',
    supportingAlternative: 'Google BigQuery',
    relevanceScore: 95,
    reliabilityScore: 90,
    evidenceText: 'Standardized query sweep completed in 14.2 seconds under 1TB workload.'
  };

  const ev1Res = await request(`/api/decisions/${decisionId}/evidence`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(ev1Payload)
  });
  assert(ev1Res.status === 201, 'Supporting evidence attached successfully');

  const ev2Payload = {
    title: 'Snowflake On-Demand Compute Peak Ingestion Invoice',
    source: 'Financial Billing Audit',
    sourceType: 'Report',
    evidenceDirection: 'CONFLICTING',
    supportingAlternative: 'Snowflake',
    relevanceScore: 88,
    reliabilityScore: 85,
    evidenceText: 'Unbudgeted warehouse compute credit consumption occurred during unoptimized continuous streaming ingestion.'
  };

  const ev2Res = await request(`/api/decisions/${decisionId}/evidence`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(ev2Payload)
  });
  assert(ev2Res.status === 201, 'Conflicting evidence attached successfully');

  // ==============================================================
  // 11, 12, 13: ANALYSIS, DETERMINISTIC RANKING & RISK
  // ==============================================================
  console.log('\n--- Steps 11, 12, 13: Deterministic Analysis & Risk Assessment ---');
  const rawScores = {
    'Snowflake': { 'Cost Efficiency': 4500, 'Query Speed': 92, 'Concurrency Scale': 85 },
    'Google BigQuery': { 'Cost Efficiency': 3200, 'Query Speed': 94, 'Concurrency Scale': 95 },
    'Amazon Redshift Serverless': { 'Cost Efficiency': 4100, 'Query Speed': 78, 'Concurrency Scale': 70 }
  };

  const analyzeRes = await request(`/api/decisions/${decisionId}/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawScores, forceAiRefresh: false })
  });
  assert(analyzeRes.status === 200, 'Analysis executed successfully');
  const analysis = analyzeRes.body?.data;
  assert(analysis.recommendedAlternative?.alternative?.name === 'Google BigQuery', 'Google BigQuery deterministically ranked #1');
  assert(analysis.recommendedAlternative?.overallScore > 90, 'Rank #1 score is mathematically calculated');
  assert(Boolean(analysis.riskAssessment?.winnerRisk?.riskLevel), 'VERA Risk Assessment calculated for winner');
  assert(typeof analysis.confidence === 'number' && analysis.confidence > 0, 'System confidence metric generated');

  // ==============================================================
  // 14. GEMINI INTERPRETATION
  // ==============================================================
  console.log('\n--- Step 14: Gemini AI Interpretation ---');
  assert(Boolean(analysis.aiInterpretation), 'AI interpretation object present in response');
  if (analysis.aiInterpretation.status === 'success') {
    assert(Boolean(analysis.aiInterpretation.recommendation), 'Gemini generated qualitative recommendation narrative');
    assert(Array.isArray(analysis.aiInterpretation.keyFactors), 'Gemini provided key factors synthesis');
  } else {
    assert(analysis.aiInterpretation.status === 'unavailable', 'Graceful AI fallback active when key is unconfigured');
  }

  // ==============================================================
  // 15. EXPLAINABILITY AUDIT DATA
  // ==============================================================
  console.log('\n--- Step 15: Explainability Data Structure ---');
  const winnerScores = analysis.rankings[0].criterionScores;
  assert(winnerScores.length === 3, 'Winner has broken-down criterion contribution scores');
  assert(analysis.rankings[0].overallScore > analysis.rankings[1].overallScore, 'Score margin between #1 and #2 is positive and calculated');

  // ==============================================================
  // 16. HISTORY & PERSISTENCE
  // ==============================================================
  console.log('\n--- Step 16: History & Refresh Persistence ---');
  const historyRes = await request('/api/decisions', {
    headers: { Authorization: `Bearer ${userAToken}` }
  });
  assert(historyRes.status === 200, 'History list fetched');
  assert(historyRes.body?.data?.length === 1, 'History contains 1 saved decision');
  const savedItem = historyRes.body.data[0];
  assert(savedItem.id === decisionId, 'History item ID matches created decision ID');
  assert(savedItem.decision_results?.length > 0, 'Decision results successfully persisted in database');

  // Reload decision by ID to verify full persistence
  const getByIdRes = await request(`/api/decisions/${decisionId}`, {
    headers: { Authorization: `Bearer ${userAToken}` }
  });
  assert(getByIdRes.status === 200, 'Decision reloaded by ID');
  assert(getByIdRes.body?.data?.criteria?.length === 3, 'Persisted 3 criteria');
  assert(getByIdRes.body?.data?.alternatives?.length === 3, 'Persisted 3 alternatives');
  assert(getByIdRes.body?.data?.evidence?.length === 2, 'Persisted 2 evidence records');

  // ==============================================================
  // SECURITY TEST: MULTI-USER ISOLATION
  // ==============================================================
  console.log('\n--- Security Test: Multi-User Authorization Boundary ---');
  // Register User B
  const regBRes = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Analyst Beta',
      email: userBEmail,
      password: 'Password123!'
    })
  });
  const userBToken = regBRes.body?.data?.token;

  // 1. User B tries to GET User A's decision
  const secGetRes = await request(`/api/decisions/${decisionId}`, {
    headers: { Authorization: `Bearer ${userBToken}` }
  });
  assert(secGetRes.status === 403 || secGetRes.status === 404, `User B blocked from accessing User A decision (got ${secGetRes.status})`);

  // 2. User B tries to analyze User A's decision
  const secAnalyzeRes = await request(`/api/decisions/${decisionId}/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userBToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawScores })
  });
  assert(secAnalyzeRes.status === 403 || secAnalyzeRes.status === 404, `User B blocked from analyzing User A decision (got ${secAnalyzeRes.status})`);

  // 3. User B tries to attach evidence to User A's decision
  const secEvRes = await request(`/api/decisions/${decisionId}/evidence`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userBToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Malicious Evidence Injection',
      source: 'Intruder',
      sourceType: 'Other',
      evidenceDirection: 'CONFLICTING',
      supportingAlternative: 'Snowflake',
      evidenceText: 'Should be rejected.'
    })
  });
  assert(secEvRes.status === 403 || secEvRes.status === 404, `User B blocked from attaching evidence to User A decision (got ${secEvRes.status})`);

  // 4. User B tries to DELETE User A's decision
  const secDelRes = await request(`/api/decisions/${decisionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userBToken}` }
  });
  assert(secDelRes.status === 403 || secDelRes.status === 404, `User B blocked from deleting User A decision (got ${secDelRes.status})`);

  // ==============================================================
  // EDGE CASES
  // ==============================================================
  console.log('\n--- Edge Cases ---');

  // Edge Case 1: Equal values (Zero division protection)
  const normEqualHigh = normalizeValue({ value: 50, min: 50, max: 50, direction: 'HIGHER_IS_BETTER' });
  const normEqualLow = normalizeValue({ value: 50, min: 50, max: 50, direction: 'LOWER_IS_BETTER' });
  assert(normEqualHigh === 100 && normEqualLow === 100, 'Equal min/max normalization safely returns 100 (zero division safe)');

  // Edge Case 2: Missing evidence in engine
  const engineNoEvResult = executeDecisionEngine({
    decision: { title: 'Test' },
    criteria: [{ id: 'c1', name: 'Crit1', weight: 100, direction: 'HIGHER_IS_BETTER' }],
    alternatives: [{ id: 'a1', name: 'Alt1' }, { id: 'a2', name: 'Alt2' }],
    rawScores: { 'Alt1': { 'Crit1': 80 }, 'Alt2': { 'Crit1': 60 } },
    evidence: []
  });
  assert(engineNoEvResult.recommendedAlternative.alternative.name === 'Alt1', 'Engine executes cleanly without any evidence');
  assert(engineNoEvResult.confidence >= 10, 'Calculates valid confidence score without evidence');

  // Edge Case 3: Weights not equal to 100 (Validation failure)
  const badWeightsRes = await request('/api/decisions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Bad Weights',
      question: 'Question?',
      criteria: [
        { name: 'C1', weight: 40, direction: 'HIGHER_IS_BETTER' },
        { name: 'C2', weight: 40, direction: 'LOWER_IS_BETTER' } // 80% != 100%
      ],
      alternatives: [{ name: 'A1' }, { name: 'A2' }]
    })
  });
  assert(badWeightsRes.status === 400, 'Rejects decision where criteria weights sum != 100%');

  // Edge Case 4: Only one alternative (Validation failure)
  const oneAltRes = await request('/api/decisions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'One Alt',
      question: 'Question?',
      criteria: [{ name: 'C1', weight: 100, direction: 'HIGHER_IS_BETTER' }],
      alternatives: [{ name: 'Single Option' }]
    })
  });
  assert(oneAltRes.status === 400, 'Rejects decision with fewer than 2 alternatives');

  // Edge Case 5: Invalid direction enum
  const badDirRes = await request('/api/decisions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Bad Dir',
      question: 'Question?',
      criteria: [{ name: 'C1', weight: 100, direction: 'INVALID_DIRECTION' }],
      alternatives: [{ name: 'A1' }, { name: 'A2' }]
    })
  });
  assert(badDirRes.status === 400, 'Rejects invalid criterion direction enum');

  // Edge Case 6: Expired JWT handling
  if (JWT_SECRET) {
    const expiredToken = jwt.sign(
      { id: userAId, email: userAEmail },
      JWT_SECRET,
      { expiresIn: '-10s' } // Expired 10 seconds ago
    );
    const expRes = await request('/api/decisions', {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert(expRes.status === 401, 'Expired JWT returns 401');
    assert(expRes.body?.error?.code === 'TOKEN_EXPIRED', 'Error code is TOKEN_EXPIRED');
  }

  // ==============================================================
  // 17. DELETE DECISION
  // ==============================================================
  console.log('\n--- Step 17: Delete Decision ---');
  const delRes = await request(`/api/decisions/${decisionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userAToken}` }
  });
  assert(delRes.status === 200, 'User A deleted their own decision');

  const verifyDelRes = await request(`/api/decisions/${decisionId}`, {
    headers: { Authorization: `Bearer ${userAToken}` }
  });
  assert(verifyDelRes.status === 404, 'Deleted decision is no longer accessible (404)');

  console.log('\n====================================================');
  console.log(`   ALL ${passed}/${total} SYSTEM TESTS PASSED SUCCESSFULLY! `);
  console.log('====================================================\n');
}

runCompleteTest().catch((err) => {
  console.error('\n❌ System test execution failed:', err);
  process.exit(1);
});
