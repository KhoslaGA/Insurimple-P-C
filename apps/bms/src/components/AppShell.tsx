'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import { Avatar, Badge, IconButton, Input } from '@insurimple/design-system';

/** Clerk widgets only mount when a real publishable key is present — a keyless
 *  preview deploy renders the app without broken/empty Clerk controls. */
const clerkReady = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/** Routes live now; the rest of the P&C leg lands in Phase 1 (pc-leg-page-list.md). */
const NAV: Array<{ icon: string; label: string; href?: string }> = [
  { icon: 'layout-dashboard', label: 'Overview', href: '/dashboard' },
  { icon: 'search', label: 'Locate', href: '/locate' },
  { icon: 'users', label: 'Households', href: '/households' },
  { icon: 'car', label: 'Policies' },
  { icon: 'list-check', label: 'Work queues', href: '/queues' },
  { icon: 'arrows-exchange', label: 'Transactions', href: '/transactions' },
  { icon: 'certificate', label: 'Proofs & documents' },
  { icon: 'cloud-download', label: 'Rating & carrier' },
  { icon: 'flame', label: 'Claims' },
  { icon: 'receipt', label: 'Billing & receivables' },
  { icon: 'chart-bar', label: 'Book & compliance' },
];

export function AppShell({ children, preview = false }: { children: ReactNode; preview?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="flex h-screen overflow-hidden bg-surface-app text-text-1">
      <aside className="flex w-[216px] flex-none flex-col border-r border-border-1 bg-surface-card">
        <div className="px-4 pb-3 pt-[18px] text-[19px] font-medium tracking-[-0.03em]">
          insurimple
        </div>
        <div className="px-4 pb-1.5 text-caption font-medium uppercase tracking-caps text-text-3">
          Personal lines
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
                aria-disabled="true"
                title="Coming in a later phase"
                className="flex cursor-default select-none items-center gap-2.5 rounded-control px-2.5 py-[7px] text-[13.5px] text-text-3"
              >
                <i className={`ti ti-${n.icon} text-[17px] opacity-70`} />
                <span className="opacity-70">{n.label}</span>
                <span className="ml-auto rounded-pill bg-surface-sunken px-1.5 py-px text-[10px] font-medium uppercase tracking-caps text-text-3">
                  Soon
                </span>
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
          <div className="w-full max-w-sm" onClick={() => router.push('/locate')}>
            <Input
              icon="search"
              size="sm"
              readOnly
              placeholder="Search everything (⌘K)"
              className="cursor-pointer"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            {preview ? <Badge tone="warning">Preview data</Badge> : null}
            {clerkReady ? (
              <OrganizationSwitcher
                afterSelectOrganizationUrl="/households"
                appearance={{ elements: { rootBox: 'flex items-center' } }}
              />
            ) : null}
            <IconButton icon="phone-incoming" label="Calls" variant="outline" />
            <IconButton icon="bell" label="Notifications" />
            {clerkReady ? <UserButton /> : <Avatar name="Gautam Khosla" size="sm" />}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
