import { useMemo, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { BackLink } from './ActionLink';
import { Button } from './Button';
import { cn } from '../utils/cn';
import type { Customer, Vehicle } from './sms/data';
import { blankCar, carToDraft, type CarDraft } from './sms/customersModel';
import { profileOf } from './sms/customerExtras';
import { CarFields } from './CarFields';
import { useDirtyGuard } from './DirtyGuard';

export interface CarSheetProps {
  customer: Customer;
  /** Edit this car; omit to add one. */
  car?: Vehicle | null;
  onSave: (d: CarDraft, existing: Vehicle | null) => void;
  onOpenCustomer?: (id: string) => void;
  onClose?: () => void;
  /** Lets the host route its own back/close (phone top bar, backdrop) through the unsaved-change guard. */
  registerGuard?: (g: ((leave: () => void) => void) | null) => void;
  asPage?: boolean;
  onBack?: () => void;
  className?: string;
}

/**
 * Studio-only CarSheet (NEW): the focused form to add a car to a customer or edit one. Same shell as the Edit customer sheet (off-canvas on desktop, a full screen on phone).
 * Save needs plate, make and model. Cancel, Close, Esc and Back ask first when something was typed.
 */
export function CarSheet({ customer, car, onSave, onOpenCustomer, onClose, registerGuard, asPage, onBack, className }: CarSheetProps) {
  const [start] = useState<CarDraft>(() => (car ? carToDraft(car) : blankCar()));
  const [d, setD] = useState<CarDraft>(start);
  const editing = !!car;
  const dirty = useMemo(() => JSON.stringify(d) !== JSON.stringify(start), [d, start]);
  const { guard, node } = useDirtyGuard(dirty, registerGuard);
  const leave = onClose ?? onBack;
  const missing = [!d.plate.trim() && 'a plate', !d.make.trim() && 'a make', !d.model.trim() && 'a model'].filter(Boolean) as string[];
  const ready = missing.length === 0;
  const title = editing ? `Edit ${car.plate}` : 'Add car';
  return (
    <form className={cn('flex h-full flex-col', className)} aria-label={editing ? `Edit car ${car.plate}` : `Add car to ${customer.name}`}
      onSubmit={(e) => { e.preventDefault(); if (ready) onSave(d, car ?? null); }}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); guard(leave); } }}>
      <div className="flex items-start gap-2 px-4 pb-3 pt-3">
        <div className="min-w-0 flex-1">
          {asPage && <BackLink onClick={() => guard(onBack)} className="mb-2">{customer.name}</BackLink>}
          <h2 className="text-[16px] font-semibold leading-6">{title}</h2>
          <p className="break-words text-[13px] text-muted">{editing ? `${car.make} ${car.model}, ${customer.name}. Changes show on every service of this car.` : `A new car for ${customer.name}. It shows on their page and in New service right away.`}</p>
        </div>
        {!asPage && onClose && <button type="button" aria-label="Close" onClick={() => guard(onClose)} className="inline-flex size-8 items-center justify-center rounded-control text-muted hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><X size={16} aria-hidden /></button>}
      </div>
      <div className="flex-1 border-t border-rule px-4 py-4">
        <CarFields car={d} onChange={(p) => setD((x) => ({ ...x, ...p }))} customerEvery={profileOf(customer).remindEvery} onOpenTwin={onOpenCustomer ? (id) => guard(() => onOpenCustomer(id)) : undefined} />
      </div>
      <div className="sticky bottom-0 mt-auto border-t border-rule bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="primary" type="submit" disabled={!ready} className="max-[640px]:min-h-11">{editing ? 'Save car' : 'Add car'}</Button>
          <Button variant="secondary" type="button" onClick={() => guard(leave)} className="max-[640px]:min-h-11">Cancel</Button>
        </div>
        <p className="mt-2 min-h-4 text-[12px] leading-4 text-muted" aria-live="polite">{ready ? (dirty ? 'You have unsaved changes.' : 'Nothing changed yet.') : `Still needed: ${missing.join(', ')}.`}</p>
      </div>
      {node}
    </form>
  );
}
