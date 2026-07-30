-- ============================================================================
-- 0009_licences_roles.sql
-- THE SECURITY AND COMMERCIAL BOUNDARIES, made structural.
--
--   Invariant 3 — LICENCE IS THE SECURITY BOUNDARY. Role grants derive from a
--   licence on file with an expiry. A Life-only user cannot create a P&C
--   transaction — enforced by grant at the DB layer, not by UI hiding.
--
--   Invariant 4 — ENTITLEMENT IS THE COMMERCIAL BOUNDARY. `tenant_module`
--   gates every module-scoped capability server-side.
--
-- Both are enforced by a BEFORE INSERT trigger on `txn`: the transaction's
-- module must be entitled to the tenant AND the acting staff member must hold
-- a live (unexpired) grant carrying the matching capability. Application code
-- cannot bypass this; the database refuses the write.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Modules. The three subscription products on the shared spine.
-- ----------------------------------------------------------------------------
CREATE TABLE tenant_module (
    id              uuid PRIMARY KEY,
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    module          text NOT NULL CHECK (module IN ('pc','life','mortgage')),
    active          boolean NOT NULL DEFAULT true,
    subscribed_at   timestamptz NOT NULL DEFAULT now(),
    cancelled_at    timestamptz,
    stripe_subscription_id text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, module)
);

-- ----------------------------------------------------------------------------
-- Capabilities — the atomic permissions. Module-scoped so entitlement and
-- licence can be checked against the same vocabulary.
-- ----------------------------------------------------------------------------
CREATE TABLE capability (
    code            text PRIMARY KEY,            -- 'pc.txn.create'
    module          text CHECK (module IN ('pc','life','mortgage')),  -- null = core
    description     text NOT NULL
);

-- The six roles (brief §6 T0.5 / master spec "six custom roles").
CREATE TABLE app_role (
    code            text PRIMARY KEY,
    name            text NOT NULL,
    description     text
);

CREATE TABLE role_capability (
    role_code       text NOT NULL REFERENCES app_role(code) ON DELETE CASCADE,
    capability_code text NOT NULL REFERENCES capability(code) ON DELETE CASCADE,
    PRIMARY KEY (role_code, capability_code)
);

-- ----------------------------------------------------------------------------
-- Licences on file. The grant's authority — with an expiry clock. An expired
-- licence silently removes the capabilities it carried (see actor_capabilities).
-- ----------------------------------------------------------------------------
CREATE TABLE licence (
    id              uuid PRIMARY KEY,
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    staff_id        uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    licence_class   text NOT NULL CHECK (licence_class IN
                    ('ribo_l1','ribo_l2','ribo_l3','llqp','mortgage_agent','unlicensed')),
    licence_number  text,
    regulator       text,                        -- 'RIBO','FSRA'
    issued_on       date,
    expires_on      date,                        -- null = no expiry on file
    status          text NOT NULL DEFAULT 'active' CHECK (status IN
                    ('active','suspended','revoked','lapsed')),
    evidence_document uuid REFERENCES document(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON licence (tenant_id, staff_id);

-- ----------------------------------------------------------------------------
-- Role grants. A grant may be anchored to a licence; if that licence is not
-- live, the grant carries nothing. That is what makes licence the boundary.
-- ----------------------------------------------------------------------------
CREATE TABLE staff_role_grant (
    id              uuid PRIMARY KEY,
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    staff_id        uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    role_code       text NOT NULL REFERENCES app_role(code),
    licence_id      uuid REFERENCES licence(id) ON DELETE SET NULL,
    granted_at      timestamptz NOT NULL DEFAULT now(),
    revoked_at      timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (staff_id, role_code)
);
CREATE INDEX ON staff_role_grant (tenant_id, staff_id);

-- ----------------------------------------------------------------------------
-- Reference data: capabilities, the six roles, and their mappings.
-- ----------------------------------------------------------------------------
INSERT INTO capability (code, module, description) VALUES
 ('pc.txn.create','pc','Create a P&C transaction'),
 ('pc.policy.write','pc','Create or amend a P&C policy'),
 ('pc.quote.create','pc','Quote P&C business'),
 ('life.txn.create','life','Create a Life/A&S application transaction'),
 ('life.policy.write','life','Create or amend a life policy'),
 ('mortgage.txn.create','mortgage','Create a mortgage referral transaction'),
 ('account.read',NULL,'Read household and client records'),
 ('account.write',NULL,'Create or amend household and client records'),
 ('compliance.review',NULL,'Principal-broker review and sign-off')
ON CONFLICT DO NOTHING;

INSERT INTO app_role (code, name, description) VALUES
 ('admin_principal','Admin / Principal broker','Full access incl. compliance sign-off'),
 ('pc_sales','P&C sales','Quotes and new P&C business'),
 ('pc_service','P&C service','Services the existing P&C book'),
 ('life_only','Life only','Life/A&S business only — no P&C authority'),
 ('llqp_no_life','LLQP (no life sales)','Support role; no life or P&C transaction authority'),
 ('mortgage','Mortgage','Mortgage referrals only')
ON CONFLICT DO NOTHING;

INSERT INTO role_capability (role_code, capability_code) VALUES
 -- principal: everything
 ('admin_principal','pc.txn.create'),('admin_principal','pc.policy.write'),
 ('admin_principal','pc.quote.create'),('admin_principal','life.txn.create'),
 ('admin_principal','life.policy.write'),('admin_principal','mortgage.txn.create'),
 ('admin_principal','account.read'),('admin_principal','account.write'),
 ('admin_principal','compliance.review'),
 -- P&C sales
 ('pc_sales','pc.txn.create'),('pc_sales','pc.quote.create'),
 ('pc_sales','pc.policy.write'),('pc_sales','account.read'),('pc_sales','account.write'),
 -- P&C service
 ('pc_service','pc.txn.create'),('pc_service','pc.policy.write'),
 ('pc_service','account.read'),('pc_service','account.write'),
 -- Life only — deliberately NO pc.* capability. This is the invariant.
 ('life_only','life.txn.create'),('life_only','life.policy.write'),
 ('life_only','account.read'),('life_only','account.write'),
 -- LLQP support — reads only
 ('llqp_no_life','account.read'),
 -- Mortgage
 ('mortgage','mortgage.txn.create'),('mortgage','account.read')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Which module a transaction belongs to. Derived from the policy line when
-- there is one; P&C is the default for the P&C leg.
-- ----------------------------------------------------------------------------
ALTER TABLE txn ADD COLUMN IF NOT EXISTS module text NOT NULL DEFAULT 'pc'
    CHECK (module IN ('pc','life','mortgage'));

CREATE OR REPLACE FUNCTION txn_set_module() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_line text;
BEGIN
    IF NEW.policy_id IS NOT NULL THEN
        SELECT line INTO v_line FROM policy WHERE id = NEW.policy_id;
        IF v_line = 'life' THEN
            NEW.module := 'life';
        ELSE
            NEW.module := coalesce(NEW.module, 'pc');
        END IF;
    END IF;
    RETURN NEW;
END $$;

-- ----------------------------------------------------------------------------
-- The live capability set for the acting staff member. A capability counts
-- only when its grant is unrevoked AND any licence anchoring that grant is
-- active and unexpired. Expiry is therefore self-enforcing.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION actor_capabilities() RETURNS TABLE (code text)
LANGUAGE sql STABLE AS $$
    SELECT rc.capability_code
      FROM staff_role_grant g
      JOIN role_capability rc ON rc.role_code = g.role_code
      LEFT JOIN licence l ON l.id = g.licence_id
     WHERE g.staff_id::text = current_actor()
       AND g.revoked_at IS NULL
       AND (
             g.licence_id IS NULL
             OR (l.status = 'active' AND (l.expires_on IS NULL OR l.expires_on >= current_date))
           )
$$;

CREATE OR REPLACE FUNCTION actor_has_capability(p_code text) RETURNS boolean
LANGUAGE sql STABLE AS $$
    SELECT current_actor() = 'system'
        OR EXISTS (SELECT 1 FROM actor_capabilities() WHERE code = p_code)
$$;

CREATE OR REPLACE FUNCTION tenant_has_module(p_module text) RETURNS boolean
LANGUAGE sql STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM tenant_module
         WHERE tenant_id = current_tenant() AND module = p_module AND active
    )
$$;

-- ----------------------------------------------------------------------------
-- The guard. Entitlement (commercial) then licence-derived grant (security).
-- `system` bypasses so seeding and provisioning still work.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION txn_guard_authority() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF current_actor() = 'system' THEN
        RETURN NEW;
    END IF;
    IF NOT tenant_has_module(NEW.module) THEN
        RAISE EXCEPTION 'entitlement denied: tenant is not subscribed to the % module', NEW.module
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NOT actor_has_capability(NEW.module || '.txn.create') THEN
        RAISE EXCEPTION 'licence denied: actor lacks capability %.txn.create', NEW.module
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
END $$;

-- Trigger NAMES carry the ordering: Postgres fires BEFORE triggers in
-- alphabetical order, and the module must be derived before authority is
-- checked against it. The a_/b_ prefixes are load-bearing — do not rename.
CREATE TRIGGER trg_txn_a_set_module BEFORE INSERT ON txn
    FOR EACH ROW EXECUTE FUNCTION txn_set_module();
CREATE TRIGGER trg_txn_b_authority BEFORE INSERT ON txn
    FOR EACH ROW EXECUTE FUNCTION txn_guard_authority();

CREATE TRIGGER trg_touch BEFORE UPDATE ON tenant_module     FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON licence           FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON staff_role_grant  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

SELECT enable_tenant_table('tenant_module');
SELECT enable_tenant_table('licence');
SELECT enable_tenant_table('staff_role_grant');
-- capability / app_role / role_capability are shared reference data, not
-- tenant-scoped: every tenant reads the same vocabulary.
