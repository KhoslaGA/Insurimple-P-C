/**
 * Manual-entry adapter (TR.4) — the year-one PRIMARY source, not a fallback.
 *
 * In year one most quotes are keyed in carrier portals and the result pasted back.
 * The broker's entry is authoritative; this adapter normalizes it into a
 * quote_result through the same schema (and the same structural compliance) as
 * every other source.
 */
import type { Money } from '../risk';
import { QuoteResultSchema, type CarrierRef, type QuoteOutcome, type QuoteProvenance } from '../quote';
import {
  adapterResultId,
  type AdapterResponse,
  type CarrierAdapter,
  type QuoteRequest,
} from './adapter';

/** What a broker keyed back (typically from a carrier portal). */
export interface ManualEntry {
  outcome: QuoteOutcome;
  provenance: QuoteProvenance; // usually 'firm' — the broker keyed the carrier's real result
  premium?: Money;
  coverageVariant?: string;
  declineReason?: string;
  notes?: string;
  respondedAt: string;
  presentedToClient?: boolean;
}

export function createManualAdapter(carrier: CarrierRef, entry: ManualEntry): CarrierAdapter {
  return {
    kind: 'manual',
    carrier,
    async quote(request: QuoteRequest): Promise<AdapterResponse> {
      const result = QuoteResultSchema.parse({
        id: adapterResultId(request.shopId, carrier),
        shopId: request.shopId,
        tenantId: request.tenantId,
        carrier,
        source: 'manual',
        outcome: entry.outcome,
        provenance: entry.provenance,
        premium: entry.premium,
        coverageVariant: entry.coverageVariant,
        declineReason: entry.declineReason,
        notes: entry.notes,
        respondedAt: entry.respondedAt,
        presentedToClient: entry.presentedToClient ?? false,
        simulated: false,
      });
      return { kind: 'manual', carrier, results: [result] };
    },
  };
}
