/**
 * The client code, and the agreement between its two implementations.
 *
 * `normalizeNameToStem` here and `normalize_name_to_stem()` in 0017 encode the
 * same rule. Two implementations drift — that is not a hypothetical, it is what
 * happened to `tenant_tables()` — so the second suite runs both over this same
 * table and fails if they ever disagree. It skips, loudly, when no database is
 * reachable, rather than passing quietly.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clientCodeStemForAccount,
  foldLatin,
  formatClientCodeCounter,
  normalizeNameToStem,
  type AccountKind,
} from './client-code.ts';

/** last, first, expected stem — the shared table both implementations must satisfy. */
export const CASES: Array<[string, string | null, string]> = [
  // the live Epic book, which the format matches by decision (invariant 11)
  ['Abtahi', 'Seyed Moein', 'ABTAHISE'],
  ['Kapoor', 'Gautam', 'KAPOORGA'],
  ['Mehta', 'Rahul', 'MEHTARA'],            // 5-letter surname, never padded

  // punctuation and spacing are dropped, not replaced
  ["O'Brien", 'Sean', 'OBRIENSE'],
  ['Van der Berg', 'Ann-Marie', 'VANDERAN'],
  ['  Singh  ', ' Jas ', 'SINGHJA'],

  // combining marks: NFKD handles these
  ['Sáenz-Peña', 'José', 'SAENZPJO'],
  ['Müller', 'Jürgen', 'MULLERJU'],

  // stroke and ligature letters: NFKD does NOT handle these, and dropping one
  // loses the first letter of a surname in a code that is immutable forever
  ['Đặng', 'Thị', 'DANGTH'],
  ['Ørsted', 'Åse', 'ORSTEDAS'],
  ['Łukasiewicz', 'Paweł', 'LUKASIPA'],
  ['Þórsdóttir', 'Æsa', 'TORSDOAS'],
  ['Straße', 'Œuvre', 'STRASEOU'],

  // hyphens, apostrophes and prefixes are folded, never split (locked 2026-09-25;
  // to be confirmed against the live Epic seat)
  ['Smith-Jones', 'Al', 'SMITHJAL'],
  ['McDonald', 'Ronald', 'MCDONARO'],
  ["O'Neil", 'Seán', 'ONEILSE'],

  // no given name: eight letters of the one name (organizations, benefits
  // groups, single-name persons), never padded
  ['TD Auto Finance', null, 'TDAUTOFI'],
  ['Maple Ridge Dental Professional Corp.', null, 'MAPLERID'],
  ['Madonna', null, 'MADONNA'],
  ['A1 Towing', null, 'ATOWING'],           // digits dropped, then the slice
  ['Smith', '', 'SMITH'],

  // short and degenerate
  ['Ng', 'Li', 'NGLI'],
  ['Wu', 'A', 'WUA'],
];

/** kind, display_name, expected stem — what the INSERT trigger derives from an account row. */
export const ACCOUNT_CASES: Array<[AccountKind, string, string]> = [
  ['personal', 'Seyed Moein Abtahi', 'ABTAHISE'],
  ['personal', 'Rahul Mehta', 'MEHTARA'],
  ['personal', '  Jas Singh  ', 'SINGHJA'],
  ['personal', 'Thị Đặng', 'DANGTH'],
  ['personal', 'Al Smith-Jones', 'SMITHJAL'],
  ['personal', "Sean O'Brien", 'OBRIENSE'],
  ['personal', 'Ronald McDonald', 'MCDONARO'],
  // a compound surname typed with spaces stems on its last token — structured
  // first/last input (normalizeNameToStem) gives VANDERAN instead
  ['personal', 'Ann-Marie Van der Berg', 'BERGAN'],
  // a single-name person has no given name and takes the eight-letter rule
  ['personal', 'Madonna', 'MADONNA'],
  // organizations and benefits groups are one name, whatever their spacing
  ['commercial', 'TD Auto Finance', 'TDAUTOFI'],
  ['commercial', 'Maple Ridge Dental Professional Corp.', 'MAPLERID'],
  ['commercial', 'Ng Holdings', 'NGHOLDIN'],
  ['benefits', 'Northfield Logistics Inc.', 'NORTHFIE'],
];

describe('client code stem', () => {
  for (const [last, first, expected] of CASES) {
    it(`${last} / ${first ?? '(none)'} -> ${expected}`, () => {
      assert.equal(normalizeNameToStem(last, first), expected);
    });
  }

  it('drops digits rather than keeping them', () => {
    assert.equal(normalizeNameToStem('Smith2', 'John3'), 'SMITHJO');
  });

  it('is stable under repeated application', () => {
    const once = foldLatin('Đặng');
    assert.equal(foldLatin(once), once);
  });

  it('never pads a short surname', () => {
    assert.equal(normalizeNameToStem('Ng', 'Li').length, 4);
  });

  it('handles null and undefined without throwing', () => {
    assert.equal(normalizeNameToStem(null), '');
    assert.equal(normalizeNameToStem(undefined, undefined), '');
  });

  it('uses eight letters only when the given name folds to nothing', () => {
    assert.equal(normalizeNameToStem('Abcdefghij', null), 'ABCDEFGH');
    assert.equal(normalizeNameToStem('Abcdefghij', '-'), 'ABCDEFGH');   // punctuation-only given name
    assert.equal(normalizeNameToStem('Abcdefghij', 'K'), 'ABCDEFK');
  });
});

describe('client code stem for an account row', () => {
  for (const [kind, displayName, expected] of ACCOUNT_CASES) {
    it(`${kind} / ${displayName} -> ${expected}`, () => {
      assert.equal(clientCodeStemForAccount(kind, displayName), expected);
    });
  }
});

describe('client code counter', () => {
  it('is two digits from 01 and widens to three after 99, never truncated', () => {
    assert.equal(formatClientCodeCounter(1), '01');
    assert.equal(formatClientCodeCounter(99), '99');
    assert.equal(formatClientCodeCounter(100), '100');
    assert.equal(formatClientCodeCounter(1000), '1000');
  });
});
