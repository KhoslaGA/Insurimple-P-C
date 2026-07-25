/**
 * API client (Phase 2) — the seam apps/bms swaps its mock spine for. The stub `fetch`
 * returns the backend's wire format (flat integer-cent columns + ISO datetime strings,
 * mirroring the backend seed); the tests assert the client validates that wire, sends the
 * tenant header, and maps it to the canonical contracts types — cents → Money, ISO → date,
 * flat carrier columns → CarrierRef — with the quote_result invariants re-enforced.
 */
import { describe, it, expect } from 'vitest';
import {
  apiToQuoteResult,
  createInsurimpleApiClient,
  isPresentableAsFirm,
  InsurimpleApiError,
  type ApiHousehold,
  type ApiPolicy,
  type ApiQuoteResult,
  type ApiRenewal,
} from '../src';
import { autoRiskFixture } from './fixtures';

const BASE = 'http://localhost:4000';
const TENANT = 'tenant-klc';

function jsonResponse(
  body: unknown,
  init: { status?: number; statusText?: string } = {},
): Response {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: init.statusText ?? 'OK',
    json: async () => body,
  } as unknown as Response;
}

/** A fetch stub that records calls and answers by path; unknown paths 404. */
function stubFetch(routes: Record<string, unknown>) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const impl = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push({ url, init });
    const path = url.replace(BASE, '');
    if (!(path in routes)) {
      return jsonResponse({ error: 'not found' }, { status: 404, statusText: 'Not Found' });
    }
    return jsonResponse(routes[path]);
  }) as typeof fetch;
  return { impl, calls };
}

/** A fetch stub for writes: answers every call with `response` and records method + body. */
function writeStub(response: unknown) {
  const calls: {
    url: string;
    method?: string;
    headers: Record<string, string>;
    body: unknown;
  }[] = [];
  const impl = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push({
      url,
      method: init?.method,
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    });
    return jsonResponse(response);
  }) as typeof fetch;
  return { impl, calls };
}

const wireHousehold: ApiHousehold = {
  id: 'OKONKA01',
  tenantId: TENANT,
  code: 'OKONKA01',
  displayName: 'Amara Okonkwo & Daniel Mensah',
  email: 'amara.okonkwo@email.ca',
  phone: '(647) 555-0182',
  primaryContact: {
    firstName: 'Amara',
    lastName: 'Okonkwo',
    dateOfBirth: '1986-04-12',
    mailingAddress: {
      line1: '42 Sunnybrae Crescent',
      city: 'Brampton',
      province: 'ON',
      postalCode: 'L6Z 1R6',
    },
  },
};

const wirePolicies: ApiPolicy[] = [
  {
    id: 'pol-okonkwo-auto',
    tenantId: TENANT,
    householdId: 'OKONKA01',
    policyNumber: 'A21677149PLA',
    line: 'auto',
    carrier: 'True North P&C',
    status: 'in_force',
    effectiveDate: '2025-12-24T00:00:00.000Z',
    expiresOn: '2026-12-24T00:00:00.000Z',
    risk: autoRiskFixture(),
  },
];

const wireRenewals: ApiRenewal[] = [
  {
    id: 'ren-okonkwo',
    tenantId: TENANT,
    policyRef: 'A21677149PLA',
    householdId: 'OKONKA01',
    line: 'auto',
    expiringPremiumCents: 360000,
    effectiveDate: '2026-12-24T00:00:00.000Z',
    status: 'due',
    shopId: null,
    outcome: null,
  },
  {
    id: 'ren-tremblay',
    tenantId: TENANT,
    policyRef: 'H55231887HAB',
    householdId: 'TREMBL02',
    line: 'property',
    expiringPremiumCents: 185000,
    effectiveDate: '2026-11-01T00:00:00.000Z',
    status: 'completed',
    shopId: 'shop-tremblay-1',
    outcome: {
      disposition: 'move',
      chosenCarrier: 'Maple Mutual',
      chosenPremium: { currency: 'CAD', amountCents: 167000 },
      reason: 'Cheaper with matching coverage.',
      decidedAt: '2026-10-15T09:00:00.000Z',
      savedCents: 18000,
    },
  },
];

const wireResults: ApiQuoteResult[] = [
  {
    id: 'shop-okonkwo-1-MM',
    tenantId: TENANT,
    shopId: 'shop-okonkwo-1',
    carrierId: 'MM',
    carrierName: 'Maple Mutual',
    source: 'manual',
    outcome: 'quoted',
    provenance: 'firm',
    premiumCents: 320400,
    coverageVariant: 'AUTO — $1M TPL, $1,000 collision/comp',
    declineReason: null,
    respondedAt: '2026-06-15T11:40:00.000Z',
    presentedToClient: true,
    simulated: false,
  },
  {
    id: 'shop-okonkwo-1-CG',
    tenantId: TENANT,
    shopId: 'shop-okonkwo-1',
    carrierId: 'CG',
    carrierName: 'Cascadia General',
    source: 'api',
    outcome: 'declined',
    provenance: 'firm',
    premiumCents: null,
    coverageVariant: null,
    declineReason: 'Not writing this driver profile in the GTA this quarter.',
    respondedAt: '2026-06-15T11:39:00.000Z',
    presentedToClient: false,
    simulated: false,
  },
];

describe('createInsurimpleApiClient — tenant header + URLs', () => {
  it('sends x-tenant-id on every request and hits the right paths', async () => {
    const { impl, calls } = stubFetch({ '/renewals': wireRenewals });
    const client = createInsurimpleApiClient({ baseUrl: BASE, tenantId: TENANT, fetchImpl: impl });

    await client.getRenewals();

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${BASE}/renewals`);
    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers['x-tenant-id']).toBe(TENANT);
    expect(headers.accept).toBe('application/json');
  });

  it('trims a trailing slash on the base URL', async () => {
    const { impl, calls } = stubFetch({ '/renewals': wireRenewals });
    const client = createInsurimpleApiClient({
      baseUrl: `${BASE}/`,
      tenantId: TENANT,
      fetchImpl: impl,
    });

    await client.getRenewals();

    expect(calls[0].url).toBe(`${BASE}/renewals`);
  });
});

describe('getRenewals — cents → Money, ISO → date', () => {
  it('maps the wire renewal to the canonical RenewalTransaction', async () => {
    const { impl } = stubFetch({ '/renewals': wireRenewals });
    const client = createInsurimpleApiClient({ baseUrl: BASE, tenantId: TENANT, fetchImpl: impl });

    const [first, second] = await client.getRenewals();
    const due = first.renewal;
    const completed = second.renewal;

    // integer-cent column becomes a Money object
    expect(due.expiringPremium).toEqual({ currency: 'CAD', amountCents: 360000 });
    // ISO datetime becomes a bare calendar date
    expect(due.effectiveDate).toBe('2026-12-24');
    expect(due.status).toBe('due');
    expect(due.shopId).toBeUndefined();
    expect(due.outcome).toBeUndefined();

    // a completed renewal's outcome blob round-trips through RemarketOutcomeSchema
    expect(completed.outcome?.disposition).toBe('move');
    expect(completed.outcome?.chosenPremium).toEqual({ currency: 'CAD', amountCents: 167000 });
    expect(completed.outcome?.savedCents).toBe(18000);
  });

  it('surfaces the joined display fields, and nulls them rather than guessing', async () => {
    const { impl } = stubFetch({
      '/renewals': [
        { ...wireRenewals[0], householdName: 'Okonkwo & Mensah', incumbentCarrier: 'True North P&C' },
        wireRenewals[1], // no join fields on the wire at all
      ],
    });
    const client = createInsurimpleApiClient({ baseUrl: BASE, tenantId: TENANT, fetchImpl: impl });

    const [joined, unjoined] = await client.getRenewals();

    expect(joined.householdName).toBe('Okonkwo & Mensah');
    expect(joined.incumbentCarrier).toBe('True North P&C');
    // absent on the wire → null, never a fabricated stand-in
    expect(unjoined.householdName).toBeNull();
    expect(unjoined.incumbentCarrier).toBeNull();
  });
});

describe('getShopResults — carrier split + premium cents + invariants', () => {
  it('maps quoted and declined results and keeps the firm/quoted one presentable', async () => {
    const { impl, calls } = stubFetch({ '/shops/shop-okonkwo-1/results': wireResults });
    const client = createInsurimpleApiClient({ baseUrl: BASE, tenantId: TENANT, fetchImpl: impl });

    const results = await client.getShopResults('shop-okonkwo-1');

    expect(calls[0].url).toBe(`${BASE}/shops/shop-okonkwo-1/results`);

    const maple = results[0];
    expect(maple.carrier).toEqual({ id: 'MM', name: 'Maple Mutual' });
    expect(maple.premium).toEqual({ currency: 'CAD', amountCents: 320400 });
    expect(isPresentableAsFirm(maple)).toBe(true);

    const cascadia = results[1];
    expect(cascadia.outcome).toBe('declined');
    expect(cascadia.premium).toBeUndefined(); // a decline carries no premium
    expect(cascadia.declineReason).toContain('Not writing');
  });

  it('rejects a wire result that violates a quote_result invariant (firm + simulated)', () => {
    const bad: ApiQuoteResult = {
      ...wireResults[0],
      id: 'bad',
      simulated: true, // a simulated result can never be firm
    };
    expect(() => apiToQuoteResult(bad)).toThrow();
  });
});

describe('getHousehold / getPolicies', () => {
  it('validates the household and round-trips a policy risk', async () => {
    const { impl } = stubFetch({
      '/households/OKONKA01': wireHousehold,
      '/households/OKONKA01/policies': wirePolicies,
    });
    const client = createInsurimpleApiClient({ baseUrl: BASE, tenantId: TENANT, fetchImpl: impl });

    const household = await client.getHousehold('OKONKA01');
    expect(household.primaryContact.firstName).toBe('Amara');

    const policies = await client.getPolicies('OKONKA01');
    expect(policies).toHaveLength(1);
    expect(policies[0].risk.line).toBe('auto');
  });
});

describe('error handling', () => {
  it('throws InsurimpleApiError with the status on a non-2xx response', async () => {
    const { impl } = stubFetch({}); // every path 404s
    const client = createInsurimpleApiClient({ baseUrl: BASE, tenantId: TENANT, fetchImpl: impl });

    await expect(client.getHousehold('nope')).rejects.toBeInstanceOf(InsurimpleApiError);
    await expect(client.getHousehold('nope')).rejects.toMatchObject({ status: 404 });
  });
});

describe('writes — POST with tenant + content-type, Money → cents, canonical mapping back', () => {
  it('openShop POSTs to /shops and maps the created QuoteShop', async () => {
    const wireShop = {
      id: 'shop-new-1',
      tenantId: TENANT,
      householdId: 'OKONKA01',
      policyRef: null,
      purpose: 'new_business',
      requestedBy: 'user-rina',
      riskRef: { riskId: 'risk-auto-1', version: 1 },
      createdAt: '2026-07-01T12:00:00.000Z',
    };
    const { impl, calls } = writeStub(wireShop);
    const client = createInsurimpleApiClient({ baseUrl: BASE, tenantId: TENANT, fetchImpl: impl });

    const shop = await client.openShop({
      householdId: 'OKONKA01',
      purpose: 'new_business',
      requestedBy: 'user-rina',
      riskRef: { riskId: 'risk-auto-1', version: 1 },
    });

    expect(calls[0].url).toBe(`${BASE}/shops`);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].headers['content-type']).toBe('application/json');
    expect(calls[0].headers['x-tenant-id']).toBe(TENANT);
    expect(calls[0].body).toMatchObject({
      householdId: 'OKONKA01',
      purpose: 'new_business',
      riskRef: { riskId: 'risk-auto-1', version: 1 },
    });
    expect(shop.id).toBe('shop-new-1');
    expect(shop.riskRef).toEqual({ riskId: 'risk-auto-1', version: 1 });
  });

  it('recordResult serializes premium Money → cents and maps the response back', async () => {
    const { impl, calls } = writeStub(wireResults[0]);
    const client = createInsurimpleApiClient({ baseUrl: BASE, tenantId: TENANT, fetchImpl: impl });

    const result = await client.recordResult('shop-okonkwo-1', {
      carrier: { id: 'MM', name: 'Maple Mutual' },
      source: 'manual',
      outcome: 'quoted',
      provenance: 'firm',
      premium: { currency: 'CAD', amountCents: 320400 },
      coverageVariant: 'AUTO — $1M TPL, $1,000 collision/comp',
      respondedAt: '2026-06-15T11:40:00.000Z',
      presentedToClient: true,
    });

    expect(calls[0].url).toBe(`${BASE}/shops/shop-okonkwo-1/results`);
    expect(calls[0].method).toBe('POST');
    // Money flattened to a cents field; carrier split into id/name; no nested `premium` on the wire
    expect(calls[0].body).toMatchObject({ carrierId: 'MM', carrierName: 'Maple Mutual', premiumCents: 320400 });
    expect(calls[0].body).not.toHaveProperty('premium');
    // response mapped back to canonical
    expect(result.premium).toEqual({ currency: 'CAD', amountCents: 320400 });
    expect(isPresentableAsFirm(result)).toBe(true);
  });

  it('recordRemarketOutcome serializes chosenPremium → cents and maps the completed renewal', async () => {
    const { impl, calls } = writeStub(wireRenewals[1]); // the completed 'move' renewal
    const client = createInsurimpleApiClient({ baseUrl: BASE, tenantId: TENANT, fetchImpl: impl });

    const updated = await client.recordRemarketOutcome('ren-tremblay', {
      disposition: 'move',
      chosenCarrier: 'Maple Mutual',
      chosenPremium: { currency: 'CAD', amountCents: 167000 },
      reason: 'Cheaper with matching coverage.',
      decidedAt: '2026-10-15T09:00:00.000Z',
      shopId: 'shop-tremblay-1',
    });

    expect(calls[0].url).toBe(`${BASE}/renewals/ren-tremblay/outcome`);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].body).toMatchObject({
      disposition: 'move',
      chosenCarrier: 'Maple Mutual',
      chosenPremiumCents: 167000,
    });
    expect(calls[0].body).not.toHaveProperty('chosenPremium');
    expect(updated.status).toBe('completed');
    expect(updated.outcome?.chosenPremium).toEqual({ currency: 'CAD', amountCents: 167000 });
    expect(updated.outcome?.savedCents).toBe(18000);
  });

  it('throws InsurimpleApiError when a write returns non-2xx', async () => {
    const impl = (async () =>
      jsonResponse({ message: 'bad' }, { status: 400, statusText: 'Bad Request' })) as typeof fetch;
    const client = createInsurimpleApiClient({ baseUrl: BASE, tenantId: TENANT, fetchImpl: impl });

    await expect(
      client.openShop({
        householdId: 'X',
        purpose: 'new_business',
        requestedBy: 'u',
        riskRef: { riskId: 'r', version: 1 },
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
