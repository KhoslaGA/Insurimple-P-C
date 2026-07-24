/**
 * The CarrierAdapter seam (TR.4).
 *
 * Portal, rater, real-time API, or manual — all carrier interactions go through
 * this one interface, so results normalize into quote_results regardless of source
 * and year-two rating slots in with zero frontend change. Adding an adapter means
 * implementing this interface; nothing downstream changes.
 *
 * Adapters read no clock and use no randomness — `requestedAt` is supplied by the
 * caller and result ids are derived deterministically.
 */
import type { QuoteInput } from '../mappers';
import type { CarrierRef, QuoteResult } from '../quote';

export type AdapterKind = 'manual' | 'portal' | 'rater' | 'api';

/** The normalized request every adapter receives: one carrier, one risk (as quote input). */
export interface QuoteRequest {
  shopId: string;
  tenantId: string;
  input: QuoteInput; // the normalized risk from TR.1 (toQuoteInput)
  requestedAt: string; // ISO 8601, caller-supplied
}

/** A portal-assisted export: the risk in a portal-friendly form + a deep link. */
export interface PortalExport {
  carrier: CarrierRef;
  method: 'deep_link' | 'payload';
  deepLink?: string;
  payload?: Record<string, unknown>;
  instructions: string;
}

/** What every adapter returns — normalized, regardless of source. */
export interface AdapterResponse {
  kind: AdapterKind;
  carrier: CarrierRef;
  results: QuoteResult[];
  export?: PortalExport;
}

/** The one seam. Every carrier interaction implements this. */
export interface CarrierAdapter {
  readonly kind: AdapterKind;
  readonly carrier: CarrierRef;
  quote(request: QuoteRequest): Promise<AdapterResponse>;
}

/** Deterministic result id for a (shop, carrier) pair — no randomness. */
export function adapterResultId(shopId: string, carrier: CarrierRef): string {
  return `${shopId}-${carrier.id}`;
}
