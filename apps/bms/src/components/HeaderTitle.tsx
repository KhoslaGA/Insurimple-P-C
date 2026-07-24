'use client';

import { usePathname } from 'next/navigation';

const TITLES: Record<string, string> = {
  '/': 'Quote workspace',
  '/compare': 'Rating & carrier',
  '/renewals': 'Renewals',
  '/oaf1': 'OAF 1 preview',
};

export function HeaderTitle() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? 'Insurimple — P&C';
  return <h1 className="text-h2 font-medium text-text-1">{title}</h1>;
}
