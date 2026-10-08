import dotenv from 'dotenv';
dotenv.config();

import assert from 'assert';
import {
  generateDecisionInterpretation,
  buildCompactAiInput,
  aiInterpretationResponseSchema
} from './src/services/geminiService.js';
import { executeDecisionEngine } from './src/services/decisionEngine.js';

// Realistic sample decision framework
const sampleDecision = {
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Enterprise Database Strategy',
  question: 'Should VERA deploy Managed PostgreSQL on Supabase or Self-Host on AWS EC2?',
  description: 'Evaluating database tier for scalability, operational cost, and high availability.',
  criteria: [
    { id: 'c1', name: 'Operational Simplicity', weight: 45, direction: 'LOWER_IS_BETTER' },
    { id: 'c2', name: 'High Availability SLA', weight: 35, direction: 'HIGHER_IS_BETTER' },
    { id: 'c3', name: 'Monthly Infrastructure Cost', weight: 20, direction: 'LOWER_IS_BETTER' }
  ],
  alternatives: [
    { id: 'a1', name: 'Supabase Cloud Managed', description: 'Fully managed with automated failover' },
    { id: 'a2', name: 'Self-Hosted AWS EC2', description: 'EC2 instances with custom Ansible scripts' }
  ],
  evidence: [
    {
      id: 'e1',
      title: 'DevOps Maintenance Audit',
      source: 'Internal DevOps Team',
      source_type: 'Report',
      evidence_text: 'Self-hosted requires 10+ hours per week of manual maintenance.',
      supporting_alternative: 'Supabase Cloud Managed',
      evidence_direction: 'SUPPORTING'
    },
    {
      id: 'e2',
      title: 'Bandwidth Egress Projections',
      source: 'FinOps AWS Billing',
      source_type: 'Report',
      evidence_text: 'High egress traffic across cloud regions could incur unexpected transfer fees.',
      supporting_alternative: 'Supabase Cloud Managed',
      evidence_direction: 'CONFLICTING'
    }
  ]
};

const rawScores = {
  'Supabase Cloud Managed': {
    'Operational Simplicity': 10,
    'High Availability SLA': 99.95,
    'Monthly Infrastructure Cost': 300
  },
  'Self-Hosted AWS EC2': {
    'Operational Simplicity': 50,
    'High Availability SLA': 99.5,
    'Monthly Infrastructure Cost': 180
  }
};

async function runGeminiTestSuite() {
  console.log('====================================================');
  console.log('   VERA DECISION INTELLIGENCE - GEMINI TEST SUITE   ');
  console.log('====================================================\n');

  // Step 0: Run deterministic VERA Decision Engine
  console.log('--- Step 0: Deterministic VERA Engine Calculation ---');
  const engineResult = executeDecisionEngine({
    decision: sampleDecision,
    criteria: sampleDecision.criteria,
    alternatives: sampleDecision.alternatives,
    rawScores,
    evidence: sampleDecision.evidence
  });

  assert.strictEqual(engineResult.rankings[0].alternative.name, 'Supabase Cloud Managed');
  assert.strictEqual(engineResult.rankings[0].rank, 1);
  assert.strictEqual(engineResult.rankings[1].rank, 2);
  const baselineWinner = engineResult.rankings[0].alternative.name;
  const baselineWinnerScore = engineResult.rankings[0].overallScore;
  console.log(`✓ Deterministic winner: ${baselineWinner} (Score: ${baselineWinnerScore})`);
  console.log(`✓ Deterministic runner-up: ${engineResult.rankings[1].alternative.name} (Score: ${engineResult.rankings[1].overallScore})`);
  console.log(`✓ Deterministic confidence: ${engineResult.confidence}%`);

  // Test 1: Gemini Success
  console.log('\n--- Test 1: Gemini AI Interpretation Success ---');
  const liveResult = await generateDecisionInterpretation({
    decision: sampleDecision,
    engineResult,
    evidence: sampleDecision.evidence
  });

  console.log('Status:', liveResult.status);
  assert.strictEqual(liveResult.status, 'success', 'Gemini call should succeed with valid API key');
  assert.ok(liveResult.recommendation, 'Recommendation should be present');
  assert.ok(liveResult.reasoning, 'Reasoning should be present');
  assert.ok(Array.isArray(liveResult.keyFactors), 'keyFactors should be an array');
  assert.ok(Array.isArray(liveResult.supportingEvidence), 'supportingEvidence should be an array');
  assert.ok(Array.isArray(liveResult.conflictingEvidence), 'conflictingEvidence should be an array');
  assert.ok(Array.isArray(liveResult.tradeoffs), 'tradeoffs should be an array');
  assert.ok(Array.isArray(liveResult.risks), 'risks should be an array');
  assert.ok(typeof liveResult.alternativeScenario === 'string', 'alternativeScenario should be a string');
  assert.ok(typeof liveResult.confidence === 'number', 'confidence should be a number');
  assert.ok(Array.isArray(liveResult.whatCouldChangeDecision), 'whatCouldChangeDecision should be an array');

  console.log('✓ Validated all 10 expected fields in AI response:');
  console.log('  1. Recommendation:', liveResult.recommendation);
  console.log('  2. Reasoning:', liveResult.reasoning.slice(0, 100) + '...');
  console.log('  3. Key Factors:', liveResult.keyFactors.length, 'factors');
  console.log('  4. Supporting Evidence:', liveResult.supportingEvidence.length, 'items');
  console.log('  5. Conflicting Evidence:', liveResult.conflictingEvidence.length, 'items');
  console.log('  6. Trade-offs:', liveResult.tradeoffs.length, 'tradeoffs');
  console.log('  7. Risks:', liveResult.risks.length, 'risks');
  console.log('  8. Alternative Scenario:', liveResult.alternativeScenario ? 'Present' : 'Empty');
  console.log('  9. Confidence:', liveResult.confidence);
  console.log(' 10. What Could Change Decision:', liveResult.whatCouldChangeDecision.length, 'conditions');

  // Verify Gemini DID NOT change the deterministic ranking
  assert.strictEqual(engineResult.rankings[0].alternative.name, baselineWinner, 'Rank 1 must remain Supabase');
  assert.strictEqual(engineResult.rankings[0].overallScore, baselineWinnerScore, 'Overall score must not be modified');
  console.log('✓ Verified: Deterministic rankings remain 100% UNCHANGED by Gemini.');

  // Test 2: Gemini Failure (Invalid / Missing API Key)
  console.log('\n--- Test 2: Gemini Failure / Fallback Handling ---');
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'invalid-fake-api-key-xyz';

  const failedResult = await generateDecisionInterpretation({
    decision: sampleDecision,
    engineResult,
    evidence: sampleDecision.evidence
  });

  process.env.GEMINI_API_KEY = originalKey; // Restore key

  assert.strictEqual(failedResult.status, 'unavailable');
  assert.strictEqual(failedResult.message, 'AI interpretation is temporarily unavailable.');
  console.log('✓ Fallback returned safely:');
  console.log(' ', failedResult);
  console.log('✓ Deterministic results STILL available:');
  console.log(`  Winner: ${engineResult.rankings[0].alternative.name} (${engineResult.rankings[0].overallScore})`);
  assert.strictEqual(engineResult.rankings[0].overallScore, baselineWinnerScore);

  // Test 3: Invalid AI Response (Malformed JSON / Validation Error)
  console.log('\n--- Test 3: Invalid AI Response Schema Validation ---');
  const malformedOutputs = [
    {}, // empty object
    { recommendation: 'Only recommendation' }, // missing 9 required fields
    { recommendation: 123, reasoning: null }, // wrong types
    { recommendation: 'Rec', reasoning: 'Why', confidence: 'not-a-number' }
  ];

  for (const [idx, malformed] of malformedOutputs.entries()) {
    const parsed = aiInterpretationResponseSchema.safeParse(malformed);
    assert.strictEqual(parsed.success, false, `Malformed payload #${idx + 1} must be rejected`);
  }
  console.log('✓ Successfully rejected all malformed and non-conforming responses with Zod validation.');

  // Test 4: Deterministic Result Integrity
  console.log('\n--- Test 4: Deterministic Result Persistence & Availability ---');
  assert.strictEqual(engineResult.confidence, 76);
  assert.strictEqual(engineResult.rankings[0].rank, 1);
  assert.strictEqual(engineResult.rankings[1].rank, 2);
  assert.ok(engineResult.rankings[0].criterionScores.length === 3);
  console.log('✓ Verified: Deterministic results remain 100% available and stable across all AI states.');

  console.log('\n====================================================');
  console.log('   ALL 4 TEST SUITE VERIFICATION CHECKS PASSED!     ');
  console.log('====================================================\n');
}

runGeminiTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
