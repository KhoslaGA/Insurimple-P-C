"use server";

import { revalidatePath } from "next/cache";
import { api } from "../../../lib/api";

/**
 * Take a first notice of loss. Opening the FNOL transaction is what the DB
 * gates (pc.txn.create), so an unlicensed user is refused there — this just
 * surfaces the reason.
 */
export async function reportFnol(input: {
  accountId: string;
  policyId: string;
  carrierId?: string;
  lossDate: string;
  description: string;
  reserve?: number;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await api("/claims", { method: "POST", body: JSON.stringify(input) });
    revalidatePath("/claims");
    revalidatePath("/queues");
    revalidatePath("/transactions");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
