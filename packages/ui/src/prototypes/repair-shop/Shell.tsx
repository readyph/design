import { useState, type ReactNode } from 'react';
import {
  Briefcase, Package, Users, Wrench, SignOut, List, MapPin, CaretUpDown, Check, Plus, Buildings, WarningOctagon, Gear,
} from '@phosphor-icons/react';
import { Sidebar, SidebarSection, SidebarItem } from '../../components/Sidebar';
import { TopBar } from '../../components/TopBar';
import { Avatar } from '../../components/Avatar';
import { Menu } from '../../components/Menu';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Icon } from '../../components/Icon';
import { Notice } from '../../components/Notice';
import { OffCanvas } from '../../components/Drawer';
import { Skeleton } from '../../components/Skeleton';
import { Tooltip } from '../../components/Tooltip';
import { cn } from '../../utils/cn';
import { BRANCHES, COMPANY, type Branch } from './data';

export type RepairNav = 'jobs' | 'catalogue' | 'customers';

/**
 * Branch model under test (RDY-18 open decision).
 * A: a branch is an entity under one tenant; the switcher lives in the top bar and re-scopes records.
 * B: each branch is its own tenant; the company groups tenants, so switching is a workspace switch (rail).
 */
export type BranchModel = 'A' | 'B';
/** How the branch list resolves: ready, one branch only, loading, or failed. */
export type BranchState = 'ready' | 'single' | 'loading' | 'error';

export interface RepairShellProps {
  active: RepairNav;
  model?: BranchModel;
  branchId?: string;
  branchState?: BranchState;
  /** Open the mobile menu on first render (stories). */
  menuOpen?: boolean;
  children: ReactNode | ((branch: Branch) => ReactNode);
}

const NAV: { key: RepairNav; label: string; icon: typeof Briefcase }[] = [
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'catalogue', label: 'Catalogue', icon: Package },
  { key: 'customers', label: 'Customers', icon: Users },
];

/** Variant A: branch switcher in the top bar, inside one tenant. */
function BranchSwitcherA({ current, onPick, state, retry }: { current: string; onPick: (id: string) => void; state: BranchState; retry: () => void }) {
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

/** Variant B: a rail of branch workspaces (each its own tenant) grouped under the company. */
function TenantRailB({ current, onPick, state }: { current: string; onPick: (id: string) => void; state: BranchState }) {
  return (
    <div className="hidden w-rail shrink-0 flex-col items-center gap-2 py-3 sm:flex">
      <Tooltip content={COMPANY.name} side="right">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-ink shadow-sm" role="img" aria-label={COMPANY.name}>
          <Icon icon={Buildings} size="md" />
        </span>
      </Tooltip>
      <div className="my-1 h-px w-6 bg-border" />
      {state === 'loading' && [0, 1].map((i) => <Skeleton key={i} className="h-9 w-9 rounded-lg" />)}
      {state === 'error' && <IconButton icon={WarningOctagon} label="Branches unavailable. Retry" variant="subtle" />}
      {(state === 'ready' || state === 'single') &&
        BRANCHES.slice(0, state === 'single' ? 1 : undefined).map((b) => (
          <Tooltip key={b.id} content={`${b.name} (${b.openJobs} open)`} side="right">
            <button
              onClick={() => onPick(b.id)}
              aria-label={`Switch to ${b.name}`}
              aria-current={b.id === current ? 'true' : undefined}
              className={cn(
                'grid h-9 w-9 place-items-center rounded-lg text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                b.id === current ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
              )}
            >
              {b.short}
            </button>
          </Tooltip>
        ))}
      {state === 'ready' && (
        <Tooltip content="Add branch" side="right">
          <button aria-label="Add branch" className="grid h-9 w-9 place-items-center rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <Icon icon={Plus} size="md" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

/** Prototype shell for the repair-shop platform. Final shell to follow the shared platform shell. */
export function RepairShell({ active, model = 'A', branchId = 'davao', branchState = 'ready', menuOpen = false, children }: RepairShellProps) {
  const [current, setCurrent] = useState(branchId);
  const [menu, setMenu] = useState(menuOpen);
  const [retried, setRetried] = useState(false);
  const state: BranchState = branchState === 'error' && retried ? 'ready' : branchState;
  const branch = BRANCHES.find((b) => b.id === current) ?? BRANCHES[0];
  const pick = (id: string) => { setCurrent(id); setMenu(false); };

  const nav = (
    <SidebarSection>
      {NAV.map((n) => <SidebarItem key={n.key} icon={n.icon} active={active === n.key} onClick={() => setMenu(false)}>{n.label}</SidebarItem>)}
    </SidebarSection>
  );

  return (
    <div className="ds-root flex h-screen w-full overflow-hidden bg-surface-canvas font-sans text-ink">
      {model === 'B' && <TenantRailB current={current} onPick={pick} state={state} />}
      <Sidebar className="hidden w-56 shrink-0 lg:flex">
        <div className="mb-2 px-2 pt-1">
          <div className="flex items-center gap-2 text-sm font-bold tracking-tight"><Icon icon={Wrench} size="md" className="text-ink" />{COMPANY.name}</div>
          {model === 'B' && state !== 'loading' && <p className="mt-1 pl-7 text-xs text-ink-muted">{branch.name} workspace</p>}
        </div>
        {nav}
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          start={
            <>
              <IconButton icon={List} label="Open menu" variant="subtle" className="lg:hidden" onClick={() => setMenu(true)} />
              {model === 'A'
                ? <BranchSwitcherA current={current} onPick={pick} state={state} retry={() => setRetried(true)} />
                : state === 'loading' ? <Skeleton className="h-5 w-32" /> : <span className="text-sm font-semibold">{branch.name}</span>}
            </>
          }
          end={
            <Menu
              trigger={<button aria-label="Account" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"><Avatar name="Maricel Santos" size="sm" /></button>}
              items={[{ type: 'label', label: 'staff@montauto.example' }, { label: 'Log out', icon: SignOut, danger: true }]}
            />
          }
        />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
          {state === 'error' && (
            <Notice tone="error" title="Could not load your branches" icon={WarningOctagon} className="mb-4">
              You are still on {branch.name}. <Button size="sm" variant="secondary" className="ml-2" onClick={() => setRetried(true)}>Retry</Button>
            </Notice>
          )}
          {typeof children === 'function' ? children(branch) : children}
        </main>
      </div>

      <OffCanvas open={menu} onOpenChange={setMenu} side="left" title={COMPANY.name} width="288px">
        <Sidebar className="p-0">
          {nav}
          {state === 'ready' && model === 'B' && (
            <SidebarSection title="Branches (separate workspaces)">
              {BRANCHES.map((b) => (
                <SidebarItem key={b.id} icon={b.id === current ? Check : undefined} active={b.id === current} badge={`${b.openJobs} open`} onClick={() => pick(b.id)}>{b.name}</SidebarItem>
              ))}
              <SidebarItem icon={Plus}>Add branch</SidebarItem>
            </SidebarSection>
          )}
        </Sidebar>
      </OffCanvas>
    </div>
  );
}
