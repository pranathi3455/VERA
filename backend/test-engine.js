/**
 * VERA Deterministic Decision Engine Test Suite
 * Validates mathematical correctness, edge cases, weighting, ranking, and zero-division protection.
 */
import assert from 'assert';
import {
  normalizeValue,
  calculateWeightedScore,
  calculateRiskAssessment,
  calculateConfidence,
  executeDecisionEngine
} from './src/services/decisionEngine.js';

console.log('===============================================================');
console.log('VERA DETERMINISTIC DECISION ENGINE — UNIT & INTEGRATION TESTS');
console.log('===============================================================');

// ---------------------------------------------------------------------------
// TEST 1: HIGHER_IS_BETTER Normalization
// ---------------------------------------------------------------------------
console.log('\n[TEST 1] Testing HIGHER_IS_BETTER normalization...');
{
  const min = 10, max = 30;
  const normMin = normalizeValue({ value: 10, min, max, direction: 'HIGHER_IS_BETTER' });
  const normMid = normalizeValue({ value: 20, min, max, direction: 'HIGHER_IS_BETTER' });
  const normMax = normalizeValue({ value: 30, min, max, direction: 'HIGHER_IS_BETTER' });

  assert.strictEqual(normMin, 0, 'Min value must normalize to 0');
  assert.strictEqual(normMid, 50, 'Mid value must normalize to 50');
  assert.strictEqual(normMax, 100, 'Max value must normalize to 100');
  console.log('✓ HIGHER_IS_BETTER passed (0, 50, 100)');
}

// ---------------------------------------------------------------------------
// TEST 2: LOWER_IS_BETTER Normalization
// ---------------------------------------------------------------------------
console.log('\n[TEST 2] Testing LOWER_IS_BETTER normalization...');
{
  const min = 10, max = 30;
  const normMin = normalizeValue({ value: 10, min, max, direction: 'LOWER_IS_BETTER' });
  const normMid = normalizeValue({ value: 20, min, max, direction: 'LOWER_IS_BETTER' });
  const normMax = normalizeValue({ value: 30, min, max, direction: 'LOWER_IS_BETTER' });

  assert.strictEqual(normMin, 100, 'Lowest cost/value must normalize to 100');
  assert.strictEqual(normMid, 50, 'Mid value must normalize to 50');
  assert.strictEqual(normMax, 0, 'Highest cost/value must normalize to 0');
  console.log('✓ LOWER_IS_BETTER passed (100, 50, 0)');
}

// ---------------------------------------------------------------------------
// TEST 3: Equal Values & Zero-Division Protection (max === min)
// ---------------------------------------------------------------------------
console.log('\n[TEST 3] Testing equal values and zero-division protection...');
{
  const normHigher = normalizeValue({ value: 45, min: 45, max: 45, direction: 'HIGHER_IS_BETTER' });
  const normLower = normalizeValue({ value: 45, min: 45, max: 45, direction: 'LOWER_IS_BETTER' });

  assert.strictEqual(normHigher, 100, 'Equal values must return 100 (safe zero-division protection)');
  assert.strictEqual(normLower, 100, 'Equal values must return 100 (safe zero-division protection)');
  console.log('✓ Zero-division protection passed without error');
}

// ---------------------------------------------------------------------------
// TEST 4: Weighted Score Calculation
// ---------------------------------------------------------------------------
console.log('\n[TEST 4] Testing weighted score arithmetic...');
{
  const wt1 = calculateWeightedScore(100, 35);
  const wt2 = calculateWeightedScore(50, 25);
  const wt3 = calculateWeightedScore(0, 40);

  assert.strictEqual(wt1, 35.0, '100 norm * 35% weight = 35.0');
  assert.strictEqual(wt2, 12.5, '50 norm * 25% weight = 12.5');
  assert.strictEqual(wt3, 0.0, '0 norm * 40% weight = 0.0');
  console.log('✓ Weighted score arithmetic passed (35.0, 12.5, 0.0)');
}

// ---------------------------------------------------------------------------
// TEST 5: Invalid Weight Detection
// ---------------------------------------------------------------------------
console.log('\n[TEST 5] Testing invalid criteria weight detection...');
{
  assert.throws(
    () => {
      executeDecisionEngine({
        criteria: [
          { name: 'Cost', weight: 40, direction: 'LOWER_IS_BETTER' },
          { name: 'Quality', weight: 40, direction: 'HIGHER_IS_BETTER' } // Sum = 80%, not 100%
        ],
        alternatives: [{ name: 'A' }, { name: 'B' }],
        rawScores: {}
      });
    },
    /Total criteria weight must equal 100%/,
    'Engine must reject criteria whose weights do not sum to 100%'
  );
  console.log('✓ Invalid weight sum rejected with clear error');
}

// ---------------------------------------------------------------------------
// TEST 6: Missing Values Fallback
// ---------------------------------------------------------------------------
console.log('\n[TEST 6] Testing missing values handling...');
{
  const result = executeDecisionEngine({
    criteria: [
      { name: 'Cost', weight: 50, direction: 'LOWER_IS_BETTER' },
      { name: 'Quality', weight: 50, direction: 'HIGHER_IS_BETTER' }
    ],
    alternatives: [{ name: 'Opt 1' }, { name: 'Opt 2' }],
    rawScores: {
      'Opt 1': { Cost: 20 } // Quality is missing for Opt 1, Opt 2 has nothing
    }
  });

  assert.ok(result.rankings.length === 2, 'Engine evaluates all alternatives despite missing values');
  assert.ok(!isNaN(result.rankings[0].overallScore), 'Overall score must be a valid number');
  console.log('✓ Missing values handled safely with 0 default');
}

// ---------------------------------------------------------------------------
// TEST 7: Realistic Multi-Criteria Ranking (Supplier Evaluation)
// ---------------------------------------------------------------------------
console.log('\n[TEST 7] Running realistic 3-Supplier multi-criteria decision test...');
{
  const criteria = [
    { id: 'c1', name: 'Cost', weight: 30, direction: 'LOWER_IS_BETTER' },
    { id: 'c2', name: 'Quality', weight: 25, direction: 'HIGHER_IS_BETTER' },
    { id: 'c3', name: 'Delivery Time', weight: 20, direction: 'LOWER_IS_BETTER' },
    { id: 'c4', name: 'Reliability', weight: 15, direction: 'HIGHER_IS_BETTER' },
    { id: 'c5', name: 'Risk', weight: 10, direction: 'LOWER_IS_BETTER' }
  ];

  const alternatives = [
    { id: 'sA', name: 'Supplier A' },
    { id: 'sB', name: 'Supplier B' },
    { id: 'sC', name: 'Supplier C' }
  ];

  // Supplier A: Premium quality, slightly higher price, fast delivery, low risk
  // Supplier B: Lowest cost, lowest quality, slowest delivery, high risk
  // Supplier C: Balanced middle ground
  const rawScores = {
    sA: { c1: 75, c2: 98, c3: 12, c4: 99, c5: 15 },
    sB: { c1: 40, c2: 70, c3: 30, c4: 80, c5: 60 },
    sC: { c1: 60, c2: 88, c3: 18, c4: 92, c5: 30 }
  };

  const evidence = [
    { supporting_alternative: 'Supplier A', evidence_direction: 'SUPPORTING' },
    { supporting_alternative: 'Supplier B', evidence_direction: 'CONFLICTING' },
    { supporting_alternative: 'Supplier B', evidence_direction: 'CONFLICTING' }
  ];

  const engineOutput = executeDecisionEngine({
    decision: { id: 'dec-1', title: 'Supplier Procurement' },
    criteria,
    alternatives,
    rawScores,
    evidence
  });

  // Verify structure
  assert.ok(engineOutput.recommendedAlternative, 'Must provide recommendedAlternative');
  assert.ok(Array.isArray(engineOutput.rankings), 'Must provide rankings array');
  assert.strictEqual(engineOutput.rankings.length, 3, 'Must rank all 3 alternatives');

  // Verify ranking order (descending scores)
  const rank1 = engineOutput.rankings[0];
  const rank2 = engineOutput.rankings[1];
  const rank3 = engineOutput.rankings[2];

  assert.ok(rank1.overallScore >= rank2.overallScore, 'Rank 1 score must be >= Rank 2');
  assert.ok(rank2.overallScore >= rank3.overallScore, 'Rank 2 score must be >= Rank 3');

  assert.strictEqual(rank1.rank, 1, 'Winner rank must be 1');
  assert.strictEqual(rank1.isWinner, true, 'isWinner must be true on rank 1');
  assert.strictEqual(rank2.isWinner, false, 'isWinner must be false on rank 2');

  // Verify risk assessment
  assert.ok(rank1.riskAssessment.riskScore >= 0 && rank1.riskAssessment.riskScore <= 100, 'Risk score between 0 and 100');
  assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(rank1.riskAssessment.riskLevel), 'Valid risk level');
  assert.ok(rank1.riskAssessment.disclaimer.includes('VERA Risk Assessment'), 'Must contain VERA Risk Assessment disclaimer');

  // Supplier B has 2 conflicting evidence items -> its risk should be higher than Supplier A
  const supplierARisk = engineOutput.rankings.find(r => r.alternative.id === 'sA').riskAssessment.riskScore;
  const supplierBRisk = engineOutput.rankings.find(r => r.alternative.id === 'sB').riskAssessment.riskScore;
  assert.ok(supplierBRisk > supplierARisk, 'Supplier B with conflicting evidence must have higher risk score than Supplier A');

  // Verify confidence score
  assert.ok(engineOutput.confidence >= 10 && engineOutput.confidence <= 100, 'Confidence score must be in bounds');

  console.log('\nResults Breakdown:');
  engineOutput.rankings.forEach(r => {
    console.log(`Rank #${r.rank}: ${r.alternative.name} | Score: ${r.overallScore} | Risk: ${r.riskAssessment.riskLevel} (${r.riskAssessment.riskScore})`);
  });
  console.log(`Winner: ${engineOutput.recommendedAlternative.alternative.name} with score ${engineOutput.recommendedAlternative.overallScore}`);
  console.log(`System Confidence: ${engineOutput.confidence}%`);
  console.log('✓ Realistic multi-criteria decision test passed completely!');
}

console.log('\n===============================================================');
console.log('ALL DETERMINISTIC DECISION ENGINE TESTS PASSED WITH 100% SUCCESS!');
console.log('===============================================================');
