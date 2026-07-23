'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Table, Tabs, TxnStateBadge, type Column } from '@insurimple/design-system';
import type {
  WorkQueues,
  QueueActivity,
  QueueRenewal,
  QueueSuspenseItem,
  ActivityPriority,
} from '@insurimple/contracts';

const PRIORITY_TONE: Record<ActivityPriority, 'warning' | 'info' | 'neutral'> = {
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

const LINE_LABEL: Record<string, string> = {
  auto: 'AUTO', property: 'HAB', tenant: 'TENA', condo: 'CONDO',
  umbrella: 'UMBR', commercial: 'COMM', life: 'LIFE',
};

const titleCase = (s: string) =>
  s ? s.replace(/(^|_)([a-z])/g, (_, p, c) => (p ? ' ' : '') + c.toUpperCase()) : s;

const money = (v: number | string | null) =>
  v == null ? '—' : `$${Number(v).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtDate = (v: string | null) => {
  if (!v) return '—';
  const d = new Date(`${v.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
};

export function WorkQueuesView({ queues, preview = false }: { queues: WorkQueues; preview?: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState('day');
  const open = (accountId: string | null) => accountId && router.push(`/households/${accountId}`);

  const renewalCols: Column<QueueRenewal>[] = [
    { key: 'code', header: 'Lookup', width: '128px',
      cell: (r) => <span className="whitespace-nowrap font-medium tabular-nums">{r.lookup_code ?? '—'}</span> },
    { key: 'name', header: 'Household', cell: (r) => <span className="block truncate font-medium">{r.account_name}</span> },
    { key: 'line', header: 'Line', width: '84px',
      cell: (r) => <Badge tone="neutral">{LINE_LABEL[r.line] ?? r.line.toUpperCase()}</Badge> },
    { key: 'carrier', header: 'Carrier', width: '150px', cell: (r) => <span className="block truncate">{r.carrier_name ?? '—'}</span> },
    { key: 'expiry', header: 'Expires', width: '150px',
      cell: (r) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="tabular-nums">{fmtDate(r.expiry_date)}</span>
          <Badge tone={r.days_to_expiry <= 30 ? 'warning' : 'neutral'}>{r.days_to_expiry}d</Badge>
        </span>
      ) },
    { key: 'premium', header: 'Premium', width: '110px', align: 'right', cell: (r) => money(r.annual_premium) },
  ];

  const suspenseCols: Column<QueueSuspenseItem>[] = [
    { key: 'ref', header: 'Txn', width: '120px', cell: (s) => <span className="whitespace-nowrap font-medium tabular-nums">{s.reference ?? '—'}</span> },
    { key: 'type', header: 'Type', width: '130px', cell: (s) => <span className="whitespace-nowrap">{titleCase(s.txn_type)}</span> },
    { key: 'name', header: 'Household', cell: (s) => <span className="block truncate font-medium">{s.account_name}</span> },
    { key: 'carrier', header: 'Carrier', width: '140px', cell: (s) => <span className="block truncate">{s.carrier_name ?? '—'}</span> },
    { key: 'state', header: 'State', width: '200px', cell: (s) => <TxnStateBadge state={s.state} /> },
    { key: 'opened', header: 'Opened', width: '110px', cell: (s) => <span className="whitespace-nowrap tabular-nums">{fmtDate(s.opened_at)}</span> },
  ];

  const tabs = [
    { value: 'day', label: 'My day', icon: 'sun', count: queues.activities.length },
    { value: 'renewals', label: 'Renewals', icon: 'calendar-due', count: queues.renewals.length },
    { value: 'suspense', label: 'Suspense', icon: 'clock-pause', count: queues.suspense.length },
  ];

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col px-8 py-6">
      <header className="mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-text-1">Work queues</h1>
          {preview ? <Badge tone="warning">Preview data</Badge> : null}
        </div>
        <p className="text-small text-text-2">The CSR&apos;s day — what needs doing, what&apos;s renewing, what&apos;s waiting on a carrier.</p>
      </header>

      <div className="mb-4">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
      </div>

      {tab === 'day' ? (
        queues.activities.length ? (
          <div className="flex flex-col gap-2">
            {queues.activities.map((a: QueueActivity) => (
              <button
                key={a.id}
                onClick={() => open(a.account_id)}
                className="flex flex-col items-start gap-1 rounded-card border border-border-1 bg-surface-card p-3.5 text-left transition-colors hover:bg-surface-panel"
              >
                <div className="flex w-full flex-wrap items-center gap-2">
                  <Badge tone={PRIORITY_TONE[a.priority]}>{titleCase(a.priority)}</Badge>
                  {a.overdue ? <Badge tone="danger">Overdue</Badge> : null}
                  <span className="font-medium text-text-1">{a.title}</span>
                  <span className="ml-auto whitespace-nowrap text-caption text-text-3">
                    {titleCase(a.activity_type)} · due {fmtDate(a.due_at)}
                  </span>
                </div>
                {a.body ? <p className="text-small text-text-2">{a.body}</p> : null}
                {a.account_name ? (
                  <span className="text-caption text-text-3">
                    {a.lookup_code ? `${a.lookup_code} · ` : ''}{a.account_name}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-card border border-dashed border-border-2 bg-surface-panel px-5 py-8 text-center text-small text-text-3">
            Nothing due — the diary is clear.
          </p>
        )
      ) : null}

      {tab === 'renewals' ? (
        <Table
          columns={renewalCols}
          rows={queues.renewals}
          getRowId={(r) => r.policy_id}
          onRowClick={(r) => open(r.account_id)}
          empty={
            <p className="rounded-card border border-dashed border-border-2 bg-surface-panel px-5 py-8 text-center text-small text-text-3">
              No policies renewing in the next 120 days.
            </p>
          }
        />
      ) : null}

      {tab === 'suspense' ? (
        <Table
          columns={suspenseCols}
          rows={queues.suspense}
          getRowId={(s) => s.txn_id}
          onRowClick={(s) => open(s.account_id)}
          empty={
            <p className="rounded-card border border-dashed border-border-2 bg-surface-panel px-5 py-8 text-center text-small text-text-3">
              Nothing waiting on a carrier.
            </p>
          }
        />
      ) : null}
    </div>
  );
}
