-- ============================================================================
-- 0005_transactions.sql
-- THE CORE PRIMITIVE. Every carrier-facing action — new business, renewal,
-- endorsement, cancellation, reinstatement, remarket, claim FNOL — is one
-- `txn` row moving through one lifecycle: draft -> doc_generated -> sig_pending
-- -> signed -> submitted -> carrier_ack -> completed | rejected.
-- Documents, signatures and carrier submissions all hang off the txn.
-- ============================================================================

CREATE TABLE txn (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    branch_id       uuid REFERENCES branch(id),
    reference       text,                            -- human ref 'TXN-3041'
    txn_type        text NOT NULL CHECK (txn_type IN
                    ('new_business','renewal','endorsement','cancellation',
                     'reinstatement','remarket','claim_fnol')),
    account_id      uuid NOT NULL REFERENCES account(id),
    policy_id       uuid REFERENCES policy(id),       -- null for new_business/remarket pre-bind
    carrier_id      uuid REFERENCES carrier(id),
    state           text NOT NULL DEFAULT 'draft' CHECK (state IN
                    ('draft','doc_generated','sig_pending','signed',
                     'submitted','carrier_ack','completed','rejected')),
    reason          text,
    effective_date  date,
    owner_id        uuid REFERENCES staff(id),
    premium_delta   numeric(12,2),                   -- endorsement/renewal impact
    metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
    opened_at       timestamptz NOT NULL DEFAULT now(),
    closed_at       timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON txn (tenant_id, state);
CREATE INDEX ON txn (tenant_id, account_id);
CREATE INDEX ON txn (tenant_id, txn_type, state);

-- Explicit state-transition log (in addition to the generic audit trail):
-- gives a clean, queryable lifecycle history per transaction.
CREATE TABLE txn_event (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    txn_id          uuid NOT NULL REFERENCES txn(id) ON DELETE CASCADE,
    from_state      text,
    to_state        text NOT NULL,
    actor           text NOT NULL,
    note            text,
    at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON txn_event (txn_id, at);

-- State-machine guard: only permit legal transitions. Rejected/completed are
-- terminal. Records the transition into txn_event automatically.
CREATE OR REPLACE FUNCTION txn_guard_transition() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    ok boolean := false;
BEGIN
    IF NEW.state = OLD.state THEN
        RETURN NEW;
    END IF;
    -- allowed forward edges
    ok := (OLD.state,NEW.state) IN (
        ('draft','doc_generated'),
        ('doc_generated','sig_pending'),
        ('sig_pending','signed'),
        ('signed','submitted'),
        ('submitted','carrier_ack'),
        ('carrier_ack','completed'),
        -- rejection can happen from any live carrier stage
        ('submitted','rejected'),
        ('carrier_ack','rejected'),
        -- a rejected txn can be reworked back to draft
        ('rejected','draft')
    );
    IF NOT ok THEN
        RAISE EXCEPTION 'illegal txn transition: % -> %', OLD.state, NEW.state;
    END IF;
    IF NEW.state IN ('completed','rejected') AND NEW.closed_at IS NULL THEN
        NEW.closed_at := now();
    END IF;
    INSERT INTO txn_event(tenant_id,txn_id,from_state,to_state,actor)
    VALUES (NEW.tenant_id,NEW.id,OLD.state,NEW.state,current_actor());
    RETURN NEW;
END $$;
CREATE TRIGGER trg_txn_guard BEFORE UPDATE OF state ON txn
    FOR EACH ROW EXECUTE FUNCTION txn_guard_transition();

-- ----------------------------------------------------------------------------
-- Document templates: the merge templates a txn generates from (LPV,
-- cancellation agreement, OPCF 47R, application, etc.). Versioned per tenant.
-- ----------------------------------------------------------------------------
CREATE TABLE document_template (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    code            text NOT NULL,                   -- 'LPV','CANCEL_AGREEMENT','OPCF_47R'
    name            text NOT NULL,
    body            text NOT NULL,                   -- template with {{merge_fields}}
    version         int NOT NULL DEFAULT 1,
    effective_from  date,                            -- form editions matter in ON
    active          boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, code, version)
);

-- ----------------------------------------------------------------------------
-- Documents: every generated/uploaded/downloaded file. eDoc-tagged, indexed to
-- account/policy/txn, with a 6-year RIBO retention clock.
-- ----------------------------------------------------------------------------
CREATE TABLE document (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    account_id      uuid REFERENCES account(id) ON DELETE CASCADE,
    policy_id       uuid REFERENCES policy(id),
    txn_id          uuid REFERENCES txn(id),
    template_id     uuid REFERENCES document_template(id),
    doc_type        text NOT NULL,                   -- 'declaration','lpv','application','pink_slip','loe'
    csio_edoc_code  text,
    filename        text NOT NULL,
    storage_key     text,                            -- S3 object key
    source          text NOT NULL DEFAULT 'generated' CHECK (source IN
                    ('generated','uploaded','edocs_download','carrier')),
    retention_until date,                            -- created + 6 years
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON document (tenant_id, account_id);
CREATE INDEX ON document (tenant_id, txn_id);

-- Default the retention clock to 6 years on insert if not set.
CREATE OR REPLACE FUNCTION document_set_retention() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.retention_until IS NULL THEN
        NEW.retention_until := (now() + interval '6 years')::date;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_doc_retention BEFORE INSERT ON document
    FOR EACH ROW EXECUTE FUNCTION document_set_retention();

-- ----------------------------------------------------------------------------
-- Signatures: the e-sign event on a document. Mocked now (DocuSign/OneSpan
-- later) but the record — signer, timestamp, IP — is what makes it actionable.
-- ----------------------------------------------------------------------------
CREATE TABLE signature (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    document_id     uuid NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    signer_party_id uuid REFERENCES party(id),
    method          text NOT NULL DEFAULT 'esign' CHECK (method IN ('esign','wet','verbal')),
    signed_at       timestamptz,
    signer_ip       text,
    provider_ref    text,                            -- vendor envelope id
    verified        boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Rider: carrier submission — the out-of-band step Applied leaves manual.
-- Tracks what was sent to which carrier, through which channel, and the
-- acknowledgement coming back. This is the moat: tracking that brokers lose
-- in their inbox.
-- ----------------------------------------------------------------------------
CREATE TABLE carrier_submission (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    txn_id          uuid NOT NULL REFERENCES txn(id) ON DELETE CASCADE,
    carrier_id      uuid REFERENCES carrier(id),
    document_id     uuid REFERENCES document(id),     -- e.g. the signed LPV
    channel         text NOT NULL CHECK (channel IN
                    ('secure_delivery','portal','email','csio_json_api','direct_api','csio_edocs')),
    status          text NOT NULL DEFAULT 'queued' CHECK (status IN
                    ('queued','sent','acknowledged','rejected')),
    carrier_ref     text,                            -- confirmation / claim #
    submitted_at    timestamptz,
    acknowledged_at timestamptz,
    payload         jsonb,                            -- what we sent
    response        jsonb,                            -- what came back
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON carrier_submission (tenant_id, status);

CREATE TRIGGER trg_touch BEFORE UPDATE ON txn                FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON document_template  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON document           FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON signature          FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON carrier_submission FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

SELECT enable_tenant_table('txn');
SELECT enable_tenant_table('txn_event');
SELECT enable_tenant_table('document_template');
SELECT enable_tenant_table('document');
SELECT enable_tenant_table('signature');
SELECT enable_tenant_table('carrier_submission');
