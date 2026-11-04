import { useRef, useState, type ReactNode } from 'react';
import { Button, toast } from '../index';
import { NOW, type Job } from './sms/data';
import { WizardDataProvider, seedWizardData, type WizardData } from './sms/wizardData';
import { NEXT_NUMBER } from './sms/scheduleData';
import { hmin, longDay, type Booking, type CalItem, type Slot } from './sms/scheduleModel';
import { docFromJob, jobFieldsOf, vehicleIdOf, newJob, nextQuoteNo, quoteNoOf, type WizardAction, type WizardDraft } from './sms/wizardModel';
import { NewServiceWizard } from './NewServiceWizard';
import type { BlockId } from './WizardSummary';
import { QuotationModal } from './QuotationDoc';
import { Modal } from './Modal';
import { LiveTrackingLink as TrackingLink } from './sms/LiveTrackingLink';

export type FlowState =
  | { kind: 'new'; slot?: Slot; customerId?: string; vehicleId?: string; plate?: string; notes?: string; startStep?: 1 | 2 | 3; initialEdit?: BlockId; initialDraft?: Partial<WizardDraft>; initialPreview?: boolean }
  | { kind: 'book' | 'edit'; jobId: string; startStep?: 1 | 2 | 3; initialEdit?: BlockId; initialPreview?: boolean }
  | { kind: 'view'; jobId: string }
  | null;

export interface FlowHost {
  /** How many services this page has added so far (ids and numbers continue from it). */
  count: number;
  items: CalItem[];
  find: (id: string) => Job | undefined;
  add: (job: Job, booking: Booking) => void;
  patch: (id: string, p: Partial<Job>, booking?: Booking) => void;
  remove: (id: string) => void;
  /** After a new or booked service: jump the calendar to its day and flash the card. */
  after?: (date: string, id: string, customerId: string) => void;
  initial?: FlowState;
  /** Real customers, catalogue, stock, assignees and shop details. Absent: the prototype's sample data (Storybook). */
  data?: WizardData;
  /** The next free job order number (pure: read on every submit; the host advances it when add/patch runs). Absent: the sample sequence. */
  nextJobNo?: () => string;
  /** The next free quotation number (pure: also read on render). Absent: the sample sequence from `count`. */
  nextQuoteNo?: () => string;
}

/**
 * useServiceFlow (NEW): one place for the New service wizard and the quotation document, shared by Today, Services and Customers.
 * openNew (any "New service" button, a calendar slot, a customer, an inquiry) - viewQuote - bookQuote ("Customer agreed - Book it") - editQuote.
 * A parked quotation is a Job with status QUOTATION and a QT- number; booking it patches the SAME record to TODO with the next JO- number and keeps the quote number.
 */
export function useServiceFlow(host: FlowHost) {
  const data = host.data ?? seedWizardData();
  const quoteNoNext = (n: number) => host.nextQuoteNo?.() ?? nextQuoteNo(n);
  const [state, setState] = useState<FlowState>(host.initial ?? null);
  /** After a service is booked: the confirmation with its customer tracking link. */
  const [booked, setBooked] = useState<Pick<Job, 'id' | 'number' | 'customerId' | 'vehicleId'> | null>(null);
  const joSeq = useRef(0);
  const close = () => setState(null);
  const openNew = (init: Omit<Extract<FlowState, { kind: 'new' }>, 'kind'> = {}) => setState({ kind: 'new', ...init });
  const viewQuote = (j: Job) => setState({ kind: 'view', jobId: j.id });
  const bookQuote = (j: Job) => setState({ kind: 'book', jobId: j.id });
  const editQuote = (j: Job) => setState({ kind: 'edit', jobId: j.id });

  const nextJo = () => host.nextJobNo?.() ?? `JO-0${NEXT_NUMBER + host.count + joSeq.current++}`;

  const submitNew = (d: WizardDraft, action: WizardAction) => {
    const n = host.count;
    const id = `n${n + 1}`;
    const job = action === 'book' ? newJob(id, nextJo(), d, 'book') : newJob(id, quoteNoNext(n), d, 'quote', quoteNoNext(n));
    const known = data.customers.find((c) => c.id === d.customer!.id);
    if (!known || known.vehicles.length !== d.customer!.vehicles.length) data.onSaveCustomer?.(d.customer!); // a customer or car added in the wizard goes to the host
    const booking = { date: d.date, start: d.start, dur: d.dur };
    host.add(job, booking);
    host.after?.(d.date, id, d.customer!.id);
    close();
    if (action === 'book') setBooked({ id: job.id, number: job.number, customerId: job.customerId, vehicleId: job.vehicleId });
    toast.undo(`${action === 'book' ? `Booked ${job.number}` : `Quotation ${job.number} saved, waiting for the customer`}: ${d.customer!.name}, ${longDay(d.date)} ${hmin(d.start)}.`, () => host.remove(id));
  };

  const submitQuote = (job: Job, d: WizardDraft, action: WizardAction) => {
    const booking = { date: d.date, start: d.start, dur: d.dur };
    const prev: Partial<Job> = { number: job.number, status: job.status, quoteParked: job.quoteParked, services: job.services, parts: job.parts, remarks: job.remarks, promisedAt: job.promisedAt, assigneeId: job.assigneeId, complaint: job.complaint, customerId: job.customerId, vehicleId: job.vehicleId, quoteNo: job.quoteNo, mileageIn: job.mileageIn };
    const fields = jobFieldsOf(d, action);
    const qn = quoteNoOf(job);
    if (action === 'book') {
      const number = nextJo();
      host.patch(job.id, { ...fields, number, quoteNo: qn, quoteParked: false, statusSince: NOW }, booking);
      setBooked({ id: job.id, number, customerId: d.customer!.id, vehicleId: vehicleIdOf(d) });
      toast.undo(`${qn} is now ${number}: booked for ${d.customer!.name}, ${longDay(d.date)} ${hmin(d.start)}.`, () => host.patch(job.id, prev));
    } else {
      host.patch(job.id, { ...fields, status: job.status, quoteParked: true, quoteNo: qn }, booking);
      toast.undo(`Quotation ${qn} updated.`, () => host.patch(job.id, prev));
    }
    host.after?.(d.date, job.id, d.customer!.id);
    close();
  };

  let node: ReactNode = null;
  if (state?.kind === 'new') {
    const c = state.customerId ? data.customers.find((x) => x.id === state.customerId) ?? null : null;
    const k = `${state.customerId}${state.plate}${state.slot?.date}${state.slot?.start}${state.slot?.dur}${state.notes}`;
    node = <NewServiceWizard key={k} slot={state.slot} customer={c} vehicleId={state.vehicleId} plate={state.plate} notes={state.notes} items={host.items} quoteNo={quoteNoNext(host.count)}
      startStep={state.startStep} initialEdit={state.initialEdit} initialDraft={state.initialDraft} initialPreview={state.initialPreview} onSubmit={submitNew} onClose={close} />;
  } else if (state && (state.kind === 'book' || state.kind === 'edit')) {
    const job = host.find(state.jobId);
    if (job) node = <NewServiceWizard key={`${state.kind}${job.id}`} quote={job} quoteNo={quoteNoOf(job)} editOnly={state.kind === 'edit'} items={host.items} startStep={state.startStep ?? 2} initialEdit={state.initialEdit}
      initialPreview={state.initialPreview} onSubmit={(d, a) => submitQuote(job, d, state.kind === 'book' ? a : 'quote')} onClose={close} />;
  } else if (state?.kind === 'view') {
    const job = host.find(state.jobId);
    if (job) {
      const parked = job.status === 'QUOTATION' || job.status === 'FOR_APPROVAL';
      node = <QuotationModal doc={docFromJob(job, data)} onClose={close} note={parked ? undefined : `Kept for reference. Booked as ${job.number}.`}
        actions={parked ? { onBook: () => bookQuote(job), onEdit: () => editQuote(job) } : null} />;
    }
  }
  const bookedNode = booked ? (
    <Modal open onOpenChange={(o) => !o && setBooked(null)} size="md" title={`${booked.number} is booked`} description="Share the tracking link so the customer can follow this service without logging in."
      footer={<Button variant="primary" onClick={() => setBooked(null)}>Done</Button>}>
      <TrackingLink job={booked} />
    </Modal>
  ) : null;
  node = <WizardDataProvider data={data}>{node}{bookedNode}</WizardDataProvider>;
  const slot = state?.kind === 'new' ? state.slot ?? null : null;
  return { state, openNew, viewQuote, bookQuote, editQuote, close, node, slot };
}
