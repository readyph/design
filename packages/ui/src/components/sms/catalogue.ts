/**
 * Service catalogue ("Services & prices"): the shop's own list of service types. One shared store for the New service wizard (Step 1),
 * the Settings > Services & prices page, the sample services' ids and duration (calendar card length) and the Services category filter.
 * Sample data to replace: in the real product this is a Settings-owned list per branch (API does not have it yet).
 */
import { useSyncExternalStore } from 'react';
import { onHandHere, products, stockState, type Product, type StockState } from './data';

export const CATEGORIES = ['Maintenance', 'Brakes', 'Engine', 'Electrical', 'Aircon', 'Suspension', 'Tires & wheels', 'Body'] as const;
export type Category = (typeof CATEGORIES)[number];
export type VehicleScope = 'all' | 'car' | 'motorcycle';

export interface ServiceType {
  id: string;
  name: string;
  category: Category;
  /** Default price in PHP: what a new job line starts at. The manager may edit it per job. */
  price: number;
  /** Estimated minutes: drives the calendar card length. */
  mins: number;
  description?: string;
  vehicle: VehicleScope;
  active: boolean;
  /** Other names the sample jobs use for the same service (mapped to this id). A name that starts with one of these also matches. */
  aliases?: string[];
  /** Inventory products this service normally uses, with the default quantity per service. Zero or more. Labour is `price`; parts are priced from Inventory. */
  parts?: ServicePart[];
}
/** A link from a service to an Inventory product (invented: the sms API has no such link yet). */
export interface ServicePart { productId: string; qty: number }

export const VEHICLE_SCOPE_LABEL: Record<VehicleScope, string> = { all: 'Cars and motorcycles', car: 'Cars only', motorcycle: 'Motorcycles only' };

type Seed = [name: string, category: Category, price: number, mins: number, vehicle?: VehicleScope, description?: string, aliases?: string[], active?: boolean];
const SEED: Seed[] = [
  ['Change oil (Shell Helix 10W-40)', 'Maintenance', 450, 60, 'car', 'Labour only. Oil and filter are parts from Inventory.', ['Oil change']],
  ['Change oil, motorcycle', 'Maintenance', 250, 30, 'motorcycle', 'Labour only.'],
  ['10,000 km PMS', 'Maintenance', 2800, 120, 'all', 'Oil and filter, fluids top-up, 20-point check.'],
  ['20,000 km PMS', 'Maintenance', 3200, 120, 'car'],
  ['40,000 km PMS', 'Maintenance', 3500, 180, 'car'],
  ['50,000 km PMS', 'Maintenance', 4200, 180, 'car'],
  ['Tune-up', 'Maintenance', 1200, 120, 'car'],
  ['Major tune-up', 'Maintenance', 3600, 120, 'car', 'Spark plug set, throttle body cleaning, valve clearance check.', ['Major tune-up incl.']],
  ['CVT cleaning', 'Maintenance', 350, 90, 'all'],
  ['Brake pad replacement, front', 'Brakes', 800, 120, 'car'],
  ['Brake pad replacement, rear', 'Brakes', 800, 120, 'car'],
  ['Brake pad replacement, motorcycle', 'Brakes', 350, 60, 'motorcycle'],
  ['Brake fluid flush', 'Brakes', 700, 60, 'car'],
  ['Rotor resurfacing', 'Brakes', 1200, 30, 'car'],
  ['Full brake system overhaul', 'Brakes', 2800, 180, 'car', 'Pads, rotor resurfacing and fluid flush.', ['Full brake system overhaul incl.']],
  ['Engine diagnosis', 'Engine', 500, 60, 'all', 'Scanner read-out and a written finding.'],
  ['Timing belt replacement', 'Engine', 2800, 240, 'car'],
  ['Drive belt replacement', 'Engine', 300, 30, 'car'],
  ['Radiator flush', 'Engine', 900, 90, 'car'],
  ['Thermostat check', 'Engine', 300, 60, 'car'],
  ['Clutch replacement', 'Engine', 4500, 240, 'car', 'Clutch kit is a part from Inventory.'],
  ['Battery replacement', 'Electrical', 300, 30, 'all', 'Labour only.'],
  ['Alternator replacement', 'Electrical', 1500, 180, 'car', 'Includes drive belt, charging system test and terminal service.', ['Alternator replacement incl.']],
  ['Charging system test', 'Electrical', 400, 30, 'all'],
  ['Starter check', 'Electrical', 350, 60, 'car'],
  ['Aircon cleaning', 'Aircon', 2500, 120, 'car'],
  ['Freon recharge', 'Aircon', 1800, 120, 'car'],
  ['Aircon check', 'Aircon', 400, 30, 'car'],
  ['Shock absorber replacement, front', 'Suspension', 1400, 120, 'car'],
  ['Stabilizer link replacement', 'Suspension', 600, 90, 'car'],
  ['Wheel alignment', 'Tires & wheels', 700, 60, 'car'],
  ['Wheel balancing', 'Tires & wheels', 600, 60, 'car'],
  ['Tire rotation', 'Tires & wheels', 300, 30, 'car'],
  ['Flat tire repair', 'Tires & wheels', 150, 30, 'all'],
  ['Headlight restoration', 'Body', 1200, 60, 'car'],
  ['Minor dent repair, per panel', 'Body', 2500, 240, 'car', 'Quote after inspection; this is a starting price.'],
  ['Interior detailing', 'Body', 3500, 240, 'car', 'Paused until a second detailer is hired.', undefined, false],
];

/** Sample part links, by service name (Inventory product ids from the round's dataset). Oil: Shell Helix 4 L pail x1 + filter x1. */
const PARTS: Record<string, ServicePart[]> = {
  'Change oil (Shell Helix 10W-40)': [{ productId: 'pr01', qty: 1 }, { productId: 'pr02', qty: 1 }],
  'Change oil, motorcycle': [{ productId: 'pr12', qty: 1 }],
  '10,000 km PMS': [{ productId: 'pr01', qty: 1 }, { productId: 'pr02', qty: 1 }],
  '20,000 km PMS': [{ productId: 'pr01', qty: 1 }, { productId: 'pr02', qty: 1 }],
  'Major tune-up': [{ productId: 'pr06', qty: 4 }],
  'CVT cleaning': [{ productId: 'pr09', qty: 1 }],
  'Brake pad replacement, front': [{ productId: 'pr03', qty: 1 }],
  'Radiator flush': [{ productId: 'pr07', qty: 2 }],
  'Timing belt replacement': [{ productId: 'pr05', qty: 1 }],
  'Battery replacement': [{ productId: 'pr10', qty: 1 }],
  'Alternator replacement': [{ productId: 'pr04', qty: 1 }],
  'Aircon cleaning': [{ productId: 'pr11', qty: 1 }],
  'Shock absorber replacement, front': [{ productId: 'pr08', qty: 1 }],
};

const seed = (): ServiceType[] => SEED.map(([name, category, price, mins, vehicle = 'all', description, aliases, active = true], i) => ({
  id: `sv${String(i + 1).padStart(2, '0')}`, name, category, price, mins, vehicle, description, aliases, active, parts: PARTS[name],
}));

// ---- the store (one list, shared by every page that reads it) ----
let items: ServiceType[] = seed();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const getCatalogue = () => items;
/** React hook: the live list, re-renders on add / edit / deactivate. */
export const useCatalogue = (): ServiceType[] => useSyncExternalStore(subscribe, getCatalogue, getCatalogue);

let nextId = SEED.length + 1;
export const newTypeId = () => `sv${String(nextId++).padStart(2, '0')}`;
/** Add (unknown id) or replace (known id). */
export function saveType(t: ServiceType): void {
  items = items.some((x) => x.id === t.id) ? items.map((x) => (x.id === t.id ? t : x)) : [...items, t];
  emit();
}
export function setActive(id: string, active: boolean): void { items = items.map((x) => (x.id === id ? { ...x, active } : x)); emit(); }
export function resetCatalogue(): void { items = seed(); nextId = SEED.length + 1; emit(); }

export const typeById = (id: string | null | undefined) => items.find((x) => x.id === id) ?? null;
/** The catalogue entry a service name belongs to: exact name, then alias, then the longest name or alias the text starts with. */
export function typeFor(name: string): ServiceType | null {
  const n = name.trim().toLowerCase();
  let best: { t: ServiceType; len: number } | null = null;
  for (const t of items) {
    for (const key of [t.name, ...(t.aliases ?? [])]) {
      const k = key.toLowerCase();
      if ((n === k || n.startsWith(`${k} `)) && (!best || k.length > best.len)) best = { t, len: k.length };
    }
  }
  return best?.t ?? null;
}
export const typeIdFor = (name: string): string | null => typeFor(name)?.id ?? null;
export const categoryOfName = (name: string): Category | null => typeFor(name)?.category ?? null;
/** Minutes for a service name, or null when it is not in the catalogue. */
export const minutesOfName = (name: string): number | null => typeFor(name)?.mins ?? null;

export const forVehicle = (t: ServiceType, kind: 'car' | 'van' | 'pickup' | 'motorcycle' | null) =>
  !kind || t.vehicle === 'all' || (kind === 'motorcycle' ? t.vehicle === 'motorcycle' : t.vehicle === 'car');

// ---- parts link helpers ----
/** Parts cost at today's Inventory sell price (for one service). `list` is the host's products (default: the sample products); an unknown product counts as 0. */
export const partsCost = (parts: ServicePart[] | undefined, list: Product[] = products) => (parts ?? []).reduce((a, p) => a + (list.find((x) => x.id === p.productId)?.price ?? 0) * p.qty, 0);
/** Worst stock state among the linked parts, for the tag in the list: out, low or on order beat in stock. Parts missing from `list` are skipped. */
export function partsStock(parts: ServicePart[] | undefined, list: Product[] = products): { state: StockState | 'none'; worst?: string } {
  let rank = 0; let worst: string | undefined; let state: StockState | 'none' = (parts?.length ?? 0) ? 'in' : 'none';
  const order: Record<StockState, number> = { in: 0, low: 1, on_order: 2, out: 3 };
  for (const p of parts ?? []) {
    const pr = list.find((x) => x.id === p.productId);
    if (!pr) continue;
    const st = onHandHere(pr) < p.qty && stockState(pr) === 'in' ? 'low' : stockState(pr);
    if (order[st] > rank) { rank = order[st]; state = st; worst = pr.name; }
  }
  return { state, worst };
}

/** Story helper: awkward rows for the table (very long name and description, many linked parts, an inactive one with parts). Display only, never saved. */
export const STRESS_ROWS: ServiceType[] = [
  { id: 'zz1', name: 'Complete underchassis rust-proofing and sound-deadening treatment with full wheel-well coating, front and rear', category: 'Body', price: 12500, mins: 360, vehicle: 'car', active: true,
    description: 'Pressure-wash, dry, treat all seams, apply wax-based coating to the underbody, wheel wells, door sills and cross-members, then a 7-day recheck visit is included in the price.', parts: [{ productId: 'pr01', qty: 1 }, { productId: 'pr02', qty: 1 }, { productId: 'pr03', qty: 1 }, { productId: 'pr06', qty: 8 }, { productId: 'pr07', qty: 2 }, { productId: 'pr11', qty: 2 }, { productId: 'pr04', qty: 1 }] },
  { id: 'zz2', name: 'Pangalan na pangalan', category: 'Tires & wheels', price: 1234567, mins: 15, vehicle: 'motorcycle', active: false, description: 'Paused.', parts: [{ productId: 'pr05', qty: 1 }, { productId: 'pr09', qty: 1 }] },
];
