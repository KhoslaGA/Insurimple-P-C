-- 0001 — roles, schema, and tenant context
--
-- Two roles, deliberately. Migrations run as the owner; the application connects
-- as a NON-OWNER role. This matters: a table owner bypasses RLS unless the table
-- is FORCE'd, and relying on FORCE alone means one forgotten ALTER silently
-- disables tenant isolation. A non-owner app role fails closed instead.
--
-- Target: PostgreSQL 16. Written to also run on 14 so it can be exercised
-- locally (RLS semantics are identical across those versions).

BEGIN;

CREATE SCHEMA IF NOT EXISTS app;

-- Case-insensitive text for email, so two parties cannot differ only by case.
CREATE EXTENSION IF NOT EXISTS citext;

-- The application role. NOLOGIN here; the deploy environment attaches a password.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'insurimple_app') THEN
    CREATE ROLE insurimple_app NOLOGIN;
  END IF;
END
$$;

/* ---------------------------------------------------------------------------
   Tenant context.

   Set per transaction with:
       SELECT set_config('app.current_tenant', $1, true)
   inside BEGIN/COMMIT. The `true` makes it transaction-local — a plain SET
   would persist on a pooled connection and leak one tenant's context into the
   next checkout, which is the classic multi-tenant data breach.

   Returns NULL when unset, so every RLS predicate (`tenant_id = NULL`) yields
   NULL and therefore no rows. Absence of context denies access; it never
   grants it.
   --------------------------------------------------------------------------- */
CREATE OR REPLACE FUNCTION app.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('app.current_tenant', true), '')::uuid
$$;

COMMENT ON FUNCTION app.current_tenant_id() IS
  'Tenant from transaction-local GUC app.current_tenant. NULL when unset, which denies all rows.';

/* The acting user, same mechanism. Used by licence/entitlement guards so they
   cannot be satisfied by a request parameter. */
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('app.current_user', true), '')::uuid
$$;

GRANT USAGE ON SCHEMA app TO insurimple_app;
GRANT USAGE ON SCHEMA public TO insurimple_app;

COMMIT;
