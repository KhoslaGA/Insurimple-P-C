#!/usr/bin/env node
/**
 * The export round trip, as a CI gate (DB.7 acceptance).
 *
 * Seeds decided and pending ai_action rows across three days, runs the real
 * export, reads the Parquet back with a real reader, and asserts what survived.
 * Runs against a virgin migrated database and cleans up after itself.
 *
 * "The export ran without error" is not the criterion. A writer can emit a file
 * no reader accepts, and that surfaces on the first training run — months
 * later, against months of files.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const HERE = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL is required'); process.exit(1); }

const TENANT = '11111111-1111-1111-1111-111111111111';
const STAFF = '50000000-0000-0000-0000-000000000001';
const out = mkdtempSync(join(tmpdir(), 'ai-export-'));
const client = new pg.Client({ connectionString: url });
await client.connect();

const fail = (m) => { console.error(`EXPORT TEST FAILED: ${m}`); process.exitCode = 1; };

try {
  await client.query(`SELECT set_config('app.current_actor','system',false)`);
  await client.query(
    `INSERT INTO tenant (id, legal_name) VALUES ($1,'Export Test')
     ON CONFLICT DO NOTHING`, [TENANT]);
  await client.query(
    `INSERT INTO staff (id, tenant_id, full_name, email)
     VALUES ($1,$2,'Export Tester','export@example.test') ON CONFLICT DO NOTHING`,
    [STAFF, TENANT]);
  await client.query(`DELETE FROM ai_action WHERE tenant_id = $1`, [TENANT]);

  // 30 decided rows over three days, and 7 pending ones that must not leave.
  await client.query(`
    INSERT INTO ai_action (id, tenant_id, action_type, model, suggestion, confidence,
                           decision, decided_by, decided_at, created_at)
    SELECT uuidv7(), $1, (ARRAY['summarise','draft_email','flag_risk'])[1 + i % 3],
           'claude-test', jsonb_build_object('text','x','items',jsonb_build_array(1,2)),
           0.5 + (i % 40)::numeric / 100,
           (ARRAY['accepted','rejected','amended'])[1 + i % 3], $2, now(),
           now() - make_interval(days => i % 3)
      FROM generate_series(1, 30) i`, [TENANT, STAFF]);
  await client.query(`
    INSERT INTO ai_action (id, tenant_id, action_type, model, suggestion, context)
    SELECT uuidv7(), $1, 'summarise', 'claude-test', '{"text":"x"}'::jsonb,
           '{"insured":"A Real Person"}'::jsonb
      FROM generate_series(1, 7)`, [TENANT]);

  const run = (script, args) =>
    execFileSync('node', [join(HERE, script), ...args],
      { env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8' });

  const exported = run('export-ai-actions.mjs', ['--out', out]);
  process.stdout.write(exported);
  if (!/exported 30 row\(s\) across 3 date partition\(s\)/.test(exported)) {
    fail(`expected 30 rows over 3 partitions; the 7 pending rows must not export.\n${exported}`);
  }

  process.stdout.write(run('verify-export.mjs', [out]));

  const left = await client.query(
    `SELECT count(*)::int AS n FROM ai_action
      WHERE tenant_id = $1 AND exported_at IS NULL AND decision <> 'pending'`, [TENANT]);
  if (left.rows[0].n !== 0) fail(`${left.rows[0].n} decided row(s) were not marked exported`);

  const pending = await client.query(
    `SELECT count(*)::int AS n FROM ai_action
      WHERE tenant_id = $1 AND decision = 'pending' AND exported_at IS NOT NULL`, [TENANT]);
  if (pending.rows[0].n !== 0) fail(`${pending.rows[0].n} pending row(s) were marked exported`);

  // A second run must be a no-op: the cursor is exported_at, and a re-export
  // would duplicate labels in the training set on every scheduled run.
  const again = run('export-ai-actions.mjs', ['--out', out]);
  if (!/nothing to export/.test(again)) fail(`a second run exported again:\n${again}`);

  if (!process.exitCode) console.log('EXPORT ROUND TRIP PASSED');
} finally {
  await client.query(`DELETE FROM ai_action WHERE tenant_id = $1`, [TENANT]).catch(() => {});
  await client.end();
  rmSync(out, { recursive: true, force: true });
}
