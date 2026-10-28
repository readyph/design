import { type ReactNode } from 'react';
import { ClockCounterClockwise, Clock, WarningCircle, PaperPlaneTilt, Printer, Truck } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { Button } from './Button';
import { TransferStatusBadge, type TransferStatus } from './TransferList';

/*
 * RDY-398 I15 (detail). Transcribed from inventory-home FINAL/movements.js 311-376 (stepsOf, historyOf, histHTML, confirmHTML, actionsHTML, tdetailHTML),
 * movements.css 107-121 (.tdg .tside .tpaper .waitfor .bad), 161, 243 (<=1099, <=640); purchase-orders.css 64-66 (.pacts2), 82-83 (.shortn), 109-115 (.hist);
 * order-list.css 135-138 (.cfm-i), 279-280 (.waitfor.ok); products.css 46-49 (.pnl-h). The steps (ProgressSteps, I10) and the paper (PaperDocument, I9) are passed in.
 */
export interface TransferHistoryEvent {
  /** "22 Oct, 9:40 AM". */
  at: string;
  who?: string;
  what: string;
  extra?: string;
}

export type TransferNote = { tone: 'transit' | 'short'; title: string; text: string };

export interface TransferDetailProps {
  id: string;
  /** True when this stockroom sends it. */
  out: boolean;
  otherName: string;
  status: TransferStatus;
  /** Facts line: From, To, quantity words, For job. */
  facts: ReactNode[];
  /** ProgressSteps (I10): Drafted, Sent, Received. */
  steps: ReactNode;
  /** PaperDocument (I9) of kind transfer. */
  paper: ReactNode;
  history: TransferHistoryEvent[];
  note?: TransferNote;
  /** What this role can do. */
  can: { send: boolean; receive: boolean; change: boolean };
  /** Short name of the other place and of this place, and the manager, for the waiting text. */
  otherShort: string;
  hereShort: string;
  managerName: string;
  /** The send question is open. Opening it removes the top "Mark as sent". */
  confirming?: boolean;
  /** The sentence under the send question: what leaves, and the effect. */
  confirmText?: ReactNode;
  /** A line problem that stops sending ("Only 1 X on hand now, the draft has 2."). */
  issue?: string;
  disabled?: boolean;
  onAskSend: () => void;
  onSend: () => void;
  onNotYet: () => void;
  onPrint: () => void;
  onReceive: () => void;
  onChange: () => void;
  onCancelDraft: () => void;
  className?: string;
}

const va = 'inline-flex h-6 cursor-pointer items-center rounded-[4px] px-1 text-[12px] font-semibold text-accent hover:text-lk-hover disabled:cursor-default disabled:opacity-60 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

/** Transfer detail (I15): header and state, facts, actions (one primary), inline send question, steps, note, the paper beside History. */
export function TransferDetail(p: TransferDetailProps) {
  const { status, out } = p;
  const print = <Button variant="secondary" leftIcon={Printer} disabled={p.disabled} onClick={p.onPrint}>Print</Button>;
  let actions: ReactNode;
  if (status === 'draft' && out) {
    actions = p.can.send ? (
      <>
        {!p.confirming && <Button variant="primary" leftIcon={PaperPlaneTilt} disabled={p.disabled} onClick={p.onAskSend}>Mark as sent</Button>}
        {print}
      </>
    ) : (
      <>
        <p className="m-0 flex max-w-[520px] gap-2 text-[13px] text-text">
          <Clock aria-hidden size={16} className="mt-0.5 flex-none text-ok" />
          <span><b>Waiting for {p.managerName.toLowerCase()}</b><br />{p.otherShort} asked for this. {p.managerName} marks it sent, and stock leaves {p.hereShort}. You can print it now.</span>
        </p>
        {print}
      </>
    );
  } else if (status === 'transit' && !out) {
    actions = (
      <>
        {p.can.receive && <Button variant="primary" leftIcon={Truck} disabled={p.disabled} onClick={p.onReceive}>Receive transfer</Button>}
        {print}
      </>
    );
  } else actions = print;
  const showSec = status === 'draft' && out && p.can.change;
  return (
    <div className={cn('', p.className)}>
      <div className="mt-2 flex items-start gap-4">
        <h1 className="text-[length:var(--fs-case)] leading-7 font-semibold tracking-[-0.01em]">
          <span className="text-[12px]">{p.id}</span> <span className="font-semibold">{out ? 'to' : 'from'} {p.otherName}</span>
        </h1>
        <TransferStatusBadge status={status} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-y-1 text-[13px] leading-5 text-muted [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5 [&>span]:whitespace-nowrap [&>span+span]:before:mx-1 [&>span+span]:before:ml-2.5 [&>span+span]:before:h-[3px] [&>span+span]:before:w-[3px] [&>span+span]:before:rounded-full [&>span+span]:before:bg-control [&>span+span]:before:content-[''] [&_b]:font-semibold [&_b]:text-text">
        {p.facts.map((f, i) => <span key={i}>{f}</span>)}
      </div>
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          {actions}
          {showSec && (
            <span className="ml-3 inline-flex items-center gap-4 text-[13px]">
              <button type="button" className={va} disabled={p.disabled} onClick={p.onChange}>Change the draft</button>
              <button type="button" className={va} disabled={p.disabled} onClick={p.onCancelDraft}>Cancel this draft</button>
            </span>
          )}
        </div>
        {p.confirming && (
          <div role="group" aria-label="Confirm marking as sent" className="mt-2 border-t border-text pt-3 text-[13px] leading-[19px] [&_p+p]:mt-1.5 [&_p+p]:text-muted">
            <p><b className="font-semibold">Mark {p.id} as sent to {p.otherName}?</b></p>
            <p>{p.confirmText} The draft is locked once it is sent.</p>
            {p.issue && <p className="!mt-1.5 font-medium !text-bad">{p.issue} Change the draft first.</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary" leftIcon={PaperPlaneTilt} disabled={!!p.issue} onClick={p.onSend}>Mark as sent</Button>
              <Button variant="secondary" onClick={p.onNotYet}>Not yet</Button>
            </div>
          </div>
        )}
      </div>
      {p.steps}
      {p.note && (
        <p className="mt-6 flex items-start gap-[10px] border-y border-rule py-3 text-[14px] leading-5">
          {p.note.tone === 'transit' ? <Clock aria-hidden size={18} className="mt-px flex-none text-muted" /> : <WarningCircle aria-hidden size={18} className="mt-px flex-none text-muted" />}
          <span><b className="font-semibold">{p.note.title}</b> {p.note.text}</span>
        </p>
      )}
      <div className="mt-9 grid grid-cols-[minmax(0,1fr)_340px] items-start gap-x-12 gap-y-10 max-[1099px]:grid-cols-[minmax(0,1fr)] max-[640px]:mt-7 max-[640px]:gap-7">
        <div className="min-w-0 [&>article]:max-w-[880px]">{p.paper}</div>
        <div className="min-w-0 print:hidden">
          <section>
            <div className="flex min-h-8 items-baseline gap-[10px] border-b border-border pb-[10px]">
              <ClockCounterClockwise aria-hidden size={18} className="self-center text-muted" />
              <h2 className="whitespace-nowrap text-[16px] leading-[22px] font-semibold">History</h2>
              <span className="text-[13px] font-medium tabular-nums text-muted">{p.history.length}</span>
            </div>
            <ol className="m-0 list-none p-0">
              {p.history.map((e, i) => (
                <li key={i} className={cn('grid grid-cols-[148px_minmax(0,1fr)] gap-x-4 border-t border-rule py-3 text-[14px] leading-5', i === 0 && 'border-t-0')}>
                  <span className="text-[13px] text-muted">{e.at}</span>
                  <span>
                    {e.who ? <><b className="font-semibold">{e.who}</b>{' '}</> : null}
                    {e.what}
                    {e.extra ? <span className="mt-0.5 block text-[13px] leading-[18px] text-muted">{e.extra}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
