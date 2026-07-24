/**
 * Side-by-side comparison of a shop's results (TR.5). The "best" offer is the
 * lowest-premium FIRM quote — an indicative number is never presented as best,
 * because it is not bindable. Premium deltas are measured against that best.
 */
import type { Money, RiskRef } from '../risk';
import type { QuoteShop } from './shop';
import type { CarrierRef, QuoteOutcome, QuoteProvenance, QuoteResult, QuoteSource } from './result';

export interface ComparisonRow {
  resultId: string;
  carrier: CarrierRef;
  source: QuoteSource;
  outcome: QuoteOutcome;
  provenance: QuoteProvenance;
  premium: Money | null;
  /** Cents above the best firm quote (0 for the best; null when no premium / no best). */
  premiumDeltaVsBestCents: number | null;
  coverageVariant: string | null;
  declineReason: string | null;
  isBest: boolean;
}

export interface ComparisonView {
  shopId: string;
  tenantId: string;
  riskRef: RiskRef;
  rows: ComparisonRow[];
  bestResultId: string | null;
}

export function buildComparison(shop: QuoteShop, results: readonly QuoteResult[]): ComparisonView {
  const scoped = results.filter((r) => r.shopId === shop.id && r.tenantId === shop.tenantId);

  // Best = lowest-premium firm quote. Indicative numbers are excluded — never "best".
  const best = scoped
    .filter((r) => r.outcome === 'quoted' && r.provenance === 'firm' && r.premium)
    .reduce<QuoteResult | null>(
      (acc, r) => (!acc || r.premium!.amountCents < acc.premium!.amountCents ? r : acc),
      null,
    );
  const bestCents = best?.premium?.amountCents ?? null;

  const rows: ComparisonRow[] = scoped.map((r) => ({
    resultId: r.id,
    carrier: r.carrier,
    source: r.source,
    outcome: r.outcome,
    provenance: r.provenance,
    premium: r.premium ?? null,
    premiumDeltaVsBestCents:
      r.premium && bestCents !== null ? r.premium.amountCents - bestCents : null,
    coverageVariant: r.coverageVariant ?? null,
    declineReason: r.declineReason ?? null,
    isBest: best ? r.id === best.id : false,
  }));

  return { shopId: shop.id, tenantId: shop.tenantId, riskRef: shop.riskRef, rows, bestResultId: best?.id ?? null };
}
