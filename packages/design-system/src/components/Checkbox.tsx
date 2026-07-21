'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

/** Checkbox with label. Controlled via `checked`, or uncontrolled via `defaultChecked`. */
export function Checkbox({
  label,
  checked,
  defaultChecked,
  disabled,
  onChange,
}: {
  label?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  const [inner, setInner] = useState(!!defaultChecked);
  const isOn = checked !== undefined ? checked : inner;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInner(!isOn);
    onChange?.(!isOn);
  };
  return (
    <label
      onClick={toggle}
      className={`inline-flex select-none items-center gap-2 text-body text-text-1 ${
        disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'
      }`}
    >
      <span
        className={`inline-flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border transition-colors duration-[120ms] ${
          isOn ? 'border-accent bg-accent' : 'border-border-2 bg-surface-card'
        }`}
      >
        {isOn ? <i className="ti ti-check text-[13px] text-text-on-accent" /> : null}
      </span>
      {label}
    </label>
  );
}
