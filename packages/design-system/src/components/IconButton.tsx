'use client';

import type { ButtonHTMLAttributes } from 'react';

type Variant = 'quiet' | 'outline' | 'solid';
type Size = 'sm' | 'md' | 'lg';

const DIM: Record<Size, string> = { sm: 'h-7 w-7', md: 'h-[34px] w-[34px]', lg: 'h-10 w-10' };
const ICON: Record<Size, string> = { sm: 'text-[15px]', md: 'text-[19px]', lg: 'text-[22px]' };
const VARIANT: Record<Variant, string> = {
  quiet: 'bg-transparent text-text-2 border border-transparent hover:bg-accent-tint',
  outline: 'bg-surface-card text-text-2 border border-border-2 hover:bg-accent-tint',
  solid: 'bg-accent text-text-on-accent border border-transparent hover:bg-accent-deep',
};

/** Icon-only button — always labelled for a11y (icon never stands alone). */
export function IconButton({
  icon,
  label,
  size = 'md',
  variant = 'quiet',
  disabled,
  ...rest
}: {
  icon: string;
  label: string;
  size?: Size;
  variant?: Variant;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-control transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-50 ${DIM[size]} ${VARIANT[variant]}`}
      {...rest}
    >
      <i className={`ti ti-${icon} ${ICON[size]}`} />
    </button>
  );
}
