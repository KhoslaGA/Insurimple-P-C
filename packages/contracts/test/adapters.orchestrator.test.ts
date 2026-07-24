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
});
