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

export const locationRow = z.object({
  id: z.string().uuid(),
  address: z.record(z.string(), z.unknown()).nullable(),
  occupancy: z.string().nullable(),
  year_built: z.number().nullable(),
  construction: z.string().nullable(),
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
