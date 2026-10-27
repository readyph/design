import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { base, variants, type ButtonVariant } from './Button';

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  actionBar?: boolean;
  /** Removes `href`, sets `aria-disabled` and takes the link out of the tab order. */
  disabled?: boolean;
  leftIcon?: PhosphorIcon;
  rightIcon?: PhosphorIcon;
  children?: ReactNode;
}

/** An anchor drawn as a `Button` (RDY-314). `target="_blank"` defaults `rel` to `noopener noreferrer`. */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { variant = 'primary', fullWidth = false, actionBar = false, disabled = false, leftIcon: Left, rightIcon: Right, href, target, rel, className, children, onClick, ...rest },
  ref,
) {
  const relValue = rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined);
  return (
    <a
      ref={ref}
      href={disabled ? undefined : href}
      target={disabled ? undefined : target}
      rel={relValue}
      aria-disabled={disabled || undefined}
      onClick={disabled ? (e) => e.preventDefault() : onClick}
      className={cn(base, focusRing, 'no-underline aria-disabled:cursor-not-allowed aria-disabled:opacity-70', variants[variant], actionBar && 'max-[640px]:h-[var(--ctl-touch)]', fullWidth && 'w-full', className)}
      {...rest}
    >
      {Left && <Left size={14} aria-hidden="true" />}
      {children}
      {Right && <Right size={14} aria-hidden="true" />}
    </a>
  );
});
