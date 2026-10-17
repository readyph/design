import { useEffect, useState, type ReactNode } from 'react';
import {
  Briefcase, Package, Users, Wrench, SignOut, List, MapPin, CaretUpDown, Check, WarningOctagon, Gear, CalendarCheck,
} from '@phosphor-icons/react';
import { Sidebar, SidebarSection, SidebarItem } from '../../components/Sidebar';
import { TopBar } from '../../components/TopBar';
import { Avatar } from '../../components/Avatar';
import { Menu } from '../../components/Menu';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Icon } from '../../components/Icon';
import { OffCanvas } from '../../components/Drawer';
import { Skeleton } from '../../components/Skeleton';
import { Toaster } from '../../components/toast/Toaster';
import { BRANCHES, COMPANY, type Branch } from './data';
import { RetryNotice } from './Page';

export type RepairNav = 'today' | 'jobs' | 'catalogue' | 'customers';

/** How the branch list resolves: ready, one branch only, loading, or failed. */
export type BranchState = 'ready' | 'single' | 'loading' | 'error';

export interface RepairShellProps {
  active: RepairNav;
  branchId?: string;
  branchState?: BranchState;
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

/**
 * Branch is an entity under one tenant (decided). The switcher lives in the top bar and re-scopes records;
 * switching keeps the same page. Single-branch tenants see the branch name as plain text, no control.
 */
function BranchSwitcher({ current, onPick, state, retry }: { current: string; onPick: (id: string) => void; state: BranchState; retry: () => void }) {
  const branch = BRANCHES.find((b) => b.id === current) ?? BRANCHES[0];
  if (state === 'loading') return <Skeleton className="h-9 w-40" />;
  if (state === 'error') return <Button size="sm" variant="secondary" leftIcon={WarningOctagon} onClick={retry}>Branches unavailable</Button>;
  if (state === 'single') return <span className="inline-flex items-center gap-2 text-sm font-medium"><Icon icon={MapPin} size="sm" className="text-ink-subtle" />{branch.name}</span>;
  return (
    <Menu
      align="start"
      trigger={
        <Button size="sm" variant="secondary" leftIcon={MapPin} rightIcon={CaretUpDown} aria-label={`Branch: ${branch.name}. Switch branch`}>
          {branch.name}
        </Button>
      }
      items={[
        { type: 'label', label: `Branches in ${COMPANY.name}` },
        ...BRANCHES.map((b) => ({ label: `${b.name} (${b.openJobs} open)`, icon: b.id === current ? Check : undefined, onSelect: () => onPick(b.id) })),
        { type: 'separator' as const },
        { label: 'Manage branches', icon: Gear },
      ]}
    />
  );
}

/** Prototype shell for the repair-shop platform. Final shell to follow the shared platform shell. */
export function RepairShell({ active, branchId = 'davao', branchState = 'ready', menuOpen = false, onNavigate, children }: RepairShellProps) {
  const [current, setCurrent] = useState(branchId);
  const [menu, setMenu] = useState(menuOpen);
  const [retried, setRetried] = useState(false);
  const state: BranchState = branchState === 'error' && retried ? 'ready' : branchState;
  const branch = BRANCHES.find((b) => b.id === current) ?? BRANCHES[0];
  const pick = (id: string) => { setCurrent(id); setMenu(false); };

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
      <Sidebar className="hidden w-56 shrink-0 lg:flex">
        <div className="flex items-center gap-2 px-2 text-sm font-bold tracking-tight"><Icon icon={Wrench} size="md" className="text-ink" />{COMPANY.name}</div>
        {nav}
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          start={
            <>
              <IconButton icon={List} label="Open menu" variant="subtle" className="lg:hidden" onClick={() => setMenu(true)} />
              <BranchSwitcher current={current} onPick={pick} state={state} retry={() => setRetried(true)} />
            </>
          }
          end={
            <Menu
              trigger={<button aria-label="Account" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"><Avatar name="Maricel Santos" size="sm" /></button>}
              items={[{ type: 'label', label: 'staff@montauto.example' }, { label: 'Log out', icon: SignOut, danger: true }]}
            />
          }
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col gap-6">
            {state === 'error' && (
              <RetryNotice title="Could not load your branches" onRetry={() => setRetried(true)}>You are still on {branch.name}.</RetryNotice>
            )}
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
