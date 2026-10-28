import { useState, type ReactNode } from 'react';
import { ArrowCounterClockwise, ClockCounterClockwise, ListBullets, Note, PaperPlaneTilt, Printer, Storefront, Truck, WarningCircle } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { ButtonLink } from '../components/ButtonLink';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ProgressSteps, type ProgressStep } from '../components/ProgressSteps';
import { cn } from '../utils/cn';
import type { OrderExtras } from './PurchaseOrders.order.data';
import { plural, type PurchaseOrder, type purchaseOrdersModel } from './PurchaseOrders.data';

/* RDY-427. Page: Purchase orders, 3/5 (c): the one-order region. Source: inventory-home FINAL purchase-orders.js 239-333 (historyOf 240, stepsOf 264, stepsHTML 274, linesHTML 277,
   rcvNote 290, tableOf 300, supplierHTML 303, notesHTML 308, historyHTML 314, actionsHTML 319), 371-394 (confirmHTML send + cancel, detailHTML), 585-600 (sendIt, cancelIt), 631-635 (undoReceipt);
   purchase-orders.css 56-67, 69-83, 92-115, 193-196, 235-255 (order rules, tablet, phone); order-list.css 135-138 (.cfm-i); products.css 46-52 (.pnl-h), 188-190, 349; shell.css 235-247 (.chead .facts), 269-274 (.kv).
   The short-delivery block (accept, dispute, tell the manager; settleHTML 341) and Receive belong to slice (d). historyOf's inputs come from PurchaseOrders.order.data.ts. */
export type OrderModel = ReturnType<typeof purchaseOrdersModel>;
export type OrderConfirm = 'send' | 'cancel' | null;

const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-PH')}`;
const plr = (n: number, a: string, b: string) => `${n} ${n === 1 ? a : b}`;
const unitOf = (p: { unit: string }, n: number) => (p.unit === 'pc' ? 'pc' : n === 1 ? p.unit : `${p.unit}s`);

/* shell.css 269-274 .kv + purchase-orders.css 106-108 .pkv */
const KV = 'mt-2 grid grid-cols-[minmax(120px,34%)_minmax(0,1fr)] gap-x-4 text-[13px] leading-5 max-[640px]:grid-cols-[minmax(104px,38%)_minmax(0,1fr)]';
const DT = 'whitespace-normal border-t border-rule py-[7px] text-muted';
const DD = 'm-0 flex min-w-0 flex-wrap justify-start gap-3 border-t border-rule py-[7px] [overflow-wrap:anywhere] [&_b]:flex-none [&_b]:font-medium max-[640px]:flex-col max-[640px]:gap-0 @max-[600px]/sheet:flex-col @max-[600px]/sheet:gap-0';
const MUT = 'text-muted';
/* order-list.css 135-138 + purchase-orders.css 67, 289-290 */
const CFM = 'mt-2 max-w-[640px] border-t border-text pt-3 text-[13px] leading-[19px] [&_p+p]:mt-1.5 [&_p+p]:text-muted';
const PACTS = 'mt-3 flex flex-wrap gap-2 [&_button]:max-[640px]:h-11';
const TIN = 'block h-[34px] w-full max-w-[480px] rounded-control border border-control bg-surface px-[10px] text-[14px] text-text outline-none placeholder:text-muted placeholder:opacity-100 hover:border-muted focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent max-[640px]:h-11 max-[640px]:max-w-none max-[640px]:text-[16px]';
const VA = 'inline-flex h-6 cursor-pointer items-center rounded-[4px] px-1 text-[12px] font-semibold text-accent hover:text-lk-hover disabled:cursor-default disabled:opacity-60 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

/* products.css 46-52 .pnl-h */
function PanelHead({ icon: Icon, title, count, sub }: { icon: PhosphorIcon; title: string; count?: number; sub?: string }) {
  return (
    <div className="flex min-h-8 items-baseline gap-[10px] border-b border-border pb-[10px] max-[640px]:flex-wrap">
      <Icon aria-hidden size={18} className="self-center text-muted" />
      <h2 className="whitespace-nowrap text-[16px] font-semibold leading-[22px]">{title}</h2>
      {count != null ? <span className="text-[13px] font-medium tabular-nums text-muted">{count}</span> : null}
      {sub ? <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-muted max-[640px]:hidden">{sub}</span> : null}
    </div>
  );
}

export interface OrderViewProps {
  M: OrderModel;
  po: PurchaseOrder;
  extras: OrderExtras;
  /** The state word beside the number (the page's POState). */
  stateBadge: ReactNode;
  confirm: OrderConfirm;
  onConfirm: (c: OrderConfirm) => void;
  /** The purchase orders did not load: actions are disabled. */
  disabled?: boolean;
  /** Story only: the Undo this receipt question is open. */
  undoOpen?: boolean;
}

/** One order (purchase-orders.js 382-394): header, facts, actions, inline question, steps, what was ordered, supplier, notes, history. */
export function PurchaseOrderView({ M, po, extras: X, stateBadge, confirm, onConfirm, disabled, undoOpen = false }: OrderViewProps) {
  const [undo, setUndo] = useState(undoOpen);
  const [why, setWhy] = useState('');
  const { can, money } = M;
  const byName = (id?: string | null) => (id === 'leda' ? 'Leda' : M.people.find((p) => p.id === id)?.short ?? '');
  const l = M.lateDays(po), s = po.status, mg = can('confirm_po');
  const first = po.supplierName.split(' ')[0];
  const c = X.contact;
  const sent = X.sentRec ? `${X.sentRec.sentOn}, ${X.sentRec.sentAt}` : po.ordered || '';

  /* 264-273 stepsOf */
  const drafted: ProgressStep = { label: 'Drafted', note: po.draftedBy ? `By ${byName(po.draftedBy)}` : '', state: 'done' };
  const steps: ProgressStep[] = s === 'DRAFT'
    ? [drafted, { label: 'Sent', note: `Not sent. ${mg ? 'Print it, then mark it sent.' : 'Your manager marks it sent.'}`, state: 'now' }, { label: 'Received', note: `Expected ${M.expDate(po)}`, state: 'next' }]
    : s === 'CANCELLED'
      ? [drafted, { label: 'Sent', note: sent, state: 'done' }, { label: 'Cancelled', note: X.cancelled ? `${byName(X.cancelled.by)}, ${X.cancelled.at}` : '', state: 'off' }]
      : [drafted, { label: 'Sent', note: sent, state: 'done' }, s === 'ORDERED'
        ? { label: 'Received', note: l ? `${plr(l, 'day', 'days')} late. Expected ${M.expDate(po)}` : `Expected ${M.expDate(po)}`, state: 'now', flag: !!l }
        : s === 'PARTIAL'
          ? { label: 'Part in', note: `${M.inW(po)}. Rest ${l ? `${plr(l, 'day', 'days')} late` : `expected ${M.expDate(po)}`}`, state: 'now', flag: !!l }
          : { label: M.stKey(po) === 'SHORT' ? 'Came in short' : 'Received', note: `${(po.receivedAt || '').replace(/ (\d{1,2}:\d{2})$/, ', $1')}${po.shortUnits ? `. Short ${M.shortAmt(po)}` : ''}`, state: 'done' }];

  /* 383-384 facts */
  const sentOn = po.ordered || X.sentRec?.sentOn;
  const facts: ReactNode[] = [
    sentOn ? <>Sent <b>{sentOn}</b></> : null,
    s === 'CANCELLED' ? null : s === 'DRAFT'
      ? <>Arrives <b>{M.expDate(po)}</b>{M.ifSentBy(po) ? ` if sent by ${M.ifSentBy(po)}` : ''}</>
      : <>{s === 'RECEIVED' ? 'Was expected' : 'Expected'} <b className={l ? 'text-bad' : undefined}>{M.expDate(po)}{l ? `, ${plr(l, 'day', 'days')} late` : ''}</b></>,
    c.who ? <>Contact <b>{c.who}</b></> : null,
    money ? <>Total <b className="tabular-nums">{peso(po.total)}</b></> : null,
  ].filter(Boolean);
  const note = po.src === 'history' && s === 'RECEIVED' && po.shortUnits > 0
    ? <p className="mt-6 flex items-start gap-[10px] border-y border-rule py-3 text-[14px] leading-[21px]"><WarningCircle aria-hidden size={18} className="mt-px flex-none text-muted" /><span><b className="font-semibold">Short {M.shortAmt(po)}{money ? `, ${peso(po.shortValue)} missing` : ''}.</b> {X.settled || 'It was settled.'}</span></p>
    : null;

  /* 319-333 actionsHTML */
  const paper = (kind: 'primary' | 'secondary') => (
    <ButtonLink variant={kind} leftIcon={Printer} href={s === 'DRAFT' ? '#order-list' : '#order-list-sent'} className="max-[640px]:hidden">{s === 'DRAFT' ? 'Open paper to print' : 'Open paper copy'}</ButtonLink>
  );
  const asked = !!X.list?.asked;
  let acts: ReactNode = null;
  if (s === 'DRAFT') {
    acts = <>{mg
      ? <Button leftIcon={PaperPlaneTilt} disabled={disabled} className="max-[640px]:hidden" onClick={() => onConfirm('send')}>Mark as sent</Button>
      : asked ? null : <Button leftIcon={PaperPlaneTilt} disabled={disabled} className="h-auto min-h-10 max-w-full whitespace-normal py-2 text-left leading-5 max-[640px]:hidden">Ask your manager to mark it sent</Button>}{paper('secondary')}</>;
  } else if (M.isOpen(po)) {
    acts = <>{can('receive') ? <Button leftIcon={Truck} disabled={disabled} className="max-[640px]:hidden">Receive delivery</Button> : null}{paper('secondary')}</>;
  }
  const sec = s === 'ORDERED'
    ? (mg ? <button type="button" className={VA} disabled={disabled} onClick={() => onConfirm('cancel')}>Cancel this order</button> : <span className={MUT}>Your manager cancels orders. Ask your manager if this one should not come.</span>)
    : null;
  const hasActs = !!acts || !!sec;

  /* 371-381 confirmHTML (send, cancel) */
  const q = confirm === 'send' ? (
    <div role="group" aria-label="Confirm marking as sent" className={CFM}>
      <p><b className="font-semibold">Mark {po.no} as sent to {po.supplierName}?</b></p>
      <p>Nothing is sent from here. This records that you sent the printed order. It is locked and becomes an open purchase order, expected {X.expectedFor}.{X.list?.printed ? '' : ' It has not been printed.'}</p>
      <div className={PACTS}><Button leftIcon={PaperPlaneTilt} onClick={() => onConfirm(null)}>Yes, it has been sent</Button><Button variant="secondary" onClick={() => onConfirm(null)}>Not yet</Button></div>
    </div>
  ) : confirm === 'cancel' ? (
    <div role="group" aria-label="Confirm cancelling" className={CFM}>
      <p><b className="font-semibold">Cancel {po.no}?</b></p>
      <p>{first} has not delivered anything on it. The order stops counting as on order, so these products show as needing an order again. Nothing is sent to the supplier: tell them yourself.</p>
      <div className="mt-3 grid max-w-[520px] grid-cols-[120px_minmax(0,1fr)] items-center gap-x-4 max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-1">
        <label htmlFor="cwhy" className="text-[12px] text-muted">Why (optional)</label>
        <input id="cwhy" type="text" maxLength={80} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="For example: supplier out of stock" autoComplete="off" className={TIN} />
      </div>
      <div className={PACTS}><Button variant="danger" onClick={() => onConfirm(null)}>Yes, cancel the order</Button><Button variant="secondary" onClick={() => onConfirm(null)}>Keep the order</Button></div>
    </div>
  ) : null;

  /* 277-289 linesHTML, rcvNote */
  const cx = s === 'CANCELLED', sh = s === 'RECEIVED';
  const mixU = M.rule.mixed(po.lines);
  const TD = 'border-t border-rule px-2 py-3.5 align-top max-[640px]:block max-[640px]:border-0 max-[640px]:p-0 max-[640px]:text-left';
  const TDN = cn(TD, 'text-right tabular-nums max-[640px]:before:block max-[640px]:before:text-[12px] max-[640px]:before:font-normal max-[640px]:before:text-muted max-[640px]:before:content-[attr(data-k)] max-[640px]:[&_.t2]:hidden');
  const T2 = 't2 mt-0.5 block text-[12px] font-normal leading-[17px] text-muted';
  const TR = 'max-[640px]:grid max-[640px]:grid-cols-3 max-[640px]:gap-x-2 max-[640px]:border-t max-[640px]:border-rule max-[640px]:py-3.5';
  const rows = po.lines.map((ln, i) => {
    const out = M.outstanding(ln, po), diff = ln.received - ln.ordered, p = ln.product;
    const bad = cx ? 0 : X.bad[i] ?? 0;
    const side = [ln.extra ? `${ln.extra} extra` : '', bad ? `${bad} damaged, not added` : ''].filter(Boolean).join(' · ');
    return (
      <tr key={ln.p} className={cn(TR, 'first:max-[640px]:border-t-0 [&:first-child>td]:border-t-0')}>
        <td className={cn(TD, 'max-[640px]:col-span-full max-[640px]:mb-2')}><span className="block font-medium">{p.name}</span><span className={T2}><span className="font-mono text-[12px] tracking-normal">{p.sku}</span> · {X.locs[i]}</span></td>
        <td data-k="Ordered" className={TDN}><b className="font-semibold">{ln.ordered}</b><span className={T2}>{unitOf(p, ln.ordered)}</span></td>
        <td data-k="Received" className={TDN}>{cx ? <span className={MUT}>0</span> : <><b className="font-semibold">{ln.received}</b>{side ? <span className={T2}>{side}</span> : sh && diff < 0 ? <span className={cn(T2, 'font-semibold text-bad')}>{-diff} short</span> : null}</>}</td>
        <td data-k="Still due" className={TDN}>{out ? <b className="font-semibold">{out}</b> : <span className={MUT}>0</span>}</td>
        {money ? <td className={cn(TDN, 'tabular-nums max-[640px]:hidden')}>{peso(ln.cost)}</td> : null}
        {money ? <td className={cn(TDN, 'tabular-nums max-[640px]:col-span-full max-[640px]:mt-1.5 max-[640px]:text-[13px] max-[640px]:text-muted')}>{peso(ln.total)}</td> : null}
      </tr>
    );
  });
  const TDT = 'border-t border-text px-2 pb-3.5 pt-3 align-top text-[13px] max-[640px]:block max-[640px]:border-0 max-[640px]:p-0 max-[640px]:pt-3';
  const TDTN = cn(TDT, 'text-right tabular-nums max-[640px]:text-left max-[640px]:before:block max-[640px]:before:text-[12px] max-[640px]:before:text-muted max-[640px]:before:content-[attr(data-k)]');
  const tot = (
    <tr className="max-[640px]:grid max-[640px]:grid-cols-3 max-[640px]:gap-x-2 max-[640px]:border-t max-[640px]:border-text max-[640px]:py-3.5">
      <td className={cn(TDT, 'text-muted max-[640px]:col-span-full max-[640px]:mb-2')}>{plr(po.lines.length, 'product', 'products')}</td>
      <td data-k="Ordered" className={TDTN}>{mixU ? '' : <b className="font-semibold">{po.unitsOrdered}</b>}</td>
      <td data-k="Received" className={TDTN}>{mixU ? '' : <b className="font-semibold">{cx ? 0 : po.unitsReceived}</b>}</td>
      <td data-k="Still due" className={TDTN}>{mixU ? '' : <b className="font-semibold">{M.unitsLeft(po)}</b>}</td>
      {money ? <td className={cn(TDT, 'max-[640px]:h-3')} /> : null}
      {money ? <td className={cn(TDT, 'text-right tabular-nums max-[640px]:col-span-full max-[640px]:mt-1.5 max-[640px]:text-left')}><b className="font-semibold">{peso(po.total)}</b></td> : null}
    </tr>
  );
  const badTotal = X.bad.reduce((a, b) => a + b, 0);
  let tally: ReactNode = null;
  if (!(s === 'CANCELLED' || s === 'DRAFT' || s === 'ORDERED') && (badTotal || po.unitsExtra || s === 'PARTIAL' || po.shortUnits)) {
    const w = M.rule.words(po.lines);
    const head = s === 'RECEIVED' && po.shortUnits ? M.tallyPO(po.lines, 'short').text : w.text;
    tally = (
      <p className="mx-2 mt-3 text-[13px] leading-[19px] text-muted max-[640px]:mx-0 [&_b]:font-semibold [&_b]:text-text">
        <b>{head}.</b>
        {badTotal ? ` ${plural(badTotal, 'damaged unit')} ${badTotal === 1 ? 'was' : 'were'} not added to stock and ${badTotal === 1 ? 'does' : 'do'} not count as received.` : ''}
        {po.unitsExtra ? ` ${plural(po.unitsExtra, 'extra unit')} ${po.unitsExtra === 1 ? 'is' : 'are'} kept and not counted in the total.` : ''}
      </p>
    );
  }
  const TH = 'whitespace-nowrap border-b border-border px-2 pb-2 pt-3 text-left text-[12px] font-normal text-muted';
  const lines = (
    <>
      <table className="w-full border-collapse text-[14px] max-[640px]:block">
        <thead className="max-[640px]:hidden"><tr><th className={TH}>Product</th><th className={cn(TH, 'text-right')}>Ordered</th><th className={cn(TH, 'text-right')}>Received</th><th className={cn(TH, 'text-right')}>Still due</th>{money ? <th className={cn(TH, 'text-right max-[640px]:hidden')}>Unit cost</th> : null}{money ? <th className={cn(TH, 'text-right')}>Amount</th> : null}</tr></thead>
        <tbody className="max-[640px]:block">{rows}{tot}</tbody>
      </table>
      {tally}
    </>
  );

  /* 303-307 supplier, 308-313 notes */
  const supplier = (
    <section>
      <PanelHead icon={Storefront} title="Supplier" />
      <dl className={KV}>
        <dt className={DT}>Name</dt><dd className={DD}><b>{po.supplierName}</b></dd>
        {c.who ? <><dt className={DT}>Contact</dt><dd className={DD}>{c.who}</dd></> : null}
        {c.phone ? <><dt className={DT}>Phone</dt><dd className={DD}><a className={VA} href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>{c.phone}</a></dd></> : null}
        {c.email ? <><dt className={DT}>Email</dt><dd className={DD}><a className={VA} href={`mailto:${c.email}`}>{c.email}</a></dd></> : null}
        {c.addr ? <><dt className={DT}>Address</dt><dd className={DD}>{c.addr}</dd></> : null}
        {M.suppliers.find((x) => x.id === po.supplier)?.leadTime ? <><dt className={DT}>Delivers</dt><dd className={DD}>{String(M.suppliers.find((x) => x.id === po.supplier)?.leadTime)}</dd></> : null}
      </dl>
    </section>
  );
  const notes = (
    <section>
      <PanelHead icon={Note} title="Notes" />
      <dl className={KV}>
        <dt className={DT}>To the supplier</dt><dd className={DD}>{X.toSupplier ? X.toSupplier : <span className={MUT}>None</span>}</dd>
        <dt className={DT}>At the door</dt>
        <dd className={DD}>{X.door.length ? X.door.map((r, i) => <span key={i} className="w-full">{r.by}: {r.ref ? `delivery note ${r.ref}. ` : ''}{r.note ? `“${r.note}”` : ''}</span>) : <span className={MUT}>None yet</span>}</dd>
      </dl>
    </section>
  );

  /* 314-318 historyHTML */
  const history = (
    <section>
      <PanelHead icon={ClockCounterClockwise} title="History" count={X.hist.length} />
      <ol className="m-0 list-none p-0">
        {X.hist.length ? X.hist.map((e, i) => (
          <li key={i} className={cn('grid grid-cols-[148px_minmax(0,1fr)] gap-x-4 border-t border-rule py-3 text-[14px] leading-5 first:border-t-0 max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-y-0.5')}>
            <span className="text-[13px] text-muted">{e.at}</span>
            <span className="[&_b]:font-semibold">
              {e.who ? <><b>{e.who}</b>{' '}</> : null}{e.what}
              {(e.extra || []).map((x, j) => <span key={j} className="mt-0.5 block text-[13px] leading-[18px] text-muted">{x}</span>)}
              {e.rid && X.lastRid === e.rid && can('receive') && !disabled ? <>{' '}<button type="button" className={VA} onClick={() => setUndo(true)}>Undo this receipt</button></> : null}
            </span>
          </li>
        )) : <li><span className="text-muted">Nothing yet.</span></li>}
      </ol>
    </section>
  );

  const undoN = po.unitsReceived;
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-4 max-[640px]:flex-row max-[640px]:flex-wrap max-[640px]:items-start max-[640px]:gap-x-3 max-[640px]:gap-y-2">
        <h1 className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[22px] font-semibold leading-7 tracking-[-0.01em]"><span className="text-[22px] font-semibold">{po.no}</span> <span className="font-normal text-muted">{po.supplierName}</span></h1>
        {stateBadge}
      </div>
      <div className="-ml-[23px] mt-3 flex flex-wrap items-center gap-y-1 [clip-path:inset(-6px_-6px_-6px_23px)] text-[13px] leading-5 text-muted [&_b]:font-semibold [&_b]:text-text [&_b.text-bad]:text-bad">
        {facts.map((f, i) => <span key={i} className="inline-flex items-center gap-1.5 whitespace-nowrap before:ml-[10px] before:mr-1 before:h-[3px] before:w-[3px] before:flex-none before:rounded-full before:bg-control before:content-['']">{f}</span>)}
      </div>
      <div className={cn(hasActs || q ? 'mt-6' : '')}>
        {hasActs ? <div className="flex flex-wrap items-center gap-3">{acts}{sec ? <span className="ml-3 inline-flex items-center gap-4 text-[13px] max-[640px]:ml-0">{sec}</span> : null}</div> : null}
        {q}
      </div>
      <ProgressSteps steps={steps} />
      {note}
      <div className="mt-10 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] grid-rows-[auto_1fr] items-start gap-x-12 gap-y-10 [grid-template-areas:'ln_prt'_'hi_prt'] max-[1099px]:grid-cols-[minmax(0,1fr)] max-[1099px]:grid-rows-[auto] max-[1099px]:[grid-template-areas:'ln'_'hi'_'prt'] max-[640px]:mt-8 max-[640px]:gap-8">
        <section className="[grid-area:ln]"><PanelHead icon={ListBullets} title="What was ordered" count={po.lines.length} sub="against what has arrived" />{lines}</section>
        <div className="flex flex-col gap-10 [grid-area:prt] max-[1099px]:grid max-[1099px]:grid-cols-2 max-[1099px]:gap-8 max-[640px]:flex max-[640px]:flex-col max-[640px]:gap-8">{supplier}{notes}</div>
        <div className="[grid-area:hi]">{history}</div>
      </div>
      <ConfirmDialog open={undo} onOpenChange={setUndo} title="Undo this receipt?" icon={ArrowCounterClockwise} name={`${po.no} · ${po.supplierName}`}
        description={`${plural(undoN, 'item')} ${undoN === 1 ? 'comes' : 'come'} back out of stock and ${po.no} goes back to what it was. Use this only if it was entered by mistake.`} confirmLabel="Undo receipt" onConfirm={() => setUndo(false)} onCancel={() => setUndo(false)} />
    </div>
  );
}
