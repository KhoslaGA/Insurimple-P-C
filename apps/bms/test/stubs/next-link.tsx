/**
 * next/link, as the anchor it becomes.
 *
 * Rendering a real <a href> rather than a no-op is deliberate: the href is the
 * thing worth asserting. `demo-data.test.ts` already checks that every
 * UI-buildable link resolves against the snapshot; this keeps those hrefs
 * present in the rendered markup so a screen test can see them too.
 */
import type { AnchorHTMLAttributes, ReactNode } from 'react';

export default function Link(
  { href, children, ...rest }: { href: string; children?: ReactNode }
    & AnchorHTMLAttributes<HTMLAnchorElement>,
) {
  return <a href={href} {...rest}>{children}</a>;
}
