-- ============================================================================
-- 0016_module_entitlement.sql
--
-- Entitlement stops being a check on one INSERT and becomes a property of the
-- rows themselves (invariant 4).
--
-- Before this, `tenant_has_module()` was called in exactly one place: the txn
-- authority trigger. Everything else — writing a policy, issuing a document,
-- reading either — was gated by licence and by tenant, but never by what the
-- tenant had actually bought. A tenant with only the Mortgage module could read
-- and amend a P&C book, which is the commercial boundary the module split
-- exists to draw.
--
-- ---------------------------------------------------------------------------
-- READ and WRITE are gated on DIFFERENT predicates, and the difference is the
-- important part of this migration.
--
--   read   the tenant_module row EXISTS, whatever its `active` flag says
--   write  the row exists AND active
--
-- Gating reads on `active` was the obvious design and it is wrong. A brokerage
-- that cancels its P&C subscription still has a six-year RIBO retention
-- obligation on every record it wrote, and must be able to produce them on a
-- spot check. Hiding those rows at the database the moment a card declines is a
-- compliance failure pointing the other way — and a silent one, because the
-- compliance exception report would simply return zero.
--
-- Split this way, the commercial boundary still holds where it matters: a
-- tenant that never bought P&C has no row at all, so it reads nothing and
-- writes nothing. A tenant that cancelled keeps its history and cannot write
-- new business. That is what a subscription lapse should mean.
-- ---------------------------------------------------------------------------

-- The entitled set, resolved ONCE per statement rather than once per row.
--
-- A STABLE function taking no arguments is folded to a constant by the planner;
-- `tenant_has_module(some_column)` would be re-evaluated for every row, and at
-- 100k policies that is a subquery per row inside a policy qual — on every
-- query in the platform.
CREATE OR REPLACE FUNCTION entitled_modules() RETURNS text[]
LANGUAGE sql STABLE AS $$
    SELECT coalesce(array_agg(module), ARRAY[]::text[])
      FROM tenant_module
     WHERE tenant_id = current_tenant()
$$;

CREATE OR REPLACE FUNCTION active_modules() RETURNS text[]
LANGUAGE sql STABLE AS $$
    SELECT coalesce(array_agg(module), ARRAY[]::text[])
      FROM tenant_module
     WHERE tenant_id = current_tenant() AND active
$$;

-- Which module a policy line belongs to. Every P&C line collapses to 'pc';
-- 'life' is its own module. Marketing has no policy lines — it is a CRM module,
-- so it never appears here.
CREATE OR REPLACE FUNCTION line_module(p_line text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE WHEN p_line = 'life' THEN 'life' ELSE 'pc' END
$$;

-- ----------------------------------------------------------------------------
-- The two tables that carry a module discriminator of their own.
--
-- Replacing tenant_isolation rather than adding a second policy: multiple
-- PERMISSIVE policies are OR-ed, so a second policy would WIDEN access rather
-- than narrow it. Getting that backwards is the classic RLS mistake and it
-- fails open.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_isolation ON txn;
CREATE POLICY tenant_isolation ON txn
    USING      (tenant_id = current_tenant() AND module = ANY (entitled_modules()))
    WITH CHECK (tenant_id = current_tenant() AND module = ANY (active_modules()));

DROP POLICY IF EXISTS tenant_isolation ON policy;
CREATE POLICY tenant_isolation ON policy
    USING      (tenant_id = current_tenant() AND line_module(line) = ANY (entitled_modules()))
    WITH CHECK (tenant_id = current_tenant() AND line_module(line) = ANY (active_modules()));

-- ----------------------------------------------------------------------------
-- Everything that hangs off them.
--
-- The child policy is written as EXISTS against the parent, which is itself
-- RLS-filtered — so the module gate is inherited rather than restated, and a
-- change to the rule above propagates without editing thirteen policies. The
-- lookup is on the parent's primary key, so the cost is an index probe.
--
-- Without this a direct `SELECT * FROM coverage` would return the coverages of
-- a policy the caller cannot see, which is the whole gate undone by one query
-- that skips the join.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enable_module_gate(
    p_table text, p_fk text, p_parent text
) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', p_table);
    EXECUTE format($f$
        CREATE POLICY tenant_isolation ON %I
        USING (
            tenant_id = current_tenant()
            AND (%I IS NULL OR EXISTS (SELECT 1 FROM %I p WHERE p.id = %I))
        )
        WITH CHECK (
            tenant_id = current_tenant()
            AND (%I IS NULL OR EXISTS (SELECT 1 FROM %I p WHERE p.id = %I))
        )
    $f$, p_table, p_fk, p_parent, p_fk, p_fk, p_parent, p_fk);
END $$;

SELECT enable_module_gate('coverage',              'policy_id', 'policy');
SELECT enable_module_gate('vehicle',               'policy_id', 'policy');
SELECT enable_module_gate('dwelling',              'policy_id', 'policy');
SELECT enable_module_gate('policy_endorsement',    'policy_id', 'policy');
SELECT enable_module_gate('ontario_auto_election', 'policy_id', 'policy');
SELECT enable_module_gate('loss_history',          'policy_id', 'policy');
SELECT enable_module_gate('commission_entry',      'policy_id', 'policy');
SELECT enable_module_gate('claim',                 'policy_id', 'policy');
SELECT enable_module_gate('txn_event',             'txn_id',    'txn');
SELECT enable_module_gate('carrier_submission',    'txn_id',    'txn');
SELECT enable_module_gate('quote_log',             'txn_id',    'txn');
SELECT enable_module_gate('disclosure_record',     'txn_id',    'txn');
SELECT enable_module_gate('document',              'policy_id', 'policy');
SELECT enable_module_gate('signature',             'document_id','document');

-- ----------------------------------------------------------------------------
-- Making rows invisible broke the thing that decides which module a txn is in.
--
-- txn_set_module() derives NEW.module by reading the referenced policy's line.
-- Once an unentitled policy became invisible, that SELECT found nothing, and
-- the old `coalesce(NEW.module,'pc')` fallback quietly filed a Life transaction
-- as P&C — a module the tenant DOES have. The gate did not deny the write, it
-- downgraded it, and the API returned 201.
--
-- Caught by the API suite, which asserts a 403 and got a created transaction.
-- It is the general hazard of enforcing by invisibility: code that reads a row
-- to make a decision does not get an error, it gets NULL, and NULL flows into
-- whatever default was written for a different reason.
--
-- A policy_id the caller cannot see is either another tenant's or a module they
-- have not bought. Both are denials. There is no third case where defaulting is
-- the right answer.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION txn_set_module() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_line text;
BEGIN
    IF NEW.policy_id IS NOT NULL THEN
        SELECT line INTO v_line FROM policy WHERE id = NEW.policy_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION
                'entitlement denied: the referenced policy is not visible to this tenant — '
                'it belongs to another tenant, or to a module this tenant has not subscribed to'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        NEW.module := line_module(v_line);
    END IF;
    RETURN NEW;
END $$;

-- ----------------------------------------------------------------------------
-- Assertion: the module-scoped tables are gated, and the gate names both the
-- read and the write predicate.
--
-- A policy that gates USING but not WITH CHECK reads correctly and writes
-- freely, which is the failure mode where the boundary looks enforced in every
-- test that only reads.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_module_gated() RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    gated text[] := ARRAY['txn','policy','coverage','vehicle','dwelling',
                          'policy_endorsement','ontario_auto_election','loss_history',
                          'commission_entry','claim','txn_event','carrier_submission',
                          'quote_log','disclosure_record','document','signature'];
    t     text;
    qual  text;
    chk   text;
BEGIN
    FOREACH t IN ARRAY gated LOOP
        SELECT pg_get_expr(p.polqual, p.polrelid), pg_get_expr(p.polwithcheck, p.polrelid)
          INTO qual, chk
          FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
         WHERE c.relname = t AND p.polname = 'tenant_isolation';

        IF qual IS NULL THEN
            RAISE EXCEPTION 'table % has no tenant_isolation policy', t;
        END IF;
        IF chk IS NULL THEN
            RAISE EXCEPTION
                'table % gates reads but not writes — a policy with USING and no WITH CHECK '
                'reads correctly and writes freely, and every read-only test still passes', t;
        END IF;
        IF qual NOT LIKE '%entitled_modules%' AND qual NOT LIKE '%EXISTS%' THEN
            RAISE EXCEPTION 'table % is tenant-scoped but not module-scoped: %', t, qual;
        END IF;
        IF chk NOT LIKE '%active_modules%' AND chk NOT LIKE '%EXISTS%' THEN
            RAISE EXCEPTION 'table % accepts writes for a module the tenant has not bought: %', t, chk;
        END IF;
    END LOOP;
END $$;
