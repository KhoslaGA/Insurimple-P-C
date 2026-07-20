-- ============================================================================
-- 0006_activities.sql
-- The E&O / servicing backbone: activities (diary/SLA), quote logs
-- (Take-All-Comers), disclosure records, loss history / Letter of Experience
-- (rider #4 — feeds remarketing), and claims.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Activity / diary. Typed tasks with SLA clocks and owners. Auto-created off
-- txn stages. This is the E&O trail AND the servicing workflow.
-- Design lesson from Epic: gate activities to stages that need documentation,
-- and make the *body* searchable (Epic only searches titles).
-- ----------------------------------------------------------------------------
CREATE TABLE activity (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    account_id      uuid REFERENCES account(id) ON DELETE CASCADE,
    policy_id       uuid REFERENCES policy(id),
    txn_id          uuid REFERENCES txn(id),
    activity_type   text NOT NULL CHECK (activity_type IN
                    ('quote','bind','endorse','renew','cancel','claim_fnol','payment',
                     'nsf','suitability_review','disclosure_sent','edoc_received',
                     'compliance_note','follow_up')),
    title           text NOT NULL,
    body            text,                            -- full-text searchable
    owner_id        uuid REFERENCES staff(id),
    priority        text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
    status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','snoozed','void')),
    due_at          timestamptz,
    sla_breached    boolean NOT NULL DEFAULT false,
    completed_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON activity (tenant_id, status, due_at);
CREATE INDEX ON activity (tenant_id, account_id);
-- full-text over title + body (the thing Epic can't do)
CREATE INDEX ON activity USING gin (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,''))
);

-- ----------------------------------------------------------------------------
-- Quote log. Every market quoted, with rationale — the Take-All-Comers audit
-- trail. Written on every quote and every renewal, automatically.
-- ----------------------------------------------------------------------------
CREATE TABLE quote_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    account_id      uuid NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    txn_id          uuid REFERENCES txn(id),
    carrier_id      uuid REFERENCES carrier(id),
    line            text,
    quoted_premium  numeric(12,2),
    outcome         text CHECK (outcome IN ('selected','declined_by_carrier','not_selected','no_quote')),
    rationale       text,
    quoted_at       timestamptz NOT NULL DEFAULT now(),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON quote_log (tenant_id, account_id);

-- ----------------------------------------------------------------------------
-- Disclosure records. Mandatory RIBO disclosures (commissions, conflicts) with
-- delivery method + timestamp, per new-business transaction.
-- ----------------------------------------------------------------------------
CREATE TABLE disclosure_record (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    account_id      uuid NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    txn_id          uuid REFERENCES txn(id),
    disclosure_type text NOT NULL,                   -- 'commission','conflict','fee'
    delivery_method text CHECK (delivery_method IN ('email','portal','paper','verbal')),
    delivered_at    timestamptz,
    acknowledged_at timestamptz,
    document_id     uuid REFERENCES document(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Rider: loss history / Letter of Experience. The Economical letter in the
-- uploads is exactly this — claims history + at-fault + years insured. It's
-- what powers renewal remarketing; without it, remarketing a flagged renewal
-- is impossible.
-- ----------------------------------------------------------------------------
CREATE TABLE loss_history (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    party_id        uuid REFERENCES party(id) ON DELETE CASCADE,
    policy_id       uuid REFERENCES policy(id),
    carrier_id      uuid REFERENCES carrier(id),
    insured_from    date,
    insured_to      date,                            -- null = present
    loss_date       date,
    loss_type       text,                            -- 'Collision','Water', ...
    at_fault        boolean,
    amount          numeric(12,2),
    source_document uuid REFERENCES document(id),     -- the LoE PDF
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON loss_history (tenant_id, party_id);

-- ----------------------------------------------------------------------------
-- Claims. FNOL + tracking; carrier is usually system of record, data flows in.
-- A claim is opened by a claim_fnol txn and tracked here.
-- ----------------------------------------------------------------------------
CREATE TABLE claim (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    account_id      uuid NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    policy_id       uuid REFERENCES policy(id),
    txn_id          uuid REFERENCES txn(id),          -- the FNOL transaction
    carrier_id      uuid REFERENCES carrier(id),
    claim_number    text,
    loss_date       date,
    reported_date   date,
    status          text NOT NULL DEFAULT 'open' CHECK (status IN
                    ('open','acknowledged','in_progress','settled','closed','denied')),
    adjuster        text,
    reserve         numeric(12,2),
    paid            numeric(12,2),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_touch BEFORE UPDATE ON activity          FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON quote_log         FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON disclosure_record FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON loss_history      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON claim             FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

SELECT enable_tenant_table('activity');
SELECT enable_tenant_table('quote_log');
SELECT enable_tenant_table('disclosure_record');
SELECT enable_tenant_table('loss_history');
SELECT enable_tenant_table('claim');
