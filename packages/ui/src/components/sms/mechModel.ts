/**
 * Mechanic mobile: data shaping + the shared session store. The store is module-level so the manager's Today (same iframe) reads what the
 * mechanic did: status changes become Overrides, part requests and found issues become manager items. No prices anywhere in this file's views.
 */
import { useSyncExternalStore } from 'react';
import {
  NOW_MIN, TODAY, jobs as allJobs, onHandHere, productOf, vehicleOf, customerOf, stockState, shortLines, products,
  type Job, type Mechanic, type PendingReason, type Product,
} from './data';
import { typeFor } from './catalogue';
import { applyOverrides, minOf, serviceTitle, shortName, type Overrides } from './floorModel';

export type RequestStatus = 'Requested' | 'Approved' | 'Ready at stockroom' | 'Collected' | 'Declined';
export const REQUEST_STEPS: RequestStatus[] = ['Requested', 'Approved', 'Ready at stockroom', 'Collected'];
/** A quote for extra work, written on the Requests page (the manager's side only; the mechanic never sees prices). */
export type QuoteState = { amount: number; note: string; customer: 'waiting' | 'approved' | 'declined'; parts: { productId: string; qty: number }[] };
export interface PartRequest { id: string; productId: string; qty: number; jobId: string | null; by: string; at: string; status: RequestStatus; note?: string }
/** `read`: for a manager message, the mechanic has read it; for a mechanic message, see MechState.managerRead. `answer`: the mechanic's reply to a manager question (not a new item for the manager). */
export interface Msg { id: string; jobId: string; mechId: string; from: 'mechanic' | 'manager'; kind: 'text' | 'question'; text: string; at: string; answered?: boolean; read?: boolean; answer?: boolean }
/** `status` empty = still waiting for the manager. */
export interface Proposal { id: string; jobId: string; mechId: string; text: string; photos: number; at: string; status?: 'quoted' | 'dismissed'; quote?: QuoteState; dismissReason?: string }
/** `internal`: hidden from the customer's tracking page (visibility rule: a note is customer-visible unless flagged internal). `by`: who wrote it (default: the assigned mechanic). */
export interface Note { id: string; text: string; photos: number; at: string; internal?: boolean; by?: 'manager' }
/** The customer's chat with the manager on one service (separate from the mechanic-manager thread). `read` on a manager message = the customer opened it; `answered` on a customer message = the manager replied. */
export interface CustMsg { id: string; jobId: string; from: 'customer' | 'manager'; text: string; at: string; read?: boolean; answered?: boolean }

export interface MechState {
  ov: Overrides;
  requests: PartRequest[];
  messages: Msg[];
  proposals: Proposal[];
  notes: Record<string, Note[]>;
  prefs: Record<string, boolean>;
  /** Parts the mechanic confirmed they have, per service (job id -> product ids). */
  have: Record<string, string[]>;
  /** Items of the manager's Requests page the manager has opened (item id -> true). */
  managerRead: Record<string, boolean>;
  /** Customer tracking page chat (additive): one thread per service. */
  custMsgs: CustMsg[];
}

const t = (hm: string) => `${TODAY}T${hm}:00+08:00`;
const seed = (): MechState => ({
  ov: {},
  requests: [
    { id: 'rq1', productId: 'pr04', qty: 1, jobId: 'j0412', by: 'm-jun', at: t('08:55'), status: 'Approved', note: 'Transfer from Main warehouse asked by Mon' },
    { id: 'rq2', productId: 'pr05', qty: 1, jobId: 'j0398', by: 'm-arnel', at: t('09:10'), status: 'Requested' },
    { id: 'rq3', productId: 'pr08', qty: 1, jobId: 'j0420', by: 'm-paolo', at: t('09:20'), status: 'Ready at stockroom' },
    { id: 'rq4', productId: 'pr12', qty: 1, jobId: 'j0409', by: 'm-ricky', at: t('08:30'), status: 'Collected' },
    { id: 'rq5', productId: 'pr07', qty: 3, jobId: 'j0408', by: 'm-jun', at: t('07:50'), status: 'Collected' },
  ],
  messages: [
    { id: 'ms1', jobId: 'j0412', mechId: 'm-jun', from: 'manager', kind: 'text', text: 'Alternator is coming from Main warehouse, about 2 pm. Do the oil change on JO-0415 first.', at: t('09:40') },
    { id: 'ms2', jobId: 'j0413', mechId: 'm-jun', from: 'manager', kind: 'question', text: 'Customer asks if you can also check the wipers. Free of charge?', at: t('10:05') },
    { id: 'ms3', jobId: 'j0398', mechId: 'm-arnel', from: 'manager', kind: 'question', text: 'Belt kit arrives tomorrow 11:00. Can you do the diagnosis write-up today?', at: t('09:50') },
    { id: 'ms4', jobId: 'j0420', mechId: 'm-paolo', from: 'manager', kind: 'text', text: 'Shocks are at the stockroom, pick them up.', at: t('10:00') },
  ],
  proposals: [],
  notes: { j0408: [{ id: 'n1', text: 'Thermostat sticking, old one kept for the customer.', photos: 1, at: t('09:30') }] },
  prefs: { assigned: true, reply: true, part: true },
  have: {},
  managerRead: {},
  custMsgs: [],
});

let state: MechState = seed();
const subs = new Set<() => void>();
export const getMech = () => state;
export const resetMech = () => { state = seed(); subs.forEach((f) => f()); };
export const patchMech = (fn: (s: MechState) => Partial<MechState>) => { state = { ...state, ...fn(state) }; subs.forEach((f) => f()); };
export const useMech = () => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, getMech);

let seq = 100;
export const nextId = (p: string) => `${p}${++seq}`;
export const nowIso = () => `${TODAY}T10:${String(20 + Math.min(39, seq - 100)).padStart(2, '0')}:00+08:00`;

/** Synthetic extra jobs for the stress control: long titles, many of them. */
export function stressJobs(mechId: string): Job[] {
  const base = allJobs.find((j) => j.id === 'j0417')!;
  const long = allJobs.find((j) => j.id === 'j0412')!.services[0].name;
  return Array.from({ length: 8 }, (_, i): Job => ({
    ...base, id: `sx${i}`, number: `JO-04${40 + i}`, status: 'TODO', assigneeId: mechId, vehicleId: allJobs[i + 4]?.vehicleId ?? base.vehicleId, customerId: allJobs[i + 4]?.customerId ?? base.customerId,
    promisedAt: t(`${String(11 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '45' : '15'}`), complaint: `${long}. Customer says it started after the rain and only at idle.`,
    services: [{ name: `${long} (visit ${i + 1})`, price: 0, qty: 1, done: false }, { name: 'Road test', price: 0, qty: 1, done: false }], parts: [], payments: [],
  }));
}

export type MechScenario = 'normal' | 'no services' | 'day off' | 'loading' | 'all blocked';

/** All jobs visible to the app, with the session's moves applied. */
export function poolFor(s: MechState, mech: Mechanic, stress: boolean, scenario: MechScenario = 'normal'): Job[] {
  const pool = applyOverrides(s.ov, [...allJobs, ...(stress ? stressJobs(mech.id) : [])]);
  if (scenario !== 'all blocked') return pool;
  return pool.map((j) => (j.assigneeId === mech.id && (j.status === 'TODO' || j.status === 'IN_PROGRESS') ? { ...j, status: 'PENDING', pendingReason: 'WAITING_FOR_PARTS', pendingNote: 'Part not in the stockroom yet' } as Job : j));
}

export interface Day { now: Job | null; next: Job[]; blocked: Job[]; done: Job[]; questions: Msg[] }
export function dayOf(s: MechState, mech: Mechanic, scenario: MechScenario, stress: boolean): Day {
  if (scenario === 'no services' || scenario === 'day off') return { now: null, next: [], blocked: [], done: [], questions: [] };
  const mine = poolFor(s, mech, stress, scenario).filter((j) => j.assigneeId === mech.id);
  const active = mine.filter((j) => j.status === 'TODO' || j.status === 'IN_PROGRESS' || j.status === 'PENDING');
  const byTime = (a: Job, b: Job) => (a.promisedAt ?? '9').localeCompare(b.promisedAt ?? '9');
  const working = active.filter((j) => j.status === 'IN_PROGRESS').sort(byTime);
  // "Currently working on" = the one started most recently (statusSince); ties keep the earliest promised time.
  const running = [...working].sort((a, b) => b.statusSince.localeCompare(a.statusSince))[0] ?? null;
  const next = [...working.filter((j) => j !== running), ...active.filter((j) => j.status === 'TODO')].sort(byTime);
  const blocked = active.filter((j) => j.status === 'PENDING');
  const done = mine.filter((j) => j.status === 'FOR_PICKUP' || j.status === 'COMPLETED');
  const open = new Set(mine.map((j) => j.id));
  const questions = s.messages.filter((m) => m.mechId === mech.id && m.kind === 'question' && !m.answered && open.has(m.jobId));
  return { now: running, next, blocked, done, questions };
}


export const plateOf = (j: Job) => vehicleOf(j).plate;
export const carOf = (j: Job) => { const v = vehicleOf(j); return `${v.make} ${v.model} ${v.year}`; };
export const firstName = (j: Job) => customerOf(j).name.split(' ')[0];
export const dueWord = (j: Job) => (j.promisedAt ? `Due ${j.promisedAt.slice(11, 16)}` : 'No time set');
export const minutesLeft = (j: Job) => (j.promisedAt ? minOf(j.promisedAt) - NOW_MIN : null);
export { serviceTitle, shortName };

/** Words for the stock of one product: no prices. */
export function stockWord(pr: Product): { word: string; tone: 'ok' | 'warn' | 'bad' } {
  const st = stockState(pr); const n = onHandHere(pr);
  if (st === 'on_order') return { word: `Out, on order${pr.onOrder ? ` (ETA ${etaWord(pr.onOrder.eta)})` : ''}`, tone: 'warn' };
  if (st === 'out') return { word: 'Out of stock here', tone: 'bad' };
  if (st === 'low') return { word: `Low: ${n} here`, tone: 'warn' };
  return { word: `In stock: ${n} here`, tone: 'ok' };
}
export const etaWord = (iso: string) => `${iso.slice(0, 10) === TODAY ? 'today' : new Date(`${iso.slice(0, 10)}T12:00:00+08:00`).toLocaleDateString('en-PH', { weekday: 'short' })} ${iso.slice(11, 16)}`;

/** What a blocked service is missing, in plain words. */
export function missingOf(j: Job): { text: string; eta: string | null } {
  const l = shortLines(j)[0];
  if (l) { const pr = productOf(l.productId); return { text: `${shortName(pr)} (${l.qty - l.issued} needed)`, eta: pr.onOrder ? etaWord(pr.onOrder.eta) : j.pendingNote?.startsWith('Transfer') ? 'transfer asked' : null }; }
  const why: Record<PendingReason, string> = { WAITING_FOR_PARTS: 'A part', WAITING_FOR_CUSTOMER: 'Waiting for the customer', WAITING_FOR_ANOTHER_MECHANIC: 'Waiting for another mechanic', OTHER: 'On hold' };
  return { text: j.pendingNote ?? why[j.pendingReason ?? 'OTHER'], eta: null };
}

export const requestsOf = (s: MechState, mechId: string) => s.requests.filter((r) => r.by === mechId);
export const catalogue = products;

/** Plain words for a service's state. Four words only. */
export type ItemWord = 'To do' | 'Working' | 'Waiting for part' | 'Done';
export const statusWord = (j: Job): ItemWord => (j.status === 'IN_PROGRESS' ? 'Working' : j.status === 'PENDING' ? 'Waiting for part' : j.status === 'FOR_PICKUP' || j.status === 'COMPLETED' ? 'Done' : 'To do');
/** Words for a part request: asked, approved, ready. */
export const requestWord = (st: RequestStatus) => (st === 'Declined' ? 'Declined' : st === 'Requested' ? 'Asked' : st === 'Approved' ? 'Approved' : st === 'Ready at stockroom' ? 'Ready - pick it up at the stockroom' : 'Collected');

/** The first few words of the work, for a list: "Brake pad replacement +1". */
export function shortTask(j: Job): string {
  const w = (j.services[0]?.name ?? 'Service').split(/[\s,]+/).slice(0, 4).join(' ');
  return j.services.length > 1 ? `${w} +${j.services.length - 1}` : w;
}
/** "Waiting for Oil filter, arrives 11:00" */
export function waitWord(j: Job): string {
  const m = missingOf(j);
  const what = m.text.replace(/\s*\(\d+ needed\)/, '');
  const eta = m.eta ? (/\d:\d\d$/.test(m.eta) ? `, arrives ${m.eta.replace(/^today /, '')}` : `, ${m.eta}`) : '';
  return `Waiting for ${what}${eta}`;
}

export interface ItemPart { productId: string; qty: number; issued: number }
/** The parts under each service item. The service's parts are service-level, so: a part goes under the item whose catalogue service normally uses it; any other part goes under the first item. */
export function itemParts(j: Job): ItemPart[][] {
  const out: ItemPart[][] = j.services.map(() => []);
  for (const p of j.parts) {
    let at = j.services.findIndex((x) => typeFor(x.name)?.parts?.some((sp) => sp.productId === p.productId));
    if (at < 0) at = 0;
    if (out[at]) out[at].push(p);
  }
  return out;
}
/** "Usually needed for this service": the service's own parts first, then the catalogue parts of its items. One row per product. */
export function suggestedParts(j: Job | undefined): { productId: string; qty: number }[] {
  if (!j) return [];
  const seen = new Map<string, number>();
  for (const p of j.parts) seen.set(p.productId, p.qty);
  for (const x of j.services) for (const sp of typeFor(x.name)?.parts ?? []) if (!seen.has(sp.productId)) seen.set(sp.productId, sp.qty);
  return [...seen].map(([productId, qty]) => ({ productId, qty }));
}

/** Parts included in a service for the "have it" checklist: the service's own parts with qty, then the catalogue parts of its items. issued >= qty means the stockroom already gave it. */
export interface ServicePart { productId: string; qty: number; issued: number; ready: boolean; stock: string }
export function servicePartsOf(j: Job, have: string[] = []): ServicePart[] {
  const own = new Map(j.parts.map((p) => [p.productId, p]));
  return suggestedParts(j).map(({ productId, qty }) => {
    const issued = own.get(productId)?.issued ?? 0;
    return { productId, qty, issued, ready: issued >= qty || have.includes(productId), stock: stockWord(productOf(productId)).word };
  });
}

/** Relative time for the feed: the app shows no wall clock, only "Just now / 10 min ago / 2 hr ago". */
export function agoWord(iso: string): string {
  const d = NOW_MIN - minOf(iso);
  if (d <= 1) return 'Just now';
  if (d < 60) return `${d} min ago`;
  const h = Math.floor(d / 60);
  return `${h} hr ago`;
}

export type FeedKind = 'note' | 'found' | 'part' | 'manager' | 'question' | 'you';
export interface FeedPost { id: string; kind: FeedKind; by: 'you' | 'manager'; at: string; text: string; photos?: number; meta?: string; answered?: boolean; seq: number }
/** One service's Updates feed, newest first: notes and photos, found problems, part requests, and the chat with the manager. */
export function feedOf(s: MechState, j: Job): FeedPost[] {
  const out: FeedPost[] = [];
  let n = 0;
  for (const m of s.messages) if (m.jobId === j.id) out.push({ id: m.id, kind: m.from === 'manager' ? (m.kind === 'question' ? 'question' : 'manager') : 'you', by: m.from === 'manager' ? 'manager' : 'you', at: m.at, text: m.text, answered: m.answered, seq: n++ });
  for (const x of s.notes[j.id] ?? []) out.push({ id: x.id, kind: 'note', by: 'you', at: x.at, text: x.text, photos: x.photos, seq: n++ });
  for (const p of s.proposals) if (p.jobId === j.id) out.push({ id: p.id, kind: 'found', by: 'you', at: p.at, text: p.text, photos: p.photos, meta: p.status === 'quoted' ? (p.quote?.customer === 'approved' ? 'The customer said yes. Go ahead with the extra work.' : p.quote?.customer === 'declined' ? 'The customer said no. Do not do the extra work.' : 'Your manager quoted it. Waiting for the customer.') : p.status === 'dismissed' ? 'Your manager looked at it: no extra work.' : 'Sent to your manager', seq: n++ });
  for (const r of s.requests) if (r.jobId === j.id) out.push({ id: r.id, kind: 'part', by: 'you', at: r.at, text: `${shortName(productOf(r.productId))} x${r.qty}`, meta: requestWord(r.status), seq: n++ });
  return out.sort((a, b) => minOf(b.at) - minOf(a.at) || b.seq - a.seq);
}

/** What the staff card on My services shows about one service, from the same data as the detail screen. */
export interface StaffInfo { itemsDone: number; itemsTotal: number; partsReady: number; partsTotal: number; unread: number; unreadAsk: boolean; last: FeedPost | null }
export function staffInfoOf(s: MechState, j: Job): StaffInfo {
  const parts = servicePartsOf(j, s.have[j.id]);
  const unread = s.messages.filter((m) => m.jobId === j.id && m.from === 'manager' && !m.read && !m.answered);
  return {
    itemsDone: j.services.filter((x) => x.done).length, itemsTotal: j.services.length,
    partsReady: parts.filter((p) => p.ready).length, partsTotal: parts.length,
    unread: unread.length, unreadAsk: unread.some((m) => m.kind === 'question'), last: feedOf(s, j)[0] ?? null,
  };
}
/** The kind of a feed post in the words of the "Last:" line. */
export const LAST_KIND: Record<FeedKind, string> = { note: 'Note', found: 'Found a problem', part: 'Part request', manager: 'Manager', question: 'Manager asked', you: 'You' };
