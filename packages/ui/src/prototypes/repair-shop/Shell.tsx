import { useEffect, useState, type ReactNode } from 'react';
import { Briefcase, Package, Users, Wrench, List, CalendarCheck, SquaresFour } from '@phosphor-icons/react';
import { Sidebar, SidebarSection, SidebarItem } from '../../components/Sidebar';
import { IconRail, IconRailItem } from '../../components/IconRail';
import { TopBar } from '../../components/TopBar';
import { IconButton } from '../../components/IconButton';
import { Icon } from '../../components/Icon';
import { OffCanvas } from '../../components/Drawer';
import { Toaster } from '../../components/toast/Toaster';
import { BRANCHES, COMPANY, type Branch } from './data';

export type RepairNav = 'today' | 'jobs' | 'catalogue' | 'customers';

export interface RepairShellProps {
  active: RepairNav;
  /** The branch platform this shell is running as (each branch is its own platform). */
  branchId?: string;
  /** Branch platforms connected to the tenant, shown in the rail. Defaults to the current one only. */
  platforms?: Branch[];
  /** Open the mobile menu on first render (stories). */
  menuOpen?: boolean;
  onNavigate?: (key: RepairNav) => void;
  children: ReactNode | ((branch: Branch) => ReactNode);
}

const NAV: { key: RepairNav; label: string; icon: typeof Briefcase }[] = [
  { key: 'today', label: 'Today', icon: CalendarCheck },
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'catalogue', label: 'Catalogue', icon: Package },
  { key: 'customers', label: 'Customers', icon: Users },
];

/** Prototype shell for the repair-shop platform. Final shell to follow the shared platform shell. */
export function RepairShell({ active, branchId = 'davao', platforms, menuOpen = false, onNavigate, children }: RepairShellProps) {
  const [menu, setMenu] = useState(menuOpen);
  const branch = BRANCHES.find((b) => b.id === branchId) ?? BRANCHES[0];
  const branchPlatforms = platforms ?? [branch];

  const pageLabel = NAV.find((n) => n.key === active)?.label ?? '';
  useEffect(() => {
    const before = document.title;
    document.title = `${pageLabel} - ${branch.name} - ${COMPANY.name}`;
    return () => { document.title = before; };
  }, [pageLabel, branch.name]);

  const nav = (
    <SidebarSection>
      {NAV.map((n) => <SidebarItem key={n.key} icon={n.icon} active={active === n.key} onClick={() => { setMenu(false); onNavigate?.(n.key); }}>{n.label}</SidebarItem>)}
    </SidebarSection>
  );

  return (
    <div className="ds-root flex h-screen w-full overflow-hidden bg-surface-canvas font-sans text-ink">
      <IconRail aria-label="Platforms" className="hidden shrink-0 md:flex">
        <IconRailItem icon={SquaresFour} label="Portal" />
        <IconRailItem icon={Package} label="Inventory" />
        {branchPlatforms.map((b) => <IconRailItem key={b.id} icon={Wrench} label={`Repair shop - ${b.name}`} active={b.id === branch.id} />)}
      </IconRail>
      <Sidebar className="hidden w-56 shrink-0 lg:flex">
        <div className="flex items-center gap-2 px-2 text-sm font-bold tracking-tight"><Icon icon={Wrench} size="md" className="text-ink" />{COMPANY.name}</div>
        {nav}
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          start={
            <>
              <IconButton icon={List} label="Open menu" variant="subtle" className="lg:hidden" onClick={() => setMenu(true)} />
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <span className="hidden truncate text-ink-subtle sm:inline">{COMPANY.name}</span>
                <span className="hidden text-ink-subtle sm:inline" aria-hidden>/</span>
                <span className="truncate font-medium">{branch.name}</span>
              </span>
            </>
          }
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col gap-6">
            {typeof children === 'function' ? children(branch) : children}
          </div>
        </main>
      </div>

      <OffCanvas open={menu} onOpenChange={setMenu} side="left" title={COMPANY.name} width="288px">
        <Sidebar className="p-0">{nav}</Sidebar>
      </OffCanvas>
      <Toaster position="bottom-right" />
    </div>
  );
}
