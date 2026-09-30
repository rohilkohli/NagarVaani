import test from 'node:test';
import assert from 'node:assert/strict';

import { validateRequiredEnv, sanitizeRequiredValue, isDemoEnv } from './env.ts';

test('sanitizeRequiredValue rejects placeholder values', () => {
  assert.throws(() => sanitizeRequiredValue('MY_GEMINI_API_KEY', 'GEMINI_API_KEY'));
  assert.throws(() => sanitizeRequiredValue('your_cloud_run_url.run.app', 'APP_URL'));
  assert.equal(sanitizeRequiredValue('real-key-123', 'GEMINI_API_KEY'), 'real-key-123');
});

test('validateRequiredEnv warns in development and fails in production', () => {
  const validEnv = {
    GEMINI_API_KEY: 'real-key',
    APP_URL: 'https://example.com',
    VITE_FIREBASE_API_KEY: 'firebase-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'demo-project.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'demo-project',
    VITE_FIREBASE_STORAGE_BUCKET: 'demo-project.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '12345',
    VITE_FIREBASE_APP_ID: '1:12345:web:abc',
    VITE_GOOGLE_MAPS_API_KEY: 'maps-key',
    ADMIN_SESSION_SECRET: 'long-random-production-secret',
    GOOGLE_APPLICATION_CREDENTIALS: '/run/secrets/firebase-admin.json',
  } as Record<string, string | undefined>;

  assert.doesNotThrow(() => validateRequiredEnv(validEnv, { allowMissingClient: true, environment: 'development' }));
  assert.equal(validateRequiredEnv({ GEMINI_API_KEY: 'real-key' }, { environment: 'development', allowMissingClient: true }).GEMINI_API_KEY, 'real-key');
  assert.throws(() => validateRequiredEnv({ GEMINI_API_KEY: '' }, { environment: 'production' }));
  assert.doesNotThrow(() => validateRequiredEnv(validEnv, { environment: 'production' }));
});

test('isDemoEnv detects APP_MODE=demo', () => {
  assert.equal(isDemoEnv({ APP_MODE: 'demo' }), true);
  assert.equal(isDemoEnv({ APP_MODE: 'live' }), false);
  assert.equal(isDemoEnv({ VITE_APP_MODE: 'demo' }), true);
  assert.equal(isDemoEnv({}), false);
});

test('validateRequiredEnv demo mode bypasses all production-only requirements', () => {
  // Even with NODE_ENV=production and APP_MODE=demo, no credentials are required
  assert.doesNotThrow(() =>
    validateRequiredEnv(
      { APP_MODE: 'demo' },
      { environment: 'production', allowMissingClient: true, isDemoMode: true }
    )
  );

  // Demo mode: GEMINI_API_KEY present but no Firebase Admin / APP_URL — must not throw
  assert.doesNotThrow(() =>
    validateRequiredEnv(
      { APP_MODE: 'demo', GEMINI_API_KEY: 'real-key' },
      { environment: 'production', allowMissingClient: true, isDemoMode: true }
    )
  );

  // Live production without demo mode still throws when APP_URL is missing
  assert.throws(() =>
    validateRequiredEnv(
      { GEMINI_API_KEY: 'real-key', ADMIN_SESSION_SECRET: 'secret', GOOGLE_APPLICATION_CREDENTIALS: '/x' },
      { environment: 'production', isDemoMode: false }
    )
  );
});
