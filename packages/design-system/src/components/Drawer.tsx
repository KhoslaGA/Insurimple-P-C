'use client';

import type { ReactNode } from 'react';

/** Right-hand drawer — same overlay layer rules as Modal. */
export function Drawer({
  open,
  title,
  onClose,
  width = 380,
  footer,
  children,
}: {
  open: boolean;
  title?: ReactNode;
  onClose?: () => void;
  width?: number;
  footer?: ReactNode;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-ink/40">
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        style={{ width }}
        className="absolute bottom-0 right-0 top-0 flex max-w-[92%] flex-col bg-surface-popover shadow-overlay"
      >
        <div className="flex items-center gap-2 border-b border-border-1 px-5 py-4">
          <h2 className="m-0 flex-1 text-h2 font-medium text-text-1">{title}</h2>
          {onClose ? (
            <button aria-label="Close" onClick={onClose} className="p-1 text-text-3">
              <i className="ti ti-x text-[18px]" />
            </button>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto p-5 text-body leading-relaxed text-text-2">
          {children}
        </div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-border-1 p-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
