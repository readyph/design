import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowsDownUp, ArrowSquareOut, CaretRight, ChartLineDown, ListPlus, Lock, Package, Prohibit, Receipt, Scales, Storefront, TrendDown, Truck, WarningCircle } from '@phosphor-icons/react';
import { ActionLink } from '../components/ActionLink';
import { LedaMark } from '../components/Leda';
import { AskLedaBar } from '../components/AskLedaBar';
import { Button } from '../components/Button';
import { ErrorBlock } from '../components/ErrorBlock';
import { Modal } from '../components/Modal';
import { NewProductRequests } from '../components/NewProductRequest';
import { Notice } from '../components/Notice';
import { OrderListsStrip, ProductFilters, ProductList, ProductSelectionBar, ProductStatusTabs, ProductSupplierBar, type ProductGroupData, type ProductRowData, type ProductStatusFilter } from '../components/ProductList';
import { QuantityStepper } from '../components/QuantityStepper';
import { RecordMovementForm, type RecordProduct } from '../components/RecordMovementForm';
import { SegmentedControl } from '../components/SegmentedControl';
import { SheetBar, SheetBarWhere } from '../components/SheetBar';
import { InventoryStatusBar } from '../components/StatusBar';
import { StockRunway, type StockRunwayPoint } from '../components/StockRunway';
import { StockStatus, type StockState } from '../components/StockStatus';
import { TextField } from '../components/TextField';
import { Select } from '../components/Select';
import { addToast } from '../components/toast/toastStore';
import { PRODUCTS, UNITS, type PData, type PList, type PMove, type PProduct, type ProductsRole, type ProductsTenant } from './Products.data';
import { InventoryChrome } from './Products.chrome';
import { useProductsLeda } from './Products.leda';
import { OrderListsPanel } from '../components/OrderListsPanel';
import { BarcodeSheet, type BarcodeProduct } from '../components/BarcodeSheet';

/* RDY-404. Page: Products. Source: workshop/prototypes/inventory-home/round-1/final/products.js (+ products.html), handover 2.2.
   URL params as props: ?tenant ?as ?state ?open ?panel ?f ?qs ?cat ?sup. Logic ported from products.js (line refs in comments). */
export interface ProductsPageProps {
  tenant?: ProductsTenant;
  as?: ProductsRole;
  state?: 'live' | 'quiet' | 'loading' | 'error' | 'empty' | 'degraded' | 'down';
  open?: string;
  panel?: 'adjust' | 'list';
  f?: ProductStatusFilter;
  qs?: string;
  cat?: string;
  sup?: string;
  /** Story only: open the Add product dialog (products.js 604). */
  addDialog?: boolean;
  /** Story only: barcodes a stocker scanned that the system does not know (Needs setting up). */
  requests?: { id: string; barcode: string; name?: string; qty?: number; loc?: string; by: string; at: string; photo?: boolean; note?: string }[];
  /** Story only: open the order lists panel (I8). */
  ordersOpen?: boolean;
}

const MINUS = '−';
const toMin = (s: string | undefined | null) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim()); return m ? +m[1] * 60 + +m[2] : 0; };
const hm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-PH')}`;
const unitOf = (p: { unit: string }, n: number) => (p.unit === 'pc' ? 'pc' : n === 1 ? p.unit : `${p.unit}s`);
const signed = (n: number) => (n > 0 ? '+' : n < 0 ? MINUS : '') + Math.abs(n);
const LOWTIP = 'The stock is low and we need to restock soon.';
const MVW: Record<string, [string, typeof Truck]> = { received: ['Stock in', Truck], sold: ['Stock out', ArrowSquareOut], transfer: ['Stock out', ArrowSquareOut], damaged: ['Stock out', ArrowSquareOut], count: ['Count', Scales] };
/* products.css 46-57 (.pnl-h, .va), 74-84 (.row, .t1, .t2) */
const VA = 'inline-flex h-6 cursor-pointer items-center gap-1 rounded-[4px] border-0 bg-transparent px-1 text-[12px] font-semibold text-accent no-underline hover:text-lk-hover active:text-lk-hover active:opacity-[.85] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent';
const ROW = 'relative grid w-[calc(100%+16px)] -mx-2 items-center gap-x-3 rounded-none border-t border-rule bg-clip-padding px-2 py-3 text-left text-text first:border-t-transparent';
const T1 = 'block min-w-0 truncate text-[14px] font-medium leading-5';
function Ref({ r }: { r?: string | null }) { return isId(r) ? <span className="font-mono text-[12px]">{r}</span> : <>{r}</>; }
const DOT: Record<string, string> = { bad: 'bg-bad', warn: 'bg-warn', info: 'bg-info', dash: 'h-1.5 w-1.5 border-[1.5px] border-dashed border-muted' };
/* products.css 93-102: a dot and a word; the colour lives on the dot, red only when short or out */
function Dot({ tone, children }: { tone: 'bad' | 'warn' | 'info' | 'dash'; children: React.ReactNode }) {
  return <span className={`inline-flex h-5 items-center gap-1.5 whitespace-nowrap text-[12px] font-medium ${tone === 'bad' ? 'text-bad' : tone === 'dash' ? 'text-muted' : 'text-text'}`}><span aria-hidden className={`flex-none rounded-full ${tone === 'dash' ? '' : 'h-[7px] w-[7px]'} ${DOT[tone]}`} />{children}</span>;
}
function PanelHead({ icon: Icon, title, count, sub, right }: { icon: typeof Truck; title: string; count?: number; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex min-h-8 items-baseline gap-2.5 border-b border-border pb-2.5 max-[640px]:flex-wrap">
      <Icon aria-hidden size={18} className="self-center text-muted" /><h2 className="m-0 whitespace-nowrap text-[16px] font-semibold leading-[22px]">{title}</h2>
      {count != null ? <span className="text-[13px] font-medium tabular-nums text-muted">{count}</span> : null}
      {sub ? <span className="min-w-0 truncate text-[12px] text-muted max-[640px]:hidden">{sub}</span> : null}
      {right ? <span className="ml-auto flex items-center gap-4 self-center whitespace-nowrap text-[12px] text-muted max-[640px]:ml-0 max-[640px]:basis-full max-[640px]:pt-1">{right}</span> : null}
    </div>
  );
}
/* products.css 209-211 (.tip); links.css 27-31 (phone bar: note above the buttons, pointing down) */
function Tip({ id, className = '', down }: { id: string; className?: string; down?: string }) {
  return (
    <span id={id} role="note" className={`relative max-w-[270px] rounded-[4px] border border-control bg-raised px-2.5 py-[7px] text-[12px] leading-[17px] text-text ${className}`}>
      {LOWTIP}
      <span aria-hidden className={`absolute h-2 w-2 rotate-45 bg-raised ${down ? `-bottom-[5px] border-b border-r border-control ${down === '25%' ? 'left-[calc(25%-4px)]' : 'left-[calc(50%-4px)]'}` : '-top-[5px] left-[22px] border-l border-t border-control'}`} />
    </span>
  );
}
const isId = (r?: string | null) => /^[A-Z]{2,}-\d+/.test(r || '');

export function ProductsPage({ tenant = 'a', as = 'manager', state = 'live', open: openProp, panel: panelProp, f = 'all', qs = '', cat: catProp = 'all', sup: supProp = 'all', addDialog, requests, ordersOpen: ordersProp }: ProductsPageProps) {
  const D: PData = PRODUCTS[tenant];
  const V = D.viewers[as];
  const can = (p: string) => V.can.includes(p);
  const NOW = toMin(D.now.hm), OPEN = toMin(D.business.hours.open), CLOSE = toMin(D.business.hours.close);
  const [retried, setRetried] = useState(false);
  const [cleared, setCleared] = useState(false);
  const quiet = state === 'quiet', loading = state === 'loading', down = state === 'down' && !cleared;
  const [ordersOpen, setOrdersOpen] = useState(!!ordersProp);
  const [bc, setBc] = useState<'search' | 'form' | null>(null);
  const poErr = state === 'error' && !retried;
  const [lists, setLists] = useState<PList[]>(() => D.lists.map((l) => ({ ...l, lines: l.lines.map((x) => ({ ...x })) })));
  const [added, setAdded] = useState<PProduct[]>([]);
  const [delta, setDelta] = useState<Record<string, number>>({});
  const [local, setLocal] = useState<Record<string, PMove[]>>({});
  const [recv, setRecv] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<ProductStatusFilter>(f);
  const [q, setQ] = useState(qs);
  const [cat, setCat] = useState(catProp);
  const [sup, setSup] = useState(supProp);
  const [sort, setSort] = useState('attn');
  const [fopen, setFopen] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(openProp ?? null);
  const [panel, setPanel] = useState<'adjust' | 'list' | null>(panelProp ?? null);
  const [mvf, setMvf] = useState('all');
  const [mvAll, setMvAll] = useState(false);
  const [ro, setRo] = useState<{ qty: number | null; sup: string | null }>({ qty: null, sup: null });
  const [np, setNp] = useState<React.ComponentProps<typeof NewProductRequests>['requests']>(requests ?? []) /* receiving.js 12, 44: starts empty in the workshop; stories seed it to show the section (GAP: workshop sample has none) */;
  const [dlg, setDlg] = useState(!!addDialog);
  const [form, setForm] = useState({ name: '', sku: '', cat: D.categories[0].id, unit: UNITS[0], sup: D.suppliers[0].id, barcode: '', reorder: '5', err: '' });

  const supOf = (id: string) => D.suppliers.find((s) => s.id === id) ?? { id, name: id, leadTime: '' };
  const catName = (id: string) => D.categories.find((c) => c.id === id)?.name ?? '';
  const locOf = (id: string) => D.locations.find((l) => l.id === id) ?? { id, name: '', holds: '' };
  const short = (id: string) => { const w = (supOf(id).name || '').split(' '); return w[0].length <= 2 && w[1] ? `${w[0]} ${w[1]}` : w[0]; };
  const mgr = 'your manager', Mgr = 'Your manager';
  const base = useMemo(() => D.products.concat(added).map((p) => (quiet ? { ...p, onHand: Math.max(p.onHand, p.reorder + Math.ceil(p.reorder * 0.6)) } : p)), [D, added, quiet]);
  const prod = (id: string) => base.find((p) => p.id === id);
  const onHand = (p: PProduct) => p.onHand + (delta[p.id] || 0);
  const st = (p: PProduct): StockState => { const n = onHand(p); return n <= 0 ? 'out' : n <= p.reorder ? 'low' : 'ok'; };
  const dpos = lists.filter((l) => l.no).map((l) => ({ no: l.no as string, supplier: l.sup, supplierName: supOf(l.sup).name, status: 'DRAFT', expected: D.draftExpected[l.no as string] ?? '', unitsOrdered: 0, unitsReceived: 0, lines: l.lines.map((x) => ({ p: x.p, ordered: x.qty, received: 0 })) }));
  const allPOs = D.pos.filter((po) => po.status !== 'DRAFT').concat(dpos);
  const remaining = (po: { no: string }, l: { p: string; ordered: number; received: number }) => l.ordered - l.received - (recv[`${po.no}:${l.p}`] || 0);
  const incoming = (pid: string) => (poErr ? [] : allPOs.filter((po) => ['DRAFT', 'ORDERED', 'PARTIAL'].includes(po.status)).map((po) => { const l = po.lines.find((x) => x.p === pid); return l && remaining(po, l) > 0 ? { po, qty: remaining(po, l), draft: po.status === 'DRAFT' } : null; }).filter((x): x is NonNullable<typeof x> => !!x));
  const ordered = (pid: string) => incoming(pid).filter((x) => !x.draft);
  const onList = (pid: string) => { for (const l of lists) { const line = l.lines.find((x) => x.p === pid); if (line) return { list: l, line }; } return null; };
  const shortDate = (po: { expected: string }) => (/^(\w{3} \d+ \w{3})/.exec(po.expected || '') || [])[1] || po.expected || '';
  const suggestQty = (p: PProduct) => Math.max(p.reorder, p.reorder * 2 - onHand(p) - ordered(p.id).reduce((s, x) => s + x.qty, 0), 1);
  const addable = (p: PProduct) => st(p) !== 'ok' && !onList(p.id) && !ordered(p.id).length && !poErr && !down && can('draft_po');
  const costFor = (p: PProduct, sid: string) => (D.alt[p.id] ?? []).find((a) => a.sup === sid)?.cost ?? p.cost;
  const jobsFor = (pid: string) => D.jobs.filter((j) => toMin(j.at) >= NOW && j.needs.some((n) => n.p === pid));

  /* the list (products.js 140-200) */
  const isFiltered = !!(q.trim() || cat !== 'all' || sup !== 'all');
  const matches = (p: PProduct) => {
    const s = q.trim().toLowerCase();
    if (s && ![p.name, p.sku, p.barcode || '', catName(p.cat), supOf(p.supplier).name, locOf(p.loc).name].some((x) => String(x).toLowerCase().includes(s))) return false;
    if (cat !== 'all' && p.cat !== cat) return false;
    if (sup !== 'all' && p.supplier !== sup) return false;
    const s2 = st(p);
    return !(status === 'low' && s2 !== 'low') && !(status === 'out' && s2 !== 'out') && !(status === 'order' && !ordered(p.id).length);
  };
  const ratio = (p: PProduct) => onHand(p) / p.reorder;
  const sorted = (rows: PProduct[]) => {
    const by: Record<string, (a: PProduct, b: PProduct) => number> = { name: (a, b) => a.name.localeCompare(b.name), cat: (a, b) => catName(a.cat).localeCompare(catName(b.cat)) || a.name.localeCompare(b.name), where: (a, b) => locOf(a.loc).name.localeCompare(locOf(b.loc).name) || a.name.localeCompare(b.name), attn: (a, b) => ratio(a) - ratio(b) || a.name.localeCompare(b.name) };
    return rows.slice().sort(by[sort] || by.attn);
  };
  const rowOf = (p: PProduct): ProductRowData => {
    const s = st(p), ord = ordered(p.id), ol = onList(p.id);
    const statusLine = s === 'ok' ? undefined : poErr ? 'Orders not loaded' : ord.length ? <>On <span className="font-mono">{ord[0].po.no}</span> {'·'} {shortDate(ord[0].po)}</> : ol ? `On ${short(ol.list.sup)} list · ${ol.line.qty}` : 'No order yet';
    const add = !(poErr || down || ol || s === 'ok' || ord.length || !can('draft_po'));
    const n = suggestQty(p);
    return { id: p.id, name: p.name, sku: p.sku, category: catName(p.cat), where: locOf(p.loc).name, onHand: onHand(p), unit: p.unit, reorder: p.reorder, status: s, statusLine, supplier: supOf(p.supplier).name,
      action: add ? { kind: 'add', label: `Add ${n} to order list`, ariaLabel: `Add ${n} ${p.name} to the ${supOf(p.supplier).name} order list`, onAdd: () => addToList(p.id, null, null) } : { kind: 'view', label: 'View' } };
  };
  const rows = sorted(base.filter(matches));
  const GRPS: Record<StockState, { icon: ProductGroupData['icon']; name: string; note?: string }> = { out: { icon: Prohibit, name: 'Out of stock', note: 'Order these first' }, low: { icon: TrendDown, name: 'Low stock', note: 'At or under the reorder level' }, ok: { icon: Package, name: 'In stock' } };
  const groups: ProductGroupData[] = (['out', 'low', 'ok'] as StockState[]).map((k) => ({ id: k, ...GRPS[k], rows: rows.filter((p) => st(p) === k).map(rowOf) })).filter((g) => g.rows.length);
  const addSet = new Set(base.filter(addable).map((p) => p.id));
  const cnt = { low: base.filter((p) => st(p) === 'low').length, out: base.filter((p) => st(p) === 'out').length, order: base.filter((p) => ordered(p.id).length).length };
  const total = D.total + added.length;

  function toast(description: string, undo?: () => void) { addToast({ description, ...(undo ? { action: { label: 'Undo', onClick: undo } } : {}) }); }
  /* products.js 562-571 */
  function addToList(pid: string, qty: number | null, supId: string | null) {
    const p = prod(pid); if (!p) return;
    if (poErr) { toast('Purchase orders did not load, so nothing was added. Retry first.'); return; }
    const sid = supId || p.supplier, n = qty ?? suggestQty(p), before = lists;
    const without = lists.map((l) => ({ ...l, lines: l.lines.filter((x) => x.p !== pid) })).filter((l) => l.lines.length || l.no);
    const existed = !!without.find((l) => l.sup === sid);
    const next = existed ? without.map((l) => (l.sup === sid ? { ...l, lines: [...l.lines, { p: pid, qty: n, by: V.viewer.id }] } : l)) : [...without, { id: `L-${sid}`, no: null, sup: sid, by: V.viewer.id, at: D.now.time, lines: [{ p: pid, qty: n, by: V.viewer.id }] }];
    setLists(next); setPanel(null); setSel((s) => { const x = new Set(s); x.delete(pid); return x; });
    toast(`${n} ${p.name} ${onList(pid) ? 'updated on' : 'added to'} the ${supOf(sid).name} order list. Nothing is sent.`, () => setLists(before));
  }
  function addMany(items: PProduct[]) {
    const before = lists; let next = lists;
    items.forEach((p) => { const n = suggestQty(p); const has = next.find((l) => l.sup === p.supplier); next = has ? next.map((l) => (l.sup === p.supplier ? { ...l, lines: [...l.lines, { p: p.id, qty: n, by: V.viewer.id }] } : l)) : [...next, { id: `L-${p.supplier}`, no: null, sup: p.supplier, by: V.viewer.id, at: D.now.time, lines: [{ p: p.id, qty: n, by: V.viewer.id }] }]; });
    setLists(next); setSel(new Set());
    const nl = new Set(items.map((p) => p.supplier)).size;
    toast(`${items.length} ${items.length === 1 ? 'product' : 'products'} added to ${sup !== 'all' ? `the ${short(sup)} order list` : `${nl} order ${nl === 1 ? 'list' : 'lists'}`}. Nothing is sent.`, () => setLists(before));
  }
  const unlist = (p: PProduct) => { const ol = onList(p.id); if (!ol) return; const before = lists; setLists(lists.map((l) => ({ ...l, lines: l.lines.filter((x) => x.p !== p.id) })).filter((l) => l.lines.length || l.no)); setPanel(null); toast(`${p.name} taken off the ${supOf(ol.list.sup).name} order list.`, () => setLists(before)); };
  function receive(no: string, pid: string, k: number) {
    const p = prod(pid); if (!p) return; const key = `${no}:${pid}`;
    setRecv((r) => ({ ...r, [key]: (r[key] || 0) + k })); setDelta((d) => ({ ...d, [pid]: (d[pid] || 0) + k }));
    toast(`${k} ${unitOf(p, k)} of ${p.sku} received on ${no}.`, () => { setRecv((r) => ({ ...r, [key]: r[key] - k })); setDelta((d) => ({ ...d, [pid]: d[pid] - k })); });
  }
  function saveAdd() {
    const name = form.name.trim(), sku = form.sku.trim(), bc = form.barcode.replace(/[\s-]/g, '');
    const err = !name ? 'Give the product a name.' : !sku ? 'Give the product an SKU.' : bc && !/^\d{8,14}$/.test(bc) ? 'A barcode is 8 to 14 digits. Leave it empty if you do not have it.' : (() => { const dup = bc && base.find((p) => p.barcode === bc); return dup ? `That barcode is already ${dup.name}.` : ''; })();
    if (err) { setForm({ ...form, err }); return; }
    setAdded([...added, { id: `new${added.length + 1}`, barcode: bc || undefined, sku, name, cat: form.cat, unit: form.unit, onHand: 0, reorder: Math.max(0, +form.reorder || 0), cost: 0, price: 0, supplier: form.sup, loc: D.locations[0].id }]);
    setDlg(false); setSort('attn'); toast(`${name} added. It is out of stock until you receive or count it.`);
  }

  const go = (name: string) => { try { window.location.hash = `#${name}`; } catch { /* no location */ } };
  const retry = () => { setRetried(true); toast('Purchase orders loaded.'); };
  /* products.js 584-590 */
  function draftAll() {
    const items = base.filter(addable); if (!items.length) { toast('Every product that needs stock is on a list or an order already.'); return; }
    const before = lists; let next = lists;
    items.forEach((p) => { const n = suggestQty(p); const has = next.find((l) => l.sup === p.supplier); next = has ? next.map((l) => (l.sup === p.supplier ? { ...l, lines: [...l.lines, { p: p.id, qty: n, by: 'leda' }] } : l)) : [...next, { id: `L-${p.supplier}`, no: null, sup: p.supplier, by: 'leda', at: D.now.time, lines: [{ p: p.id, qty: n, by: 'leda' }] }]; });
    setLists(next);
    const nl = new Set(items.map((p) => p.supplier)).size;
    toast(`${items.length} ${items.length === 1 ? 'product' : 'products'} added to ${nl} order ${nl === 1 ? 'list' : 'lists'} by Leda. Nothing is sent.`, () => setLists(before));
  }
  const ledaUi = useProductsLeda({ D, tenant, can, products: base, total: D.total + added.length, onHand, status: st, addable, suggestQty, onList, ordered, shortSup: short, supName: (id) => supOf(id).name, locName: (id) => locOf(id).name, shortDate, unitOf, openProduct: (id, pn) => { setOpenId(id); setPanel(pn ?? null); if (pn === 'list') setRo({ qty: null, sup: null }); }, addToList: (pid) => addToList(pid, null, null), draftAll, go }, openId ? `${prod(openId)?.sku ?? ''}` : 'Products', openId);

  /* headline (products.js 266-281) */
  const headline = (() => {
    if (!base.length) return 'No products yet. Add your first, or let Leda read a supplier list.';
    if (down) return `Showing what was loaded at ${D.now.lastLoaded}. Counts may have changed since.`;
    const need = base.filter((p) => st(p) !== 'ok'), out = need.filter((p) => st(p) === 'out').length, low = need.length - out;
    const none = need.filter((p) => !ordered(p.id).length && !onList(p.id)).length;
    if (!need.length) return 'Everything is above its reorder level. Nothing needs ordering today.';
    return `${need.length} ${need.length === 1 ? 'product needs' : 'products need'} stock: ${low} low stock, ${out} out of stock. ${poErr ? 'Orders did not load, so what is on order is not shown.' : none ? `${none} ${none === 1 ? 'is' : 'are'} on no order list or PO yet.` : 'All of them are on an order list or a PO.'}`;
  })();
  const perSup = lists.map((l) => ({ id: l.sup, name: supOf(l.sup).name, n: l.lines.length, no: l.no }));
  const nUp = lists.filter((l) => !l.no).length, nDr = lists.filter((l) => l.no).length;
  const plr = (n: number, a: string, b: string) => `${n} ${n === 1 ? a : b}`;
  const summary = [nUp ? plr(nUp, 'list to proceed', 'lists to proceed') : '', nDr ? plr(nDr, 'draft PO, not sent', 'draft POs, not sent') : ''].filter(Boolean).join(', ') || 'none open';
  const stripLists = poErr ? [] : perSup.map((x) => ({ id: x.id, name: `${short(x.id)} order list`, meta: `${x.n} ${x.n === 1 ? 'product' : 'products'} · ${x.no ? `${x.no} draft, not sent` : 'not a PO yet'}`, ariaLabel: `${x.name} ${x.no ? `draft ${x.no}, not sent` : 'order list, still to proceed'}, ${x.n} ${x.n === 1 ? 'product' : 'products'}`, href: '#order-list' }));
  const selIds = [...sel].filter((id) => { const p = prod(id); return p && addable(p); });
  const by: Record<string, number> = {}; selIds.forEach((id) => { const s = prod(id)!.supplier; by[s] = (by[s] || 0) + 1; });
  const supNeed = sup !== 'all' ? base.filter((p) => p.supplier === sup && st(p) !== 'ok') : [];
  const supTodo = supNeed.filter(addable);
  const ci = sup !== 'all' ? D.cutoff[sup] : null;
  const menu = (value: string, opts: { value: string; label: string; meta?: string }[], set: (v: string) => void) => ({ value, options: opts, onValueChange: set });
  const catOpts = [{ value: 'all', label: 'All categories' }, ...D.categories.map((c) => ({ value: c.id, label: c.name, meta: String(c.products) }))];
  const supOpts = [{ value: 'all', label: 'All suppliers' }, ...D.suppliers.map((s) => ({ value: s.id, label: s.name }))];
  const sortOpts = [{ value: 'attn', label: 'Needs stock first' }, { value: 'name', label: 'Name A to Z' }, { value: 'cat', label: 'Category' }, { value: 'where', label: 'Where it is kept' }];
  const nAct = (cat !== 'all' ? 1 : 0) + (sup !== 'all' ? 1 : 0) + (sort !== 'attn' ? 1 : 0);
  const clear = () => { setQ(''); setCat('all'); setSup('all'); setStatus('all'); };
  const why = q.trim() ? `No product matches “${q.trim()}”.` : status === 'order' ? 'Nothing is on order.' : status === 'out' ? 'Nothing is out of stock.' : status === 'low' ? 'No product is low on stock.' : 'No product fits these filters.';
  const lastLoaded = D.now.lastLoaded;

  /* the detail (products.js 356-500) */
  const detail = (p: PProduct) => {
    const n = onHand(p), s = st(p), ord = ordered(p.id), ol = onList(p.id), jobs = jobsFor(p.id), l = locOf(p.loc), sp = supOf(p.supplier);
    const hist: PMove[] = (() => { const loc2 = local[p.id] || []; const bal0 = n; const known = D.hist[p.id] ?? []; const shift = n - p.onHand; return loc2.concat(known.map((m) => ({ ...m, after: m.after + shift }))).map((m, i, a) => ({ ...m, after: m.after ?? bal0 + (a[i].qty ? 0 : 0) })); })();
    const rowsM = hist.filter((m) => mvf === 'all' || (mvf === 'in' ? m.qty > 0 : m.qty < 0)), shown = mvAll ? rowsM : rowsM.slice(0, 7);
    const days = p.usePerDay && n > 0 ? n / p.usePerDay : null;
    let words: string;
    if (s === 'ok') words = `Above its reorder level of ${p.reorder}. Nothing to do.`;
    else {
      words = `${s === 'out' ? 'Out of stock' : 'Low stock'}. ${n === 0 ? `Reorder level is ${p.reorder}.` : `${p.reorder - n} under the reorder level of ${p.reorder}.`}`;
      const rw = runway(p, false);
      if (jobs.length && rw.short.length) words += ` ${jobs.length} ${jobs.length === 1 ? 'job needs' : 'jobs need'} it today, and ${rw.short.map((x) => `${x.ref} at ${hm(x.t)}`).join(' and ')} will be short.`;
      else if (jobs.length) words += ` ${jobs.length} ${jobs.length === 1 ? 'job needs' : 'jobs need'} it today.`;
      else if (days != null && p.usePerDay) words += ` At about ${p.usePerDay} a day it lasts ${days < 1 ? 'less than a day' : days < 1.5 ? 'about a day' : `about ${Math.round(days)} days`}.`;
      if (ord.length) words += ` ${ord[0].po.no} brings ${ord[0].qty} on ${shortDate(ord[0].po)}.`;
      else if (ol) words += ` ${ol.line.qty} ${unitOf(p, ol.line.qty)} ${ol.line.qty === 1 ? 'is' : 'are'} on the ${short(ol.list.sup)} order list, not sent yet.`;
    }
    const leda = ol && ol.line.by === 'leda' ? `Leda added ${ol.line.qty} to the ${short(ol.list.sup)} order list.${can('confirm_po') ? ' You print it and mark it sent.' : ` ${Mgr} prints it and marks it sent.`}` : '';
    const next = ord[0];
    const facts: React.ReactNode[] = [<span key="sku" className="font-mono">{p.sku}</span>, catName(p.cat), l.name, `Sold by the ${p.unit}`, sp.name];
    if (can('valuation')) { facts.push(<span key="c">Cost <b>{peso(p.cost)}</b></span>); if (p.price) facts.push(<span key="p">Price <b>{peso(p.price)}</b></span>); facts.push(<span key="v">Stock value <b>{peso(p.cost * n)}</b></span>); }
    const low = s !== 'ok';
    const rec: RecordProduct = { id: p.id, name: p.name, sku: p.sku, onHand: n, reorder: p.reorder, unit: p.unit, location: l.name };
    const actions = (
      <>
        <span className="flex min-w-0 max-w-full flex-col items-start gap-[9px]">
          <Button variant={ol || s === 'ok' || ord.length ? 'secondary' : 'primary'} leftIcon={ListPlus} disabled={poErr} aria-describedby={low ? 'addTip' : undefined} onClick={() => { setPanel('list'); setRo({ qty: null, sup: null }); }}>Add to order list</Button>
          {low ? <Tip id="addTip" /> : null}
        </span>
        {poErr ? <span className="inline-flex min-h-8 items-center gap-1.5 text-[13px] text-muted"><WarningCircle aria-hidden size={14} />Order lists did not load. Retry first, so nothing is ordered twice.</span> : ol ? <span className="inline-flex min-h-8 items-center text-[13px] text-muted">On {short(ol.list.sup)} list {'·'} {ol.line.qty}</span> : null}
        {can('stock_out') ? <Button variant="secondary" leftIcon={ArrowsDownUp} onClick={() => setPanel('adjust')}>{can('adjust_stock') ? 'Adjust stock' : 'Record stock out'}</Button> : null}
        <Button variant="secondary" onClick={() => ledaUi.ask(`Where is ${p.name}?`)}><LedaMark size={14} decorative />Ask Leda</Button>
      </>
    );
    const rsup = ro.sup || (ol ? ol.list.sup : p.supplier), rqty = ro.qty ?? (ol ? ol.line.qty : suggestQty(p)), same = !!ol && ol.list.sup === rsup;
    const target = lists.find((x) => x.sup === rsup), others = target ? target.lines.length - (same ? 1 : 0) : 0;
    const sOpts = [{ value: p.supplier, label: sp.name, meta: 'Preferred' }, ...(D.alt[p.id] ?? []).map((a) => ({ value: a.sup, label: supOf(a.sup).name }))];
    return (
      <div className="flex min-w-0 flex-col px-pad pb-12 pt-6 max-[640px]:px-4 max-[640px]:pb-[120px] max-[640px]:pt-4">
        <div className="flex flex-wrap items-center gap-3 max-[640px]:items-start max-[640px]:gap-x-3 max-[640px]:gap-y-2"><h1 className="m-0 text-[22px] font-semibold leading-7 tracking-[-0.01em]">{p.name}</h1><StockStatus status={s} /></div>
        <div className="-ml-[23px] mt-3 flex flex-wrap items-center gap-y-1 text-[13px] leading-5 text-muted [clip-path:inset(-6px_-6px_-6px_23px)]">{facts.map((x, i) => <span key={i} className="inline-flex items-center gap-1.5 whitespace-nowrap before:ml-[10px] before:mr-1 before:h-[3px] before:w-[3px] before:flex-none before:rounded-full before:bg-control before:content-['']">{x}</span>)}</div>
        <section aria-label="Stock now" className="mt-8 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-[72px] gap-y-6 border-y border-border py-7 @max-[900px]/sheet:grid-cols-[minmax(0,1fr)] max-[640px]:mt-6 max-[640px]:py-6">
          <div className="flex gap-14 @max-[900px]/sheet:gap-10 max-[640px]:justify-between max-[640px]:gap-5">
            {[{ k: 'Left on the shelf', big: n, dim: false, u: unitOf(p, n), s: l.name + (l.holds ? ` · ${l.holds}` : '') }, { k: 'Reorder at', big: p.reorder, dim: true, u: unitOf(p, p.reorder), s: 'Order when it drops to this' }, { k: 'On the way', big: next ? `+${next.qty}` : 0, dim: true, u: next ? unitOf(p, next.qty) : '', s: next ? `${next.po.no} · ${shortDate(next.po)}` : poErr ? 'Orders not loaded' : ol ? `${ol.line.qty} on the ${short(ol.list.sup)} list, not sent` : 'Nothing ordered' }].map((x) => (
              <div key={x.k} className="flex min-w-0 flex-col gap-1"><span className="text-[12px] text-muted">{x.k}</span><span className="text-[13px] text-muted"><b className={`text-[34px] leading-[38px] font-semibold tracking-[-0.01em] tabular-nums max-[640px]:text-[28px] max-[640px]:leading-8 ${x.dim ? 'font-medium text-muted' : 'text-text'}`}>{x.big}</b> {x.u ? <span>{x.u}</span> : null}</span><span className="max-w-[190px] text-[12px] text-muted max-[640px]:max-w-[100px]">{x.s}</span></div>
            ))}
          </div>
          <div className="flex min-w-0 flex-col gap-4"><p className="m-0 flex max-w-[680px] items-start gap-3 text-[15px] leading-[22px] max-[640px]:flex-col max-[640px]:gap-2 max-[640px]:text-[14px]"><span>{words}</span></p></div>
          {leda ? <div className="col-span-full flex max-w-[760px] items-start gap-2.5 text-[14px] leading-5"><span aria-hidden className="mt-[3px] shrink-0"><LedaMark size={16} tile decorative /></span><span>{leda}<span className="mt-0.5 block text-[12px] text-muted">{`Leda, ${D.now.time}`}</span></span></div> : null}
          <div className="col-span-full flex flex-wrap items-start gap-3 max-[640px]:hidden">{actions}</div>
        </section>
        {panel === 'adjust' && can('stock_out') ? (
          <section aria-label={can('adjust_stock') ? 'Adjust stock' : 'Record stock out'} className="mt-8 flex max-w-[760px] flex-col max-[640px]:mt-6">
            <PanelHead icon={ArrowsDownUp} title={can('adjust_stock') ? 'Adjust stock' : 'Record stock out'} right={<button type="button" className={VA} onClick={() => setPanel(null)}>Close</button>} />
            <div className="flex flex-col gap-5 pb-1 pt-5">
              <RecordMovementForm fixed product={rec} products={[rec]} likely={[]} permissions={(['stock_out', 'transfer', 'adjust_stock'] as const).filter((x) => can(x))} jobOrders={tenant === 'a'} manager={D.viewers.manager.manager.short} placeName={D.business.platform}
                jobsFor={(id) => jobsFor(id).map((j) => j.jo)} onCancel={() => setPanel(null)}
                onRecord={(e) => { setDelta((d) => ({ ...d, [p.id]: (d[p.id] || 0) + e.qty })); setLocal((m) => ({ ...m, [p.id]: [{ day: 'today', at: D.now.hm, type: e.type, qty: e.qty, ref: e.ref, note: e.note, by: V.viewer.id, after: e.after }, ...(m[p.id] || [])] })); setPanel(null); toast(`${p.name} recorded.`); }} />
            </div>
          </section>
        ) : null}
        {panel === 'list' && can('draft_po') && !poErr ? (
          <section aria-label="Order list" className="mt-8 flex max-w-[760px] flex-col max-[640px]:mt-6">
            <PanelHead icon={ListPlus} title={same ? 'Change the quantity' : 'Add to order list'} sub={p.name} right={<button type="button" className={VA} onClick={() => setPanel(null)}>Close</button>} />
            <div className="flex flex-col gap-5 pb-1 pt-5">
              <div className="grid grid-cols-[148px_minmax(0,1fr)] items-center gap-x-4 @max-[760px]/sheet:grid-cols-[120px_minmax(0,1fr)] max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-y-2">
                <span id="l-ros" className="text-[13px] text-text">Supplier</span>
                {sOpts.length > 1 ? <div className="max-w-[300px] max-[640px]:max-w-none"><Select aria-labelledby="l-ros" size="sm" options={sOpts} value={rsup} onValueChange={(v) => setRo({ ...ro, sup: v })} /></div> : <span className="text-[14px]">{supOf(rsup).name}</span>}
              </div>
              <div className="grid grid-cols-[148px_minmax(0,1fr)] items-center gap-x-4 @max-[760px]/sheet:grid-cols-[120px_minmax(0,1fr)] max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-y-2">
                <span className="text-[13px] text-text">How many</span>
                <QuantityStepper value={rqty} onValueChange={(v) => setRo({ ...ro, qty: v })} productName={p.name} />
              </div>
              <p className="m-0 ml-[164px] text-[14px] leading-[21px] text-muted @max-[760px]/sheet:ml-[136px] max-[640px]:ml-0">Suggested {suggestQty(p)}, which brings stock to about {n + ord.reduce((a, x) => a + x.qty, 0) + suggestQty(p)}, twice the reorder level. {target ? <>The {short(rsup)} list {same ? 'has' : 'already has'} {others ? `${others} other ${others === 1 ? 'product' : 'products'}` : 'no other products'}{target.no ? ` (${target.no})` : ''}. </> : <>This starts a new {short(rsup)} list. </>}{can('valuation') ? <>Line total <b className="font-semibold text-text">{peso(rqty * costFor(p, rsup))}</b> for {rqty}.</> : null}</p>
              <div className="ml-[164px] flex flex-wrap gap-2 @max-[760px]/sheet:ml-[136px] max-[640px]:ml-0"><Button actionBar onClick={() => addToList(p.id, rqty, rsup)} disabled={rqty < 1}>{same ? 'Save quantity' : `Add to the ${short(rsup)} order list`}</Button>{ol ? <Button actionBar variant="secondary" onClick={() => unlist(p)}>Remove from list</Button> : null}<Button actionBar variant="text" onClick={() => setPanel(null)}>Cancel</Button></div>
              <p className="m-0 ml-[164px] text-[13px] text-muted @max-[760px]/sheet:ml-[136px] max-[640px]:ml-0">Nothing is sent to the supplier. You print the list and mark it sent on Purchase orders.</p>
            </div>
          </section>
        ) : null}
        <div className="mt-8 grid items-start gap-x-10 gap-y-12 [grid-template-areas:'mv_po'_'mv_su'_'mv_._'_'run_run'] [grid-template-columns:minmax(0,2fr)_minmax(0,1fr)] [grid-template-rows:auto_auto_1fr_auto] @max-[1100px]/sheet:[grid-template-areas:'mv'_'run'_'po'_'su'] @max-[1100px]/sheet:[grid-template-columns:minmax(0,1fr)] @max-[1100px]/sheet:[grid-template-rows:none]">
          <section id="p-mv" className="flex min-w-0 flex-col [grid-area:mv]">
            <PanelHead icon={ArrowsDownUp} title="Stock in and out" count={rowsM.length} sub="newest first, with what was left after each" />
            <div className="pb-1 pt-4"><SegmentedControl aria-label="Show" value={mvf} onChange={(v) => setMvf(v)} options={[{ value: 'all', label: 'All' }, { value: 'in', label: 'Stock in' }, { value: 'out', label: 'Stock out' }]} /></div>
            {shown.length ? <ul className="m-0 list-none p-0">{shown.map((m, i) => {
              const [w, Icn] = MVW[m.type] || ['Stock', ArrowsDownUp], when = m.day === 'today' ? `Today ${m.at.replace(/^0/, '')}` : m.day === 'yesterday' ? `Yesterday ${m.at.replace(/^0/, '')}` : `${m.day} ${m.at.replace(/^0/, '')}`;
              const note = m.note ? ` · ${m.note}` : '';
              const what: React.ReactNode = m.type === 'received' && (m.ref === 'No order' || m.ref === 'New product') ? `${m.ref === 'No order' ? 'Received without an order' : 'Received, new product'}${note}` : m.type === 'received' ? <>Received{m.ref ? <> on <Ref r={m.ref} /></> : null}{note}</> : m.type === 'sold' ? <>{isId(m.ref) ? <>Used on <Ref r={m.ref} /></> : m.ref || 'Used'}{note}</> : m.type === 'transfer' ? <>Transfer <Ref r={m.ref} />{note}</> : m.type === 'damaged' ? `Damaged${note}` : m.note || 'Count correction';
              const who = D.people.find((x) => x.id === m.by);
              return <li key={i} className="grid min-h-16 grid-cols-[22px_minmax(0,1fr)_56px_88px] items-center gap-x-3 border-t border-rule py-4 first:border-t-transparent max-[640px]:grid-cols-[22px_minmax(0,1fr)_auto] max-[640px]:gap-y-1"><Icn aria-hidden size={18} className="mt-px self-start text-muted" /><span className="min-w-0"><span className="block text-[14px] font-medium leading-5">{w}</span><span className="mt-0.5 block text-[13px] leading-[19px] text-muted">{when} {'·'} {what}{who ? ` · ${who.short}` : ''}</span></span><span className={`text-right text-[16px] font-semibold tabular-nums max-[640px]:self-start ${m.qty > 0 ? 'text-ok' : ''}`}>{signed(m.qty)}</span><span className="text-right text-[13px] tabular-nums text-muted max-[640px]:col-[2/-1] max-[640px]:text-left"><b className="font-semibold text-text">{m.after}</b> left</span></li>;
            })}</ul> : <p className="m-0 my-4 text-[13px] text-muted">Nothing moved in this view.</p>}
            {rowsM.length > 7 ? <div className="flex items-center justify-between gap-4 pt-4 text-[13px] text-muted max-[640px]:flex-wrap"><span>Showing {shown.length} of {rowsM.length}</span><button type="button" className={`${VA} text-[13px] max-[640px]:min-h-10`} onClick={() => setMvAll(!mvAll)}>{mvAll ? 'Show fewer' : 'Show all'}<CaretRight aria-hidden size={12} /></button></div> : null}
          </section>
          <RunwayPanel />
          <section id="p-po" className="flex min-w-0 flex-col [grid-area:po]">
            <PanelHead icon={Receipt} title="On order" count={poErr ? undefined : incoming(p.id).length} sub="purchase orders and order lists with this product" />
            {poErr ? <ErrorBlock thing="purchase orders" lastLoaded={lastLoaded} onRetry={retry} retryLabel="Retry" /> : incoming(p.id).length ? <div className="flex flex-col">{incoming(p.id).map((x) => {
              const [word, tone] = x.draft ? ['On order list, not sent', 'dash'] as const : x.po.status === 'PARTIAL' ? [`Part in · ${x.po.unitsReceived} of ${x.po.unitsOrdered}`, 'warn'] as const : ['Sent', 'info'] as const;
              const canRecv = can('receive') && !x.draft;
              const inner = (<>
                <span className="min-w-0"><span className={T1}><Ref r={x.po.no} /> <span className="ml-1 text-[13px] font-normal text-muted">{x.po.supplierName}</span></span><span className="mt-[3px] flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] leading-[18px] text-muted"><Dot tone={tone}>{word}</Dot><span>{x.draft ? x.po.expected.replace(/^\w{3} \d+ \w{3} · /, '') : `Expected ${x.po.expected.replace(/ \(rest\)/, '')}`}</span></span></span>
                <span className="flex flex-col items-end text-right tabular-nums"><b className="text-[15px] font-semibold">+{x.qty}</b><small className="text-[12px] text-muted">{unitOf(p, x.qty)}</small></span>
                {x.draft ? null : <ActionLink caret className="max-[640px]:col-span-full">{canRecv ? `Receive ${x.qty}` : 'View'}</ActionLink>}
              </>);
              const cls = `${ROW} min-h-[66px] grid-cols-[minmax(0,1fr)_auto_auto] py-4 max-[640px]:grid-cols-[minmax(0,1fr)_auto] max-[640px]:gap-y-2`;
              return x.draft ? <div key={x.po.no} className={cls}>{inner}</div> : <button key={x.po.no} type="button" className={`${cls} group/row hover:bg-raised`} onClick={canRecv ? () => receive(x.po.no, p.id, x.qty) : undefined}>{inner}</button>;
            })}</div> : <p className="m-0 my-4 text-[13px] text-muted">Nothing is on order or on an order list for this product.{s !== 'ok' ? ' It is below its reorder level, so it needs one.' : ''}</p>}
          </section>
          <section id="p-su" className="flex min-w-0 flex-col [grid-area:su]">
            <PanelHead icon={Storefront} title="Suppliers" count={1 + (D.alt[p.id] ?? []).length} />
            <div className="flex flex-col">{[{ s: sp, cost: p.cost, pref: true, note: sp.leadTime }, ...(D.alt[p.id] ?? []).map((a) => ({ s: supOf(a.sup), cost: a.cost, pref: false, note: a.note ? `${supOf(a.sup).leadTime}. ${a.note}` : supOf(a.sup).leadTime }))].map((r) => (
              <div key={r.s.id} className="grid min-h-[60px] w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 border-t border-rule py-4 text-left first:border-t-transparent max-[640px]:grid-cols-[minmax(0,1fr)_auto] max-[640px]:gap-y-2"><span className="min-w-0"><span className={T1}>{r.s.name}{r.pref ? <span className="ml-1.5 text-[12px] font-normal text-muted">Preferred</span> : null}</span><span className="mt-[3px] block min-w-0 text-[13px] leading-[18px] text-muted">{r.note || ''}</span></span>{can('valuation') && r.cost ? <span className="flex flex-col items-end text-right tabular-nums"><b className="text-[15px] font-semibold">{peso(r.cost)}</b><small className="text-[12px] text-muted">per {p.unit}</small></span> : <span />}{can('draft_po') && !poErr ? (ol && ol.list.sup === r.s.id ? <span className="inline-flex min-h-8 items-center text-[13px] text-muted">On list {'·'} {ol.line.qty}</span> : <ActionLink caret aria-label={`Add ${p.name} to the ${r.s.name} order list`} className="h-7 max-[640px]:col-span-full" onClick={() => { setPanel('list'); setRo({ qty: null, sup: r.s.id }); }}>Add to list</ActionLink>) : null}</div>
            ))}</div>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-[13px] text-muted">{(D.alt[p.id] ?? []).length ? <span /> : <span>This is the only supplier on file.</span>}{can('setup') ? <button type="button" className={`${VA} text-[13px] max-[640px]:min-h-10`} onClick={() => go('setup')}>Suppliers and categories in Setup<CaretRight aria-hidden size={12} /></button> : <span className="inline-flex items-center gap-1.5"><Lock aria-hidden size={14} />{Mgr} manages suppliers and categories.</span>}</div>
          </section>
        </div>
        {!panel ? (
          <div className="fixed inset-x-0 bottom-0 z-[25] hidden flex-wrap gap-2 bg-frame px-4 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 max-[640px]:flex">
            {low ? <Tip id="addTipP" className="order-first mb-[5px] max-w-none basis-full" down={can('stock_out') ? '25%' : '50%'} /> : null}
            <Button actionBar className="max-[640px]:flex-1 max-[640px]:text-[14px]" variant={ol || s === 'ok' ? 'secondary' : 'primary'} disabled={poErr} aria-describedby={low ? 'addTipP' : undefined} onClick={() => { setPanel('list'); setRo({ qty: null, sup: null }); }}>Add to order list</Button>
            {can('stock_out') ? <Button actionBar variant="secondary" className="max-[640px]:flex-1 max-[640px]:text-[14px]" onClick={() => setPanel('adjust')}>{can('adjust_stock') ? 'Adjust stock' : 'Record stock out'}</Button> : null}
          </div>
        ) : null}
      </div>
    );
    function RunwayPanel() {
      const jb = jobs.length > 0, rate = !!p.usePerDay;
      const hours = `${D.business.hours.open}-${D.business.hours.close}`;
      const r = jb || rate ? runway(p, false) : null;
      const head = <PanelHead icon={ChartLineDown} title="Stock left today" sub={jb || rate ? hours : `as of ${D.now.time}`} right={jb || rate ? <span className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted"><span className="inline-flex items-center gap-1.5 whitespace-nowrap"><i className="inline-block w-[18px] flex-none border-t-2 border-accent" />So far</span><span className="inline-flex items-center gap-1.5 whitespace-nowrap"><i className="inline-block w-[18px] flex-none border-t-2 border-dashed border-accent" />Projected</span>{jb && r && r.short.length ? <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><i className="inline-block h-2.5 w-3.5 flex-none border-b-[1.5px] border-bad bg-bad-bg" />Short</span> : null}</span> : undefined} />;
      if (!jb && !rate) return <section id="p-run" className="flex min-w-0 flex-col [grid-area:run]">{head}<p className="m-0 my-4 text-[13px] text-muted">{tenant === 'a' ? `No job is booked against this part today, and it has no steady use rate, so the stock stays at ${n}.` : `Nothing is planned to use this today, so the stock stays at ${n}.`}</p></section>;
      const dr = incoming(p.id).find((x) => x.draft);
      const r1 = dr && !(r!.po && r!.po.status !== 'DRAFT') ? runway(p, true) : null;
      const alt = r1 && r1.po ? { no: r1.po.no, left: ((r1.pts.find((x) => x.kind === 'del') || { v: r1.end }) as { v: number }).v, at: toMin(supOf(r1.po.supplier).sameDayArrival) || toMin((/by (\d{1,2}:\d{2})/.exec(r1.po.expected) || [])[1]) } : undefined;
      return (
        <section id="p-run" className="flex min-w-0 flex-col [grid-area:run]">{head}
          <div className="mt-3 min-h-[200px]"><StockRunway name={p.name} hours={{ open: OPEN, close: CLOSE }} now={NOW} points={r!.pts} rate={r!.rate ? { vNow: r!.vNow, tz: r!.tz, end: r!.end } : undefined} formatTime={hm} alt={alt} caption={jb ? `Projected from booked jobs, as of ${D.now.time}` : `Projected at about ${p.usePerDay} a day, as of ${D.now.time}`} /></div>
          {r!.short.length ? <p className="m-0 mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] leading-[22px]"><Dot tone="bad">Short</Dot><span>{r!.short.map((x, i) => <span key={i}>{i ? ' and ' : ''}<Ref r={x.ref} /> {hm(x.t)}</span>)} would be short.</span>{dr ? <a className="inline-flex h-7 items-center gap-1 rounded-control border border-control bg-surface pl-2.5 pr-1.5 text-[13px] font-medium text-text no-underline hover:border-text hover:bg-raised max-[640px]:h-10" href="#order-list">Review the {short(dr.po.supplier)} order list<CaretRight aria-hidden size={12} className="text-faint" /></a> : null}</p> : r!.rate && r!.tz ? <p className="m-0 mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] leading-[22px]"><Dot tone="bad">Out</Dot><span>Runs out about {hm(r!.tz)} at this rate.</span></p> : null}
        </section>
      );
    }
  };
  /* runway model (products.js 76-94) */
  function runway(p: PProduct, withPO: boolean) {
    const past = D.hist[p.id]?.filter((m) => m.day === 'today').slice().sort((a, b) => toMin(a.at) - toMin(b.at)) ?? [];
    let v = p.onHand - past.reduce((s, m) => s + m.qty, 0);
    const pts: StockRunwayPoint[] = [{ t: OPEN, v, kind: 'start' }];
    past.forEach((m) => { v += m.qty; pts.push({ t: toMin(m.at), v, kind: 'moved', ref: m.ref ?? undefined }); });
    if (delta[p.id]) { v += delta[p.id]; pts.push({ t: NOW, v, kind: 'moved', ref: 'you' }); }
    const evs = jobsFor(p.id).map((j) => ({ t: toMin(j.at), d: -(j.needs.find((x) => x.p === p.id)?.qty ?? 0), kind: 'job' as const, ref: j.jo }));
    const arrival = (po: { supplier: string; expected: string }) => { const sx = supOf(po.supplier), d = /(\d{1,2}) Oct/.exec(po.expected || ''); if (!d) return null; const day = +d[1] - +(/\d+/.exec(D.now.short) || [22])[0]; let t: number | null = null; if (day === 0) t = toMin(sx.sameDayArrival) || toMin((/by (\d{1,2}:\d{2})/.exec(po.expected) || [])[1]) || null; if (day > 0) t = toMin((/,\s*(\d{1,2}:\d{2})/.exec(po.expected) || [])[1]) || null; return { day, t }; }; /* products.js 67-74 */
    const dpo = incoming(p.id).map((x) => x.po).find((po) => arrival(po)?.day === 0 && arrival(po)?.t != null);
    if (dpo && withPO) { const l = dpo.lines.find((x) => x.p === p.id)!; evs.push({ t: arrival(dpo)!.t!, d: remaining(dpo, l), kind: 'del' as never, ref: dpo.no }); }
    evs.sort((x, y) => x.t - y.t || ((x.kind as string) === 'del' ? -1 : 1));
    evs.forEach((e) => { v += e.d; pts.push({ t: e.t, v, kind: e.kind, ref: e.ref, short: e.kind === 'job' && v < 0 }); });
    const hasJob = evs.some((e) => e.kind === 'job');
    let rate: { vNow: number; tz: number | null; end: number } | undefined;
    if (p.usePerDay && !hasJob) {
      const rpm = p.usePerDay / (CLOSE - OPEN), vNow = v, tz = NOW + vNow / rpm;
      rate = { vNow, tz: tz < CLOSE ? Math.round(tz / 6) * 6 : null, end: Math.max(0, Math.round(vNow - rpm * (CLOSE - NOW))) };
    }
    return { po: dpo ?? null, pts, rate: rate ? true : false, vNow: rate?.vNow ?? v, tz: rate?.tz ?? null, end: rate?.end ?? v, short: pts.filter((x) => x.short) as (StockRunwayPoint & { ref: string })[] };
  }

  const openP = openId ? prod(openId) : null;
  const platform = { name: D.business.platform, initials: tenant === 'a' ? 'PS' : 'CI' };
  const dataLink = D.link && !down ? { with: D.link.with, status: (state === 'degraded' ? 'slow' : 'linked') as 'slow' | 'linked', since: state === 'degraded' ? '8:50' : D.now.time, title: D.link.reads } : undefined;
  const bcProducts: BarcodeProduct[] = base.map((p) => ({ id: p.id, name: p.name, sku: p.sku, barcode: p.barcode, unit: p.unit, onHand: onHand(p), location: locOf(p.loc).name }));
  const bcSamples = (tenant === 'a' ? ['p07', 'p16', 'p17'] : ['b01', 'b09', 'b11']).map((id) => bcProducts.find((p) => p.id === id)).filter((x): x is BarcodeProduct => !!x); /* barcode.js 30 */
  const empty = !base.length && !loading && !down;
  const sheetBar = openP
    ? <SheetBar wrapChildren={false} actionsFirst={false} actions={<AskLedaBar variant="bar" scope={openP.sku} paused={ledaUi.active} onOpen={ledaUi.open} />}><button type="button" className="inline-flex items-center gap-1.5 text-[13px] text-accent" onClick={() => { setOpenId(null); setPanel(null); }}><ArrowLeft aria-hidden size={14} />Products</button><span className="text-[13px] text-muted">/ {openP.name}</span></SheetBar>
    : <SheetBar wrapChildren={false} actionsFirst={false} actions={<AskLedaBar variant="bar" scope="Products" paused={ledaUi.active} onOpen={ledaUi.open} />}><SheetBarWhere platform={platform} page="Products" note={as !== 'manager' ? `Viewing as ${V.viewer.short}, ${V.roleLabel.toLowerCase()}` : undefined} /></SheetBar>;
  return (
    <>
      <InventoryChrome tenant={tenant} as={as} nav="products" page={openP ? '' : 'Products'} sheetBar={sheetBar} lists={lists.length} onAsk={ledaUi.open} onLists={() => setOrdersOpen(true)} ledaActive={ledaUi.active} status={<InventoryStatusBar platform={platform} dataLink={dataLink} viewer={{ name: V.viewer.short, role: V.roleLabel }} leda={{ canDecide: can('confirm_po'), managerName: D.viewers.manager.viewer.short }} updatedAt={loading ? `Loading… last loaded ${lastLoaded}` : D.now.time} />}>
        {openP ? detail(openP) : (
          <div className="flex min-w-0 flex-col gap-6 p-pad">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 flex-col gap-1"><h1 className="m-0 text-[22px] font-semibold leading-7">Products</h1><p className="m-0 flex items-center gap-2 text-[14px] text-muted">{loading ? 'Loading…' : headline}</p></div>
              <div className="flex items-center gap-3"><span className="text-[13px] text-muted">{D.now.date} {'·'} {loading ? `Loading… last loaded ${lastLoaded}` : down ? `Last loaded ${lastLoaded}` : `Updated ${D.now.time}`}</span>{can('setup') ? <Button leftIcon={Package} onClick={() => setDlg(true)}>Add product</Button> : null}</div></div>
            {empty ? (
              <section className="flex flex-col gap-4"><h2 className="m-0 text-[16px] font-semibold">{can('setup') ? 'Start your product list' : 'No products yet'}</h2><p className="m-0 text-[13px] text-muted">{can('setup') ? 'Three steps' : `${Mgr} adds the first products`}</p>
                <ol className="m-0 flex list-none flex-col gap-3 p-0"><li><b>Categories and suppliers</b> {D.categories.length} categories and {D.suppliers.length} suppliers are set up.</li><li><b>Add your products</b> {can('setup') ? 'One at a time, or let Leda read a supplier price list and list what she finds.' : `Only ${mgr} can add products. You can look things up once they are in.`}</li><li><b>Receive your first stock</b> Once products exist, a delivery or a count puts stock on the shelf.</li></ol>
                <h2 className="m-0 mt-4 text-[16px] font-semibold">What you will see here</h2>
                <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[14px]"><li><StockStatus status="out" /> Nothing left on the shelf. Order these first.</li><li><StockStatus status="low" /> At or under the reorder level. Time to order.</li><li><StockStatus status="ok" /> Above the reorder level. Nothing to do.</li></ul></section>
            ) : (
              <>
                {poErr && !down ? <ErrorBlock thing="purchase orders" lastLoaded={lastLoaded} onRetry={retry} retryLabel="Retry">What is on order is not shown.</ErrorBlock> : null}
                {can('setup') ? <NewProductRequests requests={np} onSetUp={() => setDlg(true)} onNotOurs={(id) => { const r = np; setNp(np.filter((x) => x.id !== id)); toast('Request removed.', () => setNp(r)); }} /> : null}
                <OrderListsStrip lists={stripLists} summary={poErr || !perSup.length ? undefined : `${summary}. Nothing sent.`} error={poErr} onOpenAll={() => setOrdersOpen(true)} />
                <div className="flex flex-col gap-6">
                  <ProductStatusTabs value={status} onValueChange={setStatus} counts={loading ? {} : { all: base.length ? total : 0, low: cnt.low, out: cnt.out, order: poErr ? undefined : cnt.order }} />
                  <ProductFilters query={q} onQueryChange={setQ} onScan={() => setBc('search')} category={menu(cat, catOpts, setCat)} supplier={menu(sup, supOpts, setSup)} sort={menu(sort, sortOpts, setSort)} open={fopen} onOpenChange={setFopen} activeCount={nAct} onSetup={can('setup') ? () => go('setup') : undefined} />
                </div>
                {sup !== 'all' && !poErr && !down && !loading && can('draft_po') ? (supNeed.length ? <ProductSupplierBar supplier={supOf(sup).name} listName={short(sup)} need={supNeed.length} todo={supTodo.length} cutoff={ci && !ci.passed ? `Order by ${ci.at} for same-day delivery (${ci.text} left).` : undefined} preview={supTodo.length ? `Adds ${supTodo.map((p) => `${suggestQty(p)} ${p.name}`).join(', ')}${can('valuation') ? `, about ${peso(supTodo.reduce((t, p) => t + suggestQty(p) * p.cost, 0))}` : ''}. Nothing is sent.` : undefined} onAddAll={() => addMany(supTodo)} /> : <p className="m-0 text-[14px]">{supOf(sup).name}: nothing needs stock.</p>) : null}
                <ProductList groups={groups} total={total} flat={sort !== 'attn'} addable={addSet} selected={sel} loading={loading} stale={down} onOpen={(r) => { setOpenId(r.id); setPanel(null); setMvf('all'); setMvAll(false); }}
                  onSelectedChange={(id, v) => setSel((s) => { const n = new Set(s); if (v) n.add(id); else n.delete(id); return n; })}
                  onSelectGroup={(g) => { const ids = g.rows.filter((r) => addSet.has(r.id)).map((r) => r.id); setSel((s) => (ids.every((i) => s.has(i)) ? new Set([...s].filter((i) => !ids.includes(i))) : new Set([...s, ...ids]))); }}
                  onShowMore={status === 'all' && !isFiltered ? () => toast('Showing the first products. The rest load here.') : undefined} onSetup={can('setup') ? () => go('setup') : undefined}
                  banner={down ? <Notice tone="bad" title="Products did not load" action={<Button variant="secondary" onClick={() => setCleared(true)}>Retry</Button>}>{`Products did not load, so this is the list from ${lastLoaded}. Counts may have changed.`}</Notice> : undefined}
                  noResults={{ title: why, hint: q.trim() ? 'Check the spelling, or search by SKU or supplier.' : quiet ? 'Every product is above its reorder level.' : 'Try fewer filters.', onClear: isFiltered || status !== 'all' ? clear : undefined, onAskLeda: () => undefined, start: sorted(base.filter((p) => st(p) !== 'ok')).slice(0, 3).map(rowOf) }} />
                {selIds.length ? <ProductSelectionBar count={selIds.length} goesTo={Object.keys(by).map((k) => `${short(k)} ${by[k]}`).join(' · ')} lists={Object.keys(by).length} onClear={() => setSel(new Set())} onAdd={() => addMany(selIds.map((id) => prod(id)!))} /> : null}
              </>
            )}
          </div>
        )}
      </InventoryChrome>
      {ledaUi.node}
      <OrderListsPanel open={ordersOpen} onOpenChange={setOrdersOpen} onProductsPage groups={lists.map((l) => ({ id: l.sup, supplier: supOf(l.sup).name, shortName: short(l.sup), poNo: l.no ?? undefined, cutoff: D.cutoff[l.sup] && !D.cutoff[l.sup]!.passed ? { at: D.cutoff[l.sup]!.at, left: D.cutoff[l.sup]!.text } : undefined, lines: l.lines.map((x) => ({ id: x.p, name: prod(x.p)?.name ?? x.p, sku: prod(x.p)?.sku ?? x.p, qty: x.qty, unit: prod(x.p)?.unit ?? 'pc', cost: prod(x.p) ? costFor(prod(x.p)!, l.sup) : undefined })) }))}
        canSend={can('confirm_po')} money={can('valuation')} error={poErr ? { lastLoaded } : undefined} purchaseOrdersHref="#pos" onRetry={retry}
        onQuantityChange={(g, id, qty) => setLists(lists.map((l) => (l.sup === g ? { ...l, lines: l.lines.map((x) => (x.p === id ? { ...x, qty } : x)) } : l)))}
        onRemove={(g, id) => { const before = lists; setLists(lists.map((l) => (l.sup === g ? { ...l, lines: l.lines.filter((x) => x.p !== id) } : l)).filter((l) => l.lines.length || l.no)); toast(`${prod(id)?.name ?? id} taken off the ${supOf(g).name} order list.`, () => setLists(before)); }}
        onProceed={() => go('pos')} onOpenPo={() => go('pos')} />
      <BarcodeSheet open={bc !== null} onOpenChange={(o) => !o && setBc(null)} mode="capture" ctx="search" title={bc === 'form' ? 'Scan the barcode' : 'Search by barcode'} names={false} warnKnown={bc === 'form'}
        products={bcProducts} samples={bcSamples} unknown={null}
        onCode={(code) => { if (bc === 'form') setForm((f) => ({ ...f, barcode: code })); else setQ(code); setBc(null); }} />
      <Modal open={dlg} onOpenChange={setDlg} icon={Package} title="Add product" description="It starts at 0 on hand. Receive stock or count it next." size="md"
        footer={<><Button onClick={saveAdd}>Add product</Button><Button variant="text" onClick={() => setDlg(false)}>Cancel</Button></>}>
        <div className="flex flex-col gap-3">
          <TextField label="Name" value={form.name} placeholder={tenant === 'a' ? 'Fleetguard LF3349 oil filter' : 'Oat milk 1L'} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="SKU" value={form.sku} placeholder={tenant === 'a' ? 'FG-LF3349' : 'MLK-OAT-1L'} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <label className="flex flex-col gap-1 text-[13px]">Category<Select size="sm" options={D.categories.map((c) => ({ value: c.id, label: c.name }))} value={form.cat} onValueChange={(v) => setForm({ ...form, cat: v })} /></label>
          <label className="flex flex-col gap-1 text-[13px]">Unit<Select size="sm" options={UNITS.map((u) => ({ value: u, label: u }))} value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })} /></label>
          <label className="flex flex-col gap-1 text-[13px]">Supplier<Select size="sm" options={D.suppliers.map((s) => ({ value: s.id, label: s.name }))} value={form.sup} onValueChange={(v) => setForm({ ...form, sup: v })} /></label>
          <div className="flex items-end gap-2"><div className="flex-1"><TextField label="Barcode" inputMode="numeric" value={form.barcode} placeholder="13 digits, optional" onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div><Button variant="secondary" onClick={() => setBc('form')}>Scan</Button></div>
          <TextField label="Reorder level" type="number" min={0} step={1} value={form.reorder} onChange={(e) => setForm({ ...form, reorder: e.target.value })} />
          <p role="alert" className="m-0 min-h-[18px] text-[13px] text-bad">{form.err}</p>
          <p className="m-0 text-[13px] text-muted">Categories, suppliers and units come from Setup. Need a new one? <button type="button" className="text-accent" onClick={() => { setDlg(false); go('setup'); }}>Add it in Setup</button></p>
        </div>
      </Modal>
    </>
  );
}
