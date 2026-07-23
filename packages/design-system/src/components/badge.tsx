import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

const TONE: Record<BadgeTone, string> = {
  neutral: "bg-surface-sunken text-fg-muted",
  accent: "bg-accent-tint text-accent",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  danger: "bg-danger-tint text-danger",
  info: "bg-info-tint text-info",
};

const DOT: Record<BadgeTone, string> = {
  neutral: "bg-fg-subtle",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

/** Status pill. Declared props: tone, dot, children. */
export function Badge({
  tone = "neutral",
  dot = false,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-caption font-medium",
        TONE[tone],
      )}
    >
      {dot ? (
        <span className={cn("size-1.5 rounded-pill", DOT[tone])} aria-hidden />
      ) : null}
      {children}
    </span>
  );
}
