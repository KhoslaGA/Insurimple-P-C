/**
 * Data-source seam (Phase 2). The app reads its party / policy / renewal data through
 * this one interface. The implementation is the deterministic mock spine by default
 * (CLAUDE.md #7 — the mock is first-class and the app must run with no backend), and the
 * live Insurimple-ARS backend when `INSURIMPLE_API_URL` is set. Pages call `getDataSource()`
 * and never learn which one they got — swapping to the API is an env flag, not a code change.
 */
import { createInsurimpleApiClient } from '@insurimple/contracts';
import {
  mockHousehold,
  mockPriorAutoPolicy,
  mockPriorHomePolicy,
  type Household,
  type PriorHomePolicy,
  type PriorPolicy,
} from '@/lib/mock/household';
import { mockRenewals, type RenewalRow } from '@/lib/mock/renewals';

/** The demo household the workspace opens on (the seeded Okonkwo & Mensah party). */
export const DEMO_HOUSEHOLD_ID = 'OKONKA01';

export interface PriorPolicies {
  priorAuto: PriorPolicy;
  priorHome: PriorHomePolicy;
}

export interface DataSource {
  /** Which backing this source uses — surfaced for a small "live | mock" indicator. */
  readonly kind: 'mock' | 'api';
  getHousehold(): Promise<Household>;
  getPriorPolicies(): Promise<PriorPolicies>;
  getRenewalRows(): Promise<RenewalRow[]>;
}

// ---------------------------------------------------------------------------
// Mock source (default)
// ---------------------------------------------------------------------------

const mockDataSource: DataSource = {
  kind: 'mock',
  getHousehold: () => Promise.resolve(mockHousehold),
  getPriorPolicies: () =>
    Promise.resolve({ priorAuto: mockPriorAutoPolicy, priorHome: mockPriorHomePolicy }),
  getRenewalRows: () => Promise.resolve(mockRenewals),
};

// ---------------------------------------------------------------------------
// API source (when INSURIMPLE_API_URL is set)
// ---------------------------------------------------------------------------

function apiDataSource(baseUrl: string, tenantId: string): DataSource {
  const client = createInsurimpleApiClient({ baseUrl, tenantId });
  return {
    kind: 'api',
    async getHousehold() {
      const h = await client.getHousehold(DEMO_HOUSEHOLD_ID);
      return {
        id: h.id,
        code: h.code,
        displayName: h.displayName,
        primaryContact: h.primaryContact,
        phone: h.phone ?? '',
        email: h.email ?? '',
      };
    },
    async getPriorPolicies() {
      const policies = await client.getPolicies(DEMO_HOUSEHOLD_ID);
      let priorAuto: PriorPolicy | undefined;
      let priorHome: PriorHomePolicy | undefined;
      for (const p of policies) {
        // Narrow on the risk discriminant so `risk` lands as the concrete line type.
        if (p.risk.line === 'auto') {
          priorAuto = {
            policyNumber: p.policyNumber,
            line: 'auto',
            carrier: p.carrier,
            expiresOn: p.expiresOn.slice(0, 10),
            risk: p.risk,
          };
        } else if (p.risk.line === 'property') {
          priorHome = {
            policyNumber: p.policyNumber,
            line: 'property',
            carrier: p.carrier,
            expiresOn: p.expiresOn.slice(0, 10),
            risk: p.risk,
          };
        }
      }
      if (!priorAuto || !priorHome) {
        throw new Error(
          `Household ${DEMO_HOUSEHOLD_ID} is missing an ${!priorAuto ? 'auto' : 'property'} policy; the workspace expects both lines.`,
        );
      }
      return { priorAuto, priorHome };
    },
    async getRenewalRows() {
      const items = await client.getRenewals();
      // The API joins the party name + incumbent carrier onto each renewal. They can still
      // be null (a related record outside this tenant), so fall back rather than guess.
      return items.map(({ renewal, householdName, incumbentCarrier }) => ({
        renewal,
        householdName: householdName ?? renewal.householdId,
        incumbentCarrier: incumbentCarrier ?? '—',
      }));
    },
  };
}

// ---------------------------------------------------------------------------
// Selector
// ---------------------------------------------------------------------------

let cached: DataSource | undefined;

/** The active data source: the live API when `INSURIMPLE_API_URL` is set, else the mock. */
export function getDataSource(): DataSource {
  if (cached) return cached;
  const baseUrl = process.env.INSURIMPLE_API_URL;
  const tenantId = process.env.INSURIMPLE_TENANT_ID ?? 'tenant-klc';
  cached = baseUrl ? apiDataSource(baseUrl, tenantId) : mockDataSource;
  return cached;
}
