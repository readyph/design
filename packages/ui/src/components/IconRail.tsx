import { forwardRef, type HTMLAttributes } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';
import { Tooltip } from './Tooltip';

export interface IconRailProps extends HTMLAttributes<HTMLElement> {}

/** A narrow icon-only navigation rail. Width comes from the `rail` token. */
export const IconRail = forwardRef<HTMLElement, IconRailProps>(function IconRail(
  { className, children, ...rest },
  ref,
) {
  return (
    <nav
      ref={ref}
      className={cn('flex w-rail flex-col items-center gap-1 border-r border-border bg-surface py-3', className)}
      {...rest}
    >
      {children}
    </nav>
  );
});

export interface IconRailItemProps {
  icon: PhosphorIcon;
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/** A rail entry — icon with a tooltip label and active indicator. */
export const IconRailItem = forwardRef<HTMLButtonElement, IconRailItemProps>(function IconRailItem(
  { icon, label, active = false, href, onClick, className },
  ref,
) {
  const classes = cn(
    'relative grid h-10 w-10 place-items-center rounded-base transition-colors duration-DEFAULT',
    active ? 'bg-primary-50 text-primary-600' : 'text-ink-subtle hover:bg-surface-muted hover:text-ink',
    focusRing,
    className,
  );
  const content = (
    <>
      {active && <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-primary-500" />}
      <Icon icon={icon} size="md" weight={active ? 'fill' : 'regular'} />
    </>
  );
  return (
    <Tooltip content={label} side="right">
      {href ? (
        <a href={href} aria-label={label} aria-current={active ? 'page' : undefined} className={classes}>
          {content}
        </a>
      ) : (
        <button ref={ref} type="button" aria-label={label} aria-current={active ? 'page' : undefined} onClick={onClick} className={classes}>
          {content}
        </button>
      )}
    </Tooltip>
  );
});
