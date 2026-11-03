import { useState, type ReactNode } from 'react';
import { ArrowSquareOut, Phone, X } from '@phosphor-icons/react';
import { Badge } from './Badge';
import { BackLink } from './ActionLink';
import { Button } from './Button';
import { ErrorBlock } from './ErrorBlock';
import { FactsLine, Fact } from './FactsLine';
import { LedaNote } from './LedaNote';
import { LedaProposal } from './LedaProposal';
import { Select } from './Select';
import { StockerFacts } from './StockerRow';
import { cn } from '../utils/cn';
import { branch, customerOf, ledaProposals, loadError, mechanics, peso, productOf, type Job, type LedaProposalData } from './sms/data';
import { dayWord, hm, money, nextAction, reasonOf, serviceTitle, type NextAction } from './sms/floorModel';
import { PartChip, type PartAction } from './PartChip';
import { PersonAvatar } from './avatarTone';
import { todayEnv, viewOf } from './sms/floorModel';
import { hasQuotation, isQuote, quoteNoOf } from './sms/wizardModel';
import { docFromJob } from './sms/wizardModel';
import { longDay } from './sms/scheduleModel';

const STATUS_LABEL: Record<Job['status'], string> = {
  QUOTATION: 'Quotation', FOR_APPROVAL: 'For approval', TODO: 'To-do', IN_PROGRESS: 'In progress', PENDING: 'Pending', FOR_PICKUP: 'For pick-up', COMPLETED: 'Completed',
};
const REASON_WORD = { OVERDUE: 'Past promised time', PARTS: 'Waiting on parts', APPROVAL: 'Waiting for customer', PICKUP_UNPAID: 'Ready, not paid' } as const;

export interface InspectorProps {
  job: Job | null;
  /** Inventory link down: the parts block shows an inline error. */
  inventoryDown?: boolean;
  /** Proposals still open (id -> state). Confirming reports back so the page can write and toast. */
  proposalState: Record<string, 'waiting' | 'writing' | 'done' | 'discarded'>;
  onConfirmProposal: (p: LedaProposalData) => void;
  onDiscardProposal: (p: LedaProposalData) => void;
  onAction: (job: Job, a: NextAction) => void;
  onAssign: (job: Job, mechanicId: string) => void;
  onResolve: (job: Job, action: PartAction, productId: string) => void;
  /** Quotation: open the document, "Customer agreed - Book it" (wizard at Job order), Edit quote. */
  onViewQuote?: (job: Job) => void;
  onBookQuote?: (job: Job) => void;
  onEditQuote?: (job: Job) => void;
  onClose?: () => void;
  /** Phone: the inspector is a pushed page and gets a back link instead of a close button. */
  asPage?: boolean;
  /** Phone back link text (default Today). */
  backLabel?: string;
  onBack?: () => void;
  /** Floor read shown when nothing is selected. */
  floorRead?: ReactNode;
  floorProposalIds?: string[];
  /** Slot for the customer tracking link block (TrackingLink, RDY-553). Shown under "Customer tracking link" on non-quotation services. */
  trackingLink?: ReactNode;
  className?: string;
}

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="border-t border-rule px-4 py-3">
      <div className="mb-2 flex items-center justify-between"><h3 className="text-[13px] font-semibold">{title}</h3>{aside}</div>
      {children}
    </section>
  );
}

function ProposalCard({ p, state, onConfirm, onDiscard }: { p: LedaProposalData; state: 'waiting' | 'writing' | 'done' | 'discarded'; onConfirm: () => void; onDiscard: () => void }) {
  return (
    <LedaProposal
      id={p.id.toUpperCase()}
      title={p.title}
      state={state}
      writes={p.writes}
      cannot={p.cannot}
      confirmLabel={p.confirmLabel}
      onConfirm={onConfirm}
      onDiscard={onDiscard}
      after={`${p.confirmLabel}: done.`}
      doneAt="10:20"
    />
  );
}

/**
 * Studio-only Inspector (NEW): the always-present right column. Header, facts, services, parts as PartChips,
 * actions with one primary, then Leda scoped to the selection. With nothing selected it holds Leda's floor read.
 */
export function Inspector({
  job, inventoryDown, proposalState, onConfirmProposal, onDiscardProposal, onAction, onAssign, onResolve, onViewQuote, onBookQuote, onEditQuote, onClose, asPage, onBack, backLabel = 'Today', floorRead, floorProposalIds = ['lp2'], trackingLink, className,
}: InspectorProps) {
  const [retrying, setRetrying] = useState(false);
  if (!job) {
    const ps = ledaProposals.filter((p) => floorProposalIds.includes(p.id));
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <div className="px-4 py-3"><h2 className="text-[15px] font-semibold">The floor</h2><p className="text-[13px] text-muted">Pick a service on a lane to open it here.</p></div>
        <Section title="Leda on the floor">
          <LedaNote byline="Leda · 10:20">{floorRead}</LedaNote>
          <div className="mt-3 space-y-3">{ps.map((p) => <ProposalCard key={p.id} p={p} state={proposalState[p.id] ?? 'waiting'} onConfirm={() => onConfirmProposal(p)} onDiscard={() => onDiscardProposal(p)} />)}</div>
        </Section>
      </div>
    );
  }
  const v = viewOf(job);
  const c = customerOf(job);
  const reason = reasonOf(job);
  const act = nextAction(job);
  const props = ledaProposals.filter((p) => p.jobIds.includes(job.id));
  const bal = money.balance(job);
  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="px-4 pb-3 pt-3">
        {asPage && <BackLink onClick={onBack} className="mb-2">{backLabel}</BackLink>}
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><span className="font-mono text-[13px]">{job.number}</span><Badge tone={reason ? 'warning' : 'neutral'}>{STATUS_LABEL[job.status]}</Badge></div>
            <h2 title={serviceTitle(job)} className="mt-1 line-clamp-3 break-words text-[16px] font-semibold leading-6">{serviceTitle(job)}</h2>
            <p className="break-words text-[13px] text-muted">{v.vehicle} · <span className="font-mono">{v.plate}</span> · {c.name}</p>
          </div>
          {!asPage && onClose && <button type="button" aria-label="Close service" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-control text-muted hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><X size={16} aria-hidden /></button>}
        </div>
        <FactsLine className="mt-2">
          <Fact tone={reason === 'OVERDUE' || reason === 'PARTS' ? 'bad' : 'default'} value={job.promisedAt ? dayWord(job.promisedAt) : 'not set'}>Promised</Fact>
          {reason && <Fact tone="warn" value={REASON_WORD[reason]}>Stuck:</Fact>}
          {bal > 0 && job.status !== 'QUOTATION' && <Fact value={peso(bal)}>Balance</Fact>}
        </FactsLine>
        <p className="mt-2 text-[13px] text-muted">{job.complaint}{job.pendingNote ? ` · ${job.pendingNote}` : ''}</p>
      </div>

      <Section title="Parts" aside={<span className="text-[12px] text-muted">from {branch.inventory.platform}</span>}>
        {inventoryDown ? (
          <ErrorBlock thing={loadError.block} lastLoaded={hm(loadError.lastLoaded)} onRetry={() => { setRetrying(true); setTimeout(() => setRetrying(false), 800); }} retrying={retrying} />
        ) : job.parts.length === 0 ? (
          <p className="text-[13px] text-muted">No parts on this service.</p>
        ) : (
          <ul className="space-y-1.5">
            {job.parts.map((l) => {
              const pr = productOf(l.productId);
              return <li key={l.productId} className="flex items-center gap-2"><span className="w-8 flex-none text-[13px] tabular-nums text-muted">{l.qty} x</span><PartChip product={pr} env={todayEnv} inventoryName={branch.inventory.platform} readOnly={job.status === 'FOR_PICKUP'} onResolve={(a) => onResolve(job, a, pr.id)} /></li>;
            })}
          </ul>
        )}
      </Section>

      {props.length > 0 && (
        <Section title={`Leda on ${job.number}`}>
          <div className="space-y-3">{props.map((p) => <ProposalCard key={p.id} p={p} state={proposalState[p.id] ?? 'waiting'} onConfirm={() => onConfirmProposal(p)} onDiscard={() => onDiscardProposal(p)} />)}</div>
        </Section>
      )}
      {props.length === 0 && (
        <Section title={`Leda on ${job.number}`}><LedaNote>Nothing to fix here. {job.status === 'IN_PROGRESS' ? 'It is on track for its promised time.' : 'Ask me anything about this service.'}</LedaNote></Section>
      )}

      <Section title="Work">
        <StockerFacts
          items={[
            { label: 'Mechanic', value: (
              <span className="flex items-center gap-2">
                {(() => { const am = mechanics.find((m) => m.id === job.assigneeId); return am ? <PersonAvatar personId={am.id} name={am.name} initials={am.initials} size={24} decorative /> : null; })()}
                <Select size="sm" value={job.assigneeId ?? ''} placeholder="Not yet assigned" onValueChange={(id) => onAssign(job, id)} aria-label="Mechanic"
                  options={mechanics.map((m) => ({ value: m.id, label: `${m.short} · ${m.bay}` }))} />
              </span>
            ) },
            { label: 'Customer', value: <a className="inline-flex items-center gap-1 text-accent underline" href={`tel:${c.phone.replace(/\s/g, '')}`}><Phone size={14} aria-hidden />{c.phone}</a> },
            { label: 'Total', value: <span className="tabular-nums">{peso(money.total(job))} <span className="text-muted">· paid {peso(money.paid(job))}</span></span> },
          ]}
        />
        <ul className="mt-2 divide-y divide-rule border-y border-rule">
          {job.services.map((s) => <li key={s.name} className="flex justify-between gap-3 py-1.5 text-[13px]"><span className={cn('min-w-0 break-words', s.done && 'text-muted line-through')}>{s.name}</span><span className="flex-none tabular-nums text-muted">{peso(s.price * s.qty)}</span></li>)}
        </ul>
      </Section>

      {hasQuotation(job) && (
        <Section title="Quotation" aside={<span className="font-mono text-[12px] text-muted">{quoteNoOf(job)}</span>}>
          <p className="text-[13px] text-muted">{isQuote(job) ? `Waiting for the customer. Valid until ${longDay(docFromJob(job).validUntil)}.` : `Kept for reference. Booked as ${job.number}.`}</p>
          <button type="button" onClick={() => onViewQuote?.(job)} className="mt-1 inline-flex min-h-8 items-center text-[13px] font-semibold text-accent underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">View quotation</button>
        </Section>
      )}

      {!isQuote(job) && (
        <Section title="Customer tracking link">{trackingLink}</Section>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-rule bg-surface px-4 py-3">
        {isQuote(job) && onBookQuote && <Button variant="primary" onClick={() => onBookQuote(job)} fullWidth={asPage}>Customer agreed - Book it</Button>}
        {isQuote(job) && onEditQuote && <Button variant="secondary" onClick={() => onEditQuote(job)}>Edit quote</Button>}
        {act && !(isQuote(job) && onBookQuote) && <Button variant="primary" onClick={() => onAction(job, act)} fullWidth={asPage}>{act.label}</Button>}
        {!isQuote(job) && !act?.pay && <Button variant="secondary" onClick={() => onAction(job, { label: 'Payment', to: {}, toast: '', pay: true })}>Payment</Button>}
        <Button variant="secondary" rightIcon={ArrowSquareOut}>Open full service</Button>
      </div>
    </div>
  );
}
