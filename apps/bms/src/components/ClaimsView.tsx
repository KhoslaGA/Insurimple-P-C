'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Field, Input, Modal, Select, Table, type Column } from '@insurimple/design-system';
import type { ClaimRow, ClaimStatus } from '@insurimple/contracts';
import { reportFnol } from '../app/(app)/claims/actions';
import type { PolicyOption } from './ProofsView';

const STATUS_TONE: Record<ClaimStatus, 'accent' | 'info' | 'warning' | 'success' | 'neutral' | 'danger'> = {
  open: 'accent',
  acknowledged: 'info',
  in_progress: 'warning',
  settled: 'success',
  closed: 'neutral',
  denied: 'danger',
};

const money = (v: number | string | null) =>
  v == null ? '—' : Number(v).toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

const fmtDate = (v: string | null) => {
  if (!v) return '—';
  const d = new Date(`${v.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
};

const titleCase = (s: string) => s.replace(/(^|_)([a-z])/g, (_, p, c) => (p ? ' ' : '') + c.toUpperCase());

/** Policies grouped with their household + carrier, for the intake form. */
export interface FnolPolicyOption extends PolicyOption {
  account_id: string;
  carrier_id: string | null;
}

export function ClaimsView({
  claims,
  policies,
  canReport,
  preview = false,
}: {
  claims: ClaimRow[];
  policies: FnolPolicyOption[];
  canReport: boolean;
  preview?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [policyId, setPolicyId] = useState(policies[0]?.policy_id ?? '');
  const [lossDate, setLossDate] = useState('');
  const [description, setDescription] = useState('');
  const [reserve, setReserve] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    setError(null);
    const p = policies.find((x) => x.policy_id === policyId);
    if (!p) return setError('Pick a policy.');
    if (!lossDate) return setError('A date of loss is required — it drives the reporting clock.');
    start(async () => {
      const r = await reportFnol({
        accountId: p.account_id,
        policyId: p.policy_id,
        carrierId: p.carrier_id ?? undefined,
        lossDate,
        description: description.trim() || 'First notice of loss',
        reserve: reserve ? Number(reserve) : undefined,
      });
      if (r.ok) {
        setOpen(false);
        setLossDate(''); setDescription(''); setReserve('');
        router.refresh();
      } else {
        setError(r.error ?? 'Could not record the loss.');
      }
    });
  };

  const columns: Column<ClaimRow>[] = [
    { key: 'number', header: 'Claim', width: '150px',
      cell: (c) => <span className="whitespace-nowrap font-medium tabular-nums">{c.claim_number ?? 'Pending'}</span> },
    { key: 'account', header: 'Household', cell: (c) => <span className="block truncate font-medium">{c.account_name}</span> },
    { key: 'policy', header: 'Policy', width: '130px',
      cell: (c) => <span className="whitespace-nowrap tabular-nums text-text-2">{c.policy_number ?? '—'}</span> },
    { key: 'carrier', header: 'Carrier', width: '130px', cell: (c) => <span className="block truncate">{c.carrier_name ?? '—'}</span> },
    { key: 'loss', header: 'Date of loss', width: '130px',
      cell: (c) => <span className="whitespace-nowrap tabular-nums">{fmtDate(c.loss_date)}</span> },
    { key: 'status', header: 'Status', width: '130px',
      cell: (c) => <Badge tone={STATUS_TONE[c.status]}>{titleCase(c.status)}</Badge> },
    { key: 'reserve', header: 'Reserve', width: '110px', align: 'right', cell: (c) => money(c.reserve) },
    { key: 'age', header: 'Open', width: '90px', align: 'right',
      cell: (c) => <span className="tabular-nums">{c.days_open}d</span> },
  ];

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <Button onClick={() => { setOpen(true); setError(null); }} disabled={!canReport || preview}>
          <i className="ti ti-flame text-[16px]" /> Report a loss
        </Button>
        {!canReport ? (
          <span className="text-small text-text-3">
            Taking an FNOL opens a transaction, which requires a live licence.
          </span>
        ) : preview ? (
          <span className="text-small text-text-3">Connect the API (set API_URL) to record a real FNOL.</span>
        ) : null}
      </div>

      <Table
        columns={columns}
        rows={claims}
        getRowId={(c) => c.id}
        onRowClick={(c) => c.txn_id && router.push(`/transactions/${c.txn_id}`)}
        empty={
          <div className="rounded-card border border-dashed border-border-2 bg-surface-panel px-6 py-10 text-center">
            <p className="text-h2 text-text-1">No claims reported</p>
            <p className="mt-1 text-small text-text-2">
              A first notice of loss opens a transaction and a diary entry to chase the
              carrier for a claim number.
            </p>
          </div>
        }
      />

      <Modal
        open={open}
        title="First notice of loss"
        onClose={() => setOpen(false)}
        width={560}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button onClick={submit} disabled={pending}>{pending ? 'Recording…' : 'Record FNOL'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Policy" required>
            <Select value={policyId} onChange={(e) => setPolicyId(e.target.value)}>
              {policies.map((p) => (
                <option key={p.policy_id} value={p.policy_id}>{p.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Date of loss" required help="Drives the reporting clock — record the loss date, not today's date.">
            <Input type="date" value={lossDate} onChange={(e) => setLossDate(e.target.value)} />
          </Field>
          <Field label="What happened" help="Goes on the transaction and the E&O trail.">
            <Input
              value={description}
              placeholder="e.g. Rear-ended at a stop light — not at fault"
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="Estimated reserve" help="Optional — the carrier sets the real reserve.">
            <Input type="number" value={reserve} placeholder="8500" onChange={(e) => setReserve(e.target.value)} />
          </Field>
          <p className="m-0 text-small text-text-3">
            This opens a claim FNOL transaction and a high-priority follow-up to confirm the
            claim number with the carrier.
          </p>
          {error ? <p className="m-0 text-small text-danger">{error}</p> : null}
        </div>
      </Modal>
    </>
  );
}
