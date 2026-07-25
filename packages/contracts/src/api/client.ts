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
  type RemarketDisposition,
  type RenewalTransaction,
} from '../renewal';
import {
  QuoteResultSchema,
  QuoteShopSchema,
  type CarrierRef,
  type QuoteOutcome,
  type QuoteProvenance,
  type QuoteResult,
  type QuoteShop,
  type QuoteSource,
  type ShopPurpose,
} from '../quote';
import type { Money, RiskRef } from '../risk';
import {
  ApiHouseholdSchema,
  ApiPolicySchema,
  ApiQuoteResultSchema,
  ApiRenewalSchema,
  ApiShopSchema,
  type ApiHousehold,
  type ApiPolicy,
  type ApiQuoteResult,
  type ApiRenewal,
  type ApiShop,
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

/**
 * A renewal plus the display fields the queue shows. `householdName` and `incumbentCarrier`
 * are presentation joins (they live on household / policy), deliberately kept OUT of the
 * canonical RenewalTransaction — the domain object stays the domain object.
 */
export interface RenewalListItem {
  renewal: RenewalTransaction;
  householdName: string | null;
  incumbentCarrier: string | null;
}

/** Map a wire shop to the canonical {@link QuoteShop} (the backend also stores householdId,
 * which the canonical shop doesn't carry — it's dropped here). */
export function apiToShop(api: ApiShop): QuoteShop {
  return QuoteShopSchema.parse({
    id: api.id,
    tenantId: api.tenantId,
    riskRef: api.riskRef,
    purpose: api.purpose,
    requestedBy: api.requestedBy,
    createdAt: api.createdAt,
    policyRef: api.policyRef ?? undefined,
  });
}

// ---------------------------------------------------------------------------
// Write inputs (canonical in; the client serializes Money → cents on the wire)
// ---------------------------------------------------------------------------

export interface OpenShopInput {
  householdId: string;
  purpose: ShopPurpose;
  requestedBy: string;
  riskRef: RiskRef;
  /** For remarket / renewal shops, the existing policy being reshopped. */
  policyRef?: string;
}

export interface RecordResultInput {
  carrier: CarrierRef;
  source: QuoteSource;
  outcome: QuoteOutcome;
  provenance: QuoteProvenance;
  /** Present iff quoted; serialized to integer cents on the wire. */
  premium?: Money;
  coverageVariant?: string;
  /** Present iff referral / declined. */
  declineReason?: string;
  respondedAt: string;
  presentedToClient?: boolean;
  simulated?: boolean;
}

export interface RecordRemarketOutcomeInput {
  disposition: RemarketDisposition;
  chosenCarrier?: string;
  /** The chosen premium on a move; serialized to integer cents on the wire. */
  chosenPremium?: Money;
  reason: string;
  decidedAt: string;
  shopId?: string;
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
  /** The renewal queue: canonical {@link RenewalTransaction}s plus their display joins. */
  getRenewals(): Promise<RenewalListItem[]>;
  /** A shop's quote results, mapped to canonical {@link QuoteResult}s. */
  getShopResults(shopId: string): Promise<QuoteResult[]>;
  /** Open a shop (one risk version → N carriers); returns the created {@link QuoteShop}. */
  openShop(input: OpenShopInput): Promise<QuoteShop>;
  /** Record one carrier's response within a shop; returns the created {@link QuoteResult}. */
  recordResult(shopId: string, input: RecordResultInput): Promise<QuoteResult>;
  /** Record a remarket outcome and complete the renewal; returns the updated {@link RenewalTransaction}. */
  recordRemarketOutcome(
    renewalId: string,
    decision: RecordRemarketOutcomeInput,
  ): Promise<RenewalTransaction>;
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

  async function postJson(path: string, body: unknown): Promise<unknown> {
    const res = await doFetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(body), // JSON.stringify drops undefined fields — optionals just aren't sent
    });
    if (!res.ok) {
      throw new InsurimpleApiError(
        res.status,
        path,
        `POST ${path} failed: ${res.status} ${res.statusText}`,
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
        .map((api) => ({
          renewal: apiToRenewal(api),
          householdName: api.householdName ?? null,
          incumbentCarrier: api.incumbentCarrier ?? null,
        }));
    },
    async getShopResults(shopId) {
      return z
        .array(ApiQuoteResultSchema)
        .parse(await getJson(`/shops/${encodeURIComponent(shopId)}/results`))
        .map(apiToQuoteResult);
    },
    async openShop(input) {
      const raw = await postJson('/shops', {
        householdId: input.householdId,
        purpose: input.purpose,
        requestedBy: input.requestedBy,
        riskRef: input.riskRef,
        policyRef: input.policyRef,
      });
      return apiToShop(ApiShopSchema.parse(raw));
    },
    async recordResult(shopId, input) {
      const raw = await postJson(`/shops/${encodeURIComponent(shopId)}/results`, {
        carrierId: input.carrier.id,
        carrierName: input.carrier.name,
        source: input.source,
        outcome: input.outcome,
        provenance: input.provenance,
        premiumCents: input.premium?.amountCents,
        coverageVariant: input.coverageVariant,
        declineReason: input.declineReason,
        respondedAt: input.respondedAt,
        presentedToClient: input.presentedToClient,
        simulated: input.simulated,
      });
      return apiToQuoteResult(ApiQuoteResultSchema.parse(raw));
    },
    async recordRemarketOutcome(renewalId, decision) {
      const raw = await postJson(`/renewals/${encodeURIComponent(renewalId)}/outcome`, {
        disposition: decision.disposition,
        chosenCarrier: decision.chosenCarrier,
        chosenPremiumCents: decision.chosenPremium?.amountCents,
        reason: decision.reason,
        decidedAt: decision.decidedAt,
        shopId: decision.shopId,
      });
      return apiToRenewal(ApiRenewalSchema.parse(raw));
    },
  };
}
