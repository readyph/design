import { useMemo, useRef, useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import type { Customer, Job } from './sms/data';
import { bookingOf, minutesFor, type CalItem, type Slot } from './sms/scheduleModel';
import { dirtyKey, docFromDraft, draftFromJob, emptyDraft, wizardMissing, type WizardAction, type WizardDraft } from './sms/wizardModel';
import { useWizardData } from './sms/wizardData';
import { useDirtyGuard } from './DirtyGuard';
import { PrintButton, QuotationDoc } from './QuotationDoc';
import { WizardStep1 } from './WizardStep1';
import { WizardStepper } from './WizardStepper';
import { WizardSummary, type BlockId } from './WizardSummary';

export interface NewServiceWizardProps {
  /** Calendar slot that was clicked or dragged: fills date, start and (when dragged) the length. */
  slot?: Slot | null;
  /** Start with this customer / car chosen (customer page, inquiry) or this search text (a plate). */
  customer?: Customer | null;
  vehicleId?: string;
  plate?: string;
  /** Pre-fills the concerns (an inquiry's text). */
  notes?: string;
  /** What is already booked, to warn when the mechanic is busy. */
  items?: CalItem[];
  /** A parked quotation being edited or booked: the wizard opens prefilled and the buttons say what happens to it. */
  quote?: Job | null;
  /** Number shown for the quotation (the next free one for a new draft). */
  quoteNo: string;
  /** Edit quote: the only final action is saving the changes. */
  editOnly?: boolean;
  /** 1 Services, 2 Review & confirm (3 is accepted as 2: the old Summary). */
  startStep?: 1 | 2 | 3;
  /** Summary block that opens in its editor (story / test helper). */
  initialEdit?: BlockId | null;
  /** Story helpers. */
  initialDraft?: Partial<WizardDraft>;
  initialPreview?: boolean;
  onSubmit: (draft: WizardDraft, action: WizardAction) => void;
  onClose: () => void;
}

const STEPS = [{ id: 1, label: 'Services & price' }, { id: 2, label: 'Review & confirm' }];

/**
 * NewServiceWizard (NEW, revision 5): a modal 2-step wizard (full screen on a phone).
 * 1 Services & price (customer, car, one service search, lines, sticky total) - 2 Review & confirm (every block editable in place, optional Job order details, Remarks, two final actions).
 * Next stays disabled until a customer and a service exist; the reason is said in words. Esc and Cancel ask before dropping edits.
 */
export function NewServiceWizard({ slot, customer, vehicleId, plate = '', notes = '', items = [], quote, quoteNo, editOnly, startStep, initialEdit = null, initialDraft, initialPreview = false, onSubmit, onClose }: NewServiceWizardProps) {
  const data = useWizardData();
  const initial = useMemo<WizardDraft>(() => {
    const base = quote ? draftFromJob(quote, bookingOf(quote), data) : {
      ...(customer ? { customer, vehicleId: vehicleId ?? customer.vehicles[0]?.id ?? '' } : {}),
      ...(slot ? { date: slot.date, start: slot.start, dur: slot.dur } : {}), concerns: notes,
    };
    return emptyDraft({ ...base, ...initialDraft });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [draft, setDraft] = useState<WizardDraft>(initial);
  const [step, setStep] = useState<number>(() => ((startStep ?? (quote ? 2 : 1)) >= 2 && wizardMissing(initial).length ? 1 : (startStep ?? (quote ? 2 : 1)) >= 2 ? 2 : 1));
  const [editing, setEditing] = useState<BlockId | null>(initialEdit);
  const [preview, setPreview] = useState(initialPreview);
  const [adding, setAdding] = useState(false);
  const durSet = useRef(!!slot?.dragged || !!quote);
  const slotSet = !!slot || !!quote;
  const startKey = useRef(dirtyKey(initial));
  const { guard, node } = useDirtyGuard(dirtyKey(draft) !== startKey.current);

  const change = (p: Partial<WizardDraft>) => setDraft((d) => {
    const n = { ...d, ...p };
    if (p.lines && !durSet.current && p.lines.length) n.dur = Math.min(240, minutesFor(p.lines.map((l) => l.name)));
    return n;
  });
  const missing = wizardMissing(draft, adding);
  const ready = missing.length === 0;
  const go = (s: number) => { if (s === 1 || (ready && !adding)) { setEditing(null); setStep(s); } };
  const stepper = STEPS.map((s) => ({ ...s, blocked: s.id > 1 && !ready ? `Still needed: ${missing.join(' and ')}.` : undefined }));
  const leave = () => guard(onClose);
  const booking = !!quote;

  const doc = docFromDraft(draft, quoteNo, quote?.quoteValidUntil, data.shop);
  return (
    <Modal open onOpenChange={(o) => !o && leave()} size="wizard" aria-label={quote ? `Quotation ${quoteNo}` : 'New service'}>
      <Modal.Header description={preview ? 'Printable document, as the customer receives it.' : quote ? `Quotation ${quoteNo}, waiting for the customer.` : undefined}>{preview ? `Quotation ${quoteNo}` : quote ? (editOnly ? 'Edit quotation' : 'Book quoted service') : 'New service'}</Modal.Header>
      {preview ? (
        <>
          <Modal.Body className="bg-raised"><QuotationDoc doc={doc} /></Modal.Body>
          <Modal.Footer><Button variant="text" onClick={() => setPreview(false)}>Back to review</Button><PrintButton /></Modal.Footer>
        </>
      ) : (
        <>
          <WizardStepper steps={stepper} current={step} onGo={go} />
          <Modal.Body key={step} className="py-6">
            {step === 1 && <WizardStep1 draft={draft} onChange={change} initialQuery={customer ? '' : plate} onAddingChange={setAdding} />}
            {step === 2 && <WizardSummary draft={draft} onChange={change} editing={editing} setEditing={setEditing} onPreview={() => setPreview(true)} quoteNo={quoteNo} bookingQuote={booking} items={items} slotSet={slotSet} onAddingChange={setAdding}
              onDur={(d) => { durSet.current = true; change({ dur: d }); }} />}
          </Modal.Body>
          <Modal.Footer className="justify-between max-[640px]:flex-col-reverse">
            <p className="mr-auto text-[13px] text-muted max-[640px]:mr-0" aria-live="polite">
              {!ready ? <span>Still needed: {missing.join(' and ')}.</span> : step === 2 && editing ? <span>Press Done on the block you are editing to continue.</span> : null}
            </p>
            <div className="flex items-center gap-3 max-[640px]:flex-col-reverse max-[640px]:items-stretch">
              {step === 2 && <Button variant="text" onClick={() => go(1)}>Back</Button>}
              <Button variant="text" onClick={leave}>Cancel</Button>
              {step === 1 && <Button variant="primary" disabled={!ready} onClick={() => go(2)}>Next</Button>}
              {step === 2 && <Button variant={editOnly ? 'primary' : 'secondary'} disabled={!ready || !!editing} onClick={() => onSubmit(draft, 'quote')}>{booking ? 'Save quote changes' : 'Save as quotation'}</Button>}
              {step === 2 && !editOnly && <Button variant="primary" disabled={!ready || !!editing} onClick={() => onSubmit(draft, 'book')}>{booking ? 'Customer agreed - Book it' : 'Book service'}</Button>}
            </div>
          </Modal.Footer>
        </>
      )}
      {node}
    </Modal>
  );
}
