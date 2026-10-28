import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createMovementsModel, createMovementsStore, fmtAt, makeRule, type MovementsRole, type MovementsState, type MovementsTenant } from './Movements.data';

/* RDY-435. The adapter must behave like movements.js 14-93 and stock.js: the workshop files are run with a stubbed window and compared with the adapter. */
const FINAL = process.env.READYPH_WORKSHOP_FINAL || '/Users/earvingemenez/Projects/readyph/workshop/prototypes/inventory-home/round-1/final';
const HAS_WORKSHOP = existsSync(resolve(FINAL, 'movements.js'));
const read = (f: string) => readFileSync(resolve(FINAL, f), 'utf8');
const storeStub = () => { const m: Record<string, string> = {}; return { getItem: (k: string) => m[k] ?? null, setItem: (k: string, v: string) => { m[k] = v; }, removeItem: (k: string) => { delete m[k]; } }; };

/* eslint-disable @typescript-eslint/no-explicit-any */
function workshop(tenant: MovementsTenant, role: MovementsRole, state: MovementsState, search: string) {
  const win: Record<string, any> = { localStorage: storeStub(), sessionStorage: storeStub() };
  const loc = { search: `?tenant=${tenant}&as=${role}&state=${state}${search}`, pathname: '/movements.html', href: 'http://x/movements.html' };
  win.Shell = { esc: (x: unknown) => x, ic: () => '', LMARK: '', toast: () => {} };
  const run = (src: string) => new Function('window', 'location', 'URLSearchParams', 'localStorage', 'sessionStorage', 'document', 'const RCV = window.RCV, STK = window.STK;\n' + src)(win, loc, URLSearchParams, win.localStorage, win.sessionStorage, {});
  run(read('receiving.js'));
  run(read('data.js'));
  run(read('stock.js'));
  const lines = read('movements.js').split('\n');
  const head = lines.slice(9, 93).join('\n')
    .replace('const D = window.DATA, Sh = window.Shell, { esc, ic, LMARK } = Sh;', 'const D = window.DATA, esc = (x) => x;')
    .replace(/const \$ = [^\n]*\n/, '').replace(/const CR = [^\n]*\n/, '').replace(/const sk = [^\n]*\n/, '').replace(/const block = [^\n]*\n/, '').replace(/const logoHTML = [^\n]*\n/, '')
    .replace(/const tState = [^\n]*\n?/, '');
  const body = `${head}\nreturn { S, ledger, shown, ioCounts, nFilt, filtering, trs, needsMe, canSend, open, tWhen, qtyWords, gotT, namesOf, mixed, nowStamp };`;
  return { w: new Function('window', 'location', 'URLSearchParams', 'RCV', 'STK', body)(win, loc, URLSearchParams, win.RCV, win.STK), win };
}
const j = (v: unknown) => JSON.parse(JSON.stringify(v));
const searches = ['', '&io=in', '&io=out&reason=sold', '&range=week&qs=bosch', '&range=all', '&range=custom&from=18&to=20', '&reason=transfer&range=all', '&who=nonoy&range=all', '&view=transfers&tf=transit'];
const combos: [MovementsTenant, MovementsRole, MovementsState][] = [
  ['a', 'manager', 'live'], ['a', 'clerk', 'live'], ['a', 'owner', 'live'], ['a', 'manager', 'quiet'], ['a', 'manager', 'empty'], ['a', 'manager', 'error'],
  ['b', 'manager', 'live'], ['b', 'clerk', 'live'], ['b', 'owner', 'quiet'],
];
const toParams = (s: string) => Object.fromEntries(new URLSearchParams(s));

describe('Movements data adapter vs the workshop scripts', () => {
  it.skipIf(!HAS_WORKSHOP).each(combos.flatMap((c) => searches.map((s) => [...c, s] as [MovementsTenant, MovementsRole, MovementsState, string])))('%s %s %s %s', (t, r, s, search) => {
    const { w } = workshop(t, r, s, search);
    const m = createMovementsModel(t, r, s, toParams(search));
    expect(j(m.ledger())).toEqual(j(w.ledger()));
    expect(j(m.shown())).toEqual(j(w.shown()));
    expect(m.ioCounts()).toEqual(w.ioCounts());
    expect([m.nFilt(), !!m.filtering()]).toEqual([w.nFilt(), !!w.filtering()]);
    expect(j(m.S)).toEqual(j(w.S));
    expect(j(m.trs())).toEqual(j(w.trs()));
    expect(j(m.open())).toEqual(j(w.open()));
    for (const tr of m.trs()) {
      const wt = w.trs().find((x: { id: string }) => x.id === tr.id);
      expect([m.needsMe(tr), m.canSend(tr), m.tWhen(tr), m.qtyWords(tr), m.gotT(tr), m.namesOf(tr), m.mixed(tr)]).toEqual([w.needsMe(wt), w.canSend(wt), w.tWhen(wt), w.qtyWords(wt), w.gotT(wt), w.namesOf(wt), w.mixed(wt)]);
    }
    expect(m.nowStamp()).toBe(w.nowStamp());
  });
});

describe('Movements rules', () => {
  const all = combos.map(([t, r, s]) => createMovementsModel(t, r, s));
  it('no balance is ever below 0 and the newest row of each product equals on hand', () => {
    for (const m of all.filter((x) => !x.F.empty)) {
      const rows = m.STK.ledger();
      for (const p of m.D.products) {
        expect(rows.filter((r) => r.product.id === p.id).length).toBeGreaterThan(0);
        expect(rows.filter((r) => r.product.id === p.id).every((r) => r.after >= 0)).toBe(true);
        expect(m.STK.productRows(p)[0].after).toBe(p.onHand);
      }
    }
  });
  it('filters: io, reason, product, person, range, search', () => {
    const base = createMovementsModel('a', 'manager', 'live', { range: 'all' });
    const total = base.shown().length;
    const c = base.ioCounts();
    expect(c.all).toBe(total);
    expect(c.in + c.out).toBe(total);
    expect(createMovementsModel('a', 'manager', 'live', { range: 'all', io: 'in' }).shown().every((r) => r.qty > 0)).toBe(true);
    expect(createMovementsModel('a', 'manager', 'live', { range: 'all', io: 'out' }).shown().every((r) => r.qty < 0)).toBe(true);
    const sold = createMovementsModel('a', 'manager', 'live', { range: 'all', reason: 'sold' });
    expect(sold.shown().length).toBeGreaterThan(0);
    expect(sold.shown().every((r) => sold.STK.reasonKey(r) === 'sold')).toBe(true);
    const pid = base.D.products[0].id;
    expect(createMovementsModel('a', 'manager', 'live', { range: 'all', prod: pid }).shown().every((r) => r.p === pid)).toBe(true);
    const recent = createMovementsModel('a', 'manager', 'live').shown();
    expect(recent.every((r) => base.STK.dayNum(r.day) >= 21)).toBe(true);
    expect(recent.length).toBeLessThan(total);
    const s = createMovementsModel('a', 'manager', 'live', { range: 'all', qs: 'BOSCH' }).shown();
    expect(s.length).toBeGreaterThan(0);
    expect(s.length).toBeLessThan(total);
    expect(createMovementsModel('a', 'manager', 'live', { range: 'all', who: 'nonoy' }).shown().every((r) => r.by === 'nonoy')).toBe(true);
    expect(createMovementsModel('a', 'manager', 'live', { mv: 'none' }).ledger()).toEqual([]);
    expect(createMovementsModel('a', 'manager', 'empty').ledger()).toEqual([]);
  });
  it('canSend by role and request', () => {
    for (const r of ['manager', 'clerk', 'owner'] as MovementsRole[]) {
      const m = createMovementsModel('a', r, 'live');
      expect(m.canSend({})).toBe(m.can('transfer'));
      expect(m.canSend({ request: true })).toBe(m.can('transfer') && m.can('approve_transfer'));
    }
    expect(createMovementsModel('a', 'manager', 'live').canSend({ request: true })).toBe(true);
  });
  it('quiet hides draft and in-transit transfers', () => {
    const live = createMovementsModel('a', 'manager', 'live').trs(), quiet = createMovementsModel('a', 'manager', 'quiet').trs();
    expect(live.some((t) => t.status === 'draft' || t.status === 'transit')).toBe(true);
    expect(quiet.some((t) => t.status === 'draft' || t.status === 'transit')).toBe(false);
  });
  it('unit words', () => {
    const m = createMovementsModel('a', 'manager', 'live');
    const bottle = m.D.products.find((p) => p.unit === 'bottle')!, pc = m.D.products.find((p) => p.unit === 'pc')!;
    expect(m.unitWords([{ product: bottle, qty: 18 }])).toBe('18 bottles');
    expect(m.unitWords([{ product: bottle, qty: 1 }, { product: pc, qty: 2 }])).toBe('1 bottle and 2 pc');
    expect(m.goesInT([{ product: bottle, qty: 18 }], (l) => l.qty)).toBe('18 bottles go into stock');
    expect(m.goesInT([{ product: pc, qty: 1 }], (l) => l.qty)).toBe('1 pc goes into stock');
    expect(fmtAt('Wed 21 Oct 14:20')).toBe('Wed 21 Oct, 2:20 PM');
    expect(makeRule((id) => m.prod(id)).tally([{ product: bottle, ordered: 8, got: 6 }], 'short').text).toBe('6 of 8 in, 2 short');
  });
  it('tenants A and B differ', () => {
    const a = createMovementsModel('a', 'manager', 'live'), b = createMovementsModel('b', 'manager', 'live');
    expect([a.HERE, b.HERE]).toEqual(['cubao', 'maginhawa']);
    expect([a.trs().length, b.trs().length]).toEqual([4, 2]);
    expect([a.REASONS[3][1], b.REASONS[3][1]]).toEqual(['Used on a job', 'Used in the kitchen']);
  });
});

describe('Movements writes keep every page reading the same stock', () => {
  it.skipIf(!HAS_WORKSHOP)('mvAdd and transfers move stock like the workshop; undo restores', () => {
    const store = createMovementsStore('a');
    const m = createMovementsModel('a', 'manager', 'live', {}, store);
    const p = m.D.products.find((x) => x.onHand >= 3)!;
    const before = p.onHand;
    const mv = { at: '09:30', type: 'damaged', p: p.id, qty: -2, ref: null, by: 'berto', note: 'Dropped' };
    const w = store.mvAdd(mv);
    m.refreshAll();
    expect(m.prod(p.id)!.onHand).toBe(before - 2);
    expect(m.STK.productRows(m.prod(p.id)!)[0].after).toBe(before - 2);
    expect(m.ledger()[0].id).toBe(w.row!.id);
    // the workshop, same write through receiving.js, then the page's own data.js reads it
    const win: Record<string, any> = { localStorage: storeStub(), sessionStorage: storeStub() };
    const loc = { search: '?tenant=a&as=manager&state=live', pathname: '/movements.html', href: 'http://x/' };
    win.Shell = { esc: (x: unknown) => x, ic: () => '', LMARK: '', toast: () => {} };
    const run = (src: string) => new Function('window', 'location', 'URLSearchParams', 'localStorage', 'sessionStorage', 'document', 'const RCV = window.RCV, STK = window.STK;\n' + src)(win, loc, URLSearchParams, win.localStorage, win.sessionStorage, {});
    run(read('receiving.js'));
    win.RCV.mvAdd(mv);
    run(read('receiving.js'));
    run(read('data.js'));
    const wp = win.DATA.products.find((x: { id: string }) => x.id === p.id);
    expect(wp.onHand).toBe(m.prod(p.id)!.onHand);
    expect(j(win.DATA.movements[0])).toEqual(j(m.D.movements[0]));
    w.undo();
    m.refreshAll();
    expect(m.prod(p.id)!.onHand).toBe(before);
    const base = createMovementsModel('a', 'manager', 'live');
    // a draft transfer sent from here: stock out
    const sent = store.trSet('TR-0032', { status: 'transit', sentAt: 'Thu 22 Oct 9:30', sentHM: '09:30', sentBy: 'berto' }, 'sent')!;
    m.refreshAll();
    expect(m.prod('p16')!.onHand).toBe(base.prod('p16')!.onHand - 1);
    sent.undo();
    // a transfer into here received with a short count: stock in
    store.trSet('TR-0030', { status: 'received', receivedAt: 'Thu 22 Oct 9:40', recvHM: '09:40', receivedBy: 'berto', lines: [{ p: 'p05', qty: 6, got: 5 }, { p: 'p15', qty: 2, got: 2 }] }, 'received');
    m.refreshAll();
    expect(m.prod('p05')!.onHand).toBe(base.prod('p05')!.onHand + 5);
    expect(m.D.movements.find((r) => r.id === 'TR-0030-p05-in')!.note).toBe('From Marikina branch, 1 short');
  });
});
