import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';
import { Kbd } from './Kbd';
import { Spinner } from './Spinner';
import { useShortcutMode } from '../providers/ShortcutModeProvider';
import { formatShortcut } from '../utils/shortcut';

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight. `primary` is the single blue CTA. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show a spinner and disable interaction. */
  loading?: boolean;
  /** Stretch to the container width. */
  fullWidth?: boolean;
  /** Phosphor icon before the label. */
  leftIcon?: PhosphorIcon;
  /** Phosphor icon after the label. */
  rightIcon?: PhosphorIcon;
  /**
   * Shortcut hint, e.g. `"mod+s"`. Display only — revealed as a `<Kbd>` chip
   * when shortcut mode is on; the project binds the real key.
   */
  shortcut?: string;
  children?: ReactNode;
}

const base =
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-base font-medium transition-colors duration-DEFAULT ease-standard disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600',
  secondary:
    'border border-border bg-surface text-ink hover:bg-surface-subtle active:bg-surface-muted',
  subtle: 'bg-transparent text-ink hover:bg-surface-muted active:bg-neutral-200',
  danger: 'bg-error text-white hover:brightness-95 active:brightness-90',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-sm px-3 text-sm',
  md: 'h-md px-4 text-sm',
  lg: 'h-lg px-5 text-base',
};

const iconSizeFor: Record<ButtonSize, 'sm' | 'md'> = { sm: 'sm', md: 'sm', lg: 'md' };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    shortcut,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const { shortcutMode } = useShortcutMode();
  const showHint = Boolean(shortcut) && shortcutMode;
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(base, focusRing, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
        </span>
      )}
      <span className={cn('contents', loading && 'invisible')}>
        {leftIcon && <Icon icon={leftIcon} size={iconSizeFor[size]} />}
        {children}
        {rightIcon && <Icon icon={rightIcon} size={iconSizeFor[size]} />}
        {showHint && (
          <span className="ml-1 flex items-center gap-0.5">
            {formatShortcut(shortcut!).map((k, i) => (
              <Kbd key={i} size="sm">
                {k}
              </Kbd>
            ))}
          </span>
        )}
      </span>
    </button>
  );
});
