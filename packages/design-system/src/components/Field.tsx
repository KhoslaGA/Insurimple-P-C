import { useId, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface FieldChildProps {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
}

export interface FieldProps {
  label?: string;
  hint?: string;
  /** Error copy: what happened, then what to do. No blame, no jargon. */
  error?: string;
  required?: boolean;
  className?: string;
  /** Render prop wires id + aria onto the control for label/error association. */
  children: (props: FieldChildProps) => ReactNode;
}

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={id} className="text-small font-medium text-text-1">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={describedBy} className="text-caption text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={describedBy} className="text-caption text-text-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
