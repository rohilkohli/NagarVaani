import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreDuplicate, textSimilarity } from './duplicate.ts';

const now = Date.parse('2026-09-28T00:00:00.000Z');

test('textSimilarity is order-independent and bounded', () => {
  const score = textSimilarity('Blocked drain near market road', 'Market road drain is blocked');
  assert.ok(score > 0.4 && score <= 1);
});

test('scoreDuplicate marks recent same-category nearby reports as duplicates', () => {
  const result = scoreDuplicate(
    { text: 'Severe potholes on market road causing accidents', category: 'roads', district: 'Patna', lat: 25.594, lng: 85.137 },
    {
      id: 'existing-1',
      text: 'Potholes on market road causing accidents',
      category: 'roads',
      district: 'Patna',
      lat: 25.5941,
      lng: 85.1371,
      created_at: '2026-09-27T12:00:00.000Z',
    },
    now,
  );
  assert.ok(result);
  assert.equal(result?.id, 'existing-1');
});

test('scoreDuplicate ignores stale, different-category, and already-duplicate reports', () => {
  const base = { text: 'Broken road near market', category: 'roads', district: 'Patna', lat: 25.594, lng: 85.137 };
  assert.equal(scoreDuplicate(base, { ...base, id: 'stale', created_at: '2026-07-01T00:00:00.000Z' }, now), null);
  assert.equal(scoreDuplicate(base, { ...base, id: 'water', category: 'water', created_at: '2026-09-27T00:00:00.000Z' }, now), null);
  assert.equal(scoreDuplicate(base, { ...base, id: 'duplicate', status: 'duplicate', created_at: '2026-09-27T00:00:00.000Z' }, now), null);
});
