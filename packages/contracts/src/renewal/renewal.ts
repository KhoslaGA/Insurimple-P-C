/**
 * Renewal transaction + remarket outcome (TR.6). A renewal that gets shopped links to a
 * remarket quote_shop (purpose 'remarket' | 'renewal_shop', policyRef = the policy), and
 * the outcome — stay | move | client declined — is written back here and rolls up into the
 * retention scorecard.
 */
import { z } from 'zod';
import { MoneySchema, type Money } from '../risk';

export const RemarketDispositionSchema = z.enum(['stay', 'move', 'client_declined']);
export type RemarketDisposition = z.infer<typeof RemarketDispositionSchema>;

export const RenewalStatusSchema = z.enum(['due', 'shopping', 'completed']);
export type RenewalStatus = z.infer<typeof RenewalStatusSchema>;

export const RemarketOutcomeSchema = z.object({
  disposition: RemarketDispositionSchema,
  chosenCarrier: z.string().optional(),
  chosenPremium: MoneySchema.optional(),
  reason: z.string().min(1),
  decidedAt: z.string().datetime(),
  /** Expiring premium − chosen premium (a save when moved cheaper; may be negative). */
  savedCents: z.number().int(),
});
export type RemarketOutcome = z.infer<typeof RemarketOutcomeSchema>;

export const RenewalTransactionSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  policyRef: z.string().min(1),
  householdId: z.string().min(1),
  line: z.enum(['auto', 'property']),
  expiringPremium: MoneySchema,
  effectiveDate: z.string().date(),
  status: RenewalStatusSchema,
  /** The remarket shop opened for this renewal, once shopped. */
  shopId: z.string().optional(),
  outcome: RemarketOutcomeSchema.optional(),
});
export type RenewalTransaction = z.infer<typeof RenewalTransactionSchema>;

export interface RemarketDecision {
  disposition: RemarketDisposition;
  chosenCarrier?: string;
  chosenPremium?: Money;
  reason: string;
  decidedAt: string;
  shopId?: string;
}

/**
 * Write a remarket outcome back to the renewal transaction. Returns a new completed
 * renewal; the saved premium is computed (only a `move` to a cheaper carrier saves).
 */
export function recordRemarketOutcome(
  renewal: RenewalTransaction,
  decision: RemarketDecision,
): RenewalTransaction {
  const savedCents =
    decision.disposition === 'move' && decision.chosenPremium
      ? renewal.expiringPremium.amountCents - decision.chosenPremium.amountCents
      : 0;

  const outcome: RemarketOutcome = {
    disposition: decision.disposition,
    chosenCarrier: decision.chosenCarrier,
    chosenPremium: decision.chosenPremium,
    reason: decision.reason,
    decidedAt: decision.decidedAt,
    savedCents,
  };

  return {
    ...renewal,
    status: 'completed',
    shopId: decision.shopId ?? renewal.shopId,
    outcome,
  };
}
