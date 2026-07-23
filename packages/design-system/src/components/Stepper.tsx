import type { ReactNode } from 'react';

export type StepState = 'done' | 'current' | 'pending' | 'rejected';

export interface Step {
  label: ReactNode;
  state: StepState;
}

const DOT: Record<StepState, string> = {
  done: 'bg-success text-text-on-accent border-success',
  current: 'bg-accent text-text-on-accent border-accent',
  pending: 'bg-surface-card text-text-3 border-border-2',
  rejected: 'bg-danger text-text-on-accent border-danger',
};

const LABEL: Record<StepState, string> = {
  done: 'text-text-2',
  current: 'font-medium text-text-1',
  pending: 'text-text-3',
  rejected: 'font-medium text-danger',
};

const ICON: Partial<Record<StepState, string>> = {
  done: 'check',
  rejected: 'x',
};

/**
 * Horizontal lifecycle stepper — the transaction state machine made visible.
 * States and their tones read design-system tokens; the vocabulary comes from
 * the caller (the canonical txn labels), never restyled here.
 */
export function Stepper({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex w-full items-start">
      {steps.map((s, i) => (
        <li key={i} className="flex min-w-0 flex-1 flex-col items-center">
          <div className="flex w-full items-center">
            <span className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : s.state === 'pending' ? 'bg-border-2' : 'bg-success'}`} />
            <span
              className={`flex h-6 w-6 flex-none items-center justify-center rounded-pill border text-caption font-medium tabular-nums ${DOT[s.state]}`}
            >
              {ICON[s.state] ? <i className={`ti ti-${ICON[s.state]} text-[13px]`} /> : i + 1}
            </span>
            <span className={`h-0.5 flex-1 ${i === steps.length - 1 ? 'opacity-0' : s.state === 'done' || s.state === 'rejected' ? 'bg-success' : 'bg-border-2'}`} />
          </div>
          <span className={`mt-1.5 px-1 text-center text-caption leading-tight ${LABEL[s.state]}`}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}
