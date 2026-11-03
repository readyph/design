import { useState } from 'react';
import { Toaster, toast } from '../index';
import { NewServiceWizard } from './NewServiceWizard';
import { QuotationModal } from './QuotationDoc';
import type { BlockId } from './WizardSummary';
import { NOW, customers, jobs, type Customer, type Job } from './sms/data';
import { NEXT_NUMBER } from './sms/scheduleData';
import { hmin, longDay, type Slot } from './sms/scheduleModel';
import { docFromJob, newJob, nextQuoteNo, quoteNoOf, type WizardAction, type WizardDraft } from './sms/wizardModel';

export type WizardFlow =
  | { kind: 'new'; slot?: Slot; customerId?: string; vehicleId?: string; plate?: string; notes?: string; startStep?: 1 | 2 | 3; initialEdit?: BlockId; initialDraft?: Partial<WizardDraft>; initialPreview?: boolean }
  | { kind: 'book' | 'edit'; jobId: string; startStep?: 1 | 2 | 3; initialEdit?: BlockId; initialPreview?: boolean }
  | { kind: 'view'; jobId: string };

export interface NewServiceWizardPageProps {
  /** Which wizard opens, and how (story helper). */
  initialFlow?: WizardFlow;
}

/**
 * [For Review] RDY-528. Page host for the New service wizard: opens the wizard (new service, or a parked quotation to view, book or edit) and runs
 * Save as quotation / Book service / Book it for real (next JO number, QT number, Undo toast). The host Services page and useServiceFlow are separate tickets (RDY-522, RDY-555).
 */
export function NewServiceWizardPage({ initialFlow = { kind: 'new' } }: NewServiceWizardPageProps) {
  const [state, setState] = useState<WizardFlow | null>(initialFlow);
  const [count, setCount] = useState(0);
  const [patches, setPatches] = useState<Record<string, Partial<Job>>>({});
  const close = () => setState(null);
  const find = (id: string): Job | undefined => { const j = jobs.find((x) => x.id === id); return j ? { ...j, ...patches[id] } : undefined; };
  const nextJo = () => `JO-0${NEXT_NUMBER + count}`;

  const submitNew = (d: WizardDraft, action: WizardAction) => {
    const id = `n${count + 1}`;
    const job = action === 'book' ? newJob(id, nextJo(), d, 'book') : newJob(id, nextQuoteNo(count), d, 'quote', nextQuoteNo(count));
    if (!customers.some((c) => c.id === d.customer!.id)) customers.push(d.customer as Customer);
    setCount(count + 1);
    close();
    toast.undo(`${action === 'book' ? `Booked ${job.number}` : `Quotation ${job.number} saved, waiting for the customer`}: ${d.customer!.name}, ${longDay(d.date)} ${hmin(d.start)}.`, () => { setCount(count); setState(initialFlow); });
  };

  const submitQuote = (job: Job, d: WizardDraft, action: WizardAction) => {
    const qn = quoteNoOf(job);
    if (action === 'book') {
      const number = nextJo();
      setPatches({ ...patches, [job.id]: { number, quoteNo: qn, quoteParked: false, statusSince: NOW } });
      toast.undo(`${qn} is now ${number}: booked for ${d.customer!.name}, ${longDay(d.date)} ${hmin(d.start)}.`, () => { setPatches({ ...patches }); });
    } else {
      toast.undo(`Quotation ${qn} updated.`, () => undefined);
    }
    close();
  };

  let node = null;
  if (state?.kind === 'new') {
    const c = state.customerId ? customers.find((x) => x.id === state.customerId) ?? null : null;
    node = <NewServiceWizard key={`${state.customerId}${state.plate}${state.slot?.date}${state.slot?.start}${state.slot?.dur}${state.notes}`} slot={state.slot} customer={c} vehicleId={state.vehicleId} plate={state.plate} notes={state.notes} quoteNo={nextQuoteNo(count)}
      startStep={state.startStep} initialEdit={state.initialEdit} initialDraft={state.initialDraft} initialPreview={state.initialPreview} onSubmit={submitNew} onClose={close} />;
  } else if (state && (state.kind === 'book' || state.kind === 'edit')) {
    const job = find(state.jobId);
    const kind = state.kind;
    if (job) node = <NewServiceWizard key={`${kind}${job.id}`} quote={job} quoteNo={quoteNoOf(job)} editOnly={kind === 'edit'} startStep={state.startStep ?? 2} initialEdit={state.initialEdit}
      initialPreview={state.initialPreview} onSubmit={(d, a) => submitQuote(job, d, kind === 'book' ? a : 'quote')} onClose={close} />;
  } else if (state?.kind === 'view') {
    const job = find(state.jobId);
    if (job) {
      const parked = job.status === 'QUOTATION' || job.status === 'FOR_APPROVAL';
      node = <QuotationModal doc={docFromJob(job)} onClose={close} note={parked ? undefined : `Kept for reference. Booked as ${job.number}.`}
        actions={parked ? { onBook: () => setState({ kind: 'book', jobId: job.id }), onEdit: () => setState({ kind: 'edit', jobId: job.id }) } : null} />;
    }
  }
  return <>{node}<Toaster /></>;
}
