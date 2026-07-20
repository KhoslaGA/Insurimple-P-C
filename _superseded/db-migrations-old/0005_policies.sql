-- 0005 — carriers, policies and the risk detail beneath them
--
-- Field vocabulary is taken from the `PC Policies.dc.html` prototype, which
-- deliberately uses Epic's accounting words (agency balance, bill, invoice-to,
-- estimated premium, commission) so brokers moving off Epic recognise them.
-- Money is stored in integer cents; never float.

BEGIN;

CREATE TABLE carriers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  name        text NOT NULL,
  code        text NOT NULL,
  -- Invariant #7: a fixture must never be mistakable for a live carrier
  -- appointment. Structural rather than a naming convention, so the UI can
  -- badge it and reports can exclude it without pattern-matching names.
  is_fixture  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

COMMENT ON COLUMN carriers.is_fixture IS
  'True for seeded/demo carriers. Pre-appointment work builds against these via the CarrierAdapter seam.';

-- Policy lines. AUTO and TENA exist in the prototype; the rest come from
-- docs/pc-leg-page-list.md §2.
CREATE TABLE policy_lines (
  code         text PRIMARY KEY,
  name         text NOT NULL,
  module_code  text NOT NULL REFERENCES modules (code)
);

INSERT INTO policy_lines (code, name, module_code) VALUES
  ('AUTO', 'Personal automobile', 'pc'),
  ('TENA', 'Tenants package',     'pc'),
  ('HOME', 'Homeowners',          'pc'),
  ('COND', 'Condominium',         'pc'),
  ('SEAS', 'Seasonal / secondary','pc'),
  ('UMBR', 'Umbrella / excess',   'pc')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE policies (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  household_id       uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  carrier_id         uuid REFERENCES carriers (id),
  line_code          text NOT NULL REFERENCES policy_lines (code),

  policy_number      text NOT NULL,
  description        text NOT NULL,

  -- Full status set required by docs/pc-leg-page-list.md §10: the prototype
  -- tree only showed a couple of these.
  status             text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'in_force', 'lapsed',
                                         'cancelled', 'remarket_in_progress', 'expired')),

  effective_date     date NOT NULL,
  expiry_date        date NOT NULL,

  bill_type          text NOT NULL DEFAULT 'direct'
                       CHECK (bill_type IN ('direct', 'agency')),
  source             text,

  premium_cents            bigint NOT NULL DEFAULT 0 CHECK (premium_cents >= 0),
  estimated_premium_cents  bigint NOT NULL DEFAULT 0 CHECK (estimated_premium_cents >= 0),
  commission_rate          numeric(5,4) CHECK (commission_rate IS NULL
                                               OR (commission_rate >= 0 AND commission_rate <= 1)),
  commission_cents         bigint NOT NULL DEFAULT 0 CHECK (commission_cents >= 0),
  agency_balance_cents     bigint NOT NULL DEFAULT 0,

  invoice_to         text,
  comment            text,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT policies_term_valid CHECK (expiry_date > effective_date),
  UNIQUE (tenant_id, policy_number)
);

CREATE INDEX policies_household_idx ON policies (tenant_id, household_id);
CREATE INDEX policies_expiry_idx    ON policies (tenant_id, expiry_date)
  WHERE status IN ('in_force', 'remarket_in_progress');

COMMENT ON INDEX policies_expiry_idx IS
  'Partial index for the renewal queue (pc-leg-page-list §3) — only live policies can renew.';

/* Drivers reference a party where one exists: the same human should not be
   duplicated per policy. licence_number is nullable because a driver can be
   listed before their abstract comes back. */
CREATE TABLE drivers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  policy_id       uuid NOT NULL REFERENCES policies (id) ON DELETE CASCADE,
  party_id        uuid REFERENCES parties (id) ON DELETE SET NULL,
  full_name       text NOT NULL,
  licence_number  text,
  date_of_birth   date,
  licence_class   text,
  driver_role     text NOT NULL DEFAULT 'occasional'
                    CHECK (driver_role IN ('principal', 'occasional', 'excluded')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX drivers_policy_idx ON drivers (tenant_id, policy_id);

CREATE TABLE vehicles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  policy_id         uuid NOT NULL REFERENCES policies (id) ON DELETE CASCADE,
  model_year        integer CHECK (model_year BETWEEN 1900 AND 2100),
  make              text NOT NULL,
  model             text NOT NULL,
  trim              text,
  vin               text,
  use_type          text CHECK (use_type IN ('commute', 'pleasure', 'business', 'farm')),
  annual_km         integer CHECK (annual_km IS NULL OR annual_km >= 0),
  coverage_summary  text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vehicles_policy_idx ON vehicles (tenant_id, policy_id);

/* Rated locations for property lines — the dwelling detail editor of
   pc-leg-page-list.md §2. */
CREATE TABLE locations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  policy_id             uuid NOT NULL REFERENCES policies (id) ON DELETE CASCADE,
  address_id            uuid REFERENCES addresses (id) ON DELETE SET NULL,
  occupancy             text CHECK (occupancy IN ('owner_occupied', 'tenant', 'rented_out',
                                                  'seasonal', 'vacant')),
  dwelling_type         text,
  year_built            integer CHECK (year_built BETWEEN 1700 AND 2100),
  construction          text,
  roof_updated_year     integer,
  heating               text,
  distance_to_hydrant_m integer,
  distance_to_hall_km   numeric(5,2),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX locations_policy_idx ON locations (tenant_id, policy_id);

CREATE TABLE additional_interests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  policy_id    uuid NOT NULL REFERENCES policies (id) ON DELETE CASCADE,
  kind         text NOT NULL CHECK (kind IN ('mortgagee', 'lienholder', 'landlord', 'loss_payee')),
  name         text NOT NULL,
  reference    text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX additional_interests_policy_idx ON additional_interests (tenant_id, policy_id);

COMMIT;
