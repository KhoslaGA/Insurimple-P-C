import { z } from "zod";

/* ============================================================================
 * Shared spine — the party/policy/activity/consent core that every module
 * reads. Marketing does not own these; it consumes them. When the NestJS +
 * Postgres backend is wired, these schemas are the contract the API must meet.
 * ==========================================================================*/

/** Subscription modules gated per-tenant by `tenant_modules` (invariant #4). */
export const ModuleKey = z.enum(["p_and_c", "life", "mortgage", "marketing"]);
export type ModuleKey = z.infer<typeof ModuleKey>;

export const Tenant = z.object({
  id: z.string(),
  name: z.string(),
  /** Drives white-label theming via [data-theme] on the DS token layer. */
  themeKey: z.string(),
  /** IANA timezone — quiet-hours + scheduling resolve against this. */
  timezone: z.string(),
  /** Entitlements on file. UI hiding is not enforcement — this is. */
  modules: z.array(ModuleKey),
});
export type Tenant = z.infer<typeof Tenant>;

export const PartyKind = z.enum(["person", "business"]);
export type PartyKind = z.infer<typeof PartyKind>;

export const Lifecycle = z.enum(["visitor", "lead", "client"]);
export type Lifecycle = z.infer<typeof Lifecycle>;

export const Party = z.object({
  id: z.string(),
  tenantId: z.string(),
  kind: PartyKind,
  /** Canonical client code (see client-code spec) — frozen once issued. */
  clientCode: z.string(),
  displayName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  lifecycle: Lifecycle,
  /** First-transaction date; drives client-tenure segments. ISO date. */
  tenureStart: z.string().nullable(),
});
export type Party = z.infer<typeof Party>;

export const PolicyLine = z.enum([
  "auto",
  "property",
  "tenant",
  "condo",
  "umbrella",
]);
export type PolicyLine = z.infer<typeof PolicyLine>;

export const PolicyStatus = z.enum([
  "in_force",
  "pending",
  "lapsed",
  "cancelled",
]);
export type PolicyStatus = z.infer<typeof PolicyStatus>;

export const Policy = z.object({
  id: z.string(),
  tenantId: z.string(),
  partyId: z.string(),
  line: PolicyLine,
  carrier: z.string(),
  premium: z.number(),
  effectiveDate: z.string(),
  renewalDate: z.string(),
  status: PolicyStatus,
});
export type Policy = z.infer<typeof Policy>;

export const ActivityType = z.enum([
  "call",
  "email",
  "note",
  "marketing_send",
  "transaction",
  "policy_change",
]);
export type ActivityType = z.infer<typeof ActivityType>;

/** Every marketing send lands here as an Activity (design rule #4). */
export const Activity = z.object({
  id: z.string(),
  tenantId: z.string(),
  partyId: z.string(),
  type: ActivityType,
  subject: z.string(),
  occurredAt: z.string(),
  campaignId: z.string().nullable().optional(),
  sequenceId: z.string().nullable().optional(),
  sendId: z.string().nullable().optional(),
});
export type Activity = z.infer<typeof Activity>;

/* --------------------------------- CASL ---------------------------------- */

export const ConsentChannel = z.enum(["email", "sms"]);
export type ConsentChannel = z.infer<typeof ConsentChannel>;

/** express | implied-EBR (2y) | implied-inquiry (6m) | none. */
export const ConsentClass = z.enum([
  "express",
  "implied_ebr",
  "implied_inquiry",
  "none",
]);
export type ConsentClass = z.infer<typeof ConsentClass>;

export const ConsentRecord = z.object({
  id: z.string(),
  tenantId: z.string(),
  partyId: z.string(),
  channel: ConsentChannel,
  class: ConsentClass,
  source: z.string(),
  capturedAt: z.string(),
  /** Computed at capture; null for express (until revoked) / none. ISO date. */
  expiresAt: z.string().nullable(),
});
export type ConsentRecord = z.infer<typeof ConsentRecord>;

function shiftIsoDate(iso: string, years = 0, months = 0): string {
  const [y, m, dd] = iso.slice(0, 10).split("-").map(Number) as [
    number,
    number,
    number,
  ];
  // Component math with end-of-month clamping, matching Postgres interval
  // addition (e.g. 2024-02-29 + 2 years => 2026-02-28, not 2026-03-01).
  const totalMonth = y * 12 + (m - 1) + years * 12 + months;
  const ny = Math.floor(totalMonth / 12);
  const nm = totalMonth - ny * 12; // 0-based month
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  const nd = Math.min(dd, lastDay);
  return `${ny}-${String(nm + 1).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
}

/**
 * CASL consent-expiry math — the skeleton TM.1 formalizes at the DB layer.
 *  - express        -> no expiry (revocation only)
 *  - implied_ebr    -> capturedAt + 2 years  (existing business relationship)
 *  - implied_inquiry-> capturedAt + 6 months (inquiry)
 *  - none           -> no consent
 */
export function computeConsentExpiry(
  consentClass: ConsentClass,
  capturedAtIso: string,
): string | null {
  switch (consentClass) {
    case "express":
    case "none":
      return null;
    case "implied_ebr":
      return shiftIsoDate(capturedAtIso, 2, 0);
    case "implied_inquiry":
      return shiftIsoDate(capturedAtIso, 0, 6);
  }
}

/** A record grants a marketing send only if it is a real, unexpired consent. */
export function isMarketingConsentValid(
  record: ConsentRecord,
  asOfIso: string,
): boolean {
  if (record.class === "none") return false;
  if (record.expiresAt === null) return true;
  return asOfIso.slice(0, 10) <= record.expiresAt;
}
