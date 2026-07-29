'use client';

import { useState, useTransition } from 'react';
import { Badge, Button, Field, Select, Table, type Column } from '@insurimple/design-system';
import type { MarketRow, QuoteResult, CarrierQuote } from '@insurimple/contracts';
import { quotePolicy } from '../app/(app)/rating/actions';
import type { PolicyOption } from './ProofsView';

const LINE_LABEL: Record<string, string> = {
  auto: 'AUTO', property: 'HAB', tenant: 'TENA', condo: 'CONDO',
  umbrella: 'UMBR', commercial: 'COMM', life: 'LIFE',
};

const CHANNEL_LABEL: Record<string, string> = {
  csio_json_api: 'CSIO JSON API',
  direct_api: 'Direct API',
  rater: 'Rater bridge',
  portal: 'Carrier portal',
  manual: 'Manual',
  secure_delivery: 'Secure delivery',
  email: 'Email',
  csio_edocs: 'CSIO eDocs',
  csio_edi: 'CSIO EDI',
  none: 'None',
};

const money = (v: number) => `$${Math.round(v).toLocaleString('en-CA')}`;

export function RatingView({
  markets,
  policies,
  canQuote,
  preview = false,
}: {
  markets: MarketRow[];
  policies: PolicyOption[];
  canQuote: boolean;
  preview?: boolean;
}) {
  const [policyId, setPolicyId] = useState(policies[0]?.policy_id ?? '');
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = () => {
    setError(null);
    start(async () => {
      const r = await quotePolicy(policyId);
      if (r.ok && r.result) setResult(r.result);
      else setError(r.error ?? 'Rating failed.');
    });
  };

  const marketColumns: Column<MarketRow>[] = [
    { key: 'carrier', header: 'Carrier', cell: (m) => <span className="font-medium">{m.carrier_name}</span> },
    { key: 'line', header: 'Line', width: '84px',
      cell: (m) => <Badge tone="neutral">{LINE_LABEL[m.line] ?? m.line.toUpperCase()}</Badge> },
    { key: 'code', header: 'Broker code', width: '130px',
      cell: (m) => <span className="whitespace-nowrap tabular-nums text-text-2">{m.broker_code ?? '—'}</span> },
    { key: 'comm', header: 'Commission', width: '110px', align: 'right',
      cell: (m) => (m.commission_rate == null ? '—' : `${(Number(m.commission_rate) * 100).toFixed(2)}%`) },
    { key: 'quote', header: 'Quote', width: '140px',
      cell: (m) => <span className="text-text-2">{CHANNEL_LABEL[m.quote_channel ?? ''] ?? '—'}</span> },
    { key: 'submit', header: 'Submit', width: '140px',
      cell: (m) => <span className="text-text-2">{CHANNEL_LABEL[m.submit_channel ?? ''] ?? '—'}</span> },
    { key: 'download', header: 'Download', width: '130px',
      cell: (m) => <span className="text-text-2">{CHANNEL_LABEL[m.download_channel ?? ''] ?? '—'}</span> },
    { key: 'status', header: 'Appointment', width: '130px',
      cell: (m) => <Badge tone={m.active ? 'success' : 'warning'}>{m.active ? 'Appointed' : 'Pending'}</Badge> },
  ];

  return (
    <>
      <section className="mb-5 rounded-card border border-border-1 bg-surface-card p-4">
        <h2 className="mb-3 text-caption font-medium uppercase tracking-caps text-text-3">
          Indicative rating
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-md">
            <Field label="Policy">
              <Select value={policyId} onChange={(e) => setPolicyId(e.target.value)}>
                {policies.map((p) => (
                  <option key={p.policy_id} value={p.policy_id}>{p.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Button onClick={run} disabled={pending || !policyId || !canQuote || preview}>
            {pending ? 'Rating…' : 'Rate across markets'}
          </Button>
          {preview ? (
            <span className="pb-2 text-small text-text-3">
              Connect the API (set API_URL) to run the rater.
            </span>
          ) : !canQuote ? (
            <span className="pb-2 text-small text-text-3">
              Rating requires the pc.quote.create capability.
            </span>
          ) : null}
        </div>
        {error ? <p className="mt-3 text-small text-danger">{error}</p> : null}

        {result ? (
          <div className="mt-4 border-t border-border-1 pt-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="warning">Indicative only — not bindable</Badge>
              {result.quotes.every((q) => q.is_mock) ? (
                <Badge tone="warning">Mock carrier data</Badge>
              ) : null}
              <span className="text-small text-text-2">
                {result.policy.account_name} · {LINE_LABEL[result.policy.line] ?? result.policy.line}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {result.quotes.map((q: CarrierQuote) => {
                const isBest = !q.declined && result.best?.carrierId === q.carrierId;
                return (
                  <div
                    key={q.carrierId}
                    className={`rounded-card border p-4 ${isBest ? 'border-accent bg-accent-tint' : 'border-border-1'}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-text-1">{q.carrierName}</span>
                      <Badge tone="neutral">{CHANNEL_LABEL[q.channel] ?? q.channel}</Badge>
                      {isBest ? <Badge tone="success">Best</Badge> : null}
                      <span className="ml-auto text-h2 tabular-nums text-text-1">
                        {q.declined ? '—' : money(q.annualPremium)}
                      </span>
                    </div>
                    {q.declined ? (
                      <p className="mt-2 text-small text-danger">Declined — {q.declineReason}</p>
                    ) : (
                      <>
                        <ul className="mt-2 flex flex-col gap-0.5">
                          {q.breakdown.map((b, i) => (
                            <li key={i} className="flex justify-between text-small">
                              <span className="text-text-2">{b.description}</span>
                              <span className="tabular-nums text-text-1">{money(b.premium)}</span>
                            </li>
                          ))}
                        </ul>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-caption text-text-3">
                            Why this price
                          </summary>
                          <ul className="mt-1.5 flex flex-col gap-0.5">
                            {q.factors.map((f, i) => (
                              <li key={i} className="text-caption text-text-2">· {f}</li>
                            ))}
                          </ul>
                        </details>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-caption text-text-3">
              Every market approached — including declines — is written to the quote log, which
              is the Take-All-Comers evidence.
            </p>
          </div>
        ) : null}
      </section>

      <h2 className="mb-2 text-caption font-medium uppercase tracking-caps text-text-3">
        Markets &amp; connectivity
      </h2>
      <Table
        columns={marketColumns}
        rows={markets}
        getRowId={(m) => m.id}
        empty={
          <p className="rounded-card border border-dashed border-border-2 bg-surface-panel px-5 py-8 text-center text-small text-text-3">
            No markets configured yet.
          </p>
        }
      />
    </>
  );
}
