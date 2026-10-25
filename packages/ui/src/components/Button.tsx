import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';

/** `text` replaces the legacy `subtle`. */
export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight. `primary` is the single accent CTA per view. */
  variant?: ButtonVariant;
  /** Show a spinner and disable interaction. */
  loading?: boolean;
  /** Stretch to the container width. */
  fullWidth?: boolean;
  /** Phone action bars: 44px touch height at phone width (otherwise 40px phone, 32px desktop). */
  actionBar?: boolean;
  /** Phosphor icon before the label. */
  leftIcon?: PhosphorIcon;
  /** Phosphor icon after the label. */
  rightIcon?: PhosphorIcon;
  children?: ReactNode;
}

// One geometry for every variant: 32px (40 phone) tall, 5px radius, 13px / 500.
// Each variant carries a 1px border (transparent unless `secondary`) so sizes match.
export const base =
  'relative inline-flex h-[var(--ctl-button)] items-center justify-center gap-2 whitespace-nowrap rounded-control border border-transparent px-4 text-ui font-medium transition-colors duration-hover disabled:cursor-not-allowed disabled:opacity-50';

export const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover',
  secondary: 'border-control bg-surface text-text hover:bg-raised active:bg-raised-2',
  text: 'bg-transparent text-text hover:bg-frame-hover active:bg-frame-active',
  danger: 'border-bad-dot bg-bad-bg text-bad-ink hover:bg-bad-dot hover:text-white',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading = false, fullWidth = false, actionBar = false, leftIcon: Left, rightIcon: Right, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, focusRing, variants[variant], actionBar && 'max-[640px]:h-[var(--ctl-touch)]', fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
      )}
      <span className={cn('inline-flex items-center justify-center gap-2', loading && 'invisible')}>
        {Left && <Left size={16} aria-hidden="true" />}
        {children}
        {Right && <Right size={16} aria-hidden="true" />}
      </span>
    </button>
  );
});
