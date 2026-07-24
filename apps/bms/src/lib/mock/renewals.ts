/**
 * Mock renewal queue for TR.6. Deterministic renewals due for shopping; stands in for
 * the NestJS renewal/transaction layer. BEST_* is the shopped best firm quote a "move"
 * lands on (from the comparison in TR.5).
 */
import { RenewalTransactionSchema, cad, type RenewalTransaction } from '@insurimple/contracts';

export const BEST_CARRIER = 'Maple Mutual';
export const BEST_PREMIUM_CENTS = cad(3204).amountCents;

export interface RenewalRow {
  renewal: RenewalTransaction;
  householdName: string;
  incumbentCarrier: string;
}

function due(
  id: string,
  policyRef: string,
  householdId: string,
  line: 'auto' | 'property',
  premiumDollars: number,
): RenewalTransaction {
  return RenewalTransactionSchema.parse({
    id,
    tenantId: 'tenant-klc',
    policyRef,
    householdId,
    line,
    expiringPremium: cad(premiumDollars),
    effectiveDate: '2026-12-24',
    status: 'due',
  });
}

export const mockRenewals: RenewalRow[] = [
  { renewal: due('ren-okonkwo', 'A21677149PLA', 'OKONKA01', 'auto', 3600), householdName: 'Okonkwo & Mensah', incumbentCarrier: 'True North P&C' },
  { renewal: due('ren-tremblay', 'H55231887HAB', 'TREMBL02', 'property', 1850), householdName: 'Tremblay, Luc', incumbentCarrier: 'Laurier Insurance' },
  { renewal: due('ren-boychuk', 'C88120043CON', 'BOYCHU03', 'property', 980), householdName: 'Boychuk, Daryna', incumbentCarrier: 'Maple Mutual' },
];
