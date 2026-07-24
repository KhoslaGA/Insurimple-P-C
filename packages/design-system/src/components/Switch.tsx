import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, className, ...props },
  ref,
) {
  return (
    <label className="inline-flex items-center gap-2 text-small text-text-1">
      <span className="relative inline-flex">
        <input ref={ref} type="checkbox" className={cn('peer sr-only', className)} {...props} />
        <span className="h-5 w-9 rounded-pill bg-border-2 transition-colors peer-checked:bg-tenant-primary peer-focus-visible:ring-2 peer-focus-visible:ring-tenant-primary" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-pill bg-white transition-transform peer-checked:translate-x-4" />
      </span>
      {label}
    </label>
  );
});
