-- 0004 — households and parties
--
-- The prototype is household-centric: the record you open is the household, and
-- policies hang off it. Parties are the people within it. Modelled that way
-- rather than contact-first, to match `PC Policies.dc.html` and
-- `docs/pc-leg-page-list.md` §1.

BEGIN;

CREATE TABLE households (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  display_name  text NOT NULL,
  -- Epic-style client code, shown in the record header.
  client_code   text,
  status        text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'prospect', 'inactive')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, client_code)
);

CREATE INDEX households_tenant_idx ON households (tenant_id);

CREATE TABLE addresses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  household_id  uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  kind          text NOT NULL DEFAULT 'mailing'
                  CHECK (kind IN ('mailing', 'risk', 'billing')),
  line1         text NOT NULL,
  line2         text,
  city          text NOT NULL,
  province      text NOT NULL DEFAULT 'ON',
  postal_code   text NOT NULL,
  country       text NOT NULL DEFAULT 'CA',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX addresses_household_idx ON addresses (tenant_id, household_id);

CREATE TABLE parties (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  household_id        uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  first_name          text NOT NULL,
  last_name           text NOT NULL,
  date_of_birth       date,
  email               citext,
  phone               text,
  role_in_household   text NOT NULL DEFAULT 'member'
                        CHECK (role_in_household IN ('primary', 'spouse', 'member', 'dependent')),
  -- CASL requires evidence of consent, not an assumption of it.
  casl_consent_at     timestamptz,
  casl_consent_source text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX parties_household_idx ON parties (tenant_id, household_id);

COMMENT ON COLUMN parties.casl_consent_at IS
  'NULL means no consent evidence on file — treat as no consent, never as implied.';

COMMIT;
