import test from 'node:test';
import assert from 'node:assert/strict';

import { createAdminSessionToken, verifyAdminSessionToken } from './auth.ts';

test('createAdminSessionToken returns a signed token that verifies successfully', () => {
  process.env.ADMIN_SESSION_SECRET = 'test-session-secret';
  const token = createAdminSessionToken({ sub: 'user-1', role: 'admin', email: 'admin@example.org' }, 60);

  assert.ok(token.includes('.'));
  const verified = verifyAdminSessionToken(token);
  assert.equal(verified.valid, true);
  assert.equal(verified.payload?.sub, 'user-1');
  assert.equal(verified.payload?.role, 'admin');
  assert.equal(typeof verified.payload?.iat, 'number');
  assert.equal(typeof verified.payload?.exp, 'number');
});

test('verifyAdminSessionToken rejects tampered tokens and expired tokens', () => {
  process.env.ADMIN_SESSION_SECRET = 'test-session-secret';
  const validToken = createAdminSessionToken({ sub: 'user-1', role: 'operator' }, 60);
  const tampered = `${validToken.slice(0, -1)}9`;

  assert.equal(verifyAdminSessionToken(tampered).valid, false);

  const expiredToken = createAdminSessionToken({ sub: 'user-1', role: 'operator' }, -1);
  assert.equal(verifyAdminSessionToken(expiredToken).valid, false);
});
