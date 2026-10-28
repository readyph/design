import { useMemo, useState, type ReactNode } from 'react';
import { ArrowClockwise, Funnel, ListChecks, MagnifyingGlass, Package, Storefront, Truck, WarningCircle, X } from '@phosphor-icons/react';
import { ActionLink } from '../components/ActionLink';
import { AskLedaBar } from '../components/AskLedaBar';
import { Button } from '../components/Button';
import { LedaMark } from '../components/Leda';
import { Select } from '../components/Select';
import { SegmentedControl } from '../components/SegmentedControl';
import { SheetBar, SheetBarWhere } from '../components/SheetBar';
import { Skeleton } from '../components/Skeleton';
import { InventoryStatusBar } from '../components/StatusBar';
import { cn } from '../utils/cn';
import { InventoryChrome } from './Products.chrome';
import { PRODUCTS } from './Products.data';
import { OL_A, OL_B } from './OrderLists.data';
import { STW, flag, plural, purchaseOrdersModel, type POFilter, type POQuery, type POSort, type POTone, type PurchaseOrder } from './PurchaseOrders.data';

/* RDY-426. Page: Purchase orders, 2/5 (b): the list region. Source: inventory-home FINAL purchase-orders.js 150-238 (statusLine, expectedCell, actionOf, rowHTML,
   resultsHTML, segHTML, filtersHTML, emptyHTML, loadingHTML, topActions, listHTML), purchase-orders.css 1-70 (list), 133-143 and 186-217 (tablet, phone);
   handover 2.5. Model: PurchaseOrders.data.ts (RDY-425). URL params as props: ?tenant ?as ?state ?pos ?asof &f &sup &qs &group.
   Later slices (c, d, e) add the one-order view, Receive and the final assembly to this file. */
export interface PurchaseOrdersPageProps {
  tenant?: 'a' | 'b';
  as?: 'manager' | 'clerk' | 'owner';
  state?: POQuery['state'];
  /** `?pos=none` */
  pos?: 'none';
  /** `?asof=2` */
  asof?: number;
  f?: POFilter;
  sup?: string;
  qs?: string;
  group?: 'sup';
  /** Story only: the error block has already been retried (purchase-orders.js 224, `S.retried`). */
  retried?: boolean;
}

const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-PH')}`;
const SORTS: [POSort, string][] = [['attn', 'Needs you first'], ['date', 'Expected date'], ['new', 'Newest first'], ['sup', 'Supplier A to Z']];
const FILTERS: POFilter[] = ['all', 'draft', 'sent', 'part', 'short', 'received', 'cancelled'];
const FWORD: Record<POFilter, string> = { all: 'All', draft: 'Draft', sent: 'Sent', part: 'Part in', short: 'Short', received: 'Received', cancelled: 'Cancelled' };

/* purchase-orders.css 3-4 (.mut .flag), products.css 94-111 (.pane .state tones) */
const DOT: Record<POTone, string> = {
  dash: 'h-1.5 w-1.5 rounded-full border-[1.5px] border-dashed border-muted',
  info: 'h-[7px] w-[7px] rounded-full bg-info',
  warn: 'h-[7px] w-[7px] rounded-full bg-warn',
  ok: 'h-[7px] w-[7px] rounded-full bg-faint',
  off: 'h-1.5 w-1.5 rounded-full border-[1.5px] border-solid border-faint',
};
const WORD: Record<POTone, string> = { dash: 'text-muted font-medium', info: 'text-text font-medium', warn: 'text-text font-medium', ok: 'text-muted font-normal', off: 'text-muted font-medium' };
function POState({ tone, children }: { tone: POTone; children: ReactNode }) {
  return <span className={cn('inline-flex h-5 flex-none items-center gap-1.5 whitespace-nowrap text-[12px]', WORD[tone])}><span aria-hidden className={cn('flex-none', DOT[tone])} />{children}</span>;
}

/* purchase-orders.css 22-29 (.t1 .t2): the second line wraps from 1099px down */
const T1 = 'block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-medium leading-5 @max-[1100px]/sheet:whitespace-normal max-[640px]:whitespace-normal';
const T2 = 'mt-[3px] block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] leading-[18px] text-muted max-[1099px]:whitespace-normal';
const COLS_M = 'grid-cols-[minmax(0,1.5fr)_150px_170px_150px_110px_112px] max-[1099px]:grid-cols-[minmax(0,1.4fr)_130px_140px_110px_96px]';
const COLS_C = 'grid-cols-[minmax(0,1.5fr)_150px_170px_150px_112px] max-[1099px]:grid-cols-[minmax(0,1.4fr)_130px_150px_100px]';
const PHONE_COLS = 'max-[640px]:grid-cols-[minmax(0,1fr)_auto] max-[640px]:gap-x-3 max-[640px]:gap-y-1';

export function PurchaseOrdersPage({ tenant = 'a', as = 'manager', state, pos, asof, f, sup, qs, group, retried: retriedProp }: PurchaseOrdersPageProps) {
  const [filter, setFilter] = useState<POFilter>(f ?? 'all');
  const [supplier, setSupplier] = useState(sup ?? 'all');
  const [query, setQuery] = useState(qs ?? '');
  const [grouped, setGrouped] = useState<'flat' | 'sup'>(group === 'sup' ? 'sup' : 'flat');
  const [sort, setSort] = useState<POSort>('attn');
  const [fopen, setFopen] = useState(false);
  const [retried, setRetried] = useState(!!retriedProp);
  const M = useMemo(() => purchaseOrdersModel({ tenant, as, state, pos, asof, f: filter, sup: supplier, qs: query, group: grouped, retried }), [tenant, as, state, pos, asof, filter, supplier, query, grouped, retried]);
  const P = PRODUCTS[tenant], V = P.viewers[as], contacts = (tenant === 'a' ? OL_A : OL_B).contacts;
  const { can, money, flags: F, now, todayLabel } = M;
  const poErr = F.error && !retried;
  const loading = F.loading;
  const all = M.all();
  const sw = (id: string) => M.suppliers.find((s) => s.id === id)?.name ?? id;
  const nm = (o: PurchaseOrder) => `${o.supplierName}, ${o.no}`;
  const lists = (tenant === 'a' ? OL_A : OL_B);
  const nLists = lists.pos.filter((p) => p.status === 'DRAFT').length + lists.carts.length;
  const platform = { name: P.business.platform, initials: tenant === 'a' ? 'PS' : 'CI' };
  const dataLink = P.link ? { with: P.link.with, status: (P.link.status === 'slow' ? 'slow' : 'linked') as 'slow' | 'linked', since: P.link.since ?? now.time, title: P.link.reads } : undefined;

  /* purchase-orders.js 150-165 statusLine */
  const statusLine = (o: PurchaseOrder): string => {
    if (o.status === 'DRAFT') return M.draftNote(o);
    if (o.status === 'ORDERED') return `On ${o.ordered ? o.ordered : 'today'}`;
    if (o.status === 'PARTIAL') return `${M.inW(o)}${flag(o.no, {}) ? `. ${flag(o.no, {})}` : ''}`;
    if (o.status === 'RECEIVED') return o.shortUnits ? `Short ${M.shortAmt(o)}${flag(o.no, {}) ? `. ${flag(o.no, {})}` : o.varianceState === 'awaiting' && !F.quiet ? `, ${can('accept_variance') ? 'you decide' : 'your manager decides'}` : ''}` : 'All in';
    const c = o.cancelled; return c ? `By ${M.people.find((p) => p.id === c.by)?.short ?? ''}` : '';
  };
  /* 159-165 expectedCell */
  const expectedCell = (o: PurchaseOrder): ReactNode => {
    const l = M.lateDays(o);
    const t1 = (cls: string, pre: boolean, text: string) => <span className={cn(T1, cls, pre && 'max-[640px]:text-[13px] max-[640px]:font-normal max-[640px]:text-muted max-[640px]:before:content-["Expected_"]')}>{text}</span>;
    const t2 = (text: string, flagged?: boolean) => <span className={cn(T2, 'max-[640px]:mt-0', flagged && 'font-semibold text-bad')}>{text}</span>;
    if (o.status === 'RECEIVED') { const d = M.cameLate(o); return <>{t1('max-[640px]:text-[13px] max-[640px]:font-normal max-[640px]:text-muted', false, `Received ${(o.receivedAt || '').replace(/ \d{1,2}:\d{2}$/, '').replace(/ Oct$/, '')}`)}{t2(d ? plural(d, 'day', 'days') + ' late' : 'On time')}</>; }
    if (o.status === 'CANCELLED') return <>{t1('font-normal text-muted max-[640px]:text-[13px]', false, o.cancelled?.at ? o.cancelled.at.replace(/ \d{1,2}:\d{2}$/, '') : 'Cancelled')}{t2(`Was ${M.expDate(o).replace(/ Oct$/, '')}`)}</>;
    if (o.status === 'DRAFT') return <>{t1('', true, M.expDate(o))}{t2(M.ifSentBy(o) ? `if sent by ${M.ifSentBy(o)}` : 'once sent')}</>;
    const left = (M.dueN(o) || M.TODAY) - M.TODAY;
    return <>{t1('', true, M.expDate(o))}{t2(l ? `${plural(l, 'day', 'days')} late` : M.dueToday(o) ? 'Due today' : o.status === 'PARTIAL' ? 'Rest of the order' : `${Math.max(0, left)} day${left === 1 ? '' : 's'} to go`, !!(l || M.dueToday(o)))}</>;
  };
  /* 166-171 actionOf */
  const actionOf = (o: PurchaseOrder): [string, 'receive' | 'open'] => (o.status === 'DRAFT' ? ['Open paper', 'open'] : M.isOpen(o) ? (can('receive') && !poErr ? ['Receive', 'receive'] : ['View', 'open']) : ['View', 'open']);

  /* 172-184 rowHTML */
  const row = (o: PurchaseOrder, grp: boolean) => {
    const [verb, kind] = actionOf(o);
    const aria = kind === 'receive' ? `Receive ${nm(o)}` : o.status === 'DRAFT' ? `Open the paper for ${nm(o)}` : `View ${nm(o)}`;
    const stk = M.stKey(o);
    return (
      <div key={o.no} data-row={o.no} className={cn('group/row relative -mx-2 grid min-h-[72px] w-[calc(100%+16px)] cursor-pointer items-center gap-x-6 border-t border-rule bg-clip-padding px-2 py-3.5 text-left text-text first:border-t-transparent hover:bg-raised max-[1099px]:gap-x-4 max-[640px]:mx-0 max-[640px]:min-h-0 max-[640px]:w-full max-[640px]:px-0 max-[640px]:py-4', money ? COLS_M : COLS_C, PHONE_COLS)}>
        <span className="min-w-0 max-[640px]:col-start-1 max-[640px]:row-start-1">
          <button type="button" data-nav-row className={cn(T1, 'w-full cursor-pointer border-0 bg-transparent p-0 text-left font-[inherit] text-text hover:text-lk-hover')}>{grp ? <span className="font-mono text-[14px] font-medium tracking-normal">{o.no}</span> : o.supplierName}</button>
          <span className={T2}>{grp ? '' : <><span className="font-mono text-[12px] tracking-normal">{o.no}</span><span> · </span></>}{plural(o.lines.length, 'product', 'products')}</span>
        </span>
        <span className="flex min-w-0 flex-col items-start gap-[3px] max-[640px]:col-start-1 max-[640px]:row-start-2 max-[640px]:flex-row max-[640px]:flex-wrap max-[640px]:items-center max-[640px]:gap-x-2.5 max-[640px]:gap-y-1">
          <POState tone={STONE_OF[stk]}>{STW[stk]}</POState>
          <span className={cn(T2, 'mt-0')}>{statusLine(o)}</span>
        </span>
        <span className="min-w-0 max-[640px]:col-start-1 max-[640px]:row-start-3 max-[640px]:flex max-[640px]:flex-wrap max-[640px]:gap-x-2">{expectedCell(o)}</span>
        <span className="min-w-0 max-[1099px]:hidden max-[640px]:hidden"><span className={T1}>{M.qtyText(o)}</span></span>
        {money ? <span className="text-right text-[14px] font-medium tabular-nums max-[640px]:col-start-2 max-[640px]:row-start-1 max-[640px]:self-start">{peso(o.total)}</span> : null}
        <span className="flex justify-end justify-self-end text-right max-[640px]:col-start-2 max-[640px]:[grid-row:2/4] max-[640px]:self-center">
          {kind === 'open' && o.status === 'DRAFT'
            ? <ActionLink caret href="#order-list" aria-label={aria} className="min-h-7 max-[640px]:min-h-11">{verb}</ActionLink>
            : <ActionLink caret aria-label={aria} className="min-h-7 max-[640px]:min-h-11">{verb}</ActionLink>}
        </span>
      </div>
    );
  };
  /* 190-191 headRow */
  const headRow = () => (
    <div aria-hidden="true" className={cn('-mx-2 grid min-h-0 w-[calc(100%+16px)] items-center gap-x-6 border-b border-border px-2 pb-2.5 text-[12px] text-muted max-[1099px]:gap-x-4 max-[640px]:hidden', money ? COLS_M : COLS_C)}>
      <span>Order</span><span>Status</span><span>Expected</span><span className="max-[1099px]:hidden">Quantity</span>{money ? <span className="text-right">Total</span> : null}<span />
    </div>
  );
  /* 185-196 resultsHTML */
  const results = () => {
    const list = M.shown(sort, filter);
    if (!list.length) {
      const t = query.trim();
      return (
        <div className="max-w-[880px] pb-6 pt-10">
          <p className="text-[16px] leading-[22px]"><b>No purchase order matches</b></p>
          <p className="mt-1 max-w-[560px] text-[14px] leading-[21px] text-muted">{t ? `Nothing matches “${t}”${filter !== 'all' ? ` among ${STW[FKEYWORD[filter]].toLowerCase()} orders` : ''}.` : 'Nothing fits those filters.'} Try another word, or clear the filters.</p>
          <div className="mt-5 flex flex-wrap gap-2"><Button variant="secondary" leftIcon={X} onClick={() => { setFilter('all'); setSupplier('all'); setQuery(''); setGrouped('flat'); setSort('attn'); }}>Clear filters</Button></div>
        </div>
      );
    }
    if (grouped === 'sup') {
      const g = new Map<string, PurchaseOrder[]>();
      list.forEach((p) => { (g.get(p.supplier) ?? g.set(p.supplier, []).get(p.supplier))!.push(p); });
      return <>{headRow()}{[...g].sort((a, b) => sw(a[0]).localeCompare(sw(b[0]))).map(([id, ps]) => {
        const who = contacts[id]?.who, open = ps.filter(M.isOpen).length;
        return (
          <section key={id} aria-label={sw(id)}>
            <div className="flex items-center gap-1.5 border-b border-rule pb-2 pt-8 text-[13px] font-semibold text-text"><Storefront aria-hidden size={14} className="flex-none text-muted" /><span>{sw(id)}</span><span className="text-[13px] font-medium tabular-nums text-muted">{ps.length}</span><span className="text-[12px] font-normal text-muted">{open ? `${open} open` : 'none open'}{who ? ` · ${who}` : ''}</span></div>
            <div className="flex flex-col">{ps.map((x) => row(x, true))}</div>
          </section>
        );
      })}</>;
    }
    return <>{headRow()}<div className="flex flex-col">{list.map((x) => row(x, false))}</div></>;
  };

  const counts = M.counts();
  const hide = loading || poErr;
  const nFilt = (supplier !== 'all' ? 1 : 0) + (sort !== 'attn' ? 1 : 0) + (grouped === 'sup' ? 1 : 0);
  const sups = [...new Set(all.map((p) => p.supplier))].sort((a, b) => sw(a).localeCompare(sw(b)));
  const menu = 'flex w-[190px] flex-col gap-1 @max-[900px]/sheet:w-auto @max-[900px]/sheet:min-w-[150px] @max-[900px]/sheet:flex-[1_1_0] max-[640px]:w-auto max-[640px]:min-w-0';
  const searchInput = 'h-[34px] w-full rounded-control border border-control bg-surface py-0 pl-[34px] pr-2.5 text-[14px] text-text placeholder:text-muted placeholder:opacity-100 hover:border-muted outline-none focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent max-[640px]:h-11 max-[640px]:text-[16px]';
  /* 197-205 segHTML */
  const segs = (
    <div className="flex items-end gap-3 max-[640px]:order-first [grid-row:1]">
      <SegmentedControl aria-label="Show" value={filter} onChange={(v) => setFilter(v as POFilter)} className="m-0 [&_button]:h-8 [&_button]:px-3.5 [&_button]:leading-5 max-[640px]:hidden"
        options={FILTERS.map((k) => ({ value: k, label: <span>{FWORD[k]}{hide ? '' : <> <span className={cn('ml-1 tabular-nums', filter === k ? 'font-medium text-text' : 'font-normal text-muted')}>{counts[k]}</span></>}</span> }))} />
      <div className="hidden min-w-0 flex-[1_1_auto] max-[640px]:block">
        <span id="l-st" className="text-[12px] text-muted">Show</span>
        <Select id="f-st" aria-labelledby="l-st" size="sm" className="w-full [&>button]:text-[13px]" value={filter} onValueChange={(v) => setFilter(v as POFilter)}
          options={FILTERS.map((k) => ({ value: k, label: k === 'all' ? 'All orders' : FWORD[k], meta: hide ? '' : String(counts[k]) }))} />
      </div>
      <Button variant="secondary" leftIcon={Funnel} aria-expanded={fopen} aria-controls="fmore" onClick={() => setFopen(!fopen)} className="hidden max-[640px]:inline-flex max-[640px]:h-11 max-[640px]:flex-none max-[640px]:px-3.5">Filters{nFilt ? <span className="ml-0.5 font-semibold tabular-nums text-muted">{nFilt}</span> : null}</Button>
    </div>
  );
  /* 206-214 filtersHTML */
  const filters = (
    <div role="search" className="flex flex-wrap items-end gap-x-4 gap-y-4 [grid-row:2] [grid-column:1/-1] max-[640px]:grid max-[640px]:grid-cols-1 max-[640px]:gap-3">
      <label className="relative block max-w-[440px] flex-[1_1_280px] @max-[900px]/sheet:max-w-none @max-[900px]/sheet:basis-full max-[640px]:max-w-none max-[640px]:[grid-column:1/-1]">
        <span className="sr-only">Search purchase orders</span>
        <MagnifyingGlass aria-hidden size={16} className="pointer-events-none absolute left-2.5 top-1/2 -mt-2 text-muted" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" placeholder="Search by PO number, supplier or product" className={searchInput} />
      </label>
      <div id="fmore" className={cn('contents', 'max-[640px]:hidden', fopen && 'max-[640px]:!grid max-[640px]:grid-cols-2 max-[640px]:gap-3 max-[640px]:[grid-column:1/-1]')}>
        <div className={menu}><span id="l-sup" className="text-[12px] text-muted">Supplier</span>
          <Select id="f-sup" aria-labelledby="l-sup" size="sm" className="w-full [&>button]:text-[13px]" value={supplier} onValueChange={setSupplier} options={[{ value: 'all', label: 'All suppliers' }, ...sups.map((s) => ({ value: s, label: sw(s) }))]} /></div>
        <div className={menu}><span id="l-sort" className="text-[12px] text-muted">Sort</span>
          <Select id="f-sort" aria-labelledby="l-sort" size="sm" className="w-full [&>button]:text-[13px]" value={sort} onValueChange={(v) => setSort(v as POSort)} options={SORTS.map(([value, label]) => ({ value, label }))} /></div>
        <div className={cn(menu, 'max-[640px]:[grid-column:1/-1]')}><span id="l-grp" className="text-[12px] text-muted">Show orders</span>
          <SegmentedControl aria-label="Show orders" value={grouped} onChange={(v) => setGrouped(v as 'flat' | 'sup')} className="m-0 self-start [&_button]:h-8 [&_button]:px-3.5 [&_button]:leading-5" options={[{ value: 'flat', label: 'In one list' }, { value: 'sup', label: 'By supplier' }]} /></div>
      </div>
    </div>
  );
  /* 215-221 emptyHTML */
  const empty = F.empty ? (
    <div className="max-w-[880px]"><p className="text-[16px]"><b>No products yet</b></p><p className="mt-1.5 max-w-[560px] text-[14px] leading-[21px] text-muted">Purchase orders start from products that need stock. Add products first.</p>
      <div className="mt-5 flex flex-wrap gap-2"><Button variant="secondary" leftIcon={Package} onClick={() => undefined}>Go to Products</Button></div></div>
  ) : (
    <div className="max-w-[880px]"><p className="text-[16px]"><b>No purchase orders yet</b></p>
      <p className="mt-1.5 max-w-[560px] text-[14px] leading-[21px] text-muted">An order starts as a list on Products. When you press Proceed, it becomes a draft here. Print it, send it your usual way, then it is marked sent{can('confirm_po') ? '' : ' (your manager does that)'}. When the delivery arrives you receive it on this page and the stock goes up.</p>
      <ol className="m-0 mt-6 grid max-w-[760px] list-none grid-cols-3 gap-6 p-0 max-[640px]:grid-cols-1 max-[640px]:gap-4">
        {[['1 · Add to a list', 'On Products, add what needs stock.'], ['2 · Proceed, print, send', 'The list becomes a draft purchase order.'], ['3 · Receive', 'Count what arrived. Stock updates.']].map(([b, s]) => <li key={b} className="flex flex-col gap-1 border-t border-border pt-3"><b className="text-[14px] font-semibold">{b}</b><span className="text-[13px] leading-[19px] text-muted">{s}</span></li>)}
      </ol>
      <div className="mt-5 flex flex-wrap gap-2"><Button leftIcon={Package} onClick={() => undefined}>Go to Products</Button>{nLists ? <Button variant="secondary" leftIcon={ListChecks} onClick={() => undefined}>{plural(nLists, 'order list', 'order lists')} waiting</Button> : null}</div></div>
  );
  /* 222-225 loadingHTML */
  const sk = (w: string, h = 14) => <Skeleton width={w} height={h} className="max-w-full rounded-[3px]" />;
  const loadingBody = (
    <div className="flex flex-col gap-8 max-[640px]:gap-7">
      <div className="grid grid-cols-1 items-center gap-6 max-[640px]:gap-4">
        <div className="flex flex-wrap items-end gap-4 [grid-row:2]"><label className="relative block max-w-[440px] flex-[1_1_280px] @max-[900px]/sheet:max-w-none @max-[900px]/sheet:basis-full"><span className="sr-only">Search purchase orders</span><MagnifyingGlass aria-hidden size={16} className="pointer-events-none absolute left-2.5 top-1/2 -mt-2 text-muted" /><input type="search" disabled placeholder="Search by PO number, supplier or product" className={searchInput} /></label></div>
        <div className="[grid-row:1]"><div className="inline-flex gap-0.5 rounded-control bg-raised-2 p-0.5 max-[640px]:hidden">{['All', 'Draft', 'Sent', 'Part in', 'Short', 'Received', 'Cancelled'].map((t) => <button key={t} type="button" disabled className="h-8 rounded-[4px] border border-transparent px-3.5 text-[13px] text-muted max-[640px]:hidden">{t}</button>)}</div></div>
      </div>
<section className="flex min-w-0 flex-col" aria-busy="true" aria-label="Loading purchase orders">{headRow()}
        <div className="flex flex-col">{[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn('pointer-events-none -mx-2 grid min-h-[72px] w-[calc(100%+16px)] items-center gap-x-6 border-t border-rule px-2 py-3.5 first:border-t-transparent max-[1099px]:gap-x-4 max-[640px]:mx-0 max-[640px]:min-h-0 max-[640px]:w-full max-[640px]:px-0 max-[640px]:py-4', money ? COLS_M : COLS_C, PHONE_COLS)}>
            <span className="flex min-w-0 flex-col items-start gap-2 max-[640px]:col-start-1 max-[640px]:row-start-1">{sk(`${62 - i * 8}%`, 16)}{sk('40%', 12)}</span>
            <span className="flex min-w-0 flex-col items-start gap-[3px] max-[640px]:col-start-1 max-[640px]:row-start-2 max-[640px]:flex-row max-[640px]:flex-wrap max-[640px]:items-center max-[640px]:gap-x-2.5 max-[640px]:gap-y-1">{sk('64px')}{sk('48px', 12)}</span>
            <span className="min-w-0 max-[640px]:col-start-1 max-[640px]:row-start-3 max-[640px]:flex max-[640px]:flex-wrap max-[640px]:gap-x-2">{sk('72px')}{sk('56px', 12)}</span>
            <span className="min-w-0 max-[1099px]:hidden">{sk('60px')}</span>
            {money ? <span className="text-[14px] font-medium max-[640px]:col-start-2 max-[640px]:row-start-1 max-[640px]:self-start">{sk('64px')}</span> : null}
            <span className="flex justify-end max-[640px]:col-start-2 max-[640px]:[grid-row:2/4] max-[640px]:self-center">{sk('52px')}</span>
          </div>))}</div></section>
    </div>
  );
  /* 226-229 topActions */
  const nOpen = all.filter((p) => M.isOpen(p)).length;
  const topActions = (
    <>
      <Button variant="secondary" leftIcon={ListChecks} className="max-[640px]:hidden">Order lists</Button>
      {can('receive') ? <Button leftIcon={Truck} disabled={poErr || loading || !nOpen} className="max-[640px]:h-11 max-[640px]:flex-[1_1_auto]">Receive a delivery</Button> : null}
    </>
  );
  /* 230-238 listHTML */
  const body = loading ? loadingBody : poErr ? (
    <div className="flex flex-col gap-8 max-[640px]:gap-7">
      <div role="alert" className="m-0 flex items-center gap-2.5 rounded-card border border-dashed border-control px-3 py-2.5 text-[13px]"><WarningCircle aria-hidden size={16} className="flex-none text-bad" /><span>{`Purchase orders did not load. This is the list from ${now.lastLoaded}. Nothing can be received, cancelled or sent until it loads, so nothing is counted twice.`}</span><Button variant="secondary" leftIcon={ArrowClockwise} className="ml-auto" onClick={() => setRetried(true)}>Retry</Button></div>
      <div {...({ inert: '' } as object)} className="mt-6"><section className="flex min-w-0 flex-col [&_[data-row]]:opacity-60">{results()}</section></div>
    </div>
  ) : !all.length ? <div className="flex flex-col gap-8 max-[640px]:gap-7">{empty}</div> : (
    <div className="flex flex-col gap-8 max-[640px]:gap-7">
      <div className="grid grid-cols-1 items-center gap-6 max-[640px]:gap-4">{filters}{segs}</div>
      <section id="results" aria-live="polite" className="flex min-w-0 flex-col">{results()}</section>
    </div>
  );
  const stamp = `${asof ? `${todayLabel} 2026 · preview` : now.date} · ${loading ? `Loading… last loaded ${now.lastLoaded}` : poErr ? `Last loaded ${now.lastLoaded}` : `Updated ${now.time}`}`;
  const hl = M.headline();
  const sheetBar = <SheetBar wrapChildren={false} actionsFirst={false} actions={<AskLedaBar variant="bar" scope="Purchase orders" />}><SheetBarWhere platform={platform} page="Purchase orders" note={as !== 'manager' ? `Viewing as ${V.viewer.short}, ${V.roleLabel.toLowerCase()}` : undefined} /></SheetBar>;
  return (
    <InventoryChrome tenant={tenant} as={as} nav="pos" page="Orders" sheetBar={sheetBar} lists={nLists}
      status={<InventoryStatusBar platform={platform} dataLink={dataLink} viewer={{ name: V.viewer.short, role: V.roleLabel }} leda={{ canDecide: can('confirm_po'), managerName: P.viewers.manager.viewer.short }} updatedAt={loading ? `Loading… last loaded ${now.lastLoaded}` : now.time} />}>
      <div className="min-w-0 px-pad pb-10 pt-6 max-[640px]:px-4 max-[640px]:pb-24 max-[640px]:pt-4">
        <div className="flex items-start gap-6 max-[1099px]:flex-wrap max-[640px]:flex-col max-[640px]:gap-3">
          <div className="min-w-0 flex-1 max-[1099px]:basis-full"><h1 className="m-0 text-[22px] font-semibold leading-7 tracking-[-0.01em] max-[640px]:text-[20px] max-[640px]:leading-[26px]">Purchase orders</h1><div id="hl"><p className="mt-2 flex items-start gap-2 text-[15px] leading-[22px] max-[640px]:text-[14px] max-[640px]:leading-[21px]"><LedaMark size={16} decorative active={hl.loading} className="mt-[3px] shrink-0" />{hl.loading ? <Skeleton width={440} height={14} className="max-w-full rounded-[3px]" /> : <span>{hl.text}</span>}</p></div></div>
          <div className="flex flex-none items-center gap-4 pt-0.5 max-[1099px]:basis-full max-[1099px]:justify-start max-[640px]:w-full max-[640px]:flex-wrap max-[640px]:pt-0"><span className="whitespace-nowrap text-[12px] text-muted max-[1099px]:mr-auto max-[640px]:basis-full">{stamp}</span>{topActions}</div>
        </div>
        <div className="mt-8 max-[640px]:mt-6">{body}</div>
      </div>
    </InventoryChrome>
  );
}

const STONE_OF: Record<string, POTone> = { DRAFT: 'dash', ORDERED: 'info', PARTIAL: 'warn', SHORT: 'warn', RECEIVED: 'ok', CANCELLED: 'off' };
const FKEYWORD: Record<POFilter, 'DRAFT' | 'ORDERED' | 'PARTIAL' | 'SHORT' | 'RECEIVED' | 'CANCELLED'> = { all: 'DRAFT', draft: 'DRAFT', sent: 'ORDERED', part: 'PARTIAL', short: 'SHORT', received: 'RECEIVED', cancelled: 'CANCELLED' };
