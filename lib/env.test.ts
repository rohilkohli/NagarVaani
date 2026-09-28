import test from 'node:test';
import assert from 'node:assert/strict';

import { validateRequiredEnv, sanitizeRequiredValue } from './env.ts';

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
