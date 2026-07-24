/**
 * TR.6 acceptance — a flagged renewal shops and returns an outcome that updates the
 * renewal transaction.
 */
import { describe, it, expect } from 'vitest';
import { RenewalTransactionSchema, cad, recordRemarketOutcome } from '../src';

function dueRenewal() {
  return RenewalTransactionSchema.parse({
    id: 'ren-1',
    tenantId: 'tenant-klc',
    policyRef: 'A21677149PLA',
    householdId: 'OKONKA01',
    line: 'auto',
    expiringPremium: cad(3600),
    effectiveDate: '2026-12-24',
    status: 'due',
  });
}

describe('remarket outcome writes back to the renewal', () => {
  it('a move to a cheaper carrier completes the renewal and records the saving', () => {
    const r = recordRemarketOutcome(dueRenewal(), {
      disposition: 'move',
      chosenCarrier: 'Maple Mutual',
      chosenPremium: cad(3204),
      reason: 'Lowest firm premium with matching coverage.',
      decidedAt: '2026-11-01T10:00:00.000Z',
      shopId: 'shop-1',
    });
    expect(r.status).toBe('completed');
    expect(r.shopId).toBe('shop-1'); // linked to the remarket shop
    expect(r.outcome?.disposition).toBe('move');
    expect(r.outcome?.savedCents).toBe(360000 - 320400); // $396 saved
  });

  it('a stay retains the client with no premium saving', () => {
    const r = recordRemarketOutcome(dueRenewal(), {
      disposition: 'stay',
      reason: 'Incumbent renewal still competitive.',
      decidedAt: '2026-11-01T10:00:00.000Z',
    });
    expect(r.outcome?.disposition).toBe('stay');
    expect(r.outcome?.savedCents).toBe(0);
    expect(r.status).toBe('completed');
  });

  it('a client-declined is recorded as a loss', () => {
    const r = recordRemarketOutcome(dueRenewal(), {
      disposition: 'client_declined',
      reason: 'Client did not renew.',
      decidedAt: '2026-11-01T10:00:00.000Z',
    });
    expect(r.outcome?.disposition).toBe('client_declined');
    expect(r.outcome?.savedCents).toBe(0);
  });

  it('the completed renewal validates against its schema', () => {
    const r = recordRemarketOutcome(dueRenewal(), {
      disposition: 'move',
      chosenCarrier: 'Maple Mutual',
      chosenPremium: cad(3204),
      reason: 'Best firm quote.',
      decidedAt: '2026-11-01T10:00:00.000Z',
    });
    expect(() => RenewalTransactionSchema.parse(r)).not.toThrow();
  });
});
