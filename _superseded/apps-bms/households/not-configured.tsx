import { Card } from "@insurimple/design-system";

/**
 * Shown when there is no database configured — which is the case on the
 * deployed site today. Better than a stack trace: it says what is missing and
 * how to fix it, in the product's voice (what happened, then what to do).
 */
export function NotConfigured() {
  return (
    <Card title="No database configured">
      <p className="text-body text-text-2">
        These screens read live brokerage data, and this environment has no
        database connection set up yet.
      </p>
      <p className="mt-4 text-small text-text-3">
        To run them locally, set <code>DATABASE_URL</code> and{" "}
        <code>DEV_TENANT_ID</code>, then run{" "}
        <code>pnpm --filter @insurimple/db reset</code>. See{" "}
        <code>packages/db/README.md</code>.
      </p>
    </Card>
  );
}
