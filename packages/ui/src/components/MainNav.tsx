import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';
import { Kbd } from './Kbd';
import { useShortcutMode } from '../providers/ShortcutModeProvider';
import { formatShortcut } from '../utils/shortcut';

export interface MainNavProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

/**
 * A horizontal primary navigation row. Pair it with `MainNavItem`. Compose it
 * wherever you need (e.g. the `center`/`start` slot of `TopBar`); the package
 * ships no app shell.
 *
 * @example
 * <MainNav>
 *   <MainNavItem icon={House} href="/" active>Home</MainNavItem>
 *   <MainNavItem icon={Package} href="/inventory">Inventory</MainNavItem>
 * </MainNav>
 */
export const MainNav = forwardRef<HTMLElement, MainNavProps>(function MainNav(
  { className, children, ...rest },
  ref,
) {
  return (
    <nav ref={ref} aria-label="Main" className={cn('flex items-center gap-1', className)} {...rest}>
      {children}
    </nav>
  );
});

export interface MainNavItemProps extends HTMLAttributes<HTMLElement> {
  icon?: PhosphorIcon;
  active?: boolean;
  /** Render an `<a>` when set, else a `<button>`. */
  href?: string;
  badge?: ReactNode;
  /** Display-only key hint, revealed in shortcut mode. The app binds the key. */
  shortcut?: string;
  children?: ReactNode;
}

/** A single top-nav entry. Behaviour (onClick / navigation) is the project's. */
export const MainNavItem = forwardRef<HTMLElement, MainNavItemProps>(function MainNavItem(
  { icon, active = false, href, badge, shortcut, className, children, ...rest },
  ref,
) {
  const { shortcutMode } = useShortcutMode();
  const classes = cn(
    'group inline-flex items-center gap-2 rounded-base px-3 py-2 text-sm font-medium transition-colors duration-DEFAULT',
    active ? 'bg-primary-50 text-primary-700 [[data-theme=dark]_&]:text-primary-900' : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
    focusRing,
    className,
  );
  const inner = (
    <>
      {icon && (
        <Icon
          icon={icon}
          size="md"
          weight={active ? 'fill' : 'regular'}
          className={active ? 'text-primary-600' : 'text-ink-subtle group-hover:text-ink'}
        />
      )}
      <span className="truncate">{children}</span>
      {shortcut && shortcutMode ? (
        <span className="flex items-center gap-0.5">
          {formatShortcut(shortcut).map((k, i) => (
            <Kbd key={i} size="sm">
              {k}
            </Kbd>
          ))}
        </span>
      ) : (
        badge != null && <span className="text-xs text-ink-subtle">{badge}</span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={classes}
        {...rest}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      aria-current={active ? 'page' : undefined}
      className={classes}
      {...(rest as HTMLAttributes<HTMLButtonElement>)}
    >
      {inner}
    </button>
  );
});
