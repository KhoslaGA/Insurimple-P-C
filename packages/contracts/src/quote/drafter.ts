/**
 * The drafter gate (TR.5) for the client-facing quote summary.
 *
 * Compliance is structural: every line carries its marking, and an `indicative`
 * line ALWAYS carries the indicative notice — an indicative number can never render
 * to a client without being marked as such (a wrong number shown as firm is an E&O
 * event). The gate runs again at present time, so an unsafe summary can't be stored.
 */
import type { RiskRef } from '../risk';
import type { QuoteShop } from './shop';
import type { QuoteResult } from './result';

const INDICATIVE_NOTICE =
  'Estimate only — not a bindable quote until the carrier confirms it for this exact risk.';
const DISCLAIMER =
  'Quotes are estimates until the carrier confirms and issues. This is not an offer to bind coverage.';

/** Discriminated so an indicative line is unconstructable without its notice. */
export type ClientSummaryLine =
  | { marking: 'firm'; carrier: string; premiumLabel: string; coverage: string | null }
  | {
      marking: 'indicative';
      carrier: string;
      premiumLabel: string;
      coverage: string | null;
      indicativeNotice: string;
    };

export interface ClientQuoteSummary {
  shopId: string;
  tenantId: string;
  riskRef: RiskRef;
  generatedAt: string;
  insuredName: string;
  lines: ClientSummaryLine[];
  disclaimer: string;
}

function premiumLabel(r: QuoteResult): string {
  if (r.outcome === 'declined') return 'Declined';
  if (r.outcome === 'referral') return 'Referred to underwriter';
  if (!r.premium) return '—';
  return `$${(r.premium.amountCents / 100).toLocaleString('en-CA')} / yr`;
}

export function draftClientQuoteSummary(
  shop: QuoteShop,
  results: readonly QuoteResult[],
  opts: { generatedAt: string; insuredName: string },
): ClientQuoteSummary {
  const scoped = results.filter((r) => r.shopId === shop.id && r.tenantId === shop.tenantId);
  const lines: ClientSummaryLine[] = scoped.map((r) =>
    r.provenance === 'indicative'
      ? {
          marking: 'indicative',
          carrier: r.carrier.name,
          premiumLabel: premiumLabel(r),
          coverage: r.coverageVariant ?? null,
          indicativeNotice: INDICATIVE_NOTICE,
        }
      : {
          marking: 'firm',
          carrier: r.carrier.name,
          premiumLabel: premiumLabel(r),
          coverage: r.coverageVariant ?? null,
        },
  );
  const summary: ClientQuoteSummary = {
    shopId: shop.id,
    tenantId: shop.tenantId,
    riskRef: shop.riskRef,
    generatedAt: opts.generatedAt,
    insuredName: opts.insuredName,
    lines,
    disclaimer: DISCLAIMER,
  };
  assertClientSummarySafe(summary);
  return summary;
}

/** Enforcement — no indicative line may render without a non-empty indicative marking. */
export function assertClientSummarySafe(summary: ClientQuoteSummary): void {
  for (const line of summary.lines) {
    if (line.marking === 'indicative' && !line.indicativeNotice?.trim()) {
      throw new Error(
        `Indicative result for ${line.carrier} cannot be presented without its indicative marking.`,
      );
    }
  }
}

export interface PresentedDocument {
  id: string;
  shopId: string;
  tenantId: string;
  version: number;
  generatedAt: string;
  summary: ClientQuoteSummary;
}

/**
 * Record a presented version, linked to the shop. The gate runs again first — a
 * summary that would show an indicative number unmarked can never be presented.
 */
export function presentDocument(
  shop: QuoteShop,
  summary: ClientQuoteSummary,
  opts: { id: string; version: number; generatedAt: string },
): PresentedDocument {
  assertClientSummarySafe(summary);
  return {
    id: opts.id,
    shopId: shop.id,
    tenantId: shop.tenantId,
    version: opts.version,
    generatedAt: opts.generatedAt,
    summary,
  };
}
