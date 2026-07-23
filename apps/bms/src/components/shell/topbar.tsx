import { Badge } from "@insurimple/design-system";
import { getCurrentTenant } from "@/lib/tenant";

export function Topbar() {
  const tenant = getCurrentTenant();
  const initials = tenant.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface-card/80 px-5 backdrop-blur">
      <div className="min-w-0">
        <p className="truncate text-caption text-fg-subtle">
          {tenant.name} · Marketing
        </p>
        <p className="truncate text-small font-medium text-fg">Overview</p>
      </div>

      <div className="flex items-center gap-3">
        <Badge tone="warning" dot>
          Sample data
        </Badge>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-pill bg-brand text-caption font-medium text-fg-on-accent">
            {initials}
          </span>
        </div>
      </div>
    </header>
  );
}
