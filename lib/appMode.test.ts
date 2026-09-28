import test from 'node:test';
import assert from 'node:assert/strict';

import { getRuntimeMode, hasLiveFirebaseConfig } from './appMode.ts';

test('hasLiveFirebaseConfig rejects demo placeholders and accepts complete config', () => {
  assert.equal(
    hasLiveFirebaseConfig({
      VITE_FIREBASE_API_KEY: 'demo-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-project.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'demo-project',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-project.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '12345',
      VITE_FIREBASE_APP_ID: '1:12345:web:abc',
    }),
    false
  );

  assert.equal(
    hasLiveFirebaseConfig({
      VITE_FIREBASE_API_KEY: 'real-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'real-project.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'real-project',
      VITE_FIREBASE_STORAGE_BUCKET: 'real-project.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
      VITE_FIREBASE_APP_ID: '1:1234567890:web:abc123',
    }),
    true
  );
});

test('getRuntimeMode prefers explicit APP_MODE and otherwise detects demo mode safely', () => {
  assert.equal(getRuntimeMode({ APP_MODE: 'demo' }), 'demo');
  assert.equal(getRuntimeMode({ APP_MODE: 'live' }), 'live');
  assert.equal(getRuntimeMode({}), 'demo');
});
