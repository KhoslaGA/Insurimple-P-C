-- ============================================================================
-- 0010_team_admin.sql
-- Managing the security boundary is itself inside the security boundary.
--
-- 0009 made licence-derived grants the authority for transacting. This adds
-- `team.manage`: the capability to record a licence or grant/revoke a role.
-- Without it, a CSR could grant themselves principal-broker authority and the
-- whole boundary would be decorative — so the same DB-level guard pattern
-- applies to licence and staff_role_grant writes.
-- ============================================================================

INSERT INTO capability (code, module, description) VALUES
 ('team.manage', NULL, 'Record licences and grant or revoke role assignments')
ON CONFLICT DO NOTHING;

-- Only the principal / admin holds it. Deliberately NOT granted to pc_sales,
-- pc_service, life_only, llqp_no_life or mortgage.
INSERT INTO role_capability (role_code, capability_code) VALUES
 ('admin_principal','team.manage')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- The guard. Applies to INSERT, UPDATE and DELETE on both tables — revoking a
-- grant or extending an expiry is as privileged as creating one. `system`
-- bypasses so migrations, seeding and tenant provisioning still work.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_team_manage() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF current_actor() <> 'system' AND NOT actor_has_capability('team.manage') THEN
        RAISE EXCEPTION
            'authority denied: % on % requires the team.manage capability',
            TG_OP, TG_TABLE_NAME
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_licence_authority
    BEFORE INSERT OR UPDATE OR DELETE ON licence
    FOR EACH ROW EXECUTE FUNCTION guard_team_manage();

CREATE TRIGGER trg_grant_authority
    BEFORE INSERT OR UPDATE OR DELETE ON staff_role_grant
    FOR EACH ROW EXECUTE FUNCTION guard_team_manage();
