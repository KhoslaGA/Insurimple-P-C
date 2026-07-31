-- ============================================================================
-- 0014_role_topology.sql
-- Two roles, so the isolation guarantee stops depending on which one connects.
--
-- RLS does not apply to a superuser, to a role with BYPASSRLS, or to the table
-- OWNER — unless FORCE ROW LEVEL SECURITY is set. `enable_tenant_table()`
-- already sets FORCE, which is what makes the owner-bypass safe here. But the
-- app must still not connect as the owner: FORCE closes the row-visibility
-- hole, and it does not stop the owner altering policies, disabling RLS, or
-- dropping the tables outright.
--
--   insurimple_migrator  owns every object, runs migrations, never used by the app
--   insurimple_app       NOSUPERUSER NOBYPASSRLS, owns nothing, only DML grants
--
-- `DATABASE_URL` for apps/api carries insurimple_app and nothing else.
--
-- Compatibility: the existing dev/test path uses a role literally named `app`
-- (created by seed_dev.sql and test.sql). insurimple_app is created here and
-- `app` is granted it, so both paths converge on the same privilege set rather
-- than drifting apart.
-- ============================================================================

DO $$ BEGIN
    CREATE ROLE insurimple_migrator NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- LOGIN, because this is the role in DATABASE_URL — but with no password. A
-- LOGIN role without a password cannot authenticate under scram or md5, so the
-- migration creates the identity and the deployment supplies the credential
-- (RDS IAM auth, or ALTER ROLE ... PASSWORD from the secret store). A password
-- must never appear in a migration; the migration set is checked in.
DO $$ BEGIN
    CREATE ROLE insurimple_app LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Belt and braces: if the role pre-existed with the wrong attributes, correct
-- them rather than trusting how it was made.
ALTER ROLE insurimple_app LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;

-- The app may read and write tenant data. It may not own, alter or drop it.
GRANT USAGE ON SCHEMA public TO insurimple_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO insurimple_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO insurimple_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO insurimple_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO insurimple_app;

-- Explicitly withhold DDL. A GRANT ALL anywhere upstream would otherwise hand
-- the app the ability to disable the policies that protect it.
REVOKE CREATE ON SCHEMA public FROM insurimple_app;

-- Converge the legacy dev role onto the same privileges.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
        EXECUTE 'GRANT insurimple_app TO app';
        EXECUTE 'ALTER ROLE app NOSUPERUSER NOBYPASSRLS';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Guard rails on the app role's session. An abandoned open transaction holds
-- tenant context and blocks vacuum on tables that are already the largest in
-- the database (DB.5).
-- ----------------------------------------------------------------------------
ALTER ROLE insurimple_app SET statement_timeout = '30s';
ALTER ROLE insurimple_app SET idle_in_transaction_session_timeout = '60s';
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
        EXECUTE $q$ALTER ROLE app SET statement_timeout = '30s'$q$;
        EXECUTE $q$ALTER ROLE app SET idle_in_transaction_session_timeout = '60s'$q$;
    END IF;
END $$;

-- ============================================================================
-- audit_event was NOT tenant-isolated. Found by the backstop below, which is
-- the whole reason for writing it.
--
-- The table carries tenant_id and stores `before` and `after` — full jsonb row
-- images of every mutation on every tenant's data. Without RLS, one query
-- against it returns the entire platform's records regardless of tenant. No
-- endpoint reads it today, which is why this had not bitten; the product page
-- list has a "Data & security → audit log" screen at P2, and that screen would
-- have leaked every tenant's book on its first render.
--
-- It cannot go through enable_tenant_table(): that attaches an audit trigger,
-- and audit_event auditing itself is infinite recursion. Its primary key is
-- also a bigint identity rather than a uuid. So the policy is written by hand.
--
-- INSERT is written only by the audit_capture() trigger, which derives
-- tenant_id from the row being audited — a row RLS already constrained. The
-- NULL branch covers mutations on `tenant` itself, which has no tenant_id and
-- is deliberately not tenant-scoped (the auth guard must resolve a tenant by
-- clerk_org_id before any tenant context exists).
-- ============================================================================
ALTER TABLE audit_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_event FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_tenant_read ON audit_event;
CREATE POLICY audit_tenant_read ON audit_event
    FOR SELECT USING (tenant_id = current_tenant());

DROP POLICY IF EXISTS audit_tenant_write ON audit_event;
CREATE POLICY audit_tenant_write ON audit_event
    FOR INSERT WITH CHECK (tenant_id = current_tenant() OR tenant_id IS NULL);

-- No UPDATE or DELETE policy exists, deliberately: with RLS forced and no
-- permissive policy for those commands, they are refused for every row. That
-- is a second lock on append-only, independent of the existing trigger.

-- Partitions inherit neither the policies above nor row security itself, and
-- ensure_month_partitions() runs in 0001 before these policies exist. Re-run it
-- so every audit partition carries ENABLE + FORCE.
SELECT ensure_month_partitions('audit_event',
    (date_trunc('month', now()) - interval '2 months')::date, 14);

-- ----------------------------------------------------------------------------
-- Backstop: every table carrying tenant_id must have RLS both ENABLED and
-- FORCED. enable_tenant_table() does this, but a table added without calling it
-- would be silently unprotected — which is the failure mode where everything
-- keeps working and every tenant sees every other tenant's book.
--
-- This function is the assertion; test.sql and the pgTAP suite both call it.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_rls_complete() RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    bad text;
BEGIN
    SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO bad
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind IN ('r','p')
       AND EXISTS (
             SELECT 1 FROM pg_attribute a
              WHERE a.attrelid = c.oid AND a.attname = 'tenant_id' AND NOT a.attisdropped)
       AND NOT (c.relrowsecurity AND c.relforcerowsecurity);
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'tables carry tenant_id without ENABLE+FORCE row level security: %', bad;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Backstop: no uuid primary key may carry a default.
--
-- The failure this catches is quiet. A table added with the habitual
-- `DEFAULT gen_random_uuid()` keeps working, and nothing is visibly wrong until
-- the table is large enough that random insert positions are hurting — by which
-- point the fix is a rewrite of a live book. Any default at all is refused, not
-- just gen_random_uuid(): a `DEFAULT uuidv7()` would produce good keys, but it
-- would also hide application code that stopped supplying an id, and the point
-- of removing the default is to hear about that immediately.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_no_generated_keys() RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    bad text;
BEGIN
    SELECT string_agg(c.relname || '.' || a.attname || ' = ' || pg_get_expr(d.adbin, d.adrelid),
                      ', ' ORDER BY c.relname)
      INTO bad
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
      JOIN pg_attrdef d  ON d.adrelid = c.oid AND d.adnum = a.attnum
     WHERE n.nspname = 'public'
       AND c.relkind IN ('r','p')
       AND format_type(a.atttypid, NULL) = 'uuid'
       AND a.attname = 'id';
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION
            'uuid primary keys must be supplied by the caller as UUIDv7, not defaulted: %', bad;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Backstop: the app role's session guard rails are still attached.
--
-- These are set on the ROLE rather than in the connection string, so they apply
-- however the application connects — including a psql session someone opens
-- with the app credentials. That also makes them easy to drop by accident: a
-- single `ALTER ROLE insurimple_app RESET ALL` while debugging removes both and
-- leaves nothing behind to notice. An abandoned transaction then holds tenant
-- context open and blocks vacuum on audit_event, which is 70% of the database.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_app_role_timeouts() RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    r    record;
    cfg  text[];
BEGIN
    FOR r IN SELECT rolname FROM pg_roles WHERE rolname IN ('insurimple_app','app') LOOP
        SELECT rolconfig INTO cfg FROM pg_roles WHERE rolname = r.rolname;
        IF cfg IS NULL
        OR NOT (cfg::text LIKE '%statement_timeout%')
        OR NOT (cfg::text LIKE '%idle_in_transaction_session_timeout%') THEN
            RAISE EXCEPTION
                'role % has lost statement_timeout or idle_in_transaction_session_timeout — '
                'an abandoned open transaction holds tenant context and blocks vacuum on the '
                'largest tables in the database', r.rolname;
        END IF;
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION assert_app_role_unprivileged() RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT rolname, rolsuper, rolbypassrls FROM pg_roles
              WHERE rolname IN ('insurimple_app','app')
    LOOP
        IF r.rolsuper THEN
            RAISE EXCEPTION 'role % is a superuser — RLS does not apply to it', r.rolname;
        END IF;
        IF r.rolbypassrls THEN
            RAISE EXCEPTION 'role % has BYPASSRLS — RLS does not apply to it', r.rolname;
        END IF;
    END LOOP;
END $$;
