/**
 * Stub real-time adapter (TR.4) — proves the interface pre-appointment.
 *
 * Its output is ALWAYS `simulated: true` and `indicative` — it can never pass as a
 * live carrier quote (CLAUDE.md invariant #7: fixtures can never pass as live carrier
 * data). Deterministic: same input → same premium, no clock, no randomness. When a
 * real API adapter arrives in year two, it drops into the same seam with no downstream
 * change.
 */
import type { QuoteInput } from '../mappers';
import { QuoteResultSchema, type CarrierRef } from '../quote';
import {
  adapterResultId,
  type AdapterResponse,
  type CarrierAdapter,
  type QuoteRequest,
} from './adapter';

export interface StubApiOptions {
  /** Deterministic decline predicate over the risk input. */
  declineIf?: (input: QuoteInput) => boolean;
  /** Override the deterministic premium (integer cents). */
  premiumCents?: number;
}

/** A deterministic premium derived from the risk — no randomness, no clock. */
function deterministicPremiumCents(input: QuoteInput): number {
  if (input.line === 'auto' && input.auto) {
    return 250_000 + input.auto.vehicles.length * 90_000 + input.auto.drivers.length * 40_000;
  }
  if (input.line === 'property' && input.property) {
    const a = input.property.coverages.dwellingA;
    const rebuild = a.kind === 'amount' ? a.value.amountCents : 50_000_000;
    return 120_000 + Math.round(rebuild * 0.004);
  }
  return 300_000;
}

export function createStubApiAdapter(
  carrier: CarrierRef,
  options: StubApiOptions = {},
): CarrierAdapter {
  return {
    kind: 'api',
    carrier,
    async quote(request: QuoteRequest): Promise<AdapterResponse> {
      const declined = options.declineIf?.(request.input) ?? false;
      const premiumCents = options.premiumCents ?? deterministicPremiumCents(request.input);
      const result = QuoteResultSchema.parse({
        id: adapterResultId(request.shopId, carrier),
        shopId: request.shopId,
        tenantId: request.tenantId,
        carrier,
        source: 'api',
        outcome: declined ? 'declined' : 'quoted',
        provenance: 'indicative', // a stub is never firm
        premium: declined ? undefined : { currency: 'CAD', amountCents: premiumCents },
        declineReason: declined ? 'Stub adapter: simulated decline.' : undefined,
        coverageVariant: 'Simulated quote — stub adapter, not a live carrier',
        respondedAt: request.requestedAt,
        presentedToClient: false,
        simulated: true, // can never pass as live carrier data
      });
      return { kind: 'api', carrier, results: [result] };
    },
  };
}
