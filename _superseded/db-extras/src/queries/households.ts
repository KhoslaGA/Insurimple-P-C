/**
 * Household reads.
 *
 * No tenant_id appears in any WHERE clause here, and that is deliberate: RLS
 * adds the predicate. Filtering by a tenant id passed in from application code
 * would make the app the enforcement point, which is exactly what invariant #2
 * forbids — a forgotten clause would then be a data breach rather than an
 * empty result.
 */

import type {
  HouseholdRecord,
  PolicyDetail,
  TransactionSummary,
} from "@insurimple/contracts";
import { withTenant, type TenantContext } from "../index";

/** Row shapes as they come back from Postgres, before mapping to contracts. */
type HouseholdRow = {
  id: string;
  display_name: string;
  client_code: string | null;
  status: "active" | "prospect" | "inactive";
  address_id: string | null;
  address_kind: "mailing" | "risk" | "billing" | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
};

type PartyRow = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  email: string | null;
  phone: string | null;
  role_in_household: "primary" | "spouse" | "member" | "dependent";
  casl_consent_at: string | null;
};

type PolicyRow = {
  id: string;
  line_code: string;
  line_name: string;
  policy_number: string;
  description: string;
  status: string;
  effective_date: string;
  expiry_date: string;
  bill_type: string;
  carrier_name: string | null;
  carrier_code: string | null;
  carrier_is_fixture: boolean | null;
  premium_cents: number;
  source: string | null;
  estimated_premium_cents: number;
  commission_rate: string | null;
  commission_cents: number;
  agency_balance_cents: number;
  invoice_to: string | null;
  comment: string | null;
};

/** Lists households for the locate/search screen. */
export async function listHouseholds(ctx: TenantContext) {
  return withTenant(ctx, async (db) => {
    const { rows } = await db.query<{
      id: string;
      display_name: string;
      client_code: string | null;
      status: string;
      policy_count: string | number;
    }>(`
      SELECT h.id,
             h.display_name,
             h.client_code,
             h.status,
             count(p.id) AS policy_count
      FROM households h
      LEFT JOIN policies p ON p.household_id = h.id
      GROUP BY h.id
      ORDER BY h.display_name
    `);

    return rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      clientCode: r.client_code,
      status: r.status as HouseholdRecord["status"],
      policyCount: Number(r.policy_count),
    }));
  });
}

/**
 * The household record: header, people, and the policy tree.
 *
 * Three queries in one transaction rather than one join returning a cartesian
 * product of parties x policies, which would need de-duplication in JS and
 * misreport counts. One transaction keeps them consistent with each other.
 */
export async function getHouseholdRecord(
  ctx: TenantContext,
  householdId: string,
): Promise<HouseholdRecord | null> {
  return withTenant(ctx, async (db) => {
    const { rows: householdRows } = await db.query<HouseholdRow>(
      `
      SELECT h.id, h.display_name, h.client_code, h.status,
             a.id AS address_id, a.kind AS address_kind,
             a.line1, a.line2, a.city, a.province, a.postal_code
      FROM households h
      LEFT JOIN LATERAL (
        SELECT * FROM addresses
        WHERE household_id = h.id AND kind = 'mailing'
        ORDER BY created_at LIMIT 1
      ) a ON true
      WHERE h.id = $1
      `,
      [householdId],
    );

    const h = householdRows[0];
    // Not found and not-permitted are indistinguishable here, on purpose: RLS
    // hides other tenants' rows, so a probe cannot tell "no such household"
    // from "not yours".
    if (!h) return null;

    const { rows: parties } = await db.query<PartyRow>(
      `
      SELECT id, first_name, last_name, date_of_birth, email, phone,
             role_in_household, casl_consent_at
      FROM parties
      WHERE household_id = $1
      ORDER BY CASE role_in_household
                 WHEN 'primary' THEN 0 WHEN 'spouse' THEN 1
                 WHEN 'member'  THEN 2 ELSE 3 END,
               last_name, first_name
      `,
      [householdId],
    );

    const { rows: policies } = await db.query<PolicyRow>(
      `
      SELECT p.id, p.line_code, pl.name AS line_name, p.policy_number, p.description,
             p.status, p.effective_date, p.expiry_date, p.bill_type,
             c.name AS carrier_name, c.code AS carrier_code, c.is_fixture AS carrier_is_fixture,
             p.premium_cents, p.source, p.estimated_premium_cents,
             p.commission_rate, p.commission_cents, p.agency_balance_cents,
             p.invoice_to, p.comment
      FROM policies p
      JOIN policy_lines pl ON pl.code = p.line_code
      LEFT JOIN carriers c ON c.id = p.carrier_id
      WHERE p.household_id = $1
      ORDER BY p.line_code
      `,
      [householdId],
    );

    return {
      id: h.id,
      displayName: h.display_name,
      clientCode: h.client_code,
      status: h.status,
      address: h.address_id
        ? {
            id: h.address_id,
            kind: h.address_kind ?? "mailing",
            line1: h.line1 ?? "",
            line2: h.line2,
            city: h.city ?? "",
            province: h.province ?? "",
            postalCode: h.postal_code ?? "",
          }
        : null,
      parties: parties.map((p) => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        dateOfBirth: p.date_of_birth,
        email: p.email,
        phone: p.phone,
        roleInHousehold: p.role_in_household,
        caslConsentAt: p.casl_consent_at,
      })),
      policies: policies.map(toPolicyDetail),
    } satisfies HouseholdRecord;
  });
}

/** Service history for the household — the prototype's transactions table. */
export async function listHouseholdTransactions(
  ctx: TenantContext,
  householdId: string,
): Promise<TransactionSummary[]> {
  return withTenant(ctx, async (db) => {
    const { rows } = await db.query<{
      id: string;
      seq: number;
      type_code: string;
      type_name: string;
      description: string;
      state: string;
      effective_date: string | null;
      created_at: Date;
      actor_name: string | null;
    }>(
      `
      SELECT t.id, t.seq, t.type_code, tt.name AS type_name, t.description,
             t.state, t.effective_date, t.created_at,
             u.full_name AS actor_name
      FROM transactions t
      JOIN transaction_types tt ON tt.code = t.type_code
      LEFT JOIN users u ON u.id = t.created_by
      WHERE t.household_id = $1
      ORDER BY t.seq DESC
      `,
      [householdId],
    );

    return rows.map((r) => ({
      id: r.id,
      seq: r.seq,
      typeCode: r.type_code as TransactionSummary["typeCode"],
      typeName: r.type_name,
      description: r.description,
      state: r.state as TransactionSummary["state"],
      effectiveDate: r.effective_date,
      createdAt: r.created_at.toISOString(),
      actorName: r.actor_name,
    }));
  });
}

function toPolicyDetail(r: PolicyRow): PolicyDetail {
  return {
    id: r.id,
    lineCode: r.line_code as PolicyDetail["lineCode"],
    lineName: r.line_name,
    policyNumber: r.policy_number,
    description: r.description,
    status: r.status as PolicyDetail["status"],
    effectiveDate: r.effective_date,
    expiryDate: r.expiry_date,
    billType: r.bill_type as PolicyDetail["billType"],
    carrierName: r.carrier_name,
    carrierCode: r.carrier_code,
    carrierIsFixture: r.carrier_is_fixture ?? false,
    premiumCents: r.premium_cents,
    source: r.source,
    estimatedPremiumCents: r.estimated_premium_cents,
    // numeric comes back as a string; Number() here keeps the contract honest.
    commissionRate: r.commission_rate === null ? null : Number(r.commission_rate),
    commissionCents: r.commission_cents,
    agencyBalanceCents: r.agency_balance_cents,
    invoiceTo: r.invoice_to,
    comment: r.comment,
  };
}
