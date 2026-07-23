import {
  isMarketingConsentValid,
  type ModuleKey,
  type Tenant,
} from "../spine";
import type { MarketingDashboard } from "../marketing";
import { DATASET, REFERENCE_DATE } from "./seed";
import { listConsent, listSuppressions } from "./store";

/* ============================================================================
 * Mock data-access seam. Every reader is tenant-scoped and entitlement-aware,
 * mirroring how the real NestJS API (RLS + tenant_modules) will behave. Swap
 * this module's body for typed fetch calls and the UI does not change.
 * ==========================================================================*/

export function getTenant(tenantId: string): Tenant | null {
  return DATASET.tenants.find((t) => t.id === tenantId) ?? null;
}

/** Entitlement is the commercial boundary (invariant #4) — checked server-side. */
export function isModuleEntitled(tenantId: string, module: ModuleKey): boolean {
  const tenant = getTenant(tenantId);
  return tenant?.modules.includes(module) ?? false;
}

export function getMarketingDashboard(
  tenantId: string,
): MarketingDashboard | null {
  const tenant = getTenant(tenantId);
  if (!tenant) return null;

  const parties = DATASET.parties.filter((p) => p.tenantId === tenantId);
  // Consent + suppression come from the live store, so the dashboard reflects
  // preference-center changes (unsubscribes, opt-ins) immediately.
  const consent = listConsent(tenantId);
  const campaigns = DATASET.campaigns.filter((c) => c.tenantId === tenantId);
  const sequences = DATASET.sequences.filter((s) => s.tenantId === tenantId);
  const suppressions = listSuppressions(tenantId);

  // Consent coverage: marketable parties with a valid email consent today.
  const emailConsentByParty = new Map(
    consent.filter((c) => c.channel === "email").map((c) => [c.partyId, c]),
  );
  const withValidConsent = parties.filter((p) => {
    const rec = emailConsentByParty.get(p.id);
    return rec ? isMarketingConsentValid(rec, REFERENCE_DATE) : false;
  }).length;
  const consentCoverage =
    parties.length === 0 ? 0 : withValidConsent / parties.length;

  const activeCampaigns = campaigns.filter(
    (c) => c.status === "scheduled" || c.status === "sending" || c.status === "sent",
  ).length;

  const weeks = DATASET.weeklyEngagement;
  const last4 = weeks.slice(-4);
  const sentLast30d = last4.reduce((sum, w) => sum + w.sent, 0);

  const consentMix = [
    { label: "Express", value: countClass(consent, "express") },
    { label: "Implied — EBR", value: countClass(consent, "implied_ebr") },
    { label: "Implied — inquiry", value: countClass(consent, "implied_inquiry") },
    { label: "No consent", value: countClass(consent, "none") },
  ];

  const recentCampaigns = [...campaigns]
    .sort((a, b) => (b.scheduledAt ?? "").localeCompare(a.scheduledAt ?? ""))
    .slice(0, 5);

  return {
    tenantName: tenant.name,
    isSampleData: true,
    stats: {
      activeCampaigns,
      sentLast30d,
      consentCoverage,
      suppressedCount: suppressions.length,
      deltas: {
        activeCampaigns: 1,
        sentLast30d: 12,
        consentCoverage: 0.03,
        suppressedCount: 2,
      },
    },
    engagementSeries: {
      categories: weeks.map((w) => w.label),
      sent: weeks.map((w) => w.sent),
      delivered: weeks.map((w) => w.delivered),
      engaged: weeks.map((w) => w.engaged),
    },
    consentMix,
    sequences,
    recentCampaigns,
  };
}

function countClass(
  consent: { class: string }[],
  cls: string,
): number {
  return consent.filter((c) => c.class === cls).length;
}
