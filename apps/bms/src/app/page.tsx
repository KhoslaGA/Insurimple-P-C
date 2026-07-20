import { Table, TxnStateBadge, Badge, Button, type Column } from "@insurimple/design-system";
import type { TxnSummary } from "@insurimple/contracts";

/**
 * Phase-0 proof screen: the transactions ledger rendered from the design system
 * against contract types. Data is a static fixture here; Phase 1 swaps this for
 * a fetch to GET /txns on the NestJS API (see apps/api). No hardcoded colors,
 * no local styles — every visual comes from @insurimple/design-system.
 */
const FIXTURE: TxnSummary[] = [
  { id: "1", reference: "TXN-3041", txn_type: "cancellation", state: "submitted",
    reason: "Client request", effective_date: "2026-06-24", opened_at: "2026-06-05",
    closed_at: null, account_name: "Seyed Moein Abtahi", carrier_name: "Pembridge" },
  { id: "2", reference: "TXN-3044", txn_type: "endorsement", state: "carrier_ack",
    reason: "Vehicle swap", effective_date: "2026-06-28", opened_at: "2026-06-27",
    closed_at: null, account_name: "Amrit Gill", carrier_name: "Definity" },
  { id: "3", reference: "TXN-3045", txn_type: "new_business", state: "completed",
    reason: "Bind", effective_date: "2026-06-15", opened_at: "2026-06-10",
    closed_at: "2026-06-15", account_name: "Rahul Mehta", carrier_name: "Aviva" },
];

const TYPE_LABEL: Record<string, string> = {
  new_business: "New business", renewal: "Renewal", endorsement: "Endorsement",
  cancellation: "Cancellation", reinstatement: "Reinstatement", remarket: "Remarket",
  claim_fnol: "Claim FNOL",
};

const columns: Column<TxnSummary>[] = [
  { key: "ref", header: "Txn", width: "120px",
    cell: (t) => <span className="font-medium">{t.reference}</span> },
  { key: "type", header: "Type",
    cell: (t) => <Badge>{TYPE_LABEL[t.txn_type] ?? t.txn_type}</Badge> },
  { key: "account", header: "Account", cell: (t) => t.account_name ?? "\u2014" },
  { key: "carrier", header: "Carrier", cell: (t) => t.carrier_name ?? "\u2014" },
  { key: "state", header: "State", cell: (t) => <TxnStateBadge state={t.state} /> },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-hero text-text-1">Transactions</h1>
          <p className="text-body text-text-2">
            Every carrier-facing action — one lifecycle, one audit trail.
          </p>
        </div>
        <Button>+ New transaction</Button>
      </header>
      <Table columns={columns} rows={FIXTURE} getRowId={(t) => t.id} />
    </main>
  );
}
