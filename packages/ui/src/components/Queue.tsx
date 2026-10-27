import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CaretDown, CaretRight, Check, CheckCircle, WarningCircle, X } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { LedaMark } from './Leda';
import { useListCursor } from './List';
import { Menu, type MenuItem } from './Menu';
import { PlatformLogo } from './PlatformLogo';
import { Skeleton } from './Skeleton';

/** The platform an item comes from. `id` is what the filter matches; the rest only draws the logo. */
export interface QueuePlatform {
  id: string;
  name: string;
  /** Uploaded logo URL; the monogram shows when absent. */
  src?: string;
  /** Position in platform order (1-based), picks the identity colour. */
  index?: number;
  /** Stored identity colour. Overrides `index`. */
  color?: string | number;
  /** HQ identity (team and plan items). */
  hq?: boolean;
  initials?: string;
}

interface QueueBase {
  /** Stable id. Used for the j / k cursor and every callback. */
  id: string;
  platform: QueuePlatform;
  /** Name drawn next to the logo when it is not the platform name, e.g. "HQ · Team". */
  source?: string;
  /** Short title, 8 words at most. */
  title: string;
}

/** One decision waiting for the owner. */
export interface QueueItem extends QueueBase {
  /** Due time, drawn right-aligned and never wrapped: "9:45", "Today 17:00". Omit when the item has none (the row then shows no time). */
  due?: string;
  /** Colour of the row's dot: `urgent` (red), `soon` (amber, due today), none (grey). Defaults to `urgent` when `urgent` is set. */
  severity?: 'urgent' | 'soon';
  /** Due soon: the time reads in the bad tone (and is announced as urgent). */
  urgent?: boolean;
  /** One line under the title. */
  detail?: string;
  /** Label of the one action button: "Order alternator", "Confirm PO". */
  action: string;
}
/** An item Leda follows without needing the owner. */
export interface QueueWatchItem extends QueueBase {
  detail?: string;
}
export interface QueueSnoozedItem extends QueueBase {
  /** "Later today · 13:00" */
  until: string;
}
export interface QueueDoneItem extends QueueBase {
  /** Time it was done: "9:12". */
  at: string;
}
export interface QueueError {
  platform: QueuePlatform;
  /** "9:10 AM" */
  lastLoaded?: string;
  retrying?: boolean;
}

export type QueueGroupKey = 'watching' | 'snoozed' | 'done';

export interface QueueProps {
  /** Open decisions, most urgent first. */
  items: QueueItem[];
  watching?: QueueWatchItem[];
  snoozed?: QueueSnoozedItem[];
  done?: QueueDoneItem[];
  /** Every platform the owner can filter by (including HQ). Defaults to the platforms found in the lists. */
  platforms?: QueuePlatform[];
  /** Show only this platform's items. `null` is all. Controlled. */
  filter?: string | null;
  defaultFilter?: string | null;
  onFilterChange?: (platformId: string | null) => void;
  /** Heading text. Default "Needs you". */
  title?: string;
  /** Leaves out the "Nothing open" empty state (a quiet day that still lists what Leda is watching). */
  hideEmpty?: boolean;
  /** Drops the rule above the pinned groups (the content above brings its own). */
  flushGroups?: boolean;
  /** Phone page: the groups follow the list 10px under it with no rule above and nothing below (the content under them brings its own rule). */
  tightGroups?: boolean;
  /** A line after the groups (a quiet day's "Next: ..." on a phone). */
  footer?: ReactNode;
  /** Heading level of the title (pinned groups sit one level below). Default 1. */
  headingLevel?: 1 | 2;
  /** Leda's one-line summary. Defaults to "4 decisions. First: …". */
  headline?: ReactNode;
  /** Skeleton rows instead of items. */
  loading?: boolean;
  /** Platforms that failed to load; the rest still shows. */
  errors?: QueueError[];
  onRetry?: (platformId: string) => void;
  /** Button text on each error block. Default "Try again". */
  retryLabel?: string;
  /** Under Leda's headline, above the list (e.g. the Leda ask bar on a phone). */
  belowHeadline?: ReactNode;
  /** Row click, Enter on the cursor row, or Enter on a pinned row. */
  onOpen?: (id: string) => void;
  /** The row's action button. */
  onAction?: (id: string) => void;
  /** The `s` key on the cursor row. Pick the snooze time in the caller (default "later today"). */
  onSnooze?: (id: string) => void;
  /** The pointer enters an item or leaves it (`null`), e.g. to light its building on the map. Hover only (handover C19); the j / k cursor does not fire it. To follow the keyboard cursor on the map, use `onCursorChange`. */
  onItemHover?: (id: string | null) => void;
  /** Cursor row (controlled). */
  cursorId?: string | null;
  defaultCursorId?: string | null;
  onCursorChange?: (id: string) => void;
  /** j / k / Enter / s on the page. Default true. Give any other list on the page `shortcuts={false}`: one component keeps them. */
  shortcuts?: boolean;
  /** Pinned groups that start open. Default none (one folded line each). */
  defaultOpenGroups?: QueueGroupKey[];
  className?: string;
}

const EDITABLE = 'input,textarea,select,[contenteditable]:not([contenteditable="false"])';
const INTERACTIVE = 'button,a[href],input,select,textarea,summary,[role="button"],[role="menuitem"],[role="menuitemradio"],[role="switch"],[role="checkbox"],[role="combobox"]';

const logo = (p: QueuePlatform, size: 16 | 18 = 16) => (
  <PlatformLogo decorative name={p.name} src={p.src} index={p.index} color={p.color} hq={p.hq} initials={p.initials} size={size} />
);
const sourceOf = (x: QueueBase) => x.source ?? x.platform.name;

/** Row surface: no hairline, 8px apart; hover on --frame-hover, the cursor row lifts to --surface with a border. */
const rowSurface =
  'relative rounded-card border border-transparent pb-[11px] pl-7 pr-3 pt-2.5 transition-colors duration-hover motion-reduce:transition-none ' +
  'hover:bg-frame-hover data-[current=true]:border-border data-[current=true]:bg-surface ' +
  // Phone: a flat row on the surface, 44px tall at least, the dot a little further in.
  'max-[640px]:min-h-11 max-[640px]:rounded-none max-[640px]:border-0 max-[640px]:py-3 max-[640px]:pl-8 max-[640px]:pr-4 max-[640px]:hover:bg-raised max-[640px]:data-[current=true]:bg-transparent ' +
  // Forced colors paint transparent borders: hide them on plain rows, mark the cursor row with Highlight.
  'forced-colors:border-[Canvas] forced-colors:data-[current=true]:border-[Highlight]';

interface RowProps {
  data: QueueBase;
  onOpen?: (id: string) => void;
  onHover?: (id: string | null) => void;
  moveCursor: (id: string) => void;
  children: ReactNode;
  /** Pinned rows that cannot be opened (Done today) take no cursor and no click. */
  inert?: boolean;
  current: boolean;
  className?: string;
}

/** A row wrapper: cursor id, click-to-open and the Enter relay from the cursor hook. */
function Row({ data, onOpen, onHover, moveCursor, children, inert = false, current, className }: RowProps) {
  const ref = useRef<HTMLLIElement>(null);
  const openRef = useRef(onOpen);
  openRef.current = onOpen;
  useEffect(() => {
    const el = ref.current;
    if (!el || inert) return;
    const h = () => openRef.current?.(data.id);
    el.addEventListener('list-activate', h);
    return () => el.removeEventListener('list-activate', h);
  }, [data.id, inert]);
  return (
    <li
      ref={ref}
      data-row-id={inert ? undefined : data.id}
      data-row-label={inert ? undefined : `${sourceOf(data)}, ${data.title}`}
      data-current={current ? 'true' : undefined}
      aria-current={current ? 'true' : undefined}
      onClick={
        inert
          ? undefined
          : (e) => {
              if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
              moveCursor(data.id);
              onOpen?.(data.id);
            }
      }
      onMouseEnter={inert ? undefined : () => onHover?.(data.id)}
      onMouseLeave={inert ? undefined : () => onHover?.(null)}
      className={cn(rowSurface, !inert && onOpen && 'cursor-pointer', className)}
    >
      {children}
    </li>
  );
}

/** Logo + name, with something right-aligned. */
function Source({ data, end, size = 18 }: { data: QueueBase; end?: ReactNode; size?: 16 | 18 }) {
  return (
    <div className="flex items-center gap-[7px] text-small leading-[18px] text-muted">
      {logo(data.platform, size)}
      <span className="min-w-0 truncate font-semibold text-text">{sourceOf(data)}</span>
      {end ? <span className="ml-auto shrink-0 whitespace-nowrap leading-4">{end}</span> : null}
    </div>
  );
}

type Dot = 'urgent' | 'soon' | 'watch' | 'none';
const dotCls: Record<Dot, string> = {
  urgent: 'bg-bad-dot',
  soon: 'bg-warn-dot',
  watch: 'border-[1.5px] border-warn-dot',
  none: 'bg-control',
};
/** The row's status dot (decorative: the due time and the button say the same in words). */
const SeverityDot = ({ kind }: { kind: Dot }) => (
  <span aria-hidden="true" className={cn('absolute left-3 top-4 size-[7px] rounded-full forced-colors:bg-[CanvasText] max-[640px]:left-4 max-[640px]:top-[17px]', dotCls[kind])} />
);

function OpenItem({ item, current, onOpen, onAction, onHover, moveCursor }: { item: QueueItem; current: boolean } & Pick<QueueProps, 'onOpen' | 'onAction'> & { onHover?: (id: string | null) => void; moveCursor: (id: string) => void }) {
  const titleId = useId();
  return (
    <Row data={item} current={current} onOpen={onOpen} onHover={onHover} moveCursor={moveCursor}>
      <SeverityDot kind={item.severity ?? (item.urgent ? 'urgent' : 'none')} />
      <Source
        data={item}
        end={
          item.due ? (
            <span className={cn('tabular-nums', item.urgent && 'font-medium text-bad')}>
              {item.urgent ? <span className="sr-only">Urgent, due </span> : <span className="sr-only">Due </span>}
              {item.due}
            </span>
          ) : undefined
        }
      />
      <p id={titleId} className="m-0 mt-[3px] text-body font-semibold leading-5 text-text [overflow-wrap:anywhere]">
        {item.title}
      </p>
      <div className="mt-0.5 flex items-center gap-2.5 text-ui leading-[18px] text-muted">
        {item.detail ? <p className="m-0 min-w-0 flex-1 [overflow-wrap:anywhere] max-[640px]:whitespace-normal">{item.detail}</p> : <span className="flex-1" />}
        <Button
          variant={current ? 'primary' : 'secondary'}
          aria-describedby={titleId}
          onClick={() => onAction?.(item.id)}
          className="ml-auto !h-7 !min-h-0 max-w-full shrink-0 whitespace-normal !px-2.5 !py-0 !text-small text-left max-[960px]:!px-2 max-[640px]:!h-9 max-[640px]:!px-3 max-[640px]:!text-ui"
        >
          {item.action}
        </Button>
      </div>
    </Row>
  );
}

const GROUP_TITLE: Record<QueueGroupKey, string> = { watching: 'Leda is watching', snoozed: 'Snoozed', done: 'Done today' };

function PinnedGroup({
  kind,
  count,
  level,
  open,
  onToggle,
  children,
}: {
  kind: QueueGroupKey;
  count: number;
  level: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const uid = useId();
  const Heading = `h${level}` as 'h2';
  return (
    <div role="group" aria-labelledby={`${uid}-t`}>
      <Heading id={`${uid}-t`} className="m-0 text-ui font-normal text-muted">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${uid}-b`}
          onClick={onToggle}
          className={cn(
            'flex h-9 w-full items-center gap-2 rounded-card px-3 text-left text-ui text-muted transition-colors duration-hover hover:bg-frame-hover hover:text-text motion-reduce:transition-none max-[640px]:h-11 max-[640px]:rounded-none max-[640px]:px-4',
            focusRing,
          )}
        >
          <CaretRight
            size={12}
            aria-hidden
            className={cn('shrink-0 transition-transform duration-150 motion-reduce:transition-none', open && 'rotate-90')}
          />
          {kind === 'watching' ? <LedaMark size={14} decorative /> : null}
          <span className="min-w-0 font-semibold text-text">{GROUP_TITLE[kind]}</span>
          <span className="ml-auto shrink-0 tabular-nums">{count}</span>
        </button>
      </Heading>
      <div id={`${uid}-b`} hidden={!open}>
        {open ? children : null}
      </div>
    </div>
  );
}

/**
 * Queue "Needs you" (C19, RDY-279): the owner's decisions across every platform, one place to clear them.
 * Header (title, filled count, platform filter), Leda's one-line headline, a scrolling list with a bottom fade, then
 * three pinned groups folded to one line each (Leda is watching, Snoozed, Done today).
 *
 * Keys on the page: j / k move the cursor, Enter opens the cursor row, s snoozes it. They never fire while typing,
 * or inside a dialog or menu. ONE component per page keeps them: Queue uses the same cursor as `List` / `ListGroups`,
 * so give any other list on the page `shortcuts={false}`.
 *
 * Fills the height its parent gives it (the list scrolls inside, the scroll never chains to the page). In a parent
 * with no fixed height it simply grows. Items are a list with `aria-current` on the cursor row, not a listbox: each
 * row holds a real action button, which a listbox option may not contain.
 */
export const Queue = forwardRef<HTMLDivElement, QueueProps>(function Queue(
  {
    items,
    watching = [],
    snoozed = [],
    done = [],
    platforms,
    filter,
    defaultFilter = null,
    onFilterChange,
    title = 'Needs you',
    hideEmpty = false,
    flushGroups = false,
    tightGroups = false,
    footer,
    headingLevel = 1,
    headline,
    loading = false,
    errors = [],
    onRetry,
    retryLabel,
    belowHeadline,
    onOpen,
    onAction,
    onSnooze,
    onItemHover,
    cursorId,
    defaultCursorId = null,
    onCursorChange,
    shortcuts = true,
    defaultOpenGroups = [],
    className,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [innerFilter, setInnerFilter] = useState<string | null>(defaultFilter);
  const activeFilter = filter !== undefined ? filter : innerFilter;
  const [open, setOpen] = useState<Set<QueueGroupKey>>(() => new Set(defaultOpenGroups));
  const [more, setMore] = useState(false);
    const { current, moveCursor, announce, say } = useListCursor(rootRef, { shortcuts, cursorId, defaultCursorId, onCursorChange });

  const setFilter = (id: string | null) => {
    if (filter === undefined) setInnerFilter(id);
    onFilterChange?.(id);
  };

  const known = useMemo(() => {
    if (platforms) return platforms;
    const seen = new Map<string, QueuePlatform>();
    for (const x of [...items, ...watching, ...snoozed, ...done]) if (!seen.has(x.platform.id)) seen.set(x.platform.id, x.platform);
    return [...seen.values()];
  }, [platforms, items, watching, snoozed, done]);
  const filterPlatform = activeFilter ? known.find((p) => p.id === activeFilter) : undefined;
  const keep = <T extends QueueBase>(xs: T[]) => (activeFilter ? xs.filter((x) => x.platform.id === activeFilter) : xs);
  const vItems = keep(items);
  const vWatching = keep(watching);
  const vSnoozed = keep(snoozed);
  const vDone = keep(done);
  const vErrors = activeFilter ? errors.filter((e) => e.platform.id === activeFilter) : errors;
  const count = vItems.length;

  const summary =
    headline ??
    (count === 0
      ? activeFilter
        ? 'Nothing to decide here.'
        : 'Nothing open.'
      : `${count} ${count === 1 ? 'decision' : 'decisions'}${activeFilter ? ' here' : ''}. First: ${vItems[0].title}.`);

  // The bottom fade shows only while more is below; it is a mask on the scroller, so it works on any surface.
  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
  }, []);
  useLayoutEffect(measure, [measure, vItems.length, loading, vErrors.length]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  // `s` snoozes the cursor row. Same guards as j / k: never while typing, never under a dialog or menu.
  const sayRef = useRef(say);
  sayRef.current = say;
  const snoozeRef = useRef({ onSnooze, current, vItems });
  snoozeRef.current = { onSnooze, current, vItems };
  useEffect(() => {
    if (!shortcuts) return;
    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current;
      if (e.key !== 's' || !root || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const t = e.target instanceof HTMLElement ? e.target : null;
      if (t) {
        if (t.closest(EDITABLE)) return;
        const layer = t.closest('[role="dialog"],[role="menu"],[role="listbox"]');
        if (layer && !layer.contains(root)) return;
      }
      const s = snoozeRef.current;
      const item = s.current == null ? undefined : s.vItems.find((i) => i.id === s.current);
      if (!item || !s.onSnooze) return;
      e.preventDefault();
      s.onSnooze(item.id);
      sayRef.current(`Snooze asked for ${item.title}`);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shortcuts]);

  // When the cursor row leaves the open list (snoozed, done), the cursor takes the item now at that index.
  const prevOpen = useRef<{ ids: string[]; filter: string | null }>({ ids: vItems.map((i) => i.id), filter: activeFilter });
  useEffect(() => {
    const prev = prevOpen.current;
    const ids = vItems.map((i) => i.id);
    prevOpen.current = { ids, filter: activeFilter };
    if (prev.filter !== activeFilter || current == null || ids.includes(current)) return;
    const at = prev.ids.indexOf(current);
    if (at < 0 || !ids.length) return;
    moveCursor(ids[Math.min(at, ids.length - 1)]);
  }, [vItems.map((i) => i.id).join('|'), activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (k: QueueGroupKey) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const filterItems: MenuItem[] = [
    { type: 'radio', value: '', label: 'All platforms', checked: !activeFilter, meta: items.length || undefined, onSelect: () => setFilter(null) },
    ...known.map(
      (p): MenuItem => ({
        type: 'radio',
        value: p.id,
        checked: activeFilter === p.id,
        meta: items.filter((i) => i.platform.id === p.id).length || undefined,
        onSelect: () => setFilter(p.id),
        label: (
          <span className="inline-flex min-w-0 items-center gap-2">
            {logo(p)}
            <span className="[overflow-wrap:anywhere]">{p.hq ? `${p.name} · team and plan` : p.name}</span>
          </span>
        ),
      }),
    ),
  ];

  const Title = `h${headingLevel}` as 'h1';
  const pinnedLevel = headingLevel + 1;
  const isEmpty = !loading && count === 0;
  const rowProps = { moveCursor, onHover: onItemHover, onOpen };
  const hasPinned = vWatching.length + vSnoozed.length + vDone.length > 0;

  return (
    <div
      ref={(el) => {
        rootRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      className={cn('h-full min-h-0 min-w-0', className)}
    >
      {/* Layout lives on this inner box so a caller's className cannot change the column. */}
      <div className="flex h-full min-h-0 min-w-0 flex-col text-text">
        <header className="shrink-0 pb-2.5 pl-3 pr-1 pt-3 max-[640px]:px-4 max-[640px]:pb-3 max-[640px]:pt-4">
          <div className="flex items-center gap-x-2.5">
            <Title className="m-0 min-w-0 text-title text-text">{title}</Title>
            {!loading && count > 0 ? (
              <span className="inline-flex h-6 min-w-[26px] shrink-0 items-center justify-center rounded-control bg-accent px-[7px] text-body font-semibold tabular-nums text-accent-ink">
                {count}
                <span className="sr-only"> open</span>
              </span>
            ) : null}
            <div className="ml-auto flex min-w-0 items-center gap-1">
              {filterPlatform ? (
                <span className="inline-flex h-7 w-max max-w-full items-center gap-1.5 rounded-chip bg-frame-active py-[3px] pl-2 pr-1 text-ui text-text">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    {logo(filterPlatform)}
                    <span className="min-w-0 [overflow-wrap:anywhere]">{`${filterPlatform.hq ? `${filterPlatform.name} · team and plan` : filterPlatform.name} only`}</span>
                  </span>
                  <button
                    type="button"
                    aria-label="Show all platforms"
                    title="Show all platforms"
                    onClick={() => setFilter(null)}
                    className={cn(
                      'grid size-5 shrink-0 place-items-center rounded-[3px] text-muted transition-colors duration-hover hover:bg-frame-hover hover:text-text motion-reduce:transition-none',
                      focusRing,
                    )}
                  >
                    <X size={12} aria-hidden />
                  </button>
                </span>
              ) : (
                <Menu
                  align="end"
                  trigger={
                    <button
                      type="button"
                      className={cn(
                        'inline-flex h-7 min-w-0 items-center gap-1.5 rounded-control px-2 text-ui font-normal text-muted transition-colors duration-hover hover:bg-frame-hover hover:text-text motion-reduce:transition-none aria-expanded:bg-frame-hover aria-expanded:text-text max-[640px]:h-9',
                        focusRing,
                      )}
                    >
                      <span className="min-w-0 [overflow-wrap:anywhere]">All platforms</span>
                      <span className="sr-only">, filter by platform</span>
                      <CaretDown size={12} aria-hidden className="shrink-0" />
                    </button>
                  }
                  items={filterItems}
                />
              )}
            </div>
          </div>
          <p className="m-0 mt-1.5 flex items-start gap-2 text-body leading-5 text-text">
            <span className="mt-0.5 shrink-0">
              <LedaMark size={16} decorative />
            </span>
            <span className="min-w-0 [overflow-wrap:anywhere]">{loading ? 'Looking at your platforms…' : summary}</span>
          </p>
          {belowHeadline ? <div className="mt-3">{belowHeadline}</div> : null}
        </header>

        <div
          ref={scrollRef}
          onScroll={measure}
          aria-busy={loading || undefined}
          data-more={more ? 'true' : undefined}
          className={cn(
            // While loading the skeletons are not focusable, so the box must not scroll (axe scrollable-region-focusable).
            'min-h-0 flex-initial overscroll-contain scroll-pb-8 px-0 pt-0',
            hideEmpty && isEmpty ? 'pb-0' : tightGroups && hasPinned ? 'pb-1.5' : 'pb-3',
            loading ? 'overflow-hidden' : 'overflow-y-auto',
            'data-[more=true]:[mask-image:linear-gradient(to_bottom,#000_calc(100%-28px),transparent)]',
          )}
        >
          {vErrors.length ? (
            <div className="flex flex-col">
              {vErrors.map((e) => (
                <p
                  key={e.platform.id}
                  role="alert"
                  className="m-0 mb-2.5 ml-3 mr-1 flex items-center gap-2 rounded-card bg-surface px-2.5 py-2 text-small leading-4 text-text max-[640px]:mx-4 max-[640px]:bg-raised"
                >
                  <WarningCircle size={14} aria-hidden className="shrink-0 text-bad" />
                  <span className="min-w-0">
                    {e.platform.name} didn’t load{e.lastLoaded ? ` · last good ${e.lastLoaded}` : ''}
                  </span>
                  {onRetry ? (
                    <button type="button" disabled={e.retrying} onClick={() => onRetry(e.platform.id)} className={cn('ml-auto shrink-0 rounded-chip font-medium text-text underline', focusRing)}>
                      {retryLabel ?? 'Try again'}
                    </button>
                  ) : null}
                </p>
              ))}
            </div>
          ) : null}
          {loading ? (
            <div role="status" className="flex flex-col gap-2">
              <span className="sr-only">Loading {title}</span>
              {[0, 1, 2].map((i) => (
                <div key={i} aria-hidden className="rounded-card px-3 py-2.5">
                  <Skeleton variant="text" className="w-2/5" />
                  <Skeleton variant="text" className="mt-2 w-4/5" />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <Skeleton variant="text" className="w-1/2" />
                    <Skeleton variant="rect" className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            vErrors.length || hideEmpty ? null : (
              <EmptyState
                align="start"
                icon={CheckCircle}
                title={activeFilter ? 'Nothing to decide here.' : 'Nothing open'}
                description={activeFilter ? 'Leda will add anything that needs you.' : 'Leda will add it here when something needs you.'}
                action={
                  activeFilter ? (
                    <Button variant="secondary" onClick={() => setFilter(null)}>
                      Show all platforms
                    </Button>
                  ) : undefined
                }
                className="px-3"
              />
            )
          ) : (
            <ul aria-label={title} className="m-0 flex list-none flex-col gap-2 p-0">
              {vItems.map((item) => (
                <OpenItem key={item.id} item={item} current={current === item.id} onAction={onAction} {...rowProps} />
              ))}
            </ul>
          )}
        </div>

        {hasPinned ? (
          <div className={cn('flex max-h-[45%] shrink-0 flex-col gap-2.5 overflow-y-auto overscroll-contain pt-1', tightGroups ? 'pb-0' : 'pb-2.5', !flushGroups && !tightGroups && 'border-t border-rule')}>
            {vWatching.length ? (
              <PinnedGroup kind="watching" count={vWatching.length} level={pinnedLevel} open={open.has('watching')} onToggle={() => toggle('watching')}>
                <ul className="m-0 flex list-none flex-col gap-2 p-0 pb-1">
                  {vWatching.map((w) => (
                    <Row key={w.id} data={w} current={current === w.id} className="pb-[9px] pt-2" {...rowProps}>
                      <SeverityDot kind="watch" />
                      <Source data={w} />
                      <p className="m-0 mt-[3px] text-body font-medium leading-5 text-text [overflow-wrap:anywhere]">{w.title}</p>
                      {w.detail ? <p className="m-0 mt-0.5 text-ui leading-[18px] text-muted [overflow-wrap:anywhere]">{w.detail}</p> : null}
                    </Row>
                  ))}
                </ul>
              </PinnedGroup>
            ) : null}
            {vSnoozed.length ? (
              <PinnedGroup kind="snoozed" count={vSnoozed.length} level={pinnedLevel} open={open.has('snoozed')} onToggle={() => toggle('snoozed')}>
                <ul className="m-0 flex list-none flex-col gap-1 p-0 pb-1">
                  {vSnoozed.map((s) => (
                    <Row key={s.id} data={s} current={current === s.id} className="pb-[9px] pt-2" {...rowProps}>
                      <SeverityDot kind="none" />
                      <Source data={s} end={<span className="sr-only">Snoozed</span>} />
                      <p className="m-0 mt-[3px] text-body font-medium leading-5 text-text [overflow-wrap:anywhere]">{s.title}</p>
                      <p className="m-0 mt-0.5 text-ui leading-[18px] text-muted [overflow-wrap:anywhere]">Snoozed · {s.until}</p>
                    </Row>
                  ))}
                </ul>
              </PinnedGroup>
            ) : null}
            {vDone.length ? (
              <PinnedGroup kind="done" count={vDone.length} level={pinnedLevel} open={open.has('done')} onToggle={() => toggle('done')}>
                <ul className="m-0 flex list-none flex-col gap-1 p-0 pb-1">
                  {vDone.map((d) => (
                    <Row key={d.id} data={d} inert current={false} className="pb-[9px] pt-2" {...rowProps}>
                      <Check size={13} aria-hidden className="absolute left-2 top-2.5 text-ok max-[640px]:left-[13px] max-[640px]:top-3.5" />
                      <Source data={d} size={16} end={<span className="tabular-nums">{d.at}</span>} />
                      <p className="m-0 mt-[3px] text-ui leading-[18px] text-muted">
                        <span className="line-clamp-2 min-w-0 [overflow-wrap:anywhere]">
                          <span className="sr-only">Done: </span>
                          {d.title}
                        </span>
                      </p>
                    </Row>
                  ))}
                </ul>
              </PinnedGroup>
            ) : null}
          </div>
        ) : null}
        {footer ? <p className="m-0 shrink-0 px-3 pb-4 pt-3 text-body font-medium text-text">{footer}</p> : null}

        {shortcuts ? (
          <span role="status" aria-live="polite" className="sr-only">
            {announce}
          </span>
        ) : null}
      </div>
    </div>
  );
});
