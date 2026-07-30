-- ============================================================================
-- test.sql — functional proof of the schema.
-- Runs as one session. Uses the real Abtahi cancellation from the uploads.
-- ============================================================================
\set ON_ERROR_STOP on
SET client_min_messages = notice;

-- A non-superuser app role, so RLS actually applies (superuser bypasses RLS).
-- Idempotent: never DROP the role (it may already own grants from seeding).
DO $$ BEGIN
    CREATE ROLE app NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT USAGE ON SCHEMA public TO app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app;

-- Tenants are created by a privileged path (not tenant-scoped).
INSERT INTO tenant (id, legal_name, trade_name, ribo_licence)
VALUES ('11111111-1111-1111-1111-111111111111','Insurimple Brokerage Inc.','Insurimple','RIBO-XXXX');
INSERT INTO tenant (id, legal_name)
VALUES ('22222222-2222-2222-2222-222222222222','Other Brokerage Inc.');

-- Everything below runs as the app role, scoped to Insurimple.
SET ROLE app;
SELECT set_config('app.current_tenant','11111111-1111-1111-1111-111111111111', false);
-- The actor is the staff UUID: capabilities are resolved from that staff
-- member's licence-anchored grants (0009_licences_roles.sql).
SELECT set_config('app.current_actor','50000000-0000-0000-0000-000000000001', false);

-- ---- reference data -------------------------------------------------------
INSERT INTO branch (id, tenant_id, code, name, is_default)
VALUES ('b0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','SOU','Sound Insurance Services',true);

INSERT INTO staff (id, tenant_id, full_name, email, role, ribo_level)
VALUES ('50000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Gautam Khosla','gautam@insurimple.ca','principal_broker','L1');

INSERT INTO carrier (id, tenant_id, name, csio_code)
VALUES ('c0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Pembridge','PEMB');

-- ---- entitlement + licence + grant (invariants 3 & 4) ----------------------
-- The tenant subscribes to P&C; Gautam holds a live RIBO licence, and his
-- principal-broker grant is anchored to it.
--
-- Tenant provisioning runs as `system`: the first principal cannot grant
-- themselves authority (0010_team_admin.sql gates licence and grant writes on
-- team.manage), so bootstrap is a privileged path by construction.
SELECT set_config('app.current_actor','system', false);

INSERT INTO tenant_module (id, tenant_id, module)
VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111','pc');

INSERT INTO licence (id, tenant_id, staff_id, licence_class, licence_number, regulator, expires_on)
VALUES ('11c00000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
        '50000000-0000-0000-0000-000000000001','ribo_l2','RIBO-100200','RIBO', current_date + 365);

INSERT INTO staff_role_grant (id, tenant_id, staff_id, role_code, licence_id)
VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111','50000000-0000-0000-0000-000000000001',
        'admin_principal','11c00000-0000-0000-0000-000000000001');

-- A Life-only colleague: LLQP licence, life_only role — no P&C authority.
INSERT INTO staff (id, tenant_id, full_name, email, role, ribo_level)
VALUES ('50000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',
        'Priya Life-Only','priya@insurimple.ca','broker','unlicensed');

INSERT INTO licence (id, tenant_id, staff_id, licence_class, licence_number, regulator, expires_on)
VALUES ('11c00000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',
        '50000000-0000-0000-0000-000000000002','llqp','LLQP-55501','FSRA', current_date + 365);

INSERT INTO staff_role_grant (id, tenant_id, staff_id, role_code, licence_id)
VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111','50000000-0000-0000-0000-000000000002',
        'life_only','11c00000-0000-0000-0000-000000000002');

-- Provisioning done — back to acting as the principal broker.
SELECT set_config('app.current_actor','50000000-0000-0000-0000-000000000001', false);

-- ---- account + party + consent (Abtahi) -----------------------------------
INSERT INTO account (id, tenant_id, branch_id, lookup_code, display_name, kind, status, source)
VALUES ('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
        'b0000000-0000-0000-0000-000000000001','ABTAHISE01','Seyed Moein Abtahi','personal','cancelling','toprates.ca');

INSERT INTO party (id, tenant_id, party_type, first_name, last_name, email, phone, address)
VALUES ('40000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','person',
        'Seyed Moein','Abtahi','abtmoien@gmail.com','(647) 553-7656',
        '{"line1":"Ph01-23 Oneida Cres","city":"Richmond Hill","prov":"ON","postal":"L4B 0A2"}');

INSERT INTO account_party (id, tenant_id, account_id, party_id, role, is_primary)
VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000001',
        '40000000-0000-0000-0000-000000000001','named_insured',true);

-- CASL: "Did Not Obtain" from the Epic screen, captured properly per channel
INSERT INTO consent (id, tenant_id, party_id, channel, basis)
VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000001','phone','did_not_obtain');

-- ---- policy ----------------------------------------------------------------
INSERT INTO policy (id, tenant_id, account_id, carrier_id, policy_number, line, status, effective_date, annual_premium)
VALUES ('90000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
        'a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',
        '240517202','auto','in_force','2025-06-24',2140.00);

-- ============================================================================
-- TEST 1 — Cancellation transaction walks the full lifecycle.
-- ============================================================================
INSERT INTO txn (id, tenant_id, reference, txn_type, account_id, policy_id, carrier_id, state, reason, effective_date, owner_id)
VALUES ('70000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','TXN-3041',
        'cancellation','a0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001','draft','Client request (e-signed)','2026-06-24',
        '50000000-0000-0000-0000-000000000001');

-- generate the LPV document off the txn
INSERT INTO document (id, tenant_id, account_id, policy_id, txn_id, doc_type, filename, source)
VALUES ('d0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
        'a0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001',
        '70000000-0000-0000-0000-000000000001','lpv','ABTAHISE01-LPV.pdf','generated');

-- walk the state machine through the legal path
UPDATE txn SET state='doc_generated' WHERE id='70000000-0000-0000-0000-000000000001';
UPDATE txn SET state='sig_pending'   WHERE id='70000000-0000-0000-0000-000000000001';

-- capture signature
INSERT INTO signature (id, tenant_id, document_id, signer_party_id, method, signed_at, signer_ip, verified)
VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000001',
        '40000000-0000-0000-0000-000000000001','esign','2026-06-05 10:56:33-04','99.245.0.0',true);

UPDATE txn SET state='signed' WHERE id='70000000-0000-0000-0000-000000000001';

-- submit to carrier via Secure Delivery portal (the out-of-band step)
INSERT INTO carrier_submission (id, tenant_id, txn_id, carrier_id, document_id, channel, status, submitted_at, payload)
VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111','70000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001',
        'secure_delivery','sent','now()','{"to":"Underwriting","subject":"Cancel Policy"}');

UPDATE txn SET state='submitted'  WHERE id='70000000-0000-0000-0000-000000000001';
UPDATE txn SET state='carrier_ack' WHERE id='70000000-0000-0000-0000-000000000001';
UPDATE txn SET state='completed'  WHERE id='70000000-0000-0000-0000-000000000001';

-- assert: txn completed and closed_at auto-set; full event chain recorded
DO $$
DECLARE n int; st text; closed timestamptz;
BEGIN
    SELECT state, closed_at INTO st, closed FROM txn WHERE id='70000000-0000-0000-0000-000000000001';
    IF st <> 'completed' OR closed IS NULL THEN RAISE EXCEPTION 'TEST1 FAIL: end state %', st; END IF;
    SELECT count(*) INTO n FROM txn_event WHERE txn_id='70000000-0000-0000-0000-000000000001';
    IF n <> 6 THEN RAISE EXCEPTION 'TEST1 FAIL: expected 6 transition events, got %', n; END IF;
    RAISE NOTICE 'TEST1 PASS: cancellation completed with % lifecycle events', n;
END $$;

-- ============================================================================
-- TEST 2 — illegal state jump is rejected by the guard.
-- ============================================================================
INSERT INTO txn (id, tenant_id, txn_type, account_id, state)
VALUES ('70000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',
        'endorsement','a0000000-0000-0000-0000-000000000001','draft');
DO $$
BEGIN
    UPDATE txn SET state='completed' WHERE id='70000000-0000-0000-0000-000000000002'; -- draft->completed illegal
    RAISE EXCEPTION 'TEST2 FAIL: illegal transition was allowed';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE '%illegal txn transition%' THEN
        RAISE NOTICE 'TEST2 PASS: illegal transition blocked (%).', SQLERRM;
    ELSE RAISE; END IF;
END $$;

-- ============================================================================
-- TEST 3 — trust ledger: balanced entry posts, unbalanced is rejected,
--          posted entry is immutable.
-- ============================================================================
INSERT INTO ledger_account (id, tenant_id, book, code, name, type) VALUES
 ('1a000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','trust','1000','Trust Bank','asset'),
 ('1a000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','trust','2000','Premiums Payable','liability');

-- balanced receipt: DR bank 2760 / CR payable 2760
INSERT INTO journal_entry (id, tenant_id, book, reference, description)
VALUES ('1e000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','trust','RCP-2211','Premium receipt');
INSERT INTO journal_line (id, tenant_id, entry_id, account_id, debit, credit) VALUES
 (uuidv7(), '11111111-1111-1111-1111-111111111111','1e000000-0000-0000-0000-000000000001','1a000000-0000-0000-0000-000000000001',2760.00,0),
 (uuidv7(), '11111111-1111-1111-1111-111111111111','1e000000-0000-0000-0000-000000000001','1a000000-0000-0000-0000-000000000002',0,2760.00);
UPDATE journal_entry SET posted=true WHERE id='1e000000-0000-0000-0000-000000000001';
DO $$ BEGIN RAISE NOTICE 'TEST3a PASS: balanced trust entry posted'; END $$;

-- unbalanced entry must be rejected on post
INSERT INTO journal_entry (id, tenant_id, book, reference)
VALUES ('1e000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','trust','BAD-1');
INSERT INTO journal_line (id, tenant_id, entry_id, account_id, debit, credit) VALUES
 (uuidv7(), '11111111-1111-1111-1111-111111111111','1e000000-0000-0000-0000-000000000002','1a000000-0000-0000-0000-000000000001',100,0),
 (uuidv7(), '11111111-1111-1111-1111-111111111111','1e000000-0000-0000-0000-000000000002','1a000000-0000-0000-0000-000000000002',0,90);
DO $$
BEGIN
    UPDATE journal_entry SET posted=true WHERE id='1e000000-0000-0000-0000-000000000002';
    RAISE EXCEPTION 'TEST3b FAIL: unbalanced entry posted';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE '%unbalanced%' THEN RAISE NOTICE 'TEST3b PASS: unbalanced entry rejected';
    ELSE RAISE; END IF;
END $$;

-- posted entry is immutable
DO $$
BEGIN
    UPDATE journal_entry SET description='tamper' WHERE id='1e000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'TEST3c FAIL: edited a posted entry';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE '%immutable%' THEN RAISE NOTICE 'TEST3c PASS: posted entry is immutable';
    ELSE RAISE; END IF;
END $$;

-- trust position view reflects the posted receipt
DO $$
DECLARE surplus numeric;
BEGIN
    SELECT trust_surplus INTO surplus FROM trust_position
     WHERE tenant_id='11111111-1111-1111-1111-111111111111';
    -- assets 2760 - liabilities 2760 = 0 surplus (client money fully offset)
    IF surplus IS DISTINCT FROM 0 THEN RAISE EXCEPTION 'TEST3d FAIL: surplus %', surplus; END IF;
    RAISE NOTICE 'TEST3d PASS: trust position balances (surplus 0)';
END $$;

-- ============================================================================
-- TEST 4 — RLS: the other tenant cannot see Insurimple's data.
-- ============================================================================
SELECT set_config('app.current_tenant','22222222-2222-2222-2222-222222222222', false);
DO $$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM account;             -- should see 0 (other tenant)
    IF n <> 0 THEN RAISE EXCEPTION 'TEST4 FAIL: cross-tenant leak, saw % accounts', n; END IF;
    RAISE NOTICE 'TEST4 PASS: RLS isolates tenants (other tenant sees 0 accounts)';
END $$;
-- and back to Insurimple sees its account
SELECT set_config('app.current_tenant','11111111-1111-1111-1111-111111111111', false);
DO $$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM account;
    IF n <> 1 THEN RAISE EXCEPTION 'TEST4b FAIL: expected 1 account, saw %', n; END IF;
    RAISE NOTICE 'TEST4b PASS: Insurimple sees its own 1 account';
END $$;

-- ============================================================================
-- TEST 5 — audit trail captured the mutations.
-- ============================================================================
RESET ROLE;  -- audit_event visible to superuser for the check
DO $$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM audit_event
     WHERE tenant_id='11111111-1111-1111-1111-111111111111'
       AND entity='txn' AND entity_id='70000000-0000-0000-0000-000000000001';
    IF n < 7 THEN RAISE EXCEPTION 'TEST5 FAIL: expected >=7 audit rows for txn, got %', n; END IF;
    RAISE NOTICE 'TEST5 PASS: % audit rows recorded for the cancellation txn', n;
END $$;

-- audit log itself is append-only
DO $$
BEGIN
    UPDATE audit_event SET actor='tamper' WHERE tenant_id='11111111-1111-1111-1111-111111111111';
    RAISE EXCEPTION 'TEST5b FAIL: audit log was editable';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE '%append-only%' THEN RAISE NOTICE 'TEST5b PASS: audit log is append-only';
    ELSE RAISE; END IF;
END $$;

-- ============================================================================
-- TEST 6 — LICENCE IS THE SECURITY BOUNDARY (invariant 3) and ENTITLEMENT IS
--          THE COMMERCIAL BOUNDARY (invariant 4). Enforced by the DB, so no
--          application bug can bypass either.
-- ============================================================================
SET ROLE app;
SELECT set_config('app.current_tenant','11111111-1111-1111-1111-111111111111', false);

-- 6a — a Life-only user CANNOT create a P&C transaction.
SELECT set_config('app.current_actor','50000000-0000-0000-0000-000000000002', false);
DO $$
BEGIN
    INSERT INTO txn (id, tenant_id, txn_type, account_id, policy_id, state)
    VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111','endorsement',
            'a0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001','draft');
    RAISE EXCEPTION 'TEST6a FAIL: a Life-only user created a P&C transaction';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'TEST6a PASS: Life-only user denied P&C txn (%)', SQLERRM;
END $$;

-- 6b — the licensed principal CAN.
SELECT set_config('app.current_actor','50000000-0000-0000-0000-000000000001', false);
INSERT INTO txn (id, tenant_id, txn_type, account_id, policy_id, state)
VALUES ('70000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','endorsement',
        'a0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001','draft');
DO $$ BEGIN RAISE NOTICE 'TEST6b PASS: licensed principal broker created the P&C txn'; END $$;

-- 6c — an EXPIRED licence removes the LICENSED capabilities it carried.
UPDATE licence SET expires_on = current_date - 1
 WHERE id = '11c00000-0000-0000-0000-000000000001';
DO $$
BEGIN
    INSERT INTO txn (id, tenant_id, txn_type, account_id, policy_id, state)
    VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111','endorsement',
            'a0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001','draft');
    RAISE EXCEPTION 'TEST6c FAIL: an expired licence still granted P&C authority';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'TEST6c PASS: expired licence revokes authority (%)', SQLERRM;
END $$;
-- 6e — but the lapsed principal is NOT stranded (0011): administering records
--      is not a licensed activity, so they can still record the renewal. This
--      is the same write that was refused before the capability/licence scope
--      split, and it is what stops a solo brokerage locking itself out.
DO $$
DECLARE ok boolean;
BEGIN
    SELECT actor_has_capability('team.manage') INTO ok;
    IF NOT ok THEN
        RAISE EXCEPTION 'TEST6e FAIL: a lapsed principal lost team.manage and is stranded';
    END IF;
    RAISE NOTICE 'TEST6e PASS: lapsed principal keeps team.manage (can record the renewal)';
END $$;

-- and they do exactly that — restoring transaction authority.
UPDATE licence SET expires_on = current_date + 365
 WHERE id = '11c00000-0000-0000-0000-000000000001';
DO $$
DECLARE ok boolean;
BEGIN
    SELECT actor_has_capability('pc.txn.create') INTO ok;
    IF NOT ok THEN
        RAISE EXCEPTION 'TEST6f FAIL: renewing the licence did not restore authority';
    END IF;
    RAISE NOTICE 'TEST6f PASS: renewed licence restores pc.txn.create';
END $$;

-- 6d — entitlement: the tenant has no Life module, so even the principal
--      (who holds life.txn.create) cannot open a Life transaction.
INSERT INTO policy (id, tenant_id, account_id, carrier_id, policy_number, line, status)
VALUES ('90000000-0000-0000-0000-0000000000ff',
        '11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001','LIFE-1','life','in_force');
DO $$
BEGIN
    INSERT INTO txn (id, tenant_id, txn_type, account_id, policy_id, state)
    VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111','new_business',
            'a0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-0000000000ff','draft');
    RAISE EXCEPTION 'TEST6d FAIL: a Life txn was created without the Life entitlement';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'TEST6d PASS: Life module not entitled — txn denied (%)', SQLERRM;
END $$;

-- ============================================================================
-- TEST 7 — managing the boundary is inside the boundary (0010_team_admin.sql).
--          Without this, a Life-only user could simply grant themselves the
--          P&C role and TEST6a would be decorative.
-- ============================================================================

-- 7a — a Life-only user CANNOT grant themselves a P&C-capable role.
SELECT set_config('app.current_actor','50000000-0000-0000-0000-000000000002', false);
DO $$
BEGIN
    INSERT INTO staff_role_grant (id, tenant_id, staff_id, role_code)
    VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111',
            '50000000-0000-0000-0000-000000000002','pc_sales');
    RAISE EXCEPTION 'TEST7a FAIL: a Life-only user granted themselves a P&C role';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'TEST7a PASS: privilege escalation blocked (%)', SQLERRM;
END $$;

-- 7b — nor can they extend their own licence, or record a new one.
DO $$
BEGIN
    INSERT INTO licence (id, tenant_id, staff_id, licence_class, licence_number, expires_on)
    VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111',
            '50000000-0000-0000-0000-000000000002','ribo_l2','SELF-ISSUED', current_date + 365);
    RAISE EXCEPTION 'TEST7b FAIL: a Life-only user issued themselves a RIBO licence';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'TEST7b PASS: self-issued licence blocked (%)', SQLERRM;
END $$;

-- 7c — a licensed role cannot be granted without a licence anchor (0011).
SELECT set_config('app.current_actor','50000000-0000-0000-0000-000000000001', false);
DO $$
BEGIN
    INSERT INTO staff_role_grant (id, tenant_id, staff_id, role_code)
    VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111',
            '50000000-0000-0000-0000-000000000002','pc_service');
    RAISE EXCEPTION 'TEST7c FAIL: a licensed role was granted with no licence';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'TEST7c PASS: licensed role requires a licence anchor (%)', SQLERRM;
END $$;

-- 7d — nor anchored to the WRONG class: Priya holds LLQP, which cannot carry
--      a P&C role. Without this the principal could hand out P&C authority on
--      a life licence, bypassing invariant 3 through the admin path.
DO $$
BEGIN
    INSERT INTO staff_role_grant (id, tenant_id, staff_id, role_code, licence_id)
    VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111',
            '50000000-0000-0000-0000-000000000002','pc_service',
            '11c00000-0000-0000-0000-000000000002');
    RAISE EXCEPTION 'TEST7d FAIL: an LLQP licence carried a P&C role';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'TEST7d PASS: wrong licence class rejected (%)', SQLERRM;
END $$;

-- 7e — with the RIGHT licence recorded, the grant works and confers authority.
INSERT INTO licence (id, tenant_id, staff_id, licence_class, licence_number, regulator, expires_on)
VALUES ('11c00000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111',
        '50000000-0000-0000-0000-000000000002','ribo_l1','RIBO-204411','RIBO', current_date + 365);
INSERT INTO staff_role_grant (id, tenant_id, staff_id, role_code, licence_id)
VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111',
        '50000000-0000-0000-0000-000000000002','pc_service',
        '11c00000-0000-0000-0000-000000000003');
DO $$
DECLARE ok boolean;
BEGIN
    PERFORM set_config('app.current_actor','50000000-0000-0000-0000-000000000002', false);
    SELECT actor_has_capability('pc.txn.create') INTO ok;
    IF NOT ok THEN
        RAISE EXCEPTION 'TEST7e FAIL: a correctly licensed grant did not confer pc.txn.create';
    END IF;
    RAISE NOTICE 'TEST7e PASS: RIBO-anchored grant confers pc.txn.create';
END $$;

-- ============================================================================
-- TEST 8 — role topology (DB.1). The isolation guarantee must not depend on
--          which role happens to connect.
-- ============================================================================
RESET ROLE;

-- 8a — every table carrying tenant_id has RLS both ENABLED and FORCED.
DO $$ BEGIN
    PERFORM assert_rls_complete();
    RAISE NOTICE 'TEST8a PASS: every tenant-scoped table has ENABLE + FORCE row level security';
END $$;

-- 8b — the app role is not a superuser and does not hold BYPASSRLS.
DO $$ BEGIN
    PERFORM assert_app_role_unprivileged();
    RAISE NOTICE 'TEST8b PASS: app role holds neither SUPERUSER nor BYPASSRLS';
END $$;

-- 8c — the backstop bites. Drop FORCE from one table and confirm the assertion
--      names that table specifically, then restore it. A check that cannot fail
--      is not a check.
DO $$
DECLARE msg text;
BEGIN
    ALTER TABLE consent NO FORCE ROW LEVEL SECURITY;
    BEGIN
        PERFORM assert_rls_complete();
        RAISE EXCEPTION 'TEST8c FAIL: the RLS backstop did not notice FORCE was removed';
    EXCEPTION WHEN others THEN
        msg := SQLERRM;
        IF msg NOT LIKE '%consent%' THEN
            RAISE EXCEPTION 'TEST8c FAIL: backstop fired but did not name consent (%)', msg;
        END IF;
    END;
    ALTER TABLE consent FORCE ROW LEVEL SECURITY;
    PERFORM assert_rls_complete();   -- and it is clean again
    RAISE NOTICE 'TEST8c PASS: the RLS backstop bites, and names the offending table';
END $$;

-- 8d — the privileged bypass is REAL, and that is the whole reason for the role
--      split. A SUPERUSER bypasses RLS unconditionally — FORCE does not
--      constrain it, because FORCE only extends the policy to a non-superuser
--      OWNER. So the guarantee is not "RLS is enabled"; it is "the application
--      connects as a role that RLS applies to".
--
--      This asserts both halves against the same data and the same tenant
--      context: privileged sees the foreign tenant's rows, insurimple_app does
--      not.
DO $$
DECLARE n_privileged int; n_app int; is_super boolean;
BEGIN
    SELECT usesuper INTO is_super FROM pg_user WHERE usename = current_user;
    PERFORM set_config('app.current_tenant','22222222-2222-2222-2222-222222222222', false);

    -- Tenant 2222… owns no accounts; tenant 1111… owns one.
    SELECT count(*) INTO n_privileged FROM account;

    IF NOT is_super THEN
        RAISE EXCEPTION 'TEST8d INCONCLUSIVE: expected to be running as a privileged role';
    END IF;
    IF n_privileged = 0 THEN
        RAISE EXCEPTION
            'TEST8d FAIL: a superuser saw 0 rows — the fixture is wrong, so this proves nothing';
    END IF;

    SET LOCAL ROLE app;
    SELECT count(*) INTO n_app FROM account;
    RESET ROLE;

    IF n_app <> 0 THEN
        RAISE EXCEPTION
            'TEST8d FAIL: the app role saw % of another tenant''s accounts', n_app;
    END IF;

    RAISE NOTICE
        'TEST8d PASS: privileged role sees % foreign-tenant row(s), app role sees 0 — RLS protects the app role, not the connection',
        n_privileged;
END $$;

-- 8e — audit_event is tenant-isolated. It holds full before/after row images,
--      so an unscoped audit table is a complete bypass of every other policy.
DO $$
DECLARE n_app int;
BEGIN
    PERFORM set_config('app.current_tenant','22222222-2222-2222-2222-222222222222', false);
    SET LOCAL ROLE app;
    SELECT count(*) INTO n_app FROM audit_event;
    RESET ROLE;
    IF n_app <> 0 THEN
        RAISE EXCEPTION 'TEST8e FAIL: the app role read % audit rows belonging to another tenant', n_app;
    END IF;
    RAISE NOTICE 'TEST8e PASS: audit_event is tenant-isolated — no cross-tenant row images';
END $$;

-- ============================================================================
-- TEST9 — the actor default fails closed.
--
-- current_actor() used to default to 'system', the actor every authority guard
-- in 0009-0012 bypasses. A connection that never set app.current_actor
-- therefore held full provisioning authority: it could create transactions
-- without a licence, issue proofs, and grant itself roles. Nothing errored,
-- which is what made it survive. The default is now 'anonymous', which holds
-- no capability at all.
-- ============================================================================

-- 9a — with no actor set, the licence guard refuses a transaction
DO $$
DECLARE v_state text;
BEGIN
    PERFORM set_config('app.current_tenant','11111111-1111-1111-1111-111111111111', false);
    PERFORM set_config('app.current_actor', '', false);
    IF current_actor() <> 'anonymous' THEN
        RAISE EXCEPTION 'TEST9a FAIL: unset actor resolved to %, not anonymous', current_actor();
    END IF;
    BEGIN
        INSERT INTO txn (id, tenant_id, txn_type, account_id)
        VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111','new_business',
                (SELECT id FROM account WHERE tenant_id = '11111111-1111-1111-1111-111111111111' LIMIT 1));
        RAISE EXCEPTION 'TEST9a FAIL: a caller with no actor created a transaction';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST9a PASS: no actor set — transaction refused, licence guard held';
    END;
END $$;

-- 9b — and it refuses to grant itself the authority it lacks
DO $$
BEGIN
    PERFORM set_config('app.current_actor', '', false);
    BEGIN
        INSERT INTO staff_role_grant (id, tenant_id, staff_id, role_code)
        VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111',
                '50000000-0000-0000-0000-000000000001','admin_principal');
        RAISE EXCEPTION 'TEST9b FAIL: a caller with no actor granted itself a role';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST9b PASS: no actor set — self-grant refused, team.manage guard held';
    END;
END $$;

-- 9c — `system` still works, but only when asked for by name
DO $$
DECLARE v_id uuid;
BEGIN
    PERFORM set_config('app.current_actor', 'system', false);
    INSERT INTO txn (id, tenant_id, txn_type, account_id)
    VALUES (uuidv7(), '11111111-1111-1111-1111-111111111111','new_business',
            (SELECT id FROM account WHERE tenant_id = '11111111-1111-1111-1111-111111111111' LIMIT 1))
    RETURNING id INTO v_id;
    DELETE FROM txn WHERE id = v_id;
    RAISE NOTICE 'TEST9c PASS: system remains privileged when named explicitly';
END $$;

-- ============================================================================
-- TEST10 — primary keys are supplied, not defaulted, and they are UUIDv7.
-- ============================================================================

-- 10a — no uuid id column carries a default
DO $$
BEGIN
    PERFORM assert_no_generated_keys();
    RAISE NOTICE 'TEST10a PASS: no uuid primary key carries a default';
END $$;

-- 10b — the backstop bites, and names the offending column
DO $$
BEGIN
    RESET ROLE;
    ALTER TABLE claim ALTER COLUMN id SET DEFAULT gen_random_uuid();
    BEGIN
        PERFORM assert_no_generated_keys();
        ALTER TABLE claim ALTER COLUMN id DROP DEFAULT;
        RAISE EXCEPTION 'TEST10b FAIL: a defaulted uuid key went unnoticed';
    EXCEPTION WHEN raise_exception THEN
        ALTER TABLE claim ALTER COLUMN id DROP DEFAULT;
        IF SQLERRM NOT LIKE '%claim.id%' THEN
            RAISE EXCEPTION 'TEST10b FAIL: the assertion did not name claim.id — %', SQLERRM;
        END IF;
        RAISE NOTICE 'TEST10b PASS: the key backstop bites, and names the offending column';
    END;
    SET ROLE app;
END $$;

-- 10c — the SQL generator produces well-formed, ordered UUIDv7
DO $$
DECLARE
    ids uuid[];
    n   int := 5000;
BEGIN
    SELECT array_agg(id ORDER BY ord) INTO ids
      FROM (SELECT uuidv7() AS id, generate_series(1, n) AS ord) g;

    IF EXISTS (SELECT 1 FROM unnest(ids) u WHERE substr(u::text, 15, 1) <> '7') THEN
        RAISE EXCEPTION 'TEST10c FAIL: uuidv7() produced an id whose version nibble is not 7';
    END IF;
    IF EXISTS (SELECT 1 FROM unnest(ids) u WHERE substr(u::text, 20, 1) NOT IN ('8','9','a','b')) THEN
        RAISE EXCEPTION 'TEST10c FAIL: uuidv7() produced an id with the wrong variant bits';
    END IF;
    IF EXISTS (
        SELECT 1 FROM (SELECT u, lag(u) OVER () AS prev FROM unnest(ids) u) s
         WHERE prev IS NOT NULL AND u <= prev
    ) THEN
        RAISE EXCEPTION
            'TEST10c FAIL: uuidv7() is not monotonic — the whole point of the key format '
            'is that inserts append rather than scatter across the index';
    END IF;
    RAISE NOTICE 'TEST10c PASS: % uuidv7() ids, version 7, correct variant, strictly increasing', n;
END $$;

-- 10d — the keys already in this database are v7, not v4. Proves the fixtures
--       and the state-machine trigger actually use the generator.
DO $$
DECLARE bad int;
BEGIN
    SELECT count(*) INTO bad FROM txn_event WHERE substr(id::text, 15, 1) <> '7';
    IF bad > 0 THEN
        RAISE EXCEPTION 'TEST10d FAIL: % txn_event rows carry a non-v7 key', bad;
    END IF;
    SELECT count(*) INTO bad FROM signature WHERE substr(id::text, 15, 1) <> '7';
    IF bad > 0 THEN
        RAISE EXCEPTION 'TEST10d FAIL: % signature rows carry a non-v7 key', bad;
    END IF;
    RAISE NOTICE 'TEST10d PASS: trigger-written and fixture-written rows both carry v7 keys';
END $$;

SELECT 'ALL FUNCTIONAL TESTS PASSED' AS result;
