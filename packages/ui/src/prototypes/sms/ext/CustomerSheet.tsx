import { useMemo, useState } from 'react';
import { Plus, Trash, X } from '@phosphor-icons/react';
import { BackLink, Button, Notice, TextField, Textarea, cn } from '../../../index';
import { customers, type Customer } from '../data';
import { blankCar, carToDraft, looksLikePlate, platePretty, type CarDraft, type Draft } from '../customersModel';
import { profileOf } from '../customerExtras';
import { CarFields } from './CarFields';
import { useDirtyGuard } from './DirtyGuard';

export interface CustomerSheetProps {
  /** Edit this customer; omit for a new one. */
  customer?: Customer | null;
  notes?: string;
  /** What was searched when nothing matched: becomes the first field (a plate, a phone number or a name). */
  seed?: string;
  /** Cars that have services: they stay (history is tied to the car), so no Remove. */
  keepIds?: string[];
  onSave: (d: Draft, existing: Customer | null) => void;
  onOpenExisting?: (c: Customer) => void;
  onClose?: () => void;
  /** Lets the host route its own back/close (phone top bar, backdrop) through the unsaved-change guard. */
  registerGuard?: (g: ((leave: () => void) => void) | null) => void;
  asPage?: boolean;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

const digits = (s: string) => s.replace(/\D/g, '');

function start(customer: Customer | null | undefined, notes: string, seed: string): Draft {
  if (customer) return { name: customer.name, phone: customer.phone, notes, vehicles: customer.vehicles.map(carToDraft) };
  const t = seed.trim();
  const car = blankCar(looksLikePlate(t) ? platePretty(t) : '');
  return { name: !t || looksLikePlate(t) || /^[\d\s+()-]{6,}$/.test(t) ? '' : t, phone: /^[\d\s+()-]{6,}$/.test(t) ? t : '', notes: '', vehicles: [car] };
}

/**
 * Studio-only CustomerSheet (NEW): the off-canvas body for adding or editing a customer. Same fields and rules as the mini form inside CustomerField
 * (name, phone, plate, make, model, year) plus notes and more than one car. Save is disabled until name, phone and one full car exist; the sheet says what is missing.
 * A phone number that already belongs to another customer is flagged with a link to that customer, never blocked.
 */
export function CustomerSheet({ customer, notes = '', seed = '', keepIds = [], onSave, onOpenExisting, onClose, registerGuard, asPage, onBack, backLabel = 'Customers', className }: CustomerSheetProps) {
  const [first] = useState<Draft>(() => start(customer, notes, seed));
  const [d, setD] = useState<Draft>(first);
  const dirty = useMemo(() => JSON.stringify(d) !== JSON.stringify(first), [d, first]);
  const { guard, node } = useDirtyGuard(dirty, registerGuard);
  const leave = onClose ?? onBack;
  const editing = !!customer;
  const set = (k: 'name' | 'phone' | 'notes') => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));
  const patchCar = (id: string, p: Partial<CarDraft>) => setD((x) => ({ ...x, vehicles: x.vehicles.map((v) => (v.id === id ? { ...v, ...p } : v)) }));
  const missing = useMemo(() => {
    const m: string[] = [];
    if (!d.name.trim()) m.push('a name');
    if (digits(d.phone).length < 7) m.push('a phone number');
    if (!d.vehicles.some((v) => v.plate.trim() && v.make.trim() && v.model.trim())) m.push('one car with plate, make and model');
    return m;
  }, [d]);
  const twin = useMemo(() => (digits(d.phone).length >= 10 ? customers.find((c) => c.id !== customer?.id && digits(c.phone) === digits(d.phone)) ?? null : null), [d.phone, customer]);
  const ready = missing.length === 0;
  const submit = () => { if (ready) onSave({ ...d, name: d.name.trim(), vehicles: d.vehicles.filter((v) => v.plate.trim() && v.make.trim() && v.model.trim()) }, customer ?? null); };

  return (
    <form className={cn('flex h-full flex-col', className)} onSubmit={(e) => { e.preventDefault(); submit(); }} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); guard(leave); } }} aria-label={editing ? `Edit ${customer.name}` : 'New customer'}>
      <div className="flex items-start gap-2 px-4 pb-3 pt-3">
        <div className="min-w-0 flex-1">
          {asPage && <BackLink onClick={() => guard(onBack)} className="mb-2">{backLabel}</BackLink>}
          <h2 className="text-[16px] font-semibold leading-6">{editing ? 'Edit customer' : 'New customer'}</h2>
          <p className="text-[13px] text-muted">{editing ? 'Changes show on every service of this customer.' : 'Take a name, a phone and the car. That is enough to start a service.'}</p>
        </div>
        {!asPage && onClose && <button type="button" aria-label="Close" onClick={() => guard(onClose)} className="inline-flex size-8 items-center justify-center rounded-control text-muted hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><X size={16} aria-hidden /></button>}
      </div>
      <div className="flex-1 space-y-4 border-t border-rule px-4 py-4">
        <TextField label="Name" value={d.name} onChange={set('name')} autoComplete="off" />
        <TextField label="Phone" type="tel" value={d.phone} onChange={set('phone')} placeholder="0917 000 0000" />
        {twin && (
          <Notice tone="warn" title={`${twin.name} already has this number`} action={onOpenExisting ? <Button variant="secondary" type="button" onClick={() => onOpenExisting(twin)}>Open {twin.name.split(' ')[0]}</Button> : undefined}>
            You can still save, for example for a family member who shares a phone. Cars of the same family are better added to one customer.
          </Notice>
        )}
        <fieldset className="space-y-3">
          <legend className="sr-only">Cars</legend>
          <div className="flex min-h-8 items-center justify-between gap-3"><h3 className="text-ui font-medium text-text">Cars ({d.vehicles.length})</h3>
            <Button variant="text" type="button" leftIcon={Plus} onClick={() => setD((x) => ({ ...x, vehicles: [...x.vehicles, blankCar()] }))}>Add car</Button></div>
          {d.vehicles.map((v, i) => (
            <div key={v.id} className="rounded-control border border-control p-3">
              <div className="mb-2 flex items-center justify-between gap-2"><p className="min-w-0 truncate text-[13px] font-semibold">Car {i + 1}{v.plate ? <span className="ml-2 font-mono font-normal text-muted">{v.plate}</span> : null}</p>
                {d.vehicles.length > 1 && !keepIds.includes(v.id) && <Button variant="text" type="button" leftIcon={Trash} aria-label={`Remove car ${i + 1}${v.plate ? `, ${v.plate}` : ''}`} onClick={() => setD((x) => ({ ...x, vehicles: x.vehicles.filter((y) => y.id !== v.id) }))}>Remove</Button>}</div>
              <CarFields compact car={v} onChange={(p) => patchCar(v.id, p)} customerEvery={customer ? profileOf(customer).remindEvery : 6} onOpenTwin={onOpenExisting ? (id) => { const c = customers.find((x) => x.id === id); if (c) guard(() => onOpenExisting(c)); } : undefined} />
            </div>
          ))}
          {d.vehicles.length === 1 && <p className="text-[13px] text-muted">Has another car? <button type="button" className="font-semibold text-accent underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" onClick={() => setD((x) => ({ ...x, vehicles: [...x.vehicles, blankCar()] }))}>Add car</button></p>}
        </fieldset>
        <Textarea label="Notes" rows={3} value={d.notes} onChange={set('notes')} placeholder="How they pay, when to call, anything to remember" />
      </div>
      <div className="sticky bottom-0 mt-auto border-t border-rule bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="primary" type="submit" disabled={!ready} className="max-[640px]:min-h-11">{editing ? 'Save changes' : 'Save customer'}</Button>
          <Button variant="secondary" type="button" onClick={() => guard(leave)} className="max-[640px]:min-h-11">Cancel</Button>
        </div>
        <p className="mt-2 min-h-4 text-[12px] leading-4 text-muted" aria-live="polite">{ready ? (editing ? 'Nothing else changes: services and history stay linked.' : 'Next you can start a service for this customer.') : `Still needed: ${missing.join(', ')}.`}</p>
      </div>
      {node}
    </form>
  );
}
