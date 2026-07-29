import { Badge } from "@insurimple/design-system";
import type { MarketRow, MeProfile, HouseholdDetail } from "@insurimple/contracts";
import { api, API_CONFIGURED } from "../../../lib/api";
import { DEMO_MARKETS, DEMO_ME, DEMO_HOUSEHOLDS } from "../../../lib/demo-data";
import { RatingView } from "../../../components/RatingView";
import type { PolicyOption } from "../../../components/ProofsView";

export const dynamic = "force-dynamic";

const LINE_LABEL: Record<string, string> = {
  auto: "AUTO", property: "HAB", tenant: "TENA", condo: "CONDO",
  umbrella: "UMBR", commercial: "COMM", life: "LIFE",
};

function policyOptions(households: HouseholdDetail[]): PolicyOption[] {
  return households.flatMap((h) =>
    h.policies.map((p) => ({
      policy_id: p.id,
      label: `${h.header.display_name} — ${LINE_LABEL[p.line] ?? p.line.toUpperCase()} ${p.policy_number ?? ""}`.trim(),
    })),
  );
}

/**
 * Rating & carrier — the CarrierAdapter seam. Pre-appointment every adapter is
 * the deterministic mock, and results say so at the source rather than being
 * inferred from configuration (invariant 7).
 */
export default async function RatingPage() {
  const preview = !API_CONFIGURED;
  let markets: MarketRow[] = [];
  let me: MeProfile | null = null;
  let policies: PolicyOption[] = [];
  let problem: string | null = null;

  if (preview) {
    markets = DEMO_MARKETS;
    me = DEMO_ME;
    policies = policyOptions(Object.values(DEMO_HOUSEHOLDS));
  } else {
    try {
      const [rows, profile, accounts] = await Promise.all([
        api<MarketRow[]>("/markets"),
        api<MeProfile>("/me"),
        api<{ id: string }[]>("/accounts"),
      ]);
      markets = rows;
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
          Couldn’t load markets — the API said: {problem}
        </div>
      </div>
    );
  }

  const canQuote = !!me?.capabilities.includes("pc.quote.create");
  const appointed = markets.filter((m) => m.active).length;

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col px-8 py-6">
      <header className="mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-text-1">Rating &amp; carrier</h1>
          {preview ? <Badge tone="warning">Preview data</Badge> : null}
        </div>
        <p className="text-small text-text-2">
          Indicative rating across every market that writes the line, and how each carrier is
          actually reached.
        </p>
      </header>

      {appointed === 0 ? (
        <div className="mb-4 rounded-card border border-warning bg-warning-tint px-4 py-3 text-small text-warning">
          <i className="ti ti-alert-triangle mr-1.5 text-[15px]" />
          <strong>No live appointments.</strong> Every market below is pending, so rating runs
          on the deterministic mock adapter and nothing here is bindable. Real appointments
          replace one adapter each — no screen changes.
        </div>
      ) : null}

      <RatingView markets={markets} policies={policies} canQuote={canQuote} preview={preview} />
    </div>
  );
}
