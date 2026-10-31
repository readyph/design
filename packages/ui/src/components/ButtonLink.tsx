import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { base, heroGeometry, iconSize, variants, type ButtonVariant } from './Button';

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  actionBar?: boolean;
  /** Hero CTA geometry, as `Button`'s `hero` (44px, px-6, 15px / 600; 52px on phone). */
  hero?: boolean;
  /** Removes `href`, sets `aria-disabled` and takes the link out of the tab order. */
  disabled?: boolean;
  leftIcon?: PhosphorIcon;
  rightIcon?: PhosphorIcon;
  children?: ReactNode;
}

/** An anchor drawn as a `Button` (RDY-314). `target="_blank"` defaults `rel` to `noopener noreferrer`. */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { variant = 'primary', fullWidth = false, actionBar = false, hero = false, disabled = false, leftIcon: Left, rightIcon: Right, href, target, rel, className, children, onClick, ...rest },
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
      className={cn(base, focusRing, 'no-underline aria-disabled:cursor-not-allowed aria-disabled:opacity-70', variants[variant], actionBar && 'max-[640px]:h-[var(--ctl-touch)]', hero && heroGeometry, fullWidth && 'w-full', className)}
      {...rest}
    >
      {Left && <Left size={iconSize(hero)} aria-hidden="true" />}
      {children}
      {Right && <Right size={iconSize(hero)} aria-hidden="true" />}
    </a>
  );
});
