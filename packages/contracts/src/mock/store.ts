import {
  computeConsentExpiry,
  type ConsentChannel,
  type ConsentClass,
  type ConsentRecord,
  isMarketingConsentValid,
  type Party,
  type Tenant,
} from "../spine";
import type { Suppression, SuppressionReason } from "../marketing";
import {
  type ConsentAction,
  type ConsentEvidence,
  isSuppressed,
  resolveMarketingSendability,
  type SendabilityDecision,
} from "../consent";
import { DATASET } from "./seed";

/* ============================================================================
 * Mutable in-memory marketing store (mock). Seeded from DATASET; the preference
 * center reads and writes it. This stands in for the tenant-scoped Postgres
 * tables; `applyPreferenceUpdate` is the analogue of one BEGIN/COMMIT — it
 * validates fully, then commits consent + evidence + suppression together, so a
 * rejected update leaves state untouched.
 *
 * NOTE: process-local and non-persistent — fine for a demo/mock, not durable.
 * ==========================================================================*/

type StoreState = {
  consent: ConsentRecord[];
  suppressions: Suppression[];
  evidence: ConsentEvidence[];
  seq: number;
};

function seed(): StoreState {
  return {
    consent: DATASET.consent.map((c) => ({ ...c })),
    suppressions: DATASET.suppressions.map((s) => ({ ...s })),
    evidence: [],
    seq: 0,
  };
}

let state: StoreState = seed();

/** Test-only: restore the store to its seeded baseline. */
export function resetStore(): void {
  state = seed();
}

/* -------------------------------- reads ---------------------------------- */

export function listConsent(tenantId: string): ConsentRecord[] {
  return state.consent.filter((c) => c.tenantId === tenantId);
}

export function listSuppressions(tenantId: string): Suppression[] {
  return state.suppressions.filter((s) => s.tenantId === tenantId);
}

export function listEvidence(
  tenantId: string,
  partyId?: string,
): ConsentEvidence[] {
  return state.evidence.filter(
    (e) => e.tenantId === tenantId && (!partyId || e.partyId === partyId),
  );
}

export function getConsent(
  tenantId: string,
  partyId: string,
  channel: ConsentChannel,
): ConsentRecord | null {
  return (
    state.consent.find(
      (c) =>
        c.tenantId === tenantId &&
        c.partyId === partyId &&
        c.channel === channel,
    ) ?? null
  );
}

export function getTenant(tenantId: string): Tenant | null {
  return DATASET.tenants.find((t) => t.id === tenantId) ?? null;
}

export function getParty(tenantId: string, partyId: string): Party | null {
  return (
    DATASET.parties.find((p) => p.id === partyId && p.tenantId === tenantId) ??
    null
  );
}

function addressFor(party: Party, channel: ConsentChannel): string | null {
  return channel === "email" ? party.email : party.phone;
}

export type PreferenceState = {
  tenant: Tenant;
  party: Party;
  channel: ConsentChannel;
  address: string | null;
  consent: ConsentRecord | null;
  suppressed: boolean;
  sendability: SendabilityDecision;
};

/** View-model for the public preference center. */
export function getPreferenceState(
  tenantId: string,
  partyId: string,
  channel: ConsentChannel,
  asOf: string,
): PreferenceState | null {
  const tenant = getTenant(tenantId);
  const party = getParty(tenantId, partyId);
  if (!tenant || !party) return null;
  const address = addressFor(party, channel);
  const consent = getConsent(tenantId, partyId, channel);
  const suppressions = listSuppressions(tenantId);
  return {
    tenant,
    party,
    channel,
    address,
    consent,
    suppressed: isSuppressed(suppressions, address, channel),
    sendability: resolveMarketingSendability({
      messageClass: "marketing",
      address,
      consent,
      suppressions,
      channel,
      asOf,
    }),
  };
}

/* -------------------------------- writes --------------------------------- */

/** Suppression reasons a contact's own preference-center action may remove. */
const SELF_SERVICE_LIFTABLE: SuppressionReason[] = ["unsubscribe"];

export class ConsentUpdateError extends Error {
  constructor(
    message: string,
    readonly code:
      | "tenant_not_found"
      | "party_not_found"
      | "no_address"
      | "invalid_class",
  ) {
    super(message);
    this.name = "ConsentUpdateError";
  }
}

export type PreferenceUpdate = {
  tenantId: string;
  partyId: string;
  channel: ConsentChannel;
  /** subscribe = express opt-in; unsubscribe = global suppression. */
  intent: "subscribe" | "unsubscribe";
  source: string;
  capturedAt: string;
  ip?: string | null;
  userAgent?: string | null;
};

export type PreferenceUpdateResult = {
  consent: ConsentRecord;
  evidence: ConsentEvidence;
  suppressionAdded: Suppression | null;
  suppressionRemoved: boolean;
};

/**
 * Atomic preference update. Validates everything first; if valid, commits the
 * consent record, an append-only evidence row, and any suppression change in a
 * single synchronous block (no awaits) so the write is all-or-nothing.
 */
export function applyPreferenceUpdate(
  update: PreferenceUpdate,
): PreferenceUpdateResult {
  const { tenantId, partyId, channel, intent, source, capturedAt } = update;

  // ---- validate (throws before any mutation) ----
  const tenant = getTenant(tenantId);
  if (!tenant) {
    throw new ConsentUpdateError("Unknown tenant", "tenant_not_found");
  }
  const party = getParty(tenantId, partyId);
  if (!party) {
    throw new ConsentUpdateError("Unknown party", "party_not_found");
  }
  const address = addressFor(party, channel);
  if (!address) {
    throw new ConsentUpdateError(
      `Party has no ${channel} address`,
      "no_address",
    );
  }

  const existing = getConsent(tenantId, partyId, channel);
  const fromClass: ConsentClass | null = existing ? existing.class : null;
  const toClass: ConsentClass = intent === "unsubscribe" ? "none" : "express";

  // ---- build the full change set (still no mutation) ----
  const nextConsent: ConsentRecord = {
    id: existing?.id ?? `c-${tenantId}-${partyId}-${channel}`,
    tenantId,
    partyId,
    channel,
    class: toClass,
    source,
    capturedAt,
    expiresAt: computeConsentExpiry(toClass, capturedAt),
  };

  const action: ConsentAction =
    intent === "unsubscribe"
      ? "unsubscribed"
      : fromClass === null
        ? "granted"
        : fromClass === "none"
          ? "resubscribed"
          : "updated";

  const evidence: ConsentEvidence = {
    id: `ev-${state.seq + 1}`,
    tenantId,
    partyId,
    channel,
    action,
    fromClass,
    toClass,
    source,
    capturedAt,
    ip: update.ip ?? null,
    userAgent: update.userAgent ?? null,
  };

  const needle = address.trim().toLowerCase();
  const matchesAddr = (s: Suppression) =>
    s.tenantId === tenantId &&
    s.channel === channel &&
    s.address.trim().toLowerCase() === needle;

  // A self-service resubscribe may only lift suppressions it could itself have
  // created. Broker/system suppressions (complaint, bounce, manual, sms_stop)
  // are NOT removable by a contact clicking "resubscribe".
  const anySuppression = state.suppressions.some(matchesAddr);
  const hasLiftable = state.suppressions.some(
    (s) => matchesAddr(s) && SELF_SERVICE_LIFTABLE.includes(s.reason),
  );

  const newSuppression: Suppression | null =
    intent === "unsubscribe" && !anySuppression
      ? {
          id: `sup-${state.seq + 1}`,
          tenantId,
          address,
          channel,
          reason: "unsubscribe",
          capturedAt,
        }
      : null;
  const removeSuppression = intent === "subscribe" && hasLiftable;

  // ---- commit atomically ----
  state.seq += 1;
  const idx = state.consent.findIndex(
    (c) =>
      c.tenantId === tenantId &&
      c.partyId === partyId &&
      c.channel === channel,
  );
  if (idx >= 0) state.consent[idx] = nextConsent;
  else state.consent.push(nextConsent);

  if (newSuppression) state.suppressions.push(newSuppression);
  if (removeSuppression) {
    state.suppressions = state.suppressions.filter(
      (s) => !(matchesAddr(s) && SELF_SERVICE_LIFTABLE.includes(s.reason)),
    );
  }
  state.evidence.push(evidence);

  return {
    consent: nextConsent,
    evidence,
    suppressionAdded: newSuppression,
    suppressionRemoved: removeSuppression,
  };
}

/** Re-check sendability for a party after an update (used by tests + UI). */
export function checkSendability(
  tenantId: string,
  partyId: string,
  channel: ConsentChannel,
  asOf: string,
): SendabilityDecision {
  const party = getParty(tenantId, partyId);
  const address = party ? addressFor(party, channel) : null;
  return resolveMarketingSendability({
    messageClass: "marketing",
    address,
    consent: getConsent(tenantId, partyId, channel),
    suppressions: listSuppressions(tenantId),
    channel,
    asOf,
  });
}
