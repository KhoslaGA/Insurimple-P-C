"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  applyPreferenceUpdate,
  verifyPreferenceToken,
} from "@insurimple/contracts/server";

/**
 * The only write path for the public preference center. The token is
 * re-verified server-side on every submit — the client is never trusted to
 * name the party. Consent + evidence + suppression commit atomically.
 */
export async function updatePreferences(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const intent = String(formData.get("intent") ?? "");

  const verified = verifyPreferenceToken(token);
  if (!verified.valid) return;
  if (intent !== "subscribe" && intent !== "unsubscribe") return;

  const h = await headers();
  applyPreferenceUpdate({
    tenantId: verified.payload.t,
    partyId: verified.payload.p,
    channel: verified.payload.c,
    intent,
    source: "preference_center",
    capturedAt: new Date().toISOString(),
    ip: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
    userAgent: h.get("user-agent"),
  });

  revalidatePath(`/preferences/${token}`);
}
