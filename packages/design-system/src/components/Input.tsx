'use client';

import type { InputHTMLAttributes } from 'react';

type Size = 'sm' | 'md' | 'lg';
const PAD: Record<Size, string> = { sm: 'px-2.5 py-1.5 text-small', md: 'px-3 py-2 text-body', lg: 'px-3.5 py-3 text-body' };

/** Text input with optional leading icon. Focus = 2px accent ring, always visible. */
export function Input({
  size = 'md',
  invalid,
  icon,
  className = '',
  ...rest
}: {
  size?: Size;
  invalid?: boolean;
  icon?: string;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>) {
  const box = `w-full rounded-control border bg-surface-card text-text-1 outline-none transition-colors duration-[120ms] focus:border-accent focus:ring-2 focus:ring-accent-tint ${
    invalid ? 'border-danger' : 'border-border-2'
  } ${PAD[size]} ${icon ? 'pl-9' : ''} ${className}`;
  const input = <input className={box} {...rest} />;
  if (!icon) return input;
  return (
    <span className="relative block w-full">
      <i className={`ti ti-${icon} pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[17px] text-text-3`} />
      {input}
    </span>
  );
}
