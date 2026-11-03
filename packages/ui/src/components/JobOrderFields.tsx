import { Notice } from './Notice';
import { Select } from './Select';
import { cn } from '../utils/cn';
import { HOURS, NOW_MIN, TODAY, mechanics } from './sms/data';
import { CLOSED, SLOT, busyWith, durLabel, hmin, isClosed, isPastSlot, longDay, type CalItem } from './sms/scheduleModel';
import { promisedOf, type WizardDraft } from './sms/wizardModel';
import { Row } from './WizardBlock';

const timeOptions = Array.from({ length: (HOURS.close - HOURS.open) / SLOT + 1 }, (_, i) => HOURS.open + i * SLOT).map((m) => ({ value: String(m), label: hmin(m) }));
const durOptions = Array.from({ length: 8 }, (_, i) => (i + 1) * SLOT).map((m) => ({ value: String(m), label: durLabel(m) }));
export const textareaField = 'w-full rounded-control border border-control bg-surface px-3 py-2 text-ui text-text placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';
const field = 'h-10 w-full rounded-control border border-control bg-surface px-3 text-ui text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:h-11';

type P = { draft: WizardDraft; onChange: (p: Partial<WizardDraft>) => void };

/**
 * Schedule & staff (revision 6, always open on the review): Date, Starts, Takes (default = the catalogue minutes), Promised by and Mechanic.
 * Availability is said where it matters: busy mechanics are marked in the select, closed day / past time / runs-late warnings sit under the fields. Nothing blocks.
 */
export function ScheduleFields({ draft, onChange, items = [], onDur, slotSet }: P & { items?: CalItem[]; /** Length picked by hand: stops following the services. */ onDur: (d: number) => void; slotSet?: boolean }) {
  const { date, start, dur, mechanicId } = draft;
  const clash = mechanicId ? busyWith(items, mechanicId, date, start, dur) : null;
  const closed = isClosed(date);
  const past = isPastSlot(date, start, NOW_MIN);
  const over = start + dur > HOURS.close;
  const mech = mechanics.find((m) => m.id === mechanicId);
  const promised = promisedOf(draft);
  const mechOptions = [{ value: 'none', label: 'Not yet' }, ...mechanics.map((m) => {
    const busy = busyWith(items, m.id, date, start, dur);
    return { value: m.id, label: `${m.short} · ${m.bay}${busy ? ` · busy ${hmin(busy.start)}-${hmin(busy.end)}` : ' · free'}` };
  })];
  return (
    <div>
      <dl>
        <Row k="Date" v={<div className="max-w-[420px]"><input type="date" aria-label="Date" value={date} onChange={(e) => e.target.value && onChange({ date: e.target.value })} className={cn(field, 'tabular-nums')} /></div>} />
        <Row k="Starts" v={<div className="max-w-[420px]"><Select aria-label="Starts" value={String(start)} onValueChange={(v) => onChange({ start: Number(v) })} options={timeOptions.slice(0, -1)} /></div>} />
        <Row k="Takes" v={<div className="max-w-[420px]"><Select aria-label="Takes" value={String(dur)} onValueChange={(v) => onDur(Number(v))} options={durOptions} /></div>} />
        <Row k="Promised by" v={
          <div>
            <div className="max-w-[420px]"><Select aria-label="Promised by" value={String(promised)} onValueChange={(v) => onChange({ promisedMin: Number(v) })} options={timeOptions} /></div>
            <p className="mt-1 text-[12px] text-muted">
              {slotSet ? 'From the calendar slot. ' : 'Default slot, change if needed. '}
              {draft.promisedMin === null ? 'Promised time follows the end of the booking.' : <>Promised time set by you. <button type="button" className="font-semibold text-accent underline underline-offset-2" onClick={() => onChange({ promisedMin: null })}>Follow the booking</button></>}
            </p>
          </div>
        } />
        <Row k="Mechanic" v={<div className="max-w-[420px]"><Select aria-label="Mechanic" value={mechanicId ?? 'none'} onValueChange={(v) => onChange({ mechanicId: v === 'none' ? null : v })} options={mechOptions} /></div>} />
      </dl>
      <div className="mt-4 space-y-3" aria-live="polite">
        {!mechanicId && <p className="text-[13px] text-muted">No mechanic yet. You can book now and assign one later. A quotation never needs one.</p>}
        {closed && <Notice tone="warn" title={`${longDay(date)}: ${CLOSED[date]}`}>The shop is closed this day. You can still book it.</Notice>}
        {!closed && past && <Notice tone="warn" title="That time has passed">Today is {longDay(TODAY)} and it is already past {hmin(start)}. Pick a later time or book it as is.</Notice>}
        {!closed && over && <Notice tone="warn" title="Runs past closing">This ends after {hmin(HOURS.close)}. Shorten it or start earlier.</Notice>}
        {clash && mech && <Notice tone="warn" title={`${mech.short} is busy then`}>{clash.job.number} holds {mech.short} from {hmin(clash.start)} to {hmin(clash.end)}. You can still book it.</Notice>}
      </div>
    </div>
  );
}

/** "More details (optional)": mileage in and concerns for the mechanic. */
export function MoreFields({ draft, onChange }: P) {
  return (
    <dl>
      <Row k="Mileage in" v={<div className="max-w-[420px]"><input inputMode="numeric" aria-label="Mileage in (km)" value={draft.mileageIn} onChange={(e) => onChange({ mileageIn: e.target.value.replace(/\D/g, '') })} placeholder="e.g. 48200 km" className={cn(field, 'tabular-nums')} /></div>} />
      <Row k="Concerns and notes" v={<textarea aria-label="Concerns and notes for the mechanic" rows={4} value={draft.concerns} onChange={(e) => onChange({ concerns: e.target.value })} placeholder="Grinding when braking" className={textareaField} />} />
    </dl>
  );
}

/** One line for the Schedule block header: date, time range, mechanic. */
export function scheduleSummary(draft: WizardDraft) {
  const mech = mechanics.find((m) => m.id === draft.mechanicId);
  return `${longDay(draft.date)} · ${hmin(draft.start)}-${hmin(Math.min(draft.start + draft.dur, 1050))} · ${mech ? mech.short : 'No mechanic yet'}`;
}
