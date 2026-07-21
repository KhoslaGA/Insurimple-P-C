-- ============================================================================
-- 0008_clerk_org.sql
-- Clerk organization mapping. The active Clerk org's ID is the tenant key:
-- the API resolves tenant by clerk_org_id from the verified JWT's org claim,
-- never from a request parameter (CLAUDE.md invariant 2).
-- Backfill: run `pnpm --filter @insurimple/db link-org -- <tenant-uuid> <org_...>`
-- after creating the organization in Clerk (see docs/auth.md).
-- ============================================================================

ALTER TABLE tenant ADD COLUMN IF NOT EXISTS clerk_org_id text;
CREATE UNIQUE INDEX IF NOT EXISTS tenant_clerk_org_id_key
    ON tenant (clerk_org_id) WHERE clerk_org_id IS NOT NULL;
