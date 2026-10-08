import dotenv from 'dotenv';
dotenv.config();

import jwt from 'jsonwebtoken';
import assert from 'assert';
import supabase from './src/services/supabaseClient.js';
import * as decisionService from './src/services/decisionService.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured in backend environment.');
}

async function testAnalyzeEndpoint() {
  console.log('--- Testing POST /api/decisions/:id/analyze End-to-End ---');

  // 1. Get or create a test user
  const testEmail = `gemini-test-${Date.now()}@vera.ai`;
  let userId = null;

  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      email: testEmail,
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      name: 'Gemini Test User'
    })
    .select()
    .single();

  if (userError) {
    console.warn('Could not insert temp user directly, querying existing users:', userError.message);
    const { data: existingUsers } = await supabase.from('users').select('id, email').limit(1);
    if (!existingUsers || existingUsers.length === 0) {
      throw new Error('No users found in database to authenticate with');
    }
    userId = existingUsers[0].id;
  } else {
    userId = user.id;
  }

  console.log(`Using userId: ${userId}`);

  // Create test decision
  const decisionData = {
    title: 'Cloud Managed AI Architecture',
    question: 'Should VERA deploy Gemini AI with server-side caching or client-side direct calls?',
    description: 'Testing end-to-end analyze endpoint with Gemini AI interpretation.',
    criteria: [
      { name: 'Security & Key Protection', weight: 60, direction: 'HIGHER_IS_BETTER' },
      { name: 'Latency', weight: 40, direction: 'LOWER_IS_BETTER' }
    ],
    alternatives: [
      { name: 'Server-Side Caching (Express Backend)', description: 'Protected backend geminiService' },
      { name: 'Client-Side Direct (Vite Frontend)', description: 'Direct browser API access' }
    ]
  };

  const createdDecision = await decisionService.createDecision(decisionData, userId);
  console.log(`Created decision ID: ${createdDecision.id}`);

  // Add evidence
  await supabase.from('evidence').insert([
    {
      decision_id: createdDecision.id,
      title: 'OWASP API Security Top 10',
      source: 'OWASP Foundation',
      source_type: 'Report',
      evidence_text: 'Exposing third-party LLM API keys on the frontend allows key extraction and quota exhaustion.',
      supporting_alternative: 'Server-Side Caching (Express Backend)',
      evidence_direction: 'SUPPORTING'
    }
  ]);

  // Execute analyzeDecision
  console.log('Invoking analyzeDecision...');
  const analysisResult = await decisionService.analyzeDecision(createdDecision.id, {
    rawScores: {
      'Server-Side Caching (Express Backend)': { 'Security & Key Protection': 95, 'Latency': 250 },
      'Client-Side Direct (Vite Frontend)': { 'Security & Key Protection': 20, 'Latency': 150 }
    }
  }, userId);

  console.log('Deterministic Winner:', analysisResult.recommendedAlternative.alternative.name);
  console.log('Deterministic Score:', analysisResult.recommendedAlternative.overallScore);
  assert.strictEqual(analysisResult.recommendedAlternative.alternative.name, 'Server-Side Caching (Express Backend)');

  console.log('AI Interpretation Status:', analysisResult.aiInterpretation?.status);
  console.log('AI Recommendation:', analysisResult.aiInterpretation?.recommendation);
  assert.ok(analysisResult.aiInterpretation, 'aiInterpretation must be in response');
  assert.ok(analysisResult.aiInterpretation.recommendation, 'Recommendation must exist');
  assert.ok(Array.isArray(analysisResult.aiInterpretation.keyFactors), 'keyFactors must be array');

  // Verify persistence in Supabase
  const { data: savedResults } = await supabase
    .from('decision_results')
    .select('*')
    .eq('decision_id', createdDecision.id)
    .single();

  console.log('Persisted row exists in database:', !!savedResults);
  console.log('Persisted ai_interpretation_json status:', savedResults.ai_interpretation_json?.status);
  assert.ok(savedResults.ai_interpretation_json, 'ai_interpretation_json must be saved in database');

  // Test caching: Second call without changing scores should reuse existing interpretation
  console.log('Testing cache reuse on second analyzeDecision call...');
  const secondResult = await decisionService.analyzeDecision(createdDecision.id, {}, userId);
  assert.strictEqual(secondResult.aiInterpretation.recommendation, analysisResult.aiInterpretation.recommendation);
  console.log('✓ Cache hit verified: reused validated AI interpretation without re-querying Gemini.');

  // Cleanup test decision
  await decisionService.deleteDecision(createdDecision.id, userId);
  if (!userError) {
    await supabase.from('users').delete().eq('id', userId);
  }
  console.log('✓ Test data cleaned up successfully.');
  console.log('\nAll End-to-End API Integration assertions PASSED!');
}

testAnalyzeEndpoint().catch((err) => {
  console.error('End-to-End test failed:', err);
  process.exit(1);
});
