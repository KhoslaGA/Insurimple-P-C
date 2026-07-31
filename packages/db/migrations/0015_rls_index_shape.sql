-- ============================================================================
-- 0015_rls_index_shape.sql
--
-- What RLS does to the planner, measured rather than assumed.
--
-- Under row level security, a WHERE clause the caller wrote sits at a HIGHER
-- security level than the policy's own qual. PostgreSQL will only promote such
-- a qual into an index condition if it is LEAKPROOF — otherwise the qual could
-- see rows the policy is meant to hide (through an error message, a timing
-- difference, or a cost estimate) before the policy has filtered them. A
-- non-leakproof qual is therefore demoted to a heap Filter, and any index built
-- to serve it stops being used.
--
-- Measured on 60,000 parties across two tenants, PostgreSQL 16, connected as
-- insurimple_app:
--
--   as OWNER   name % 'Surname4242'   ->  Bitmap Index Scan on party_expr_idx
--   as APP     name % 'Surname4242'   ->  Index Cond: tenant_id only
--                                         Filter: ... % ...      51.8 ms
--
-- The owner's plan is the one a developer captures, and it is meaningless: a
-- superuser or an unforced owner never had the policy applied in the first
-- place.
--
-- Nothing rescues the trigram index. A composite GIN over (tenant_id, expr)
-- using btree_gin was tried: the tenant equality becomes the index condition
-- and `%` remains a Filter, so the GIN costs writes and returns a btree's worth
-- of selectivity. ALTER FUNCTION similarity_op(text,text) LEAKPROOF would fix
-- it and requires actual superuser, which RDS does not grant.
--
-- And it is not only the trigram operator, which is the part that generalises:
--
--   proleakproof = false:  similarity_op (%), textlike (~~), texticlike (~~*),
--                          textregexeq (~), ts_match_vq (@@), to_tsvector,
--                          textcat (||), lower, upper, btrim
--   proleakproof = true:   texteq (=), text_lt/le/ge/gt (< <= >= >), bttextcmp
--
-- So `lower(last_name) >= 'x'` is demoted even though `>=` is leakproof — the
-- lower() wrapper poisons it. Any expression index on a tenant table is dead
-- under RLS unless every function in the expression is leakproof.
--
--   as APP     lower(last_name) >= 'surname42' AND < 'surname43'
--                -> Index Cond: tenant_id only, Filter: the range
--   as APP     last_name       >= 'Surname42' AND < 'Surname43'
--                -> Index Cond: (tenant_id, last_name)          0.256 ms
--
-- The fix is to normalise on WRITE and compare RAW on read. A trigger does the
-- folding, where leakproofness is irrelevant because nothing is being planned;
-- the query then touches a plain text column with plain comparison operators.
-- 51.8 ms becomes 0.256 ms, and the difference grows with the book.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Normalised search keys. Written by trigger, read raw.
--
-- Deliberately not a GENERATED column: a stored generated column's expression
-- must be IMMUTABLE, which unaccent()-style folding is not, and we want room to
-- change the folding later without a table rewrite of a live book.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_fold(p text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
    -- NFKD fold, drop combining marks, lowercase, collapse runs of whitespace.
    -- Matches the normalisation in normalizeNameToStem so a search and a client
    -- code derive from the same view of a name.
    SELECT nullif(btrim(regexp_replace(
             lower(regexp_replace(normalize(coalesce(p,''), NFKD), '[̀-ͯ]', '', 'g')),
             '\s+', ' ', 'g')), '')
$$;

ALTER TABLE party   ADD COLUMN IF NOT EXISTS search_name text;
ALTER TABLE account ADD COLUMN IF NOT EXISTS search_name text;

CREATE OR REPLACE FUNCTION party_set_search_name() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.search_name := search_fold(
        coalesce(NEW.last_name,'')   || ' ' ||
        coalesce(NEW.first_name,'')  || ' ' ||
        coalesce(NEW.legal_name,''));
    RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION account_set_search_name() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.search_name := search_fold(NEW.display_name);
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_party_search ON party;
CREATE TRIGGER trg_party_search BEFORE INSERT OR UPDATE ON party
    FOR EACH ROW EXECUTE FUNCTION party_set_search_name();

DROP TRIGGER IF EXISTS trg_account_search ON account;
CREATE TRIGGER trg_account_search BEFORE INSERT OR UPDATE ON account
    FOR EACH ROW EXECUTE FUNCTION account_set_search_name();

UPDATE party   SET search_name = search_fold(
    coalesce(last_name,'') || ' ' || coalesce(first_name,'') || ' ' || coalesce(legal_name,''))
 WHERE search_name IS DISTINCT FROM search_fold(
    coalesce(last_name,'') || ' ' || coalesce(first_name,'') || ' ' || coalesce(legal_name,''));
UPDATE account SET search_name = search_fold(display_name)
 WHERE search_name IS DISTINCT FROM search_fold(display_name);

-- Leading with tenant_id, and holding a RAW text column so both halves of a
-- prefix search can become index conditions under RLS.
CREATE INDEX IF NOT EXISTS party_tenant_search_idx   ON party   (tenant_id, search_name);
CREATE INDEX IF NOT EXISTS account_tenant_search_idx ON account (tenant_id, search_name);

-- ----------------------------------------------------------------------------
-- Retire the indexes RLS made unreachable.
--
-- These are not merely suboptimal: measured as insurimple_app, not one of them
-- contributes an index condition. They cost write amplification and disk on
-- every insert and return nothing. Fuzzy and full-text matching still WORK —
-- the operators run as a Filter over the caller's own tenant, which is bounded
-- by one brokerage's book rather than the platform's. If that ever needs
-- accelerating, the answer is a search service outside the RLS boundary, not an
-- index the planner has already refused.
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS party_expr_idx;
DROP INDEX IF EXISTS account_display_name_trgm_idx;
DROP INDEX IF EXISTS activity_to_tsvector_idx;

-- ----------------------------------------------------------------------------
-- audit_event (at) scanned every tenant's audit trail to answer a time-range
-- question about one. The audit log is the largest table in the platform by
-- row count, so this is the worst place to lead with the wrong column.
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS audit_event_at_idx;
CREATE INDEX IF NOT EXISTS audit_event_tenant_at_idx ON audit_event (tenant_id, at DESC);

-- ============================================================================
-- The assertion.
--
-- "Every index leads with tenant_id" is the right instinct and the wrong rule.
-- Three classes of index legitimately lead with something else, and forcing
-- tenant_id in front of them makes the schema worse, not safer:
--
--   * The primary key on `id`. Leading with tenant_id would mean the PK is
--     (tenant_id, id), and every foreign key in the platform would have to
--     carry both columns — the same composite-FK cascade that rules out
--     partitioning txn. An equality on a globally unique uuid already selects
--     one row; the tenant predicate is a recheck, not a scan.
--   * Unique constraints and FK-join indexes whose leading column is a uuid.
--     `consent (party_id, channel)`, `coverage (policy_id)`: the parent is
--     globally unique and already tenant-filtered, so the join selects a
--     handful of rows. Putting tenant_id first would not narrow anything and
--     would stop the index serving the join it exists for.
--   * Nothing else. In particular an index leading with a text, date, boolean
--     or enum-like column is exactly the case this assertion is for: those scan
--     across tenants, and the cost grows with the platform rather than with the
--     brokerage.
-- ============================================================================
CREATE OR REPLACE FUNCTION assert_tenant_leading_indexes() RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    bad text;
BEGIN
    -- coalesce, not concatenation: an expression index has no leading COLUMN, so
    -- indkey[0] is 0 and `lead` is NULL. Without this the message string is NULL,
    -- string_agg drops it, and the assertion passes on exactly the index shape it
    -- exists to catch. Found by adding a GIN expression index and watching the
    -- assertion stay green.
    SELECT string_agg(t.relname || '.' || i.relname || ' leads with '
                      || coalesce(t.lead, 'an expression, not a column'), ', '
                      ORDER BY t.relname, i.relname)
      INTO bad
      FROM (
        SELECT x.indexrelid, c.oid AS reloid, c.relname,
               (SELECT a.attname FROM pg_attribute a
                 WHERE a.attrelid = c.oid AND a.attnum = x.indkey[0]) AS lead,
               (SELECT format_type(a.atttypid, NULL) FROM pg_attribute a
                 WHERE a.attrelid = c.oid AND a.attnum = x.indkey[0]) AS lead_type
          FROM pg_index x
          JOIN pg_class c ON c.oid = x.indrelid
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public'
           AND c.relkind IN ('r','p')
           AND NOT c.relispartition
           AND EXISTS (SELECT 1 FROM pg_attribute a2
                        WHERE a2.attrelid = c.oid AND a2.attname = 'tenant_id'
                          AND NOT a2.attisdropped)
      ) t
      JOIN pg_class i ON i.oid = t.indexrelid
     WHERE t.lead IS DISTINCT FROM 'tenant_id'
       -- exemption 1+2: a uuid leading column is a key or a foreign key, and is
       -- already globally selective. `lead IS NULL` means an expression index,
       -- which is never exempt — see the leakproofness note above.
       AND t.lead_type IS DISTINCT FROM 'uuid'
       -- audit_event's bigint identity is the same case as a uuid key
       AND NOT (t.relname = 'audit_event' AND t.lead = 'id');
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION
            'indexes on tenant tables must lead with tenant_id unless the leading column '
            'is a uuid key or foreign key — RLS filters every query on tenant_id, so these '
            'scan across tenants and get slower as the platform grows: %', bad;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Coverage split, now that partitioned tables exist.
--
-- tenant_tables() drives the RLS suite's per-table assertions and its fixture
-- census, and must name each logical table once — the partitioned parent, not
-- its monthly children, which would count the same rows again under a different
-- name. assert_rls_complete() is the opposite: it must see the children, since
-- insurimple_app can name a partition directly and a partition without its own
-- ENABLE + FORCE is an open door with a date in its name.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tenant_tables() RETURNS text[]
LANGUAGE sql STABLE AS $$
    SELECT array_agg(c.relname ORDER BY c.relname)
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind IN ('r','p')
       AND NOT c.relispartition
       AND EXISTS (SELECT 1 FROM pg_attribute a
                    WHERE a.attrelid = c.oid AND a.attname = 'tenant_id' AND NOT a.attisdropped)
$$;
