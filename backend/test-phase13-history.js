import dotenv from 'dotenv';
dotenv.config();

import assert from 'assert';
import supabase from './src/services/supabaseClient.js';
import * as decisionService from './src/services/decisionService.js';

async function runPhase13TestSuite() {
  console.log('====================================================');
  console.log('   PHASE 13: DECISION HISTORY & AUDIT TEST SUITE    ');
  console.log('====================================================\n');

  // 1. Create two separate test users (User A and User B) to test ownership
  const timestamp = Date.now();
  const emailA = `history-user-a-${timestamp}@vera.ai`;
  const emailB = `history-user-b-${timestamp}@vera.ai`;

  const { data: userA, error: errA } = await supabase
    .from('users')
    .insert({
      email: emailA,
      name: 'User A History Owner',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890'
    })
    .select()
    .single();

  const { data: userB, error: errB } = await supabase
    .from('users')
    .insert({
      email: emailB,
      name: 'User B Rival User',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890'
    })
    .select()
    .single();

  if (errA || errB) {
    throw new Error(`Failed to create test users: ${errA?.message || errB?.message}`);
  }

  const userIdA = userA.id;
  const userIdB = userB.id;
  console.log(`✓ Created User A: ${userIdA}`);
  console.log(`✓ Created User B: ${userIdB}`);

  try {
    // 2. Create Multiple Decisions for User A
    console.log('\n--- Step 1: Create Multiple Decisions for User A ---');
    const dec1 = await decisionService.createDecision({
      title: 'Enterprise ERP System Migration',
      question: 'Which cloud ERP platform should our global supply chain adopt?',
      description: 'Evaluating SAP S/4HANA vs Microsoft Dynamics 365.',
      criteria: [
        { name: 'Global Scalability', weight: 60, direction: 'HIGHER_IS_BETTER' },
        { name: 'Licensing Cost', weight: 40, direction: 'LOWER_IS_BETTER' }
      ],
      alternatives: [
        { name: 'SAP S/4HANA Cloud' },
        { name: 'Microsoft Dynamics 365' }
      ]
    }, userIdA);

    const dec2 = await decisionService.createDecision({
      title: 'Frontend Framework Selection',
      question: 'Which modern UI ecosystem should we standardize on for 2026?',
      description: 'React Vite vs Next.js SSR evaluation.',
      criteria: [
        { name: 'Developer Productivity', weight: 50, direction: 'HIGHER_IS_BETTER' },
        { name: 'Runtime Overhead', weight: 50, direction: 'LOWER_IS_BETTER' }
      ],
      alternatives: [
        { name: 'React + Vite SPA' },
        { name: 'Next.js 15 Server Components' }
      ]
    }, userIdA);

    const dec3 = await decisionService.createDecision({
      title: 'Payment Gateway Vendor',
      question: 'Should VERA integrate Stripe or Adyen for merchant transactions?',
      criteria: [
        { name: 'API Reliability', weight: 70, direction: 'HIGHER_IS_BETTER' },
        { name: 'Processing Fees', weight: 30, direction: 'LOWER_IS_BETTER' }
      ],
      alternatives: [
        { name: 'Stripe Global' },
        { name: 'Adyen Enterprise' }
      ]
    }, userIdA);

    console.log(`✓ Created 3 decisions for User A: ${dec1.id}, ${dec2.id}, ${dec3.id}`);

    // Run analysis on dec1 and attach results
    const analysis1 = await decisionService.analyzeDecision(dec1.id, {
      rawScores: {
        'SAP S/4HANA Cloud': { 'Global Scalability': 95, 'Licensing Cost': 500 },
        'Microsoft Dynamics 365': { 'Global Scalability': 80, 'Licensing Cost': 300 }
      }
    }, userIdA);
    console.log(`✓ Analyzed dec1: Recommended = ${analysis1.recommendedAlternative.alternative.name}`);

    // 3. Test listDecisions for User A
    console.log('\n--- Step 2: Test GET /api/decisions for User A ---');
    const listA = await decisionService.listDecisions(userIdA);
    console.log(`User A decision count: ${listA.length}`);
    assert.strictEqual(listA.length, 3, 'User A should retrieve exactly 3 decisions');
    assert.ok(listA.some(d => d.title === 'Enterprise ERP System Migration'));
    assert.ok(listA.some(d => d.title === 'Frontend Framework Selection'));
    assert.ok(listA.some(d => d.title === 'Payment Gateway Vendor'));

    // Check structure
    const erpDec = listA.find(d => d.id === dec1.id);
    assert.ok(erpDec.decision_results.length > 0, 'dec1 should contain decision_results');
    assert.ok(erpDec.alternatives.length === 2, 'dec1 should contain alternatives array');
    console.log(`✓ User A decisions retrieved with full relations (decision_results, alternatives)`);

    // 4. Test Search logic
    console.log('\n--- Step 3: Test Search Filtering ---');
    const searchERP = listA.filter(d => 
      d.title.toLowerCase().includes('erp') || d.question.toLowerCase().includes('erp')
    );
    assert.strictEqual(searchERP.length, 1);
    assert.strictEqual(searchERP[0].id, dec1.id);
    console.log(`✓ Search for "ERP" matched exactly 1 decision: "${searchERP[0].title}"`);

    const searchFrontend = listA.filter(d => 
      d.title.toLowerCase().includes('frontend') || d.question.toLowerCase().includes('frontend')
    );
    assert.strictEqual(searchFrontend.length, 1);
    assert.strictEqual(searchFrontend[0].id, dec2.id);
    console.log(`✓ Search for "Frontend" matched exactly 1 decision: "${searchFrontend[0].title}"`);

    // 5. Test Filter logic (Completed vs In Progress vs High Risk)
    console.log('\n--- Step 4: Test Status & Risk Filtering ---');
    const completed = listA.filter(d => d.decision_results?.length > 0);
    const inProgress = listA.filter(d => !d.decision_results || d.decision_results.length === 0);
    console.log(`✓ Completed decisions (with results): ${completed.length} (Expected: 1)`);
    console.log(`✓ In-progress decisions (without results): ${inProgress.length} (Expected: 2)`);
    assert.strictEqual(completed.length, 1);
    assert.strictEqual(inProgress.length, 2);

    // 6. Test Ownership Isolation (User B cannot see User A's decisions)
    console.log('\n--- Step 5: Test Ownership Isolation ---');
    const listB = await decisionService.listDecisions(userIdB);
    console.log(`User B decision count: ${listB.length}`);
    assert.strictEqual(listB.length, 0, 'User B must not see any decisions belonging to User A');
    console.log('✓ Verified: User B has 0 decisions visible (Strict isolation confirmed)');

    // 7. Test Forbidden Delete (User B attempts to delete User A's decision)
    console.log('\n--- Step 6: Test Forbidden Delete Security ---');
    let forbiddenCaught = false;
    try {
      await decisionService.deleteDecision(dec1.id, userIdB);
    } catch (err) {
      forbiddenCaught = true;
      assert.strictEqual(err.statusCode, 403);
      console.log(`✓ Forbidden delete blocked: ${err.message} (HTTP ${err.statusCode})`);
    }
    assert.ok(forbiddenCaught, 'Delete by non-owner must throw 403 Forbidden');

    // Verify dec1 was NOT deleted
    const verifyStillExists = await decisionService.getDecisionById(dec1.id, userIdA);
    assert.strictEqual(verifyStillExists.id, dec1.id);
    console.log('✓ Verified: Non-owner delete attempt had no effect');

    // 8. Test Authorized Delete by User A
    console.log('\n--- Step 7: Test Authorized Delete by Owner ---');
    const deleteResult = await decisionService.deleteDecision(dec3.id, userIdA);
    assert.strictEqual(deleteResult.id, dec3.id);
    console.log(`✓ Decision deleted: ${deleteResult.id}`);

    // Verify list refreshes and now contains 2 decisions
    const listAfterDelete = await decisionService.listDecisions(userIdA);
    assert.strictEqual(listAfterDelete.length, 2, 'User A should now have 2 decisions');
    assert.ok(!listAfterDelete.some(d => d.id === dec3.id), 'Deleted decision must not appear');
    console.log('✓ Refreshed list confirmed: exactly 2 decisions remain');

    console.log('\n====================================================');
    console.log('   ALL PHASE 13 TEST SUITE CHECKS PASSED!           ');
    console.log('====================================================\n');
  } finally {
    // Cleanup test users and cascade-delete decisions
    console.log('Cleaning up test data...');
    await supabase.from('users').delete().eq('id', userIdA);
    await supabase.from('users').delete().eq('id', userIdB);
    console.log('✓ Cleanup complete.');
  }
}

runPhase13TestSuite().catch((err) => {
  console.error('Phase 13 test suite failed:', err);
  process.exit(1);
});
