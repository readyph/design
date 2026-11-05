import { useState, type ReactNode } from 'react';
import { Camera, Check, CheckCircle, HourglassMedium, Receipt, Warning, Wrench } from '@phosphor-icons/react';
import { Button } from './Button';
import { cn } from '../utils/cn';
import { peso } from './sms/data';
import type { PendingError, QuoteAnswer, TrackerItemView, TrackerPaymentView, TrackerQuoteView, TrackerStatusView, TrackerUpdateView, TrackerWhoView } from './trackerView';
import { BizMark } from './BizMark';
import { NotifyItem } from './NotifyItem';
import { PersonAvatar } from './avatarTone';

// Copied unexported from MechFrame (RDY-541, PR #255); dedupe when that merges.
/**
 * A section, the way Today separates them: a small caption with a hairline under it (Today's Status view: `text-[13px] font-semibold`, `border-b border-control`,
 * the count / hint as plain muted text) and its rows under it. No box, no fill, no pill. Rows are `NotifyItem`s or plain blocks inset 16px like a NotifyItem's text.
 */
function MechSection({ title, count, hint, children, className }: { title: string; count?: number; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn('mt-6 first:mt-0', className)}>
      <h2 className="mb-2 flex items-baseline gap-2 border-b border-control pb-1 text-[13px] font-semibold">{title}{count != null && <span className="font-normal text-muted">{count}</span>}{hint && <span className="ml-auto font-normal text-muted">{hint}</span>}</h2>
      {children}
    </section>
  );
}

/** The check circle used as a NotifyItem marker: empty ring, accent fill when done. 18px, like the desktop Checkbox (the whole row is the tap target). */
function CheckMark({ on, square }: { on: boolean; square?: boolean }) {
  return <span aria-hidden className={cn('grid size-[18px] flex-none place-items-center border-[1.5px]', square ? 'rounded-control' : 'rounded-full', on ? 'border-accent bg-accent text-surface' : 'border-control bg-surface')}>{on && <Check size={12} weight="bold" />}</span>;
}

/** The four steps of the progress line (a copy of the model's list: the blocks do not import the store). */
const STEPS = ['Received', 'Working on it', 'Ready for pick-up', 'Done'] as const;

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';
const Photos = ({ n }: { n: number }) => n > 0 ? <span className="mt-2 flex gap-2">{Array.from({ length: Math.min(n, 3) }, (_, i) => <span key={i} role="img" aria-label="Photo" className="grid h-16 w-20 place-items-center rounded-control bg-raised-2 text-muted"><Camera size={20} aria-hidden /></span>)}</span> : null;

/** The page frame: a centred 520px column, business logo and name on top (shared logo store), no navigation, no login. */
export function TrackerFrame({ children, footer, business, branchName }: { children: ReactNode; footer?: ReactNode; business: string; branchName: string }) {
  return (
    <div className="flex min-h-dvh justify-center bg-surface">
      <div className="flex w-full max-w-[520px] flex-col lg:max-w-[1000px] border-x border-rule bg-surface text-[14px] leading-6 text-text">
        <header className="flex-none border-b border-rule px-4 pb-2 pt-[calc(4px+env(safe-area-inset-top))]">
          <div className="flex min-h-11 items-center gap-2.5">
            <BizMark size={32} />
            <p className="min-w-0 leading-5"><span className="block truncate text-[14px] font-semibold">{business}</span><span className="block truncate text-[12px] text-muted">{branchName}</span></p>
          </div>
        </header>
        <main className="min-h-0 flex-1 px-4 pb-6 pt-4">{children}</main>
        {footer}
      </div>
    </div>
  );
}

/** Who and what: first name, car, masked plate, the work, the JO number. */
export function WhoBlock({ who }: { who: TrackerWhoView }) {
  return (
    <div>
      <p className="text-[13px] text-muted">Hi {who.firstName}, here is your service.</p>
      <h1 className="mt-1 flex flex-wrap items-baseline gap-x-3 text-[16px] font-semibold leading-6">{who.car}<span className="font-mono text-[14px]" aria-label={`Plate ${who.plate}`}>{who.plate}</span></h1>
      <p className="mt-0.5 break-words text-[14px] leading-5 text-muted">{who.service} · <span className="font-mono">{who.number}</span></p>
    </div>
  );
}

const STAGE_ICON = { received: Receipt, working: Wrench, waiting: HourglassMedium, ready: CheckCircle, done: CheckCircle } as const;

/** The status in a word, one sentence, the promised time and a four-step line. */
export function StatusBlock({ status }: { status: TrackerStatusView }) {
  const v = status; const Ico = STAGE_ICON[v.stage]; const promise = v.promise;
  return (
    <MechSection title="Status">
      <p className={cn('flex items-center gap-2 text-[18px] font-semibold leading-6', v.stage === 'waiting' ? 'text-warn-ink' : v.stage === 'ready' || v.stage === 'done' ? 'text-ok' : 'text-text')}><Ico size={22} weight="fill" aria-hidden />{v.word}</p>
      <p className="mt-1 text-[14px] leading-6">{v.sentence}</p>
      {promise && <p className="mt-1 text-[13px] text-muted">{promise}</p>}
      <ol aria-label="Progress" className="mt-4 grid grid-cols-4 items-start">
        {STEPS.map((label, i) => {
          const reached = i <= v.step; const cur = i === v.step && v.stage !== 'done';
          return (
            <li key={label} aria-current={cur ? 'step' : undefined} className="relative flex flex-col items-center gap-1.5 text-center">
              {i > 0 && <span aria-hidden className={cn('absolute left-0 right-1/2 top-[8px] h-0.5', i <= v.step ? 'bg-accent' : 'bg-control')} />}
              {i < STEPS.length - 1 && <span aria-hidden className={cn('absolute left-1/2 right-0 top-[8px] h-0.5', i < v.step ? 'bg-accent' : 'bg-control')} />}
              <span className="relative z-10 grid size-[18px] place-items-center">
                {cur ? <span className={cn('size-[18px] rounded-full border-2 bg-surface', v.stage === 'waiting' ? 'border-warn-dot' : 'border-accent')}><span className={cn('m-[3px] block size-2 rounded-full', v.stage === 'waiting' ? 'bg-warn-dot' : 'bg-accent')} /></span> : <CheckMark on={reached} />}
              </span>
              <span className={cn('text-[12px] leading-4', cur ? 'font-semibold text-text' : 'text-muted')}>{label}<span className="sr-only">{cur ? ' (now)' : reached ? ' (done)' : ''}</span></span>
            </li>
          );
        })}
      </ol>
    </MechSection>
  );
}

/** Quote for extra work: tinted like "waiting for you" elsewhere; Approve / Decline need one more tap (it is a price). */
export function QuoteCard({ q, onAnswer, pending, error }: { q: TrackerQuoteView; onAnswer: (quoteId: string, answer: QuoteAnswer) => void | Promise<void> } & PendingError) {
  const [ask, setAsk] = useState<QuoteAnswer | null>(null);
  if (q.customer !== 'waiting') {
    return (
      <MechSection title="Extra work">
        <p className="flex items-center gap-2 text-[14px] font-medium"><CheckCircle size={18} weight="fill" aria-hidden className={q.customer === 'approved' ? 'text-ok' : 'text-muted'} />{q.customer === 'approved' ? `You approved the extra work (${peso(q.amount)}). We will go ahead.` : 'You declined the extra work. We will not do it.'}</p>
      </MechSection>
    );
  }
  return (
    <MechSection title="Needs your OK">
      <div role="group" aria-label="Quote for extra work" className="rounded-control bg-warn-bg p-4">
        <p className="flex items-center gap-2 text-[14px] font-semibold"><Warning size={18} weight="fill" aria-hidden className="text-warn-ink" />We found extra work</p>
        <p className="mt-1 break-words text-[14px] leading-6">{q.text}</p>
        <Photos n={q.photos} />
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[14px] leading-6">
          <dt className="text-muted">Price</dt><dd className="font-semibold tabular-nums">{peso(q.amount)}</dd>
          <dt className="text-muted">Includes</dt><dd className="break-words">{q.note}</dd>
        </dl>
        {ask ? (
          <div className="mt-4" role="group" aria-label="Confirm your answer">
            <p className="text-[14px] font-medium">{ask === 'approved' ? `Approve the extra work for ${peso(q.amount)}?` : 'Decline the extra work?'}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant={ask === 'approved' ? 'primary' : 'secondary'} fullWidth disabled={pending} onClick={() => onAnswer(q.id, ask)}>{ask === 'approved' ? 'Yes, approve' : 'Yes, decline'}</Button>
              <Button variant="secondary" fullWidth disabled={pending} onClick={() => setAsk(null)}>Go back</Button>
            </div>
            {error && <p role="alert" className="mt-2 text-[13px] text-bad-ink">{error}</p>}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="primary" fullWidth onClick={() => setAsk('approved')}>Approve</Button>
            <Button variant="secondary" fullWidth onClick={() => setAsk('declined')}>Decline</Button>
          </div>
        )}
      </div>
    </MechSection>
  );
}

/** The service items with their done state. No prices. */
export function ItemsBlock({ items }: { items: TrackerItemView[] }) {
  const done = items.filter((x) => x.done).length;
  return (
    <MechSection title="Your service" hint={`${done} of ${items.length} done`}>
      <ul className="-mx-4">
        {items.map((x) => <NotifyItem key={x.name} leading={<span className="pt-px"><CheckMark on={x.done} /></span>} title={x.name} wrap dense tag={x.done ? 'Done' : 'To do'} tagTone={x.done ? 'ok' : 'neutral'} className={x.done ? 'opacity-70' : undefined} />)}
      </ul>
    </MechSection>
  );
}

const EVENT_ICON = { Waiting: HourglassMedium, 'Work started': Wrench, 'Ready for pick-up': CheckCircle, 'Picked up': CheckCircle, 'Extra work found': Warning } as const;

/** Updates feed (customer-visible posts only; the rule lives in trackerModel). Shows the newest five, older ones on request. */
export function UpdatesBlock({ posts }: { posts: TrackerUpdateView[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? posts : posts.slice(0, 5);
  return (
    <MechSection title="Updates" count={posts.length}>
      {posts.length === 0 ? <p className="text-[14px] text-muted">No updates yet. We post here when something happens.</p> : (
        <ul className="-mx-4">
          {shown.map((p) => {
            const person = p.person;
            const Ico = EVENT_ICON[p.title as keyof typeof EVENT_ICON];
            return (
              <NotifyItem key={p.id} wrap time={p.when} title={p.kind === 'note' ? `${p.by === 'Manager' ? 'Manager' : p.by} · ${p.title}` : p.title}
                leading={person ? <PersonAvatar personId={person.id} name={person.name} initials={person.initials} size={32} decorative /> : (
                  <span aria-hidden className={cn('grid size-8 flex-none place-items-center rounded-full bg-raised', p.title === 'Waiting' || p.kind === 'quote' ? 'text-warn-ink' : p.title === 'Ready for pick-up' ? 'text-ok' : 'text-muted')}>{Ico ? <Ico size={20} weight="fill" /> : <Wrench size={20} />}</span>
                )}
                detail={<>{p.text}<Photos n={p.photos} /></>} />
            );
          })}
        </ul>
      )}
      {posts.length > 5 && <button type="button" onClick={() => setAll(!all)} aria-expanded={all} className={cn('mt-2 inline-flex min-h-8 items-center text-[13px] font-semibold text-accent underline underline-offset-2', focus)}>{all ? 'Show fewer updates' : `Show older updates (${posts.length - 5})`}</button>}
    </MechSection>
  );
}

/** Balance at pick-up. Read-only: no pay button, no line prices. Only once the price is final. */
export function PaymentBlock({ payment: m }: { payment: TrackerPaymentView | null }) {
  if (!m) return null;
  return (
    <MechSection title="Payment">
      {m.balance > 0 ? (
        <>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-[14px] leading-6">
            <dt>Amount due at pick-up</dt><dd className="font-semibold tabular-nums">{peso(m.balance)}</dd>
            {m.paid > 0 && <><dt className="text-muted">Already paid</dt><dd className="tabular-nums text-muted">{peso(m.paid)}</dd></>}
          </dl>
          {m.readyForPickup && <p className="mt-2 text-[13px] text-muted">Pay at the shop when you pick up your vehicle.</p>}
        </>
      ) : <p className="flex items-center gap-2 text-[14px]"><CheckCircle size={18} weight="fill" aria-hidden className="text-ok" />Paid in full. Thank you.</p>}
    </MechSection>
  );
}
