import { Badge, EmptyState } from "@insurimple/design-system";
import type {
  DocumentRow,
  DocumentTemplate,
  MeProfile,
  HouseholdDetail,
} from "@insurimple/contracts";
import { api, API_CONFIGURED } from "../../../lib/api";
import { DEMO_DOCUMENTS, DEMO_TEMPLATES, DEMO_ME, DEMO_HOUSEHOLDS } from "../../../lib/demo-data";
import { ProofsView, type PolicyOption } from "../../../components/ProofsView";

export const dynamic = "force-dynamic";

const LINE_LABEL: Record<string, string> = {
  auto: "AUTO", property: "HAB", tenant: "TENA", condo: "CONDO",
  umbrella: "UMBR", commercial: "COMM", life: "LIFE",
};

/** Flatten the book into issuable policies (label carries household + line). */
function policyOptions(households: HouseholdDetail[]): PolicyOption[] {
  return households.flatMap((h) =>
    h.policies
      .filter((p) => p.status === "in_force")
      .map((p) => ({
        policy_id: p.id,
        label: `${h.header.display_name} — ${LINE_LABEL[p.line] ?? p.line.toUpperCase()} ${p.policy_number ?? ""}`.trim(),
      })),
  );
}

/**
 * Proofs & documents — the highest-frequency client-facing output. Issuing is
 * licence-gated (pc.proof.issue) at the database; this screen reflects that.
 */
export default async function ProofsPage() {
  const preview = !API_CONFIGURED;
  let documents: DocumentRow[] = [];
  let templates: DocumentTemplate[] = [];
  let me: MeProfile | null = null;
  let policies: PolicyOption[] = [];
  let problem: string | null = null;

  if (preview) {
    documents = DEMO_DOCUMENTS;
    templates = DEMO_TEMPLATES;
    me = DEMO_ME;
    policies = policyOptions(Object.values(DEMO_HOUSEHOLDS));
  } else {
    try {
      const [docs, tpls, profile] = await Promise.all([
        api<DocumentRow[]>("/documents"),
        api<DocumentTemplate[]>("/documents/templates"),
        api<MeProfile>("/me"),
      ]);
      documents = docs;
      templates = tpls;
      me = profile;
      const accounts = await api<{ id: string }[]>("/accounts");
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
        <EmptyState title="Couldn’t load documents" description={`The API said: ${problem}.`} />
      </div>
    );
  }

  const canIssue = !!me?.capabilities.includes("pc.proof.issue");

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col px-8 py-6">
      <header className="mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-text-1">Proofs &amp; documents</h1>
          {preview ? <Badge tone="warning">Preview data</Badge> : null}
        </div>
        <p className="text-small text-text-2">
          Liability slips, evidence of insurance and letters of experience — rendered from
          live policy data and retained for six years.
        </p>
      </header>
      <ProofsView
        documents={documents}
        templates={templates}
        policies={policies}
        canIssue={canIssue}
        preview={preview}
      />
    </div>
  );
}
