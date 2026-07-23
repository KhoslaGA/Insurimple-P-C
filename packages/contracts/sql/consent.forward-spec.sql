-- ============================================================================
-- TM.1 — consent & evidence: STRUCTURAL forward-spec.
--
-- This is the canonical DB shape for the marketing consent foundation. It does
-- NOT run in this repo (there is no Postgres here yet). It is the contract the
-- NestJS + Postgres spine must satisfy so that "no consent -> no send" and
-- "suppressed -> no send" are enforced by the schema, not by worker code. The
-- pure functions in ../consent.ts + the mock store mirror these guarantees and
-- are unit-tested today; when the spine is wired, this file + consent.pgtap.sql
-- become the CI gate.
--
-- Invariants exercised: #1 (structural compliance), #2 (RLS/tenant isolation),
-- and marketing design rules #1 (CASL), #2 (message_class), #3 (suppression).
-- ============================================================================

CREATE TYPE consent_class AS ENUM
  ('express', 'implied_ebr', 'implied_inquiry', 'none');
CREATE TYPE consent_channel AS ENUM ('email', 'sms');
CREATE TYPE message_class  AS ENUM ('service', 'marketing');

-- ---- consent records -------------------------------------------------------
-- expires_at is GENERATED so the CASL clock (EBR 2y, inquiry 6m) can never be
-- set wrong by application code — the database computes it from class + capture.
CREATE TABLE consent_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL,
  party_id     uuid NOT NULL REFERENCES parties (id),
  channel      consent_channel NOT NULL,
  class        consent_class   NOT NULL,
  source       text NOT NULL,
  captured_at  date NOT NULL,
  expires_at   date GENERATED ALWAYS AS (
    CASE class
      WHEN 'implied_ebr'     THEN captured_at + INTERVAL '2 years'
      WHEN 'implied_inquiry' THEN captured_at + INTERVAL '6 months'
      ELSE NULL                       -- express / none: no expiry
    END
  ) STORED,
  UNIQUE (tenant_id, party_id, channel)
);

-- ---- per-tenant suppression list (global opt-out) --------------------------
CREATE TABLE suppression_list (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  address     citext NOT NULL,        -- case-insensitive email/number
  channel     consent_channel NOT NULL,
  reason      text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, address, channel)
);

-- ---- append-only consent evidence ------------------------------------------
CREATE TABLE consent_evidence (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  party_id    uuid NOT NULL REFERENCES parties (id),
  channel     consent_channel NOT NULL,
  action      text NOT NULL,          -- granted|updated|unsubscribed|resubscribed
  from_class  consent_class,
  to_class    consent_class NOT NULL,
  source      text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  ip          inet,
  user_agent  text
);
-- append-only: block UPDATE/DELETE on evidence
CREATE RULE consent_evidence_no_update AS ON UPDATE TO consent_evidence DO INSTEAD NOTHING;
CREATE RULE consent_evidence_no_delete AS ON DELETE TO consent_evidence DO INSTEAD NOTHING;

-- ---- the marketing send gate, enforced in the schema -----------------------
-- A row in `sends` is the act of sending. message_class has teeth here:
--   * service  -> may NOT carry campaign/sequence linkage
--   * marketing-> MUST resolve a live consent AND the address must be unsuppressed
CREATE TABLE sends (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL,
  party_id       uuid NOT NULL REFERENCES parties (id),
  channel        consent_channel NOT NULL,
  message_class  message_class NOT NULL,
  campaign_id    uuid REFERENCES campaigns (id),
  sequence_id    uuid REFERENCES nurture_sequences (id),
  consent_id     uuid REFERENCES consent_records (id),
  address        citext NOT NULL,
  sent_at        timestamptz NOT NULL DEFAULT now(),
  -- service messages cannot be campaign/sequence-linked (design rule #2)
  CONSTRAINT service_has_no_campaign CHECK (
    message_class = 'marketing' OR (campaign_id IS NULL AND sequence_id IS NULL)
  ),
  -- marketing messages must reference a consent record (design rule #1)
  CONSTRAINT marketing_requires_consent CHECK (
    message_class = 'service' OR consent_id IS NOT NULL
  )
);

CREATE OR REPLACE FUNCTION enforce_marketing_send() RETURNS trigger AS $$
BEGIN
  IF NEW.message_class = 'marketing' THEN
    -- suppressed address can never receive a marketing send
    IF EXISTS (
      SELECT 1 FROM suppression_list s
      WHERE s.tenant_id = NEW.tenant_id
        AND s.address   = NEW.address
        AND s.channel   = NEW.channel
    ) THEN
      RAISE EXCEPTION 'suppressed address % cannot receive marketing send', NEW.address
        USING ERRCODE = 'check_violation';
    END IF;
    -- consent must exist, be marketable, and be unexpired at send time
    IF NOT EXISTS (
      SELECT 1 FROM consent_records c
      WHERE c.id = NEW.consent_id
        AND c.tenant_id = NEW.tenant_id
        AND c.party_id  = NEW.party_id
        AND c.channel   = NEW.channel
        AND c.class <> 'none'
        AND (c.expires_at IS NULL OR c.expires_at >= NEW.sent_at::date)
    ) THEN
      RAISE EXCEPTION 'no valid consent for marketing send to party %', NEW.party_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_marketing_send
  BEFORE INSERT ON sends
  FOR EACH ROW EXECUTE FUNCTION enforce_marketing_send();

-- ---- atomic preference-center update (criterion C) -------------------------
-- One function body == one transaction: consent UPSERT + evidence INSERT +
-- suppression add/remove commit together, or the whole update rolls back.
-- Mirrors applyPreferenceUpdate() in ../mock/store.ts. A self-service
-- resubscribe lifts ONLY 'unsubscribe' rows — never complaint/bounce/manual.
CREATE OR REPLACE FUNCTION apply_preference_update(
  p_party      uuid,
  p_channel    consent_channel,
  p_intent     text,               -- 'subscribe' | 'unsubscribe'
  p_source     text,
  p_ip         inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_tenant uuid := current_setting('app.current_tenant')::uuid;
  v_from   consent_class;
  v_to     consent_class;
  v_addr   citext;
  v_action text;
BEGIN
  SELECT class INTO v_from FROM consent_records
    WHERE tenant_id = v_tenant AND party_id = p_party AND channel = p_channel;

  SELECT (CASE WHEN p_channel = 'email' THEN email ELSE phone END)::citext
    INTO v_addr FROM parties WHERE id = p_party AND tenant_id = v_tenant;
  IF v_addr IS NULL THEN
    RAISE EXCEPTION 'party % has no % address', p_party, p_channel
      USING ERRCODE = 'check_violation';
  END IF;

  v_to := CASE WHEN p_intent = 'unsubscribe' THEN 'none' ELSE 'express' END;
  v_action := CASE
    WHEN p_intent = 'unsubscribe' THEN 'unsubscribed'
    WHEN v_from IS NULL           THEN 'granted'
    WHEN v_from = 'none'          THEN 'resubscribed'
    ELSE 'updated' END;

  INSERT INTO consent_records (tenant_id, party_id, channel, class, source, captured_at)
    VALUES (v_tenant, p_party, p_channel, v_to, p_source, current_date)
    ON CONFLICT (tenant_id, party_id, channel)
    DO UPDATE SET class = EXCLUDED.class, source = EXCLUDED.source,
                  captured_at = EXCLUDED.captured_at;

  INSERT INTO consent_evidence
      (tenant_id, party_id, channel, action, from_class, to_class, source, ip, user_agent)
    VALUES (v_tenant, p_party, p_channel, v_action, v_from, v_to, p_source, p_ip, p_user_agent);

  IF p_intent = 'unsubscribe' THEN
    INSERT INTO suppression_list (tenant_id, address, channel, reason)
      VALUES (v_tenant, v_addr, p_channel, 'unsubscribe')
      ON CONFLICT (tenant_id, address, channel) DO NOTHING;
  ELSE
    DELETE FROM suppression_list
      WHERE tenant_id = v_tenant AND address = v_addr
        AND channel = p_channel AND reason = 'unsubscribe';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ---- RLS: tenant isolation on every table (invariant #2) -------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['consent_records','suppression_list','consent_evidence','sends']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE  ROW LEVEL SECURITY', t);
    EXECUTE format($p$
      CREATE POLICY tenant_isolation ON %I
        USING (tenant_id = current_setting('app.current_tenant')::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid)
    $p$, t);
  END LOOP;
END $$;
