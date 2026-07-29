-- ============================================================================
-- 0012_proofs.sql
-- Proofs of insurance — the highest-frequency client-facing output (pink
-- slips, binder letters, letters of experience, lender/landlord confirmations).
--
-- Issuing a proof asserts, on the brokerage's letterhead, that coverage is in
-- force. That is a licensed activity, so `pc.proof.issue` is licence-gated
-- like the transacting capabilities (0011: requires_licence = true).
--
-- Documents themselves already carry the 6-year RIBO retention clock
-- (0005_transactions.sql, trg_doc_retention) — proofs inherit it.
-- ============================================================================

INSERT INTO capability (code, module, description, requires_licence) VALUES
 ('pc.proof.issue','pc','Issue or reissue a proof of insurance', true)
ON CONFLICT (code) DO UPDATE
   SET requires_licence = EXCLUDED.requires_licence,
       description      = EXCLUDED.description;

-- Anyone who services the P&C book may issue a proof; the Life and support
-- roles may not.
INSERT INTO role_capability (role_code, capability_code) VALUES
 ('admin_principal','pc.proof.issue'),
 ('pc_sales','pc.proof.issue'),
 ('pc_service','pc.proof.issue')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Which template produced a document, and who it was addressed to (a lender or
-- landlord named on a confirmation). Kept on `document` so the proof is a
-- first-class record, not a file dropped in a folder.
-- ----------------------------------------------------------------------------
ALTER TABLE document ADD COLUMN IF NOT EXISTS issued_to text;
ALTER TABLE document ADD COLUMN IF NOT EXISTS rendered_body text;

-- ----------------------------------------------------------------------------
-- The guard: issuing a proof requires the capability. Mirrors the txn guard —
-- enforcement lives with the data, not in the service layer.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_proof_issue() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    -- Only proof-class documents are gated; carrier downloads and uploads keep
    -- flowing (eDocs ingest runs as `system` anyway).
    IF current_actor() <> 'system'
       AND NEW.doc_type IN ('pink_slip','binder_letter','loe','confirmation')
       AND NOT actor_has_capability('pc.proof.issue') THEN
        RAISE EXCEPTION
            'licence denied: issuing a % requires the pc.proof.issue capability',
            NEW.doc_type
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_document_proof_authority
    BEFORE INSERT ON document
    FOR EACH ROW EXECUTE FUNCTION guard_proof_issue();
