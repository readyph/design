/**
 * Customer tracker: the model behind the no-login tracking page and the manager's "Customer tracking link" row.
 * Reads the SAME shared store as the Mechanic app and Requests (mechModel), writes only through additive fields (custMsgs, Note.internal) and the existing answerQuote.
 *
 * VISIBILITY RULE (one line, shown in the docs): a post on a service is customer-visible by default, unless it is flagged internal.
 *   Visible: the mechanic's and manager's notes and photos (unless Note.internal), automatic status updates, the quote for extra work (once the manager sent it), the chat with the manager.
 *   Never visible: mechanic questions and manager answers, part requests, found problems the manager has not quoted, dismissed findings, internal notes, prices (except a quote waiting for approval and the balance at pick-up), phone numbers, other customers.
 * PRIVACY: the link is the only key (unguessable token, 120 bits). The page shows the customer's first name, the car and the plate with its middle masked; no phone, no email, no address.
 * Invented API: GET /public/tracker/{token}, POST /public/tracker/{token}/messages, POST /public/tracker/{token}/quote/answer,
 *   POST /jobs/{id}/tracking-link, POST /jobs/{id}/tracking-link/regenerate, GET /jobs/{id}/tracking-link/qr.png, expiry 7 days after pick-up.
 */
import { useSyncExternalStore } from 'react';
import { TODAY, customerOf, jobs as allJobs, vehicleOf, type Customer, type Job } from './data';
import { applyOverrides, dayWord, hm, serviceTitle } from './floorModel';
import { agoWord, missingOf, nextId, nowIso, patchMech, resetMech, type CustMsg, type MechState, type QuoteState, type Note, type Proposal } from './mechModel';
import { answerQuote, jobOf } from './requestsModel';
import { fmt12 } from './settingsModel';
import { isFinalPrice } from './paymentModel';
import { jobBalance, jobPaid, jobTotal } from './data';

// ---------- the tracking link (token store) ----------
export const LINK_BASE = 'https://track.readyph.example/t/';
export const LINK_EXPIRY_DAYS = 7;
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/** 24 characters from a 31-letter alphabet (about 119 bits) from the browser's secure random source (Math.random only as a last resort in odd test hosts). */
export function makeToken(): string {
  const out: string[] = [];
  const c = (globalThis as { crypto?: Crypto }).crypto;
  const bytes = new Uint8Array(24);
  if (c?.getRandomValues) c.getRandomValues(bytes); else for (let i = 0; i < 24; i++) bytes[i] = Math.floor(Math.random() * 256);
  for (const b of bytes) out.push(ALPHABET[b % ALPHABET.length]);
  return out.join('');
}

interface LinkStore { current: Record<string, string>; revoked: Record<string, string> }
let links: LinkStore = { current: {}, revoked: {} };
const subs = new Set<() => void>();
const emit = () => { links = { ...links }; subs.forEach((f) => f()); };
export const getLinks = () => links;
export const resetTracker = () => { links = { current: {}, revoked: {} }; subs.forEach((f) => f()); };
export const useLinks = () => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, getLinks, getLinks);

/** The service's current token. Created the first time it is needed (in the real product: when the job order is created). */
export function ensureLink(jobId: string): string {
  const have = links.current[jobId];
  if (have) return have;
  const token = makeToken();
  links.current = { ...links.current, [jobId]: token };
  return token;
}
export const urlOf = (token: string) => `${LINK_BASE}${token}`;
export const pathOf = (token: string) => `/t/${token}`;
/** Old link stops working at once; a new token is issued. */
export function regenerateLink(jobId: string): string {
  const old = links.current[jobId];
  const token = makeToken();
  links.current = { ...links.current, [jobId]: token };
  if (old) links.revoked = { ...links.revoked, [old]: jobId };
  emit();
  return token;
}
/** What a token means right now: a live link, one that was replaced, or nothing we know. */
export type LinkState = { state: 'ok'; jobId: string } | { state: 'replaced' } | { state: 'invalid' };
export function resolveLink(token: string): LinkState {
  const jobId = Object.keys(links.current).find((id) => links.current[id] === token);
  if (jobId) return { state: 'ok', jobId };
  if (links.revoked[token]) return { state: 'replaced' };
  return { state: 'invalid' };
}
export const INVALID_TOKEN = 'zz00-not-a-real-link';

export const smsText = (job: Job, url: string, business: string) => `Hi ${firstNameOf(customerOf(job))}, follow your service ${job.number} at ${business} here: ${url}`;

// ---------- what the customer is allowed to see ----------
export const firstNameOf = (c: Customer) => c.name.split(/\s+/)[0] ?? c.name;
/** NBC 4521 -> NBC••21: first three and last two characters stay. */
export function maskPlate(plate: string): string {
  const p = plate.replace(/\s+/g, '');
  if (p.length <= 5) return p;
  return `${p.slice(0, 3)}${'\u2022'.repeat(p.length - 5)}${p.slice(-2)}`;
}
export const carWord = (job: Job) => { const v = vehicleOf(job); return `${v.make} ${v.model} ${v.year}`; };

export type Stage = 'received' | 'working' | 'waiting' | 'ready' | 'done';
export interface StageView { stage: Stage; word: string; sentence: string; step: number }
export const STEPS = ['Received', 'Working on it', 'Ready for pick-up', 'Done'] as const;
export function stageOf(job: Job): StageView {
  switch (job.status) {
    case 'IN_PROGRESS': return { stage: 'working', word: 'Working on it', sentence: 'A mechanic is working on your vehicle now.', step: 1 };
    case 'PENDING': return job.pendingReason === 'WAITING_FOR_PARTS'
      ? { stage: 'waiting', word: 'Waiting for parts', sentence: 'We are waiting for a part to arrive. Work continues as soon as it is here.', step: 1 }
      : { stage: 'waiting', word: 'On hold', sentence: 'We paused your service for a short while. We will tell you here when it starts again.', step: 1 };
    case 'FOR_PICKUP': return { stage: 'ready', word: 'Ready for pick-up', sentence: 'Your vehicle is ready. You can pick it up during shop hours.', step: 2 };
    case 'COMPLETED': return { stage: 'done', word: jobBalance(job) <= 0 ? 'Paid and done' : 'Done', sentence: 'Your service is finished. Thank you for coming to us.', step: 3 };
    default: return { stage: 'received', word: 'Received', sentence: 'We have your vehicle. A mechanic will start soon.', step: 0 };
  }
}
export const promiseWord = (job: Job): string | null => {
  if (!job.promisedAt || job.status === 'FOR_PICKUP' || job.status === 'COMPLETED') return null;
  const d = job.promisedAt.slice(0, 10);
  const day = d === TODAY ? 'today' : new Date(`${d}T12:00:00+08:00`).toLocaleDateString('en-PH', { weekday: 'long' });
  return `Promised: ${day}, ${fmt12(hm(job.promisedAt))}`;
};

/** The job as the customer sees it: with the mechanic's moves applied. */
export const liveJob = (s: MechState, jobId: string): Job | null => { const j = allJobs.find((x) => x.id === jobId); return j ? applyOverrides(s.ov, [j])[0]! : null; };

export interface CustPost { id: string; kind: 'event' | 'note' | 'quote'; title: string; text: string; photos: number; at: string; by: string; seq: number }
/** "10 min ago" today, "Sat 4:05 PM" earlier (agoWord alone only knows today). */
export const whenWord = (iso: string) => (iso.slice(0, 10) === TODAY ? agoWord(iso) : dayWord(iso));

/** The Updates feed, newest first. Applies the visibility rule: nothing here can come from a mechanic question, a part request, an unquoted finding or an internal note. */
export function feedForCustomer(s: MechState, job: Job): CustPost[] {
  const out: CustPost[] = [];
  let n = 0;
  const mech = job.assigneeId ? mechShort(job.assigneeId) : 'The shop';
  for (const x of s.notes[job.id] ?? []) {
    if (x.internal) continue;
    out.push({ id: x.id, kind: 'note', title: x.photos && !x.text ? 'Photos' : 'Update', text: x.text, photos: x.photos, at: x.at, by: x.by === 'manager' ? 'Manager' : mech, seq: n++ });
  }
  for (const p of s.proposals) {
    if (p.jobId !== job.id || p.status !== 'quoted' || !p.quote) continue;
    out.push({ id: p.id, kind: 'quote', title: 'Extra work found', text: 'We sent you a quote. See "Needs your OK" above.', photos: 0, at: p.at, by: 'Manager', seq: n++ });
  }
  const ev = (title: string, text: string): CustPost => ({ id: `ev-${job.status}`, kind: 'event', title, text, photos: 0, at: job.statusSince, by: 'The shop', seq: n++ });
  if (job.status === 'IN_PROGRESS') out.push(ev('Work started', 'A mechanic started on your vehicle.'));
  if (job.status === 'PENDING') out.push(ev('Waiting', job.pendingReason === 'WAITING_FOR_PARTS' ? waitText(job) : 'We paused your service for a short while.'));
  if (job.status === 'FOR_PICKUP') out.push(ev('Ready for pick-up', 'Your vehicle is ready. Come by during shop hours.'));
  if (job.status === 'COMPLETED') out.push(ev('Picked up', 'Thank you for choosing us.'));
  return out.sort((a, b) => b.at.localeCompare(a.at) || b.seq - a.seq);
}
const mechShort = (id: string) => id.replace('m-', '').replace(/^./, (c) => c.toUpperCase());
/** "Waiting for Alternator, arrives 2:00 PM" from the stock data, without the internal note. */
function waitText(job: Job): string {
  const m = missingOf(job);
  const what = m.text.replace(/\s*\(\d+ needed\)/, '');
  return `We are waiting for ${what}${m.eta && /\d:\d\d$/.test(m.eta) ? `. Expected ${m.eta.replace(/^today /, 'today ')}` : ''}.`;
}
/** How many posts the rule hides on this service (for the docs and the tests; the customer never sees this number). */
export function hiddenCount(s: MechState, job: Job): number {
  return (s.notes[job.id] ?? []).filter((x) => x.internal).length
    + s.messages.filter((m) => m.jobId === job.id).length
    + s.requests.filter((r) => r.jobId === job.id).length
    + s.proposals.filter((p) => p.jobId === job.id && p.status !== 'quoted').length;
}

export interface CustQuote { id: string; text: string; photos: number; amount: number; note: string; customer: QuoteState['customer']; at: string }
export const quotesFor = (s: MechState, job: Job): CustQuote[] =>
  s.proposals.filter((p): p is Proposal & { quote: QuoteState } => p.jobId === job.id && p.status === 'quoted' && !!p.quote).map((p) => ({ id: p.id, text: p.text, photos: p.photos, amount: p.quote.amount, note: p.quote.note, customer: p.quote.customer, at: p.at }));
/** The customer answers a quote. Same store move as the Requests studio control, so the mechanic and the manager see it. */
export const answerCustomerQuote = (proposalId: string, answer: 'approved' | 'declined') => answerQuote(proposalId, answer);

export interface MoneyView { total: number; paid: number; balance: number }
/** Only once the price is final (ready for pick-up or done); before that the customer sees no totals. */
export const moneyFor = (job: Job): MoneyView | null => (isFinalPrice(job) ? { total: jobTotal(job), paid: jobPaid(job), balance: jobBalance(job) } : null);

// ---------- chat with the manager ----------
export const threadOf = (s: MechState, jobId: string): CustMsg[] => s.custMsgs.filter((m) => m.jobId === jobId);
/** Messages from the manager the customer has not opened yet. */
export const customerUnread = (s: MechState, jobId: string) => s.custMsgs.filter((m) => m.jobId === jobId && m.from === 'manager' && !m.read).length;
export function sendCustomerMessage(jobId: string, text: string) {
  const body = text.trim(); if (!body) return;
  patchMech((s) => ({ custMsgs: [...s.custMsgs, { id: nextId('cm'), jobId, from: 'customer', text: body, at: nowIso() }] }));
}
export function markCustomerRead(jobId: string) {
  patchMech((s) => (s.custMsgs.some((m) => m.jobId === jobId && m.from === 'manager' && !m.read) ? { custMsgs: s.custMsgs.map((m) => (m.jobId === jobId && m.from === 'manager' ? { ...m, read: true } : m)) } : {}));
}
/** Studio-only: the mechanic or the manager posts something, to watch it arrive on the tracker. */
export function studioPost(jobId: string, text: string, opts: { photos?: number; internal?: boolean; by?: 'manager' } = {}) {
  patchMech((s) => ({ notes: { ...s.notes, [jobId]: [{ id: nextId('n'), text, photos: opts.photos ?? 0, at: nowIso(), ...(opts.internal ? { internal: true } : {}), ...(opts.by ? { by: opts.by } : {}) } satisfies Note, ...(s.notes[jobId] ?? [])] } }));
}

// ---------- seeding for the story ----------
export type TrackerScenario = 'received' | 'in progress' | 'waiting for parts' | 'quote waiting' | 'ready for pick-up' | 'done' | 'long text' | 'many updates' | 'empty feed';
export type ThreadSeed = 'none' | 'conversation' | 'reply waiting' | 'long conversation';
export const SCENARIO_JOB: Record<TrackerScenario, string> = {
  'received': 'j0420', 'in progress': 'j0408', 'waiting for parts': 'j0412', 'quote waiting': 'j0408', 'ready for pick-up': 'j0407', 'done': 'j0401', 'long text': 'j0412', 'many updates': 'j0410', 'empty feed': 'j0415',
};
const at = (hmm: string) => `${TODAY}T${hmm}:00+08:00`;
export const LONG_UPDATE = 'We checked the whole charging system. The old alternator was worn out and the drive belt had cracks, so we are changing both at the same time to save you a second visit. The battery terminals were corroded and we cleaned them. We also found that the battery itself is still good, so you do not need a new one.';

export function seedTracker(scenario: TrackerScenario, thread: ThreadSeed = 'none'): string {
  resetMech(); resetTracker();
  const jobId = SCENARIO_JOB[scenario];
  const internalNote: Note = { id: 'n-int', text: 'Customer is slow to pay. Ask Mon before releasing the car.', photos: 0, at: at('09:12'), internal: true };
  patchMech((s) => {
    const notes = { ...s.notes };
    let proposals = s.proposals; let messages = s.messages; let custMsgs = s.custMsgs;
    if (scenario === 'received') notes[jobId] = [{ id: 'n-m1', text: 'We have your car. Paolo will start on it after lunch, around 1:00 PM.', photos: 0, at: at('09:30'), by: 'manager' }];
    if (scenario === 'empty feed') notes[jobId] = [];
    if (scenario === 'in progress') notes[jobId] = [{ id: 'n-1', text: 'The radiator flush is done. Now checking the thermostat.', photos: 1, at: at('10:02') }, ...(s.notes[jobId] ?? []), internalNote];
    if (scenario === 'waiting for parts') notes[jobId] = [{ id: 'n-w1', text: 'Your alternator arrives from our main warehouse this afternoon. We will start right away.', photos: 0, at: at('09:48'), by: 'manager' }, internalNote];
    if (scenario === 'long text') notes[jobId] = [{ id: 'n-l1', text: LONG_UPDATE, photos: 3, at: at('10:05') }];
    if (scenario === 'quote waiting') {
      notes[jobId] = [{ id: 'n-q0', text: 'The flush is done and the engine runs cooler. We are looking at one more thing.', photos: 1, at: at('09:41') }, internalNote];
      proposals = [{ id: 'pp-t1', jobId, mechId: 'm-jun', text: 'The lower radiator hose is cracked. It can burst on the road, so we suggest changing it now.', photos: 2, at: at('10:06'), status: 'quoted', quote: { amount: 1800, note: 'New hose and clamps, labour included. About 40 minutes more.', customer: 'waiting', parts: [] } }, ...proposals];
      messages = [...messages, { id: 'ms-t1', jobId, mechId: 'm-jun', from: 'mechanic', kind: 'text', text: 'Hose is cracked, Mon. Quote it?', at: at('10:03') }];
    }
    if (scenario === 'ready for pick-up') notes[jobId] = [{ id: 'n-r1', text: 'All done. We kept the old battery for you, it is in the trunk.', photos: 1, at: at('09:34'), by: 'manager' }];
    if (scenario === 'done') notes[jobId] = [{ id: 'n-d1', text: 'New clutch fitted and road-tested. It feels firm. Please come back after 500 km for a free check.', photos: 0, at: at('08:20') }];
    if (scenario === 'many updates') {
      notes[jobId] = [
        ...Array.from({ length: 11 }, (_, i): Note => ({ id: `n-m${i}`, text: ['Removed the front wheels and checked the pads.', 'Rotors measured, they can be resurfaced.', 'Brake fluid is dark, we will flush it.', 'Started the resurfacing.', 'Rotors are back on the bench.', 'Fitted new pads on the left side.', 'Fitted new pads on the right side.', 'Bleeding the brake lines.', 'Pedal feels firm now.', 'Testing on the road.', 'One more check of the fluid level.'][i]!, photos: i % 3 === 0 ? 1 + (i % 2) : 0, at: at(`${String(8 + Math.floor(i / 3)).padStart(2, '0')}:${String(10 + (i % 3) * 18).padStart(2, '0')}`) })),
        internalNote,
      ];
    }
    if (thread === 'long conversation') {
      const yd = (hmm: string) => `2026-11-01T${hmm}:00+08:00`;
      const q = ['Hi, is the radiator the only thing?', 'Can you check the belt too?', 'How long will it take?', 'Is parking free?', 'Can I send my driver?', 'Thanks!'];
      const a = ['Yes, for now. We will tell you if we find more.', 'Sure, we will look at it.', 'About two hours once we start.', 'Yes, in front of the shop.', 'Yes, just give us the plate.', 'You are welcome.'];
      custMsgs = Array.from({ length: 12 }, (_, i) => ({ id: `cl${i}`, jobId, from: (i % 2 ? 'manager' : 'customer') as 'manager' | 'customer', text: (i % 2 ? a : q)[Math.floor(i / 2)]!, at: i < 6 ? yd(`${15 + Math.floor(i / 2)}:${i % 2 ? '12' : '05'}`) : at(`0${7 + Math.floor((i - 6) / 2)}:${i % 2 ? '40' : '31'}`), read: true }));
    } else if (thread === 'conversation' || thread === 'reply waiting') {
      custMsgs = [
        { id: 'cm1', jobId, from: 'customer', text: 'Hi, can I pick it up by 4 pm today?', at: at('09:20'), answered: true },
        { id: 'cm2', jobId, from: 'manager', text: 'Yes, that should be fine. We will text you when it is ready.', at: at('09:26'), read: thread === 'conversation' },
        ...(thread === 'reply waiting' ? [{ id: 'cm3', jobId, from: 'manager' as const, text: 'Update: the part is here, we start in 10 minutes.', at: at('10:09'), read: false }] : []),
      ];
    }
    return { notes, proposals, messages, custMsgs };
  });
  ensureLink(jobId);
  return jobId;
}

export { jobOf, serviceTitle };
