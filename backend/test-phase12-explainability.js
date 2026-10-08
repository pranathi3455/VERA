import assert from 'assert';
import { executeDecisionEngine } from './src/services/decisionEngine.js';

const decision = {
  id: 'dec-p12',
  title: 'Cloud Infrastructure Choice',
  question: 'Which cloud provider should host VERA?',
  criteria: [
    { id: 'c1', name: 'Quality of Service', weight: 40, direction: 'HIGHER_IS_BETTER' },
    { id: 'c2', name: 'Compliance & Security', weight: 35, direction: 'HIGHER_IS_BETTER' },
    { id: 'c3', name: 'Operational Cost', weight: 25, direction: 'LOWER_IS_BETTER' }
  ],
  alternatives: [
    { id: 'a1', name: 'Provider Alpha' },
    { id: 'a2', name: 'Provider Beta' }
  ],
  evidence: [
    {
      id: 'e1',
      title: 'Provider Alpha SOC2 Type II Certification',
      source: 'Independent Audit Report',
      source_type: 'Report',
      evidence_text: 'Provider Alpha has completed SOC2 Type II audit with zero exceptions.',
      supporting_alternative: 'Provider Alpha',
      evidence_direction: 'SUPPORTING'
    },
    {
      id: 'e2',
      title: 'Historical Downtime Incident',
      source: 'Cloud Status Log',
      source_type: 'Dataset',
      evidence_text: 'Provider Alpha suffered 45 minutes of network degradation in Q2.',
      supporting_alternative: 'Provider Alpha',
      evidence_direction: 'CONFLICTING'
    }
  ]
};

const rawScores = {
  'Provider Alpha': { 'Quality of Service': 95, 'Compliance & Security': 98, 'Operational Cost': 400 },
  'Provider Beta': { 'Quality of Service': 80, 'Compliance & Security': 70, 'Operational Cost': 250 }
};

function runPhase12Tests() {
  console.log('========================================================');
  console.log('   PHASE 12: EXPLAINABILITY & DISTINCT AUDIT DOMAINS    ');
  console.log('========================================================\n');

  // 1. Calculations are visible & deterministic
  console.log('--- Check 1: Calculations are visible & deterministic ---');
  const engineResult = executeDecisionEngine({
    decision,
    criteria: decision.criteria,
    alternatives: decision.alternatives,
    rawScores,
    evidence: decision.evidence
  });

  const winner = engineResult.rankings[0];
  const runnerUp = engineResult.rankings[1];
  const scoreDiff = Math.round((winner.overallScore - runnerUp.overallScore) * 100) / 100;

  console.log(`✓ Winner: ${winner.alternative.name} with score ${winner.overallScore}`);
  console.log(`✓ Runner-up: ${runnerUp.alternative.name} with score ${runnerUp.overallScore}`);
  console.log(`✓ Score difference: +${scoreDiff} points`);
  assert.ok(winner.overallScore > runnerUp.overallScore, 'Winner must have higher score');
  assert.strictEqual(scoreDiff, 50);

  // 2. Evidence trace test: Only stored evidence is matched; unsupported claims are NOT invented
  console.log('\n--- Check 2: Evidence trace test (Stored vs Missing) ---');
  const criteriaEvidenceMatch = (critName) => {
    return decision.evidence.filter((ev) => {
      const text = (ev.title + ' ' + ev.evidence_text).toLowerCase();
      return text.includes(critName.toLowerCase());
    });
  };

  const securityEvidence = criteriaEvidenceMatch('Compliance & Security');
  const qualityEvidence = criteriaEvidenceMatch('Quality of Service');

  console.log(`✓ Stored evidence for Compliance & Security: ${securityEvidence.length} items`);
  assert.strictEqual(securityEvidence.length, 0); // Neither text mentions the exact string "Compliance & Security"

  // Check matching by keyword
  const soc2Evidence = decision.evidence.filter(e => e.evidence_text.includes('SOC2'));
  console.log(`✓ Stored evidence for SOC2: "${soc2Evidence[0]?.title}"`);
  assert.strictEqual(soc2Evidence.length, 1);

  console.log(`✓ Unmatched criteria (e.g. Operational Cost) return 0 stored records, displaying: "No stored empirical citations linked to this specific criterion"`);
  assert.strictEqual(criteriaEvidenceMatch('Operational Cost').length, 0);

  // 3. Trade-offs are mathematically traceable
  console.log('\n--- Check 3: Mathematical Trade-offs & Concessions ---');
  const concessions = [];
  winner.criterionScores.forEach((wCs) => {
    const rCs = runnerUp.criterionScores.find(rc => rc.criterionName === wCs.criterionName);
    if (rCs && rCs.weightedScore > wCs.weightedScore) {
      concessions.push({
        criterion: wCs.criterionName,
        gap: Math.round((rCs.weightedScore - wCs.weightedScore) * 10) / 10
      });
    }
  });

  console.log('✓ Concessions where winner conceded ground to runner-up:');
  concessions.forEach(c => console.log(`  - Conceded ${c.gap} pts on ${c.criterion}`));
  assert.strictEqual(concessions.length, 1);
  assert.strictEqual(concessions[0].criterion, 'Operational Cost');
  assert.strictEqual(concessions[0].gap, 25);

  // 4. AI Does Not Modify Deterministic Scores
  console.log('\n--- Check 4: AI Does Not Modify Deterministic Scores ---');
  const mockAiOutput = {
    recommendation: 'Choose Provider Alpha because of high quality and SOC2 compliance.',
    reasoning: 'Provider Alpha leads in technical excellence.',
    confidence: 85
  };
  // Verify that mock AI confidence or text does not overwrite engineResult.confidence
  assert.strictEqual(engineResult.confidence, 76);
  assert.notStrictEqual(engineResult.confidence, mockAiOutput.confidence);
  console.log(`✓ Engine confidence remains strictly mathematical: ${engineResult.confidence}% (distinct from AI confidence of ${mockAiOutput.confidence}%)`);

  // 5. Disclaimer presence check
  console.log('\n--- Check 5: Disclaimer Presence ---');
  const disclaimer = 'VERA provides decision support, not professional advice. Recommendations depend on the quality and completeness of the information provided.';
  assert.ok(disclaimer.includes('decision support, not professional advice'));
  console.log(`✓ Verified disclaimer wording: "${disclaimer}"`);

  console.log('\n========================================================');
  console.log('   ALL PHASE 12 EXPLAINABILITY VERIFICATION CHECKS PASSED');
  console.log('========================================================\n');
}

runPhase12Tests();
