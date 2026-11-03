import { useMemo, useState } from 'react';
import { Plus, Trash } from '@phosphor-icons/react';
import { Button } from './Button';
import { Select } from './Select';
import { TextField } from './TextField';
import { cn } from '../utils/cn';
import type { Customer, Vehicle } from './sms/data';
import { useWizardData } from './sms/wizardData';
import { Combobox, type ComboOption } from './Combobox';
import { Row } from './WizardBlock';

export interface CustomerFieldProps {
  customer: Customer | null;
  vehicleId: string;
  onPick: (c: Customer, vehicleId: string) => void;
  onClear: () => void;
  /** Text to start the search with (an inquiry's name, a plate). */
  initialQuery?: string;
  /** True while the inline new-customer form is open, so the sheet can say what is missing. */
  onAddingChange?: (adding: boolean) => void;
}

interface Car { id: string; plate: string; make: string; model: string; year: string }
interface Draft { name: string; phone: string; cars: Car[] }
let carSeq = 0;
const blank = (plate = ''): Car => ({ id: `nvc-${++carSeq}`, plate, make: '', model: '', year: '' });
const EMPTY: Draft = { name: '', phone: '', cars: [blank()] };

const norm = (s: string) => s.toLowerCase().replace(/[\s-]/g, '');
const vehicleLine = (v: Vehicle) => `${v.make} ${v.model} ${v.year}`;

/** What was typed becomes the first field of the new customer: a plate, a phone number or a name. */
function prefill(q: string): Draft {
  const t = q.trim();
  if (/^[A-Za-z]{2,3}\s?\d{3,4}$/.test(t)) return { name: '', phone: '', cars: [blank(t.toUpperCase())] };
  if (/^[\d\s+()-]{6,}$/.test(t)) return { name: '', phone: t, cars: [blank()] };
  return { name: t, phone: '', cars: [blank()] };
}

let seq = 0;

/**
 * Studio-only CustomerField (NEW): customer lookup as a combobox, with new-customer capture in place.
 * Search by name, plate or phone; rows show name, vehicle and plate. The last row is always "+ Add new customer" (pre-filled with what was typed) and opens a mini form where the field was.
 * Revision 6: renders the same label/value rows as the review block (Customer: name · phone + Change; Car: plate and make/model, a select when there are several, + Add car). No boxed cards.
 */
export function CustomerField({ customer, vehicleId, onPick, onClear, initialQuery = '', onAddingChange }: CustomerFieldProps) {
  const { customers } = useWizardData();
  const [q, setQ] = useState(initialQuery);
  const [adding, setAdding] = useState(false);
  const [d, setD] = useState<Draft>(EMPTY);
  const [car, setCarDraft] = useState<Car | null>(null);
  const setAddingBoth = (b: boolean) => { setAdding(b); onAddingChange?.(b); };

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return customers.slice(0, 5).map((c) => ({ c, v: c.vehicles[0]! }));
    const digits = t.replace(/\D/g, '');
    return customers.flatMap((c) => {
      const byPerson = c.name.toLowerCase().includes(t) || (digits.length >= 3 && c.phone.replace(/\D/g, '').includes(digits));
      const byPlate = c.vehicles.find((v) => norm(v.plate).includes(norm(t)));
      return byPerson || byPlate ? [{ c, v: byPlate ?? c.vehicles[0]! }] : [];
    }).slice(0, 6);
  }, [q, customers]);

  const options: ComboOption[] = matches.map(({ c, v }) => ({
    id: `${c.id}|${v.id}`,
    label: `${c.name}, ${vehicleLine(v)}, ${v.plate}`,
    node: (
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-text">{c.name}</span>
          <span className="block truncate text-[12px] text-muted">{v.make} {v.model} {v.year}{c.vehicles.length > 1 ? ` · +${c.vehicles.length - 1} more` : ''} · {c.phone}</span>
        </span>
        <span className="flex-none font-mono text-[12px] text-text">{v.plate}</span>
      </span>
    ),
  }));

  const startAdd = () => { setD(prefill(q)); setAddingBoth(true); };
  const set = (k: 'name' | 'phone') => (e: React.ChangeEvent<HTMLInputElement>) => setD((x) => ({ ...x, [k]: e.target.value }));
  const setCar = (id: string, k: keyof Car) => (e: React.ChangeEvent<HTMLInputElement>) => setD((x) => ({ ...x, cars: x.cars.map((c) => (c.id === id ? { ...c, [k]: k === 'plate' ? e.target.value.toUpperCase() : e.target.value } : c)) }));
  const full = (c: Car) => c.make.trim() && c.model.trim() && c.plate.trim();
  const valid = d.name.trim() && d.phone.trim() && d.cars.some(full);
  const save = () => {
    if (!valid) return;
    seq += 1;
    const vehicles: Vehicle[] = d.cars.filter(full).map((x, i) => ({ id: `nv-${seq}-${i}`, plate: x.plate.trim().toUpperCase(), make: x.make.trim(), model: x.model.trim(), year: Number(x.year) || 2020, kind: 'car' as const }));
    const c: Customer = { id: `nc-${seq}`, name: d.name.trim(), phone: d.phone.trim(), vehicles, since: '2026-11-01' };
    setAddingBoth(false);
    onPick(c, vehicles[0]!.id);
  };

  const link = 'inline-flex min-h-8 flex-none items-center gap-1 text-[13px] font-semibold text-accent underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:min-h-11';

  if (customer) {
    const veh = customer.vehicles.find((v) => v.id === vehicleId) ?? customer.vehicles[0];
    const carOk = car && car.plate.trim() && car.make.trim() && car.model.trim();
    const saveCar = () => {
      if (!car || !carOk) return;
      seq += 1;
      const v: Vehicle = { id: `nv-${seq}-c`, plate: car.plate.trim().toUpperCase(), make: car.make.trim(), model: car.model.trim(), year: Number(car.year) || 2020, kind: 'car' };
      setCarDraft(null); onAddingChange?.(false);
      onPick({ ...customer, vehicles: [...customer.vehicles, v] }, v.id);
    };
    return (
      <dl>
        <Row k="Customer" v={
          <span className="flex items-center justify-between gap-3">
            <span className="min-w-0">{customer.name} <span className="tabular-nums text-muted">· {customer.phone}</span>{customer.id.startsWith('nc-') && <span className="ml-2 rounded-chip border border-accent bg-accent-tint px-1.5 py-0.5 align-middle text-[12px] font-medium">New</span>}</span>
            <button type="button" onClick={onClear} aria-label={`Change customer, now ${customer.name}`} className={link}>Change</button>
          </span>
        } />
        <Row k="Car" v={
          <div>
            <div className="flex items-center justify-between gap-3">
              {customer.vehicles.length > 1
                ? <div className="min-w-0 flex-1 max-w-[420px]"><Select aria-label="Which car" value={veh?.id ?? ''} onValueChange={(id) => onPick(customer, id)} options={customer.vehicles.map((v) => ({ value: v.id, label: `${v.plate} · ${vehicleLine(v)}` }))} /></div>
                : veh ? <span className="min-w-0">{vehicleLine(veh)} <span className="font-mono text-muted">· {veh.plate}</span></span> : <span className="text-muted">No car on file.</span>}
              {!car && <button type="button" className={link} onClick={() => { setCarDraft(blank()); onAddingChange?.(true); }}><Plus size={12} weight="bold" aria-hidden />Add car</button>}
            </div>
            {car && (
              <fieldset className="mt-2" onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') { e.preventDefault(); saveCar(); } if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); setCarDraft(null); onAddingChange?.(false); } }}>
                <legend className="sr-only">New car for {customer.name}</legend>
                <div className="grid grid-cols-4 gap-3 max-[640px]:grid-cols-2">
                  <TextField label="Plate" value={car.plate} onChange={(e) => setCarDraft({ ...car, plate: e.target.value.toUpperCase() })} placeholder="NBC 4521" autoComplete="off" autoFocus className="[&_input]:font-mono" />
                  <TextField label="Make" value={car.make} onChange={(e) => setCarDraft({ ...car, make: e.target.value })} placeholder="Toyota" />
                  <TextField label="Model" value={car.model} onChange={(e) => setCarDraft({ ...car, model: e.target.value })} placeholder="Vios" />
                  <TextField label="Year" type="number" value={car.year} onChange={(e) => setCarDraft({ ...car, year: e.target.value })} placeholder="2018" />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Button variant="secondary" type="button" disabled={!carOk} onClick={saveCar}>Add car</Button>
                  <Button variant="text" type="button" onClick={() => { setCarDraft(null); onAddingChange?.(false); }}>Cancel</Button>
                </div>
              </fieldset>
            )}
          </div>
        } />
      </dl>
    );
  }

  if (adding) {
    return (
      <dl>
        <Row k="New customer" v={
          <fieldset
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') { e.preventDefault(); save(); } if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); setAddingBoth(false); } }}
          >
            <legend className="sr-only">New customer</legend>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 max-[640px]:grid-cols-1">
              <TextField label="Name" value={d.name} onChange={set('name')} autoComplete="off" />
              <TextField label="Phone" type="tel" value={d.phone} onChange={set('phone')} placeholder="0917 000 0000" />
            </div>
            {d.cars.map((c, i) => (
              <div key={c.id} className="mt-4 border-t border-rule pt-3">
                <div className="mb-2 flex items-center justify-between gap-2"><p className="text-[13px] font-semibold">Car {i + 1}</p>
                  {d.cars.length > 1 && <Button variant="text" type="button" leftIcon={Trash} aria-label={`Remove car ${i + 1}`} onClick={() => setD((x) => ({ ...x, cars: x.cars.filter((y) => y.id !== c.id) }))}>Remove</Button>}</div>
                <div className="grid grid-cols-4 gap-3 max-[640px]:grid-cols-2">
                  <TextField label="Plate" value={c.plate} onChange={setCar(c.id, 'plate')} placeholder="NBC 4521" autoComplete="off" className="[&_input]:font-mono" />
                  <TextField label="Make" value={c.make} onChange={setCar(c.id, 'make')} placeholder="Toyota" />
                  <TextField label="Model" value={c.model} onChange={setCar(c.id, 'model')} placeholder="Vios" />
                  <TextField label="Year" type="number" value={c.year} onChange={setCar(c.id, 'year')} placeholder="2018" />
                </div>
              </div>
            ))}
            <button type="button" className={cn(link, 'mt-2')} onClick={() => setD((x) => ({ ...x, cars: [...x.cars, blank()] }))}><Plus size={12} weight="bold" aria-hidden />Add another car</button>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button variant="primary" type="button" disabled={!valid} onClick={save}>Save customer</Button>
              <Button variant="text" type="button" onClick={() => setAddingBoth(false)}>Cancel</Button>
              {!valid && <span className="min-w-0 text-[12px] leading-4 text-muted">Name, phone and one car (plate, make, model) are needed.</span>}
            </div>
          </fieldset>
        } />
      </dl>
    );
  }

  const typed = q.trim();
  return (
    <dl>
      <Row k="Customer" v={
        <div className="flex items-start gap-4">
          <Combobox
            className="min-w-0 flex-1" hideLabel search
            label="Find customer by name, phone or plate" value={q} onValueChange={setQ} options={options} onSelect={(id) => { const [cid, vid] = id.split('|'); const c = customers.find((x) => x.id === cid); if (c) onPick(c, vid!); }}
            placeholder="Find customer by name, phone or plate" heading={typed ? undefined : 'Recent customers'} emptyText={typed ? 'No customer matches that.' : 'No customers yet.'}
            action={{ id: 'add', label: typed ? `Add new customer ${typed}` : 'Add new customer', onSelect: startAdd, node: (<><Plus size={16} weight="bold" aria-hidden className="flex-none" /><span className="min-w-0 truncate">New customer{typed ? <span className="font-normal text-muted"> · &ldquo;{typed}&rdquo;</span> : null}</span></>) }}
          />
          <button type="button" className={cn(link, 'h-[var(--ctl-dropdown)]')} onClick={startAdd}><Plus size={12} weight="bold" aria-hidden />New customer</button>
        </div>
      } />
      <Row k="Car" v={<span className="text-muted">Pick a customer first.</span>} />
    </dl>
  );
}
