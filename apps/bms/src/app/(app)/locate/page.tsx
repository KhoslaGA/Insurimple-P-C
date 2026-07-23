'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  Input,
  Table,
  type Column,
} from '@insurimple/design-system';

type Segment = 'insureds' | 'prospects' | 'all';
type AccountType = 'Insured' | 'Prospect';
type AccountStatus = 'active' | 'inactive' | 'cancelling';

interface Account {
  id: string;
  lookup_code: string;
  name: string;
  type: AccountType;
  status: AccountStatus;
  city: string;
  phone: string;
  email: string;
  lines: string[]; // line codes only — status lives in the Status badge
}

/**
 * Fixture book — Phase 1 swaps this for GET /accounts on the API (RLS-scoped).
 * `id`s are the real seeded account UUIDs, so a row click reaches the live
 * household record at /households/[id].
 */
const ACCOUNTS: Account[] = [
  { id: 'a0000000-0000-0000-0000-000000000001', lookup_code: 'ABTAHISE01', name: 'Seyed Moein Abtahi', type: 'Insured', status: 'cancelling', city: 'Richmond Hill, ON', phone: '(647) 553-7656', email: 'abtmoien@gmail.com', lines: ['AUTO'] },
  { id: 'a0000000-0000-0000-0000-000000000002', lookup_code: 'GILLAM01', name: 'Amrit Gill', type: 'Insured', status: 'active', city: 'Brampton, ON', phone: '(905) 555-0217', email: 'amrit.gill@email.ca', lines: ['AUTO'] },
  { id: 'a0000000-0000-0000-0000-000000000003', lookup_code: 'MEHTARA01', name: 'Rahul Mehta', type: 'Insured', status: 'active', city: 'Mississauga, ON', phone: '(647) 555-0529', email: 'r.mehta@email.ca', lines: ['AUTO', 'TENA'] },
  { id: 'a0000000-0000-0000-0000-000000000004', lookup_code: 'KAPOORGA01', name: 'Gautam & Tanvi Kapoor', type: 'Insured', status: 'active', city: 'Brampton, ON', phone: '(647) 870-8623', email: 'gautamkhosla75@gmail.com', lines: ['AUTO', 'TENA'] },
  { id: 'a0000000-0000-0000-0000-000000000005', lookup_code: 'SANDHUGU01', name: 'Gurpreet Sandhu', type: 'Prospect', status: 'active', city: 'Brampton, ON', phone: '(416) 555-0633', email: 'g.sandhu@email.ca', lines: ['AUTO'] },
  { id: 'a0000000-0000-0000-0000-000000000006', lookup_code: 'PETROVNI01', name: 'Nikolai Petrov', type: 'Insured', status: 'inactive', city: 'Brampton, ON', phone: '(905) 555-0466', email: 'n.petrov@email.ca', lines: ['AUTO'] },
];

const STATUS_TONE: Record<AccountStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  inactive: 'neutral',
  cancelling: 'warning',
};

const STATUS_LABEL: Record<AccountStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  cancelling: 'Cancelling',
};

const columns: Column<Account>[] = [
  {
    key: 'code',
    header: 'Lookup code',
    width: '132px',
    cell: (a) => <span className="whitespace-nowrap font-medium tabular-nums">{a.lookup_code}</span>,
  },
  {
    key: 'name',
    header: 'Account name',
    cell: (a) => <span className="block truncate font-medium" title={a.name}>{a.name}</span>,
  },
  {
    key: 'type',
    header: 'Type',
    width: '108px',
    cell: (a) => <Badge tone={a.type === 'Prospect' ? 'accent' : 'neutral'}>{a.type}</Badge>,
  },
  {
    key: 'status',
    header: 'Status',
    width: '128px',
    cell: (a) => <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>,
  },
  {
    key: 'city',
    header: 'City',
    width: '184px',
    cell: (a) => <span className="block truncate" title={a.city}>{a.city}</span>,
  },
  {
    key: 'phone',
    header: 'Phone',
    width: '150px',
    cell: (a) => <span className="whitespace-nowrap tabular-nums">{a.phone}</span>,
  },
  {
    key: 'lines',
    header: 'Policies',
    width: '148px',
    cell: (a) => <span className="whitespace-nowrap text-text-2">{a.lines.join(' · ') || '—'}</span>,
  },
];

export default function LocatePage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [includeInactive, setIncludeInactive] = useState(true);
  const [selIndex, setSelIndex] = useState(-1);
  const filterWrap = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ACCOUNTS.filter((a) => {
      if (segment === 'insureds' && a.type !== 'Insured') return false;
      if (segment === 'prospects' && a.type !== 'Prospect') return false;
      if (!includeInactive && a.status === 'inactive') return false;
      if (!needle) return true;
      return [a.lookup_code, a.name, a.phone, a.email, ...a.lines]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [q, segment, includeInactive]);

  const open = (a: Account) => router.push(`/households/${a.id}`);

  // Keyboard: ↑/↓ move selection, Enter opens, `/` focuses the filter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const input = filterWrap.current?.querySelector('input');
      const inFilter = document.activeElement === input;
      if (e.key === '/' && !inFilter) {
        e.preventDefault();
        input?.focus();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelIndex((i) => Math.min(rows.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelIndex((i) => Math.max(0, i < 0 ? 0 : i - 1));
      } else if (e.key === 'Enter') {
        setSelIndex((i) => {
          const row = rows[i];
          if (row) router.push(`/households/${row.id}`);
          return i;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rows, router]);

  const clearFilters = () => {
    setQ('');
    setSegment('all');
    setIncludeInactive(true);
  };

  // Derive (don't store) a clamped selection so a shrinking filter can't leave
  // the index out of range.
  const selectedIndex = selIndex >= rows.length ? rows.length - 1 : selIndex;
  const selectedId = selectedIndex >= 0 ? rows[selectedIndex]?.id : undefined;

  return (
    <div className="flex h-full flex-col px-8 py-6">
      <header className="mb-4">
        <h1 className="text-h1 text-text-1">Locate</h1>
        <p className="text-small text-text-2">Jump to any client, prospect, or policy.</p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div ref={filterWrap} className="w-full max-w-md">
          <Input
            icon="search"
            autoFocus
            placeholder="Filter these results"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Segmented control — single-select (defect 4) */}
        <div className="flex items-center gap-1.5">
          <Chip selected={segment === 'insureds'} onClick={() => setSegment('insureds')}>Insureds</Chip>
          <Chip selected={segment === 'prospects'} onClick={() => setSegment('prospects')}>Prospects</Chip>
          <Chip selected={segment === 'all'} onClick={() => setSegment('all')}>All</Chip>
        </div>

        {/* Independent toggle */}
        <Chip
          icon={includeInactive ? 'check' : 'plus'}
          selected={includeInactive}
          onClick={() => setIncludeInactive((v) => !v)}
        >
          Include inactive
        </Chip>

        <span className="ml-auto text-small text-text-3">
          {rows.length} {rows.length === 1 ? 'account' : 'accounts'}
        </span>
      </div>

      <div className="min-h-0 flex-1">
        <Table
          columns={columns}
          rows={rows}
          getRowId={(a) => a.id}
          onRowClick={open}
          selectedId={selectedId}
          empty={
            <EmptyState
              title="No accounts match that filter"
              description="Nothing here with the current filters. Clear them to see the whole book."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          }
        />
      </div>
    </div>
  );
}
