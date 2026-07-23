import { z } from "zod";
import {
  ConsentChannel,
  ConsentClass,
  type ConsentRecord,
  isMarketingConsentValid,
} from "./spine";
import { MessageClass, type Suppression } from "./marketing";

/* ============================================================================
 * TM.1 — consent resolution + evidence. This is the STRUCTURAL marketing gate:
 * "no consent -> no send" is resolved here, not with an if-statement scattered
 * through a worker. In the NestJS/Postgres spine this becomes an FK + check +
 * exclusion constraint (see packages/contracts/sql/consent.forward-spec.sql);
 * in the mock world it is this pure function plus a test that it bites.
 * ==========================================================================*/

/** What happened to a consent record — the append-only evidence ledger. */
export const ConsentAction = z.enum([
  "granted",
  "updated",
  "unsubscribed",
  "resubscribed",
]);
export type ConsentAction = z.infer<typeof ConsentAction>;

export const ConsentEvidence = z.object({
  id: z.string(),
  tenantId: z.string(),
  partyId: z.string(),
  channel: ConsentChannel,
  action: ConsentAction,
  fromClass: ConsentClass.nullable(),
  toClass: ConsentClass,
  /** Where the change came from: preference_center, policy_binding, web_lead… */
  source: z.string(),
  capturedAt: z.string(),
  /** Best-effort request evidence for CASL defensibility. */
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
});
export type ConsentEvidence = z.infer<typeof ConsentEvidence>;

export type SendabilityReason =
  | "ok"
  | "suppressed"
  | "no_record"
  | "no_consent"
  | "consent_expired"
  | "channel_mismatch"
  | "not_marketing_class";

export type SendabilityDecision = {
  allowed: boolean;
  reason: SendabilityReason;
};

/** Suppression is global per tenant — one row blocks every campaign/sequence. */
export function isSuppressed(
  suppressions: Suppression[],
  address: string | null,
  channel: ConsentChannel,
): boolean {
  if (!address) return false;
  const needle = address.trim().toLowerCase();
  return suppressions.some(
    (s) => s.channel === channel && s.address.trim().toLowerCase() === needle,
  );
}

/**
 * The single gate every marketing send path must pass through. Order matters:
 * suppression (an explicit opt-out) is checked before consent, because an
 * unsubscribe overrides any live consent record.
 */
export function resolveMarketingSendability(input: {
  messageClass: MessageClass;
  address: string | null;
  consent: ConsentRecord | null;
  suppressions: Suppression[];
  channel: ConsentChannel;
  asOf: string;
}): SendabilityDecision {
  const { messageClass, address, consent, suppressions, channel, asOf } = input;

  // This gate governs CEMs only. Service messages take a different path and
  // must never be routed through marketing consent (design rule #2).
  if (messageClass !== "marketing") {
    return { allowed: false, reason: "not_marketing_class" };
  }
  if (!address) return { allowed: false, reason: "no_record" };
  if (isSuppressed(suppressions, address, channel)) {
    return { allowed: false, reason: "suppressed" };
  }
  if (!consent) return { allowed: false, reason: "no_record" };
  // Consent is per-channel: a record for another channel cannot authorize this
  // send. (Tenant/party scoping is the caller's job — getConsent() resolves by
  // tenant+party+channel — but the gate self-guards the channel to mirror the
  // SQL trigger's `c.channel = NEW.channel` join.)
  if (consent.channel !== channel) {
    return { allowed: false, reason: "channel_mismatch" };
  }
  if (consent.class === "none") return { allowed: false, reason: "no_consent" };
  if (!isMarketingConsentValid(consent, asOf)) {
    return { allowed: false, reason: "consent_expired" };
  }
  return { allowed: true, reason: "ok" };
}
