#!/usr/bin/env node
/**
 * Export the AI training set out of the transactional database.
 *
 *   node scripts/export-ai-actions.mjs --out ./exports
 *   node scripts/export-ai-actions.mjs --out ./exports --dry-run
 *
 * Why this exists (DB.7): `ai_action` accumulates per operation, not per
 * policy, so its growth is decoupled from book size — and its access pattern,
 * bulk sequential reads for training, is the opposite of everything else in
 * this database. Training reads must not touch the transactional store, so the
 * labels leave on a schedule and the model is trained from the lake.
 *
 * Three things this deliberately does NOT do:
 *
 *   * It does not export `context` or `suggestion` contents. `ai_action_export`
 *     emits the label, the shape of the decision, and identifiers pointing back
 *     to the row. Once a copy is in object storage it is outside every control
 *     in the schema — no RLS, no audit trigger, no retention sweep — so the
 *     client's details stay in the database where the policies still apply.
 *   * It does not export `pending` rows. A suggestion nobody ruled on carries
 *     no label, and treating it as a negative would train the model on
 *     inattention rather than on judgement.
 *   * It does not delete. Marking a row exported and deciding how long to keep
 *     it are separate decisions; `sweep_ai_action_retention()` owns the second
 *     and reads only `ai_action.retain_until`, never the six-year records clock.
 *
 * Output is Hive-partitioned by date — dt=YYYY-MM-DD/ — which is what makes a
 * training run able to read a range without listing the whole prefix. The local
 * directory is the S3 layout: swapping the destination for a bucket is a path
 * change, not a rewrite (DB.8).
 */
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
import { parquetWriteFile } from 'hyparquet-writer';

const args = process.argv.slice(2);
const outRoot = args.includes('--out') ? args[args.indexOf('--out') + 1] : './exports';
const dryRun = args.includes('--dry-run');
const batchSize = 10_000;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

// Column-per-field rather than a jsonb blob: Parquet's value is columnar reads,
// and a training job that wants only (decision, model) should not pay to
// decompress the rest. Types are declared rather than inferred — inference on a
// batch where every `confidence` happens to be null would write a column of the
// wrong type, and the next batch would not match it.
const COLUMNS = [
  ['id',               'STRING'],
  ['tenant_id',        'STRING'],
  ['created_at',       'TIMESTAMP'],
  ['action_type',      'STRING'],
  ['model',            'STRING'],
  ['prompt_version',   'STRING'],
  ['confidence',       'DOUBLE'],
  ['decision',         'STRING'],
  ['decided_at',       'TIMESTAMP'],
  ['was_amended',      'BOOLEAN'],
  ['reject_reason',    'STRING'],
  ['suggestion_keys',  'STRING'],
  ['suggestion_items', 'INT64'],
  ['txn_id',           'STRING'],
  ['policy_id',        'STRING'],
];

const client = new pg.Client({ connectionString: url });
await client.connect();

// The export runs privileged, across tenants, which is why it is a script and
// not an endpoint. tenant_id travels with every row so the lake stays
// partitionable by tenant if a customer ever asks for their slice back.
const { rows } = await client.query(`
  SELECT id::text, tenant_id::text, created_at, action_type, model, prompt_version,
         confidence, decision, decided_at, was_amended, reject_reason,
         array_to_string(suggestion_keys, ',') AS suggestion_keys,
         suggestion_items, txn_id::text, policy_id::text
    FROM ai_action_export
   WHERE exported_at IS NULL
   ORDER BY created_at
   LIMIT ${batchSize}
`);

if (rows.length === 0) {
  console.log('nothing to export — no decided, unexported ai_action rows');
  await client.end();
  process.exit(0);
}

// Group by date so each file lands in its own dt= partition.
const byDate = new Map();
for (const r of rows) {
  const dt = r.created_at.toISOString().slice(0, 10);
  if (!byDate.has(dt)) byDate.set(dt, []);
  byDate.get(dt).push(r);
}

const written = [];
for (const [dt, batch] of [...byDate.entries()].sort()) {
  const dir = join(outRoot, `dt=${dt}`);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const file = join(dir, `ai_action-${Date.now()}.parquet`);

  parquetWriteFile({
    filename: file,
    columnData: COLUMNS.map(([name, type]) => ({
      name,
      type,
      data: batch.map((r) => coerce(name, r[name])),
      nullable: name !== 'id' && name !== 'tenant_id' && name !== 'created_at'
             && name !== 'decision' && name !== 'was_amended',
    })),
    compressed: true,
    statistics: true,
  });

  written.push({ dt, file, rows: batch.length });
}

// Only after every file is closed. A crash mid-write leaves rows unexported and
// the next run repeats them, which is the recoverable direction — marking first
// would silently drop a day of labels.
if (!dryRun) {
  await client.query(
    `UPDATE ai_action SET exported_at = now() WHERE id = ANY($1::uuid[])`,
    [rows.map((r) => r.id)],
  );
}

await client.end();

for (const w of written) console.log(`  ${w.file}  ${w.rows} row(s)`);
console.log(
  `${dryRun ? 'DRY RUN — ' : ''}exported ${rows.length} row(s) across ` +
  `${written.length} date partition(s)${dryRun ? ' (nothing marked)' : ''}`,
);

/** node-pg hands back numerics as strings and bigints as strings; Parquet wants numbers. */
function coerce(name, v) {
  if (v === null || v === undefined) return null;
  if (name === 'confidence') return Number(v);
  if (name === 'suggestion_items') return BigInt(v);
  return v;
}
