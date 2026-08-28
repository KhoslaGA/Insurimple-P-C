-- ============================================================================
-- 0017_client_code.sql — the client code (invariant 11).
--
--   first6(last) + first2(first) + counter        ABTAHI + SE + 01
--
-- The column and its UNIQUE (tenant_id, lookup_code) have existed since 0002.
-- What did not exist was anything that issues one: every code in the repo was
-- typed by hand into a seed file. A brokerage migrating 50,000 households
-- cannot type them, and the first time two clients collide on a stem the answer
-- has to already be decided.
--
-- Why this is in the database rather than only in TypeScript:
--
--   * The collision counter is a read-then-write. Two concurrent inserts for
--     "Abtahi, Seyed" both read 0 and both write ABTAHISE01. Resolving it in
--     the same statement that inserts the row is the only version without a
--     race, and the UNIQUE constraint is the backstop when the retry loop
--     is beaten anyway.
--   * A BEFORE INSERT trigger cannot be bypassed. A code minted in application
--     code is skipped by every seed, fixture, import script and psql session —
--     and a bulk migration of an existing book is exactly the path that would
--     skip it.
--
-- TypeScript keeps `normalizeNameToStem` for the UI, which needs to show the
-- code before the row exists. Two implementations of the same rule is how
-- things drift, so `client-code.test.ts` runs both over the same table of cases
-- and fails if they ever disagree.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Latin fold. NFKD is not enough on its own, and the gap is not cosmetic.
--
-- NFKD decomposes a letter into a base plus combining marks, so é becomes e +
-- U+0301 and stripping the mark leaves E. But a letter whose diacritic is a
-- STROKE or a LIGATURE has no decomposition — Đ, Ø, Ł, Æ, Þ and ß are single
-- indivisible code points. They survive NFKD unchanged and are then deleted by
-- the A-Z filter.
--
-- Đặng became ANGTH. The surname lost its first letter, and because the client
-- code is immutable the wrong code would be printed on that client's pink slip
-- and carried through six years of retained documents with no way to correct
-- it. Vietnamese, Polish, Scandinavian and Icelandic surnames are ordinary in a
-- Canadian brokerage's book; this is not an edge case, it is Tuesday.
--
-- So: transliterate the indivisible ones explicitly, THEN NFKD, then strip.
--
-- The two translate() arguments are positional and MUST stay the same length
-- and in the same order. The first draft of this table listed ø twice, which
-- shifted every pair after it by one and silently folded Œ to E. translate()
-- reports nothing when the arguments disagree: extra source characters are
-- simply DELETED, which is the same failure as not listing them at all. The
-- assertion below counts them, and client-code.test.ts pins the outputs.
--
-- Folds are 1:1 by construction — Þ becomes T rather than TH, ß becomes S
-- rather than SS. The stem is a lookup key, not a rendering of the name, and a
-- 1:1 map keeps a 6-character slice predictable.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fold_latin(p text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
    SELECT regexp_replace(
             regexp_replace(
               normalize(
                 translate(coalesce(p, ''),
                           'ÐĐđðØøÞþŁłĦħŦŧŒœÆæß',
                           'DDddOoTtLlHhTtOoAas'),
                 NFKD),
               '[̀-ͯ]', '', 'g'),           -- combining marks, now that they exist
             '[^A-Za-z]', '', 'g')
$$;

DO $$
BEGIN
    IF length('ÐĐđðØøÞþŁłĦħŦŧŒœÆæß') <> length('DDddOoTtLlHhTtOoAas') THEN
        RAISE EXCEPTION
            'fold_latin translate() arguments differ in length — the pairs are shifted and '
            'some characters are being deleted rather than folded';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- The stem. Fold, A-Z only, first6 of last + first2 of first, never pad.
--
-- Never pad is load-bearing: MEHTA + RA gives MEHTARA01, not MEHTA_RA01 or
-- MEHTAXRA01. It matches the live Epic book, and a migrated client keeps the
-- code already printed on their documents (invariant 11).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION normalize_name_to_stem(p_last text, p_first text)
RETURNS text
LANGUAGE sql IMMUTABLE AS $$
    SELECT left(upper(fold_latin(p_last)), 6) || left(upper(fold_latin(p_first)), 2)
$$;

-- ----------------------------------------------------------------------------
-- The code. Stem plus the next free counter for that stem, in this tenant.
--
-- Two digits until 99, then three — never truncated, because a code that
-- silently wraps produces a duplicate that the unique constraint rejects at the
-- 100th client with the same stem, which is a Tuesday afternoon nobody wants.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION issue_client_code(p_last text, p_first text)
RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
    v_stem text := normalize_name_to_stem(p_last, p_first);
    v_next int;
BEGIN
    IF v_stem = '' THEN
        RAISE EXCEPTION 'cannot issue a client code from an empty name'
            USING ERRCODE = 'check_violation';
    END IF;

    -- Serialise on the stem, not on the table.
    --
    -- Issuing a code is a read-then-write: read the highest counter, write the
    -- next one. Ten concurrent inserts of the same surname all read 0, all try
    -- 01, one wins and nine take a unique violation — then nine read 1, all try
    -- 02, and so on. A retry loop does terminate, but it needs as many rounds
    -- as there are writers, which a bulk import of a migrated book will find.
    --
    -- Measured: ten concurrent inserts of one stem exhausted a five-retry
    -- budget outright.
    --
    -- The advisory lock is transaction-scoped, so it releases at COMMIT with
    -- everything else (DB.5), and it is keyed on tenant plus stem — two
    -- brokerages issuing codes for two Mehtas never wait on each other, and
    -- neither do a Mehta and a Kapoor in the same brokerage.
    PERFORM pg_advisory_xact_lock(
        hashtextextended(coalesce(current_tenant()::text, '') || ':' || v_stem, 0));

    -- The highest counter already issued for this stem, in this tenant only.
    -- Reads through RLS, so one brokerage's numbering never depends on another's.
    SELECT coalesce(max(substring(lookup_code from length(v_stem) + 1)::int), 0) + 1
      INTO v_next
      FROM account
     WHERE tenant_id = current_tenant()
       AND lookup_code ~ ('^' || v_stem || '[0-9]+$');

    RETURN v_stem || lpad(v_next::text, 2, '0');
END $$;

-- ----------------------------------------------------------------------------
-- Issue on insert, and never again.
--
-- The code is IMMUTABLE once set. A client who marries and changes their name
-- keeps ABTAHISE01 — it is printed on their pink slip, quoted in carrier
-- correspondence, and is the join key in six years of retained documents.
-- Only display_name follows the new name.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION account_issue_lookup_code() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_last  text;
    v_first text;
BEGIN
    IF NEW.lookup_code IS NOT NULL THEN
        RETURN NEW;   -- a migrated book supplies its existing codes
    END IF;
    -- display_name is "First Last"; the last token is the surname. The named
    -- insured party does not exist yet at INSERT time — account_party is
    -- written after the account — so the name has to come from the account.
    v_last  := regexp_replace(NEW.display_name, '^.*\s', '');
    v_first := CASE WHEN NEW.display_name ~ '\s'
                    THEN regexp_replace(NEW.display_name, '\s.*$', '')
                    ELSE '' END;
    NEW.lookup_code := issue_client_code(v_last, v_first);
    RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION account_lookup_code_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.lookup_code IS NOT NULL AND NEW.lookup_code IS DISTINCT FROM OLD.lookup_code THEN
        RAISE EXCEPTION
            'client code % is immutable — it is printed on the client''s documents and is '
            'the join key across six years of retained records. A name change updates '
            'display_name only.', OLD.lookup_code
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_account_a_lookup_code ON account;
CREATE TRIGGER trg_account_a_lookup_code BEFORE INSERT ON account
    FOR EACH ROW EXECUTE FUNCTION account_issue_lookup_code();

DROP TRIGGER IF EXISTS trg_account_lookup_immutable ON account;
CREATE TRIGGER trg_account_lookup_immutable BEFORE UPDATE ON account
    FOR EACH ROW EXECUTE FUNCTION account_lookup_code_immutable();

-- The counter lookup filters on tenant_id and matches a prefix on lookup_code,
-- so it needs a tenant-leading index on the raw column. `text_pattern_ops`
-- would be the natural choice for a prefix match, but under RLS the LIKE
-- operator is not leakproof and could never be an index condition anyway
-- (invariant 15) — the default opclass serves the equality-and-range form the
-- planner actually gets to use.
CREATE INDEX IF NOT EXISTS account_tenant_lookup_code_idx
    ON account (tenant_id, lookup_code);
