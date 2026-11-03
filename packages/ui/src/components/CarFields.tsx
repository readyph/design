import { useId, type ReactNode } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { Notice } from './Notice';
import { Select } from './Select';
import { TextField, Textarea } from './TextField';
import { customers } from './sms/data';
import { plateTwin, type CarDraft } from './sms/customersModel';

export interface CarFieldsProps {
  car: CarDraft;
  onChange: (patch: Partial<CarDraft>) => void;
  /** `compact`: plate, make, model, year and colour show; the rest sit under "More about this car" (inside the Edit customer sheet). */
  compact?: boolean;
  /** Customer's own interval, shown as the default in the reminder select. */
  customerEvery?: number;
  /** Open another customer's record that already has this plate. */
  onOpenTwin?: (customerId: string) => void;
}

const NONE = 'none';
const opts = (list: [string, string][]) => [{ value: NONE, label: 'Not set' }, ...list.map(([value, label]) => ({ value, label }))];
const KINDS = [{ value: 'car', label: 'Car' }, { value: 'van', label: 'Van' }, { value: 'pickup', label: 'Pickup' }, { value: 'motorcycle', label: 'Motorcycle' }];

function Pick({ label, value, onValueChange, options }: { label: string; value: string; onValueChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <span id={id} className="mb-1 block text-ui font-medium text-text">{label}</span>
      <Select aria-labelledby={id} value={value} onValueChange={onValueChange} options={options} />
    </div>
  );
}

/**
 * Studio-only CarFields (NEW): every field a car can carry, one component for both entry points (the car sheet on the Customer page and the Cars part of the
 * Edit customer sheet), so the two always agree. Plate is required and uppercased; a plate already on another car is flagged, never blocked.
 */
export function CarFields({ car, onChange, compact, customerEvery = 6, onOpenTwin }: CarFieldsProps) {
  const twin = plateTwin(car.plate, car.id, customers);
  const more: ReactNode = (
    <>
      <TextField label="Mileage (odometer)" type="number" className="[&>div]:overflow-hidden" inputMode="numeric" unit="km" value={car.mileage ?? ''} onChange={(e) => onChange({ mileage: e.target.value })} placeholder="64000" />
      <TextField label="VIN / chassis no. (optional)" value={car.vin ?? ''} onChange={(e) => onChange({ vin: e.target.value.toUpperCase() })} autoComplete="off" />
      <Pick label="Fuel" value={car.fuel || NONE} onValueChange={(v) => onChange({ fuel: v === NONE ? '' : v })} options={opts([['gasoline', 'Gasoline'], ['diesel', 'Diesel'], ['hybrid', 'Hybrid'], ['electric', 'Electric'], ['lpg', 'LPG']])} />
      <Pick label="Transmission" value={car.transmission || NONE} onValueChange={(v) => onChange({ transmission: v === NONE ? '' : v })} options={opts([['manual', 'Manual'], ['automatic', 'Automatic']])} />
      <div className="col-span-2"><Pick label="Remind to service every" value={car.remindEvery || NONE} onValueChange={(v) => onChange({ remindEvery: v === NONE ? '' : v })} options={[{ value: NONE, label: `Same as the customer (${customerEvery} months)` }, { value: '3', label: '3 months' }, { value: '6', label: '6 months' }, { value: '12', label: '12 months' }]} /></div>
      <div className="col-span-2"><Textarea label="Notes about this car" rows={2} value={car.notes ?? ''} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Known issues, parts preferences, where the spare key is" /></div>
    </>
  );
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-3">
      <div className="col-span-2">
        <TextField label="Plate (required)" value={car.plate} onChange={(e) => onChange({ plate: e.target.value.toUpperCase() })} placeholder="NBC 4521" autoComplete="off" aria-required="true" className="[&_input]:font-mono [&_input]:uppercase" />
      </div>
      {twin && (
        <div className="col-span-2">
          <Notice tone="warn" title={`${car.plate.trim()} is already on ${twin.customer.name}`}
            action={onOpenTwin ? <button type="button" onClick={() => onOpenTwin(twin.customer.id)} className="min-h-8 text-[13px] font-semibold text-accent underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Open {twin.customer.name.split(' ')[0]}</button> : undefined}>
            {twin.vehicle.make} {twin.vehicle.model} {twin.vehicle.year}. You can still save, for example when the car was sold to this customer. Check the plate first.
          </Notice>
        </div>
      )}
      <TextField label="Make" value={car.make} onChange={(e) => onChange({ make: e.target.value })} placeholder="Toyota" />
      <TextField label="Model" value={car.model} onChange={(e) => onChange({ model: e.target.value })} placeholder="Vios" />
      <TextField label="Year" type="number" className="[&>div]:overflow-hidden" inputMode="numeric" value={car.year} onChange={(e) => onChange({ year: e.target.value })} placeholder="2018" />
      <TextField label="Colour" value={car.colour ?? ''} onChange={(e) => onChange({ colour: e.target.value })} placeholder="Silver" />
      <div className="col-span-2"><Pick label="Type" value={car.kind ?? 'car'} onValueChange={(v) => onChange({ kind: v as CarDraft['kind'] })} options={KINDS} /></div>
      {compact ? (
        <details className="group col-span-2">
          <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1.5 text-[13px] font-semibold text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:min-h-11 [&::-webkit-details-marker]:hidden"><CaretDown size={12} aria-hidden className="transition-transform group-open:rotate-180 motion-reduce:transition-none" />More about this car</summary>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">{more}</div>
        </details>
      ) : more}
    </div>
  );
}
