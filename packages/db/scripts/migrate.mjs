#!/usr/bin/env node
/**
 * Migration runner for @insurimple/db.
 *
 *   node scripts/migrate.mjs           apply pending migrations
 *   node scripts/migrate.mjs --seed    apply, then load dev seed (NON-PROD ONLY)
 *   node scripts/migrate.mjs --test    apply, then run test.sql assertions (CI gate)
 *
 * Requires DATABASE_URL. Migrations are applied in filename order inside a
 * transaction each, and recorded in schema_migrations so reruns are no-ops.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MIGRATIONS = join(ROOT, 'migrations');

const args = new Set(process.argv.slice(2));
const doSeed = args.has('--seed');
const doTest = args.has('--test');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
if (doSeed && process.env.NODE_ENV === 'production') {
  console.error('refusing to seed in production');
  process.exit(1);
}
if (doSeed && doTest) {
  console.error(
    '--seed and --test are mutually exclusive.\n' +
    'test.sql asserts exact row counts (e.g. "tenant sees exactly 1 account"), which only\n' +
    'holds on a virgin database. CI runs --test against ephemeral Postgres.',
  );
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`);

const applied = new Set(
  (await client.query('SELECT filename FROM schema_migrations')).rows.map(r => r.filename),
);

const files = readdirSync(MIGRATIONS).filter(f => f.endsWith('.sql')).sort();
let count = 0;

for (const f of files) {
  if (applied.has(f)) {
    console.log(`  skip     ${f}`);
    continue;
  }
  const sql = readFileSync(join(MIGRATIONS, f), 'utf8');
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [f]);
    await client.query('COMMIT');
    console.log(`  applied  ${f}`);
    count++;
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(`  FAILED   ${f}\n${e.message}`);
    await client.end();
    process.exit(1);
  }
}
console.log(count ? `\n${count} migration(s) applied.` : '\nSchema up to date.');

/** These scripts are psql-flavoured; node-pg cannot parse backslash meta-commands. */
function readSql(...parts) {
  return readFileSync(join(ROOT, ...parts), 'utf8')
    .split('\n')
    .filter(l => !l.trim().startsWith('\\'))
    .join('\n');
}

if (doSeed) {
  try {
    await client.query(readSql('scripts', 'seed_dev.sql'));
    console.log('Dev seed loaded.');
  } catch (e) {
    console.error(`SEED FAILED: ${e.message}`);
    await client.end();
    process.exit(1);
  }
}

if (doTest) {
  const { rows } = await client.query('SELECT count(*)::int AS n FROM tenant');
  if (rows[0].n > 0) {
    console.error(
      `Refusing to run assertions: database already has ${rows[0].n} tenant(s).\n` +
      'test.sql asserts exact row counts and requires a virgin database.\n' +
      'Run against ephemeral Postgres (see .github/workflows/ci.yml).',
    );
    await client.end();
    process.exit(1);
  }
  const sql = readSql('test.sql');
  try {
    await client.query(sql);
    console.log('ALL SCHEMA ASSERTIONS PASSED');
  } catch (e) {
    console.error(`SCHEMA ASSERTIONS FAILED: ${e.message}`);
    await client.end();
    process.exit(1);
  }
}

await client.end();
