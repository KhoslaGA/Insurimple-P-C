'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV: { label: string; href: string }[] = [
  { label: 'Household & client', href: '/' },
  { label: 'Policies', href: '#' },
  { label: 'Property lines', href: '#' },
  { label: 'Renewals', href: '/renewals' },
  { label: 'Transactions', href: '#' },
  { label: 'Rating & carrier', href: '/compare' },
  { label: 'Book & compliance', href: '#' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '#') return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={
              active
                ? 'rounded-control bg-tenant-primary-tint px-2.5 py-2 text-small font-medium text-tenant-primary-deep'
                : 'rounded-control px-2.5 py-2 text-small text-text-2 hover:bg-surface-sunken hover:text-text-1'
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
