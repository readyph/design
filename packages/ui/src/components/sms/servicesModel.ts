/** Services page: filter, sort and view logic. Pure functions over Job[]; figures come from ../data and ./servicesData. */
import { TODAY, jobBalance, mechanics, productOf, shortLines, type Job } from './data';
import { reasonOf, serviceTitle, viewOf } from './floorModel';

export type ViewId = 'all' | 'waiting' | 'quotes' | 'shop' | 'ready' | 'done';
export type RangeId = 'any' | 'today' | '7d' | '30d';
export type SortId = 'attention' | 'newest' | 'promised' | 'balance';

export interface Filters { q: string; view: ViewId; mechanic: string; range: RangeId; unpaid: boolean; parts: boolean }
export const NO_FILTERS: Filters = { q: '', view: 'all', mechanic: 'any', range: 'any', unpaid: false, parts: false };

export const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'waiting', label: 'Waiting for you' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'shop', label: 'In the shop' },
  { id: 'ready', label: 'Ready for pick-up' },
  { id: 'done', label: 'Completed' },
];
export const RANGES: { id: RangeId; label: string }[] = [
  { id: 'any', label: 'Any time' }, { id: 'today', label: 'Today' }, { id: '7d', label: 'Last 7 days' }, { id: '30d', label: 'Last 30 days' },
];
export const SORTS: { id: SortId; label: string }[] = [
  { id: 'attention', label: 'Waiting for you first' }, { id: 'newest', label: 'Newest activity' }, { id: 'promised', label: 'Promised time' }, { id: 'balance', label: 'Highest balance' },
];

const isQuote = (j: Job) => j.status === 'QUOTATION' || j.status === 'FOR_APPROVAL';
export const isUnpaid = (j: Job) => !isQuote(j) && jobBalance(j) > 0;
export const isWaitingOnParts = (j: Job) => j.status !== 'COMPLETED' && (shortLines(j).length > 0 || (j.status === 'PENDING' && j.pendingReason === 'WAITING_FOR_PARTS'));

export const inView = (j: Job, v: ViewId) => {
  switch (v) {
    case 'waiting': return !!reasonOf(j);
    case 'quotes': return isQuote(j);
    case 'shop': return j.status === 'TODO' || j.status === 'IN_PROGRESS' || j.status === 'PENDING';
    case 'ready': return j.status === 'FOR_PICKUP';
    case 'done': return j.status === 'COMPLETED';
    default: return true;
  }
};
const inRange = (j: Job, r: RangeId) => r === 'any' || (r === 'today' ? j.statusSince.startsWith(TODAY) : j.statusSince.slice(0, 10) >= (r === '7d' ? '2026-10-26' : '2026-10-03'));

const digits = (s: string) => s.replace(/\D/g, '');
export function matches(j: Job, f: Filters, skip?: 'view'): boolean {
  if (skip !== 'view' && !inView(j, f.view)) return false;
  if (f.mechanic !== 'any' && (f.mechanic === 'none' ? j.assigneeId : j.assigneeId !== f.mechanic)) return false;
  if (!inRange(j, f.range)) return false;
  if (f.unpaid && !isUnpaid(j)) return false;
  if (f.parts && !isWaitingOnParts(j)) return false;
  const q = f.q.trim().toLowerCase();
  if (q) {
    const v = viewOf(j);
    const hay = `${j.number} ${v.plate} ${v.customer} ${v.vehicle} ${serviceTitle(j)} ${j.complaint}`.toLowerCase();
    const d = digits(q);
    if (!(hay.includes(q) || hay.replace(/\s/g, '').includes(q.replace(/\s/g, '')) || (d.length >= 3 && digits(v.phone).includes(d)))) return false;
  }
  return true;
}

const ORDER = ['OVERDUE', 'PARTS', 'PICKUP_UNPAID', 'APPROVAL'];
export function sortJobs(js: Job[], s: SortId): Job[] {
  const out = [...js];
  const newest = (a: Job, b: Job) => (a.statusSince < b.statusSince ? 1 : -1);
  if (s === 'newest') return out.sort(newest);
  if (s === 'promised') return out.sort((a, b) => (a.promisedAt ?? '9') < (b.promisedAt ?? '9') ? -1 : 1);
  if (s === 'balance') return out.sort((a, b) => jobBalance(b) * (b.status === 'COMPLETED' || isQuote(b) ? 0 : 1) - jobBalance(a) * (a.status === 'COMPLETED' || isQuote(a) ? 0 : 1));
  const rank = (j: Job) => { const r = reasonOf(j); return r ? ORDER.indexOf(r) : j.status === 'COMPLETED' ? 9 : 5; };
  return out.sort((a, b) => rank(a) - rank(b) || newest(a, b));
}

export const activeCount = (f: Filters) => (f.mechanic !== 'any' ? 1 : 0) + (f.range !== 'any' ? 1 : 0) + (f.unpaid ? 1 : 0) + (f.parts ? 1 : 0);
export const isFiltered = (f: Filters) => !!f.q.trim() || f.view !== 'all' || activeCount(f) > 0;

/** Words for the "filtered by" line. */
export function describe(f: Filters): string[] {
  const out: string[] = [];
  if (f.view !== 'all') out.push(VIEWS.find((v) => v.id === f.view)!.label);
  if (f.mechanic !== 'any') out.push(f.mechanic === 'none' ? 'Not assigned' : mechanics.find((m) => m.id === f.mechanic)?.short ?? '');
  if (f.range !== 'any') out.push(RANGES.find((r) => r.id === f.range)!.label);
  if (f.unpaid) out.push('Unpaid');
  if (f.parts) out.push('Waiting on parts');
  if (f.q.trim()) out.push(`"${f.q.trim()}"`);
  return out;
}

/** Leda's reading of a sentence into filters. Returns null when it is not a list question. */
export function parseAsk(text: string): Partial<Filters> | null {
  const t = text.toLowerCase();
  if (!/(show|list|find|which|who|filter|ready|unpaid|owe|waiting|late|overdue|completed|quote)/.test(t)) return null;
  const f: Partial<Filters> = { q: '', mechanic: 'any', range: 'any', unpaid: false, parts: false, view: 'all' };
  let hit = false;
  if (/unpaid|owe|balance/.test(t)) { f.unpaid = true; hit = true; }
  if (/ready|pick-?up/.test(t)) { f.view = 'ready'; hit = true; }
  if (/part/.test(t)) { f.parts = true; hit = true; }
  if (/quote/.test(t)) { f.view = 'quotes'; hit = true; }
  if (/completed|done|finished/.test(t)) { f.view = 'done'; hit = true; }
  if (/late|overdue|waiting for me|waiting for you|stuck/.test(t)) { f.view = 'waiting'; hit = true; }
  if (/last week|7 days/.test(t)) { f.range = '7d'; hit = true; }
  if (/last month|30 days/.test(t)) { f.range = '30d'; hit = true; }
  if (/today/.test(t)) { f.range = 'today'; hit = true; }
  const m = mechanics.find((x) => t.includes(x.short.toLowerCase()));
  if (m) { f.mechanic = m.id; hit = true; }
  return hit ? f : null;
}

export const partsFor = (j: Job) => {
  const lines = j.parts.map((l) => ({ line: l, product: productOf(l.productId), short: shortLines(j).some((s) => s.productId === l.productId) }));
  const lead = lines.find((l) => l.short) ?? lines[0] ?? null;
  return { lines, lead, shortCount: lines.filter((l) => l.short).length };
};
