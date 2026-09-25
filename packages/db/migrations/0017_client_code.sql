-- ============================================================================
-- 0017_client_code.sql — the client code (invariant 11).
--
--   persons:        first6(last) + first2(first) + counter    ABTAHI + SE + 01
--   no given name:  first8(name)               + counter    MAPLERID + 01
--                   (organizations, benefits groups, single-name persons)
--
-- LOCKED by operator decision 2026-09-25: this is the format of the operator's
-- live Epic seat, and a migrated book keeps every code verbatim. The original
-- `first4 + first2 + counter` spec is superseded (docs/SPEC-STATUS.md §1).
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
-- The stem. Fold, A-Z only, never pad.
--
--   given name present:  first6(last) + first2(first)      MEHTA + RA  -> MEHTARA
--   no given name:       first8(name)                      MAPLERID
--
-- The second branch is the organization rule (a commercial or benefits account
-- has one name, not two), and it also covers a single-name person: the rule is
-- keyed on the absence of a given name, not on the account kind, so the two
-- implementations need no knowledge of `kind` to agree.
--
-- Never pad is load-bearing: MEHTA + RA gives MEHTARA01, not MEHTA_RA01 or
-- MEHTAXRA01. It matches the live Epic book, and a migrated client keeps the
-- code already printed on their documents (invariant 11). Short names simply
-- give short stems; the counter still makes the code unique in the tenant.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION normalize_name_to_stem(p_last text, p_first text)
RETURNS text
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
             WHEN fold_latin(p_first) = '' THEN left(upper(fold_latin(p_last)), 8)
             ELSE left(upper(fold_latin(p_last)), 6) || left(upper(fold_latin(p_first)), 2)
           END
$$;

-- ----------------------------------------------------------------------------
-- The stem for an account row, from what the row carries at INSERT time.
--
-- The named-insured party does not exist yet when the account is inserted
-- (account_party is written after the account), so the name comes from
-- display_name. A personal account's display_name is "Given [Middle] Family":
-- the last whitespace token is the surname and the first token the given name.
-- Everything that is not a personal account, and a personal account with a
-- single-token name, is one name and takes the 8-letter rule.
--
-- Choices this makes, to be confirmed against the live Epic seat (see
-- docs/SPEC-STATUS.md §1):
--   * a compound surname typed with spaces ("Ann-Marie Van der Berg") stems
--     on its last token: BERGAN. Structured first/last input gives VANDERAN.
--   * hyphens and apostrophes are dropped, not split: "Al Smith-Jones" ->
--     SMITHJAL, "Sean O'Brien" -> OBRIENSE, "Ronald McDonald" -> MCDONARO.
--   * a single-name person ("Madonna") takes the 8-letter rule: MADONNA.
--   * an organization keeps its suffix words: "Maple Ridge Dental Professional
--     Corp." -> MAPLERID; "TD Auto Finance" -> TDAUTOFI.
--
-- `clientCodeStemForAccount` in packages/contracts mirrors this exactly, and
-- client-code.test.mjs runs both over one table of cases.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION client_code_stem_for_account(p_kind text, p_display_name text)
RETURNS text
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
             WHEN p_kind = 'personal' AND btrim(coalesce(p_display_name, '')) ~ '\s'
               THEN normalize_name_to_stem(
                      regexp_replace(btrim(p_display_name), '^.*\s', ''),
                      regexp_replace(btrim(p_display_name), '\s.*$', ''))
             ELSE normalize_name_to_stem(btrim(coalesce(p_display_name, '')), '')
           END
$$;

-- ----------------------------------------------------------------------------
-- The code. Stem plus the next free counter for that stem, in this tenant.
--
-- Two digits until 99, then three — never truncated, because a code that
-- silently wraps produces a duplicate that the unique constraint rejects at the
-- 100th client with the same stem, which is a Tuesday afternoon nobody wants.
--
-- "Skips any code already in use" falls out of max+1: every code on this stem,
-- issued here or imported from Epic, parses to a counter <= max, so max+1 can
-- never format to a string already present, whatever its digit width
-- (MEHTARA0007 imported -> next is MEHTARA08). Gaps in an imported book are
-- never back-filled: the numbering continues after the highest code.
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

    -- NOT lpad(v_next::text, 2, '0'): lpad TRUNCATES to its length argument,
    -- so it turns 100 into '10' and the 100th client collides with the 10th.
    -- That is the silent wrap the paragraph above promises never happens, and
    -- it shipped that way until client-code.test.mjs inserted a hundred.
    RETURN v_stem || CASE WHEN v_next < 10 THEN '0' || v_next::text ELSE v_next::text END;
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
BEGIN
    IF NEW.lookup_code IS NOT NULL THEN
        RETURN NEW;   -- a migrated book supplies its existing codes, kept verbatim
    END IF;
    -- Persons split display_name into given + family; everything else (and a
    -- single-name person) is one name. client_code_stem_for_account() is the
    -- one place that rule lives; issue_client_code() adds the counter under
    -- the per-stem advisory lock.
    IF NEW.kind = 'personal' AND btrim(NEW.display_name) ~ '\s' THEN
        NEW.lookup_code := issue_client_code(
            regexp_replace(btrim(NEW.display_name), '^.*\s', ''),
            regexp_replace(btrim(NEW.display_name), '\s.*$', ''));
    ELSE
        NEW.lookup_code := issue_client_code(btrim(NEW.display_name), '');
    END IF;
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
