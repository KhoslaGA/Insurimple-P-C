'use client';

import type { ReactNode } from 'react';

/** Dense list row: leading / title+subtitle / meta / trailing. */
export function ListRow({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  selected,
  onClick,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 border-b border-border-1 px-3.5 py-2.5 transition-colors duration-[120ms] last:border-0 ${
        selected ? 'bg-accent-tint' : ''
      } ${onClick ? 'cursor-pointer hover:bg-surface-panel' : ''}`}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-body font-medium text-text-1">{title}</div>
        {subtitle ? <div className="truncate text-small text-text-2">{subtitle}</div> : null}
      </div>
      {meta ? <div className="flex-none text-caption text-text-3">{meta}</div> : null}
      {trailing}
    </div>
  );
}
