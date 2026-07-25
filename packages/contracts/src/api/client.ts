/**
 * Typed client for the Insurimple-ARS backend read endpoints.
 *
 * This is the seam apps/bms swaps its mock spine for (CLAUDE.md #7: the mock is
 * first-class, so the API must return the *same* shapes). Two disciplines live here:
 *
 *  1. The wire format is validated at the edge (Api*Schema) and then mapped to the
 *     canonical contracts types — cents columns → Money, ISO datetime → the date/
 *     datetime strings the domain schemas expect. The mapped object is re-validated
 *     by the domain schema, so the quote_result invariants (quoted ⟹ premium, a
 *     simulated result is never firm) hold no matter what the wire says.
 *  2. `tenantId` rides every request as `x-tenant-id`; the backend turns that into the
 *     Postgres RLS tenant. The client never sends money as anything but integer cents.
 *
 * There is deliberately no write method for binding — quoting never crosses into
 * binding anywhere in this module.
 */
import { z } from 'zod';
import {
  RenewalTransactionSchema,
  type RenewalTransaction,
} from '../renewal';
import { QuoteResultSchema, type QuoteResult } from '../quote';
import {
  ApiHouseholdSchema,
  ApiPolicySchema,
  ApiQuoteResultSchema,
  ApiRenewalSchema,
  type ApiHousehold,
  type ApiPolicy,
  type ApiQuoteResult,
  type ApiRenewal,
} from './schemas';

/** Thrown when the backend returns a non-2xx status. Carries the status + path for logging. */
export class InsurimpleApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = 'InsurimpleApiError';
  }
}

// ---------------------------------------------------------------------------
// Wire → canonical mappers (pure; exported for direct use + testing)
// ---------------------------------------------------------------------------

/**
 * Map a wire renewal to the canonical {@link RenewalTransaction}. The backend stores
 * the expiring premium as an integer-cent column and the effective date as an ISO
 * datetime; the domain wants a Money object and a bare `YYYY-MM-DD`. The `outcome`
 * blob (when a renewal has been completed) is already in contracts shape and is
 * re-validated by RemarketOutcomeSchema through the parse below.
 */
export function apiToRenewal(api: ApiRenewal): RenewalTransaction {
  return RenewalTransactionSchema.parse({
    id: api.id,
    tenantId: api.tenantId,
    policyRef: api.policyRef,
    householdId: api.householdId,
    line: api.line,
    expiringPremium: { currency: 'CAD', amountCents: api.expiringPremiumCents },
    effectiveDate: api.effectiveDate.slice(0, 10),
    status: api.status,
    shopId: api.shopId ?? undefined,
    outcome: api.outcome ?? undefined,
  });
}

/**
 * Map a wire quote result to the canonical {@link QuoteResult}. Splits the flat
 * carrier columns back into a CarrierRef and the premium cents back into Money
 * (only for a quoted result — the schema rejects a premium on a decline/referral).
 */
export function apiToQuoteResult(api: ApiQuoteResult): QuoteResult {
  return QuoteResultSchema.parse({
    id: api.id,
    shopId: api.shopId,
    tenantId: api.tenantId,
    carrier: { id: api.carrierId, name: api.carrierName },
    source: api.source,
    outcome: api.outcome,
    provenance: api.provenance,
    premium:
      api.premiumCents != null
        ? { currency: 'CAD', amountCents: api.premiumCents }
        : undefined,
    coverageVariant: api.coverageVariant ?? undefined,
    declineReason: api.declineReason ?? undefined,
    respondedAt: api.respondedAt,
    presentedToClient: api.presentedToClient,
    simulated: api.simulated,
  });
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export interface InsurimpleApiClientConfig {
  /** Base URL of the backend, e.g. `http://localhost:4000` (a trailing slash is trimmed). */
  baseUrl: string;
  /** Tenant sent as `x-tenant-id` on every request; the backend maps it to the RLS tenant. */
  tenantId: string;
  /** Injectable fetch for tests / non-browser runtimes. Defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
}

export interface InsurimpleApiClient {
  /** The party record (already carries its NamedInsured primary contact). */
  getHousehold(id: string): Promise<ApiHousehold>;
  /** The household's policies, each with its canonical `risk` for prefill. */
  getPolicies(householdId: string): Promise<ApiPolicy[]>;
  /** The renewal queue, mapped to canonical {@link RenewalTransaction}s. */
  getRenewals(): Promise<RenewalTransaction[]>;
  /** A shop's quote results, mapped to canonical {@link QuoteResult}s. */
  getShopResults(shopId: string): Promise<QuoteResult[]>;
}

export function createInsurimpleApiClient(
  config: InsurimpleApiClientConfig,
): InsurimpleApiClient {
  const base = config.baseUrl.replace(/\/+$/, '');
  const { tenantId } = config;
  // Wrap (not just alias) the global so an unbound `globalThis.fetch` can't throw
  // "Illegal invocation" in a browser; a supplied stub is used as-is.
  const doFetch: typeof fetch =
    config.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));

  async function getJson(path: string): Promise<unknown> {
    const res = await doFetch(`${base}${path}`, {
      headers: { accept: 'application/json', 'x-tenant-id': tenantId },
    });
    if (!res.ok) {
      throw new InsurimpleApiError(
        res.status,
        path,
        `GET ${path} failed: ${res.status} ${res.statusText}`,
      );
    }
    return (await res.json()) as unknown;
  }

  return {
    async getHousehold(id) {
      return ApiHouseholdSchema.parse(
        await getJson(`/households/${encodeURIComponent(id)}`),
      );
    },
    async getPolicies(householdId) {
      return z
        .array(ApiPolicySchema)
        .parse(await getJson(`/households/${encodeURIComponent(householdId)}/policies`));
    },
    async getRenewals() {
      return z
        .array(ApiRenewalSchema)
        .parse(await getJson('/renewals'))
        .map(apiToRenewal);
    },
    async getShopResults(shopId) {
      return z
        .array(ApiQuoteResultSchema)
        .parse(await getJson(`/shops/${encodeURIComponent(shopId)}/results`))
        .map(apiToQuoteResult);
    },
  };
}
