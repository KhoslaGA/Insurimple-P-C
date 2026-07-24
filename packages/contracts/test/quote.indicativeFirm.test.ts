/**
 * TR.3 — indicative vs firm is a first-class data flag, never a UI label (rule #1).
 * A number may be presented to a client as firm only if the carrier returned it for
 * this exact risk. (Binding itself does not exist anywhere in the module.)
 */
import { describe, it, expect } from 'vitest';
import { isPresentableAsFirm } from '../src';
import { quoteResultsFixture } from './fixtures';

describe('indicative vs firm', () => {
  const results = quoteResultsFixture();
  const maple = results.find((r) => r.id === 'res-maple');
  const cascadia = results.find((r) => r.id === 'res-cascadia');

  it('a firm quoted result may be presented as firm', () => {
    expect(maple?.provenance).toBe('firm');
    expect(isPresentableAsFirm(maple!)).toBe(true);
  });

  it('an indicative number can never be presented as firm', () => {
    const indicative = { ...maple!, provenance: 'indicative' as const };
    expect(isPresentableAsFirm(indicative)).toBe(false);
  });

  it('a decline is not a presentable firm number, even when firm', () => {
    expect(cascadia?.provenance).toBe('firm');
    expect(isPresentableAsFirm(cascadia!)).toBe(false);
  });
});
