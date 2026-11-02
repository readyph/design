/**
 * Customers page model: one record per customer, derived from the shared 22 customers and the Services pool.
 * Notes are sample data (the shared data.ts has none). Nothing here is typed as a figure; spend, last visit and open services are computed.
 */
import { jobBalance, jobTotal, type Customer, type Job, type Vehicle } from './data';
import { reasonOf } from './floorModel';

export const SEED_NOTES: Record<string, string> = {
  c01: 'Prefers a text before any work over P2,000. Pays by GCash.',
  c02: 'Runs the L300 as a delivery van: needs it back by end of day, always.',
  c06: 'Fleet owner for two Innovas; the second one is not in our system yet.',
  c12: 'Long name on the OR. Spell it as written, with "y Guzman".',
  c19: 'Oldest customer. Keeps every receipt; send a copy by text.',
};

export interface CustomerRec {
  customer: Customer;
  services: Job[];
  /** Not completed. */
  open: Job[];
  /** Newest service activity (ISO) or null. */
  last: string | null;
  /** Total of completed services. */
  spend: number;
  owed: number;
  /** Open services waiting on the manager (the only thing that gets the warning tint). */
  stuck: number;
}

export const recOf = (customer: Customer, pool: Job[]): CustomerRec => {
  const services = pool.filter((j) => j.customerId === customer.id).sort((a, b) => (a.statusSince < b.statusSince ? 1 : -1));
  const open = services.filter((j) => j.status !== 'COMPLETED');
  return {
    customer, services, open,
    last: services[0]?.statusSince ?? null,
    spend: services.filter((j) => j.status === 'COMPLETED').reduce((a, j) => a + jobTotal(j), 0),
    owed: services.filter((j) => j.status !== 'QUOTATION' && j.status !== 'FOR_APPROVAL').reduce((a, j) => a + Math.max(0, jobBalance(j)), 0),
    stuck: open.filter((j) => reasonOf(j)).length,
  };
};

export type ViewId = 'all' | 'open' | 'owes' | 'quiet';
export const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Has an open service' },
  { id: 'owes', label: 'Owes money' },
  { id: 'quiet', label: 'Not seen in 30 days' },
];
export type SortId = 'recent' | 'name' | 'spend';
export const SORTS: { id: SortId; label: string }[] = [
  { id: 'recent', label: 'Last visit, newest' },
  { id: 'name', label: 'Name, A to Z' },
  { id: 'spend', label: 'Total spend, highest' },
];

const flat = (s: string) => s.toLowerCase().replace(/[\s\-.]/g, '');
const digits = (s: string) => s.replace(/\D/g, '');

/** One search for a name, a phone number (3+ digits, +63 or 0 prefix) or a plate (spaces ignored); also the car's make and model. */
export function matchesQuery(c: Customer, q: string): boolean {
  const t = q.trim();
  if (!t) return true;
  const f = flat(t);
  const d = digits(t);
  const phone = digits(c.phone);
  if (d.length >= 3 && d.length >= f.length - 1 && (phone.includes(d) || phone.includes(d.replace(/^63/, '0')) || ('63' + phone.slice(1)).includes(d))) return true;
  if (flat(c.name).includes(f)) return true;
  return c.vehicles.some((v) => flat(v.plate).includes(f) || flat(`${v.make}${v.model}`).includes(f));
}

const THIRTY_DAYS_AGO = '2026-10-03';
export function inView(r: CustomerRec, v: ViewId): boolean {
  if (v === 'open') return r.open.length > 0;
  if (v === 'owes') return r.owed > 0;
  if (v === 'quiet') return r.open.length === 0 && (!r.last || r.last.slice(0, 10) < THIRTY_DAYS_AGO);
  return true;
}

export function sortRecs(rs: CustomerRec[], s: SortId): CustomerRec[] {
  const a = [...rs];
  if (s === 'name') return a.sort((x, y) => x.customer.name.localeCompare(y.customer.name));
  if (s === 'spend') return a.sort((x, y) => y.spend - x.spend || x.customer.name.localeCompare(y.customer.name));
  return a.sort((x, y) => (x.last && y.last ? (x.last < y.last ? 1 : -1) : x.last ? -1 : y.last ? 1 : 0) || x.customer.name.localeCompare(y.customer.name));
}

/** The plate to offer when the search matches nobody: the search text, tidied if it looks like a plate. */
export const looksLikePlate = (q: string) => /^[A-Za-z]{2,3}\s?\d{3,4}$|^\d{4}\s?[A-Za-z]{2,3}$/.test(q.trim());
export const platePretty = (q: string) => { const t = q.trim().toUpperCase(); return looksLikePlate(t) && !t.includes(' ') ? t.replace(/^([A-Z]{2,3})(\d+)$/, '$1 $2').replace(/^(\d{4})([A-Z]+)$/, '$1 $2') : t; };

/** A car as typed in a form: every field a string, so a half-typed value is never lost. */
export interface CarDraft {
  id: string; plate: string; make: string; model: string; year: string;
  kind?: Vehicle['kind']; colour?: string; mileage?: string; vin?: string; fuel?: string; transmission?: string; notes?: string; remindEvery?: string;
}
export interface Draft { name: string; phone: string; notes: string; vehicles: CarDraft[] }

let carSeq = 0;
export const blankCar = (plate = ''): CarDraft => ({ id: `nv${Date.now().toString(36)}${++carSeq}`, plate, make: '', model: '', year: '', kind: 'car', colour: '', mileage: '', vin: '', fuel: '', transmission: '', notes: '', remindEvery: '' });
export const carToDraft = (v: Vehicle): CarDraft => ({ id: v.id, plate: v.plate, make: v.make, model: v.model, year: String(v.year), kind: v.kind, colour: v.colour ?? '', mileage: v.mileage != null ? String(v.mileage) : '', vin: v.vin ?? '', fuel: v.fuel ?? '', transmission: v.transmission ?? '', notes: v.notes ?? '', remindEvery: v.remindEvery ? String(v.remindEvery) : '' });
export function draftToCar(v: CarDraft, thisYear: number): Vehicle {
  const car: Vehicle = { id: v.id, plate: v.plate.trim().toUpperCase(), make: v.make.trim(), model: v.model.trim(), year: Number(v.year) || thisYear, kind: v.kind ?? 'car' };
  if (v.colour?.trim()) car.colour = v.colour.trim();
  if (v.mileage && Number(v.mileage) > 0) car.mileage = Math.round(Number(v.mileage));
  if (v.vin?.trim()) car.vin = v.vin.trim().toUpperCase();
  if (v.fuel) car.fuel = v.fuel as Vehicle['fuel'];
  if (v.transmission) car.transmission = v.transmission as Vehicle['transmission'];
  if (v.notes?.trim()) car.notes = v.notes.trim();
  if (v.remindEvery) car.remindEvery = Number(v.remindEvery) as 3 | 6 | 12;
  return car;
}
/** Another customer's (or car's) record already using this plate; spaces and dashes ignored. */
export function plateTwin(plate: string, selfId: string, all: Customer[]): { customer: Customer; vehicle: Vehicle } | null {
  const f = plate.toLowerCase().replace(/[\s-]/g, '');
  if (f.length < 4) return null;
  for (const c of all) for (const v of c.vehicles) if (v.id !== selfId && v.plate.toLowerCase().replace(/[\s-]/g, '') === f) return { customer: c, vehicle: v };
  return null;
}
