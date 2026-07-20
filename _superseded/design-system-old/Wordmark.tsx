/**
 * Wordmark — the brand lockup.
 *
 * No logo files exist yet, and the design system is explicit that we must not
 * draw or approximate a mark. Until real artwork lands, the brand renders as
 * plain type: lowercase "insurimple", sans, weight 500, tight tracking.
 */

type WordmarkProps = {
  /** Visual size. `lg` for standalone/marketing, `md` for app chrome. */
  size?: "md" | "lg";
  className?: string;
};

const sizeClass = {
  md: "text-h2",
  lg: "text-h1",
} as const;

export function Wordmark({ size = "md", className = "" }: WordmarkProps) {
  return (
    <span
      className={`font-sans font-medium tracking-[-0.01em] text-text-1 lowercase ${sizeClass[size]} ${className}`}
    >
      insurimple
    </span>
  );
}
