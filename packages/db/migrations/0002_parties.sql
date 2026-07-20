-- ============================================================================
-- 0002_parties.sql
-- Party model (client, driver, additional interest, vendor), households,
-- typed party relationships, and CASL consent (rider #1 from the uploads).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Household / Account. Groups parties who share a book (auto + home bundle).
-- Retention and lifetime value roll up here. This is the level at which
-- "1.3 policies per account" is measured.
-- ----------------------------------------------------------------------------
CREATE TABLE account (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    branch_id       uuid REFERENCES branch(id),
    lookup_code     text,                        -- Epic-style, e.g. 'ABTAHISE01'
    display_name    text NOT NULL,
    kind            text NOT NULL DEFAULT 'personal'
                    CHECK (kind IN ('personal','commercial','benefits')),
    status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('prospect','active','review','cancelling','lapsed','closed')),
    source          text,                        -- attribution, e.g. 'toprates.ca'
    confidential    boolean NOT NULL DEFAULT false,   -- restricted-access flag
    servicing_broker uuid REFERENCES staff(id),
    servicing_csr    uuid REFERENCES staff(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, lookup_code)
);

-- ----------------------------------------------------------------------------
-- Party — the root entity. A party can be a person or an organization and can
-- play multiple roles (a named insured who is also a driver). Roles are
-- expressed by links (account_party, policy driver rows), not by subtype tables,
-- so one person is never duplicated.
-- ----------------------------------------------------------------------------
CREATE TABLE party (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    party_type      text NOT NULL CHECK (party_type IN ('person','organization')),
    -- person fields
    first_name      text,
    last_name       text,
    date_of_birth   date,
    -- organization fields
    legal_name      text,
    business_number text,
    -- shared
    email           text,
    phone           text,
    address         jsonb,
    language        text NOT NULL DEFAULT 'en' CHECK (language IN ('en','fr')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CHECK (
        (party_type = 'person' AND last_name IS NOT NULL) OR
        (party_type = 'organization' AND legal_name IS NOT NULL)
    )
);
CREATE INDEX ON party (tenant_id, last_name);
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_trgm') THEN
        CREATE INDEX ON party USING gin (
            (coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(legal_name,'')) gin_trgm_ops
        );
    END IF;
END $$;

-- A party's link to an account, with the role it plays there.
CREATE TABLE account_party (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    account_id      uuid NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    party_id        uuid NOT NULL REFERENCES party(id),
    role            text NOT NULL CHECK (role IN
                    ('named_insured','co_insured','driver','contact','payer')),
    is_primary      boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (account_id, party_id, role)
);

-- ----------------------------------------------------------------------------
-- Rider: typed party relationships (the Epic "Relationships" grid). Directed
-- edges between parties: director_of, spouse_of, parent_company_of, etc.
-- ----------------------------------------------------------------------------
CREATE TABLE party_relationship (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    from_party_id   uuid NOT NULL REFERENCES party(id) ON DELETE CASCADE,
    to_party_id     uuid NOT NULL REFERENCES party(id) ON DELETE CASCADE,
    relationship    text NOT NULL CHECK (relationship IN
                    ('spouse_of','parent_of','child_of','director_of','officer_of',
                     'parent_company_of','subsidiary_of','related_account')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CHECK (from_party_id <> to_party_id),
    UNIQUE (from_party_id, to_party_id, relationship)
);

-- ----------------------------------------------------------------------------
-- Rider: CASL consent, per channel. The uploaded Epic screen showed
-- "Permission: Did Not Obtain" and "Marketing Opt-Out: N" — legally required
-- and absent from a records-only model. Consent rides on the party.
-- ----------------------------------------------------------------------------
CREATE TABLE consent (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    party_id        uuid NOT NULL REFERENCES party(id) ON DELETE CASCADE,
    channel         text NOT NULL CHECK (channel IN ('email','phone','sms','mail')),
    basis           text NOT NULL CHECK (basis IN
                    ('express','implied','did_not_obtain','withdrawn')),
    captured_at     timestamptz,
    source          text,                        -- how consent was obtained
    expires_at      timestamptz,                 -- implied consent has a clock
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (party_id, channel)
);

CREATE TRIGGER trg_touch BEFORE UPDATE ON account            FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON party              FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON account_party      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON party_relationship FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON consent            FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

SELECT enable_tenant_table('account');
SELECT enable_tenant_table('party');
SELECT enable_tenant_table('account_party');
SELECT enable_tenant_table('party_relationship');
SELECT enable_tenant_table('consent');
