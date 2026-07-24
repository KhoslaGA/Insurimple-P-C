import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid = false, className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full rounded-control border bg-surface-card px-3 text-body text-text-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-primary disabled:opacity-50',
        invalid ? 'border-danger' : 'border-border-1',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
