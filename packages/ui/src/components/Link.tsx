import { forwardRef, type AnchorHTMLAttributes } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** `default` carries the brand blue; `muted` for secondary links. */
  tone?: 'default' | 'muted';
  /** Underline behavior. */
  underline?: 'hover' | 'always' | 'none';
  /** Show an external-link affordance and sensible rel/target. */
  external?: boolean;
  /** Optional trailing icon. */
  icon?: PhosphorIcon;
}

/**
 * A text link. Appearance only — the project supplies `href`, routing and any
 * `onClick`. For client routing, pass the router's anchor via `asChild`-style
 * composition in the app, or wrap this component.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { tone = 'default', underline = 'hover', external, icon, className, children, rel, target, ...rest },
  ref,
) {
  return (
    <a
      ref={ref}
      rel={external ? cn('noopener noreferrer', rel) : rel}
      target={external ? target ?? '_blank' : target}
      className={cn(
        'inline-flex items-center gap-1 rounded-sm font-medium transition-colors duration-DEFAULT',
        tone === 'default' ? 'text-link hover:text-primary-700' : 'text-ink-muted hover:text-ink',
        underline === 'always' && 'underline underline-offset-2',
        underline === 'hover' && 'no-underline hover:underline hover:underline-offset-2',
        underline === 'none' && 'no-underline',
        focusRing,
        className,
      )}
      {...rest}
    >
      {children}
      {icon && <Icon icon={icon} size="sm" />}
    </a>
  );
});
