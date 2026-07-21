/**
 * Initials avatar. Hue palette ported from the prototype bundle (brand-derived
 * fixed set — the one sanctioned exception to no-literal-colors, matching _ds).
 */
const HUES = ['#12796A', '#33608C', '#C4544B', '#B0803B', '#5B3A8C', '#5B6B70'];
const DIM: Record<AvatarSize, number> = { sm: 26, md: 34, lg: 44 };

export type AvatarSize = 'sm' | 'md' | 'lg';

export function Avatar({
  name = '',
  size = 'md',
  src,
}: {
  name?: string;
  size?: AvatarSize;
  src?: string;
}) {
  const dim = DIM[size];
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const hue = HUES[(name.charCodeAt(0) || 0) % HUES.length];
  return (
    <span
      title={name}
      className="inline-flex flex-none items-center justify-center overflow-hidden rounded-pill font-medium text-text-on-accent"
      style={{ width: dim, height: dim, fontSize: dim * 0.38, background: src ? 'var(--surface-sunken)' : hue }}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
