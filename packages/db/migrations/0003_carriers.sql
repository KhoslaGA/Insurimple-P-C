-- ============================================================================
-- 0003_carriers.sql
-- Carrier registry and the brokerage's market availability (appointments),
-- including how each carrier is reached (portal / email / API / CSIO eDocs)
-- so submissions and downloads never re-key connectivity details.
-- ============================================================================

CREATE TABLE carrier (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    name            text NOT NULL,               -- 'Intact', 'Gore Mutual', 'Pembridge'
    csio_code       text,                        -- IBC / CSIO company code
    parent_group    text,                        -- e.g. 'Definity' for 'Economical'
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);

-- What the brokerage can place, and how it connects, per carrier + line.
CREATE TABLE market_availability (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    carrier_id      uuid NOT NULL REFERENCES carrier(id) ON DELETE CASCADE,
    line            text NOT NULL CHECK (line IN
                    ('auto','property','tenant','condo','umbrella','commercial','life')),
    broker_code     text,                        -- our code with this carrier
    commission_rate numeric(6,4),                -- e.g. 0.1250
    -- connectivity: the realistic hybrid — some API, some portal, some email
    quote_channel   text CHECK (quote_channel IN ('csio_json_api','direct_api','rater','portal','manual')),
    submit_channel  text CHECK (submit_channel IN ('csio_json_api','direct_api','portal','secure_delivery','email')),
    download_channel text CHECK (download_channel IN ('csio_edocs','csio_edi','none')),
    fnol_routing    jsonb,                        -- phone/api/email for claims
    active          boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (carrier_id, line)
);

CREATE TRIGGER trg_touch BEFORE UPDATE ON carrier             FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON market_availability FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
SELECT enable_tenant_table('carrier');
SELECT enable_tenant_table('market_availability');
