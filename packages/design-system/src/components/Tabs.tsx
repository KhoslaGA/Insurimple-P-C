'use client';

import { useState } from 'react';

export interface TabItem {
  value: string;
  label: string;
  icon?: string;
  count?: number;
}

/** Underline tabs. The txn lifecycle vocabulary and queue names live in labels, never restyled. */
export function Tabs({
  tabs,
  value,
  defaultValue,
  onChange,
}: {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  const [inner, setInner] = useState(defaultValue ?? tabs[0]?.value);
  const active = value !== undefined ? value : inner;
  const pick = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };
  return (
    <div className="flex gap-1 border-b border-border-1">
      {tabs.map((t) => {
        const on = t.value === active;
        return (
          <button
            key={t.value}
            onClick={() => pick(t.value)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-body transition-colors duration-[120ms] ${
              on
                ? 'font-medium text-accent-deep shadow-[inset_0_-2px_0_var(--tenant-primary)]'
                : 'text-text-2'
            }`}
          >
            {t.icon ? <i className={`ti ti-${t.icon} text-[16px]`} /> : null}
            {t.label}
            {t.count !== undefined ? (
              <span
                className={`rounded-pill px-1.5 text-caption font-medium ${
                  on ? 'bg-accent-tint text-accent-deep' : 'bg-surface-sunken text-text-3'
                }`}
              >
                {t.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
