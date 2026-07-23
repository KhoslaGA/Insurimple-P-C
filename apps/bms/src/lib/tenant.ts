import { getTenant } from "@insurimple/contracts";

/**
 * Resolves the active tenant. TODAY: a fixed mock tenant (KLC). LATER: this is
 * the single seam where the Clerk Organization claim replaces the mock — tenant
 * context must come from the org claim, never a request param (invariant #2).
 */
export function getCurrentTenantId(): string {
  return "klc";
}

export function getCurrentTenant() {
  const tenant = getTenant(getCurrentTenantId());
  if (!tenant) throw new Error("Active tenant not found");
  return tenant;
}
