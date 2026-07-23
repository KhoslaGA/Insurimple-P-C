import Link from "next/link";
import { Button, EmptyState } from "@insurimple/design-system";
import type { HouseholdDetail } from "@insurimple/contracts";
import { api } from "../../../../lib/api";
import { HouseholdDetailView } from "../../../../components/HouseholdDetailView";

export const dynamic = "force-dynamic";

/** The anchor screen — real data through the RLS-scoped API, no fixtures. */
export default async function HouseholdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let detail: HouseholdDetail | null = null;
  let problem: string | null = null;
  try {
    detail = await api<HouseholdDetail>(`/accounts/${id}`);
  } catch (e) {
    problem = e instanceof Error ? e.message : String(e);
  }

  if (!detail) {
    const notFound = problem?.includes("404");
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <EmptyState
          title={notFound ? "Household not found" : "Couldn’t load this household"}
          description={
            notFound
              ? "No account with this id in your tenant’s book — it may belong to another organization, or the link is stale."
              : `The API said: ${problem}. Check that apps/api is running and your organization is linked to a tenant.`
          }
          action={
            <Link href="/locate">
              <Button variant="secondary">Back to Locate</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return <HouseholdDetailView detail={detail} />;
}
