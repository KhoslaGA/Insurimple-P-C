/**
 * Tenant scoping (TR.3) — the buildable analog of Postgres RLS (CLAUDE.md #2:
 * multi-tenancy from row one, vendor-blind).
 *
 * Until the NestJS + Postgres layer exists (with FORCE ROW LEVEL SECURITY,
 * WITH CHECK, and a pgTAP red-team), every read of shop/result data is scoped to
 * a tenant HERE, in code. A caller can never receive another tenant's rows.
 * The DB-level enforcement + isolation red-team is deferred to the persistence
 * ticket — this is the pre-persistence guard, and it is test-asserted.
 */
import type { QuoteShop } from './shop';
import type { QuoteResult } from './result';

/** Keep only the rows belonging to `tenantId`. */
export function scopeToTenant<T extends { tenantId: string }>(
  tenantId: string,
  rows: readonly T[],
): T[] {
  return rows.filter((row) => row.tenantId === tenantId);
}

/** A tenant-scoped view of shops + results — nothing outside the tenant crosses. */
export function tenantShopResults(
  tenantId: string,
  shops: readonly QuoteShop[],
  results: readonly QuoteResult[],
): { shops: QuoteShop[]; results: QuoteResult[] } {
  return {
    shops: scopeToTenant(tenantId, shops),
    results: scopeToTenant(tenantId, results),
  };
}
