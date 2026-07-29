import Link from "next/link";
import { Badge, BarList, MetricCard, type BarItem } from "@insurimple/design-system";
import type { ComplianceOverview } from "@insurimple/contracts";
import { api, API_CONFIGURED } from "../../../lib/api";
import { DEMO_COMPLIANCE } from "../../../lib/demo-data";

export const dynamic = "force-dynamic";

const money = (v: number) => `$${Math.round(v).toLocaleString("en-CA")}`;

const LINE_LABEL: Record<string, string> = {
  auto: "Auto", property: "Homeowner", tenant: "Tenant", condo: "Condo",
  umbrella: "Umbrella", commercial: "Commercial", life: "Life",
};

const fmtDate = (v: string | null) => {
  if (!v) return "—";
  const d = new Date(v.length <= 10 ? `${v}T00:00:00` : v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
};

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border-1 bg-surface-card p-4">
      <h2 className="text-caption font-medium uppercase tracking-caps text-text-3">{title}</h2>
      {subtitle ? <p className="mb-3 mt-0.5 text-small text-text-2">{subtitle}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}

/** One exception group. Empty is the good state and says so. */
function Exceptions({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count: number;
  tone: "danger" | "warning" | "info";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border-1 bg-surface-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-caption font-medium uppercase tracking-caps text-text-3">{title}</h2>
        <Badge tone={count === 0 ? "success" : tone}>{count === 0 ? "Clear" : count}</Badge>
      </div>
      {count === 0 ? <p className="text-small text-text-3">Nothing outstanding.</p> : children}
    </section>
  );
}

/**
 * Book & compliance — the principal broker's supervision view. Every exception
 * is derived from the data rather than flagged by hand, so nothing hides by
 * being forgotten.
 */
export default async function CompliancePage() {
  const preview = !API_CONFIGURED;
  let data: ComplianceOverview | null = null;
  let problem: string | null = null;

  if (preview) {
    data = DEMO_COMPLIANCE;
  } else {
    try {
      data = await api<ComplianceOverview>("/compliance");
    } catch (e) {
      problem = e instanceof Error ? e.message : String(e);
    }
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <div className="rounded-card border border-dashed border-border-2 bg-surface-panel px-6 py-10 text-center text-small text-text-2">
          Couldn’t load compliance — the API said: {problem}
        </div>
      </div>
    );
  }

  const { book, retention, exceptions: x } = data;
  const totalExceptions =
    x.overdue_activities.length +
    x.unsigned_transactions.length +
    x.unacknowledged_submissions.length +
    x.licence_alerts.length +
    x.consent_gaps.length;

  const inForce = retention.in_force + retention.cancelled + retention.lapsed;
  const retentionPct = inForce ? Math.round((retention.in_force / inForce) * 100) : 100;

  const lineBars: BarItem[] = book.by_line.map((b) => ({
    label: `${LINE_LABEL[b.label] ?? b.label} · ${b.value}`,
    value: b.premium,
    display: money(b.premium),
  }));
  const carrierBars: BarItem[] = book.by_carrier.map((b) => ({
    label: `${b.label} · ${b.value}`,
    value: b.premium,
    display: money(b.premium),
  }));
  const expiryBars: BarItem[] = book.by_expiry_month.map((b) => ({
    label: b.label,
    value: b.value,
    display: `${b.value} · ${money(b.premium)}`,
  }));

  return (
    <div className="mx-auto max-w-6xl px-8 py-6">
      <header className="mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-text-1">Book &amp; compliance</h1>
          {preview ? <Badge tone="warning">Preview data</Badge> : null}
        </div>
        <p className="text-small text-text-2">
          The book by line, carrier and renewal month — and the supervision view: every
          exception derived from the record, not from a checklist someone maintains.
        </p>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard icon="file-check" label="Policies in force" value={retention.in_force} hint="live book" />
        <MetricCard icon="chart-line" label="Retention" value={`${retentionPct}%`} hint={`${retention.cancelled} cancelled · ${retention.lapsed} lapsed`} />
        <MetricCard
          icon={totalExceptions ? "alert-triangle" : "shield-check"}
          label="Open exceptions"
          value={totalExceptions}
          hint={totalExceptions ? "need review" : "book is clean"}
        />
        <MetricCard icon="calendar-due" label="Renewing ≤12mo" value={book.by_expiry_month.reduce((s, b) => s + b.value, 0)} hint="scheduled" />
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Panel title="Premium by line"><BarList items={lineBars} /></Panel>
        <Panel title="Premium by carrier"><BarList items={carrierBars} tone="success" /></Panel>
        <Panel title="Renewals by month" subtitle="The next twelve months of expiries.">
          <BarList items={expiryBars} tone="info" />
        </Panel>
      </div>

      <h2 className="mb-2 text-caption font-medium uppercase tracking-caps text-text-3">
        E&amp;O exceptions
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Exceptions title="Overdue follow-ups" count={x.overdue_activities.length} tone="danger">
          <ul className="flex flex-col gap-1.5">
            {x.overdue_activities.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2 text-small">
                <span className="font-medium text-text-1">{a.title}</span>
                <span className="text-caption text-text-3">{a.account_name}</span>
                <span className="ml-auto text-caption tabular-nums text-danger">due {fmtDate(a.due_at)}</span>
              </li>
            ))}
          </ul>
        </Exceptions>

        <Exceptions title="Signature not on file" count={x.unsigned_transactions.length} tone="danger">
          <ul className="flex flex-col gap-1.5">
            {x.unsigned_transactions.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 text-small">
                <Link href={`/transactions/${t.id}`} className="font-medium tabular-nums text-text-link">
                  {t.reference ?? "TXN"}
                </Link>
                <span className="text-text-2">{t.account_name}</span>
                <Badge tone="warning">{t.state.replace(/_/g, " ")}</Badge>
              </li>
            ))}
          </ul>
        </Exceptions>

        <Exceptions title="Awaiting carrier acknowledgement" count={x.unacknowledged_submissions.length} tone="warning">
          <ul className="flex flex-col gap-1.5">
            {x.unacknowledged_submissions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 text-small">
                <Link href={`/transactions/${s.id}`} className="font-medium tabular-nums text-text-link">
                  {s.reference ?? "TXN"}
                </Link>
                <span className="text-text-2">{s.account_name}</span>
                <span className="ml-auto text-caption tabular-nums text-warning">
                  {s.days_waiting} days
                </span>
              </li>
            ))}
          </ul>
        </Exceptions>

        <Exceptions title="Licence expiries" count={x.licence_alerts.length} tone="danger">
          <ul className="flex flex-col gap-1.5">
            {x.licence_alerts.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-2 text-small">
                <span className="font-medium text-text-1">{l.full_name}</span>
                <span className="text-caption text-text-3">{l.licence_class}</span>
                <Badge tone={l.expired ? "danger" : "warning"}>
                  {l.expired ? "Expired" : "Expiring"} {fmtDate(l.expires_on)}
                </Badge>
              </li>
            ))}
          </ul>
        </Exceptions>

        <Exceptions title="No CASL consent basis" count={x.consent_gaps.length} tone="warning">
          <ul className="flex flex-col gap-1.5">
            {x.consent_gaps.map((g) => (
              <li key={g.account_id} className="flex flex-wrap items-center gap-2 text-small">
                <Link href={`/households/${g.account_id}`} className="font-medium text-text-link">
                  {g.account_name}
                </Link>
                <span className="text-caption tabular-nums text-text-3">{g.lookup_code}</span>
                <span className="ml-auto text-caption text-text-3">no express or implied basis</span>
              </li>
            ))}
          </ul>
        </Exceptions>
      </div>
    </div>
  );
}
