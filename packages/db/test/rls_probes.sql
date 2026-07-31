-- ============================================================================
-- rls_probes.sql — the instruments the RLS suite reads through.
--
-- Created by the OWNER because insurimple_app has no CREATE on the schema, and
-- deliberately SECURITY INVOKER: row level security is evaluated against
-- current_user, so a SECURITY DEFINER probe would silently measure the owner's
-- visibility and report it as the app's. That single word is the difference
-- between a suite that proves isolation and a suite that certifies nothing.
--
-- Every probe is dynamic over a table name so the suite covers all 34
-- tenant-scoped tables without 34 copies of the same assertion — and so a table
-- added later is covered the moment it appears, rather than the moment someone
-- remembers to add a test for it.
-- ============================================================================

-- tenant_tables() — the suite's coverage — is defined by the migration set, in
-- 0015. It was defined here too until a partitioned table appeared: the probes
-- load after the migrations, so this copy silently replaced the real one, and
-- the census started counting `activity` fourteen more times under its monthly
-- partition names. Two definitions of the same function is exactly the drift an
-- isolation suite must not have. There is one, and the schema owns it.

-- How many of `p_tenant`'s rows the CALLER can see right now.
CREATE OR REPLACE FUNCTION rls_select_count(p_table text, p_tenant uuid) RETURNS bigint
LANGUAGE plpgsql STABLE SECURITY INVOKER AS $$
DECLARE n bigint;
BEGIN
    EXECUTE format('SELECT count(*) FROM %I WHERE tenant_id = $1', p_table)
        INTO n USING p_tenant;
    RETURN n;
END $$;

-- Everything the CALLER can see, regardless of tenant. Used for the
-- no-context case, where the correct answer is zero and the dangerous answer
-- is "all of it".
CREATE OR REPLACE FUNCTION rls_select_all(p_table text) RETURNS bigint
LANGUAGE plpgsql STABLE SECURITY INVOKER AS $$
DECLARE n bigint;
BEGIN
    EXECUTE format('SELECT count(*) FROM %I', p_table) INTO n;
    RETURN n;
END $$;

-- A no-op self-assignment scoped to another tenant's rows. The USING clause of
-- the policy decides how many rows the statement can even see to update; a
-- correct policy makes that zero. Written as tenant_id = tenant_id so no column
-- value changes and no table needs a nominated writable column.
--
-- The exception handler is load-bearing. When the policy is broken the UPDATE
-- reaches real rows, the audit trigger fires, and the audit insert is itself
-- refused because the row belongs to a tenant that is not in context. That
-- error would abort the whole suite transaction and discard every result — so
-- a broken policy would produce a crash with no indication of which table
-- failed. Returning -1 keeps the failure inside the assertion, where it reads
-- as "have -1, want 0" against the table that caused it.
CREATE OR REPLACE FUNCTION rls_update_count(p_table text, p_tenant uuid) RETURNS bigint
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE n bigint;
BEGIN
    EXECUTE format('UPDATE %I SET tenant_id = tenant_id WHERE tenant_id = $1', p_table)
        USING p_tenant;
    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'cross-tenant UPDATE on % reached rows and then failed downstream: %',
        p_table, SQLERRM;
    RETURN -1;
END $$;

-- Attempt to plant a row belonging to another tenant.
--
-- The row is cloned from one the caller can legitimately see, so it satisfies
-- every NOT NULL, CHECK and foreign key the table has — the WITH CHECK policy
-- is then the only thing left that can refuse it. Identity and generated
-- columns are omitted so their defaults apply; `id` is regenerated so the clone
-- does not collide with its source.
--
-- Returns SQLSTATE || ' ' || message rather than a boolean: an insert can also
-- fail on a unique violation or a trigger, and a test that accepts any failure
-- as proof of isolation would pass on a table with no policy at all.
CREATE OR REPLACE FUNCTION rls_insert_foreign(p_table text, p_own uuid, p_foreign uuid)
RETURNS text
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
    cols text;
    vals text;
BEGIN
    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum),
           string_agg(CASE
                        WHEN a.attname = 'tenant_id' THEN quote_literal(p_foreign)||'::uuid'
                        WHEN a.attname = 'id' AND format_type(a.atttypid, NULL) = 'uuid'
                            THEN 'gen_random_uuid()'
                        ELSE quote_ident(a.attname)
                      END, ', ' ORDER BY a.attnum)
      INTO cols, vals
      FROM pg_attribute a
     WHERE a.attrelid = p_table::regclass
       AND a.attnum > 0 AND NOT a.attisdropped
       AND a.attidentity = '' AND a.attgenerated = '';

    EXECUTE format('INSERT INTO %I (%s) SELECT %s FROM %I WHERE tenant_id = $1 LIMIT 1',
                   p_table, cols, vals, p_table)
        USING p_own;
    RETURN 'NO ERROR — the row was accepted';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLSTATE || ' ' || SQLERRM;
END $$;

-- The plan, as the CALLER sees it.
--
-- The only plan worth asserting on. Captured as the owner — or as any superuser
-- — the policy was never applied, so every qual is promotable and the plan
-- looks fine whether or not the index is reachable in production.
--
-- enable_seqscan is off for the duration: with a two-tenant fixture the planner
-- would pick a sequential scan on cost regardless, and the question here is not
-- what it chooses but what it CAN choose. A qual that cannot become an index
-- condition under RLS never will, at any table size.
CREATE OR REPLACE FUNCTION rls_explain(p_sql text) RETURNS text
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
    line text;
    out  text := '';
BEGIN
    SET LOCAL enable_seqscan = off;
    FOR line IN EXECUTE 'EXPLAIN (COSTS OFF) ' || p_sql LOOP
        out := out || line || E'\n';
    END LOOP;
    RETURN out;
END $$;

GRANT EXECUTE ON FUNCTION rls_explain(text)                      TO insurimple_app;
GRANT EXECUTE ON FUNCTION tenant_tables()                        TO insurimple_app;
GRANT EXECUTE ON FUNCTION rls_select_count(text, uuid)           TO insurimple_app;
GRANT EXECUTE ON FUNCTION rls_select_all(text)                   TO insurimple_app;
GRANT EXECUTE ON FUNCTION rls_update_count(text, uuid)           TO insurimple_app;
GRANT EXECUTE ON FUNCTION rls_insert_foreign(text, uuid, uuid)   TO insurimple_app;
