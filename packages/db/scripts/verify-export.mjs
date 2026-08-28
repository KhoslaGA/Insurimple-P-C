#!/usr/bin/env node
/**
 * Read back what the export wrote.
 *
 *   node scripts/verify-export.mjs ./exports
 *
 * "The export ran" is not the acceptance criterion — "produces readable
 * Parquet" is. A writer that emits a well-formed file no reader accepts is a
 * silent data-loss bug that surfaces on the first training run, months later
 * and against months of files. So the check is a real reader, on the real
 * output, asserting the values survived the round trip.
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { asyncBufferFromFile, parquetReadObjects, parquetMetadata } from 'hyparquet';
import { readFileSync } from 'node:fs';

const root = process.argv[2] ?? './exports';
const files = [];
for (const d of readdirSync(root)) {
  const p = join(root, d);
  if (statSync(p).isDirectory() && d.startsWith('dt=')) {
    for (const f of readdirSync(p)) if (f.endsWith('.parquet')) files.push([d, join(p, f)]);
  }
}
if (files.length === 0) {
  console.error(`no dt=*/ *.parquet under ${root}`);
  process.exit(1);
}

let total = 0;
for (const [dt, file] of files.sort()) {
  // .buffer alone is Node's POOLED ArrayBuffer — for a small file it is a
  // 64 KB slab shared with other reads, so the parquet footer is not at its
  // end and the reader reports "footer != PAR1" as though the writer were
  // broken. Slice to this file's own bytes.
  const bytes = readFileSync(file);
  const meta = parquetMetadata(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const rows = await parquetReadObjects({ file: await asyncBufferFromFile(file) });
  total += rows.length;

  const cols = meta.schema.filter((s) => s.num_children === undefined || s.num_children === 0)
                          .map((s) => s.name);
  for (const need of ['id', 'tenant_id', 'created_at', 'decision', 'model']) {
    if (!cols.includes(need)) throw new Error(`${file}: column ${need} is missing`);
  }
  for (const r of rows) {
    if (!r.id) throw new Error(`${file}: a row came back with no id`);
    if (r.decision === 'pending') throw new Error(`${file}: a pending row was exported — it has no label`);
    if (!['accepted', 'rejected', 'amended'].includes(r.decision)) {
      throw new Error(`${file}: unexpected decision ${r.decision}`);
    }
    // the partition directory must agree with the data in it
    const rowDt = new Date(Number(r.created_at)).toISOString().slice(0, 10);
    if (`dt=${rowDt}` !== dt) throw new Error(`${file}: row dated ${rowDt} filed under ${dt}`);
    // nothing identifying the client may leave
    for (const forbidden of ['context', 'suggestion', 'amendment']) {
      if (forbidden in r) throw new Error(`${file}: ${forbidden} was exported — it can carry client details`);
    }
  }
  console.log(`  ${file}  ${rows.length} row(s), ${cols.length} columns, readable`);
}
console.log(`read back ${total} row(s) from ${files.length} file(s) — all readable, all labelled`);
