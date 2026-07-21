'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

/** Toggle switch. Controlled via `checked`, or uncontrolled via `defaultChecked`. */
export function Switch({
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
        className={`box-border h-[21px] w-9 flex-none rounded-pill p-[2px] transition-colors duration-[180ms] ${
          isOn ? 'bg-accent' : 'bg-border-2'
        }`}
      >
        <span
          className={`block h-[17px] w-[17px] rounded-pill bg-surface-card transition-transform duration-[180ms] ${
            isOn ? 'translate-x-[15px]' : ''
          }`}
        />
      </span>
      {label}
    </label>
  );
}
