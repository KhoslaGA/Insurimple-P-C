import "server-only";

import type { TenantContext } from "@insurimple/db";

/**
 * Where tenant context comes from.
 *
 * Invariant #2: "Tenant context comes from the Clerk org claim, NEVER from a
 * request param." Clerk is not wired up yet, so this reads a development
 * tenant from server-side environment variables instead.
 *
 * What matters is that it is NOT a route param, query string, header or body —
 * anything the caller controls. Swapping this for Clerk later changes only the
 * body of this function; no page or query has to move, because none of them
 * ever see a tenant id they could have chosen.
 *
 * `import "server-only"` makes importing this from a client component a build
 * error rather than a runtime credential leak.
 */
export function getTenantContext(): TenantContext | null {
  const tenantId = process.env.DEV_TENANT_ID;
  const userId = process.env.DEV_USER_ID;

  if (!tenantId) return null;

  return { tenantId, userId };
}

/**
 * True when the app has a database and a tenant to talk to.
 *
 * Production currently has neither — the deployed site is a holding page — so
 * screens check this and render an explanatory state instead of throwing a
 * connection error at a visitor.
 */
export function isConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DEV_TENANT_ID);
}
