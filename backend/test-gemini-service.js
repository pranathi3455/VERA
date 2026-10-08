import dotenv from 'dotenv';
dotenv.config();

import {
  generateDecisionInterpretation,
  buildCompactAiInput,
  aiInterpretationResponseSchema
} from './src/services/geminiService.js';

const mockDecision = {
  id: 'dec-123',
  title: 'Cloud Architecture Migration',
  question: 'Should we migrate our core database from self-hosted PostgreSQL to Supabase Cloud Managed PostgreSQL?',
  evidence: [
    {
      title: 'DevOps Maintenance Benchmark',
      source: 'Internal Engineering Audit',
      source_type: 'Report',
      evidence_text: 'Self-hosted requires 12 engineering hours per week on backups and security patches.',
      supporting_alternative: 'Supabase Cloud Managed',
      evidence_direction: 'SUPPORTING'
    },
    {
      title: 'Monthly Egress Cost Projection',
      source: 'FinOps Team Review',
      source_type: 'Report',
      evidence_text: 'High-volume ETL queries could increase data transfer egress costs by 15%.',
      supporting_alternative: 'Supabase Cloud Managed',
      evidence_direction: 'CONFLICTING'
    }
  ]
};

const mockEngineResult = {
  rankings: [
    {
      rank: 1,
      isWinner: true,
      alternative: {
        id: 'alt-1',
        name: 'Supabase Cloud Managed',
        description: 'Managed PostgreSQL with built-in auth and automated backups'
      },
      overallScore: 88.5,
      criterionScores: [
        { criterionName: 'Operational Overhead', rawValue: 15, weightedScore: 35.0 },
        { criterionName: 'Availability SLA', rawValue: 99.95, weightedScore: 28.5 },
        { criterionName: 'Monthly Infrastructure Cost', rawValue: 350, weightedScore: 25.0 }
      ],
      riskAssessment: {
        riskScore: 22.4,
        riskLevel: 'LOW'
      }
    },
    {
      rank: 2,
      isWinner: false,
      alternative: {
        id: 'alt-2',
        name: 'Self-Hosted Postgres on EC2',
        description: 'Dedicated EC2 instances managed with Ansible'
      },
      overallScore: 64.2,
      criterionScores: [
        { criterionName: 'Operational Overhead', rawValue: 60, weightedScore: 12.0 },
        { criterionName: 'Availability SLA', rawValue: 99.5, weightedScore: 22.2 },
        { criterionName: 'Monthly Infrastructure Cost', rawValue: 220, weightedScore: 30.0 }
      ],
      riskAssessment: {
        riskScore: 54.8,
        riskLevel: 'MEDIUM'
      }
    }
  ],
  recommendedAlternative: {
    rank: 1,
    alternative: { id: 'alt-1', name: 'Supabase Cloud Managed' },
    overallScore: 88.5,
    riskLevel: 'LOW',
    riskScore: 22.4
  },
  criterionAnalysis: [
    { criterionName: 'Operational Overhead', weight: 40, direction: 'LOWER_IS_BETTER' },
    { criterionName: 'Availability SLA', weight: 30, direction: 'HIGHER_IS_BETTER' },
    { criterionName: 'Monthly Infrastructure Cost', weight: 30, direction: 'LOWER_IS_BETTER' }
  ],
  confidence: 86
};

async function runTests() {
  console.log('=== Test 1: Verify compact AI input builder ===');
  const compactInput = buildCompactAiInput({
    decision: mockDecision,
    engineResult: mockEngineResult,
    evidence: mockDecision.evidence
  });
  console.log('Compact input keys:', Object.keys(compactInput));
  console.log('Criteria count:', compactInput.criteria.length);
  console.log('Rankings count:', compactInput.rankings.length);
  console.log('Supporting evidence:', compactInput.supportingEvidence.length);
  console.log('Conflicting evidence:', compactInput.conflictingEvidence.length);

  console.log('\n=== Test 2: Live Gemini Interpretation ===');
  const result = await generateDecisionInterpretation({
    decision: mockDecision,
    engineResult: mockEngineResult,
    evidence: mockDecision.evidence
  });
  console.log('Result status:', result.status);
  console.log('Recommendation:', result.recommendation);
  console.log('Reasoning preview:', result.reasoning?.slice(0, 120));
  console.log('Key factors:', result.keyFactors);
  console.log('Trade-offs:', result.tradeoffs);
  console.log('Risks:', result.risks);
  console.log('Confidence:', result.confidence);
  console.log('What could change decision:', result.whatCouldChangeDecision);

  console.log('\n=== Test 3: Fallback when GEMINI_API_KEY is invalid/missing ===');
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'invalid-fake-key';
  const fallbackResult = await generateDecisionInterpretation({
    decision: mockDecision,
    engineResult: mockEngineResult,
    evidence: mockDecision.evidence
  });
  console.log('Fallback result with invalid key:', fallbackResult);
  process.env.GEMINI_API_KEY = originalKey;

  console.log('\n=== Test 4: Schema validation with malformed data ===');
  const malformed = {
    recommendation: 'Only this string, missing all other required fields'
  };
  const malformedValidation = aiInterpretationResponseSchema.safeParse(malformed);
  console.log('Malformed schema check is success:', malformedValidation.success);

  console.log('\nAll direct tests completed successfully.');
}

runTests();
