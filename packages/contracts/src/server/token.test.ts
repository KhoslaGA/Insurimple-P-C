import { afterEach, describe, expect, it } from "vitest";
import {
  getPreferenceSecret,
  mintPreferenceToken,
  signPreferenceToken,
  verifyPreferenceToken,
} from "./token";

const DEV_SECRET = "insurimple-dev-preference-secret-do-not-use-in-prod";

describe("getPreferenceSecret — fails closed in production", () => {
  const saved = {
    node: process.env.NODE_ENV,
    secret: process.env.PREFERENCE_CENTER_SECRET,
  };
  afterEach(() => {
    process.env.NODE_ENV = saved.node;
    if (saved.secret === undefined) delete process.env.PREFERENCE_CENTER_SECRET;
    else process.env.PREFERENCE_CENTER_SECRET = saved.secret;
  });

  it("throws in production when the secret is unset", () => {
    process.env.NODE_ENV = "production";
    delete process.env.PREFERENCE_CENTER_SECRET;
    expect(() => getPreferenceSecret()).toThrow(/must be set in production/);
  });

  it("throws in production when set to the source-visible dev fallback", () => {
    process.env.NODE_ENV = "production";
    process.env.PREFERENCE_CENTER_SECRET = DEV_SECRET;
    expect(() => getPreferenceSecret()).toThrow(/dev fallback/);
  });

  it("returns a real secret in production", () => {
    process.env.NODE_ENV = "production";
    process.env.PREFERENCE_CENTER_SECRET = "a-real-strong-secret-value";
    expect(getPreferenceSecret()).toBe("a-real-strong-secret-value");
  });

  it("allows the dev fallback outside production", () => {
    process.env.NODE_ENV = "test";
    delete process.env.PREFERENCE_CENTER_SECRET;
    expect(getPreferenceSecret()).toBe(DEV_SECRET);
  });
});

const SECRET = "unit-test-secret";
const NOW = 1_760_000_000; // fixed unix seconds

describe("preference token — signed, expiring links", () => {
  const payload = { t: "klc", p: "p1", c: "email" as const, exp: NOW + 3600 };

  it("round-trips a valid token", () => {
    const token = signPreferenceToken(payload, SECRET);
    const res = verifyPreferenceToken(token, SECRET, NOW);
    expect(res).toEqual({ valid: true, payload });
  });

  it("rejects a tampered body", () => {
    const token = signPreferenceToken(payload, SECRET);
    const [body, sig] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...payload, p: "p2" }),
      "utf8",
    ).toString("base64url");
    const res = verifyPreferenceToken(`${forged}.${sig}`, SECRET, NOW);
    expect(res.valid).toBe(false);
    if (!res.valid) expect(res.reason).toBe("bad_signature");
    void body;
  });

  it("rejects a token signed with a different secret", () => {
    const token = signPreferenceToken(payload, "other-secret");
    const res = verifyPreferenceToken(token, SECRET, NOW);
    expect(res.valid).toBe(false);
  });

  it("rejects an expired token", () => {
    const token = signPreferenceToken({ ...payload, exp: NOW - 1 }, SECRET);
    const res = verifyPreferenceToken(token, SECRET, NOW);
    expect(res.valid).toBe(false);
    if (!res.valid) expect(res.reason).toBe("expired");
  });

  it("rejects malformed input", () => {
    expect(verifyPreferenceToken("not-a-token", SECRET, NOW).valid).toBe(false);
    expect(verifyPreferenceToken("a.b.c", SECRET, NOW).valid).toBe(false);
  });

  it("mintPreferenceToken produces a token valid now but not past expiry", () => {
    const token = mintPreferenceToken(
      { tenantId: "klc", partyId: "p1", channel: "email" },
      { days: 30, nowSeconds: NOW, secret: SECRET },
    );
    expect(verifyPreferenceToken(token, SECRET, NOW).valid).toBe(true);
    expect(
      verifyPreferenceToken(token, SECRET, NOW + 31 * 86400).valid,
    ).toBe(false);
  });
});
