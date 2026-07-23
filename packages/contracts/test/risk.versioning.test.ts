/**
 * TR.1 acceptance — "risk versions on change."
 */
import { describe, it, expect } from 'vitest';
import { cad, createRiskVersion, reviseRisk } from '../src';
import { autoRiskFixture } from './fixtures';

describe('risk versioning', () => {
  it('creates version 1 with no predecessor, deeply frozen', () => {
    const v1 = createRiskVersion('risk-1', autoRiskFixture(), '2026-06-01T09:00:00.000Z');
    expect(v1.version).toBe(1);
    expect(v1.supersedesVersion).toBeNull();
    expect(Object.isFrozen(v1)).toBe(true);
    expect(Object.isFrozen(v1.payload)).toBe(true);
    expect(Object.isFrozen(v1.payload.coverages)).toBe(true);
  });

  it('revising yields a new version and never mutates the prior one', () => {
    const v1 = createRiskVersion('risk-1', autoRiskFixture(), '2026-06-01T09:00:00.000Z');

    const next = autoRiskFixture();
    next.coverages.liabilityLimit = { kind: 'amount', value: cad(2000000) };
    const v2 = reviseRisk(v1, next, '2026-06-02T10:00:00.000Z');

    expect(v2.version).toBe(2);
    expect(v2.supersedesVersion).toBe(1);
    expect(v2.riskId).toBe('risk-1');

    // The change lives only in v2; v1 is untouched.
    expect(v2.payload.coverages.liabilityLimit).toEqual({ kind: 'amount', value: cad(2000000) });
    expect(v1.payload.coverages.liabilityLimit).toEqual({ kind: 'amount', value: cad(1000000) });
    expect(v1.version).toBe(1);
  });

  it('a captured version cannot be mutated in place (deep-frozen at runtime)', () => {
    const v1 = createRiskVersion('risk-1', autoRiskFixture(), '2026-06-01T09:00:00.000Z');
    expect(() => {
      (v1.payload as { effectiveDate: string }).effectiveDate = '2027-01-01';
    }).toThrow();
  });
});
