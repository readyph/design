import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';
import { Kbd } from './Kbd';
import { useShortcutMode } from '../providers/ShortcutModeProvider';
import { formatShortcut } from '../utils/shortcut';

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

/** A vertical navigation column. Width comes from the `sidebar` token. */
export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { className, children, ...rest },
  ref,
) {
  return (
    <nav
      ref={ref}
      className={cn('flex w-sidebar flex-col gap-1.5 bg-transparent p-3', className)}
      {...rest}
    >
      {children}
    </nav>
  );
});

export interface SidebarSectionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  children?: ReactNode;
}

export const SidebarSection = forwardRef<HTMLDivElement, SidebarSectionProps>(function SidebarSection(
  { title, className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn('flex flex-col gap-1.5 py-2', className)} {...rest}>
      {title && <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-ink-subtle">{title}</p>}
      {children}
    </div>
  );
});

export interface SidebarItemProps extends HTMLAttributes<HTMLElement> {
  icon?: PhosphorIcon;
  active?: boolean;
  href?: string;
  badge?: ReactNode;
  /** Display-only key hint, revealed in shortcut mode. */
  shortcut?: string;
  children?: ReactNode;
}

/** A single nav entry. Renders an `<a>` when `href` is set, else a `<button>`. */
export const SidebarItem = forwardRef<HTMLElement, SidebarItemProps>(function SidebarItem(
  { icon, active = false, href, badge, shortcut, className, children, ...rest },
  ref,
) {
  const { shortcutMode } = useShortcutMode();
  const classes = cn(
    'group flex w-full items-center gap-2.5 rounded-base px-3 py-2 text-sm font-medium transition-colors duration-DEFAULT',
    active ? 'bg-primary-50 text-primary-700' : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
    focusRing,
    className,
  );
  const inner = (
    <>
      {icon && <Icon icon={icon} size="md" weight={active ? 'fill' : 'regular'} className={active ? 'text-primary-600' : 'text-ink-subtle group-hover:text-ink'} />}
      <span className="flex-1 truncate text-left">{children}</span>
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
      <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} aria-current={active ? 'page' : undefined} className={classes} {...rest}>
        {inner}
      </a>
    );
  }
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} type="button" aria-current={active ? 'page' : undefined} className={classes} {...(rest as HTMLAttributes<HTMLButtonElement>)}>
      {inner}
    </button>
  );
});
