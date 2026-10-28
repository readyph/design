import { useId, useState, type ReactNode } from 'react';
import { Check, ChatCircleText, Scales } from '@phosphor-icons/react';
import { Button } from './Button';
import { Select } from './Select';
import { cn } from '../utils/cn';

/*
 * RDY-396 I12. Transcribed from inventory-home FINAL/purchase-orders.css 67-68, 85-91, 289-292, 305-306 (.sett, #cfmslot),
 * order-list.css 136-138, 207 (.cfm-i), products.css 126-130, 133, 219-222, 334 (.tin, .fl, .fr),
 * purchase-orders.js 343-375 (render + confirmHTML), 377 (tell), 600-619 (actions) and receiving.js 114-124 (RCV.DSP, RCV.flag).
 * Inline confirm forms, not dialogs. Prints without the buttons and forms (purchase-orders.css 305-306).
 */

/** RCV.DSP (receiving.js 114-118): the reason and outcome lists, as [value, label]. */
export const SHORT_DELIVERY_DSP = {
  reasons: [['short', 'Short delivery'], ['damaged', 'Damaged'], ['wrong', 'Wrong item']],
  outcomes: [['credit', 'Credit expected'], ['replacement', 'Replacement coming'], ['refused', 'Supplier refused']],
  accWhy: [
    ['never', 'The supplier will not send the rest'],
    ['nolonger', 'We do not need the rest any more'],
    ['credited', 'The supplier already credited us'],
    ['other', 'Another reason'],
  ],
} as const satisfies Record<string, ReadonlyArray<readonly [string, string]>>;

export type ShortDeliveryConfirm = 'accept' | 'dispute' | 'resolve' | 'tell';
export type DisputeOutcome = 'credit' | 'replacement' | 'refused';

export interface ShortDeliveryOrder {
  /** "PO-0221" */
  no: string;
  /** Full supplier name, "Petron Auto Parts"; the first word is used in the copy. */
  supplierName: string;
  /** True when the order is closed Short (RECEIVED); false when it is Part in. */
  closed: boolean;
  /** missAmt(po): the missing quantity in words, "6" or "6 bottles". */
  missing: string;
  /** Value of the missing units at cost, "₱2,790". Leave out for a clerk: no costs anywhere. */
  dueValue?: string;
  /** po.varianceState === 'settled': settled earlier, no records on the order. */
  settledEarlier?: boolean;
}

export interface ShortAccepted {
  by: string;
  at: string;
  /** Label from SHORT_DELIVERY_DSP.accWhy. */
  why: string;
  note?: string;
}

export interface ShortDispute {
  /** Label from SHORT_DELIVERY_DSP.reasons. */
  reason: string;
  by: string;
  at: string;
  ref?: string;
  note?: string;
  status: 'open' | 'resolved';
  outcome?: DisputeOutcome;
  /** Formatted credit, "₱500". Managers only. */
  credit?: string;
  /** Replacement expected date. */
  eta?: string;
  rnote?: string;
  rby?: string;
  rat?: string;
}

export interface ShortTold {
  by: string;
  at: string;
  note?: string;
}

export interface AcceptValues { why: string; note: string }
export interface DisputeValues { reason: string; ref: string; note: string }
export interface ResolveValues { outcome: string; credit: string; eta: string; note: string }

export interface ShortDeliveryBlockProps {
  order: ShortDeliveryOrder;
  /** Manager / owner permission accept_variance. */
  canSettle?: boolean;
  /** "your manager" (default). */
  manager?: string;
  accepted?: ShortAccepted;
  dispute?: ShortDispute;
  told?: ShortTold;
  /** Error state: the three action buttons are disabled. */
  error?: boolean;
  /** Options for "Expected on" when the answer is a replacement. */
  etaOptions?: string[];
  /** Which inline form starts open (the page opens one when a link carries ?settle=). */
  defaultConfirm?: ShortDeliveryConfirm | null;
  onAccept?: (v: AcceptValues) => void;
  onDispute?: (v: DisputeValues) => void;
  onResolve?: (v: ResolveValues) => void;
  onTell?: (note: string) => void;
}

const first = (s: string) => s.split(' ')[0];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lower = (s: string) => s.toLowerCase();

const tin =
  'block w-full h-[34px] px-[10px] border border-control rounded-control bg-surface text-text text-[14px] ' +
  'placeholder:text-muted hover:border-muted outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent focus-visible:border-accent ' +
  'max-[640px]:h-[44px] max-[640px]:text-[16px]';
const row =
  'mt-3 grid max-w-[520px] grid-cols-[120px_minmax(0,1fr)] items-center gap-x-4 max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-1';
const fl = 'text-[13px] text-text';
const para = 'm-0 mt-1.5 text-muted';
const btnCls = 'disabled:opacity-50 max-[640px]:min-h-[44px]';

/**
 * Short-delivery block (I12): the settle block on a purchase order that came in short. Heading and lines by state (still due,
 * closed Short, Short accepted, Disputed, Dispute resolved, Short settled earlier); managers get Accept the shortage and
 * Dispute with {Supplier} (Record the answer once a dispute is open); a clerk gets Tell your manager. Each action opens an inline
 * confirm form (role="group"), never a dialog. Nothing is sent to the supplier and stock never changes.
 */
export function ShortDeliveryBlock({
  order,
  canSettle = false,
  manager = 'your manager',
  accepted,
  dispute,
  told,
  error = false,
  etaOptions = [],
  defaultConfirm = null,
  onAccept,
  onDispute,
  onResolve,
  onTell,
}: ShortDeliveryBlockProps) {
  const uid = useId();
  const [confirm, setConfirm] = useState<ShortDeliveryConfirm | null>(defaultConfirm);
  const [why, setWhy] = useState<string>('never');
  const [reason, setReason] = useState<string>('short');
  const [outcome, setOutcome] = useState<string>('credit');
  const [eta, setEta] = useState<string>(etaOptions[3] ?? etaOptions[0] ?? '');
  const [credit, setCredit] = useState('');
  const [ref, setRef] = useState('');
  const [note, setNote] = useState('');

  const { no, supplierName, closed, missing, dueValue } = order;
  const money = !!dueValue;
  const fn = first(supplierName);
  const mgr = manager;
  const Mgr = cap(manager);
  const val = money ? ` (${dueValue} at cost)` : '';
  const missW = closed ? `Short ${missing}` : `${missing} still due`;

  let heading: ReactNode;
  const lines: ReactNode[] = [];
  let acts: ReactNode = null;

  if (accepted) {
    heading = 'Short accepted';
    lines.push(
      `${accepted.by} closed ${no} as short on ${accepted.at}. ${missing} short is not expected${money ? `, ${dueValue} at cost` : ''}. Stock did not change.`,
      `Reason: ${lower(accepted.why)}.${accepted.note ? ` “${accepted.note}”` : ''}`,
    );
  } else if (dispute) {
    const open = dispute.status === 'open';
    const word = dispute.outcome === 'credit' ? 'credit expected' : dispute.outcome === 'replacement' ? 'replacement coming' : 'supplier refused';
    heading = open ? `Disputed with ${fn}` : `Dispute resolved: ${word}`;
    lines.push(
      <>
        {dispute.reason}. Opened by {dispute.by}, {dispute.at}
        {dispute.ref ? (
          <>
            . Reference <b className="font-mono text-[13px] tracking-normal">{dispute.ref}</b>
          </>
        ) : null}
        .{dispute.note ? ` “${dispute.note}”` : ''}
      </>,
    );
    if (!open) {
      const res =
        dispute.outcome === 'credit'
          ? `${fn} will credit us${money && dispute.credit ? ` ${dispute.credit}` : ''}. ${no} is closed as short and stock did not change.`
          : dispute.outcome === 'replacement'
            ? `${fn} will send a replacement, expected ${dispute.eta || 'soon'}. ${no} is open again with ${missing} still due. Receive it when it arrives.`
            : `${fn} refused. ${no} is closed as short and stock did not change.`;
      lines.push(
        <>
          {res}
          {dispute.rnote ? ` “${dispute.rnote}”` : ''} <span className="text-muted">{dispute.rby}, {dispute.rat}.</span>
        </>,
      );
    } else if (canSettle) {
      acts = (
        <Button variant="secondary" className={btnCls} leftIcon={ChatCircleText} disabled={error} onClick={() => setConfirm('resolve')}>
          Record the answer
        </Button>
      );
    } else {
      lines.push(`Waiting for ${mgr} to record the answer from ${fn}.`);
    }
  } else if (order.settledEarlier && closed) {
    heading = 'Short settled';
    lines.push('This shortage was settled earlier. Stock did not change.');
  } else {
    heading = closed ? `Short ${missing}${val}` : `${missing} still due${val}`;
    lines.push(
      closed
        ? `The order is closed. Accept the shortage, or dispute it with ${fn}.`
        : `You can keep waiting for the rest, or settle it now: accept the shortage (the order closes as short) or dispute it with ${fn}.`,
    );
    if (canSettle) {
      acts = (
        <>
          <Button variant={closed ? 'primary' : 'secondary'} className={btnCls} leftIcon={Check} disabled={error} onClick={() => setConfirm('accept')}>
            Accept the shortage
          </Button>
          <Button variant="secondary" className={btnCls} leftIcon={Scales} disabled={error} onClick={() => setConfirm('dispute')}>
            Dispute with {fn}
          </Button>
        </>
      );
    } else if (!told) {
      acts = (
        <Button variant="secondary" className={btnCls} leftIcon={ChatCircleText} disabled={error} onClick={() => setConfirm('tell')}>
          Tell {mgr}
        </Button>
      );
    }
    if (!canSettle) lines.push(`${Mgr} decides. You cannot accept, dispute or close it, but you can note it.`);
  }
  if (told) {
    lines.push(
      canSettle ? (
        <>
          <b>{told.by}</b> noted this on {told.at}
          {told.note ? `: “${told.note}”` : '.'}
        </>
      ) : (
        `You told ${mgr} on ${told.at}${told.note ? `: “${told.note}”` : '.'} Waiting for ${mgr}.`
      ),
    );
  }

  const close = () => setConfirm(null);
  const actions = (primary: ReactNode) => (
    <div className="mt-3 flex flex-wrap gap-2">
      {primary}
      <Button variant="secondary" className="max-[640px]:min-h-[44px] max-[640px]:h-[44px]" onClick={close}>
        Not yet
      </Button>
    </div>
  );
  const noteField = (id: string, opts: { label?: string; max: number; placeholder?: string }) => (
    <div className={row}>
      <label className={fl} htmlFor={id}>
        {opts.label ?? 'Note (optional)'}
      </label>
      <input className={tin} id={id} type="text" maxLength={opts.max} value={note} placeholder={opts.placeholder} autoComplete="off" onChange={(e) => setNote(e.target.value)} />
    </div>
  );
  const dd = (labelId: string, label: string, value: string, set: (v: string) => void, options: ReadonlyArray<readonly [string, string]>) => (
    <div className={row}>
      <span className={fl} id={labelId}>
        {label}
      </span>
      <div className="max-w-[300px]">
        <Select size="sm" className="[&>button]:pl-[10px] [&>button]:pr-2 [&>button]:text-[13px]" aria-labelledby={labelId} value={value} onValueChange={set} options={options.map(([v, l]) => ({ value: v, label: l }))} />
      </div>
    </div>
  );

  let form: ReactNode = null;
  if (confirm === 'accept')
    form = (
      <div role="group" aria-label="Confirm accepting the shortage">
        <p className="m-0"><b>Close {no} as short?</b></p>
        <p className={para}>
          The missing {missing}
          {money ? ` (${dueValue} at cost)` : ''} will not be expected any more. Stock stays as it is: nothing is added or taken out. The reason is kept on the order.
        </p>
        {dd(`${uid}-aw`, 'Why', why, setWhy, SHORT_DELIVERY_DSP.accWhy)}
        {noteField(`${uid}-accn`, { max: 120 })}
        {actions(
          <Button variant="primary" className="max-[640px]:min-h-[44px] max-[640px]:h-[44px]" leftIcon={Check} onClick={() => onAccept?.({ why, note: note.trim() })}>
            Yes, close as short
          </Button>,
        )}
      </div>
    );
  if (confirm === 'dispute')
    form = (
      <div role="group" aria-label="Confirm disputing">
        <p className="m-0"><b>Dispute {no} with {supplierName}?</b></p>
        <p className={para}>
          This keeps a record on the order. Nothing is sent to the supplier: tell them yourself. Stock does not change{closed ? '' : ' and the order stays open'}.
        </p>
        {dd(`${uid}-dr`, 'What is wrong', reason, setReason, SHORT_DELIVERY_DSP.reasons)}
        <div className={row}>
          <label className={fl} htmlFor={`${uid}-dspref`}>Reference (optional)</label>
          <input className={tin} id={`${uid}-dspref`} type="text" maxLength={40} value={ref} placeholder="The supplier's claim or credit note number" autoComplete="off" onChange={(e) => setRef(e.target.value)} />
        </div>
        {noteField(`${uid}-dspn`, { max: 160, placeholder: 'For example: spoke to the driver, he will check' })}
        {actions(
          <Button variant="primary" className="max-[640px]:min-h-[44px] max-[640px]:h-[44px]" leftIcon={Scales} onClick={() => onDispute?.({ reason, ref: ref.trim(), note: note.trim() })}>
            Record the dispute
          </Button>,
        )}
      </div>
    );
  if (confirm === 'resolve')
    form = (
      <div role="group" aria-label="Record the supplier's answer">
        <p className="m-0"><b>What did {fn} answer?</b></p>
        {dd(`${uid}-ro`, 'Answer', outcome, setOutcome, SHORT_DELIVERY_DSP.outcomes)}
        {outcome === 'credit' && money ? (
          <div className={row}>
            <label className={fl} htmlFor={`${uid}-resc`}>Credit (₱)</label>
            <input className={tin} id={`${uid}-resc`} type="number" inputMode="decimal" min={0} step={0.01} value={credit} autoComplete="off" onChange={(e) => setCredit(e.target.value)} />
          </div>
        ) : null}
        {outcome === 'replacement' ? dd(`${uid}-re`, 'Expected on', eta, setEta, etaOptions.map((o) => [o, o] as const)) : null}
        {noteField(`${uid}-resn`, { max: 160 })}
        <p className={para}>
          {outcome === 'replacement'
            ? `${no} stays open with ${missing} still due. Stock changes only when the replacement is received.`
            : `${no} is closed as short. Stock does not change.`}
        </p>
        {actions(
          <Button variant="primary" className="max-[640px]:min-h-[44px] max-[640px]:h-[44px]" leftIcon={Check} onClick={() => onResolve?.({ outcome, credit, eta, note: note.trim() })}>
            Save the answer
          </Button>,
        )}
      </div>
    );
  if (confirm === 'tell')
    form = (
      <div role="group" aria-label="Tell your manager">
        <p className="m-0"><b>Tell {mgr} about {no}?</b></p>
        <p className={para}>{missW}. {Mgr} decides what to do. Nothing in stock changes.</p>
        {noteField(`${uid}-telln`, { max: 160, placeholder: 'For example: two boxes missing, driver says Monday' })}
        {actions(
          <Button variant="primary" className="max-[640px]:min-h-[44px] max-[640px]:h-[44px]" leftIcon={ChatCircleText} onClick={() => onTell?.(note.trim())}>
            Tell {mgr}
          </Button>,
        )}
      </div>
    );

  return (
    <section
      id="settle"
      aria-labelledby={`${uid}-h`}
      className="mt-6 max-w-[760px] border-y border-rule pt-4 pb-[18px] max-[640px]:mt-5 print:max-w-none print:border-black"
    >
      <h2 id={`${uid}-h`} className="m-0 mb-1.5 flex items-center gap-2 text-[16px] leading-[22px] font-semibold">
        <Scales size={18} aria-hidden="true" className="flex-none text-muted" />
        <span>{heading}</span>
      </h2>
      {lines.map((x, i) => (
        <p key={i} className="m-0 mt-1 text-[14px] leading-[21px]">
          {x}
        </p>
      ))}
      {acts ? <div className={cn('mt-[14px] flex flex-wrap gap-3 print:hidden', 'max-[640px]:[&>button]:basis-full max-[640px]:[&>button]:flex-[1_1_100%]')}>{acts}</div> : null}
      <div id="cfmslot" className={cn(form ? 'mt-4' : '', 'print:hidden')}>
        {form ? <div className={'mt-2 max-w-[640px] border-t border-text pt-3 text-[13px] leading-[19px]'}>{form}</div> : null}
      </div>
    </section>
  );
}
