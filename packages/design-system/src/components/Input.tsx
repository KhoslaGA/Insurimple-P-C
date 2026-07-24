import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full rounded-control border bg-surface-card px-3 text-body text-text-1 placeholder:text-text-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-primary disabled:opacity-50',
        invalid ? 'border-danger' : 'border-border-1',
        className,
      )}
      {...props}
    />
  );
});
