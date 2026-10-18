import { useState, type ReactNode } from 'react';
import {
  Plus,
  MagnifyingGlass,
  Bell,
  CaretLeft,
  List,
  SignOut,
  ArrowClockwise,
  WarningCircle,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { cn, focusRing } from '../../utils/cn';
import { Sidebar, SidebarSection, SidebarItem } from '../../components/Sidebar';
import { TopBar } from '../../components/TopBar';
import { IconButton } from '../../components/IconButton';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { LedaLauncher } from '../../components/LedaLauncher';
import { Menu, type MenuItem } from '../../components/Menu';
import { OffCanvas, OffCanvasHeader } from '../../components/Drawer';
import { StatusDot, type StatusTone } from '../../components/StatusDot';

export interface PlatformShellPlatform {
  /** Stable key. */
  id: string;
  /** Accessible name and tooltip. */
  label: string;
  /** Per-platform glyph. Falls back to `avatar`, then to the label's initials. */
  icon?: PhosphorIcon;
  /** Name rendered as an Avatar (initials), for platforms without a distinct icon (e.g. branches). */
  avatar?: string;
  status?: StatusTone;
  /** The platform the shell is running as. */
  active?: boolean;
  href?: string;
  onSelect?: () => void;
}

export interface PlatformShellNavItem {
  key: string;
  label: string;
  icon?: PhosphorIcon;
  badge?: ReactNode;
  href?: string;
  onSelect?: () => void;
}

export interface PlatformShellSection {
  /** Section heading; omit for the primary group. */
  title?: string;
  items: PlatformShellNavItem[];
}

export interface PlatformShellAccount {
  name: string;
  email?: string;
  /** Menu entries between the email label and Sign out. */
  items?: MenuItem[];
  onSignOut?: () => void;
}

export interface PlatformShellFooterLink {
  label: string;
  href?: string;
  onClick?: () => void;
}

/** State of the platforms list in the rail. The Portal tile, "+" and account menu render in every state. */
export type PlatformShellRailState = 'loading' | 'error' | 'ready';

export interface PlatformShellProps {
  /** State of the rail's platform list (default `ready`). */
  railState?: PlatformShellRailState;
  /** Retry loading the platform list; shown as a button in the `error` state. */
  onRetryPlatforms?: () => void;
  /** The platform this shell runs as: sidebar header name and icon. */
  platform: { name: string; icon: PhosphorIcon };
  /** Tenant/company name; shown in the sidebar header with the platform name beneath it. */
  company?: string;
  /** Tenant platforms shown in the rail (the current one flagged `active`). */
  platforms: PlatformShellPlatform[];
  /** Sidebar nav groups. */
  sections: PlatformShellSection[];
  /** Key of the active nav item. */
  activeKey?: string;
  /** Bottom sidebar link, e.g. "Back to Portal". */
  footerLink?: PlatformShellFooterLink;
  /** Top-bar title. */
  title: ReactNode;
  /** Right-aligned top-bar controls; defaults to search pill + notifications. */
  actions?: ReactNode;
  account?: PlatformShellAccount;
  /** R home tile target. */
  homeHref?: string;
  onHome?: () => void;
  /** The "+" rail button (connect a platform). */
  onAddPlatform?: () => void;
  /** Hide the floating Ask-Leda launcher (default true: hidden). */
  hideLeda?: boolean;
  /** Wrap children in a scroll area (default). Pass false for a self-managing layout. */
  scroll?: boolean;
  /** Mobile menu (off-canvas sidebar) state; uncontrolled when omitted. */
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

const tile = 'grid h-9 w-9 place-items-center rounded-lg';

function RailPlatform({ p }: { p: PlatformShellPlatform }) {
  const body = (
    <>
      <span
        className={cn(
          tile,
          p.active ? 'bg-primary-50 text-primary-700' : 'text-ink-subtle hover:bg-surface-muted hover:text-ink',
        )}
      >
        {p.icon ? (
          <Icon icon={p.icon} size="md" weight={p.active ? 'fill' : 'regular'} />
        ) : (
          <Avatar name={p.avatar ?? p.label} size="sm" shape="square" />
        )}
      </span>
      {p.status && (
        <span className="absolute -bottom-0.5 -right-0.5">
          <StatusDot status={p.status} />
        </span>
      )}
    </>
  );
  const common = {
    'aria-label': p.label,
    title: p.label,
    'aria-current': p.active ? ('page' as const) : undefined,
    className: cn('relative rounded-lg', focusRing),
  };
  return p.href ? (
    <a href={p.href} onClick={p.onSelect} {...common}>{body}</a>
  ) : (
    <button type="button" onClick={p.onSelect} {...common}>{body}</button>
  );
}

/**
 * The shared platform shell: icon rail (R home tile, tenant platforms with status, "+", account menu),
 * sidebar (platform header, nav sections, footer link) and top bar, with a content slot and an
 * off-canvas sidebar on small screens. The Ask-Leda launcher is opt-in via `hideLeda={false}`.
 */
export function PlatformShell({
  platform,
  company,
  platforms,
  railState = 'ready',
  onRetryPlatforms,
  sections,
  activeKey,
  footerLink,
  title,
  actions,
  account,
  homeHref,
  onHome,
  onAddPlatform,
  hideLeda = true,
  scroll = true,
  menuOpen,
  onMenuOpenChange,
  children,
}: PlatformShellProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = menuOpen ?? innerOpen;
  const setOpen = (v: boolean) => {
    setInnerOpen(v);
    onMenuOpenChange?.(v);
  };

  const sidebarBody = (
    <>
      <div className="mb-2 flex items-center gap-2 px-2 pt-1">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-base bg-primary-50 text-primary-700">
          <Icon icon={platform.icon} size="sm" weight="fill" />
        </span>
        {company ? (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-bold tracking-tight text-ink">{company}</span>
            <span className="truncate text-xs text-ink-subtle">{platform.name}</span>
          </span>
        ) : (
          <span className="truncate text-sm font-bold tracking-tight text-ink">{platform.name}</span>
        )}
      </div>
      {sections.map((s, i) => (
        <SidebarSection key={s.title ?? i} title={s.title}>
          {s.items.map((n) => (
            <SidebarItem
              key={n.key}
              icon={n.icon}
              badge={n.badge}
              href={n.href}
              active={activeKey === n.key}
              onClick={(e) => {
                if (n.onSelect) {
                  e.preventDefault();
                  n.onSelect();
                }
                setOpen(false);
              }}
            >
              {n.label}
            </SidebarItem>
          ))}
        </SidebarSection>
      ))}
      {footerLink && (
        <div className="mt-auto px-1 pb-1 pt-3">
          {footerLink.href ? (
            <a
              href={footerLink.href}
              onClick={footerLink.onClick}
              className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-subtle hover:bg-surface-muted hover:text-ink', focusRing)}
            >
              <Icon icon={CaretLeft} size="sm" /> {footerLink.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={footerLink.onClick}
              className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-subtle hover:bg-surface-muted hover:text-ink', focusRing)}
            >
              <Icon icon={CaretLeft} size="sm" /> {footerLink.label}
            </button>
          )}
        </div>
      )}
    </>
  );

  const homeProps = {
    'aria-label': 'Back to Portal home',
    className: cn('grid h-9 w-9 place-items-center rounded-lg bg-primary-600 font-bold text-white shadow-sm', focusRing),
  };

  const accountItems: MenuItem[] = account
    ? [
        ...(account.email ? [{ type: 'label', label: account.email } as MenuItem] : []),
        ...(account.items ?? []),
        { type: 'separator' },
        { label: 'Sign out', icon: SignOut, danger: true, onSelect: account.onSignOut },
      ]
    : [];

  return (
    <div className="ds-root flex h-screen w-full overflow-hidden bg-surface-canvas font-sans text-ink">
      {/* Platforms rail */}
      <div className="hidden w-rail shrink-0 flex-col items-center gap-2 py-3 sm:flex">
        {homeHref ? (
          <a href={homeHref} onClick={onHome} {...homeProps}>R</a>
        ) : (
          <button type="button" onClick={onHome} {...homeProps}>R</button>
        )}
        <div className="my-1 h-px w-6 bg-border" />
        {railState === 'ready' &&
          platforms.map((p) => (
            <RailPlatform key={p.id} p={p} />
          ))}
        {railState === 'loading' && (
          <div role="status" aria-busy="true" className="flex flex-col items-center gap-2">
            <span className="sr-only">Loading your platforms</span>
            {[0, 1, 2].map((i) => (
              <span key={i} aria-hidden="true" className={cn(tile, 'bg-surface-muted motion-safe:animate-pulse')} />
            ))}
          </div>
        )}
        {railState === 'error' && (
          <div role="alert" className="flex w-full flex-col items-center gap-1 px-1 text-center">
            <Icon icon={WarningCircle} size="md" className="text-error" />
            <span className="text-xs leading-tight text-ink-muted">Couldn't load platforms</span>
            <button
              type="button"
              onClick={onRetryPlatforms}
              className={cn('mt-1 flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-semibold text-primary-700 hover:bg-surface-muted', focusRing)}
            >
              <Icon icon={ArrowClockwise} size="sm" /> Retry
            </button>
          </div>
        )}
        <button
          type="button"
          aria-label="Connect a platform"
          title="Connect a platform"
          onClick={onAddPlatform}
          className={cn(tile, 'text-ink-subtle hover:bg-surface-muted hover:text-ink', focusRing)}
        >
          <Icon icon={Plus} size="md" />
        </button>
        {account && (
          <div className="mt-auto">
            <Menu
              trigger={
                <button type="button" className={cn('rounded-full', focusRing)} aria-label="Account">
                  <Avatar name={account.name} size="sm" />
                </button>
              }
              items={accountItems}
            />
          </div>
        )}
      </div>

      {/* Window */}
      <div className="flex min-w-0 flex-1 overflow-hidden bg-transparent">
        <Sidebar className="hidden lg:flex">{sidebarBody}</Sidebar>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <TopBar
            start={
              <>
                <IconButton icon={List} label="Open menu" variant="subtle" className="lg:hidden" onClick={() => setOpen(true)} />
                {typeof title === 'string' ? <span className="truncate text-sm font-semibold text-ink">{title}</span> : title}
              </>
            }
            end={
              actions ?? (
                <>
                  <label className="hidden h-9 items-center gap-2 rounded-full bg-surface-muted px-3.5 text-ink-subtle md:flex">
                    <Icon icon={MagnifyingGlass} size="sm" />
                    <input
                      aria-label="Search everything"
                      placeholder="Search everything…"
                      className="w-48 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
                    />
                  </label>
                  <IconButton icon={Bell} label="Notifications" variant="subtle" />
                </>
              )
            }
          />
          {scroll ? (
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          )}
          {!hideLeda && <LedaLauncher />}
        </div>
      </div>

      <OffCanvas open={open} onOpenChange={setOpen} side="left" width="288px">
        {/* Accessible dialog title only: the sidebar brand already shows the company name. */}
        <OffCanvasHeader className="sr-only">{company ?? platform.name}</OffCanvasHeader>
        <Sidebar className="flex p-0">{sidebarBody}</Sidebar>
      </OffCanvas>
    </div>
  );
}
