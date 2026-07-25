'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, Modal, Select } from '@insurimple/design-system';
import type { TxnType } from '@insurimple/contracts';
import { openTxn } from '../app/(app)/transactions/actions';

/** The servicing actions a broker starts from a household record. */
const TXN_TYPES: Array<{ value: TxnType; label: string; hint: string }> = [
  { value: 'new_business', label: 'New business', hint: 'Bind a new policy for this household.' },
  { value: 'endorsement', label: 'Endorsement', hint: 'Mid-term change to an existing policy.' },
  { value: 'renewal', label: 'Renewal', hint: 'Process the renewal offer.' },
  { value: 'cancellation', label: 'Cancellation', hint: 'Cancel a policy — flat, short-rate, or pro-rata.' },
  { value: 'reinstatement', label: 'Reinstatement', hint: 'Reinstate a cancelled policy within the window.' },
  { value: 'remarket', label: 'Remarket', hint: 'Re-shop the risk through the compare engine.' },
  { value: 'claim_fnol', label: 'Claim (FNOL)', hint: 'First notice of loss — capture and refer to the carrier.' },
];

export function NewTxnLauncher({
  accountId,
  preview = false,
}: {
  accountId: string;
  preview?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [txnType, setTxnType] = useState<TxnType>('endorsement');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const hint = TXN_TYPES.find((t) => t.value === txnType)?.hint;

  const submit = () => {
    setError(null);
    start(async () => {
      const r = await openTxn({ accountId, txnType, reason: reason.trim() || undefined });
      if (r.ok && r.id) {
        setOpen(false);
        router.push(`/transactions/${r.id}`);
      } else {
        setError(r.error ?? 'Could not open the transaction.');
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <i className="ti ti-plus text-[16px]" /> New transaction
      </Button>
      <Modal
        open={open}
        title="New transaction"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={pending || preview}>
              {pending ? 'Opening…' : 'Open in draft'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Type" help={hint} required>
            <Select value={txnType} onChange={(e) => setTxnType(e.target.value as TxnType)}>
              {TXN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Reason" help="Why this transaction is being opened — it lands on the record and the E&O trail.">
            <Input
              value={reason}
              placeholder="e.g. Client sold the vehicle"
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          {preview ? (
            <p className="m-0 text-small text-text-3">
              This is preview data — connect the API (set API_URL) to open real transactions.
            </p>
          ) : null}
          {error ? <p className="m-0 text-small text-danger">{error}</p> : null}
        </div>
      </Modal>
    </>
  );
}
