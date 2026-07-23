import { Badge } from "@insurimple/design-system";
import type { TxnSummary } from "@insurimple/contracts";
import { api, API_CONFIGURED } from "../../../lib/api";
import { DEMO_TXNS } from "../../../lib/demo-data";
import { TxnRows } from "../../../components/TxnRows";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const preview = !API_CONFIGURED;
  let txns: TxnSummary[] = [];
  let problem: string | null = null;

  if (preview) {
    txns = DEMO_TXNS;
  } else {
    try {
      txns = await api<TxnSummary[]>("/txns");
    } catch (e) {
      problem = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col px-8 py-6">
      <header className="mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-text-1">Transactions</h1>
          {preview ? <Badge tone="warning">Preview data</Badge> : null}
        </div>
        <p className="text-small text-text-2">Every carrier-facing action — one lifecycle, one audit trail.</p>
      </header>
      <TxnRows rows={txns} problem={problem} />
    </div>
  );
}
