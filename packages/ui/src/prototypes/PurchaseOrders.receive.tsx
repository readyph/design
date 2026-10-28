import type { ReactNode } from 'react';
import { CaretRight, Truck } from '@phosphor-icons/react';
import { Modal } from '../components/Modal';
import { ReceiveForm, type ReceiveFormProps, type ReceiveResult } from '../components/ReceiveForm';
import { SHORT_DELIVERY_DSP, ShortDeliveryBlock, type ShortDeliveryConfirm } from '../components/ShortDeliveryBlock';
import { cn } from '../utils/cn';
import type { OrderExtras } from './PurchaseOrders.order.data';
import { DSP, plural, type PurchaseOrder, type purchaseOrdersModel } from './PurchaseOrders.data';
import { PRODUCTS } from './Products.data';

/* RDY-428. Page: Purchase orders, 4/5 (d): Receive and the short-delivery block, wired to the model.
   Source: inventory-home FINAL purchase-orders.js 334-370 (owes, dueValue, missAmt, dateOpts, settleHTML), 461-478 (receiveHTML header, facts, rcv-h), 479-482 (sbarHTML receive crumb),
   601-630 (settleDone, acceptIt, disputeIt, resolveIt, tellIt, askSettle), 636-641 (pickReceive), 746-747 (?settle=); receiving.js 107-145 (DSP, flag, settle);
   purchase-orders.css 56-60 (.chead h1), 85-91 (.sett), 118 and 257 (.rcv-h), 119 and 258 (.rlines), 52-53 (.pk-r). The form and the block themselves are the merged I11 and I12 components. */
export type OrderModel = ReturnType<typeof purchaseOrdersModel>;

const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-PH')}`;
const plr = (n: number, a: string, b: string) => `${n} ${n === 1 ? a : b}`;

/** purchase-orders.js 335: the orders that can have a short delivery to settle. */
export const owes = (po: PurchaseOrder) => po.src !== 'history' && (po.status === 'PARTIAL' || (po.status === 'RECEIVED' && po.shortUnits > 0));

/** purchase-orders.js 343-345 (Receive is only reachable on an open order, by someone who may receive, when the orders loaded). */
export const canReceive = (M: OrderModel, po: PurchaseOrder, poErr: boolean) => M.isOpen(po) && M.can('receive') && !poErr;

/** purchase-orders.js 337-340: what is missing, in words, and at cost. */
export function missing(M: OrderModel, po: PurchaseOrder) {
  const closed = po.status === 'RECEIVED';
  const value = po.lines.reduce((s, l) => s + (closed ? Math.max(0, l.ordered - l.received) : M.outstanding(l, po)) * l.cost, 0);
  return { closed, amt: closed ? M.shortAmt(po) : M.leftAmt(po), value };
}

export interface SettleProps {
  M: OrderModel;
  po: PurchaseOrder;
  poErr: boolean;
  /** `?settle=accept|dispute|resolve` (Home's Settle link): that form starts open. */
  settleForm?: ShortDeliveryConfirm | null;
  onDone?: (msg: string) => void;
}

/** purchase-orders.js 341-370 settleHTML, 746-747: the short-delivery block on an order that came in short or is part in. */
export function SettleSection({ M, po, poErr, settleForm = null, onDone }: SettleProps) {
  if (!owes(po)) return null;
  const { can, money } = M;
  const byName = (id?: string | null) => (id === 'leda' ? 'Leda' : M.people.find((p) => p.id === id)?.short ?? '');
  const m = missing(M, po);
  const mine = can('accept_variance');
  const d = po.dispute, acc = po.settleInfo, tl = po.told;
  const dateOpts = Array.from({ length: 7 }, (_, i) => {
    const n = M.TODAY + i + 1;
    return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(4 + M.asof + i + 1) % 7]} ${n} Oct`;
  });
  const first = po.supplierName.split(' ')[0];
  const open = settleForm && mine && (settleForm !== 'resolve' ? !d && !acc : !!d && d.status === 'open') && !poErr ? settleForm : null;
  return (
    <ShortDeliveryBlock
      key={`${po.no}-${po.status}-${d?.status ?? ''}-${acc ? 'a' : ''}-${tl ? 't' : ''}`}
      order={{ no: po.no, supplierName: po.supplierName, closed: m.closed, missing: m.amt, dueValue: money ? peso(m.value) : undefined, settledEarlier: po.varianceState === 'settled' && m.closed }}
      canSettle={mine}
      accepted={acc ? { by: byName(acc.by), at: acc.at ?? '', why: DSP.word(DSP.accWhy, acc.why ?? ''), note: acc.note } : undefined}
      dispute={d ? {
        reason: DSP.word(DSP.reasons, d.reason ?? ''), by: byName(d.by), at: d.at ?? '', ref: d.ref, note: d.note, status: d.status, outcome: d.outcome,
        credit: money && d.credit ? peso(+d.credit) : undefined, eta: d.eta, rnote: d.rnote, rby: byName(d.rby), rat: d.rat,
      } : undefined}
      told={tl ? { by: byName(tl.by), at: tl.at ?? '', note: tl.note } : undefined}
      error={poErr}
      etaOptions={dateOpts}
      defaultConfirm={open}
      onAccept={() => onDone?.(`${po.no} closed as short, ${m.amt} short. Stock did not change.`)}
      onDispute={() => onDone?.(`Dispute recorded on ${po.no}. Nothing was sent: tell ${first} yourself. Stock did not change.`)}
      onResolve={() => onDone?.(`Dispute resolved on ${po.no}.`)}
      onTell={() => onDone?.(`Your manager has been told about ${po.no}. Nothing in stock changed.`)}
    />
  );
}
export { SHORT_DELIVERY_DSP };

/** The people who can receive: everyone but the owner (purchase-orders.js 463). */
const OWNER: Record<'a' | 'b', string> = { a: 'mon', b: 'bea' };

export interface ReceiveViewProps {
  M: OrderModel;
  po: PurchaseOrder;
  extras: OrderExtras;
  stateBadge: ReactNode;
  error?: string;
  onConfirm: (r: ReceiveResult) => void;
  onCancel: () => void;
}

/** purchase-orders.js 461-478 receiveHTML: the header, the facts, the line under them, then the I11 Receive form. */
export function ReceiveView({ M, po, extras: X, stateBadge, error, onConfirm, onCancel }: ReceiveViewProps) {
  const { money, tenant } = M;
  const D = PRODUCTS[tenant];
  const l = M.lateDays(po);
  const lines: ReceiveFormProps['lines'] = po.lines.map((ln, i) => {
    const p = ln.product;
    return { id: p.id, name: p.name, sku: p.sku, location: X.locs[i], unit: p.unit, onHand: p.onHand, reorder: p.reorder, ordered: ln.ordered, stillDue: M.outstanding(ln, po), cost: money ? ln.cost : undefined };
  });
  const viewer = D.viewers[M.role].viewer;
  const facts: ReactNode[] = [
    <>Expected <b className={l ? 'text-bad' : undefined}>{M.expDate(po)}{l ? `, ${plr(l, 'day', 'days')} late` : ''}</b></>,
    <>{plr(po.lines.length, 'product', 'products')}, {M.leftAmt(po)} still due</>,
    money ? <>Total <b className="tabular-nums">{peso(po.total)}</b></> : null,
  ].filter(Boolean);
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-4 max-[640px]:flex-row max-[640px]:flex-wrap max-[640px]:items-start max-[640px]:gap-x-3 max-[640px]:gap-y-2">
        <h1 className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[22px] font-semibold leading-7 tracking-[-0.01em]">Receive <span className="text-[22px] font-semibold">{po.no}</span> <span className="font-normal text-muted">{po.supplierName}</span></h1>
        {stateBadge}
      </div>
      <div className="-ml-[23px] mt-3 flex flex-wrap items-center gap-y-1 [clip-path:inset(-6px_-6px_-6px_23px)] text-[13px] leading-5 text-muted [&_b]:font-semibold [&_b]:text-text [&_b.text-bad]:text-bad">
        {facts.map((f, i) => <span key={i} className="inline-flex items-center gap-1.5 whitespace-nowrap before:ml-[10px] before:mr-1 before:h-[3px] before:w-[3px] before:flex-none before:rounded-full before:bg-control before:content-['']">{f}</span>)}
      </div>
      <p className="mt-5 max-w-[720px] text-[14px] leading-[21px] text-muted max-[640px]:mt-3">Count what is on the delivery. Each box below starts at what is still due: change it only where something is different. Nothing is added to stock until you press Confirm.</p>
      <ReceiveForm
        className="min-[641px]:mt-7"
        poNo={po.no}
        lines={lines}
        stock={D.products.map((p) => ({ id: p.id, onHand: p.onHand, reorder: p.reorder }))}
        people={M.people.filter((p) => p.id !== OWNER[tenant]).map((p) => ({ id: p.id, name: p.short }))}
        viewerId={viewer.id}
        canCloseShort={M.can('accept_variance')}
        managerName={D.viewers.manager.viewer.short}
        error={error}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>
  );
}

/** purchase-orders.js 636-641 pickReceive: "Which delivery arrived?". */
export function PickDelivery({ M, open, onOpenChange, onPick }: { M: OrderModel; open: boolean; onOpenChange: (o: boolean) => void; onPick: (no: string) => void }) {
  const list = M.all().filter(M.isOpen).sort((a, b) => M.attention(a) - M.attention(b) || (M.dueN(a) ?? 99) - (M.dueN(b) ?? 99));
  return (
    <Modal open={open} onOpenChange={onOpenChange} icon={Truck} title="Which delivery arrived?" description="Choose the purchase order. You then count what came." size="md">
      <div className="flex flex-col">
        {list.length ? list.map((p, i) => {
          const late = M.lateDays(p);
          return (
            <button key={p.no} type="button" data-rcv={p.no} onClick={() => onPick(p.no)} className={cn('group/row relative -mx-2 grid w-[calc(100%+16px)] cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-none border-t border-rule bg-clip-padding px-2 py-3.5 text-left text-text hover:bg-raised', i === 0 && 'border-t-transparent')}>
              <span className="min-w-0">
                <span className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-medium leading-5">{p.supplierName}</span>
                <span className="mt-[3px] block min-w-0 text-[13px] leading-[18px] text-muted"><span className="font-mono text-[12px] tracking-normal">{p.no}</span> · {M.rule.dueW(M.leftAmt(p) as unknown as number)} · expected {M.expDate(p).replace(/ Oct$/, '')}{late ? <>, <span className="font-semibold text-bad">{plr(late, 'day', 'days')} late</span></> : M.dueToday(p) ? <>, <span className="font-semibold text-bad">due today</span></> : null}</span>
              </span>
              <span className="inline-flex items-center gap-[3px] px-1 text-[13px] font-semibold leading-[18px] text-accent group-hover/row:text-lk-hover">Receive<CaretRight size={12} weight="bold" aria-hidden="true" /></span>
            </button>
          );
        }) : <p className="m-0 text-[14px] text-muted">No order is waiting for a delivery.</p>}
      </div>
    </Modal>
  );
}

export { plural };
