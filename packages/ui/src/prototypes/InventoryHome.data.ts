/* RDY-421. Data adapter for the Inventory Home page (Prototypes/Inventory/Home), page-local, prototype only, not exported from the package.
   Transcribed from workshop/prototypes/inventory-home/round-1/final/home.js lines 1-130 (helpers, page state S, derived decisions/deliveries/coming/
   openCount/todayMoves, arrival, runway 69-89, weekModel 90-120, rateParts/runParts/runPid/jobPid/todayPid 121-130) plus WDATE/WW (home.js 165-166,
   read by weekModel line 108). The dataset is the shared DATA of data.js (see InventoryHome.dump.ts), selected by tenant, role and state.
   Not transcribed here (markup, later slices): esc/ic/LMARK/LTILE, logoHTML, ref, avi (home.js 38-42), $/$$ DOM helpers, Sh.* shell calls. */
import { HOME_DUMP } from './InventoryHome.dump';

export type HomeTenant = 'a' | 'b';
export type HomeRole = 'manager' | 'clerk' | 'owner';
export type HomeState = 'live' | 'quiet' | 'loading' | 'error' | 'empty' | 'degraded';

export interface HomeProduct { id: string; name: string; unit: string; onHand: number; reorder: number; usePerDay?: number; [k: string]: unknown }
export interface HomePoLine { p: string; ordered: number; received: number; [k: string]: unknown }
export interface HomePo { no: string; supplier: string; status: string; expected: string; lines: HomePoLine[]; [k: string]: unknown }
export interface HomeJob { jo: string; at: string; needs: { p: string; qty: number }[]; [k: string]: unknown }
export interface HomeMove { p: string; day: string; at: string; qty: number; ref?: string | null; [k: string]: unknown }
export interface HomeNeed { id: string; type: string; kind: string; action?: { ref?: string; [k: string]: unknown }; [k: string]: unknown }
export interface HomeDecision { id: string; kind: string; due?: { at?: string; [k: string]: unknown }; action?: { ref?: string; [k: string]: unknown }; [k: string]: unknown }
export interface HomeSupplier { id: string; name?: string; sameDayArrival?: string; cutoff?: unknown; [k: string]: unknown }
export interface HomeData {
  now: { date: string; short: string; time: string; hm: string; lastLoaded: string; [k: string]: unknown };
  state: string;
  flags: { quiet?: boolean; loading?: boolean; empty?: boolean; error?: { what: string; lastLoaded: string }; degraded?: { what: string; note: string; since: string } };
  role: string; roleLabel: string; can: string[];
  viewer: { id: string; short: string; [k: string]: unknown };
  manager: { id: string; short: string; [k: string]: unknown };
  business: { key: string; platform: string; logo: string; hours: { open: string; close: string; label?: string }; [k: string]: unknown };
  people: { id: string; initials: string; [k: string]: unknown }[];
  locations: { id: string; [k: string]: unknown }[];
  categories: unknown[];
  suppliers: HomeSupplier[];
  branches: { id: string; name: string }[];
  products: HomeProduct[];
  jobs: HomeJob[];
  link: unknown;
  lowStock: HomeProduct[]; outOfStock: HomeProduct[];
  pos: HomePo[];
  movements: HomeMove[];
  net: { in: number; out: number; net: number };
  needs: HomeNeed[]; decisions: HomeDecision[]; watching: HomeNeed[];
  facts: { value: number | string; label: string }[];
  valueLabel: string | null;
  ledaActions: { id: string; allowed: boolean; [k: string]: unknown }[];
  ask: { kind?: string; allowed: boolean; [k: string]: unknown }[];
  headline: string;
  peso: (n: number) => string;
  [k: string]: unknown;
}

/* What window.ORD / window.RCV add in the prototype (orders.js, receiving.js). Absent = nothing sent, accepted or disputed yet (the seeded state). */
export interface HomeExternals {
  ord?: { sentOf(no: string): { sentAt: string } | null; isSent(no: string): boolean; sentPOs(): HomePo[] };
  rcv?: { accOf(no: string): unknown; dspOf(no: string): unknown; plural(n: number, one: string, many?: string): string };
}

/* data.js 14: peso */
const peso = (n: number) => '₱' + Math.round(n).toLocaleString('en-PH');

/* DATA for a tenant, viewer and state: the stored base, then the viewer's differences, then the state's, then the stored fixes (see the dump header). */
export function homeData(tenant: HomeTenant, role: HomeRole = 'manager', state: HomeState = 'live'): HomeData {
  const t = HOME_DUMP[tenant];
  return { ...t.base, ...(t.role[role] || {}), ...(t.st[state] || {}), ...(t.fix[`${role}/${state}`] || {}), peso } as HomeData;
}

export interface HomeParams { view?: string | null; runway?: string | null }
export interface HomeS { view: 'today' | 'week'; open: string | null; done: Record<string, { choice: string | null; at: string; fromList?: boolean; fromPO?: boolean } | undefined>; choice: Record<string, unknown>; runway: string | null; yopen: boolean; watch: boolean; vtAll: boolean; earlier: boolean; cur: number; retried: boolean }
export interface RunwayPoint { t: number; v: number; kind: string; ref?: string | null; d?: number; short?: boolean }

/* home.js 1-130 */
export function createHomeModel(D: HomeData, params: HomeParams = {}, ext: HomeExternals = {}) {
  const F = D.flags || {};
  const can = (p: string) => D.can.includes(p);
  const num = (n: number) => Number(n).toLocaleString('en-PH');
  const toMin = (s: unknown): number | null => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim()); return m ? +m[1] * 60 + +m[2] : null; };
  const hm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const plr = (n: number, one: string, many?: string) => (ext.rcv ? ext.rcv.plural(n, one, many) : `${n} ${n === 1 ? one : many || one + 's'}`);
  /* when a receipt was made, in the words of today: "today 09:12" for a receipt made now, "yesterday 17:12" for the one from the day before */
  const rcvDay = (at: string) => { const m = /^\w+ (\d+) \w+ /.exec(at || ''), t = /(\d+)/.exec(D.now.short || ''); return m && t && +m[1] === +t[1] ? 'today' : 'yesterday'; };
  const atWord = (at: string) => String(at || '').replace(/^\w+ \d+ \w+ /, rcvDay(at) + ' ');
  const NOW = toMin(D.now.hm) as number, OPEN = toMin(D.business.hours.open) as number, CLOSE = toMin(D.business.hours.close) as number;
  const left = (m: number) => { const d = m - NOW; if (d <= 0) return null; const h = Math.floor(d / 60), mm = d % 60; return h ? `${h} h${mm ? ` ${mm} min` : ''}` : `${mm} min`; };
  const prod = (id: string) => D.products.find((p) => p.id === id);
  const person = (id: string) => D.people.find((p) => p.id === id);
  const sup = (id: string): HomeSupplier => D.suppliers.find((s) => s.id === id) || ({} as HomeSupplier);
  const loc = (id: string) => (D.locations || []).find((l) => l.id === id);
  const branch = (id: string) => (D.branches.find((b) => b.id === id) || { name: '' }).name || '';
  const isA = D.business.key === 'a';
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const TODAY_N = +(/\d+/.exec(D.now.short) || [22])[0];
  const sundayClosed = /Mon-Sat/.test(D.business.hours.label || '');
  const hues = [205, 150, 35, 180, 95, 15];
  const isId = (r: string) => /^[A-Z]{2,}-\d+/.test(r || '');
  /* home.js 40-42: the hue of a person's avatar (the markup around it is a later slice) */
  const hueOf = (id: string) => hues[Math.max(0, D.people.findIndex((p) => p.id === id)) % hues.length];

  /* ---------------- page state ---------------- */
  const S: HomeS = { view: params.view === 'week' ? 'week' : 'today', open: null, done: {}, choice: {}, runway: params.runway || null, yopen: false, watch: false, vtAll: false, earlier: false, cur: -1, retried: false };
  const isDone = (id: string) => !!S.done[id];
  const mgr = () => 'your manager', Mgr = () => 'Your manager';
  // a list marked sent on Purchase orders is a sent PO: its decision here is done
  ((D.needs || []) as HomeNeed[]).forEach((n) => { const so = n.kind === 'reorder' && n.action && ext.ord && ext.ord.sentOf(n.action.ref as string); if (so) S.done[n.id] = { choice: null, at: so.sentAt, fromList: true }; });
  // a short delivery accepted or disputed on its purchase order: its decision here is done
  ((D.needs || []) as HomeNeed[]).forEach((n) => { if (n.kind === 'variance' && n.action && ext.rcv && (ext.rcv.accOf(n.action.ref as string) || ext.rcv.dspOf(n.action.ref as string))) S.done[n.id] = { choice: ext.rcv.accOf(n.action.ref as string) ? 'accept' : 'dispute', at: D.now.time, fromPO: true }; });
  const needsById = (id: string) => D.needs.find((n) => n.id === id);

  /* ---------------- derived from DATA plus what was confirmed here ---------------- */
  const decisions = () => D.decisions.slice().sort((a, b) => (toMin(a.due && a.due.at) ?? 9999) - (toMin(b.due && b.due.at) ?? 9999));
  const openDecs = () => decisions().filter((d) => !isDone(d.id));
  const poErr = !!(F.error && F.error.what === 'purchase orders') && !S.retried;
  const poConfirmed = (no: string) => D.decisions.some((d) => d.action && d.action.ref === no && d.kind === 'reorder' && isDone(d.id));
  const poStatus = (po: HomePo) => (po.status === 'DRAFT' && (poConfirmed(po.no) || F.quiet) ? 'ORDERED' : po.status);
  const dayOf = (s: string) => { const m = /(\d{1,2}) Oct/.exec(s || ''); return m ? +m[1] - TODAY_N : null; };
  // when a PO lands: today at a time (supplier's same-day arrival, or "by HH:MM"), or a later day
  function arrival(po: HomePo): { day: number; t: number | null } | null {
    const s = sup(po.supplier), d = dayOf(po.expected);
    if (d == null) return null;
    let t: number | null = null;
    if (d === 0) t = toMin(s.sameDayArrival) ?? toMin((/by (\d{1,2}:\d{2})/.exec(po.expected) || [])[1]);
    if (d > 0) t = toMin((/,\s*(\d{1,2}:\d{2})/.exec(po.expected) || [])[1]);
    return { day: d, t };
  }
  const coming = () => D.pos.filter((p) => ['DRAFT', 'ORDERED', 'PARTIAL'].includes(p.status));
  // Deliveries are orders that have been sent. A draft order list is not a delivery (it lives on Purchase orders and in To do); once marked sent it becomes one.
  const deliveries = () => D.pos.map((po) => (po.status === 'DRAFT' && ext.ord && ext.ord.isSent(po.no) ? (ext.ord.sentPOs().find((x) => x.no === po.no) as HomePo) : po)).filter((po) => po.status !== 'DRAFT' || poStatus(po) === 'ORDERED').concat(ext.ord ? ext.ord.sentPOs().filter((x) => !D.pos.some((p) => p.no === x.no)) : []);
  const openCount = () => D.pos.filter((p) => ['ORDERED', 'PARTIAL'].includes(poStatus(p))).length;
  const todayMoves = () => D.movements.filter((m) => m.day === 'today');

  /* the stock runway: on hand through today, from the start of the day, today's movements, booked jobs and a delivery */
  function runway(pid: string, withPO?: boolean) {
    const p = prod(pid); if (!p) return null;
    const past = todayMoves().filter((m) => m.p === pid).sort((a, b) => (toMin(a.at) as number) - (toMin(b.at) as number));
    let v = p.onHand - past.reduce((s, m) => s + m.qty, 0);
    const pts: RunwayPoint[] = [{ t: OPEN, v, kind: 'start' }];
    past.forEach((m) => { v += m.qty; pts.push({ t: toMin(m.at) as number, v, kind: 'moved', ref: m.ref }); });
    const evs: { t: number; d: number; kind: string; ref: string; job?: HomeJob }[] = D.jobs.filter((j) => (toMin(j.at) as number) >= NOW && j.needs.some((n) => n.p === pid)).map((j) => ({ t: toMin(j.at) as number, d: -(j.needs.find((n) => n.p === pid) as { qty: number }).qty, kind: 'job', ref: j.jo, job: j }));
    const dpo = coming().find((po) => po.lines.some((l) => l.p === pid && l.received < l.ordered) && (arrival(po) || ({} as { day?: number })).day === 0 && (arrival(po) || ({} as { t?: number | null })).t != null);
    if (dpo && withPO) { const l = dpo.lines.find((x) => x.p === pid) as HomePoLine; evs.push({ t: (arrival(dpo) as { t: number }).t, d: l.ordered - l.received, kind: 'del', ref: dpo.no }); }
    evs.sort((a, b) => a.t - b.t || (a.kind === 'del' ? -1 : 1));
    evs.forEach((e) => { v += e.d; pts.push({ t: e.t, v, kind: e.kind, ref: e.ref, d: e.d, short: e.kind === 'job' && v < 0 }); });
    const r: { p: HomeProduct; pts: RunwayPoint[]; end: number; po: HomePo | null; short: RunwayPoint[]; rate?: number; vNow?: number; tz?: number | null; later?: HomePo | null } = { p, pts, end: v, po: dpo || null, short: pts.filter((x) => x.short) };
    // a part with no booked jobs but a use rate: on hand falls in a straight line from Now and stops at 0 (out)
    if (p.usePerDay && !evs.some((e) => e.kind === 'job')) {
      const rpm = p.usePerDay / (CLOSE - OPEN), tz = NOW + v / rpm;
      Object.assign(r, { rate: rpm, vNow: v, tz: tz < CLOSE ? Math.round(tz / 6) * 6 : null, end: Math.max(0, Math.round(v - rpm * (CLOSE - NOW))), short: [] });
      r.later = coming().find((po) => po.lines.some((l) => l.p === pid && l.received < l.ordered) && ((arrival(po) || ({} as { day?: number })).day as number) > 0) || null;
    }
    return r;
  }
  // week: 7 day columns from today, a closed day squeezed to a narrow band (home.js 165-166)
  const WDATE = Array.from({ length: 7 }, (_, k) => new Date(2026, 9, TODAY_N + k));
  const WW = WDATE.map((d) => (sundayClosed && d.getDay() === 0 ? 0.45 : 1));
  /* the week for one part: today's projection, then each later day's firm deliveries and its use rate (drafts are named, not counted) */
  function weekModel(pid: string) {
    const p = prod(pid) as HomeProduct, r = runway(pid, runConfirmed(pid)) as NonNullable<ReturnType<typeof runway>>, rpm = p.usePerDay ? p.usePerDay / (CLOSE - OPEN) : 0;
    type WP = { k: number; t: number; v: number };
    type WD = { no: string; t: number; q: number; draft: boolean; cutoff: unknown; k?: number; v?: number };
    const P: WP[] = [], dels: WD[] = [], outs: { k: number; t: number }[] = [], ends: { k: number; v: number }[] = [], bands: { k0: number; t0: number; k1: number; t1: number }[] = []; let band: { k0: number; t0: number } | null = null;
    const at = (k: number, t: number, v: number) => P.push({ k, t, v });
    const open = (k: number, t: number) => { if (!band) { band = { k0: k, t0: t }; outs.push({ k, t }); } };
    const shut = (k: number, t: number) => { if (band) { bands.push({ ...(band as { k0: number; t0: number }), k1: k, t1: t }); band = null; } };
    let v = r.rate ? (r.vNow as number) : (r.pts.filter((x) => x.t <= NOW).pop() as RunwayPoint).v;
    at(0, NOW, v);
    const run = (k: number, t0: number, t1: number) => {
      if (!rpm) { at(k, t1, v); return; }
      const v1 = v - rpm * (t1 - t0);
      if (v1 > 0) { v = v1; at(k, t1, v); return; }
      const tc = v > 0 ? t0 + v / rpm : t0; if (v > 0) at(k, tc, 0); v = 0; open(k, tc); at(k, t1, 0);
    };
    if (r.rate) run(0, NOW, CLOSE);
    else { r.pts.filter((x) => x.t > NOW).forEach((x) => { at(0, x.t, v); v = x.v; at(0, x.t, v); if (v < 0) open(0, x.t); else shut(0, x.t); }); at(0, CLOSE, v); }
    ends.push({ k: 0, v });
    for (let k = 1; k < 7; k++) {
      if (WW[k] < 1) { at(k, CLOSE, v); continue; }
      at(k, OPEN, v);
      const ds: WD[] = coming().map((po) => ({ po, a: arrival(po) })).filter((x) => x.a && x.a.day === k)
        .map((x) => ({ no: x.po.no, t: (x.a as { t: number | null }).t ?? OPEN, q: x.po.lines.filter((l) => l.p === pid).reduce((m, l) => m + l.ordered - l.received, 0), draft: poStatus(x.po) === 'DRAFT', cutoff: sup(x.po.supplier).cutoff }))
        .filter((d) => d.q > 0).sort((a, b) => a.t - b.t);
      let t0 = OPEN;
      ds.forEach((d) => { if (d.draft) { dels.push({ ...d, k, v }); return; } run(k, t0, d.t); t0 = d.t; v += d.q; at(k, d.t, v); dels.push({ ...d, k, v }); if (v > 0) shut(k, d.t); });
      run(k, t0, CLOSE);
      ends.push({ k, v });
    }
    shut(6, CLOSE);
    return { p, r, P, dels, outs, ends, bands, end: v };
  }
  // the runway's picker. Today: parts that booked jobs read, most jobs first (parts with a use rate when no jobs).
  // This week: the part that runs low on its use rate first, then the job parts.
  type RunPart = { id: string; rate?: number; jobs?: number };
  const rateParts = (): RunPart[] => D.products.filter((p) => p.usePerDay && p.onHand <= p.reorder).map((p) => ({ id: p.id, rate: p.usePerDay }));
  const runParts = (): RunPart[] => { const c: Record<string, number> = {}; D.jobs.forEach((j) => j.needs.forEach((n) => { if ((toMin(j.at) as number) >= NOW) c[n.p] = (c[n.p] || 0) + 1; })); const jp: RunPart[] = Object.keys(c).sort((a, b) => c[b] - c[a]).map((id) => ({ id, jobs: c[id] })); return S.view === 'week' ? rateParts().concat(jp).slice(0, 2) : jp.length ? jp : rateParts(); };
  const runPid = () => { const ps = runParts(); if (!ps.length) return null; return ps.some((x) => x.id === S.runway) ? S.runway : ps[0].id; };
  const jobPid = () => { const ps = runParts().filter((x) => x.jobs); return ps.some((x) => x.id === S.runway) ? S.runway : ps.length ? ps[0].id : null; };
  const todayPid = () => { const v = S.view; S.view = 'today'; try { return runPid(); } finally { S.view = v; } };
  const viaPO = (pid: string) => { const r = runway(pid, true); return r && r.po ? r.po : null; };
  const runConfirmed = (pid: string) => { const po = viaPO(pid); return !!po && poStatus(po) !== 'DRAFT'; };

  return {
    D, S, F, can, peso: D.peso, num, toMin, hm, plr, rcvDay, atWord, NOW, OPEN, CLOSE, left, prod, person, sup, loc, branch, isA, DAYS, TODAY_N, sundayClosed, hues, hueOf, isId,
    isDone, mgr, Mgr, needsById, decisions, openDecs, poErr, poConfirmed, poStatus, dayOf, arrival, coming, deliveries, openCount, todayMoves,
    runway, WDATE, WW, weekModel, rateParts, runParts, runPid, jobPid, todayPid, viaPO, runConfirmed,
  };
}
export type HomeModel = ReturnType<typeof createHomeModel>;
