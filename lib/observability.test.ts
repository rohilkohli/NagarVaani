import test from 'node:test';
import assert from 'node:assert/strict';
import { redactPii } from './observability.ts';

test('redactPii removes common contact and identity values before AI processing', () => {
  const result = redactPii('Contact me at citizen@example.org or +91 98765 43210. Aadhaar: 1234-5678-9012');
  assert.equal(result.includes('citizen@example.org'), false);
  assert.equal(result.includes('98765'), false);
  assert.equal(result.includes('1234-5678-9012'), false);
  assert.match(result, /\[email redacted\]/);
  assert.match(result, /\[phone redacted\]/);
  assert.match(result, /\[identity redacted\]/);
});
