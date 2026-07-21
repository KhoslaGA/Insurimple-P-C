import type { ReactNode } from 'react';

/** Label + control + help/error wrapper. Error copy: what happened, then what to do. */
export function Field({
  label,
  help,
  error,
  required,
  children,
}: {
  label?: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label className="text-small font-medium text-text-1">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="m-0 text-small leading-snug text-danger">{error}</p>
      ) : help ? (
        <p className="m-0 text-small leading-snug text-text-2">{help}</p>
      ) : null}
    </div>
  );
}
