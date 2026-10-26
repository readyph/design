import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { Database, FolderOpen, Funnel, ListBullets, Lock, LockSimple, MagnifyingGlass, PencilSimpleLine, Plus, SquaresFour, ToggleLeft, ToggleRight, X } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { ErrorBlock } from './ErrorBlock';
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, useListCursor } from './List';
import { Select, type SelectOption } from './Select';
import { SegmentedControl, type SegmentOption } from './SegmentedControl';
import { Skeleton } from './Skeleton';
import { Switch } from './Switch';

export type TopicFilter = 'all' | 'on' | 'off' | 'custom' | 'data';
export type TopicLayout = 'list' | 'grid';

export interface TopicItem {
  id: string;
  title: string;
  /** The topic's paragraph. Clamped to two lines in the list, three in a tile. */
  lines: string;
  /** Source label: "From Auto Works data", "Custom". */
  source: string;
  /** Picks the source icon. Default `data`. */
  sourceKind?: 'data' | 'custom';
  /** Shown as the Folder column / tile footer. Leave out inside a single folder. */
  folder?: { label: string; logo?: ReactNode };
  /** Off by default (sensitive): shows a lock icon named "off by default". */
  locked?: boolean;
  /** Why it is locked, as a tooltip: "Off by default. Prices and payment details." */
  lockNote?: string;
  /** Customers' Leda may use it. */
  on: boolean;
  /** Where the title link goes. Default `#<id>`. */
  href?: string;
}

export interface TopicCounts {
  all: number;
  on: number;
  off: number;
  custom: number;
  data: number;
}

export interface TopicLibraryProps {
  /** The topics to show, already filtered by business, filter and search by the page. */
  topics: TopicItem[];
  /** Counts for the filter segments (over the business and search, before the filter). */
  counts: TopicCounts;
  filter?: TopicFilter;
  onFilterChange?: (filter: TopicFilter) => void;
  /** Business filter (C14) options, e.g. All businesses, Company, each platform with its logo. Hidden when empty. */
  businesses?: SelectOption[];
  business?: string;
  onBusinessChange?: (value: string) => void;
  /** The folder's name for the empty copy ("No topics in Auto Works yet"). */
  folderLabel?: string;
  /** Committed search text; matches are marked. */
  query?: string;
  /** Called 200ms after typing stops, on Enter at once, and on Clear. */
  onQueryChange?: (query: string) => void;
  /** Layout, kept by the page (see `useTopicLayout`). */
  layout?: TopicLayout;
  onLayoutChange?: (layout: TopicLayout) => void;
  /** A switch changed. The page saves it, then calls `toast.undo(...)`. */
  onToggle?: (topic: TopicItem, next: boolean) => void;
  /** "Turn all on / off" pressed; `next` is the state asked for. The page asks first (ConfirmDialog), saves and offers Undo. */
  onToggleAll?: (next: boolean) => void;
  /** Every topic in the folder is on: the button reads "Turn all off". */
  allOn?: boolean;
  onNew?: () => void;
  /** Open a topic without a page load. Plain left click and Enter on the cursor row. Default: follow `href`. */
  onOpen?: (topic: TopicItem) => void;
  /** Switches are disabled, with `readOnlyNote` shown above the list; Turn all and New topic are hidden. */
  readOnly?: boolean;
  readOnlyNote?: ReactNode;
  loading?: boolean;
  /** The topics failed to load: shows the inline error with Try again. */
  error?: boolean;
  onRetry?: () => void;
  /** j / k / Enter cursor over the rows or tiles. Default true. Leave on for the page's main list only. */
  shortcuts?: boolean;
  /** Heading level of the empty-state titles. Default 3 (under the page h1 and a section h2). */
  emptyHeadingLevel?: 2 | 3 | 4;
  className?: string;
}

const FILTERS: Array<{ value: TopicFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
  { value: 'custom', label: 'Custom' },
  { value: 'data', label: 'From data' },
];

const FILTER_WORD: Record<TopicFilter, string> = { all: '', on: 'on', off: 'off', custom: 'custom', data: 'from data' };

const COLS_FOLDER = 'minmax(0,1fr) 128px 168px 96px';
const COLS_PLAIN = 'minmax(0,1fr) 168px 96px';

/* ---------- storage ---------- */

export const TOPIC_LAYOUT_KEY = 'rph-mem-layout';

/**
 * The viewer's list / grid choice, kept in `localStorage` under `rph-mem-layout`. Read after mount (so server and
 * first client render agree on `list`) and wrapped in try/catch: with storage blocked it still works for the session.
 */
export function useTopicLayout(storageKey: string = TOPIC_LAYOUT_KEY, initial: TopicLayout = 'list'): [TopicLayout, (layout: TopicLayout) => void] {
  const [layout, setLayout] = useState<TopicLayout>(initial);
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(storageKey);
      if (v === 'list' || v === 'grid') setLayout(v);
    } catch {
      /* storage blocked: keep the default */
    }
  }, [storageKey]);
  const set = useCallback(
    (next: TopicLayout) => {
      setLayout(next);
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        /* storage blocked: the choice lasts for this visit only */
      }
    },
    [storageKey],
  );
  return [layout, set];
}

/* ---------- search highlight ---------- */

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A global, case-insensitive matcher for the query, or null. The query is escaped, so "a.c" never matches "abc". */
export function topicMatcher(query: string): RegExp | null {
  const q = query.trim();
  return q ? new RegExp(`(${escapeRe(q)})`, 'gi') : null;
}

function Marked({ text, re }: { text: string; re: RegExp | null }) {
  if (!re) return <>{text}</>;
  // `split` with one capture group puts every match at an odd index. Text goes in as React children, never as HTML.
  const parts = text.split(re);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-chip bg-accent-tint px-0.5 font-semibold text-text underline decoration-accent decoration-2 underline-offset-2">
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}

/* ---------- row and tile ---------- */

interface Handlers {
  toggle: (topic: TopicItem, next: boolean, index: number) => void;
  open: (topic: TopicItem, e: ReactMouseEvent<HTMLAnchorElement>) => void;
}

function LockMark({ topic }: { topic: TopicItem }) {
  if (!topic.locked) return null;
  return (
    <span className="inline-flex shrink-0 items-center text-muted" title={topic.lockNote ?? 'Off by default'}>
      <LockSimple aria-hidden size={13} weight="bold" />
      <span className="sr-only">, off by default{topic.lockNote ? `. ${topic.lockNote}` : ''}</span>
    </span>
  );
}

function SourceMark({ topic }: { topic: TopicItem }) {
  const Ic = topic.sourceKind === 'custom' ? PencilSimpleLine : Database;
  return (
    <span className="flex w-full min-w-0 max-w-full items-center gap-1.5 text-ui text-muted">
      <Ic aria-hidden size={14} className="shrink-0" />
      <span className="min-w-0 truncate">{topic.source}</span>
    </span>
  );
}

function FolderMark({ topic }: { topic: TopicItem }) {
  if (!topic.folder) return null;
  return (
    <span className="flex w-full min-w-0 max-w-full items-center gap-1.5 text-ui text-muted">
      {topic.folder.logo ? <span className="inline-flex shrink-0">{topic.folder.logo}</span> : null}
      <span className="min-w-0 truncate">{topic.folder.label}</span>
    </span>
  );
}

/** The switch is its own control. The row (or tile) is not a label: it links to the topic. */
function TopicSwitch({ topic, index, readOnly, h }: { topic: TopicItem; index: number; readOnly: boolean; h: Handlers }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="min-w-[22px] text-right text-ui text-muted">
        {topic.on ? 'On' : 'Off'}
      </span>
      <Switch
        checked={topic.on}
        disabled={readOnly}
        aria-label={`Customers' Leda can use ${topic.title}`}
        className="max-[640px]:before:absolute max-[640px]:before:-inset-x-[6px] max-[640px]:before:-inset-y-[13px] max-[640px]:before:content-['']"
        onCheckedChange={(next) => h.toggle(topic, next, index)}
      />
    </span>
  );
}

/*
 * Focus is "lost" only when nothing sensible holds it: no element, the body, a node that left the document, a
 * disabled control, or anything inside an `[inert]` subtree. Anywhere else the user chose it, so we never move it.
 * Same rule as the shared `focusIfLost` (RDY-269); kept as one small function here so it can be swapped for it.
 */
function focusIsLost(): boolean {
  let a: Element | null = document.activeElement;
  // Follow open shadow roots; when a root has no active element, keep the host (document.activeElement).
  while (a && (a as HTMLElement).shadowRoot) {
    const inner: Element | null = (a as HTMLElement).shadowRoot!.activeElement;
    if (!inner) break;
    a = inner;
  }
  if (!a || a === document.body || a === document.documentElement || !a.isConnected) return true;
  return a.matches(':disabled') || !!a.closest('[inert]');
}

const linkClass = cn('group/link block min-w-0 rounded-chip text-left', focusRing);

const TopicRow = memo(function TopicRow({
  topic,
  index,
  re,
  showFolder,
  readOnly,
  h,
}: {
  topic: TopicItem;
  index: number;
  re: RegExp | null;
  showFolder: boolean;
  readOnly: boolean;
  h: Handlers;
}) {
  const ref = useRef<HTMLElement | null>(null);
  return (
    <ListRow
      ref={ref}
      rowId={topic.id}
      label={topic.title}
      dimmed={!topic.on}
      className="items-center"
      onActivate={() => ref.current?.querySelector<HTMLAnchorElement>('a[data-topic-link]')?.click()}
    >
      <ListCell kind="lead">
        <a href={topic.href ?? `#${topic.id}`} data-topic-link onClick={(e) => h.open(topic, e)} className={linkClass}>
          <span className="flex min-w-0 items-center gap-1.5 text-body font-medium">
            <span className="min-w-0 truncate group-hover/link:underline group-hover/link:underline-offset-4">
              <Marked text={topic.title} re={re} />
            </span>
            <LockMark topic={topic} />
          </span>
          <span className="mt-0.5 line-clamp-2 text-ui text-muted">
            <Marked text={topic.lines} re={re} />
          </span>
        </a>
      </ListCell>
      {showFolder ? (
        <ListCell kind="body" flush>
          <FolderMark topic={topic} />
        </ListCell>
      ) : null}
      <ListCell kind="body" flush>
        <SourceMark topic={topic} />
      </ListCell>
      <ListCell kind="actions">
        <TopicSwitch topic={topic} index={index} readOnly={readOnly} h={h} />
      </ListCell>
    </ListRow>
  );
});

const TopicTile = memo(function TopicTile({
  topic,
  index,
  re,
  showFolder,
  readOnly,
  current,
  h,
  onPoint,
}: {
  topic: TopicItem;
  index: number;
  re: RegExp | null;
  showFolder: boolean;
  readOnly: boolean;
  current: boolean;
  h: Handlers;
  onPoint: (id: string) => void;
}) {
  return (
    <li
      data-row-id={topic.id}
      data-row-label={topic.title}
      data-current={current ? 'true' : undefined}
      aria-current={current ? 'true' : undefined}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('button,a[href],[role="switch"]')) onPoint(topic.id);
      }}
      className={cn(
        'flex min-h-44 min-w-0 flex-col rounded-card bg-raised transition-colors duration-hover hover:bg-raised-2 motion-reduce:transition-none',
        'data-[current=true]:shadow-[inset_0_0_0_2px_var(--accent)] data-[current=true]:forced-colors:outline data-[current=true]:forced-colors:outline-2 data-[current=true]:forced-colors:-outline-offset-2',
        topic.on ? 'text-text' : 'text-muted',
      )}
    >
      <a
        href={topic.href ?? `#${topic.id}`}
        data-topic-link
        onClick={(e) => {
          onPoint(topic.id);
          h.open(topic, e);
        }}
        className={cn(linkClass, 'flex flex-1 flex-col gap-1.5 rounded-b-none px-3.5 pb-2.5 pt-3.5')}
      >
        <SourceMark topic={topic} />
        <span className="flex min-w-0 items-start gap-1.5 text-body font-medium">
          <span className="line-clamp-2 min-w-0 [overflow-wrap:anywhere] group-hover/link:underline group-hover/link:underline-offset-4">
            <Marked text={topic.title} re={re} />
          </span>
          <LockMark topic={topic} />
        </span>
        <span className="line-clamp-3 text-ui text-muted">
          <Marked text={topic.lines} re={re} />
        </span>
      </a>
      <div className="flex min-w-0 items-center gap-2 px-3.5 pb-3 pt-2">
        {showFolder ? <FolderMark topic={topic} /> : null}
        <span className="ml-auto">
          <TopicSwitch topic={topic} index={index} readOnly={readOnly} h={h} />
        </span>
      </div>
    </li>
  );
});

/* ---------- component ---------- */

/**
 * Topic library (C27): what customers' Leda knows, as a list or a grid. A toolbar (business filter, filters with
 * counts, search, list / grid toggle, Turn all on / off, New topic) over ruled square rows (default) or flat tiles
 * on `--raised`. States: search matches marked, empty folder, no match, empty filter, read only, loading, error.
 *
 * The component only emits: the page filters `topics`, saves a switch, asks before a bulk change and shows the
 * Undo toast. It owns ONE j / k / Enter cursor for the rows or tiles (the cursor row survives a layout change), and
 * does not register `/` (the Ask Leda bar owns it). A switch is its own control inside a row that links to the
 * topic, so the row is not a label.
 */
export function TopicLibrary({
  topics,
  counts,
  filter = 'all',
  onFilterChange,
  businesses,
  business,
  onBusinessChange,
  folderLabel,
  query = '',
  onQueryChange,
  layout = 'list',
  onLayoutChange,
  onToggle,
  onToggleAll,
  allOn = false,
  onNew,
  onOpen,
  readOnly = false,
  readOnlyNote = 'Only owners, admins and managers can change these. Ask one of them to turn a topic on or off.',
  loading = false,
  error = false,
  onRetry,
  shortcuts = true,
  emptyHeadingLevel = 3,
  className,
}: TopicLibraryProps) {
  const uid = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const { current, moveCursor, announce, say } = useListCursor(rootRef, { shortcuts: shortcuts && !loading && !error });

  /* ----- stable handlers, so memoised rows do not re-render when the page does ----- */
  const live = useRef({ onToggle, onOpen });
  live.current = { onToggle, onOpen };
  const pending = useRef<{ id: string; index: number } | null>(null);
  const h = useMemo<Handlers>(
    () => ({
      toggle: (topic, next, index) => {
        pending.current = { id: topic.id, index };
        live.current.onToggle?.(topic, next);
      },
      open: (topic, e) => {
        const fn = live.current.onOpen;
        if (!fn || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        fn(topic);
      },
    }),
    [],
  );

  /* ----- keep focus when a switch removes its own row from the shown set (filter On / Off) ----- */
  useLayoutEffect(() => {
    const p = pending.current;
    pending.current = null;
    const root = rootRef.current;
    if (!p || !root) return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-row-id]'));
    // The toggled row is still shown: nothing to repair, and the intent must not outlive this update.
    if (!rows.length || rows.some((r) => r.dataset.rowId === p.id)) return;
    // The row left the shown set. Move focus only if it was lost with it; never pull it back from elsewhere.
    if (!focusIsLost()) return;
    rows[Math.min(p.index, rows.length - 1)].querySelector<HTMLElement>('[role="switch"]')?.focus();
  }, [topics]);

  /* ----- search: debounced, highlight from the committed query ----- */
  const [text, setText] = useState(query);
  const queryRef = useRef(query);
  queryRef.current = query;
  const emitRef = useRef(onQueryChange);
  emitRef.current = onQueryChange;
  useEffect(() => {
    setText(query);
  }, [query]);
  useEffect(() => {
    if (text === queryRef.current) return;
    const t = window.setTimeout(() => emitRef.current?.(text), 200);
    return () => window.clearTimeout(t);
  }, [text]);
  const clearSearch = () => {
    setText('');
    emitRef.current?.('');
    searchRef.current?.focus();
  };
  const onSearchKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return; // an IME is composing: Enter and Esc belong to it
    if (e.key === 'Enter') {
      e.preventDefault();
      if (text !== queryRef.current) emitRef.current?.(text);
    } else if (e.key === 'Escape' && text) {
      e.preventDefault();
      clearSearch();
    }
  };
  const re = useMemo(() => topicMatcher(query), [query]);

  /* ----- one announcement when the result set changes by search, filter, business or layout (not by a switch) ----- */
  const first = useRef(true);
  const shownRef = useRef(topics.length);
  shownRef.current = topics.length;
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const n = shownRef.current;
    say(`${n} ${n === 1 ? 'topic' : 'topics'} shown, ${layout} view`);
  }, [query, filter, business, layout, say]);

  /* ----- derived ----- */
  const showFolder = topics.some((t) => t.folder);
  const filterOptions = useMemo<SegmentOption[]>(() => FILTERS.map((f) => ({ value: f.value, label: f.label, count: counts[f.value] })), [counts]);
  const filterSelect = useMemo<SelectOption[]>(
    () => FILTERS.map((f) => ({ value: f.value, label: f.value === 'all' ? 'Show all' : f.label, meta: String(counts[f.value]) })),
    [counts],
  );
  const layoutOptions = useMemo<SegmentOption[]>(
    () => [
      { value: 'list', label: <span className="sr-only">List</span>, icon: ListBullets },
      { value: 'grid', label: <span className="sr-only">Grid</span>, icon: SquaresFour },
    ],
    [],
  );
  const roId = `${uid}-ro`;
  const canEdit = !readOnly;
  const folderName = folderLabel ?? 'any folder';
  const newButton = onNew && canEdit ? (
    <Button leftIcon={Plus} onClick={onNew}>
      New topic
    </Button>
  ) : null;

  /* ----- body ----- */
  let body: ReactNode;
  if (error) {
    body = <ErrorBlock thing="topics" onRetry={onRetry} />;
  } else if (loading) {
    body = (
      <div aria-busy="true">
        <p role="status" className="sr-only">
          Loading topics
        </p>
        {layout === 'grid' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3" aria-hidden>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex min-h-44 flex-col gap-2 rounded-card bg-raised p-3.5">
                <Skeleton variant="text" width="30%" className="h-3" />
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" lines={3} className="mt-1" />
              </div>
            ))}
          </div>
        ) : (
          <div aria-hidden>
            <div className="border-b border-control pb-2">
              <Skeleton variant="text" width={80} className="h-3" />
            </div>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-start gap-6 border-b border-rule py-row-y">
                <div className="min-w-0 flex-1">
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="85%" className="mt-2 h-3" />
                </div>
                <Skeleton variant="text" width={96} className="h-3 max-[600px]:hidden" />
                <Skeleton variant="rect" width={56} height={20} className="rounded-full" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } else if (topics.length === 0) {
    const box = 'max-w-[600px] rounded-card bg-raised';
    if (query.trim()) {
      body = (
        <EmptyState
          align="start"
          headingLevel={emptyHeadingLevel}
          icon={MagnifyingGlass}
          className={box}
          title={`No topics match “${query.trim()}”${filter !== 'all' ? ` in ${FILTER_WORD[filter]}` : ''}`}
          description="Search looks at the titles and paragraphs in every folder. Try a shorter word, or write it as a new topic."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" leftIcon={X} onClick={clearSearch}>
                Clear search
              </Button>
              {filter !== 'all' ? (
                <Button variant="text" onClick={() => onFilterChange?.('all')}>
                  Show all
                </Button>
              ) : null}
            </div>
          }
        />
      );
    } else if (filter !== 'all') {
      const copy: Record<Exclude<TopicFilter, 'all'>, [string, string]> = {
        on: [`Nothing is on in ${folderName}`, "Customers' Leda answers nothing from here."],
        off: [`Nothing is off in ${folderName}`, "Customers' Leda can use every topic here."],
        custom: [`No custom topics in ${folderName}`, 'Topics you write show here.'],
        data: [`No topics from data in ${folderName}`, "Topics written from a platform's data show here."],
      };
      body = (
        <EmptyState
          align="start"
          headingLevel={emptyHeadingLevel}
          icon={Funnel}
          className={box}
          title={copy[filter][0]}
          description={copy[filter][1]}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => onFilterChange?.('all')}>
                Show all
              </Button>
              {filter === 'custom' && onNew && canEdit ? (
                <Button variant="text" leftIcon={Plus} onClick={onNew}>
                  New topic
                </Button>
              ) : null}
            </div>
          }
        />
      );
    } else {
      body = (
        <EmptyState
          align="start"
          headingLevel={emptyHeadingLevel}
          icon={FolderOpen}
          className={box}
          title={`No topics in ${folderName} yet`}
          description="Write what customers often ask, like the warranty or where to park."
          action={newButton}
        />
      );
    }
  } else if (layout === 'grid') {
    body = (
      <ul aria-label="Topics" aria-describedby={readOnly ? roId : undefined} className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 p-0">
        {topics.map((t, i) => (
          <TopicTile key={t.id} topic={t} index={i} re={re} showFolder={showFolder} readOnly={readOnly} current={current === t.id} h={h} onPoint={moveCursor} />
        ))}
      </ul>
    );
  } else {
    body = (
      <List
        aria-label="Topics"
        aria-describedby={readOnly ? roId : undefined}
        columns={showFolder ? COLS_FOLDER : COLS_PLAIN}
        stackBelow={760}
        cursorId={current}
        onCursorChange={moveCursor}
        shortcuts={false}
      >
        <ListHeader>
          <ListHeaderCell>Topic</ListHeaderCell>
          {showFolder ? <ListHeaderCell>Folder</ListHeaderCell> : null}
          <ListHeaderCell>Source</ListHeaderCell>
          <ListHeaderCell className="text-right">For customers</ListHeaderCell>
        </ListHeader>
        {topics.map((t, i) => (
          <TopicRow key={t.id} topic={t} index={i} re={re} showFolder={showFolder} readOnly={readOnly} h={h} />
        ))}
      </List>
    );
  }

  const inert = loading || error;
  return (
    <div ref={rootRef} className={cn('@container/lib min-w-0', className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <div className="relative order-1 min-w-0 flex-1 basis-40 @min-[640px]/lib:max-w-[420px] @min-[640px]/lib:basis-60">
            <MagnifyingGlass aria-hidden size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              ref={searchRef}
              type="search"
              value={text}
              disabled={inert}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onSearchKey}
              aria-label="Search every folder"
              placeholder="Search every folder"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              className={cn(
                'h-[var(--ctl-dropdown-sm)] w-full min-w-0 rounded-control border border-control bg-surface pl-9 pr-9 text-ui text-text placeholder:text-muted max-sm:text-[16px]',
                '[&::-webkit-search-cancel-button]:hidden disabled:opacity-60',
                focusRing,
              )}
            />
            {text ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={clearSearch}
                className={cn('absolute right-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-chip text-muted hover:text-text max-sm:size-9', focusRing)}
              >
                <X aria-hidden size={14} />
              </button>
            ) : null}
          </div>
          <SegmentedControl
            size="md"
            aria-label="View as"
            options={layoutOptions}
            value={layout}
            onChange={(v) => onLayoutChange?.(v as TopicLayout)}
            className="order-2 shrink-0 max-[640px]:[&_button]:min-h-11 max-[640px]:[&_button]:min-w-11 @min-[640px]/lib:order-6 @min-[640px]/lib:ml-auto"
          />
          {!inert && (onToggleAll || newButton) && canEdit ? (
            <div className="order-3 ml-auto flex shrink-0 items-center gap-2 @min-[640px]/lib:order-2">
              {onToggleAll && topics.length > 0 ? (
                <Button variant="secondary" leftIcon={allOn ? ToggleLeft : ToggleRight} onClick={() => onToggleAll(!allOn)}>
                  {allOn ? 'Turn all off' : 'Turn all on'}
                </Button>
              ) : null}
              {newButton}
            </div>
          ) : null}
          <div aria-hidden className="hidden basis-full @min-[640px]/lib:order-3 @min-[640px]/lib:block" />
          {businesses && businesses.length > 0 ? (
            <div className="order-4 min-w-0 flex-1 basis-40 @min-[640px]/lib:w-52 @min-[640px]/lib:flex-none @min-[640px]/lib:basis-auto">
              <Select size="sm" aria-label="Business" options={businesses} value={business} onValueChange={onBusinessChange} className="w-full min-w-0" />
            </div>
          ) : null}
          <SegmentedControl
            size="md"
            aria-label="Show"
            options={filterOptions}
            value={filter}
            onChange={(v) => onFilterChange?.(v as TopicFilter)}
            className="order-5 hidden @min-[640px]/lib:inline-flex"
          />
          <div className="order-5 min-w-0 flex-1 basis-40 @min-[640px]/lib:hidden">
            <Select size="sm" aria-label="Show" options={filterSelect} value={filter} onValueChange={(v) => onFilterChange?.(v as TopicFilter)} className="w-full min-w-0" />
          </div>
      </div>

      {readOnly ? (
        <p id={roId} className="mt-3 flex items-start gap-2 text-ui text-muted">
          <Lock aria-hidden size={14} weight="bold" className="mt-0.5 shrink-0" />
          <span>{readOnlyNote}</span>
        </p>
      ) : null}

      {query.trim() && topics.length > 0 && !inert ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 text-ui text-muted">
          <span>
            {topics.length} {topics.length === 1 ? 'topic matches' : 'topics match'} “{query.trim()}”, in every folder.
          </span>
          <Button variant="text" className="h-7 px-1.5" onClick={clearSearch}>
            Clear
          </Button>
        </p>
      ) : null}

      <div className="mt-4">{body}</div>

      <span role="status" aria-live="polite" className="sr-only">
        {announce}
      </span>
    </div>
  );
}
