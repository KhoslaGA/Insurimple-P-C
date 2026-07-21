'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  Input,
  Table,
  type Column,
} from '@insurimple/design-system';

interface Account {
  id: string;
  lookup_code: string;
  name: string;
  type: 'Insured' | 'Prospect';
  status: 'Active' | 'Inactive';
  city: string;
  phone: string;
  email: string;
  policies: string;
}

/** Fixture book — Phase 1 swaps this for GET /accounts on the API (RLS-scoped). */
const ACCOUNTS: Account[] = [
  { id: '1', lookup_code: 'ABTAHISE01', name: 'Seyed Moein Abtahi', type: 'Insured', status: 'Active', city: 'Richmond Hill, ON', phone: '(647) 553-7656', email: 'abtmoien@gmail.com', policies: 'AUTO · cancelling' },
  { id: '2', lookup_code: 'GILLAM01', name: 'Amrit Gill', type: 'Insured', status: 'Active', city: 'Brampton, ON', phone: '(905) 555-0217', email: 'amrit.gill@email.ca', policies: 'AUTO' },
  { id: '3', lookup_code: 'MEHTARA01', name: 'Rahul Mehta', type: 'Insured', status: 'Active', city: 'Mississauga, ON', phone: '(647) 555-0529', email: 'r.mehta@email.ca', policies: 'AUTO · TENA' },
  { id: '4', lookup_code: 'KAPOORGA01', name: 'Gautam & Tanvi Kapoor', type: 'Insured', status: 'Active', city: 'Brampton, ON', phone: '(647) 870-8623', email: 'gautamkhosla75@gmail.com', policies: 'AUTO · TENA' },
  { id: '5', lookup_code: 'SANDHUGU01', name: 'Gurpreet Sandhu', type: 'Prospect', status: 'Active', city: 'Brampton, ON', phone: '(416) 555-0633', email: 'g.sandhu@email.ca', policies: 'quoting — AUTO' },
  { id: '6', lookup_code: 'PETROVNI01', name: 'Nikolai Petrov', type: 'Insured', status: 'Inactive', city: 'Brampton, ON', phone: '(905) 555-0466', email: 'n.petrov@email.ca', policies: 'cancelled Jun 30' },
];

const columns: Column<Account>[] = [
  { key: 'code', header: 'Lookup code', width: '130px',
    cell: (a) => <span className="font-medium tabular-nums">{a.lookup_code}</span> },
  { key: 'name', header: 'Account name', cell: (a) => <span className="font-medium">{a.name}</span> },
  { key: 'type', header: 'Type',
    cell: (a) => <Badge tone={a.type === 'Prospect' ? 'accent' : 'neutral'}>{a.type}</Badge> },
  { key: 'status', header: 'Status',
    cell: (a) => <Badge tone={a.status === 'Active' ? 'success' : 'neutral'}>{a.status}</Badge> },
  { key: 'city', header: 'City', cell: (a) => a.city },
  { key: 'phone', header: 'Phone', cell: (a) => a.phone },
  { key: 'policies', header: 'Policies', cell: (a) => a.policies },
];

export default function LocatePage() {
  const [q, setQ] = useState('');
  const [showProspects, setShowProspects] = useState(false);
  const [showInactive, setShowInactive] = useState(true);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ACCOUNTS.filter((a) => {
      if (a.type === 'Prospect' && !showProspects) return false;
      if (a.status === 'Inactive' && !showInactive) return false;
      if (!needle) return true;
      return [a.lookup_code, a.name, a.phone, a.email, a.policies]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [q, showProspects, showInactive]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-5">
        <h1 className="text-hero text-text-1">Locate</h1>
        <p className="text-body text-text-2">
          Find any client, prospect, or policy — search covers code, name, phone, and email.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="w-96">
          <Input
            icon="search"
            autoFocus
            placeholder="Start typing — results filter as you go"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Chip selected={!showProspects} onClick={() => setShowProspects(false)}>
          Insureds only
        </Chip>
        <Chip selected={showProspects} onClick={() => setShowProspects(true)}>
          Include prospects
        </Chip>
        <Chip selected={showInactive} onClick={() => setShowInactive(!showInactive)}>
          Include inactive
        </Chip>
        <span className="ml-auto text-small text-text-3">
          {rows.length} {rows.length === 1 ? 'account' : 'accounts'}
        </span>
      </div>

      <Table
        columns={columns}
        rows={rows}
        getRowId={(a) => a.id}
        empty={
          <EmptyState
            title="No accounts match"
            description={`Nothing found for "${q}". Check the spelling, or widen the filters — prospects and inactive accounts are hidden unless included. Still nothing? This might be a new client.`}
            action={<Button variant="secondary">Create new household</Button>}
          />
        }
      />
    </div>
  );
}
