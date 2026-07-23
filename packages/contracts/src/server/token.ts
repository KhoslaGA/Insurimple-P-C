import { createHmac, timingSafeEqual } from "node:crypto";
import type { ConsentChannel } from "../spine";

/* ============================================================================
 * Signed preference-center links. The public preference center has no login,
 * so the URL itself is the credential: an HMAC-signed, expiring token that
 * names exactly one (tenant, party, channel). Tamper or expiry => rejected.
 * Kept in /server so node:crypto never reaches a client bundle.
 * ==========================================================================*/

export type PreferenceTokenPayload = {
  /** tenant id */ t: string;
  /** party id */ p: string;
  /** channel */ c: ConsentChannel;
  /** expiry, unix seconds */ exp: number;
};

// Dev fallback only. The signed link IS the entire auth boundary for the
// login-less preference center, so secret resolution FAILS CLOSED: production
// must supply a real secret, and the source-visible dev fallback is refused
// there (invariant #1 — the guard is structural, not a comment).
const DEV_SECRET = "insurimple-dev-preference-secret-do-not-use-in-prod";

export function getPreferenceSecret(): string {
  const secret = process.env.PREFERENCE_CENTER_SECRET;
  const isProd = process.env.NODE_ENV === "production";
  if (secret && secret.length > 0) {
    if (isProd && secret === DEV_SECRET) {
      throw new Error(
        "PREFERENCE_CENTER_SECRET must not be the dev fallback in production",
      );
    }
    return secret;
  }
  if (isProd) {
    throw new Error("PREFERENCE_CENTER_SECRET must be set in production");
  }
  return DEV_SECRET;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function sign(data: string, secret: string): string {
  return b64url(createHmac("sha256", secret).update(data).digest());
}

export function signPreferenceToken(
  payload: PreferenceTokenPayload,
  secret: string = getPreferenceSecret(),
): string {
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  return `${body}.${sign(body, secret)}`;
}

export type VerifyResult =
  | { valid: true; payload: PreferenceTokenPayload }
  | { valid: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyPreferenceToken(
  token: string,
  secret: string = getPreferenceSecret(),
  nowSeconds: number = Math.floor(Date.now() / 1000),
): VerifyResult {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, reason: "malformed" };
  }
  const [body, sig] = parts;
  const expected = sign(body, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, reason: "bad_signature" };
  }
  let payload: PreferenceTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { valid: false, reason: "malformed" };
  }
  if (
    typeof payload?.t !== "string" ||
    typeof payload?.p !== "string" ||
    typeof payload?.c !== "string" ||
    typeof payload?.exp !== "number"
  ) {
    return { valid: false, reason: "malformed" };
  }
  if (payload.exp <= nowSeconds) return { valid: false, reason: "expired" };
  return { valid: true, payload };
}

/** Convenience: a link valid for `days` (default 60) from `nowSeconds`. */
export function mintPreferenceToken(
  input: { tenantId: string; partyId: string; channel: ConsentChannel },
  opts: { days?: number; nowSeconds?: number; secret?: string } = {},
): string {
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  const exp = now + (opts.days ?? 60) * 86400;
  return signPreferenceToken(
    { t: input.tenantId, p: input.partyId, c: input.channel, exp },
    opts.secret ?? getPreferenceSecret(),
  );
}
