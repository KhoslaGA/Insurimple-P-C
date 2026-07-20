import type { ReactNode } from 'react';

/**
 * The transaction lifecycle — the spine's states, in order.
 * This vocabulary must appear identically everywhere (design-and-brand-brief §6).
 * Source of truth for the union is @insurimple/contracts; re-exported shape here
 * to keep the component self-contained.
 */
export const TXN_STATES = [
  'draft',
  'doc_generated',
  'sig_pending',
  'signed',
  'submitted',
  'carrier_ack',
  'completed',
  'rejected',
] as const;

export type TxnState = (typeof TXN_STATES)[number];

const STATE_META: Record<TxnState, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  doc_generated: { label: 'Document generated', tone: 'info' },
  sig_pending: { label: 'Signature pending', tone: 'warning' },
  signed: { label: 'Signed', tone: 'info' },
  submitted: { label: 'Submitted to carrier', tone: 'warning' },
  carrier_ack: { label: 'Carrier acknowledged', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

export type BadgeTone =
  | 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-text-2',
  accent: 'bg-accent-tint text-accent-deep',
  info: 'bg-info-tint text-info',
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-warning',
  danger: 'bg-danger-tint text-danger',
};

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-caption font-medium ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}

/** Renders a transaction state using the canonical label + tone. */
export function TxnStateBadge({ state }: { state: TxnState }) {
  const meta = STATE_META[state];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
