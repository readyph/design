/**
 * RDY-213 prototype: the Portal shell for the RDY-212 dashboard epic.
 *
 * - Menu sidebar removed. The platform rail stays; its top tile is a Menu button that opens a
 *   dropdown with every sidebar link (active item marked; members see a shorter list).
 * - Below lg (1024px) the rail is hidden and the top-bar menu button opens an off-canvas nav.
 * - Top bar: page title left; Leda toggle + Add platform right.
 * - Leda fixed right panel on every page: docked (pushes content) at lg+, collapsed to a slim
 *   edge tab, or an overlay drawer below lg. Remembered in localStorage `readyph.leda_panel`.
 * - Content area is a size container, so pages lay out from the measured content width
 *   (container queries), not the viewport.
 *
 * Composition only: every piece is an existing @readyph/ui export. Missing kit pieces are listed
 * in MISSING_IN_KIT for Leonardo. Pages in RDY-214..217 render as `children`.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  List,
  Plus,
  Check,
  WaveTriangle,
  CaretLineRight,
  NotePencil,
  SignOut,
  User,
  CreditCard,
  Package,
  X,
} from '@phosphor-icons/react';
import {
  Avatar,
  Chat,
  Icon,
  IconButton,
  LedaWidget,
  Menu,
  OffCanvas,
  Sidebar,
  SidebarItem,
  SidebarSection,
  StatusDot,
  Tag,
  Tooltip,
  TopBar,
  cn,
  focusRing,
  type MenuItem,
} from '../../index';
import {
  COMPANY,
  LEDA_PANEL_KEY,
  LEDA_SUGGESTIONS,
  PAGE_CONTEXT,
  PLATFORMS,
  USER,
  linksFor,
  type PortalNavKey,
} from './data';

/** Kit gaps found while building this prototype (also in the PR body). */
export const MISSING_IN_KIT = [
  'LedaSidePanel: collapsible docked Leda panel (open / edge tab / drawer below lg) with page-context chip and persisted state; replaces LedaDock and LedaLauncher in the Portal.',
  'RailMenuButton (or IconRail `menu` slot): rail tile that opens a nav dropdown; today composed from Menu + a raw button.',
  'Menu item `active` (aria-current + check mark) and section headings; today the check is drawn inside the label.',
  'Token `width.leda-panel` = 22.5rem (360px, the agreed Leda fit width); `right-panel` is 18rem and too narrow for proposal cards. Prototype uses w-[22.5rem].',
  'Container-query support in the preset (@tailwindcss/container-queries or documented arbitrary `[@container(...)]` variants); prototype uses arbitrary variants.',
  'Chat `fill` size (h-full w-full, no border/shadow) for panels; prototype overrides Chat className.',
];

export type LedaView = 'empty' | 'conversation' | 'confirm';

const DESKTOP = '(min-width: 1024px)';

function useMediaQuery(query: string) {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : true);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia(query);
    const on = () => setMatches(mql.matches);
    on();
    mql.addEventListener('change', on);
    return () => mql.removeEventListener('change', on);
  }, [query]);
  return matches;
}

function readStored(): boolean | undefined {
  try {
    const v = window.localStorage.getItem(LEDA_PANEL_KEY);
    return v === 'open' ? true : v === 'closed' ? false : undefined;
  } catch {
    return undefined;
  }
}

function writeStored(open: boolean) {
  try {
    window.localStorage.setItem(LEDA_PANEL_KEY, open ? 'open' : 'closed');
  } catch {
    /* storage blocked: state just is not remembered */
  }
}

/* ------------------------------------------------------------------ rail -- */

const tile = cn('grid h-9 w-9 place-items-center rounded-lg', focusRing);

function navMenuItems(active: PortalNavKey, member: boolean, onNavigate?: (k: PortalNavKey) => void): MenuItem[] {
  const links = linksFor(member);
  const row = (l: (typeof links)[number]): MenuItem => ({
    icon: l.icon,
    label: (
      <span className={cn('flex items-center gap-2', l.key === active && 'font-semibold text-primary-700')}>
        <span className="flex-1">{l.label}</span>
        {l.key === active ? (
          <>
            <Icon icon={Check} size="sm" />
            <span className="sr-only">(current page)</span>
          </>
        ) : (
          l.badge != null && <span className="text-xs text-ink-subtle">{l.badge}</span>
        )}
      </span>
    ),
    onSelect: () => onNavigate?.(l.key),
  });
  const main = links.filter((l) => l.group === 'main').map(row);
  const settings = links.filter((l) => l.group === 'settings').map(row);
  return [
    { type: 'label', label: COMPANY },
    ...main,
    ...(settings.length ? ([{ type: 'separator' }, { type: 'label', label: 'Settings' }, ...settings] as MenuItem[]) : []),
  ];
}

const accountItems: MenuItem[] = [
  { type: 'label', label: USER.email },
  { label: 'Account', icon: User },
  { label: 'Billing', icon: CreditCard },
  { type: 'separator' },
  { label: 'Sign out', icon: SignOut, danger: true },
];

function Rail({ active, member, onNavigate, onAddPlatform }: { active: PortalNavKey; member: boolean; onNavigate?: (k: PortalNavKey) => void; onAddPlatform?: () => void }) {
  return (
    <nav aria-label="Platforms" className="hidden w-rail shrink-0 flex-col items-center gap-2 py-3 lg:flex">
      <Menu
        side="right"
        align="start"
        className="min-w-56"
        trigger={
          <button type="button" aria-label="Menu" title="Menu" className={cn(tile, 'bg-primary-600 text-white shadow-sm hover:bg-primary-700')}>
            <Icon icon={List} size="md" weight="bold" />
          </button>
        }
        items={navMenuItems(active, member, onNavigate)}
      />
      <div aria-hidden="true" className="my-1 h-px w-6 bg-border" />
      {PLATFORMS.map((p) => (
        <Tooltip key={p.id} content={p.label} side="right">
          <button type="button" aria-label={`${p.label}, ${p.status}`} className="relative rounded-lg">
            <span className={cn(tile, 'text-ink-muted hover:bg-surface-muted hover:text-ink')}>
              <Icon icon={p.icon} size="md" />
            </span>
            <span className="absolute -bottom-0.5 -right-0.5">
              <StatusDot status={p.status} />
            </span>
          </button>
        </Tooltip>
      ))}
      <Tooltip content="Add platform" side="right">
        <button type="button" aria-label="Add platform" onClick={onAddPlatform} className={cn(tile, 'text-ink-muted hover:bg-surface-muted hover:text-ink')}>
          <Icon icon={Plus} size="md" />
        </button>
      </Tooltip>
      <div className="mt-auto">
        <Menu
          side="right"
          align="end"
          trigger={
            <button type="button" className={cn('rounded-full', focusRing)}>
              <Avatar name={USER.name} size="sm" />
              <span className="sr-only">Account</span>
            </button>
          }
          items={accountItems}
        />
      </div>
    </nav>
  );
}

/* -------------------------------------------------------- mobile nav ------ */

function MobileNav({ open, onOpenChange, active, member, onNavigate }: { open: boolean; onOpenChange: (v: boolean) => void; active: PortalNavKey; member: boolean; onNavigate?: (k: PortalNavKey) => void }) {
  const links = linksFor(member);
  const go = (k: PortalNavKey) => {
    onNavigate?.(k);
    onOpenChange(false);
  };
  const item = (l: (typeof links)[number]) => (
    <SidebarItem key={l.key} icon={l.icon} active={l.key === active} badge={l.badge} onClick={() => go(l.key)}>
      {l.label}
    </SidebarItem>
  );
  const settings = links.filter((l) => l.group === 'settings');
  return (
    <OffCanvas open={open} onOpenChange={onOpenChange} side="left" width="288px">
      <OffCanvas.Header className="pr-12">{COMPANY}</OffCanvas.Header>
      <Sidebar className="flex min-h-0 w-full flex-1 overflow-y-auto p-0 px-3 pb-3">
        <SidebarSection>{links.filter((l) => l.group === 'main').map(item)}</SidebarSection>
        {settings.length > 0 && <SidebarSection title="Settings">{settings.map(item)}</SidebarSection>}
        <SidebarSection title="Platforms">
          {PLATFORMS.map((p) => (
            <SidebarItem key={p.id} icon={p.icon} badge={<StatusDot status={p.status} label={p.status} size="sm" />}>
              {p.label}
            </SidebarItem>
          ))}
          <SidebarItem icon={Plus}>Add platform</SidebarItem>
        </SidebarSection>
        <SidebarSection title={USER.email} className="mt-auto">
          <SidebarItem icon={User}>Account</SidebarItem>
          <SidebarItem icon={CreditCard}>Billing</SidebarItem>
          <SidebarItem icon={SignOut}>Sign out</SidebarItem>
        </SidebarSection>
      </Sidebar>
    </OffCanvas>
  );
}

/* --------------------------------------------------------------- Leda ----- */

interface Msg {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  pending?: boolean;
  widget?: 'stats' | 'proposal';
}

const CONVERSATION: Msg[] = [
  { id: 1, role: 'user', text: 'How did Inventory do this week?' },
  { id: 2, role: 'assistant', text: 'Sales are up and stock is healthy, except 3 items below reorder point.', widget: 'stats' },
];

const CONFIRM: Msg[] = [
  ...CONVERSATION,
  { id: 3, role: 'user', text: 'Reorder the mango boxes from San Miguel.' },
  { id: 4, role: 'assistant', text: 'Here is the purchase order. Nothing is created until you confirm.', widget: 'proposal' },
];

function initialMessages(view: LedaView): Msg[] {
  return view === 'confirm' ? CONFIRM : view === 'conversation' ? CONVERSATION : [];
}

function LedaPanelBody({ view, context, onCollapse, overlay }: { view: LedaView; context: string; onCollapse: () => void; overlay?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>(() => initialMessages(view));
  const [draft, setDraft] = useState('');
  const [proposal, setProposal] = useState<'pending' | 'applying' | 'confirmed' | 'cancelled'>('pending');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMessages(initialMessages(view)), [view]);
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages]);

  const ask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const uid = Date.now();
    setMessages((p) => [...p, { id: uid, role: 'user', text: t }, { id: uid + 1, role: 'assistant', text: '', pending: true }]);
    setDraft('');
    window.setTimeout(
      () => setMessages((p) => p.map((m) => (m.id === uid + 1 ? { ...m, pending: false, text: 'Both platforms are online. Repair shop is slow to sync; I will keep an eye on it.' } : m))),
      900,
    );
  };

  const confirm = () => {
    setProposal('applying');
    window.setTimeout(() => setProposal('confirmed'), 900);
  };

  return (
    <Chat aria-label="Leda" className="h-full w-full rounded-none border-0 bg-transparent shadow-none">
      <Chat.Header
        title="Leda"
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            On this page <Tag className="py-0">{context}</Tag>
          </span>
        }
        actions={
          <>
            <IconButton icon={NotePencil} label="New conversation" variant="subtle" size="sm" onClick={() => setMessages([])} />
            <IconButton icon={overlay ? X : CaretLineRight} label={overlay ? 'Close Leda' : 'Collapse Leda'} variant="subtle" size="sm" onClick={onCollapse} />
          </>
        }
        className="border-b border-border"
      />
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col justify-end gap-4 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold text-ink">Good morning, Maria</p>
            <p className="text-sm text-ink-muted">Ask about your platforms or tell me what to do. I can see the {context} you are on.</p>
          </div>
          <LedaWidget.Suggestions items={LEDA_SUGGESTIONS} onSelect={ask} />
        </div>
      ) : (
        <Chat.Messages aria-live="polite">
          {messages.map((m) => (
            <div key={m.id} className="flex flex-col gap-2">
              <Chat.Message role={m.role} streaming={m.pending}>
                {m.text}
              </Chat.Message>
              {m.widget === 'stats' && (
                <LedaWidget title="Inventory this week" meta="Mon 19 to Sun 25 Oct" icon={Package} className="border border-border shadow-none">
                  <LedaWidget.StatGrid
                    columns={2}
                    items={[
                      { label: 'Sales', value: '₱184K', delta: '+8%', deltaTone: 'success' },
                      { label: 'Low stock', value: '3 items', delta: 'Mango boxes out', deltaTone: 'error' },
                    ]}
                  />
                </LedaWidget>
              )}
              {m.widget === 'proposal' && (
                <LedaWidget.Proposal
                  title="Create purchase order"
                  intent="order"
                  summary="Draft PO-1044 to San Miguel Foods."
                  changes={[
                    { label: 'Mango boxes', value: '24 boxes', sign: 'in' },
                    { label: 'Estimated total', value: '₱8,640' },
                  ]}
                  status={proposal}
                  confirmLabel="Create PO"
                  onConfirm={confirm}
                  onCancel={() => setProposal('cancelled')}
                  resultText={proposal === 'confirmed' ? 'PO-1044 created in Inventory.' : 'Purchase order cancelled.'}
                />
              )}
            </div>
          ))}
          <div ref={endRef} />
        </Chat.Messages>
      )}
      <Chat.Input
        placeholder="Ask Leda or tell it what to do…"
        aria-label="Message Leda"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onSubmit={ask}
        autoFocus={overlay}
      />
    </Chat>
  );
}

/* --------------------------------------------------------------- shell ---- */

export interface DashboardShellProps {
  /** Active nav item (marked in the Menu dropdown and the mobile nav). */
  active?: PortalNavKey;
  /** Top-bar page title; defaults to the active link label. */
  title?: ReactNode;
  /** Member variant: permission-limited links. */
  member?: boolean;
  /** Leda panel open on desktop. Omit to use the remembered value (default open). */
  ledaOpen?: boolean;
  /** Panel content state. */
  ledaView?: LedaView;
  /** Mobile only: open the off-canvas nav on mount (for review stories). */
  navOpen?: boolean;
  /** Mobile only: open the Leda drawer on mount (for review stories). */
  ledaDrawerOpen?: boolean;
  onNavigate?: (key: PortalNavKey) => void;
  onAddPlatform?: () => void;
  /** Page content; laid out against the measured content width (size container). */
  children: ReactNode;
}

export function DashboardShell({
  active = 'home',
  title,
  member = false,
  ledaOpen,
  ledaView = 'empty',
  navOpen = false,
  ledaDrawerOpen = false,
  onNavigate,
  onAddPlatform,
  children,
}: DashboardShellProps) {
  const desktop = useMediaQuery(DESKTOP);
  const [docked, setDocked] = useState<boolean>(() => ledaOpen ?? readStored() ?? true);
  const [drawer, setDrawer] = useState(ledaDrawerOpen);
  const [nav, setNav] = useState(navOpen);
  const context = PAGE_CONTEXT[active];
  const label = title ?? linksFor(false).find((l) => l.key === active)?.label;

  const setDockedRemembered = (v: boolean) => {
    setDocked(v);
    writeStored(v);
  };
  const ledaShown = desktop ? docked : drawer;
  const toggleLeda = () => (desktop ? setDockedRemembered(!docked) : setDrawer(!drawer));

  return (
    <div className="ds-root flex h-screen w-full overflow-hidden bg-surface-canvas font-sans text-ink">
      <Rail active={active} member={member} onNavigate={onNavigate} onAddPlatform={onAddPlatform} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          start={
            <>
              <IconButton icon={List} label="Open menu" variant="subtle" className="lg:hidden" onClick={() => setNav(true)} />
              {typeof label === 'string' ? <h1 className="truncate text-sm font-semibold text-ink">{label}</h1> : label}
            </>
          }
          end={
            <>
              <IconButton
                icon={WaveTriangle}
                label={ledaShown ? 'Hide Leda' : 'Show Leda'}
                aria-pressed={ledaShown}
                variant="subtle"
                className={cn(ledaShown && 'bg-primary-50 text-primary-700 hover:bg-primary-50 hover:text-primary-700')}
                onClick={toggleLeda}
              />
              <IconButton icon={Plus} label="Add platform" variant="subtle" onClick={onAddPlatform} />
            </>
          }
        />

        <div className="flex min-h-0 flex-1">
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto [container-type:inline-size]">{children}</main>

          {desktop && docked && (
            <aside aria-label="Leda panel" className="mb-2 mr-2 flex w-[22.5rem] shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
              <LedaPanelBody view={ledaView} context={context} onCollapse={() => setDockedRemembered(false)} />
            </aside>
          )}

          {desktop && !docked && (
            <aside aria-label="Leda panel, collapsed" className="mb-2 mr-2 flex w-10 shrink-0 flex-col items-center gap-2 rounded-lg border border-border bg-surface py-2">
              <Tooltip content="Open Leda" side="left">
                <button
                  type="button"
                  onClick={() => setDockedRemembered(true)}
                  aria-label="Open Leda"
                  className={cn('flex flex-col items-center gap-2 rounded-base px-1 py-2 text-ink-muted hover:bg-surface-muted hover:text-ink', focusRing)}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-50 text-primary-600">
                    <Icon icon={WaveTriangle} size="sm" weight="fill" />
                  </span>
                  <span className="text-xs font-semibold [writing-mode:vertical-rl]">Leda</span>
                </button>
              </Tooltip>
            </aside>
          )}
        </div>
      </div>

      {!desktop && (
        <>
          <MobileNav open={nav} onOpenChange={setNav} active={active} member={member} onNavigate={onNavigate} />
          <OffCanvas open={drawer} onOpenChange={setDrawer} side="right" width="100vw" hideClose className="max-w-none sm:max-w-[24rem]">
            <OffCanvas.Header className="sr-only">Leda</OffCanvas.Header>
            <LedaPanelBody view={ledaView} context={context} onCollapse={() => setDrawer(false)} overlay />
          </OffCanvas>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------- review placeholder ----- */

/** Placeholder page content that shows the measured content width (open vs closed panel). */
export function ContentProbe() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="flex flex-col gap-3 px-4 pb-4">
      <p className="text-xs text-ink-muted">
        Content area <span className="font-semibold tabular-nums text-ink">{w}px</span> wide. Columns follow this width, not the viewport.
      </p>
      <div className="grid grid-cols-1 gap-3 [@container(min-width:36rem)]:grid-cols-2 [@container(min-width:60rem)]:grid-cols-4">
        {['Platforms online', 'Needs attention', 'Sales today', 'Team active'].map((t, i) => (
          <div key={t} className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4">
            <span className="text-xs text-ink-muted">{t}</span>
            <span className="text-lg font-semibold tabular-nums text-ink">{['1 of 2', '3', '₱42,180', '6'][i]}</span>
          </div>
        ))}
      </div>
      <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-border-strong bg-surface p-6 text-center">
        <div className="flex max-w-sm flex-col gap-1">
          <p className="text-sm font-semibold text-ink">Page content</p>
          <p className="text-sm text-ink-muted">Home (platform map and Needs attention) is designed in RDY-214. This shell wraps every Portal page.</p>
        </div>
      </div>
    </div>
  );
}
