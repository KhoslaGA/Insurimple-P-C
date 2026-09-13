/**
 * Clerk's client widgets, as inert placeholders.
 *
 * AppShell mounts OrganizationSwitcher and UserButton. Both are third-party
 * widgets that talk to Clerk at runtime; neither is what a screen test is
 * about, and @clerk/nextjs ships an ESM build with directory imports a bare
 * Node resolver cannot follow.
 *
 * They render a marked element rather than null so a test can still assert the
 * shell put them somewhere — the tenant switcher is the multi-tenancy affordance
 * (invariant 2) and "it disappeared" should be visible here.
 */
export function OrganizationSwitcher() {
  return <div data-testid="clerk-organization-switcher" />;
}
export function UserButton() {
  return <div data-testid="clerk-user-button" />;
}
export function SignedIn({ children }: { children?: React.ReactNode }) { return <>{children}</>; }
export function SignedOut() { return null; }
export function ClerkProvider({ children }: { children?: React.ReactNode }) { return <>{children}</>; }
