import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowsDownUp, ListPlus, Package, Prohibit, Receipt, Storefront, TrendDown, WarningCircle } from '@phosphor-icons/react';
import { AskLedaBar } from '../components/AskLedaBar';
import { Button } from '../components/Button';
import { ErrorBlock } from '../components/ErrorBlock';
import { LedaNote } from '../components/LedaNote';
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
  /** The "Needs setting up" story: one stocker request is open (receiving.js 45, sample). */
  needsSetup?: boolean;
  /** Story only: open the Add product dialog (products.js 604). */
  addDialog?: boolean;
}

const MINUS = '−';
const toMin = (s: string | undefined | null) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim()); return m ? +m[1] * 60 + +m[2] : 0; };
const hm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-PH')}`;
const unitOf = (p: { unit: string }, n: number) => (p.unit === 'pc' ? 'pc' : n === 1 ? p.unit : `${p.unit}s`);
const signed = (n: number) => (n > 0 ? '+' : n < 0 ? MINUS : '') + Math.abs(n);
const LOWTIP = 'The stock is low and we need to restock soon.';
const MVW: Record<string, string> = { received: 'Stock in', sold: 'Stock out', transfer: 'Stock out', damaged: 'Stock out', count: 'Count' };
const isId = (r?: string | null) => /^[A-Z]{2,}-\d+/.test(r || '');

export function ProductsPage({ tenant = 'a', as = 'manager', state = 'live', open: openProp, panel: panelProp, f = 'all', qs = '', cat: catProp = 'all', sup: supProp = 'all', needsSetup, addDialog }: ProductsPageProps) {
  const D: PData = PRODUCTS[tenant];
  const V = D.viewers[as];
  const can = (p: string) => V.can.includes(p);
  const quiet = state === 'quiet', loading = state === 'loading', down = state === 'down';
  const NOW = toMin(D.now.hm), OPEN = toMin(D.business.hours.open), CLOSE = toMin(D.business.hours.close);
  const [retried, setRetried] = useState(false);
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
  const [np, setNp] = useState(() => (needsSetup ? [{ id: 'NP-01', barcode: '4806521004417', name: 'Prestone coolant 1L', qty: 6, loc: 'Aisle B', by: 'Dandy', at: '8:30 AM' }] : []));
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
        <span className="flex flex-col gap-1">
          <Button variant={ol || s === 'ok' || ord.length ? 'secondary' : 'primary'} leftIcon={ListPlus} disabled={poErr} aria-describedby={low ? 'addTip' : undefined} onClick={() => { setPanel('list'); setRo({ qty: null, sup: null }); }}>Add to order list</Button>
          {low ? <span id="addTip" role="note" className="text-[13px] text-muted">{LOWTIP}</span> : null}
        </span>
        {poErr ? <span className="inline-flex items-center gap-1.5 text-[13px] text-muted"><WarningCircle aria-hidden size={16} />Order lists did not load. Retry first, so nothing is ordered twice.</span> : ol ? <span className="text-[13px] text-muted">On {short(ol.list.sup)} list {'·'} {ol.line.qty}</span> : null}
        {can('stock_out') ? <Button variant="secondary" leftIcon={ArrowsDownUp} onClick={() => setPanel('adjust')}>{can('adjust_stock') ? 'Adjust stock' : 'Record stock out'}</Button> : null}
        <AskLedaBar variant="field" scope={p.name} shortcuts={false} />
      </>
    );
    const rsup = ro.sup || (ol ? ol.list.sup : p.supplier), rqty = ro.qty ?? (ol ? ol.line.qty : suggestQty(p)), same = !!ol && ol.list.sup === rsup;
    const target = lists.find((x) => x.sup === rsup), others = target ? target.lines.length - (same ? 1 : 0) : 0;
    const sOpts = [{ value: p.supplier, label: sp.name, meta: 'Preferred' }, ...(D.alt[p.id] ?? []).map((a) => ({ value: a.sup, label: supOf(a.sup).name }))];
    return (
      <div className="flex min-w-0 flex-col gap-6 p-pad max-[640px]:pb-28">
        <div className="flex flex-wrap items-center gap-3"><h1 className="m-0 text-[22px] font-semibold leading-7">{p.name}</h1><StockStatus status={s} /></div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">{facts.map((x, i) => <span key={i}>{x}</span>)}</div>
        <section aria-label="Stock now" className="flex flex-col gap-4 border-y border-rule py-5">
          <div className="grid grid-cols-3 gap-6 max-[640px]:grid-cols-1">
            {[{ k: 'Left on the shelf', v: n, u: unitOf(p, n), s: l.name + (l.holds ? ` · ${l.holds}` : '') }, { k: 'Reorder at', v: p.reorder, u: unitOf(p, p.reorder), s: 'Order when it drops to this' }, { k: 'On the way', v: next ? `+${next.qty}` : 0, u: next ? unitOf(p, next.qty) : '', s: next ? `${next.po.no} · ${shortDate(next.po)}` : poErr ? 'Orders not loaded' : ol ? `${ol.line.qty} on the ${short(ol.list.sup)} list, not sent` : 'Nothing ordered' }].map((x) => (
              <div key={x.k} className="flex flex-col"><span className="text-[13px] text-muted">{x.k}</span><span><b className="text-[28px] font-semibold leading-9">{x.v}</b> <span className="text-[14px] text-muted">{x.u}</span></span><span className="text-[13px] text-muted">{x.s}</span></div>
            ))}
          </div>
          <p className="m-0 text-[14px] leading-[22px]">{words}</p>
          {leda ? <LedaNote byline={`Leda, ${D.now.time}`}>{leda}</LedaNote> : null}
          <div className="flex flex-wrap items-start gap-3 max-[640px]:fixed max-[640px]:inset-x-0 max-[640px]:bottom-0 max-[640px]:z-10 max-[640px]:border-t max-[640px]:border-rule max-[640px]:bg-surface max-[640px]:p-3">{actions}</div>
        </section>
        {panel === 'adjust' && can('stock_out') ? (
          <section aria-label={can('adjust_stock') ? 'Adjust stock' : 'Record stock out'} className="flex flex-col gap-3 border border-rule p-4">
            <div className="flex items-center gap-2"><ArrowsDownUp aria-hidden size={18} className="text-muted" /><h2 className="m-0 flex-1 text-[16px] font-semibold">{can('adjust_stock') ? 'Adjust stock' : 'Record stock out'}</h2><Button variant="text" onClick={() => setPanel(null)}>Close</Button></div>
            <RecordMovementForm fixed product={rec} products={[rec]} likely={[]} permissions={(['stock_out', 'transfer', 'adjust_stock'] as const).filter((x) => can(x))} jobOrders={tenant === 'a'} manager={D.viewers.manager.manager.short} placeName={D.business.platform}
              jobsFor={(id) => jobsFor(id).map((j) => j.jo)} onCancel={() => setPanel(null)}
              onRecord={(e) => { setDelta((d) => ({ ...d, [p.id]: (d[p.id] || 0) + e.qty })); setLocal((m) => ({ ...m, [p.id]: [{ day: 'today', at: D.now.hm, type: e.type, qty: e.qty, ref: e.ref, note: e.note, by: V.viewer.id, after: e.after }, ...(m[p.id] || [])] })); setPanel(null); toast(`${p.name} recorded.`); }} />
          </section>
        ) : null}
        {panel === 'list' && can('draft_po') && !poErr ? (
          <section aria-label="Order list" className="flex flex-col gap-3 border border-rule p-4">
            <div className="flex items-center gap-2"><ListPlus aria-hidden size={18} className="text-muted" /><h2 className="m-0 text-[16px] font-semibold">{same ? 'Change the quantity' : 'Add to order list'}</h2><span className="flex-1 text-[13px] text-muted">{p.name}</span><Button variant="text" onClick={() => setPanel(null)}>Close</Button></div>
            <div className="grid grid-cols-[148px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 max-[640px]:grid-cols-1">
              <span id="l-ros" className="text-[13px]">Supplier</span>
              {sOpts.length > 1 ? <Select aria-labelledby="l-ros" size="sm" options={sOpts} value={rsup} onValueChange={(v) => setRo({ ...ro, sup: v })} /> : <span className="text-[14px]">{supOf(rsup).name}</span>}
              <span className="text-[13px]">How many</span>
              <span className="flex items-center gap-2.5"><QuantityStepper value={rqty} onValueChange={(v) => setRo({ ...ro, qty: v })} productName={p.name} /><span className="text-[13px] text-muted">{unitOf(p, 2)}</span></span>
            </div>
            <p className="m-0 text-[14px] leading-[22px]">Suggested {suggestQty(p)}, which brings stock to about {n + ord.reduce((a, x) => a + x.qty, 0) + suggestQty(p)}, twice the reorder level. {target ? <>The {short(rsup)} list {same ? 'has' : 'already has'} {others ? `${others} other ${others === 1 ? 'product' : 'products'}` : 'no other products'}{target.no ? ` (${target.no})` : ''}. </> : <>This starts a new {short(rsup)} list. </>}{can('valuation') ? <>Line total <b>{peso(rqty * costFor(p, rsup))}</b> for {rqty}.</> : null}</p>
            <div className="flex flex-wrap gap-2"><Button onClick={() => addToList(p.id, rqty, rsup)} disabled={rqty < 1}>{same ? 'Save quantity' : `Add to the ${short(rsup)} order list`}</Button>{ol ? <Button variant="secondary" onClick={() => unlist(p)}>Remove from list</Button> : null}<Button variant="text" onClick={() => setPanel(null)}>Cancel</Button></div>
            <p className="m-0 text-[13px] text-muted">Nothing is sent to the supplier. You print the list and mark it sent on Purchase orders.</p>
          </section>
        ) : null}
        <div className="grid grid-cols-2 gap-6 max-[900px]:grid-cols-1">
          <section id="p-mv" className="flex min-w-0 flex-col gap-3">
            <div className="flex items-baseline gap-2"><ArrowsDownUp aria-hidden size={18} className="self-center text-muted" /><h2 className="m-0 text-[16px] font-semibold">Stock in and out</h2><span className="text-[13px] text-muted">{rowsM.length}</span><span className="text-[13px] text-muted">newest first, with what was left after each</span></div>
            <SegmentedControl aria-label="Show" value={mvf} onChange={(v) => setMvf(v)} options={[{ value: 'all', label: 'All' }, { value: 'in', label: 'Stock in' }, { value: 'out', label: 'Stock out' }]} />
            {shown.length ? <ul className="m-0 list-none p-0">{shown.map((m, i) => {
              const w = MVW[m.type] || 'Stock', when = m.day === 'today' ? `Today ${m.at.replace(/^0/, '')}` : m.day === 'yesterday' ? `Yesterday ${m.at.replace(/^0/, '')}` : `${m.day} ${m.at.replace(/^0/, '')}`;
              const note = m.note ? ` · ${m.note}` : '';
              const what = m.type === 'received' && (m.ref === 'No order' || m.ref === 'New product') ? `${m.ref === 'No order' ? 'Received without an order' : 'Received, new product'}${note}` : m.type === 'received' ? `Received${m.ref ? ` on ${m.ref}` : ''}${note}` : m.type === 'sold' ? `${isId(m.ref) ? `Used on ${m.ref}` : m.ref || 'Used'}${note}` : m.type === 'transfer' ? `Transfer ${m.ref}${note}` : m.type === 'damaged' ? `Damaged${note}` : m.note || 'Count correction';
              const who = D.people.find((x) => x.id === m.by);
              return <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto_72px] items-center gap-3 border-t border-rule py-2.5 first:border-t-0"><span className="flex min-w-0 flex-col"><span className="text-[14px] font-medium">{w}</span><span className="text-[13px] text-muted">{when} {'·'} {what}{who ? ` · ${who.short}` : ''}</span></span><span className={`text-[14px] font-medium ${m.qty > 0 ? 'text-text' : 'text-muted'}`}>{signed(m.qty)}</span><span className="text-right text-[13px] text-muted"><b>{m.after}</b> left</span></li>;
            })}</ul> : <p className="m-0 text-[14px] text-muted">Nothing moved in this view.</p>}
            {rowsM.length > 7 ? <div className="flex items-center justify-between text-[13px] text-muted"><span>Showing {shown.length} of {rowsM.length}</span><Button variant="text" onClick={() => setMvAll(!mvAll)}>{mvAll ? 'Show fewer' : 'Show all'}</Button></div> : null}
          </section>
          <div className="flex min-w-0 flex-col gap-6">
            <RunwayPanel />
            <section id="p-po" className="flex flex-col gap-3">
              <div className="flex items-baseline gap-2"><Receipt aria-hidden size={18} className="self-center text-muted" /><h2 className="m-0 text-[16px] font-semibold">On order</h2>{poErr ? null : <span className="text-[13px] text-muted">{incoming(p.id).length}</span>}<span className="text-[13px] text-muted">purchase orders and order lists with this product</span></div>
              {poErr ? <ErrorBlock thing="purchase orders" lastLoaded={lastLoaded} onRetry={() => setRetried(true)} retryLabel="Retry" /> : incoming(p.id).length ? incoming(p.id).map((x) => {
                const word = x.draft ? 'On order list, not sent' : x.po.status === 'PARTIAL' ? `Part in · ${x.po.unitsReceived} of ${x.po.unitsOrdered}` : 'Sent';
                const canRecv = can('receive') && !x.draft;
                return <div key={x.po.no} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-rule py-2.5 first:border-t-0"><span className="flex min-w-0 flex-col"><span className="text-[14px]"><span className="font-mono">{x.po.no}</span> <span className="text-muted">{x.po.supplierName}</span></span><span className="text-[13px] text-muted">{word} {'·'} {x.draft ? x.po.expected.replace(/^\w{3} \d+ \w{3} · /, '') : `Expected ${x.po.expected.replace(/ \(rest\)/, '')}`}</span></span><span><b>+{x.qty}</b> <small className="text-muted">{unitOf(p, x.qty)}</small></span>{x.draft ? <span /> : <Button variant="text" onClick={canRecv ? () => receive(x.po.no, p.id, x.qty) : undefined}>{canRecv ? `Receive ${x.qty}` : 'View'}</Button>}</div>;
              }) : <p className="m-0 text-[14px] text-muted">Nothing is on order or on an order list for this product.{s !== 'ok' ? ' It is below its reorder level, so it needs one.' : ''}</p>}
            </section>
            <section id="p-su" className="flex flex-col gap-3">
              <div className="flex items-baseline gap-2"><Storefront aria-hidden size={18} className="self-center text-muted" /><h2 className="m-0 text-[16px] font-semibold">Suppliers</h2><span className="text-[13px] text-muted">{1 + (D.alt[p.id] ?? []).length}</span></div>
              {[{ s: sp, cost: p.cost, pref: true, note: sp.leadTime }, ...(D.alt[p.id] ?? []).map((a) => ({ s: supOf(a.sup), cost: a.cost, pref: false, note: a.note ? `${supOf(a.sup).leadTime}. ${a.note}` : supOf(a.sup).leadTime }))].map((r) => (
                <div key={r.s.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-rule py-2.5 first:border-t-0"><span className="flex flex-col"><span className="text-[14px]">{r.s.name}{r.pref ? <span className="ml-2 text-[12px] text-muted">Preferred</span> : null}</span><span className="text-[13px] text-muted">{r.note}</span></span>{can('valuation') && r.cost ? <span><b>{peso(r.cost)}</b> <small className="text-muted">per {p.unit}</small></span> : <span />}{can('draft_po') && !poErr ? (ol && ol.list.sup === r.s.id ? <span className="text-[13px] text-muted">On list {'·'} {ol.line.qty}</span> : <Button variant="text" aria-label={`Add ${p.name} to the ${r.s.name} order list`} onClick={() => { setPanel('list'); setRo({ qty: null, sup: r.s.id }); }}>Add to list</Button>) : null}</div>
              ))}
              <div className="flex items-center justify-between text-[13px] text-muted">{(D.alt[p.id] ?? []).length ? <span /> : <span>This is the only supplier on file.</span>}{can('setup') ? <Button variant="text" onClick={() => toast('Setup is coming next.')}>Suppliers and categories in Setup</Button> : <span>{Mgr} manages suppliers and categories.</span>}</div>
            </section>
          </div>
        </div>
      </div>
    );
    function RunwayPanel() {
      const jb = jobs.length > 0, rate = !!p.usePerDay;
      const hours = `${D.business.hours.open}-${D.business.hours.close}`;
      const head = <div className="flex items-baseline gap-2"><h2 className="m-0 text-[16px] font-semibold">Stock left today</h2><span className="text-[13px] text-muted">{jb || rate ? hours : `as of ${D.now.time}`}</span></div>;
      if (!jb && !rate) return <section id="p-run" className="flex flex-col gap-3">{head}<p className="m-0 text-[14px] text-muted">{tenant === 'a' ? `No job is booked against this part today, and it has no steady use rate, so the stock stays at ${n}.` : `Nothing is planned to use this today, so the stock stays at ${n}.`}</p></section>;
      const r = runway(p, false), dr = incoming(p.id).find((x) => x.draft);
      return (
        <section id="p-run" className="flex flex-col gap-3">{head}
          <StockRunway name={p.name} hours={{ open: OPEN, close: CLOSE }} now={NOW} points={r.pts} rate={r.rate ? { vNow: r.vNow, tz: r.tz, end: r.end } : undefined} formatTime={hm} caption={jb ? `Projected from booked jobs, as of ${D.now.time}` : `Projected at about ${p.usePerDay} a day, as of ${D.now.time}`} />
          {r.short.length ? <p className="m-0 flex flex-wrap items-center gap-2 text-[14px]"><b className="text-bad">Short</b><span>{r.short.map((x) => `${x.ref} ${hm(x.t)}`).join(' and ')} would be short.</span>{dr ? <a className="text-accent" href="#order-list">Review the {short(dr.po.supplier)} order list</a> : null}</p> : r.rate && r.tz ? <p className="m-0 text-[14px]"><b className="text-bad">Out</b> Runs out about {hm(r.tz)} at this rate.</p> : null}
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
    evs.sort((a, b) => a.t - b.t);
    void withPO;
    evs.forEach((e) => { v += e.d; pts.push({ t: e.t, v, kind: e.kind, ref: e.ref, short: e.kind === 'job' && v < 0 }); });
    let rate: { vNow: number; tz: number | null; end: number } | undefined;
    if (p.usePerDay && !evs.length) {
      const rpm = p.usePerDay / (CLOSE - OPEN), vNow = v, tz = NOW + vNow / rpm;
      rate = { vNow, tz: tz < CLOSE ? Math.round(tz / 6) * 6 : null, end: Math.max(0, Math.round(vNow - rpm * (CLOSE - NOW))) };
    }
    return { pts, rate: rate ? true : false, vNow: rate?.vNow ?? v, tz: rate?.tz ?? null, end: rate?.end ?? v, short: pts.filter((x) => x.short) as (StockRunwayPoint & { ref: string })[] };
  }

  const openP = openId ? prod(openId) : null;
  const platform = { name: D.business.platform, initials: tenant === 'a' ? 'PS' : 'CI' };
  const dataLink = D.link && !down ? { with: D.link.with, status: (state === 'degraded' ? 'slow' : 'linked') as 'slow' | 'linked', since: state === 'degraded' ? '8:50' : D.now.time, title: D.link.reads } : undefined;
  const empty = !base.length && !loading && !down;
  const sheetBar = openP
    ? <SheetBar wrapChildren={false} actionsFirst={false} actions={<AskLedaBar variant="bar" scope={openP.sku} shortcuts={false} />}><button type="button" className="inline-flex items-center gap-1.5 text-[13px] text-accent" onClick={() => { setOpenId(null); setPanel(null); }}><ArrowLeft aria-hidden size={14} />Products</button><span className="text-[13px] text-muted">/ {openP.name}</span></SheetBar>
    : <SheetBar wrapChildren={false} actionsFirst={false} actions={<AskLedaBar variant="bar" scope="Products" shortcuts={false} />}><SheetBarWhere platform={platform} page="Products" note={as !== 'manager' ? `Viewing as ${V.viewer.short}, ${V.roleLabel.toLowerCase()}` : undefined} /></SheetBar>;
  return (
    <>
      <InventoryChrome tenant={tenant} as={as} nav="products" page={openP ? '' : 'Products'} sheetBar={sheetBar} lists={lists.length} status={<InventoryStatusBar platform={platform} dataLink={dataLink} viewer={{ name: V.viewer.short, role: V.roleLabel }} leda={{ canDecide: can('confirm_po'), managerName: D.viewers.manager.viewer.short }} updatedAt={loading ? `Loading… last loaded ${lastLoaded}` : D.now.time} />}>
        {openP ? detail(openP) : (
          <div className="flex min-w-0 flex-col gap-6 p-pad @container/sheet">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 flex-col gap-1"><h1 className="m-0 text-[22px] font-semibold leading-7">Products</h1><p className="m-0 flex items-center gap-2 text-[14px] text-muted">{loading ? 'Loading…' : headline}</p></div>
              <div className="flex items-center gap-3"><span className="text-[13px] text-muted">{D.now.date} {'·'} {loading ? `Loading… last loaded ${lastLoaded}` : down ? `Last loaded ${lastLoaded}` : `Updated ${D.now.time}`}</span>{can('setup') ? <Button leftIcon={Package} onClick={() => setDlg(true)}>Add product</Button> : null}</div></div>
            {empty ? (
              <section className="flex flex-col gap-4"><h2 className="m-0 text-[16px] font-semibold">{can('setup') ? 'Start your product list' : 'No products yet'}</h2><p className="m-0 text-[13px] text-muted">{can('setup') ? 'Three steps' : `${Mgr} adds the first products`}</p>
                <ol className="m-0 flex list-none flex-col gap-3 p-0"><li><b>Categories and suppliers</b> {D.categories.length} categories and {D.suppliers.length} suppliers are set up.</li><li><b>Add your products</b> {can('setup') ? 'One at a time, or let Leda read a supplier price list and list what she finds.' : `Only ${mgr} can add products. You can look things up once they are in.`}</li><li><b>Receive your first stock</b> Once products exist, a delivery or a count puts stock on the shelf.</li></ol>
                <h2 className="m-0 mt-4 text-[16px] font-semibold">What you will see here</h2>
                <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[14px]"><li><StockStatus status="out" /> Nothing left on the shelf. Order these first.</li><li><StockStatus status="low" /> At or under the reorder level. Time to order.</li><li><StockStatus status="ok" /> Above the reorder level. Nothing to do.</li></ul></section>
            ) : (
              <>
                {poErr && !down ? <ErrorBlock thing="purchase orders" lastLoaded={lastLoaded} onRetry={() => setRetried(true)} retryLabel="Retry">What is on order is not shown.</ErrorBlock> : null}
                {can('setup') ? <NewProductRequests requests={np} onSetUp={() => setDlg(true)} onNotOurs={(id) => { const r = np; setNp(np.filter((x) => x.id !== id)); toast('Request removed.', () => setNp(r)); }} /> : null}
                <OrderListsStrip lists={stripLists} summary={poErr || !perSup.length ? undefined : `${summary}. Nothing sent.`} error={poErr} onOpenAll={() => toast('Order lists open as a panel on the page.')} />
                <div className="flex flex-col gap-6">
                  <ProductStatusTabs value={status} onValueChange={setStatus} counts={loading ? {} : { all: base.length ? total : 0, low: cnt.low, out: cnt.out, order: poErr ? undefined : cnt.order }} />
                  <ProductFilters query={q} onQueryChange={setQ} onScan={() => toast('The barcode sheet opens here.')} category={menu(cat, catOpts, setCat)} supplier={menu(sup, supOpts, setSup)} sort={menu(sort, sortOpts, setSort)} open={fopen} onOpenChange={setFopen} activeCount={nAct} onSetup={can('setup') ? () => toast('Setup is coming next.') : undefined} />
                </div>
                {sup !== 'all' && !poErr && !down && !loading && can('draft_po') ? (supNeed.length ? <ProductSupplierBar supplier={supOf(sup).name} listName={short(sup)} need={supNeed.length} todo={supTodo.length} cutoff={ci && !ci.passed ? `Order by ${ci.at} for same-day delivery (${ci.text} left).` : undefined} preview={supTodo.length ? `Adds ${supTodo.map((p) => `${suggestQty(p)} ${p.name}`).join(', ')}${can('valuation') ? `, about ${peso(supTodo.reduce((t, p) => t + suggestQty(p) * p.cost, 0))}` : ''}. Nothing is sent.` : undefined} onAddAll={() => addMany(supTodo)} /> : <p className="m-0 text-[14px]">{supOf(sup).name}: nothing needs stock.</p>) : null}
                <ProductList groups={groups} total={total} flat={sort !== 'attn'} addable={addSet} selected={sel} loading={loading} stale={down} onOpen={(r) => { setOpenId(r.id); setPanel(null); setMvf('all'); setMvAll(false); }}
                  onSelectedChange={(id, v) => setSel((s) => { const n = new Set(s); if (v) n.add(id); else n.delete(id); return n; })}
                  onSelectGroup={(g) => { const ids = g.rows.filter((r) => addSet.has(r.id)).map((r) => r.id); setSel((s) => (ids.every((i) => s.has(i)) ? new Set([...s].filter((i) => !ids.includes(i))) : new Set([...s, ...ids]))); }}
                  onShowMore={status === 'all' && !isFiltered ? () => toast('Showing the first products. The rest load here.') : undefined} onSetup={can('setup') ? () => toast('Setup is coming next.') : undefined}
                  banner={down ? <Notice tone="bad" title="Products did not load" action={<Button variant="secondary" onClick={() => undefined}>Retry</Button>}>{`Products did not load, so this is the list from ${lastLoaded}. Counts may have changed.`}</Notice> : undefined}
                  noResults={{ title: why, hint: q.trim() ? 'Check the spelling, or search by SKU or supplier.' : quiet ? 'Every product is above its reorder level.' : 'Try fewer filters.', onClear: isFiltered || status !== 'all' ? clear : undefined, onAskLeda: () => undefined, start: sorted(base.filter((p) => st(p) !== 'ok')).slice(0, 3).map(rowOf) }} />
                {selIds.length ? <ProductSelectionBar count={selIds.length} goesTo={Object.keys(by).map((k) => `${short(k)} ${by[k]}`).join(' · ')} lists={Object.keys(by).length} onClear={() => setSel(new Set())} onAdd={() => addMany(selIds.map((id) => prod(id)!))} /> : null}
              </>
            )}
          </div>
        )}
      </InventoryChrome>
      <Modal open={dlg} onOpenChange={setDlg} icon={Package} title="Add product" description="It starts at 0 on hand. Receive stock or count it next." size="md"
        footer={<><Button onClick={saveAdd}>Add product</Button><Button variant="text" onClick={() => setDlg(false)}>Cancel</Button></>}>
        <div className="flex flex-col gap-3">
          <TextField label="Name" value={form.name} placeholder={tenant === 'a' ? 'Fleetguard LF3349 oil filter' : 'Oat milk 1L'} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="SKU" value={form.sku} placeholder={tenant === 'a' ? 'FG-LF3349' : 'MLK-OAT-1L'} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <label className="flex flex-col gap-1 text-[13px]">Category<Select size="sm" options={D.categories.map((c) => ({ value: c.id, label: c.name }))} value={form.cat} onValueChange={(v) => setForm({ ...form, cat: v })} /></label>
          <label className="flex flex-col gap-1 text-[13px]">Unit<Select size="sm" options={UNITS.map((u) => ({ value: u, label: u }))} value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })} /></label>
          <label className="flex flex-col gap-1 text-[13px]">Supplier<Select size="sm" options={D.suppliers.map((s) => ({ value: s.id, label: s.name }))} value={form.sup} onValueChange={(v) => setForm({ ...form, sup: v })} /></label>
          <div className="flex items-end gap-2"><div className="flex-1"><TextField label="Barcode" inputMode="numeric" value={form.barcode} placeholder="13 digits, optional" onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div><Button variant="secondary" onClick={() => toast('The barcode sheet opens here.')}>Scan</Button></div>
          <TextField label="Reorder level" type="number" min={0} step={1} value={form.reorder} onChange={(e) => setForm({ ...form, reorder: e.target.value })} />
          <p role="alert" className="m-0 min-h-[18px] text-[13px] text-bad">{form.err}</p>
          <p className="m-0 text-[13px] text-muted">Categories, suppliers and units come from Setup. Need a new one? <button type="button" className="text-accent" onClick={() => toast('Setup is coming next.')}>Add it in Setup</button></p>
        </div>
      </Modal>
    </>
  );
}
