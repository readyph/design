/* RDY-422. Inventory Home 2/5 (b): the timeline panel (lanes + runway), composed from I6 DayTimeline and I5 StockRunway. Prototype only, not exported from the package.
   Transcribed from workshop/prototypes/inventory-home/round-1/final/home.js: XT/XW/XWd/dayLabel 161-171, laneDecide 176-197, doneLabel 198, laneOut 198-235 (sic: 201-235),
   laneIn 237-270, laneExp 272-290, shortName 293, laneRun 294-300, stripHTML 302-318 (lane order, Now, week axis, closed day), legend 318, drawRun 367-415, drawWeek 416-436,
   weekAria 437, ariaRun 447; the panel header from home.js 630 (title, subtitle) and the skeleton stripSkel 638. The receipt rule (amt, mixed, unitWords, unitOf) is receiving.js 77-84.
   The chip tooltip (shell.js popover) is the native title, as in I6. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import { Alarm, ArrowSquareOut, Check, CheckCircle, ChartLineDown, Timer, Truck, Warning, WarningCircle } from '@phosphor-icons/react';
import { ChipId, ChipSub, ChipTime, ChipWord, DayTimeline, type DayTimelineChip, type DayTimelineLane, type DayTimelineMark } from '../components/DayTimeline';
import { StockRunway } from '../components/StockRunway';
import { SegmentedControl } from '../components/SegmentedControl';
import { createHomeModel, homeData, type HomeModel, type HomeRole, type HomeState, type HomeTenant } from './InventoryHome.data';

const noop = () => {};

/* receiving.js 77-84 */
const unitOf = (l: any, M: HomeModel) => (l.product || M.D.products.find((x) => x.id === l.p) || { unit: '' }).unit;
const mixed = (ls: any[], M: HomeModel) => new Set(ls.map((l) => unitOf(l, M))).size > 1;
const unitWords = (ls: any[], get: (l: any) => number, M: HomeModel) => {
  const g = new Map<string, number>();
  ls.forEach((l) => { const u = unitOf(l, M); g.set(u, (g.get(u) || 0) + get(l)); });
  const parts = [...g].map(([u, n]) => `${n.toLocaleString('en-PH')} ${u === 'pc' ? 'pc' : n === 1 ? u : u + 's'}`);
  return parts.length < 3 ? parts.join(' and ') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
};
const amt = (ls: any[], get: (l: any) => number, M: HomeModel) => (mixed(ls, M) ? unitWords(ls, get, M) : String(ls.reduce((s, l) => s + get(l), 0)));

export interface HomeTimelineOptions { pid?: string | null; only?: string[]; caseP?: string; po?: any }

/* home.js 293 */
const shortName = (p: any) => { const w = p.name.split(' ').filter((x: string) => x !== p.sku && !(/\d/.test(x) && /[A-Z]/.test(x))); const s = (w.length > 2 ? w.slice(1) : w).join(' '); return s.charAt(0).toUpperCase() + s.slice(1); };

export function homeTimelineProps(M: HomeModel, pickRunway: (id: string) => void, o: HomeTimelineOptions = {}) {
  const { D, S, F, NOW, OPEN, CLOSE, toMin, hm, plr, isA, DAYS, TODAY_N, WDATE, WW, sundayClosed } = M;
  const { prod, branch, sup, loc, runway, runPid, jobPid, runParts, runConfirmed, viaPO, arrival, poStatus, coming, openDecs, isDone, todayMoves, dayOf, weekModel } = M;
  const week = S.view === 'week';

  /* home.js 161-171 */
  const XT = (t: number) => Math.max(0, Math.min(100, ((t - OPEN) / (CLOSE - OPEN)) * 100));
  const WTOT = WW.reduce((a, b) => a + b, 0), WS = WW.map((_, k) => WW.slice(0, k).reduce((a, b) => a + b, 0));
  const XW = (day: number, t: number | null) => Math.max(0, Math.min(100, ((WS[day] + WW[day] * (t == null ? 0.5 : Math.max(0, Math.min(1, (t - OPEN) / (CLOSE - OPEN))))) / WTOT) * 100));
  const XWd = (k: number) => (WS[k] / WTOT) * 100;
  const dayLabel = (k: number) => (k === 0 ? 'today' : `${DAYS[WDATE[k].getDay()]} ${WDATE[k].getDate()}`);
  const nowX = () => (week ? XW(0, NOW) : XT(NOW));
  /* aria-label: the workshop's labels (home.js 187, 203, 245, 281) do not contain the chip's visible text as axe reads it (parts joined without spaces), so they are left out; the title carries the detail. GAP noted in the PR. */
  /* the popover text as the native title: lines, then the action */
  const tip = (lines: (string | false | undefined | null)[], go?: string) => lines.filter(Boolean).join('\n') + (go ? `\nClick to ${go} ›` : '');
  const mgr = () => 'your manager', Mgr = () => 'Your manager';
  const lc1 = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  void lc1;
  const verb = (d: any) => { const r = d.action && d.action.ref; if (d.kind === 'reorder' && r) return 'Review order list'; if (d.kind === 'transfer' && r) return `Review ${r} and send`; if (d.kind === 'variance' && r) return `Settle ${r}`; return d.action.label; };
  /* RCV.flag (receiving.js 124) reads in-session accept/dispute state, absent in the seeded data: '' */
  const flag = (_ref: string) => '';
  const doneLabel = (d: any) => { const c = S.done[d.id] as any; if (d.kind === 'reorder') return `${d.action.ref} sent ${c.at}`; if (d.kind === 'transfer') return `${d.action.ref} sent`; if (d.kind === 'variance') return `${d.action.ref} · ${flag(d.action.ref).toLowerCase() || 'done'}`; return `${d.action.ref || d.title} · ${c.choice || 'done'}`; };
  const doneWord = (_ref: string) => 'Done';

  function laneDecide(): DayTimelineLane {
    const ds = (o.only ? D.decisions.filter((d: any) => o.only!.includes(d.id)) : D.decisions).filter((d: any) => toMin(d.due && d.due.at) != null) as any[];
    const head = { id: 'decide', icon: <Alarm size={18} />, title: 'To do by', sub: D.decisions.length && D.decisions.every((d: any) => !d.canDecide) ? `${Mgr()} decides` : 'deadlines' };
    if (F.empty) return { ...head, note: { text: 'Nothing to do until there is stock.' } };
    if (!ds.length) return { ...head, note: { text: 'No deadlines today.', icon: <CheckCircle size={14} />, tone: 'ok' } };
    if (week) {
      const n = openDecs().length, x = XW(0, 13 * 60);
      return { ...head, marks: [{ id: 'wk', x, chip: { onSelect: noop, tip: tip(["Today's deadlines are in To do"], 'see them'), children: n ? <><ChipTime>{n}</ChipTime><span>to do today</span></> : <><span>all done today</span></>, icon: n ? undefined : <Check size={13} /> } }] };
    }
    const marks: DayTimelineMark[] = ds.map((d) => {
      const t = toMin(d.due.at) as number, done = isDone(d.id), wait = !d.canDecide, urgent = !done && !wait && t - NOW <= 60;
      const tone = done ? 'done' : wait ? 'wait' : urgent ? 'bad' : undefined;
      return {
        id: d.id, x: XT(t), tone,
        chip: {
          onSelect: noop, tip: tip([d.title, d.detail, d.due.why, wait && d.waitingFor], 'open'), 
          icon: done ? <CheckCircle size={13} /> : undefined,
          children: done ? <span>{doneLabel(d)}</span> : <><ChipTime>{hm(t)}</ChipTime><span>{verb(d)}</span>{wait && <ChipSub>· {mgr()}</ChipSub>}</>,
        },
      };
    });
    return { ...head, marks };
  }

  function laneIn(): DayTimelineLane {
    const head = { id: 'in', icon: <Truck size={18} />, title: 'Stock in', sub: 'deliveries' as string };
    if (F.empty) return { ...head, note: { text: 'No suppliers yet.' } };
    if (M.poErr) return { ...head, note: { text: `Couldn't load deliveries. Last loaded ${(F.error as any).lastLoaded}.`, icon: <WarningCircle size={14} />, tone: 'bad' } };
    const marks: DayTimelineMark[] = [], carry: DayTimelineChip[] = [], later: { k: number; c: DayTimelineChip }[] = [];
    // a short delivery from yesterday waits at the Now line
    if (!o.po && !o.caseP && !week) (D.decisions as any[]).filter((d) => d.kind === 'variance' && d.po).forEach((d) => {
      const done = isDone(d.id), n = amt(d.po.lines.filter((l: any) => l.ordered > l.received), (l) => l.ordered - l.received, M);
      carry.push({ id: d.id, tone: done ? 'done' : 'bad', icon: done ? <CheckCircle size={13} /> : <WarningCircle size={13} />, onSelect: noop, tip: tip([`${d.po.no} · ${d.po.supplierName}`, d.detail, `Arrived ${d.po.receivedAt || ''}`], 'settle it'), children: <><ChipId>{d.po.no}</ChipId><ChipWord>{done ? doneWord(d.po.no) : `short ${n}`}</ChipWord></> });
    });
    const list = o.po ? [o.po] : o.caseP ? coming().filter((po: any) => po.lines.some((l: any) => l.p === o.caseP && l.received < l.ordered)) : coming();
    list.forEach((po: any) => {
      const a = arrival(po); if (!a) return;
      const st = poStatus(po), firm = st !== 'DRAFT', lines = po.lines.filter((l: any) => l.received < l.ordered), units = amt(lines, (l) => l.ordered - l.received, M), unitsW = mixed(lines, M) ? units : plr(Number(units), 'unit');
      const tp = tip([`${po.no} · ${po.supplierName}`, firm ? (st === 'PARTIAL' ? `Rest of a partial delivery, ${unitsW}` : `Ordered, ${unitsW}`) : `Not sent yet. Arrives only if sent by ${sup(po.supplier).cutoff || ''}`, lines.map((l: any) => `${l.ordered - l.received} ${l.product.sku}`).join(', ')], 'open');
      const tone = firm ? 'info' : 'draft';
      if (week) {
        marks.push({ id: po.no, x: XW(a.day, a.t ?? OPEN), tone, chip: { onSelect: noop, tip: tp, children: <><ChipId>{po.no}</ChipId><ChipSub>{firm ? (st === 'PARTIAL' ? 'rest' : 'ordered') : 'not sent'} · {mixed(lines, M) ? plr(lines.length, 'line') : units}</ChipSub></> } });
        return;
      }
      if (a.day === 0 && a.t != null) {
        marks.push({ id: po.no, x: XT(a.t), tone, chip: { onSelect: noop, tip: tp, children: <><ChipId>{po.no}</ChipId><span>{firm ? `arriving ${hm(a.t)}` : `if sent, ${hm(a.t)}`}</span></> } });
      } else if (a.day > 0) {
        const d = new Date(2026, 9, TODAY_N + a.day);
        later.push({ k: a.day * 2000 + (a.t || 0), c: { id: po.no, tone, onSelect: noop, tip: tp, children: <><ChipId>{po.no}</ChipId><ChipSub>{firm ? '' : 'not sent · '}{DAYS[d.getDay()]}</ChipSub></> } });
      }
    });
    const lane: DayTimelineLane = { ...head, marks, carry: carry.length ? carry : undefined, later: later.length ? { label: 'Later', chips: later.sort((a, b) => a.k - b.k).map((x) => x.c) } : undefined };
    if (!marks.length && !carry.length && !later.length) lane.note = { text: 'Nothing due in.' };
    lane.sub = !week ? (marks.length ? 'deliveries today' : 'none due today') : 'deliveries';
    return lane;
  }

  const rateNote = (pid?: string) => { const rp: any = prod(pid || runPid() || '') || D.products.find((p) => p.usePerDay); return rp && rp.usePerDay ? `About ${rp.usePerDay} ${rp.unit}${rp.usePerDay === 1 ? '' : 's'} of ${shortName(rp).toLowerCase()} used a day` : 'Nothing booked to go out'; };
  function laneOut(): DayTimelineLane {
    const hasJobs = D.jobs.length > 0;
    const head = { id: 'out', icon: <ArrowSquareOut size={18} />, title: 'Stock out', sub: hasJobs ? 'jobs and transfers' : 'used and corrections' } as DayTimelineLane;
    if (F.empty) return { ...head, note: { text: 'Nothing goes out until there is stock.' } };
    const pid = hasJobs ? o.pid || jobPid() : null, rw = pid ? runway(pid, runConfirmed(pid)) : null;
    const shortRefs = new Set(rw ? rw.short.map((s) => s.ref) : []);
    if (week) {
      if (!hasJobs) return { ...head, note: { text: rateNote(o.pid || undefined) } };
      const n = D.jobs.filter((j: any) => (toMin(j.at) as number) >= NOW).length;
      return { ...head, marks: [{ id: 'wk', x: XW(0, 13 * 60), info: <><b className="tabular-nums">{n}</b> jobs today</> }], note: { text: 'No jobs booked after today yet', leftPct: XW(1, null) - 5 } };
    }
    const lane: DayTimelineLane = { ...head };
    const gone = todayMoves().filter((m: any) => m.qty < 0 && (!o.pid || m.p === o.pid)).sort((a: any, b: any) => (toMin(a.at) as number) - (toMin(b.at) as number)) as any[];
    if (gone.length) {
      const units = gone.length;
      lane.pastOut = { id: 'pastout', count: units, word: 'out', onSelect: noop, tip: tip(['Already out today', ...gone.map((m) => `${m.at} · ${Math.abs(m.qty)} ${m.product.name}${m.type === 'count' ? ' (count)' : ''}`)], 'see Stock moved'), children: null };
    }
    if (!hasJobs) lane.note = { text: rateNote(o.pid || undefined) };
    const marks: DayTimelineMark[] = [];
    (o.pid ? (D.jobs as any[]).filter((j) => j.needs.some((n: any) => n.p === o.pid)) : (D.jobs as any[])).filter((j) => (toMin(j.at) as number) >= NOW).forEach((j) => {
      const sh = shortRefs.has(j.jo), parts = j.needs.map((n: any) => `${n.qty} ${prod(n.p)!.name}`).join(', ');
      marks.push({ id: j.jo, x: XT(toMin(j.at) as number), tone: sh ? 'bad' : undefined, chip: { onSelect: noop, tip: tip([`${j.jo} · ${j.at} · ${branch(j.branch)}`, `${j.car} · ${j.work}`, `Takes ${parts}`, j.promised && `Promised ${j.promised}`, sh && 'Short: no stock left for this job'], 'open the job'), children: <><ChipId>{j.jo}</ChipId>{j.branch !== 'cubao' && <ChipSub>{branch(j.branch)}</ChipSub>}{sh && <ChipWord>short</ChipWord>}</> } });
    });
    (o.only ? (D.decisions as any[]).filter((d) => o.only!.includes(d.id)) : (D.decisions as any[])).filter((d) => d.kind === 'transfer' && d.due && d.due.at).forEach((d) => {
      const done = isDone(d.id), j = (D.jobs as any[]).find((x) => x.jo === d.job), to = j ? branch(j.branch) : '';
      marks.push({ id: d.id, x: XT(toMin(d.due.at) as number), tone: done ? undefined : 'draft', chip: { onSelect: noop, tip: tip([`${d.action.ref} · 1 ${d.product.name} to ${to}`, done ? 'Sent' : 'Leaves only when you send it'], 'open'), children: <><ChipId>{d.action.ref}</ChipId><ChipSub>to {to}</ChipSub></> } });
    });
    lane.marks = marks;
    if (F.degraded) return { ...lane, sub: undefined, warn: <><Warning size={12} />slow since {F.degraded.since}</>, dimmed: true };
    return lane;
  }

  function laneExp(): DayTimelineLane | null {
    const ex = D.products.filter((p: any) => p.expires) as any[];
    if (!ex.length || F.empty) return null;
    const marks: DayTimelineMark[] = [];
    ex.forEach((p) => {
      const d = dayOf(p.expires.on); if (d == null || d < 0) return;
      if (!week && d !== 0) return;
      const dec = (D.decisions as any[]).find((x) => x.kind === 'expiry' && x.p === p.id);
      const t = dec && dec.due && toMin(dec.due.at), x = week ? XW(d, t ?? null) : t != null ? XT(t) : 100;
      marks.push({ id: p.id, x, tone: 'exp', chip: { onSelect: noop, icon: <Timer size={13} />, tip: tip([p.name, `${p.expires.qty} expire ${p.expires.on} · ${(loc(p.loc) as any || {}).name || ''}`, dec && dec.due.label], dec ? 'open' : 'see the product'), children: <><ChipTime>{p.expires.qty}</ChipTime><span>{p.name.replace(/\s*\(.*\)\s*/, '')}</span></> } });
    });
    return { id: 'exp', icon: <Timer size={18} />, title: 'Expiring', sub: week ? 'this week' : 'by close', marks, note: marks.length ? undefined : { text: 'Nothing expires today.' } };
  }

  /* home.js 367-415 / 416-436: the runway, the fix chip and the week */
  const ariaRun = (m: any, alt: any) => `${m.p.name}: ${m.pts.map((p: any) => `${hm(p.t)} ${p.v}`).join(', ')}.${m.short.length ? ` Short for ${m.short.map((x: any) => x.ref).join(' and ')}.` : ''}${alt ? ` With ${alt.po.no}: ${alt.end} by close.` : ''}`;
  const weekAria = (m: any) => `${m.p.name} this week: ${Math.round(m.P[0].v)} now.${m.outs.map((o: any) => ` Out ${o.k ? dayLabel(o.k) : 'today'} about ${hm(Math.round(o.t))}.`).join('')}${m.dels.filter((d: any) => !d.draft).map((d: any) => ` ${d.no} brings ${d.q} ${dayLabel(d.k)}.`).join('')}`;

  function laneRun(): DayTimelineLane | null {
    const pid = o.pid || (o.caseP ? null : runPid()); if (!pid || F.empty) return null;
    const p: any = prod(pid), parts = runParts();
    const pick = !o.pid && parts.length > 1 ? (
      <SegmentedControl
        size="sm" aria-label="Part" className="mt-2 !flex !w-full !flex-col"
        value={pid} onChange={pickRunway}
        options={parts.slice(0, 2).map((x) => ({ value: x.id, label: <span className="flex w-full items-center gap-1.5"><span className="min-w-0 truncate">{shortName(prod(x.id))}</span><span className="ml-auto flex-none tabular-nums @max-[900px]/dt:hidden">{x.jobs ? `${x.jobs} ${x.jobs === 1 ? 'job' : 'jobs'}` : `${x.rate}/day`}</span></span> }))}
      />
    ) : null;
    const jobsFor = (D.jobs as any[]).some((j) => (toMin(j.at) as number) >= NOW && j.needs.some((n: any) => n.p === pid));
    const nm = isA ? `${shortName(p)} ${p.sku}` : shortName(p);
    const sub = <><span className="block truncate" title={p.name}>{nm}</span><span>Reorder at {p.reorder}{p.usePerDay && !jobsFor ? ` · about ${p.usePerDay} a day` : ''}</span></>;
    const hours = { open: OPEN, close: CLOSE };
    if (week) {
      const m: any = weekModel(pid);
      const about = (t: number) => hm(Math.min(CLOSE, Math.round(t / 15) * 15));
      void about;
      const runway = <StockRunway name={p.name} hours={hours} now={NOW} formatTime={hm} aria-label={weekAria(m)} week={{
        days: WDATE.map((_, k) => ({ label: dayLabel(k), width: WW[k] })), points: m.P, deliveries: m.dels.map((d: any) => ({ k: d.k, t: d.t, v: d.v, q: d.q, no: d.no, draft: d.draft })), outs: m.outs, bands: m.bands, end: m.end,
        caption: m.p.usePerDay ? `Projected at about ${m.p.usePerDay} a day, plus ordered deliveries, as of ${D.now.time}` : `Today's booked jobs, then ordered deliveries; no jobs booked after today yet`,
      }} />;
      return { id: 'run', icon: <ChartLineDown size={18} />, title: 'Stock left', sub, headExtra: pick, runway };
    }
    const conf = runConfirmed(pid), main: any = runway(pid, conf), alt: any = !conf && viaPO(pid) ? runway(pid, true) : null;
    const altDel = alt && alt.pts.find((x: any) => x.kind === 'del');
    const bad = main.end < 0 || (main.rate && main.tz != null);
    const endTxt = main.end < 0 ? `${Math.abs(main.end)} short by close` : main.rate && main.tz != null ? 'out by close' : `${main.end} left by close`;
    const fix = (D.decisions as any[]).find((x) => x.p === pid && x.kind === 'reorder');
    const showFix = bad && fix && !isDone(fix.id) && S.open !== fix.id;
    const later = main.rate && main.later ? (() => {
      const a: any = arrival(main.later), firm = poStatus(main.later) !== 'DRAFT', l = main.later.lines.find((x: any) => x.p === pid);
      const dec: any = (D.decisions as any[]).find((x) => x.action && x.action.ref === main.later.no) || { due: {} };
      return `${main.later.no}: +${l.ordered - l.received} ${dayLabel(a.day)}${a.t != null ? ' ' + hm(a.t) : ''}${firm ? '' : `, if sent by ${dec.due.at || (sup(main.later.supplier) as any).cutoff || ''}`}`;
    })() : undefined;
    const endAction = showFix ? (
      <button type="button" title={tip([fix.title, fix.detail], 'open the fix')} className="group/chip inline-flex h-[26px] cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-control border border-control bg-surface pl-2 pr-[5px] text-[12px] leading-4 text-text hover:border-text hover:bg-raised">
        <WarningCircle size={13} aria-hidden="true" />
        <span className="font-semibold text-bad">{endTxt}</span><span>· {fix.canDecide ? 'Fix' : 'See fix'}</span>
      </button>
    ) : undefined;
    const rw = (
      <StockRunway
        variant="lane" confirmed={conf} laterLabel={later} endAction={endAction}
        name={p.name} hours={hours} now={NOW} formatTime={hm} aria-label={ariaRun(main, alt)}
        points={main.pts} rate={main.rate ? { vNow: main.vNow, tz: main.tz, end: main.end } : undefined}
        alt={alt ? { no: altDel.ref, left: altDel.v, at: altDel.t, points: alt.pts } : undefined}
        caption={main.rate ? `Projected at about ${main.p.usePerDay} a day, as of ${D.now.time}` : `Projected from booked jobs, as of ${D.now.time}`}
      />
    );
    return { id: 'run', icon: <ChartLineDown size={18} />, title: 'Stock left', sub, headExtra: pick, runway: rw };
  }

  const lanes = [laneDecide(), laneIn(), laneOut(), o.caseP ? null : laneExp(), laneRun()].filter(Boolean) as DayTimelineLane[];
  const nx = nowX();
  const closedI = week && sundayClosed ? WDATE.findIndex((d) => d.getDay() === 0) : -1;
  const common = {
    hours: { open: OPEN, close: CLOSE }, now: NOW, nowLabel: `Now ${hm(NOW)}`, lanes,
    legend: !!runPid() && !F.empty && !F.loading,
  };
  if (!week) return { ...common, title: "Today's timeline", subtitle: `${D.business.hours.open}-${D.business.hours.close} · as of ${D.now.time}` };
  return {
    ...common, title: 'This week', subtitle: `today and the next 6 days · as of ${D.now.time}`, nowX: nx,
    axisLabels: WDATE.map((d, i) => ({ x: XW(i, null), label: i === 0 ? 'Today' : sundayClosed && d.getDay() === 0 ? `${DAYS[0]}, closed` : `${DAYS[d.getDay()]} ${d.getDate()}` })),
    dayLines: Array.from({ length: 6 }, (_, i) => XWd(i + 1)),
    closedBand: closedI < 0 ? undefined : { x: XWd(closedI), w: (WW[closedI] / WTOT) * 100 },
  };
}

export interface HomeTimelinePanelProps { tenant?: HomeTenant; role?: HomeRole; state?: HomeState; view?: 'today' | 'week'; runway?: string | null }

export function HomeTimelinePanel({ tenant = 'a', role = 'manager', state = 'live', view = 'today', runway = null }: HomeTimelinePanelProps) {
  const [picked, setPicked] = useState<string | null>(runway);
  const M = useMemo(() => createHomeModel(homeData(tenant, role, state), { view, runway: picked }), [tenant, role, state, view, picked]);
  const props = homeTimelineProps(M, setPicked);
  return <DayTimeline {...props} state={M.F.loading ? 'loading' : 'ready'} className="w-full max-w-[1330px]" />;
}
