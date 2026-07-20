-- 0007 — row level security
--
-- Invariant #2: MULTI-TENANCY FROM ROW ONE; VENDOR-BLIND.
--
-- Applied via a loop over an explicit table list rather than 15 hand-written
-- blocks. The list is auditable at a glance, and every table provably gets the
-- identical policy — hand-repetition is exactly how one table ends up with a
-- USING clause and no WITH CHECK, which silently permits cross-tenant writes.

BEGIN;

-- Nothing is world-readable by default.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;

/* Reference data: no tenant column, identical for everyone, read-only to the
   app. Deliberately NOT under RLS — there is nothing tenant-specific to leak,
   and the write path is migrations only. */
GRANT SELECT ON modules, licence_classes, policy_lines,
                transaction_types, transaction_transitions
  TO insurimple_app;

/* The tenant row itself. Scoped by primary key rather than a tenant_id column,
   so a tenant can read only its own record. */
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE  ROW LEVEL SECURITY;

CREATE POLICY tenants_self_only ON tenants
  FOR ALL TO insurimple_app
  USING (id = app.current_tenant_id())
  WITH CHECK (id = app.current_tenant_id());

GRANT SELECT ON tenants TO insurimple_app;

/* Every tenant-scoped table gets the same treatment. */
DO $$
DECLARE
  t text;
  tenant_scoped text[] := ARRAY[
    'tenant_modules',
    'users',
    'licences',
    'households',
    'addresses',
    'parties',
    'carriers',
    'policies',
    'drivers',
    'vehicles',
    'locations',
    'additional_interests',
    'transactions',
    'transaction_events'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_scoped LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    -- FORCE so the policy binds even for the table owner. Without it, anything
    -- connecting as the owner silently sees every tenant.
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);

    -- USING filters reads; WITH CHECK constrains writes. Both required: USING
    -- alone would let a tenant INSERT a row stamped with someone else's id.
    EXECUTE format($f$
      CREATE POLICY %1$I_tenant_isolation ON %1$I
        FOR ALL TO insurimple_app
        USING (tenant_id = app.current_tenant_id())
        WITH CHECK (tenant_id = app.current_tenant_id())
    $f$, t);

    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO insurimple_app', t);
  END LOOP;
END
$$;

/* The audit log is append-only. Revoking UPDATE/DELETE means a compliance
   trail cannot be rewritten even by a fully authorised session — which is the
   entire point of keeping one. */
REVOKE UPDATE, DELETE ON transaction_events FROM insurimple_app;

/* Entitlement is set by billing, not by the tenant it constrains. Read-only,
   or a brokerage could grant itself a module it does not pay for. */
REVOKE INSERT, UPDATE, DELETE ON tenant_modules FROM insurimple_app;

/* Likewise licences: the regulatory boundary (#3) must not be self-editable by
   the account it governs. Provisioning runs as the owner role. */
REVOKE INSERT, UPDATE, DELETE ON licences FROM insurimple_app;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO insurimple_app;

COMMIT;
