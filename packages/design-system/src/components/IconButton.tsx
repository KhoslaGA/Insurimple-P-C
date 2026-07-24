import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type IconButtonVariant = 'solid' | 'outline' | 'ghost';
export type IconButtonSize = 'sm' | 'md';

const VARIANT: Record<IconButtonVariant, string> = {
  solid: 'bg-tenant-primary text-white hover:bg-tenant-primary-deep',
  outline: 'bg-transparent text-text-1 border border-border-1 hover:bg-surface-sunken',
  ghost: 'bg-transparent text-text-2 hover:bg-surface-sunken hover:text-text-1',
};

const SIZE: Record<IconButtonSize, string> = { sm: 'h-8 w-8', md: 'h-10 w-10' };

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label — icon-only controls are never unlabelled. */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', size = 'md', className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-control transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-primary disabled:pointer-events-none disabled:opacity-50',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
