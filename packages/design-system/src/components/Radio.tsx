'use client';

import type { ReactNode } from 'react';

/** Radio button. Always controlled — the group owns the selection. */
export function Radio({
  label,
  checked,
  disabled,
  name,
  onChange,
}: {
  label?: ReactNode;
  checked?: boolean;
  disabled?: boolean;
  name?: string;
  onChange?: () => void;
}) {
  return (
    <label
      data-name={name}
      onClick={() => !disabled && onChange?.()}
      className={`inline-flex select-none items-center gap-2 text-body text-text-1 ${
        disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'
      }`}
    >
      <span
        className={`inline-flex h-[18px] w-[18px] flex-none items-center justify-center rounded-pill border bg-surface-card ${
          checked ? 'border-accent' : 'border-border-2'
        }`}
      >
        {checked ? <span className="h-2.5 w-2.5 rounded-pill bg-accent" /> : null}
      </span>
      {label}
    </label>
  );
}
