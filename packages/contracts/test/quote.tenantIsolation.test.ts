/**
 * TR.3 acceptance — "results are tenant-isolated." This is the pre-persistence,
 * in-code analog of Postgres RLS: a caller can never receive another tenant's rows.
 * (DB-level FORCE ROW LEVEL SECURITY + pgTAP red-team is deferred with persistence.)
 */
import { describe, it, expect } from 'vitest';
import { scopeToTenant, takeAllComersReport, tenantShopResults } from '../src';
import { quoteResultsFixture, quoteShopFixture, TENANT_ID } from './fixtures';

describe('tenant isolation (RLS analog)', () => {
  const shop = quoteShopFixture();
  const ours = quoteResultsFixture();
  // Another tenant's row that (by bug or malice) reuses our shop id.
  const foreign = { ...ours[0], id: 'res-foreign', tenantId: 'tenant-other' };

  it('scopeToTenant returns only the requesting tenant rows', () => {
    const scoped = scopeToTenant(TENANT_ID, [...ours, foreign]);
    expect(scoped).toHaveLength(3);
    expect(scoped.every((r) => r.tenantId === TENANT_ID)).toBe(true);
    expect(scoped.find((r) => r.id === 'res-foreign')).toBeUndefined();
  });

  it('a cross-tenant row cannot leak into the report even with a matching shopId', () => {
    const report = takeAllComersReport(shop, [...ours, foreign]);
    expect(report.approached).toBe(3);
    expect(report.entries.find((e) => e.resultId === 'res-foreign')).toBeUndefined();
  });

  it('tenantShopResults scopes both shops and results', () => {
    const otherShop = { ...shop, id: 'shop-other', tenantId: 'tenant-other' };
    const view = tenantShopResults(TENANT_ID, [shop, otherShop], [...ours, foreign]);
    expect(view.shops.map((s) => s.id)).toEqual(['shop-1']);
    expect(view.results.every((r) => r.tenantId === TENANT_ID)).toBe(true);
  });
});
