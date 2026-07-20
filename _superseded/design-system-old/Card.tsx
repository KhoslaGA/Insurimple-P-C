/**
 * Card — a flat tile.
 *
 * White, 1px hairline border, 12px radius, and NO shadow at rest. Elevation is
 * reserved for the two floating layers (--shadow-float for popovers/toasts,
 * --shadow-overlay for modals/drawers). Giving cards a resting shadow is the
 * fastest way to make the whole surface look unlike the design system.
 */

type CardProps = {
  /** Optional header row. Sentence case — never Title Case. */
  title?: string;
  /** Right-aligned header slot: counts, actions, badges. */
  action?: React.ReactNode;
  children: React.ReactNode;
  /** Drop internal padding when the child manages its own (e.g. a Table). */
  flush?: boolean;
};

export function Card({ title, action, children, flush = false }: CardProps) {
  return (
    <section className="rounded-card border border-border-1 bg-surface-card">
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-border-1 px-4 py-3">
          {title && (
            <h2 className="text-h2 font-medium text-text-1">{title}</h2>
          )}
          {action}
        </header>
      )}
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}
