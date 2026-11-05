import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createHomeModel, homeData, type HomeRole, type HomeState, type HomeTenant } from './InventoryHome.data';

/* RDY-421. The adapter must behave like home.js lines 1-130: the workshop file is run with a stubbed window and compared with the adapter. */
const FINAL = process.env.READYPH_WORKSHOP_FINAL || '/Users/earvingemenez/Projects/readyph/workshop/prototypes/inventory-home/round-1/final';
const HAS_WORKSHOP = existsSync(resolve(FINAL, 'home.js'));
function workshop(tenant: HomeTenant, role: HomeRole, state: HomeState, search: string) {
  const data = readFileSync(resolve(FINAL, 'data.js'), 'utf8');
  const lines = readFileSync(resolve(FINAL, 'home.js'), 'utf8').split('\n');
  const win: Record<string, unknown> = {};
  const loc = { search: `?tenant=${tenant}&as=${role}&state=${state}${search}`, pathname: '/home.html' };
  new Function('window', 'location', data)(win, loc);
  const head = lines.slice(6, 130).join('\n').replace('const D = window.DATA, Sh = window.Shell, { esc, ic, LMARK, LTILE } = Sh;', 'const D = window.DATA, esc = (x) => x;')
    .replace(/const \$ = [^\n]*\n/, '').replace(/const logoHTML[^\n]*\n/, '').replace(/const avi = [^\n]*\n/, '').replace(/const ref = [^\n]*\n/, '');
  const tail = lines.slice(130, 166).join('\n').match(/const WDATE[^\n]*\n\s*const WW[^\n]*/)?.[0] ?? '';
  const body = `${head}\n${tail}\nreturn { S, decisions, openDecs, poErr, coming, deliveries, openCount, todayMoves, runParts, runPid, jobPid, todayPid, runway, weekModel, arrival, WW };`;
  return new Function('window', 'location', 'URLSearchParams', body)(win, loc, URLSearchParams);
}
const j = (v: unknown) => JSON.parse(JSON.stringify(v));
const combos: [HomeTenant, HomeRole, HomeState, string][] = [
  ['a', 'manager', 'live', ''], ['a', 'manager', 'live', '&view=week'], ['a', 'clerk', 'live', ''], ['a', 'owner', 'live', ''], ['a', 'manager', 'quiet', ''],
  ['a', 'manager', 'error', ''], ['a', 'manager', 'empty', ''], ['a', 'manager', 'degraded', ''], ['a', 'manager', 'loading', ''], ['a', 'clerk', 'quiet', ''],
  ['b', 'manager', 'live', ''], ['b', 'manager', 'live', '&view=week'], ['b', 'owner', 'live', ''], ['b', 'clerk', 'live', ''],
];
describe('Inventory Home data adapter', () => {
  it.skipIf(!HAS_WORKSHOP).each(combos)('%s %s %s %s matches home.js', (t, r, s, search) => {
    const w = workshop(t, r, s, search);
    const m = createHomeModel(homeData(t, r, s), { view: /week/.test(search) ? 'week' : null });
    expect(j(m.decisions())).toEqual(j(w.decisions()));
    expect(m.openCount()).toBe(w.openCount());
    expect(j(m.coming())).toEqual(j(w.coming()));
    expect(j(m.deliveries())).toEqual(j(w.deliveries()));
    expect(j(m.todayMoves())).toEqual(j(w.todayMoves()));
    expect(j(m.runParts())).toEqual(j(w.runParts()));
    expect([m.runPid(), m.jobPid(), m.todayPid(), m.poErr]).toEqual([w.runPid(), w.jobPid(), w.todayPid(), w.poErr]);
    expect(j(m.WW)).toEqual(j(w.WW));
    const pids = [...new Set([...m.runParts().map((x) => x.id), ...m.D.products.slice(0, 4).map((p) => p.id)])];
    for (const pid of pids.filter((id) => m.prod(id))) {
      for (const withPO of [false, true]) expect(j(m.runway(pid, withPO))).toEqual(j(w.runway(pid, withPO)));
      expect(j(m.weekModel(pid))).toEqual(j(w.weekModel(pid)));
    }
    m.D.pos.forEach((po) => expect(j(m.arrival(po))).toEqual(j(w.arrival(po))));
  });
  it('is the fixed Thursday clock', () => {
    const m = createHomeModel(homeData('a'));
    expect([m.D.now.short, m.D.now.time, m.NOW, m.TODAY_N]).toEqual(['Thu 22 Oct', '9:12 AM', 552, 22]);
  });
});
