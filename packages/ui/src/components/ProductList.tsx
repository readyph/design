import { type ReactNode } from 'react';
import { CaretRight, Check, ListChecks, MagnifyingGlass, Plus, SlidersHorizontal, X } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusForced } from '../utils/cn';
import { ActionLink } from './ActionLink';
import { Button } from './Button';
import { SegmentedControl } from './SegmentedControl';
import { Select, type SelectOption } from './Select';
import { Skeleton } from './Skeleton';
import { StockLevelBar } from './StockLevelBar';
import { StockStatus, type StockState } from './StockStatus';

/*
 * RDY-388 I7. Transcribed from inventory-home round-1/final: products.css 60-63 (.grp), 73-92 (.rows .row .t1 .t2 .alink),
 * 114-134 (.seg .n .filters .srch .fdd .fl), 137-167 (.prow .phead .qty .lvl .lfoot .nores), 168-170 (.skelrow), 290-309 and 338-346
 * (container 1100 / 760, phone), 376-400 (filters, .stale), 412-432 (final grid with checkbox, .nm, .chk, .alink.add),
 * 436-461 (.olsec .oll .supbar), 465-497 (.gsel .selbar, phone); products.js 185-230 (rowHTML, HEAD, resultsHTML),
 * 231-258 (segHTML, filtersHTML, stripHTML, supBarHTML), 260-268 (selBarHTML). "Needs setting up" is NewProductRequests (I19).
 * Mounted inside PlatformShell's sheet: `@max-[...]/sheet` mirrors `@container sheet`.
 */

const num = (n: number) => n.toLocaleString('en-PH');

const ring =
  'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' + focusForced;

/** products.css 56-57: the 12px accent verb link (24px high, 4px radius). */
const va =
  'inline-flex h-6 cursor-pointer items-center gap-1 rounded-[4px] border-0 bg-transparent px-1 text-[12px] font-semibold text-accent no-underline hover:text-lk-hover active:text-lk-hover ' +
  'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ' +
  focusForced;

/* ---------- row geometry (products.css 137, 290-301, 412, 473-480) ---------- */

const cols =
  'grid-cols-[28px_minmax(0,1.5fr)_120px_190px_210px_minmax(0,1fr)_172px] gap-x-6 ' +
  '@max-[1100px]/sheet:grid-cols-[28px_minmax(0,1.5fr)_100px_170px_180px_150px] @max-[1100px]/sheet:gap-x-4 ' +
  '@max-[760px]/sheet:grid-cols-[28px_minmax(0,1.3fr)_160px_minmax(120px,1fr)_150px] ' +
  'max-[640px]:grid-cols-[28px_minmax(0,1fr)_auto] max-[640px]:gap-x-2 max-[640px]:[grid-template-areas:"chk_pn_ps"_".__pst_pst"_".__pv_pv"]';

const t2 = 'mt-[3px] block min-w-0 truncate text-[13px] leading-[18px] text-muted';

/* ---------- status tabs ---------- */

export type ProductStatusFilter = 'all' | 'low' | 'out' | 'order';

export interface ProductStatusTabsProps {
  value: ProductStatusFilter;
  onValueChange?: (value: ProductStatusFilter) => void;
  /** Counts in the labels; omit one while it loads (shown as an en dash). */
  counts: Partial<Record<ProductStatusFilter, number>>;
  className?: string;
}

/** All | Low stock | Out of stock | On order, toggle buttons with `aria-pressed` and the count in the label. On a phone: four equal columns (products.css 329-331). */
export function ProductStatusTabs({ value, onValueChange, counts, className }: ProductStatusTabsProps) {
  const label = (id: ProductStatusFilter, text: string) => {
    const n = counts[id];
    return (
      <span aria-label={`${text}${n == null ? '' : `, ${num(n)}`}`}>
        {text} <span className={cn('ml-1 tabular-nums max-[640px]:ml-[3px]', value === id ? 'font-medium text-text' : 'font-normal text-muted')}>{n == null ? '–' : num(n)}</span>
      </span>
    );
  };
  return (
    <SegmentedControl
      aria-label="Show"
      value={value}
      onChange={(v) => onValueChange?.(v as ProductStatusFilter)}
      className={cn('m-0 [&_button]:h-8 [&_button]:px-3.5 max-[640px]:grid max-[640px]:w-full max-[640px]:grid-cols-4 max-[640px]:[&_button]:h-10 max-[640px]:[&_button]:justify-center max-[640px]:[&_button]:px-1', className)}
      options={[
        { value: 'all', label: label('all', 'All') },
        { value: 'low', label: label('low', 'Low stock') },
        { value: 'out', label: label('out', 'Out of stock') },
        { value: 'order', label: label('order', 'On order') },
      ]}
    />
  );
}

/* ---------- search and filters ---------- */

export interface ProductFilterMenu {
  value: string;
  options: SelectOption[];
  onValueChange?: (value: string) => void;
}

export interface ProductFiltersProps {
  query: string;
  onQueryChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Scan button inside the field; opens the barcode sheet (I16). */
  onScan?: () => void;
  category: ProductFilterMenu;
  supplier: ProductFilterMenu;
  sort: ProductFilterMenu;
  /** Phone: the three menus sit behind one Filters button. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Number of menus away from their default; shown on the Filters button. */
  activeCount?: number;
  /** "Categories and suppliers in Setup" (phone, inside the open group); omit when the viewer has no setup permission. */
  onSetup?: () => void;
  className?: string;
}

const searchInput =
  'h-[34px] w-full rounded-control border border-control bg-surface py-0 pl-[34px] pr-2.5 text-[14px] text-text placeholder:text-muted placeholder:opacity-100 hover:border-muted ' +
  'outline-none focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent max-[640px]:h-11 max-[640px]:text-[16px] ' +
  focusForced;

function Menu({ id, label, menu, last }: { id: string; label: string; menu: ProductFilterMenu; last?: boolean }) {
  return (
    <div
      className={cn(
        'flex w-[190px] flex-col gap-1',
        '@max-[900px]/sheet:w-auto @max-[900px]/sheet:min-w-[150px] @max-[900px]/sheet:flex-[1_1_0]',
        'max-[640px]:w-auto max-[640px]:min-w-0 max-[640px]:flex-[1_1_calc(50%-6px)]',
        last && 'max-[640px]:basis-full',
      )}
    >
      <span id={`${id}-l`} className="text-[12px] text-muted">
        {label}
      </span>
      <Select id={id} aria-labelledby={`${id}-l`} size="sm" options={menu.options} value={menu.value} onValueChange={menu.onValueChange} className="w-full" />
    </div>
  );
}

/** Search (also by barcode, with a scan button) and the Category, Supplier and Sort menus. `role="search"`. */
export function ProductFilters({
  query,
  onQueryChange,
  searchPlaceholder = 'Search by name, SKU or supplier',
  onScan,
  category,
  supplier,
  sort,
  open = false,
  onOpenChange,
  activeCount = 0,
  onSetup,
  className,
}: ProductFiltersProps) {
  return (
    <div role="search" className={cn('flex flex-wrap items-end gap-4 max-[640px]:gap-3', className)}>
      <label className="relative block max-w-[440px] flex-[1_1_280px] @max-[900px]/sheet:max-w-none @max-[900px]/sheet:basis-full max-[640px]:min-w-0 max-[640px]:flex-[1_1_0]">
        <span className="sr-only">Search products</span>
        <MagnifyingGlass aria-hidden size={16} className="pointer-events-none absolute left-2.5 top-1/2 -mt-2 text-muted" />
        <input type="search" value={query} onChange={(e) => onQueryChange?.(e.target.value)} placeholder={searchPlaceholder} autoComplete="off" className={searchInput} />
        {onScan ? (
          <button
            type="button"
            onClick={onScan}
            aria-label="Scan or type a barcode"
            className={cn('absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-[4px] border-0 bg-transparent text-muted hover:text-text', ring)}
          >
            <BarcodeGlyph />
          </button>
        ) : null}
      </label>
      <Button
        variant="secondary"
        leftIcon={SlidersHorizontal}
        aria-expanded={open}
        aria-controls="product-filter-group"
        onClick={() => onOpenChange?.(!open)}
        className="hidden max-[640px]:inline-flex max-[640px]:h-11 max-[640px]:flex-none"
      >
        Filters
        {activeCount ? (
          <span className="ml-1 inline-grid h-[18px] min-w-[18px] place-items-center rounded-[9px] bg-text text-[11px] font-semibold text-surface">{activeCount}</span>
        ) : null}
      </Button>
      <div id="product-filter-group" className={cn('contents', 'max-[640px]:hidden max-[640px]:flex-[1_1_100%] max-[640px]:flex-wrap max-[640px]:gap-3', open && 'max-[640px]:!flex')}>
        <Menu id="pf-cat" label="Category" menu={category} />
        <Menu id="pf-sup" label="Supplier" menu={supplier} />
        <Menu id="pf-sort" label="Sort" menu={sort} last />
        {onSetup ? (
          <button type="button" onClick={onSetup} className={cn(va, 'hidden max-[640px]:inline-flex max-[640px]:h-9 max-[640px]:basis-full')}>
            <SlidersHorizontal aria-hidden size={12} />
            Categories and suppliers in Setup
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** The scan button's glyph, from the workshop's `Barcode` icon (Phosphor). */
function BarcodeGlyph() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M32,48V208a8,8,0,0,1-16,0V48a8,8,0,0,1,16,0Zm48-8a8,8,0,0,0-8,8V208a8,8,0,0,0,16,0V48A8,8,0,0,0,80,40Zm40,0a8,8,0,0,0-8,8V208a8,8,0,0,0,16,0V48A8,8,0,0,0,120,40Zm40,0a8,8,0,0,0-8,8V208a8,8,0,0,0,16,0V48A8,8,0,0,0,160,40Zm48,0a8,8,0,0,0-8,8V208a8,8,0,0,0,16,0V48A8,8,0,0,0,208,40Z" />
    </svg>
  );
}

/* ---------- the list ---------- */

export type ProductAction =
  | { kind: 'add'; label: string; ariaLabel: string; onAdd?: () => void }
  | { kind: 'receive' | 'view'; label: string };

export interface ProductRowData {
  id: string;
  name: string;
  sku: string;
  category: string;
  /** Aisle or shelf: its own column, and in the sub line under 760px. */
  where: string;
  onHand: number;
  /** Singular unit; "pc" never takes an s. */
  unit: string;
  reorder: number;
  status: StockState;
  /** What is being done: "No order yet", "On PO-0222 · Fri 23 Oct". */
  statusLine?: ReactNode;
  supplier: string;
  action: ProductAction;
}

export interface ProductGroupData {
  id: string;
  icon: PhosphorIcon;
  name: string;
  /** "Order these first". */
  note?: string;
  rows: ProductRowData[];
}

const unitOf = (unit: string, n: number) => (unit === 'pc' ? 'pc' : n === 1 ? unit : `${unit}s`);

const ALT: Record<StockState, string> = { out: 'out of stock', low: 'low stock', ok: 'in stock' };

export interface ProductRowProps {
  product: ProductRowData;
  selected?: boolean;
  /** Checkbox on rows that can be added; omit for rows that cannot. */
  onSelectedChange?: (selected: boolean) => void;
  onOpen?: (product: ProductRowData) => void;
  className?: string;
}

/** One product (`div.row.prow[data-open]`): the whole row opens the product, the name is the one real button. */
export function ProductRow({ product: p, selected = false, onSelectedChange, onOpen, className }: ProductRowProps) {
  const a = p.action;
  return (
    <div
      data-open={p.id}
      onClick={() => onOpen?.(p)}
      className={cn(
        'group/row relative -mx-2 grid min-h-[72px] w-[calc(100%+16px)] cursor-pointer items-center border-t border-rule bg-clip-padding px-2 py-3.5 text-left text-text first:border-t-transparent hover:bg-raised',
        'max-[640px]:mx-0 max-[640px]:min-h-0 max-[640px]:w-full max-[640px]:gap-y-2 max-[640px]:px-0 max-[640px]:py-4',
        cols,
        selected && 'bg-raised',
        className,
      )}
    >
      {onSelectedChange ? (
        <label className="relative -ml-1 inline-grid h-7 w-7 cursor-pointer place-items-center max-[640px]:-mt-0.5 max-[640px]:self-start max-[640px]:[grid-area:chk]" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelectedChange(e.target.checked)}
            aria-label={`Select ${p.name}`}
            className="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
          />
          <span aria-hidden className="pointer-events-none grid h-[18px] w-[18px] place-items-center rounded-[3px] border border-control bg-surface text-[12px] text-transparent transition-colors peer-checked:border-text peer-checked:bg-text peer-checked:text-surface peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent [.group\/row:hover_&]:border-text">
            <Check size={12} />
          </span>
        </label>
      ) : (
        <span className="block w-7 max-[640px]:[grid-area:chk]" />
      )}
      <span className="min-w-0 max-[640px]:[grid-area:pn]">
        <button
          type="button"
          data-nav-row
          aria-label={`${p.name}, ${p.onHand} ${unitOf(p.unit, p.onHand)} on hand, ${ALT[p.status]}. Open`}
          className={cn(
            'block max-w-full cursor-pointer truncate border-0 bg-transparent p-0 text-left font-[inherit] text-[14px] font-medium leading-5 text-text hover:text-accent group-hover/row:text-accent',
            '@max-[1100px]/sheet:whitespace-normal max-[640px]:whitespace-normal',
            'outline-none focus-visible:rounded-[2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            focusForced,
          )}
        >
          {p.name}
        </button>
        <span className={cn(t2, '@max-[760px]/sheet:whitespace-normal max-[640px]:whitespace-normal')}>
          <span className="text-[12px]">{p.sku}</span> · {p.category}
          <span className="hidden @max-[760px]/sheet:inline max-[640px]:inline"> · {p.where}</span>
        </span>
      </span>
      <span className="min-w-0 truncate text-[13px] text-muted @max-[760px]/sheet:hidden max-[640px]:hidden">{p.where}</span>
      <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-left max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-y-1.5 max-[640px]:[grid-area:ps]">
        <span className="min-w-[56px] text-[13px] tabular-nums text-muted">
          <b className="text-[18px] font-semibold leading-[22px] text-text">{num(p.onHand)}</b> <small className="text-[12px]">{unitOf(p.unit, p.onHand)}</small>
        </span>
        <StockLevelBar onHand={p.onHand} reorder={p.reorder} variant="row" className="max-[640px]:ml-0 max-[640px]:self-end" />
        <span className={cn(t2, 'mt-0 basis-full max-[640px]:basis-auto')}>Reorder at {num(p.reorder)}</span>
      </span>
      <span className="flex min-w-0 flex-col items-start gap-[3px] max-[640px]:flex-row max-[640px]:flex-wrap max-[640px]:items-center max-[640px]:gap-x-3 max-[640px]:gap-y-1 max-[640px]:[grid-area:pst]">
        <StockStatus status={p.status} />
        {p.statusLine ? <span className={cn(t2, 'mt-0')}>{p.statusLine}</span> : null}
      </span>
      <span className="min-w-0 truncate text-[13px] text-muted @max-[1100px]/sheet:hidden max-[640px]:hidden">{p.supplier}</span>
      <span className="flex justify-end justify-self-end text-right max-[640px]:justify-self-start max-[640px]:[grid-area:pv]">
        {a.kind === 'add' ? (
          <ActionLink
            aria-label={a.ariaLabel}
            onClick={(e) => {
              e.stopPropagation();
              a.onAdd?.();
            }}
            className="min-h-7 gap-1.5 px-0 text-left max-[640px]:min-h-11 max-[640px]:items-center"
          >
            <Plus aria-hidden size={13} />
            <span className="whitespace-normal leading-[17px]">{a.label}</span>
          </ActionLink>
        ) : (
          <span className="inline-flex min-h-7 items-center gap-[3px] whitespace-nowrap text-[13px] font-semibold leading-[18px] text-accent group-hover/row:text-lk-hover max-[640px]:min-h-10">
            {a.label}
            <CaretRight aria-hidden size={12} weight="bold" className="transition-transform group-hover/row:translate-x-0.5" />
          </span>
        )}
      </span>
    </div>
  );
}

/** Column heads (`.phead`), hidden from assistive tech and on a phone. */
export function ProductListHead({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        '-mx-2 grid w-[calc(100%+16px)] items-center border-b border-border px-2 pb-2.5 text-[12px] text-muted max-[640px]:hidden',
        cols,
        className,
      )}
    >
      <span />
      <span>Product</span>
      <span className="@max-[760px]/sheet:hidden">Where</span>
      <span>Left, against reorder level</span>
      <span>Status</span>
      <span className="@max-[1100px]/sheet:hidden">Supplier</span>
      <span />
    </div>
  );
}

export interface ProductGroupHeaderProps {
  icon: PhosphorIcon;
  name: string;
  count: number;
  note?: string;
  /** "Select all 3" / "Clear 3" button; omit when fewer than two rows can be added. */
  selectLabel?: string;
  onSelectAll?: () => void;
  /** Directly under the column heads (24px above instead of 32px). */
  afterHead?: boolean;
  className?: string;
}

/** Group header (`.grp`): icon, name, count, note and "Select all N". */
export function ProductGroupHeader({ icon: Icon, name, count, note, selectLabel, onSelectAll, afterHead, className }: ProductGroupHeaderProps) {
  return (
    <div className={cn('flex items-center gap-1.5 border-b border-rule pb-2 text-[13px] font-semibold text-text', afterHead ? 'pt-6' : 'pt-8', className)}>
      <Icon aria-hidden size={14} className="shrink-0 text-muted" />
      <span>{name}</span>
      <span className="text-[13px] font-medium tabular-nums text-muted">{count}</span>
      {note ? <span className="text-[12px] font-normal text-muted">{note}</span> : null}
      {selectLabel ? (
        <button type="button" onClick={onSelectAll} className={cn(va, 'ml-auto font-normal max-[640px]:min-h-9')}>
          {selectLabel}
        </button>
      ) : null}
    </div>
  );
}

export interface ProductNoResults {
  /** "No product matches “ring”." */
  title: string;
  /** "Check the spelling, or search by SKU or supplier." */
  hint: string;
  onClear?: () => void;
  onAskLeda?: () => void;
  /** Leda mark for the Ask Leda button. */
  askIcon?: ReactNode;
  /** Products that need stock, shown under "Needs stock now". */
  start?: ProductRowData[];
}

export interface ProductListProps {
  groups: ProductGroupData[];
  selected?: ReadonlySet<string>;
  /** Rows whose id is in here get a checkbox. */
  addable?: ReadonlySet<string>;
  onSelectedChange?: (id: string, selected: boolean) => void;
  onSelectGroup?: (group: ProductGroupData) => void;
  onOpen?: (product: ProductRowData) => void;
  /** Showing N of `total` products. */
  total: number;
  /** Ungrouped list (any sort but "Needs stock first"): rows render without group headers. */
  flat?: boolean;
  loading?: boolean;
  /** The list failed: the loaded list is dimmed and its rows are inert. */
  stale?: boolean;
  /** "Show more" in the footer. */
  onShowMore?: () => void;
  /** "Categories and suppliers in Setup" in the footer; omit without setup permission. */
  onSetup?: () => void;
  noResults?: ProductNoResults;
  /** Rendered above the list, for example the "did not load" banner. */
  banner?: ReactNode;
  className?: string;
}

function Skeletons() {
  return (
    <div aria-busy="true" className="flex flex-col">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className={cn('pointer-events-none -mx-2 grid min-h-[72px] w-[calc(100%+16px)] items-center border-t border-rule px-2 py-3.5 first:border-t-transparent max-[640px]:hidden', cols)}>
          <span className="block w-7" />
          <span className="flex flex-col items-start gap-2">
            <Skeleton variant="text" width={`${58 - (i % 3) * 9}%`} height={14} />
            <Skeleton variant="text" width="34%" height={12} />
          </span>
          <span className="@max-[760px]/sheet:hidden">
            <Skeleton variant="text" width={60} height={14} />
          </span>
          <span className="flex flex-col items-start gap-2">
            <Skeleton variant="text" width={50} height={16} />
            <Skeleton variant="text" width={96} height={4} />
          </span>
          <span>
            <Skeleton variant="text" width={78} height={14} />
          </span>
          <span className="@max-[1100px]/sheet:hidden">
            <Skeleton variant="text" width={110} height={14} />
          </span>
          <span />
        </div>
      ))}
    </div>
  );
}

/**
 * Product list (I7): column heads, groups (Out of stock, Low stock, In stock) of ruled rows with checkboxes, the loading,
 * stale and no-results states, and the footer "Showing N of 612 products" with Setup link.
 */
export function ProductList({
  groups,
  selected,
  addable,
  onSelectedChange,
  onSelectGroup,
  onOpen,
  total,
  flat = false,
  loading = false,
  stale = false,
  onShowMore,
  onSetup,
  noResults,
  banner,
  className,
}: ProductListProps) {
  const rows = groups.flatMap((g) => g.rows);
  const row = (p: ProductRowData) => (
    <ProductRow
      key={p.id}
      product={p}
      selected={selected?.has(p.id)}
      onSelectedChange={addable?.has(p.id) && onSelectedChange ? (v) => onSelectedChange(p.id, v) : undefined}
      onOpen={onOpen}
    />
  );
  if (loading)
    return (
      <div className={cn('min-w-0', className)}>
        <ProductListHead />
        <Skeletons />
      </div>
    );
  if (!rows.length && noResults) {
    const n = noResults;
    return (
      <div className={cn('min-w-0', className)}>
        <div role="status" className="pb-6 pt-10">
          <p className="m-0 text-[15px] leading-[22px]">
            <b>{n.title}</b>
          </p>
          <p className="m-0 mt-1 text-[14px] leading-[22px] text-muted">{n.hint}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {n.onClear ? (
              <Button variant="secondary" leftIcon={X} onClick={n.onClear}>
                Clear filters
              </Button>
            ) : null}
            {n.onAskLeda ? (
              <Button variant="secondary" onClick={n.onAskLeda}>
                {n.askIcon}
                Ask Leda
              </Button>
            ) : null}
          </div>
        </div>
        {n.start?.length ? (
          <>
            <ProductGroupHeader icon={ListChecks} name="Needs stock now" count={n.start.length} className="mt-6" />
            <div className="flex flex-col">{n.start.map(row)}</div>
          </>
        ) : null}
      </div>
    );
  }
  return (
    <div className={cn('min-w-0', className)}>
      {banner}
      <div className={cn(stale && '[&_[data-open]]:pointer-events-none [&_[data-open]]:opacity-60', banner && 'mt-6')}>
        <ProductListHead />
        {flat ? (
          <div className="flex flex-col">{rows.map(row)}</div>
        ) : (
          groups.map((g) => {
            const ad = g.rows.filter((r) => addable?.has(r.id));
            const all = ad.length > 0 && ad.every((r) => selected?.has(r.id));
            return (
              <section key={g.id} aria-label={g.name}>
                <ProductGroupHeader
                  icon={g.icon}
                  name={g.name}
                  count={g.rows.length}
                  note={g.note}
                  afterHead
                  selectLabel={ad.length > 1 && onSelectGroup ? (all ? `Clear ${ad.length}` : `Select all ${ad.length}`) : undefined}
                  onSelectAll={() => onSelectGroup?.(g)}
                />
                <div className="flex flex-col">{g.rows.map(row)}</div>
              </section>
            );
          })
        )}
        <div className="flex items-center justify-between gap-4 pt-4 text-[13px] text-muted max-[640px]:flex-wrap">
          <span>
            Showing {num(rows.length)} of {num(total)} products
          </span>
          {onShowMore && rows.length < total ? (
            <button type="button" onClick={onShowMore} className={cn(va, 'text-[13px] max-[640px]:min-h-10')}>
              Show more
              <CaretRight aria-hidden size={12} weight="bold" />
            </button>
          ) : null}
          <span className="flex-1 max-[640px]:hidden" />
          {onSetup ? (
            <button type="button" onClick={onSetup} className={cn(va, 'text-[13px] max-[640px]:hidden')}>
              Categories and suppliers in Setup
              <CaretRight aria-hidden size={12} weight="bold" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------- selection bar and supplier line ---------- */

export interface ProductSelectionBarProps {
  count: number;
  /** "Autopro 2 · Petron 1": where the selection goes. */
  goesTo: string;
  /** Number of order lists the selection lands on (button says "list" for one). */
  lists: number;
  onClear?: () => void;
  onAdd?: () => void;
  className?: string;
}

/** Ruled bar fixed to the foot of the list (`.selbar`): "3 selected · Goes to: … · Add 3 to order lists". */
export function ProductSelectionBar({ count, goesTo, lists, onClear, onAdd, className }: ProductSelectionBarProps) {
  return (
    <div
      role="region"
      aria-label="Selected products"
      className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-text bg-surface py-3 text-[13px] max-[640px]:py-2.5', className)}
    >
      <span className="tabular-nums">
        <b className="font-semibold">{count}</b> selected
      </span>
      <span className="min-w-0 text-muted max-[640px]:order-3 max-[640px]:basis-full">Goes to: {goesTo}</span>
      <span className="flex-1 max-[640px]:hidden" />
      <Button variant="text" onClick={onClear}>
        Clear
      </Button>
      <Button variant="primary" leftIcon={Plus} onClick={onAdd} className="max-[640px]:h-11 max-[640px]:flex-1">
        Add {count} to order {lists === 1 ? 'list' : 'lists'}
      </Button>
    </div>
  );
}

export interface ProductSupplierBarProps {
  /** "Autopro". */
  supplier: string;
  /** Products of this supplier that need stock. */
  need: number;
  /** Of those, not on a list or an order yet. */
  todo: number;
  /** "Order by 14:00 for same-day delivery (1h 20m left)." */
  cutoff?: string;
  /** "Adds 4 Fleetguard…, about ₱44,150. Nothing is sent." */
  preview?: string;
  /** Short list name: "Autopro". */
  listName: string;
  onAddAll?: () => void;
  className?: string;
}

/** With one supplier chosen: add everything of theirs that needs stock in one go (`.supbar`). */
export function ProductSupplierBar({ supplier, need, todo, cutoff, preview, listName, onAddAll, className }: ProductSupplierBarProps) {
  if (!need)
    return (
      <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] leading-5', className)}>
        <span className="min-w-0 flex-[1_1_320px]">{supplier}: nothing needs stock.</span>
      </div>
    );
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] leading-5', className)}>
      <span className="min-w-0 flex-[1_1_320px]">
        <b className="font-semibold">{supplier}</b>: {need} {need === 1 ? 'product needs' : 'products need'} stock
        {todo ? `, ${todo} not on a list yet` : ', all on a list or an order'}.{cutoff ? ` ${cutoff}` : ''}
      </span>
      {todo ? (
        <>
          {preview ? <span className="order-3 min-w-0 flex-[1_0_100%] text-muted">{preview}</span> : null}
          <Button variant="secondary" leftIcon={Plus} onClick={onAddAll} className="h-7 gap-1.5 px-2.5 text-[12px] max-[640px]:h-11 max-[640px]:w-full">
            Add all {todo} to the {listName} list
          </Button>
        </>
      ) : null}
    </div>
  );
}

/* ---------- order lists strip ---------- */

export interface ProductOrderListLine {
  id: string;
  /** "Autopro order list". */
  name: string;
  /** "3 products · not a PO yet". */
  meta: string;
  ariaLabel: string;
  href?: string;
  onOpen?: () => void;
}

export interface OrderListsStripProps {
  lists: ProductOrderListLine[];
  /** "1 list to proceed, 1 draft PO, not sent". */
  summary?: string;
  /** Orders did not load: the strip says so instead of listing. */
  error?: boolean;
  onOpenAll?: () => void;
  className?: string;
}

const olRow =
  'grid min-h-11 -mx-2 w-[calc(100%+16px)] grid-cols-[minmax(0,1fr)_auto_16px] items-center gap-x-4 border-t border-rule px-2 py-2 text-[14px] no-underline first:border-t-0 last:border-b last:border-rule hover:bg-raised ' +
  'max-[640px]:mx-0 max-[640px]:w-full max-[640px]:grid-cols-[minmax(0,1fr)_16px] max-[640px]:gap-y-0.5 max-[640px]:px-2 max-[640px]:py-2.5';

/** The open order lists, always in view on Products (`.olsec`): titled section, ruled rows, "Open order lists". */
export function OrderListsStrip({ lists, summary, error = false, onOpenAll, className }: OrderListsStripProps) {
  const head = (right?: ReactNode) => (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
      <h2 id="olt" className="m-0 inline-flex items-center gap-2 text-[16px] font-semibold leading-6">
        <ListChecks aria-hidden size={20} />
        Order lists
        {lists.length ? <span className="text-[13px] font-medium tabular-nums text-muted">{lists.length}</span> : null}
      </h2>
      {right}
    </div>
  );
  return (
    <section aria-labelledby="olt" className={cn('border-t border-border pt-4', className)}>
      {error ? (
        <>
          {head()}
          <p className="m-0 mt-1.5 text-[13px] text-muted">Did not load. Retry first.</p>
        </>
      ) : !lists.length ? (
        <>
          {head()}
          <p className="m-0 mt-1.5 text-[13px] text-muted">None yet. Add a product that needs stock and it waits here, one list per supplier. Nothing is sent from here.</p>
        </>
      ) : (
        <>
          {head(
            <>
              {summary ? <span className="text-[13px] text-muted">{summary}. Nothing sent.</span> : null}
              <button type="button" aria-haspopup="dialog" onClick={onOpenAll} className={cn(va, 'ml-auto text-[13px] max-[640px]:-ml-1 max-[640px]:min-h-10 max-[640px]:basis-full')}>
                Open order lists
                <CaretRight aria-hidden size={12} weight="bold" />
              </button>
            </>,
          )}
          <div className="mt-2.5 flex flex-col">
            {lists.map((l) => {
              const inner = (
                <>
                  <span className="min-w-0 font-semibold text-accent group-hover/oll:text-lk-hover">{l.name}</span>
                  <span className="text-right text-[13px] text-muted max-[640px]:col-start-1 max-[640px]:row-start-2 max-[640px]:text-left">{l.meta}</span>
                  <CaretRight aria-hidden size={12} weight="bold" className="justify-self-end text-accent transition-transform group-hover/oll:translate-x-0.5 group-hover/oll:text-lk-hover max-[640px]:col-start-2 max-[640px]:row-[1/3] max-[640px]:row-start-1" />
                </>
              );
              const cls = cn('group/oll', olRow, ring, 'focus-visible:rounded-none focus-visible:outline-offset-[-2px]');
              return l.href ? (
                <a key={l.id} href={l.href} aria-label={l.ariaLabel} onClick={l.onOpen} className={cls}>
                  {inner}
                </a>
              ) : (
                <button key={l.id} type="button" aria-label={l.ariaLabel} onClick={l.onOpen} className={cn(cls, 'cursor-pointer border-x-0 border-b-0 bg-transparent text-left')}>
                  {inner}
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
