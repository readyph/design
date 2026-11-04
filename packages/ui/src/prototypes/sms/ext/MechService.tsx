import { useMemo, useState } from 'react';
import { ChatCircleText, HourglassMedium } from '@phosphor-icons/react';
import { Button, Textarea, cn } from '../../../index';
import { TODAY, customerOf, onHandHere, productOf, vehicleOf, type Job, type Mechanic, type PendingReason } from '../data';
import { addNote, markDone, pauseWork, propose, resumeWork, sendMessage, startWork, tickService } from '../mechActions';
import { feedOf, itemParts, plateOf, serviceTitle, shortName, stockWord, waitWord, type MechState } from '../mechModel';
import { Modal } from './Modal';
import { PersonAvatar } from './avatarTone';
import { CheckMark, MechSection } from './MechFrame';
import { NotifyItem } from './NotifyItem';
import { MechFeed } from './MechFeed';
import { MechParts } from './MechParts';
import { CalCard, type PlacedItem } from './CalCard';
import { VIEW } from './MechHome';
import { staffView, stepOfJob } from './mechCardView';

export type ServiceDialog = null | 'pause' | 'done' | 'ask';

const REASONS: { id: PendingReason; label: string }[] = [
  { id: 'WAITING_FOR_PARTS', label: 'I am waiting for a part' },
  { id: 'WAITING_FOR_CUSTOMER', label: 'I am waiting for the customer' },
  { id: 'WAITING_FOR_ANOTHER_MECHANIC', label: 'I am waiting for another mechanic' },
  { id: 'OTHER', label: 'Something else' },
];

/** The primary actions of the service screen (Start work / Mark done + Pause / Start again): the LAST block of the page content, in normal flow (not pinned, not floating). */
function ServiceActions({ job, setDialog, flash, onNeedPart }: { job: Job; setDialog: (d: ServiceDialog) => void; flash: (m: string) => void; onNeedPart: (productId?: string) => void }) {
  const stuck = job.status === 'PENDING' && job.pendingReason === 'WAITING_FOR_PARTS' && job.parts.some((l) => l.qty - l.issued > onHandHere(productOf(l.productId)));
  if (job.status === 'TODO') return <Button variant="primary" fullWidth onClick={() => { startWork(job); flash('Good. Tap a service item when it is done.'); }}>Start work</Button>;
  if (job.status === 'IN_PROGRESS') {
    return (
      <div className="grid gap-2">
        <Button variant="primary" fullWidth onClick={() => setDialog('done')}>Mark done</Button>
        <Button variant="secondary" fullWidth onClick={() => setDialog('pause')}>Pause</Button>
      </div>
    );
  }
  if (job.status === 'PENDING') {
    return stuck
      ? <Button variant="primary" fullWidth onClick={() => onNeedPart()}>Ask for the part</Button>
      : <Button variant="primary" fullWidth onClick={() => { resumeWork(job); flash('Back to work.'); }}>Start again</Button>;
  }
  return <p className="py-2 text-[14px] text-muted">Done. Your manager has it now.</p>;
}

export function MechServiceBar(props: Parameters<typeof ServiceActions>[0]) {
  return <section aria-label="Actions" className="mt-6"><ServiceActions {...props} /></section>;
}

const stockShort = (productId: string) => { const w = stockWord(productOf(productId)).word; return w.startsWith('In stock') ? 'in stock' : w.startsWith('Low') ? 'low stock' : w.includes('on order') ? 'on order' : 'out of stock'; };

/** One service item as a NotifyItem row (flat, ruled by spacing): the check circle is the marker, tap anywhere to mark done; parts it needs under the title; state as a quiet chip. */
export function ServiceItemRow({ name, done, readOnly, parts, onToggle }: { name: string; done: boolean; readOnly: boolean; parts: { productId: string; qty: number; issued: number }[]; onToggle: () => void }) {
  const needs = parts.map((p) => `${shortName(productOf(p.productId))} x${p.qty} - ${p.issued >= p.qty ? 'taken' : stockShort(p.productId)}`);
  return (
    <NotifyItem
      leading={<span className="pt-px"><CheckMark on={done} /></span>} title={name} wrap detail={needs.length ? `Needs: ${needs.join(', ')}` : undefined}
      tag={done ? 'Done' : 'To do'} tagTone={done ? 'ok' : 'neutral'} dense checked={done} disabled={readOnly} onOpen={onToggle} className={done ? 'opacity-70' : undefined}
    />
  );
}

/** Customer and car, at the top of the screen so the mechanic knows who it is for. No phone number and no call button: questions go through "Ask the manager". */
export function MechCustomer({ job }: { job: Job }) {
  const c = customerOf(job); const v = vehicleOf(job);
  const initials = c.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <MechSection title="Customer">
      <div>
        <div className="flex items-center gap-3">
          <PersonAvatar personId={c.id} name={c.name} initials={initials} size={32} />
          <p className="min-w-0 flex-1 truncate text-[14px] font-medium leading-5">{c.name}</p>
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[14px] leading-6">
          <dt className="text-muted">Plate</dt><dd className="font-mono font-semibold">{v.plate}</dd>
          <dt className="text-muted">Car</dt><dd>{v.make} {v.model}</dd>
          <dt className="text-muted">Year</dt><dd>{v.year}</dd>
          {v.colour && <><dt className="text-muted">Colour</dt><dd>{v.colour}</dd></>}
        </dl>
      </div>
    </MechSection>
  );
}

/** What the customer asked for, in words: the service name, the complaint, the front desk's remarks. */
export function MechAsk({ job }: { job: Job }) {
  return (
    <MechSection title="Service">
      <div>
        <p className="break-words text-[14px] font-medium leading-5">{serviceTitle(job)}</p>
        {job.complaint && <p className="mt-2 break-words text-[14px] leading-6"><span className="block text-[13px] text-muted">Customer asked for</span>{job.complaint}</p>}
        {job.remarks && <p className="mt-2 break-words text-[14px] leading-6"><span className="block text-[13px] text-muted">Notes from the front desk</span>{job.remarks}</p>}
      </div>
    </MechSection>
  );
}

/** The service summary at the top of the screen: the SAME staff card as the list (shared CalCard), as a static full-width block (no tap, no time position). */
export function ServiceHeader({ job, s }: { job: Job; s: MechState }) {
  const step = stepOfJob(job);
  return (
    <CalCard
      placed={{ job, date: TODAY, start: 0, end: 60, lane: 0, lanes: 1 } as PlacedItem}
      selected={false} flash={false} dim={false} showMech={false} onOpen={() => {}} inline
      view={{ ...VIEW[step], staff: staffView(s, job, step) }}
    />
  );
}

export function MechServiceBody({ job, s, me, flash, onNeedPart, dialog, setDialog, onSentDone }: {
  job: Job; s: MechState; me: Mechanic; flash: (m: string) => void; onNeedPart: (productId?: string) => void; dialog: ServiceDialog; setDialog: (d: ServiceDialog) => void; onSentDone: () => void;
}) {
  const readOnly = job.status === 'FOR_PICKUP' || job.status === 'COMPLETED';
  const done = job.services.filter((x) => x.done).length;
  const posts = useMemo(() => feedOf(s, job), [s, job]);
  const parts = useMemo(() => itemParts(job), [job]);
    const [ask, setAsk] = useState('');
  const [reason, setReason] = useState<PendingReason>('WAITING_FOR_PARTS');
  const left = job.services.length - done;

  return (
    <>
      <div data-detail-sections className="flex flex-col gap-10 [&>section]:mt-0">
      <ServiceHeader job={job} s={s} />
      <MechCustomer job={job} />
      {(!readOnly || job.status === 'PENDING') && <div data-ask>
        {!readOnly && <div><Button variant="secondary" fullWidth leftIcon={ChatCircleText} onClick={() => setDialog('ask')}>Ask the manager</Button></div>}
      {job.status === 'PENDING' && <p className="mt-3 flex items-start gap-3 rounded-control bg-warn-bg p-3 text-[14px] leading-5"><HourglassMedium size={20} weight="fill" aria-hidden className="flex-none text-warn-ink" />{waitWord(job)}.</p>}
      </div>}

      <MechAsk job={job} />

      <MechSection title="Service items" hint={`${done} of ${job.services.length} done`}>
        <ul className="-mx-4">{job.services.map((sv, i) => <ServiceItemRow key={i} name={sv.name} done={sv.done} readOnly={readOnly} parts={parts[i] ?? []} onToggle={() => tickService(job, i)} />)}</ul>
        {!readOnly && job.status === 'TODO' && <p className="pt-1 text-[13px] text-muted">Tap a service item when it is done.</p>}
      </MechSection>

      <MechParts job={job} s={s} readOnly={readOnly} onRequest={onNeedPart} />

      <MechFeed posts={posts} me={me} readOnly={readOnly} onPost={(t, n, isProblem) => (isProblem ? propose(job.id, me.id, t, n) : addNote(job.id, t, n))} flash={flash} />

      <MechServiceBar job={job} setDialog={setDialog} onNeedPart={onNeedPart} flash={flash} />
      </div>


      <Modal open={dialog === 'pause'} onOpenChange={(o) => !o && setDialog(null)} title="Why are you stopping?" size="sm"
        footer={<><Button variant="secondary" onClick={() => setDialog(null)}>Not now</Button><Button variant="primary" onClick={() => { pauseWork(job, reason, ''); setDialog(null); flash('Paused. Your manager can see why.'); }}>Pause</Button></>}>
        <div role="radiogroup" aria-label="Reason" className="grid">
          {REASONS.map((r) => <button key={r.id} type="button" role="radio" aria-checked={reason === r.id} onClick={() => setReason(r.id)} className="flex min-h-12 items-center gap-3 border-b border-rule py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            <span aria-hidden className={cn('grid size-5 flex-none place-items-center rounded-full border-2', reason === r.id ? 'border-accent' : 'border-control')}>{reason === r.id && <span className="size-2.5 rounded-full bg-accent" />}</span>
            <span className="text-[14px]">{r.label}</span></button>)}
        </div>
      </Modal>

      <Modal open={dialog === 'done'} onOpenChange={(o) => !o && setDialog(null)} title="Is this service finished?" size="confirm"
        footer={<><Button variant="secondary" onClick={() => setDialog(null)}>Not yet</Button><Button variant="primary" onClick={() => { markDone(job); setDialog(null); flash(`${plateOf(job)} is with your manager.`); onSentDone(); }}>Yes, mark done</Button></>}>
        <p className="text-[14px] leading-6">{left > 0 ? `${left} service item${left > 1 ? 's are' : ' is'} not marked done. They will count as done.` : 'All service items are done.'} Your manager will call the customer.</p>
      </Modal>

      <Modal open={dialog === 'ask'} onOpenChange={(o) => !o && setDialog(null)} title="Ask your manager" size="sm"
        footer={<><Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button variant="primary" disabled={!ask.trim()} onClick={() => { sendMessage(job.id, me.id, ask.trim()); setAsk(''); setDialog(null); flash('Sent to your manager.'); }}>Send to manager</Button></>}>
        <Textarea label="Your question" rows={3} value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="For example, can I use the old gasket?" size="large" />
      </Modal>
    </>
  );
}
