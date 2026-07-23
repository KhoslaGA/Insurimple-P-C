import {
  computeConsentExpiry,
  type Activity,
  type ConsentRecord,
  type Party,
  type Policy,
  type Tenant,
} from "../spine";
import type {
  Campaign,
  Sequence,
  Suppression,
} from "../marketing";

/* ============================================================================
 * Deterministic mock spine + marketing data. FIXTURE ONLY — invariant #7:
 * fixtures can never pass as live carrier/client data. No Date.now / Math.random;
 * everything is anchored to REFERENCE_DATE so renders are reproducible.
 * ==========================================================================*/

export const REFERENCE_DATE = "2026-07-23";

export type Dataset = {
  tenants: Tenant[];
  parties: Party[];
  policies: Policy[];
  consent: ConsentRecord[];
  activities: Activity[];
  campaigns: Campaign[];
  sequences: Sequence[];
  suppressions: Suppression[];
  weeklyEngagement: {
    label: string;
    sent: number;
    delivered: number;
    engaged: number;
  }[];
};

const KLC = "klc";

const tenants: Tenant[] = [
  {
    id: KLC,
    name: "KLC Group",
    themeKey: "klc",
    timezone: "America/Toronto",
    // Buys BOTH P&C and Marketing — the two surfaces share one book.
    modules: ["p_and_c", "marketing"],
  },
  {
    id: "northpeak",
    name: "NorthPeak Insurance",
    themeKey: "northpeak",
    timezone: "America/Toronto",
    // P&C only — marketing surfaces are entitlement-gated off for this tenant.
    modules: ["p_and_c"],
  },
];

// Parties on KLC's book. clientCode follows the STEM+SEQ spec informally here.
const partySpecs: [string, string, string, string][] = [
  ["p1", "Susan Nault", "susan.nault@example.ca", "2019-03-04"],
  ["p2", "Marcus Boivin", "marcus.boivin@example.ca", "2021-06-18"],
  ["p3", "Renée O'Brien", "renee.obrien@example.ca", "2018-11-02"],
  ["p4", "Jean-Luc Berger", "jl.berger@example.ca", "2023-01-27"],
  ["p5", "Priya Anand", "priya.anand@example.ca", "2020-09-15"],
  ["p6", "Tom Whitfield", "tom.whitfield@example.ca", "2016-05-30"],
  ["p7", "Amara Okoye", "amara.okoye@example.ca", "2022-02-11"],
  ["p8", "Dylan Cormier", "dylan.cormier@example.ca", "2024-04-09"],
  ["p9", "Grace Lam", "grace.lam@example.ca", "2017-08-21"],
  ["p10", "Owen Fraser", "owen.fraser@example.ca", "2025-01-14"],
  ["p11", "Nadia Haddad", "nadia.haddad@example.ca", "2019-12-01"],
  ["p12", "Brampton Auto Body", "ops@bramptonauto.example.ca", "2015-07-19"],
];

const parties: Party[] = partySpecs.map(([id, name, email, tenure], i) => ({
  id,
  tenantId: KLC,
  kind: id === "p12" ? "business" : "person",
  clientCode:
    id === "p12"
      ? "XBRAMP001"
      : `${name.split(" ")[1]!.slice(0, 4).toUpperCase()}${name
          .slice(0, 2)
          .toUpperCase()}00${(i % 9) + 1}`,
  displayName: name,
  email,
  phone: null,
  lifecycle: "client",
  tenureStart: tenure,
}));

// Consent per party (email channel). Mix of classes + one no-consent (p10).
const consentSpecs: [string, ConsentRecord["class"], string][] = [
  ["p1", "express", "2024-02-10"],
  ["p2", "implied_ebr", "2025-06-18"],
  ["p3", "express", "2023-05-04"],
  ["p4", "implied_ebr", "2025-01-27"],
  ["p5", "implied_inquiry", "2026-04-30"],
  ["p6", "express", "2022-05-30"],
  ["p7", "implied_ebr", "2024-02-11"],
  ["p8", "implied_inquiry", "2026-03-09"],
  ["p9", "express", "2021-08-21"],
  ["p10", "none", "2025-01-14"],
  ["p11", "implied_ebr", "2023-12-01"], // EBR captured >2y ago -> expired
  ["p12", "express", "2020-07-19"],
];

const consent: ConsentRecord[] = consentSpecs.map(
  ([partyId, cls, capturedAt], i) => ({
    id: `c${i + 1}`,
    tenantId: KLC,
    partyId,
    channel: "email",
    class: cls,
    source: cls === "implied_inquiry" ? "web_lead_intake" : "policy_binding",
    capturedAt,
    expiresAt: computeConsentExpiry(cls, capturedAt),
  }),
);

const policies: Policy[] = [
  policy("pol1", "p1", "auto", "Aviva", 1840, "2025-08-01", "2026-08-01"),
  policy("pol2", "p1", "property", "Aviva", 1220, "2025-08-01", "2026-08-01"),
  policy("pol3", "p2", "auto", "Intact", 2130, "2025-09-12", "2026-09-12"),
  policy("pol4", "p3", "property", "Wawanesa", 990, "2025-07-19", "2026-07-19"),
  policy("pol5", "p5", "auto", "Economical", 1560, "2025-10-02", "2026-10-02"),
  policy("pol6", "p6", "condo", "Intact", 640, "2025-06-30", "2026-06-30"),
  policy("pol7", "p9", "auto", "Aviva", 1980, "2025-08-21", "2026-08-21"),
  policy("pol8", "p12", "property", "Northbridge", 5400, "2025-07-19", "2026-07-19"),
];

function policy(
  id: string,
  partyId: string,
  line: Policy["line"],
  carrier: string,
  premium: number,
  effectiveDate: string,
  renewalDate: string,
): Policy {
  return {
    id,
    tenantId: KLC,
    partyId,
    line,
    carrier,
    premium,
    effectiveDate,
    renewalDate,
    status: "in_force",
  };
}

const campaigns: Campaign[] = [
  {
    id: "cmp1",
    tenantId: KLC,
    name: "August renewal reminders",
    channel: "email",
    templateId: "tpl1",
    segmentId: "seg1",
    status: "sent",
    scheduledAt: "2026-07-06",
    stats: { queued: 210, sent: 210, delivered: 204, bounced: 6, complained: 1, engaged: 96 },
  },
  {
    id: "cmp2",
    tenantId: KLC,
    name: "Home + auto bundle cross-sell",
    channel: "email",
    templateId: "tpl2",
    segmentId: "seg2",
    status: "sent",
    scheduledAt: "2026-07-13",
    stats: { queued: 148, sent: 148, delivered: 145, bounced: 3, complained: 0, engaged: 71 },
  },
  {
    id: "cmp3",
    tenantId: KLC,
    name: "Sewer backup coverage explainer",
    channel: "email",
    templateId: "tpl3",
    segmentId: "seg3",
    status: "sending",
    scheduledAt: "2026-07-22",
    stats: { queued: 320, sent: 180, delivered: 176, bounced: 4, complained: 0, engaged: 40 },
  },
  {
    id: "cmp4",
    tenantId: KLC,
    name: "Winter tire season nudge",
    channel: "email",
    templateId: "tpl4",
    segmentId: "seg1",
    status: "scheduled",
    scheduledAt: "2026-09-15",
    stats: { queued: 0, sent: 0, delivered: 0, bounced: 0, complained: 0, engaged: 0 },
  },
  {
    id: "cmp5",
    tenantId: KLC,
    name: "New-client welcome",
    channel: "email",
    templateId: "tpl5",
    segmentId: "seg4",
    status: "draft",
    scheduledAt: null,
    stats: { queued: 0, sent: 0, delivered: 0, bounced: 0, complained: 0, engaged: 0 },
  },
];

const sequences: Sequence[] = [
  {
    id: "seq1",
    tenantId: KLC,
    name: "Renewal T-45 nurture",
    trigger: "renewal_t45",
    status: "active",
    stepCount: 4,
    enrolled: 132,
    active: 38,
    completed: 79,
    exited: 15,
  },
  {
    id: "seq2",
    tenantId: KLC,
    name: "New-client onboarding",
    trigger: "new_client",
    status: "active",
    stepCount: 3,
    enrolled: 54,
    active: 12,
    completed: 40,
    exited: 2,
  },
  {
    id: "seq3",
    tenantId: KLC,
    name: "Web lead follow-up",
    trigger: "lead_intake",
    status: "active",
    stepCount: 5,
    enrolled: 88,
    active: 25,
    completed: 51,
    exited: 12,
  },
];

const suppressions: Suppression[] = [
  { id: "sup1", tenantId: KLC, address: "unsub1@example.ca", channel: "email", reason: "unsubscribe", capturedAt: "2026-06-14" },
  { id: "sup2", tenantId: KLC, address: "bounce1@example.ca", channel: "email", reason: "bounce", capturedAt: "2026-07-06" },
  { id: "sup3", tenantId: KLC, address: "unsub2@example.ca", channel: "email", reason: "unsubscribe", capturedAt: "2026-07-11" },
  { id: "sup4", tenantId: KLC, address: "complaint1@example.ca", channel: "email", reason: "complaint", capturedAt: "2026-07-13" },
  { id: "sup5", tenantId: KLC, address: "stop1@example.ca", channel: "sms", reason: "sms_stop", capturedAt: "2026-07-18" },
  // Broker/system-owned suppression on a real party's address (a spam complaint)
  // — must survive a self-service resubscribe.
  { id: "sup6", tenantId: KLC, address: "marcus.boivin@example.ca", channel: "email", reason: "complaint", capturedAt: "2026-05-01" },
];

const weeklyEngagement = [
  { label: "Jun 1", sent: 120, delivered: 116, engaged: 48 },
  { label: "Jun 8", sent: 138, delivered: 133, engaged: 55 },
  { label: "Jun 15", sent: 96, delivered: 92, engaged: 39 },
  { label: "Jun 22", sent: 174, delivered: 168, engaged: 74 },
  { label: "Jun 29", sent: 152, delivered: 147, engaged: 66 },
  { label: "Jul 6", sent: 210, delivered: 204, engaged: 96 },
  { label: "Jul 13", sent: 148, delivered: 145, engaged: 71 },
  { label: "Jul 20", sent: 180, delivered: 176, engaged: 40 },
];

export const DATASET: Dataset = {
  tenants,
  parties,
  policies,
  consent,
  activities: [],
  campaigns,
  sequences,
  suppressions,
  weeklyEngagement,
};
