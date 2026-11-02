import { useState } from 'react';
import { CaretDown, FileText } from '@phosphor-icons/react';
import { Button, cn } from '../../../index';
import { longDay, type CalItem } from '../scheduleModel';
import { validUntilDefault, type WizardDraft } from '../wizardModel';
import { CustomerField } from './CustomerField';
import { MoreFields, textareaField, ScheduleFields, scheduleSummary } from './JobOrderFields';
import { Row, WizardBlock, editLink } from './WizardBlock';
import { LinesTable, ServiceAdder } from './ServiceLines';

export type BlockId = 'customer' | 'lines' | 'schedule' | 'job' | 'remarks';
/** The draft fields each block edits: Cancel puts these back. */
const FIELDS: Record<BlockId, (keyof WizardDraft)[]> = {
  customer: ['customer', 'vehicleId'], lines: ['lines', 'dur'], schedule: [], job: ['mileageIn', 'concerns'], remarks: ['remarks'],
};

/**
 * Step 2 "Review & confirm": everything is editable in place. Each block has Edit, which swaps it for the same controls as step 1 with Done / Cancel (one block at a time);
 * totals follow live. Schedule and staff is an always-open block (date, time, mechanic, availability warnings; its header carries the values); mileage and concerns sit in a collapsed "More details (optional)" row.
 */
export function WizardSummary({ draft, onChange, editing, setEditing, onPreview, quoteNo, bookingQuote, items = [], slotSet, onDur, onAddingChange }: {
  draft: WizardDraft; onChange: (p: Partial<WizardDraft>) => void; editing: BlockId | null; setEditing: (b: BlockId | null) => void; onPreview: () => void; quoteNo?: string;
  /** Opened from a parked quote: the buttons say what happens to it. */ bookingQuote?: boolean; items?: CalItem[]; /** The slot came from the calendar (or the quote). */ slotSet?: boolean; onDur: (d: number) => void; onAddingChange?: (a: boolean) => void;
}) {
  const [snap, setSnap] = useState<WizardDraft>(draft);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const c = draft.customer;
  const v = c?.vehicles.find((x) => x.id === draft.vehicleId) ?? c?.vehicles[0];
  const partCount = draft.lines.filter((l) => l.kind === 'part').length;
  const open = (id: BlockId) => { setSnap(draft); setEditing(id); };
  const cancel = (id: BlockId) => { onChange(Object.fromEntries(FIELDS[id].map((k) => [k, snap[k]])) as Partial<WizardDraft>); setEditing(null); };
  const props = (id: BlockId) => ({ id, editing: editing === id, onEdit: () => open(id), onDone: () => setEditing(null), onCancel: () => cancel(id) });
  const moreTouched = !!(draft.mileageIn || draft.concerns.trim());
  return (
    <div>
      <WizardBlock {...props('customer')} title="Customer and car" canDone={!!c} edit={
        <CustomerField customer={c} vehicleId={draft.vehicleId} onAddingChange={onAddingChange} onPick={(cu, vid) => onChange({ customer: cu, vehicleId: vid })} onClear={() => onChange({ customer: null, vehicleId: '' })} />
      }>
        <dl><Row k="Customer" v={<>{c?.name} <span className="tabular-nums text-muted">· {c?.phone}</span></>} /><Row k="Car" v={v ? <>{v.make} {v.model} {v.year} <span className="font-mono text-muted">· {v.plate}</span></> : '-'} /></dl>
      </WizardBlock>

      <WizardBlock {...props('lines')} title="Services and price" canDone={draft.lines.length > 0} edit={
        <div className="space-y-3">
          <ServiceAdder lines={draft.lines} kind={v?.kind ?? null} onChange={(next) => onChange({ lines: next })} onFocusLine={setFocusKey} />
          <LinesTable lines={draft.lines} onChange={(next) => onChange({ lines: next })} focusKey={focusKey} empty="Add at least one service." />
        </div>
      }>
        <LinesTable lines={draft.lines} readOnly />
        {partCount > 0 && <p className="mt-3 text-[13px] text-muted">{partCount} {partCount === 1 ? 'part' : 'parts'} will be reserved from Inventory. Nothing leaves stock until the mechanic requests it.</p>}
      </WizardBlock>

      <WizardBlock id="schedule" title="Schedule and staff" open summary={scheduleSummary(draft)}>
        <ScheduleFields draft={draft} onChange={onChange} items={items} onDur={onDur} slotSet={slotSet} />
      </WizardBlock>

      <WizardBlock {...props('job')} title="More details" hint="(optional)" edit={<MoreFields draft={draft} onChange={onChange} />} action={
        <button type="button" className={editLink} aria-expanded={false} onClick={() => open('job')} aria-label="More details, optional: expand">{moreTouched ? 'Edit' : 'Add'}<CaretDown size={14} weight="bold" aria-hidden /></button>
      }>
        {moreTouched ? (
          <dl>
            {draft.mileageIn && <Row k="Mileage in" v={<span className="tabular-nums">{Number(draft.mileageIn).toLocaleString('en-PH')} km</span>} />}
            {draft.concerns.trim() && <Row k="Concerns and notes" v={draft.concerns} />}
          </dl>
        ) : <p className="text-[14px] text-muted">Mileage in and concerns for the mechanic. Not needed to book.</p>}
      </WizardBlock>

      <WizardBlock {...props('remarks')} title="Remarks" edit={
        <dl><Row k="Remarks" v={<textarea aria-label="Remarks" rows={3} value={draft.remarks} onChange={(e) => onChange({ remarks: e.target.value })} placeholder="e.g. Prices good for 7 days. Parts are 1-year warranty." className={textareaField} />} /></dl>
      }>
        <dl><Row k="Remarks" v={<span className={cn(!draft.remarks.trim() && 'text-muted')}>{draft.remarks.trim() || 'None. Shown on the quotation and the job order when added.'}</span>} /></dl>
      </WizardBlock>

      <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-rule pt-5">
        <FileText size={20} className="flex-none text-muted" aria-hidden />
        <p className="min-w-0 flex-1 text-[13px] text-muted">{quoteNo ? `Quotation ${quoteNo}` : 'Quotation'} is valid until {longDay(validUntilDefault())}.</p>
        <Button variant="secondary" onClick={onPreview}>View quotation</Button>
      </div>
      {bookingQuote && <p className="mt-3 text-[13px] text-muted">Booking keeps the quotation number. Save quote changes leaves it waiting for the customer.</p>}
    </div>
  );
}
