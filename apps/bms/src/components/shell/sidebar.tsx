import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { getCurrentTenant } from "@/lib/tenant";
import {
  IconAttribution,
  IconCampaign,
  IconConsent,
  IconDashboard,
  IconHome,
  IconSegment,
  IconSequence,
  IconSpark,
  IconTemplate,
} from "./icons";

type Item = {
  label: string;
  href?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  active?: boolean;
  soon?: boolean;
};

function NavItem({ label, href, icon: Icon, active, soon }: Item) {
  const inner = (
    <>
      <Icon className={active ? "text-brand" : ""} />
      <span className="flex-1 truncate">{label}</span>
      {soon ? (
        <span className="rounded-pill bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-fg-subtle">
          soon
        </span>
      ) : null}
    </>
  );

  const base =
    "flex items-center gap-3 rounded-control px-3 py-2 text-small font-medium transition-colors";

  if (soon || !href) {
    return (
      <div
        className={`${base} cursor-default text-fg-subtle`}
        aria-disabled="true"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${base} ${
        active
          ? "bg-brand-tint text-brand"
          : "text-fg-muted hover:bg-surface-sunken hover:text-fg"
      }`}
    >
      {inner}
    </Link>
  );
}

function Section({ label, items }: { label: string; items: Item[] }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.08em] text-fg-subtle">
        {label}
      </h2>
      <nav className="space-y-1" aria-label={label}>
        {items.map((it) => (
          <NavItem key={it.label} {...it} />
        ))}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const tenant = getCurrentTenant();
  const has = (m: "marketing" | "p_and_c") => tenant.modules.includes(m);

  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-border bg-surface-card lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex size-8 items-center justify-center rounded-control bg-brand text-fg-on-accent">
          <IconSpark />
        </span>
        <div className="leading-tight">
          <div className="text-body font-medium text-fg">Insurimple</div>
          <div className="text-caption text-fg-subtle">Marketing</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <Section
          label="Overview"
          items={[
            {
              label: "Dashboard",
              href: "/marketing",
              icon: IconDashboard,
              active: true,
            },
          ]}
        />

        {has("marketing") ? (
          <Section
            label="Marketing"
            items={[
              { label: "Campaigns", icon: IconCampaign, soon: true },
              { label: "Segments", icon: IconSegment, soon: true },
              { label: "Sequences", icon: IconSequence, soon: true },
              { label: "Templates", icon: IconTemplate, soon: true },
              { label: "Consent & suppression", icon: IconConsent, soon: true },
              { label: "Attribution", icon: IconAttribution, soon: true },
            ]}
          />
        ) : null}

        {has("p_and_c") ? (
          <Section
            label="Property & Casualty"
            items={[
              { label: "Households", icon: IconHome, soon: true },
              { label: "Policies", icon: IconTemplate, soon: true },
              { label: "Work queues", icon: IconDashboard, soon: true },
            ]}
          />
        ) : null}
      </div>

      <div className="border-t border-border px-5 py-4">
        <div className="text-caption text-fg-subtle">Signed in to</div>
        <div className="mt-0.5 text-small font-medium text-fg">
          {tenant.name}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {tenant.modules.map((m) => (
            <span
              key={m}
              className="rounded-pill bg-brand-tint px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-brand"
            >
              {m === "p_and_c" ? "P&C" : m}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
