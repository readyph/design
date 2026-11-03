/** New service wizard: the draft, totals, and how a draft becomes a job order or a quotation (and back). Pure functions. */
import { HOURS, NOW, TODAY, onHandHere, type Customer, type Job, type PartLine, type ServiceLine } from './data';
import { SLOT, addDays, toIso } from './scheduleModel';
import { productIn, seedWizardData, typeIn, type WizardData } from './wizardData';

export interface WizardLine {
  key: string;
  kind: 'service' | 'part';
  /** Catalogue entry (service lines picked from the catalogue). */
  typeId?: string;
  /** Inventory product (part lines). */
  productId?: string;
  name: string;
  qty: number;
  price: number;
  /** The set price when this line started: price !== listPrice means "Custom price". null for custom lines. */
  listPrice: number | null;
  /** Typed in by hand: not in the catalogue. */
  custom: boolean;
  /** Part lines only: the service line (key) this part belongs to. Absent: a loose part. */
  parentKey?: string;
  /** Part lines only: added automatically from the service's parts link (not picked by hand). */
  auto?: boolean;
}

export interface WizardDraft {
  customer: Customer | null;
  vehicleId: string;
  lines: WizardLine[];
  date: string;
  start: number;
  dur: number;
  /** null: promised when the booking ends. */
  promisedMin: number | null;
  mechanicId: string | null;
  mileageIn: string;
  concerns: string;
  remarks: string;
}

export type WizardAction = 'book' | 'quote';

export const lineTotal = (l: WizardLine) => l.price * l.qty;
export const subtotal = (lines: WizardLine[]) => lines.reduce((a, l) => a + lineTotal(l), 0);
export const isCustomPrice = (l: WizardLine) => l.kind === 'service' && !l.custom && l.listPrice !== null && l.price !== l.listPrice;
export const promisedOf = (d: Pick<WizardDraft, 'start' | 'dur' | 'promisedMin'>) => d.promisedMin ?? Math.min(HOURS.close, d.start + d.dur);

let seq = 0;
export const newKey = () => `wl-${++seq}`;

export const lineFromType = (id: string, data: WizardData = seedWizardData()): WizardLine | null => {
  const t = typeIn(data, id);
  return t ? { key: newKey(), kind: 'service', typeId: t.id, name: t.name, qty: 1, price: t.price, listPrice: t.price, custom: false } : null;
};
/** A catalogue service plus its linked Inventory parts as sub-lines (qty from the link, price from Inventory). The manager never maps them by hand. */
export const linesFromType = (id: string, data: WizardData = seedWizardData()): WizardLine[] => {
  const svc = lineFromType(id, data);
  if (!svc) return [];
  const t = typeIn(data, id)!;
  return [svc, ...(t.parts ?? []).filter((lp) => productIn(data, lp.productId)).map((lp): WizardLine => ({ ...partLine(lp.productId, svc.key, true, data), qty: lp.qty }))];
};
/** Insert a part under its service (after the service's last sub-line), or at the end when it has no service. */
export function insertPart(lines: WizardLine[], part: WizardLine): WizardLine[] {
  if (!part.parentKey) return [...lines, part];
  let at = lines.findIndex((l) => l.key === part.parentKey);
  if (at < 0) return [...lines, part];
  while (lines[at + 1]?.parentKey === part.parentKey) at++;
  return [...lines.slice(0, at + 1), part, ...lines.slice(at + 1)];
}
/** Removing a service removes its sub-lines too. */
export const removeLine = (lines: WizardLine[], key: string) => lines.filter((l) => l.key !== key && l.parentKey !== key);
/** How many of a product the whole draft needs, and what this branch has: short when needed > on hand. */
export function partNeed(lines: WizardLine[], productId: string, data: WizardData = seedWizardData()) {
  const need = lines.filter((l) => l.kind === 'part' && l.productId === productId).reduce((a, l) => a + l.qty, 0);
  const p = productIn(data, productId);
  const have = p ? onHandHere(p) : 0;
  return { need, have, short: Math.max(0, need - have) };
}
export const customLine = (name: string, price: number): WizardLine => ({ key: newKey(), kind: 'service', name, qty: 1, price, listPrice: null, custom: true });
export const partLine = (productId: string, parentKey?: string, auto = false, data: WizardData = seedWizardData()): WizardLine => {
  const p = productIn(data, productId)!;
  return { key: newKey(), kind: 'part', productId, name: p.name, qty: 1, price: p.price, listPrice: p.price, custom: false, parentKey, auto: auto || undefined };
};

export const emptyDraft = (init: Partial<WizardDraft> = {}): WizardDraft => ({
  customer: null, vehicleId: '', lines: [], date: TODAY, start: Math.min(HOURS.close - SLOT, Math.max(HOURS.open, Math.ceil((10 * 60 + 20) / SLOT) * SLOT)), dur: 60, promisedMin: null,
  mechanicId: null, mileageIn: '', concerns: '', remarks: '', ...init,
});

/** What the wizard compares to know whether anything was changed (customer object left out; its id is enough). */
export const dirtyKey = (d: WizardDraft) => JSON.stringify({ ...d, customer: d.customer?.id ?? null });

// ---- numbers ----
const pad4 = (n: number) => String(n).padStart(4, '0');
export const quoteNoOf = (j: Job) => j.quoteNo ?? `QT-${pad4(Number(j.number.replace(/\D/g, '')) || 0)}`;
export const isQuote = (j: Job) => j.status === 'QUOTATION' || j.status === 'FOR_APPROVAL';
/** A quotation exists for this service: still waiting, or kept after it was booked. */
export const hasQuotation = (j: Job) => isQuote(j) || !!j.quoteNo;
export const nextQuoteNo = (n: number) => `QT-${pad4(8 + n)}`;
export const validUntilDefault = () => addDays(TODAY, 7);

// ---- draft <-> job ----
const toServiceLines = (d: WizardDraft): ServiceLine[] => d.lines.filter((l) => l.kind === 'service').map((l) => ({
  name: l.name, price: l.price, qty: l.qty, done: false, typeId: l.typeId ?? null, custom: l.custom || undefined, listPrice: isCustomPrice(l) ? l.listPrice ?? undefined : undefined,
}));
const toPartLines = (d: WizardDraft): PartLine[] => d.lines.filter((l) => l.kind === 'part').map((l) => ({ productId: l.productId!, qty: l.qty, issued: 0 }));

/** The job fields a draft sets. `number` is given by the caller (JO- for a booking, QT- for a parked quotation). */
export function jobFieldsOf(d: WizardDraft, action: WizardAction): Partial<Job> {
  return {
    status: action === 'book' ? 'TODO' : 'QUOTATION', customerId: d.customer!.id, vehicleId: d.vehicleId || d.customer!.vehicles[0]!.id, assigneeId: d.mechanicId,
    promisedAt: toIso(d.date, promisedOf(d)), complaint: d.concerns.trim() || d.lines.filter((l) => l.kind === 'service').map((l) => l.name).join(', '),
    services: toServiceLines(d), parts: toPartLines(d), remarks: d.remarks.trim() || undefined, mileageIn: Number(d.mileageIn.replace(/\D/g, '')) || undefined,
    quoteParked: action === 'quote' ? true : undefined,
  };
}

export function newJob(id: string, number: string, d: WizardDraft, action: WizardAction, quoteNo?: string): Job {
  return {
    id, number, createdAt: NOW, statusSince: NOW, payments: [], ...(jobFieldsOf(d, action) as Required<Pick<Job, 'status' | 'customerId' | 'vehicleId' | 'assigneeId' | 'promisedAt' | 'complaint' | 'services' | 'parts'>>),
    remarks: d.remarks.trim() || undefined, mileageIn: Number(d.mileageIn.replace(/\D/g, '')) || undefined, quoteParked: action === 'quote' ? true : undefined,
    quoteNo: action === 'quote' ? quoteNo : undefined, quoteValidUntil: action === 'quote' ? validUntilDefault() : undefined,
  };
}

/** Back from a job to a draft (Edit quote, Book it). The booking length is the stored one when given. */
export function draftFromJob(j: Job, booking?: { date: string; start: number; dur: number } | null, data: WizardData = seedWizardData()): Partial<WizardDraft> {
  const c = data.customers.find((x) => x.id === j.customerId) ?? null;
  const lines: WizardLine[] = [
    ...j.services.map((s): WizardLine => ({ key: newKey(), kind: 'service', typeId: s.typeId ?? undefined, name: s.name, qty: s.qty, price: s.price, listPrice: s.custom ? null : s.listPrice ?? s.price, custom: !!s.custom })),
    ...j.parts.map((p): WizardLine => { const pr = productIn(data, p.productId); return { key: newKey(), kind: 'part', productId: p.productId, name: pr?.name ?? p.productId, qty: p.qty, price: p.price ?? pr?.price ?? 0, listPrice: pr?.price ?? null, custom: false }; }),
  ];
  const date = booking?.date ?? j.promisedAt?.slice(0, 10) ?? TODAY;
  const end = j.promisedAt ? Number(j.promisedAt.slice(11, 13)) * 60 + Number(j.promisedAt.slice(14, 16)) : undefined;
  const start = booking?.start ?? (end !== undefined ? Math.max(HOURS.open, end - 60) : emptyDraft().start);
  return {
    customer: c, vehicleId: j.vehicleId, lines, date, start, dur: booking?.dur ?? (end !== undefined ? end - start : 60), promisedMin: null,
    mechanicId: j.assigneeId, mileageIn: j.mileageIn ? String(j.mileageIn) : '', concerns: j.complaint === j.services.map((s) => s.name).join(', ') ? '' : j.complaint, remarks: j.remarks ?? '',
  };
}

// ---- the printable quotation ----
export interface QuoteDoc {
  number: string;
  issued: string;
  validUntil: string;
  customer: string;
  phone: string;
  car: string;
  plate: string;
  lines: { name: string; qty: number; price: number; custom: boolean; /** A part from Inventory (shown indented, smaller). */ part?: boolean }[];
  total: number;
  remarks: string;
  shop: { business: string; branch: string; address: string; phone: string; preparedBy: string };
}

export function docFromDraft(d: WizardDraft, number: string, validUntil = validUntilDefault(), shop: QuoteDoc['shop'] = seedWizardData().shop): QuoteDoc {
  const v = d.customer?.vehicles.find((x) => x.id === d.vehicleId) ?? d.customer?.vehicles[0];
  return {
    number, issued: TODAY, validUntil, customer: d.customer?.name ?? '', phone: d.customer?.phone ?? '', car: v ? `${v.make} ${v.model} ${v.year}` : '', plate: v?.plate ?? '',
    lines: d.lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price, custom: l.custom || isCustomPrice(l), part: l.kind === 'part' || undefined })), total: subtotal(d.lines), remarks: d.remarks.trim(), shop,
  };
}
export function docFromJob(j: Job, data: WizardData = seedWizardData()): QuoteDoc {
  const shop = data.shop;
  const c = data.customers.find((x) => x.id === j.customerId);
  const v = c?.vehicles.find((x) => x.id === j.vehicleId);
  const lines = [
    ...j.services.map((s) => ({ name: s.name, qty: s.qty, price: s.price, custom: !!s.custom || (s.listPrice !== undefined && s.listPrice !== s.price) })),
    ...j.parts.map((p) => { const pr = productIn(data, p.productId); return { name: pr?.name ?? p.productId, qty: p.qty, price: p.price ?? pr?.price ?? 0, custom: false, part: true }; }),
  ];
  return {
    number: quoteNoOf(j), issued: (j.quoteSentAt ?? j.createdAt).slice(0, 10), validUntil: j.quoteValidUntil ?? addDays((j.quoteSentAt ?? j.createdAt).slice(0, 10), 7),
    customer: c?.name ?? '', phone: c?.phone ?? '', car: v ? `${v.make} ${v.model} ${v.year}` : '', plate: v?.plate ?? '', lines, total: lines.reduce((a, l) => a + l.price * l.qty, 0), remarks: j.remarks ?? '', shop,
  };
}
