import type { ReactNode } from 'react';

export type BarTone = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const FILL: Record<BarTone, string> = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-text-3',
};

export interface BarItem {
  label: ReactNode;
  value: number;
  /** Right-aligned display value; defaults to the numeric value. */
  display?: ReactNode;
  tone?: BarTone;
}

/**
 * Horizontal proportional bars — the dense breakdown surface (book by status,
 * premium by carrier, pipeline by stage). Fills read design-system color
 * tokens; bars are sized relative to the largest value.
 */
export function BarList({ items, tone = 'accent' }: { items: BarItem[]; tone?: BarTone }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((it, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-small">
            <span className="min-w-0 truncate text-text-2">{it.label}</span>
            <span className="flex-none tabular-nums font-medium text-text-1">{it.display ?? it.value}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-surface-sunken">
            <div
              className={`h-full rounded-pill ${FILL[it.tone ?? tone]}`}
              style={{ width: `${Math.max(2, (it.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
