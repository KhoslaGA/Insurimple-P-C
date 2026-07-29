import { Badge, BarList, MetricCard, Table, type BarItem, type Column } from "@insurimple/design-system";
import type { BillingOverview, CommissionRow, LedgerEntry } from "@insurimple/contracts";
import { api, API_CONFIGURED } from "../../../lib/api";
import { DEMO_BILLING } from "../../../lib/demo-data";

export const dynamic = "force-dynamic";

const money = (v: number | string | null | undefined) =>
  v == null || v === ""
    ? "—"
    : Number(v).toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

const money2 = (v: number | string | null | undefined) =>
  v == null || v === ""
    ? "—"
    : Number(v).toLocaleString("en-CA", { style: "currency", currency: "CAD" });

const fmtDate = (v: string | null) => {
  if (!v) return "—";
  const d = new Date(`${v.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
};

const STATUS_TONE: Record<CommissionRow["status"], "success" | "warning" | "danger" | "neutral"> = {
  matched: "success",
  open: "neutral",
  variance: "warning",
  written_off: "danger",
};

const entryColumns: Column<LedgerEntry>[] = [
  { key: "date", header: "Date", width: "100px",
    cell: (e) => <span className="whitespace-nowrap tabular-nums">{fmtDate(e.entry_date)}</span> },
  { key: "ref", header: "Reference", width: "130px",
    cell: (e) => <span className="whitespace-nowrap font-medium tabular-nums">{e.reference ?? "—"}</span> },
  { key: "book", header: "Book", width: "100px",
    cell: (e) => <Badge tone={e.book === "trust" ? "accent" : "neutral"}>{e.book}</Badge> },
  { key: "desc", header: "Description", cell: (e) => <span className="block truncate">{e.description ?? "—"}</span> },
  { key: "posted", header: "Status", width: "110px",
    cell: (e) => <Badge tone={e.posted ? "success" : "warning"}>{e.posted ? "Posted" : "Draft"}</Badge> },
  { key: "amt", header: "Amount", width: "120px", align: "right", cell: (e) => money2(e.amount) },
];

const commissionColumns: Column<CommissionRow>[] = [
  { key: "carrier", header: "Carrier", width: "140px", cell: (c) => <span className="block truncate">{c.carrier_name ?? "—"}</span> },
  { key: "account", header: "Household", cell: (c) => <span className="block truncate">{c.account_name ?? "—"}</span> },
  { key: "policy", header: "Policy", width: "140px",
    cell: (c) => <span className="whitespace-nowrap tabular-nums text-text-2">{c.policy_number ?? "—"}</span> },
  { key: "expected", header: "Expected", width: "110px", align: "right", cell: (c) => money2(c.expected) },
  { key: "received", header: "Received", width: "110px", align: "right", cell: (c) => money2(c.received) },
  { key: "variance", header: "Variance", width: "110px", align: "right",
    cell: (c) => {
      const v = Number(c.variance ?? 0);
      return <span className={v > 0 ? "text-warning" : "text-text-2"}>{v === 0 ? "—" : money2(v)}</span>;
    } },
  { key: "status", header: "Status", width: "110px",
    cell: (c) => <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge> },
];

/**
 * Billing & receivables. The ledger is written by the transaction spine and
 * read here — entries are immutable once posted, so there is nothing to edit.
 */
export default async function BillingPage() {
  const preview = !API_CONFIGURED;
  let data: BillingOverview | null = null;
  let problem: string | null = null;

  if (preview) {
    data = DEMO_BILLING;
  } else {
    try {
      data = await api<BillingOverview>("/billing");
    } catch (e) {
      problem = e instanceof Error ? e.message : String(e);
    }
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <div className="rounded-card border border-dashed border-border-2 bg-surface-panel px-6 py-10 text-center text-small text-text-2">
          Couldn’t load billing — the API said: {problem}
        </div>
      </div>
    );
  }

  const shortfall = data.trust.surplus < 0;
  const holdings: BarItem[] = data.held_in_trust.map((h) => ({
    label: h.account_name,
    value: Math.abs(Number(h.held_in_trust)),
    display: money(h.held_in_trust),
  }));

  return (
    <div className="mx-auto max-w-6xl px-8 py-6">
      <header className="mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-text-1">Billing &amp; receivables</h1>
          {preview ? <Badge tone="warning">Preview data</Badge> : null}
        </div>
        <p className="text-small text-text-2">
          Trust and general books, double-entry and append-only — a correction posts a
          reversing entry, never an edit.
        </p>
      </header>

      {shortfall ? (
        <div className="mb-4 rounded-card border border-danger bg-danger-tint px-4 py-3 text-small text-danger">
          <i className="ti ti-alert-triangle mr-1.5 text-[15px]" />
          <strong>Trust shortfall.</strong> Trust assets are below the liabilities held for
          clients. This is a RIBO reportable event — investigate before any further
          disbursement.
        </div>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard icon="building-bank" label="Trust assets" value={money(data.trust.assets)} hint="in the trust account" />
        <MetricCard icon="users" label="Held for clients" value={money(data.trust.liabilities)} hint="premiums payable" />
        <MetricCard
          icon={shortfall ? "alert-triangle" : "shield-check"}
          label="Trust surplus"
          value={money(data.trust.surplus)}
          hint={shortfall ? "SHORTFALL" : "Form 1 position"}
        />
        <MetricCard icon="receipt" label="Commission expected" value={money(data.commission_summary.expected)} hint="this period" />
        <MetricCard
          icon="alert-circle"
          label="Commission variance"
          value={money(data.commission_summary.variance)}
          hint={`${data.commission_summary.open} open · ${data.commission_summary.in_variance} in variance`}
        />
      </div>

      <section className="mb-5">
        <h2 className="mb-2 text-caption font-medium uppercase tracking-caps text-text-3">
          Commission reconciliation
        </h2>
        <Table
          columns={commissionColumns}
          rows={data.commissions}
          getRowId={(c) => c.id}
          empty={<p className="rounded-card border border-dashed border-border-2 bg-surface-panel px-5 py-8 text-center text-small text-text-3">No commission statements loaded.</p>}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section>
          <h2 className="mb-2 text-caption font-medium uppercase tracking-caps text-text-3">Ledger entries</h2>
          <Table
            columns={entryColumns}
            rows={data.entries}
            getRowId={(e) => e.id}
            empty={<p className="rounded-card border border-dashed border-border-2 bg-surface-panel px-5 py-8 text-center text-small text-text-3">No entries posted.</p>}
          />
        </section>
        <section className="rounded-card border border-border-1 bg-surface-card p-4">
          <h2 className="mb-3 text-caption font-medium uppercase tracking-caps text-text-3">
            Held in trust by household
          </h2>
          {holdings.length ? (
            <BarList items={holdings} tone="accent" />
          ) : (
            <p className="text-small text-text-3">Nothing currently held in trust.</p>
          )}
        </section>
      </div>
    </div>
  );
}
