/**
 * TR.4 acceptance — "adding an adapter requires no frontend change." runShop takes any
 * set of CarrierAdapters; manual + api yield normalized results, portal yields an export.
 */
import { describe, it, expect } from 'vitest';
import {
  createManualAdapter,
  createPortalAdapter,
  createStubApiAdapter,
  runShop,
  type CarrierAdapter,
} from '../src';
import { autoQuoteRequestFixture } from './fixtures';

describe('adapter orchestration', () => {
  const request = autoQuoteRequestFixture();

  it('runs manual + stub-api + portal and normalizes all downstream', async () => {
    const run = await runShop(request, [
      createManualAdapter(
        { id: 'MM', name: 'Maple Mutual' },
        {
          outcome: 'quoted',
          provenance: 'firm',
          premium: { currency: 'CAD', amountCents: 320400 },
          respondedAt: '2026-06-15T11:40:00.000Z',
        },
      ),
      createStubApiAdapter({ id: 'CG', name: 'Cascadia General' }),
      createPortalAdapter({ id: 'TN', name: 'True North P&C' }),
    ]);

    expect(run.results).toHaveLength(2); // manual + api; portal yields an export, not a result
    expect(run.exports).toHaveLength(1); // portal
    expect(run.results.map((r) => r.source).sort()).toEqual(['api', 'manual']);
  });

  it('adding another adapter requires no change to runShop', async () => {
    const run = await runShop(request, [
      createStubApiAdapter({ id: 'A', name: 'Alpha' }),
      createStubApiAdapter({ id: 'B', name: 'Beta' }),
      createStubApiAdapter({ id: 'C', name: 'Gamma' }),
      createStubApiAdapter({ id: 'D', name: 'Delta' }),
    ]);

    expect(run.results).toHaveLength(4);
    expect(new Set(run.results.map((r) => r.carrier.id)).size).toBe(4);
  });

  it('one carrier failing does not cost the others', async () => {
    // The production case: a real shop fans out to ~20 carriers and something is always
    // down. All-or-nothing semantics would lose the whole shop.
    const exploding: CarrierAdapter = {
      kind: 'portal',
      carrier: { id: 'DN', name: 'Downed Mutual' },
      quote: () => Promise.reject(new Error('portal session expired')),
    };

    const run = await runShop(request, [
      createStubApiAdapter({ id: 'A', name: 'Alpha' }),
      exploding,
      createStubApiAdapter({ id: 'B', name: 'Beta' }),
    ]);

    expect(run.results).toHaveLength(2);
    expect(run.results.map((r) => r.carrier.id).sort()).toEqual(['A', 'B']);

    // The failure is documented — and kept out of the evidence table, because a technical
    // failure is not a carrier decision and must never be presentable as a decline.
    expect(run.failures).toHaveLength(1);
    expect(run.failures[0].carrier.id).toBe('DN');
    expect(run.failures[0].reason).toBe('portal session expired');
    expect(run.results.some((r) => r.carrier.id === 'DN')).toBe(false);
  });
});
