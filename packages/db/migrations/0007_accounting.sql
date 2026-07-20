-- ============================================================================
-- 0007_accounting.sql
-- Double-entry, append-only ledger. Trust and General are separate books.
-- Journal entries are immutable; a correction posts a reversing entry, never
-- an edit. This is what survives a RIBO Spot Check and produces Form 1.
-- ============================================================================

-- Chart of accounts. Each account belongs to a book: trust or general.
CREATE TABLE ledger_account (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    book            text NOT NULL CHECK (book IN ('trust','general')),
    code            text NOT NULL,                   -- '1000','2000', ...
    name            text NOT NULL,
    type            text NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, book, code)
);

-- Journal entry header. Immutable once posted.
CREATE TABLE journal_entry (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    book            text NOT NULL CHECK (book IN ('trust','general')),
    reference       text,                            -- 'RCP-2211','DIS-1190'
    description     text,
    entry_date      date NOT NULL DEFAULT current_date,
    txn_id          uuid REFERENCES txn(id),          -- link money to the transaction
    reverses_id     uuid REFERENCES journal_entry(id),-- correction => reversing entry
    posted          boolean NOT NULL DEFAULT false,
    posted_at       timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON journal_entry (tenant_id, book, entry_date);

-- Journal lines. Debits and credits; each line hits one ledger account.
CREATE TABLE journal_line (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    entry_id        uuid NOT NULL REFERENCES journal_entry(id) ON DELETE CASCADE,
    account_id      uuid NOT NULL REFERENCES ledger_account(id),
    party_account_id uuid REFERENCES account(id),      -- sub-ledger: whose money
    debit           numeric(14,2) NOT NULL DEFAULT 0 CHECK (debit  >= 0),
    credit          numeric(14,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
    created_at      timestamptz NOT NULL DEFAULT now(),
    CHECK ( (debit = 0) <> (credit = 0) )              -- exactly one side per line
);
CREATE INDEX ON journal_line (entry_id);
CREATE INDEX ON journal_line (account_id);

-- ----------------------------------------------------------------------------
-- Posting = balance + immutability enforcement.
-- On posting, debits must equal credits and the book must match the entry.
-- After posting, lines cannot be added/changed and the entry cannot be edited.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION je_enforce_post() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    tot_d numeric(14,2);
    tot_c numeric(14,2);
    wrong_book int;
BEGIN
    -- immutability: once posted, no edits to the header (except the act of posting)
    IF TG_OP = 'UPDATE' AND OLD.posted THEN
        RAISE EXCEPTION 'journal_entry % is posted and immutable', OLD.id;
    END IF;

    IF NEW.posted THEN
        SELECT coalesce(sum(debit),0), coalesce(sum(credit),0)
          INTO tot_d, tot_c
          FROM journal_line WHERE entry_id = NEW.id;
        IF tot_d <> tot_c THEN
            RAISE EXCEPTION 'unbalanced entry %: debit % <> credit %', NEW.id, tot_d, tot_c;
        END IF;
        IF tot_d = 0 THEN
            RAISE EXCEPTION 'entry % has no lines', NEW.id;
        END IF;
        -- every line's ledger account must belong to the entry's book
        SELECT count(*) INTO wrong_book
          FROM journal_line jl
          JOIN ledger_account la ON la.id = jl.account_id
         WHERE jl.entry_id = NEW.id AND la.book <> NEW.book;
        IF wrong_book > 0 THEN
            RAISE EXCEPTION 'entry % mixes books', NEW.id;
        END IF;
        IF NEW.posted_at IS NULL THEN
            NEW.posted_at := now();
        END IF;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_je_post BEFORE UPDATE ON journal_entry
    FOR EACH ROW EXECUTE FUNCTION je_enforce_post();

-- Lock lines once the parent entry is posted.
CREATE OR REPLACE FUNCTION jl_lock_when_posted() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE is_posted boolean;
BEGIN
    SELECT posted INTO is_posted FROM journal_entry
     WHERE id = coalesce(NEW.entry_id, OLD.entry_id);
    IF is_posted THEN
        RAISE EXCEPTION 'cannot modify lines of a posted entry';
    END IF;
    RETURN coalesce(NEW, OLD);
END $$;
CREATE TRIGGER trg_jl_lock BEFORE INSERT OR UPDATE OR DELETE ON journal_line
    FOR EACH ROW EXECUTE FUNCTION jl_lock_when_posted();

-- ----------------------------------------------------------------------------
-- Trust balance view + Form 1 helper. Trust position = assets - liabilities in
-- the trust book. This is a derived view, never hand-edited.
-- ----------------------------------------------------------------------------
CREATE VIEW trust_position AS
SELECT je.tenant_id,
       sum(jl.debit - jl.credit) FILTER (WHERE la.type = 'asset')     AS trust_assets,
       sum(jl.credit - jl.debit) FILTER (WHERE la.type = 'liability') AS trust_liabilities,
       sum(jl.debit - jl.credit) FILTER (WHERE la.type = 'asset')
         - sum(jl.credit - jl.debit) FILTER (WHERE la.type = 'liability') AS trust_surplus
FROM journal_entry je
JOIN journal_line jl ON jl.entry_id = je.id
JOIN ledger_account la ON la.id = jl.account_id
WHERE je.book = 'trust' AND je.posted
GROUP BY je.tenant_id;

-- ----------------------------------------------------------------------------
-- Commission ledger: expected vs received, for reconciliation against carrier
-- statements. Variance queue is expected - received beyond a threshold.
-- ----------------------------------------------------------------------------
CREATE TABLE commission_entry (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    policy_id       uuid REFERENCES policy(id),
    carrier_id      uuid REFERENCES carrier(id),
    period          date,                            -- statement month
    expected        numeric(12,2),
    received        numeric(12,2),
    status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open','matched','variance','written_off')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON commission_entry (tenant_id, status);

CREATE TRIGGER trg_touch BEFORE UPDATE ON ledger_account   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch BEFORE UPDATE ON commission_entry FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
-- note: journal_entry uses trg_je_post (its own trigger sets posted_at); add touch too
CREATE TRIGGER trg_touch BEFORE UPDATE ON journal_entry    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

SELECT enable_tenant_table('ledger_account');
SELECT enable_tenant_table('journal_entry');
SELECT enable_tenant_table('journal_line');
SELECT enable_tenant_table('commission_entry');
