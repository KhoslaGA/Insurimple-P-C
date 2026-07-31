-- ============================================================================
-- rls.sql — the tenant isolation gate.
--
-- Runs as insurimple_app, over every table carrying tenant_id, and asserts the
-- four ways one tenant could reach another's data:
--
--   read   — a SELECT scoped to the other tenant returns nothing
--   write  — an UPDATE scoped to the other tenant touches nothing
--   plant  — an INSERT carrying the other tenant's id is refused by WITH CHECK
--   blank  — with no tenant context at all, a bare SELECT returns nothing
--
-- The last one is the one that gets forgotten. A policy written as
-- `tenant_id = current_tenant()` fails closed when the setting is absent; one
-- written with an `OR current_setting(...) IS NULL` escape hatch — the usual
-- "so migrations still work" concession — returns the entire platform.
--
-- Coverage comes from tenant_tables(), which reads the catalogue. A table added
-- to the schema is covered from the moment it exists.
--
-- Preconditions this script refuses to run without:
--   * the caller is not a superuser and does not hold BYPASSRLS
--   * the caller does not own the tables
--   * every table has fixture rows for BOTH tenants
-- Any of these missing turns the suite into a certification of nothing.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Hard preconditions. These abort the run rather than emit a failing test,
-- because a suite that reports "1 failure" when it is running as the wrong role
-- invites someone to look at the other 169 passes and feel reassured.
-- ----------------------------------------------------------------------------
DO $$
DECLARE v_owner name;
BEGIN
    IF current_setting('is_superuser') = 'on' THEN
        RAISE EXCEPTION
            'ABORT: the RLS suite is running as a superuser (%). Superusers bypass row '
            'level security unconditionally, so every assertion below would pass or fail '
            'for reasons unrelated to the policies.', current_user;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user AND rolbypassrls) THEN
        RAISE EXCEPTION 'ABORT: % holds BYPASSRLS.', current_user;
    END IF;

    SELECT pg_get_userbyid(relowner) INTO v_owner FROM pg_class WHERE relname = 'account';
    IF pg_has_role(current_user, v_owner, 'USAGE') THEN
        RAISE EXCEPTION
            'ABORT: % owns the tables (or is a member of the owner %). FORCE ROW LEVEL '
            'SECURITY covers row visibility for the owner but not policy or schema '
            'changes; the app must not connect as the owner.', current_user, v_owner;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rls_fixture_census) THEN
        RAISE EXCEPTION 'ABORT: no fixture census — run rls_fixture.sql first.';
    END IF;
END $$;

SELECT plan(
    5 * (SELECT count(*)::int FROM rls_fixture_census)   -- per-table assertions
    + 4                                                  -- suite-level assertions
    + 4                                                  -- planner assertions
);

-- ----------------------------------------------------------------------------
-- Suite-level
-- ----------------------------------------------------------------------------
SELECT is(
    (SELECT count(*)::int FROM rls_fixture_census WHERE tenant_a = 0 OR tenant_b = 0),
    0,
    'every tenant table has fixture rows for both tenants — no assertion below is vacuous');

SELECT is(
    array_length(tenant_tables(), 1),
    (SELECT count(*)::int FROM rls_fixture_census),
    'the census covers every table carrying tenant_id');

SELECT lives_ok(
    'SELECT assert_rls_complete()',
    'every table carrying tenant_id has RLS both ENABLED and FORCED');

SELECT lives_ok(
    'SELECT assert_app_role_unprivileged()',
    'the application roles hold neither SUPERUSER nor BYPASSRLS');

-- ----------------------------------------------------------------------------
-- Acting as tenant alpha, with a real actor so authority triggers do not fire
-- ahead of the policies and refuse the write for the wrong reason.
-- ----------------------------------------------------------------------------
SELECT set_config('app.current_tenant', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
SELECT set_config('app.current_actor',
                  md5('alpha' || 'staff')::uuid::text, true);

-- read — own tenant. Not an isolation assertion; it is what stops the three
-- below from passing because the probe is blind rather than because RLS works.
SELECT is(rls_select_count(t, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
          (SELECT tenant_a FROM rls_fixture_census WHERE table_name = t),
          t || ': own-tenant SELECT returns every row the fixture planted')
  FROM unnest(tenant_tables()) AS t;

-- read — other tenant
SELECT is(rls_select_count(t, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid),
          0::bigint,
          t || ': cross-tenant SELECT returns zero rows')
  FROM unnest(tenant_tables()) AS t;

-- write — other tenant
SELECT is(rls_update_count(t, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid),
          0::bigint,
          t || ': cross-tenant UPDATE affects zero rows')
  FROM unnest(tenant_tables()) AS t;

-- plant — a row carrying the other tenant's id.
--
-- The assertion is on the message, and specifically on the table NAMED in the
-- message. Two weaker versions of this test both pass on a table with no policy
-- at all:
--
--   * accepting any error — a unique violation or a BEFORE trigger raises too;
--   * accepting any row-level-security error — because the audit trigger writes
--     the mutation into audit_event, whose own WITH CHECK refuses a row for a
--     tenant that is not in context. Disabling RLS on `policy` and running the
--     loose version produces "42501 new row violates row-level security policy
--     for table audit_event" and a green tick. Verified, not theorised.
SELECT matches(
          rls_insert_foreign(t,
              'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
              'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid),
          '^42501 new row violates row-level security policy for table "' || t || '"$',
          t || ': INSERT carrying a foreign tenant_id is refused by ' || t || '''s own WITH CHECK')
  FROM unnest(tenant_tables()) AS t;

-- ----------------------------------------------------------------------------
-- The planner, as the app role sees it.
--
-- Under RLS a qual the caller wrote sits above the policy's qual, and only a
-- LEAKPROOF qual may be promoted into an index condition — otherwise it could
-- observe rows the policy is meant to hide before the policy has run. Every
-- text-search operator in PostgreSQL 16 is non-leakproof, and so is lower(),
-- upper() and even textcat (||). So an index whose usefulness depends on any of
-- them is unreachable for the application no matter how good it looks in a plan
-- captured as the owner.
--
-- These four assertions pin the consequence in both directions: the search path
-- that works must keep working, and the one that does not must stay documented
-- rather than quietly reappear as an index nobody notices is dead.
-- ----------------------------------------------------------------------------

SELECT matches(
    rls_explain($$SELECT id FROM party
                   WHERE search_name >= 'ada' AND search_name < 'adb' LIMIT 20$$),
    'Index Cond: \(\(tenant_id = .*\) AND \(search_name >=',
    'party prefix search: both tenant_id and search_name become index conditions');

SELECT matches(
    rls_explain($$SELECT id FROM account
                   WHERE search_name >= 'ada' AND search_name < 'adb' LIMIT 20$$),
    'Index Cond: \(\(tenant_id = .*\) AND \(search_name >=',
    'account prefix search: both tenant_id and search_name become index conditions');

SELECT doesnt_match(
    rls_explain($$SELECT id FROM party WHERE lower(search_name) >= 'ada' LIMIT 20$$),
    -- [^\n] rather than . — a Postgres regex dot matches newlines, so 'Index
    -- Cond:.*lower' happily spans down to the Filter line and the assertion
    -- fails on a plan that is exactly right. The match has to stay on one line.
    'Index Cond:[^\n]*lower',
    'wrapping the column in lower() demotes it to a filter — normalise on write, compare raw');

SELECT doesnt_match(
    rls_explain($$SELECT id FROM party
                   WHERE search_name % 'adamson'::text LIMIT 20$$),
    'Index Cond:[^\n]*search_name',
    'the trigram operator cannot be an index condition under RLS — it is not leakproof');

-- ----------------------------------------------------------------------------
-- blank — no tenant context at all. Fail closed, not open.
-- ----------------------------------------------------------------------------
SELECT set_config('app.current_tenant', '', true);

SELECT is(rls_select_all(t), 0::bigint,
          t || ': with no tenant context set, SELECT returns zero rather than everything')
  FROM unnest(tenant_tables()) AS t;

SELECT * FROM finish();

ROLLBACK;
