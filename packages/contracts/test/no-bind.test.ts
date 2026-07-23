/**
 * Module invariant (kickoff rule #2 / CLAUDE.md #1) — no bind capability
 * anywhere. Quoting never crosses into binding. This is test-asserted at the
 * package boundary: the contracts surface exposes no bind/issue affordance, and
 * quote input carries no premium or bound-policy fields.
 */
import { describe, it, expect } from 'vitest';
import * as contracts from '../src';
import { QuoteInputSchema } from '../src';

describe('no bind capability', () => {
  it('the contracts package exposes no binding/issuing affordance', () => {
    const offenders = Object.keys(contracts).filter((name) => /bind|bound|issuepolicy/i.test(name));
    expect(offenders).toEqual([]);
  });

  it('quote input is pre-bind: no premium, policy number, or bound flag', () => {
    const fields = Object.keys(QuoteInputSchema.shape);
    expect(fields).not.toContain('premium');
    expect(fields).not.toContain('policyNumber');
    expect(fields).not.toContain('bound');
    expect(fields).not.toContain('status'); // no indicative/firm here either — that's TR.3
  });
});
