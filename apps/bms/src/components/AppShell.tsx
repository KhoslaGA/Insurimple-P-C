import Link from 'next/link';
import type { ReactNode } from 'react';

const NAV: { label: string; href: string; active?: boolean }[] = [
  { label: 'Household & client', href: '/', active: true },
  { label: 'Policies', href: '#' },
  { label: 'Property lines', href: '#' },
  { label: 'Work queues', href: '#' },
  { label: 'Transactions', href: '#' },
  { label: 'Rating & carrier', href: '#' },
  { label: 'Book & compliance', href: '#' },
];

/** The P&C-leg app shell — sidebar + header — mirroring the prototype chrome. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-none flex-col border-r border-border-1 bg-surface-card">
        <div className="px-4 pb-1 pt-4 text-[19px] font-medium tracking-tight text-text-1">
          insurimple
        </div>
        <div className="px-4 pb-3 text-caption font-medium uppercase tracking-[0.06em] text-text-3">
          P&amp;C leg
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={
                item.active
                  ? 'rounded-control bg-tenant-primary-tint px-2.5 py-2 text-small font-medium text-tenant-primary-deep'
                  : 'rounded-control px-2.5 py-2 text-small text-text-2 hover:bg-surface-sunken hover:text-text-1'
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2.5 border-t border-border-1 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-pill bg-tenant-primary-tint text-caption font-medium text-tenant-primary-deep">
            RA
          </div>
          <div className="text-small leading-tight">
            <div className="font-medium text-text-1">Rina Alvarez</div>
            <div className="text-caption text-text-3">CSR · personal lines</div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 flex-none items-center gap-3 border-b border-border-1 bg-surface-card px-6">
          <h1 className="text-h2 font-medium text-text-1">Quote workspace</h1>
        </header>
        <main className="flex-1 overflow-y-auto bg-surface-app p-6">{children}</main>
      </div>
    </div>
  );
}
