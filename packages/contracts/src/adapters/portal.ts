/**
 * Portal-assisted adapter (TR.4) — exports the risk in a portal-friendly form /
 * deep link. It returns NO premium: the broker keys the risk in the carrier portal,
 * then pastes the returned quote back through the manual adapter. This is exactly why
 * manual entry is a first-class source.
 */
import type { QuoteInput } from '../mappers';
import type { CarrierRef } from '../quote';
import type { AdapterResponse, CarrierAdapter, PortalExport, QuoteRequest } from './adapter';

export interface PortalAdapterOptions {
  deepLinkBase?: string;
}

/** A portal-friendly summary of the risk (deterministic). */
function portalPayload(input: QuoteInput): Record<string, unknown> {
  return {
    line: input.line,
    insured: input.insured.name,
    effectiveDate: input.effectiveDate,
    province: input.province,
    riskRef: input.riskRef,
  };
}

export function createPortalAdapter(
  carrier: CarrierRef,
  options: PortalAdapterOptions = {},
): CarrierAdapter {
  return {
    kind: 'portal',
    carrier,
    async quote(request: QuoteRequest): Promise<AdapterResponse> {
      const base = options.deepLinkBase ?? 'https://portal.example/';
      const exported: PortalExport = {
        carrier,
        method: 'deep_link',
        deepLink: `${base}${carrier.id}?shop=${request.shopId}`,
        payload: portalPayload(request.input),
        instructions: `Open ${carrier.name}'s portal, key this risk, then paste the returned quote back via the manual adapter.`,
      };
      return { kind: 'portal', carrier, results: [], export: exported };
    },
  };
}
