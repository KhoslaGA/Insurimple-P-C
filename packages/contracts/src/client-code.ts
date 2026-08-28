/**
 * Client code — the stem half (CLAUDE.md invariant 11).
 *
 *   first6(last) + first2(first) + counter        ABTAHI + SE + 01
 *
 * This exists so the UI can show a client's code before the row is written.
 * It deliberately does NOT issue one: the counter is a read-then-write against
 * every other account in the tenant, and resolving it anywhere but inside the
 * inserting statement is a race. `issue_client_code()` in 0017 does that, from
 * a BEFORE INSERT trigger, so a bulk import or a psql session cannot skip it.
 *
 * Two implementations of one rule is how things drift, which is why
 * `client-code.test.ts` runs this and the SQL function over the same table of
 * cases and fails if they ever disagree. Change one, change both, or the build
 * tells you.
 */

/**
 * Letters whose diacritic is a stroke or a ligature. NFKD decomposes a letter
 * into a base plus combining marks — é becomes e + U+0301 — but these are
 * single indivisible code points with no decomposition, so they survive NFKD
 * and are then deleted by the A-Z filter.
 *
 * Đặng folded to ANG before this existed: the surname lost its first letter,
 * and because the client code is immutable that wrong code would have been
 * printed on the client's pink slip and carried through six years of retained
 * records. Vietnamese, Polish, Scandinavian and Icelandic surnames are ordinary
 * in a Canadian brokerage's book.
 *
 * Folds are 1:1 — Þ to T, ß to S — matching the SQL side. The stem is a lookup
 * key, not a rendering of the name.
 */
const FOLD: Record<string, string> = {
  Ð: 'D', Đ: 'D', đ: 'd', ð: 'd',
  Ø: 'O', ø: 'o',
  Þ: 'T', þ: 't',
  Ł: 'L', ł: 'l',
  Ħ: 'H', ħ: 'h',
  Ŧ: 'T', ŧ: 't',
  Œ: 'O', œ: 'o',
  Æ: 'A', æ: 'a',
  ß: 's',
};

/** Fold to bare A–Z. Stroke/ligature letters first, then NFKD, then strip. */
export function foldLatin(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/[ÐĐđðØøÞþŁłĦħŦŧŒœÆæß]/g, (c) => FOLD[c] ?? c)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z]/g, '');
}

/**
 * The stem: six letters of the surname, two of the given name, uppercase.
 *
 * Never padded. `Mehta, Rahul` gives MEHTARA, not MEHTA_RA — which is what the
 * live Epic book does, so a migrated client keeps the code already printed on
 * their documents. Short names simply produce short stems; the counter still
 * makes the whole code unique within the tenant.
 */
export function normalizeNameToStem(
  last: string | null | undefined,
  first?: string | null,
): string {
  return foldLatin(last).toUpperCase().slice(0, 6) + foldLatin(first).toUpperCase().slice(0, 2);
}

/** The counter suffix the database appends. Two digits until 99, then three. */
export function formatClientCodeCounter(n: number): string {
  return String(n).padStart(2, '0');
}
