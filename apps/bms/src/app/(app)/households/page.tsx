import { Badge, EmptyState, Table, type Column } from "@insurimple/design-system";
import type { AccountSummary } from "@insurimple/contracts";
import { api, API_CONFIGURED } from "../../../lib/api";
import { DEMO_ACCOUNTS } from "../../../lib/demo-data";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<AccountSummary["status"], "success" | "warning" | "danger" | "neutral" | "info" | "accent"> = {
  prospect: "accent",
  active: "success",
  review: "info",
  cancelling: "warning",
  lapsed: "danger",
  closed: "neutral",
};

const columns: Column<AccountSummary>[] = [
  { key: "code", header: "Lookup code", width: "130px",
    cell: (a) => <span className="font-medium tabular-nums">{a.lookup_code ?? "—"}</span> },
  { key: "name", header: "Household", cell: (a) => <span className="font-medium">{a.display_name}</span> },
  { key: "kind", header: "Type", cell: (a) => <Badge>{a.kind}</Badge> },
  { key: "status", header: "Status", cell: (a) => <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge> },
  { key: "source", header: "Source", cell: (a) => a.source ?? "—" },
  { key: "policies", header: "Policies", align: "right", cell: (a) => String(a.policy_count) },
  { key: "premium", header: "Annual premium", align: "right",
    cell: (a) => `$${Number(a.annual_premium).toLocaleString("en-CA", { minimumFractionDigits: 2 })}` },
];

/** The household book, straight from Postgres through the RLS-scoped API. */
export default async function HouseholdsPage() {
  let accounts: AccountSummary[] = [];
  let problem: string | null = null;
  const preview = !API_CONFIGURED;

  if (preview) {
    accounts = DEMO_ACCOUNTS;
  } else {
    try {
      accounts = await api<AccountSummary[]>("/accounts");
    } catch (e) {
      problem = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-hero text-text-1">Households</h1>
          {preview ? <Badge tone="warning">Preview data</Badge> : null}
        </div>
        <p className="text-body text-text-2">
          {preview
            ? "Deterministic seed snapshot — set API_URL to load this tenant’s live book (isolation enforced by Postgres RLS)."
            : "Every account in this tenant’s book — isolation enforced by Postgres RLS, keyed by your organization."}
        </p>
      </header>
      {problem ? (
        <EmptyState
          title="Couldn&apos;t load the book"
          description={`The API said: ${problem}. Check that apps/api is running and your organization is linked to a tenant (docs/auth.md).`}
        />
      ) : (
        <Table
          columns={columns}
          rows={accounts}
          getRowId={(a) => a.id}
          empty={
            <EmptyState
              title="No households in this book"
              description="This organization&apos;s tenant has no accounts yet — switch organizations, or add the first household."
            />
          }
        />
      )}
    </div>
  );
}
