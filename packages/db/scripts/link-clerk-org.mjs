#!/usr/bin/env node
/**
 * Backfill tenant.clerk_org_id after the organization exists in Clerk.
 *   DATABASE_URL=... node scripts/link-clerk-org.mjs <tenant-uuid> <clerk-org-id>
 * Example (seed tenant "Insurimple Brokerage Inc."):
 *   node scripts/link-clerk-org.mjs 11111111-1111-1111-1111-111111111111 org_2abc...
 */
import pg from 'pg';

const [tenantId, orgId] = process.argv.slice(2);
if (!tenantId || !orgId || !orgId.startsWith('org_')) {
  console.error('usage: link-clerk-org.mjs <tenant-uuid> <clerk-org-id (org_...)>');
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL is required'); process.exit(1); }

const client = new pg.Client({ connectionString: url });
await client.connect();
const r = await client.query(
  'UPDATE tenant SET clerk_org_id=$2 WHERE id=$1 RETURNING legal_name, clerk_org_id',
  [tenantId, orgId],
);
if (r.rowCount === 0) { console.error(`no tenant with id ${tenantId}`); await client.end(); process.exit(1); }
console.log(`linked "${r.rows[0].legal_name}" -> ${r.rows[0].clerk_org_id}`);
await client.end();
