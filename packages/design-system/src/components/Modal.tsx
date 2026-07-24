'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

/** An overlay dialog — solid ink scrim at 40%, one floating layer (--shadow-overlay). */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          'relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-card bg-surface-popover shadow-overlay',
          className,
        )}
      >
        {title ? (
          <div className="flex items-center border-b border-border-1 px-5 py-3">
            <h2 className="text-body font-medium text-text-1">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ml-auto rounded-control px-2 py-1 text-text-3 hover:bg-surface-sunken hover:text-text-1"
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
