'use client';

import type { ReactNode } from 'react';

/** Filter chip. Selected state reads the tenant accent tokens. */
export function Chip({
  selected,
  icon,
  onClick,
  onRemove,
  children,
}: {
  selected?: boolean;
  icon?: string;
  onClick?: () => void;
  onRemove?: () => void;
  children: ReactNode;
}) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex select-none items-center gap-1.5 rounded-pill border px-3 py-1 text-small font-medium transition-colors duration-[120ms] ${
        selected
          ? 'border-accent bg-accent-tint text-accent-deep'
          : 'border-border-2 bg-surface-card text-text-2'
      } ${onClick ? 'cursor-pointer hover:bg-surface-sunken' : ''}`}
    >
      {icon ? <i className={`ti ti-${icon} text-[15px]`} /> : null}
      {children}
      {onRemove ? (
        <i
          className="ti ti-x cursor-pointer text-[13px] opacity-70"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      ) : null}
    </span>
  );
}
