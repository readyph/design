/**
 * Data source of the Services list (ServicesTable, ServiceCard, ServicesToolbar, BulkBar, servicesModel).
 * Storybook and the prototypes use the sample data (the default). A host app wraps the list in <ServicesDataProvider> with its own
 * customers (with vehicles), Inventory products, mechanics and clock, so rows resolve real people, cars and parts, and the
 * date ranges ("today", last 7 / 30 days) count from the host's "now" instead of a fixed day.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { NOW, customers, mechanics, onHandElsewhere, onHandHere, peso, products, stockState, type Customer, type Job, type Mechanic, type PartLine, type Product, type Vehicle } from './data';
import * as today from '../today/model';
import type { Flag, TodayEnv } from '../today/types';
import type { NeedsReason } from './data';

/** A person a service can be assigned to. */
export type ServicesPerson = Pick<Mechanic, 'id' | 'name' | 'short' | 'initials' | 'bay'>;

export interface ServicesSource {
  /** ISO timestamp of the host's "now" (with offset), e.g. `2026-11-02T10:20:00+08:00`. */
  now: string;
  /** Customers with their vehicles. */
  customers: Customer[];
  /** Inventory products with price and stock. */
  products: Product[];
  /** Mechanics: the toolbar options, the bulk "Assign to" menu and the row avatar. */
  mechanics: ServicesPerson[];
}

/** The prototype's sample data (the default everywhere no provider is mounted). */
export const seedServicesSource = (): ServicesSource => ({ now: NOW, customers, products, mechanics });

const UNKNOWN_VEHICLE: Vehicle = { id: '', plate: '-', make: 'Unknown', model: 'vehicle', year: 0, kind: 'car' };
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export interface JobView { job: Job; plate: string; vehicle: string; customer: string; phone: string; mechanic: string | null }

/** Everything the Services list derives from a source. Built once per source by `servicesApi`. */
export function buildServicesApi(src: ServicesSource) {
  const customerOf = (j: Job) => src.customers.find((c) => c.id === j.customerId);
  const vehicleOf = (j: Job) => customerOf(j)?.vehicles.find((v) => v.id === j.vehicleId) ?? UNKNOWN_VEHICLE;
  const productOf = (id: string) => src.products.find((p) => p.id === id);
  const mechanicOf = (id: string | null) => (id ? src.mechanics.find((m) => m.id === id) ?? null : null);
  const price = (l: PartLine) => l.price ?? productOf(l.productId)?.price ?? 0;
  const subtotal = (j: Job) => sum(j.services.map((s) => s.price * s.qty)) + sum(j.parts.map((l) => price(l) * l.qty));
  const discount = (j: Job) => {
    const d = j.discount; if (!d || d.value <= 0) return 0;
    const raw = d.kind === 'percent' ? Math.round((subtotal(j) * Math.min(d.value, 100)) / 100) : d.value;
    return Math.min(Math.max(raw, 0), subtotal(j));
  };
  const total = (j: Job) => subtotal(j) - discount(j);
  const balance = (j: Job) => total(j) - sum(j.payments.map((p) => p.amount));
  const shortLines = (j: Job) => j.parts.filter((l) => { const p = productOf(l.productId); return !!p && l.qty - l.issued > onHandHere(p); });
  const nowDay = src.now.slice(0, 10);
  const env: TodayEnv = {
    now: src.now, today: nowDay, stockState, elsewhere: onHandElsewhere,
    shortParts: (j) => shortLines(j as Job).map((l) => productOf(l.productId)!),
    balance: (j) => balance(j as Job), peso,
  };
  const dayShift = (days: number) => new Date(new Date(`${nowDay}T12:00:00Z`).getTime() - days * 86_400_000).toISOString().slice(0, 10);
  return {
    src, env, today: nowDay, customerOf, vehicleOf, productOf, mechanicOf, total, balance, shortLines,
    viewOf: (j: Job): JobView => {
      const v = vehicleOf(j); const c = customerOf(j);
      return { job: j, plate: v.plate, vehicle: v.year ? `${v.make} ${v.model} ${v.year}` : `${v.make} ${v.model}`, customer: c?.name ?? 'Unknown customer', phone: c?.phone ?? '', mechanic: mechanicOf(j.assigneeId)?.short ?? null };
    },
    reasonOf: (j: Job): NeedsReason | null => today.reasonOf(env, j),
    flagOf: (j: Job): Flag | null => today.flagOf(env, j),
    dayWord: (iso: string) => today.dayWord(iso, nowDay),
    shortDate: (iso: string) => (iso.startsWith(nowDay) ? `Today ${today.hm(iso)}` : new Date(`${iso.slice(0, 10)}T12:00:00+08:00`).toLocaleDateString('en-PH', { day: 'numeric', month: 'short' })),
    /** First day (YYYY-MM-DD) included by a range filter. */
    rangeFrom: (r: '7d' | '30d') => dayShift(r === '7d' ? 7 : 30),
  };
}
export type ServicesApi = ReturnType<typeof buildServicesApi>;

const cache = new WeakMap<ServicesSource, ServicesApi>();
export const servicesApi = (src: ServicesSource): ServicesApi => { let a = cache.get(src); if (!a) { a = buildServicesApi(src); cache.set(src, a); } return a; };

/** The sample data's API. The sample arrays are shared and edited in place, so lookups made through it always see the latest. */
export const seedServicesApi: ServicesApi = buildServicesApi(seedServicesSource());

const Ctx = createContext<ServicesApi | null>(null);

export function ServicesDataProvider({ data, children }: { data: ServicesSource; children: ReactNode }) {
  const api = useMemo(() => servicesApi(data), [data]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/** The host's data when a provider is mounted, else the sample data. */
export function useServicesApi(): ServicesApi {
  const ctx = useContext(Ctx);
  return ctx ?? seedServicesApi;
}
