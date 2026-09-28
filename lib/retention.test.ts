import test from 'node:test';
import assert from 'node:assert/strict';
import { getRetentionCutoff, isOlderThanRetention } from './retention.ts';

test('retention cutoff uses whole configured days', () => {
  const now = Date.parse('2026-09-28T00:00:00.000Z');
  assert.equal(getRetentionCutoff(30, now).toISOString(), '2026-08-29T00:00:00.000Z');
});

test('retention matching ignores malformed timestamps', () => {
  const cutoff = getRetentionCutoff(30, Date.parse('2026-09-28T00:00:00.000Z'));
  assert.equal(isOlderThanRetention('2026-08-01T00:00:00.000Z', cutoff), true);
  assert.equal(isOlderThanRetention('not-a-date', cutoff), false);
  assert.equal(isOlderThanRetention(undefined, cutoff), false);
});
