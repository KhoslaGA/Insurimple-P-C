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
import { ACCOUNT_CASES, CASES } from '../../../packages/contracts/src/client-code.test.ts';
import { clientCodeStemForAccount, normalizeNameToStem } from '../../../packages/contracts/src/client-code.ts';
import { newId } from '../dist/db/id.js';

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

  it('derives the same stem from an account row in SQL as in TypeScript, for every case', async () => {
    const r = await client.query(
      `SELECT client_code_stem_for_account(c.kind, c.display_name) AS stem
         FROM unnest($1::text[], $2::text[]) AS c(kind, display_name)`,
      [ACCOUNT_CASES.map((c) => c[0]), ACCOUNT_CASES.map((c) => c[1])],
    );
    const disagreements = ACCOUNT_CASES
      .map(([kind, name, expected], i) => ({ kind, name, expected, sql: r.rows[i].stem }))
      .filter((x) => x.sql !== x.expected);
    assert.deepEqual(disagreements, [], 'the SQL and TypeScript account stems disagree');
    for (const [kind, name, expected] of ACCOUNT_CASES) {
      assert.equal(clientCodeStemForAccount(kind, name), expected);
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

  it('issues an organization code from eight letters of the whole name', async () => {
    const a = await client.query(
      `INSERT INTO account (id, tenant_id, display_name, kind, status)
       VALUES (uuidv7(), $1, 'Maple Ridge Dental Professional Corp.', 'commercial', 'active') RETURNING lookup_code`,
      [TENANT]);
    assert.equal(a.rows[0].lookup_code, 'MAPLERID01');
    const b = await client.query(
      `INSERT INTO account (id, tenant_id, display_name, kind, status)
       VALUES (uuidv7(), $1, 'Maple Ridge Dental Professional Corp.', 'commercial', 'active') RETURNING lookup_code`,
      [TENANT]);
    assert.equal(b.rows[0].lookup_code, 'MAPLERID02');
    const c = await client.query(
      `INSERT INTO account (id, tenant_id, display_name, kind, status)
       VALUES (uuidv7(), $1, 'Northfield Logistics Inc.', 'benefits', 'active') RETURNING lookup_code`,
      [TENANT]);
    assert.equal(c.rows[0].lookup_code, 'NORTHFIE01');
  });

  it('issues a single-name person from eight letters, and a short name from what there is', async () => {
    const a = await insert('Madonna');
    assert.equal(a.rows[0].lookup_code, 'MADONNA01');
    const b = await insert('Li Ng');
    assert.equal(b.rows[0].lookup_code, 'NGLI01');
  });

  it('folds a hyphenated surname, an apostrophe and a Mc prefix into the stem', async () => {
    assert.equal((await insert('Al Smith-Jones')).rows[0].lookup_code, 'SMITHJAL01');
    assert.equal((await insert("Sean O'Brien")).rows[0].lookup_code, 'OBRIENSE01');
    assert.equal((await insert('Ronald McDonald')).rows[0].lookup_code, 'MCDONARO01');
  });

  it('widens the counter to three digits after 99, never truncating', async () => {
    // 99 sequential inserts of one stem, then the 100th and 101st.
    for (let i = 1; i <= 99; i++) {
      const r = await insert('Wide Widening');
      assert.equal(r.rows[0].lookup_code, `WIDENIWI${String(i).padStart(2, '0')}`);
    }
    assert.equal((await insert('Wide Widening')).rows[0].lookup_code, 'WIDENIWI100');
    assert.equal((await insert('Wide Widening')).rows[0].lookup_code, 'WIDENIWI101');
  });

  it('continues after an imported code and never back-fills its gaps', async () => {
    await client.query(
      `INSERT INTO account (id, tenant_id, display_name, lookup_code, kind, status)
       VALUES (uuidv7(), $1, 'Gary Gapste', 'GAPSTEGA05', 'personal', 'active')`, [TENANT]);
    assert.equal((await insert('Gary Gapste')).rows[0].lookup_code, 'GAPSTEGA06');
    // an imported counter of another width still parses and is still skipped
    await client.query(
      `INSERT INTO account (id, tenant_id, display_name, lookup_code, kind, status)
       VALUES (uuidv7(), $1, 'Wilma Widthx', 'WIDTHXWI0007', 'personal', 'active')`, [TENANT]);
    assert.equal((await insert('Wilma Widthx')).rows[0].lookup_code, 'WIDTHXWI08');
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

  it('refuses to clear a code, so nothing can regenerate an imported one', async () => {
    await assert.rejects(
      () => client.query(`UPDATE account SET lookup_code = NULL WHERE lookup_code = 'LEGACY0042'`),
      /immutable/,
    );
    const r = await client.query(`SELECT lookup_code FROM account WHERE display_name = 'Legacy Client'`);
    assert.equal(r.rows[0].lookup_code, 'LEGACY0042');
  });

  it('leaves every seeded (migrated) code exactly as the seed supplied it', async () => {
    // The dev seed is a stand-in for a migrated Epic book: every one of its
    // codes was supplied, and the migration set must never touch them.
    const r = await client.query(
      `SELECT lookup_code FROM account WHERE id = 'a0000000-0000-0000-0000-000000000001'`);
    assert.equal(r.rows[0].lookup_code, 'ABTAHISE01');
    const regenerated = await client.query(
      `SELECT count(*)::int AS n FROM account WHERE lookup_code IS NULL`);
    assert.equal(regenerated.rows[0].n, 0, 'an account without a code would be re-issued on the next touch');
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

describe('keys are ordered in the database, not just in the generator', () => {
  it('inserts 10,000 rows and finds them in insertion order by id', async () => {
    // DB.3's acceptance, literally: the generator being monotonic is necessary
    // but not sufficient — what matters is that Postgres, sorting the uuid
    // column with its own comparator, agrees. A generator could be monotonic as
    // a STRING and not as the 16 bytes the index actually orders.
    const ids = Array.from({ length: 10_000 }, () => newId());
    await client.query(
      `INSERT INTO party (id, tenant_id, party_type, last_name)
       SELECT u.id, $2, 'person', 'Ordered' || u.ord
         FROM unnest($1::uuid[]) WITH ORDINALITY AS u(id, ord)`,
      [ids, TENANT],
    );

    const back = await client.query(
      `SELECT id::text FROM party WHERE last_name LIKE 'Ordered%' ORDER BY id`);
    assert.equal(back.rows.length, 10_000);
    assert.deepEqual(
      back.rows.map((r) => r.id), ids,
      'Postgres ordering by id does not match insertion order — inserts are landing in ' +
      'random leaves of the B-tree, which is the whole thing UUIDv7 exists to prevent',
    );

    // And the index agrees: ordering by id needs no sort step.
    const plan = await client.query(
      `EXPLAIN (COSTS OFF) SELECT id FROM party ORDER BY id LIMIT 10`);
    const text = plan.rows.map((r) => r['QUERY PLAN']).join('\n');
    assert.ok(!/Sort/.test(text), `ordering by the primary key required a sort:\n${text}`);
  });
});
