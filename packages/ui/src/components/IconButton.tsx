import { forwardRef, type ButtonHTMLAttributes } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

export type IconButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Phosphor icon to render. */
  icon: PhosphorIcon;
  /** Required accessible label (there is no visible text). */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
}

// Every variant carries a 1px border (transparent except `secondary`) so all
// variants share the same geometry — see the note in Button.tsx.
const variants: Record<IconButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
  secondary: 'border-border bg-transparent text-ink hover:bg-surface-subtle',
  subtle: 'bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink',
  danger: 'bg-transparent text-error-fg hover:bg-error/10',
};

const sizes: Record<IconButtonSize, { box: string; icon: 'sm' | 'md' | 'lg' }> = {
  sm: { box: 'h-8 w-8', icon: 'sm' },
  md: { box: 'h-9 w-9', icon: 'md' },
  lg: { box: 'h-10 w-10', icon: 'lg' },
};

/** A square, icon-only button. Carries its label via `aria-label`. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = 'subtle', size = 'md', loading = false, disabled, className, type = 'button', ...rest },
  ref,
) {
  const s = sizes[size];
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-grid place-items-center border border-transparent rounded-base transition-colors duration-DEFAULT ease-standard disabled:cursor-not-allowed disabled:opacity-50',
        focusRing,
        variants[variant],
        s.box,
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : <Icon icon={icon} size={s.icon} />}
    </button>
  );
});
