import { Badge, BarList, MetricCard, type BarItem, type BarTone } from "@insurimple/design-system";
import type { BookMetrics, TxnState } from "@insurimple/contracts";
import { api, API_CONFIGURED } from "../../../lib/api";
import { DEMO_HOUSEHOLDS } from "../../../lib/demo-data";
import { computeMetrics } from "../../../lib/metrics";

export const dynamic = "force-dynamic";

const money0 = (v: number) => `$${Math.round(v).toLocaleString("en-CA")}`;

const STATUS_TONE: Record<string, BarTone> = {
  Active: "success",
  Prospect: "accent",
  Review: "info",
  Cancelling: "warning",
  Lapsed: "danger",
  Closed: "neutral",
};

const STATE_LABEL: Record<TxnState, string> = {
  draft: "Draft",
  doc_generated: "Document generated",
  sig_pending: "Signature pending",
  signed: "Signed",
  submitted: "Submitted to carrier",
  carrier_ack: "Carrier acknowledged",
  completed: "Completed",
  rejected: "Rejected",
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border-1 bg-surface-card p-4">
      <h2 className="mb-3 text-caption font-medium uppercase tracking-caps text-text-3">{title}</h2>
      {children}
    </section>
  );
}

export default async function DashboardPage() {
  const preview = !API_CONFIGURED;
  let m: BookMetrics | null = null;
  let problem: string | null = null;

  if (preview) {
    m = computeMetrics(Object.values(DEMO_HOUSEHOLDS));
  } else {
    try {
      m = await api<BookMetrics>("/metrics");
    } catch (e) {
      problem = e instanceof Error ? e.message : String(e);
    }
  }

  const statusBars: BarItem[] =
    m?.by_status.map((s) => ({ label: s.label, value: s.value, tone: STATUS_TONE[s.label] ?? "accent" })) ?? [];
  const sourceBars: BarItem[] = m?.by_source.map((s) => ({ label: s.label, value: s.value })) ?? [];
  const carrierBars: BarItem[] =
    m?.premium_by_carrier.map((c) => ({ label: c.label, value: c.value, display: money0(c.value) })) ?? [];
  const pipelineBars: BarItem[] =
    m?.pipeline.map((p) => ({ label: STATE_LABEL[p.state], value: p.value, tone: "info" as BarTone })) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-8 py-6">
      <header className="mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-text-1">Overview</h1>
          {preview ? <Badge tone="warning">Preview data</Badge> : null}
        </div>
        <p className="text-small text-text-2">The book at a glance — production, pipeline, and renewals.</p>
      </header>

      {problem ? (
        <div className="rounded-card border border-dashed border-border-2 bg-surface-panel px-5 py-8 text-center text-small text-text-2">
          Couldn’t load metrics — the API said: {problem}
        </div>
      ) : m ? (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <MetricCard icon="users" label="Book size" value={m.book_size} hint="households" />
            <MetricCard icon="receipt" label="Premium in force" value={money0(m.premium_in_force)} hint="annualized" />
            <MetricCard icon="file-check" label="Policies" value={m.policies_in_force} hint="in force" />
            <MetricCard icon="arrows-exchange" label="Open txns" value={m.active_transactions} hint="in flight" />
            <MetricCard icon="calendar-due" label="Renewals" value={m.renewals_90d} hint="next 90 days" />
            <MetricCard icon="user-plus" label="Prospects" value={m.prospects} hint="in pipeline" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel title="Book by status">
              <BarList items={statusBars} />
            </Panel>
            <Panel title="Book by source">
              <BarList items={sourceBars} />
            </Panel>
            <Panel title="Premium by carrier">
              <BarList items={carrierBars} tone="success" />
            </Panel>
          </div>

          <div className="mt-4">
            <Panel title="Transaction pipeline">
              {pipelineBars.length ? (
                <BarList items={pipelineBars} />
              ) : (
                <p className="text-small text-text-3">No open transactions.</p>
              )}
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  );
}
