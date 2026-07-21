'use client';

import type { ReactNode, SelectHTMLAttributes } from 'react';

type Size = 'sm' | 'md' | 'lg';
const PAD: Record<Size, string> = { sm: 'px-2.5 py-1.5 text-small', md: 'px-3 py-2 text-body', lg: 'px-3.5 py-3 text-body' };

/** Native select styled to the token layer, with the standard chevron. */
export function Select({
  size = 'md',
  invalid,
  children,
  ...rest
}: {
  size?: Size;
  invalid?: boolean;
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>) {
  return (
    <span className="relative block w-full">
      <select
        className={`w-full cursor-pointer appearance-none rounded-control border bg-surface-card pr-8 text-text-1 outline-none transition-colors duration-[120ms] focus:border-accent focus:ring-2 focus:ring-accent-tint ${
          invalid ? 'border-danger' : 'border-border-2'
        } ${PAD[size]}`}
        {...rest}
      >
        {children}
      </select>
      <i className="ti ti-chevron-down pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[15px] text-text-3" />
    </span>
  );
}
