import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';
import { base, iconSizeFor, sizes, variants, type ButtonSize, type ButtonVariant } from './Button';

export interface ButtonLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** Destination. Renders a real `<a>`, so middle-click and copy-link work. */
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the container width. */
  fullWidth?: boolean;
  /** Phosphor icon before the label. */
  leftIcon?: PhosphorIcon;
  /** Phosphor icon after the label. */
  rightIcon?: PhosphorIcon;
  /** Render inert: drops the href, is skipped by Tab, and is announced as disabled. */
  disabled?: boolean;
  children?: ReactNode;
}

/**
 * A link that looks like a `Button`. Use for navigation (cross-app exits, "open in Portal");
 * use `Button` for actions. `target="_blank"` gets `rel="noopener noreferrer"` unless `rel` is given.
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { href, variant = 'primary', size = 'md', fullWidth = false, leftIcon, rightIcon, disabled = false, className, children, target, rel, onClick, ...rest },
  ref,
) {
  return (
    <a
      ref={ref}
      href={disabled ? undefined : href}
      target={target}
      rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
      role={disabled ? 'link' : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={disabled ? (e) => e.preventDefault() : onClick}
      className={cn(base, focusRing, variants[variant], sizes[size], fullWidth && 'w-full', disabled && 'pointer-events-none cursor-not-allowed opacity-50', className)}
      {...rest}
    >
      {leftIcon && <Icon icon={leftIcon} size={iconSizeFor[size]} />}
      {children}
      {rightIcon && <Icon icon={rightIcon} size={iconSizeFor[size]} />}
    </a>
  );
});
