-- ============================================================================
-- 0011_capability_licence_scope.sql
-- Not every capability is a licensed activity.
--
-- 0009 anchored a whole GRANT to a licence: when the licence lapsed, every
-- capability it carried stopped — including `team.manage`. For a solo
-- brokerage that strands the tenant: the principal's licence expires, and now
-- nobody can record the renewal, because recording it needs the capability the
-- expiry just removed.
--
-- The fix is to be precise about what a licence actually authorizes. RIBO
-- licensing governs *transacting insurance*, not administering your own
-- brokerage's records. So capabilities are now split:
--
--   requires_licence = true   pc.txn.create, life.txn.create, policy writes …
--                             — dead the moment the licence lapses.
--   requires_licence = false  team.manage, account.read/write, compliance.review
--                             — carried by the grant itself.
--
-- The security property that matters is unchanged and still test-asserted: an
-- expired licence cannot transact. What changes is that the principal can
-- still record the renewal — and every such write remains on the append-only
-- audit trail, which is the real control over an administrative action.
-- ============================================================================

ALTER TABLE capability
    ADD COLUMN IF NOT EXISTS requires_licence boolean NOT NULL DEFAULT false;

-- Licensed activities: transacting and amending policy records.
UPDATE capability SET requires_licence = true
 WHERE code IN (
   'pc.txn.create','pc.policy.write','pc.quote.create',
   'life.txn.create','life.policy.write',
   'mortgage.txn.create'
 );

-- Administrative / record-keeping capabilities stay with the grant.
UPDATE capability SET requires_licence = false
 WHERE code IN ('team.manage','account.read','account.write','compliance.review');

-- ----------------------------------------------------------------------------
-- Resolve capabilities with that distinction. A grant with no licence anchor
-- carries only its unlicensed capabilities; a grant anchored to a LIVE licence
-- carries everything; a grant whose licence has lapsed carries only the
-- unlicensed ones.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION actor_capabilities() RETURNS TABLE (code text)
LANGUAGE sql STABLE AS $$
    SELECT DISTINCT c.code
      FROM staff_role_grant g
      JOIN role_capability rc ON rc.role_code = g.role_code
      JOIN capability c ON c.code = rc.capability_code
      LEFT JOIN licence l ON l.id = g.licence_id
     WHERE g.staff_id::text = current_actor()
       AND g.revoked_at IS NULL
       AND (
             NOT c.requires_licence
             OR (
                  g.licence_id IS NOT NULL
                  AND l.status = 'active'
                  AND (l.expires_on IS NULL OR l.expires_on >= current_date)
                )
           )
$$;

-- ============================================================================
-- Having *a* licence is not the same as having the RIGHT licence.
--
-- Without this, a principal could anchor a P&C sales grant to someone's LLQP
-- licence and hand them P&C authority — bypassing invariant 3 through the
-- admin path rather than around it. Each licensed role therefore declares the
-- licence classes that can carry it, and the grant guard enforces the match.
-- ============================================================================
CREATE TABLE role_licence_class (
    role_code       text NOT NULL REFERENCES app_role(code) ON DELETE CASCADE,
    licence_class   text NOT NULL,
    PRIMARY KEY (role_code, licence_class)
);

INSERT INTO role_licence_class (role_code, licence_class) VALUES
 -- P&C authority requires a RIBO licence, any level.
 ('pc_sales','ribo_l1'),('pc_sales','ribo_l2'),('pc_sales','ribo_l3'),
 ('pc_service','ribo_l1'),('pc_service','ribo_l2'),('pc_service','ribo_l3'),
 -- The principal broker must hold Level 2 or 3.
 ('admin_principal','ribo_l2'),('admin_principal','ribo_l3'),
 -- Life authority requires LLQP.
 ('life_only','llqp'),
 -- Mortgage authority requires an FSRA mortgage agent licence.
 ('mortgage','mortgage_agent')
 -- llqp_no_life is a support role: no licensed capabilities, so no class.
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION guard_grant_licence_class() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_required int;
    v_class    text;
BEGIN
    SELECT count(*) INTO v_required
      FROM role_licence_class WHERE role_code = NEW.role_code;
    IF v_required = 0 THEN
        RETURN NEW;                       -- unlicensed role, nothing to check
    END IF;
    IF NEW.licence_id IS NULL THEN
        RAISE EXCEPTION
            'licence required: role % must be anchored to a licence', NEW.role_code
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    SELECT licence_class INTO v_class FROM licence WHERE id = NEW.licence_id;
    IF NOT EXISTS (
        SELECT 1 FROM role_licence_class
         WHERE role_code = NEW.role_code AND licence_class = v_class
    ) THEN
        RAISE EXCEPTION
            'wrong licence class: % cannot carry the % role', v_class, NEW.role_code
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
END $$;

-- Fires after the team.manage guard (g < l alphabetically on the same table:
-- trg_grant_authority then trg_grant_licence_class).
CREATE TRIGGER trg_grant_licence_class
    BEFORE INSERT OR UPDATE ON staff_role_grant
    FOR EACH ROW EXECUTE FUNCTION guard_grant_licence_class();
