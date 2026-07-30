-- ============================================================================
-- 0013_scale_indexes.sql
-- Indexes the working set needs at book scale (50k accounts / 100k policies).
--
-- RLS puts `tenant_id = current_tenant()` on EVERY query, so a composite index
-- must lead with tenant_id or the planner cannot use it to satisfy both the
-- policy predicate and the query's own filter. Most of the schema already does
-- this; these are the gaps found by reading the queries the app actually runs.
--
-- At the current seeded size every one of these is irrelevant — a few hundred
-- rows is a sequential scan either way. They matter at 100k policies, and
-- adding them now is cheaper than diagnosing a slow dashboard later.
--
-- NOTE for a production backfill: these are plain CREATE INDEX because the
-- migration runner wraps each file in a transaction, and CREATE INDEX
-- CONCURRENTLY cannot run inside one. On a large live table, build them
-- CONCURRENTLY by hand instead and record it here.
-- ============================================================================

-- `WHERE status = 'in_force'` appears in metrics, compliance, billing and the
-- renewal queue — ten call sites. Without this it is a seq scan of the whole
-- policy table on every dashboard load.
CREATE INDEX IF NOT EXISTS policy_tenant_status_idx
    ON policy (tenant_id, status);

-- The renewal queue filters in_force AND orders by expiry. A composite that
-- carries both avoids a filter-then-sort over the book.
CREATE INDEX IF NOT EXISTS policy_tenant_status_expiry_idx
    ON policy (tenant_id, status, expiry_date)
    WHERE expiry_date IS NOT NULL;

-- Book-by-line and premium-by-carrier group on these.
CREATE INDEX IF NOT EXISTS policy_tenant_line_idx
    ON policy (tenant_id, line, status);
CREATE INDEX IF NOT EXISTS policy_tenant_carrier_idx
    ON policy (tenant_id, carrier_id, status);

-- Locate, Households and the book breakdowns all read account by status and
-- order by display_name; nothing indexed either.
CREATE INDEX IF NOT EXISTS account_tenant_status_idx
    ON account (tenant_id, status);
CREATE INDEX IF NOT EXISTS account_tenant_name_idx
    ON account (tenant_id, display_name);

-- Locate searches the book by name. Trigram makes that a fuzzy index scan
-- rather than 50,000 ILIKEs. Skipped when pg_trgm is unavailable, exactly as
-- 0002 does for party.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        CREATE INDEX IF NOT EXISTS account_display_name_trgm_idx
            ON account USING gin (display_name gin_trgm_ops);
    END IF;
END $$;

-- Risk rows are always fetched per policy; at 100k policies these are the
-- joins behind every household detail render.
CREATE INDEX IF NOT EXISTS vehicle_policy_idx   ON vehicle (policy_id);
CREATE INDEX IF NOT EXISTS dwelling_policy_idx  ON dwelling (policy_id);
CREATE INDEX IF NOT EXISTS coverage_policy_idx  ON coverage (policy_id);
CREATE INDEX IF NOT EXISTS endorsement_policy_idx ON policy_endorsement (policy_id);

-- Claims list and the open-claims count.
CREATE INDEX IF NOT EXISTS claim_tenant_status_idx
    ON claim (tenant_id, status);

-- The document vault is queried per account and swept by retention date.
CREATE INDEX IF NOT EXISTS document_tenant_retention_idx
    ON document (tenant_id, retention_until);

-- Trust sub-ledger by household — the reconciliation that must tie to the
-- control account.
CREATE INDEX IF NOT EXISTS journal_line_party_account_idx
    ON journal_line (party_account_id)
    WHERE party_account_id IS NOT NULL;

-- audit_event is the table that actually grows: two full jsonb row images per
-- mutation, so it will dominate storage long before the book does. This index
-- serves the retention sweep and time-ranged review. See
-- docs/decisions/0002-database-and-hosting.md — at this scale it should be
-- RANGE PARTITIONED BY MONTH before it is large, because converting it later
-- means rewriting the biggest table in the database.
CREATE INDEX IF NOT EXISTS audit_event_at_idx
    ON audit_event (at);
