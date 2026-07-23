import { describe, expect, it } from "vitest";
import {
  computeConsentExpiry,
  type ConsentRecord,
  isMarketingConsentValid,
} from "./spine";
import { isSuppressed, resolveMarketingSendability } from "./consent";
import type { Suppression } from "./marketing";

const rec = (over: Partial<ConsentRecord>): ConsentRecord => ({
  id: "c1",
  tenantId: "klc",
  partyId: "p1",
  channel: "email",
  class: "express",
  source: "test",
  capturedAt: "2026-01-01",
  expiresAt: null,
  ...over,
});

describe("computeConsentExpiry — CASL clocks", () => {
  it("express and none never expire (revocation only)", () => {
    expect(computeConsentExpiry("express", "2026-01-01")).toBeNull();
    expect(computeConsentExpiry("none", "2026-01-01")).toBeNull();
  });

  it("implied EBR expires exactly 2 years after capture", () => {
    expect(computeConsentExpiry("implied_ebr", "2026-01-15")).toBe("2028-01-15");
    expect(computeConsentExpiry("implied_ebr", "2024-02-29")).toBe("2026-02-28"); // leap-year clamp
  });

  it("implied inquiry expires exactly 6 months after capture", () => {
    expect(computeConsentExpiry("implied_inquiry", "2026-04-30")).toBe(
      "2026-10-30",
    );
    expect(computeConsentExpiry("implied_inquiry", "2026-01-31")).toBe(
      "2026-07-31",
    );
  });
});

describe("isMarketingConsentValid", () => {
  it("express is valid regardless of date", () => {
    expect(isMarketingConsentValid(rec({ class: "express" }), "2099-01-01")).toBe(
      true,
    );
  });

  it("none is never valid", () => {
    expect(
      isMarketingConsentValid(rec({ class: "none", expiresAt: null }), "2026-01-01"),
    ).toBe(false);
  });

  it("implied consent is valid up to and including its expiry date", () => {
    const c = rec({
      class: "implied_ebr",
      capturedAt: "2025-01-15",
      expiresAt: "2027-01-15",
    });
    expect(isMarketingConsentValid(c, "2027-01-15")).toBe(true); // inclusive
    expect(isMarketingConsentValid(c, "2027-01-16")).toBe(false);
  });
});

describe("resolveMarketingSendability — the structural gate", () => {
  const base = {
    address: "susan@example.ca" as string | null,
    channel: "email" as const,
    suppressions: [] as Suppression[],
    asOf: "2026-07-23",
  };

  it("rejects a service-class message on the marketing path", () => {
    expect(
      resolveMarketingSendability({
        ...base,
        messageClass: "service",
        consent: rec({}),
      }),
    ).toEqual({ allowed: false, reason: "not_marketing_class" });
  });

  it("rejects when there is no address", () => {
    expect(
      resolveMarketingSendability({
        ...base,
        address: null,
        messageClass: "marketing",
        consent: rec({}),
      }).reason,
    ).toBe("no_record");
  });

  it("suppression overrides a live consent record", () => {
    const supp: Suppression[] = [
      {
        id: "s1",
        tenantId: "klc",
        address: "SUSAN@example.ca", // case-insensitive match
        channel: "email",
        reason: "unsubscribe",
        capturedAt: "2026-06-01",
      },
    ];
    expect(
      resolveMarketingSendability({
        ...base,
        suppressions: supp,
        messageClass: "marketing",
        consent: rec({ class: "express" }),
      }),
    ).toEqual({ allowed: false, reason: "suppressed" });
  });

  it("rejects a consent-less party", () => {
    expect(
      resolveMarketingSendability({
        ...base,
        messageClass: "marketing",
        consent: null,
      }).reason,
    ).toBe("no_record");
    expect(
      resolveMarketingSendability({
        ...base,
        messageClass: "marketing",
        consent: rec({ class: "none" }),
      }).reason,
    ).toBe("no_consent");
  });

  it("rejects expired implied consent", () => {
    expect(
      resolveMarketingSendability({
        ...base,
        messageClass: "marketing",
        consent: rec({
          class: "implied_ebr",
          capturedAt: "2023-01-01",
          expiresAt: "2025-01-01",
        }),
      }).reason,
    ).toBe("consent_expired");
  });

  it("allows a valid, unsuppressed express consent", () => {
    expect(
      resolveMarketingSendability({
        ...base,
        messageClass: "marketing",
        consent: rec({ class: "express" }),
      }),
    ).toEqual({ allowed: true, reason: "ok" });
  });
});

describe("isSuppressed", () => {
  const supp: Suppression[] = [
    {
      id: "s1",
      tenantId: "klc",
      address: "a@b.ca",
      channel: "email",
      reason: "bounce",
      capturedAt: "2026-01-01",
    },
  ];
  it("matches case-insensitively and per channel", () => {
    expect(isSuppressed(supp, "A@B.CA", "email")).toBe(true);
    expect(isSuppressed(supp, "a@b.ca", "sms")).toBe(false);
    expect(isSuppressed(supp, null, "email")).toBe(false);
  });
});
