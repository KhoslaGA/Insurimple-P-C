/**
 * Client code — the stem half (CLAUDE.md invariant 11).
 *
 *   persons:        first6(last) + first2(first) + counter    ABTAHI + SE + 01
 *   no given name:  first8(name)               + counter    MAPLERID + 01
 *
 * Locked by operator decision 2026-09-25 (the live Epic seat's format; the
 * `first4 + first2` spec is superseded, docs/SPEC-STATUS.md §1).
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
 * The stem: six letters of the surname plus two of the given name, uppercase;
 * or, when there is no given name (an organization, a benefits group, a
 * single-name person), eight letters of the one name.
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
  const givenName = foldLatin(first).toUpperCase();
  if (givenName === '') return foldLatin(last).toUpperCase().slice(0, 8);
  return foldLatin(last).toUpperCase().slice(0, 6) + givenName.slice(0, 2);
}

export type AccountKind = 'personal' | 'commercial' | 'benefits';

/**
 * The stem the database will issue for an account row, from what the row
 * carries at INSERT time — mirrors `client_code_stem_for_account()` in 0017 so
 * the UI can preview a code before the row exists.
 *
 * A personal account's display name is "Given [Middle] Family": the last
 * whitespace token is the surname, the first token the given name. Any other
 * kind, and a personal account whose name is a single token, is one name and
 * takes the eight-letter rule. Hyphens and apostrophes are dropped, not split
 * (Smith-Jones -> SMITHJ, O'Brien -> OBRIEN); a compound surname typed with
 * spaces stems on its last token (Van der Berg -> BERG). Structured
 * first/last input goes through `normalizeNameToStem` directly.
 */
export function clientCodeStemForAccount(kind: AccountKind, displayName: string): string {
  const name = displayName.trim();
  if (kind === 'personal' && /\s/.test(name)) {
    return normalizeNameToStem(name.replace(/^.*\s/, ''), name.replace(/\s.*$/, ''));
  }
  return normalizeNameToStem(name, '');
}

/** The counter suffix the database appends. Two digits until 99, then three — never truncated. */
export function formatClientCodeCounter(n: number): string {
  return String(n).padStart(2, '0');
}
