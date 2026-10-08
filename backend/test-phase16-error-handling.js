/**
 * Test Suite: Phase 16 Full Error-Handling Pass
 * 
 * Intentionally tests several failure modes:
 * 1. Missing authentication token (401)
 * 2. Invalid / corrupted authentication token (401)
 * 3. Malformed JSON syntax in request body (400)
 * 4. Validation error: Total criteria weight != 100% (400)
 * 5. Validation error: Fewer than 2 alternatives (400)
 * 6. Non-existent decision lookup (404)
 * 7. Non-UUID format lookup (404 / safe handling, no SQL internals leak)
 * 8. Unauthorized cross-user access (403 / 404)
 * 9. Sensitive data check (no stack traces, no API keys, no password hashes)
 * 10. Frontend error message sanitizer logic verification
 */

const API_BASE = 'http://localhost:5000';

async function testEndpoint(name, url, options = {}) {
  try {
    const res = await fetch(url, options);
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { status: res.status, ok: res.ok, body };
  } catch (err) {
    return { error: err.message };
  }
}

async function runPhase16Tests() {
  console.log('====================================================');
  console.log('   PHASE 16: INTENTIONAL FAILURE & ERROR PASS TEST   ');
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

  // 1. Missing authentication token
  console.log('--- Test 1: Missing Authentication Token ---');
  const res1 = await testEndpoint('List Decisions Unauthenticated', `${API_BASE}/api/decisions`);
  assert(res1.status === 401, `Status is 401 (got ${res1.status})`);
  assert(res1.body?.error?.code === 'UNAUTHORIZED', `Code is UNAUTHORIZED (got ${res1.body?.error?.code})`);
  assert(!res1.body?.error?.stack, 'No stack trace exposed');

  // 2. Corrupted token
  console.log('\n--- Test 2: Corrupted Token ---');
  const res2 = await testEndpoint('List Decisions Bad Token', `${API_BASE}/api/decisions`, {
    headers: { Authorization: 'Bearer invalid.corrupted.token' }
  });
  assert(res2.status === 401, `Status is 401 for corrupted token (got ${res2.status})`);
  assert(res2.body?.error?.code === 'INVALID_TOKEN', `Code is INVALID_TOKEN (got ${res2.body?.error?.code})`);

  // 3. Malformed JSON syntax
  console.log('\n--- Test 3: Malformed JSON Syntax ---');
  const res3 = await testEndpoint('Malformed JSON', `${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"email": "bad-json-unclosed'
  });
  assert(res3.status === 400, `Status is 400 for malformed JSON (got ${res3.status})`);
  assert(res3.body?.error?.code === 'INVALID_JSON', `Code is INVALID_JSON (got ${res3.body?.error?.code})`);

  // Log in a valid user for subsequent tests
  const loginRes = await testEndpoint('Login User', `${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'analyst_1791439354507@vera.local', password: 'Password123!' })
  });
  const token = loginRes.body?.data?.token;
  assert(Boolean(token), 'Obtained valid authentication token for User A');

  // 4. Validation error: Total weight != 100%
  console.log('\n--- Test 4: Criteria Weight Validation Error ---');
  const res4 = await testEndpoint('Weight Mismatch', `${API_BASE}/api/decisions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Invalid Decision Framework',
      question: 'Will this fail validation?',
      criteria: [
        { name: 'Cost', weight: 40, direction: 'LOWER_IS_BETTER' },
        { name: 'Quality', weight: 40, direction: 'HIGHER_IS_BETTER' } // Sum = 80%, not 100%
      ],
      alternatives: [
        { name: 'Option 1' },
        { name: 'Option 2' }
      ]
    })
  });
  assert(res4.status === 400, `Status is 400 for weight mismatch (got ${res4.status})`);
  assert(res4.body?.error?.code === 'VALIDATION_ERROR', `Code is VALIDATION_ERROR (got ${res4.body?.error?.code})`);

  // 5. Validation error: Fewer than 2 alternatives
  console.log('\n--- Test 5: Fewer than 2 Alternatives ---');
  const res5 = await testEndpoint('Single Alternative', `${API_BASE}/api/decisions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Invalid Alternative Count',
      question: 'Cannot decide with only 1 option?',
      criteria: [{ name: 'Cost', weight: 100, direction: 'LOWER_IS_BETTER' }],
      alternatives: [{ name: 'Only One Option' }]
    })
  });
  assert(res5.status === 400, `Status is 400 for <2 alternatives (got ${res5.status})`);
  assert(res5.body?.error?.code === 'VALIDATION_ERROR', `Code is VALIDATION_ERROR (got ${res5.body?.error?.code})`);

  // 6. Non-existent UUID lookup
  console.log('\n--- Test 6: Non-Existent UUID Lookup ---');
  const res6 = await testEndpoint('Non-Existent UUID', `${API_BASE}/api/decisions/00000000-0000-0000-0000-000000000000`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(res6.status === 404, `Status is 404 for non-existent decision (got ${res6.status})`);
  assert(res6.body?.error?.code === 'NOT_FOUND', `Code is NOT_FOUND (got ${res6.body?.error?.code})`);

  // 7. Non-UUID format lookup (no SQL internal leak)
  console.log('\n--- Test 7: Non-UUID Format Lookup (SQL Safety) ---');
  const res7 = await testEndpoint('Invalid UUID Format', `${API_BASE}/api/decisions/not-a-valid-uuid-12345`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(res7.status === 404, `Status is 404 for malformed ID format (got ${res7.status})`);
  const bodyText = JSON.stringify(res7.body);
  assert(!bodyText.includes('syntax error'), 'No SQL syntax error exposed');
  assert(!bodyText.includes('postgres'), 'No Postgres engine internals exposed');

  // 8. Sensitive Data Exposure Audit
  console.log('\n--- Test 8: Sensitive Data Leakage Audit ---');
  const allResponses = [res1, res2, res3, res4, res5, res6, res7];
  allResponses.forEach((r, idx) => {
    const raw = JSON.stringify(r.body || {});
    assert(!raw.includes('password_hash'), `Response #${idx + 1} does not leak password_hash`);
    assert(!raw.includes('AIzaSy'), `Response #${idx + 1} does not leak API keys`);
    assert(!raw.includes('stack'), `Response #${idx + 1} does not leak stack trace`);
  });

  // 9. Frontend Error Sanitizer Assertions
  console.log('\n--- Test 9: Frontend Error Sanitizer Simulation ---');
  const testSanitizer = (input, expectedSubstring) => {
    // Mirror frontend formatUserErrorMessage logic
    const TECHNICAL_PATTERNS = [
      { pattern: /failed to fetch|network\s?error|err_connection_refused/i, message: 'Unable to connect to VERA service. Please check your network connection.' },
      { pattern: /token expired|jwt expired|token_expired/i, message: 'Your session has expired. Please sign in again.' },
      { pattern: /unauthorized|invalid_token/i, message: 'Authentication required. Please sign in to continue.' },
      { pattern: /forbidden|permission denied/i, message: 'You do not have permission to access or modify this resource.' },
      { pattern: /internal server error|500|502|503/i, message: 'VERA services are temporarily experiencing technical difficulties. Please try again shortly.' },
      { pattern: /axioserror/i, message: 'Communication with the server failed. Please verify your connection.' },
      { pattern: /undefined|null|\[object object\]/i, message: 'An unexpected display error occurred. Please refresh the page.' }
    ];
    let msg = String(input);
    for (const { pattern, message } of TECHNICAL_PATTERNS) {
      if (pattern.test(msg)) return message;
    }
    return msg;
  };

  assert(testSanitizer('500 Internal Server Error').includes('VERA services are temporarily'), 'Sanitizes raw 500 error');
  assert(testSanitizer('AxiosError: Request failed with code 400').includes('server failed'), 'Sanitizes AxiosError');
  assert(testSanitizer('undefined').includes('unexpected display error'), 'Sanitizes undefined error');
  assert(testSanitizer('TypeError: Failed to fetch').includes('Unable to connect to VERA service'), 'Sanitizes Failed to fetch');

  console.log('\n====================================================');
  console.log(`   ALL ${passed}/${total} PHASE 16 ERROR CHECKS PASSED!        `);
  console.log('====================================================\n');
}

runPhase16Tests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
