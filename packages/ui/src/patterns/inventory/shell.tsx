import { type ReactNode } from 'react';
import {
  Package,
  DeviceMobile,
  Storefront,
  Plus,
  MagnifyingGlass,
  Bell,
  CaretLeft,
  List,
  SignOut,
  CreditCard,
  User,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { Sidebar, SidebarSection, SidebarItem } from '../../components/Sidebar';
import { TopBar } from '../../components/TopBar';
import { IconButton } from '../../components/IconButton';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { LedaLauncher } from '../../components/LedaLauncher';
import { Menu } from '../../components/Menu';
import { StatusDot, type Status } from '../portal/shell';
import { inventoryNav, goToStory, routes } from '../nav';

const railPlatforms: { icon: PhosphorIcon; status: Status; label: string; active?: boolean; storyId?: string }[] = [
  { icon: Package, status: 'active', label: 'Inventory', active: true, storyId: routes.inventoryHome },
  { icon: DeviceMobile, status: 'active', label: 'Mobile app' },
  { icon: Storefront, status: 'degraded', label: 'Storefront' },
];

export type InvNavKey =
  | 'dashboard'
  | 'products'
  | 'movements'
  | 'purchase-orders'
  | 'reports'
  | 'settings';

export interface InventoryShellProps {
  active: InvNavKey;
  title: ReactNode;
  /** Right-aligned top-bar controls; defaults to notifications + Ask Leda. */
  actions?: ReactNode;
  /** Wrap children in a scroll area (default). Pass false for a self-managing layout. */
  scroll?: boolean;
  /** Hide the floating Ask-Leda launcher (e.g. when the page has Leda built in). */
  hideLeda?: boolean;
  children: ReactNode;
}

/**
 * The inventory platform shell: shared icon rail (Inventory is the active
 * platform) + inventory side nav + top bar, with a content slot. Mirrors the
 * Portal shell so the two platforms feel like one product. See 04-Inventory.md §3.
 */
export function InventoryShell({ active, title, actions, scroll = true, hideLeda = false, children }: InventoryShellProps) {
  const mainNav = inventoryNav.filter((n) => n.key !== 'settings');
  const settingsNav = inventoryNav.find((n) => n.key === 'settings')!;

  return (
    <div className="ds-root flex h-screen w-full overflow-hidden bg-surface-canvas font-sans text-ink">
      {/* Icon rail — shared with the Portal; Inventory (Package) is active */}
      <div className="hidden w-rail shrink-0 flex-col items-center gap-2 py-3 sm:flex">
        <button
          onClick={() => goToStory(routes.portalHome)}
          className="grid h-9 w-9 place-items-center rounded-lg bg-primary-600 font-bold text-white shadow-sm focus:outline-none"
          aria-label="Back to Portal home"
        >
          R
        </button>
        <div className="my-1 h-px w-6 bg-border" />
        {railPlatforms.map((p) => (
          <button
            key={p.label}
            onClick={() => p.storyId && goToStory(p.storyId)}
            aria-label={p.label}
            className="relative focus:outline-none"
          >
            <span
              className={
                p.active
                  ? 'grid h-9 w-9 place-items-center rounded-lg bg-primary-50 text-primary-700'
                  : 'grid h-9 w-9 place-items-center rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-ink'
              }
            >
              <Icon icon={p.icon} size="md" weight={p.active ? 'fill' : 'regular'} />
            </span>
            <span className="absolute -bottom-0.5 -right-0.5">
              <StatusDot status={p.status} />
            </span>
          </button>
        ))}
        <span className="grid h-9 w-9 place-items-center rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-ink">
          <Icon icon={Plus} size="md" />
        </span>
        <div className="mt-auto">
          <Menu
            trigger={<button className="rounded-full focus:outline-none" aria-label="Account"><Avatar name="Maria Santos" size="sm" /></button>}
            items={[
              { type: 'label', label: 'maria@readyph.com' },
              { label: 'Account', icon: User },
              { label: 'Billing', icon: CreditCard },
              { type: 'separator' },
              { label: 'Sign out', icon: SignOut, danger: true },
            ]}
          />
        </div>
      </div>

      {/* Window */}
      <div className="flex min-w-0 flex-1 overflow-hidden bg-transparent">
        <Sidebar className="hidden lg:flex">
          <div className="mb-2 flex items-center gap-2 px-2 pt-1">
            <span className="grid h-6 w-6 place-items-center rounded-base bg-primary-50 text-primary-700">
              <Icon icon={Package} size="sm" weight="fill" />
            </span>
            <span className="text-sm font-bold tracking-tight text-ink">Inventory</span>
          </div>
          <SidebarSection>
            {mainNav.map((n) => (
              <SidebarItem
                key={n.key}
                icon={n.icon}
                active={active === n.key}
                badge={n.badge}
                href={n.route}
                onClick={(e) => {
                  e.preventDefault();
                  goToStory(n.storyId);
                }}
              >
                {n.label}
              </SidebarItem>
            ))}
          </SidebarSection>
          <SidebarSection title="Manage">
            <SidebarItem
              icon={settingsNav.icon}
              active={active === 'settings'}
              href={settingsNav.route}
              onClick={(e) => {
                e.preventDefault();
                goToStory(settingsNav.storyId);
              }}
            >
              {settingsNav.label}
            </SidebarItem>
          </SidebarSection>
          <div className="mt-auto px-1 pb-1 pt-3">
            <button
              onClick={() => goToStory(routes.portalHome)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-subtle hover:bg-surface-muted hover:text-ink focus:outline-none"
            >
              <Icon icon={CaretLeft} size="sm" /> Back to Portal
            </button>
          </div>
        </Sidebar>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <TopBar
            start={
              <>
                <IconButton icon={List} label="Open menu" variant="subtle" className="lg:hidden" />
                {typeof title === 'string' ? <span className="text-sm font-semibold text-ink">{title}</span> : title}
              </>
            }
            end={
              actions ?? (
                <>
                  <label className="hidden h-9 items-center gap-2 rounded-full bg-surface-muted px-3.5 text-ink-subtle md:flex">
                    <Icon icon={MagnifyingGlass} size="sm" />
                    <input
                      placeholder="Search everything…"
                      className="w-48 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
                    />
                  </label>
                  <IconButton icon={Bell} label="Notifications" variant="subtle" />
                </>
              )
            }
          />
                    {scroll ? <div className="min-h-0 flex-1 overflow-y-auto">{children}</div> : <div className="flex min-h-0 flex-1 flex-col">{children}</div>}
          {!hideLeda && <LedaLauncher />}
        </div>
      </div>
    </div>
  );
}
