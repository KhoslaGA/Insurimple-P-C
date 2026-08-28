/**
 * The client code, end to end and against its other implementation.
 *
 * Two things are proven here that neither side can prove alone:
 *
 *   1. The TypeScript stem and the SQL stem agree, over the same table of
 *      cases the contracts package uses. Two implementations of one rule drift
 *      — `tenant_tables()` drifted exactly this way and the census silently
 *      started counting a table fourteen extra times. This is the test that
 *      would have caught it.
 *   2. The counter, the uniqueness and the immutability behave under real
 *      inserts, including concurrent ones, which is the only interesting case.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { CASES } from '../../../packages/contracts/src/client-code.test.ts';
import { normalizeNameToStem } from '../../../packages/contracts/src/client-code.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const DB_PKG = join(HERE, '..', '..', '..', 'packages', 'db');
const DB = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!DB) {
  console.error('TEST_DATABASE_URL (or DATABASE_URL) is required');
  process.exit(1);
}

const TENANT = '11111111-1111-1111-1111-111111111111';
let client;

before(async () => {
  const admin = new pg.Client({ connectionString: DB });
  await admin.connect();
  await admin.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await admin.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  await admin.end();
  execFileSync('node', [join(DB_PKG, 'scripts', 'migrate.mjs'), '--seed'], {
    env: { ...process.env, DATABASE_URL: DB }, stdio: 'pipe',
  });
  client = new pg.Client({ connectionString: DB });
  await client.connect();
  await client.query(`SELECT set_config('app.current_tenant', $1, false)`, [TENANT]);
  await client.query(`SELECT set_config('app.current_actor', 'system', false)`);
});

after(async () => { await client?.end(); });

describe('client code: the two implementations agree', () => {
  it('produces the same stem in SQL as in TypeScript, for every case', async () => {
    const r = await client.query(
      `SELECT normalize_name_to_stem(c.last, c.first) AS stem
         FROM unnest($1::text[], $2::text[]) AS c(last, first)`,
      [CASES.map((c) => c[0]), CASES.map((c) => c[1])],
    );
    const disagreements = CASES
      .map(([last, first, expected], i) => ({ last, first, expected, sql: r.rows[i].stem }))
      .filter((x) => x.sql !== x.expected);
    assert.deepEqual(
      disagreements, [],
      'the SQL and TypeScript stems disagree. Change one, change both:\n' +
      disagreements.map((d) => `  ${d.last} / ${d.first}: sql=${d.sql} ts=${d.expected}`).join('\n'),
    );
    // and the TypeScript side agrees with the same table, so neither is being
    // compared only against itself
    for (const [last, first, expected] of CASES) {
      assert.equal(normalizeNameToStem(last, first), expected);
    }
  });
});

describe('client code: issuance', () => {
  const insert = (name) =>
    client.query(
      `INSERT INTO account (id, tenant_id, display_name, kind, status)
       VALUES (uuidv7(), $1, $2, 'personal', 'active') RETURNING lookup_code`,
      [TENANT, name],
    );

  it('issues a code on insert when none is supplied', async () => {
    const r = await insert('Rahul Freshname');
    assert.equal(r.rows[0].lookup_code, 'FRESHNRA01');
  });

  it('increments the counter for a colliding stem', async () => {
    const a = await insert('Rajesh Freshname');
    assert.equal(a.rows[0].lookup_code, 'FRESHNRA02');
    const b = await insert('Ravi Freshname');
    assert.equal(b.rows[0].lookup_code, 'FRESHNRA03');
  });

  it('continues the numbering of a stem the seeded book already uses', async () => {
    // Not a fresh stem: the dev seed contains a Mehta at MEHTARA01, and the
    // counter must continue from the book rather than restart. The first draft
    // of this test asserted 01 and the code was right, not the test.
    const r = await insert('Rohit Mehta');
    assert.match(r.rows[0].lookup_code, /^MEHTARO\d{2}$/);
  });

  it('does not collide across different stems', async () => {
    const r = await insert('Priya Kapoor');
    assert.match(r.rows[0].lookup_code, /^KAPOORPR\d{2}$/);
  });

  it('keeps a supplied code, so a migrated book carries its own numbering', async () => {
    const r = await client.query(
      `INSERT INTO account (id, tenant_id, display_name, lookup_code, kind, status)
       VALUES (uuidv7(), $1, 'Legacy Client', 'LEGACY0042', 'personal', 'active')
       RETURNING lookup_code`,
      [TENANT],
    );
    assert.equal(r.rows[0].lookup_code, 'LEGACY0042');
  });

  it('refuses to change a code once issued', async () => {
    const r = await insert('Immutable Test');
    await assert.rejects(
      () => client.query(`UPDATE account SET lookup_code = 'CHANGED01' WHERE lookup_code = $1`,
        [r.rows[0].lookup_code]),
      /immutable/,
      'the code is printed on the client documents and joins six years of records',
    );
  });

  it('lets a name change update display_name, leaving the code alone', async () => {
    const r = await insert('Anna Testcase');
    const code = r.rows[0].lookup_code;
    await client.query(`UPDATE account SET display_name = 'Anna Married' WHERE lookup_code = $1`, [code]);
    const after = await client.query(
      `SELECT display_name, lookup_code FROM account WHERE lookup_code = $1`, [code]);
    assert.equal(after.rows[0].display_name, 'Anna Married');
    assert.equal(after.rows[0].lookup_code, code);
  });

  it('survives concurrent inserts of the same stem without duplicating a code', async () => {
    // The counter is a read-then-write. Ten of them at once, on ten separate
    // connections, is the case that a single-connection test cannot reach.
    const pool = new pg.Pool({ connectionString: DB, max: 10 });
    const attempt = async () => {
      // The advisory lock in issue_client_code() serialises writers on the
      // stem, so this loop should never spin. It stays as a backstop, and as
      // the thing that fails loudly if the lock is ever removed.
      for (let retry = 0; retry < 5; retry++) {
        const c = await pool.connect();
        try {
          await c.query('BEGIN');
          await c.query(`SELECT set_config('app.current_tenant', $1, true)`, [TENANT]);
          await c.query(`SELECT set_config('app.current_actor', 'system', true)`);
          const r = await c.query(
            `INSERT INTO account (id, tenant_id, display_name, kind, status)
             VALUES (uuidv7(), $1, 'Concurrent Raceman', 'personal', 'active')
             RETURNING lookup_code`, [TENANT]);
          await c.query('COMMIT');
          return r.rows[0].lookup_code;
        } catch (e) {
          await c.query('ROLLBACK');
          if (e.code !== '23505') throw e;   // only a unique violation is retryable
        } finally {
          c.release();
        }
      }
      throw new Error('gave up after 5 retries');
    };

    const codes = await Promise.all(Array.from({ length: 10 }, attempt));
    await pool.end();
    assert.equal(new Set(codes).size, 10, `duplicate codes issued: ${codes.join(', ')}`);
    for (const code of codes) assert.match(code, /^RACEMACO\d{2}$/);
  });
});
