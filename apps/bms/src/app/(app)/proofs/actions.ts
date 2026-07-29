"use server";

import { revalidatePath } from "next/cache";
import { api } from "../../../lib/api";
import type { IssuedProof } from "@insurimple/contracts";

/**
 * Issue a proof. Authority (pc.proof.issue, licence-gated) is enforced by the
 * database; a refusal comes back as a 403 and is shown, never swallowed.
 */
export async function issueProof(input: {
  policyId: string;
  templateCode: string;
  issuedTo?: string;
}): Promise<{ ok: boolean; proof?: IssuedProof; error?: string }> {
  try {
    const proof = await api<IssuedProof>("/documents/issue", {
      method: "POST",
      body: JSON.stringify(input),
    });
    revalidatePath("/proofs");
    return { ok: true, proof };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
