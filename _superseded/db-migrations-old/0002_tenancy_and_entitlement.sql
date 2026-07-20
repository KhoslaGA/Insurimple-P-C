-- 0002 — tenants and module entitlement
--
-- Invariant #4: entitlement is the commercial boundary. `tenant_modules` gates
-- every module-scoped capability SERVER-SIDE. Hiding a nav item is not
-- enforcement, so the check lives here as a function the write guards call.

BEGIN;

CREATE TABLE tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  status      text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'suspended', 'closed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE tenants IS
  'One row per brokerage. Not itself tenant-scoped — it is the tenant. The anchor tenant (KLC) gets no privileged path here (invariant #8).';

-- The three subscription modules. Reference data, identical for all tenants.
CREATE TABLE modules (
  code  text PRIMARY KEY CHECK (code IN ('pc', 'life', 'mortgage')),
  name  text NOT NULL
);

INSERT INTO modules (code, name) VALUES
  ('pc',       'Property & casualty'),
  ('life',     'Life / LLQP'),
  ('mortgage', 'Mortgage')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE tenant_modules (
  tenant_id    uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  module_code  text NOT NULL REFERENCES modules (code),
  active       boolean NOT NULL DEFAULT true,
  starts_on    date NOT NULL DEFAULT current_date,
  ends_on      date,
  PRIMARY KEY (tenant_id, module_code),
  CONSTRAINT tenant_modules_period_valid CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

COMMENT ON TABLE tenant_modules IS
  'Invariant #4. A module-scoped write must pass app.tenant_has_module() regardless of what the UI allows.';

/* Entitlement check. STABLE and driven off the tenant GUC — never a parameter
   the caller supplies, so a crafted request cannot claim another tenant. */
CREATE OR REPLACE FUNCTION app.tenant_has_module(p_module text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tenant_modules tm
    WHERE tm.tenant_id = app.current_tenant_id()
      AND tm.module_code = p_module
      AND tm.active
      AND tm.starts_on <= current_date
      AND (tm.ends_on IS NULL OR tm.ends_on >= current_date)
  )
$$;

COMMENT ON FUNCTION app.tenant_has_module(text) IS
  'Invariant #4: server-side commercial gate. False when the tenant context is unset.';

COMMIT;
