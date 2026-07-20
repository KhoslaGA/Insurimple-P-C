-- Deterministic seed (invariant #7: mock data is first-class).
--
-- Fixed UUIDs, not gen_random_uuid(): tests assert against these ids, and a
-- re-seed must produce the identical database. Carriers are flagged
-- is_fixture so nothing here can be mistaken for a live appointment.
--
-- Two tenants on purpose. One tenant cannot demonstrate isolation — the whole
-- point is that Northpeak must never see Rideau's rows.
--
-- Content mirrors the `PC Policies.dc.html` prototype (Amara Okonkwo's
-- household, AUTO + TENA) so the screens have the data they were designed for.

BEGIN;

-- ---------------------------------------------------------------- tenants --
INSERT INTO tenants (id, slug, name) VALUES
  ('11111111-1111-4111-8111-111111111111', 'northpeak', 'NorthPeak Insurance'),
  ('22222222-2222-4222-8222-222222222222', 'rideau',    'Rideau Valley Brokers')
ON CONFLICT (id) DO NOTHING;

-- Northpeak sells P&C and life. Rideau sells P&C only — so a life bind at
-- Rideau must fail on entitlement even for a licensed user.
INSERT INTO tenant_modules (tenant_id, module_code, active) VALUES
  ('11111111-1111-4111-8111-111111111111', 'pc',   true),
  ('11111111-1111-4111-8111-111111111111', 'life', true),
  ('22222222-2222-4222-8222-222222222222', 'pc',   true)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------ users --
INSERT INTO users (id, tenant_id, clerk_user_id, full_name, email) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'user_np_broker', 'Maya Lawson',   'maya@northpeak.example'),
  ('aaaaaaaa-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'user_np_life',   'Owen Tremblay', 'owen@northpeak.example'),
  ('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
   'user_rv_broker', 'Sasha Roy',     'sasha@rideau.example')
ON CONFLICT (id) DO NOTHING;

-- Licences. Maya is RIBO (P&C). Owen holds LLQP only — he is the invariant #3
-- test subject: licensed to sell life, must be refused a P&C bind.
-- Sasha's RIBO licence is EXPIRED, proving expiry is load-bearing on its own.
INSERT INTO licences (id, tenant_id, user_id, class_code, licence_number, issued_on, expires_on) VALUES
  ('cccccccc-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'aaaaaaaa-0000-4000-8000-000000000001', 'ribo', 'RIBO-118422',
   DATE '2024-01-01', DATE '2030-12-31'),
  ('cccccccc-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'aaaaaaaa-0000-4000-8000-000000000002', 'llqp', 'LLQP-994001',
   DATE '2024-01-01', DATE '2030-12-31'),
  ('cccccccc-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222',
   'bbbbbbbb-0000-4000-8000-000000000001', 'ribo', 'RIBO-220015',
   DATE '2020-01-01', DATE '2024-06-30')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------- carriers --
INSERT INTO carriers (id, tenant_id, name, code, is_fixture) VALUES
  ('dddddddd-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'True North P&C', 'TNPC-1', true),
  ('dddddddd-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'Maple Mutual',   'MM-2',   true),
  ('dddddddd-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222',
   'Rideau Mutual',  'RM-1',   true)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------- household --
INSERT INTO households (id, tenant_id, display_name, client_code, status) VALUES
  ('eeeeeeee-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Okonkwo / Mensah household', 'OKON-0042', 'active'),
  ('eeeeeeee-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
   'Tremblay household', 'TREM-0007', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO addresses (id, tenant_id, household_id, kind, line1, city, province, postal_code) VALUES
  ('ffffffff-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'eeeeeeee-0000-4000-8000-000000000001', 'mailing',
   '42 Sunnybrae Crescent', 'Brampton', 'ON', 'L6Y 2T6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO parties (id, tenant_id, household_id, first_name, last_name, date_of_birth,
                     email, phone, role_in_household, casl_consent_at, casl_consent_source) VALUES
  ('a1a1a1a1-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'eeeeeeee-0000-4000-8000-000000000001', 'Amara', 'Okonkwo', DATE '1989-03-14',
   'amara@example.com', '+1-905-555-0142', 'primary',
   TIMESTAMPTZ '2025-12-17 14:02:00-05', 'Web quote form'),
  ('a1a1a1a1-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'eeeeeeee-0000-4000-8000-000000000001', 'Daniel', 'Mensah', DATE '1987-11-02',
   NULL, NULL, 'spouse', NULL, NULL),
  ('b1b1b1b1-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
   'eeeeeeee-0000-4000-8000-000000000002', 'Luc', 'Tremblay', DATE '1979-06-21',
   'luc@example.com', '+1-613-555-0199', 'primary', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------- policies --
INSERT INTO policies (id, tenant_id, household_id, carrier_id, line_code, policy_number,
                      description, status, effective_date, expiry_date, bill_type, source,
                      premium_cents, estimated_premium_cents, commission_rate, commission_cents,
                      agency_balance_cents, invoice_to, comment) VALUES
  ('0a0a0a0a-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'eeeeeeee-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001',
   'AUTO', 'A21677149PLA', 'Personal automobile', 'in_force',
   DATE '2025-12-24', DATE '2026-12-24', 'direct', 'Broker download',
   407315, 550400, 0.1200, 48900, 0,
   'Client — 42 Sunnybrae Crescent, Brampton ON',
   'Line note: moved from prospect file Dec 17, 2025. Two drivers, two vehicles rated.'),
  ('0a0a0a0a-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'eeeeeeee-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000002',
   'TENA', 'P21677148HAB', 'Tenants package', 'in_force',
   DATE '2025-12-24', DATE '2026-12-24', 'direct', 'Broker download',
   46388, 46388, 0.2000, 9278, 0,
   'Client — 42 Sunnybrae Crescent, Brampton ON', NULL),
  ('0b0b0b0b-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
   'eeeeeeee-0000-4000-8000-000000000002', 'dddddddd-0000-4000-8000-000000000003',
   'HOME', 'RM-556677', 'Homeowners', 'in_force',
   DATE '2026-03-01', DATE '2027-03-01', 'agency', 'Manual entry',
   132000, 132000, 0.1500, 19800, 0, 'Client', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO drivers (tenant_id, policy_id, party_id, full_name, licence_number,
                     date_of_birth, licence_class, driver_role) VALUES
  ('11111111-1111-4111-8111-111111111111', '0a0a0a0a-0000-4000-8000-000000000001',
   'a1a1a1a1-0000-4000-8000-000000000001', 'Amara Okonkwo', 'O1234-56789-01234',
   DATE '1989-03-14', 'G', 'principal'),
  ('11111111-1111-4111-8111-111111111111', '0a0a0a0a-0000-4000-8000-000000000001',
   'a1a1a1a1-0000-4000-8000-000000000002', 'Daniel Mensah', 'M9876-54321-09876',
   DATE '1987-11-02', 'G', 'occasional');

INSERT INTO vehicles (tenant_id, policy_id, model_year, make, model, trim, vin,
                      use_type, annual_km, coverage_summary) VALUES
  ('11111111-1111-4111-8111-111111111111', '0a0a0a0a-0000-4000-8000-000000000001',
   2022, 'Toyota', 'RAV4', 'XLE', '2T3P1RFV5NW123456', 'commute', 16000,
   'Full — collision + comprehensive'),
  ('11111111-1111-4111-8111-111111111111', '0a0a0a0a-0000-4000-8000-000000000001',
   2018, 'Honda', 'Civic', 'LX', '2HGFC2F59JH123456', 'pleasure', 8000,
   'Liability only');

INSERT INTO locations (tenant_id, policy_id, address_id, occupancy, dwelling_type,
                       year_built, construction, heating) VALUES
  ('11111111-1111-4111-8111-111111111111', '0a0a0a0a-0000-4000-8000-000000000002',
   'ffffffff-0000-4000-8000-000000000001', 'tenant', 'Low-rise apartment unit',
   2008, 'Masonry', 'Forced air — gas');

/* Transactions. Seeded as owner, which bypasses the app role's grants but NOT
   the state-machine trigger — so these rows still had to pass the no-bind
   guard, exactly like production writes. */
SELECT set_config('app.current_tenant', '11111111-1111-4111-8111-111111111111', true);
SELECT set_config('app.current_user',   'aaaaaaaa-0000-4000-8000-000000000001', true);

INSERT INTO transactions (tenant_id, household_id, policy_id, line_code, type_code,
                          seq, description, state, effective_date, created_by) VALUES
  ('11111111-1111-4111-8111-111111111111', 'eeeeeeee-0000-4000-8000-000000000001',
   '0a0a0a0a-0000-4000-8000-000000000001', 'AUTO', 'new_business',
   10, 'Policy bound — moved from prospect', 'completed', DATE '2025-12-24',
   'aaaaaaaa-0000-4000-8000-000000000001'),
  ('11111111-1111-4111-8111-111111111111', 'eeeeeeee-0000-4000-8000-000000000001',
   '0a0a0a0a-0000-4000-8000-000000000001', 'AUTO', 'renewal',
   11, 'Renewal offer generated', 'draft', NULL,
   'aaaaaaaa-0000-4000-8000-000000000001'),
  ('11111111-1111-4111-8111-111111111111', 'eeeeeeee-0000-4000-8000-000000000001',
   '0a0a0a0a-0000-4000-8000-000000000001', 'AUTO', 'endorsement',
   12, 'EFT payment method updated', 'issued', DATE '2026-06-29',
   'aaaaaaaa-0000-4000-8000-000000000001');

COMMIT;
