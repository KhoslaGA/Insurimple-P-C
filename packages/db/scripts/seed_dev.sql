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

INSERT INTO policy (id, tenant_id, account_id, carrier_id, policy_number, line, status, effective_date, annual_premium) VALUES
 ('90000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
  'a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',
  '240517202','auto','in_force','2025-06-24',2140.00)
ON CONFLICT DO NOTHING;

SELECT 'seed complete' AS result;
