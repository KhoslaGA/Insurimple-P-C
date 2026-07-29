"use server";

import { api } from "../../../lib/api";
import type { QuoteResult } from "@insurimple/contracts";

/** Rate a policy across every market that writes its line. Indicative only. */
export async function quotePolicy(
  policyId: string,
): Promise<{ ok: boolean; result?: QuoteResult; error?: string }> {
  try {
    const result = await api<QuoteResult>(`/rating/policies/${policyId}/quote`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
