-- ============================================================================
-- 0001_foundation.sql
-- Multi-tenant foundation, Row-Level Security, immutable audit spine.
-- Everything else in the schema depends on this file.
-- ============================================================================

-- gen_random_uuid() is in core PostgreSQL (13+); no pgcrypto needed.
-- pg_trgm powers fuzzy search on names/VINs; created when available.
DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_trgm unavailable — trigram search indexes will be skipped';
END $$;

-- ----------------------------------------------------------------------------
-- Tenancy. Every business row carries tenant_id and is isolated by RLS.
-- A tenant is a brokerage. Branch is the Agency/Branch hierarchy Epic exposes,
-- but — unlike Epic — branch is a re-taggable pointer, never a cancel/rewrite.
-- ----------------------------------------------------------------------------
CREATE TABLE tenant (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name      text NOT NULL,
    trade_name      text,
    ribo_licence    text,                       -- brokerage RIBO registration #
    status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','suspended','onboarding','closed')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE branch (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- Session context. NestJS sets these per request/connection:
--   SET app.current_tenant = '<uuid>';
--   SET app.current_actor  = '<staff uuid or "system">';
-- RLS policies and the audit trigger read them.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$
    SELECT nullif(current_setting('app.current_tenant', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION current_actor() RETURNS text
LANGUAGE sql STABLE AS $$
    SELECT coalesce(nullif(current_setting('app.current_actor', true), ''), 'system')
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

-- tenant + branch + staff get audit + updated_at (tenant itself is not tenant-scoped)
CREATE TRIGGER trg_touch BEFORE UPDATE ON tenant FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON branch FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON staff  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
SELECT enable_tenant_table('branch');
SELECT enable_tenant_table('staff');
