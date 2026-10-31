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
  /**
   * Keep the button focusable while it is busy: `loading` and `disabled` then set `aria-disabled` (and swallow clicks)
   * instead of the `disabled` attribute, so focus stays on the pressed button during a save.
   */
  keepFocus?: boolean;
  /** Stretch to the container width. */
  fullWidth?: boolean;
  /** Phone action bars: 44px touch height at phone width (otherwise 40px phone, 32px desktop). */
  actionBar?: boolean;
  /**
   * Hero CTA (the Signed out screen's one Sign in, workshop signed-out.html `.so .go`): 44px tall, 24px side padding,
   * 15px / 600, 16px icons; 52px tall at phone width. Not a size scale: one modifier for a single full-page call to action.
   */
  hero?: boolean;
  /** Phosphor icon before the label. */
  leftIcon?: PhosphorIcon;
  /** Phosphor icon after the label. */
  rightIcon?: PhosphorIcon;
  children?: ReactNode;
}

// One geometry for every variant: 32px (40 phone) tall, 5px radius, 13px / 500.
// Only `secondary` has a border (the prototype's .btn); the others are borderless at the same height.
export const base =
  'relative inline-flex h-[var(--ctl-button)] items-center justify-center gap-2 whitespace-nowrap rounded-control border border-transparent px-3 text-ui font-medium leading-5 transition-colors duration-hover disabled:cursor-not-allowed disabled:opacity-70';

/** `hero` geometry: overrides the height, padding and type of `base` (tailwind-merge keeps the later class). */
export const heroGeometry = 'h-[var(--ctl-touch)] px-6 text-[15px] font-semibold leading-[22px] max-[640px]:h-[52px]';

/** Icon size for a button: 14px in the standard geometry, 16px in the hero geometry. */
export const iconSize = (hero: boolean) => (hero ? 16 : 14);

export const variants: Record<ButtonVariant, string> = {
  primary: 'border-0 bg-accent text-accent-ink hover:bg-accent-hover',
  secondary: 'border-control bg-surface text-text hover:border-muted active:bg-raised',
  text: 'border-0 bg-transparent px-2 text-text hover:bg-raised active:bg-raised-2',
  danger: 'border-0 bg-bad text-bad-on hover:bg-bad-dot',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading = false, keepFocus = false, fullWidth = false, actionBar = false, hero = false, leftIcon: Left, rightIcon: Right, disabled, className, children, type = 'button', onClick, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={keepFocus ? undefined : disabled || loading}
      aria-disabled={keepFocus && (disabled || loading) ? true : undefined}
      aria-busy={loading || undefined}
      onClick={keepFocus && (disabled || loading) ? (e) => e.preventDefault() : onClick}
      className={cn(base, focusRing, keepFocus && 'aria-disabled:cursor-not-allowed aria-disabled:opacity-70', variants[variant], actionBar && 'max-[640px]:h-[var(--ctl-touch)]', hero && heroGeometry, fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
      )}
      <span className={cn('inline-flex items-center justify-center gap-2', loading && 'opacity-0')}>
        {Left && <Left size={iconSize(hero)} aria-hidden="true" />}
        {children}
        {Right && <Right size={iconSize(hero)} aria-hidden="true" />}
      </span>
    </button>
  );
});
