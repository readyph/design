/* RDY-435. Data adapter for the Inventory Movements page (Prototypes/Inventory/Movements), page-local, prototype only, not exported from the package.
   Non-visual: typed data plus logic, no markup. Transcribed from workshop/prototypes/inventory-home/round-1/final/:
   movements.js 14-25 (helpers), 29-32 (hm12, fmtAt, nowStamp), 34-65 (ledger, REASONS/RANGES, page state S, inRange, hay, fits, shown, ioCounts, nFilt, filtering),
   66-93 (TST/TTONE, tview, trs, trBy, needsMe, canSend, open, unitWords, qtyWords, mixed, tallyT, gotT, goesInT, namesOf, tAt, tWhen);
   stock.js 16-80 (days, reason words, product history, olderEvents, productRows, ledger), 81-98 (FLASH key and kinds, stockCounts, effectText), 246 (STK exports);
   receiving.js 23-44 (HERE, PLACES, place, TR_SEED, store state), 71-85 rule block, 184-200 (ledger events from movements and transfers, restore, mvAdd, mvRemove, transfer writes),
   228-232 (flash, RCV exports); HISTORY (receiving.js 52-66) is the older-orders sample that olderEvents and knownPO read.
   The shared DATA of data.js comes from InventoryHome.dump.ts (via homeData), selected by tenant, role and state.
   Not transcribed (markup or browser only): line 94 tState (slice d), CR/sk/block/logoHTML markup helpers (movements.js 26-28), stock.js reload/landed (location, sessionStorage, Sh.toast),
   the Record movement form mount (stock.js 103-244, component I14), receiving.js S.np/S.cp new-product requests (not read by Movements).
   Differences from the workshop, by necessity: the localStorage-backed store (S) is an in-memory MovementsStore; the page reload after a write becomes refreshAll() on the model. */
import { homeData, type HomeRole, type HomeState, type HomeTenant } from './InventoryHome.data';

export type MovementsTenant = HomeTenant;
export type MovementsRole = HomeRole;
export type MovementsState = HomeState;

export interface MvProduct { id: string; sku: string; name: string; unit: string; onHand: number; reorder: number; usePerDay?: number; cat?: string; [k: string]: unknown }
export interface MvRow { id: string; day?: string; at: string; type: string; p: string; qty: number; ref?: string | null; by: string; note?: string | null; n?: number; [k: string]: unknown }
export interface LedgerRow extends MvRow { day: string; after: number; _o: number; product: MvProduct }
export interface TrLine { p: string; qty: number; got?: number }
export type TrStatus = 'draft' | 'transit' | 'received' | 'cancelled';
export interface Transfer {
  id: string; from: string; to: string; status: TrStatus; lines: TrLine[]; note: string; job: string; request?: boolean;
  createdBy: string; createdAt: string; sentAt?: string; sentBy?: string; sentN?: number; sentHM?: string;
  receivedAt?: string; receivedBy?: string; recvN?: number; recvHM?: string; cancelled?: { at: string; [k: string]: unknown }; legacy?: boolean; [k: string]: unknown;
}
export interface TrView extends Omit<Transfer, 'lines'> { out: boolean; other: Place; lines: (TrLine & { product: MvProduct })[]; units: number; got: number; short: number }
export interface Place { id: string; name: string; short: string; addr: string; here?: boolean }
export interface HistoryOrder { no: string; supplier: string; status: string; ordered: string; expected: string; sentBy: string; receivedAt?: string; receivedBy?: string; cancelled?: { by: string; at: string; why: string }; closedShort?: boolean; settled?: string; lines: { p: string; ordered: number; received: number; cost: number }[] }

export interface MovementsData {
  now: { hm: string; short: string; [k: string]: unknown };
  flags: { quiet?: boolean; loading?: boolean; empty?: boolean; error?: { what: string; lastLoaded: string }; degraded?: { what: string; note: string; since: string } };
  can: string[];
  business: { key: string; logo: string; [k: string]: unknown };
  viewer: { id: string; short: string; [k: string]: unknown };
  role: string;
  people: { id: string; short?: string; role?: string; initials: string; [k: string]: unknown }[];
  locations: { id: string; name?: string; [k: string]: unknown }[];
  branches: { id: string; name: string }[];
  products: MvProduct[];
  pos: { no: string; [k: string]: unknown }[];
  jobs: { jo: string; [k: string]: unknown }[];
  movements: MvRow[];
  [k: string]: unknown;
}

/* What window.ORD adds in the prototype (orders.js): POs made from an order list. Absent = none sent yet (the seeded state). */
export interface MovementsExternals { ord?: { sentPOs(): { no: string }[] } }
export type MovementsParams = Record<string, string | null | undefined>;

/* ---------- receiving.js 52-66: HISTORY (sample, older orders already received or cancelled) ---------- */
const H = (key: string, no: string, supplier: string, status: string, ordered: string, expected: string, rest: Partial<HistoryOrder>, lines: [string, number, number, number][]): HistoryOrder => ({ no, supplier, status, ordered, expected, sentBy: key === 'a' ? 'berto' : 'carlo', ...rest, lines: lines.map(([p, o, r, cost]) => ({ p, ordered: o, received: r, cost })) });
export const historyOf = (key: MovementsTenant): HistoryOrder[] => (key === 'a' ? [
  H(key, 'PO-0220', 'autopro', 'RECEIVED', 'Mon 12 Oct', 'Tue 13 Oct', { receivedAt: 'Tue 13 Oct 11:20', receivedBy: 'nonoy' }, [['p01', 12, 12, 1690], ['p09', 20, 20, 280]]),
  H(key, 'PO-0219', 'motolite', 'RECEIVED', 'Thu 8 Oct', 'Sat 10 Oct', { receivedAt: 'Mon 12 Oct 14:05', receivedBy: 'dandy' }, [['p18', 4, 4, 4500]]),
  H(key, 'PO-0218', 'ace', 'CANCELLED', 'Tue 6 Oct', 'Wed 7 Oct', { cancelled: { by: 'berto', at: 'Tue 6 Oct 15:40', why: 'Supplier was out of stock' } }, [['p22', 24, 0, 95], ['p23', 12, 0, 260]]),
  H(key, 'PO-0217', 'petron', 'RECEIVED', 'Fri 2 Oct', 'Mon 5 Oct', { receivedAt: 'Mon 5 Oct 10:15', receivedBy: 'nonoy', closedShort: true, settled: 'Berto accepted the short delivery' }, [['p06', 12, 8, 520], ['p03', 24, 24, 340]]),
] : [
  H(key, 'PO-0045', 'meat', 'RECEIVED', 'Tue 20 Oct', 'Wed 21 Oct', { receivedAt: 'Wed 21 Oct 14:10', receivedBy: 'jomar' }, [['b12', 3, 3, 520], ['b13', 2, 2, 1180]]),
  H(key, 'PO-0044', 'dairy', 'RECEIVED', 'Mon 19 Oct', 'Tue 20 Oct', { receivedAt: 'Tue 20 Oct 7:10', receivedBy: 'jomar' }, [['b01', 48, 48, 98], ['b03', 8, 8, 165]]),
  H(key, 'PO-0043', 'pack', 'RECEIVED', 'Wed 14 Oct', 'Fri 16 Oct', { receivedAt: 'Mon 19 Oct 9:30', receivedBy: 'jomar' }, [['b10', 20, 20, 260], ['b11', 12, 12, 140]]),
  H(key, 'PO-0042', 'syrup', 'CANCELLED', 'Mon 12 Oct', 'Wed 14 Oct', { cancelled: { by: 'carlo', at: 'Mon 12 Oct 16:10', why: 'Price changed, reorder next month' } }, [['b06', 6, 0, 420]]),
]);

/* ---------- receiving.js 23-44: places and the seeded transfers ---------- */
export const hereOf = (key: MovementsTenant) => (key === 'a' ? 'cubao' : 'maginhawa');
export const placesOf = (key: MovementsTenant): Place[] => (key === 'a' ? [
  { id: 'cubao', name: 'Cubao stockroom', short: 'Cubao', addr: 'Aurora Blvd, Cubao', here: true },
  { id: 'kapitolyo', name: 'Kapitolyo branch', short: 'Kapitolyo', addr: 'Shaw Blvd, Kapitolyo, Pasig' },
  { id: 'marikina', name: 'Marikina branch', short: 'Marikina', addr: 'Sumulong Hwy, Marikina' },
] : [
  { id: 'maginhawa', name: 'Maginhawa café and kitchen', short: 'Maginhawa', addr: 'Maginhawa St, Teachers Village, QC', here: true },
  { id: 'katipunan', name: 'Katipunan kiosk', short: 'Katipunan', addr: 'Katipunan Ave, Loyola Heights, QC' },
]);
export const placeOf = (key: MovementsTenant) => (id: string): Place => placesOf(key).find((x) => x.id === id) || { id, name: id, short: id, addr: '' };
export const trSeed = (key: MovementsTenant): Transfer[] => (key === 'a' ? [
  { id: 'TR-0032', from: 'cubao', to: 'kapitolyo', status: 'draft', lines: [{ p: 'p16', qty: 1 }], note: 'Kapitolyo asked for the last Bosch alternator. The car is waiting, promised 11:00.', job: 'JO-0412', request: true, createdBy: 'leda', createdAt: 'Thu 22 Oct 8:52' },
  { id: 'TR-0031', from: 'cubao', to: 'kapitolyo', status: 'received', lines: [{ p: 'p14', qty: 1, got: 1 }], note: '', job: '', createdBy: 'dandy', createdAt: 'Wed 21 Oct 15:30', sentAt: 'Wed 21 Oct 15:40', sentBy: 'dandy', receivedAt: 'Wed 21 Oct 16:25', receivedBy: 'Kapitolyo branch', legacy: true },
  { id: 'TR-0030', from: 'marikina', to: 'cubao', status: 'transit', lines: [{ p: 'p05', qty: 6 }, { p: 'p15', qty: 2 }], note: 'Spare stock from Marikina, coming with the delivery van.', job: '', createdBy: 'Marikina branch', createdAt: 'Wed 21 Oct 13:50', sentAt: 'Wed 21 Oct 14:20', sentBy: 'Marikina branch' },
  { id: 'TR-0029', from: 'cubao', to: 'marikina', status: 'received', lines: [{ p: 'p22', qty: 4, got: 4 }], note: '', job: '', createdBy: 'nonoy', createdAt: 'Mon 19 Oct 9:50', sentAt: 'Mon 19 Oct 10:10', sentBy: 'nonoy', receivedAt: 'Mon 19 Oct 13:00', receivedBy: 'Marikina branch', legacy: true },
] : [
  { id: 'TR-0013', from: 'katipunan', to: 'maginhawa', status: 'transit', lines: [{ p: 'b11', qty: 12 }], note: 'The kiosk has spare hot cup lids. Our supplier delivers Friday.', job: '', createdBy: 'Katipunan kiosk', createdAt: 'Thu 22 Oct 7:30', sentAt: 'Thu 22 Oct 7:40', sentBy: 'Katipunan kiosk' },
  { id: 'TR-0012', from: 'maginhawa', to: 'katipunan', status: 'received', lines: [{ p: 'b10', qty: 2, got: 2 }], note: '', job: '', createdBy: 'jomar', createdAt: 'Mon 19 Oct 8:00', sentAt: 'Mon 19 Oct 8:20', sentBy: 'jomar', receivedAt: 'Mon 19 Oct 9:10', receivedBy: 'Katipunan kiosk', legacy: true },
]);

/* ---------- the store: the movements and transfers part of receiving.js state S (S.mv, S.tr, S.seq) and its writes (receiving.js 184-200, 228-232) ---------- */
export interface StoreWrite<T> { row?: T; tr?: Transfer; snap: string; undo: () => void }
export function createMovementsStore(key: MovementsTenant) {
  const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
  let S: { mv: MvRow[]; tr: Transfer[]; seq: number } = { mv: [], tr: trSeed(key), seq: 0 };
  const snap = () => JSON.stringify(S);
  const restore = (before: string) => { S = JSON.parse(before); S.mv = S.mv || []; S.tr = S.tr || trSeed(key); };
  const next = () => { S.seq += 1; return S.seq; };
  const trNo = () => 'TR-' + String(Math.max(key === 'a' ? 32 : 13, ...S.tr.map((x) => +x.id.slice(3))) + 1).padStart(4, '0');
  const trGet = (id: string) => S.tr.find((x) => x.id === id) || null;
  return {
    key, HERE: hereOf(key), PLACES: placesOf(key), place: placeOf(key), history: () => clone(historyOf(key)), snap, restore,
    mv: () => S.mv.slice(),
    mvAdd(row: Omit<MvRow, 'id' | 'n'>): StoreWrite<MvRow> { const before = snap(); const m = { id: 'V' + (S.mv.length ? Math.max(...S.mv.map((x) => +x.id.slice(1))) + 1 : 1), n: next(), ...row } as MvRow; S.mv.push(m); return { row: m, snap: before, undo: () => restore(before) }; },
    mvRemove(id: string): StoreWrite<never> { const before = snap(); S.mv = S.mv.filter((m) => m.id !== id); return { snap: before, undo: () => restore(before) }; },
    trs: (): Transfer[] => clone(S.tr),
    trGet: (id: string): Transfer | null => { const x = trGet(id); return x ? clone(x) : null; },
    trAdd(t: Partial<Transfer> & Pick<Transfer, 'from' | 'to' | 'lines'>): StoreWrite<never> & { tr: Transfer } { const before = snap(); const tr = { id: trNo(), status: 'draft', note: '', job: '', request: false, ...t } as Transfer; S.tr.unshift(tr); return { tr, snap: before, undo: () => restore(before) }; },
    /* patch one transfer; `ev` = 'sent' | 'received' gives the event a place in the order of stock events */
    trSet(id: string, patch: Partial<Transfer>, ev?: 'sent' | 'received'): (StoreWrite<never> & { tr: Transfer }) | null { const before = snap(); const tr = trGet(id); if (!tr) return null; Object.assign(tr, patch); if (ev === 'sent') tr.sentN = next(); if (ev === 'received') tr.recvN = next(); return { tr, snap: before, undo: () => restore(before) }; },
    trRemove(id: string): StoreWrite<never> { const before = snap(); S.tr = S.tr.filter((x) => x.id !== id); return { snap: before, undo: () => restore(before) }; },
  };
}
export type MovementsStore = ReturnType<typeof createMovementsStore>;

/* receiving.js 184-200: stock moves by the same rule on every page, oldest first so the newest ends up on top */
export function applyMovements(base: MovementsData, store: MovementsStore): MovementsData {
  const t: MovementsData = { ...base, products: base.products.map((p) => ({ ...p })), movements: base.movements.slice() };
  const byId = Object.fromEntries(t.products.map((p) => [p.id, p]));
  const { HERE, place } = store;
  const ev: { n?: number; m: MvRow }[] = [];
  store.mv().forEach((m) => ev.push({ n: m.n, m: { id: m.id, day: 'today', at: m.at, type: m.type, p: m.p, qty: m.qty, ref: m.ref || null, by: m.by, note: m.note || null } }));
  store.trs().forEach((tr) => {
    if (tr.legacy) return;
    const sent = tr.status === 'transit' || tr.status === 'received';
    if (tr.from === HERE && sent) tr.lines.forEach((l) => ev.push({ n: tr.sentN, m: { id: `${tr.id}-${l.p}-out`, day: 'today', at: tr.sentHM as string, type: 'transfer', p: l.p, qty: -l.qty, ref: tr.id, by: tr.sentBy as string, note: `To ${place(tr.to).name}` } }));
    if (tr.to === HERE && tr.status === 'received') tr.lines.forEach((l) => { if ((l.got as number) > 0) ev.push({ n: tr.recvN, m: { id: `${tr.id}-${l.p}-in`, day: 'today', at: tr.recvHM as string, type: 'transfer', p: l.p, qty: l.got as number, ref: tr.id, by: tr.receivedBy as string, note: `From ${place(tr.from).name}${(l.got as number) < l.qty ? `, ${l.qty - (l.got as number)} short` : ''}` } }); });
  });
  ev.sort((a, b) => (a.n || 0) - (b.n || 0)).forEach(({ m }) => { const p = byId[m.p]; if (!p) return; p.onHand += m.qty; t.movements.unshift(m); });
  /* data.js 338: derive() then decorates every movement with its product and the name of who made it */
  t.movements = t.movements.map((m) => ({ ...m, product: byId[m.p], byName: (t.people.find((p) => p.id === m.by) || ({} as { short?: string })).short }));
  return t;
}

/* ---------- receiving.js 71-85: the one rule for "n of m in" (tally, unitWords, amt, line, sum, words) ---------- */
export interface RuleRow { p?: string; product?: MvProduct; ordered: number; got: number }
export function makeRule(prodOf: (id: string) => MvProduct | undefined) {
  type L = { p?: string; product?: MvProduct };
  const rule = {
    line(ordered: number, good: number) { const g = Math.max(0, Math.round(+good || 0)), o = Math.max(0, Math.round(+ordered || 0)); return { ordered: o, good: g, received: Math.min(g, o), extra: Math.max(g - o, 0), due: Math.max(o - g, 0) }; },
    sum(ls: { ordered: number; received: number; extra: number; due: number }[]) { return ls.reduce((a, l) => ({ ordered: a.ordered + l.ordered, received: a.received + l.received, extra: a.extra + l.extra, due: a.due + l.due }), { ordered: 0, received: 0, extra: 0, due: 0 }); },
    inOf: (received: number, ordered: number) => `${received} of ${ordered} in`,
    dueW: (n: number) => `${n} still due`,
    unitOf: (l: L) => { const pr = l.product || prodOf(l.p as string); return pr ? pr.unit : ''; },
    nameOf: (l: L) => { const pr = l.product || prodOf(l.p as string); return pr ? pr.name : ''; },
    mixed(ls: L[]): boolean { return new Set(ls.map((l) => rule.unitOf(l))).size > 1; },
    /* "6 bottles and 2 pc" */
    unitWords<T extends L>(ls: T[], get: (l: T) => number) { const g = new Map<string, number>(); ls.forEach((l) => { const u = rule.unitOf(l); g.set(u, (g.get(u) || 0) + get(l)); }); const parts = [...g].map(([u, n]) => `${n.toLocaleString('en-PH')} ${u === 'pc' ? 'pc' : n === 1 ? u : u + 's'}`); return parts.length < 3 ? parts.join(' and ') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`; },
    /* an amount of lines: a bare number for one unit, "2 bottles and 3 pc" for several */
    amt<T extends L>(ls: T[], get: (l: T) => number) { return rule.mixed(ls) ? rule.unitWords(ls, get) : String(ls.reduce((s, l) => s + get(l), 0)); },
    tally(rows: RuleRow[], word?: string) {
      const w = word || 'still due', ord = rows.reduce((s, r) => s + r.ordered, 0), rec = rows.reduce((s, r) => s + Math.min(r.got, r.ordered), 0), due = ord - rec;
      if (!rule.mixed(rows)) return { text: `${rule.inOf(rec, ord)}${due ? `, ${due} ${w}` : ''}`, ordered: ord, received: rec, due, mixed: false };
      const full = rows.filter((r) => r.got >= r.ordered), part = rows.filter((r) => r.got < r.ordered), out: string[] = [];
      if (full.length) out.push(`${rule.unitWords(full, (r) => r.ordered)} in`);
      part.forEach((r) => { const g = Math.min(r.got, r.ordered), u = rule.unitWords([{ ...r }], () => r.ordered).replace(/^[\d,]+ /, ''), sw = w === 'short' ? 'short' : 'still due'; out.push(g > 0 ? `${g} of ${r.ordered} ${u} in, ${r.ordered - g} ${sw} on ${rule.nameOf(r)}` : `${r.ordered - g} ${sw} on ${rule.nameOf(r)}`); });
      return { text: out.join(', '), ordered: ord, received: rec, due, mixed: true };
    },
    /* "6 of 9 in, 3 still due" for any set of lines carrying { ordered, received } */
    words(ls: { p?: string; product?: MvProduct; ordered: number; received: number; extra?: number }[]) { const rows = ls.map((l) => { const r = rule.line(l.ordered, l.received + (l.extra || 0)); return { p: l.p, product: l.product, ordered: r.ordered, got: r.received }; }), t = rule.tally(rows, 'still due'); return { ordered: t.ordered, received: t.received, due: t.due, extra: ls.reduce((s, l) => s + rule.line(l.ordered, l.received + (l.extra || 0)).extra, 0), text: t.text }; },
  };
  return rule;
}

/* stock.js 81-98 */
export const FLASH_KEY = 'rph-rcv-flash';
export const FLASH_KINDS = ['moved', 'mundone'];

/* movements.js 14-25 and 29-32, pure parts */
export const num = (n: number) => Number(n).toLocaleString('en-PH');
export const plr = (n: number, a: string, b?: string) => `${n} ${n === 1 ? a : b || a + 's'}`;
export const hm12 = (hm: unknown): string => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(hm || '')); if (!m) return (hm as string) || ''; const h = +m[1]; return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`; };
/* 'Wed 21 Oct 14:20' -> 'Wed 21 Oct, 2:20 PM' */
export const fmtAt = (s: unknown): string => { const m = /^(.*?)\s*(\d{1,2}:\d{2})$/.exec(String(s || '')); return m ? `${m[1]}${m[1] ? ', ' : ''}${hm12(m[2].replace(/^(\d):/, '0$1:'))}` : String(s || ''); };

export const TST: Record<TrStatus, string> = { draft: 'Draft', transit: 'In transit', received: 'Received', cancelled: 'Cancelled' };
export const TTONE: Record<TrStatus, string> = { draft: 'dash', transit: 'accent', received: 'ok', cancelled: 'off' };

export type RangeKey = 'recent' | 'week' | 'all' | 'custom';
export type IoKey = 'all' | 'in' | 'out';
export interface MovementsS {
  view: 'ledger' | 'transfers'; io: IoKey; reason: string; prod: string; who: string; range: RangeKey; rf: number; rt: number; q: string; limit: number; fo: boolean; hl: string | null;
  rec: boolean; recP: string | null; tf: string; tr: string | null; rcv: boolean;
  form: { id: string | null; to: string | null; lines: TrLine[]; note: string; job: string; q: string; err: string } | null; rf2: unknown; confirm: unknown; retried: boolean; from: 'products' | 'home' | null;
}

/* movements.js 14-93 with stock.js 16-98 (STK) and the store (RCV). `D` is read live, so refreshAll() after a write shows the new stock everywhere. */
export function createMovementsModel(tenant: MovementsTenant, role: MovementsRole = 'manager', state: MovementsState = 'live', params: MovementsParams = {}, store: MovementsStore = createMovementsStore(tenant), ext: MovementsExternals = {}) {
  const build = () => applyMovements(homeData(tenant, role, state) as unknown as MovementsData, store);
  let D: MovementsData = build();
  const q = { get: (k: string): string | null => (params[k] === undefined || params[k] === '' ? null : (params[k] as string | null)) };
  const F = D.flags || {};
  const can = (p: string) => D.can.includes(p);
  const isA = D.business.key === 'a';
  const mgr = () => 'your manager', Mgr = () => 'Your manager';
  const prod = (id: string) => D.products.find((p) => p.id === id);
  const person = (id: string) => D.people.find((p) => p.id === id);
  const loc = (id: string) => (D.locations.find((l) => l.id === id) || ({} as { name?: string })).name || '';
  const unitOf = (p: MvProduct | undefined, n: number) => (p && p.unit === 'pc' ? 'pc' : p ? (n === 1 ? p.unit : p.unit + 's') : '');
  const { HERE, place, PLACES } = store;
  const rule = makeRule((id) => prod(id));
  const nowStampOf = (dayShort: (n: number) => string) => () => `${dayShort(22)} ${D.now.hm.replace(/^0/, '')}`;
  const err = !!F.error;

  /* ====== STK (stock.js 16-98) ====== */
  const pad2 = (t: unknown) => String(t).replace(/^(\d):/, '0$1:');
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], DOWL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNum = (d: unknown): number => (d === 'today' ? 22 : d === 'yesterday' ? 21 : ((/(\d{1,2}) Oct/.exec(String(d || '')) || [0, 0])[1] as number) * 1);
  const dow = (n: number) => (((4 + (n - 22)) % 7) + 7) % 7;
  const dayShort = (n: number) => `${DOW[dow(n)]} ${n} Oct`;
  const dayLong = (n: number) => `${DOWL[dow(n)]} ${n} October`;
  type Sortable = { day?: string; at: string; _o?: number };
  const cmp = (a: Sortable, b: Sortable) => dayNum(b.day) - dayNum(a.day) || String(pad2(b.at)).localeCompare(String(pad2(a.at))) || (a._o || 0) - (b._o || 0);

  const isJO = (r: unknown) => /^JO-\d+/.test((r as string) || '');
  const usedRef = (r: unknown) => isJO(r) || /^(Morning bar|Kitchen prep|Kitchen use)/.test((r as string) || '');
  const reasonKey = (m: MvRow) => (m.type === 'received' ? 'received' : m.type === 'transfer' ? 'transfer' : m.type === 'damaged' ? 'damaged' : m.type === 'count' ? 'count' : usedRef(m.ref) ? 'used' : 'sold');
  const REASON_WORD: Record<string, string> = { received: 'Received from order', sold: 'Sold', used: isA ? 'Used on a job' : 'Used in the kitchen', transfer: 'Transfer', damaged: 'Damaged', count: 'Count correction' };
  const who = (id: string) => (id === 'leda' ? 'Leda' : (person(id) || ({} as { short?: string })).short || id || '');

  const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rnd = (seed: number) => { let x = seed || 1; return () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296; };
  const EARLIER_DAYS = isA ? ['Tue 20 Oct', 'Mon 19 Oct', 'Sat 17 Oct', 'Fri 16 Oct', 'Thu 15 Oct'] : ['Tue 20 Oct', 'Mon 19 Oct', 'Sun 18 Oct', 'Sat 17 Oct', 'Fri 16 Oct'];
  const stockers = () => D.people.filter((p) => p.role === 'stocker').map((p) => p.id);
  /* sold and count rows before yesterday (sample), made so the stock never goes below zero going back */
  function generated(p: MvProduct, bal: number): MvRow[] {
    const r = rnd(hash(p.id)), rows: MvRow[] = [], sk = stockers(); let b = bal;
    for (let i = 0; i < 5; i++) {
      const hh = 8 + Math.floor(r() * 9), mm = Math.floor(r() * 12) * 5, at = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      const by = sk[Math.floor(r() * sk.length)], c = r(), k = 1 + Math.floor(r() * 3), j = Math.floor(r() * 2), pick = Math.floor(r() * 3), br = Math.floor(r() * 3);
      let m: { type: string; qty: number; ref: string | null; note: string };
      if (c < 0.12 && b >= 1) m = { type: 'count', qty: 1, ref: null, note: 'Count: found 1 more' };
      else m = { type: 'sold', qty: -k, ref: isA ? (p.usePerDay || p.cat === 'batt' ? 'Walk-in sale' : `JO-0${407 - i * 2 - j}`) : ['Morning bar', 'Kitchen prep', 'Takeout'][pick], note: isA ? ['Cubao', 'Kapitolyo', 'Marikina'][br] : '' };
      rows.push({ id: `${p.id}-e${i}`, day: EARLIER_DAYS[i], at, by, ...m } as MvRow); /* stock.js 45: generated rows carry no `p`, as in the workshop */
      b -= m.qty; if (b < 0) b = 0;
    }
    return rows;
  }
  /* receipts of the older orders, and transfers sent before yesterday: the same records the Purchase orders page and the transfer list show */
  function olderEvents(p: MvProduct): MvRow[] {
    const ev: MvRow[] = [];
    store.history().filter((h) => h.status === 'RECEIVED' && h.receivedAt).forEach((h) => {
      const l = h.lines.find((x) => x.p === p.id), m = /^([A-Za-z]{3} \d{1,2} [A-Za-z]{3}) (\d{1,2}:\d{2})$/.exec(h.receivedAt as string);
      if (l && m && l.received > 0 && dayNum(m[1]) < 21) ev.push({ id: `${p.id}-${h.no}`, day: m[1], at: pad2(m[2]), type: 'received', p: p.id, qty: l.received, ref: h.no, by: h.receivedBy as string, note: `${l.ordered} ordered` });
    });
    store.trs().filter((t) => t.legacy && t.sentAt && dayNum(t.sentAt) < 21).forEach((t) => {
      const l = t.lines.find((x) => x.p === p.id), m = /^([A-Za-z]{3} \d{1,2} [A-Za-z]{3}) (\d{1,2}:\d{2})$/.exec(t.sentAt as string);
      if (l && m && t.from === HERE) ev.push({ id: `${p.id}-${t.id}`, day: m[1], at: pad2(m[2]), type: 'transfer', p: p.id, qty: -l.qty, ref: t.id, by: t.sentBy as string, note: `To ${place(t.to).name}` });
    });
    return ev;
  }
  /* every row of one product, newest first, each with `after` (what was left once it happened) */
  function productRows(p: MvProduct, o: { local?: MvRow[]; start?: number } = {}): (MvRow & { after: number; _o: number })[] {
    const known = D.movements.map((m, i) => ({ ...m, _o: i })).filter((m) => m.p === p.id);
    const local = (o.local || []).map((m, i) => ({ ...m, _o: -100 + i }));
    const rows = (local.concat(known) as (MvRow & { after: number; _o: number })[]).sort(cmp);
    let bal = o.start != null ? o.start : p.onHand;
    rows.forEach((r) => { r.after = bal; bal -= r.qty; });
    const older = (generated(p, Math.max(0, bal)).concat(olderEvents(p)).map((r, i) => ({ ...r, _o: 1000 + i })) as (MvRow & { after: number; _o: number })[]).sort(cmp);
    older.forEach((r) => { r.after = bal; bal = Math.max(0, bal - r.qty); });
    return rows.concat(older);
  }
  /* every row of every product, newest first */
  function stkLedger(): LedgerRow[] {
    const out: LedgerRow[] = [];
    D.products.forEach((p) => productRows(p).forEach((r) => out.push({ ...r, day: r.day as string, product: p })));
    return out.sort(cmp);
  }
  const stockCounts = (ps: { onHand: number; reorder: number }[]) => ({ low: ps.filter((p) => p.onHand > 0 && p.onHand <= p.reorder).length, out: ps.filter((p) => p.onHand <= 0).length });
  const effectText = (changes: Record<string, number>) => {
    const before = stockCounts(D.products), after = stockCounts(D.products.map((p) => ({ ...p, onHand: p.onHand + (changes[p.id] || 0) })));
    const ch = [before.low !== after.low && `Low stock ${before.low} to ${after.low}`, before.out !== after.out && `out of stock ${before.out} to ${after.out}`].filter(Boolean);
    return ch.length ? `${ch.join(', ').replace(/^./, (c) => c.toUpperCase())}.` : '';
  };
  const STK = { dayNum, dayShort, dayLong, dow, cmp, isJO, usedRef, reasonKey, REASON_WORD, who, productRows, ledger: stkLedger, stockCounts, effectText, FLASH_KEY, FLASH_KINDS };
  const nowStamp = nowStampOf(dayShort);

  /* ====== movements.js 34-65: the ledger ====== */
  let _led: LedgerRow[] | null = null;
  let _trs: TrView[] | null = null;
  const ledger = () => (_led = _led || (F.empty || q.get('mv') === 'none' ? [] : stkLedger()));
  /* after a write the workshop reloads the page: here the data is applied again from the store */
  const refreshAll = () => { D = build(); _led = null; _trs = null; };
  const knownPO = (no: string) => D.pos.some((p) => p.no === no) || store.history().some((h) => h.no === no) || !!(ext.ord && ext.ord.sentPOs().some((p) => p.no === no));
  const REASONS: [string, string][] = [['all', 'All reasons'], ['received', 'Received from an order'], ['sold', 'Sold'], ['used', isA ? 'Used on a job' : 'Used in the kitchen'], ['transfer', 'Transfers'], ['damaged', 'Damaged'], ['count', 'Count correction']];
  const RANGES: [RangeKey, string][] = [['recent', 'Today and yesterday'], ['week', 'Last 7 days'], ['all', 'All dates'], ['custom', 'Choose dates']];
  const S: MovementsS = {
    view: q.get('view') === 'transfers' || q.get('tr') || q.get('new') ? 'transfers' : 'ledger',
    io: (['all', 'in', 'out'] as IoKey[]).includes(q.get('io') as IoKey) ? (q.get('io') as IoKey) : 'all', reason: REASONS.some((r) => r[0] === q.get('reason')) ? (q.get('reason') as string) : 'all', prod: q.get('prod') || 'all', who: q.get('who') || 'all',
    range: RANGES.some((r) => r[0] === q.get('range')) ? (q.get('range') as RangeKey) : 'recent', rf: +(q.get('from') as string) || 15, rt: +(q.get('to') as string) || 22, q: q.get('qs') || '', limit: 40, fo: false, hl: q.get('hl') || null,
    rec: !!q.get('record') && !q.get('tr'), recP: q.get('p') || null, tf: ['all', 'draft', 'transit', 'received', 'cancelled'].includes(q.get('tf') as string) ? (q.get('tf') as string) : 'all',
    tr: q.get('tr') || null, rcv: !!q.get('rcv'), form: q.get('new') ? { id: null, to: null, lines: [], note: '', job: '', q: '', err: '' } : null, rf2: null, confirm: null,
    retried: false, from: ['products', 'home'].includes(q.get('from') as string) ? (q.get('from') as 'products' | 'home') : null,
  };
  const inRange = (r: { day?: string }) => { const d = dayNum(r.day); return S.range === 'recent' ? d >= 21 : S.range === 'week' ? d >= 16 : S.range === 'custom' ? d >= Math.min(S.rf, S.rt) && d <= Math.max(S.rf, S.rt) : true; };
  const hay = (r: LedgerRow) => [r.product.name, r.product.sku, r.ref, r.note, who(r.by), REASON_WORD[reasonKey(r)], r.qty > 0 ? 'in' : 'out'].filter(Boolean).join(' ').toLowerCase();
  const fits = (r: LedgerRow, skip?: string) => {
    if (skip !== 'io' && S.io !== 'all' && (S.io === 'in') !== (r.qty > 0)) return false;
    if (S.reason !== 'all' && reasonKey(r) !== S.reason) return false;
    if (S.prod !== 'all' && r.p !== S.prod) return false;
    if (S.who !== 'all' && r.by !== S.who) return false;
    if (!inRange(r)) return false;
    const t = S.q.trim().toLowerCase(); if (t && !hay(r).includes(t)) return false;
    return true;
  };
  const shown = () => ledger().filter((r) => fits(r));
  const ioCounts = () => { const base = ledger().filter((r) => fits(r, 'io')); return { all: base.length, in: base.filter((r) => r.qty > 0).length, out: base.filter((r) => r.qty < 0).length }; };
  const nFilt = () => (S.reason !== 'all' ? 1 : 0) + (S.prod !== 'all' ? 1 : 0) + (S.who !== 'all' ? 1 : 0) + (S.range !== 'recent' ? 1 : 0);
  const filtering = () => S.io !== 'all' || S.q.trim() || nFilt();

  /* ====== movements.js 66-93: transfers ====== */
  function tview(t: Transfer): TrView {
    const out = t.from === HERE, other = place(out ? t.to : t.from);
    const lines = t.lines.map((l) => ({ ...l, product: prod(l.p) as MvProduct })).filter((l) => l.product);
    const units = lines.reduce((s, l) => s + l.qty, 0), got = lines.reduce((s, l) => s + (l.got != null ? l.got : 0), 0);
    return { ...t, out, other, lines, units, got, short: t.status === 'received' ? lines.reduce((s, l) => s + Math.max(0, l.qty - (l.got != null ? l.got : l.qty)), 0) : 0 };
  }
  const trs = () => (_trs = _trs || store.trs().map(tview).filter((t) => !(F.quiet && (t.status === 'draft' || t.status === 'transit'))));
  const trBy = (id: string) => trs().find((t) => t.id === id) || null;
  const canSend = (t: object & { request?: unknown }) => can('transfer') && (!t.request || can('approve_transfer'));
  const needsMe = (t: TrView) => (t.status === 'draft' && t.out && canSend(t)) || (t.status === 'transit' && !t.out && can('receive'));
  const open = () => trs().filter((t) => t.status === 'draft' || t.status === 'transit');
  /* quantities always carry their unit: "6 bottles and 2 pc", never a bare "8 items" that adds bottles to pieces */
  type PL = { product: MvProduct; qty: number; got?: number };
  const unitWords = (lines: PL[], get?: (l: PL) => number) => { const g = new Map<string, number>(); lines.forEach((l) => g.set(l.product.unit, (g.get(l.product.unit) || 0) + (get ? get(l) : l.qty))); const parts = [...g].map(([u, n]) => `${num(n)} ${u === 'pc' ? 'pc' : n === 1 ? u : u + 's'}`); return parts.length < 3 ? parts.join(' and ') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`; };
  const qtyWords = (t: TrView) => unitWords(t.lines);
  const mixed = (t: TrView) => new Set(t.lines.map((l) => l.product.unit)).size > 1;
  /* "6 of 8 in, 2 short" for one unit; "6 bottles in, 2 short on Radiator cap" when the lines have different units (never one sum of unlike units) */
  const tallyT = (t: TrView, get: (l: PL) => number) => rule.tally(t.lines.map((l) => ({ product: l.product, ordered: l.qty, got: get(l) })), 'short').text;
  const gotT = (t: TrView) => tallyT(t, (l) => (l.got != null ? l.got : l.qty));
  const goesInT = (lines: PL[], get: (l: PL) => number) => { const w = unitWords(lines.filter((l) => get(l) > 0), get), one = lines.filter((l) => get(l) > 0).length === 1 && lines.reduce((s, l) => s + get(l), 0) === 1; return `${w} ${one ? 'goes' : 'go'} into stock`; };
  const namesOf = (t: TrView) => t.lines.map((l) => l.product.name).join(', ');
  const tAt = (t: TrView) => (t.status === 'received' ? t.receivedAt : t.status === 'transit' ? t.sentAt : t.status === 'cancelled' && t.cancelled ? (t.cancelled as { at: string }).at : t.createdAt);
  const tWhen = (t: TrView) => fmtAt(tAt(t));

  return {
    get D() { return D; }, S, F, can, isA, mgr, Mgr, num, plr, prod, person, loc, unitOf, who, HERE, place, PLACES, rule, nowStamp, err, hm12, fmtAt,
    store, STK, ledger, refreshAll, knownPO, REASONS, RANGES, inRange, hay, fits, shown, ioCounts, nFilt, filtering,
    TST, TTONE, tview, trs, trBy, needsMe, canSend, open, unitWords, qtyWords, mixed, tallyT, gotT, goesInT, namesOf, tAt, tWhen,
  };
}
export type MovementsModel = ReturnType<typeof createMovementsModel>;
