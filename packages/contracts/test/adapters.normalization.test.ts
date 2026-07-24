/**
 * TR.4 acceptance — "the same risk produces normalized results through manual and
 * stub-API adapters with identical downstream handling."
 */
import { describe, it, expect } from 'vitest';
import { createManualAdapter, createStubApiAdapter, takeAllComersReport } from '../src';
import { autoQuoteRequestFixture, quoteShopFixture } from './fixtures';

const maple = { id: 'MM', name: 'Maple Mutual' };
const cascadia = { id: 'CG', name: 'Cascadia General' };

describe('same risk, normalized through manual + stub-api adapters', () => {
  const request = autoQuoteRequestFixture();

  it('both adapters produce a normalized QuoteResult differing only by source', async () => {
    const manual = createManualAdapter(maple, {
      outcome: 'quoted',
      provenance: 'firm',
      premium: { currency: 'CAD', amountCents: 320400 },
      coverageVariant: 'AUTO',
      respondedAt: '2026-06-15T11:40:00.000Z',
      presentedToClient: true,
    });
    const api = createStubApiAdapter(cascadia);

    const mResp = await manual.quote(request);
    const aResp = await api.quote(request);

    expect(mResp.results).toHaveLength(1);
    expect(aResp.results).toHaveLength(1);
    expect(mResp.results[0]?.source).toBe('manual');
    expect(aResp.results[0]?.source).toBe('api');

    for (const r of [mResp.results[0], aResp.results[0]]) {
      expect(r?.shopId).toBe(request.shopId);
      expect(r?.tenantId).toBe(request.tenantId);
      expect(r?.carrier).toBeDefined();
    }
  });

  it('both flow into the Take-All-Comers report identically (identical downstream handling)', async () => {
    const manual = createManualAdapter(maple, {
      outcome: 'quoted',
      provenance: 'firm',
      premium: { currency: 'CAD', amountCents: 320400 },
      respondedAt: '2026-06-15T11:40:00.000Z',
      presentedToClient: true,
    });
    const api = createStubApiAdapter(cascadia);

    const results = [
      ...(await manual.quote(request)).results,
      ...(await api.quote(request)).results,
    ];

    const shop = { ...quoteShopFixture(), selection: undefined };
    const report = takeAllComersReport(shop, results);

    expect(report.approached).toBe(2);
    expect(report.entries.map((e) => e.carrier.name).sort()).toEqual([
      'Cascadia General',
      'Maple Mutual',
    ]);
  });
});
