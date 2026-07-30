#!/usr/bin/env node
/**
 * The tenant isolation gate.
 *
 *   node scripts/rls-test.mjs
 *   node scripts/rls-test.mjs --mutate account:disable   (mutation check)
 *   node scripts/rls-test.mjs --mutate account:noforce
 *
 * Two connections, deliberately:
 *
 *   DATABASE_URL      the owner. Applies migrations, installs pgTAP, creates
 *                     the probes and the fixture. Everything privileged.
 *   insurimple_app    a second connection that owns nothing and holds neither
 *                     SUPERUSER nor BYPASSRLS. The suite runs here.
 *
 * SET ROLE would have been simpler and would have been wrong: it can be reset
 * mid-session, it leaves the connection's real identity privileged, and it
 * proves nothing about whether the application's own credentials are safe. The
 * suite is only worth running against a connection that could not escalate.
 *
 * The app role's password is set here rather than in a migration, because the
 * migration set is checked in. This script is test-only; production supplies
 * the credential from its secret store.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const TEST = join(ROOT, 'test');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required (the owner connection)');
  process.exit(1);
}

const mutateArg = process.argv.find(a => a.startsWith('--mutate'));
const mutation = mutateArg ? (mutateArg.split('=')[1] ?? process.argv[process.argv.indexOf(mutateArg) + 1]) : null;

const APP_PASSWORD = 'rls-suite-local-only';

const owner = new pg.Client({ connectionString: url });
await owner.connect();

const sql = f => readFileSync(join(TEST, f), 'utf8');

try {
  await owner.query('CREATE EXTENSION IF NOT EXISTS pgtap');
} catch (err) {
  console.error(
    'pgTAP is not installed on this server.\n' +
    '  Debian/Ubuntu:  apt-get install postgresql-16-pgtap\n' +
    '  container:      docker exec <pg> bash -c "apt-get update && apt-get install -y postgresql-16-pgtap"\n' +
    `  (${err.message})`,
  );
  process.exit(1);
}

await owner.query(sql('rls_probes.sql'));
await owner.query(sql('rls_fixture.sql'));

if (mutation) {
  const [table, kind] = mutation.split(':');
  const clause = kind === 'noforce' ? 'NO FORCE ROW LEVEL SECURITY' : 'DISABLE ROW LEVEL SECURITY';
  if (!/^[a-z_][a-z0-9_]*$/.test(table)) throw new Error(`refusing to mutate ${table}`);
  await owner.query(`ALTER TABLE ${table} ${clause}`);
  console.error(`\n### MUTATION: ${table} ${clause} — the suite is expected to go red here.\n`);
}

await owner.query(`ALTER ROLE insurimple_app LOGIN PASSWORD ${quote(APP_PASSWORD)}`);
await owner.end();

// Same host/port/database, different credentials.
const appUrl = new URL(url);
appUrl.username = 'insurimple_app';
appUrl.password = APP_PASSWORD;

const app = new pg.Client({ connectionString: appUrl.toString() });
await app.connect();

let results;
try {
  results = await app.query(sql('rls.sql'));
} catch (err) {
  console.error(`\nRLS SUITE ABORTED: ${err.message}\n`);
  await app.end();
  process.exit(1);
}
await app.end();

const lines = (Array.isArray(results) ? results : [results])
  .flatMap(r => r.rows ?? [])
  .map(row => String(Object.values(row)[0]))
  .filter(Boolean);

console.log(lines.join('\n'));

const failed = lines.filter(l => l.startsWith('not ok'));
const planned = Number(lines.find(l => /^1\.\.\d+$/.test(l))?.slice(3) ?? 0);
const ran = lines.filter(l => /^(ok|not ok) \d+/.test(l)).length;

console.log('');
if (failed.length) {
  console.error(`RLS SUITE FAILED — ${failed.length} of ${ran} assertions:`);
  for (const f of failed) console.error(`  ${f}`);
  process.exit(1);
}
if (planned === 0 || ran !== planned) {
  console.error(`RLS SUITE INCONCLUSIVE — planned ${planned} assertions, ran ${ran}.`);
  process.exit(1);
}
console.log(`RLS SUITE PASSED — ${ran} assertions as insurimple_app, no superuser, no owner.`);

function quote(s) {
  return `'${s.replace(/'/g, "''")}'`;
}
