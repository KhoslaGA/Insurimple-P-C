import type { ReactNode } from 'react';

const DELTA_TONE: Record<'up' | 'down' | 'neutral', string> = {
  up: 'text-success',
  down: 'text-danger',
  neutral: 'text-text-2',
};

/** Scorecard tile: caption label, big tabular value, optional delta + hint. */
export function MetricCard({
  label,
  value,
  delta,
  deltaTone = 'neutral',
  hint,
  icon,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  deltaTone?: 'up' | 'down' | 'neutral';
  hint?: ReactNode;
  icon?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-card border border-border-1 bg-surface-card p-4">
      <div className="flex items-center gap-1.5 text-caption font-medium uppercase tracking-[0.06em] text-text-3">
        {icon ? <i className={`ti ti-${icon} text-[14px] text-accent`} /> : null}
        {label}
      </div>
      <div className="text-[28px] font-medium leading-tight tabular-nums text-text-1">{value}</div>
      {delta || hint ? (
        <div className="flex items-baseline gap-1.5 text-small text-text-2">
          {delta ? <span className={`font-medium ${DELTA_TONE[deltaTone]}`}>{delta}</span> : null}
          {hint}
        </div>
      ) : null}
    </div>
  );
}
