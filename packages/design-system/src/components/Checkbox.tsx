import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, ...props },
  ref,
) {
  const input = (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border-border-1 accent-tenant-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-primary',
        className,
      )}
      {...props}
    />
  );
  if (!label) return input;
  return (
    <label className="inline-flex items-center gap-2 text-small text-text-1">
      {input}
      {label}
    </label>
  );
});
