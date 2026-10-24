/**
 * PROTOTYPE (RDY-175, epic RDY-173 feature 3) - Portal Slack-style shell: workspace rail, sidebar,
 * slim top bar and the Leda side panel. Inventory and SMS inherit it through `PlatformShell`.
 *
 * Built only from @readyph/ui 0.7 components and tokens (chrome, density, radius, gutter).
 * Anything the kit lacks is previewed with a className override and listed in MISSING_IN_KIT
 * for Leonardo. Never export anything from this folder in `src/index.ts`.
 *
 * Leda fit rule (Leonardo's RDY-174 note on small widths):
 * - >= 1280: Leda is a 360px right panel that pushes content; rail and sidebar stay.
 * - 1024-1279: Leda pushes content and the sidebar folds away (menu button opens it off-canvas).
 * - < 1024: Leda is a right sheet over the page (384px), full screen below 640.
 */
import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowsClockwise,
  Buildings,
  CaretDown,
  ChartLineUp,
  Check,
  CreditCard,
  Desktop,
  House,
  List,
  MagnifyingGlass,
  Moon,
  NotePencil,
  Package,
  PaintBrush,
  Plus,
  SignOut,
  SquaresFour,
  Sun,
  UserCircle,
  UserPlus,
  Users,
  WaveTriangle,
  Brain,
  Wrench,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Chat, ChatHeader, ChatInput, ChatMessage, ChatMessages, ChatQuickActions } from '../../components/Chat';
import { OffCanvas, OffCanvasHeader } from '../../components/Drawer';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { IconRail, IconRailItem } from '../../components/IconRail';
import { Kbd } from '../../components/Kbd';
import { LedaWidget } from '../../components/LedaWidget';
import { Menu, type MenuItem } from '../../components/Menu';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Sidebar, SidebarItem, SidebarSection } from '../../components/Sidebar';
import { StatusDot, type StatusTone } from '../../components/StatusDot';
import { Table, type TableColumn } from '../../components/Table';
import { TopBar } from '../../components/TopBar';
import { cn, focusRing } from '../../utils/cn';
import type { ThemePreference } from '../../utils/themeScript';

export type ShellTheme = 'light' | 'dark';
export type ChromeVariant = 'ink' | 'light';
export type ShellRole = 'admin' | 'member';
export type LedaState = 'closed' | 'empty' | 'conversation' | 'confirm';

/** For Leonardo: what this prototype previews with overrides because the kit does not ship it yet. */
export const MISSING_IN_KIT = [
  'Chrome variant scope: `[data-chrome="light"]` remapping --ds-chrome* to surface tokens (previewed with the `chromeLight` arbitrary-property class).',
  'IconRailItem `status` prop: status dot on the tile, ring in chrome colour, status in the accessible name (previewed by wrapping the tile).',
  'SidebarHeader: tenant switcher button (name, caret, subtitle) that opens a Menu; 40px high.',
  'TopBar density: 44px slim bar (`--ds-density-topbar`), hairline bottom border, surface background (previewed with h-11 + border-b).',
  'SearchTrigger: input-looking button with left icon, placeholder text and a neutral ⌘K Kbd; neutral Kbd tone (Kbd is brand-tinted today).',
  'Leda side panel: `layout.rightPanelWidth` 18rem -> 22.5rem (360px), and Chat `size="fill"` (full height, no radius/border) for docked use.',
  'PlatformShell rebuild on IconRail/Sidebar chrome tokens with `leda` (docked panel) slot and the fold rule above; current tiles use rounded-lg and a light rail.',
  'LedaWidget.Suggestions: rounded-control chips (rounded-full today) to match the small-radius direction.',
  'SidebarItem icon size sm (16px) at 28px rows; md (20px) crowds the row.',
];

/** Remaps the chrome tokens onto light surfaces (all-light chrome variant B). Kit stand-in. */
export const chromeLight =
  '[--ds-chrome:var(--ds-surface-subtle)] [--ds-chrome-fg:var(--ds-ink)] [--ds-chrome-muted:var(--ds-ink-muted)] [--ds-chrome-hover:var(--ds-surface-muted)] [--ds-chrome-active:var(--ds-border-strong)] [--ds-chrome-border:var(--ds-border)]';

/* ------------------------------------------------------------------ data */

const TENANT = 'Acme Motors';
const USER = { name: 'Earvin Gemenez', email: 'earvin@acmemotors.ph' };

interface RailPlatform {
  id: string;
  label: string;
  icon: PhosphorIcon;
  status: StatusTone;
  statusText: string;
  active?: boolean;
}

const platforms: RailPlatform[] = [
  { id: 'portal', label: 'Portal', icon: SquaresFour, status: 'active', statusText: 'online', active: true },
  { id: 'inventory', label: 'Inventory', icon: Package, status: 'active', statusText: 'online' },
  { id: 'sms', label: 'Service Management', icon: Wrench, status: 'degraded', statusText: 'degraded' },
];

interface NavItem {
  key: string;
  label: string;
  icon: PhosphorIcon;
  badge?: string;
}

const nav: Record<ShellRole, { main: NavItem[]; settings: NavItem[] }> = {
  admin: {
    main: [
      { key: 'home', label: 'Home', icon: House },
      { key: 'platforms', label: 'Platforms', icon: SquaresFour, badge: '3' },
      { key: 'team', label: 'Team', icon: Users },
      { key: 'reports', label: 'Reports', icon: ChartLineUp },
      { key: 'memory', label: 'Memory', icon: Brain },
    ],
    settings: [
      { key: 'company', label: 'Company', icon: Buildings },
      { key: 'billing', label: 'Billing', icon: CreditCard },
      { key: 'appearance', label: 'Appearance', icon: PaintBrush },
    ],
  },
  member: {
    main: [
      { key: 'home', label: 'Home', icon: House },
      { key: 'reports', label: 'Reports', icon: ChartLineUp },
      { key: 'memory', label: 'Memory', icon: Brain },
    ],
    settings: [
      { key: 'profile', label: 'Profile', icon: UserCircle },
      { key: 'appearance', label: 'Appearance', icon: PaintBrush },
    ],
  },
};

const titles: Record<string, string> = {
  home: 'Home',
  platforms: 'Platforms',
  team: 'Team',
  reports: 'Reports',
  memory: 'Memory',
  company: 'Company',
  billing: 'Billing',
  appearance: 'Appearance',
  profile: 'Profile',
};

/* ---------------------------------------------------------- media query */

/** Prototype-only: picks docked panel vs sheet so a hidden Radix dialog never traps focus. */
function useMediaQuery(query: string) {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : true);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

/* ------------------------------------------------------------------ rail */

/** Far-left workspace rail: tenant mark, one tile per connected platform with status, Add tile. */
export function WorkspaceRail({ className, role }: { className?: string; role: ShellRole }) {
  return (
    <IconRail aria-label="Workspaces" className={cn('shrink-0 gap-2 py-2', className)}>
      <a
        href="#home"
        aria-label={`${TENANT} home`}
        title={TENANT}
        className={cn('rounded-sm', focusRing)}
      >
        <Avatar name={TENANT} size="sm" shape="square" className="[&>span]:rounded-sm" />
      </a>
      <span aria-hidden="true" className="h-px w-6 bg-chrome-border" />
      {platforms.map((p) => (
        <span
          key={p.id}
          className="relative inline-flex [&>span:last-child_span]:ring-chrome"
        >
          <IconRailItem icon={p.icon} label={`${p.label}, ${p.statusText}`} active={p.active} href={`#${p.id}`} />
          <StatusDot status={p.status} pulse={false} size="sm" className="pointer-events-none absolute bottom-1 right-1" />
        </span>
      ))}
      {role === 'admin' && <IconRailItem icon={Plus} label="Connect a platform" />}
    </IconRail>
  );
}

/* ------------------------------------------------------- tenant menu */

function TenantMenu({
  role,
  theme,
  onTheme,
}: {
  role: ShellRole;
  theme: ThemePreference;
  onTheme: (t: ThemePreference) => void;
}) {
  const themeItem = (value: ThemePreference, label: string, icon: PhosphorIcon): MenuItem => ({
    label: (
      <span className="flex w-full items-center justify-between gap-4">
        {label}
        {theme === value && <Icon icon={Check} size="sm" className="text-primary-600" />}
      </span>
    ),
    icon,
    onSelect: () => onTheme(value),
  });
  const items: MenuItem[] = [
    { type: 'label', label: USER.email },
    ...(role === 'admin'
      ? ([
          { label: 'Company', icon: Buildings, href: '#company' },
          { label: 'Billing', icon: CreditCard, href: '#billing' },
        ] as MenuItem[])
      : ([{ label: 'Profile', icon: UserCircle, href: '#profile' }] as MenuItem[])),
    { type: 'separator' },
    { type: 'label', label: 'Theme' },
    themeItem('system', 'System', Desktop),
    themeItem('light', 'Light', Sun),
    themeItem('dark', 'Dark', Moon),
    { type: 'separator' },
    { label: 'Sign out', icon: SignOut, danger: true },
  ];
  return (
    <Menu
      align="start"
      trigger={
        <button
          type="button"
          className={cn(
            'flex h-10 w-full min-w-0 items-center gap-2 rounded-sm px-2 text-left hover:bg-chrome-hover',
            focusRing,
          )}
        >
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="flex items-center gap-1 text-sm font-bold text-chrome-fg">
              <span className="truncate">{TENANT}</span>
              <Icon icon={CaretDown} size="sm" className="shrink-0 text-chrome-muted" />
            </span>
            <span className="truncate text-xs text-chrome-muted">
              {role === 'admin' ? 'Administrator' : 'Member'} · {USER.name}
            </span>
          </span>
        </button>
      }
      items={items}
    />
  );
}

/* --------------------------------------------------------------- sidebar */

export function ShellSidebar({
  role,
  activeKey,
  onNavigate,
  theme,
  onTheme,
  className,
}: {
  role: ShellRole;
  activeKey: string;
  onNavigate: (key: string) => void;
  theme: ThemePreference;
  onTheme: (t: ThemePreference) => void;
  className?: string;
}) {
  const items = nav[role];
  const item = (n: NavItem) => (
    <SidebarItem
      key={n.key}
      icon={n.icon}
      badge={n.badge}
      href={`#${n.key}`}
      active={activeKey === n.key}
      className="gap-2 px-2"
      onClick={(e) => {
        e.preventDefault();
        onNavigate(n.key);
      }}
    >
      {n.label}
    </SidebarItem>
  );
  return (
    <Sidebar aria-label="Portal" className={cn('shrink-0 gap-0 border-r border-chrome-border p-2', className)}>
      <TenantMenu role={role} theme={theme} onTheme={onTheme} />
      <SidebarSection className="gap-0.5 py-2">{items.main.map(item)}</SidebarSection>
      <SidebarSection title="Settings" className="gap-0.5 py-2 [&>p]:px-2">
        {items.settings.map(item)}
      </SidebarSection>
      {role === 'member' && (
        <p className="mt-auto px-2 pb-1 text-xs text-chrome-muted">
          Some pages are for administrators. Ask an admin if you need access.
        </p>
      )}
    </Sidebar>
  );
}

/* ---------------------------------------------------------------- top bar */

export function ShellTopBar({
  title,
  showMenu,
  ledaOpen,
  onMenu,
  onLeda,
}: {
  title: string;
  showMenu: boolean;
  ledaOpen: boolean;
  onMenu: () => void;
  onLeda: () => void;
}) {
  return (
    <TopBar
      className="h-11 shrink-0 gap-2 border-b border-border bg-surface px-gutter"
      start={
        <>
          {showMenu && (
            <IconButton icon={List} label="Open navigation" size="sm" onClick={onMenu} />
          )}
          <h1 className="truncate text-sm font-semibold text-ink">{title}</h1>
        </>
      }
      end={
        <>
          <Button
            variant="secondary"
            leftIcon={MagnifyingGlass}
            aria-label="Search, Ctrl K"
            className="hidden w-64 font-normal text-ink-muted md:inline-flex lg:w-80 [&>span]:w-full [&>span]:justify-start"
          >
            <span className="flex-1 text-left">Search {TENANT}</span>
            <span aria-hidden="true" className="flex gap-0.5">
              <Kbd size="sm">⌘</Kbd>
              <Kbd size="sm">K</Kbd>
            </span>
          </Button>
          <IconButton icon={MagnifyingGlass} label="Search, Ctrl K" size="sm" className="md:hidden" />
          <Button
            variant={ledaOpen ? 'secondary' : 'subtle'}
            leftIcon={WaveTriangle}
            aria-expanded={ledaOpen}
            aria-controls="leda-panel"
            onClick={onLeda}
          >
            Ask Leda
          </Button>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------ Leda panel */

const SUGGESTIONS = ['Which platform needs attention?', 'Summarise this week', 'Invite a teammate'];

function LedaThread({ state, page }: { state: Exclude<LedaState, 'closed'>; page: string }) {
  const [proposal, setProposal] = useState<'pending' | 'applying' | 'confirmed' | 'cancelled'>('pending');
  if (state === 'empty') {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Ask about {TENANT}</p>
          <p className="text-sm text-ink-muted">
            Leda reads across Portal, Inventory and Service Management. Anything that changes data asks you first.
          </p>
        </div>
        <LedaWidget.Suggestions items={SUGGESTIONS} className="[&>button]:rounded-control" />
      </div>
    );
  }
  return (
    <>
      <ChatMessage role="user">Which platform needs attention?</ChatMessage>
      <ChatMessage role="assistant">
        Service Management is degraded: 3 sync errors since 09:40. Inventory and Portal are online.
      </ChatMessage>
      <LedaWidget.StatGrid
        columns={2}
        items={[
          { label: 'Sync errors today', value: '3', delta: '+3', deltaTone: 'error' },
          { label: 'Open jobs', value: '18', delta: '-2', deltaTone: 'success' },
        ]}
      />
      {state === 'confirm' && (
        <>
          <ChatMessage role="user">Invite Ana Reyes to Service Management as a member.</ChatMessage>
          <LedaWidget.Proposal
            intent="create"
            title="Invite Ana Reyes"
            summary={`From ${page}`}
            status={proposal}
            confirmLabel="Send invite"
            changes={[
              { label: 'Email', value: 'ana@acmemotors.ph' },
              { label: 'Platform', value: 'Service Management' },
              { label: 'Role', value: 'Member' },
            ]}
            resultText="Invite sent to ana@acmemotors.ph."
            onConfirm={() => {
              setProposal('applying');
              window.setTimeout(() => setProposal('confirmed'), 700);
            }}
            onCancel={() => setProposal('cancelled')}
          />
        </>
      )}
    </>
  );
}

export function LedaPanel({
  state,
  page,
  onClose,
  className,
}: {
  state: Exclude<LedaState, 'closed'>;
  page: string;
  onClose: () => void;
  className?: string;
}) {
  return (
    <Chat id="leda-panel" aria-label="Leda" className={cn('h-full w-full rounded-none border-0', className)}>
      <ChatHeader
        title="Leda"
        subtitle="AI assistant"
        className="h-11 shrink-0 gap-2 border-b border-border px-3 py-0 [&>span:first-child]:h-6 [&>span:first-child]:w-6 [&>span:first-child]:rounded-sm"
        actions={<IconButton icon={NotePencil} label="New conversation" size="sm" />}
        onClose={onClose}
      />
      <ChatMessages className="gap-2 px-3">
        <LedaThread state={state} page={page} />
      </ChatMessages>
      <ChatQuickActions className="px-3 pb-0 pt-2">
        <Badge tone="neutral" size="sm">
          Context: {page}
        </Badge>
      </ChatQuickActions>
      <ChatInput placeholder="Ask Leda…" aria-label="Message Leda" />
    </Chat>
  );
}

/* --------------------------------------------------------- sample page */

interface PlatformRow {
  id: string;
  name: string;
  icon: PhosphorIcon;
  status: StatusTone;
  statusLabel: string;
  users: number;
  synced: string;
  version: string;
}

const rows: PlatformRow[] = [
  { id: 'portal', name: 'Portal', icon: SquaresFour, status: 'active', statusLabel: 'Online', users: 12, synced: 'Just now', version: '2.14.0' },
  { id: 'inventory', name: 'Inventory', icon: Package, status: 'active', statusLabel: 'Online', users: 9, synced: '2 min ago', version: '1.32.1' },
  { id: 'sms', name: 'Service Management', icon: Wrench, status: 'degraded', statusLabel: 'Degraded', users: 6, synced: '41 min ago', version: '0.9.4' },
];

const toneFor: Record<StatusTone, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  degraded: 'warning',
  offline: 'neutral',
  neutral: 'neutral',
};

const columns: TableColumn<PlatformRow>[] = [
  {
    key: 'name',
    header: 'Platform',
    render: (r) => (
      <span className="flex min-w-0 items-center gap-2 font-medium text-ink">
        <Icon icon={r.icon} size="sm" className="shrink-0 text-ink-muted" />
        <span className="truncate">{r.name}</span>
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (r) => (
      <Badge tone={toneFor[r.status]} size="sm" dot>
        {r.statusLabel}
      </Badge>
    ),
  },
  { key: 'users', header: 'Users', align: 'right', className: 'hidden md:table-cell', render: (r) => <span className="tabular-nums">{r.users}</span> },
  { key: 'synced', header: 'Last sync', className: 'hidden md:table-cell', render: (r) => r.synced },
  { key: 'version', header: 'Version', className: 'hidden xl:table-cell', render: (r) => <span className="tabular-nums text-ink-muted">{r.version}</span> },
];

/** Data page filling the full width with one gutter: toolbar row then a dense table. */
export function SamplePage({ role }: { role: ShellRole }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          size="sm"
          aria-label="Filter platforms"
          options={[
            { value: 'all', label: 'All' },
            { value: 'attention', label: 'Needs attention' },
          ]}
        />
        <div className="ml-auto flex items-center gap-2">
          <IconButton icon={ArrowsClockwise} label="Refresh" size="sm" />
          {role === 'admin' && (
            <Button leftIcon={UserPlus} variant="secondary" className="hidden sm:inline-flex">
              Invite
            </Button>
          )}
          {role === 'admin' && <Button leftIcon={Plus}>Connect platform</Button>}
        </div>
      </div>
      <Table columns={columns} data={rows} rowKey={(r) => r.id} dense />
      <p className="text-xs text-ink-subtle">3 of 3 platforms connected · Settings live under the tenant menu and the sidebar.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ shell */

export interface ShellProps {
  theme?: ShellTheme;
  chrome?: ChromeVariant;
  role?: ShellRole;
  leda?: LedaState;
  /** Open the mobile/fold navigation sheet on mount (story state). */
  menuOpen?: boolean;
  initialPage?: string;
  children?: ReactNode;
}

/**
 * The shell composition. Rail (sm+), sidebar (lg+, folds at lg when Leda is open), slim top bar,
 * content with one gutter, Leda docked (lg+) or as a sheet (< lg).
 */
export function Shell({
  theme = 'light',
  chrome = 'ink',
  role = 'admin',
  leda: initialLeda = 'closed',
  menuOpen: initialMenu = false,
  initialPage = 'platforms',
  children,
}: ShellProps) {
  const [page, setPage] = useState(initialPage);
  const [leda, setLeda] = useState<LedaState>(initialLeda);
  const [lastLeda, setLastLeda] = useState<Exclude<LedaState, 'closed'>>(initialLeda === 'closed' ? 'empty' : initialLeda);
  const [menu, setMenu] = useState(initialMenu);
  const [themePref, setThemePref] = useState<ThemePreference>(theme);
  const docked = useMediaQuery('(min-width: 1024px)');
  const wide = useMediaQuery('(min-width: 1280px)');
  const ledaOpen = leda !== 'closed';

  useEffect(() => setLeda(initialLeda), [initialLeda]);
  useEffect(() => setThemePref(theme), [theme]);
  useEffect(() => {
    if (leda !== 'closed') setLastLeda(leda);
  }, [leda]);

  const resolved: ShellTheme = themePref === 'system' ? theme : themePref;
  const title = titles[page] ?? 'Home';
  const sidebarVisible = docked && (!ledaOpen || wide);
  const toggleLeda = () => setLeda(ledaOpen ? 'closed' : lastLeda);
  const sidebarProps = {
    role,
    activeKey: page,
    theme: themePref,
    onTheme: setThemePref,
    onNavigate: (k: string) => {
      setPage(k);
      setMenu(false);
    },
  };

  return (
    <div
      data-theme={resolved}
      className={cn(
        'ds-root flex h-screen w-full min-w-0 overflow-hidden bg-surface font-sans text-ink',
        chrome === 'light' && chromeLight,
      )}
    >
      <WorkspaceRail role={role} className="hidden sm:flex" />
      {sidebarVisible && <ShellSidebar {...sidebarProps} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <ShellTopBar
          title={title}
          showMenu={!sidebarVisible}
          ledaOpen={ledaOpen}
          onMenu={() => setMenu(true)}
          onLeda={toggleLeda}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-gutter">{children ?? <SamplePage role={role} />}</main>
      </div>

      {ledaOpen && docked && (
        <aside className="flex w-[22.5rem] shrink-0 flex-col border-l border-border bg-surface">
          <LedaPanel state={leda} page={title} onClose={() => setLeda('closed')} />
        </aside>
      )}

      <OffCanvas
        open={ledaOpen && !docked}
        onOpenChange={(o) => !o && setLeda('closed')}
        side="right"
        width="100%"
        hideClose
        className="max-w-full sm:max-w-sm"
      >
        <OffCanvasHeader className="sr-only">Leda</OffCanvasHeader>
        <div data-theme={resolved} className="flex h-full min-h-0 flex-col">
          {ledaOpen && <LedaPanel state={leda} page={title} onClose={() => setLeda('closed')} />}
        </div>
      </OffCanvas>

      <OffCanvas open={menu && !sidebarVisible} onOpenChange={setMenu} side="left" width="18.5rem" hideClose>
        <OffCanvasHeader className="sr-only">Navigation</OffCanvasHeader>
        <div data-theme={resolved} className={cn('flex h-full min-h-0', chrome === 'light' && chromeLight)}>
          <WorkspaceRail role={role} className="sm:hidden" />
          <ShellSidebar {...sidebarProps} className="min-w-0 flex-1 border-r-0" />
        </div>
      </OffCanvas>
    </div>
  );
}

