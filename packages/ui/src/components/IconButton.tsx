import { forwardRef, type ButtonHTMLAttributes } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { variants, type ButtonVariant } from './Button';

export type IconButtonVariant = ButtonVariant;

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Phosphor icon to render. */
  icon: PhosphorIcon;
  /** Required accessible label (there is no visible text). */
  label: string;
  /** Defaults to `text`. */
  variant?: IconButtonVariant;
  loading?: boolean;
  /** Phone action bars: 44px touch target at phone width. */
  actionBar?: boolean;
}

/** Square icon-only button, same height and radius as Button. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: IconCmp, label, variant = 'text', loading = false, actionBar = false, disabled, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-grid h-[var(--ctl-button)] w-[var(--ctl-button)] place-items-center rounded-control border border-transparent transition-colors duration-hover disabled:cursor-not-allowed disabled:opacity-50',
        focusRing,
        variants[variant],
        actionBar && 'max-[640px]:h-[var(--ctl-touch)] max-[640px]:w-[var(--ctl-touch)]',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : (
        <IconCmp size={16} aria-hidden="true" />
      )}
    </button>
  );
});
