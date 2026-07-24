/**
 * TR.2 acceptance (testable core) — "a returning client's prior policy prefills the
 * risk … no data re-keyed from the party record" + "partial quotes resume."
 */
import { describe, it, expect } from 'vitest';
import { AutoRiskSchema } from '@insurimple/contracts';
import { mockHousehold, mockPriorAutoPolicy } from '../mock/household';
import { prefillAutoFromPrior } from './prefill';
import { deserializeDraft, serializeDraft, type QuoteDraft } from './draft';

describe('prior-policy prefill', () => {
  const draft = prefillAutoFromPrior(mockHousehold, mockPriorAutoPolicy, '2027-07-01');

  it('produces a valid canonical auto risk', () => {
    expect(() => AutoRiskSchema.parse(draft)).not.toThrow();
  });

  it('takes the named insured + party from the household, not re-keyed', () => {
    expect(draft.namedInsured).toEqual(mockHousehold.primaryContact);
    expect(draft.party.householdId).toBe(mockHousehold.id);
  });

  it('carries drivers, vehicles, and coverages forward from the prior policy', () => {
    expect(draft.drivers).toEqual(mockPriorAutoPolicy.risk.drivers);
    expect(draft.vehicles).toEqual(mockPriorAutoPolicy.risk.vehicles);
    expect(draft.coverages).toEqual(mockPriorAutoPolicy.risk.coverages);
  });

  it('sets the new effective date', () => {
    expect(draft.effectiveDate).toBe('2027-07-01');
  });
});

describe('draft resume (round-trip)', () => {
  it('a saved partial quote resumes identically', () => {
    const draft: QuoteDraft = {
      householdId: mockHousehold.id,
      updatedAt: '2027-06-01T10:00:00.000Z',
      risk: prefillAutoFromPrior(mockHousehold, mockPriorAutoPolicy, '2027-07-01'),
    };
    expect(deserializeDraft(serializeDraft(draft))).toEqual(draft);
  });
});
