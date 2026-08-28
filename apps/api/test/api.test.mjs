/**
 * API integration tests.
 *
 * These run against a REAL Postgres and the real Nest application — no mocks,
 * no stubbed guards. The point is to prove the boundaries hold over HTTP, not
 * just in SQL: packages/db/test.sql already asserts the database refuses the
 * write, and these assert the API surfaces that refusal as a 403 instead of
 * leaking a 500 or, worse, succeeding.
 *
 *   TEST_DATABASE_URL=postgres://…  pnpm --filter @insurimple/api test
 *
 * The database is migrated and seeded from scratch each run, so assertions can
 * depend on exact rows.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const HERE = dirname(fileURLToPath(import.meta.url));
const DB_PKG = join(HERE, '..', '..', '..', 'packages', 'db');

const DB = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!DB) {
  console.error('TEST_DATABASE_URL (or DATABASE_URL) is required');
  process.exit(1);
}

// Dev-header auth: NODE_ENV=development with CLERK_SECRET_KEY unset. The guard
// refuses to run in this mode any other way, which is itself the point.
process.env.NODE_ENV = 'development';
delete process.env.CLERK_SECRET_KEY;
process.env.DATABASE_URL = DB;
process.env.DB_SET_ROLE = 'app';

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';
const PRINCIPAL = '50000000-0000-0000-0000-000000000001';
const ABTAHI = 'a0000000-0000-0000-0000-000000000001';
const ABTAHI_AUTO = '90000000-0000-0000-0000-000000000001';

/** A Life-only staff member, created in setup. */
const LIFE_ONLY = '50000000-0000-0000-0000-00000000fe01';
const LIFE_LICENCE = '11c00000-0000-0000-0000-00000000fe01';
/** An unlicensed CSR with no grants at all. */
const NO_GRANT = '50000000-0000-0000-0000-00000000fe02';

let app;
let base;
let client;

/** Request helper — dev-header auth, JSON in and out. */
async function call(path, { actor = PRINCIPAL, tenant = TENANT_A, method = 'GET', body, headers = {} } = {}) {
  const h = { 'content-type': 'application/json', ...headers };
  if (tenant !== null) h['x-tenant-id'] = tenant;
  if (actor !== null) h['x-actor-id'] = actor;
  const res = await fetch(`${base}${path}`, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}

// NOTE: `node --test --test-concurrency=1` in package.json is load-bearing.
// This file and client-code.test.mjs each DROP SCHEMA and re-migrate the SAME
// database in their before() hook; run in parallel they tear the schema out
// from under each other, and the failures land on whichever file lost the race
// rather than on anything real.
before(async () => {
  // Drop and rebuild the schema so the suite is hermetic. Migrating a dirty
  // database is not enough: these tests grant roles and open transactions, so
  // a second run would find the "user with no grant" already holding one and
  // silently stop testing what it claims to. Repeatability is the whole point
  // of an assertion.
  const admin = new pg.Client({ connectionString: DB });
  await admin.connect();
  await admin.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await admin.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  await admin.end();

  execFileSync('node', [join(DB_PKG, 'scripts', 'migrate.mjs'), '--seed'], {
    env: { ...process.env, DATABASE_URL: DB },
    stdio: 'pipe',
  });

  client = new pg.Client({ connectionString: DB });
  await client.connect();

  // Provision the fixtures the authority tests need. This runs as the
  // superuser (the seeding path), because a principal cannot bootstrap their
  // own authority — which is exactly what 0010 enforces.
  //
  // `system` is named explicitly: current_actor() defaults to `anonymous`, so
  // provisioning authority is something a caller asks for rather than
  // something it inherits by not setting an actor.
  await client.query(`SELECT set_config('app.current_actor', 'system', false)`);
  await client.query(
    `INSERT INTO staff (id, tenant_id, full_name, email, role) VALUES
       ($1,$3,'Priya Life-Only','priya.test@insurimple.ca','broker'),
       ($2,$3,'Unlicensed Newcomer','newcomer.test@insurimple.ca','csr')
     ON CONFLICT DO NOTHING`,
    [LIFE_ONLY, NO_GRANT, TENANT_A],
  );
  await client.query(
    `INSERT INTO licence (id, tenant_id, staff_id, licence_class, licence_number, expires_on)
     VALUES ($1,$2,$3,'llqp','LLQP-TEST', current_date + 365)
     ON CONFLICT DO NOTHING`,
    [LIFE_LICENCE, TENANT_A, LIFE_ONLY],
  );
  await client.query(
    `INSERT INTO staff_role_grant (id, tenant_id, staff_id, role_code, licence_id)
     VALUES (uuidv7(),$1,$2,'life_only',$3) ON CONFLICT DO NOTHING`,
    [TENANT_A, LIFE_ONLY, LIFE_LICENCE],
  );

  // Boot the real application.
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../dist/app.module.js');
  await import('reflect-metadata');
  app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0);
  base = (await app.getUrl()).replace('[::1]', '127.0.0.1');
});

after(async () => {
  await app?.close();
  await client?.end();
});

/* ------------------------------------------------------------------ */

describe('auth guard', () => {
  it('leaves /health unauthenticated', async () => {
    const r = await call('/health', { actor: null, tenant: null });
    assert.equal(r.status, 200);
  });

  it('rejects a request with no tenant header', async () => {
    const r = await call('/accounts', { tenant: null });
    assert.equal(r.status, 401);
  });

  it('rejects a malformed tenant id rather than coercing it', async () => {
    const r = await call('/accounts', { tenant: 'not-a-uuid' });
    assert.equal(r.status, 401);
  });

  it('rejects a request with no actor', async () => {
    const r = await call('/accounts', { actor: null });
    assert.equal(r.status, 401);
  });
});

describe('tenancy (invariant 2)', () => {
  it('scopes the book to the caller tenant', async () => {
    const a = await call('/accounts');
    assert.equal(a.status, 200);
    assert.ok(a.body.length > 0, 'tenant A should see its book');
  });

  it('shows a second tenant an empty book, not an error', async () => {
    const b = await call('/accounts', { tenant: TENANT_B });
    assert.equal(b.status, 200);
    assert.deepEqual(b.body, []);
  });

  it('does not leak another tenant record by id', async () => {
    const r = await call(`/accounts/${ABTAHI}`, { tenant: TENANT_B });
    assert.equal(r.status, 404, 'cross-tenant read must 404, never 200');
  });

  it('zeroes aggregates for a tenant with no book', async () => {
    const m = await call('/metrics', { tenant: TENANT_B });
    assert.equal(m.status, 200);
    assert.equal(m.body.book_size, 0);
    assert.equal(m.body.premium_in_force, 0);
  });

  it('empties every work queue for a tenant with no book', async () => {
    const q = await call('/queues', { tenant: TENANT_B });
    assert.equal(q.status, 200);
    assert.deepEqual(
      [q.body.activities.length, q.body.renewals.length, q.body.suspense.length],
      [0, 0, 0],
    );
  });
});

describe('licence is the security boundary (invariant 3)', () => {
  it('lets a licensed principal open a P&C transaction', async () => {
    const r = await call('/txns', {
      method: 'POST',
      body: { accountId: ABTAHI, txnType: 'endorsement', reason: 'api test — licensed' },
    });
    assert.equal(r.status, 201);
    assert.equal(r.body.state, 'draft');
  });

  it('refuses a Life-only user with 403, not 500', async () => {
    const r = await call('/txns', {
      actor: LIFE_ONLY,
      method: 'POST',
      body: { accountId: ABTAHI, txnType: 'endorsement', reason: 'api test — should deny' },
    });
    assert.equal(r.status, 403);
    assert.match(String(r.body.message), /pc\.txn\.create/);
  });

  it('refuses a user with no grant at all', async () => {
    const r = await call('/txns', {
      actor: NO_GRANT,
      method: 'POST',
      body: { accountId: ABTAHI, txnType: 'endorsement' },
    });
    assert.equal(r.status, 403);
  });

  it('drops authority the moment the licence expires, and restores it on renewal', async () => {
    await client.query(
      `UPDATE licence SET expires_on = current_date - 1 WHERE staff_id = $1`,
      [PRINCIPAL],
    );
    const denied = await call('/txns', {
      method: 'POST',
      body: { accountId: ABTAHI, txnType: 'endorsement', reason: 'api test — expired' },
    });
    assert.equal(denied.status, 403, 'an expired licence must not transact');

    await client.query(
      `UPDATE licence SET expires_on = current_date + 365 WHERE staff_id = $1`,
      [PRINCIPAL],
    );
    const allowed = await call('/txns', {
      method: 'POST',
      body: { accountId: ABTAHI, txnType: 'endorsement', reason: 'api test — renewed' },
    });
    assert.equal(allowed.status, 201, 'renewing the licence restores authority');
  });

  it('reports the caller capabilities from the same source the guard uses', async () => {
    const me = await call('/me');
    assert.equal(me.status, 200);
    assert.ok(me.body.capabilities.includes('pc.txn.create'));

    const life = await call('/me', { actor: LIFE_ONLY });
    assert.ok(!life.body.capabilities.includes('pc.txn.create'));
    assert.ok(life.body.capabilities.includes('life.txn.create'));
  });
});

describe('entitlement is the commercial boundary (invariant 4)', () => {
  it('refuses a module the tenant is not subscribed to', async () => {
    const p = await client.query(
      `INSERT INTO policy (id, tenant_id, account_id, policy_number, line, status)
       VALUES (uuidv7(),$1,$2,'LIFE-TEST-1','life','in_force') RETURNING id`,
      [TENANT_A, ABTAHI],
    );
    const r = await call('/txns', {
      method: 'POST',
      body: { accountId: ABTAHI, policyId: p.rows[0].id, txnType: 'new_business' },
    });
    assert.equal(r.status, 403);
    assert.match(String(r.body.message), /entitlement denied/);
  });
});

describe('managing the boundary is inside the boundary', () => {
  it('stops a user without team.manage granting themselves a role', async () => {
    const r = await call('/team/grants', {
      actor: LIFE_ONLY,
      method: 'POST',
      body: { staffId: LIFE_ONLY, roleCode: 'pc_sales' },
    });
    assert.equal(r.status, 403);
    assert.match(String(r.body.message), /team\.manage/);
  });

  it('stops them issuing themselves a licence', async () => {
    const r = await call('/team/licences', {
      actor: LIFE_ONLY,
      method: 'POST',
      body: { staffId: LIFE_ONLY, licenceClass: 'ribo_l2', licenceNumber: 'SELF-TEST' },
    });
    assert.equal(r.status, 403);
  });

  it('refuses a licensed role with no licence anchor', async () => {
    const r = await call('/team/grants', {
      method: 'POST',
      body: { staffId: NO_GRANT, roleCode: 'pc_service' },
    });
    assert.equal(r.status, 403);
    assert.match(String(r.body.message), /anchored to a licence/);
  });

  it('refuses a grant anchored to the wrong licence class', async () => {
    const r = await call('/team/grants', {
      method: 'POST',
      body: { staffId: LIFE_ONLY, roleCode: 'pc_service', licenceId: LIFE_LICENCE },
    });
    assert.equal(r.status, 403);
    assert.match(String(r.body.message), /wrong licence class/);
  });

  it('lets the principal grant a correctly licensed role, which then confers authority', async () => {
    const lic = await call('/team/licences', {
      method: 'POST',
      body: {
        staffId: NO_GRANT,
        licenceClass: 'ribo_l1',
        licenceNumber: 'RIBO-TEST-9',
        regulator: 'RIBO',
        expiresOn: '2030-01-01',
      },
    });
    assert.equal(lic.status, 201);

    const grant = await call('/team/grants', {
      method: 'POST',
      body: { staffId: NO_GRANT, roleCode: 'pc_service', licenceId: lic.body.id },
    });
    assert.equal(grant.status, 201);

    const txn = await call('/txns', {
      actor: NO_GRANT,
      method: 'POST',
      body: { accountId: ABTAHI, txnType: 'endorsement', reason: 'api test — newly licensed' },
    });
    assert.equal(txn.status, 201, 'a correctly licensed grant confers pc.txn.create');
  });
});

describe('proofs are licence-gated', () => {
  it('lets a licensed user issue a liability slip', async () => {
    const r = await call('/documents/issue', {
      method: 'POST',
      body: { policyId: ABTAHI_AUTO, templateCode: 'PINK_SLIP' },
    });
    assert.equal(r.status, 201);
    assert.match(r.body.rendered_body, /ONTARIO MOTOR VEHICLE LIABILITY/);
    assert.ok(r.body.retention_until, 'a proof must carry its retention clock');
  });

  it('renders merge fields rather than leaving placeholders', async () => {
    const r = await call('/documents/issue', {
      method: 'POST',
      body: { policyId: ABTAHI_AUTO, templateCode: 'PINK_SLIP' },
    });
    assert.doesNotMatch(r.body.rendered_body, /\{\{/, 'no unresolved merge fields');
    assert.match(r.body.rendered_body, /Seyed Moein Abtahi/);
    // Dates must be ISO, not a stringified JS Date ("Tue Jun 24").
    assert.match(r.body.rendered_body, /Effective: \d{4}-\d{2}-\d{2}/);
  });

  it('refuses a Life-only user', async () => {
    const r = await call('/documents/issue', {
      actor: LIFE_ONLY,
      method: 'POST',
      body: { policyId: ABTAHI_AUTO, templateCode: 'PINK_SLIP' },
    });
    assert.equal(r.status, 403);
    assert.match(String(r.body.message), /pc\.proof\.issue/);
  });
});

describe('transaction state machine', () => {
  it('walks the legal path and records every transition', async () => {
    const open = await call('/txns', {
      method: 'POST',
      body: { accountId: ABTAHI, txnType: 'cancellation', reason: 'api test — lifecycle' },
    });
    assert.equal(open.status, 201);
    const id = open.body.id;

    const gen = await call(`/txns/${id}/generate`, {
      method: 'POST',
      body: { docType: 'cancellation_agreement', filename: 'test.pdf' },
    });
    assert.equal(gen.body.state, 'doc_generated');

    const sig = await call(`/txns/${id}/request-signature`, { method: 'POST' });
    assert.equal(sig.body.state, 'sig_pending');

    const signed = await call(`/txns/${id}/sign`, { method: 'POST', body: {} });
    assert.equal(signed.body.state, 'signed');

    const sub = await call(`/txns/${id}/submit`, { method: 'POST', body: { channel: 'portal' } });
    assert.equal(sub.body.state, 'submitted');

    const detail = await call(`/txns/${id}`);
    assert.equal(detail.body.state, 'submitted');
    assert.deepEqual(
      detail.body.events.map((e) => e.to_state),
      ['doc_generated', 'sig_pending', 'signed', 'submitted'],
      'the DB guard logs each transition in order',
    );
  });

  it('refuses an illegal transition', async () => {
    const open = await call('/txns', {
      method: 'POST',
      body: { accountId: ABTAHI, txnType: 'endorsement', reason: 'api test — illegal' },
    });
    // draft -> submitted skips the middle of the machine.
    const r = await call(`/txns/${open.body.id}/submit`, {
      method: 'POST',
      body: { channel: 'portal' },
    });
    assert.notEqual(r.status, 201, 'skipping states must not succeed');
  });
});

describe('rating seam (invariant 7)', () => {
  it('marks every quote as mock while no adapter is live', async () => {
    const r = await call(`/rating/policies/${ABTAHI_AUTO}/quote`, { method: 'POST', body: {} });
    assert.equal(r.status, 201);
    assert.equal(r.body.indicative_only, true);
    assert.ok(r.body.quotes.length > 0);
    for (const q of r.body.quotes) {
      assert.equal(q.is_mock, true, 'a fixture must never pass as live carrier data');
    }
  });

  it('is deterministic — the same risk returns the same premium', async () => {
    const a = await call(`/rating/policies/${ABTAHI_AUTO}/quote`, { method: 'POST', body: {} });
    const b = await call(`/rating/policies/${ABTAHI_AUTO}/quote`, { method: 'POST', body: {} });
    assert.deepEqual(
      a.body.quotes.map((q) => [q.carrierName, q.annualPremium]),
      b.body.quotes.map((q) => [q.carrierName, q.annualPremium]),
    );
  });

  it('logs every market approached — the Take-All-Comers evidence', async () => {
    const before = await client.query('SELECT count(*)::int AS n FROM quote_log');
    await call(`/rating/policies/${ABTAHI_AUTO}/quote`, { method: 'POST', body: {} });
    const after = await client.query('SELECT count(*)::int AS n FROM quote_log');
    assert.ok(after.rows[0].n > before.rows[0].n, 'quotes must be logged, not just returned');
  });
});

describe('compliance exceptions are derived', () => {
  it('finds a transaction that reached signature stage with no signature on file', async () => {
    const c = await call('/compliance');
    assert.equal(c.status, 200);
    assert.ok(Array.isArray(c.body.exceptions.unsigned_transactions));
    assert.ok(
      c.body.exceptions.unsigned_transactions.length > 0,
      'the seeded book contains unsigned transactions and the check should see them',
    );
  });

  it('reports nothing for a tenant with no book', async () => {
    const c = await call('/compliance', { tenant: TENANT_B });
    assert.equal(c.status, 200);
    assert.equal(c.body.exceptions.overdue_activities.length, 0);
    assert.equal(c.body.exceptions.consent_gaps.length, 0);
  });
});
