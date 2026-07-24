/**
 * TR.3 acceptance — "a shop with three carriers (one declined) records all three."
 * Also asserts the structural compliance rules on a result (compliance is structural,
 * CLAUDE.md #1): a quoted result must carry a premium; a decline must carry a reason
 * and no premium.
 */
import { describe, it, expect } from 'vitest';
import { QuoteResultSchema } from '../src';
import { quoteResultsFixture, SHOP_ID, TENANT_ID } from './fixtures';

describe('quote shop records every carrier response', () => {
  const results = quoteResultsFixture();

  it('records all three carriers, including the decline', () => {
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.outcome).sort()).toEqual(['declined', 'quoted', 'quoted']);
    expect(results.every((r) => r.shopId === SHOP_ID && r.tenantId === TENANT_ID)).toBe(true);
  });

  it('quoted results carry a premium; the decline carries a reason and no premium', () => {
    const quoted = results.filter((r) => r.outcome === 'quoted');
    expect(quoted.every((r) => (r.premium?.amountCents ?? 0) > 0)).toBe(true);

    const declined = results.find((r) => r.outcome === 'declined');
    expect(declined).toBeDefined();
    expect(declined?.premium).toBeUndefined();
    expect((declined?.declineReason ?? '').length).toBeGreaterThan(0);
  });

  it('records the CarrierAdapter source per result — manual is first-class', () => {
    const sources = results.map((r) => r.source);
    expect(sources).toContain('manual');
    expect(sources).toContain('portal');
    expect(sources).toContain('api');
  });

  it('structurally rejects a quoted result with no premium', () => {
    expect(() =>
      QuoteResultSchema.parse({
        id: 'x', shopId: SHOP_ID, tenantId: TENANT_ID,
        carrier: { id: 'C', name: 'Carrier C' }, source: 'manual',
        outcome: 'quoted', provenance: 'firm', respondedAt: '2026-06-15T11:40:00.000Z',
      }),
    ).toThrow();
  });

  it('structurally rejects a declined result that carries a premium', () => {
    expect(() =>
      QuoteResultSchema.parse({
        id: 'x', shopId: SHOP_ID, tenantId: TENANT_ID,
        carrier: { id: 'C', name: 'Carrier C' }, source: 'manual',
        outcome: 'declined', provenance: 'firm',
        premium: { currency: 'CAD', amountCents: 100 }, declineReason: 'nope',
        respondedAt: '2026-06-15T11:40:00.000Z',
      }),
    ).toThrow();
  });
});
