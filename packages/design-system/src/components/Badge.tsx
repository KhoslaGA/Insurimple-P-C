import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-text-2',
  accent: 'bg-tenant-primary-tint text-tenant-primary-deep',
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-warning',
  danger: 'bg-danger-tint text-danger',
  info: 'bg-info-tint text-info',
};

const DOT: Record<BadgeTone, string> = {
  neutral: 'bg-mist',
  accent: 'bg-tenant-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-caption font-medium',
        TONE[tone],
        className,
      )}
      {...props}
    >
      {dot ? <span className={cn('h-1.5 w-1.5 rounded-pill', DOT[tone])} /> : null}
      {children}
    </span>
  );
}
