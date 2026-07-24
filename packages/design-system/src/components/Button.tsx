import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-tenant-primary text-white hover:bg-tenant-primary-deep',
  secondary: 'bg-surface-card text-text-1 border border-border-1 hover:bg-surface-sunken',
  outline: 'bg-transparent text-text-1 border border-border-1 hover:bg-surface-sunken',
  ghost: 'bg-transparent text-text-2 hover:bg-surface-sunken hover:text-text-1',
  danger: 'bg-danger text-white hover:brightness-95',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-small',
  md: 'h-10 px-4 text-body',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', leftIcon, rightIcon, className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-primary disabled:pointer-events-none disabled:opacity-50',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
});
