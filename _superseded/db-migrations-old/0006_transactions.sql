-- 0006 — transactions: the state machine and its guards
--
-- Invariant #1: COMPLIANCE IS STRUCTURAL. "No-bind is a state-machine guard,
-- not a hidden button." So binding is not permitted-then-checked in a service
-- layer; the database refuses the transition. A bug in the UI, a direct psql
-- session, or a future API all hit the same wall.

BEGIN;

CREATE TABLE transaction_types (
  code  text PRIMARY KEY,
  name  text NOT NULL
);

INSERT INTO transaction_types (code, name) VALUES
  ('new_business',  'New business'),
  ('endorsement',   'Endorsement'),
  ('renewal',       'Renewal'),
  ('cancellation',  'Cancellation'),
  ('reinstatement', 'Reinstatement'),
  ('remarket',      'Remarket')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  household_id    uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  policy_id       uuid REFERENCES policies (id) ON DELETE CASCADE,
  line_code       text NOT NULL REFERENCES policy_lines (code),
  type_code       text NOT NULL REFERENCES transaction_types (code),

  seq             integer NOT NULL,
  description     text NOT NULL,

  state           text NOT NULL DEFAULT 'draft'
                    CHECK (state IN ('draft', 'submitted', 'carrier_review',
                                     'bound', 'issued', 'completed',
                                     'rejected', 'cancelled')),

  effective_date  date,
  created_by      uuid REFERENCES users (id),
  bound_by        uuid REFERENCES users (id),
  bound_at        timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, household_id, seq),

  -- A bound transaction must record who bound it and when. Accountability is
  -- part of the state, not a side table that can drift.
  CONSTRAINT transactions_bind_attributed CHECK (
    state NOT IN ('bound', 'issued', 'completed')
    OR (bound_by IS NOT NULL AND bound_at IS NOT NULL)
  )
);

CREATE INDEX transactions_household_idx ON transactions (tenant_id, household_id);
CREATE INDEX transactions_state_idx     ON transactions (tenant_id, state);

/* Append-only audit of every state change. Insert-only by policy (0007); there
   is no UPDATE or DELETE grant, so history cannot be quietly rewritten. */
CREATE TABLE transaction_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  transaction_id  uuid NOT NULL REFERENCES transactions (id) ON DELETE CASCADE,
  from_state      text,
  to_state        text NOT NULL,
  actor_user_id   uuid REFERENCES users (id),
  note            text,
  occurred_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX transaction_events_txn_idx ON transaction_events (tenant_id, transaction_id);

/* ---------------------------------------------------------------------------
   Legal transitions. Kept as data rather than buried in an IF-chain so the
   machine can be read, tested, and diffed.
   --------------------------------------------------------------------------- */
CREATE TABLE transaction_transitions (
  from_state  text NOT NULL,
  to_state    text NOT NULL,
  PRIMARY KEY (from_state, to_state)
);

INSERT INTO transaction_transitions (from_state, to_state) VALUES
  ('draft',          'submitted'),
  ('draft',          'cancelled'),
  ('submitted',      'carrier_review'),
  ('submitted',      'draft'),
  ('submitted',      'cancelled'),
  ('carrier_review', 'bound'),
  ('carrier_review', 'rejected'),
  ('carrier_review', 'submitted'),
  ('bound',          'issued'),
  ('bound',          'cancelled'),
  ('issued',         'completed'),
  ('issued',         'cancelled'),
  ('rejected',       'draft')
ON CONFLICT DO NOTHING;

/* The guard.

   Two independent rules, both enforced on the way in:

   1. Only a declared transition may occur.
   2. Entering `bound` requires app.may_transact_module() for the module that
      owns this policy line — the brokerage entitled to sell it (#4) AND the
      acting user licensed to transact it (#3). This is the no-bind guard. A
      life-only user hitting a P&C bind is refused here, in the database.

   States at or past `bound` are re-checked rather than trusted, so a row
   cannot be inserted directly into `bound` to skip the gate.
   --------------------------------------------------------------------------- */
CREATE OR REPLACE FUNCTION app.enforce_transaction_state()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_module text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.state IS DISTINCT FROM OLD.state THEN
    IF NOT EXISTS (
      SELECT 1 FROM transaction_transitions t
      WHERE t.from_state = OLD.state AND t.to_state = NEW.state
    ) THEN
      RAISE EXCEPTION
        'illegal transaction transition: % -> %', OLD.state, NEW.state
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- The no-bind guard, on entry into a bound-or-later state.
  IF NEW.state IN ('bound', 'issued', 'completed')
     AND (TG_OP = 'INSERT' OR OLD.state IS DISTINCT FROM NEW.state) THEN

    SELECT pl.module_code INTO v_module
    FROM policy_lines pl
    WHERE pl.code = NEW.line_code;

    IF NOT app.may_transact_module(v_module) THEN
      RAISE EXCEPTION
        'no-bind: not entitled or not licensed to bind a % transaction', v_module
        USING ERRCODE = 'insufficient_privilege',
              HINT = 'Requires an active tenant module entitlement and a valid, unexpired licence for this module.';
    END IF;

    IF NEW.bound_at IS NULL THEN
      NEW.bound_at := now();
    END IF;
    IF NEW.bound_by IS NULL THEN
      NEW.bound_by := app.current_user_id();
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END
$$;

CREATE TRIGGER transactions_state_guard
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION app.enforce_transaction_state();

/* Record every state change automatically, so the audit trail cannot be
   forgotten by a caller. */
CREATE OR REPLACE FUNCTION app.log_transaction_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.state IS DISTINCT FROM NEW.state THEN
    INSERT INTO transaction_events (tenant_id, transaction_id, from_state, to_state, actor_user_id)
    VALUES (NEW.tenant_id, NEW.id,
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.state END,
            NEW.state,
            app.current_user_id());
  END IF;
  RETURN NULL;
END
$$;

CREATE TRIGGER transactions_event_log
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION app.log_transaction_event();

COMMIT;
