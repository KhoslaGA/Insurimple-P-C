'use client';

import { useState } from 'react';
import {
  draftClientQuoteSummary,
  presentDocument,
  type ClientQuoteSummary,
  type ComparisonView,
  type PresentedDocument,
  type QuoteResult,
  type QuoteShop,
} from '@insurimple/contracts';
import { Badge, Button, Card, Table } from '@insurimple/design-system';

function dollars(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-CA')}`;
}
function deltaLabel(cents: number | null): string {
  if (cents === null || cents === 0) return '—';
  const abs = dollars(Math.abs(cents));
  return cents > 0 ? `+${abs}` : `−${abs}`;
}
function stamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

export function Comparison({
  shop,
  results,
  view,
  insuredName,
}: {
  shop: QuoteShop;
  results: QuoteResult[];
  view: ComparisonView;
  insuredName: string;
}) {
  const [summary, setSummary] = useState<ClientQuoteSummary | null>(null);
  const [presented, setPresented] = useState<PresentedDocument | null>(null);

  function generate() {
    setSummary(draftClientQuoteSummary(shop, results, { generatedAt: stamp(), insuredName }));
    setPresented(null);
  }
  function present() {
    if (!summary) return;
    setPresented(
      presentDocument(shop, summary, {
        id: 'pres-1',
        version: (presented?.version ?? 0) + 1,
        generatedAt: stamp(),
      }),
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div>
        <h2 className="text-h2 font-medium text-text-1">Compare quotes</h2>
        <p className="text-small text-text-3">
          Shop {shop.id} · risk {view.riskRef.riskId} v{view.riskRef.version} · {view.rows.length} carriers approached
        </p>
      </div>

      <Card className="p-0">
        <Table
          minWidth={560}
          rows={view.rows}
          rowKey={(row) => row.resultId}
          columns={[
            {
              header: 'Carrier',
              render: (row) => (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-1">{row.carrier.name}</span>
                    {row.isBest ? <Badge tone="success">Best</Badge> : null}
                  </div>
                  {row.coverageVariant ? <div className="text-caption text-text-3">{row.coverageVariant}</div> : null}
                  {row.declineReason ? <div className="text-caption text-text-3">{row.declineReason}</div> : null}
                </div>
              ),
            },
            { header: 'Source', render: (row) => <span className="text-text-2">{row.source}</span> },
            {
              header: 'Annual premium',
              align: 'right',
              render: (row) =>
                row.premium ? (
                  <span className="font-medium text-text-1">{dollars(row.premium.amountCents)}</span>
                ) : (
                  <span className="text-text-3">—</span>
                ),
            },
            {
              header: 'vs best',
              align: 'right',
              render: (row) => <span className="text-text-2">{deltaLabel(row.premiumDeltaVsBestCents)}</span>,
            },
            {
              header: 'Status',
              render: (row) =>
                row.outcome === 'declined' ? (
                  <Badge tone="danger" dot>Declined</Badge>
                ) : row.provenance === 'indicative' ? (
                  <Badge tone="warning" dot>Indicative</Badge>
                ) : (
                  <Badge tone="success" dot>Firm quote</Badge>
                ),
            },
          ]}
        />
      </Card>
      <p className="text-caption text-text-3">
        Declines and referral reasons are logged for the file. Indicative numbers are estimates until
        the carrier confirms — never bindable.
      </p>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-body font-medium text-text-1">Client quote summary</h3>
          <span className="ml-auto flex gap-2">
            <Button variant="secondary" size="sm" onClick={generate}>
              Generate summary
            </Button>
            <Button variant="primary" size="sm" onClick={present} disabled={!summary}>
              Record as presented
            </Button>
          </span>
        </div>

        {summary ? (
          <div className="rounded-card border border-border-1 bg-surface-panel p-4">
            <div className="text-small text-text-1">
              Prepared for {summary.insuredName} · {summary.generatedAt}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {summary.lines.map((line, i) => (
                <div key={i} className="flex flex-col gap-0.5 border-b border-border-1 pb-2 last:border-0">
                  <div className="flex items-center gap-2 text-small text-text-1">
                    <span className="font-medium">{line.carrier}</span>
                    <span className="ml-auto">{line.premiumLabel}</span>
                    {line.marking === 'indicative' ? (
                      <Badge tone="warning">Indicative</Badge>
                    ) : (
                      <Badge tone="success">Firm</Badge>
                    )}
                  </div>
                  {line.marking === 'indicative' ? (
                    <div className="text-caption text-warning">{line.indicativeNotice}</div>
                  ) : null}
                  {line.coverage ? <div className="text-caption text-text-3">{line.coverage}</div> : null}
                </div>
              ))}
            </div>
            <p className="mt-3 text-caption text-text-3">{summary.disclaimer}</p>
          </div>
        ) : (
          <p className="text-small text-text-3">
            Generate the client-facing summary. The drafter gate guarantees every indicative number is
            marked before it can be shown or recorded.
          </p>
        )}

        {presented ? (
          <div className="text-caption text-success">
            Presented v{presented.version} recorded and linked to shop {presented.shopId}.
          </div>
        ) : null}
      </Card>
    </div>
  );
}
