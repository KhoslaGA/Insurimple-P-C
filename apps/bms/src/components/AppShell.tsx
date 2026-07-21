'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Avatar, IconButton, Input } from '@insurimple/design-system';

/** Routes live now; the rest of the P&C leg lands in Phase 1 (pc-leg-page-list.md). */
const NAV: Array<{ icon: string; label: string; href?: string }> = [
  { icon: 'search', label: 'Locate', href: '/locate' },
  { icon: 'users', label: 'Household & client' },
  { icon: 'car', label: 'Policies' },
  { icon: 'list-check', label: 'Work queues' },
  { icon: 'arrows-exchange', label: 'Transactions', href: '/' },
  { icon: 'certificate', label: 'Proofs & documents' },
  { icon: 'cloud-download', label: 'Rating & carrier' },
  { icon: 'flame', label: 'Claims' },
  { icon: 'receipt', label: 'Billing & receivables' },
  { icon: 'chart-bar', label: 'Book & compliance' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="flex h-screen overflow-hidden bg-surface-app text-text-1">
      <aside className="flex w-[216px] flex-none flex-col border-r border-border-1 bg-surface-card">
        <div className="px-4 pb-3 pt-[18px] text-[19px] font-medium tracking-[-0.03em]">
          insurimple
        </div>
        <div className="px-4 pb-1.5 text-caption font-medium uppercase tracking-caps text-text-3">
          P&amp;C leg
        </div>
        <nav className="flex flex-col gap-0.5 px-2 pb-3">
          {NAV.map((n) =>
            n.href ? (
              <Link
                key={n.label}
                href={n.href}
                className={`flex items-center gap-2.5 rounded-control px-2.5 py-[7px] text-[13.5px] ${
                  pathname === n.href
                    ? 'bg-accent-tint font-medium text-accent-deep'
                    : 'text-text-2 hover:bg-surface-panel'
                }`}
              >
                <i className={`ti ti-${n.icon} text-[17px]`} />
                {n.label}
              </Link>
            ) : (
              <span
                key={n.label}
                title="Phase 1"
                className="flex cursor-default items-center gap-2.5 rounded-control px-2.5 py-[7px] text-[13.5px] text-text-3 opacity-60"
              >
                <i className={`ti ti-${n.icon} text-[17px]`} />
                {n.label}
              </span>
            ),
          )}
        </nav>
        <div className="mt-auto flex items-center gap-2.5 border-t border-border-1 p-3">
          <Avatar name="Gautam Khosla" size="sm" />
          <div className="text-small">
            <div className="font-medium">Gautam Khosla</div>
            <div className="text-caption text-text-3">Principal broker</div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 flex-none items-center gap-3 border-b border-border-1 bg-surface-card px-5">
          <div className="w-80" onClick={() => router.push('/locate')}>
            <Input
              icon="search"
              size="sm"
              readOnly
              placeholder="Locate a client, policy, or txn…  ⌘K"
              className="cursor-pointer"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <IconButton icon="phone-incoming" label="Calls" variant="outline" />
            <IconButton icon="bell" label="Notifications" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
