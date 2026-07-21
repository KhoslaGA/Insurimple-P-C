/** Quiet loading spinner drawn from the accent tokens. */
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      aria-label="Loading"
      className="inline-block animate-spin rounded-pill border-2 border-accent-tint border-t-accent"
      style={{ width: size, height: size }}
    />
  );
}
