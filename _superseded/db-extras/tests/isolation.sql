-- Tenant isolation and compliance-guard tests.
--
-- Invariant #9: tests are the acceptance criteria. These run as the NON-OWNER
-- `insurimple_app` role, because testing as the owner proves nothing — the
-- owner is the one identity RLS is most likely to let through.
--
-- Runs on stock PostgreSQL with no extensions. A pgTAP translation of the same
-- assertions lives in tests/isolation.pgtap.sql for CI.
--
--   psql -d insurimple_dev -f tests/isolation.sql

\set ON_ERROR_STOP on
\set QUIET on
SET client_min_messages TO warning;

CREATE SCHEMA IF NOT EXISTS test;

DROP TABLE IF EXISTS test.results;
CREATE TABLE test.results (
  n       serial PRIMARY KEY,
  label   text NOT NULL,
  passed  boolean NOT NULL,
  detail  text
);

-- The app role must be able to record outcomes while it is the current role.
GRANT USAGE ON SCHEMA test TO insurimple_app;
GRANT SELECT, INSERT ON test.results TO insurimple_app;
GRANT USAGE, SELECT ON SEQUENCE test.results_n_seq TO insurimple_app;

/* Assert a scalar query returns an expected value. */
CREATE OR REPLACE FUNCTION test.expect_value(p_sql text, p_expected bigint, p_label text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v bigint;
BEGIN
  EXECUTE p_sql INTO v;
  INSERT INTO test.results (label, passed, detail)
  VALUES (p_label, v IS NOT DISTINCT FROM p_expected,
          format('expected %s, got %s', p_expected, coalesce(v::text, 'NULL')));
EXCEPTION WHEN OTHERS THEN
  INSERT INTO test.results (label, passed, detail)
  VALUES (p_label, false, 'unexpected error: ' || SQLERRM);
END $$;

/* Assert a statement is REFUSED. The failure mode this catches is a guard that
   silently permits — so "it errored" is the pass condition. */
CREATE OR REPLACE FUNCTION test.expect_denied(p_sql text, p_label text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  INSERT INTO test.results (label, passed, detail)
  VALUES (p_label, false, 'STATEMENT SUCCEEDED — expected it to be denied');
EXCEPTION WHEN OTHERS THEN
  INSERT INTO test.results (label, passed, detail)
  VALUES (p_label, true, 'denied: ' || left(SQLERRM, 90));
END $$;

/* Assert a statement is ALLOWED. Guards that deny everything are not secure,
   they are broken; the positive case has to be proven too. */
CREATE OR REPLACE FUNCTION test.expect_allowed(p_sql text, p_label text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  INSERT INTO test.results (label, passed, detail) VALUES (p_label, true, 'allowed');
EXCEPTION WHEN OTHERS THEN
  INSERT INTO test.results (label, passed, detail)
  VALUES (p_label, false, 'UNEXPECTEDLY DENIED: ' || left(SQLERRM, 90));
END $$;

-- Shorthands for the seeded ids.
\set NORTHPEAK '11111111-1111-4111-8111-111111111111'
\set RIDEAU    '22222222-2222-4222-8222-222222222222'
\set MAYA      'aaaaaaaa-0000-4000-8000-000000000001'
\set OWEN      'aaaaaaaa-0000-4000-8000-000000000002'
\set SASHA     'bbbbbbbb-0000-4000-8000-000000000001'
\set HH_NP     'eeeeeeee-0000-4000-8000-000000000001'
\set HH_RV     'eeeeeeee-0000-4000-8000-000000000002'
\set POL_AUTO  '0a0a0a0a-0000-4000-8000-000000000001'

/* Everything below runs inside ONE explicit transaction.

   This is not tidiness — it is required. `set_config(..., true)` is
   transaction-local, and psql autocommits each statement, so outside an
   explicit BEGIN the tenant context is discarded before the next line runs and
   every assertion silently executes with no tenant at all. That failure mode
   is quiet: the fail-closed tests still pass, for entirely the wrong reason.

   It also matches production: set context, do work, commit. */
BEGIN;

SET ROLE insurimple_app;

-- Suppress the set_config echo; the report at the bottom is the output.
\o /dev/null

-- ===========================================================================
-- Invariant #2 — tenant isolation
-- ===========================================================================

-- No tenant context at all. Must return nothing: absence of context denies.
SELECT set_config('app.current_tenant', '', true);
SELECT test.expect_value('SELECT count(*) FROM households', 0,
  'no tenant context -> households invisible (fails closed)');
SELECT test.expect_value('SELECT count(*) FROM policies', 0,
  'no tenant context -> policies invisible (fails closed)');
SELECT test.expect_value('SELECT count(*) FROM parties', 0,
  'no tenant context -> parties invisible (fails closed)');

-- Northpeak sees exactly its own.
SELECT set_config('app.current_tenant', :'NORTHPEAK', true);
SELECT test.expect_value('SELECT count(*) FROM households', 1,
  'Northpeak sees only its own household');
SELECT test.expect_value('SELECT count(*) FROM policies', 2,
  'Northpeak sees only its own 2 policies');
SELECT test.expect_value(
  format('SELECT count(*) FROM households WHERE id = %L', :'HH_RV'), 0,
  'Northpeak cannot read Rideau household by direct id');
SELECT test.expect_value('SELECT count(*) FROM tenants', 1,
  'Northpeak sees only its own tenant row');
SELECT test.expect_value('SELECT count(*) FROM carriers', 2,
  'Northpeak sees only its own carriers');

-- Rideau sees exactly its own — the mirror case.
SELECT set_config('app.current_tenant', :'RIDEAU', true);
SELECT test.expect_value('SELECT count(*) FROM households', 1,
  'Rideau sees only its own household');
SELECT test.expect_value('SELECT count(*) FROM policies', 1,
  'Rideau sees only its own policy');
SELECT test.expect_value(
  format('SELECT count(*) FROM households WHERE id = %L', :'HH_NP'), 0,
  'Rideau cannot read Northpeak household by direct id');

-- WITH CHECK on writes. USING alone would allow planting a row in another
-- tenant even though it could not be read back.
SELECT set_config('app.current_tenant', :'NORTHPEAK', true);
SELECT test.expect_denied(
  format($q$INSERT INTO households (tenant_id, display_name) VALUES (%L, 'Smuggled')$q$, :'RIDEAU'),
  'cannot INSERT a household stamped with another tenant_id (WITH CHECK)');
SELECT test.expect_denied(
  format($q$UPDATE households SET tenant_id = %L WHERE id = %L$q$, :'RIDEAU', :'HH_NP'),
  'cannot UPDATE a household into another tenant (WITH CHECK)');
SELECT test.expect_denied(
  format($q$INSERT INTO policies (tenant_id, household_id, line_code, policy_number,
            description, effective_date, expiry_date)
            VALUES (%L, %L, 'AUTO', 'X-1', 'smuggled', DATE '2026-01-01', DATE '2027-01-01')$q$,
         :'RIDEAU', :'HH_RV'),
  'cannot INSERT a policy into another tenant');

-- Deleting across the boundary must affect zero rows, not error — the row is
-- simply not visible. Asserting the count proves nothing was touched.
SELECT test.expect_value(
  format($q$WITH d AS (DELETE FROM households WHERE id = %L RETURNING 1)
            SELECT count(*) FROM d$q$, :'HH_RV'), 0,
  'DELETE targeting another tenant affects zero rows');

-- ===========================================================================
-- Invariant #4 — entitlement (commercial boundary)
-- ===========================================================================

SELECT set_config('app.current_tenant', :'NORTHPEAK', true);
SELECT test.expect_value(
  'SELECT app.tenant_has_module(''life'')::int', 1,
  'Northpeak IS entitled to the life module');
SELECT set_config('app.current_tenant', :'RIDEAU', true);
SELECT test.expect_value(
  'SELECT app.tenant_has_module(''life'')::int', 0,
  'Rideau is NOT entitled to the life module');
SELECT set_config('app.current_tenant', '', true);
SELECT test.expect_value(
  'SELECT app.tenant_has_module(''pc'')::int', 0,
  'entitlement is false with no tenant context');

-- Entitlement is billing-owned, not self-serve.
SELECT set_config('app.current_tenant', :'NORTHPEAK', true);
SELECT test.expect_denied(
  format($q$INSERT INTO tenant_modules (tenant_id, module_code) VALUES (%L, 'mortgage')$q$, :'NORTHPEAK'),
  'tenant cannot grant itself a module entitlement');

-- ===========================================================================
-- Invariant #3 — licence is the security boundary
-- ===========================================================================

SELECT set_config('app.current_tenant', :'NORTHPEAK', true);

SELECT set_config('app.current_user', :'MAYA', true);
SELECT test.expect_value(
  'SELECT app.user_is_licensed_for_module(''pc'')::int', 1,
  'Maya (valid RIBO) IS licensed for P&C');

SELECT set_config('app.current_user', :'OWEN', true);
SELECT test.expect_value(
  'SELECT app.user_is_licensed_for_module(''pc'')::int', 0,
  'Owen (LLQP only) is NOT licensed for P&C');
SELECT test.expect_value(
  'SELECT app.user_is_licensed_for_module(''life'')::int', 1,
  'Owen IS licensed for life');

SELECT set_config('app.current_tenant', :'RIDEAU', true);
SELECT set_config('app.current_user', :'SASHA', true);
SELECT test.expect_value(
  'SELECT app.user_is_licensed_for_module(''pc'')::int', 0,
  'Sasha (EXPIRED RIBO) is NOT licensed — expiry alone removes capability');

-- A user cannot write their own licence.
SELECT set_config('app.current_tenant', :'NORTHPEAK', true);
SELECT set_config('app.current_user', :'OWEN', true);
SELECT test.expect_denied(
  format($q$INSERT INTO licences (tenant_id, user_id, class_code, licence_number, issued_on, expires_on)
            VALUES (%L, %L, 'ribo', 'SELF-GRANTED', DATE '2026-01-01', DATE '2030-01-01')$q$,
         :'NORTHPEAK', :'OWEN'),
  'user cannot grant themselves a licence');

-- ===========================================================================
-- Invariant #1 — no-bind is a state-machine guard
-- ===========================================================================

SELECT set_config('app.current_tenant', :'NORTHPEAK', true);
SELECT set_config('app.current_user', :'MAYA', true);

-- Staging rows in carrier_review (pre-bind, so no guard applies yet).
INSERT INTO transactions (tenant_id, household_id, policy_id, line_code, type_code,
                          seq, description, state)
VALUES (:'NORTHPEAK', :'HH_NP', :'POL_AUTO', 'AUTO', 'endorsement',
        901, 'test — bind by licensed broker', 'carrier_review'),
       (:'NORTHPEAK', :'HH_NP', :'POL_AUTO', 'AUTO', 'endorsement',
        902, 'test — bind by unlicensed user', 'carrier_review'),
       (:'NORTHPEAK', :'HH_NP', :'POL_AUTO', 'AUTO', 'endorsement',
        903, 'test — illegal transition', 'draft');

-- The positive case: a licensed broker at an entitled tenant CAN bind.
SELECT test.expect_allowed(
  $q$UPDATE transactions SET state = 'bound' WHERE seq = 901$q$,
  'licensed RIBO broker CAN bind a P&C transaction');

-- The invariant: a life-only user CANNOT.
SELECT set_config('app.current_user', :'OWEN', true);
SELECT test.expect_denied(
  $q$UPDATE transactions SET state = 'bound' WHERE seq = 902$q$,
  'life-only user CANNOT bind a P&C transaction (no-bind guard)');

-- The guard must not be reachable by jumping states.
SELECT set_config('app.current_user', :'MAYA', true);
SELECT test.expect_denied(
  $q$UPDATE transactions SET state = 'bound' WHERE seq = 903$q$,
  'cannot skip carrier_review: draft -> bound is an illegal transition');

-- Nor by inserting straight into a bound state.
SELECT set_config('app.current_user', :'OWEN', true);
SELECT test.expect_denied(
  format($q$INSERT INTO transactions (tenant_id, household_id, policy_id, line_code,
            type_code, seq, description, state)
            VALUES (%L, %L, %L, 'AUTO', 'endorsement', 904, 'inserted pre-bound', 'bound')$q$,
         :'NORTHPEAK', :'HH_NP', :'POL_AUTO'),
  'unlicensed user cannot INSERT a transaction directly in bound state');

-- Binding must be attributed.
SELECT test.expect_value(
  $q$SELECT count(*) FROM transactions WHERE seq = 901 AND bound_by IS NOT NULL AND bound_at IS NOT NULL$q$,
  1, 'a bound transaction records who bound it and when');

-- ===========================================================================
-- Audit trail is append-only
-- ===========================================================================

SELECT test.expect_value(
  $q$SELECT count(*) FROM transaction_events WHERE to_state = 'bound'$q$, 1,
  'state change wrote an audit event automatically');
SELECT test.expect_denied(
  $q$UPDATE transaction_events SET to_state = 'draft' WHERE to_state = 'bound'$q$,
  'audit events cannot be UPDATEd');
SELECT test.expect_denied(
  $q$DELETE FROM transaction_events$q$,
  'audit events cannot be DELETEd');

RESET ROLE;

-- ===========================================================================
-- Report
-- ===========================================================================
\o
\set QUIET off
\echo ''
\echo '================ tenant isolation & compliance guards ================'
SELECT n,
       CASE WHEN passed THEN 'ok  ' ELSE 'FAIL' END AS status,
       label,
       CASE WHEN passed THEN '' ELSE detail END AS detail
FROM test.results ORDER BY n;

\echo ''
SELECT count(*) FILTER (WHERE passed)       AS passed,
       count(*) FILTER (WHERE NOT passed)   AS failed,
       count(*)                             AS total
FROM test.results;

-- Non-zero exit when anything failed, so CI notices. Raising here also aborts
-- the transaction, which is the same cleanup path as the ROLLBACK below.
DO $$
DECLARE f int;
BEGIN
  SELECT count(*) INTO f FROM test.results WHERE NOT passed;
  IF f > 0 THEN
    RAISE EXCEPTION '% test(s) failed', f;
  END IF;
END $$;

/* Discard everything the run wrote — the staged transactions, the audit rows,
   the results table. Tests must leave the seeded database byte-identical, or
   the second run is testing different data than the first. */
ROLLBACK;
