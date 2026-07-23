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
  '240517202','auto','in_force','2025-06-24','2026-06-24','agency','monthly PAD',2140.00)
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
-- Diary / abeyances so the CSR "My day" queue has real content. Owner = Gautam.
-- ----------------------------------------------------------------------------
INSERT INTO activity (tenant_id, account_id, policy_id, txn_id, activity_type, title, body, owner_id, priority, status, due_at, sla_breached) VALUES
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','follow_up','Chase Pembridge — cancellation acknowledgement','Submitted 5 days ago, no ack yet. Confirm flat-rate effective date.','50000000-0000-0000-0000-000000000001','high','open', now() + interval '2 days', false),
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000002','90000000-0000-0000-0000-000000000002',NULL,'renew','Renewal review — Amrit Gill (expires Sep 1)','Auto renewal at Gore Mutual. Check for premium increase before offer goes out.','50000000-0000-0000-0000-000000000001','medium','open', now() + interval '9 days', false),
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000013',NULL,'edoc_received','eDoc received — tenant policy confirmation','Auto-filed from CSIOnet. Review and close.','50000000-0000-0000-0000-000000000001','low','open', now() + interval '1 day', false),
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000004','90000000-0000-0000-0000-000000000004',NULL,'compliance_note','Verify OPCF 47R on file — Kapoor auto','SABS optionality: confirm signed 47R before the reform effective date.','50000000-0000-0000-0000-000000000001','high','open', now() + interval '3 days', false),
 ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000005',NULL,NULL,'follow_up','Prospect follow-up — Gurpreet Sandhu quote','Quoted auto at $2,010. Follow up on bind decision.','50000000-0000-0000-0000-000000000001','high','open', now() - interval '2 days', true)
ON CONFLICT DO NOTHING;

SELECT 'seed complete' AS result;
