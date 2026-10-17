import { useEffect, useState, type ReactNode } from 'react';
import {
  Briefcase, Package, Users, Wrench, List, CalendarCheck, Plus, MagnifyingGlass, Bell, CaretLeft, SignOut, CreditCard, User, BookOpen,
} from '@phosphor-icons/react';
import { Sidebar, SidebarSection, SidebarItem } from '../../components/Sidebar';
import { TopBar } from '../../components/TopBar';
import { IconButton } from '../../components/IconButton';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { Menu } from '../../components/Menu';
import { OffCanvas } from '../../components/Drawer';
import { Toaster } from '../../components/toast/Toaster';
import { StatusDot } from '../../patterns/portal/shell';
import { goToStory, routes } from '../../patterns/nav';
import { BRANCHES, COMPANY, type Branch } from './data';

export type RepairNav = 'today' | 'jobs' | 'catalogue' | 'customers';

export interface RepairShellProps {
  active: RepairNav;
  /** Page title in the top bar; defaults to the active nav label. */
  title?: ReactNode;
  /** The branch platform this shell is running as (each branch is its own platform). */
  branchId?: string;
  /** Branch platforms connected to the tenant, shown in the rail. Defaults to the current one only. */
  platforms?: Branch[];
  /** Open the mobile menu on first render (stories). */
  menuOpen?: boolean;
  onNavigate?: (key: RepairNav) => void;
  children: ReactNode | ((branch: Branch) => ReactNode);
}

const MAIN_NAV: { key: RepairNav; label: string; icon: typeof Briefcase }[] = [
  { key: 'today', label: 'Today', icon: CalendarCheck },
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'customers', label: 'Customers', icon: Users },
];
const MANAGE_NAV: { key: RepairNav; label: string; icon: typeof Briefcase }[] = [
  { key: 'catalogue', label: 'Catalogue', icon: BookOpen },
];
const ALL_NAV = [...MAIN_NAV, ...MANAGE_NAV];

/**
 * Repair-shop shell, copied from the shipped InventoryShell structure (rail with R home tile, platform buttons with
 * StatusDot, "+" and account menu; sidebar with Manage section and Back to Portal; top bar with title, search,
 * notifications). Leda is not integrated, so there is no launcher. Each branch is its own platform in the rail.
 */
export function RepairShell({ active, title, branchId = 'davao', platforms, menuOpen = false, onNavigate, children }: RepairShellProps) {
  const [menu, setMenu] = useState(menuOpen);
  const branch = BRANCHES.find((b) => b.id === branchId) ?? BRANCHES[0];
  const branchPlatforms = platforms ?? [branch];

  const pageLabel = ALL_NAV.find((n) => n.key === active)?.label ?? '';
  useEffect(() => {
    const before = document.title;
    document.title = `${pageLabel} - ${branch.name} - ${COMPANY.name}`;
    return () => { document.title = before; };
  }, [pageLabel, branch.name]);

  const item = (n: (typeof ALL_NAV)[number]) => (
    <SidebarItem key={n.key} icon={n.icon} active={active === n.key} onClick={() => { setMenu(false); onNavigate?.(n.key); }}>{n.label}</SidebarItem>
  );

  const sidebarBody = (
    <>
      <div className="mb-2 flex items-center gap-2 px-2 pt-1">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-base bg-primary-50 text-primary-700">
          <Icon icon={Wrench} size="sm" weight="fill" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-bold tracking-tight text-ink">{COMPANY.name}</span>
          <span className="truncate text-xs text-ink-subtle">{branch.name}</span>
        </span>
      </div>
      <SidebarSection>{MAIN_NAV.map(item)}</SidebarSection>
      <SidebarSection title="Manage">{MANAGE_NAV.map(item)}</SidebarSection>
      <div className="mt-auto px-1 pb-1 pt-3">
        <button
          onClick={() => goToStory(routes.portalHome)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-subtle hover:bg-surface-muted hover:text-ink focus:outline-none"
        >
          <Icon icon={CaretLeft} size="sm" /> Back to Portal
        </button>
      </div>
    </>
  );

  return (
    <div className="ds-root flex h-screen w-full overflow-hidden bg-surface-canvas font-sans text-ink">
      {/* Platforms rail: Portal home, Inventory, and one platform per repair-shop branch */}
      <div className="hidden w-rail shrink-0 flex-col items-center gap-2 py-3 sm:flex">
        <button
          onClick={() => goToStory(routes.portalHome)}
          className="grid h-9 w-9 place-items-center rounded-lg bg-primary-600 font-bold text-white shadow-sm focus:outline-none"
          aria-label="Back to Portal home"
        >
          R
        </button>
        <div className="my-1 h-px w-6 bg-border" />
        <button onClick={() => goToStory(routes.inventoryHome)} aria-label="Inventory" className="relative focus:outline-none">
          <span className="grid h-9 w-9 place-items-center rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-ink">
            <Icon icon={Package} size="md" />
          </span>
          <span className="absolute -bottom-0.5 -right-0.5"><StatusDot status="active" /></span>
        </button>
        {branchPlatforms.map((b) => {
          const on = b.id === branch.id;
          return (
            <button key={b.id} aria-label={`Repair shop - ${b.name}`} aria-current={on ? 'page' : undefined} className="relative focus:outline-none">
              <span className={on ? 'grid h-9 w-9 place-items-center rounded-lg bg-primary-50 text-primary-700' : 'grid h-9 w-9 place-items-center rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-ink'}>
                <Icon icon={Wrench} size="md" weight={on ? 'fill' : 'regular'} />
              </span>
              <span className="absolute -bottom-0.5 -right-0.5"><StatusDot status="active" /></span>
            </button>
          );
        })}
        <span className="grid h-9 w-9 place-items-center rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-ink">
          <Icon icon={Plus} size="md" />
        </span>
        <div className="mt-auto">
          <Menu
            trigger={<button className="rounded-full focus:outline-none" aria-label="Account"><Avatar name="Maricel Santos" size="sm" /></button>}
            items={[
              { type: 'label', label: 'maricel@montauto.ph' },
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
        <Sidebar className="hidden lg:flex">{sidebarBody}</Sidebar>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <TopBar
            start={
              <>
                <IconButton icon={List} label="Open menu" variant="subtle" className="lg:hidden" onClick={() => setMenu(true)} />
                {typeof (title ?? pageLabel) === 'string' ? <span className="truncate text-sm font-semibold text-ink">{title ?? pageLabel}</span> : title}
              </>
            }
            end={
              <>
                <label className="hidden h-9 items-center gap-2 rounded-full bg-surface-muted px-3.5 text-ink-subtle md:flex">
                  <Icon icon={MagnifyingGlass} size="sm" />
                  <input aria-label="Search everything" placeholder="Search everything…" className="w-48 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle" />
                </label>
                <IconButton icon={Bell} label="Notifications" variant="subtle" />
              </>
            }
          />
          <div className="min-h-0 flex-1 overflow-y-auto">{typeof children === 'function' ? children(branch) : children}</div>
        </div>
      </div>

      <OffCanvas open={menu} onOpenChange={setMenu} side="left" title={COMPANY.name} width="288px">
        <Sidebar className="flex p-0">{sidebarBody}</Sidebar>
      </OffCanvas>
      <Toaster position="bottom-right" />
    </div>
  );
}
