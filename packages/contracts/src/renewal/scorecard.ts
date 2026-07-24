/**
 * Retention scorecard (TR.6) — saves vs losses across shopped renewals. A stay or a move
 * retains the client; a client-declined is a loss. Premium saved sums the moves that
 * beat the expiring premium.
 */
import type { RenewalTransaction } from './renewal';

export interface RetentionScorecard {
  shopped: number;
  stayed: number;
  moved: number;
  declined: number;
  retained: number; // stayed + moved
  lost: number; // declined
  retentionRate: number; // retained / shopped (0..1)
  premiumSavedCents: number;
}

export function retentionScorecard(renewals: readonly RenewalTransaction[]): RetentionScorecard {
  const done = renewals.filter((r) => r.outcome);
  const count = (d: string) => done.filter((r) => r.outcome?.disposition === d).length;

  const stayed = count('stay');
  const moved = count('move');
  const declined = count('client_declined');
  const retained = stayed + moved;
  const premiumSavedCents = done.reduce(
    (sum, r) => sum + (r.outcome?.disposition === 'move' ? Math.max(0, r.outcome.savedCents) : 0),
    0,
  );

  return {
    shopped: done.length,
    stayed,
    moved,
    declined,
    retained,
    lost: declined,
    retentionRate: done.length ? retained / done.length : 0,
    premiumSavedCents,
  };
}
