/* RDY-423. Inventory Home 3/5 (c): the zones (To do, Leda is watching, Deliveries, Needs stock, Stock moved). Prototype only, not exported from the package.
   Transcribed from workshop/prototypes/inventory-home/round-1/final/home.js: panel 156-158, panelSkel 159, pill 132, decFor 134, KIND_IC 139, decRow 450-461, canDoRows 462-471,
   todoHTML 472-483, deliveriesHTML 484-522, lowRows 523-539, lowHTML 540-552, watchRows/watchHTML 553-560, MV_IC/moveRow 561-564, movedHTML 565-577, stepLine 606-612.
   CSS from home.html 75-125 (stack, panel, pnl-*, va, grp, duo, trio, rows, row, alink), 128-137 (state), 140-153 (dec-row), 159-185 (dl/low/mv/yrow/watch rows, empty-l, quiet-l),
   340-342 (container sheet), 360-379 (phone). Buttons use the Button class strings (shell.css 250-257, home.html 92-93). Receipt rule (RCV.rule.words) is receiving.js 70-100. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowSquareOut, ArrowsDownUp, Camera, CaretDown, CaretRight, CaretUp, CheckCircle, ClipboardText, ClockCounterClockwise, Clock, Drop, Eye, FilePlus, HandPointing,
  HourglassMedium, ListNumbers, MagnifyingGlass, Package, Plus, Prohibit, Scales, Timer, TrendDown, Truck, WarningCircle,
} from '@phosphor-icons/react';
import { base as btnBase, variants as btnVariants } from '../components/Button';
import { LedaMark } from '../components/Leda';
import { cn } from '../utils/cn';
import { createHomeModel, homeData, type HomeModel, type HomeRole, type HomeState, type HomeTenant } from './InventoryHome.data';

/* home.js 132 / home.html 128-137: the state word with its dot */
type PillTone = 'neutral' | 'bad' | 'warn' | 'info' | 'ok' | 'accent' | 'dash';
const dotCls: Record<PillTone, string> = {
  neutral: 'bg-faint', bad: 'bg-bad', warn: 'bg-warn', info: 'bg-info', ok: 'bg-ok', accent: 'bg-accent', dash: 'h-1.5 w-1.5 border-[1.5px] border-dashed border-muted bg-transparent',
};
export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: PillTone }) {
  return (
    <span className={cn('inline-flex h-5 flex-none items-center gap-1.5 whitespace-nowrap p-0 text-[13px] font-medium', tone === 'bad' ? 'text-bad' : tone === 'dash' ? 'text-muted' : 'text-text')}>
      <span aria-hidden="true" className={cn('h-[7px] w-[7px] flex-none rounded-full', dotCls[tone])} />
      {children}
    </span>
  );
}

/* home.html 107-119 */
const rowCls = 'group/row relative grid w-[calc(100%+16px)] -mx-2 cursor-pointer items-center gap-x-3 border-t border-rule bg-transparent px-2 py-3 text-left text-text hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-[3px] focus-visible:outline-accent max-[640px]:mx-0 max-[640px]:w-full max-[640px]:px-0';
const rowStatic = rowCls.replace('cursor-pointer', '').replace('hover:bg-raised', '');
const t1Cls = 'block min-w-0 truncate text-[14px] font-medium leading-5';
const t2Cls = 'mt-[3px] block min-w-0 truncate text-[13px] leading-[18px] text-muted';
const riCls = 'mt-px self-start text-[18px] text-muted';
const idCls = 'font-mono text-[12px] tabular-nums';
const rvCls = 'flex flex-col items-end gap-[3px] whitespace-nowrap text-right tabular-nums';
const Rows = ({ children }: { children: ReactNode }) => <div className="flex flex-col [&>:first-child]:border-t-transparent">{children}</div>;
const Grp = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <div className="flex items-center gap-1.5 border-b border-rule pb-2 pt-6 text-[13px] font-semibold text-text first:pt-3 [&>svg]:text-[14px] [&>svg]:text-muted">{icon}{children}</div>
);
/* home.html 121-126: a text span inside a clickable row (a nested ActionLink would be a button inside a button, so the row carries the action) */
const alinkCls = 'inline-flex items-center gap-[3px] whitespace-nowrap text-[13px] leading-[18px]';
const Alink = ({ children, quiet }: { children: ReactNode; quiet?: boolean }) => (
  quiet ? <span className={cn(alinkCls, 'font-normal text-muted')}>{children}</span>
    : <span className={cn(alinkCls, 'font-semibold text-accent group-hover/row:text-lk-hover group-focus-visible/row:text-lk-hover [&>svg]:text-[12px] [&>svg]:transition-transform group-hover/row:[&>svg]:translate-x-0.5')}>{children}<CaretRight aria-hidden="true" /></span>
);
const btn = (v: 'primary' | 'secondary' | 'text', sm?: boolean) => cn(btnBase, btnVariants[v], sm && 'h-7 gap-1.5 px-2.5 text-[12px]');
const Empty = ({ icon, children }: { icon?: ReactNode; children: ReactNode }) => (
  <p className="my-4 flex items-center gap-2.5 rounded-card border border-dashed border-control px-3.5 py-3 text-[13px] text-muted [&>svg]:text-[18px] [&>svg]:text-ok">{icon}{children}</p>
);

/* home.js 156-158 */
function Panel({ id, icon, title, cnt, sub, right, foot, children, className }: { id: string; icon: ReactNode; title: string; cnt?: ReactNode; sub?: ReactNode; right?: ReactNode; foot?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={cn('flex min-w-0 scroll-mt-6 flex-col', className)}>
      <div className="flex min-h-8 items-baseline gap-2.5 border-b border-border pb-2.5">
        <span className="flex-none self-center text-[18px] text-muted">{icon}</span>
        <h2 id={`${id}-h`} className="whitespace-nowrap text-[16px] font-semibold leading-[22px]">{title}</h2>
        {cnt ? <span className="text-[13px] font-medium tabular-nums text-muted">{cnt}</span> : null}
        {sub ? <span className="min-w-0 truncate text-[12px] text-muted max-[640px]:hidden">{sub}</span> : null}
        {right ? <span className="ml-auto flex items-center gap-4 self-center whitespace-nowrap text-[12px] text-muted [&_b]:font-semibold [&_b]:tabular-nums [&_b]:text-text">{right}</span> : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      {foot ? <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-3">{foot}</div> : null}
    </section>
  );
}
/* home.js 159 */
function PanelSkel({ id, icon, title, n, className }: { id: string; icon: ReactNode; title: string; n: number; className?: string }) {
  const w = ['w-[55%]', 'w-[92%]', 'w-[67%]'];
  return (
    <Panel id={id} icon={icon} title={title} sub="Loading…" className={className}>
      <div role="status" aria-label={`Loading ${title}`}>
        <Rows>{Array.from({ length: n }, (_, i) => (
          <div key={i} className={cn(rowStatic, 'min-h-[66px] grid-cols-[1fr_60px]')}>
            <span><span className={cn('my-1.5 block h-3.5 animate-pulse rounded-card bg-skeleton', w[i % 3])} /><span className="block h-2.5 w-[40%] animate-pulse rounded-card bg-skeleton" /></span>
            <span className="my-1.5 ml-auto block h-3.5 w-11 animate-pulse rounded-card bg-skeleton" />
          </div>
        ))}</Rows>
      </div>
    </Panel>
  );
}

/* home.js 139, 561 */
const KIND_IC: Record<string, ReactNode> = { reorder: <Package />, variance: <Scales />, transfer: <ArrowSquareOut />, expiry: <Timer /> };
const MV_IC: Record<string, [ReactNode, string]> = { received: [<Truck key="t" />, 'text-ok'], sold: [<ArrowSquareOut key="s" />, ''], transfer: [<ArrowSquareOut key="x" />, ''], damaged: [<Drop key="d" />, ''], count: [<ListNumbers key="c" />, ''] };
const mvIc = (k: string): [ReactNode, string] => MV_IC[k] || [<ArrowsDownUp key="a" />, ''];
const Ref = ({ r, isId }: { r: string; isId: (s: string) => boolean }) => (isId(r) ? <span className={idCls}>{r}</span> : <>{r}</>);

/* home.js 606-612: the runway shrunk to an inline step line (phone) */
export function StepLine({ M, pid, W = 220, H = 30 }: { M: HomeModel; pid: string; W?: number; H?: number }) {
  const { runway, runConfirmed, NOW, OPEN, CLOSE, hm } = M;
  const r: any = runway(pid, runConfirmed(pid));
  const lo = Math.min(0, ...r.pts.map((p: any) => (p.kind === 'del' ? 0 : p.v))), hi = Math.max(6, ...r.pts.filter((p: any) => p.kind !== 'del').map((p: any) => p.v));
  const XT = (t: number) => Math.max(0, Math.min(100, ((t - OPEN) / (CLOSE - OPEN)) * 100));
  const x = (t: number) => (XT(t) / 100) * W, y = (v: number) => (v > hi ? 1 : H - 3 - ((v - lo) / (hi - lo)) * (H - 6));
  let d = `M0 ${y(r.pts[0].v)}`; r.pts.slice(1).forEach((p: any) => { d += ` H${x(p.t)} V${y(p.v)}`; }); d += ` H${W}`;
  const aria = `${r.p.name}: ${r.pts.map((p: any) => `${hm(p.t)} ${p.v}`).join(', ')}.${r.short.length ? ` Short for ${r.short.map((s: any) => s.ref).join(' and ')}.` : ''}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="overflow-visible">
      <line x1="0" x2={W} y1={y(0)} y2={y(0)} className="stroke-control" />
      <line x1={x(NOW)} x2={x(NOW)} y1="0" y2={H} strokeWidth="1.5" className="stroke-accent" />
      <path d={d} fill="none" strokeWidth="2" className="stroke-accent" />
      {r.end < 0
        ? <text x={W + 6} y={y(r.end) + 4} className="fill-bad text-[12px] font-semibold">−{Math.abs(r.end)}</text>
        : <text x={W + 6} y={y(Math.min(r.end, hi)) + 4} className="fill-text text-[12px] font-medium">{r.end}</text>}
    </svg>
  );
}

/* receiving.js 70-100 (rule.words for a set of lines) */
function ruleWords(M: HomeModel, ls: any[]) {
  const unitOf = (l: any) => (l.product || M.D.products.find((x) => x.id === l.p) || { unit: '' }).unit;
  const nameOf = (l: any) => (l.product || M.D.products.find((x) => x.id === l.p) || { name: '' }).name;
  const mixed = (rs: any[]) => new Set(rs.map(unitOf)).size > 1;
  const unitWords = (rs: any[], get: (l: any) => number) => {
    const g = new Map<string, number>(); rs.forEach((l) => { const u = unitOf(l); g.set(u, (g.get(u) || 0) + get(l)); });
    const parts = [...g].map(([u, n]) => `${n.toLocaleString('en-PH')} ${u === 'pc' ? 'pc' : n === 1 ? u : u + 's'}`);
    return parts.length < 3 ? parts.join(' and ') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  };
  const line = (ordered: number, good: number) => { const g = Math.max(0, Math.round(+good || 0)), o = Math.max(0, Math.round(+ordered || 0)); return { ordered: o, good: g, received: Math.min(g, o), extra: Math.max(g - o, 0), due: Math.max(o - g, 0) }; };
  const rows = ls.map((l) => { const r = line(l.ordered, l.received + (l.extra || 0)); return { p: l.p, product: l.product, ordered: r.ordered, got: r.received }; });
  const ord = rows.reduce((s, r) => s + r.ordered, 0), rec = rows.reduce((s, r) => s + Math.min(r.got, r.ordered), 0), due = ord - rec;
  if (!mixed(rows)) return `${rec} of ${ord} in${due ? `, ${due} still due` : ''}`;
  const full = rows.filter((r) => r.got >= r.ordered), part = rows.filter((r) => r.got < r.ordered), out: string[] = [];
  if (full.length) out.push(`${unitWords(full, (r) => r.ordered)} in`);
  part.forEach((r) => { const g = Math.min(r.got, r.ordered), u = unitWords([{ ...r }], () => r.ordered).replace(/^[\d,]+ /, ''); out.push(g > 0 ? `${g} of ${r.ordered} ${u} in, ${r.ordered - g} still due on ${nameOf(r)}` : `${r.ordered - g} still due on ${nameOf(r)}`); });
  return out.join(', ');
}
const noop = () => {};

export interface HomeZonesProps { tenant?: HomeTenant; role?: HomeRole; state?: HomeState; view?: 'today' | 'week'; /** Phone only: sits between To do and the trio (home.html 362-364 order). */ mid?: ReactNode }

/* home.js 448-577, composed as home.js 633-637: duo (To do, Leda is watching) then trio (Deliveries, Needs stock, Stock moved) */
export function HomeZones({ tenant = 'a', role = 'manager', state = 'live', view = 'today', mid }: HomeZonesProps) {
  const [watchOpen, setWatchOpen] = useState(false);
  const [yOpen, setYOpen] = useState(false);
  const [retried, setRetried] = useState(false);
  const M = useMemo(() => createHomeModel(homeData(tenant, role, state), { view }), [tenant, role, state, view]);
  const { D, F, can, hm, plr, NOW, toMin, left, isDone, isId, isA, arrival, poStatus, coming, decisions, openDecs, deliveries, todayMoves, sup, loc, todayPid, mgr, Mgr, peso, atWord } = M;
  const poErr = M.poErr && !retried;
  const decFor = (r: string) => (D.decisions.find((d: any) => d.action && d.action.ref === r) || ({} as any)).id;
  const doneLabel = (d: any) => { const c = M.S.done[d.id] as any; if (d.kind === 'reorder') return `${d.action.ref} sent ${c.at}`; if (d.kind === 'transfer') return `${d.action.ref} sent`; if (d.kind === 'variance') return `${d.action.ref} · done`; return `${d.action.ref || d.title} · ${c.choice || 'done'}`; };
  const doneWord = (_r: string) => 'Done';
  const verbOf = (d: any) => d.action.label;
  void verbOf;

  /* ---- To do ---- */
  const decRow = (d: any, i: number) => {
    const t = toMin(d.due && d.due.at), done = isDone(d.id), lf = t != null ? left(t) : null, urgent = t != null && t - NOW <= 60;
    const act = done ? <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-ok"><CheckCircle />{doneLabel(d)}</span>
      : d.canDecide ? <span aria-hidden="true" className={cn(btn(i === 0 ? 'primary' : 'secondary'), 'min-w-[150px] [&>svg]:text-[13px]')}>{d.action.label}<CaretRight /></span>
      : <span className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-control bg-raised-2 px-2.5 text-[12px] text-muted"><HourglassMedium />{d.waitingFor}</span>;
    const pid = todayPid(), step = d.p === pid && D.jobs.length && !done ? <span className="mt-2 hidden max-[640px]:block"><StepLine M={M} pid={pid as string} /></span> : null;
    const tm = done ? <span className="text-[13px] font-semibold leading-5 tabular-nums text-muted">Done</span>
      : t != null ? <span className={cn('text-[16px] font-semibold leading-5 tabular-nums', urgent ? 'text-bad' : '')}>{hm(t)}<small className={cn('mt-0.5 block whitespace-nowrap text-[12px] font-medium leading-4', urgent ? 'text-bad' : 'text-muted')}>{lf ? `${lf} left` : 'past due'}</small></span>
      : <span className="text-[13px] font-semibold leading-5 tabular-nums text-bad">Overdue<small className="mt-0.5 block whitespace-nowrap text-[12px] font-medium leading-4 text-muted">since yesterday</small></span>;
    return (
      <button key={d.id} type="button" onClick={noop} aria-label={`${d.title}${d.due ? ', ' + d.due.label : ''}`}
        className={cn(rowCls, 'min-h-[68px] grid-cols-[112px_22px_minmax(0,1fr)_minmax(170px,max-content)] gap-y-0 @max-[760px]/sheet:grid-cols-[112px_minmax(0,1fr)_150px] max-[640px]:grid-cols-[76px_minmax(0,1fr)] max-[640px]:gap-y-2.5')}>
        {tm}
        <span className={cn(riCls, '@max-[760px]/sheet:hidden max-[640px]:hidden [&>svg]:block')}>{d.canDecide ? KIND_IC[d.kind] || <ClipboardText /> : <HourglassMedium />}</span>
        <span className="min-w-0"><span className={cn(t1Cls, done && 'font-normal text-muted')}>{d.title}</span><span className={cn(t2Cls, 'max-[640px]:overflow-visible max-[640px]:whitespace-normal')}>{d.detail}</span>{step}</span>
        <span className="justify-self-end max-[640px]:col-start-2 max-[640px]:justify-self-start max-[640px]:[&_span.min-w-\[150px\]]:h-10">{act}</span>
      </button>
    );
  };
  const canDoRows = () => {
    const uncovered = D.lowStock.concat(D.outOfStock).filter((p) => !coming().some((po) => po.lines.some((l) => l.p === p.id)));
    const next = coming().filter((po) => poStatus(po) !== 'DRAFT').map((po) => ({ po, a: arrival(po) })).filter((x) => x.a).sort((a, b) => (a.a as any).day - (b.a as any).day)[0];
    const ask = D.ask.find((a: any) => a.kind === 'text') as any;
    const rows = [
      can('receive') && { icon: <Truck />, t: 'Receive a delivery', s: next ? `Next: ${next.po.no} from ${(next.po as any).supplierName}, ${next.po.expected.split(' (')[0]}` : 'Nothing is due in', b: 'Receive' },
      can('draft_po') && { icon: <FilePlus />, t: 'Add to the order lists', s: `${uncovered.length} ${uncovered.length === 1 ? 'product needing stock is' : 'products needing stock are'} on no order list or PO`, b: 'Draft lists' },
      can('lookup') && { icon: <MagnifyingGlass />, t: 'Look up a part', s: (ask || {}).q || 'Ask Leda', b: 'Ask Leda' },
    ].filter(Boolean) as { icon: ReactNode; t: string; s: string; b: string }[];
    return (
      <>
        <Grp icon={<HandPointing />}>You can do now</Grp>
        <Rows>{rows.map((r, i) => (
          <button key={r.t} type="button" onClick={noop}
            className={cn(rowCls, 'min-h-16 grid-cols-[22px_minmax(0,1fr)_minmax(170px,max-content)] @max-[760px]/sheet:grid-cols-[minmax(0,1fr)_150px] max-[640px]:grid-cols-[22px_minmax(0,1fr)] max-[640px]:gap-y-2.5')}>
            <span className={cn(riCls, '@max-[760px]/sheet:hidden [&>svg]:block')}>{r.icon}</span>
            <span className="min-w-0"><span className={t1Cls}>{r.t}</span><span className={t2Cls}>{r.s}</span></span>
            <span className="justify-self-end max-[640px]:col-start-2 max-[640px]:justify-self-start"><span aria-hidden="true" className={cn(btn(i === 0 ? 'primary' : 'secondary'), 'min-w-[150px] max-[640px]:h-10')}><LedaMark size={16} decorative />{r.b}</span></span>
          </button>
        ))}</Rows>
      </>
    );
  };
  const todo = () => {
    if (F.loading) return <PanelSkel id="p-todo" icon={<ClipboardText />} title="To do" n={3} className="col-span-2 @max-[1100px]/sheet:col-auto" />;
    const ds = decisions(), mine = ds.filter((d: any) => d.canDecide), n = openDecs().filter((d: any) => d.canDecide).length;
    let body: ReactNode;
    if (!ds.length) body = <Empty icon={<CheckCircle />}>{F.empty ? 'Nothing to do yet. Add your products first.' : 'Nothing needs you right now. Leda tells you here when something does.'}</Empty>;
    else if (!mine.length) body = <>{canDoRows()}<Grp icon={<HourglassMedium />}>Waiting for {mgr()}</Grp><Rows>{ds.map((d: any) => decRow(d, 1))}</Rows></>;
    else body = <Rows>{ds.map((d: any) => decRow(d, openDecs().filter((x: any) => x.canDecide).indexOf(d)))}</Rows>;
    const sub = !mine.length && ds.length ? `${openDecs().length} wait for ${mgr()}` : n ? 'soonest deadline first' : '';
    return <Panel id="p-todo" icon={<ClipboardText />} title="To do" cnt={mine.length ? n || '' : ''} sub={sub} className="col-span-2 @max-[1100px]/sheet:col-auto">{body}</Panel>;
  };

  /* ---- Leda is watching ---- */
  const watchRows = () => (
    <Rows>{D.watching.map((w: any) => (
      <div key={w.id} className={cn(rowStatic, 'min-h-14 grid-cols-[22px_minmax(0,1fr)] items-start py-4')}>
        <span className={riCls}>{({ low: <TrendDown />, out: <Prohibit />, adjust: <Drop /> } as Record<string, ReactNode>)[w.kind] || <Eye />}</span>
        <span className="min-w-0"><span className={t1Cls}>{w.title}</span><span className={cn(t2Cls, 'whitespace-normal')}>{w.detail}</span></span>
      </div>
    ))}</Rows>
  );
  const watch = () => {
    const cls = '@max-[1100px]/sheet:hidden';
    if (F.loading) return <PanelSkel id="p-watch" icon={<Eye />} title="Leda is watching" n={3} className={cls} />;
    if (F.empty || !D.watching.length) return <Panel id="p-watch" icon={<Eye />} title="Leda is watching" className={cls}><p className="my-4 text-[13px] text-muted">Nothing to watch yet. Leda says here what it keeps an eye on.</p></Panel>;
    return <Panel id="p-watch" icon={<Eye />} title="Leda is watching" cnt={D.watching.length} sub="no action yet" className={cls}>{watchRows()}</Panel>;
  };

  /* ---- Deliveries ---- */
  const deliveriesPanel = () => {
    if (F.loading) return <PanelSkel id="p-del" icon={<Truck />} title="Deliveries" n={4} />;
    const foot = can('receive') && !F.empty ? (
      <>
        <button type="button" onClick={noop} className={btn('secondary', true)}><Camera />Snap a delivery note</button>
        <button type="button" onClick={noop} className={btn('secondary', true)}><LedaMark size={14} decorative />Tell Leda what came in</button>
      </>
    ) : null;
    const allL = <a href="#pos" className="inline-flex h-6 items-center gap-1 rounded-[4px] px-1 text-[12px] font-semibold text-accent no-underline [&>svg]:text-[12px]">All orders<CaretRight /></a>;
    if (poErr) {
      return (
        <Panel id="p-del" icon={<Truck />} title="Deliveries" sub="stock in" foot={foot}>
          <div role="alert" className="my-4 flex items-center gap-2.5 rounded-card border border-dashed border-control px-3.5 py-3 text-[13px] text-muted">
            <WarningCircle className="flex-none text-[18px] text-bad" /><span className="min-w-0 flex-1">Couldn&rsquo;t load deliveries. Last loaded {(F.error as any).lastLoaded}.</span>
            <button type="button" onClick={() => setRetried(true)} className={btn('text')}>Retry</button>
          </div>
        </Panel>
      );
    }
    const order = (po: any) => { if (po.varianceState === 'awaiting' && !isDone(decFor(po.no))) return -1; const a = arrival(po); return po.status === 'RECEIVED' ? 1e6 : a ? a.day * 2000 + (a.t || 0) : 50; };
    const list = deliveries().filter((po: any) => po.status !== 'RECEIVED' || po.varianceState === 'awaiting' || po.varianceState === 'disputed').sort((a: any, b: any) => order(a) - order(b));
    if (!list.length) return <Panel id="p-del" icon={<Truck />} title="Deliveries" sub="stock in" foot={foot}><Empty>{F.empty ? 'No orders yet. Deliveries show here once you order from a supplier.' : 'Nothing is on its way.'}</Empty></Panel>;
    const rows = list.slice(0, 4).map((po: any) => {
      const a = arrival(po), st = poStatus(po), d: any = D.decisions.find((x: any) => x.action && x.action.ref === po.no), done = d && isDone(d.id);
      const dl = po.lines.filter((l: any) => l.ordered > l.received);
      const mixedU = new Set(dl.map((l: any) => (l.product || D.products.find((x) => x.id === l.p) || { unit: '' }).unit)).size > 1;
      const amtOf = (ls: any[]) => { const g = new Map<string, number>(); ls.forEach((l) => { const u = (l.product || D.products.find((x) => x.id === l.p) || { unit: '' }).unit; g.set(u, (g.get(u) || 0) + (l.ordered - l.received)); }); const parts = [...g].map(([u, n]) => `${n.toLocaleString('en-PH')} ${u === 'pc' ? 'pc' : n === 1 ? u : u + 's'}`); return parts.length < 3 ? parts.join(' and ') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`; };
      const unitsW = mixedU ? amtOf(dl) : plr(dl.reduce((s: number, l: any) => s + l.ordered - l.received, 0), 'unit');
      const shortAmt = (ls: any[]) => (new Set(ls.map((l: any) => (l.product || D.products.find((x) => x.id === l.p) || { unit: '' }).unit)).size > 1 ? amtOf(ls) : String(ls.reduce((s, l) => s + l.ordered - l.received, 0)));
      let chip: ReactNode, line: string, act: ReactNode;
      if (po.status === 'RECEIVED') {
        const dsp = po.dispute && po.dispute.status === 'open', shortW = shortAmt(po.lines.filter((l: any) => l.ordered > l.received));
        chip = dsp ? <Pill tone="warn">Disputed</Pill> : done || po.varianceState === 'settled' ? <Pill>{doneWord(po.no)}</Pill> : <Pill tone="bad">Short {shortW}</Pill>;
        line = `${can('valuation') ? `${peso(po.shortValue)} missing` : `${shortW} missing`} · ${dsp ? `disputed ${po.dispute.at}` : atWord(po.receivedAt)}`;
        act = dsp ? <Alink>View</Alink> : done ? <Alink quiet>Settled</Alink> : d && !d.canDecide ? <Alink quiet>{Mgr()} settles</Alink> : can('accept_variance') ? <Alink>Settle</Alink> : <Alink quiet>{Mgr()} settles</Alink>;
      } else if (st === 'DRAFT') {
        chip = <Pill tone="dash">Not sent</Pill>;
        line = a && a.day === 0 ? `Arrives ${hm(a.t as number)} if sent by ${(sup(po.supplier) as any).cutoff || ''}` : `${po.expected}`;
        act = d && d.canDecide ? <Alink>Review list</Alink> : <Alink quiet>{Mgr()} sends</Alink>;
      } else if (st === 'PARTIAL') {
        chip = <Pill tone="warn">Part in</Pill>;
        line = `Rest ${po.expected.split(' (')[0]} · ${ruleWords(M, po.lines)}`;
        act = <Alink>View</Alink>;
      } else {
        const today = a && a.day === 0;
        chip = <Pill tone="info">{today ? `Arriving ${a && a.t != null ? hm(a.t) : 'today'}` : `Expected ${po.expected.split(' (')[0].replace(/ Oct$/, '')}`}</Pill>;
        line = `${unitsW} · ordered ${(po.ordered || 'today').replace(/^\w+ /, '')}`;
        act = today && can('receive') ? <Alink>Receive</Alink> : <Alink>View</Alink>;
      }
      return (
        <button key={po.no} type="button" onClick={noop} className={cn(rowCls, 'min-h-[66px] grid-cols-[minmax(0,1fr)_auto] py-4')}>
          <span className="min-w-0"><span className={t1Cls}>{po.supplierName}<span className={cn(idCls, 'ml-1.5 font-normal text-muted')}>{po.no}</span></span>
            <span className={cn(t2Cls, 'flex items-center gap-2 max-[640px]:flex-wrap max-[640px]:gap-y-1 max-[640px]:overflow-visible max-[640px]:whitespace-normal')}>{chip}<span className="min-w-0 truncate max-[640px]:overflow-visible max-[640px]:whitespace-normal">{line}</span></span></span>
          <span className={rvCls}><span className="text-[14px] font-medium tabular-nums">{po.totalLabel}</span>{act}</span>
        </button>
      );
    });
    const nShort = list.filter((po: any) => po.varianceState === 'awaiting' && !isDone(decFor(po.no))).length, nToday = list.filter((po: any) => (arrival(po) || ({} as any)).day === 0 && po.status !== 'RECEIVED').length;
    return <Panel id="p-del" icon={<Truck />} title="Deliveries" cnt={list.length} sub={['stock in', nToday && `${nToday} today`, nShort && `${nShort} short`].filter(Boolean).join(' · ')} foot={foot} right={allL}><Rows>{rows}</Rows></Panel>;
  };

  /* ---- Needs stock ---- */
  const lowPanel = () => {
    if (F.loading) return <PanelSkel id="p-low" icon={<TrendDown />} title="Needs stock" n={4} />;
    const deps = (p: any) => D.jobs.filter((j) => (toMin(j.at) as number) >= NOW && j.needs.some((n) => n.p === p.id)).length;
    const all = D.lowStock.concat(D.outOfStock).sort((a: any, b: any) => deps(b) - deps(a) || a.onHand / a.reorder - b.onHand / b.reorder);
    const rows = all.slice(0, 4).map((p: any) => {
      const n = deps(p), cov = coming().find((po) => po.lines.some((l) => l.p === p.id && l.received < l.ordered));
      const d: any = D.decisions.find((x: any) => x.p === p.id && x.kind === 'reorder'), done = d && isDone(d.id);
      const covS = cov ? poStatus(cov) : null;
      const supShort = (id: string) => String(((sup(id) as any).short || (sup(id) as any).name || id));
      let act: ReactNode;
      if (d && !done && d.canDecide) act = <Alink>Review list</Alink>;
      else if (cov && covS !== 'DRAFT') { const a = arrival(cov); act = <Alink quiet><Truck />{cov.no} {a && a.day === 0 ? 'by ' + hm(a.t as number) : (cov.expected || '').split(' (')[0].replace(/ Oct$/, '')}</Alink>; }
      else if (cov) act = <Alink quiet>On {supShort(cov.supplier)} list, not sent</Alink>;
      else if (can('draft_po')) act = <Alink>Add to order list</Alink>;
      else act = <Alink quiet>No order yet</Alink>;
      return (
        <button key={p.id} type="button" onClick={noop} className={cn(rowCls, 'min-h-[66px] grid-cols-[minmax(0,1fr)_auto] py-4')}>
          <span className="min-w-0"><span className={cn(t1Cls, 'max-[640px]:whitespace-normal')}>{p.name}</span>
            <span className={cn(t2Cls, 'flex items-center gap-2 max-[640px]:flex-wrap max-[640px]:gap-y-1 max-[640px]:overflow-visible max-[640px]:whitespace-normal')}>
              {p.onHand === 0 ? <Pill tone="bad">Out of stock</Pill> : <Pill tone="warn">Low stock</Pill>}
              <span className="min-w-0 truncate max-[640px]:overflow-visible max-[640px]:whitespace-normal">Reorder at {p.reorder}{n ? <> · <b className="font-medium text-text">{n} {n === 1 ? 'job' : 'jobs'} today</b></> : ` · ${(loc(p.loc) as any || {}).name || ''}`}</span>
            </span></span>
          <span className={rvCls}><span className={cn('text-[15px] font-semibold leading-5 tabular-nums', p.onHand === 0 && 'text-bad')}>{p.onHand}<small className="ml-[3px] text-[12px] font-normal text-muted">left</small></span>{act}</span>
        </button>
      );
    });
    const watchIn = watchOpen && D.watching.length ? <div className="hidden @max-[1100px]/sheet:block"><Grp icon={<LedaMark size={14} decorative />}>Leda is watching</Grp>{watchRows()}</div> : null;
    const foot = D.watching.length && !F.empty ? (
      <button type="button" aria-expanded={watchOpen} onClick={() => setWatchOpen(!watchOpen)} className={cn(btn('text', true), 'hidden @max-[1100px]/sheet:inline-flex')}>
        <LedaMark size={14} decorative />Leda is watching {D.watching.length}{watchOpen ? <CaretUp /> : <CaretDown />}
      </button>
    ) : null;
    const body = rows.length ? <Rows>{rows}</Rows> : <Empty icon={F.empty ? undefined : <CheckCircle />}>{F.empty ? 'Add products to see what needs stock.' : 'Everything is above its reorder level.'}</Empty>;
    const sub = [D.lowStock.length && `${D.lowStock.length} low stock`, D.outOfStock.length && `${D.outOfStock.length} out of stock`].filter(Boolean).join(' · ');
    return (
      <Panel id="p-low" icon={<TrendDown />} title="Needs stock" cnt={all.length || ''} sub={sub} foot={foot}
        right={all.length ? <a href="#products" className="inline-flex h-6 items-center gap-1 rounded-[4px] px-1 text-[12px] font-semibold text-accent no-underline [&>svg]:text-[12px]">Open Products<CaretRight /></a> : undefined}>
        {body}{watchIn}
      </Panel>
    );
  };

  /* ---- Stock moved ---- */
  const byOf = (m: any) => (<><span aria-hidden="true" className="mr-1 inline-grid h-[18px] w-[18px] place-items-center rounded-full bg-raised-2 align-[-4px] text-[11px] font-semibold text-muted">{(D.people.find((p) => p.id === m.by) as any)?.initials?.[0] || ''}</span>{m.byName || ''}</>);
  const moveRow = (m: any, i: number) => {
    const q2 = m.qty, t = ({ received: 'Received', sold: isA ? 'Issued' : 'Used', transfer: 'Transfer', damaged: 'Written off', count: 'Count' } as Record<string, string>)[m.type] || m.type, [icn, tone] = mvIc(m.type);
    return (
      <div key={i} className={cn(rowStatic, 'min-h-[60px] grid-cols-[22px_minmax(0,1fr)_48px] py-4')}>
        <span className={cn(riCls, tone)}>{icn}</span>
        <span className="min-w-0"><span className={t1Cls}>{m.product.name}</span>
          <span className={t2Cls}>{m.at} · {m.type === 'count' && m.note ? '' : t}{m.ref ? <> <Ref r={m.ref} isId={isId} /></> : null}{m.note && m.type === 'count' ? m.note : ''} · {byOf(m)}</span></span>
        <span className={cn('self-center text-right text-[15px] font-semibold tabular-nums', q2 > 0 && 'text-ok')}>{q2 > 0 ? '+' : '−'}{Math.abs(q2)}</span>
      </div>
    );
  };
  const movedPanel = () => {
    if (F.loading) return <PanelSkel id="p-moved" icon={<ArrowsDownUp />} title="Stock moved" n={4} className="@max-[1100px]/sheet:col-span-full" />;
    const today = todayMoves(), yest = D.movements.filter((m) => m.day === 'yesterday');
    const groups: Record<string, any[]> = {}; yest.forEach((m: any) => { (groups[m.type] = groups[m.type] || []).push(m); });
    const TY: Record<string, string> = { received: 'Received', sold: isA ? 'Issued to jobs' : 'Used', transfer: 'Transfers', damaged: 'Written off', count: 'Counts' };
    const ys = Object.entries(groups).map(([k, ms]) => {
      const qty = ms.reduce((s, m) => s + m.qty, 0), who = [...new Set(ms.map((m) => m.byName))].join(', '), refs = [...new Set(ms.map((m) => m.ref).filter(Boolean))] as string[], [icn, tone] = mvIc(k);
      return (
        <div key={k} className={cn(rowStatic, 'min-h-[60px] grid-cols-[22px_minmax(0,1fr)_48px] py-4')}>
          <span className={cn(riCls, tone)}>{icn}</span>
          <span className="min-w-0"><span className={cn(t1Cls, 'text-[13px] font-normal')}>{TY[k] || k} · {ms.length} {ms.length === 1 ? 'line' : 'lines'}</span>
            <span className={t2Cls}>{refs.length ? <>{refs.map((r, i) => <span key={r}>{i ? ', ' : ''}<Ref r={r} isId={isId} /></span>)} · </> : null}{who}</span></span>
          <span className={cn('self-center text-right text-[15px] font-semibold tabular-nums', qty > 0 && 'text-ok')}>{qty > 0 ? '+' : '−'}{Math.abs(qty)}</span>
        </div>
      );
    });
    const yIn = yest.filter((m) => m.qty > 0).reduce((s, m) => s + m.qty, 0), yOut = -yest.filter((m) => m.qty < 0).reduce((s, m) => s + m.qty, 0);
    const body = D.movements.length ? (
      <>
        <Rows>
          {today.map(moveRow)}
          {yest.length ? (
            <button type="button" aria-expanded={yOpen} onClick={() => setYOpen(!yOpen)} className={cn(rowCls, 'min-h-14 grid-cols-[22px_minmax(0,1fr)_auto] py-4')}>
              <span className={riCls}><ClockCounterClockwise /></span>
              <span className="min-w-0"><span className={t1Cls}>Yesterday · {yest.length} lines</span><span className={t2Cls}>+{yIn} in · −{yOut} out · {yOpen ? 'by type' : 'show by type'}</span></span>
              <CaretRight aria-hidden="true" className={cn('text-[14px] text-muted transition-transform duration-[120ms]', yOpen && 'rotate-90')} />
            </button>
          ) : null}
          {yest.length && yOpen ? ys : null}
        </Rows>
        {!today.length ? <Empty>Nothing has moved yet today.</Empty> : null}
      </>
    ) : <Empty>{F.empty ? 'No movements yet. Stock in and out shows here as stockers record it.' : 'Nothing has moved since yesterday.'}</Empty>;
    return (
      <Panel id="p-moved" icon={<ArrowsDownUp />} title="Stock moved" sub={`since yesterday ${D.business.hours.open}`} className="@max-[1100px]/sheet:col-span-full"
        right={D.movements.length ? <><span><b className="text-ok">+{D.net.in}</b> in</span><span><b>−{D.net.out}</b> out</span></> : undefined}
        foot={<>
          <button type="button" onClick={noop} className={btn('text', true)}><LedaMark size={14} decorative />Ask Leda what moved today</button>
          <span className="flex-1" />
          <a href="#moves" className="inline-flex h-6 items-center gap-1 rounded-[4px] px-1 text-[12px] font-semibold text-accent no-underline [&>svg]:text-[12px]">All<CaretRight /></a>
        </>}>
        {body}
      </Panel>
    );
  };
  void Plus; void Clock;

  /* home.js 633-637: .stack > .duo, .trio. Container "sheet" carries the 1100/760 queries (home.html 340-342). */
  return (
    <div className="@container/sheet w-full max-w-[1330px]">
      <div className="flex flex-col gap-12 max-[640px]:gap-8">
        <div className="grid grid-cols-3 items-start gap-x-10 gap-y-12 @max-[1100px]/sheet:grid-cols-1 max-[640px]:gap-8">{todo()}{watch()}</div>
        {mid}
        <div className="grid grid-cols-3 items-start gap-x-10 gap-y-12 @max-[1100px]/sheet:grid-cols-2 @max-[760px]/sheet:grid-cols-1 max-[640px]:grid-cols-1 max-[640px]:gap-8">{deliveriesPanel()}{lowPanel()}{movedPanel()}</div>
      </div>
    </div>
  );
}
