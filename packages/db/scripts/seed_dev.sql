-- scripts/seed_dev.sql — dev bootstrap: app role + Insurimple seed data.
-- Runs as superuser (RLS bypassed for seeding); the API then runs as `app`.
\set ON_ERROR_STOP on

DO $$ BEGIN
    CREATE ROLE app NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT USAGE ON SCHEMA public TO app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app;

INSERT INTO tenant (id, legal_name, trade_name, ribo_licence) VALUES
 ('11111111-1111-1111-1111-111111111111','Insurimple Brokerage Inc.','Insurimple','RIBO-PENDING')
ON CONFLICT DO NOTHING;
INSERT INTO tenant (id, legal_name) VALUES
 ('22222222-2222-2222-2222-222222222222','Other Brokerage Inc.')
ON CONFLICT DO NOTHING;

INSERT INTO branch (id, tenant_id, code, name, is_default) VALUES
 ('b0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','INS','Insurimple Main',true)
ON CONFLICT DO NOTHING;

INSERT INTO staff (id, tenant_id, full_name, email, role, ribo_level) VALUES
 ('50000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Gautam Khosla','gautam@insurimple.ca','principal_broker','L1')
ON CONFLICT DO NOTHING;

INSERT INTO carrier (id, tenant_id, name, csio_code) VALUES
 ('c0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Pembridge','PEMB'),
 ('c0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Gore Mutual','GORE')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Entitlement + licence + grant (invariants 3 & 4). Without these the DB
-- refuses every transaction insert — the boundary is structural, so the seed
-- must provision it exactly as production onboarding would.
--
-- This runs as a superuser (RLS and the team.manage guard both bypassed for
-- seeding). In production the equivalent path is tenant provisioning acting as
-- `system`: the first principal cannot grant themselves authority.
-- ----------------------------------------------------------------------------
INSERT INTO tenant_module (tenant_id, module) VALUES
 ('11111111-1111-1111-1111-111111111111','pc')
ON CONFLICT DO NOTHING;

INSERT INTO licence (id, tenant_id, staff_id, licence_class, licence_number, regulator, issued_on, expires_on) VALUES
 ('11c00000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
  '50000000-0000-0000-0000-000000000001','ribo_l2','RIBO-100200','RIBO','2019-03-01', current_date + 300)
ON CONFLICT DO NOTHING;

INSERT INTO staff_role_grant (tenant_id, staff_id, role_code, licence_id) VALUES
 ('11111111-1111-1111-1111-111111111111','50000000-0000-0000-0000-000000000001',
  'admin_principal','11c00000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO account (id, tenant_id, branch_id, lookup_code, display_name, kind, status, source) VALUES
 ('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
  'b0000000-0000-0000-0000-000000000001','ABTAHISE01','Seyed Moein Abtahi','personal','cancelling','toprates.ca')
ON CONFLICT DO NOTHING;

INSERT INTO party (id, tenant_id, party_type, first_name, last_name, email, phone, address) VALUES
 ('40000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','person',
  'Seyed Moein','Abtahi','abtmoien@gmail.com','(647) 553-7656',
  '{"line1":"Ph01-23 Oneida Cres","city":"Richmond Hill","prov":"ON","postal":"L4B 0A2"}')
ON CONFLICT DO NOTHING;

INSERT INTO account_party (tenant_id, account_id, party_id, role, is_primary) VALUES
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001','named_insured',true)
ON CONFLICT DO NOTHING;

INSERT INTO consent (tenant_id, party_id, channel, basis) VALUES
 ('11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000001','phone','did_not_obtain')
ON CONFLICT DO NOTHING;

INSERT INTO policy (id, tenant_id, account_id, carrier_id, policy_number, line, status, effective_date, expiry_date, billing_type, payment_plan, annual_premium) VALUES
 ('90000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
  'a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',
  '240517202','auto','in_force','2026-06-24','2027-06-24','agency','monthly PAD',2140.00)
ON CONFLICT DO NOTHING;

-- Abtahi is the servicing broker's account.
UPDATE account SET servicing_broker='50000000-0000-0000-0000-000000000001'
 WHERE id='a0000000-0000-0000-0000-000000000001';

-- Abtahi's remaining CASL consent channels (typed rows, not a comment blob).
INSERT INTO consent (tenant_id, party_id, channel, basis, captured_at, source) VALUES
 ('11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000001','email','express', now() - interval '400 days','signed application'),
 ('11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000001','sms','did_not_obtain', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Abtahi as a driver on the auto policy.
INSERT INTO driver_record (tenant_id, party_id, licence_number, licence_class, licence_date, autoplus_consent, autoplus_pulled_at, at_fault_count) VALUES
 ('11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000001','A1234-56789-01234','G','2011-04-18',true, now() - interval '400 days',0)
ON CONFLICT DO NOTHING;

-- Lienholder (additional interest) as an organization party.
INSERT INTO party (id, tenant_id, party_type, legal_name, business_number) VALUES
 ('40000000-0000-0000-0000-0000000000f1','11111111-1111-1111-1111-111111111111','organization','TD Auto Finance','TDAF-000123')
ON CONFLICT DO NOTHING;

-- Abtahi's insured vehicle.
INSERT INTO vehicle (id, tenant_id, policy_id, vin, year, make, model, primary_use, annual_km, ownership, lienholder_party, winter_tires) VALUES
 ('7e000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
  '90000000-0000-0000-0000-000000000001','2HKRW2H59KH100001',2019,'Honda','CR-V','commute',18000,'financed',
  '40000000-0000-0000-0000-0000000000f1',true)
ON CONFLICT DO NOTHING;

-- Structured coverages (never PDF-only).
INSERT INTO coverage (tenant_id, policy_id, vehicle_id, csio_code, description, limit_amount, deductible, premium) VALUES
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000001','7e000000-0000-0000-0000-000000000001','TPL','Third Party Liability',2000000.00,NULL,980.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000001','7e000000-0000-0000-0000-000000000001','DCPD','Direct Compensation — Property Damage',NULL,0.00,240.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000001','7e000000-0000-0000-0000-000000000001','COLL','Collision',NULL,1000.00,520.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000001','7e000000-0000-0000-0000-000000000001','COMP','Comprehensive',NULL,1000.00,400.00)
ON CONFLICT DO NOTHING;

-- Endorsements as first-class, premium-bearing rows (the Epic gap we beat).
INSERT INTO policy_endorsement (tenant_id, policy_id, form_code, description, premium, effective_date) VALUES
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000001','OPCF 20','Coverage for Transportation Replacement',48.00,'2025-06-24'),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000001','OPCF 47R','Agreement Not to Rely on Certain Optional Benefits',0.00,'2025-06-24')
ON CONFLICT DO NOTHING;

INSERT INTO ontario_auto_election (tenant_id, policy_id, opcf_47r_signed, dcpd_opt_out) VALUES
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000001',true,false)
ON CONFLICT DO NOTHING;

-- Loss history / Letter of Experience — powers remarketing.
INSERT INTO loss_history (tenant_id, party_id, policy_id, carrier_id, insured_from, insured_to, loss_date, loss_type, at_fault, amount) VALUES
 ('11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','2020-06-24',NULL,'2023-02-11','Comprehensive — Windshield',false,780.00)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Abtahi's cancellation transaction, mid-flight (submitted to carrier), with a
-- full state history in txn_event. Inserted directly at its live state; the
-- lifecycle log is written explicitly so the Service Summary has real history.
-- ----------------------------------------------------------------------------
INSERT INTO txn (id, tenant_id, reference, txn_type, account_id, policy_id, carrier_id, state, reason, effective_date, owner_id, opened_at) VALUES
 ('d0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','TXN-3041','cancellation',
  'a0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',
  'submitted','Client sold the vehicle — cancel auto, flat rate','2026-07-15',
  '50000000-0000-0000-0000-000000000001', now() - interval '9 days')
ON CONFLICT DO NOTHING;

INSERT INTO txn_event (tenant_id, txn_id, from_state, to_state, actor, at) VALUES
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000001',NULL,'draft','Gautam Khosla', now() - interval '9 days'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000001','draft','doc_generated','Gautam Khosla', now() - interval '9 days' + interval '20 minutes'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000001','doc_generated','sig_pending','Gautam Khosla', now() - interval '8 days'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000001','sig_pending','signed','Gautam Khosla', now() - interval '6 days'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000001','signed','submitted','Gautam Khosla', now() - interval '5 days')
ON CONFLICT DO NOTHING;

INSERT INTO carrier_submission (tenant_id, txn_id, carrier_id, channel, status, submitted_at) VALUES
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','portal','sent', now() - interval '5 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- The rest of the book — real accounts so every Locate row reaches a record.
-- ============================================================================
INSERT INTO account (id, tenant_id, branch_id, lookup_code, display_name, kind, status, source, servicing_broker) VALUES
 ('a0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000001','GILLAM01','Amrit Gill','personal','active','referral','50000000-0000-0000-0000-000000000001'),
 ('a0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000001','MEHTARA01','Rahul Mehta','personal','active','toprates.ca','50000000-0000-0000-0000-000000000001'),
 ('a0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000001','KAPOORGA01','Gautam & Tanvi Kapoor','personal','active','referral','50000000-0000-0000-0000-000000000001'),
 ('a0000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000001','SANDHUGU01','Gurpreet Sandhu','personal','prospect','toprates.ca','50000000-0000-0000-0000-000000000001'),
 ('a0000000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000001','PETROVNI01','Nikolai Petrov','personal','lapsed','walk-in','50000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO party (id, tenant_id, party_type, first_name, last_name, email, phone, address) VALUES
 ('40000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','person','Amrit','Gill','amrit.gill@email.ca','(905) 555-0217','{"line1":"12 Sunforest Dr","city":"Brampton","prov":"ON","postal":"L6R 1A1"}'),
 ('40000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','person','Rahul','Mehta','r.mehta@email.ca','(647) 555-0529','{"line1":"88 Eglinton Ave","city":"Mississauga","prov":"ON","postal":"L5R 3G1"}'),
 ('40000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','person','Gautam','Kapoor','gautamkhosla75@gmail.com','(647) 870-8623','{"line1":"5 Financial Dr","city":"Brampton","prov":"ON","postal":"L6Y 0M4"}'),
 ('40000000-0000-0000-0000-000000000014','11111111-1111-1111-1111-111111111111','person','Tanvi','Kapoor','tanvi.kapoor@email.ca','(647) 870-8624','{"line1":"5 Financial Dr","city":"Brampton","prov":"ON","postal":"L6Y 0M4"}'),
 ('40000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','person','Gurpreet','Sandhu','g.sandhu@email.ca','(416) 555-0633','{"line1":"200 Queen St","city":"Brampton","prov":"ON","postal":"L6W 2B3"}'),
 ('40000000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','person','Nikolai','Petrov','n.petrov@email.ca','(905) 555-0466','{"line1":"47 Vodden St","city":"Brampton","prov":"ON","postal":"L6V 1M9"}')
ON CONFLICT DO NOTHING;

INSERT INTO account_party (tenant_id, account_id, party_id, role, is_primary) VALUES
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002','named_insured',true),
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000003','named_insured',true),
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000004','40000000-0000-0000-0000-000000000004','named_insured',true),
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000004','40000000-0000-0000-0000-000000000014','co_insured',false),
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000005','40000000-0000-0000-0000-000000000005','named_insured',true),
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000006','40000000-0000-0000-0000-000000000006','named_insured',true)
ON CONFLICT DO NOTHING;

INSERT INTO consent (tenant_id, party_id, channel, basis, captured_at, source) VALUES
 ('11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000002','email','express', now() - interval '200 days','signed application'),
 ('11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000003','email','implied', now() - interval '90 days','existing client'),
 ('11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000004','email','express', now() - interval '300 days','signed application'),
 ('11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000005','phone','express', now() - interval '10 days','quote intake call')
ON CONFLICT DO NOTHING;

INSERT INTO policy (id, tenant_id, account_id, carrier_id, policy_number, line, status, effective_date, expiry_date, billing_type, payment_plan, annual_premium) VALUES
 ('90000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002','GM-771204','auto','in_force','2025-09-01','2026-09-01','direct','monthly',1720.00),
 ('90000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000001','PB-330871','auto','in_force','2025-11-15','2026-11-15','agency','annual',1980.00),
 ('90000000-0000-0000-0000-000000000013','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000002','GM-880132','tenant','in_force','2025-11-15','2026-11-15','direct','annual',320.00),
 ('90000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000001','PB-450992','auto','in_force','2026-01-10','2027-01-10','agency','monthly PAD',2460.00),
 ('90000000-0000-0000-0000-000000000014','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000002','GM-451001','tenant','in_force','2026-01-10','2027-01-10','direct','annual',360.00),
 ('90000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000001','PB-QUOTE-51','auto','quoted','2026-08-01',NULL,'agency',NULL,2010.00),
 ('90000000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000002','GM-220417','auto','cancelled','2024-05-01','2025-05-01','direct','monthly',1540.00)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Two more transactions for a richer pipeline: a completed new-business (full
-- lifecycle history) and a fresh draft endorsement. Inserted at their live
-- state with the event log written explicitly.
-- ----------------------------------------------------------------------------
INSERT INTO txn (id, tenant_id, reference, txn_type, account_id, policy_id, carrier_id, state, reason, effective_date, owner_id, opened_at, closed_at) VALUES
 ('d0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','TXN-3055','new_business',
  'a0000000-0000-0000-0000-000000000002','90000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002',
  'completed','New auto policy — bound at Gore Mutual','2025-09-01',
  '50000000-0000-0000-0000-000000000001', now() - interval '35 days', now() - interval '28 days'),
 ('d0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','TXN-3062','endorsement',
  'a0000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000001',
  'draft','Add winter tire discount','2026-07-25',
  '50000000-0000-0000-0000-000000000001', now() - interval '1 day', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO txn_event (tenant_id, txn_id, from_state, to_state, actor, at) VALUES
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000002',NULL,'draft','Gautam Khosla', now() - interval '35 days'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000002','draft','doc_generated','Gautam Khosla', now() - interval '34 days'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000002','doc_generated','sig_pending','Gautam Khosla', now() - interval '33 days'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000002','sig_pending','signed','Gautam Khosla', now() - interval '32 days'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000002','signed','submitted','Gautam Khosla', now() - interval '31 days'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000002','submitted','carrier_ack','Gautam Khosla', now() - interval '29 days'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000002','carrier_ack','completed','Gautam Khosla', now() - interval '28 days'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000003',NULL,'draft','Gautam Khosla', now() - interval '1 day')
ON CONFLICT DO NOTHING;

INSERT INTO carrier_submission (tenant_id, txn_id, carrier_id, channel, status, submitted_at, acknowledged_at, carrier_ref) VALUES
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002','portal','acknowledged', now() - interval '31 days', now() - interval '29 days','GM-771204')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Diary / abeyances so the CSR "My day" queue has real content. Owner = Gautam.
-- ----------------------------------------------------------------------------
INSERT INTO activity (tenant_id, account_id, policy_id, txn_id, activity_type, title, body, owner_id, priority, status, due_at, sla_breached) VALUES
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','follow_up','Chase Pembridge — cancellation acknowledgement','Submitted 5 days ago, no ack yet. Confirm flat-rate effective date.','50000000-0000-0000-0000-000000000001','high','open', now() + interval '2 days', false),
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000002','90000000-0000-0000-0000-000000000002',NULL,'renew','Renewal review — Amrit Gill (expires Sep 1)','Auto renewal at Gore Mutual. Check for premium increase before offer goes out.','50000000-0000-0000-0000-000000000001','medium','open', now() + interval '9 days', false),
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000013',NULL,'edoc_received','eDoc received — tenant policy confirmation','Auto-filed from CSIOnet. Review and close.','50000000-0000-0000-0000-000000000001','low','open', now() + interval '1 day', false),
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000004','90000000-0000-0000-0000-000000000004',NULL,'compliance_note','Verify OPCF 47R on file — Kapoor auto','SABS optionality: confirm signed 47R before the reform effective date.','50000000-0000-0000-0000-000000000001','high','open', now() + interval '3 days', false),
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000005',NULL,NULL,'follow_up','Prospect follow-up — Gurpreet Sandhu quote','Quoted auto at $2,010. Follow up on bind decision.','50000000-0000-0000-0000-000000000001','high','open', now() - interval '2 days', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Property lines. A real Ontario personal-lines book is mostly home+auto
-- bundles, so the tree needs the same depth on the property side: dwelling
-- risk detail, structured property coverages, and the water endorsements
-- every Ontario renewal now turns on.
-- ============================================================================

-- Mortgagee (additional interest on the homeowner policy).
INSERT INTO party (id, tenant_id, party_type, legal_name, business_number) VALUES
 ('40000000-0000-0000-0000-0000000000f2','11111111-1111-1111-1111-111111111111','organization','TD Canada Trust — Mortgage Services','TDMS-0091')
ON CONFLICT DO NOTHING;

-- Kapoor homeowner policy (the bundle partner to their auto).
INSERT INTO policy (id, tenant_id, account_id, carrier_id, policy_number, line, status, effective_date, expiry_date, billing_type, payment_plan, annual_premium) VALUES
 ('90000000-0000-0000-0000-000000000024','11111111-1111-1111-1111-111111111111',
  'a0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000001',
  'PB-HAB-77120','property','in_force','2026-01-10','2027-01-10','agency','monthly PAD',1840.00)
ON CONFLICT DO NOTHING;

INSERT INTO dwelling (id, tenant_id, policy_id, address, year_built, construction, roof_age, heating,
                      has_knob_tube, has_oil_tank, replacement_cost, occupancy, mortgagee_party) VALUES
 -- Kapoor: owner-occupied detached home, financed
 ('da000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
  '90000000-0000-0000-0000-000000000024',
  '{"line1":"5 Financial Dr","city":"Brampton","prov":"ON","postal":"L6Y 0M4"}',
  2012,'Brick veneer',6,'Forced air gas',false,false,780000.00,'owner',
  '40000000-0000-0000-0000-0000000000f2'),
 -- Kapoor tenant policy on a second unit
 ('da000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',
  '90000000-0000-0000-0000-000000000014',
  '{"line1":"5 Financial Dr, Unit B","city":"Brampton","prov":"ON","postal":"L6Y 0M4"}',
  2012,'Brick veneer',6,'Forced air gas',false,false,NULL,'tenant',NULL),
 -- Mehta tenant
 ('da000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111',
  '90000000-0000-0000-0000-000000000013',
  '{"line1":"88 Eglinton Ave, Unit 1204","city":"Mississauga","prov":"ON","postal":"L5R 3G1"}',
  2005,'Concrete high-rise',NULL,'Electric baseboard',false,false,NULL,'tenant',NULL)
ON CONFLICT DO NOTHING;

INSERT INTO coverage (tenant_id, policy_id, dwelling_id, csio_code, description, limit_amount, deductible, premium) VALUES
 -- Homeowner (Kapoor)
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000024','da000000-0000-0000-0000-000000000001','DWELL','Dwelling — guaranteed replacement cost',780000.00,1000.00,910.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000024','da000000-0000-0000-0000-000000000001','CONT','Contents',546000.00,1000.00,320.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000024','da000000-0000-0000-0000-000000000001','PLIA','Personal liability',2000000.00,NULL,180.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000024','da000000-0000-0000-0000-000000000001','SEWER','Sewer backup',25000.00,2500.00,240.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000024','da000000-0000-0000-0000-000000000001','OVLND','Overland water',25000.00,2500.00,190.00),
 -- Mehta tenant
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000013','da000000-0000-0000-0000-000000000003','CONT','Contents',60000.00,500.00,190.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000013','da000000-0000-0000-0000-000000000003','PLIA','Personal liability',1000000.00,NULL,90.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000013','da000000-0000-0000-0000-000000000003','SEWER','Sewer backup',15000.00,1000.00,40.00),
 -- Kapoor tenant unit
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000014','da000000-0000-0000-0000-000000000002','CONT','Contents',45000.00,500.00,210.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000014','da000000-0000-0000-0000-000000000002','PLIA','Personal liability',1000000.00,NULL,90.00)
ON CONFLICT DO NOTHING;

-- Vehicles and coverages on the rest of the auto book, so every line in the
-- tree has the same depth rather than looking half-populated.
INSERT INTO vehicle (id, tenant_id, policy_id, vin, year, make, model, primary_use, annual_km, ownership, winter_tires) VALUES
 ('7e000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000002','3FA6P0H73HR100002',2018,'Ford','Fusion','commute',16000,'owned',true),
 ('7e000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000003','5YJ3E1EA7KF100003',2021,'Tesla','Model 3','commute',22000,'financed',true),
 ('7e000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000004','2T3H1RFV8LC100004',2020,'Toyota','RAV4','pleasure',12000,'owned',true)
ON CONFLICT DO NOTHING;

INSERT INTO coverage (tenant_id, policy_id, vehicle_id, csio_code, description, limit_amount, deductible, premium) VALUES
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000002','7e000000-0000-0000-0000-000000000002','TPL','Third Party Liability',1000000.00,NULL,760.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000002','7e000000-0000-0000-0000-000000000002','DCPD','Direct Compensation — Property Damage',NULL,0.00,210.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000002','7e000000-0000-0000-0000-000000000002','COLL','Collision',NULL,1000.00,470.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000003','7e000000-0000-0000-0000-000000000003','TPL','Third Party Liability',2000000.00,NULL,880.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000003','7e000000-0000-0000-0000-000000000003','COLL','Collision',NULL,500.00,640.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000003','7e000000-0000-0000-0000-000000000003','COMP','Comprehensive',NULL,500.00,460.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000004','7e000000-0000-0000-0000-000000000004','TPL','Third Party Liability',2000000.00,NULL,1020.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000004','7e000000-0000-0000-0000-000000000004','COLL','Collision',NULL,1000.00,720.00),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000004','7e000000-0000-0000-0000-000000000004','COMP','Comprehensive',NULL,1000.00,520.00)
ON CONFLICT DO NOTHING;

INSERT INTO driver_record (tenant_id, party_id, licence_number, licence_class, licence_date, autoplus_consent, at_fault_count) VALUES
 ('11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000002','G2100-11111-22222','G','2014-08-02',true,0),
 ('11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000003','M3300-33333-44444','G','2009-11-19',true,1),
 ('11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000004','K4400-55555-66666','G','2008-05-30',true,0),
 ('11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000014','K4400-77777-88888','G','2012-09-14',true,0)
ON CONFLICT DO NOTHING;

INSERT INTO policy_endorsement (tenant_id, policy_id, form_code, description, premium, effective_date) VALUES
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000024','SEF/HOM 43','Guaranteed replacement cost on the dwelling',0.00,'2026-01-10'),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000024','WATER PKG','Combined sewer backup + overland water package',430.00,'2026-01-10')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Document templates for the proofs hub. Merge fields are {{snake_case}} and
-- are filled by the API from policy / account / party data at issue time.
-- Form editions matter in Ontario, hence effective_from + version.
-- ----------------------------------------------------------------------------
INSERT INTO document_template (id, tenant_id, code, name, body, version, effective_from) VALUES
 ('7e110000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
  'PINK_SLIP','Ontario liability slip (pink card)',
E'ONTARIO MOTOR VEHICLE LIABILITY INSURANCE CARD\n\n'
'Insurer: {{carrier_name}}\n'
'Policy number: {{policy_number}}\n'
'Named insured: {{insured_name}}\n'
'Address: {{insured_address}}\n\n'
'Effective: {{effective_date}}    Expires: {{expiry_date}}\n\n'
'Vehicle(s):\n{{vehicles}}\n\n'
'This card is evidence that the policy shown is in force on the dates stated.\n'
'Issued by {{brokerage_name}} on {{issued_on}}.',
  1,'2026-01-01'),

 ('7e110000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',
  'BINDER_LETTER','Evidence of property insurance (lender)',
E'EVIDENCE OF PROPERTY INSURANCE\n\n'
'To: {{issued_to}}\n'
'Date: {{issued_on}}\n\n'
'This confirms that {{brokerage_name}} has placed the following coverage:\n\n'
'Named insured: {{insured_name}}\n'
'Risk address: {{insured_address}}\n'
'Insurer: {{carrier_name}}\n'
'Policy number: {{policy_number}}\n'
'Policy period: {{effective_date}} to {{expiry_date}}\n\n'
'Coverages in force:\n{{coverages}}\n\n'
'The insurer will endeavour to provide notice of cancellation in accordance\n'
'with the policy terms and the Insurance Act (Ontario).',
  1,'2026-01-01'),

 ('7e110000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111',
  'LOE','Letter of experience',
E'LETTER OF EXPERIENCE\n\n'
'Date: {{issued_on}}\n'
'Re: {{insured_name}} ({{lookup_code}})\n\n'
'{{brokerage_name}} confirms the following insurance history:\n\n'
'Insurer: {{carrier_name}}\n'
'Policy number: {{policy_number}}\n'
'Continuously insured from: {{effective_date}}\n\n'
'Loss history:\n{{loss_history}}\n\n'
'Issued at the request of the named insured for the purpose of establishing\n'
'prior insurance experience.',
  1,'2026-01-01')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Accounting. Trust and general are separate books; entries are immutable once
-- posted and a correction is a reversing entry, never an edit. Trust surplus
-- must never go negative — a shortfall is a RIBO reportable event.
-- ============================================================================
INSERT INTO ledger_account (id, tenant_id, book, code, name, type) VALUES
 ('1a000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','trust','1000','Trust bank — premium','asset'),
 ('1a000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','trust','2000','Premiums payable to carriers','liability'),
 ('1a000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','general','1100','Operating bank','asset'),
 ('1a000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','general','4000','Commission revenue','revenue'),
 ('1a000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','general','1200','Commissions receivable','asset')
ON CONFLICT DO NOTHING;

-- Premium receipt from the Kapoor household (trust book).
INSERT INTO journal_entry (id, tenant_id, book, reference, description, entry_date) VALUES
 ('1e000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','trust','RCP-4401','Premium receipt — Kapoor home + auto', current_date - 21)
ON CONFLICT DO NOTHING;
INSERT INTO journal_line (tenant_id, entry_id, account_id, party_account_id, debit, credit) VALUES
 ('11111111-1111-1111-1111-111111111111','1e000000-0000-0000-0000-000000000001','1a000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000004',4300.00,0),
 ('11111111-1111-1111-1111-111111111111','1e000000-0000-0000-0000-000000000001','1a000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000004',0,4300.00)
ON CONFLICT DO NOTHING;
UPDATE journal_entry SET posted=true WHERE id='1e000000-0000-0000-0000-000000000001';

-- Remittance to the carrier (trust book) — money leaves trust.
INSERT INTO journal_entry (id, tenant_id, book, reference, description, entry_date) VALUES
 ('1e000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','trust','REM-2210','Remittance to Pembridge — January statement', current_date - 12)
ON CONFLICT DO NOTHING;
-- The liability line carries party_account_id so the trust sub-ledger ties
-- back to the control account. An unattributed remittance would leave "held
-- for each client" out of balance with total premiums payable — precisely
-- what a RIBO spot check looks for.
INSERT INTO journal_line (tenant_id, entry_id, account_id, party_account_id, debit, credit) VALUES
 ('11111111-1111-1111-1111-111111111111','1e000000-0000-0000-0000-000000000002','1a000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000004',3100.00,0),
 ('11111111-1111-1111-1111-111111111111','1e000000-0000-0000-0000-000000000002','1a000000-0000-0000-0000-000000000001',NULL,0,3100.00)
ON CONFLICT DO NOTHING;
UPDATE journal_entry SET posted=true WHERE id='1e000000-0000-0000-0000-000000000002';

-- Premium receipt from Mehta.
INSERT INTO journal_entry (id, tenant_id, book, reference, description, entry_date) VALUES
 ('1e000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','trust','RCP-4408','Premium receipt — Mehta auto + tenant', current_date - 5)
ON CONFLICT DO NOTHING;
INSERT INTO journal_line (tenant_id, entry_id, account_id, party_account_id, debit, credit) VALUES
 ('11111111-1111-1111-1111-111111111111','1e000000-0000-0000-0000-000000000003','1a000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003',2300.00,0),
 ('11111111-1111-1111-1111-111111111111','1e000000-0000-0000-0000-000000000003','1a000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003',0,2300.00)
ON CONFLICT DO NOTHING;
UPDATE journal_entry SET posted=true WHERE id='1e000000-0000-0000-0000-000000000003';

-- Commission reconciliation: expected vs received per carrier statement.
INSERT INTO commission_entry (tenant_id, policy_id, carrier_id, period, expected, received, status) VALUES
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001', date_trunc('month', current_date - interval '1 month')::date, 267.50, 267.50,'matched'),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000001', date_trunc('month', current_date - interval '1 month')::date, 307.50, 246.00,'variance'),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000024','c0000000-0000-0000-0000-000000000001', date_trunc('month', current_date - interval '1 month')::date, 368.00, NULL,'open'),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002', date_trunc('month', current_date - interval '1 month')::date, 215.00, 215.00,'matched'),
 ('11111111-1111-1111-1111-111111111111','90000000-0000-0000-0000-000000000013','c0000000-0000-0000-0000-000000000002', date_trunc('month', current_date - interval '1 month')::date, 48.00, NULL,'open')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Claims. Intake and carrier referral only — the carrier is the system of
-- record for adjudication; we track that the loss was reported, to whom, and
-- what came back. The FNOL is a transaction like everything else.
-- ============================================================================
INSERT INTO txn (id, tenant_id, reference, txn_type, account_id, policy_id, carrier_id, state, reason, effective_date, owner_id, opened_at) VALUES
 ('d0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','TXN-3070','claim_fnol',
  'a0000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000001',
  'submitted','Rear-ended at a stop light — not at fault','2026-07-18',
  '50000000-0000-0000-0000-000000000001', now() - interval '11 days')
ON CONFLICT DO NOTHING;

INSERT INTO txn_event (tenant_id, txn_id, from_state, to_state, actor, at) VALUES
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000004',NULL,'draft','Gautam Khosla', now() - interval '11 days'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000004','draft','doc_generated','Gautam Khosla', now() - interval '11 days' + interval '15 minutes'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000004','doc_generated','sig_pending','Gautam Khosla', now() - interval '11 days' + interval '30 minutes'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000004','sig_pending','signed','Gautam Khosla', now() - interval '10 days'),
 ('11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000004','signed','submitted','Gautam Khosla', now() - interval '10 days')
ON CONFLICT DO NOTHING;

INSERT INTO claim (id, tenant_id, account_id, policy_id, txn_id, carrier_id, claim_number,
                   loss_date, reported_date, status, adjuster, reserve, paid) VALUES
 ('c1a00000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
  'a0000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000001',
  'PEMB-CL-88214','2026-07-18','2026-07-18','in_progress','J. Whitfield, Pembridge Claims',8500.00,0.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Market availability — what we can place, with whom, and how each carrier is
-- actually reached. The realistic hybrid: some rater, some portal, some email.
-- These are PENDING appointments (active=false) until real contracts land; the
-- CarrierAdapter runs on deterministic mock data until then (invariant 7).
-- ============================================================================
INSERT INTO market_availability (tenant_id, carrier_id, line, broker_code, commission_rate,
                                 quote_channel, submit_channel, download_channel, fnol_routing, active) VALUES
 ('11111111-1111-1111-1111-111111111111','c0000000-0000-0000-0000-000000000001','auto','INS-PEMB-01',0.1250,
  'rater','portal','csio_edocs','{"phone":"1-800-555-0110","email":"claims@pembridge.example"}',false),
 ('11111111-1111-1111-1111-111111111111','c0000000-0000-0000-0000-000000000001','property','INS-PEMB-01',0.2000,
  'rater','portal','csio_edocs','{"phone":"1-800-555-0110"}',false),
 ('11111111-1111-1111-1111-111111111111','c0000000-0000-0000-0000-000000000002','auto','INS-GORE-04',0.1250,
  'portal','secure_delivery','csio_edocs','{"phone":"1-800-555-0220"}',false),
 ('11111111-1111-1111-1111-111111111111','c0000000-0000-0000-0000-000000000002','tenant','INS-GORE-04',0.2000,
  'portal','email','none','{"phone":"1-800-555-0220"}',false)
ON CONFLICT DO NOTHING;

SELECT 'seed complete' AS result;
