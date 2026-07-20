import type { ReactNode } from 'react';

/** Empty states carry the next action, not an illustration (brand brief §6). */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border-2 bg-surface-panel px-6 py-12 text-center">
      <p className="text-h2 text-text-1">{title}</p>
      {description ? <p className="max-w-sm text-body text-text-2">{description}</p> : null}
      {action}
    </div>
  );
}
