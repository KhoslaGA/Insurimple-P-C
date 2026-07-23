'use client';

import { useRouter } from 'next/navigation';
import { Badge, EmptyState, Table, TxnStateBadge, type Column } from '@insurimple/design-system';
import type { TxnSummary } from '@insurimple/contracts';

const TYPE_LABEL: Record<string, string> = {
  new_business: 'New business', renewal: 'Renewal', endorsement: 'Endorsement',
  cancellation: 'Cancellation', reinstatement: 'Reinstatement', remarket: 'Remarket',
  claim_fnol: 'Claim FNOL',
};

export function TxnRows({ rows, problem }: { rows: TxnSummary[]; problem: string | null }) {
  const router = useRouter();

  const columns: Column<TxnSummary>[] = [
    { key: 'ref', header: 'Txn', width: '120px',
      cell: (t) => <span className="whitespace-nowrap font-medium tabular-nums">{t.reference ?? '—'}</span> },
    { key: 'type', header: 'Type', width: '150px',
      cell: (t) => <Badge tone="neutral">{TYPE_LABEL[t.txn_type] ?? t.txn_type}</Badge> },
    { key: 'account', header: 'Household', cell: (t) => <span className="block truncate font-medium">{t.account_name ?? '—'}</span> },
    { key: 'carrier', header: 'Carrier', width: '150px', cell: (t) => <span className="block truncate">{t.carrier_name ?? '—'}</span> },
    { key: 'state', header: 'State', width: '210px', cell: (t) => <TxnStateBadge state={t.state} /> },
  ];

  if (problem) {
    return (
      <EmptyState
        title="Couldn’t load transactions"
        description={`The API said: ${problem}. Check that apps/api is running and your organization is linked to a tenant.`}
      />
    );
  }

  return (
    <Table
      columns={columns}
      rows={rows}
      getRowId={(t) => t.id}
      onRowClick={(t) => router.push(`/transactions/${t.id}`)}
      empty={
        <EmptyState
          title="No transactions yet"
          description="Open one from a household to start the servicing loop."
        />
      }
    />
  );
}
