import type { ReactNode } from "react";

/** Declared props: icon, title, body, action. */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-card bg-surface-sunken text-fg-subtle">
          {icon}
        </div>
      ) : null}
      <h3 className="text-h2 font-medium text-fg">{title}</h3>
      {body ? (
        <p className="mt-1.5 max-w-sm text-small text-fg-muted">{body}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
