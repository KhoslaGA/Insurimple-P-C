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
SELECT set_config('app.current_actor','gautam', false);

-- ---- reference data -------------------------------------------------------
INSERT INTO branch (id, tenant_id, code, name, is_default)
VALUES ('b0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','SOU','Sound Insurance Services',true);

INSERT INTO staff (id, tenant_id, full_name, email, role, ribo_level)
VALUES ('50000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Gautam Khosla','gautam@insurimple.ca','principal_broker','L1');

INSERT INTO carrier (id, tenant_id, name, csio_code)
VALUES ('c0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Pembridge','PEMB');

-- ---- account + party + consent (Abtahi) -----------------------------------
INSERT INTO account (id, tenant_id, branch_id, lookup_code, display_name, kind, status, source)
VALUES ('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
        'b0000000-0000-0000-0000-000000000001','ABTAHISE01','Seyed Moein Abtahi','personal','cancelling','toprates.ca');

INSERT INTO party (id, tenant_id, party_type, first_name, last_name, email, phone, address)
VALUES ('40000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','person',
        'Seyed Moein','Abtahi','abtmoien@gmail.com','(647) 553-7656',
        '{"line1":"Ph01-23 Oneida Cres","city":"Richmond Hill","prov":"ON","postal":"L4B 0A2"}');

INSERT INTO account_party (tenant_id, account_id, party_id, role, is_primary)
VALUES ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000001',
        '40000000-0000-0000-0000-000000000001','named_insured',true);

-- CASL: "Did Not Obtain" from the Epic screen, captured properly per channel
INSERT INTO consent (tenant_id, party_id, channel, basis)
VALUES ('11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000001','phone','did_not_obtain');

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
INSERT INTO signature (tenant_id, document_id, signer_party_id, method, signed_at, signer_ip, verified)
VALUES ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000001',
        '40000000-0000-0000-0000-000000000001','esign','2026-06-05 10:56:33-04','99.245.0.0',true);

UPDATE txn SET state='signed' WHERE id='70000000-0000-0000-0000-000000000001';

-- submit to carrier via Secure Delivery portal (the out-of-band step)
INSERT INTO carrier_submission (tenant_id, txn_id, carrier_id, document_id, channel, status, submitted_at, payload)
VALUES ('11111111-1111-1111-1111-111111111111','70000000-0000-0000-0000-000000000001',
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
INSERT INTO journal_line (tenant_id, entry_id, account_id, debit, credit) VALUES
 ('11111111-1111-1111-1111-111111111111','1e000000-0000-0000-0000-000000000001','1a000000-0000-0000-0000-000000000001',2760.00,0),
 ('11111111-1111-1111-1111-111111111111','1e000000-0000-0000-0000-000000000001','1a000000-0000-0000-0000-000000000002',0,2760.00);
UPDATE journal_entry SET posted=true WHERE id='1e000000-0000-0000-0000-000000000001';
DO $$ BEGIN RAISE NOTICE 'TEST3a PASS: balanced trust entry posted'; END $$;

-- unbalanced entry must be rejected on post
INSERT INTO journal_entry (id, tenant_id, book, reference)
VALUES ('1e000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','trust','BAD-1');
INSERT INTO journal_line (tenant_id, entry_id, account_id, debit, credit) VALUES
 ('11111111-1111-1111-1111-111111111111','1e000000-0000-0000-0000-000000000002','1a000000-0000-0000-0000-000000000001',100,0),
 ('11111111-1111-1111-1111-111111111111','1e000000-0000-0000-0000-000000000002','1a000000-0000-0000-0000-000000000002',0,90);
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

SELECT 'ALL FUNCTIONAL TESTS PASSED' AS result;
