/**
 * P&C domain contracts.
 *
 * Invariant #6: this package is the single type source. Types are derived from
 * zod schemas rather than declared twice, so a schema change cannot leave a
 * stale TypeScript type behind.
 *
 * Vocabulary deliberately mirrors Epic — agency balance, bill, invoice-to,
 * estimated premium — because brokers migrating off Epic need to recognise the
 * fields. See docs/pc-leg-page-list.md.
 */

import { z } from "zod";

/* ------------------------------------------------------------------ money -- */

/**
 * Money is integer cents everywhere. Never a float: 0.1 + 0.2 problems in a
 * trust ledger are a regulatory matter, not a rounding annoyance.
 */
export const Cents = z.number().int();
export type Cents = z.infer<typeof Cents>;

/** Format cents as Canadian currency for display. */
export function formatCents(cents: Cents): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

/* ------------------------------------------------------------ enumerations -- */

export const ModuleCode = z.enum(["pc", "life", "mortgage"]);
export type ModuleCode = z.infer<typeof ModuleCode>;

export const PolicyLineCode = z.enum(["AUTO", "TENA", "HOME", "COND", "SEAS", "UMBR"]);
export type PolicyLineCode = z.infer<typeof PolicyLineCode>;

/**
 * Full status set required by pc-leg-page-list.md §10. The prototype tree only
 * showed in-force and new-business; a working book needs all of these.
 */
export const PolicyStatus = z.enum([
  "pending",
  "in_force",
  "lapsed",
  "cancelled",
  "remarket_in_progress",
  "expired",
]);
export type PolicyStatus = z.infer<typeof PolicyStatus>;

export const BillType = z.enum(["direct", "agency"]);
export type BillType = z.infer<typeof BillType>;

/**
 * Transaction states. Mirrors `transaction_transitions` in migration 0006 —
 * the database is authoritative; this exists so the UI can label states.
 */
export const TransactionState = z.enum([
  "draft",
  "submitted",
  "carrier_review",
  "bound",
  "issued",
  "completed",
  "rejected",
  "cancelled",
]);
export type TransactionState = z.infer<typeof TransactionState>;

export const TransactionType = z.enum([
  "new_business",
  "endorsement",
  "renewal",
  "cancellation",
  "reinstatement",
  "remarket",
]);
export type TransactionType = z.infer<typeof TransactionType>;

/* ---------------------------------------------------------------- entities -- */

export const Address = z.object({
  id: z.string().uuid(),
  kind: z.enum(["mailing", "risk", "billing"]),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  province: z.string(),
  postalCode: z.string(),
});
export type Address = z.infer<typeof Address>;

export const Party = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  roleInHousehold: z.enum(["primary", "spouse", "member", "dependent"]),
  /** Null means no consent evidence on file — never treat as implied consent. */
  caslConsentAt: z.string().nullable(),
});
export type Party = z.infer<typeof Party>;

export const PolicySummary = z.object({
  id: z.string().uuid(),
  lineCode: PolicyLineCode,
  lineName: z.string(),
  policyNumber: z.string(),
  description: z.string(),
  status: PolicyStatus,
  effectiveDate: z.string(),
  expiryDate: z.string(),
  billType: BillType,
  carrierName: z.string().nullable(),
  carrierCode: z.string().nullable(),
  /** Invariant #7: a fixture must be visibly distinguishable in the UI. */
  carrierIsFixture: z.boolean(),
  premiumCents: Cents,
});
export type PolicySummary = z.infer<typeof PolicySummary>;

/** The detail panel — Epic accounting vocabulary. */
export const PolicyDetail = PolicySummary.extend({
  source: z.string().nullable(),
  estimatedPremiumCents: Cents,
  commissionRate: z.number().nullable(),
  commissionCents: Cents,
  agencyBalanceCents: Cents,
  invoiceTo: z.string().nullable(),
  comment: z.string().nullable(),
});
export type PolicyDetail = z.infer<typeof PolicyDetail>;

export const TransactionSummary = z.object({
  id: z.string().uuid(),
  seq: z.number().int(),
  typeCode: TransactionType,
  typeName: z.string(),
  description: z.string(),
  state: TransactionState,
  effectiveDate: z.string().nullable(),
  createdAt: z.string(),
  actorName: z.string().nullable(),
});
export type TransactionSummary = z.infer<typeof TransactionSummary>;

export const HouseholdRecord = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  clientCode: z.string().nullable(),
  status: z.enum(["active", "prospect", "inactive"]),
  address: Address.nullable(),
  parties: z.array(Party),
  policies: z.array(PolicySummary),
});
export type HouseholdRecord = z.infer<typeof HouseholdRecord>;

/* ------------------------------------------------------------ presentation -- */

/** Human labels. Sentence case throughout — never Title Case (brand brief). */
export const policyStatusLabel: Record<PolicyStatus, string> = {
  pending: "Pending",
  in_force: "In force",
  lapsed: "Lapsed",
  cancelled: "Cancelled",
  remarket_in_progress: "Remarket in progress",
  expired: "Expired",
};

export const transactionStateLabel: Record<TransactionState, string> = {
  draft: "Draft",
  submitted: "Submitted",
  carrier_review: "Carrier review",
  bound: "Bound",
  issued: "Issued",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/** Semantic tone for badges. Maps to design-system tone tokens, not colors. */
export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";

export const policyStatusTone: Record<PolicyStatus, Tone> = {
  pending: "info",
  in_force: "success",
  lapsed: "warning",
  cancelled: "danger",
  remarket_in_progress: "accent",
  expired: "neutral",
};

export const transactionStateTone: Record<TransactionState, Tone> = {
  draft: "neutral",
  submitted: "info",
  carrier_review: "info",
  bound: "accent",
  issued: "success",
  completed: "success",
  rejected: "danger",
  cancelled: "neutral",
};

/** "Dec 24, 2025 → Dec 24, 2026", the prototype's term format. */
export function formatTerm(effective: string, expiry: string): string {
  return `${formatDate(effective)} → ${formatDate(expiry)}`;
}

/**
 * Dates arrive as YYYY-MM-DD strings and are formatted without constructing a
 * Date, which would apply a timezone shift and can move the day.
 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}
