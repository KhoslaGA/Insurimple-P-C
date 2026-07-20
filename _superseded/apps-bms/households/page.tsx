import Link from "next/link";
import { listHouseholds } from "@insurimple/db";
import { Badge, Card } from "@insurimple/design-system";
import { getTenantContext, isConfigured } from "@/lib/session";
import { NotConfigured } from "./not-configured";

/* Reads live data per request. Next 15+ does not cache fetch by default, but
   database reads are not fetch — this is explicit so a future build does not
   statically prerender one tenant's book and serve it to another. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Households — Insurimple",
};

export default async function HouseholdsPage() {
  if (!isConfigured()) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="mb-6 text-h1 font-medium text-text-1">Households</h1>
        <NotConfigured />
      </main>
    );
  }

  const ctx = getTenantContext()!;
  const households = await listHouseholds(ctx);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="mb-1 text-h1 font-medium text-text-1">Households</h1>
      <p className="mb-6 text-small text-text-2">
        {households.length === 1
          ? "1 household"
          : `${households.length} households`}{" "}
        in your book.
      </p>

      <Card flush>
        {households.length === 0 ? (
          <p className="px-4 py-8 text-center text-small text-text-3">
            No households yet.
          </p>
        ) : (
          <ul>
            {households.map((h) => (
              <li
                key={h.id}
                className="border-b border-border-1 last:border-0"
              >
                <Link
                  href={`/households/${h.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 no-underline hover:bg-surface-panel"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-small font-medium text-text-1">
                      {h.displayName}
                    </span>
                    {h.clientCode && (
                      <span className="block text-caption text-text-3">
                        {h.clientCode}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-none items-center gap-3">
                    <span className="text-caption text-text-3">
                      {h.policyCount === 1
                        ? "1 policy"
                        : `${h.policyCount} policies`}
                    </span>
                    <Badge tone={h.status === "active" ? "success" : "neutral"}>
                      {h.status === "active" ? "Active" : "Prospect"}
                    </Badge>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
