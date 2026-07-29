import { Badge } from "@insurimple/design-system";
import type { PolicyListRow } from "@insurimple/contracts";
import { api, API_CONFIGURED } from "../../../lib/api";
import { DEMO_POLICIES } from "../../../lib/demo-data";
import { PoliciesView } from "../../../components/PoliciesView";

export const dynamic = "force-dynamic";

/** The flat book — every policy, filterable, clicking through to the household. */
export default async function PoliciesPage() {
  const preview = !API_CONFIGURED;
  let policies: PolicyListRow[] = [];
  let problem: string | null = null;

  if (preview) {
    policies = DEMO_POLICIES;
  } else {
    try {
      policies = await api<PolicyListRow[]>("/policies");
    } catch (e) {
      problem = e instanceof Error ? e.message : String(e);
    }
  }

  if (problem) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <div className="rounded-card border border-dashed border-border-2 bg-surface-panel px-6 py-10 text-center text-small text-text-2">
          Couldn’t load policies — the API said: {problem}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col px-8 py-6">
      <header className="mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-text-1">Policies</h1>
          {preview ? <Badge tone="warning">Preview data</Badge> : null}
        </div>
        <p className="text-small text-text-2">Every policy in the book, by line, carrier and renewal date.</p>
      </header>
      <PoliciesView policies={policies} />
    </div>
  );
}
