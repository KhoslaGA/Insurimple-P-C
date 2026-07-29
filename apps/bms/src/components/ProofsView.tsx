'use client';

import { useState, useTransition } from 'react';
import { Badge, Button, Field, Input, Modal, Select, Table, type Column } from '@insurimple/design-system';
import type {
  DocumentRow,
  DocumentTemplate,
  IssuedProof,
  AccountSummary,
} from '@insurimple/contracts';
import { issueProof } from '../app/(app)/proofs/actions';

const TYPE_LABEL: Record<string, string> = {
  pink_slip: 'Liability slip',
  binder_letter: 'Evidence of insurance',
  loe: 'Letter of experience',
  confirmation: 'Confirmation',
  lpv: 'LPV',
  declaration: 'Declaration',
  application: 'Application',
};

const TYPE_TONE: Record<string, 'accent' | 'info' | 'neutral' | 'success'> = {
  pink_slip: 'accent',
  binder_letter: 'info',
  loe: 'success',
  confirmation: 'info',
};

const fmtDate = (v: string | null) => {
  if (!v) return '—';
  const d = new Date(v.length <= 10 ? `${v}T00:00:00` : v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Policies the user can issue against, flattened from the book. */
export interface PolicyOption {
  policy_id: string;
  label: string;
}

export function ProofsView({
  documents,
  templates,
  policies,
  canIssue,
  preview = false,
}: {
  documents: DocumentRow[];
  templates: DocumentTemplate[];
  policies: PolicyOption[];
  canIssue: boolean;
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [policyId, setPolicyId] = useState(policies[0]?.policy_id ?? '');
  const [templateCode, setTemplateCode] = useState(templates[0]?.code ?? '');
  const [issuedTo, setIssuedTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IssuedProof | null>(null);
  const [pending, start] = useTransition();

  const needsRecipient = templateCode === 'BINDER_LETTER' || templateCode === 'CONFIRMATION';

  const submit = () => {
    setError(null);
    start(async () => {
      const r = await issueProof({
        policyId,
        templateCode,
        issuedTo: issuedTo.trim() || undefined,
      });
      if (r.ok && r.proof) {
        setResult(r.proof);
        setOpen(false);
      } else {
        setError(r.error ?? 'Could not issue the proof.');
      }
    });
  };

  const columns: Column<DocumentRow>[] = [
    {
      key: 'type',
      header: 'Document',
      width: '190px',
      cell: (d) => <Badge tone={TYPE_TONE[d.doc_type] ?? 'neutral'}>{TYPE_LABEL[d.doc_type] ?? d.doc_type}</Badge>,
    },
    {
      key: 'account',
      header: 'Household',
      cell: (d) => <span className="block truncate font-medium">{d.account_name ?? '—'}</span>,
    },
    {
      key: 'policy',
      header: 'Policy',
      width: '140px',
      cell: (d) => <span className="whitespace-nowrap tabular-nums text-text-2">{d.policy_number ?? '—'}</span>,
    },
    {
      key: 'to',
      header: 'Issued to',
      width: '160px',
      cell: (d) => <span className="block truncate text-text-2">{d.issued_to ?? '—'}</span>,
    },
    {
      key: 'issued',
      header: 'Issued',
      width: '120px',
      cell: (d) => <span className="whitespace-nowrap tabular-nums">{fmtDate(d.created_at)}</span>,
    },
    {
      key: 'retention',
      header: 'Retain until',
      width: '130px',
      cell: (d) => (
        <span className="whitespace-nowrap tabular-nums text-text-2" title="RIBO 6-year retention">
          {fmtDate(d.retention_until)}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <Button onClick={() => { setOpen(true); setError(null); }} disabled={!canIssue || preview}>
          <i className="ti ti-file-plus text-[16px]" /> Issue a proof
        </Button>
        {!canIssue ? (
          <span className="text-small text-text-3">
            Issuing a proof requires the <span className="tabular-nums">pc.proof.issue</span> capability,
            which comes from a live RIBO licence.
          </span>
        ) : preview ? (
          <span className="text-small text-text-3">Connect the API (set API_URL) to issue real proofs.</span>
        ) : null}
      </div>

      <Table
        columns={columns}
        rows={documents}
        getRowId={(d) => d.id}
        empty={
          <div className="rounded-card border border-dashed border-border-2 bg-surface-panel px-6 py-10 text-center">
            <p className="text-h2 text-text-1">Nothing issued yet</p>
            <p className="mt-1 text-small text-text-2">
              Pink slips, evidence of insurance and letters of experience appear here with
              their retention clock.
            </p>
          </div>
        }
      />

      {/* Issue */}
      <Modal
        open={open}
        title="Issue a proof of insurance"
        onClose={() => setOpen(false)}
        width={560}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button onClick={submit} disabled={pending || !policyId || !templateCode}>
              {pending ? 'Issuing…' : 'Issue'}
            </Button>
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
          <Field label="Document" required>
            <Select value={templateCode} onChange={(e) => setTemplateCode(e.target.value)}>
              {templates.map((t) => (
                <option key={t.code} value={t.code}>{t.name}</option>
              ))}
            </Select>
          </Field>
          {needsRecipient ? (
            <Field label="Issued to" help="The lender, landlord or other party named on the document.">
              <Input
                value={issuedTo}
                placeholder="e.g. TD Canada Trust, Mortgage Services"
                onChange={(e) => setIssuedTo(e.target.value)}
              />
            </Field>
          ) : null}
          <p className="m-0 text-small text-text-3">
            The document is rendered from live policy data and filed with a 6-year
            retention clock.
          </p>
          {error ? <p className="m-0 text-small text-danger">{error}</p> : null}
        </div>
      </Modal>

      {/* Rendered result */}
      <Modal
        open={!!result}
        title={result?.template_name ?? 'Issued'}
        onClose={() => setResult(null)}
        width={620}
        footer={<Button variant="secondary" onClick={() => setResult(null)}>Close</Button>}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-small">
            <Badge tone="success">Issued</Badge>
            <span className="tabular-nums text-text-2">{result?.filename}</span>
            <span className="ml-auto text-caption text-text-3">
              retain until {fmtDate(result?.retention_until ?? null)}
            </span>
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-control border border-border-1 bg-surface-sunken p-3 text-caption leading-relaxed text-text-1">
            {result?.rendered_body}
          </pre>
        </div>
      </Modal>
    </>
  );
}
