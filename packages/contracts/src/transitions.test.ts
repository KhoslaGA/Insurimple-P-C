import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canTransition } from './index.ts';

test('legal forward transition', () => {
  assert.equal(canTransition('draft', 'doc_generated'), true);
});
test('illegal skip is rejected', () => {
  assert.equal(canTransition('draft', 'completed'), false);
});
test('rejection allowed from submitted', () => {
  assert.equal(canTransition('submitted', 'rejected'), true);
});
