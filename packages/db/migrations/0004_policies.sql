-- ============================================================================
-- 0004_policies.sql
-- Policy header, structured coverages (never PDF-only), risk subtypes
-- (vehicle, dwelling), driver records, and Ontario-specific elections
-- (OPCF 47R, SABS optional benefits, DCPD opt-out).
-- ============================================================================

CREATE TABLE policy (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    branch_id       uuid REFERENCES branch(id),      -- re-taggable, not locked
    account_id      uuid NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    carrier_id      uuid REFERENCES carrier(id),
    policy_number   text,
    line            text NOT NULL CHECK (line IN
                    ('auto','property','tenant','condo','umbrella','commercial','life')),
    status          text NOT NULL DEFAULT 'quoted' CHECK (status IN
                    ('quoted','bound','in_force','cancelled','lapsed','expired')),
    effective_date  date,
    expiry_date     date,
    billing_type    text CHECK (billing_type IN ('agency','direct')),
    payment_plan    text,                            -- 'monthly PAD','annual', ...
    annual_premium  numeric(12,2),
    commission_rate numeric(6,4),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, carrier_id, policy_number)
);
CREATE INDEX ON policy (tenant_id, account_id);
CREATE INDEX ON policy (tenant_id, expiry_date);      -- renewal queue

-- ----------------------------------------------------------------------------
-- Risk: vehicle. VIN, use, garaging, telematics consent.
-- ----------------------------------------------------------------------------
CREATE TABLE vehicle (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    policy_id       uuid NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    vin             text,
    year            int,
    make            text,
    model           text,
    primary_use     text CHECK (primary_use IN ('pleasure','commute','business','farm')),
    annual_km       int,
    ownership       text CHECK (ownership IN ('owned','leased','financed')),
    lienholder_party uuid REFERENCES party(id),       -- additional interest
    garaging_address jsonb,
    winter_tires    boolean,
    telematics_program text,
    telematics_consent boolean DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Risk: dwelling (home / tenant / condo).
-- ----------------------------------------------------------------------------
CREATE TABLE dwelling (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    policy_id       uuid NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    address         jsonb,
    year_built      int,
    construction    text,
    roof_age        int,
    heating         text,
    has_knob_tube   boolean,
    has_oil_tank    boolean,
    replacement_cost numeric(12,2),                   -- ITV value
    occupancy       text CHECK (occupancy IN ('owner','tenant','seasonal','rented')),
    mortgagee_party uuid REFERENCES party(id),        -- additional interest
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Coverage: structured, per policy (and optionally per risk). CSIO codes,
-- limits, deductibles, premium component, and attached OPCF/SEF endorsements.
-- ----------------------------------------------------------------------------
CREATE TABLE coverage (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    policy_id       uuid NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    vehicle_id      uuid REFERENCES vehicle(id) ON DELETE CASCADE,
    dwelling_id     uuid REFERENCES dwelling(id) ON DELETE CASCADE,
    csio_code       text,                            -- coverage code (no Z-codes)
    description     text NOT NULL,
    limit_amount    numeric(12,2),
    deductible      numeric(12,2),
    premium         numeric(12,2),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Endorsements attached to an auto policy: OPCF 20, 27, 43R, 44R, 47R, etc.
-- Modelled as first-class, premium-bearing rows — the gap Epic leaves open.
CREATE TABLE policy_endorsement (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    policy_id       uuid NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    form_code       text NOT NULL,                   -- 'OPCF 47R','OPCF 20', ...
    description     text,
    premium         numeric(12,2),
    effective_date  date,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Ontario auto elections. Post-July-1-2026 reform: most SABS benefits become
-- optional and must be captured per person; plus DCPD opt-out and OPCF 47R.
-- ----------------------------------------------------------------------------
CREATE TABLE ontario_auto_election (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    policy_id       uuid NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    opcf_47r_signed boolean NOT NULL DEFAULT false,
    dcpd_opt_out    boolean NOT NULL DEFAULT false,
    -- SABS optional benefit elections captured as jsonb keyed by person + benefit
    -- e.g. {"party_uuid": {"income_replacement": true, "caregiver": false, ...}}
    sabs_elections  jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (policy_id)
);

-- ----------------------------------------------------------------------------
-- Driver record. Abstract/AutoPlus pulls with consent logging (Ontario).
-- ----------------------------------------------------------------------------
CREATE TABLE driver_record (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    party_id        uuid NOT NULL REFERENCES party(id) ON DELETE CASCADE,
    licence_number  text,
    licence_class   text,
    licence_date    date,
    autoplus_consent boolean NOT NULL DEFAULT false,
    autoplus_pulled_at timestamptz,
    at_fault_count  int NOT NULL DEFAULT 0,
    convictions     jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_touch BEFORE UPDATE ON policy               FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON vehicle              FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON dwelling             FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON coverage             FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON policy_endorsement   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON ontario_auto_election FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON driver_record        FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

SELECT enable_tenant_table('policy');
SELECT enable_tenant_table('vehicle');
SELECT enable_tenant_table('dwelling');
SELECT enable_tenant_table('coverage');
SELECT enable_tenant_table('policy_endorsement');
SELECT enable_tenant_table('ontario_auto_election');
SELECT enable_tenant_table('driver_record');
