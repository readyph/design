/**
 * PROTOTYPE (RDY-176, epic RDY-173 feature 4) - Portal quick switcher (Cmd/Ctrl+K command palette).
 *
 * Opened by Cmd/Ctrl+K or the top-bar search button of the Portal shell (RDY-175). Built only from
 * @readyph/ui 0.7 components and tokens (Modal, SearchBar, Icon, Avatar, Badge, Kbd, Skeleton,
 * StatusDot); the palette itself is the proposed kit `CommandPalette` (see MISSING_IN_KIT).
 * Never export anything from this folder in `src/index.ts`.
 *
 * Layout: >= 640 a 640px modal pinned 12vh from the top (radius-modal 8px, 32px rows);
 * < 640 a full-screen sheet (no radius, 40px rows, Cancel button, no key hints).
 * Keyboard: Up/Down (wraps), Home/End, Enter opens, Esc closes, Cmd/Ctrl+K toggles.
 * Leda: free text shows "Ask Leda: <query>" as the last option; with no match it is the only
 * option and is highlighted. Selecting it closes the palette and sends the text to the Leda panel.
 */
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  ArrowBendDownLeft,
  Brain,
  Buildings,
  ChartLineUp,
  ClockCounterClockwise,
  CreditCard,
  FileText,
  House,
  Package,
  PaintBrush,
  SquaresFour,
  Users,
  WaveTriangle,
  Wrench,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Kbd } from '../../components/Kbd';
import { Modal } from '../../components/Modal';
import { SearchBar } from '../../components/SearchBar';
import { Skeleton } from '../../components/Skeleton';
import { StatusDot, type StatusTone } from '../../components/StatusDot';
import { useHotkeys } from '../../hooks/useHotkeys';
import { cn } from '../../utils/cn';
import { formatShortcut } from '../../utils/shortcut';
import { SamplePage, Shell, type ShellProps } from '../portal-shell/Shell';

/** For Leonardo: what this prototype previews because the kit does not ship it yet. */
export const MISSING_IN_KIT = [
  '`CommandPalette` (new): Modal-based combobox with `CommandPalette.Input`, `.List`, `.Group` (heading), `.Item` (icon | avatar, label with match highlight, meta, end slot), `.Empty`, `.Loading`, `.Footer` (key hints). ARIA: input role=combobox + aria-activedescendant, list role=listbox, groups role=group, items role=option.',
  'Placement: modal pinned 12vh from the top, 640px wide, radius-modal (8px); below 640px a full-screen sheet with no radius. Previewed with className overrides on Modal (Modal centres vertically today and uses rounded-md).',
  'Borderless SearchBar variant for the palette header (44px, no border/ring, hairline bottom border). Previewed with `[&_input]` descendant overrides.',
  'Neutral Kbd tone (border, subtle surface, muted ink) for key hints; Kbd is brand-tinted today. Previewed with a className override (also listed by RDY-175).',
  'Item density: 32px rows desktop (`h-control`), rows at least 40px on touch with meta on a second line; active row `bg-surface-muted` with an Enter key hint.',
  'Shell: `ShellTopBar` search button needs `onClick` and the shell a palette slot; the prototype listens for clicks on the button by its accessible name.',
  'Leda panel: an entry API to open with a sent message (e.g. `LedaPanel initialMessage`); the prototype opens the panel and shows the sent text in a notice row.',
];

/* ------------------------------------------------------------------ data */

export type GroupKey = 'recent' | 'suggested' | 'pages' | 'platforms' | 'team' | 'memories' | 'reports';

export interface PaletteItem {
  id: string;
  group: Exclude<GroupKey, 'recent' | 'suggested'>;
  label: string;
  meta?: string;
  icon?: PhosphorIcon;
  /** Team members show an avatar instead of an icon. */
  person?: boolean;
  status?: { tone: StatusTone; label: string };
  /** Shell page to open on select. */
  page: string;
  keywords?: string;
}

const ITEMS: PaletteItem[] = [
  { id: 'p-home', group: 'pages', label: 'Home', meta: 'KPIs, revenue and activity', icon: House, page: 'home' },
  { id: 'p-platforms', group: 'pages', label: 'Platforms', meta: 'Connected platforms', icon: SquaresFour, page: 'platforms' },
  { id: 'p-team', group: 'pages', label: 'Team', meta: 'Members and invites', icon: Users, page: 'team' },
  { id: 'p-reports', group: 'pages', label: 'Reports', meta: 'Sales, jobs and stock', icon: ChartLineUp, page: 'reports' },
  { id: 'p-memory', group: 'pages', label: 'Memory', meta: 'What Leda remembers', icon: Brain, page: 'memory' },
  { id: 'p-company', group: 'pages', label: 'Company', meta: 'Settings', icon: Buildings, page: 'company' },
  { id: 'p-billing', group: 'pages', label: 'Billing', meta: 'Settings', icon: CreditCard, page: 'billing' },
  { id: 'p-appearance', group: 'pages', label: 'Appearance', meta: 'Settings · theme', icon: PaintBrush, page: 'appearance', keywords: 'theme dark light' },
  { id: 'pl-portal', group: 'platforms', label: 'Portal', meta: 'v2.14.0 · 12 users', icon: SquaresFour, status: { tone: 'active', label: 'Online' }, page: 'platforms' },
  { id: 'pl-inventory', group: 'platforms', label: 'Inventory', meta: 'v1.32.1 · 9 users', icon: Package, status: { tone: 'active', label: 'Online' }, page: 'platforms' },
  { id: 'pl-sms', group: 'platforms', label: 'Service Management', meta: 'v0.9.4 · 3 sync errors', icon: Wrench, status: { tone: 'degraded', label: 'Degraded' }, page: 'platforms', keywords: 'sms' },
  { id: 't-ana', group: 'team', label: 'Ana Reyes', meta: 'ana@acmemotors.ph · Member', person: true, page: 'team' },
  { id: 't-ben', group: 'team', label: 'Benjie Santos', meta: 'benjie@acmemotors.ph · Administrator', person: true, page: 'team' },
  { id: 't-carla', group: 'team', label: 'Carla Mendoza', meta: 'carla@acmemotors.ph · Member', person: true, page: 'team' },
  { id: 'm-hours', group: 'memories', label: 'Shop hours are 8:00 to 18:00, closed Sundays', meta: 'Saved by Earvin · 3 Oct', icon: Brain, page: 'memory' },
  { id: 'm-supplier', group: 'memories', label: 'Preferred brake pad supplier is Manila Auto Parts', meta: 'Saved by Leda · 12 Oct', icon: Brain, page: 'memory', keywords: 'inventory stock' },
  { id: 'r-weekly', group: 'reports', label: 'Weekly sales', meta: '14 to 20 Oct · PHP 482,300', icon: FileText, page: 'reports' },
  { id: 'r-jobs', group: 'reports', label: 'Jobs by mechanic', meta: 'October · Service Management', icon: FileText, page: 'reports' },
  { id: 'r-stock', group: 'reports', label: 'Low stock items', meta: 'Today · Inventory', icon: FileText, page: 'reports', keywords: 'inventory' },
];

const byId = (id: string) => ITEMS.find((i) => i.id === id)!;
const RECENT_DEFAULT = ['pl-sms', 't-ana', 'r-weekly'];
const SUGGESTED = ['p-home', 'p-team', 'p-reports', 'p-appearance'];

const GROUP_TITLES: Record<GroupKey, string> = {
  recent: 'Recent',
  suggested: 'Suggested',
  pages: 'Pages',
  platforms: 'Platforms',
  team: 'Team members',
  memories: 'Memories',
  reports: 'Reports',
};
const RESULT_ORDER: PaletteItem['group'][] = ['pages', 'platforms', 'team', 'memories', 'reports'];
/** Groups that come from the API (shown as skeletons while loading); pages filter locally. */
const REMOTE: PaletteItem['group'][] = ['team', 'memories', 'reports'];
const PER_GROUP = 4;

interface Section {
  key: GroupKey;
  items: PaletteItem[];
}

function matches(item: PaletteItem, q: string) {
  const hay = `${item.label} ${item.meta ?? ''} ${item.keywords ?? ''}`.toLowerCase();
  return hay.includes(q);
}

export function buildSections(query: string, recent: string[], loading: boolean): Section[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [
      { key: 'recent', items: recent.map(byId) },
      { key: 'suggested', items: SUGGESTED.filter((id) => !recent.includes(id)).map(byId) },
    ].filter((s) => s.items.length > 0) as Section[];
  }
  return RESULT_ORDER.filter((g) => !(loading && REMOTE.includes(g)))
    .map((g) => ({ key: g, items: ITEMS.filter((i) => i.group === g && matches(i, q)).slice(0, PER_GROUP) }))
    .filter((s) => s.items.length > 0);
}

/* ---------------------------------------------------------------- pieces */

/** Neutral keycap (kit Kbd is brand-tinted; see MISSING_IN_KIT). */
function Key({ children }: { children: ReactNode }) {
  return (
    <Kbd size="sm" className="border-border bg-surface-subtle text-ink-muted shadow-none [[data-theme=dark]_&]:text-ink-muted">
      {children}
    </Kbd>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent font-semibold text-ink">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

const row =
  'flex w-full min-w-0 cursor-pointer select-none items-center gap-2 rounded-control px-2 py-1.5 text-left text-sm text-ink min-h-10 sm:h-control sm:min-h-0 sm:py-0';

function ItemRow({
  id,
  item,
  query,
  active,
  onHover,
  onSelect,
}: {
  id: string;
  item: PaletteItem;
  query: string;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      onMouseMove={onHover}
      onClick={onSelect}
      className={cn(row, active && 'bg-surface-muted')}
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center text-ink-muted">
        {item.person ? (
          <Avatar name={item.label} size="xs" className="[&>span]:h-5 [&>span]:w-5 [&>span]:text-[0.5625rem]" />
        ) : (
          item.icon && <Icon icon={item.icon} size="sm" />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-baseline sm:gap-2">
        <span className="min-w-0 truncate sm:max-w-[70%] sm:shrink-0">
          <Highlight text={item.label} query={query} />
        </span>
        {item.meta && <span className="min-w-0 truncate text-xs text-ink-subtle">{item.meta}</span>}
      </span>
      {item.status && (
        <span className="flex shrink-0 items-center gap-1 text-xs text-ink-muted">
          <StatusDot status={item.status.tone} pulse={false} size="sm" />
          <span className="sr-only sm:not-sr-only">{item.status.label}</span>
        </span>
      )}
      <span aria-hidden="true" className={cn('hidden shrink-0', active && 'sm:inline-flex')}>
        <Key>
          <Icon icon={ArrowBendDownLeft} size={10} />
        </Key>
      </span>
    </li>
  );
}

function AskLedaRow({
  id,
  query,
  active,
  onHover,
  onSelect,
}: {
  id: string;
  query: string;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  const q = query.trim();
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      onMouseMove={onHover}
      onClick={onSelect}
      className={cn(row, active && 'bg-surface-muted')}
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-sm bg-primary-600 text-white">
        <Icon icon={WaveTriangle} size={12} />
      </span>
      <span className="min-w-0 flex-1 truncate">
        {q ? (
          <>
            <span className="font-medium">Ask Leda:</span> <span className="text-ink-muted">{q}</span>
          </>
        ) : (
          <span className="font-medium">Ask Leda</span>
        )}
      </span>
      <span className="hidden shrink-0 text-xs text-ink-subtle sm:inline">{q ? 'Opens the Leda panel' : 'AI assistant'}</span>
      <span aria-hidden="true" className={cn('hidden shrink-0', active && 'sm:inline-flex')}>
        <Key>
          <Icon icon={ArrowBendDownLeft} size={10} />
        </Key>
      </span>
    </li>
  );
}

function GroupHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <li role="presentation" id={id} className="px-2 pb-1 pt-2 text-xs font-semibold text-ink-subtle">
      {children}
    </li>
  );
}

function LoadingRows() {
  return (
    <li role="presentation" aria-hidden="true" className="flex flex-col gap-1 px-2 py-2">
      <Skeleton variant="text" className="h-3 w-24" />
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex h-control items-center gap-2">
          <Skeleton variant="circle" className="h-5 w-5 shrink-0" />
          <Skeleton variant="text" className={cn('h-3', i === 1 ? 'w-1/2' : 'w-2/3')} />
        </span>
      ))}
    </li>
  );
}

/* --------------------------------------------------------------- palette */

export interface QuickSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (q: string) => void;
  /** Story state: remote groups (team, memories, reports) still loading. */
  loading?: boolean;
  recent?: string[];
  onSelectItem: (item: PaletteItem) => void;
  onAskLeda: (query: string) => void;
}

export function QuickSwitcher({
  open,
  onOpenChange,
  query,
  onQueryChange,
  loading = false,
  recent = RECENT_DEFAULT,
  onSelectItem,
  onAskLeda,
}: QuickSwitcherProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const listRef = useRef<HTMLUListElement>(null);
  const sections = useMemo(() => buildSections(query, recent, loading), [query, recent, loading]);
  const flat = sections.flatMap((s) => s.items);
  const hasQuery = query.trim().length > 0;
  const noMatch = hasQuery && flat.length === 0 && !loading;
  const total = flat.length + 1; // + Ask Leda, always last
  const [active, setActive] = useState(0);

  useEffect(() => setActive(noMatch ? total - 1 : 0), [query, noMatch, total]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  const optId = (i: number) => `${uid}-opt-${i}`;
  const choose = (i: number) => (i === total - 1 ? onAskLeda(query.trim()) : onSelectItem(flat[i]));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const moves: Record<string, () => number> = {
      ArrowDown: () => (active + 1) % total,
      ArrowUp: () => (active - 1 + total) % total,
      Home: () => 0,
      End: () => total - 1,
    };
    if (moves[e.key]) {
      e.preventDefault();
      setActive(moves[e.key]());
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(active);
    }
  };

  let index = -1;
  const status = loading
    ? 'Searching'
    : noMatch
      ? `No matches for ${query.trim()}. Ask Leda is available.`
      : `${flat.length} results`;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      hideClose
      size="xl"
      className={cn(
        'top-[12vh] max-h-[76vh] max-w-[40rem] translate-y-0 rounded-modal shadow-xl',
        'max-sm:inset-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:rounded-none max-sm:border-0',
      )}
    >
      <Modal.Header className="sr-only">Quick switcher</Modal.Header>
      <div className="flex shrink-0 items-center gap-1 border-b border-border pr-2 sm:pr-0">
        <SearchBar
          value={query}
          onValueChange={onQueryChange}
          loading={loading}
          placeholder="Search pages, platforms, people, memories, reports"
          role="combobox"
          aria-label="Search Acme Motors"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={optId(active)}
          onKeyDown={onKeyDown}
          className={cn(
            'min-w-0 flex-1',
            '[&_input]:h-11 [&_input]:rounded-none [&_input]:border-0 [&_input]:bg-transparent [&_input]:pl-10 [&_input:focus-visible]:ring-0',
            '[&>svg]:left-3.5',
          )}
        />
        <Button variant="subtle" size="sm" className="sm:hidden" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Results"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 sm:max-h-[min(60vh,26rem)]"
      >
        {sections.map((s) => {
          const headId = `${uid}-h-${s.key}`;
          return (
            <li key={s.key} role="presentation">
              <ul role="group" aria-labelledby={headId}>
                <GroupHeading id={headId}>
                  <span className="flex items-center gap-1">
                    {s.key === 'recent' && <Icon icon={ClockCounterClockwise} size={12} />}
                    {GROUP_TITLES[s.key]}
                  </span>
                </GroupHeading>
                {s.items.map((item) => {
                  index += 1;
                  const i = index;
                  return (
                    <ItemRow
                      key={item.id}
                      id={optId(i)}
                      item={item}
                      query={query}
                      active={active === i}
                      onHover={() => setActive(i)}
                      onSelect={() => choose(i)}
                    />
                  );
                })}
              </ul>
            </li>
          );
        })}

        {loading && hasQuery && <LoadingRows />}

        {noMatch && (
          <li role="presentation" className="px-2 pb-2 pt-3 text-sm text-ink-muted">
            No pages, platforms, people, memories or reports match{' '}
            <span className="font-medium text-ink">“{query.trim()}”</span>.
          </li>
        )}

        <li role="presentation">
          <ul role="group" aria-labelledby={`${uid}-h-leda`}>
            <GroupHeading id={`${uid}-h-leda`}>Leda</GroupHeading>
            <AskLedaRow
              id={optId(total - 1)}
              query={query}
              active={active === total - 1}
              onHover={() => setActive(total - 1)}
              onSelect={() => choose(total - 1)}
            />
          </ul>
        </li>
      </ul>

      <div
        aria-hidden="true"
        className="hidden shrink-0 items-center gap-3 border-t border-border bg-surface-subtle px-3 py-1.5 text-xs text-ink-subtle sm:flex"
      >
        <span className="flex items-center gap-1">
          <Key>↑</Key>
          <Key>↓</Key> Navigate
        </span>
        <span className="flex items-center gap-1">
          <Key>↵</Key> Open
        </span>
        <span className="flex items-center gap-1">
          <Key>Esc</Key> Close
        </span>
        <span className="ml-auto flex items-center gap-1">
          {formatShortcut('mod+k').map((k) => (
            <Key key={k}>{k}</Key>
          ))}{' '}
          Toggle
        </span>
      </div>
    </Modal>
  );
}

/* ----------------------------------------------------- shell composition */

export interface QuickSwitcherDemoProps extends Pick<ShellProps, 'theme' | 'role'> {
  /** Open on mount (story state). */
  open?: boolean;
  initialQuery?: string;
  loading?: boolean;
}

/**
 * The RDY-175 shell with the palette wired in: Cmd/Ctrl+K anywhere, or the top-bar search button.
 * Selecting a result opens its page; "Ask Leda" opens the Leda panel with the text.
 */
export function QuickSwitcherDemo({ theme = 'light', role = 'admin', open: initialOpen = false, initialQuery = '', loading = false }: QuickSwitcherDemoProps) {
  const [open, setOpen] = useState(initialOpen);
  const [query, setQuery] = useState(initialQuery);
  const [recent, setRecent] = useState(RECENT_DEFAULT);
  const [shell, setShell] = useState({ n: 0, page: 'platforms', leda: 'closed' as ShellProps['leda'] });
  const [sent, setSent] = useState<string | null>(null);

  useHotkeys({
    'mod+k': (e) => {
      e.preventDefault();
      setOpen((o) => !o);
    },
  });

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <div
      className="contents"
      onClickCapture={(e) => {
        if ((e.target as Element).closest('[aria-label="Search, Ctrl K"]')) setOpen(true);
      }}
    >
      <Shell key={shell.n} theme={theme} role={role} initialPage={shell.page} leda={shell.leda}>
        {sent && (
          <p className="mb-3 flex items-center gap-2 text-sm text-ink-muted">
            <Badge tone="primary" size="sm">
              Sent to Leda
            </Badge>
            <span className="min-w-0 truncate">{sent}</span>
          </p>
        )}
        <SamplePage role={role} />
      </Shell>
      <QuickSwitcher
        open={open}
        onOpenChange={(o) => (o ? setOpen(true) : close())}
        query={query}
        onQueryChange={setQuery}
        loading={loading}
        recent={recent}
        onSelectItem={(item) => {
          setRecent((r) => [item.id, ...r.filter((id) => id !== item.id)].slice(0, 3));
          setShell((s) => ({ n: s.n + 1, page: item.page, leda: 'closed' }));
          setSent(null);
          close();
        }}
        onAskLeda={(q) => {
          setShell((s) => ({ ...s, n: s.n + 1, leda: 'empty' }));
          setSent(q || null);
          close();
        }}
      />
    </div>
  );
}
