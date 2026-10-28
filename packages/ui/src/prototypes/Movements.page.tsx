import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { ArrowsDownUp, ArrowSquareOut, CalendarBlank, FileText, House, List, ListChecks, Package, Receipt, SlidersHorizontal, WarningCircle, X, ArrowClockwise, ArrowCounterClockwise } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { AccountMenu } from '../components/AccountMenu';
import { ActionLink, BackLink } from '../components/ActionLink';
import { AskLedaBar } from '../components/AskLedaBar';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LedaMark } from '../components/Leda';
import { IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer } from '../components/IconRail';
import { Modal } from '../components/Modal';
import { MovementFilters, MovementLedger, MovementTabs, MovementTransfersOpen, type MovementDay, type MovementRow } from '../components/MovementLedger';
import { PlatformShell } from '../components/PlatformShell';
import { SheetBar, SheetBarWhere } from '../components/SheetBar';
import { Skeleton } from '../components/Skeleton';
import { InventoryStatusBar } from '../components/StatusBar';
import { Toaster } from '../components/toast/Toaster';
import { addToast } from '../components/toast/toastStore';
import type { RecordEntry, RecordProduct } from '../components/RecordMovementForm';
import { RecordView } from './Movements.record';
import { TransferStatusBadge, type TransferStatus } from '../components/TransferList';
import { cn } from '../utils/cn';
import { createMovementsModel, type LedgerRow, type MovementsParams, type MovementsRole, type MovementsState, type MovementsTenant, type TrView } from './Movements.data';

/* RDY-436. Page: Movements 2/6 (b), the ledger view, filters, tabs shell, states and phone. Transcribed from inventory-home FINAL movements.js 97-229, 261-275, 456-470, 483-516, 584-592,
   movements.css 5-86, 147-153, 157-243, movements.html 1-69, handover 2.6. The Transfers tab body is slice (d); Record movement and Undo are slice (c).
   URL: `?tenant=a|b` `?as=manager|clerk|owner` `?state=live|quiet|loading|error|empty` `&view=ledger|transfers` `&io=` `&reason=` `&prod=` `&who=` `&range=` `&from=` `&to=` `&qs=` `&mv=none`. */
export interface MovementsPageProps {
  tenant?: MovementsTenant;
  as?: MovementsRole;
  state?: MovementsState;
  view?: 'ledger' | 'transfers';
  io?: 'all' | 'in' | 'out';
  reason?: string;
  prod?: string;
  who?: string;
  range?: 'recent' | 'week' | 'all' | 'custom';
  from?: number;
  to?: number;
  qs?: string;
  /** `&mv=none` */
  mv?: 'none';
  /** `&jo=JO-0413`: the job order note is open. */
  jo?: string;
  /** `&record=1`: the Record movement sub-page (RDY-437, slice c). */
  record?: boolean;
  /** `&p=<id>`: the product the Record movement page starts with. */
  p?: string;
  /** Story only: a movement was just recorded, so the ledger shows the landed note with Undo (flash `moved`, stock.js 83-91). */
  landed?: boolean;
  /** Story only: the Undo question (movements.js 573-578) is open on the first row recorded here. */
  undoOpen?: boolean;
}

const NAV: { id: string; label: string; short?: string; icon: PhosphorIcon; needs?: string }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'pos', label: 'Purchase orders', short: 'Orders', icon: Receipt },
  { id: 'moves', label: 'Movements', icon: ArrowsDownUp },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'setup', label: 'Setup', icon: SlidersHorizontal, needs: 'setup' },
];
const link = 'cursor-pointer border-0 bg-transparent p-0 text-left font-semibold text-accent no-underline hover:text-lk-hover';
const idCls = 'text-[12px]';
const first = 'py-10';

export function MovementsPage({ tenant = 'a', as = 'manager', state = 'live', view, io, reason, prod, who: whoP, range, from, to, qs, mv, jo, record, p: recP, landed, undoOpen }: MovementsPageProps) {
  const params = useMemo<MovementsParams>(() => ({ view, io, reason, prod, who: whoP, range, from: from != null ? String(from) : undefined, to: to != null ? String(to) : undefined, qs, mv, record: record ? '1' : undefined, p: recP }), [view, io, reason, prod, whoP, range, from, to, qs, mv, record, recP]);
  const M = useMemo(() => createMovementsModel(tenant, as, state, params), [tenant, as, state, params]);
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const [jobOpen, setJobOpen] = useState<string | null>(jo ?? null);
  const { S, F, can, plr, num, who, hm12 } = M;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const D = M.D as any;
  const err = M.err && !S.retried;
  const loading = !!F.loading;
  const hide = loading || err || !!F.empty;
  const set = (patch: Partial<typeof S>) => { Object.assign(S, patch, { limit: 40 }); tick(); };

  const [undoRow, setUndoRow] = useState<string | null>(null);
  const word = (t: string) => (t === 'count' ? 'Count saved' : t === 'damaged' ? 'Written off' : 'Stock out recorded');
  /* movements.js 573-578 undoMv and stock.js 205-212 commit: the write, then the page reloads on the ledger with a note and Undo */
  const afterWrite = (text: string, snap?: string, undone?: string) => {
    Object.assign(S, { rec: false, recP: null, view: 'ledger' as const });
    M.refreshAll();
    addToast({ description: text, ...(snap ? { actions: [{ label: 'Undo', onClick: () => { M.store.restore(snap); Object.assign(S, { hl: null, rec: false, view: 'ledger' as const }); M.refreshAll(); addToast(undone ?? 'Undone. Stock is back as it was.'); tick(); } }] } : {}) });
    tick();
  };
  const recordMovement = (e: RecordEntry, pr: RecordProduct) => {
    const r = M.store.mvAdd({ at: D.now.hm, by: D.viewer.id, p: pr.id, type: e.type, qty: e.qty, ref: e.ref, note: e.note });
    S.hl = r.row?.id ?? null;
    afterWrite(`${pr.sku}: ${pr.onHand} → ${e.after}. ${word(e.type)}.`, r.snap, `Undone. ${pr.sku} is back to ${pr.onHand}.`);
  };
  const landedDone = useRef(false);
  useEffect(() => {
    if (!landed || landedDone.current) return;
    landedDone.current = true;
    const pr = D.products.find((x: { onHand: number }) => x.onHand >= 2);
    if (pr) recordMovement({ reason: 'sold', type: 'sold', qty: -2, after: pr.onHand - 2, ref: null, note: '' }, { id: pr.id, name: pr.name, sku: pr.sku, onHand: pr.onHand, reorder: pr.reorder, unit: pr.unit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const undoTarget = M.ledger().find((x) => x.id === (undoRow ?? (undoOpen ? (M.shown().find((x2) => String(x2.id).startsWith('V')) ?? M.shown()[0])?.id : null)));
  const undoMv = () => {
    const r = undoTarget; if (!r) return;
    M.store.mvRemove(r.id);
    setUndoRow(null);
    afterWrite(`Movement undone. ${r.product.sku} is back to ${r.product.onHand - r.qty}.`);
  };
  const openRecord = (pid?: string) => { if (!can('stock_out') || err) return; Object.assign(S, { rec: true, recP: pid ?? null }); tick(); };

  const platform = { name: D.business.platform, initials: D.business.platform.split(' ').map((w: string) => w[0]).join('') };
  const items = NAV.filter((n) => !n.needs || can('setup'));
  const viewer = D.viewer as unknown as { name: string; short: string; initials: string };
  const account = { name: viewer.name, email: `${viewer.short.toLowerCase()}@example.ph`, role: D.roleLabel, initials: viewer.initials };

  const rail = (
    <IconRailContent>
      <IconRailMark variant="letter" href="#portal" label="Back to the ReadyPH Portal" animate={false} />
      {items.map((n) => <IconRailItem key={n.id} icon={n.icon} label={n.label} href={`#${n.id}`} current={n.id === 'moves'} />)}
      <IconRailSpacer />
      <IconRailFoot><AccountMenu name={account.name} email={account.email} role={account.role} initials={account.initials} applyToDocument={false} /></IconRailFoot>
    </IconRailContent>
  );
  const tabCls = 'relative flex min-h-11 flex-col items-center justify-center gap-[3px] text-tiny text-muted';
  const phoneNav = (
    <div className="grid h-[60px] w-full grid-cols-5 items-stretch">
      {items.slice(0, 4).map((n) => (
        <a key={n.id} href={`#${n.id}`} aria-current={n.id === 'moves' ? 'page' : undefined} className={cn(tabCls, n.id === 'moves' && 'font-medium text-text')}>
          <n.icon size={20} aria-hidden />{n.short ?? n.label}
        </a>
      ))}
      <button type="button" className={tabCls}><List size={20} aria-hidden />More</button>
    </div>
  );
  const topBar = (
    <>
      <span className="flex-none whitespace-nowrap text-[15px] font-semibold">{platform.name}</span>
      <span className="min-w-0 truncate text-[13px] text-muted max-[480px]:hidden">· Movements</span>
      <span className="flex-1" />
      <button type="button" className="relative inline-flex h-9 flex-none items-center gap-1.5 rounded-control border border-control px-2.5 text-[13px] font-semibold text-text"><ListChecks size={18} aria-hidden />Order lists</button>
      <AskLedaBar variant="bar" scope="Movements" shortcuts={false} />
      <span className="contents [&>button]:size-11"><AccountMenu name={account.name} email={account.email} role={account.role} initials={account.initials} applyToDocument={false} /></span>
    </>
  );

  /* ---------- the page's one line (movements.js 97-119) ---------- */
  const open = M.open();
  const headline = (() => {
    if (err) return 'Movements did not load, so the ledger is not shown.';
    if (F.empty) return 'No products yet, so nothing has moved. Add products first.';
    if (S.view === 'transfers') {
      return F.quiet ? 'Nothing needs you. No transfer is waiting.' : open.length ? `${plr(open.length, 'transfer is', 'transfers are')} open: ${open.map((x) => `${x.id} ${x.status === 'draft' ? (M.canSend(x) ? 'is ready to send' : `waits for ${M.mgr()}`) : x.out ? `is on its way to ${x.other.short}` : `is coming from ${x.other.short}`}`).join(', ')}.` : 'No transfer is open. Everything sent has been checked in.';
    }
    if (!M.ledger().length) return 'Nothing has moved yet. Stock shows here when it comes in on an order or goes out.';
    const nIn = D.movements.filter((m: { qty: number }) => m.qty > 0).length, nOut = D.movements.length - nIn;
    const parts = [F.quiet ? 'Nothing needs you.' : '', `${plr(D.movements.length, 'movement')} since yesterday: ${nIn} stock in, ${nOut} stock out.`].filter(Boolean);
    const mine = open.filter(M.needsMe), wait = open.filter((x) => x.status === 'draft' && x.out && !M.canSend(x)), on = open.filter((x) => x.status === 'transit');
    if (mine.length) parts.push(`${mine.map((x) => x.id).join(' and ')} ${mine.length === 1 ? 'needs' : 'need'} you.`);
    else if (wait.length) parts.push(`${wait.map((x) => x.id).join(' and ')} waits for ${M.mgr()} to send.`);
    else if (on.length) parts.push(`${on.map((x) => x.id).join(' and ')} ${on.length === 1 ? 'is' : 'are'} in transit.`);
    return parts.join(' ');
  })();

  /* ---------- rows (movements.js 129-168) ---------- */
  const refLink = (ref: string): ReactNode => {
    if (/^PO-\d+/.test(ref)) return M.knownPO(ref) ? <a className={cn(link, idCls)} href={`#purchase-orders?po=${ref}&from=movements`}>{ref}</a> : <span className={idCls}>{ref}</span>;
    if (/^JO-\d+/.test(ref)) return <button type="button" className={cn(link, idCls)} onClick={() => setJobOpen(ref)}>{ref}</button>;
    if (/^TR-\d+/.test(ref)) return M.store.trGet(ref) ? <button type="button" className={cn(link, idCls)}>{ref}</button> : <span className={idCls}>{ref}</span>;
    return ref;
  };
  const whatOf = (r: LedgerRow): [ReactNode, ReactNode] => {
    const k = M.STK.reasonKey(r), n = r.note || '';
    if (k === 'received' && r.ref === 'No order') return ['Received without an order', n];
    if (k === 'received' && r.ref === 'New product') return ['Received, new product', n];
    if (k === 'received') { const m = /(\d+) ordered/.exec(r.note || ''), o = m ? +m[1] : null, l = o != null ? M.rule.line(o, r.qty) : null; const t2 = l ? `${M.rule.inOf(l.received, o as number)}${l.extra ? `, ${l.extra} extra` : ''}` : n; return [<>Received from {r.ref ? refLink(r.ref) : 'an order'}</>, t2]; }
    if (k === 'used') return [M.isA && M.STK.isJO(r.ref) ? <>Used on {refLink(r.ref as string)}</> : M.isA ? (r.ref ?? '') : 'Used in the kitchen', [!M.isA && r.ref ? r.ref : '', n].filter(Boolean).join(' · ')];
    if (k === 'sold') return ['Sold', [r.ref && r.ref !== 'Sold' ? r.ref : '', n].filter(Boolean).join(' · ')];
    if (k === 'transfer') return [<>{r.qty < 0 ? 'Distributed' : 'Transfer in'} on {r.ref ? refLink(r.ref) : 'a transfer'}</>, n];
    if (k === 'damaged') return ['Damaged', n];
    return ['Count correction', n];
  };
  const toRow = (r: LedgerRow): MovementRow => {
    const [w, t2] = whatOf(r), p = r.product;
    return {
      id: r.id, time: hm12(r.at), product: { name: p.name, sku: p.sku, location: M.loc(p.loc as string), href: `#products?open=${p.id}` }, what: w, detail: t2 || undefined, by: who(r.by),
      qty: r.qty, unit: p.unit, left: r.after, highlighted: S.hl === r.id, undoable: String(r.id).startsWith('V') && can('stock_out') && (r.qty < 0 || p.onHand - r.qty >= 0),
    };
  };
  const all = M.shown();
  const rowsShown = all.slice(0, S.limit);
  const days: MovementDay[] = [];
  rowsShown.forEach((r) => {
    const d = M.STK.dayNum(r.day), g = days[days.length - 1];
    const lab = d === 22 ? `Today · ${M.STK.dayLong(d)}` : d === 21 ? `Yesterday · ${M.STK.dayLong(d)}` : M.STK.dayLong(d);
    const sh = d === 22 ? `Today · ${M.STK.dayShort(d)}` : d === 21 ? `Yesterday · ${M.STK.dayShort(d)}` : M.STK.dayShort(d);
    if (g && g.id === `d${d}`) g.rows.push(toRow(r)); else days.push({ id: `d${d}`, heading: lab, shortHeading: sh, rows: [toRow(r)] });
  });

  /* ---------- transfers open (movements.js 200-216) ---------- */
  const trAction = (t: TrView): ReactNode => {
    const nm = `${t.id}, ${t.out ? 'to' : 'from'} ${t.other.name}`;
    if (t.status === 'draft' && t.out && M.canSend(t)) return <ActionLink caret aria-label={`Send ${nm}`}>Send</ActionLink>;
    if (t.status === 'transit' && !t.out && can('receive')) return <ActionLink caret aria-label={`Receive ${nm}`}>Receive</ActionLink>;
    return <ActionLink caret aria-label={`View ${nm}`}>{t.status === 'draft' ? 'Open' : 'View'}</ActionLink>;
  };
  const waiting = open.slice().sort((a, b) => (M.needsMe(b) ? 1 : 0) - (M.needsMe(a) ? 1 : 0)).slice(0, 3);

  /* ---------- filters ---------- */
  const prodOpts = [{ value: 'all', label: 'All products' }, ...D.products.slice().sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)).map((p: { id: string; name: string }) => ({ value: p.id, label: p.name }))];
  const whoIds = [...new Set(M.ledger().map((r) => r.by))].filter((id) => M.person(id));
  const whoOpts = [{ value: 'all', label: 'Everyone' }, ...whoIds.map((id) => ({ value: id, label: (M.person(id) as { short: string }).short }))];
  const dayStr = (v: number) => `2026-10-${String(v).padStart(2, '0')}`;
  const tin = 'h-8 w-[148px] rounded-control border border-control bg-surface py-0 pl-2.5 pr-2.5 text-[13px] text-text hover:border-muted outline-none focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent max-[640px]:h-10 max-[640px]:w-full';
  const rng = S.range === 'custom' ? (
    <>
      <div className="flex flex-col gap-1 max-[640px]:w-full"><label htmlFor="d-from" className="text-[12px] text-muted">From</label><input id="d-from" type="date" className={tin} min="2026-10-01" max="2026-10-22" value={dayStr(S.rf)} onChange={(e) => set({ rf: +e.target.value.slice(8) || S.rf })} /></div>
      <div className="flex flex-col gap-1 max-[640px]:w-full"><label htmlFor="d-to" className="text-[12px] text-muted">To</label><input id="d-to" type="date" className={tin} min="2026-10-01" max="2026-10-22" value={dayStr(S.rt)} onChange={(e) => set({ rt: +e.target.value.slice(8) || S.rt })} /></div>
    </>
  ) : null;
  const filters = (
    <MovementFilters
      io={S.io}
      counts={hide ? undefined : M.ioCounts()}
      onIoChange={(v) => set({ io: v })}
      query={S.q}
      onQueryChange={(v) => set({ q: v })}
      searchPlaceholder="Search by product, code, order, job or person"
      reason={{ value: S.reason, options: M.REASONS.map(([value, label]) => ({ value, label })), onValueChange: (v) => set({ reason: v }) }}
      product={{ value: S.prod, options: prodOpts, onValueChange: (v) => set({ prod: v }) }}
      person={{ value: S.who, options: whoOpts, onValueChange: (v) => set({ who: v }) }}
      dates={{ value: S.range, options: M.RANGES.map(([value, label]) => ({ value, label })), onValueChange: (v) => set({ range: v as typeof S.range }) }}
      extra={rng}
      activeFilters={M.nFilt()}
    />
  );

  const blockErr = (msg: string) => (
    <div role="alert" className="flex items-center gap-2.5 rounded-card border border-dashed border-control px-3 py-2.5 text-[13px] max-[640px]:flex-wrap">
      <WarningCircle aria-hidden size={16} className="shrink-0 text-bad" /><span>{msg}</span>
      <Button variant="secondary" leftIcon={ArrowClockwise} className="ml-auto" onClick={() => { S.retried = true; M.refreshAll(); tick(); }}>Retry</Button>
    </div>
  );
  const firstBlock = (head: string, body: string, actions?: ReactNode, steps?: [string, string][]) => (
    <div className={first}>
      <p className="text-[16px]"><b className="font-semibold">{head}</b></p>
      <p className="mt-1.5 max-w-[560px] text-[14px] leading-[21px] text-muted">{body}</p>
      {steps ? <ol className="m-0 mt-6 grid max-w-[760px] list-none grid-cols-3 gap-6 p-0 max-[640px]:grid-cols-1 max-[640px]:gap-4">{steps.map(([b, s]) => <li key={b} className="flex flex-col gap-1 border-t border-border pt-3"><b className="text-[14px] font-semibold">{b}</b><span className="text-[13px] leading-[19px] text-muted">{s}</span></li>)}</ol> : null}
      {actions ? <div className="mt-5 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
  const goPO = <a className="inline-flex h-8 items-center gap-1.5 rounded-control border border-control px-3 text-[13px] font-medium text-text no-underline" href="#purchase-orders"><Receipt size={14} aria-hidden />Purchase orders</a>;
  const recordBtn = (dis?: boolean) => can('stock_out') ? <Button variant="primary" leftIcon={ArrowsDownUp} disabled={dis} onClick={() => openRecord()}>Record movement</Button> : null;

  const skRows = [0, 1, 2, 3, 4].map((i) => (
    <div key={i} className="-mx-2 grid min-h-[56px] w-[calc(100%+16px)] grid-cols-[76px_minmax(0,1.3fr)_minmax(0,1.6fr)_130px_104px_64px] items-start gap-x-5 border-t border-rule px-2 py-3 first:border-t-transparent max-[1099px]:grid-cols-[68px_minmax(0,1.2fr)_minmax(0,1.4fr)_110px_100px_56px] max-[640px]:grid-cols-[minmax(0,1fr)_auto]">
      <span><Skeleton width={44} height={14} /></span>
      <span className="flex flex-col gap-1.5"><Skeleton width={`${70 - i * 6}%`} height={16} /><Skeleton width="40%" height={12} /></span>
      <span className="flex flex-col gap-1.5"><Skeleton width="60%" height={14} /><Skeleton width="36%" height={12} /></span>
      <span><Skeleton width={56} height={14} /></span>
      <span className="flex justify-end"><Skeleton width={34} height={14} /></span>
      <span className="flex justify-end"><Skeleton width={28} height={14} /></span>
    </div>
  ));

  const ledger = (() => {
    if (loading) {
      return (
        <div className="flex flex-col gap-5 max-[640px]:gap-3">
          <div className="flex flex-col gap-3">
            <label className="relative block max-w-[440px]"><span className="sr-only">Search movements</span><input type="search" disabled placeholder="Search by product, code, order, job or person" className="h-[34px] w-full rounded-control border border-control bg-surface pl-[34px] pr-2.5 text-[14px] disabled:opacity-60 max-[640px]:h-11" /></label>
            <div className="flex gap-1">{['All', 'Stock in', 'Stock out'].map((t) => <button key={t} type="button" disabled className="h-7 rounded-control px-3 text-[13px] opacity-60">{t}</button>)}</div>
          </div>
          <section aria-busy="true" className="flex flex-col">
            <div aria-hidden className="-mx-2 grid w-[calc(100%+16px)] grid-cols-[76px_minmax(0,1.3fr)_minmax(0,1.6fr)_130px_104px_64px] items-end gap-x-5 border-b border-border px-2 pb-2.5 text-[12px] text-muted max-[1099px]:grid-cols-[68px_minmax(0,1.2fr)_minmax(0,1.4fr)_110px_100px_56px] max-[640px]:hidden"><span>Time</span><span>Product</span><span>What happened</span><span>By</span><span className="text-right">Quantity</span><span className="text-right">Left</span></div>
            <div className="pt-4">{skRows}</div>
          </section>
        </div>
      );
    }
    if (F.empty) return <div className="flex flex-col gap-5">{firstBlock('No products yet', 'Stock movements start once there are products. Add products first, then receive an order to put stock on the shelf.', <a className="inline-flex h-8 items-center gap-1.5 rounded-control bg-accent px-3 text-[13px] font-medium text-on-accent no-underline" href="#products"><Package size={14} aria-hidden />Go to Products</a>)}</div>;
    if (!M.ledger().length) return <div className="flex flex-col gap-5">{firstBlock('Nothing has moved yet', 'Stock comes in when you receive a purchase order or a transfer, and goes out when it is sold, used on a job, sent to another place or written off. Each one shows here with a reason.', <>{recordBtn()}{goPO}</>, [['1 · Stock in', 'Receive an order on Purchase orders.'], ['2 · Stock out', 'Record what was sold or used.'], ['3 · Check', 'Every change keeps what was left.']])}</div>;
    const list = all.length ? (
      <MovementLedger days={days} onUndo={(r) => setUndoRow(String(r.id))} more={all.length - rowsShown.length} moreStep={40} onShowMore={() => { S.limit += 40; tick(); }} />
    ) : (
      <div className={first}>
        <p className="text-[16px]"><b className="font-semibold">No movement matches</b></p>
        <p className="mt-1.5 max-w-[560px] text-[14px] leading-[21px] text-muted">{S.q.trim() ? `Nothing matches “${S.q.trim()}”${S.range === 'recent' ? ' today or yesterday' : ''}.` : 'Nothing fits those filters.'} Try another word, widen the dates, or clear the filters.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {S.range !== 'all' ? <Button variant="secondary" leftIcon={CalendarBlank} onClick={() => set({ range: 'all' })}>Show all dates</Button> : null}
          <Button variant="secondary" leftIcon={X} onClick={() => set({ q: '', io: 'all', reason: 'all', prod: 'all', who: 'all', range: 'recent', tf: 'all' })}>Clear filters</Button>
        </div>
      </div>
    );
    if (err) return <div className="flex flex-col gap-5 max-[640px]:gap-3">{blockErr(`Movements did not load. This is the ledger from ${F.error?.lastLoaded}. Nothing can be recorded or sent until it loads, so nothing is counted twice.`)}<div {...{ inert: '' }} className="mt-1 opacity-60">{list}</div></div>;
    return (
      <div className="flex flex-col gap-5 max-[640px]:gap-3">
        {waiting.length ? (
          <MovementTransfersOpen
            total={open.length}
            items={waiting.map((t) => ({ id: t.id as string, direction: t.out ? 'to' : 'from', place: t.other.short, state: <TransferStatusBadge status={t.status as TransferStatus} />, action: trAction(t) }))}
          />
        ) : null}
        {filters}
        {list}
      </div>
    );
  })();

  const transfers = (
    <div className="flex flex-col gap-5 max-[640px]:gap-3">
      {err ? blockErr(`Transfers did not load. This is the list from ${F.error?.lastLoaded}. Nothing can be sent or received until it loads, so nothing moves twice.`) : null}
    </div>
  );

  const job = jobOpen ? D.jobs.find((x: { jo: string }) => x.jo === jobOpen) as undefined | { jo: string; at: string; branch: string; car: string; work: string } : undefined;
  const used = jobOpen ? M.ledger().filter((r) => r.ref === jobOpen && r.qty < 0) : [];
  const signed = (n: number) => (n > 0 ? '+' : '−') + num(Math.abs(n));
  const dis = err || loading || !!F.empty;
  const link_ = D.link as null | { with: string; status: string; since: string | null };

  if (S.rec) {
    return (
      <PlatformShell
        railWidth="wide" railLabel="Inventory" rail={rail} topBar={topBar} phoneNav={phoneNav} heading={platform.name} hideSheetBarOnPhone detail
        sheetBar={<SheetBar wrapChildren={false} actionsFirst={false} actions={<AskLedaBar variant="bar" scope="Movements" shortcuts={false} />}><BackLink onClick={() => { S.rec = false; S.recP = null; tick(); }}>Movements</BackLink><span className="self-center text-[13px] font-semibold text-text">/ Record movement</span></SheetBar>}
        statusLabel="Status"
        status={<InventoryStatusBar platform={platform} dataLink={link_ ? { with: link_.with, status: link_.status === 'slow' ? 'slow' : 'linked', since: link_.since ?? '8:50', title: 'Parts and job orders' } : undefined} viewer={{ name: viewer.short, role: D.roleLabel }} leda={{ canDecide: can('adjust_stock'), managerName: (D.manager as { short: string }).short }} updatedAt={D.now.time} />}
      >
        <RecordView M={M} productId={S.recP} whatOf={whatOf} onCancel={() => { S.rec = false; S.recP = null; tick(); }} onTransfer={() => { S.rec = false; S.recP = null; S.view = 'transfers'; tick(); }} onRecord={recordMovement} />
        <Toaster actionStyle="inventory" />
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      railWidth="wide"
      railLabel="Inventory"
      rail={rail}
      topBar={topBar}
      phoneNav={phoneNav}
      heading={platform.name}
      hideSheetBarOnPhone
      sheetBar={<SheetBar wrapChildren={false} actionsFirst={false} actions={<AskLedaBar variant="bar" scope="Movements" shortcuts={false} />}><SheetBarWhere platform={platform} page="Movements" note={as !== 'manager' ? `Viewing as ${viewer.short}, ${D.roleLabel.toLowerCase()}` : undefined} /></SheetBar>}
      statusLabel="Status"
      status={
        <InventoryStatusBar
          platform={platform}
          dataLink={link_ ? { with: link_.with, status: link_.status === 'slow' ? 'slow' : 'linked', since: link_.since ?? '8:50', title: 'Parts and job orders' } : undefined}
          viewer={{ name: viewer.short, role: D.roleLabel }}
          leda={{ canDecide: can('adjust_stock'), managerName: (D.manager as { short: string }).short }}
          updatedAt={D.now.time}
          lastLoadedAt={loading ? D.now.lastLoaded : undefined}
        />
      }
    >
      <div className="p-pad">
        <div className="flex flex-wrap items-start justify-between gap-6 max-[640px]:grid max-[640px]:grid-cols-[minmax(0,1fr)_auto] max-[640px]:items-center max-[640px]:gap-x-3 max-[640px]:gap-y-1.5">
          <div className="min-w-0 flex-1 max-[640px]:contents">
            <h1 className="text-[22px] font-semibold max-[640px]:col-start-1 max-[640px]:row-start-1">Movements</h1>
            <p className="mt-2 flex items-start gap-2 text-[15px] leading-[22px] max-[640px]:col-span-2 max-[640px]:row-start-2 max-[640px]:mt-0 max-[640px]:text-[14px] max-[640px]:leading-[21px]">
              <LedaMark size={16} decorative active={loading} className="mt-[3px] shrink-0" />
              {loading ? <Skeleton width={460} height={14} className="max-w-full" /> : <span>{headline}</span>}
            </p>
          </div>
          <div className="flex flex-none items-center gap-2 max-[640px]:col-start-2 max-[640px]:row-start-1">
            <span className="mr-2 text-[12px] text-muted max-[640px]:hidden">{D.now.date} · {loading ? `Loading… last loaded ${D.now.lastLoaded}` : err ? `Last loaded ${F.error?.lastLoaded}` : `Updated ${D.now.time}`}</span>
            {can('transfer') ? <Button variant="secondary" leftIcon={ArrowSquareOut} disabled={dis} className="max-[640px]:hidden">New transfer</Button> : null}
            {recordBtn(dis)}
          </div>
        </div>
        <MovementTabs value={S.view} onValueChange={(v) => { S.view = v; tick(); }} controls="vbody" transfersCount={hide ? undefined : M.trs().length} transfersOpen={hide ? 0 : open.length} />
        <div id="vbody" role="tabpanel" aria-labelledby={`tab-${S.view}`} className="mt-6 pb-24 max-[640px]:mt-2">{S.view === 'ledger' ? ledger : transfers}</div>
      </div>
      <Modal open={!!jobOpen} onOpenChange={(o) => { if (!o) setJobOpen(null); }} title={jobOpen ?? ''} description={`Job order in the Repair shop, ${link_ ? link_.with : D.business.company}`} size="sm">
        {job ? (
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[14px]"><dt className="text-muted">Car</dt><dd className="m-0">{job.car}</dd><dt className="text-muted">Work</dt><dd className="m-0">{job.work}</dd><dt className="text-muted">Branch</dt><dd className="m-0">{D.branches.find((b: { id: string; name: string }) => b.id === job.branch)?.name}, {hm12(job.at)}</dd></dl>
        ) : <p className="text-[14px] text-muted">This job order is in the Repair shop. Inventory only keeps the parts that left for it.</p>}
        <h3 className="pb-1.5 pt-5 text-[13px] font-semibold">Parts taken from this stockroom</h3>
        {used.length ? (
          <ul className="m-0 list-none p-0">{used.map((r) => (
            <li key={r.id} className="flex justify-between gap-4 border-t border-rule py-2.5 text-[14px] leading-5 first:border-t-0"><span><b className="font-semibold">{r.product.name}</b><span className="mt-0.5 block text-[13px] text-muted">{M.STK.dayShort(M.STK.dayNum(r.day))}, {hm12(r.at)} · {who(r.by)}</span></span><b className="font-semibold tabular-nums">{signed(r.qty)}</b></li>
          ))}</ul>
        ) : <p className="text-[14px] text-muted">No part has left stock for this job yet.</p>}
      </Modal>
      <ConfirmDialog open={!!undoTarget} onOpenChange={(o) => { if (!o) setUndoRow(null); }} onCancel={() => setUndoRow(null)} tone="danger" icon={ArrowCounterClockwise} title="Undo this movement?"
        name={undoTarget ? `${undoTarget.product.sku} · ${signed(undoTarget.qty)}` : ''}
        description={undoTarget ? `${Math.abs(undoTarget.qty)} ${undoTarget.qty < 0 ? 'go back into stock' : 'come back out of stock'}, so ${undoTarget.product.name} returns to ${undoTarget.product.onHand - undoTarget.qty}. Use this only if it was entered by mistake.` : ''}
        confirmLabel="Undo movement" onConfirm={undoMv} />
      <Toaster actionStyle="inventory" />
    </PlatformShell>
  );
}
