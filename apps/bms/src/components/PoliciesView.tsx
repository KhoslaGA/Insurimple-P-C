'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Chip, EmptyState, Input, Table, type Column } from '@insurimple/design-system';
import type { PolicyListRow } from '@insurimple/contracts';

const LINE_LABEL: Record<string, string> = {
  auto: 'AUTO', property: 'HAB', tenant: 'TENA', condo: 'CONDO',
  umbrella: 'UMBR', commercial: 'COMM', life: 'LIFE',
};

const STATUS_TONE: Record<PolicyListRow['status'], 'success' | 'accent' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  in_force: 'success',
  bound: 'info',
  quoted: 'accent',
  cancelled: 'danger',
  lapsed: 'warning',
  expired: 'neutral',
};

const money = (v: number | string | null) =>
  v == null ? '—' : Number(v).toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

const fmtDate = (v: string | null) => {
  if (!v) return '—';
  const d = new Date(`${v.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
};

const titleCase = (s: string) => s.replace(/(^|_)([a-z])/g, (_, p, c) => (p ? ' ' : '') + c.toUpperCase());

type Filter = 'in_force' | 'all' | 'renewing';

export function PoliciesView({ policies }: { policies: PolicyListRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('in_force');
  const [line, setLine] = useState<string>('all');

  const lines = useMemo(
    () => Array.from(new Set(policies.map((p) => p.line))).sort(),
    [policies],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return policies.filter((p) => {
      if (filter === 'in_force' && p.status !== 'in_force') return false;
      if (filter === 'renewing' && !(p.status === 'in_force' && p.days_to_expiry != null && p.days_to_expiry <= 120)) return false;
      if (line !== 'all' && p.line !== line) return false;
      if (!needle) return true;
      return [p.policy_number, p.account_name, p.lookup_code, p.carrier_name, p.line]
        .filter(Boolean).join(' ').toLowerCase().includes(needle);
    });
  }, [policies, q, filter, line]);

  const premium = rows.reduce((s, p) => s + Number(p.annual_premium ?? 0), 0);

  const columns: Column<PolicyListRow>[] = [
    { key: 'line', header: 'Line', width: '84px',
      cell: (p) => <Badge tone="neutral">{LINE_LABEL[p.line] ?? p.line.toUpperCase()}</Badge> },
    { key: 'number', header: 'Policy', width: '140px',
      cell: (p) => <span className="whitespace-nowrap font-medium tabular-nums">{p.policy_number ?? '—'}</span> },
    { key: 'account', header: 'Household', cell: (p) => <span className="block truncate font-medium">{p.account_name}</span> },
    { key: 'carrier', header: 'Carrier', width: '130px', cell: (p) => <span className="block truncate">{p.carrier_name ?? '—'}</span> },
    { key: 'status', header: 'Status', width: '110px',
      cell: (p) => <Badge tone={STATUS_TONE[p.status]}>{titleCase(p.status)}</Badge> },
    { key: 'risks', header: 'Risks', width: '110px',
      cell: (p) => (
        <span className="whitespace-nowrap text-caption text-text-3">
          {p.vehicle_count ? `${p.vehicle_count} veh` : ''}
          {p.vehicle_count && p.dwelling_count ? ' · ' : ''}
          {p.dwelling_count ? `${p.dwelling_count} loc` : ''}
          {!p.vehicle_count && !p.dwelling_count ? '—' : ''}
          {p.coverage_count ? ` · ${p.coverage_count} cov` : ''}
        </span>
      ) },
    { key: 'expiry', header: 'Expires', width: '150px',
      cell: (p) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="tabular-nums">{fmtDate(p.expiry_date)}</span>
          {p.status === 'in_force' && p.days_to_expiry != null && p.days_to_expiry <= 60 ? (
            <Badge tone="warning">{p.days_to_expiry}d</Badge>
          ) : null}
        </span>
      ) },
    { key: 'premium', header: 'Premium', width: '110px', align: 'right', cell: (p) => money(p.annual_premium) },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            icon="search"
            placeholder="Filter policies"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Chip selected={filter === 'in_force'} onClick={() => setFilter('in_force')}>In force</Chip>
          <Chip selected={filter === 'renewing'} onClick={() => setFilter('renewing')}>Renewing ≤120d</Chip>
          <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
        </div>
        <div className="flex items-center gap-1.5">
          <Chip selected={line === 'all'} onClick={() => setLine('all')}>All lines</Chip>
          {lines.map((l) => (
            <Chip key={l} selected={line === l} onClick={() => setLine(l)}>
              {LINE_LABEL[l] ?? l.toUpperCase()}
            </Chip>
          ))}
        </div>
        <span className="ml-auto text-small text-text-3">
          {rows.length} {rows.length === 1 ? 'policy' : 'policies'} · {money(premium)}
        </span>
      </div>

      <Table
        columns={columns}
        rows={rows}
        getRowId={(p) => p.id}
        onRowClick={(p) => router.push(`/households/${p.account_id}`)}
        empty={
          <EmptyState
            title="No policies match that filter"
            description="Widen the filters to see the rest of the book."
          />
        }
      />
    </>
  );
}
