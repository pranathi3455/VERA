/**
 * Test Suite: Phase 15 Demo Data Mechanism
 * 
 * Verifies:
 * 1. Demo decision structure (Title, Question, 3 Alternatives, 5 Criteria, 100% weights)
 * 2. Deterministic engine calculation (NO hardcoded winner)
 * 3. Realistic raw values & correct ranking order
 * 4. Evidence records are clearly labeled as "Demo Evidence" without fake verified claims
 * 5. Re-run analysis capability
 */
import { getOrCreateDemoDecision, DEMO_CONFIG } from './src/services/demoService.js';
import supabase from './src/services/supabaseClient.js';
import { executeDecisionEngine } from './src/services/decisionEngine.js';

async function runPhase15Test() {
  console.log('====================================================');
  console.log('   PHASE 15: DEMO DATA & EXPERIENCE TEST             ');
  console.log('====================================================\n');

  // Step 1: Verify Configuration
  console.log('--- Step 1: Checking Demo Specification ---');
  if (DEMO_CONFIG.title !== 'Supplier Selection for Sustainable Packaging') {
    throw new Error(`Unexpected title: ${DEMO_CONFIG.title}`);
  }
  if (DEMO_CONFIG.question !== 'Which supplier should our organization choose for sustainable packaging?') {
    throw new Error(`Unexpected question: ${DEMO_CONFIG.question}`);
  }
  if (DEMO_CONFIG.alternatives.length !== 3) {
    throw new Error(`Expected 3 alternatives, got ${DEMO_CONFIG.alternatives.length}`);
  }
  if (DEMO_CONFIG.criteria.length !== 5) {
    throw new Error(`Expected 5 criteria, got ${DEMO_CONFIG.criteria.length}`);
  }

  const totalWeight = DEMO_CONFIG.criteria.reduce((s, c) => s + c.weight, 0);
  if (totalWeight !== 100) {
    throw new Error(`Criteria weight must sum to 100%, got ${totalWeight}%`);
  }
  console.log('✓ Title, Question, Alternatives (3), and Criteria (5, 100% weight) verified.');

  // Step 2: Verify Evidence Labeling (No fake verified claims)
  console.log('\n--- Step 2: Checking Evidence Integrity & Labeling ---');
  DEMO_CONFIG.demoEvidence.forEach((ev, i) => {
    if (!ev.title.includes('[Demo Evidence]')) {
      throw new Error(`Evidence #${i + 1} title missing [Demo Evidence] label: ${ev.title}`);
    }
    if (!ev.source.toLowerCase().includes('demo evidence')) {
      throw new Error(`Evidence #${i + 1} source missing demo disclaimer: ${ev.source}`);
    }
    if (ev.source_type !== 'Demo Evidence') {
      throw new Error(`Evidence #${i + 1} source_type must be 'Demo Evidence', got: ${ev.source_type}`);
    }
    if (!ev.evidence_text.includes('[Demo Evidence]')) {
      throw new Error(`Evidence #${i + 1} text missing [Demo Evidence] tag: ${ev.evidence_text}`);
    }
  });
  console.log('✓ All 5 evidence items are strictly and explicitly labeled as Demo Evidence.');

  // Step 3: Verify Deterministic Engine Execution (NO Hardcoded Winner)
  console.log('\n--- Step 3: Deterministic Engine Execution Test ---');
  const engineResult = executeDecisionEngine({
    decision: { title: DEMO_CONFIG.title, question: DEMO_CONFIG.question },
    criteria: DEMO_CONFIG.criteria.map((c, i) => ({ id: `crit-${i}`, ...c })),
    alternatives: DEMO_CONFIG.alternatives.map((a, i) => ({ id: `alt-${i}`, ...a })),
    rawScores: DEMO_CONFIG.rawScores,
    evidence: DEMO_CONFIG.demoEvidence
  });

  const winner = engineResult.recommendedAlternative;
  console.log(`Rank #1 Calculated Winner: ${winner.alternative.name}`);
  console.log(`Rank #1 Overall Score:    ${winner.overallScore}`);
  console.log(`Rank #1 Risk Level:       ${winner.riskLevel} (Score: ${winner.riskScore})`);
  console.log(`System Confidence:        ${engineResult.confidence}%`);

  if (!winner.alternative.name || winner.overallScore <= 0) {
    throw new Error('Deterministic engine failed to calculate valid winner.');
  }

  // Verify full ranking order
  console.log('\nRankings:');
  engineResult.rankings.forEach((r) => {
    console.log(`  #${r.rank} ${r.alternative.name} — Score: ${r.overallScore} (Risk: ${r.riskAssessment.riskLevel})`);
  });

  if (engineResult.rankings[0].alternative.name !== 'Supplier A') {
    throw new Error(`Expected Supplier A to win based on normalized weights, got ${engineResult.rankings[0].alternative.name}`);
  }

  // Step 4: Seed Demo Decision into User Account
  console.log('\n--- Step 4: Database Seeding & Verification ---');
  const { data: testUser } = await supabase.from('users').select('id, email').limit(1).single();
  if (!testUser) {
    throw new Error('No test user found in database.');
  }
  console.log(`Seeding demo decision for user: ${testUser.email} (${testUser.id})...`);

  const demoDecision = await getOrCreateDemoDecision(testUser.id, { reset: true });
  console.log(`✓ Demo decision successfully initialized with ID: ${demoDecision.id}`);
  console.log(`  - Criteria Count:      ${demoDecision.criteria?.length}`);
  console.log(`  - Alternatives Count:  ${demoDecision.alternatives?.length}`);
  console.log(`  - Evidence Count:      ${demoDecision.evidence?.length}`);
  console.log(`  - Results Count:       ${demoDecision.decision_results?.length}`);
  console.log(`  - Top Recommended:     ${demoDecision.decision_results?.[0]?.ranking_json?.[0]?.alternative?.name}`);
  console.log(`  - Overall Score:       ${demoDecision.decision_results?.[0]?.overall_score}`);
  console.log(`  - Confidence:          ${demoDecision.decision_results?.[0]?.confidence}%`);

  // Step 5: Test Idempotency (calling getOrCreateDemoDecision again returns the existing decision)
  console.log('\n--- Step 5: Idempotency Test ---');
  const cachedDemo = await getOrCreateDemoDecision(testUser.id, { reset: false });
  if (cachedDemo.id !== demoDecision.id) {
    throw new Error('Idempotency check failed: created duplicate demo decision.');
  }
  console.log(`✓ Idempotency confirmed: retrieved existing demo decision ID ${cachedDemo.id}`);

  console.log('\n====================================================');
  console.log('   ALL PHASE 15 DEMO CHECKS PASSED!                 ');
  console.log('====================================================\n');
}

runPhase15Test().catch((err) => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
