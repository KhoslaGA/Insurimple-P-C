import Link from "next/link";
import { Button, EmptyState } from "@insurimple/design-system";
import type { TxnDetail } from "@insurimple/contracts";
import { api, API_CONFIGURED } from "../../../../lib/api";
import { DEMO_TXN_DETAIL } from "../../../../lib/demo-data";
import { TxnStepperView } from "../../../../components/TxnStepperView";

export const dynamic = "force-dynamic";

export default async function TransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const preview = !API_CONFIGURED;

  let txn: TxnDetail | null = null;
  let problem: string | null = null;

  if (preview) {
    txn = DEMO_TXN_DETAIL[id] ?? null;
  } else {
    try {
      txn = await api<TxnDetail>(`/txns/${id}`);
    } catch (e) {
      problem = e instanceof Error ? e.message : String(e);
    }
  }

  if (!txn) {
    const notFound = preview || problem?.includes("404");
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <EmptyState
          title={notFound ? "Transaction not found" : "Couldn’t load this transaction"}
          description={
            notFound
              ? "No transaction with this id in your tenant’s book."
              : `The API said: ${problem}.`
          }
          action={
            <Link href="/transactions">
              <Button variant="secondary">All transactions</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return <TxnStepperView txn={txn} preview={preview} />;
}
