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
import { normalizeNameToStem, foldLatin } from './client-code.ts';

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

  // short and degenerate
  ['Ng', 'Li', 'NGLI'],
  ['Wu', 'A', 'WUA'],
  ['TD Auto Finance', null, 'TDAUTO'],      // organization: no given name
  ['Smith', '', 'SMITH'],
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
});
