/**
 * Requests & messages (manager inbox): items derived from the SAME shared store the Mechanic app writes (mechModel), and the manager's moves
 * written back to it, so approve here -> the mechanic's request status changes; reply here -> the mechanic's unread bubble; quote / dismiss -> the post's status.
 * Invented API (see rationale): PATCH /part-requests/{id}, POST /found-problems/{id}/quote|dismiss, GET/POST /services/{id}/thread, PUT /threads/{id}/read.
 */
import { TODAY, jobs as allJobs, mechanics, productOf, vehicleOf, customerOf, onHandHere, type Job } from './data';
import type { CustMsg } from './mechModel';
import { minOf, serviceTitle, shortName } from './floorModel';
import { threadOf, whenWord } from './trackerModel';
import { agoWord, stockWord, feedOf, nextId, nowIso, patchMech, resetMech, getMech, type MechState, type PartRequest, type Proposal, type QuoteState, type Msg } from './mechModel';

import type { ChatPostView, ThreadPostView, ItemStatus, RequestDisplay, RequestListItem, RequestPerson } from './requestTypes';
export { KIND_LABEL } from './requestTypes';
export type { ChatPostView, ThreadPostView, ItemKind, ItemStatus, RequestDisplay, RequestListItem, RequestPerson } from './requestTypes';

export type Filter = 'all' | 'needs' | 'parts' | 'problems' | 'messages';

/** Part request as the detail shows it, supplied by the caller. */
export interface PartView { name: string; sku: string; unit: string; price: number; stock: { word: string; tone: 'ok' | 'warn' | 'bad' }; enough: boolean }
export interface InboxItem extends RequestListItem {
  jobId: string | null; mechId: string; at: string; seq: number;
  /** Underlying record. */
  part?: PartRequest; problem?: Proposal; msg?: Msg; photos?: number; cust?: CustMsg;
  /** Detail display (optional; studio itemsOf fills them). `partView` for kind part; `quotePartsLabel` e.g. "Brake pad x2, Oil x1". */
  partView?: PartView; quotePartsLabel?: string;
}
type InboxBase = Omit<InboxItem, keyof RequestDisplay | 'partView' | 'quotePartsLabel'>;

export const DECLINE_REASONS = ['Not needed for this job', 'Use stock we already have', 'Customer has not approved it', 'Too expensive, find another way', 'Other'] as const;
const t = (hm: string) => `${TODAY}T${hm}:00+08:00`;
export const jobOf = (id: string | null) => allJobs.find((j) => j.id === id) ?? null;
export const mechOf = (id: string) => mechanics.find((m) => m.id === id) ?? mechanics[0];
const num = (id: string) => Number(id.replace(/\D/g, '')) || 0;

const PART_STATUS: Record<PartRequest['status'], ItemStatus> = { Requested: 'Needs you', Approved: 'Approved', 'Ready at stockroom': 'Ready', Collected: 'Collected', Declined: 'Declined' };

/** Studio only: fills the display fields from the fixtures. A real caller supplies them from the API. */
function decorate(b: InboxBase): InboxItem {
  const j = jobOf(b.jobId); const v = j ? vehicleOf(j) : null;
  const item: InboxItem = { ...b, plate: v?.plate ?? null, jobTitle: j ? serviceTitle(j) : null, sender: senderOf(b), agoLabel: agoWord(b.at), vehicleLabel: v ? `${v.make} ${v.model}` : null, customerName: j ? customerOf(j).name : null, jobNumber: j?.number ?? null };
  if (b.part) { const pr = productOf(b.part.productId); item.partView = { name: pr.name, sku: pr.sku, unit: pr.unit, price: pr.price, stock: stockWord(pr), enough: onHandHere(pr) >= b.part.qty }; }
  const q = b.problem?.quote; if (q && q.parts.length) item.quotePartsLabel = q.parts.map((x) => `${productOf(x.productId).name.split(',')[0]} x${x.qty}`).join(', ');
  return item;
}

/** Every item the mechanics sent, newest first. */
export function itemsOf(s: MechState): InboxItem[] {
  const out: InboxBase[] = [];
  for (const r of s.requests) {
    const pr = productOf(r.productId); const j = jobOf(r.jobId);
    const st = PART_STATUS[r.status];
    out.push({ id: `part:${r.id}`, kind: 'part', jobId: r.jobId, mechId: r.by, at: r.at, seq: num(r.id), title: `${shortName(pr)} x${r.qty}`, preview: `${r.qty} ${pr.unit}${r.qty > 1 ? 's' : ''} for ${j?.number ?? 'shop use'}${r.note ? `. ${r.note}` : ''}`, status: st, needsYou: st === 'Needs you', unread: !s.managerRead[`part:${r.id}`], part: r });
  }
  for (const p of s.proposals) {
    const st: ItemStatus = p.status === 'quoted' ? (p.quote?.customer === 'approved' ? 'Approved' : p.quote?.customer === 'declined' ? 'Declined' : 'Quoted') : p.status === 'dismissed' ? 'Dismissed' : 'Needs you';
    out.push({ id: `problem:${p.id}`, kind: 'problem', jobId: p.jobId, mechId: p.mechId, at: p.at, seq: num(p.id), title: 'Found a problem', preview: p.text, status: st, needsYou: st === 'Needs you', unread: !s.managerRead[`problem:${p.id}`], problem: p, photos: p.photos });
  }
  for (const m of s.messages) {
    if (m.from !== 'mechanic' || m.answer) continue;
    const st: ItemStatus = m.answered ? 'Answered' : 'Needs you';
    out.push({ id: `question:${m.id}`, kind: 'question', jobId: m.jobId, mechId: m.mechId, at: m.at, seq: num(m.id), title: 'Question for you', preview: m.text, status: st, needsYou: st === 'Needs you', unread: !s.managerRead[`question:${m.id}`], msg: m });
  }
  for (const [jobId, notes] of Object.entries(s.notes)) {
    const mechId = jobOf(jobId)?.assigneeId ?? 'm-jun';
    for (const n of notes) out.push({ id: `note:${n.id}`, kind: 'note', jobId, mechId, at: n.at, seq: num(n.id), title: n.photos && !n.text ? 'Photos' : 'Note', preview: n.text || `${n.photos} photo${n.photos > 1 ? 's' : ''}`, status: 'Seen', needsYou: false, unread: !s.managerRead[`note:${n.id}`], photos: n.photos });
  }
  for (const c of s.custMsgs) {
    if (c.from !== 'customer') continue;
    const j = jobOf(c.jobId); const st: ItemStatus = c.answered ? 'Answered' : 'Needs you';
    out.push({ id: `customer:${c.id}`, kind: 'customer', jobId: c.jobId, mechId: j?.assigneeId ?? 'm-jun', at: c.at, seq: num(c.id), title: 'Customer message', preview: c.text, status: st, needsYou: st === 'Needs you', unread: !s.managerRead[`customer:${c.id}`], cust: c });
  }
  return out.map(decorate).sort((a, b) => minOf(b.at) - minOf(a.at) || b.seq - a.seq);
}

export function matches(i: InboxItem, f: Filter, q = ''): boolean {
  const ok = f === 'all' || (f === 'needs' && i.needsYou) || (f === 'parts' && i.kind === 'part') || (f === 'problems' && i.kind === 'problem') || (f === 'messages' && (i.kind === 'question' || i.kind === 'note' || i.kind === 'customer'));
  if (!ok) return false;
  const n = q.trim().toLowerCase(); if (!n) return true;
  const j = jobOf(i.jobId); const hay = [j ? vehicleOf(j).plate : '', j ? customerOf(j).name : '', j?.number ?? '', mechOf(i.mechId).name, i.preview, i.title].join(' ').toLowerCase();
  return hay.includes(n);
}
export const countsOf = (items: InboxItem[]) => ({
  all: items.length, needs: items.filter((i) => i.needsYou).length, parts: items.filter((i) => i.kind === 'part').length,
  problems: items.filter((i) => i.kind === 'problem').length, messages: items.filter((i) => i.kind === 'question' || i.kind === 'note' || i.kind === 'customer').length,
});
/** What the rail badge shows: items waiting for the manager. */
export const needsCount = (s: MechState) => itemsOf(s).filter((i) => i.needsYou).length;

// ---------- the manager's moves (all write to the shared store) ----------
const managerMsg = (jobId: string, mechId: string, text: string): Msg => ({ id: nextId('ms'), jobId, mechId, from: 'manager', kind: 'text', text, at: nowIso() });

export function markItemRead(id: string) { patchMech((s) => (s.managerRead[id] ? {} : { managerRead: { ...s.managerRead, [id]: true } })); }
export function setPartStatus(reqId: string, status: PartRequest['status']) { patchMech((s) => ({ requests: s.requests.map((r) => (r.id === reqId ? { ...r, status } : r)) })); }
export function declinePart(reqId: string, reason: string, note: string) {
  patchMech((s) => {
    const r = s.requests.find((x) => x.id === reqId); if (!r) return {};
    const text = `Declined ${shortName(productOf(r.productId))}: ${reason}${note.trim() ? `. ${note.trim()}` : ''}`;
    return { requests: s.requests.map((x) => (x.id === reqId ? { ...x, status: 'Declined' as const, note: `${reason}${note.trim() ? `. ${note.trim()}` : ''}` } : x)), messages: r.jobId ? [...s.messages, managerMsg(r.jobId, r.by, text)] : s.messages };
  });
}
export function quoteProblem(id: string, quote: QuoteState) {
  patchMech((s) => {
    const p = s.proposals.find((x) => x.id === id); if (!p) return {};
    return { proposals: s.proposals.map((x) => (x.id === id ? { ...x, status: 'quoted' as const, quote } : x)), messages: [...s.messages, managerMsg(p.jobId, p.mechId, `Quoted ${pesos(quote.amount)}, waiting for the customer.`)] };
  });
}
/**
 * The customer's answer to a sent quote (Approved / Declined). In the real product this arrives from the customer (invented API: POST /quotations/{id}/answer);
 * the prototype lets the studio-only control on the Requests detail simulate it. It updates the request status here and the mechanic's view via the store.
 */
export function answerQuote(id: string, answer: 'approved' | 'declined') {
  patchMech((s) => {
    const p = s.proposals.find((x) => x.id === id); if (!p?.quote || p.quote.customer === answer) return {};
    const text = answer === 'approved' ? 'The customer approved the extra work. Go ahead.' : 'The customer declined the extra work. Do not do it.';
    return { proposals: s.proposals.map((x) => (x.id === id ? { ...x, quote: { ...p.quote!, customer: answer } } : x)), messages: [...s.messages, managerMsg(p.jobId, p.mechId, text)] };
  });
}
export function dismissProblem(id: string, reason: string) {
  patchMech((s) => {
    const p = s.proposals.find((x) => x.id === id); if (!p) return {};
    return { proposals: s.proposals.map((x) => (x.id === id ? { ...x, status: 'dismissed' as const, dismissReason: reason.trim() || undefined } : x)), messages: [...s.messages, managerMsg(p.jobId, p.mechId, `No extra work for this${reason.trim() ? `: ${reason.trim()}` : '.'}`)] };
  });
}
/** Reply in a service's thread. Replying to a Question marks it Answered. The mechanic's unread bubble comes from the new, unread manager message. */
export function replyInThread(jobId: string, mechId: string, text: string, itemId?: string) {
  const body = text.trim(); if (!body) return;
  patchMech((s) => {
    const qid = itemId?.startsWith('question:') ? itemId.slice(9) : null;
    return { messages: [...s.messages.map((m) => (m.id === qid ? { ...m, answered: true } : m)), managerMsg(jobId, mechId, body)] };
  });
}
/** Reply to the customer on the tracking page. Marks the customer's messages on that service Answered; the customer sees the reply (unread dot) on their page. */
export function replyToCustomer(jobId: string, text: string) {
  const body = text.trim(); if (!body) return;
  patchMech((s) => ({ custMsgs: [...s.custMsgs.map((m) => (m.jobId === jobId && m.from === 'customer' ? { ...m, answered: true } : m)), { id: nextId('cm'), jobId, from: 'manager' as const, text: body, at: nowIso() }] }));
}
/** Who sent an item, as a person: the customer's first name for a customer message, else the mechanic. */
export function senderOf(i: Pick<InboxItem, 'kind' | 'jobId' | 'mechId'>): RequestPerson {
  if (i.kind === 'customer') {
    const j = jobOf(i.jobId); const c = j ? customerOf(j) : null; const name = c?.name ?? 'Customer';
    return { id: c?.id ?? 'customer', name, short: name.split(' ')[0]!, initials: name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() };
  }
  return mechOf(i.mechId);
}
export const pesos = (n: number) => `₱${n.toLocaleString('en-PH')}`;

/** Studio only: the service's posts as plain thread views (oldest first). A real caller maps its API rows to ThreadPostView. */
export function threadPostsOf(s: MechState, job: Job | null): ThreadPostView[] {
  return job ? feedOf(s, job).slice().reverse().map((p) => ({ id: p.id, mine: p.by === 'you', kind: p.kind, text: p.text, photos: p.photos, meta: p.meta, agoLabel: agoWord(p.at) })) : [];
}
/** Studio only: the customer chat as plain views. */
export function customerChatOf(s: MechState, job: Job): ChatPostView[] {
  return threadOf(s, job.id).map((p) => ({ id: p.id, mine: p.from === 'manager', text: p.text, whenLabel: whenWord(p.at), read: p.read }));
}
/** The thread a manager sees under an item: the service's posts, oldest first. */
export type { FeedPost } from './mechModel';

// ---------- seeding ----------
export type RequestsScenario = 'default' | 'all clear' | 'many' | 'long text' | 'customer messages';
export interface SeedOpts { scenario: RequestsScenario; customer: QuoteState['customer'] }
export const LONG = 'The rear left shock is leaking oil down the whole length of the strut and the dust boot is split. I also see the bump stop is crumbled and the top mount rubber is cracked, so the noise the customer hears over bumps will not go away with only the shock. The right side is still fine for now.';

/** Reset the shared store and add the inbox's own seed on top of the Mechanic app's seed. */
export function seedRequests({ scenario, customer }: SeedOpts) {
  resetMech();
  const base = getMech();
  const read = (...ids: string[]) => Object.fromEntries(ids.map((i) => [i, true]));
  if (scenario === 'all clear') {
    patchMech((s) => ({
      requests: s.requests.map((r) => (r.status === 'Requested' ? { ...r, status: 'Approved' as const } : r)),
      managerRead: Object.fromEntries(itemsOf(s).map((i) => [i.id, true])),
    }));
    return;
  }
  const quote: QuoteState = { amount: 3200, note: 'Chain and both sprockets, labour included.', customer, parts: [{ productId: 'pr09', qty: 1 }] };
  const extra: Pick<MechState, 'proposals' | 'messages' | 'requests' | 'notes'> = {
    proposals: [
      { id: 'pp1', jobId: 'j0420', mechId: 'm-paolo', text: 'Rear shock bushings are cracked and the right shock is leaking oil.', photos: 2, at: t('09:58') },
      { id: 'pp2', jobId: 'j0409', mechId: 'm-ricky', text: 'Chain is badly stretched and the sprocket teeth are worn.', photos: 1, at: t('09:05'), status: 'quoted', quote },
      { id: 'pp3', jobId: 'j0415', mechId: 'm-jun', text: 'Wiper blades are torn.', photos: 0, at: t('08:40'), status: 'dismissed', dismissReason: 'Customer will bring his own' },
    ],
    messages: [
      { id: 'ms10', jobId: 'j0398', mechId: 'm-arnel', from: 'mechanic', kind: 'text', text: 'Customer called, he wants it done by Tuesday. Is the belt kit really coming tomorrow?', at: t('10:12') },
      { id: 'ms11', jobId: 'j0409', mechId: 'm-ricky', from: 'mechanic', kind: 'text', text: 'Can I reuse the old gasket on the cover?', at: t('08:20'), answered: true },
      { id: 'ms12', jobId: 'j0409', mechId: 'm-ricky', from: 'manager', kind: 'text', text: 'No, use a new one. It is in the drawer.', at: t('08:24'), read: true },
    ],
    requests: [
      { id: 'rq6', productId: 'pr02', qty: 2, jobId: 'j0417', by: 'm-jun', at: t('10:08'), status: 'Requested' },
    ],
    notes: { ...base.notes, j0412: [{ id: 'n2', text: 'Burnt connector on the alternator plug, photos attached.', photos: 2, at: t('10:02') }] },
  };
  const many: Partial<MechState> = scenario === 'many' ? manyItems() : {};
  patchMech((s) => ({
    proposals: [...(many.proposals ?? []), ...extra.proposals, ...s.proposals],
    messages: [...s.messages, ...extra.messages, ...(many.messages ?? [])],
    requests: [...(many.requests ?? []), ...extra.requests, ...s.requests],
    notes: scenario === 'many' ? { ...extra.notes, ...(many.notes ?? {}) } : extra.notes,
    managerRead: read('part:rq3', 'part:rq4', 'part:rq5', 'problem:pp2', 'problem:pp3', 'question:ms11', 'note:n1'),
  }));
  if (scenario === 'customer messages') {
    patchMech(() => ({ custMsgs: [
      { id: 'cm901', jobId: 'j0408', from: 'customer', text: 'Hello, is my car almost done? I can pick it up at lunch.', at: t('10:14') },
      { id: 'cm902', jobId: 'j0410', from: 'customer', text: 'Please do not change the brake fluid, I did it last month.', at: t('09:36'), answered: true },
      { id: 'cm903', jobId: 'j0410', from: 'manager', text: 'Noted, thank you. We will skip it.', at: t('09:41'), read: true },
    ] }));
  }
  if (scenario === 'long text') {
    patchMech((s) => ({ proposals: s.proposals.map((p) => (p.id === 'pp1' ? { ...p, text: LONG } : p)), messages: s.messages.map((m) => (m.id === 'ms10' ? { ...m, text: LONG } : m)) }));
  }
}

function manyItems(): Partial<MechState> {
  const ids = ['m-jun', 'm-arnel', 'm-paolo', 'm-ricky'];
  const jobIds = ['j0408', 'j0410', 'j0411', 'j0418', 'j0413', 'j0417'];
  const prods = ['pr01', 'pr03', 'pr06', 'pr07', 'pr10', 'pr12'];
  const requests: PartRequest[] = Array.from({ length: 12 }, (_, i) => ({ id: `rq${20 + i}`, productId: prods[i % prods.length], qty: 1 + (i % 3), jobId: jobIds[i % jobIds.length], by: jobOf(jobIds[i % jobIds.length])?.assigneeId ?? ids[i % 4], at: t(`${String(7 + Math.floor(i / 6)).padStart(2, '0')}:${String(10 + (i % 6) * 8).padStart(2, '0')}`), status: (['Requested', 'Approved', 'Ready at stockroom', 'Collected', 'Requested'] as const)[i % 5] }));
  const messages: Msg[] = Array.from({ length: 8 }, (_, i) => ({ id: `ms${30 + i}`, jobId: jobIds[i % jobIds.length], mechId: jobOf(jobIds[i % jobIds.length])?.assigneeId ?? 'm-jun', from: 'mechanic', kind: 'text', text: ['Which oil do you want, 10W-40 or 5W-30?', 'Customer is here and asks how long it will take.', 'Do I tighten the cover bolts to the same torque as the last one?', 'Is the customer paying for the wash too?'][i % 4], at: t(`07:${String(20 + i * 4)}`) }));
  return { requests, messages };
}

export { serviceTitle };
export type { Job };
