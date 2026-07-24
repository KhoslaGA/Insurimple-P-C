/**
 * Take-All-Comers report (TR.3) — reconstructs, for one shop, which carriers were
 * approached, what each returned, what was presented to the client, and what won
 * and why. This is the compliance artifact behind "take all comers" and the raw
 * material for the year-two rating analytics (TR.8).
 *
 * Pure and deterministic. Defensively tenant-scoped: only results whose tenantId
 * and shopId match the shop are ever included.
 */
import type { Money } from '../risk';
import type { RiskRef } from '../risk';
import type { QuoteShop, ShopPurpose } from './shop';
import type { CarrierRef, QuoteOutcome, QuoteProvenance, QuoteResult, QuoteSource } from './result';

export interface TakeAllComersEntry {
  resultId: string;
  carrier: CarrierRef;
  source: QuoteSource;
  outcome: QuoteOutcome;
  provenance: QuoteProvenance;
  premium: Money | null;
  coverageVariant: string | null;
  declineReason: string | null;
  presentedToClient: boolean;
}

export interface TakeAllComersDecline {
  carrier: CarrierRef;
  outcome: Exclude<QuoteOutcome, 'quoted'>;
  reason: string;
}

export interface TakeAllComersReport {
  shopId: string;
  tenantId: string;
  riskRef: RiskRef;
  purpose: ShopPurpose;
  requestedBy: string;
  createdAt: string;
  approached: number;
  entries: TakeAllComersEntry[];
  presented: TakeAllComersEntry[];
  chosen: (TakeAllComersEntry & { reason: string }) | null;
  declines: TakeAllComersDecline[];
  firmCount: number;
  indicativeCount: number;
}

function toEntry(r: QuoteResult): TakeAllComersEntry {
  return {
    resultId: r.id,
    carrier: r.carrier,
    source: r.source,
    outcome: r.outcome,
    provenance: r.provenance,
    premium: r.premium ?? null,
    coverageVariant: r.coverageVariant ?? null,
    declineReason: r.declineReason ?? null,
    presentedToClient: r.presentedToClient,
  };
}

export function takeAllComersReport(
  shop: QuoteShop,
  results: readonly QuoteResult[],
): TakeAllComersReport {
  // Defensive scoping: never let another shop's or tenant's rows leak into the report.
  const scoped = results.filter((r) => r.shopId === shop.id && r.tenantId === shop.tenantId);
  const entries = scoped.map(toEntry);

  const declines: TakeAllComersDecline[] = scoped
    .filter((r) => r.outcome !== 'quoted')
    .map((r) => ({
      carrier: r.carrier,
      outcome: r.outcome as Exclude<QuoteOutcome, 'quoted'>,
      reason: r.declineReason ?? '',
    }));

  let chosen: (TakeAllComersEntry & { reason: string }) | null = null;
  if (shop.selection) {
    const entry = entries.find((e) => e.resultId === shop.selection?.resultId);
    if (entry) chosen = { ...entry, reason: shop.selection.reason };
  }

  return {
    shopId: shop.id,
    tenantId: shop.tenantId,
    riskRef: shop.riskRef,
    purpose: shop.purpose,
    requestedBy: shop.requestedBy,
    createdAt: shop.createdAt,
    approached: entries.length,
    entries,
    presented: entries.filter((e) => e.presentedToClient),
    chosen,
    declines,
    firmCount: entries.filter((e) => e.provenance === 'firm').length,
    indicativeCount: entries.filter((e) => e.provenance === 'indicative').length,
  };
}
