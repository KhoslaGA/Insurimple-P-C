import { describe, expect, it } from "vitest";
import {
  mintPreferenceToken,
  signPreferenceToken,
  verifyPreferenceToken,
} from "./token";

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
