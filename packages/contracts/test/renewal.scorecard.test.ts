/**
 * TR.6 acceptance — the P&C service scorecard reflects saves vs losses.
 */
import { describe, it, expect } from 'vitest';
import { RenewalTransactionSchema, cad, recordRemarketOutcome, retentionScorecard } from '../src';

function due(id: string, premiumDollars: number) {
  return RenewalTransactionSchema.parse({
    id,
    tenantId: 'tenant-klc',
    policyRef: `P-${id}`,
    householdId: 'H',
    line: 'auto',
    expiringPremium: cad(premiumDollars),
    effectiveDate: '2026-12-24',
    status: 'due',
  });
}

const at = '2026-11-01T10:00:00.000Z';

describe('retention scorecard', () => {
  const renewals = [
    recordRemarketOutcome(due('r1', 3600), { disposition: 'move', chosenCarrier: 'Maple', chosenPremium: cad(3204), reason: 'x', decidedAt: at }),
    recordRemarketOutcome(due('r2', 2000), { disposition: 'stay', reason: 'x', decidedAt: at }),
    recordRemarketOutcome(due('r3', 1500), { disposition: 'client_declined', reason: 'x', decidedAt: at }),
    due('r4', 999), // still due — no outcome, excluded from the scorecard
  ];
  const card = retentionScorecard(renewals);

  it('counts only shopped renewals (those with an outcome)', () => {
    expect(card.shopped).toBe(3);
  });

  it('splits retained (stay + move) vs lost (declined)', () => {
    expect(card.stayed).toBe(1);
    expect(card.moved).toBe(1);
    expect(card.declined).toBe(1);
    expect(card.retained).toBe(2);
    expect(card.lost).toBe(1);
  });

  it('computes the retention rate', () => {
    expect(card.retentionRate).toBeCloseTo(2 / 3);
  });

  it('sums premium saved across moves', () => {
    expect(card.premiumSavedCents).toBe(360000 - 320400);
  });
});
