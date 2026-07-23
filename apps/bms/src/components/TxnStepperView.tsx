'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Stepper, TxnStateBadge, type Step } from '@insurimple/design-system';
import type { TxnDetail, TxnState } from '@insurimple/contracts';
import { advanceTxn } from '../app/(app)/transactions/actions';

const FLOW: TxnState[] = [
  'draft', 'doc_generated', 'sig_pending', 'signed', 'submitted', 'carrier_ack', 'completed',
];

const STATE_LABEL: Record<TxnState, string> = {
  draft: 'Draft',
  doc_generated: 'Document',
  sig_pending: 'Signature',
  signed: 'Signed',
  submitted: 'Submitted',
  carrier_ack: 'Acknowledged',
  completed: 'Completed',
  rejected: 'Rejected',
};

const NEXT_ACTION: Partial<Record<TxnState, string>> = {
  draft: 'Generate document',
  doc_generated: 'Request signature',
  sig_pending: 'Mark signed',
  signed: 'Submit to carrier',
  submitted: 'Record acknowledgement',
  carrier_ack: 'Complete',
};

const titleCase = (s: string) =>
  s ? s.replace(/(^|_)([a-z])/g, (_, p, c) => (p ? ' ' : '') + c.toUpperCase()) : s;

const fmtDateTime = (v: string | null) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const fmtDate = (v: string | null) => {
  if (!v) return '—';
  const d = new Date(`${v.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function TxnStepperView({ txn, preview = false }: { txn: TxnDetail; preview?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const rejected = txn.state === 'rejected';
  const reached = new Set<TxnState>(txn.events.map((e) => e.to_state));
  const idx = FLOW.indexOf(txn.state);

  const steps: Step[] = FLOW.map((s, i) => {
    let state: Step['state'];
    if (rejected) state = reached.has(s) ? 'done' : 'pending';
    else if (i < idx) state = 'done';
    else if (i === idx) state = 'current';
    else state = 'pending';
    return { label: STATE_LABEL[s], state };
  });

  const nextAction = NEXT_ACTION[txn.state];
  const canAdvance = !preview && !!nextAction;

  const onAdvance = () => {
    setError(null);
    start(async () => {
      const r = await advanceTxn(txn.id, txn.state, txn.txn_type, txn.reference);
      if (r.ok) router.refresh();
      else setError(r.error ?? 'Could not advance the transaction.');
    });
  };

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col px-8 py-6">
      <header className="mb-6">
        <Link href="/transactions" className="mb-2 inline-flex items-center gap-1 text-small text-text-link">
          <i className="ti ti-arrow-left text-[16px]" /> All transactions
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-small font-medium tabular-nums text-text-3">{txn.reference ?? 'TXN'}</span>
          <h1 className="text-h1 text-text-1">{titleCase(txn.txn_type)}</h1>
          <TxnStateBadge state={txn.state} />
          {preview ? <Badge tone="warning">Preview data</Badge> : null}
        </div>
        <p className="mt-1 text-small text-text-2">
          {txn.account_name ? (
            <Link href={`/households/${txn.account_id}`} className="text-text-link">{txn.account_name}</Link>
          ) : null}
          {txn.carrier_name ? `  ·  ${txn.carrier_name}` : ''}
          {`  ·  opened ${fmtDate(txn.opened_at)}`}
          {txn.effective_date ? `  ·  effective ${fmtDate(txn.effective_date)}` : ''}
        </p>
      </header>

      <section className="mb-6 rounded-card border border-border-1 bg-surface-card p-5">
        <Stepper steps={steps} />
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border-1 pt-4">
          {nextAction ? (
            <>
              <Button onClick={onAdvance} disabled={!canAdvance || pending}>
                {pending ? 'Working…' : nextAction}
              </Button>
              {preview ? (
                <span className="text-small text-text-3">Connect the API (set API_URL) to advance the state machine.</span>
              ) : null}
            </>
          ) : (
            <span className="text-small text-text-2">
              This transaction is {rejected ? 'rejected' : 'completed'} — a terminal state.
            </span>
          )}
          {error ? <span className="text-small text-danger">{error}</span> : null}
        </div>
        {txn.reason ? <p className="mt-3 text-small text-text-2">{txn.reason}</p> : null}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-caption font-medium uppercase tracking-caps text-text-3">State history</h2>
        <ol className="flex flex-col gap-2">
          {txn.events.length ? (
            txn.events.map((e, i) => (
              <li key={i} className="flex items-center gap-3 rounded-card border border-border-1 bg-surface-card px-4 py-2.5 text-small">
                <TxnStateBadge state={e.to_state} />
                {e.from_state ? <span className="text-caption text-text-3">from {titleCase(e.from_state)}</span> : <span className="text-caption text-text-3">opened</span>}
                <span className="ml-auto text-caption text-text-3">{e.actor} · {fmtDateTime(e.at)}</span>
              </li>
            ))
          ) : (
            <li className="text-small text-text-3">No transitions recorded yet.</li>
          )}
        </ol>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section>
          <h2 className="mb-2 text-caption font-medium uppercase tracking-caps text-text-3">Documents</h2>
          <div className="rounded-card border border-border-1 bg-surface-card p-4">
            {txn.documents.length ? (
              <ul className="flex flex-col gap-2">
                {txn.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-small">
                    <i className="ti ti-file-text text-[16px] text-text-3" />
                    <span className="text-text-1">{d.filename}</span>
                    <Badge tone="neutral">{titleCase(d.doc_type)}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-small text-text-3">No documents generated yet.</p>
            )}
          </div>
        </section>
        <section>
          <h2 className="mb-2 text-caption font-medium uppercase tracking-caps text-text-3">Carrier submissions</h2>
          <div className="rounded-card border border-border-1 bg-surface-card p-4">
            {txn.submissions.length ? (
              <ul className="flex flex-col gap-2">
                {txn.submissions.map((s, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 text-small">
                    <Badge tone={s.status === 'acknowledged' ? 'success' : 'info'}>{titleCase(s.status)}</Badge>
                    <span className="text-text-2">via {titleCase(s.channel)}</span>
                    <span className="ml-auto text-caption tabular-nums text-text-3">{fmtDateTime(s.submitted_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-small text-text-3">Not yet submitted to a carrier.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
