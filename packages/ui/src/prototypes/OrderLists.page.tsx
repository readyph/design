import { useMemo, useState } from 'react';
import { MagnifyingGlass, Plus, ArrowsDownUp, FileText, House, List, ListChecks, Package, PaperPlaneTilt, Printer, Receipt, SlidersHorizontal, CheckCircle, Clock, Truck } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { AccountMenu } from '../components/AccountMenu';
import { AskLedaBar } from '../components/AskLedaBar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LedaMark } from '../components/Leda';
import { Select } from '../components/Select';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toaster } from '../components/toast/Toaster';
import { toast } from '../components/toast/toastStore';
import { ErrorBlock } from '../components/ErrorBlock';
import { IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer } from '../components/IconRail';
import { OrderListsPanel, type OrderListGroup } from '../components/OrderListsPanel';
import { PaperDocument, type PaperLine } from '../components/PaperDocument';
import { PlatformShell } from '../components/PlatformShell';
import { QuantityStepper } from '../components/QuantityStepper';
import { SegmentedControl } from '../components/SegmentedControl';
import { SheetBar, SheetBarWhere } from '../components/SheetBar';
import { InventoryStatusBar } from '../components/StatusBar';
import { Skeleton } from '../components/Skeleton';
import { SideSteps } from '../components/ProgressSteps';
import { cn } from '../utils/cn';
import { OL_A, OL_B, OL_NOW, type OLCart, type OLPo, type OLProduct, type OLTenant } from './OrderLists.data';

/* RDY-405. Page: Order lists (handover 2.3 and 2.4; order-list.html, order-list.js, order-list.css, cart.js, cart.css, orders.js).
   URL: `?tenant=a|b` `?as=manager|clerk|owner` `?state=loading|error|empty` `&tab=sent` `&po=<no>` `&s=<supplier>` `&lists=empty` `&cart=open` `&confirm=1`. */
export type OrderListsRole = 'manager' | 'clerk' | 'owner';
export interface OrderListsPageProps {
  tenant?: 'a' | 'b';
  as?: OrderListsRole;
  state?: 'loading' | 'error' | 'empty';
  tab?: 'lists' | 'sent';
  po?: string;
  supplier?: string;
  /** `?lists=empty` */
  empty?: boolean;
  /** `?cart=open` */
  cart?: boolean;
  /** Mark as sent asks first (step 3 confirm open). */
  confirm?: boolean;
  /** Clerk has already asked the manager. */
  asked?: boolean;
  /** `?from=home`: the crumb gets a "Back to Home" link. */
  from?: 'home';
}

const WHO: Record<OrderListsRole, { id: string; name: string; short: string; initials: string; label: string; email: string }> = {
  manager: { id: 'berto', name: 'Berto Villanueva', short: 'Berto', initials: 'BV', label: 'Manager', email: 'berto@example.ph' },
  clerk: { id: 'joy', name: 'Joy Mendoza', short: 'Aling Joy', initials: 'JM', label: 'Stock clerk', email: 'joy@example.ph' },
  owner: { id: 'berto', name: 'Berto Villanueva', short: 'Berto', initials: 'BV', label: 'Owner', email: 'berto@example.ph' },
};
const NAV: { id: string; label: string; short?: string; icon: PhosphorIcon; needs?: string }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'pos', label: 'Purchase orders', short: 'Orders', icon: Receipt },
  { id: 'moves', label: 'Movements', icon: ArrowsDownUp },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'setup', label: 'Setup', icon: SlidersHorizontal, needs: 'setup' },
];
const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-PH')}`;
const pesoC = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (n: number) => n.toLocaleString('en-PH');
const unitOf = (p: OLProduct, n: number) => (p.unit === 'pc' ? 'pc' : n === 1 ? p.unit : `${p.unit}s`);
const STW = (p: OLProduct) => (p.onHand <= 0 ? 'Out of stock' : p.onHand <= p.reorder ? 'Low stock' : 'In stock');
const toMin = (hm?: string) => (hm ? +hm.slice(0, 2) * 60 + +hm.slice(3, 5) : null);
const NOW = 9 * 60 + 12;

interface ListModel { id: string; no: string | null; printed?: string; sup: string; by: string; at: string; lines: { p: string; qty: number; by: string; cost?: number }[] }

export function OrderListsPage({ tenant = 'a', as = 'manager', state, tab = 'lists', po, supplier, empty, cart, confirm, asked, from }: OrderListsPageProps) {
  const T: OLTenant = tenant === 'a' ? OL_A : OL_B;
  const me = WHO[as];
  const money = as !== 'clerk';
  const mgr = as !== 'clerk';
  const [cartOpen, setCartOpen] = useState(!!cart);
  const [curTab, setCurTab] = useState(tab);
  const [sel, setSel] = useState<string | undefined>(supplier);
  const [selPo, setSelPo] = useState<string | undefined>(po);
  const [asking, setAsking] = useState(!!confirm);
  const [askedMgr, setAskedMgr] = useState(!!asked);
  const [retried, setRetried] = useState(false);
  const [query, setQuery] = useState('');
  const [justSent, setJustSent] = useState<OLPo[]>([]);
  const [discardOpen, setDiscardOpen] = useState(false);
  const prod = (id: string) => T.products.find((p) => p.id === id);
  const sup = (id: string) => T.suppliers.find((s) => s.id === id) ?? { id, name: id, leadTime: '' };
  const short = (id: string) => sup(id).name.split(' ')[0];
  const [lists, setLists] = useState<ListModel[]>(() => (empty ? [] : [
    ...T.pos.filter((p) => p.status === 'DRAFT').map((p) => ({ id: `L-${p.no}`, no: p.no, sup: p.supplier, by: 'leda', at: '9:02 AM', lines: p.lines.map((l) => ({ p: l.p, qty: l.ordered, by: 'leda', cost: l.cost })) })),
    ...T.carts.map((c: OLCart) => ({ id: c.id, no: null, sup: c.sup, by: c.by, at: c.at, lines: c.lines })),
  ]));
  const cost = (x: { p: string; cost?: number }) => x.cost ?? prod(x.p)?.cost ?? 0;
  const total = (l: ListModel) => l.lines.reduce((s, x) => s + x.qty * cost(x), 0);
  const cutoff = (id: string) => {
    const c = toMin(sup(id).cutoff);
    if (c == null) return null;
    const d = c - NOW;
    if (d <= 0) return { at: sup(id).cutoff as string, passed: true, left: 0, text: '', arrive: undefined as string | undefined };
    const h = Math.floor(d / 60), m = d % 60;
    return { at: sup(id).cutoff as string, passed: false, left: d, text: h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`, arrive: sup(id).sameDayArrival };
  };
  const po_ = lists.filter((l) => l.no && l.lines.length).sort((a, b) => (toMin(sup(a.sup).cutoff) ?? 9e3) - (toMin(sup(b.sup).cutoff) ?? 9e3) || sup(a.sup).name.localeCompare(sup(b.sup).name));
  const carts = lists.filter((l) => !l.no && l.lines.length);
  const cur = po_.find((l) => l.sup === sel) ?? po_[0] ?? null;
  const sent: OLPo[] = [...justSent, ...T.pos.filter((p) => p.status === 'ORDERED' || p.status === 'PARTIAL')];
  const curPo = sent.find((p) => p.no === selPo) ?? sent[0] ?? null;
  const incoming = (id: string) => sent.reduce((a, o) => a + o.lines.filter((x) => x.p === id).reduce((b, x) => b + Math.max(0, x.ordered - x.received), 0), 0);
  const suggest = (pr: OLProduct) => Math.max(pr.reorder, pr.reorder * 2 - pr.onHand - incoming(pr.id), 1);
  const needsFor = (supId: string) => T.products.filter((pr) => pr.supplier === supId && pr.onHand <= pr.reorder && !lists.some((l) => l.lines.some((x) => x.p === pr.id)) && !incoming(pr.id)).sort((a, b) => a.onHand / a.reorder - b.onHand / b.reorder);
  const unitsTxt = (n: number) => `${n} ${n === 1 ? 'product' : 'products'}`;
  const patch = (id: string, fn: (l: ListModel) => ListModel) => setLists((ls) => ls.map((y) => (y.id === id ? fn(y) : y)));
  const addLines = (l: ListModel, add: { p: string; qty: number }[], msg: string) => {
    const before = l.lines;
    patch(l.id, (y) => ({ ...y, lines: [...y.lines, ...add.map((a) => ({ ...a, by: me.id }))] }));
    setQuery('');
    toast({ description: msg, actions: [{ label: 'Undo', onClick: () => patch(l.id, (y) => ({ ...y, lines: before })) }] });
  };
  const removeLine = (l: ListModel, pid: string) => {
    const before = l.lines;
    patch(l.id, (y) => ({ ...y, lines: y.lines.filter((z) => z.p !== pid) }));
    toast({ description: `${prod(pid)?.name} taken off the ${short(l.sup)} list.`, actions: [{ label: 'Undo', onClick: () => patch(l.id, (y) => ({ ...y, lines: before })) }] });
  };
  const markSent = (l: ListModel) => {
    const rec: OLPo = { no: l.no ?? 'PO-0225', supplier: l.sup, status: 'ORDERED', ordered: OL_NOW.short, expected: expectedFor(l.sup), sentAt: OL_NOW.time, lines: l.lines.map((x) => ({ p: x.p, ordered: x.qty, received: 0, cost: cost(x) })) };
    setLists((ls) => ls.filter((y) => y.id !== l.id)); setJustSent((j) => [rec, ...j]); setSelPo(rec.no); setCurTab('sent'); setAsking(false);
    toast({ description: `${rec.no} marked as sent to ${sup(l.sup).name}. It is an open purchase order, expected ${rec.expected}.`, actions: [{ label: 'Undo', onClick: () => { setJustSent((j) => j.filter((x) => x.no !== rec.no)); setLists((ls) => [...ls, l]); setCurTab('lists'); setSelPo(undefined); setSel(l.sup); } }] });
  };
  const askSend = (l: ListModel) => { setAskedMgr(true); toast({ description: `Berto has been asked to mark the ${short(l.sup)} list as sent.`, actions: [{ label: 'Undo', onClick: () => setAskedMgr(false) }] }); };
  const discard = (l: ListModel) => {
    setLists((ls) => ls.filter((y) => y.id !== l.id)); setSel(undefined); setDiscardOpen(false);
    toast({ description: `${l.no} for ${sup(l.sup).name} discarded.`, actions: [{ label: 'Undo', onClick: () => { setLists((ls) => [...ls, l]); setSel(l.sup); } }] });
  };
  const allNeeds = () => T.products.filter((pr) => pr.onHand <= pr.reorder && !lists.some((l) => l.lines.some((x) => x.p === pr.id)) && !incoming(pr.id));
  const draftAll = () => {
    const items = allNeeds();
    if (!items.length) { toast({ description: 'Every product that needs stock is on a list or an order already.' }); return; }
    const before = lists;
    const next = lists.map((l) => ({ ...l, lines: [...l.lines] }));
    items.forEach((pr) => {
      let tgt = next.find((l) => !l.no && l.sup === pr.supplier);
      if (!tgt) { tgt = { id: `C-${pr.supplier}`, no: null, sup: pr.supplier, by: 'leda', at: OL_NOW.time, lines: [] }; next.push(tgt); }
      tgt.lines.push({ p: pr.id, qty: suggest(pr), by: 'leda' });
    });
    const nSup = new Set(items.map((pr) => pr.supplier)).size;
    setLists(next); setCurTab('lists');
    toast({ description: `${unitsTxt(items.length)} added to ${nSup} order ${nSup === 1 ? 'list' : 'lists'} by Leda. Nothing is sent.`, leda: true, actions: [{ label: 'Undo', onClick: () => setLists(before) }, { label: 'View order lists', onClick: () => setCartOpen(true) }] });
  };
  const doPrint = (l: ListModel | null) => { if (l && curTab === 'lists') patch(l.id, (y) => ({ ...y, printed: OL_NOW.time })); window.print(); };
  const loading = state === 'loading';
  const firstRun = state === 'empty';
  const errored = state === 'error' && !retried;
  const hide = loading || errored;

  const canSetup = as !== 'clerk';
  const items = NAV.filter((n) => !n.needs || canSetup);
  const platform = { name: T.platform, initials: T.platform.split(' ').map((w) => w[0]).join('') };
  const rail = (
    <IconRailContent>
      <IconRailMark variant="letter" href="#portal" label="Back to the ReadyPH Portal" animate={false} />
      {items.map((n) => <IconRailItem key={n.id} icon={n.icon} label={n.label} href={`#${n.id}`} current={n.id === 'pos'} />)}
      <IconRailSpacer />
      <IconRailFoot><AccountMenu name={me.name} email={me.email} role={me.label} initials={me.initials} applyToDocument={false} /></IconRailFoot>
    </IconRailContent>
  );
  const tabCls = 'relative flex min-h-11 flex-col items-center justify-center gap-[3px] text-tiny text-muted';
  const phoneNav = (
    <div className="grid h-[60px] w-full grid-cols-5 items-stretch">
      {items.slice(0, 4).map((n) => (
        <a key={n.id} href={`#${n.id}`} aria-current={n.id === 'pos' ? 'page' : undefined} className={cn(tabCls, n.id === 'pos' && 'font-medium text-text')}>
          <n.icon size={20} aria-hidden />{n.short ?? n.label}
        </a>
      ))}
      <button type="button" className={tabCls}><List size={20} aria-hidden />More</button>
    </div>
  );
  const topBar = (
    <>
      <span className="flex-none whitespace-nowrap text-[15px] font-semibold">{T.platform}</span>
      <span className="min-w-0 truncate text-[13px] text-muted max-[480px]:hidden">· Order lists</span>
      <span className="flex-1" />
      <button type="button" onClick={() => setCartOpen(true)} aria-haspopup="dialog" className="relative inline-flex h-9 flex-none items-center gap-1.5 rounded-control border border-control px-2.5 text-[13px] font-semibold text-text">
        <ListChecks size={18} aria-hidden />Order lists
        {carts.length > 0 && <span className="h-4 min-w-4 rounded-[3px] bg-text px-1 text-center text-tiny font-medium leading-4 text-surface">{carts.length}</span>}
      </button>
      <AskLedaBar variant="bar" scope="Order lists" shortcuts={false} />
      <span className="contents [&>button]:size-11"><AccountMenu name={me.name} email={me.email} role={me.label} initials={me.initials} applyToDocument={false} /></span>
    </>
  );

  const nCarts = carts.length;
  const headline = (() => {
    if (curTab === 'sent') { const n = sent.length; return n ? `${n} open purchase ${n === 1 ? 'order' : 'orders'}. Receive each on the Purchase orders page when it arrives.` : 'No purchase order is open.'; }
    if (errored) return 'Purchase orders did not load, so the order lists are not shown.';
    if (firstRun) return 'No products yet, so there is nothing to order. Add products first.';
    if (!lists.length) return 'No order list is open. Nothing is waiting to be sent.';
    const n = lists.reduce((s, l) => s + l.lines.length, 0);
    const parts: string[] = [];
    if (nCarts) parts.push(`${nCarts} ${nCarts === 1 ? 'list to proceed' : 'lists to proceed'}`);
    if (po_.length) parts.push(`${po_.length} ${po_.length === 1 ? 'draft PO, not sent' : 'draft POs, not sent'}`);
    const sum = parts.length ? parts.join(', ') : 'none open';
    const first = po_.map((l) => ({ l, c: cutoff(l.sup) })).find((x) => x.c && !x.c.passed);
    const tot = lists.reduce((s, l) => s + total(l), 0);
    return `${sum[0].toUpperCase() + sum.slice(1)}: ${n} ${n === 1 ? 'product' : 'products'}${money ? `, ${peso(tot)}` : ''}. Nothing has been sent.${first && first.c ? ` ${short(first.l.sup)}'s must go by ${first.c.at} for same-day delivery (${first.c.text} left).` : ''}`;
  })();

  const rowCls = 'relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-t border-rule px-2 py-3.5 text-left first:border-t-transparent';
  const Row = ({ on, onClick, t1, t2, cut, soon, rv, rvSmall, ...rest }: { on?: boolean; onClick?: () => void; t1: string; t2: React.ReactNode; cut?: string; soon?: boolean; rv: string; rvSmall?: React.ReactNode }) => (
    <div role="listitem"><button type="button" onClick={onClick} aria-current={on ? 'true' : undefined} className={cn(rowCls, on && 'bg-raised before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-text')} {...rest}>
      <span className="flex min-w-0 flex-col gap-0.5"><span className="text-[14px] font-medium">{t1}</span><span className="text-[12px] text-muted">{t2}</span>{cut && <span className={cn('mt-0.5 text-[12px]', soon ? 'text-bad' : 'text-muted')}>{cut}</span>}</span>
      <span className="flex flex-col items-end gap-0.5"><b className="text-[14px] font-semibold tabular-nums">{rv}</b><small className="text-[12px] text-muted">{rvSmall}</small></span>
    </button></div>
  );
  const clerkRv = (l: ListModel) => { const c = cutoff(l.sup); return c && !c.passed ? `By ${c.at}` : ''; };
  const stateOf = (l: ListModel) => (askedMgr && l === cur ? 'Waiting for your manager' : 'Not printed');

  const indexRows = curTab === 'sent' ? (
    sent.length ? (
      <div role="list">
        {sent.map((p) => {
          const part = p.status === 'PARTIAL';
          const ord = p.lines.reduce((s, l) => s + l.ordered, 0), rec = p.lines.reduce((s, l) => s + l.received, 0);
          const tot = p.lines.reduce((s, l) => s + l.ordered * l.cost, 0);
          return <Row key={p.no} on={curPo?.no === p.no} onClick={() => setSelPo(p.no)} t1={sup(p.supplier).name} t2={<><span className="font-mono">{p.no}</span> · {part ? `Part in · ${rec} of ${ord}` : 'Sent'}</>} rv={money ? peso(tot) : String(ord)} rvSmall={money ? p.expected.replace(/ \(rest\)/, '').replace(/ · .*$/, '') : 'units'} />;
        })}
      </div>
    ) : <p className="mt-3 text-[13px] text-muted">Nothing is on order.</p>
  ) : (
    <div role="list">
      {po_.map((l) => {
        const c = cutoff(l.sup), soon = !!c && !c.passed && c.left <= 60;
        const n = l.lines.length;
        return <Row key={l.id} on={cur?.id === l.id} onClick={() => setSel(l.sup)} t1={sup(l.sup).name} t2={`${n} ${n === 1 ? 'product' : 'products'} · ${stateOf(l)}`} cut={c && !c.passed ? `Order by ${c.at}${soon ? ` · ${c.text} left` : ''}` : undefined} soon={soon} rv={money ? peso(total(l)) : clerkRv(l)} rvSmall={money ? `${n} ${n === 1 ? 'line' : 'lines'}` : clerkRv(l) ? 'order cutoff' : ''} />;
      })}
      {carts.map((l) => (
        <Row key={l.id} onClick={() => setCartOpen(true)} t1={sup(l.sup).name} t2={`${l.lines.length} ${l.lines.length === 1 ? 'product' : 'products'} · In the cart, not a PO yet`} rv={money ? peso(total(l)) : ''} rvSmall="Proceed" />
      ))}
    </div>
  );

  const paper = (() => {
    const isPo = curTab === 'sent';
    const l = cur, p = curPo;
    const supId = isPo ? p?.supplier : l?.sup;
    if (!supId) return null;
    const s = sup(supId), c = T.contacts[supId] ?? { who: '', phone: '', email: '', addr: '' };
    const lines = isPo ? p!.lines.map((x) => ({ p: x.p, qty: x.ordered, rec: x.received, cost: x.cost })) : l!.lines.map((x) => ({ p: x.p, qty: x.qty, rec: 0, cost: cost(x), by: x.by }));
    const no = isPo ? p!.no : l!.no ?? 'Not a PO yet';
    const partIn = isPo && p!.status === 'PARTIAL';
    const unitsOrd = lines.reduce((a, x) => a + x.qty, 0), unitsRec = lines.reduce((a, x) => a + x.rec, 0);
    const terms = s.leadTime ? `${s.leadTime}${/[.!]$/.test(s.leadTime) ? '' : '.'}` : '';
    const paperLines: PaperLine[] = lines.map((x) => {
      const pr = prod(x.p);
      if (!pr) return null as unknown as PaperLine;
      const why = `${(x as { by?: string }).by === 'leda' ? 'Suggested by Leda · ' : ''}${pr.onHand} left · ${STW(pr)}`;
      return {
        id: x.p, code: pr.sku, product: pr.name, sub: isPo ? undefined : why, quantity: x.qty, unit: unitOf(pr, x.qty), received: partIn ? x.rec : undefined,
        cost: money ? pesoC(x.cost) : undefined, amount: money ? pesoC(x.qty * x.cost) : undefined,
        editor: isPo ? undefined : <QuantityStepper compact value={x.qty} productName={pr.name} onValueChange={(q) => setLists((ls) => ls.map((y) => (y.id === l!.id ? { ...y, lines: y.lines.map((z) => (z.p === x.p ? { ...z, qty: q } : z)) } : y)))} />,
      };
    }).filter(Boolean);
    const qtyBy = (() => { const g = new Map<string, number>(); lines.forEach((x) => { const pr = prod(x.p); if (pr) g.set(pr.unit, (g.get(pr.unit) ?? 0) + x.qty); }); return [...g].map(([u, n]) => `${num(n)} ${u === 'pc' ? 'pc' : n === 1 ? u : `${u}s`}`).join(' · '); })();
    const tot = lines.reduce((a, x) => a + x.qty * x.cost, 0);
    const date = isPo ? `${p!.ordered} 2026` : OL_NOW.date;
    const prep = isPo ? '' : l!.by === 'leda' ? `Leda, ${l!.at}` : '';
    const stat = isPo ? <Badge tone={partIn ? 'warn' : 'accent'}>{partIn ? `Part in · ${unitsRec} of ${unitsOrd}` : 'Sent'}</Badge> : <Badge tone="neutral">{askedMgr ? 'Draft · waiting for your manager' : 'Draft · not sent'}</Badge>;
    return (
      <PaperDocument
        label={`${isPo ? 'Purchase order' : 'Order list'} for ${s.name}`}
        logo={undefined}
        company={T.company}
        companyLine={`${T.platform} · ${T.place}`}
        title="Purchase order"
        number={no}
        meta={[
          { label: 'Date', value: date },
          { label: 'Status', value: stat, only: 'screen' },
          ...(prep ? [{ label: 'Prepared by', value: prep }] : []),
          { label: 'Expected', value: isPo ? p!.expected.replace(/ \(rest\)/, '') : expectedFor(s.id) },
        ]}
        parties={[
          { heading: 'Supplier', name: s.name, lines: [c.who && `Attn: ${c.who}`, c.phone, c.email, c.addr].filter(Boolean) as string[] },
          { heading: 'Deliver to', name: T.platform, lines: [T.company, T.place, `Receiving ${T.hoursLabel}`], terms: terms ? `Terms: ${terms}` : undefined },
        ]}
        lines={paperLines}
        quantityLabel={isPo ? 'Ordered' : 'Quantity'}
        showReceived={partIn}
        showPrices={money}
        onRemove={isPo ? undefined : (x) => removeLine(l!, x.id)}
        totals={{ products: lines.length, quantity: qtyBy, total: money ? pesoC(tot) : undefined }}
        note={{ label: 'Notes to the supplier', text: '', placeholder: 'For example: deliver to the back door, call before arriving.', onChange: isPo ? undefined : () => undefined }}
        signatures={['Prepared by', 'Approved by']}
        footer={`${T.company} · ${no} · printed ${OL_NOW.date}, ${OL_NOW.time}`}
        empty="This list is empty. Add a product below."
      />
    );
  })();

  function expectedFor(id: string) {
    const s = sup(id), lt = s.leadTime, ci = cutoff(id);
    const dayLabel = (add: number) => { const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; let n = 22, dow = 4, left = add; while (left > 0) { n++; dow = (dow + 1) % 7; if (tenant === 'a' && dow === 0) continue; left--; } return `${DOW[dow]} ${n} Oct`; };
    if (s.sameDayArrival && ci && !ci.passed) return `${OL_NOW.short} · by ${s.sameDayArrival}`;
    if (/same day/i.test(lt) && !s.cutoff) return OL_NOW.short;
    if (s.cutoff && /next morning/i.test(lt)) return `${dayLabel(ci && ci.passed ? 2 : 1)}, 7:00`;
    const m = /(\d+)(?:-(\d+))? days?/.exec(lt);
    if (/next morning|1 day/i.test(lt)) return dayLabel(1);
    return dayLabel(m ? +(m[2] || m[1]) : 2);
  }

  const side = (() => {
    if (curTab === 'sent') {
      if (!curPo) return null;
      const can = as !== 'clerk';
      return (
        <aside aria-label="This order" className="min-w-0">
          <h3 className="border-b border-border pb-2.5 text-[13px] font-semibold">This order</h3>
          <ol className="m-0 list-none p-0">
            <li className="flex flex-col items-start gap-1 border-t border-transparent py-4"><b className="text-[14px] font-semibold">It is sent</b><span className="text-[13px] leading-[19px] text-muted">{curPo.sentAt ? `Marked sent ${curPo.sentAt}.` : 'It is an open purchase order.'} Expected {curPo.expected.replace(/ \(rest\)/, '')}.</span></li>
            <li className="flex flex-col items-start gap-1 border-t border-rule py-4"><b className="text-[14px] font-semibold">Print a copy</b><span className="text-[13px] leading-[19px] text-muted">For the delivery desk or your records.</span><Button variant="secondary" leftIcon={Printer} className="mt-2" onClick={() => doPrint(null)}>Print</Button></li>
            <li className="flex flex-col items-start gap-1 border-t border-rule py-4"><b className="text-[14px] font-semibold">When it arrives</b><span className="text-[13px] leading-[19px] text-muted">{can ? 'Count it on the Purchase orders page. Stock goes up there.' : 'Your manager or a stock clerk receives it.'}</span><a className={cn('mt-2 inline-flex h-8 items-center gap-1.5 rounded-control px-3 text-[13px] font-medium', can ? 'bg-accent text-on-accent' : 'border border-control')} href="#purchase-orders">{can ? <Truck size={14} aria-hidden /> : <Receipt size={14} aria-hidden />}{can ? 'Receive it' : 'Open the order'}</a></li>
          </ol>
        </aside>
      );
    }
    if (!cur) return null;
    const c = cutoff(cur.sup), soon = !!c && !c.passed && c.left <= 60;
    return (
      <aside aria-label="Send this list" className="min-w-0">
        <h3 className="border-b border-border pb-2.5 text-[13px] font-semibold">Send this list</h3>
        <SideSteps
          steps={[
            { title: '1 · Check it', note: `Change quantities, remove lines, add a note.${cur.by === 'leda' ? ' Leda suggested these.' : ''}` },
            { title: '2 · Print it', note: <>{cur.printed ? `Printed ${cur.printed}.` : 'Not printed yet.'} Print or save as PDF, then send it to {short(cur.sup)} your usual way.<br /><Button variant={cur.printed ? 'secondary' : 'primary'} leftIcon={Printer} className="mt-2" onClick={() => doPrint(cur)} disabled={!cur.lines.length}>Print</Button></> },
            { title: mgr ? '3 · Mark it sent' : '3 · Your manager marks it sent', note: (
              <>
                {mgr ? 'Once it has gone. It then counts as on order everywhere.' : 'You can build and print. Only a manager marks it sent.'}
                {mgr && (asking ? (
                  <span role="group" aria-label="Confirm marking as sent" className="mt-2 block border-t border-text pt-3 text-[13px] leading-[19px]">
                    <b className="block font-semibold text-text">Mark {cur.no} as sent to {sup(cur.sup).name}?</b>
                    <span className="mt-1.5 block text-muted">Nothing is sent from here. This records that you sent the printed list. The list is locked and becomes an open purchase order, expected {expectedFor(cur.sup)}. {cur.printed ? '' : ' It has not been printed.'}</span>
                    <span className="mt-3 flex flex-wrap gap-2"><Button variant="primary" onClick={() => markSent(cur)}>Mark as sent</Button><Button variant="text" onClick={() => setAsking(false)}>Cancel</Button></span>
                  </span>
                ) : <Button variant={cur.printed ? 'primary' : 'secondary'} leftIcon={PaperPlaneTilt} className="mt-2" onClick={() => setAsking(true)} disabled={!cur.lines.length}>Mark as sent</Button>)}
                {!mgr && (askedMgr ? (
                  <span className="mt-2 flex items-start gap-1.5 text-[13px] text-muted"><CheckCircle size={16} aria-hidden /><span><b className="font-semibold text-text">Asked your manager, 9:12 AM</b><br />Waiting for your manager to mark it sent. <Button variant="text" onClick={() => setAskedMgr(false)}>Undo</Button></span></span>
                ) : <Button variant="secondary" leftIcon={PaperPlaneTilt} className="mt-2" onClick={() => askSend(cur)} disabled={!cur.lines.length}>Ask your manager to mark it sent</Button>)}
              </>
            ) },
          ]}
        />
        {c && !c.passed && (
          <p className="flex items-start gap-2 border-t border-rule py-4 text-[13px] leading-[19px] text-muted">
            <Clock size={16} className={cn('mt-px', soon && 'text-bad')} aria-hidden />
            <span className={soon ? 'text-bad' : undefined}>{c.arrive ? <>{short(cur.sup)} delivers the same day (by {c.arrive}) if ordered by <b className={cn('font-semibold', soon ? 'text-bad' : 'text-text')}>{c.at}</b>.</> : <>{short(cur.sup)}: {sup(cur.sup).leadTime}{/[.]$/.test(sup(cur.sup).leadTime) ? '' : '.'} Order by <b className={cn('font-semibold', soon ? 'text-bad' : 'text-text')}>{c.at}</b>.</>} {c.text} left.</span>
          </p>
        )}
        <button type="button" className="mt-1 min-h-8 text-[13px] text-muted underline max-[640px]:hidden" onClick={() => setDiscardOpen(true)}>Discard this list</button>
      </aside>
    );
  })();

  const addSection = (() => {
    if (curTab !== 'lists' || !cur) return null;
    const term = query.trim().toLowerCase();
    const have = new Set(cur.lines.map((x) => x.p));
    const hits = term ? T.products.filter((pr) => pr.supplier === cur.sup && [pr.name, pr.sku].some((t) => t.toLowerCase().includes(term))).slice(0, 6) : [];
    const nd = needsFor(cur.sup);
    const ndTot = nd.reduce((a, pr) => a + suggest(pr) * pr.cost, 0);
    const addRow = (pr: OLProduct, on: boolean) => (
      <div key={pr.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-rule px-2 py-2.5 first:border-t-transparent">
        <span className="flex min-w-0 flex-col gap-0.5"><span className="text-[14px] font-medium">{pr.name}</span><span className="text-[12px] text-muted"><span className="font-mono">{pr.sku}</span> · {pr.onHand} left · {STW(pr)}</span></span>
        {on ? <span className="px-1 text-[13px] text-muted">On the list</span> : <button type="button" aria-label={`Add ${suggest(pr)} ${pr.name} to the list`} onClick={() => addLines(cur, [{ p: pr.id, qty: suggest(pr) }], `${suggest(pr)} ${pr.name} added to the ${short(cur.sup)} list. Change the quantity on the paper.`)} className="inline-flex min-h-7 items-center gap-1.5 px-1 text-[13px] font-medium text-accent"><Plus size={14} aria-hidden />Add {suggest(pr)}</button>}
      </div>
    );
    return (
      <section aria-label="Add products" className="mt-7 border-t border-dashed border-control pt-5 print:hidden">
        <div className="mb-3 flex items-baseline gap-2.5"><h3 className="text-[15px] font-semibold">Add products</h3><span className="text-[12px] text-muted">Not printed</span></div>
        <label className="relative block"><span className="sr-only">Search {sup(cur.sup).name} products</span><MagnifyingGlass size={16} aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -mt-2 text-muted" /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" placeholder={`Search ${short(cur.sup)} products by name or code`} className="h-[34px] w-full rounded-control border border-control bg-surface pl-[34px] pr-2.5 text-[14px] text-text placeholder:text-muted" /></label>
        {term && (hits.length ? <div className="mt-2">{hits.map((pr) => addRow(pr, have.has(pr.id)))}</div> : <p className="mt-3 text-[13px] text-muted">No {short(cur.sup)} product matches “{query.trim()}”. A product from another supplier goes on that supplier's list: add it from Products.</p>)}
        {nd.length ? (
          <div className="mt-6">
            <div className="flex items-center gap-2.5 border-b border-rule pb-2 text-[13px]"><b>Needs stock, not on a list</b><span className="tabular-nums text-muted">{nd.length}</span><Button variant="secondary" leftIcon={Plus} className="ml-auto" onClick={() => addLines(cur, nd.map((pr) => ({ p: pr.id, qty: suggest(pr) })), `${unitsTxt(nd.length)} added to the ${short(cur.sup)} list.`)}>Add all {nd.length}</Button></div>
            <p className="mb-1 mt-2 text-[13px] leading-[19px] text-muted">Add all puts {nd.length === 1 ? 'this product' : `these ${nd.length} products`} on the list at the quantities shown{money ? `, about ${peso(ndTot)}` : ''}. Nothing is sent.</p>
            <div>{nd.map((pr) => addRow(pr, false))}</div>
          </div>
        ) : <p className="mt-6 text-[13px] text-muted">Everything from {short(cur.sup)} that needs stock is on this list or on order.</p>}
        <button type="button" className="mt-5 hidden min-h-11 items-center text-[13px] text-muted underline max-[640px]:inline-flex" onClick={() => setDiscardOpen(true)}>Discard this list</button>
      </section>
    );
  })();

  const first = (head: string, body: string, action?: React.ReactNode, extra?: string) => (
    <div className="py-10"><p className="text-[16px]"><b className="font-semibold">{head}</b></p><p className="mt-1.5 max-w-[560px] text-[14px] leading-[21px] text-muted">{body}</p>{extra && <p className="mt-5 text-[14px]">{extra}</p>}{action && <div className="mt-5 flex flex-wrap gap-2">{action}</div>}</div>
  );
  const body = (() => {
    if (loading) {
      return (
        <div aria-busy="true" className="grid grid-cols-[248px_minmax(0,1fr)_224px] items-start gap-x-10 max-[1100px]:grid-cols-1">
          <div><div className="border-b border-border pb-2.5 text-[13px] font-semibold">Order lists</div>{[0, 1, 2].map((i) => <div key={i} className={cn(rowCls)}><span className="flex flex-col gap-1.5"><Skeleton width={`${70 - i * 12}%`} height={14} /><Skeleton width="48%" height={12} /></span><Skeleton width={56} height={16} /></div>)}</div>
          <div className="rounded-card border border-border p-8"><div className="mb-6 text-[18px] font-semibold">Purchase order</div>{[0, 1, 2].map((i) => <div key={i} className="mb-3 flex gap-6"><Skeleton width={90} height={14} /><Skeleton width={`${60 - i * 8}%`} height={14} /><Skeleton width={60} height={14} /></div>)}</div>
          <aside><h3 className="border-b border-border pb-2.5 text-[13px] font-semibold">Send this list</h3><SideSteps steps={[{ title: '1 · Check it', note: 'Change quantities, remove lines, add a note.' }, { title: '2 · Print it', note: 'Print or save as PDF, then send it your usual way.' }, { title: mgr ? '3 · Mark it sent' : '3 · Your manager marks it sent', note: 'Once it has gone. It then counts as on order everywhere.' }]} /></aside>
        </div>
      );
    }
    if (errored) {
      return (
        <>
          <ErrorBlock thing="Purchase orders" lastLoaded="9:10 AM" onRetry={() => setRetried(true)} retryLabel="Retry">Purchase orders did not load. This is the list from 9:10 AM. Nothing can be changed, printed or sent until it loads, so nothing is ordered twice.</ErrorBlock>
          {cur && <div {...{ inert: '' }} className="mt-4 grid grid-cols-[248px_minmax(0,1fr)_224px] items-start gap-x-10 opacity-60 max-[1100px]:grid-cols-1"><div>{indexRows}</div><div>{paper}</div><div /></div>}
        </>
      );
    }
    if (curTab === 'sent' && !curPo) return first('No purchase order is open', 'When you mark an order list as sent, it appears here until it is received.');
    if (firstRun) return first('No products yet', 'Order lists gather products that need stock, one list per supplier. Add products first.', <a className="inline-flex h-8 items-center gap-1.5 rounded-control border border-control px-3 text-[13px] font-medium" href="#products"><Package size={14} aria-hidden />Go to Products</a>);
    if (curTab === 'lists' && !cur) {
      if (nCarts) return first('No purchase order is drafted yet', `${nCarts} order ${nCarts === 1 ? 'list is' : 'lists are'} in the cart. Press Proceed on one to make its purchase order, then print it${mgr ? ' and mark it sent' : '. Your manager marks it sent'}. Nothing is sent to the supplier.`, <Button variant="primary" leftIcon={ListChecks} onClick={() => setCartOpen(true)}>Open order lists</Button>);
      const need = allNeeds().length;
      return first('No order lists are open', `When a product runs low, add it to its supplier's list on Products. The lists gather here as paper you can print and send.${mgr ? '' : ' Your manager marks each list sent.'}`, <>{need > 0 && <Button variant="primary" onClick={draftAll}><LedaMark size={16} decorative />Let Leda draft the lists</Button>}<a className="inline-flex h-8 items-center gap-1.5 rounded-control border border-control px-3 text-[13px] font-medium" href="#products"><Package size={14} aria-hidden />Go to Products</a></>, need > 0 ? `${need} ${need === 1 ? 'product needs' : 'products need'} stock and ${need === 1 ? 'is' : 'are'} on no list.` : undefined);
    }
    return (
      <div className="grid grid-cols-[248px_minmax(0,1fr)_224px] items-start gap-x-10 max-[1100px]:grid-cols-1 max-[1100px]:gap-y-6">
        <div className="max-[1100px]:order-2">
          <div className="max-[640px]:hidden">
          {curTab === 'lists' && <div className="flex items-baseline gap-2 border-b border-border pb-2.5 text-[13px] font-semibold">Order lists <span className="font-medium tabular-nums text-muted">{lists.length}</span></div>}
          {indexRows}
          </div>
          {curTab === 'lists' && cur && (
            <div className="hidden flex-col gap-1 max-[640px]:flex">
              <span id="l-pick">List</span>
              <Select aria-labelledby="l-pick" value={cur.sup} onValueChange={(v) => setSel(v)} options={po_.map((l) => ({ value: l.sup, label: sup(l.sup).name, meta: `${l.lines.length} ${l.lines.length === 1 ? 'product' : 'products'}` }))} className="w-full" />
            </div>
          )}
          {curTab === 'sent' && curPo && (
            <div className="hidden flex-col gap-1 max-[640px]:flex">
              <span id="l-pick">List</span>
              <Select aria-labelledby="l-pick" value={curPo.no} onValueChange={(v) => setSelPo(v)} options={sent.map((p) => ({ value: p.no, label: sup(p.supplier).name, meta: p.no }))} className="w-full" />
            </div>
          )}
        </div>
        <div className="min-w-0 max-[1100px]:order-3">{paper}{addSection}</div>
        <div className="sticky top-4 max-h-[calc(100vh-32px)] min-w-0 overflow-y-auto overscroll-contain max-[1100px]:static max-[1100px]:order-1 max-[1100px]:max-h-none">{side}</div>
      </div>
    );
  })();

  const groups: OrderListGroup[] = useMemo(() => carts.map((l) => ({
    id: l.id, supplier: sup(l.sup).name, shortName: short(l.sup),
    lines: l.lines.map((x) => { const pr = prod(x.p)!; return { id: x.p, name: pr.name, sku: pr.sku, qty: x.qty, unit: pr.unit, cost: money ? pr.cost : undefined }; }),
  })), [lists]); // eslint-disable-line react-hooks/exhaustive-deps

  const nl = lists.length, np = sent.length;
  return (
    <>
      <PlatformShell
        railWidth="wide"
        railLabel="Inventory"
        rail={rail}
        topBar={topBar}
        phoneNav={phoneNav}
        heading={T.platform}
        hideSheetBarOnPhone
        sheetBar={<SheetBar wrapChildren={false} actionsFirst={false} actions={<AskLedaBar variant="bar" scope="Order lists" shortcuts={false} />}><SheetBarWhere platform={platform} page="Order lists" parent={<a className="hover:text-text" href="#purchase-orders">Purchase orders</a>} note={from === 'home' || as !== 'manager' ? <>{from === 'home' && <a href="#home" className="underline">Back to Home</a>}{from === 'home' && as !== 'manager' && <span aria-hidden="true" className="mx-2 text-control">·</span>}{as !== 'manager' && `Viewing as ${me.short}, ${me.label.toLowerCase()}`}</> : undefined} /></SheetBar>}
        statusLabel="Status"
        status={<InventoryStatusBar platform={platform} dataLink={tenant === 'a' ? { with: T.company, status: 'linked', since: '8:50', title: 'Parts and job orders' } : undefined} viewer={{ name: me.short, role: me.label }} leda={{ canDecide: mgr, managerName: 'Berto' }} updatedAt={OL_NOW.time} />}
      >
        <div className="p-pad">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[22px] font-semibold">Order lists</h1>
              <p className="mt-2 flex items-start gap-2 text-[15px] leading-[22px] max-[640px]:text-[14px] max-[640px]:leading-[21px]"><LedaMark size={16} decorative active={loading} className="mt-[3px] shrink-0" />{loading ? <Skeleton width={420} height={14} className="max-w-full" /> : <span>{headline}</span>}</p>
            </div>
            <span className="text-[12px] text-muted">{OL_NOW.date} · {loading ? `Loading… last loaded ${OL_NOW.lastLoaded}` : `Updated ${OL_NOW.time}`}</span>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <SegmentedControl
              aria-label="Show"
              value={curTab}
              onChange={(v) => setCurTab(v as 'lists' | 'sent')}
              options={[{ value: 'lists', label: hide ? 'Order lists' : `Order lists ${nl}` }, { value: 'sent', label: hide ? 'Sent orders' : `Sent orders ${np}` }]}
            />
          </div>
          <div className="mt-4 pb-24">{body}</div>
        </div>
        {!hide && curTab === 'lists' && cur && (
          <div className="fixed inset-x-0 bottom-0 z-10 hidden gap-2 border-t border-border bg-surface p-3 max-[640px]:flex">
            <Button variant={cur.printed ? 'secondary' : 'primary'} leftIcon={Printer} className="flex-1" onClick={() => doPrint(cur)}>Print</Button>
            {mgr ? (asking ? <Button variant="secondary" className="flex-1" onClick={() => setAsking(false)}>Cancel</Button> : <Button variant="secondary" leftIcon={PaperPlaneTilt} className="flex-1" onClick={() => setAsking(true)}>Mark as sent</Button>) : askedMgr ? <Button variant="secondary" className="flex-1" disabled>Asked your manager to send</Button> : <Button variant="secondary" className="flex-1" onClick={() => askSend(cur)}>Ask your manager to send</Button>}
          </div>
        )}
      </PlatformShell>
      <Toaster />
      {cur && <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen} title="Discard this list?" name={`${sup(cur.sup).name} · ${cur.no}`} description={`${unitsTxt(cur.lines.length)} come off the list. Nothing was sent, so there is nothing to cancel.`} confirmLabel="Discard list" cancelLabel="Cancel" tone="danger" onConfirm={() => discard(cur)} />}
      <OrderListsPanel
        open={cartOpen}
        onOpenChange={setCartOpen}
        groups={groups}
        canSend={mgr}
        money={money}
        purchaseOrdersHref="#purchase-orders"
        onQuantityChange={(gid, lid, q) => setLists((ls) => ls.map((y) => (y.id === gid ? { ...y, lines: y.lines.map((z) => (z.p === lid ? { ...z, qty: q } : z)) } : y)))}
        onRemove={(gid, lid) => setLists((ls) => ls.map((y) => (y.id === gid ? { ...y, lines: y.lines.filter((z) => z.p !== lid) } : y)))}
        onProceed={(gid) => setLists((ls) => ls.map((y) => (y.id === gid ? { ...y, no: y.no ?? 'PO-0225' } : y)))}
      />
    </>
  );
}
