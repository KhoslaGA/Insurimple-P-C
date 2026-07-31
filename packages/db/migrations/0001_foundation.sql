-- ============================================================================
-- 0001_foundation.sql
-- Multi-tenant foundation, Row-Level Security, immutable audit spine.
-- Everything else in the schema depends on this file.
-- ============================================================================

-- pg_trgm powers fuzzy search on names/VINs; created when available.
DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_trgm unavailable — trigram search indexes will be skipped';
END $$;

-- ----------------------------------------------------------------------------
-- Primary keys are UUIDv7 — time-ordered — and NO table declares a default.
--
-- UUIDv4 is random, so every insert lands in a random leaf of the B-tree. At
-- 30M rows that means a cache miss per insert, write amplification in WAL, and
-- an index that bloats faster than the table. It is also the one scale decision
-- that is not cheaply reversible: changing key format later is a full table
-- rewrite of a live book. UUIDv7 puts a millisecond timestamp in the high bits,
-- so inserts append.
--
-- The default is removed rather than changed to uuidv7(). A default is a
-- silent fallback, and the thing we most want to hear about is application code
-- that stopped supplying an id. With no default, that is a NOT NULL violation
-- on the first insert; with one, it is a working system that quietly diverges
-- from whatever the application thinks the id is.
--
-- Application code generates ids with the `uuidv7` npm package, which keeps a
-- counter so two ids minted in the same millisecond still order correctly. This
-- function is for SQL-side fixtures, seeds and data migrations, which have no
-- other way to mint one. PG16 has no native uuidv7() — that is PG18 — and
-- pg_uuidv7 is not on the RDS supported-extensions list, so both generators are
-- written rather than installed.
--
-- Layout (RFC 9562): 48 bits unix_ts_ms | ver 0111 | 12 bits sub-ms | var 10 |
-- 62 bits random. The sub-millisecond field is the clock's microsecond
-- remainder rather than random, which keeps ids ordered within a millisecond
-- too — the same property the npm package's counter provides.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid
LANGUAGE sql VOLATILE AS $$
    SELECT (
        lpad(to_hex((v.us / 1000)::bigint), 12, '0')                 -- unix_ts_ms
     || '7'                                                          -- version
     || lpad(to_hex((((v.us % 1000) * 4096) / 1000)::int), 3, '0')   -- sub-ms
     || to_hex(8 + (random() * 3)::int)                              -- variant 10xx
     || substr(replace(gen_random_uuid()::text, '-', ''), 1, 15)     -- rand_b
    )::uuid
    FROM (SELECT (extract(epoch from clock_timestamp()) * 1000000)::bigint AS us) v
$$;

-- ----------------------------------------------------------------------------
-- Tenancy. Every business row carries tenant_id and is isolated by RLS.
-- A tenant is a brokerage. Branch is the Agency/Branch hierarchy Epic exposes,
-- but — unlike Epic — branch is a re-taggable pointer, never a cancel/rewrite.
-- ----------------------------------------------------------------------------
CREATE TABLE tenant (
    id              uuid PRIMARY KEY,
    legal_name      text NOT NULL,
    trade_name      text,
    ribo_licence    text,                       -- brokerage RIBO registration #
    status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','suspended','onboarding','closed')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE branch (
    id              uuid PRIMARY KEY,
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    code            text NOT NULL,               -- e.g. 'SOU'
    name            text NOT NULL,
    address         jsonb,
    is_default      boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, code)
);

-- Staff / users. Kept minimal here; auth (Clerk) lives outside the DB.
CREATE TABLE staff (
    id              uuid PRIMARY KEY,
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    full_name       text NOT NULL,
    email           text NOT NULL,
    role            text NOT NULL DEFAULT 'csr'
                    CHECK (role IN ('principal_broker','broker','csr','readonly','system')),
    ribo_level      text,                        -- 'L1','L2','unlicensed'
    external_auth_id text,                        -- Clerk user id
    active          boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, email)
);

-- ----------------------------------------------------------------------------
-- Session context. NestJS sets these per transaction:
--   set_config('app.current_tenant', '<uuid>',                  true)
--   set_config('app.current_actor',  '<staff uuid|system>',     true)
-- RLS policies and the audit trigger read them.
--
-- Both default to a value that CAN DO NOTHING when unset. `system` is the
-- actor that bypasses every authority guard in 0009-0012 — the licence check,
-- the entitlement check, the proof-issue check, the team.manage check — so
-- defaulting to it would mean a connection that forgot to set an actor got
-- full provisioning authority. That is a failure mode with no error message:
-- everything works, and it works too well. `system` must be asked for.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$
    SELECT nullif(current_setting('app.current_tenant', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION current_actor() RETURNS text
LANGUAGE sql STABLE AS $$
    SELECT coalesce(nullif(current_setting('app.current_actor', true), ''), 'anonymous')
$$;

-- ----------------------------------------------------------------------------
-- updated_at auto-touch.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END $$;

-- ----------------------------------------------------------------------------
-- Immutable audit spine. One append-only table captures every mutation on any
-- audited table as a before/after JSON diff, with actor + timestamp. This is
-- the RIBO Spot Check / E&O backbone. No UPDATE or DELETE is ever permitted.
-- ----------------------------------------------------------------------------
CREATE TABLE audit_event (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id       uuid,
    actor           text NOT NULL,
    action          text NOT NULL,               -- INSERT | UPDATE | DELETE
    entity          text NOT NULL,               -- table name
    entity_id       uuid,
    before          jsonb,
    after           jsonb,
    at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON audit_event (tenant_id, entity, entity_id, at);

-- Block edits/deletes to the audit log itself — even by the tenant owner.
CREATE OR REPLACE FUNCTION audit_is_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'audit_event is append-only';
END $$;
CREATE TRIGGER trg_audit_no_update BEFORE UPDATE OR DELETE ON audit_event
    FOR EACH ROW EXECUTE FUNCTION audit_is_append_only();

-- Generic audit capture. Attach to any table with a uuid `id` column.
CREATE OR REPLACE FUNCTION audit_capture() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_tenant uuid;
    v_id     uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_tenant := (to_jsonb(OLD)->>'tenant_id')::uuid;
        v_id     := (to_jsonb(OLD)->>'id')::uuid;
        INSERT INTO audit_event(tenant_id,actor,action,entity,entity_id,before,after)
        VALUES (v_tenant,current_actor(),'DELETE',TG_TABLE_NAME,v_id,to_jsonb(OLD),NULL);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        v_tenant := (to_jsonb(NEW)->>'tenant_id')::uuid;
        v_id     := (to_jsonb(NEW)->>'id')::uuid;
        INSERT INTO audit_event(tenant_id,actor,action,entity,entity_id,before,after)
        VALUES (v_tenant,current_actor(),'UPDATE',TG_TABLE_NAME,v_id,to_jsonb(OLD),to_jsonb(NEW));
        RETURN NEW;
    ELSE
        v_tenant := (to_jsonb(NEW)->>'tenant_id')::uuid;
        v_id     := (to_jsonb(NEW)->>'id')::uuid;
        INSERT INTO audit_event(tenant_id,actor,action,entity,entity_id,before,after)
        VALUES (v_tenant,current_actor(),'INSERT',TG_TABLE_NAME,v_id,NULL,to_jsonb(NEW));
        RETURN NEW;
    END IF;
END $$;

-- Convenience: apply audit + updated_at + RLS to a tenant-scoped table.
-- Called at the bottom of each domain migration.
CREATE OR REPLACE FUNCTION enable_tenant_table(p_table regclass) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE t text := p_table::text;
BEGIN
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($f$
        CREATE POLICY tenant_isolation ON %s
        USING (tenant_id = current_tenant())
        WITH CHECK (tenant_id = current_tenant())
    $f$, t);
    EXECUTE format('CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON %s
        FOR EACH ROW EXECUTE FUNCTION audit_capture()', t);
END $$;

-- ----------------------------------------------------------------------------
-- Monthly partitions for the append-only leaves.
--
-- Idempotent, so the migration and the maintenance job are the same code path
-- and there is no second implementation to drift.
--
-- Each partition gets its own ENABLE + FORCE ROW LEVEL SECURITY. Policies are
-- inherited from the parent for queries that go through the parent, but
-- insurimple_app can name a partition directly — and a partition without its
-- own row security is an open door with a date in its name.
--
-- A DEFAULT partition exists so a row outside every declared range is filed
-- rather than refused: the alternative is the application losing its ability to
-- write diary entries the moment maintenance falls behind. The cost is that a
-- non-empty default blocks creating the partition that should have held those
-- rows, so assert_partitions_current() fails the build if anything is in there.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ensure_month_partitions(
    p_table text, p_from date DEFAULT date_trunc('month', now())::date, p_months int DEFAULT 6
) RETURNS int
LANGUAGE plpgsql AS $$
DECLARE
    v_start date;
    v_name  text;
    v_made  int := 0;
BEGIN
    FOR i IN 0 .. p_months - 1 LOOP
        v_start := (date_trunc('month', p_from) + make_interval(months => i))::date;
        v_name  := format('%s_%s', p_table, to_char(v_start, 'YYYYMM'));
        IF to_regclass('public.' || quote_ident(v_name)) IS NULL THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                v_name, p_table, v_start, (v_start + interval '1 month')::date);
            v_made := v_made + 1;
        END IF;
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', v_name);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', v_name);
    END LOOP;

    v_name := p_table || '_default';
    IF to_regclass('public.' || quote_ident(v_name)) IS NULL THEN
        EXECUTE format('CREATE TABLE %I PARTITION OF %I DEFAULT', v_name, p_table);
        v_made := v_made + 1;
    END IF;
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', v_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', v_name);

    RETURN v_made;
END $$;

-- Every partitioned table must have a partition for this month and the next,
-- and nothing may be sitting in a default partition.
CREATE OR REPLACE FUNCTION assert_partitions_current() RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    r      record;
    v_next date := (date_trunc('month', now()) + interval '1 month')::date;
    n      bigint;
BEGIN
    FOR r IN SELECT c.relname FROM pg_class c
              JOIN pg_namespace n2 ON n2.oid = c.relnamespace
             WHERE n2.nspname = 'public' AND c.relkind = 'p'
    LOOP
        IF to_regclass('public.' || quote_ident(r.relname || '_' || to_char(now(), 'YYYYMM'))) IS NULL
        OR to_regclass('public.' || quote_ident(r.relname || '_' || to_char(v_next, 'YYYYMM'))) IS NULL THEN
            RAISE EXCEPTION
                'partitioned table % has no partition for this month or next — writes are '
                'about to land in the default partition, which then blocks creating the '
                'partition that should have held them', r.relname;
        END IF;
        IF to_regclass('public.' || quote_ident(r.relname || '_default')) IS NOT NULL THEN
            EXECUTE format('SELECT count(*) FROM %I', r.relname || '_default') INTO n;
            IF n > 0 THEN
                RAISE EXCEPTION
                    '% rows are sitting in %_default — maintenance fell behind, and those '
                    'rows now block creating the month partition they belong to',
                    n, r.relname;
            END IF;
        END IF;
    END LOOP;
END $$;

-- tenant + branch + staff get audit + updated_at (tenant itself is not tenant-scoped)
CREATE TRIGGER trg_touch BEFORE UPDATE ON tenant FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON branch FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON staff  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
SELECT enable_tenant_table('branch');
SELECT enable_tenant_table('staff');
