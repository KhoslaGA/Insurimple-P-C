import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type DeltaTone = "up" | "down" | "neutral";

const DELTA: Record<DeltaTone, string> = {
  up: "text-success",
  down: "text-danger",
  neutral: "text-fg-muted",
};

const ARROW: Record<DeltaTone, string> = {
  up: "▲",
  down: "▼",
  neutral: "•",
};

/** Declared props: label, value, delta, deltaTone, hint, icon. */
export function MetricCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  hint,
  icon,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  deltaTone?: DeltaTone;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-surface-card p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-caption font-medium uppercase tracking-[0.06em] text-fg-subtle">
          {label}
        </span>
        {icon ? (
          <span className="flex size-9 items-center justify-center rounded-control bg-brand-tint text-brand">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-hero font-medium leading-tight text-fg">
        {value}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        {delta != null ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-small font-medium",
              DELTA[deltaTone],
            )}
          >
            <span aria-hidden>{ARROW[deltaTone]}</span>
            {delta}
          </span>
        ) : null}
        {hint ? <span className="text-small text-fg-muted">{hint}</span> : null}
      </div>
    </div>
  );
}
