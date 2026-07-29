import { Badge, MetricCard } from "@insurimple/design-system";
import type { ClaimRow, MeProfile, HouseholdDetail } from "@insurimple/contracts";
import { api, API_CONFIGURED } from "../../../lib/api";
import { DEMO_CLAIMS, DEMO_ME, DEMO_HOUSEHOLDS } from "../../../lib/demo-data";
import { ClaimsView, type FnolPolicyOption } from "../../../components/ClaimsView";

export const dynamic = "force-dynamic";

const LINE_LABEL: Record<string, string> = {
  auto: "AUTO", property: "HAB", tenant: "TENA", condo: "CONDO",
  umbrella: "UMBR", commercial: "COMM", life: "LIFE",
};

function policyOptions(households: HouseholdDetail[]): FnolPolicyOption[] {
  return households.flatMap((h) =>
    h.policies
      .filter((p) => p.status === "in_force")
      .map((p) => ({
        policy_id: p.id,
        account_id: h.header.id,
        carrier_id: null,
        label: `${h.header.display_name} — ${LINE_LABEL[p.line] ?? p.line.toUpperCase()} ${p.policy_number ?? ""}`.trim(),
      })),
  );
}

const num = (v: number | string | null) => Number(v ?? 0);

/** Claims — intake and carrier referral. Adjudication stays with the carrier. */
export default async function ClaimsPage() {
  const preview = !API_CONFIGURED;
  let claims: ClaimRow[] = [];
  let me: MeProfile | null = null;
  let policies: FnolPolicyOption[] = [];
  let problem: string | null = null;

  if (preview) {
    claims = DEMO_CLAIMS;
    me = DEMO_ME;
    policies = policyOptions(Object.values(DEMO_HOUSEHOLDS));
  } else {
    try {
      const [rows, profile, accounts] = await Promise.all([
        api<ClaimRow[]>("/claims"),
        api<MeProfile>("/me"),
        api<{ id: string }[]>("/accounts"),
      ]);
      claims = rows;
      me = profile;
      const details = await Promise.all(
        accounts.map((a) => api<HouseholdDetail>(`/accounts/${a.id}`)),
      );
      policies = policyOptions(details);
    } catch (e) {
      problem = e instanceof Error ? e.message : String(e);
    }
  }

  if (problem) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <div className="rounded-card border border-dashed border-border-2 bg-surface-panel px-6 py-10 text-center text-small text-text-2">
          Couldn’t load claims — the API said: {problem}
        </div>
      </div>
    );
  }

  const canReport = !!me?.capabilities.includes("pc.txn.create");
  const openClaims = claims.filter((c) => !["settled", "closed", "denied"].includes(c.status));
  const reserves = openClaims.reduce((s, c) => s + num(c.reserve), 0);
  const awaitingNumber = claims.filter((c) => !c.claim_number).length;

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col px-8 py-6">
      <header className="mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-text-1">Claims</h1>
          {preview ? <Badge tone="warning">Preview data</Badge> : null}
        </div>
        <p className="text-small text-text-2">
          First notice of loss and carrier referral — the carrier adjudicates; we hold the
          evidence that the loss was reported and chased.
        </p>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard icon="flame" label="Open claims" value={openClaims.length} hint="not yet closed" />
        <MetricCard
          icon="coin"
          label="Reserves"
          value={`$${Math.round(reserves).toLocaleString("en-CA")}`}
          hint="on open claims"
        />
        <MetricCard icon="hash" label="Awaiting number" value={awaitingNumber} hint="carrier not confirmed" />
        <MetricCard icon="archive" label="Total reported" value={claims.length} hint="all time" />
      </div>

      <ClaimsView claims={claims} policies={policies} canReport={canReport} preview={preview} />
    </div>
  );
}
