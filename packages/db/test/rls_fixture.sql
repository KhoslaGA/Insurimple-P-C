-- ============================================================================
-- rls_fixture.sql — two complete tenants, for the RLS suite to fail against.
--
-- Runs as the OWNER (migrator), before the suite drops to insurimple_app.
--
-- Why a dedicated fixture rather than the dev seed: the dev seed populates one
-- tenant and leaves five tenant-scoped tables empty. An isolation suite run
-- against an empty table asserts "the other tenant sees zero rows" and passes
-- for the wrong reason — the table has no rows for anyone. That is the most
-- common way an RLS certification lies. Every tenant-scoped table gets at
-- least one row in BOTH tenants here, and rls_fixture_census records the
-- privileged counts so the suite can prove each assertion was non-vacuous.
--
-- Values are derived from the tenant tag, so the two tenants never collide on
-- a unique constraint and the fixture is deterministic across runs.
-- ============================================================================

DROP TABLE IF EXISTS rls_fixture_census;
CREATE TABLE rls_fixture_census (
    table_name  text PRIMARY KEY,
    tenant_a    bigint NOT NULL,
    tenant_b    bigint NOT NULL
);
GRANT SELECT ON rls_fixture_census TO insurimple_app;

CREATE OR REPLACE FUNCTION rls_seed_tenant(p_tenant uuid, tag text) RETURNS void
LANGUAGE plpgsql AS $fn$
DECLARE
    v_branch   uuid := md5(tag||'branch')::uuid;
    v_staff    uuid := md5(tag||'staff')::uuid;
    v_licence  uuid := md5(tag||'licence')::uuid;
    v_party    uuid := md5(tag||'party')::uuid;
    v_party2   uuid := md5(tag||'party2')::uuid;
    v_carrier  uuid := md5(tag||'carrier')::uuid;
    v_account  uuid := md5(tag||'account')::uuid;
    v_policy   uuid := md5(tag||'policy')::uuid;
    v_vehicle  uuid := md5(tag||'vehicle')::uuid;
    v_dwelling uuid := md5(tag||'dwelling')::uuid;
    v_txn      uuid := md5(tag||'txn')::uuid;
    v_tmpl     uuid := md5(tag||'template')::uuid;
    v_doc      uuid := md5(tag||'document')::uuid;
    v_ledger   uuid := md5(tag||'ledger')::uuid;
    v_entry    uuid := md5(tag||'entry')::uuid;
BEGIN
    -- The authority trigger on txn and the team.manage guard on staff_role_grant
    -- both bypass for `system`, which is what tenant provisioning acts as.
    PERFORM set_config('app.current_tenant', p_tenant::text, true);
    PERFORM set_config('app.current_actor', 'system', true);

    INSERT INTO tenant (id, legal_name, trade_name, ribo_licence)
    VALUES (p_tenant, tag||' Brokerage Inc.', tag, 'RIBO-'||upper(tag));

    INSERT INTO tenant_module (id, tenant_id, module) VALUES (uuidv7(), p_tenant, 'pc');

    INSERT INTO branch (id, tenant_id, code, name, is_default)
    VALUES (v_branch, p_tenant, upper(tag)||'-HQ', tag||' Head Office', true);

    INSERT INTO staff (id, tenant_id, full_name, email, role, ribo_level)
    VALUES (v_staff, p_tenant, tag||' Principal', tag||'@example.test', 'principal_broker', 'L2');

    INSERT INTO licence (id, tenant_id, staff_id, licence_class, licence_number,
                         regulator, issued_on, expires_on, status)
    VALUES (v_licence, p_tenant, v_staff, 'ribo_l2', 'RIBO-'||upper(tag)||'-1',
            'RIBO', current_date - 365, current_date + 365, 'active');

    INSERT INTO staff_role_grant (id, tenant_id, staff_id, role_code, licence_id)
    VALUES (uuidv7(), p_tenant, v_staff, 'admin_principal', v_licence);

    INSERT INTO party (id, tenant_id, party_type, first_name, last_name, email, language)
    VALUES (v_party, p_tenant, 'person', 'Ada', tag||'son', 'ada.'||tag||'@example.test', 'en');
    INSERT INTO party (id, tenant_id, party_type, first_name, last_name, language)
    VALUES (v_party2, p_tenant, 'person', 'Grace', tag||'ford', 'en');

    INSERT INTO party_relationship (id, tenant_id, from_party_id, to_party_id, relationship)
    VALUES (uuidv7(), p_tenant, v_party, v_party2, 'spouse_of');

    INSERT INTO consent (id, tenant_id, party_id, channel, basis, captured_at)
    VALUES (uuidv7(), p_tenant, v_party, 'email', 'express', now());

    INSERT INTO driver_record (id, tenant_id, party_id, licence_number, licence_class, licence_date)
    VALUES (uuidv7(), p_tenant, v_party, 'D'||upper(tag)||'1234567', 'G', current_date - 3650);

    INSERT INTO carrier (id, tenant_id, name, csio_code)
    VALUES (v_carrier, p_tenant, tag||' Mutual', upper(left(tag,4)));

    INSERT INTO market_availability (id, tenant_id, carrier_id, line, broker_code,
                                     quote_channel, submit_channel, download_channel)
    VALUES (uuidv7(), p_tenant, v_carrier, 'auto', upper(tag)||'-BRK', 'rater', 'portal', 'csio_edocs');

    INSERT INTO account (id, tenant_id, branch_id, lookup_code, display_name, kind, status,
                         servicing_broker)
    VALUES (v_account, p_tenant, v_branch, upper(tag)||'ADA01', 'Ada '||tag||'son',
            'personal', 'active', v_staff);

    -- Volume, so the planner's index choice means something.
    --
    -- With one account per tenant every plan costs the same and EXPLAIN picks
    -- by tie-break, which made the search-index assertion flip the moment a
    -- second tenant-leading index appeared on `account`. Two hundred rows makes
    -- a range predicate genuinely selective, so a plan that has to scan the
    -- tenant and filter is measurably worse than one that seeks — which is the
    -- difference the assertion is trying to observe.
    INSERT INTO account (id, tenant_id, branch_id, lookup_code, display_name, kind, status)
    SELECT uuidv7(), p_tenant, v_branch,
           upper(tag) || 'BULK' || lpad(i::text, 4, '0'),
           'Bulk ' || tag || ' ' || chr(65 + (i % 26)) || lpad(i::text, 4, '0'),
           'personal', 'active'
      FROM generate_series(1, 200) i;

    INSERT INTO account_party (id, tenant_id, account_id, party_id, role, is_primary)
    VALUES (uuidv7(), p_tenant, v_account, v_party, 'named_insured', true);

    INSERT INTO policy (id, tenant_id, branch_id, account_id, carrier_id, policy_number,
                        line, status, effective_date, expiry_date, billing_type, annual_premium)
    VALUES (v_policy, p_tenant, v_branch, v_account, v_carrier, upper(tag)||'-POL-1',
            'auto', 'in_force', current_date - 30, current_date + 335, 'agency', 1800.00);

    INSERT INTO vehicle (id, tenant_id, policy_id, vin, year, make, model, primary_use, ownership)
    VALUES (v_vehicle, p_tenant, v_policy, upper(tag)||'VIN0000000001', 2022, 'Honda', 'Civic',
            'commute', 'owned');

    INSERT INTO dwelling (id, tenant_id, policy_id, year_built, construction, occupancy,
                          replacement_cost)
    VALUES (v_dwelling, p_tenant, v_policy, 1998, 'frame', 'owner', 650000.00);

    INSERT INTO coverage (id, tenant_id, policy_id, vehicle_id, csio_code, description,
                          limit_amount, deductible, premium)
    VALUES (uuidv7(), p_tenant, v_policy, v_vehicle, 'TPL', 'Third party liability',
            1000000.00, 1000.00, 900.00);

    INSERT INTO policy_endorsement (id, tenant_id, policy_id, form_code, description, effective_date)
    VALUES (uuidv7(), p_tenant, v_policy, 'OPCF20', 'Loss of use', current_date - 30);

    INSERT INTO ontario_auto_election (id, tenant_id, policy_id, opcf_47r_signed, dcpd_opt_out)
    VALUES (uuidv7(), p_tenant, v_policy, true, false);

    INSERT INTO loss_history (id, tenant_id, party_id, policy_id, carrier_id, loss_date,
                              loss_type, at_fault, amount)
    VALUES (uuidv7(), p_tenant, v_party, v_policy, v_carrier, current_date - 900, 'collision', false, 4200.00);

    INSERT INTO txn (id, tenant_id, branch_id, reference, txn_type, account_id, policy_id,
                     carrier_id, owner_id, effective_date)
    VALUES (v_txn, p_tenant, v_branch, upper(tag)||'-TXN-1', 'endorsement', v_account, v_policy,
            v_carrier, v_staff, current_date);

    INSERT INTO txn_event (id, tenant_id, txn_id, from_state, to_state, actor, note)
    VALUES (uuidv7(), p_tenant, v_txn, NULL, 'draft', 'system', 'fixture');

    INSERT INTO document_template (id, tenant_id, code, name, body, version)
    VALUES (v_tmpl, p_tenant, 'FIXTURE', tag||' template', 'Hello {{name}}', 1);

    INSERT INTO document (id, tenant_id, account_id, policy_id, txn_id, template_id,
                          doc_type, filename, source, retention_until)
    VALUES (v_doc, p_tenant, v_account, v_policy, v_txn, v_tmpl,
            'application', tag||'-application.pdf', 'generated', current_date + 2555);

    INSERT INTO signature (id, tenant_id, document_id, signer_party_id, method, signed_at, verified)
    VALUES (uuidv7(), p_tenant, v_doc, v_party, 'esign', now(), true);

    INSERT INTO disclosure_record (id, tenant_id, account_id, txn_id, disclosure_type,
                                   delivery_method, delivered_at, document_id)
    VALUES (uuidv7(), p_tenant, v_account, v_txn, 'compensation', 'email', now(), v_doc);

    INSERT INTO carrier_submission (id, tenant_id, txn_id, carrier_id, document_id, channel, status)
    VALUES (uuidv7(), p_tenant, v_txn, v_carrier, v_doc, 'portal', 'queued');

    INSERT INTO quote_log (id, tenant_id, account_id, txn_id, carrier_id, line, quoted_premium,
                           outcome, quoted_at)
    VALUES (uuidv7(), p_tenant, v_account, v_txn, v_carrier, 'auto', 1755.00, 'selected', now());

    INSERT INTO claim (id, tenant_id, account_id, policy_id, txn_id, carrier_id, claim_number,
                       loss_date, reported_date, status, reserve)
    VALUES (uuidv7(), p_tenant, v_account, v_policy, v_txn, v_carrier, upper(tag)||'-CLM-1',
            current_date - 10, current_date - 9, 'open', 5000.00);

    INSERT INTO activity (id, tenant_id, account_id, policy_id, txn_id, activity_type, title,
                          owner_id, priority, status, due_at)
    VALUES (uuidv7(), p_tenant, v_account, v_policy, v_txn, 'follow_up', 'Fixture follow-up',
            v_staff, 'medium', 'open', now() + interval '2 days');

    INSERT INTO ledger_account (id, tenant_id, book, code, name, type)
    VALUES (v_ledger, p_tenant, 'trust', '1000', 'Trust cash', 'asset');

    -- Left unposted on purpose. jl_lock_when_posted() refuses to touch the
    -- lines of a posted entry, and it is a BEFORE trigger — so on a posted
    -- entry it would fire ahead of the WITH CHECK policy and the plant probe
    -- would record "cannot modify lines of a posted entry" as its proof of
    -- tenant isolation. The fixture must not hand a test a convenient error.
    INSERT INTO journal_entry (id, tenant_id, book, reference, description, entry_date,
                               txn_id, posted)
    VALUES (v_entry, p_tenant, 'trust', upper(tag)||'-JE-1', 'Fixture receipt',
            current_date, v_txn, false);

    -- The balanced pair the journal_line check constraint requires: exactly one
    -- of debit/credit non-zero per line.
    INSERT INTO journal_line (id, tenant_id, entry_id, account_id, party_account_id, debit, credit)
    VALUES (uuidv7(), p_tenant, v_entry, v_ledger, v_account, 1800.00, 0),
           (uuidv7(), p_tenant, v_entry, v_ledger, v_account, 0, 1800.00);

    INSERT INTO commission_entry (id, tenant_id, policy_id, carrier_id, period, expected,
                                  received, status)
    VALUES (uuidv7(), p_tenant, v_policy, v_carrier, date_trunc('month', current_date)::date,
            225.00, 225.00, 'matched');
END $fn$;

SELECT rls_seed_tenant('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alpha');
SELECT rls_seed_tenant('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bravo');

-- Without this the planner has no statistics for anything the fixture just
-- wrote, falls back to its default estimates, and picks between two
-- tenant-leading indexes by tie-break. The plan assertions would then be
-- measuring a coin flip rather than what RLS does to qual promotion.
ANALYZE;

-- ----------------------------------------------------------------------------
-- Census, taken as owner. The suite reads it to prove that when it asserts
-- "the other tenant sees zero", there was something there to see.
-- ----------------------------------------------------------------------------
DO $$
DECLARE r record; n_a bigint; n_b bigint;
BEGIN
    FOR r IN SELECT unnest(tenant_tables()) AS t LOOP
        EXECUTE format(
            'SELECT count(*) FILTER (WHERE tenant_id = %L), count(*) FILTER (WHERE tenant_id = %L) FROM %I',
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', r.t) INTO n_a, n_b;
        INSERT INTO rls_fixture_census VALUES (r.t, n_a, n_b);
    END LOOP;
END $$;

DO $$
DECLARE bad text;
BEGIN
    SELECT string_agg(table_name, ', ' ORDER BY table_name) INTO bad
      FROM rls_fixture_census WHERE tenant_a = 0 OR tenant_b = 0;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION
            'fixture incomplete — these tenant tables have no rows for one of the two tenants, '
            'so any isolation assertion on them would pass vacuously: %', bad;
    END IF;
    RAISE NOTICE 'fixture: % tenant-scoped tables populated for both tenants',
        (SELECT count(*) FROM rls_fixture_census);
END $$;
