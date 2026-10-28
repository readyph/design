import { useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { QuantityStepper } from '../components/QuantityStepper';
import { Select } from '../components/Select';
import { TransferStatusBadge } from '../components/TransferList';
import { cn } from '../utils/cn';
import type { MovementsModel, TrView } from './Movements.data';

/* RDY-440. Page: Movements 5/6 (e), Receive transfer. Transcribed from inventory-home FINAL movements.js 368 (newRcv), 369 (rcvTotals), 370 (rcvRes), 371-374 (rcvSum), 375 (rcvLabel), 376-388 (rcvHTML),
   389-397 (paintRcv), 564-572 (confirmRcv), 683 and 693 (d.got), 689 (rnote), 705 (by); movements.css 141-145, 162, 253-255; purchase-orders.css 118-144, 257-272 (the count lines, owned by I11).
   GAP: the merged I11 ReceiveForm is order-shaped (Ordered, Still due, damaged, delivery note, close as short) and has no transfer variant, so this view builds the four-column transfer lines
   at page level from the same classes and the I2 stepper, Select and Button. A transfer prop on ReceiveForm would be a delivery change for Leonardo. */

const tin =
  'block w-full max-w-[480px] h-[34px] px-[10px] border border-control rounded-control bg-surface text-text text-[14px] placeholder:text-muted placeholder:opacity-100 hover:border-muted outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent focus-visible:border-accent max-[640px]:h-[44px] max-[640px]:max-w-none max-[640px]:text-[16px]';
const fr = 'grid grid-cols-[148px_minmax(0,1fr)] items-center gap-x-4 max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-y-[6px]';
const frl = 'text-[13px] text-text';
const dd = 'max-w-[300px] max-[640px]:max-w-none';
const ddCls = '[&>button]:pl-[10px] [&>button]:pr-2 [&>button]:text-[13px]';
/* movements.css 142 (.tr-rl .rl-head, .rl), 162 (max 1099), 254 (phone: two columns) */
const COLS = 'grid grid-cols-[minmax(0,1.7fr)_80px_236px_150px] items-center gap-x-5 max-[1099px]:grid-cols-[minmax(0,1.4fr)_64px_220px_130px] max-[1099px]:gap-x-[14px]';

export interface ReceiveTransferResult {
  lines: { p: string; qty: number; got: number }[];
  by: string;
  note: string;
}

export interface ReceiveTransferViewProps {
  M: MovementsModel;
  t: TrView;
  /** Story only: where each box starts instead of what was sent (movements.js 368 starts at the sent quantity). */
  start?: Record<string, number>;
  onConfirm: (r: ReceiveTransferResult) => void;
  onCancel: () => void;
}

/** movements.js 376-388 rcvHTML */
export function ReceiveTransferView({ M, t, start, onConfirm, onCancel }: ReceiveTransferViewProps) {
  const { D, STK, place, HERE, fmtAt, qtyWords, unitOf, loc, unitWords, mixed, tallyT, goesInT } = M;
  const [counts, setCounts] = useState<Record<string, number>>(() => Object.fromEntries(t.lines.map((l) => [l.p, start && start[l.p] != null ? start[l.p] : l.qty])));
  const [by, setBy] = useState<string>(D.viewer.id);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const get = (l: object) => counts[(l as { p: string }).p] || 0;
  /* movements.js 369 rcvTotals */
  const got = t.lines.reduce((s, l) => s + get(l), 0);
  const short = t.units - got;
  /* movements.js 370 rcvRes */
  const res = (l: { qty: number }, g: number) => (g === l.qty ? <span className="text-text">All in</span> : g === 0 ? <span className="text-muted">Not arrived</span> : <span className="font-semibold">{l.qty - g} short</span>);
  /* movements.js 371-374 rcvSum */
  const ef = STK.effectText(Object.fromEntries(t.lines.map((l) => [l.p, get(l)])));
  const label = !got ? 'Confirm receipt' : mixed(t) ? 'Confirm: add to stock' : `Confirm: add ${unitWords(t.lines, get)} to stock`;
  const who = D.people.filter((p) => p.role !== 'owner').map((p) => ({ value: p.id, label: p.short + (p.id === D.viewer.id ? ' (you)' : '') }));
  /* movements.js 564-572 confirmRcv */
  const confirm = () => {
    if (!got) {
      setErr('Nothing is counted yet. Type how many of each product arrived, or press Cancel if nothing came.');
      return;
    }
    onConfirm({ lines: t.lines.map((l) => ({ p: l.p, qty: l.qty, got: get(l) })), by, note: note.trim() });
  };
  const btns = (cls?: string) => (
    <>
      <Button variant="primary" leftIcon={Check} actionBar className={cls} onClick={confirm}>{label}</Button>
      <Button variant="secondary" actionBar className={cls} onClick={onCancel}>Cancel</Button>
    </>
  );
  const facts = [<>Sent <b>{fmtAt(t.sentAt)}</b></>, qtyWords(t)];
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-4 max-[640px]:flex-row max-[640px]:flex-wrap max-[640px]:items-start max-[640px]:gap-x-3 max-[640px]:gap-y-2">
        <h1 className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[22px] font-semibold leading-7 tracking-[-0.01em]">Receive <span className="text-[22px] font-semibold">{t.id}</span> <span className="font-normal text-muted">from {t.other.name}</span></h1>
        <TransferStatusBadge status={t.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-y-1 text-[13px] leading-5 text-muted [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5 [&>span]:whitespace-nowrap [&>span+span]:before:mx-1 [&>span+span]:before:ml-2.5 [&>span+span]:before:h-[3px] [&>span+span]:before:w-[3px] [&>span+span]:before:rounded-full [&>span+span]:before:bg-control [&>span+span]:before:content-[''] [&_b]:font-semibold [&_b]:text-text">
        {facts.map((f, i) => <span key={i}>{f}</span>)}
      </div>
      <p className="mt-5 max-w-[720px] text-[14px] leading-[21px] text-muted max-[640px]:mt-3">Count what is on the transfer. Each box starts at what was sent: change it only where something is different. Nothing is added to stock until you press Confirm.</p>
      <div className="text-[14px] max-[640px]:pb-28">
        <div role="group" aria-label="Lines to receive" className="mt-7 max-[640px]:mt-5">
          <div aria-hidden="true" className={cn(COLS, '-mx-2 border-b border-border px-2 pb-[10px] text-[12px] text-muted max-[640px]:hidden [&>span:nth-child(2)]:text-right [&>span:nth-child(3)]:text-left [&>span:nth-child(4)]:text-right')}>
            <span>Product</span>
            <span>Sent</span>
            <span>Arrived</span>
            <span>Result</span>
          </div>
          {t.lines.map((l, i) => (
            <div key={l.p} data-rl={l.p} className={cn(COLS, 'mx-[-8px] px-2 py-4 max-[640px]:mx-0 max-[640px]:grid-cols-2 max-[640px]:gap-y-3 max-[640px]:px-0 max-[640px]:py-5', i > 0 && 'border-t border-rule')}>
              <div className="max-[640px]:col-span-full">
                <span className="block text-[14px] font-medium leading-5">{l.product.name}</span>
                <span className="mt-[3px] block text-[13px] font-normal leading-[18px] text-muted">
                  <span className="font-mono text-[12px] tracking-normal">{l.product.sku}</span> · {loc(l.product.loc as string)} · {l.product.onHand} on hand
                </span>
              </div>
              <div className="text-right text-[14px] tabular-nums max-[640px]:text-left">
                <span className="hidden text-[12px] text-muted max-[640px]:block">Sent</span>
                <b className="font-semibold">{l.qty}</b>
              </div>
              <div className="flex items-center gap-[10px] max-[640px]:col-span-full max-[640px]:flex-wrap">
                <label className="hidden text-[12px] text-muted max-[640px]:block max-[640px]:flex-[0_0_100%]" htmlFor={`g-${l.p}`}>
                  Arrived<span className="hidden max-[640px]:inline">, {unitOf(l.product, get(l))}</span>
                </label>
                <QuantityStepper look="receive" min={0} max={l.qty} productName={l.product.name} value={get(l)} onValueChange={(v) => { setCounts((c) => ({ ...c, [l.p]: v })); setErr(''); }} className="max-[640px]:w-full" />
                <span className="text-[13px] text-muted max-[640px]:hidden">{unitOf(l.product, get(l))}</span>
              </div>
              <div id={`res-${l.p}`} aria-live="polite" className="text-right text-[14px] font-medium max-[640px]:col-span-full max-[640px]:text-left max-[640px]:text-[15px]">{res(l, get(l))}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex max-w-[720px] flex-col gap-4">
          <div className={fr}>
            <span className={frl} id="l-by">Received by</span>
            <div className={dd}>
              <Select size="sm" className={ddCls} aria-labelledby="l-by" value={by} onValueChange={setBy} options={who} />
            </div>
          </div>
          <div className={cn(fr, 'items-start')}>
            <label className={frl} htmlFor="rnote">Receiving note</label>
            <textarea
              className={cn(tin, 'h-auto min-h-16 resize-y px-[10px] py-2 font-[inherit] text-[14px] leading-5 max-[640px]:text-[14px]')}
              id="rnote"
              rows={2}
              maxLength={240}
              value={note}
              placeholder="For example: one box dented, driver left at 8:40."
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-9 max-w-[720px] border-t border-text pt-4 text-[14px] leading-[21px] max-[640px]:mt-7 min-[641px]:sticky min-[641px]:bottom-0 min-[641px]:z-[4] min-[641px]:-mx-pad min-[641px]:mb-[-32px] min-[641px]:mt-8 min-[641px]:flex min-[641px]:max-w-none min-[641px]:items-center min-[641px]:justify-between min-[641px]:gap-x-8 min-[641px]:gap-y-4 min-[641px]:bg-surface min-[641px]:px-pad min-[641px]:pb-4 min-[641px]:pt-[14px]">
          <div className="min-w-0 max-w-[780px]">
            <h2 className="m-0 pb-[6px] text-[13px] font-semibold min-[641px]:text-[12px] min-[641px]:font-normal min-[641px]:text-muted">This receipt</h2>
            <div role="status">
              <p className="[&_b]:font-semibold">
                {got ? <><b>{goesInT(t.lines, get)}</b> at {place(HERE).short}.</> : <><b>Nothing counted.</b> Type how many of each arrived.</>}
                {short ? ` ${tallyT(t, get)}: ${t.other.short} is told.` : ''}
                {ef ? ` ${ef}` : ''}
              </p>
            </div>
            <p role="alert" hidden={!err} className="mt-[10px] font-medium text-bad min-[641px]:mt-[6px]">{err}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 max-[640px]:hidden min-[641px]:m-0 min-[641px]:flex-none min-[641px]:flex-nowrap">{btns()}</div>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-[25] hidden gap-2 bg-frame px-4 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] max-[640px]:flex">{btns('flex-1 text-[14px]')}</div>
      </div>
    </div>
  );
}
