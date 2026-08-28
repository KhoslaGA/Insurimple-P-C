-- ============================================================================
-- 0018_ai_action.sql — the AI action log, and why its lifecycle is separate.
--
-- Every AI suggestion the platform makes, the human decision on it, and the
-- context it was made from. Two purposes that pull in opposite directions:
--
--   * an operational record — who approved what, and on what basis. That is
--     part of the E&O trail and answers "why did the broker do that".
--   * a training set — the accepted/rejected label is the supervision signal,
--     and reading it means bulk sequential scans of everything ever written.
--
-- Born partitioned (invariant 14). It is an append-only leaf: nothing holds a
-- foreign key to it, so the composite primary key partitioning forces stops
-- here. Its growth is decoupled from book size — it accumulates per operation,
-- not per policy — so it is the table most likely to be large for reasons the
-- rest of the schema never sees coming.
--
-- ---------------------------------------------------------------------------
-- RETENTION IS A SEPARATE POLICY, and this is the load-bearing decision.
--
-- Client records carry a six-year RIBO obligation: the brokerage MUST keep them
-- and MUST produce them on a spot check. Training data carries no such
-- obligation — how long to keep it is an asset decision, and a privacy exposure
-- that grows with time.
--
-- Letting the stricter of the two govern both is the easy mistake in either
-- direction. Applying the six-year floor to training data keeps client context
-- long after it has any purpose. Applying a training-data retention window to
-- the operational record destroys evidence a regulator is entitled to. So
-- `ai_action.retain_until` is set independently of `document.retention_until`,
-- and the two are never derived from one another.
-- ---------------------------------------------------------------------------
CREATE TABLE ai_action (
    id              uuid NOT NULL,
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,

    -- what the suggestion was about
    txn_id          uuid REFERENCES txn(id) ON DELETE CASCADE,
    account_id      uuid REFERENCES account(id) ON DELETE CASCADE,
    policy_id       uuid REFERENCES policy(id),

    action_type     text NOT NULL CHECK (action_type IN
                    ('summarise','draft_email','suggest_endorsement','flag_risk',
                     'extract_document','suggest_remarket','classify_activity',
                     'suggest_next_step','explain_decline')),
    model           text NOT NULL,               -- which model produced it
    prompt_version  text,                        -- which prompt template

    -- the suggestion and the context it was made from. `context` is a redacted
    -- projection, not a copy of the record — see the comment on the export.
    suggestion      jsonb NOT NULL,
    context         jsonb,
    confidence      numeric(4,3) CHECK (confidence IS NULL
                                        OR (confidence >= 0 AND confidence <= 1)),

    -- ---------------------------------------------------------------------
    -- The human gate. This is where the label comes from, and it is also the
    -- compliance boundary: nothing an AI suggests reaches a client or a
    -- carrier without a licensed human accepting it. `pending` is not a
    -- training row — a suggestion nobody ruled on teaches nothing, and
    -- treating it as a negative would train the model on inattention.
    -- ---------------------------------------------------------------------
    decision        text NOT NULL DEFAULT 'pending'
                    CHECK (decision IN ('pending','accepted','rejected','amended')),
    decided_by      uuid REFERENCES staff(id),
    decided_at      timestamptz,
    amendment       jsonb,                       -- what the human changed it to
    reject_reason   text,

    -- Set independently of the records obligation. See the note above.
    retain_until    date,

    exported_at     timestamptz,                 -- last export to the lake
    created_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- A decision without a decider is an unsigned approval, which is exactly what
-- the human gate exists to prevent.
ALTER TABLE ai_action ADD CONSTRAINT ai_action_decision_attributed CHECK (
    decision = 'pending'
    OR (decided_by IS NOT NULL AND decided_at IS NOT NULL)
);

CREATE INDEX ON ai_action (tenant_id, created_at DESC);
CREATE INDEX ON ai_action (tenant_id, decision, created_at DESC);
CREATE INDEX ON ai_action (tenant_id, txn_id);

-- The export cursor. Leads with tenant_id like everything else (invariant 15),
-- and is partial so it stays small: the interesting set is what has NOT been
-- exported, which is a shrinking tail of a growing table.
CREATE INDEX ai_action_unexported_idx ON ai_action (tenant_id, created_at)
    WHERE exported_at IS NULL AND decision <> 'pending';

-- Append-only for the application, deletable by the retention sweep.
--
-- The first draft reused audit_is_append_only(), which refuses unconditionally
-- — so it blocked sweep_ai_action_retention() as well, and reported
-- "audit_event is append-only" while doing it. A guard that also stops the one
-- legitimate deletion is not a stricter guard, it is a broken one, and a
-- borrowed error message names the wrong table to whoever hits it.
--
-- `system` is the actor a scheduled job runs as, and it has to be named
-- explicitly (invariant 3). A CSR cannot delete a training row; the sweep can,
-- and only within its own retention window.
CREATE OR REPLACE FUNCTION ai_action_no_delete() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF current_actor() = 'system' THEN
        RETURN OLD;
    END IF;
    RAISE EXCEPTION
        'ai_action is append-only — it is the record of what a human approved. Rows leave '
        'only through sweep_ai_action_retention(), which acts as system and honours '
        'retain_until';
END $$;

CREATE TRIGGER trg_ai_action_immutable BEFORE DELETE ON ai_action
    FOR EACH ROW EXECUTE FUNCTION ai_action_no_delete();

SELECT enable_tenant_table('ai_action');
SELECT ensure_month_partitions('ai_action',
    (date_trunc('month', now()) - interval '2 months')::date, 14);

-- ----------------------------------------------------------------------------
-- The export view.
--
-- What leaves the database for the training lake is NOT the row. `context` can
-- hold names, addresses and policy numbers — everything a suggestion was made
-- from — and once a copy is in object storage it is outside every control in
-- this schema: no RLS, no audit trigger, no retention trigger. The export
-- therefore emits the label, the shape of the decision, and identifiers that
-- point back here, and leaves the client's details in the database where the
-- policies still apply.
--
-- Pending rows never export. They carry no label.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW ai_action_export AS
    SELECT a.id,
           a.tenant_id,
           a.created_at,
           a.action_type,
           a.model,
           a.prompt_version,
           a.confidence,
           a.decision,
           a.decided_at,
           (a.amendment IS NOT NULL)             AS was_amended,
           a.reject_reason,
           -- structure without content: which keys the suggestion had, not what
           -- was in them
           (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(a.suggestion) k)
                                                 AS suggestion_keys,
           jsonb_array_length(coalesce(a.suggestion -> 'items', '[]'::jsonb))
                                                 AS suggestion_items,
           a.txn_id,
           a.policy_id,
           a.exported_at
      FROM ai_action a
     WHERE a.decision <> 'pending';

GRANT SELECT ON ai_action_export TO insurimple_app;

-- ----------------------------------------------------------------------------
-- Retention sweep — separate from the records obligation by construction.
--
-- Deletes only rows whose OWN retain_until has passed. It cannot reach
-- `document`, `txn` or anything else carrying the six-year clock, because it
-- names one table and that table's own column.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sweep_ai_action_retention() RETURNS bigint
LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
    DELETE FROM ai_action
     WHERE retain_until IS NOT NULL AND retain_until < current_date;
    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
END $$;
