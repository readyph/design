import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { ArrowRight, Check, CheckCircle, Warning } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { LedaMark } from './Leda';
import { Button } from './Button';
import { focusIfLost } from '../utils/focusIfLost';

/**
 * Leda proposal / confirm card (RDY-269, handover C9). A raised box in which Leda shows exactly what she
 * will change and waits for one click. It never writes by itself: `onConfirm` is the write.
 * Built to sit in the 440px conversation overlay (C8) and on a phone; it works down to 320px.
 */

export type LedaProposalState = 'waiting' | 'writing' | 'done' | 'discarded';

export interface LedaProposalLine {
  /** What the line is (an item, a field). Wraps; never cut. */
  label: ReactNode;
  /** The value (quantity, cost, new setting). Right aligned, wraps and breaks inside long strings. */
  value: ReactNode;
  /** Muted second line under the label (e.g. "4 x PHP 120"). */
  detail?: ReactNode;
  /** The total row: heavier, with a stronger rule above it. Use for the last line. */
  total?: boolean;
}

export interface LedaProposalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title' | 'id'> {
  /** The title: what the draft does ("Raise oil filter reorder level to 30"). */
  title: ReactNode;
  /** Record ID, set in the mono token at the right of the top line (e.g. "CMD-RL"). */
  id?: string;
  /** Start of the top line. Default "Leda's draft". The state is appended: "waiting for you", "writing", "written", "discarded". */
  topLabel?: string;
  /** Optional lines table (item, value, total row). A real `table` with a row header per line. */
  lines?: LedaProposalLine[];
  /** Name of the lines table for assistive tech. Default "Lines". */
  linesLabel?: string;
  /** Exactly what will change, one short line each. Listed right above the actions. */
  writes?: string[];
  /** Heading of the list: "Confirm writes" (default), "Leda will write" or "Confirm creates". */
  writesHeading?: string;
  /** Muted "note" lines (e.g. who gets notified). Read as "Note: ...". */
  notes?: string[];
  /** Muted line for what Leda cannot do here. Read as "Leda can't: ...". */
  cannot?: string;
  /** Optional warning, in the bad colour with an icon and the word "Warning" for assistive tech. */
  warning?: ReactNode;
  /** `waiting` (default), `writing` (Aurora, busy), `done`, `discarded`. The consumer drives it. */
  state?: LedaProposalState;
  /** Confirm button text, e.g. "Confirm rush PO". Default "Confirm". */
  confirmLabel?: string;
  /** An extra action beside Confirm, e.g. `<Button variant="secondary">Change it first</Button>`. */
  extra?: ReactNode;
  /** Discard button text. Default "Discard draft". */
  discardLabel?: string;
  /**
   * The write. Called once per click: further clicks are ignored until `state` leaves and returns to
   * `waiting`, or (if you return a promise) until it settles. Set `state="writing"` right away. If the write fails, set `state="waiting"` again and pass the error through `warning` (the card has no error state of its own).
   */
  onConfirm?: () => void | Promise<unknown>;
  /** One click, no dialog: the consumer shows `toast.undo` and returns `state` to `waiting` on Undo. */
  onDiscard?: () => void;
  /** Done state: what was written, e.g. "Reorder level is now 30." */
  after?: ReactNode;
  /** Done state: time, set in tabular figures after `after` (e.g. "9:12 AM"). */
  doneAt?: string;
  /** Done state: an optional next action ("Send invite now", "See it in Memory"). */
  doneAction?: ReactNode;
  /** Discarded state text. Default "Draft discarded. Nothing was written." */
  discardedText?: string;
  /** The card was made on another page: shows "Open {openPage} to confirm" instead of Confirm and Discard. */
  openPage?: string;
  /** Link for "Open {openPage} to confirm". Without it a button calls `onOpenPage`. */
  openHref?: string;
  onOpenPage?: () => void;
}

const topWord: Record<LedaProposalState, string> = {
  waiting: 'waiting for you',
  writing: 'writing',
  done: 'written',
  discarded: 'discarded',
};

const sr = 'absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]';
const onRaised = 'forced-colors:outline-0 forced-colors:focus-visible:outline forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-[Highlight]';
const marker =
  "relative min-w-0 py-[3px] pl-4 before:absolute before:left-0.5 before:top-3 before:h-[1.5px] before:w-1.5 before:bg-accent before:content-[''] forced-colors:before:bg-[CanvasText]";
const markerMuted = "text-muted before:h-0 before:border-t-[1.5px] before:border-dashed before:border-muted before:bg-transparent";

/**
 * The card. States: waiting, writing, done, discarded; or "Open {page} to confirm" when made elsewhere.
 *
 * Accessibility. A `group` named by the title (not a landmark, so a thread of cards stays quiet).
 * `aria-busy` while writing. In `writing` Confirm and Discard use `aria-disabled` (not `disabled`), so keyboard
 * focus stays on Confirm. When Confirm or Discard is pressed here and the card moves to done or discarded,
 * focus moves to the result line; otherwise a polite live region announces each state change once.
 * State is never colour alone: the top line says it in words, notes and warnings carry a spoken prefix.
 */
export const LedaProposal = forwardRef<HTMLDivElement, LedaProposalProps>(function LedaProposal(
  {
    title, id: recordId, topLabel = "Leda's draft", lines, linesLabel = 'Lines', writes = [], writesHeading = 'Confirm writes', notes = [], cannot, warning,
    state = 'waiting', confirmLabel = 'Confirm', extra, discardLabel = 'Discard draft', onConfirm, onDiscard, after, doneAt, doneAction,
    discardedText = 'Draft discarded. Nothing was written.', openPage, openHref, onOpenPage, className, ...rest
  },
  ref,
) {
  const uid = useId();
  const titleId = `${uid}t`;
  const writesId = `${uid}w`;
  const resultRef = useRef<HTMLParagraphElement>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const latched = useRef(false);
  const movedFocus = useRef(false);
  const wantFocus = useRef(false);
  const first = useRef(true);
  const [announce, setAnnounce] = useState('');
  const writing = state === 'writing';
  const elsewhere = Boolean(openPage);

  // A new write may start once the card is waiting again (Undo, or a failed write).
  useEffect(() => {
    if (state === 'waiting') latched.current = false;
  }, [state]);

  // After Confirm or Discard here: the pressed button is gone, so focus goes to the result, once.
  useLayoutEffect(() => {
    movedFocus.current = false;
    if (wantFocus.current && (state === 'done' || state === 'discarded')) {
      wantFocus.current = false;
      // Only if focus was lost (or is still in the card): never pull it from where the user went meanwhile.
      movedFocus.current = focusIfLost(rootRef.current, resultRef.current);
    }
    if (state === 'waiting') wantFocus.current = false;
  }, [state]);

  // One polite announcement per state change; none on mount, none when focus already moved to the result.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (movedFocus.current) setAnnounce('');
    else if (state === 'writing') setAnnounce('Leda is writing.');
    else if (state === 'done') setAnnounce(`Written. ${typeof after === 'string' ? after : ''}`.trim());
    else if (state === 'discarded') setAnnounce('Draft discarded. Nothing was written.');
    else setAnnounce('Draft is waiting for you again.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const confirm = () => {
    if (state !== 'waiting' || latched.current) return;
    latched.current = true;
    wantFocus.current = true;
    const r = onConfirm?.();
    if (r && typeof (r as Promise<unknown>).then === 'function') {
      (r as Promise<unknown>).then(
        () => { latched.current = false; },
        () => { latched.current = false; wantFocus.current = false; },
      );
    }
  };
  const discard = () => {
    if (state !== 'waiting') return;
    wantFocus.current = true;
    onDiscard?.();
  };

  const row = (l: LedaProposalLine, i: number) => (
    <tr key={i} className={cn('border-t align-top', l.total ? 'border-control font-semibold' : 'border-raised-2')}>
      <th scope="row" className="min-w-0 py-1.5 pr-2 text-left font-[inherit]">
        <span className={cn(!l.total && 'font-normal')}>{l.label}</span>
        {l.detail && <span className="block font-normal text-muted">{l.detail}</span>}
      </th>
      <td className="w-[42%] min-w-0 py-1.5 text-right tabular-nums">{l.value}</td>
    </tr>
  );

  const result = 'm-0 rounded-control outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent forced-colors:outline-0 forced-colors:focus-visible:outline forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-[Highlight]';

  return (
    <div
      ref={(el) => {
        rootRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      role="group"
      aria-labelledby={titleId}
      aria-busy={writing || undefined}
      data-state={state}
      {...rest}
      className={cn(
        className,
        'block min-w-0 max-w-full rounded-card bg-raised px-3.5 pb-3.5 pt-3 text-body text-text [overflow-wrap:anywhere] forced-colors:border forced-colors:border-[CanvasText]',
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-small text-muted">
        <span aria-hidden className="shrink-0">
          <LedaMark size={16} decorative effect="aurora" active={writing} />
        </span>
        <span className={cn('min-w-0', state === 'done' && 'text-ok-ink')}>
          {topLabel} · {topWord[state]}
        </span>
        {recordId && <span className="ml-auto min-w-0 font-mono text-small text-text [overflow-wrap:anywhere]">{recordId}</span>}
      </div>

      <p id={titleId} className={cn('m-0 mt-1.5 text-body font-semibold', state === 'discarded' && 'text-muted')}>
        {title}
      </p>

      {state === 'done' && (
        <>
          <p
            ref={resultRef}
            tabIndex={-1}
            className={cn(result, 'mt-2 flex items-start gap-2 bg-ok-bg px-2.5 py-2 text-ui text-ok-ink')}
          >
            <CheckCircle aria-hidden size={16} weight="fill" className="mt-0.5 shrink-0" />
            <span className="min-w-0">
              <span className={sr}>Written. </span>
              {after ?? 'Done.'}
              {doneAt && <span className="ml-1.5 whitespace-nowrap tabular-nums">{doneAt}</span>}
            </span>
          </p>
          {doneAction && <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">{doneAction}</div>}
        </>
      )}

      {state === 'discarded' && (
        <p ref={resultRef} tabIndex={-1} className={cn(result, 'mt-1 text-ui text-muted')}>
          {discardedText}
        </p>
      )}

      {(state === 'waiting' || state === 'writing') && (
        <>
          {lines && lines.length > 0 && (
            <table className="mt-2.5 w-full table-fixed border-collapse text-small">
              <caption className={sr}>{linesLabel}</caption>
              <tbody>{lines.filter((l) => !l.total).map(row)}</tbody>
              {lines.some((l) => l.total) && <tfoot>{lines.filter((l) => l.total).map(row)}</tfoot>}
            </table>
          )}

          {(writes.length > 0 || notes.length > 0 || cannot) && (
            <div className="mt-2.5 text-ui">
              <p id={writesId} className="m-0 mb-0.5 text-small text-muted">{writesHeading}</p>
              <ul aria-labelledby={writesId} className="m-0 list-none p-0">
                {writes.map((w, i) => (
                  <li key={`w${i}`} className={marker}>{w}</li>
                ))}
                {cannot && (
                  <li className={cn(marker, markerMuted)}>
                    <span className={sr}>Leda can't: </span>
                    {cannot}
                  </li>
                )}
                {notes.map((n, i) => (
                  <li key={`n${i}`} className={cn(marker, markerMuted)}>
                    <span className={sr}>Note: </span>
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {warning && (
            <p className="m-0 mt-2 flex items-start gap-1.5 text-ui text-bad-ink">
              <Warning aria-hidden size={16} weight="fill" className="mt-0.5 shrink-0" />
              <span className="min-w-0">
                <span className={sr}>Warning: </span>
                {warning}
              </span>
            </p>
          )}

          <div className="mt-3.5 flex min-w-0 flex-wrap items-center gap-2">
            {elsewhere ? (
              openHref ? (
                <a
                  href={openHref}
                  className={cn(
                    'inline-flex h-[var(--ctl-button)] items-center justify-center gap-2 rounded-control border border-control bg-surface px-3 text-ui font-medium text-text hover:border-muted active:bg-raised max-[640px]:h-[var(--ctl-touch)] max-[640px]:w-full',
                    focusRing,
                    onRaised,
                  )}
                  onClick={onOpenPage}
                >
                  Open {openPage} to confirm
                  <ArrowRight aria-hidden size={14} />
                </a>
              ) : (
                <Button variant="secondary" actionBar rightIcon={ArrowRight} onClick={onOpenPage} className={cn(onRaised, 'max-[640px]:w-full')}>
                  Open {openPage} to confirm
                </Button>
              )
            ) : (
              <>
                <Button
                  actionBar
                  leftIcon={writing ? undefined : Check}
                  aria-disabled={writing || undefined}
                  onClick={confirm}
                  className={cn(onRaised, 'min-w-0 whitespace-normal aria-disabled:cursor-not-allowed aria-disabled:opacity-70 max-[640px]:w-full')}
                >
                  {writing ? 'Writing…' : confirmLabel}
                </Button>
                {extra}
                <Button
                  variant="text"
                  actionBar
                  aria-disabled={writing || undefined}
                  onClick={writing ? undefined : discard}
                  className={cn(onRaised, 'min-w-0 whitespace-normal aria-disabled:cursor-not-allowed aria-disabled:opacity-70')}
                >
                  {discardLabel}
                </Button>
              </>
            )}
          </div>
        </>
      )}

      <p role="status" aria-live="polite" className={sr}>{announce}</p>
    </div>
  );
});
