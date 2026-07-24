/**
 * TR.5 — side-by-side comparison. The best offer is the lowest-premium FIRM quote;
 * an indicative number is never "best" even when it's the cheapest.
 */
import { describe, it, expect } from 'vitest';
import { buildComparison } from '../src';
import { indicativeResultFixture, quoteResultsFixture, quoteShopFixture } from './fixtures';

describe('comparison view', () => {
  const shop = quoteShopFixture();
  // Maple firm $3,204 · True North firm $3,460 · Cascadia firm declined · Stub indicative $2,990
  const results = [...quoteResultsFixture(), indicativeResultFixture()];
  const view = buildComparison(shop, results);

  it('has one row per result', () => {
    expect(view.rows).toHaveLength(4);
  });

  it('picks the lowest FIRM quote as best — not the cheaper indicative one', () => {
    expect(view.bestResultId).toBe('res-maple');
    const stub = view.rows.find((r) => r.resultId === 'res-stub');
    expect(stub?.premium?.amountCents).toBe(299000); // cheapest overall…
    expect(stub?.isBest).toBe(false); // …but never best, because indicative
    expect(view.rows.find((r) => r.isBest)?.resultId).toBe('res-maple');
  });

  it('measures premium deltas against the best firm quote', () => {
    const maple = view.rows.find((r) => r.resultId === 'res-maple');
    const truenorth = view.rows.find((r) => r.resultId === 'res-truenorth');
    expect(maple?.premiumDeltaVsBestCents).toBe(0);
    expect(truenorth?.premiumDeltaVsBestCents).toBe(346000 - 320400);
  });

  it('keeps declines (no premium, delta null) in the comparison', () => {
    const cascadia = view.rows.find((r) => r.resultId === 'res-cascadia');
    expect(cascadia?.outcome).toBe('declined');
    expect(cascadia?.premium).toBeNull();
    expect(cascadia?.premiumDeltaVsBestCents).toBeNull();
    expect(cascadia?.declineReason).toMatch(/not writing/i);
  });
});
