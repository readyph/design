/**
 * RDY-213 prototype: the Portal shell for the RDY-212 dashboard epic.
 *
 * - Menu sidebar removed. The platform rail stays; its top tile is a Menu button that opens a
 *   dropdown with every sidebar link (active item marked; members see a shorter list).
 * - No top bar / top nav (revision 2, owner feedback). Pages own their heading. Below lg (1024px) the
 *   rail is hidden; a small floating Menu button (bottom-left) opens an off-canvas nav.
 * - Leda is a FIXED column on the right of every page, full height from the very top to the bottom
 *   edge (revisions 1 and 2), separated from the content by a surface-tone shift (no hairline), no inset
 *   card, rounding or shadow. 24rem at lg, 28rem from xl (1280px). When hidden, no sidebar is left behind:
 *   only a floating round Leda button on the right edge (top, aligned with the collapse button) brings it back; below lg it opens as an overlay drawer. Remembered in localStorage `readyph.leda_panel`.
 * - The chat inside is the previous Portal Leda chat, unchanged (see LedaChat).
 * - Content area is a size container, so pages lay out from the measured content width
 *   (container queries), not the viewport. Default content: the platform connections diagram.
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
  Sparkle,
  Trash,
  SidebarSimple,
  ArrowElbowDownLeft,
  SignOut,
  User,
  CreditCard,
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
  Tooltip,
  cn,
  focusRing,
  type MenuItem,
} from '../../index';
import {
  COMPANY,
  LEDA_PANEL_KEY,
  PLATFORMS,
  USER,
  linksFor,
  type PortalNavKey,
} from './data';

/** Kit gaps found while building this prototype (also in the PR body). */
export const MISSING_IN_KIT = [
  'LedaSidePanel (RDY-219, revise): docked state = flush full-height column (top to bottom of the viewport, no top bar above it) separated from the canvas by surface tone only (no border line), no inset or card border; hidden state renders no column, only a floating circular Leda icon button (right edge, top, aligned with the collapse button, tooltip "Ask Leda") that reopens it; header uses a "Collapse Leda" panel icon instead of X, a Leda logo (white glyph on solid brand-blue circle) and a subtle return-arrow submit inside the input field (no filled button); no visible page-context chip (context is still sent to Leda).',
  'Shell without TopBar (RDY-218/221): no top bar; Leda toggle and Add platform are not in a header (Add platform stays in the rail and mobile nav); below lg a floating Menu button replaces the top-bar menu button. Portal layout must drop TopBar.',
  'Token `width.leda-panel` = 28rem from xl (1280px) and 24rem at lg (1024 to 1279px), replacing 22.5rem; prototype uses w-[24rem] xl:w-[28rem].',
  'Chat `fill` size (h-full w-full, no border/rounding/shadow) for the docked panel; prototype overrides Chat className.',
  'Leda chat body stays project-owned (portal LedaDock content); only its container moves into LedaSidePanel.',
  'RailMenuButton / Menu item `active` and section headings (RDY-218); today composed from Menu + a raw button with the check drawn inside the label.',
  'Container-query support in the preset (RDY-219); prototype uses arbitrary `[@container(...)]` variants.',
  'ConnectionsMap (RDY-214): flat diagram (bare icon tiles + labels, no node boxes or wrapping Card) with a divided text list below; prototype positions nodes with arbitrary top/left classes from static data.',
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
          <button type="button" aria-label="Menu" title="Menu" className={cn(tile, 'bg-transparent text-ink hover:bg-surface-muted')}>
            <Icon icon={List} size="md" weight="bold" />
          </button>
        }
        items={navMenuItems(active, member, onNavigate)}
      />
      <div aria-hidden="true" className="h-2" />
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
/*
 * Owner feedback 4: keep the PREVIOUS Leda chat exactly as the live Portal renders it
 * (portal/src/modules/leda/LedaDock.tsx on @readyph/ui 0.6.x): Chat header "Leda / Your AI
 * assistant" with close, centred empty state, Sparkle quick-action pills, primary user bubbles,
 * assistant rows with the round Leda avatar and plain prose, thinking dots, writes as
 * LedaWidget.Proposal (LedaActionBlock). Only the container changed: a docked right column with a
 * hairline separator instead of the floating rounded card.
 */

const QUICK_ACTIONS = ["What's low on stock?", 'Summarize this week', 'Remember our holiday hours'];

interface Msg {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  pending?: boolean;
  status?: string;
  proposal?: boolean;
}

const CONVERSATION: Msg[] = [
  { id: 1, role: 'user', text: 'How are my platforms connected?' },
  {
    id: 2,
    role: 'assistant',
    text: 'Makati and BGC read stock from Central stock, and BGC also reads its catalog from Davao stock. Cebu branch has no stock source yet, so it cannot take orders. Want me to connect it to Central stock?',
  },
];

const CONFIRM: Msg[] = [
  ...CONVERSATION,
  { id: 3, role: 'user', text: 'Yes, connect Cebu to Central stock.' },
  { id: 4, role: 'assistant', text: 'Here is the change. Nothing is linked until you confirm.', proposal: true },
];

function initialMessages(view: LedaView): Msg[] {
  return view === 'confirm' ? CONFIRM : view === 'conversation' ? CONVERSATION : [];
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="Leda is thinking">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-60" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-60 [animation-delay:160ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-60 [animation-delay:320ms]" />
    </span>
  );
}

/** The Leda mark: the brand-blue WaveTriangle glyph only. No circle, fill or ring. */
function LedaLogo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center bg-transparent text-primary-500',
        size === 'lg' ? 'h-14 w-14' : 'h-8 w-8',
      )}
    >
      <Icon icon={WaveTriangle} size={size === 'lg' ? 40 : 24} weight="bold" />
    </span>
  );
}
const ledaAvatar = <LedaLogo />;

function LedaChat({ view, onClose, overlay }: { view: LedaView; onClose: () => void; overlay?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>(() => initialMessages(view));
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState<'pending' | 'applying' | 'confirmed' | 'cancelled'>('pending');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMessages(initialMessages(view)), [view]);
  useEffect(() => {
    const el = scrollRef.current;
    el?.scrollTo?.({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const uid = Date.now();
    setBusy(true);
    setMessages((p) => [...p, { id: uid, role: 'user', text: t }, { id: uid + 1, role: 'assistant', text: '', pending: true, status: 'Checking your platforms' }]);
    window.setTimeout(() => {
      setMessages((p) => p.map((m) => (m.id === uid + 1 ? { ...m, pending: false, text: 'Both Inventory locations are online. Davao stock is slow to sync; I will keep an eye on it.' } : m)));
      setBusy(false);
    }, 900);
  };

  const confirm = () => {
    setProposal('applying');
    window.setTimeout(() => setProposal('confirmed'), 900);
  };

  return (
    <Chat aria-label="Leda" className="h-full w-full rounded-none border-0 bg-transparent shadow-none">
      <Chat.Header>
        {ledaAvatar}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">Leda</p>
          <p className="truncate text-xs text-ink-muted">Your AI assistant</p>
        </div>
        {messages.length > 0 && <IconButton icon={Trash} label="Clear conversation" variant="subtle" size="sm" onClick={() => setMessages([])} />}
        <Tooltip content="Collapse Leda" side="bottom">
          <IconButton icon={SidebarSimple} label="Collapse Leda" variant="subtle" size="sm" onClick={onClose} />
        </Tooltip>
      </Chat.Header>
      <Chat.Messages ref={scrollRef} aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
            <LedaLogo size="lg" />
            <p className="text-sm text-ink-muted">Ask me about your company, inventory or team. I answer from your Memory and can draft changes for you to confirm.</p>
          </div>
        ) : (
          messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="max-w-[85%] self-end whitespace-pre-wrap rounded-lg rounded-br-sm bg-primary-600 px-3 py-2 text-sm text-white">
                {m.text}
              </div>
            ) : (
              <div key={m.id} className="flex gap-2.5">
                {ledaAvatar}
                <div className="min-w-0 flex-1 space-y-2">
                  {m.text && <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{m.text}</p>}
                  {m.pending && (
                    <p className="flex items-center gap-2 text-sm text-ink-muted">
                      {m.status ?? 'Thinking'} <ThinkingDots />
                    </p>
                  )}
                  {m.proposal && (
                    <LedaWidget.Proposal
                      title="Connect data"
                      intent="update"
                      summary="Cebu branch reads Central stock."
                      changes={[
                        { label: 'Stock source', value: 'Central stock', sign: 'in' },
                        { label: 'Shared with', value: '3 branches' },
                      ]}
                      status={proposal}
                      confirmLabel="Connect"
                      onConfirm={confirm}
                      onCancel={() => setProposal('cancelled')}
                      resultText={proposal === 'confirmed' ? 'Cebu branch now reads stock from Central stock.' : 'Change cancelled.'}
                    />
                  )}
                </div>
              </div>
            ),
          )
        )}
      </Chat.Messages>
      {messages.length === 0 && (
        <Chat.QuickActions>
          {QUICK_ACTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs text-ink',
                'hover:bg-primary-50 hover:text-primary-700',
                focusRing,
              )}
            >
              <Icon icon={Sparkle} size="sm" className="text-primary-500" />
              {q}
            </button>
          ))}
        </Chat.QuickActions>
      )}
      <form
        className="p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
          setDraft('');
        }}
      >
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface-muted py-1.5 pl-3 pr-1.5 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-focus">
          <textarea
            rows={1}
            value={draft}
            autoFocus={overlay}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(draft);
                setDraft('');
              }
            }}
            placeholder={busy ? 'Leda is replying…' : 'Ask Leda…'}
            aria-label="Message Leda"
            className="min-h-8 flex-1 resize-none self-center bg-transparent py-1.5 text-sm leading-5 text-ink outline-none placeholder:text-ink-subtle"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={busy || !draft.trim()}
            className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-base bg-transparent text-ink-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40', focusRing)}
          >
            <Icon icon={ArrowElbowDownLeft} size="md" />
          </button>
        </div>
      </form>
    </Chat>
  );
}

/* --------------------------------------------------------------- shell ---- */

export interface DashboardShellProps {
  /** Active nav item (marked in the Menu dropdown and the mobile nav). */
  active?: PortalNavKey;
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

  const setDockedRemembered = (v: boolean) => {
    setDocked(v);
    writeStored(v);
  };
  const ledaShown = desktop ? docked : drawer;
  const toggleLeda = () => (desktop ? setDockedRemembered(!docked) : setDrawer(!drawer));

  return (
    <div className="ds-root relative flex h-screen w-full overflow-hidden bg-surface-canvas font-sans text-ink">
      <Rail active={active} member={member} onNavigate={onNavigate} onAddPlatform={onAddPlatform} />

      <main className={cn('min-h-0 min-w-0 flex-1 overflow-y-auto [container-type:inline-size] max-lg:pb-16', !ledaShown && 'pr-24')}>{children}</main>

      {desktop && docked && (
        <aside aria-label="Leda panel" className="flex h-full w-[24rem] shrink-0 flex-col bg-surface shadow-sm xl:w-[28rem]">
          <LedaChat view={ledaView} onClose={() => setDockedRemembered(false)} />
        </aside>
      )}

      {!ledaShown && (
        <Tooltip content="Ask Leda" side="left">
          <button
            type="button"
            onClick={toggleLeda}
            aria-label="Ask Leda"
            className={cn(
              'absolute right-3 top-2 grid h-10 w-10 place-items-center rounded-full bg-surface text-primary-500 shadow-md hover:bg-surface-muted',
              focusRing,
            )}
          >
            <Icon icon={WaveTriangle} size="md" weight="bold" />
          </button>
        </Tooltip>
      )}

      {!desktop && (
        <>
          <button
            type="button"
            onClick={() => setNav(true)}
            aria-label="Open menu"
            className={cn(
              'absolute bottom-6 left-4 grid h-10 w-10 place-items-center rounded-full bg-surface text-ink shadow-md hover:bg-surface-muted',
              focusRing,
            )}
          >
            <Icon icon={List} size="md" weight="bold" />
          </button>
          <MobileNav open={nav} onOpenChange={setNav} active={active} member={member} onNavigate={onNavigate} />
          <OffCanvas open={drawer} onOpenChange={setDrawer} side="right" width="100vw" hideClose className="max-w-none sm:max-w-[24rem]">
            <OffCanvas.Header className="sr-only">Leda</OffCanvas.Header>
            <LedaChat view={ledaView} onClose={() => setDrawer(false)} overlay />
          </OffCanvas>
        </>
      )}
    </div>
  );
}
