/**
 * Connection topology.
 *
 * Tenant isolation depends on a property of the *connection*, not of the SQL:
 * `app.current_tenant` must be set with `set_config(..., is_local => true)`
 * inside an explicit transaction, so it reverts on COMMIT or ROLLBACK.
 *
 * A plain `SET app.current_tenant = …` is session-scoped. On a pooled
 * connection the setting outlives the request that made it, and the next
 * request to borrow that connection inherits the previous tenant's context —
 * before its own guard has run. Every policy in the schema then evaluates
 * against the wrong tenant, correctly, and returns the wrong brokerage's book.
 *
 * There is no test that catches this at runtime: a leaked context produces
 * plausible rows, not an error. It is caught here, in the source, or not at all.
 *
 * This suite reads `apps/api/src` as text on purpose. A behavioural test would
 * have to reproduce pool reuse under concurrency to observe the leak; reading
 * the source observes the cause directly, and keeps observing it after a
 * refactor that a behavioural test would quietly stop covering.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function sources(dir = SRC, acc = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) sources(p, acc);
    else if (p.endsWith('.ts')) acc.push(p);
  }
  return acc;
}

const files = sources().map((path) => ({
  path: relative(SRC, path),
  text: readFileSync(path, 'utf8'),
}));

/** Strip // and /* *\/ comments so a doc comment quoting the bad form is not a hit. */
const code = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

function offenders(re) {
  return files.flatMap(({ path, text }) => {
    const body = code(text);
    return [...body.matchAll(re)].map((m) => `${path}: ${m[0].trim()}`);
  });
}

describe('connection topology (invariant 2)', () => {
  it('never sets tenant context with a plain SET', () => {
    // `SET app.current_tenant` / `SET app.current_actor`, in any casing, not
    // preceded by LOCAL. This is the exact mutation that leaks under a pooler.
    const bad = offenders(/\bSET\s+(?!LOCAL\b)[a-z_"']*app\.current_\w+/gi);
    assert.deepEqual(
      bad, [],
      'tenant context must be set with set_config(..., true) inside BEGIN/COMMIT.\n' +
      'A plain SET is session-scoped and survives the request on a pooled connection:\n' +
      bad.join('\n'),
    );
  });

  it('never switches role without LOCAL', () => {
    const bad = offenders(/\bSET\s+ROLE\b/gi);
    assert.deepEqual(
      bad, [],
      'use SET LOCAL ROLE — a plain SET ROLE outlives the transaction on a pooled\n' +
      'connection and hands the next request whatever role the last one left:\n' +
      bad.join('\n'),
    );
  });

  it('sets tenant context transaction-locally', () => {
    const db = files.find((f) => f.path.endsWith('db.module.ts'));
    assert.ok(db, 'db.module.ts not found');
    assert.match(
      db.text,
      /set_config\('app\.current_tenant',\s*\$1,\s*true\)/,
      'the third argument to set_config must be true (is_local) — false makes it session-scoped',
    );
    assert.match(
      db.text,
      /set_config\('app\.current_actor',\s*\$2,\s*true\)/,
      'the actor is session state too, and leaks the same way',
    );
  });

  it('wraps every tenant-scoped query in an explicit transaction', () => {
    const db = files.find((f) => f.path.endsWith('db.module.ts'));
    for (const stmt of ['BEGIN', 'COMMIT', 'ROLLBACK']) {
      assert.match(
        db.text, new RegExp(`query\\('${stmt}'\\)`),
        `withTenant must issue ${stmt} — is_local settings only revert at a transaction ` +
        'boundary, so without one they are session-scoped in every way that matters',
      );
    }
  });

  it('reaches the database only through withTenant, or through the one documented exception', () => {
    // adminQuery runs with no tenant context, for the auth guard to resolve a
    // tenant by clerk_org_id before any context exists. It is the only path
    // that legitimately bypasses withTenant, and it must stay that way.
    const callers = files.filter(
      (f) => f.text.includes('adminQuery(') && !f.path.endsWith('db.module.ts'),
    );
    assert.deepEqual(
      callers.map((f) => f.path),
      ['common/auth.guard.ts'],
      'adminQuery has no tenant context. Only the auth guard may use it, to resolve the ' +
      'tenant that every other query is then scoped by.',
    );
  });

  it('never creates a second pool outside DbService', () => {
    const bad = files.filter(
      (f) => /new\s+Pool\s*\(/.test(code(f.text)) && !f.path.endsWith('db.module.ts'),
    );
    assert.deepEqual(
      bad.map((f) => f.path), [],
      'a second pool would not carry the SET LOCAL ROLE or the tenant context that ' +
      'DbService applies, and would reach the database as whatever DATABASE_URL names',
    );
  });
});
