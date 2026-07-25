import { Badge, EmptyState } from "@insurimple/design-system";
import type { MeProfile, LicenceRow } from "@insurimple/contracts";
import { api, API_CONFIGURED } from "../../../lib/api";
import { DEMO_ME } from "../../../lib/demo-data";

export const dynamic = "force-dynamic";

const CLASS_LABEL: Record<LicenceRow["licence_class"], string> = {
  ribo_l1: "RIBO Level 1",
  ribo_l2: "RIBO Level 2",
  ribo_l3: "RIBO Level 3",
  llqp: "LLQP",
  mortgage_agent: "Mortgage agent",
  unlicensed: "Unlicensed",
};

const MODULE_LABEL: Record<string, string> = {
  pc: "Property & Casualty",
  life: "Life / LLQP",
  mortgage: "Mortgage",
};

const fmtDate = (v: string | null) => {
  if (!v) return "—";
  const d = new Date(`${v.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
};

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border-1 bg-surface-card p-5">
      <h2 className="text-caption font-medium uppercase tracking-caps text-text-3">{title}</h2>
      {subtitle ? <p className="mb-3 mt-0.5 text-small text-text-2">{subtitle}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}

/**
 * My profile — licence, role grants, and the capabilities they actually carry.
 * `capabilities` comes from the same DB function the write guard uses, so this
 * screen shows enforcement, not a parallel guess at it.
 */
export default async function ProfilePage() {
  const preview = !API_CONFIGURED;
  let me: MeProfile | null = null;
  let problem: string | null = null;

  if (preview) {
    me = DEMO_ME;
  } else {
    try {
      me = await api<MeProfile>("/me");
    } catch (e) {
      problem = e instanceof Error ? e.message : String(e);
    }
  }

  if (!me) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <EmptyState title="Couldn’t load your profile" description={`The API said: ${problem}.`} />
      </div>
    );
  }

  const canTransactPC = me.capabilities.includes("pc.txn.create");

  return (
    <div className="mx-auto max-w-4xl px-8 py-6">
      <header className="mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-text-1">My profile</h1>
          {preview ? <Badge tone="warning">Preview data</Badge> : null}
        </div>
        <p className="text-small text-text-2">
          {me.staff?.full_name}
          {me.staff?.email ? `  ·  ${me.staff.email}` : ""}
          {me.staff?.tenant_name ? `  ·  ${me.staff.tenant_name}` : ""}
        </p>
      </header>

      <div className="grid gap-4">
        <Panel
          title="Licences on file"
          subtitle="Authority derives from a licence with an expiry. When one lapses, the capabilities it carried stop working — enforced by the database, not by this screen."
        >
          {me.licences.length ? (
            <div className="flex flex-col gap-2">
              {me.licences.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center gap-3 rounded-control border border-border-1 px-3.5 py-2.5">
                  <span className="font-medium text-text-1">{CLASS_LABEL[l.licence_class]}</span>
                  <span className="text-small tabular-nums text-text-2">{l.licence_number ?? "—"}</span>
                  {l.regulator ? <span className="text-caption text-text-3">{l.regulator}</span> : null}
                  <span className="ml-auto flex items-center gap-2 text-small">
                    <span className="tabular-nums text-text-2">expires {fmtDate(l.expires_on)}</span>
                    {l.expired ? (
                      <Badge tone="danger">Expired</Badge>
                    ) : l.expiring_soon ? (
                      <Badge tone="warning">Expiring soon</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-small text-text-3">
              No licence on file — transaction authority stays off until one is recorded.
            </p>
          )}
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2">
          <Panel title="Roles granted">
            {me.roles.length ? (
              <div className="flex flex-col gap-2">
                {me.roles.map((r) => (
                  <div key={r.role_code} className="flex items-center gap-2 text-small">
                    <Badge tone="accent">{r.role_name}</Badge>
                    <span className="text-caption text-text-3">
                      {r.licence_id ? "licence-anchored" : "no licence anchor"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-small text-text-3">No roles granted.</p>
            )}
          </Panel>

          <Panel title="Tenant modules" subtitle="The commercial boundary — what this brokerage subscribes to.">
            <div className="flex flex-wrap gap-2">
              {me.modules.length ? (
                me.modules.map((m) => <Badge key={m} tone="info">{MODULE_LABEL[m] ?? m}</Badge>)
              ) : (
                <p className="text-small text-text-3">No modules entitled.</p>
              )}
            </div>
          </Panel>
        </div>

        <Panel
          title="Capabilities in force"
          subtitle="Resolved by the database from live grants — the same source the write guard checks."
        >
          <div className="mb-3 flex items-center gap-2 text-small">
            <Badge tone={canTransactPC ? "success" : "danger"}>
              {canTransactPC ? "Can create P&C transactions" : "Cannot create P&C transactions"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {me.capabilities.map((c) => (
              <span key={c} className="rounded-pill bg-surface-sunken px-2 py-0.5 text-caption tabular-nums text-text-2">
                {c}
              </span>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
