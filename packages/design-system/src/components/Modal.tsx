'use client';

import type { ReactNode } from 'react';

/** Centered dialog — the second (and last) floating layer. Scrim is solid ink at 40%. */
export function Modal({
  open,
  title,
  onClose,
  footer,
  width = 480,
  children,
}: {
  open: boolean;
  title?: ReactNode;
  onClose?: () => void;
  footer?: ReactNode;
  width?: number;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={typeof title === 'string' ? title : undefined}
        style={{ width }}
        className="flex max-h-[90vh] max-w-full flex-col rounded-card bg-surface-popover shadow-overlay"
      >
        <div className="flex items-center gap-2 px-5 pt-4">
          <h2 className="m-0 flex-1 text-h2 font-medium text-text-1">{title}</h2>
          {onClose ? (
            <button aria-label="Close" onClick={onClose} className="p-1 text-text-3">
              <i className="ti ti-x text-[18px]" />
            </button>
          ) : null}
        </div>
        <div className="overflow-y-auto px-5 pb-5 pt-3 text-body leading-relaxed text-text-2">
          {children}
        </div>
        {footer ? <div className="flex justify-end gap-2 px-5 pb-5">{footer}</div> : null}
      </div>
    </div>
  );
}
