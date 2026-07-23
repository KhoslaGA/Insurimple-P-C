"use server";

import { revalidatePath } from "next/cache";
import { api } from "../../../lib/api";
import type { TxnState, TxnType } from "@insurimple/contracts";

const DOC_TYPE: Partial<Record<TxnType, string>> = {
  cancellation: "cancellation_agreement",
  new_business: "application",
  endorsement: "endorsement",
  renewal: "renewal_offer",
  reinstatement: "reinstatement_request",
  remarket: "remarket_summary",
  claim_fnol: "fnol",
};

/**
 * Advance a transaction one legal step through the DB-guarded state machine.
 * Each branch calls the matching NestJS endpoint — the API (not the web app)
 * owns the transition guard and writes the event. Terminal states no-op.
 */
export async function advanceTxn(
  id: string,
  state: TxnState,
  txnType: TxnType,
  reference: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const doc = DOC_TYPE[txnType] ?? "document";
  let path: string;
  let body: Record<string, unknown> = {};
  switch (state) {
    case "draft":
      path = `/txns/${id}/generate`;
      body = { docType: doc, filename: `${reference ?? id}-${doc}.pdf` };
      break;
    case "doc_generated":
      path = `/txns/${id}/request-signature`;
      break;
    case "sig_pending":
      path = `/txns/${id}/sign`;
      break;
    case "signed":
      path = `/txns/${id}/submit`;
      body = { channel: "portal" };
      break;
    case "submitted":
      path = `/txns/${id}/ack`;
      break;
    case "carrier_ack":
      path = `/txns/${id}/ack`;
      body = { complete: true };
      break;
    default:
      return { ok: false, error: "Transaction is already closed." };
  }

  try {
    await api(path, { method: "POST", body: JSON.stringify(body) });
    revalidatePath(`/transactions/${id}`);
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/queues");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Open a new transaction (draft) from a household. Returns the new txn id. */
export async function openTxn(input: {
  accountId: string;
  txnType: TxnType;
  reason?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const txn = await api<{ id: string }>("/txns", {
      method: "POST",
      body: JSON.stringify({ accountId: input.accountId, txnType: input.txnType, reason: input.reason }),
    });
    revalidatePath("/transactions");
    return { ok: true, id: txn.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
