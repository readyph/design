import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowsLeftRight, CalendarBlank, CaretRight, Funnel, MagnifyingGlass } from '@phosphor-icons/react';
import { cn, focusForced } from '../utils/cn';
import { SegmentedControl } from './SegmentedControl';
import { Select, type SelectOption } from './Select';

/*
 * RDY-397 I13. Transcribed from inventory-home round-1/final: movements.css 6-12 (.vtabs), 15-30 (.p-wait), 33-59 (.mvrow, .grp),
 * 60-85 (.lbar), 157-174 (tablet, 641-899), 197-243 (phone); movements.js 150-178 (row, head, day head, more), 204 (open line),
 * 266-267 (tabs), 666-668 (tab keys); products.css 60-63, 73-83, 114-134, 158-161 (.grp, .row, .bar, .srch, .fdd).
 */

const pl = (n: number, one: string, many: string) => `${n.toLocaleString('en-PH')} ${n === 1 ? one : many}`;
const unitOf = (unit: string, n: number) => (unit === 'pc' ? 'pc' : n === 1 ? unit : `${unit}s`);

/** links.css 8-22: 12px accent link, 600, 24px high, 4px radius. */
const va =
  'inline-flex h-6 cursor-pointer items-center gap-1 rounded-[4px] border-0 bg-transparent px-1 text-[12px] font-semibold text-accent no-underline hover:text-lk-hover active:text-lk-hover active:opacity-[.85] ' +
  'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ' +
  focusForced;

const ring =
  'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' + focusForced;

/* ---------- tabs: Ledger | Transfers ---------- */

export interface MovementTabsProps {
  value: 'ledger' | 'transfers';
  onValueChange?: (value: 'ledger' | 'transfers') => void;
  /** Number of transfers, shown after "Transfers". Omit while loading or when empty. */
  transfersCount?: number;
  /** Number of open transfers, shown as "2 open" in the accent. */
  transfersOpen?: number;
  /** Id of the panel the tabs control. */
  controls?: string;
  className?: string;
}

const TAB_ORDER = ['ledger', 'transfers'] as const;

/** The two views of Movements (`.vtabs`): role="tablist", roving tabindex, ArrowLeft / ArrowRight / Home / End (movements.js 666-668). */
export function MovementTabs({ value, onValueChange, transfersCount, transfersOpen = 0, controls, className }: MovementTabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const n = TAB_ORDER.length;
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
    refs.current[to]?.focus();
    onValueChange?.(TAB_ORDER[to]);
  };
  const tab = (id: (typeof TAB_ORDER)[number], i: number, children: ReactNode) => (
    <button
      key={id}
      ref={(el) => {
        refs.current[i] = el;
      }}
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={value === id}
      aria-controls={controls}
      tabIndex={value === id ? 0 : -1}
      onClick={() => onValueChange?.(id)}
      onKeyDown={(e) => onKeyDown(e, i)}
      className={cn(
        'relative -mb-px inline-flex h-10 cursor-pointer items-center gap-2 border-0 border-b-2 border-solid bg-transparent px-0.5 text-[14px] font-medium text-muted hover:text-text max-[640px]:h-11',
        value === id ? 'border-b-accent font-semibold text-text' : 'border-b-transparent',
        'outline-none focus-visible:rounded-[2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' + focusForced,
      )}
    >
      {children}
    </button>
  );
  return (
    <div role="tablist" aria-label="Movements" className={cn('mt-7 flex gap-7 border-b border-border max-[640px]:mt-3 max-[640px]:gap-5', className)}>
      {tab('ledger', 0, 'Ledger')}
      {tab(
        'transfers',
        1,
        <>
          Transfers
          {transfersCount != null ? <span className="text-[13px] font-normal tabular-nums text-muted">{transfersCount}</span> : null}
          {transfersOpen > 0 && transfersCount != null ? (
            <span aria-label={`${transfersOpen} open`} className="text-[12px] font-semibold text-accent">
              {transfersOpen} open
            </span>
          ) : null}
        </>,
      )}
    </div>
  );
}

/* ---------- "Transfers open": one ruled line under the tabs ---------- */

export interface OpenTransfer {
  /** "TR-0032". */
  id: string;
  /** `to` for an outgoing transfer, `from` for an incoming one. */
  direction: 'to' | 'from';
  /** Short place name: "Kapitolyo". */
  place: string;
  /** Status word, for example a draft or in-transit state. Hidden on a phone. */
  state?: ReactNode;
  /** The row's action, for example `<ActionLink caret>Send</ActionLink>`. */
  action?: ReactNode;
  onOpen?: () => void;
}

export interface MovementTransfersOpenProps {
  /** Up to three open transfers, the ones needing the viewer first. */
  items: OpenTransfer[];
  /** All open transfers (items may show fewer). */
  total: number;
  onAllTransfers?: () => void;
  className?: string;
}

export function MovementTransfersOpen({ items, total, onAllTransfers, className }: MovementTransfersOpenProps) {
  if (!items.length) return null;
  const many = total > 1;
  return (
    <section aria-label="Transfers waiting" className={cn('m-0 border-b border-rule max-[640px]:mb-2', className)}>
      <div className="flex min-h-[52px] flex-wrap items-center gap-x-7 gap-y-1 py-1.5 max-[640px]:min-h-12 max-[640px]:flex-nowrap max-[640px]:gap-2 max-[640px]:p-0">
        <ArrowsLeftRight aria-hidden size={16} className="-mr-[18px] text-muted max-[640px]:mr-0" />
        <b className="text-[14px] font-semibold max-[640px]:hidden">{total} open</b>
        {items.map((t, i) => (
          <span key={t.id} className={cn('min-w-0 items-center gap-2.5', i === 0 ? 'inline-flex max-[640px]:min-w-0 max-[640px]:flex-1' : 'inline-flex max-[640px]:hidden')}>
            <button
              type="button"
              onClick={t.onOpen}
              className={cn(
                'cursor-pointer border-0 bg-transparent p-0 text-left text-[14px] font-medium text-text hover:text-lk-hover max-[640px]:max-w-full max-[640px]:overflow-hidden max-[640px]:text-ellipsis max-[640px]:whitespace-nowrap',
                ring,
              )}
            >
              <span className="font-semibold">{t.id}</span> {t.direction} {t.place}
            </button>
            {t.state ? <span className="text-[13px] max-[640px]:hidden">{t.state}</span> : null}
            <span className="max-[640px]:hidden">{t.action}</span>
          </span>
        ))}
        <span className="ml-auto">
          <button type="button" onClick={onAllTransfers} className={cn(va, 'max-[640px]:min-h-11')}>
            <span className={cn(many && 'max-[640px]:hidden')}>All transfers</span>
            {many ? <span className="hidden max-[640px]:inline">+{total - 1} more</span> : null}
            <CaretRight aria-hidden size={12} weight="bold" />
          </button>
        </span>
      </div>
    </section>
  );
}

/* ---------- filters ---------- */

export interface MovementFilterMenu {
  value: string;
  options: SelectOption[];
  onValueChange?: (value: string) => void;
}

export type MovementIo = 'all' | 'in' | 'out';

export interface MovementFiltersProps {
  io: MovementIo;
  /** Counts on the Stock in / Stock out toggles; omit while loading. */
  counts?: Record<MovementIo, number>;
  onIoChange?: (value: MovementIo) => void;
  query: string;
  onQueryChange?: (value: string) => void;
  searchPlaceholder?: string;
  reason: MovementFilterMenu;
  product: MovementFilterMenu;
  person: MovementFilterMenu;
  dates: MovementFilterMenu;
  /** After the four menus: the From and To date fields when Dates is "Choose dates" (movements.js 195, movements.css 64-65, 85). */
  extra?: ReactNode;
  /** Phone: how many of the four menus are not at their default (the badge on Filters, movements.js 183). */
  activeFilters?: number;
  className?: string;
}

const searchInput =
  'h-[34px] w-full rounded-control border border-control bg-surface py-0 pl-[34px] pr-2.5 text-[14px] text-text placeholder:text-muted placeholder:opacity-100 hover:border-muted ' +
  'outline-none focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent max-[640px]:h-11 ' +
  focusForced;

function Menu({ id, label, menu, className }: { id: string; label: string; menu: MovementFilterMenu; className?: string }) {
  return (
    <div className={cn('flex w-[190px] flex-col gap-1 min-[641px]:max-[1259px]:w-auto min-[641px]:max-[1259px]:min-w-0 max-[640px]:w-full', className)}>
      <span id={`${id}-l`} className="text-[12px] text-muted">
        {label}
      </span>
      <Select id={id} aria-labelledby={`${id}-l`} size="sm" options={menu.options} value={menu.value} onValueChange={menu.onValueChange} className="w-full" />
    </div>
  );
}

/**
 * Ledger filters (`.bar.lbar`): the Stock in / out toggles, search and four menus (reason, product, person, dates).
 * From 1260px one row; 641-1259 a 4-column grid; below that stacked.
 */
export function MovementFilters({ io, counts, onIoChange, query, onQueryChange, searchPlaceholder = 'Search by product, code, order, job or person', reason, product, person, dates, extra, activeFilters = 0, className }: MovementFiltersProps) {
  const [fo, setFo] = useState(false);
  return (
    <div
      className={cn(
        'grid grid-cols-1 items-center gap-x-6 gap-y-6',
        'min-[641px]:max-[1259px]:grid-cols-4 min-[641px]:max-[1259px]:items-end min-[641px]:max-[1259px]:gap-x-4 min-[641px]:max-[1259px]:gap-y-3',
        'min-[1260px]:flex min-[1260px]:items-end min-[1260px]:gap-3',
        'max-[640px]:flex max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-3',
        className,
      )}
    >
      <div className="flex items-end gap-2 min-[641px]:max-[1259px]:col-[1/3] min-[1260px]:flex-none max-[640px]:order-2">
        <div className="max-[640px]:hidden">
          <SegmentedControl
            aria-label="Show"
            className="m-0"
            value={io}
            onChange={(v) => onIoChange?.(v as MovementIo)}
            options={[
              { value: 'all', label: 'All', count: counts?.all },
              { value: 'in', label: 'Stock in', count: counts?.in },
              { value: 'out', label: 'Stock out', count: counts?.out },
            ]}
          />
        </div>
        <div className="hidden min-w-0 flex-1 max-[640px]:block">
          <span id="mv-show-l" className="sr-only">Show</span>
          <Select
            id="mv-show"
            aria-labelledby="mv-show-l"
            size="sm"
            value={io}
            onValueChange={(v) => onIoChange?.(v as MovementIo)}
            options={[
              { value: 'all', label: 'All movements', meta: counts ? String(counts.all) : undefined },
              { value: 'in', label: 'Stock in', meta: counts ? String(counts.in) : undefined },
              { value: 'out', label: 'Stock out', meta: counts ? String(counts.out) : undefined },
            ]}
            className="w-full"
          />
        </div>
        <button
          type="button"
          aria-expanded={fo}
          aria-controls="mv-fmore"
          onClick={() => setFo((v) => !v)}
          className={cn('hidden h-11 flex-none cursor-pointer items-center gap-1.5 rounded-control border border-control bg-surface px-3.5 text-[13px] font-medium text-text max-[640px]:inline-flex', ring)}
        >
          <Funnel aria-hidden size={16} />
          Filters
          {activeFilters ? <span className="ml-0.5 text-[12px] font-semibold text-accent">{activeFilters}</span> : null}
        </button>
      </div>
      <div
        role="search"
        className="flex flex-wrap items-end gap-4 max-[640px]:order-1 max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-3 min-[641px]:max-[1259px]:contents min-[1260px]:min-w-0 min-[1260px]:flex-1 min-[1260px]:flex-nowrap min-[1260px]:gap-3"
      >
        <label className="relative block max-w-[440px] flex-[1_1_280px] min-[641px]:max-[1259px]:col-[3/5] min-[641px]:max-[1259px]:max-w-none min-[1260px]:min-w-[140px] min-[1260px]:max-w-none min-[1260px]:flex-[1_1_160px] max-[640px]:max-w-none">
          <span className="sr-only">Search movements</span>
          <MagnifyingGlass aria-hidden size={16} className="pointer-events-none absolute left-2.5 top-1/2 -mt-2 text-muted" />
          <input type="search" value={query} onChange={(e) => onQueryChange?.(e.target.value)} placeholder={searchPlaceholder} autoComplete="off" className={searchInput} />
        </label>
        <div id="mv-fmore" className={cn('contents', fo ? 'max-[640px]:grid max-[640px]:w-full max-[640px]:grid-cols-2 max-[640px]:gap-3 max-[640px]:[&>:last-child]:col-span-2' : 'max-[640px]:hidden')}>
          <Menu id="mv-reason" label="Reason" menu={reason} className="min-[1260px]:w-[158px] min-[1260px]:flex-none" />
          <Menu id="mv-product" label="Product" menu={product} className="min-[1260px]:w-[158px] min-[1260px]:flex-none" />
          <Menu id="mv-person" label="Person" menu={person} className="min-[1260px]:w-[130px] min-[1260px]:flex-none" />
          <Menu id="mv-dates" label="Dates" menu={dates} className="min-[1260px]:w-[174px] min-[1260px]:flex-none" />
          {extra}
        </div>
      </div>
    </div>
  );
}

/* ---------- the ledger ---------- */

export interface MovementRow {
  id: string;
  /** "9:42 AM". */
  time: string;
  product: { name: string; sku: string; location?: string; href?: string };
  /** The reason word, with its reference link: "Received from PO-0412". */
  what: ReactNode;
  /** Second line of "What happened": the note. */
  detail?: ReactNode;
  /** Person's short name. */
  by: string;
  /** Signed: positive is stock in. */
  qty: number;
  /** Singular unit of the product: "bottle", or "pc". */
  unit: string;
  /** Balance after this move. */
  left: number;
  /** A row recorded here offers Undo. */
  undoable?: boolean;
  /** Row flashes (deep link). */
  highlighted?: boolean;
}

export interface MovementDay {
  id: string;
  /** "Today · Thursday 22 October". */
  heading: string;
  /** Phone form: "Today · Thu 22 Oct". */
  shortHeading: string;
  rows: MovementRow[];
}

/**
 * The day head's counts (movements.js 159-164): "9 in, 8 out"; a unit total ("18 bottles in") only when every row of the
 * day has one unit; "none in" instead of "0 units in".
 */
export function movementDaySummary(rows: MovementRow[]): string {
  const ins = rows.filter((r) => r.qty > 0);
  const outs = rows.filter((r) => r.qty < 0);
  const one = new Set(rows.map((r) => r.unit)).size === 1;
  const side = (rs: MovementRow[], w: string) => {
    if (!rs.length) return `none ${w}`;
    if (!one) return `${rs.length} ${w}`;
    const n = rs.reduce((s, r) => s + Math.abs(r.qty), 0);
    return `${n.toLocaleString('en-PH')} ${unitOf(rs[0].unit, n)} ${w}`;
  };
  return `${side(ins, 'in')}, ${side(outs, 'out')}`;
}

export interface MovementLedgerProps {
  days: MovementDay[];
  onUndo?: (row: MovementRow) => void;
  /** Rows beyond those shown, in the range. */
  more?: number;
  /** How many the button adds (40). */
  moreStep?: number;
  onShowMore?: () => void;
  className?: string;
}

const cols = 'grid-cols-[76px_minmax(0,1.3fr)_minmax(0,1.6fr)_130px_104px_64px] gap-x-5 max-[1099px]:grid-cols-[68px_minmax(0,1.2fr)_minmax(0,1.4fr)_110px_100px_56px] max-[1099px]:gap-x-3.5 min-[641px]:max-[899px]:grid-cols-[62px_minmax(0,1.3fr)_minmax(0,1.3fr)_96px_48px] max-[640px]:grid-cols-[minmax(0,1fr)_auto] max-[640px]:gap-x-3';
const t1 = 'block min-w-0 truncate text-[14px] font-medium leading-5 max-[640px]:whitespace-normal';
const t2 = 'mt-0.5 block min-w-0 truncate text-[13px] leading-[18px] text-muted';
const num = (n: number) => n.toLocaleString('en-PH');
const signed = (n: number) => (n > 0 ? '+' : '−') + num(Math.abs(n));

function Row({ r, onUndo }: { r: MovementRow; onUndo?: (r: MovementRow) => void }) {
  const p = r.product;
  return (
    <div
      data-mv={r.id}
      className={cn(
        'group/row relative -mx-2 grid w-[calc(100%+16px)] min-h-[56px] items-start border-t border-rule bg-clip-padding px-2 py-3 text-left text-text first:border-t-transparent hover:bg-raised',
        'max-[640px]:min-h-0 max-[640px]:gap-y-1 max-[640px]:py-3.5',
        cols,
        r.highlighted && 'bg-raised',
      )}
    >
      <span className="min-w-0 min-[641px]:max-[899px]:col-start-1 min-[641px]:max-[899px]:row-[1/3] max-[640px]:col-start-1 max-[640px]:row-start-3">
        <span className={cn(t1, 'font-normal tabular-nums text-muted max-[640px]:text-[13px]')}>{r.time}</span>
      </span>
      <span className="min-w-0 min-[641px]:max-[899px]:col-start-2 min-[641px]:max-[899px]:row-[1/3] max-[640px]:col-start-1 max-[640px]:row-start-1">
        {p.href ? (
          <a href={p.href} className={cn(t1, 'cursor-pointer text-text no-underline hover:text-lk-hover min-[641px]:max-[1099px]:whitespace-normal', ring)}>
            {p.name}
          </a>
        ) : (
          <span className={cn(t1, 'min-[641px]:max-[1099px]:whitespace-normal')}>{p.name}</span>
        )}
        <span className={cn(t2, 'max-[640px]:hidden')}>
          <span className="text-[12px]">{p.sku}</span>
          {p.location ? <span> · {p.location}</span> : null}
        </span>
      </span>
      <span className="min-w-0 min-[641px]:max-[899px]:col-start-3 min-[641px]:max-[899px]:row-start-1 max-[640px]:col-start-1 max-[640px]:row-start-2">
        <span className={cn(t1, 'whitespace-normal')}>{r.what}</span>
        {r.detail || r.by ? (
          <span className={cn(t2, 'whitespace-normal')}>
            {r.detail}
            <span className="hidden min-[641px]:max-[899px]:inline">
              {r.detail ? ' · ' : ''}
              {r.by}
            </span>
          </span>
        ) : null}
      </span>
      <span className="min-w-0 min-[641px]:max-[899px]:col-start-3 min-[641px]:max-[899px]:row-start-2 max-[640px]:col-start-2 max-[640px]:row-start-3 max-[640px]:flex max-[640px]:flex-col max-[640px]:items-end max-[640px]:text-right">
        <span className={cn(t1, 'font-normal min-[641px]:max-[899px]:hidden max-[640px]:justify-end max-[640px]:text-[13px]')}>{r.by}</span>
        {r.undoable ? (
          <button type="button" onClick={() => onUndo?.(r)} className={cn(va, 'mt-0.5 inline-block h-auto min-h-[24px] text-[13px] leading-[18px] max-[640px]:min-h-9')}>
            Undo
          </button>
        ) : null}
      </span>
      <span className="min-w-0 whitespace-nowrap text-right text-[14px] leading-5 tabular-nums min-[641px]:max-[899px]:col-start-4 min-[641px]:max-[899px]:row-[1/3] max-[640px]:col-start-2 max-[640px]:row-start-1">
        <b className="font-semibold">{signed(r.qty)}</b> <span className="text-[13px] text-muted">{unitOf(r.unit, Math.abs(r.qty))}</span>
      </span>
      <span className="min-w-0 whitespace-nowrap text-right text-[14px] leading-5 tabular-nums min-[641px]:max-[899px]:col-start-5 min-[641px]:max-[899px]:row-[1/3] max-[640px]:col-start-2 max-[640px]:row-start-2">
        <span className="hidden text-[13px] text-muted max-[640px]:inline">Left </span>
        <b className="font-medium">{r.left < 0 ? `−${num(-r.left)}` : num(r.left)}</b>
      </span>
    </div>
  );
}

/**
 * Movement ledger (I13): a flat ruled list grouped by day. Columns Time | Product | What happened | By | Quantity | Left
 * (Left is the balance after the move; the last two columns are right-aligned and tabular). 56px rows; In and Out quantities
 * share one text colour. At 641-899px the person folds into the second line of "What happened"; on a phone each row stacks
 * with "Left 3" inline. The caller sends at most 40 rows per page and the "Show more" button asks for the next.
 */
export function MovementLedger({ days, onUndo, more = 0, moreStep = 40, onShowMore, className }: MovementLedgerProps) {
  return (
    <section aria-live="polite" className={cn('flex min-w-0 flex-col', className)}>
      <div
        aria-hidden="true"
        className={cn(
          '-mx-2 w-[calc(100%+16px)] items-end border-b border-border px-2 pb-2.5 text-[12px] text-muted max-[640px]:hidden',
          'grid',
          cols,
        )}
      >
        <span className="min-w-0 min-[641px]:max-[899px]:col-start-1">Time</span>
        <span className="min-w-0 min-[641px]:max-[899px]:col-start-2">Product</span>
        <span className="min-w-0 min-[641px]:max-[899px]:col-start-3">What happened</span>
        <span className="min-w-0 min-[641px]:max-[899px]:hidden">By</span>
        <span className="min-w-0 text-right min-[641px]:max-[899px]:col-start-4">Quantity</span>
        <span className="min-w-0 text-right min-[641px]:max-[899px]:col-start-5">Left</span>
      </div>
      {days.map((d, i) => (
        <div key={d.id} role="group" aria-label={d.heading} className="min-w-0">
          <div
            className={cn(
              'flex items-center gap-1.5 border-b border-rule pb-2 text-[13px] font-semibold text-text max-[640px]:flex-wrap max-[640px]:gap-y-0.5',
              i === 0 ? 'pt-4' : 'pt-8',
            )}
          >
            <CalendarBlank aria-hidden size={14} className="shrink-0 text-muted" />
            <span className="max-[640px]:flex-[1_1_calc(100%-24px)]">
              <span className="max-[640px]:hidden">{d.heading}</span>
              <span className="hidden max-[640px]:inline">{d.shortHeading}</span>
            </span>
            <span className="text-[13px] font-medium tabular-nums text-muted max-[640px]:ml-5">{pl(d.rows.length, 'movement', 'movements')}</span>
            <span className="ml-auto text-[12px] font-normal tabular-nums text-muted max-[640px]:ml-0 max-[640px]:before:content-['·_']">{movementDaySummary(d.rows)}</span>
          </div>
          <div className="flex flex-col">
            {d.rows.map((r) => (
              <Row key={r.id} r={r} onUndo={onUndo} />
            ))}
          </div>
        </div>
      ))}
      {more > 0 ? (
        <div className="mt-2 flex items-center gap-4 border-t border-rule pb-1 pt-[18px] text-[13px]">
          <button type="button" onClick={onShowMore} className={va}>
            Show {Math.min(more, moreStep)} more
          </button>
          <span className="text-muted">{num(more)} more in this range</span>
        </div>
      ) : null}
    </section>
  );
}
