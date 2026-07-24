'use client';

import { useState } from 'react';
import {
  recordRemarketOutcome,
  retentionScorecard,
  type RemarketDisposition,
} from '@insurimple/contracts';
import { Badge, Button, Card } from '@insurimple/design-system';
import { BEST_CARRIER, BEST_PREMIUM_CENTS, type RenewalRow } from '@/lib/mock/renewals';

function dollars(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-CA')}`;
}
function stamp(): string {
  return new Date().toISOString();
}

export function RenewalQueue({ initialRows }: { initialRows: RenewalRow[] }) {
  const [rows, setRows] = useState<RenewalRow[]>(initialRows);
  const card = retentionScorecard(rows.map((r) => r.renewal));

  function decide(id: string, disposition: RemarketDisposition) {
    setRows((rs) =>
      rs.map((row) => {
        if (row.renewal.id !== id) return row;
        const shopId = `shop-${id}`;
        const decision =
          disposition === 'move'
            ? {
                disposition,
                chosenCarrier: BEST_CARRIER,
                chosenPremium: { currency: 'CAD' as const, amountCents: BEST_PREMIUM_CENTS },
                reason: `Moved to ${BEST_CARRIER} — lower firm premium.`,
                decidedAt: stamp(),
                shopId,
              }
            : disposition === 'stay'
              ? { disposition, reason: 'Incumbent renewal still competitive.', decidedAt: stamp(), shopId }
              : { disposition, reason: 'Client chose not to renew.', decidedAt: stamp(), shopId };
        return { ...row, renewal: recordRemarketOutcome(row.renewal, decision) };
      }),
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div>
        <h2 className="text-h2 font-medium text-text-1">Renewals</h2>
        <p className="text-small text-text-3">Shop each renewal and record the outcome — the retention scorecard updates live.</p>
      </div>

      {/* Retention scorecard */}
      <Card>
        <div className="mb-3 text-caption font-medium uppercase tracking-[0.06em] text-text-3">
          P&amp;C retention scorecard
        </div>
        {card.shopped === 0 ? (
          <p className="text-small text-text-3">No renewals shopped yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Shopped" value={String(card.shopped)} />
            <Metric label="Retained" value={`${card.retained}`} tone="success" />
            <Metric label="Lost" value={`${card.lost}`} tone={card.lost > 0 ? 'danger' : 'neutral'} />
            <Metric label="Premium saved" value={dollars(card.premiumSavedCents)} tone="success" />
          </div>
        )}
        {card.shopped > 0 ? (
          <div className="mt-3 text-caption text-text-3">
            Retention rate {Math.round(card.retentionRate * 100)}% ({card.stayed} stayed · {card.moved} moved · {card.declined} declined)
          </div>
        ) : null}
      </Card>

      {/* Queue */}
      <div className="flex flex-col gap-3">
        {rows.map(({ renewal, householdName, incumbentCarrier }) => (
          <Card key={renewal.id} className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="min-w-0">
              <div className="font-medium text-text-1">{householdName}</div>
              <div className="text-caption text-text-3">
                {incumbentCarrier} · {renewal.policyRef} · {renewal.line} · expiring {dollars(renewal.expiringPremium.amountCents)}/yr
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {renewal.status === 'completed' && renewal.outcome ? (
                <Outcome
                  disposition={renewal.outcome.disposition}
                  savedCents={renewal.outcome.savedCents}
                  carrier={renewal.outcome.chosenCarrier}
                />
              ) : (
                <>
                  <span className="mr-1 text-caption text-text-3">Shop &amp; decide:</span>
                  <Button size="sm" variant="primary" onClick={() => decide(renewal.id, 'move')}>
                    Move to {BEST_CARRIER} ({dollars(BEST_PREMIUM_CENTS)})
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => decide(renewal.id, 'stay')}>
                    Stay
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => decide(renewal.id, 'client_declined')}>
                    Client declined
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'danger' | 'neutral' }) {
  const color = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-text-1';
  return (
    <div>
      <div className={`text-h1 font-medium ${color}`}>{value}</div>
      <div className="text-caption text-text-3">{label}</div>
    </div>
  );
}

function Outcome({
  disposition,
  savedCents,
  carrier,
}: {
  disposition: RemarketDisposition;
  savedCents: number;
  carrier?: string;
}) {
  if (disposition === 'move') {
    return (
      <div className="flex items-center gap-2">
        <Badge tone="success" dot>Moved{carrier ? ` → ${carrier}` : ''}</Badge>
        {savedCents > 0 ? <span className="text-caption text-success">saved {dollars(savedCents)}/yr</span> : null}
      </div>
    );
  }
  if (disposition === 'stay') {
    return <Badge tone="accent" dot>Stayed (retained)</Badge>;
  }
  return <Badge tone="danger" dot>Client declined (lost)</Badge>;
}
