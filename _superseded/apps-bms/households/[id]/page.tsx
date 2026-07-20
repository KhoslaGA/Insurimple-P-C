import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getHouseholdRecord,
  listHouseholdTransactions,
} from "@insurimple/db";
import {
  formatCents,
  formatDate,
  formatTerm,
  policyStatusLabel,
  policyStatusTone,
  transactionStateLabel,
  transactionStateTone,
  type PolicyDetail,
} from "@insurimple/contracts";
import { Badge, Card, FieldList } from "@insurimple/design-system";
import { getTenantContext, isConfigured } from "@/lib/session";
import { NotConfigured } from "../not-configured";

export const dynamic = "force-dynamic";

/* Next 15+: params and searchParams are Promises. */
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ policy?: string }>;
};

export default async function HouseholdRecordPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { policy: selectedPolicyId } = await searchParams;

  if (!isConfigured()) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <NotConfigured />
      </main>
    );
  }

  const ctx = getTenantContext()!;
  const [household, transactions] = await Promise.all([
    getHouseholdRecord(ctx, id),
    listHouseholdTransactions(ctx, id),
  ]);

  /* Null covers both "no such household" and "belongs to another tenant" — RLS
     makes them indistinguishable, so a probe cannot use 404-vs-403 to discover
     that a record exists in someone else's book. */
  if (!household) notFound();

  const policies = household.policies as PolicyDetail[];
  const selected =
    policies.find((p) => p.id === selectedPolicyId) ?? policies[0] ?? null;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      {/* ------------------------------------------------------- header -- */}
      <nav className="mb-4 text-caption text-text-3">
        <Link href="/households" className="text-text-3 no-underline hover:underline">
          Households
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{household.displayName}</span>
      </nav>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h1 font-medium text-text-1">
            {household.displayName}
          </h1>
          <Badge tone={household.status === "active" ? "success" : "neutral"}>
            {household.status === "active" ? "Active" : "Prospect"}
          </Badge>
        </div>
        <p className="mt-1 text-small text-text-2">
          {household.clientCode && <span>{household.clientCode}</span>}
          {household.clientCode && household.address && (
            <span aria-hidden="true"> · </span>
          )}
          {household.address && (
            <span>
              {household.address.line1}, {household.address.city}{" "}
              {household.address.province} {household.address.postalCode}
            </span>
          )}
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {/* ------------------------------------------------------ people -- */}
        <Card title="People" flush>
          <ul>
            {household.parties.map((party) => (
              <li
                key={party.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border-1 px-4 py-3 last:border-0"
              >
                <span>
                  <span className="block text-small font-medium text-text-1">
                    {party.firstName} {party.lastName}
                  </span>
                  <span className="block text-caption text-text-3">
                    {party.roleInHousehold === "primary"
                      ? "Primary"
                      : party.roleInHousehold === "spouse"
                        ? "Spouse"
                        : "Member"}
                    {party.dateOfBirth && ` · born ${formatDate(party.dateOfBirth)}`}
                  </span>
                </span>
                {/* CASL: absence of evidence is absence of consent, and the
                    record should say so plainly rather than stay silent. */}
                {party.caslConsentAt ? (
                  <Badge tone="success">Consent on file</Badge>
                ) : (
                  <Badge tone="warning">No consent on file</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>

        {/* ---------------------------------------------------- policies -- */}
        <Card
          title="Policies"
          flush
          action={
            <span className="text-caption text-text-3">
              {policies.length === 1 ? "1 line" : `${policies.length} lines`}
            </span>
          }
        >
          {policies.length === 0 ? (
            <p className="px-4 py-8 text-center text-small text-text-3">
              No policies on this household yet.
            </p>
          ) : (
            <ul>
              {policies.map((p) => {
                const isSelected = selected?.id === p.id;
                return (
                  <li key={p.id} className="border-b border-border-1 last:border-0">
                    {/* Selection lives in the URL, so the panel stays a server
                        component and the view is shareable. */}
                    <Link
                      href={`/households/${household.id}?policy=${p.id}`}
                      scroll={false}
                      className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 no-underline hover:bg-surface-panel ${
                        isSelected ? "bg-tenant-primary-tint" : ""
                      }`}
                    >
                      <span className="w-14 flex-none text-caption font-medium text-text-2">
                        {p.lineCode}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-small font-medium text-text-1">
                          {p.description}
                        </span>
                        <span className="block text-caption text-text-3">
                          {p.policyNumber} ·{" "}
                          {formatTerm(p.effectiveDate, p.expiryDate)}
                        </span>
                      </span>
                      <span className="flex flex-none items-center gap-3">
                        <span className="text-small tabular-nums text-text-1">
                          {formatCents(p.premiumCents)}
                        </span>
                        <Badge tone={policyStatusTone[p.status]}>
                          {policyStatusLabel[p.status]}
                        </Badge>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* ----------------------------------------------- policy detail -- */}
        {selected && (
          <Card
            title={`${selected.lineCode} — ${selected.description}`}
            action={
              selected.carrierIsFixture ? (
                /* Invariant #7: a fixture must never read as a live carrier
                   appointment. Say so on the record itself. */
                <Badge tone="warning">Fixture carrier</Badge>
              ) : null
            }
          >
            <FieldList
              fields={[
                { label: "Policy number", value: selected.policyNumber },
                {
                  label: "Status",
                  value: (
                    <Badge tone={policyStatusTone[selected.status]}>
                      {policyStatusLabel[selected.status]}
                    </Badge>
                  ),
                },
                {
                  label: "Term",
                  value: formatTerm(selected.effectiveDate, selected.expiryDate),
                },
                {
                  label: "Carrier",
                  value: selected.carrierName
                    ? `${selected.carrierName}${selected.carrierCode ? ` (${selected.carrierCode})` : ""}`
                    : "—",
                },
                {
                  label: "Bill",
                  value: selected.billType === "direct" ? "Direct bill" : "Agency bill",
                },
                { label: "Source", value: selected.source ?? "—" },
                { label: "Premium", value: formatCents(selected.premiumCents) },
                {
                  label: "Estimated premium",
                  value: formatCents(selected.estimatedPremiumCents),
                },
                {
                  label: "Est. commission",
                  value:
                    selected.commissionCents > 0
                      ? `${formatCents(selected.commissionCents)} / yr` +
                        (selected.commissionRate !== null
                          ? ` (${Math.round(selected.commissionRate * 100)}%)`
                          : "")
                      : "—",
                },
                {
                  label: "Agency balance",
                  value: formatCents(selected.agencyBalanceCents),
                },
                { label: "Invoice to", value: selected.invoiceTo ?? "—", wide: true },
                ...(selected.comment
                  ? [{ label: "Note", value: selected.comment, wide: true }]
                  : []),
              ]}
            />
          </Card>
        )}

        {/* ------------------------------------------------ service log -- */}
        <Card title="Service history" flush>
          {transactions.length === 0 ? (
            <p className="px-4 py-8 text-center text-small text-text-3">
              No transactions on this household yet.
            </p>
          ) : (
            <ul>
              {transactions.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border-1 px-4 py-3 last:border-0"
                >
                  <span className="w-8 flex-none text-caption tabular-nums text-text-3">
                    {t.seq}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-small text-text-1">
                      <span className="font-medium">{t.typeName}</span>
                      {" — "}
                      {t.description}
                    </span>
                    <span className="block text-caption text-text-3">
                      {t.effectiveDate
                        ? `Effective ${formatDate(t.effectiveDate)}`
                        : "No effective date"}
                      {t.actorName && ` · ${t.actorName}`}
                    </span>
                  </span>
                  <Badge tone={transactionStateTone[t.state]}>
                    {transactionStateLabel[t.state]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
