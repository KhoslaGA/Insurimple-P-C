-- pgTAP translation of tests/isolation.sql, for CI (CLAUDE.md invariant #2).
--
-- ⚠️  NOT YET EXECUTED. pgTAP has no Homebrew formula and was not built from
-- source on the machine where this was written, so this file is a faithful
-- translation that has never been run. `tests/isolation.sql` is the suite with
-- actual evidence behind it — 32/32, mutation-verified.
--
-- Before trusting this file, run it once and confirm it reports 32 passing.
-- Expect small fixes on that first run; that is what an unrun test file is.
--
-- Requires:  CREATE EXTENSION pgtap;
-- Run with:  pg_prove -d insurimple_dev tests/isolation.pgtap.sql

BEGIN;

SELECT plan(32);

SET ROLE insurimple_app;

-- ---------------------------------------------------------------------------
-- Invariant #2 — tenant isolation
-- ---------------------------------------------------------------------------
SELECT set_config('app.current_tenant', '', true);

SELECT is((SELECT count(*) FROM households)::bigint, 0::bigint,
  'no tenant context -> households invisible (fails closed)');
SELECT is((SELECT count(*) FROM policies)::bigint, 0::bigint,
  'no tenant context -> policies invisible (fails closed)');
SELECT is((SELECT count(*) FROM parties)::bigint, 0::bigint,
  'no tenant context -> parties invisible (fails closed)');

SELECT set_config('app.current_tenant', '11111111-1111-4111-8111-111111111111', true);

SELECT is((SELECT count(*) FROM households)::bigint, 1::bigint,
  'Northpeak sees only its own household');
SELECT is((SELECT count(*) FROM policies)::bigint, 2::bigint,
  'Northpeak sees only its own 2 policies');
SELECT is((SELECT count(*) FROM households
           WHERE id = 'eeeeeeee-0000-4000-8000-000000000002')::bigint, 0::bigint,
  'Northpeak cannot read Rideau household by direct id');
SELECT is((SELECT count(*) FROM tenants)::bigint, 1::bigint,
  'Northpeak sees only its own tenant row');
SELECT is((SELECT count(*) FROM carriers)::bigint, 2::bigint,
  'Northpeak sees only its own carriers');

SELECT set_config('app.current_tenant', '22222222-2222-4222-8222-222222222222', true);

SELECT is((SELECT count(*) FROM households)::bigint, 1::bigint,
  'Rideau sees only its own household');
SELECT is((SELECT count(*) FROM policies)::bigint, 1::bigint,
  'Rideau sees only its own policy');
SELECT is((SELECT count(*) FROM households
           WHERE id = 'eeeeeeee-0000-4000-8000-000000000001')::bigint, 0::bigint,
  'Rideau cannot read Northpeak household by direct id');

SELECT set_config('app.current_tenant', '11111111-1111-4111-8111-111111111111', true);

SELECT throws_ok(
  $$INSERT INTO households (tenant_id, display_name)
    VALUES ('22222222-2222-4222-8222-222222222222', 'Smuggled')$$,
  NULL,
  'cannot INSERT a household stamped with another tenant_id (WITH CHECK)');

SELECT throws_ok(
  $$UPDATE households SET tenant_id = '22222222-2222-4222-8222-222222222222'
    WHERE id = 'eeeeeeee-0000-4000-8000-000000000001'$$,
  NULL,
  'cannot UPDATE a household into another tenant (WITH CHECK)');

SELECT throws_ok(
  $$INSERT INTO policies (tenant_id, household_id, line_code, policy_number,
      description, effective_date, expiry_date)
    VALUES ('22222222-2222-4222-8222-222222222222',
            'eeeeeeee-0000-4000-8000-000000000002', 'AUTO', 'X-1', 'smuggled',
            DATE '2026-01-01', DATE '2027-01-01')$$,
  NULL,
  'cannot INSERT a policy into another tenant');

SELECT lives_ok(
  $$DELETE FROM households WHERE id = 'eeeeeeee-0000-4000-8000-000000000002'$$,
  'DELETE targeting another tenant affects zero rows');

-- ---------------------------------------------------------------------------
-- Invariant #4 — entitlement
-- ---------------------------------------------------------------------------
SELECT ok(app.tenant_has_module('life'), 'Northpeak IS entitled to the life module');

SELECT set_config('app.current_tenant', '22222222-2222-4222-8222-222222222222', true);
SELECT ok(NOT app.tenant_has_module('life'), 'Rideau is NOT entitled to the life module');

SELECT set_config('app.current_tenant', '', true);
SELECT ok(NOT app.tenant_has_module('pc'), 'entitlement is false with no tenant context');

SELECT set_config('app.current_tenant', '11111111-1111-4111-8111-111111111111', true);
SELECT throws_ok(
  $$INSERT INTO tenant_modules (tenant_id, module_code)
    VALUES ('11111111-1111-4111-8111-111111111111', 'mortgage')$$,
  NULL,
  'tenant cannot grant itself a module entitlement');

-- ---------------------------------------------------------------------------
-- Invariant #3 — licence is the security boundary
-- ---------------------------------------------------------------------------
SELECT set_config('app.current_user', 'aaaaaaaa-0000-4000-8000-000000000001', true);
SELECT ok(app.user_is_licensed_for_module('pc'),
  'Maya (valid RIBO) IS licensed for P&C');

SELECT set_config('app.current_user', 'aaaaaaaa-0000-4000-8000-000000000002', true);
SELECT ok(NOT app.user_is_licensed_for_module('pc'),
  'Owen (LLQP only) is NOT licensed for P&C');
SELECT ok(app.user_is_licensed_for_module('life'),
  'Owen IS licensed for life');

SELECT set_config('app.current_tenant', '22222222-2222-4222-8222-222222222222', true);
SELECT set_config('app.current_user', 'bbbbbbbb-0000-4000-8000-000000000001', true);
SELECT ok(NOT app.user_is_licensed_for_module('pc'),
  'Sasha (EXPIRED RIBO) is NOT licensed — expiry alone removes capability');

SELECT set_config('app.current_tenant', '11111111-1111-4111-8111-111111111111', true);
SELECT set_config('app.current_user', 'aaaaaaaa-0000-4000-8000-000000000002', true);
SELECT throws_ok(
  $$INSERT INTO licences (tenant_id, user_id, class_code, licence_number,
      issued_on, expires_on)
    VALUES ('11111111-1111-4111-8111-111111111111',
            'aaaaaaaa-0000-4000-8000-000000000002', 'ribo', 'SELF-GRANTED',
            DATE '2026-01-01', DATE '2030-01-01')$$,
  NULL,
  'user cannot grant themselves a licence');

-- ---------------------------------------------------------------------------
-- Invariant #1 — no-bind is a state-machine guard
-- ---------------------------------------------------------------------------
SELECT set_config('app.current_user', 'aaaaaaaa-0000-4000-8000-000000000001', true);

INSERT INTO transactions (tenant_id, household_id, policy_id, line_code, type_code,
                          seq, description, state)
VALUES ('11111111-1111-4111-8111-111111111111', 'eeeeeeee-0000-4000-8000-000000000001',
        '0a0a0a0a-0000-4000-8000-000000000001', 'AUTO', 'endorsement',
        901, 'test — bind by licensed broker', 'carrier_review'),
       ('11111111-1111-4111-8111-111111111111', 'eeeeeeee-0000-4000-8000-000000000001',
        '0a0a0a0a-0000-4000-8000-000000000001', 'AUTO', 'endorsement',
        902, 'test — bind by unlicensed user', 'carrier_review'),
       ('11111111-1111-4111-8111-111111111111', 'eeeeeeee-0000-4000-8000-000000000001',
        '0a0a0a0a-0000-4000-8000-000000000001', 'AUTO', 'endorsement',
        903, 'test — illegal transition', 'draft');

SELECT lives_ok(
  $$UPDATE transactions SET state = 'bound' WHERE seq = 901$$,
  'licensed RIBO broker CAN bind a P&C transaction');

SELECT set_config('app.current_user', 'aaaaaaaa-0000-4000-8000-000000000002', true);
SELECT throws_ok(
  $$UPDATE transactions SET state = 'bound' WHERE seq = 902$$,
  NULL,
  'life-only user CANNOT bind a P&C transaction (no-bind guard)');

SELECT set_config('app.current_user', 'aaaaaaaa-0000-4000-8000-000000000001', true);
SELECT throws_ok(
  $$UPDATE transactions SET state = 'bound' WHERE seq = 903$$,
  NULL,
  'cannot skip carrier_review: draft -> bound is an illegal transition');

SELECT set_config('app.current_user', 'aaaaaaaa-0000-4000-8000-000000000002', true);
SELECT throws_ok(
  $$INSERT INTO transactions (tenant_id, household_id, policy_id, line_code,
      type_code, seq, description, state)
    VALUES ('11111111-1111-4111-8111-111111111111',
            'eeeeeeee-0000-4000-8000-000000000001',
            '0a0a0a0a-0000-4000-8000-000000000001', 'AUTO', 'endorsement',
            904, 'inserted pre-bound', 'bound')$$,
  NULL,
  'unlicensed user cannot INSERT a transaction directly in bound state');

SELECT is((SELECT count(*) FROM transactions
           WHERE seq = 901 AND bound_by IS NOT NULL AND bound_at IS NOT NULL)::bigint,
          1::bigint,
  'a bound transaction records who bound it and when');

-- ---------------------------------------------------------------------------
-- Audit trail is append-only
-- ---------------------------------------------------------------------------
SELECT is((SELECT count(*) FROM transaction_events WHERE to_state = 'bound')::bigint,
          1::bigint,
  'state change wrote an audit event automatically');

SELECT throws_ok(
  $$UPDATE transaction_events SET to_state = 'draft' WHERE to_state = 'bound'$$,
  NULL, 'audit events cannot be UPDATEd');

SELECT throws_ok(
  $$DELETE FROM transaction_events$$,
  NULL, 'audit events cannot be DELETEd');

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
