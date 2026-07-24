/**
 * A mock shop for TR.5 — results produced by running the mock risk through the TR.4
 * CarrierAdapter seam (manual firm quotes + a stub-api indicative + a firm decline).
 * Ties TR.1 → TR.4 → TR.5 together; stands in for a real shop until persistence exists.
 */
import {
  cad,
  createManualAdapter,
  createRiskVersion,
  createStubApiAdapter,
  runShop,
  toQuoteInput,
  type QuoteResult,
  type QuoteShop,
} from '@insurimple/contracts';
import { mockPriorAutoPolicy } from './household';

export const MOCK_SHOP_ID = 'shop-okonkwo-1';
export const MOCK_TENANT_ID = 'tenant-klc';

export async function mockShopAndResults(): Promise<{ shop: QuoteShop; results: QuoteResult[] }> {
  const version = createRiskVersion('risk-auto-1', mockPriorAutoPolicy.risk, '2026-06-15T11:38:00.000Z');
  const request = {
    shopId: MOCK_SHOP_ID,
    tenantId: MOCK_TENANT_ID,
    input: toQuoteInput(version),
    requestedAt: '2026-06-15T11:38:00.000Z',
  };

  const run = await runShop(request, [
    createManualAdapter(
      { id: 'MM', name: 'Maple Mutual' },
      { outcome: 'quoted', provenance: 'firm', premium: cad(3204), coverageVariant: 'AUTO — $1M TPL, $1,000 collision/comp', respondedAt: '2026-06-15T11:40:00.000Z', presentedToClient: true },
    ),
    createManualAdapter(
      { id: 'TN', name: 'True North P&C' },
      { outcome: 'quoted', provenance: 'firm', premium: cad(3460), coverageVariant: 'AUTO — bundled with home', respondedAt: '2026-06-15T11:41:00.000Z', presentedToClient: true },
    ),
    // Stub adapter: indicative, deliberately the cheapest — still never "best".
    createStubApiAdapter({ id: 'ST', name: 'Stub Mutual' }, { premiumCents: cad(2990).amountCents }),
    createManualAdapter(
      { id: 'CG', name: 'Cascadia General' },
      { outcome: 'declined', provenance: 'firm', declineReason: 'Not writing this driver profile in the GTA this quarter.', respondedAt: '2026-06-15T11:39:00.000Z' },
    ),
  ]);

  const shop: QuoteShop = {
    id: MOCK_SHOP_ID,
    tenantId: MOCK_TENANT_ID,
    riskRef: { riskId: version.riskId, version: version.version },
    purpose: 'new_business',
    requestedBy: 'user-rina',
    createdAt: '2026-06-15T11:42:00.000Z',
  };

  return { shop, results: run.results };
}
