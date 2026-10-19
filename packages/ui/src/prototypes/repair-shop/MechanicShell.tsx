import type { ReactNode } from 'react';
import { CalendarCheck, ClipboardText, SignOut, Users, Wrench, WifiSlash, ArrowsLeftRight, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Icon } from '../../components/Icon';
import { Menu } from '../../components/Menu';
import { Toaster } from '../../components/toast/Toaster';
import { cn, focusRing } from '../../utils/cn';
import { ME } from './MechanicData';
import './mechanic.css';

export type MechanicTab = 'today' | 'jobs' | 'customers';

const TABS: { key: MechanicTab; label: string; icon: PhosphorIcon }[] = [
  { key: 'today', label: 'Today', icon: CalendarCheck },
  { key: 'jobs', label: 'Jobs', icon: ClipboardText },
  { key: 'customers', label: 'Customers', icon: Users },
];

/**
 * NEEDS EARVIN (prototype-local, not exported): the kit has no bottom tab bar. Three destinations, each a 56px-tall
 * target with an icon and a visible label. Active = aria-current. Safe-area padding keeps it clear of the home indicator.
 */
export function BottomTabBar({ active, counts, onChange }: { active: MechanicTab; counts?: Partial<Record<MechanicTab, number>>; onChange?: (t: MechanicTab) => void }) {
  return (
    <nav aria-label="Main" className="mech-safe-bottom shrink-0 border-t border-border bg-surface">
      <ul className="grid grid-cols-3">
        {TABS.map((t) => {
          const on = t.key === active;
          const n = counts?.[t.key];
          return (
            <li key={t.key}>
              <button
                aria-current={on ? 'page' : undefined}
                onClick={() => onChange?.(t.key)}
                className={cn('relative flex min-h-14 w-full flex-col items-center justify-center gap-1 text-xs font-medium', on ? 'text-primary-700' : 'text-ink-muted hover:text-ink', focusRing)}
              >
                {on && <span aria-hidden className="absolute inset-x-6 top-0 h-0.5 rounded-b-full bg-primary-600" />}
                <span className="relative">
                  <Icon icon={t.icon} size="md" weight={on ? 'fill' : 'regular'} />
                  {n ? <span className="absolute -right-6 -top-0.5"><Badge size="sm" tone="info">{n}</Badge></span> : null}
                </span>
                {t.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export interface MechanicShellProps {
  tab: MechanicTab;
  /** Detail screens hide the tab bar so the sticky action bar owns the bottom edge. */
  hideTabs?: boolean;
  offline?: boolean;
  counts?: Partial<Record<MechanicTab, number>>;
  onTab?: (t: MechanicTab) => void;
  children: ReactNode;
}

/**
 * Mobile-only shell for the mechanic (390 wide, one column): top bar with platform tile, title and account menu;
 * a scrolling page; the bottom tab bar. No rail or sidebar: a mechanic at the bench has three destinations.
 */
export function MechanicShell({ tab, hideTabs, offline, counts, onTab, children }: MechanicShellProps) {
  return (
    <div className="ds-root flex h-dvh w-full flex-col overflow-hidden bg-surface-canvas font-sans text-ink">
      <header className="mech-safe-top flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-base bg-primary-50 text-primary-700"><Icon icon={Wrench} size="sm" weight="fill" /></span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-ink">{ME.company}</span>
            <span className="truncate text-xs text-ink-subtle">{ME.branch}</span>
          </span>
        </div>
        <Menu
          trigger={<button className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full', focusRing)} aria-label="Account"><Avatar name={ME.name} size="sm" /></button>}
          items={[
            { type: 'label', label: ME.name },
            { label: 'Switch platform', icon: ArrowsLeftRight },
            { type: 'separator' },
            { label: 'Sign out', icon: SignOut, danger: true },
          ]}
        />
      </header>
      {offline && (
        <div role="status" className="flex shrink-0 items-center gap-2 bg-warning/15 px-4 py-2 text-sm text-ink">
          <Icon icon={WifiSlash} size="sm" className="shrink-0 text-warning-fg" />
          <span>You are offline. Updates wait on this phone and send when you reconnect.</span>
        </div>
      )}
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      {!hideTabs && <BottomTabBar active={tab} counts={counts} onChange={onTab} />}
      <Toaster position="top-center" />
    </div>
  );
}
