'use client';

import type { ReactNode } from 'react';

type Tone = 'success' | 'warning' | 'danger' | 'info';
const ICON: Record<Tone, string> = {
  success: 'circle-check',
  warning: 'alert-triangle',
  danger: 'circle-x',
  info: 'info-circle',
};
const COLOR: Record<Tone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
};

/** Toast notification — floats on --shadow-float, first overlay layer. */
export function Toast({
  tone = 'info',
  title,
  action,
  onAction,
  onClose,
}: {
  tone?: Tone;
  title: ReactNode;
  action?: ReactNode;
  onAction?: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex max-w-md items-center gap-2.5 rounded-card border border-border-1 bg-surface-popover px-3.5 py-3 text-body text-text-1 shadow-float">
      <i className={`ti ti-${ICON[tone]} flex-none text-[20px] ${COLOR[tone]}`} />
      <span className="flex-1 leading-snug">{title}</span>
      {action ? (
        <button onClick={onAction} className="whitespace-nowrap text-small font-medium text-accent">
          {action}
        </button>
      ) : null}
      {onClose ? (
        <button aria-label="Dismiss" onClick={onClose} className="p-0.5 text-text-3">
          <i className="ti ti-x text-[15px]" />
        </button>
      ) : null}
    </div>
  );
}
