import type { ReactNode } from 'react';
import { ArrowLeft, ArrowSquareOut, Camera, CheckCircle, Hourglass, Package, XCircle } from '@phosphor-icons/react';
import { Button } from './Button';
import { cn } from '../utils/cn';
import { peso, type Job } from './sms/data';
import { pesos, type InboxItem } from './sms/requestsModel';
import { KindChip, StatusChip } from './RequestList';
import { RequestStepper } from './RequestStepper';
import { PersonAvatar } from './avatarTone';

export interface DetailActions {
  onApprove: () => void; onReady: () => void; onDecline: () => void; onQuote: () => void; onDismiss: () => void;
  onAnswer: (text: string) => void; onCustomerAnswer: (answer: 'approved' | 'declined') => void; onOpenService: (job: Job) => void; onBack: () => void;
}

const Fact = ({ k, children }: { k: string; children: ReactNode }) => <div className="flex gap-3 py-1.5 text-[14px]"><dt className="w-28 flex-none text-muted">{k}</dt><dd className="min-w-0 flex-1 break-words">{children}</dd></div>;
const Photos = ({ n }: { n: number }) => n > 0 ? <div className="mt-3 flex gap-2">{Array.from({ length: Math.min(n, 3) }, (_, i) => <span key={i} role="img" aria-label="Photo" className="grid h-20 w-24 place-items-center rounded-control bg-raised-2 text-muted"><Camera size={22} aria-hidden /></span>)}</div> : null;
const Section = ({ title, children }: { title: string; children: ReactNode }) => <section aria-label={title} className="px-4 pt-5"><h3 className="flex items-baseline gap-2 border-b border-control pb-1 text-[13px] font-semibold">{title}</h3>{children}</section>;

/** Header of the detail: plate, car, customer, service, mechanic, and the "Open service" link (a link only: the Today Inspector opens, nothing is edited here). */
export function RequestHeader({ item, job, a }: { item: InboxItem; job: Job | null; a: DetailActions }) {
  const m = item.sender;
  return (
    <header className="px-4 pt-3">
      <button type="button" onClick={a.onBack} className="mb-2 hidden min-h-11 items-center gap-1 text-[14px] font-semibold text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:inline-flex"><ArrowLeft size={18} aria-hidden />Requests</button>
      <div className="flex flex-wrap items-center gap-2"><KindChip kind={item.kind} /><StatusChip status={item.status} /><span className="text-[13px] tabular-nums text-muted">{item.agoLabel}</span></div>
      <h2 className="mt-2 flex flex-wrap items-baseline gap-x-3 text-[18px] font-semibold leading-6">
        {item.plate ? <><span className="font-mono text-[16px]">{item.plate}</span>{item.vehicleLabel && <span>{item.vehicleLabel}</span>}</> : 'Shop use'}
      </h2>
      <p className="mt-0.5 break-words text-[14px] leading-5">{item.plate ? [item.customerName, item.jobNumber, item.jobTitle].filter(Boolean).join(' · ') : 'Not tied to a service'}</p>
      <p className="mt-2 flex items-center gap-2 text-[13px] text-muted"><PersonAvatar personId={m.id} name={m.name} initials={m.initials} size={24} decorative />From {m.name}{job && <> · <a href="#today" onClick={(e) => { e.preventDefault(); a.onOpenService(job); }} className="inline-flex items-center gap-1 font-semibold text-accent underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Open service<ArrowSquareOut size={14} aria-hidden /></a></>}</p>
    </header>
  );
}

/** The item itself and what the manager can do with it, by kind. */
export function RequestBody({ item, job, a }: { item: InboxItem; job: Job | null; a: DetailActions }) {
  if (item.kind === 'part' && item.part && item.partView) {
    const r = item.part; const pr = item.partView; const st = pr.stock; const enough = pr.enough;
    return (
      <Section title="Part request">
        <dl className="mt-2">
          <Fact k="Part">{pr.name}<span className="block text-[12px] text-muted">{pr.sku}</span></Fact>
          <Fact k="Quantity">{r.qty} {pr.unit}{r.qty > 1 ? 's' : ''}</Fact>
          <Fact k="In stock here"><span className={cn(st.tone === 'bad' && 'text-bad-ink', st.tone === 'warn' && 'text-warn-ink')}>{st.word}</span>{!enough && <span className="block text-[12px] text-muted">Not enough here for this request.</span>}</Fact>
          <Fact k="Price">{peso(pr.price)} each · {peso(pr.price * r.qty)} total</Fact>
          <Fact k="For service">{item.plate ? [item.jobNumber, item.plate].filter(Boolean).join(' · ') : 'Shop use'}</Fact>
          {r.note && <Fact k="Note">{r.note}</Fact>}
        </dl>
        <RequestStepper status={r.status} className="mt-4" />
        {r.status === 'Declined' && <p className="mt-3 rounded-control bg-bad-bg p-3 text-[14px] leading-5 text-bad-ink">Declined. {r.note}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Part request actions">
          <Button variant="primary" leftIcon={CheckCircle} disabled={r.status !== 'Requested'} onClick={a.onApprove}>Approve</Button>
          <Button variant="secondary" leftIcon={Package} disabled={r.status !== 'Approved'} onClick={a.onReady}>Ready at stockroom</Button>
          <Button variant="secondary" disabled={r.status !== 'Requested' && r.status !== 'Approved'} onClick={a.onDecline}>Decline...</Button>
        </div>
        <p className="mt-2 text-[13px] leading-5 text-muted">{r.status === 'Requested' ? 'Approve first. Ready at stockroom unlocks after that.' : r.status === 'Approved' ? 'Tell the stockroom, then mark it Ready. The mechanic collects it.' : r.status === 'Ready at stockroom' ? 'Waiting for the mechanic to collect it.' : r.status === 'Collected' ? 'Collected by the mechanic.' : 'The mechanic has been told why.'}</p>
        <p className="mt-2 border-t border-rule pt-2 text-[12px] leading-4 text-muted">Inventory: not connected here yet. When the stockroom hands the part over, Inventory should deduct it and set Collected (needs a part-request endpoint).</p>
      </Section>
    );
  }
  if (item.kind === 'problem' && item.problem) {
    const p = item.problem; const q = p.quote;
    return (
      <Section title="Found a problem">
        <p className="mt-3 whitespace-pre-line break-words text-[14px] leading-6">{p.text}</p>
        <Photos n={p.photos} />
        {!p.status && (
          <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Problem actions">
            <Button variant="primary" onClick={a.onQuote}>Quote extra work...</Button>
            <Button variant="secondary" onClick={a.onDismiss}>Dismiss...</Button>
          </div>
        )}
        {p.status === 'quoted' && q && (
          <div className="mt-4 rounded-control border border-control p-3">
            <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium">Quote {pesos(q.amount)}<span className="inline-flex items-center gap-1 rounded-chip bg-raised-2 px-2 text-[12px] font-medium">{q.customer === 'approved' ? <><CheckCircle size={12} weight="fill" aria-hidden className="text-ok" />Approved by customer</> : q.customer === 'declined' ? <><XCircle size={12} weight="fill" aria-hidden className="text-bad" />Declined by customer</> : <><Hourglass size={12} aria-hidden />Waiting for customer</>}</span></p>
            <p className="mt-1 break-words text-[13px] leading-5 text-muted">{q.note}</p>
            {item.quotePartsLabel && <p className="mt-1 text-[13px] text-muted">Parts: {item.quotePartsLabel}</p>}
            {job && <p className="mt-2 text-[13px]"><a href="#today" onClick={(e) => { e.preventDefault(); a.onOpenService(job); }} className="font-semibold text-accent underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">View the service's quotation</a></p>}
            {q.customer === 'waiting' && (
              <div role="group" aria-label="Studio only: simulate the customer's answer" className="mt-3 flex flex-wrap items-center gap-2 border-t border-rule pt-3">
                <span className="mr-auto text-[12px] text-muted">Studio only: the customer answers by SMS link. Try both answers.</span>
                <Button variant="secondary" onClick={() => a.onCustomerAnswer('approved')}>Customer approves</Button>
                <Button variant="secondary" onClick={() => a.onCustomerAnswer('declined')}>Customer declines</Button>
              </div>
            )}
          </div>
        )}
        {p.status === 'dismissed' && <p className="mt-4 text-[14px] text-muted">Dismissed{p.dismissReason ? `: ${p.dismissReason}` : '. No reason given.'}</p>}
      </Section>
    );
  }
  if (item.kind === 'question' && item.msg) {
    const m = item.msg;
    return (
      <Section title="Question">
        <p className="mt-3 whitespace-pre-line break-words text-[14px] leading-6">{m.text}</p>
        {m.answered ? <p className="mt-3 flex items-center gap-2 text-[14px] text-muted"><CheckCircle size={18} weight="fill" aria-hidden className="text-ok" />Answered</p> : (
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Answer the question">
            {['Yes', 'No', 'Call me'].map((x) => <Button key={x} variant={x === 'Call me' ? 'secondary' : 'primary'} aria-label={`Answer ${x}`} onClick={() => a.onAnswer(x)}>{x}</Button>)}
            <span className="self-center text-[13px] text-muted">or write an answer in the thread below.</span>
          </div>
        )}
      </Section>
    );
  }
  if (item.kind === 'customer') {
    return (
      <Section title="Customer message">
        <p className="mt-3 whitespace-pre-line break-words text-[14px] leading-6">{item.preview}</p>
        <p className="mt-3 text-[13px] text-muted">{item.status === 'Answered' ? 'You answered. The customer sees your reply on their tracking page.' : 'Sent from the customer tracking page. Reply below; the customer sees it there.'}</p>
      </Section>
    );
  }
  return (
    <Section title="Note from the mechanic">
      <p className="mt-3 whitespace-pre-line break-words text-[14px] leading-6">{item.preview}</p>
      <Photos n={item.photos ?? 0} />
      <p className="mt-3 text-[13px] text-muted">Nothing to decide. Reply below if you want to answer.</p>
    </Section>
  );
}
