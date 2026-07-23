import { beforeEach, describe, expect, it } from "vitest";
import {
  applyPreferenceUpdate,
  checkSendability,
  ConsentUpdateError,
  getConsent,
  listEvidence,
  listSuppressions,
  resetStore,
} from "./store";

const ASOF = "2026-07-23";

beforeEach(() => resetStore());

describe("applyPreferenceUpdate — atomic consent + evidence + suppression", () => {
  it("unsubscribe writes consent, evidence, and suppression together and blocks sends", () => {
    // p1 starts with valid express email consent -> sendable.
    expect(checkSendability("klc", "p1", "email", ASOF).allowed).toBe(true);
    const before = listSuppressions("klc").length;

    const res = applyPreferenceUpdate({
      tenantId: "klc",
      partyId: "p1",
      channel: "email",
      intent: "unsubscribe",
      source: "preference_center",
      capturedAt: ASOF,
      ip: "203.0.113.7",
      userAgent: "test-agent",
    });

    // consent flipped to none
    expect(res.consent.class).toBe("none");
    expect(getConsent("klc", "p1", "email")?.class).toBe("none");
    // suppression added
    expect(res.suppressionAdded).not.toBeNull();
    expect(listSuppressions("klc").length).toBe(before + 1);
    // evidence recorded with provenance
    const ev = listEvidence("klc", "p1");
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({
      action: "unsubscribed",
      fromClass: "express",
      toClass: "none",
      ip: "203.0.113.7",
    });
    // and the send gate now denies
    expect(checkSendability("klc", "p1", "email", ASOF)).toEqual({
      allowed: false,
      reason: "suppressed",
    });
  });

  it("is all-or-nothing: an invalid update mutates nothing and throws", () => {
    const consentBefore = JSON.stringify(getConsent("klc", "p1", "email"));
    const suppBefore = listSuppressions("klc").length;
    const evBefore = listEvidence("klc").length;

    expect(() =>
      applyPreferenceUpdate({
        tenantId: "klc",
        partyId: "does-not-exist",
        channel: "email",
        intent: "unsubscribe",
        source: "preference_center",
        capturedAt: ASOF,
      }),
    ).toThrow(ConsentUpdateError);

    expect(JSON.stringify(getConsent("klc", "p1", "email"))).toBe(consentBefore);
    expect(listSuppressions("klc").length).toBe(suppBefore);
    expect(listEvidence("klc").length).toBe(evBefore);
  });

  it("resubscribe removes suppression and restores sendability", () => {
    applyPreferenceUpdate({
      tenantId: "klc",
      partyId: "p1",
      channel: "email",
      intent: "unsubscribe",
      source: "preference_center",
      capturedAt: ASOF,
    });
    const suppAfterUnsub = listSuppressions("klc").length;

    const res = applyPreferenceUpdate({
      tenantId: "klc",
      partyId: "p1",
      channel: "email",
      intent: "subscribe",
      source: "preference_center",
      capturedAt: ASOF,
    });

    expect(res.suppressionRemoved).toBe(true);
    expect(res.consent.class).toBe("express");
    expect(listSuppressions("klc").length).toBe(suppAfterUnsub - 1);
    expect(listEvidence("klc", "p1").map((e) => e.action)).toEqual([
      "unsubscribed",
      "resubscribed",
    ]);
    expect(checkSendability("klc", "p1", "email", ASOF).allowed).toBe(true);
  });

  it("is tenant-isolated: a party cannot be reached under the wrong tenant", () => {
    expect(() =>
      applyPreferenceUpdate({
        tenantId: "northpeak", // p1 belongs to klc, not northpeak
        partyId: "p1",
        channel: "email",
        intent: "unsubscribe",
        source: "preference_center",
        capturedAt: ASOF,
      }),
    ).toThrow(/party/i);
    // klc's data untouched
    expect(getConsent("klc", "p1", "email")?.class).toBe("express");
  });
});
