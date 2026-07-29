import { z } from 'zod';

/* ============================================================
   @insurimple/contracts — the single source of shared types.
   New shared types land HERE first (CLAUDE.md §6). Both the API
   and the web app import from this package; neither redefines shapes.
   These mirror the validated PostgreSQL schema (packages/db).
   ============================================================ */

/** Transaction lifecycle — must match the DB state-machine guard (0005_transactions.sql). */
export const txnState = z.enum([
  'draft',
  'doc_generated',
  'sig_pending',
  'signed',
  'submitted',
  'carrier_ack',
  'completed',
  'rejected',
]);
export type TxnState = z.infer<typeof txnState>;

/** Transaction types — the spine's configurable actions across modules. */
export const txnType = z.enum([
  'new_business',
  'renewal',
  'endorsement',
  'cancellation',
  'reinstatement',
  'remarket',
  'claim_fnol',
]);
export type TxnType = z.infer<typeof txnType>;

/** Lines of business (P&C module). */
export const line = z.enum([
  'auto',
  'property',
  'tenant',
  'condo',
  'umbrella',
  'commercial',
  'life',
]);
export type Line = z.infer<typeof line>;

/** The only legal state transitions. Mirrors the DB trigger; used for optimistic UI. */
export const TXN_TRANSITIONS: ReadonlyArray<readonly [TxnState, TxnState]> = [
  ['draft', 'doc_generated'],
  ['doc_generated', 'sig_pending'],
  ['sig_pending', 'signed'],
  ['signed', 'submitted'],
  ['submitted', 'carrier_ack'],
  ['carrier_ack', 'completed'],
  ['submitted', 'rejected'],
  ['carrier_ack', 'rejected'],
  ['rejected', 'draft'],
];

export function canTransition(from: TxnState, to: TxnState): boolean {
  return TXN_TRANSITIONS.some(([a, b]) => a === from && b === to);
}

/* ---- API DTOs ---- */

export const openTxnDto = z.object({
  txnType,
  accountId: z.string().uuid(),
  policyId: z.string().uuid().optional(),
  carrierId: z.string().uuid().optional(),
  reason: z.string().max(500).optional(),
  effectiveDate: z.string().optional(),
  reference: z.string().max(40).optional(),
});
export type OpenTxnDto = z.infer<typeof openTxnDto>;

export const txnSummary = z.object({
  id: z.string().uuid(),
  reference: z.string().nullable(),
  txn_type: txnType,
  state: txnState,
  reason: z.string().nullable(),
  effective_date: z.string().nullable(),
  opened_at: z.string(),
  closed_at: z.string().nullable(),
  account_name: z.string().optional(),
  carrier_name: z.string().nullable().optional(),
});
export type TxnSummary = z.infer<typeof txnSummary>;

export const txnEvent = z.object({
  from_state: txnState.nullable(),
  to_state: txnState,
  actor: z.string(),
  at: z.string(),
});
export type TxnEvent = z.infer<typeof txnEvent>;

/** GET /txns/:id — the transaction with its lifecycle history and hangers-on. */
export const txnDocument = z.object({
  id: z.string().uuid(),
  doc_type: z.string(),
  filename: z.string(),
  retention_until: z.string().nullable(),
});
export type TxnDocument = z.infer<typeof txnDocument>;

export const txnSubmission = z.object({
  channel: z.string(),
  status: z.string(),
  carrier_ref: z.string().nullable(),
  submitted_at: z.string().nullable(),
  acknowledged_at: z.string().nullable(),
});
export type TxnSubmission = z.infer<typeof txnSubmission>;

export const txnDetail = z.object({
  id: z.string().uuid(),
  reference: z.string().nullable(),
  txn_type: txnType,
  state: txnState,
  reason: z.string().nullable(),
  effective_date: z.string().nullable(),
  opened_at: z.string(),
  closed_at: z.string().nullable(),
  account_id: z.string().uuid(),
  policy_id: z.string().uuid().nullable(),
  carrier_id: z.string().uuid().nullable(),
  account_name: z.string().nullable().optional(),
  carrier_name: z.string().nullable().optional(),
  events: z.array(txnEvent),
  submissions: z.array(txnSubmission),
  documents: z.array(txnDocument),
});
export type TxnDetail = z.infer<typeof txnDetail>;

export const accountKind = z.enum(['personal', 'commercial', 'benefits']);
export type AccountKind = z.infer<typeof accountKind>;

export const accountStatus = z.enum([
  'prospect', 'active', 'review', 'cancelling', 'lapsed', 'closed',
]);
export type AccountStatus = z.infer<typeof accountStatus>;

export const accountSummary = z.object({
  id: z.string().uuid(),
  lookup_code: z.string().nullable(),
  display_name: z.string(),
  kind: accountKind,
  status: accountStatus,
  source: z.string().nullable(),
  policy_count: z.union([z.number(), z.string()]),
  annual_premium: z.union([z.number(), z.string()]),
});
export type AccountSummary = z.infer<typeof accountSummary>;

/* ============================================================
   Household detail (T1.2) — the anchor screen's shape. Mirrors
   the RLS-scoped GET /accounts/:id response. Numeric columns come
   back from pg as strings, so money/counts are string | number.
   ============================================================ */

/** Postgres numeric → string over the wire; keep both for the UI's Number(). */
const money = z.union([z.number(), z.string()]).nullable();

export const consentChannel = z.enum(['email', 'phone', 'sms', 'mail']);
export type ConsentChannel = z.infer<typeof consentChannel>;

export const consentBasis = z.enum(['express', 'implied', 'did_not_obtain', 'withdrawn']);
export type ConsentBasis = z.infer<typeof consentBasis>;

/** CASL consent as a typed row (never a free-text comment blob — the Epic fix). */
export const consentRow = z.object({
  channel: consentChannel,
  basis: consentBasis,
  captured_at: z.string().nullable(),
  expires_at: z.string().nullable(),
  source: z.string().nullable(),
});
export type ConsentRow = z.infer<typeof consentRow>;

export const partyRow = z.object({
  id: z.string().uuid(),
  role: z.string(),
  is_primary: z.boolean(),
  party_type: z.enum(['person', 'organization']),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.record(z.string(), z.unknown()).nullable(),
});
export type PartyRow = z.infer<typeof partyRow>;

export const driverRow = z.object({
  party_id: z.string().uuid(),
  name: z.string(),
  licence_number: z.string().nullable(),
  licence_class: z.string().nullable(),
  at_fault_count: z.union([z.number(), z.string()]),
});
export type DriverRow = z.infer<typeof driverRow>;

export const vehicleRow = z.object({
  id: z.string().uuid(),
  year: z.number().nullable(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  vin: z.string().nullable(),
  primary_use: z.string().nullable(),
  annual_km: z.number().nullable(),
  ownership: z.string().nullable(),
});
export type VehicleRow = z.infer<typeof vehicleRow>;

/** Dwelling risk detail — the property equivalent of the vehicle record. */
export const locationRow = z.object({
  id: z.string().uuid(),
  address: z.record(z.string(), z.unknown()).nullable(),
  occupancy: z.string().nullable(),
  year_built: z.number().nullable(),
  construction: z.string().nullable(),
  roof_age: z.number().nullable(),
  heating: z.string().nullable(),
  has_knob_tube: z.boolean().nullable(),
  has_oil_tank: z.boolean().nullable(),
  replacement_cost: money,
});
export type LocationRow = z.infer<typeof locationRow>;

export const lossRow = z.object({
  loss_date: z.string().nullable(),
  loss_type: z.string().nullable(),
  at_fault: z.boolean().nullable(),
  amount: money,
  insured_from: z.string().nullable(),
  insured_to: z.string().nullable(),
});
export type LossRow = z.infer<typeof lossRow>;

export const interestRow = z.object({
  kind: z.string(),          // 'Lienholder' | 'Mortgagee'
  name: z.string(),
  on: z.string(),            // the risk it attaches to
});
export type InterestRow = z.infer<typeof interestRow>;

export const endorsementRow = z.object({
  form_code: z.string(),
  description: z.string().nullable(),
  premium: money,
  effective_date: z.string().nullable(),
});
export type EndorsementRow = z.infer<typeof endorsementRow>;

export const coverageRow = z.object({
  csio_code: z.string().nullable(),
  description: z.string(),
  limit_amount: money,
  deductible: money,
  premium: money,
});
export type CoverageRow = z.infer<typeof coverageRow>;

/** One policy line, with the Epic tree branches hung off it. */
export const policyLineDetail = z.object({
  id: z.string().uuid(),
  policy_number: z.string().nullable(),
  line,
  status: z.enum(['quoted', 'bound', 'in_force', 'cancelled', 'lapsed', 'expired']),
  carrier_name: z.string().nullable(),
  effective_date: z.string().nullable(),
  expiry_date: z.string().nullable(),
  annual_premium: money,
  billing_type: z.string().nullable(),
  payment_plan: z.string().nullable(),
  coverages: z.array(coverageRow),
  drivers: z.array(driverRow),
  vehicles: z.array(vehicleRow),
  locations: z.array(locationRow),
  loss_history: z.array(lossRow),
  additional_interests: z.array(interestRow),
  forms_endorsements: z.array(endorsementRow),
});
export type PolicyLineDetail = z.infer<typeof policyLineDetail>;

/** The transaction chain (Epic "Service Summary"), each with its state history. */
export const serviceSummaryItem = z.object({
  id: z.string().uuid(),
  reference: z.string().nullable(),
  txn_type: txnType,
  state: txnState,
  reason: z.string().nullable(),
  effective_date: z.string().nullable(),
  opened_at: z.string(),
  closed_at: z.string().nullable(),
  carrier_name: z.string().nullable(),
  events: z.array(txnEvent),
});
export type ServiceSummaryItem = z.infer<typeof serviceSummaryItem>;

export const householdHeader = z.object({
  id: z.string().uuid(),
  lookup_code: z.string().nullable(),
  display_name: z.string(),
  kind: accountKind,
  status: accountStatus,
  source: z.string().nullable(),
  city: z.string().nullable(),
  servicing_broker: z.string().nullable(),
  servicing_csr: z.string().nullable(),
});
export type HouseholdHeader = z.infer<typeof householdHeader>;

export const householdDetail = z.object({
  header: householdHeader,
  applicants: z.array(partyRow),
  policies: z.array(policyLineDetail),
  service_summary: z.array(serviceSummaryItem),
  consent: z.array(consentRow),
});
export type HouseholdDetail = z.infer<typeof householdDetail>;

/* ============================================================
   Book metrics (admin/power-user dashboard). Tenant-scoped
   aggregates from GET /metrics; the same shape the preview
   dashboard computes from seed data.
   ============================================================ */

export const breakdownItem = z.object({
  label: z.string(),
  value: z.number(),
});
export type BreakdownItem = z.infer<typeof breakdownItem>;

export const pipelineItem = z.object({
  state: txnState,
  value: z.number(),
});
export type PipelineItem = z.infer<typeof pipelineItem>;

export const bookMetrics = z.object({
  book_size: z.number(),
  prospects: z.number(),
  policies_in_force: z.number(),
  premium_in_force: z.number(),
  active_transactions: z.number(),
  renewals_90d: z.number(),
  by_status: z.array(breakdownItem),
  by_source: z.array(breakdownItem),
  premium_by_carrier: z.array(breakdownItem),
  pipeline: z.array(pipelineItem),
});
export type BookMetrics = z.infer<typeof bookMetrics>;

/* ============================================================
   Work queues — the CSR's day (P&C leg §3). Tenant-scoped lists
   from GET /queues; the same shape the preview screen uses.
   ============================================================ */

export const activityPriority = z.enum(['low', 'medium', 'high']);
export type ActivityPriority = z.infer<typeof activityPriority>;

/** A diary item / abeyance — "My day". */
export const queueActivity = z.object({
  id: z.string().uuid(),
  title: z.string(),
  body: z.string().nullable(),
  activity_type: z.string(),
  priority: activityPriority,
  due_at: z.string().nullable(),
  overdue: z.boolean(),
  account_id: z.string().uuid().nullable(),
  account_name: z.string().nullable(),
  lookup_code: z.string().nullable(),
});
export type QueueActivity = z.infer<typeof queueActivity>;

/** A policy approaching renewal. */
export const queueRenewal = z.object({
  policy_id: z.string().uuid(),
  account_id: z.string().uuid(),
  account_name: z.string(),
  lookup_code: z.string().nullable(),
  line,
  carrier_name: z.string().nullable(),
  policy_number: z.string().nullable(),
  expiry_date: z.string().nullable(),
  days_to_expiry: z.number(),
  annual_premium: z.union([z.number(), z.string()]).nullable(),
});
export type QueueRenewal = z.infer<typeof queueRenewal>;

/** A transaction waiting on the carrier (submitted / acknowledged). */
export const queueSuspenseItem = z.object({
  txn_id: z.string().uuid(),
  reference: z.string().nullable(),
  txn_type: txnType,
  state: txnState,
  account_id: z.string().uuid(),
  account_name: z.string(),
  carrier_name: z.string().nullable(),
  reason: z.string().nullable(),
  opened_at: z.string(),
});
export type QueueSuspenseItem = z.infer<typeof queueSuspenseItem>;

export const workQueues = z.object({
  activities: z.array(queueActivity),
  renewals: z.array(queueRenewal),
  suspense: z.array(queueSuspenseItem),
});
export type WorkQueues = z.infer<typeof workQueues>;

/** The flat book — one row per policy, for the policies list. */
export const policyListRow = z.object({
  id: z.string().uuid(),
  policy_number: z.string().nullable(),
  line,
  status: z.enum(['quoted', 'bound', 'in_force', 'cancelled', 'lapsed', 'expired']),
  effective_date: z.string().nullable(),
  expiry_date: z.string().nullable(),
  annual_premium: money,
  billing_type: z.string().nullable(),
  payment_plan: z.string().nullable(),
  carrier_name: z.string().nullable(),
  account_id: z.string().uuid(),
  account_name: z.string(),
  lookup_code: z.string().nullable(),
  vehicle_count: z.number(),
  dwelling_count: z.number(),
  coverage_count: z.number(),
  days_to_expiry: z.number().nullable(),
});
export type PolicyListRow = z.infer<typeof policyListRow>;

/* ============================================================
   Claims — intake and carrier referral only. The carrier adjudicates;
   we own the evidence that the loss was reported and chased.
   ============================================================ */

export const claimStatus = z.enum([
  'open', 'acknowledged', 'in_progress', 'settled', 'closed', 'denied',
]);
export type ClaimStatus = z.infer<typeof claimStatus>;

export const claimRow = z.object({
  id: z.string().uuid(),
  claim_number: z.string().nullable(),
  loss_date: z.string().nullable(),
  reported_date: z.string().nullable(),
  status: claimStatus,
  adjuster: z.string().nullable(),
  reserve: money,
  paid: money,
  account_id: z.string().uuid(),
  account_name: z.string(),
  lookup_code: z.string().nullable(),
  policy_id: z.string().uuid().nullable(),
  policy_number: z.string().nullable(),
  line: z.string().nullable(),
  txn_id: z.string().uuid().nullable(),
  txn_reference: z.string().nullable(),
  txn_state: txnState.nullable(),
  carrier_name: z.string().nullable(),
  days_open: z.number(),
});
export type ClaimRow = z.infer<typeof claimRow>;

/* ============================================================
   Book & compliance — the principal broker's supervision view.
   Exceptions are DERIVED (what's missing), never a flag someone
   has to remember to set.
   ============================================================ */

export const bookSlice = z.object({
  label: z.string(),
  value: z.number(),
  premium: z.number(),
});
export type BookSlice = z.infer<typeof bookSlice>;

export const complianceOverview = z.object({
  book: z.object({
    by_line: z.array(bookSlice),
    by_carrier: z.array(bookSlice),
    by_expiry_month: z.array(bookSlice),
  }),
  retention: z.object({
    in_force: z.number(),
    cancelled: z.number(),
    lapsed: z.number(),
  }),
  exceptions: z.object({
    overdue_activities: z.array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        due_at: z.string().nullable(),
        account_name: z.string().nullable(),
        account_id: z.string().uuid().nullable(),
      }),
    ),
    unsigned_transactions: z.array(
      z.object({
        id: z.string().uuid(),
        reference: z.string().nullable(),
        txn_type: txnType,
        state: txnState,
        account_name: z.string(),
        account_id: z.string().uuid(),
      }),
    ),
    unacknowledged_submissions: z.array(
      z.object({
        id: z.string().uuid(),
        reference: z.string().nullable(),
        txn_type: txnType,
        account_name: z.string(),
        account_id: z.string().uuid(),
        submitted_at: z.string().nullable(),
        days_waiting: z.number(),
      }),
    ),
    licence_alerts: z.array(
      z.object({
        id: z.string().uuid(),
        full_name: z.string(),
        licence_class: z.string(),
        licence_number: z.string().nullable(),
        expires_on: z.string().nullable(),
        expired: z.boolean(),
      }),
    ),
    expired_in_force: z.array(
      z.object({
        id: z.string().uuid(),
        policy_number: z.string().nullable(),
        line,
        expiry_date: z.string().nullable(),
        days_past: z.number(),
        account_id: z.string().uuid(),
        account_name: z.string(),
      }),
    ),
    consent_gaps: z.array(
      z.object({
        account_id: z.string().uuid(),
        account_name: z.string(),
        lookup_code: z.string().nullable(),
      }),
    ),
  }),
});
export type ComplianceOverview = z.infer<typeof complianceOverview>;

/* ============================================================
   Billing & receivables. The ledger is double-entry and append-only;
   screens read it, the transaction spine writes it. Trust surplus
   below zero is a shortfall — a RIBO reportable event.
   ============================================================ */

export const ledgerEntry = z.object({
  id: z.string().uuid(),
  book: z.enum(['trust', 'general']),
  reference: z.string().nullable(),
  description: z.string().nullable(),
  entry_date: z.string(),
  posted: z.boolean(),
  amount: z.union([z.number(), z.string()]),
});
export type LedgerEntry = z.infer<typeof ledgerEntry>;

export const commissionRow = z.object({
  id: z.string().uuid(),
  period: z.string().nullable(),
  expected: money,
  received: money,
  variance: z.union([z.number(), z.string()]),
  status: z.enum(['open', 'matched', 'variance', 'written_off']),
  carrier_name: z.string().nullable(),
  policy_number: z.string().nullable(),
  line: z.string().nullable(),
  account_name: z.string().nullable(),
});
export type CommissionRow = z.infer<typeof commissionRow>;

export const trustHolding = z.object({
  account_id: z.string().uuid(),
  account_name: z.string(),
  lookup_code: z.string().nullable(),
  held_in_trust: z.union([z.number(), z.string()]),
});
export type TrustHolding = z.infer<typeof trustHolding>;

export const billingOverview = z.object({
  trust: z.object({
    assets: z.number(),
    liabilities: z.number(),
    surplus: z.number(),
  }),
  commission_summary: z.object({
    expected: z.number(),
    received: z.number(),
    variance: z.number(),
    open: z.number(),
    in_variance: z.number(),
  }),
  entries: z.array(ledgerEntry),
  commissions: z.array(commissionRow),
  held_in_trust: z.array(trustHolding),
});
export type BillingOverview = z.infer<typeof billingOverview>;

/* ============================================================
   Proofs & documents. Every issued proof is a first-class record
   with the 6-year RIBO retention clock, not a file in a folder.
   ============================================================ */

export const documentRow = z.object({
  id: z.string().uuid(),
  doc_type: z.string(),
  filename: z.string(),
  source: z.string(),
  issued_to: z.string().nullable(),
  retention_until: z.string().nullable(),
  created_at: z.string(),
  account_id: z.string().uuid().nullable(),
  account_name: z.string().nullable(),
  lookup_code: z.string().nullable(),
  policy_id: z.string().uuid().nullable(),
  policy_number: z.string().nullable(),
  line: z.string().nullable(),
});
export type DocumentRow = z.infer<typeof documentRow>;

export const documentTemplate = z.object({
  code: z.string(),
  name: z.string(),
  version: z.number(),
});
export type DocumentTemplate = z.infer<typeof documentTemplate>;

export const issuedProof = z.object({
  id: z.string().uuid(),
  doc_type: z.string(),
  filename: z.string(),
  issued_to: z.string().nullable(),
  retention_until: z.string().nullable(),
  created_at: z.string(),
  rendered_body: z.string(),
  template_name: z.string(),
});
export type IssuedProof = z.infer<typeof issuedProof>;

/* ============================================================
   Authority — licence (invariant 3) and entitlement (invariant 4).
   GET /me returns what the caller may actually do; `capabilities`
   comes from the SAME DB function the write guard uses, so the UI
   can never disagree with enforcement.
   ============================================================ */

export const moduleCode = z.enum(['pc', 'life', 'mortgage']);
export type ModuleCode = z.infer<typeof moduleCode>;

export const licenceClass = z.enum([
  'ribo_l1', 'ribo_l2', 'ribo_l3', 'llqp', 'mortgage_agent', 'unlicensed',
]);
export type LicenceClass = z.infer<typeof licenceClass>;

export const licenceRow = z.object({
  id: z.string().uuid(),
  licence_class: licenceClass,
  licence_number: z.string().nullable(),
  regulator: z.string().nullable(),
  issued_on: z.string().nullable(),
  expires_on: z.string().nullable(),
  status: z.enum(['active', 'suspended', 'revoked', 'lapsed']),
  expired: z.boolean(),
  expiring_soon: z.boolean(),
});
export type LicenceRow = z.infer<typeof licenceRow>;

export const roleGrant = z.object({
  role_code: z.string(),
  role_name: z.string(),
  licence_id: z.string().uuid().nullable(),
  granted_at: z.string(),
});
export type RoleGrant = z.infer<typeof roleGrant>;

/** A staff member's role grant as seen on the team roster. */
export const teamGrant = roleGrant.extend({
  id: z.string().uuid(),
  staff_id: z.string().uuid(),
});
export type TeamGrant = z.infer<typeof teamGrant>;

export const teamLicence = licenceRow.extend({
  staff_id: z.string().uuid(),
});
export type TeamLicence = z.infer<typeof teamLicence>;

export const teamMember = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  email: z.string(),
  role: z.string(),
  ribo_level: z.string().nullable(),
  licences: z.array(teamLicence),
  grants: z.array(teamGrant),
});
export type TeamMember = z.infer<typeof teamMember>;

export const teamRoster = z.object({
  roles: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      description: z.string().nullable(),
    }),
  ),
  members: z.array(teamMember),
});
export type TeamRoster = z.infer<typeof teamRoster>;

export const meProfile = z.object({
  staff: z
    .object({
      id: z.string().uuid(),
      full_name: z.string(),
      email: z.string(),
      role: z.string(),
      ribo_level: z.string().nullable(),
      tenant_name: z.string().nullable(),
    })
    .nullable(),
  licences: z.array(licenceRow),
  roles: z.array(roleGrant),
  capabilities: z.array(z.string()),
  modules: z.array(moduleCode),
});
export type MeProfile = z.infer<typeof meProfile>;
