import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  selected?: boolean;
  children: ReactNode;
}

export function Chip({ selected = false, className, children, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-small transition-colors',
        selected
          ? 'border-tenant-primary bg-tenant-primary-tint text-tenant-primary-deep'
          : 'border-border-1 bg-surface-card text-text-2',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
