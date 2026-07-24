import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** A flat surface tile — 1px border, 12px radius, no shadow at rest. */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-card border border-border-1 bg-surface-card p-5', className)}
      {...props}
    >
      {children}
    </div>
  );
}
