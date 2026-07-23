import type { ReactNode } from "react";

/** Screen title block: eyebrow, title, description, right-aligned actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-caption font-medium uppercase tracking-[0.06em] text-fg-subtle">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-h1 font-medium leading-tight text-fg">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-small text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
