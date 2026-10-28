/* RDY-424. Inventory Home 4/5 (d): the case (one decision) and the phone vertical timeline. Prototype only, not exported from the package.
   Transcribed from workshop/prototypes/inventory-home/round-1/final/home.js: vtHTML 579-605, stepLine 606-612, caseHTML 641-658, kv 659, evidence 660-677, wellHTML 678-692, sbarHTML 694-699 (case branch),
   render 705-720 (#pbar), doConfirm 727-744. CSS from home.html 299-333 (case), 336, 346-383 (phone), 386-407 (.vt), shell.css 235-247 (.chead .facts), 269-299 (.kv, .lnote, .seg, table.data), 390-391 (.pbar).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, type ReactNode } from 'react';
import { ArrowRight, ArrowSquareOut, CaretDown, CaretRight, CaretUp, CheckCircle, ClockCounterClockwise, Clock, HourglassMedium, Truck, WarningCircle } from '@phosphor-icons/react';
import { BackLink } from '../components/ActionLink';
import { AskLedaBar } from '../components/AskLedaBar';
import { Button } from '../components/Button';
import { LedaMark } from '../components/Leda';
import { SegmentedControl } from '../components/SegmentedControl';
import { SheetBar } from '../components/SheetBar';
import { InventoryStatusBar } from '../components/StatusBar';
import { cn } from '../utils/cn';
import { createHomeModel, homeData, type HomeModel, type HomeRole, type HomeState, type HomeTenant } from './InventoryHome.data';
import { InventoryChrome } from './Products.chrome';
import { StepLine } from './InventoryHome.zones';
import { DayTimeline } from '../components/DayTimeline';
import { homeTimelineProps } from './InventoryHome.timeline';

const noop = () => {};

const idCls = 'font-mono text-[13px] tracking-normal';
/* shell.css 269-274 .kv, home.html 299-306 .case .cfacts .kv */
const KV = 'grid grid-cols-[minmax(120px,34%)_minmax(0,1fr)] gap-x-4 text-[13px] leading-5';
const KVC = 'grid grid-cols-[160px_minmax(0,1fr)] gap-x-4 text-[13px] leading-5 @max-[600px]/sheet:grid-cols-[minmax(104px,38%)_minmax(0,1fr)]';
const Kv = ({ rows, cfacts }: { rows: any[]; cfacts?: boolean }) => (
  <dl className={cfacts ? KVC : KV}>
    {rows.filter(Boolean).map((r, i) => (
      <div key={i} className="contents">
        <dt className="overflow-hidden text-ellipsis whitespace-nowrap border-t border-rule py-[7px] text-muted">{r[0]}</dt>
        <dd className={cn('m-0 flex min-w-0 justify-between gap-3 border-t border-rule py-[7px]', cfacts && 'justify-start gap-0')}>
          <b className={cn('flex-none font-medium tabular-nums', r[3] && 'text-bad', r[4] && idCls, cfacts && 'w-[200px] @max-[600px]/sheet:w-auto')}>{String(r[1])}</b>
          {r[2] ? <span className={cn('min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-right text-muted', cfacts && 'text-left')}>{r[2]}</span> : null}
        </dd>
      </div>
    ))}
  </dl>
);
const Th = ({ children, n }: { children: ReactNode; n?: boolean }) => <th className={cn('whitespace-nowrap pb-2 pr-2 text-left text-[12px] font-normal text-muted last:pr-0', n && 'pl-3 text-right')}>{children}</th>;
const Td = ({ children, n, bad }: { children: ReactNode; n?: boolean; bad?: boolean }) => <td className={cn('border-t border-rule py-[9px] pr-2 align-middle last:pr-0', n && 'whitespace-nowrap pl-3 text-right tabular-nums', bad && 'font-semibold text-bad')}>{children}</td>;

export interface HomeCaseProps { tenant?: HomeTenant; role?: HomeRole; state?: HomeState; view?: 'today' | 'week'; open?: string; choice?: string; afterConfirm?: boolean }

function useCaseModel({ tenant = 'a', role = 'manager', state = 'live', view = 'today', open = 'n1', choice, afterConfirm }: HomeCaseProps) {
  return useMemo(() => {
    const M = createHomeModel(homeData(tenant, role, state), { view });
    const d: any = M.D.decisions.find((x: any) => x.id === open);
    if (d && choice) M.S.choice[d.id] = choice;
    if (d && afterConfirm) M.S.done[d.id] = { choice: d.action?.choices ? (choice || d.action.choices[0].id) : null, at: M.D.now.time };
    M.S.open = open;
    return { M, d };
  }, [tenant, role, state, view, open, choice, afterConfirm]);
}

/* home.js 198 */
function doneLabel(M: HomeModel, d: any) {
  const c = M.S.done[d.id] as any;
  if (d.kind === 'reorder') return `${d.action.ref} sent ${c.at}`;
  if (d.kind === 'transfer') return `${d.action.ref} sent`;
  if (d.kind === 'variance') return `${d.action.ref} · done`;
  return `${d.action.ref || d.title} · ${c.choice || 'done'}`;
}

/* home.js 678-692 */
function Well({ M, d }: { M: HomeModel; d: any }) {
  const { S, num, peso, mgr } = M;
  const a = d.action || {}, done = S.done[d.id];
  const choice = a.choices ? a.choices.find((c: any) => c.id === (S.choice[d.id] || a.choices[0].id)) : null;
  const writes: string[] = choice ? choice.writes : d.writes || [];
  const label = choice ? `${choice.label}${a.ref ? ' ' + a.ref : ''}` : a.label;
  const orderList = a.to === 'order-list';
  const lines = d.po && d.po.status === 'DRAFT' ? (
    <table className="mt-3 w-full border-collapse text-[13px] leading-[18px]">
      <thead><tr>{['Item', 'Qty', 'Unit cost', 'Total'].map((h, i) => <th key={h} className={cn('pb-1.5 pl-0 text-left text-[12px] font-normal text-muted', i && 'whitespace-nowrap pl-2.5 text-right tabular-nums')}>{h}</th>)}</tr></thead>
      <tbody>{d.po.lines.map((l: any, i: number) => (
        <tr key={i}>
          <td className="border-t border-raised-2 py-[7px] align-top">{l.product.name}<span className="block text-[12px] text-muted"><span className={cn(idCls, 'text-[12px]')}>{l.product.sku}</span></span></td>
          <td className="whitespace-nowrap border-t border-raised-2 py-[7px] pl-2.5 text-right align-top tabular-nums">{num(l.ordered)}</td>
          <td className="whitespace-nowrap border-t border-raised-2 py-[7px] pl-2.5 text-right align-top tabular-nums">{peso(l.cost)}</td>
          <td className="whitespace-nowrap border-t border-raised-2 py-[7px] pl-2.5 text-right align-top tabular-nums">{peso(l.total)}</td>
        </tr>))}</tbody>
      <tfoot><tr><td colSpan={3} className="border-t border-control py-[7px] align-top font-semibold">Total</td><td className="whitespace-nowrap border-t border-control py-[7px] pl-2.5 text-right align-top font-semibold tabular-nums">{d.po.totalLabel}</td></tr></tfoot>
    </table>
  ) : null;
  const seg = a.choices && !done ? (
    <SegmentedControl size="sm" aria-label="Choose" className="mt-3" value={choice.id} onChange={() => undefined} options={a.choices.map((c: any) => ({ value: c.id, label: c.label }))} />
  ) : null;
  const acts = done ? (
    <p className="mt-3.5 flex items-start gap-2.5 rounded-card bg-ok-bg px-3.5 py-3 text-[13px] leading-[19px] text-ok-ink"><CheckCircle aria-hidden="true" className="mt-0.5 flex-none text-[14px]" /><span>{doneLabel(M, d)}.{done.fromList ? ' It is an open purchase order now.' : ' Undo is in the message at the bottom for a few seconds.'}</span></p>
  ) : d.canDecide ? (
    <div className="mt-[18px] flex flex-wrap items-center gap-2">
      <span className="max-[640px]:hidden"><Button variant="primary" rightIcon={orderList ? ArrowRight : undefined}>{label} <kbd className="inline-block min-w-[18px] rounded-[3px] bg-white/20 px-1 text-center text-[11px] leading-4 text-inherit">↵</kbd></Button></span>
      {a.choices ? null : <Button variant="text">Discard draft</Button>}
    </div>
  ) : orderList ? (
    <div className="mt-[18px] flex flex-wrap items-center gap-2"><Button variant="secondary" rightIcon={ArrowRight}>View order list</Button><Waitfor>{d.waitingFor}</Waitfor></div>
  ) : <div className="mt-[18px] flex flex-wrap items-center gap-2"><Waitfor>{d.waitingFor}</Waitfor></div>;
  return (
    <div id="prop" className="rounded-card bg-raised px-[18px] pb-[18px] pt-4">
      <div className="flex items-center gap-2 text-[12px] text-muted"><LedaMark size={16} decorative /><span>{d.canDecide ? "Leda's draft · waiting for you" : `Leda's draft · for ${mgr()}`}</span>{a.ref ? <span className={cn(idCls, 'ml-auto text-[12px] text-text')}>{a.ref}</span> : null}</div>
      <h3 className="mt-2 text-[16px] font-semibold leading-[22px]">{choice ? `${choice.label}: ${d.title}` : orderList && d.po ? `Order list for ${d.po.supplierName}` : d.title}</h3>
      {seg}{lines}
      <div className="mt-3.5 text-[13px] leading-[19px]">
        <h4 className="mb-1 text-[12px] font-normal text-muted">{orderList ? (d.canDecide ? 'On the order list' : `On the order list · ${mgr()} marks it sent`) : d.canDecide ? 'Leda will write' : `Leda will write when ${mgr()} confirms`}</h4>
        <ul className="m-0 list-none p-0">{writes.map((w, i) => <li key={i} className="relative py-[3px] pl-4 before:absolute before:left-0.5 before:top-3 before:h-[1.5px] before:w-1.5 before:bg-accent before:content-['']">{w}</li>)}</ul>
      </div>
      {acts}
    </div>
  );
}
const Waitfor = ({ children }: { children: ReactNode }) => <span className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-control bg-raised-2 px-2.5 text-[12px] text-muted"><HourglassMedium aria-hidden="true" className="text-[14px]" />{children}</span>;

/* home.js 660-677 */
function Evidence({ M, d }: { M: HomeModel; d: any }) {
  const { D, NOW, toMin, hm, peso, prod, runway, loc, branch, sup, coming } = M;
  const p = d.product, L = p ? (loc(p.loc) as any || {}).name : '';
  if (d.kind === 'reorder' && p) {
    const r: any = runway(p.id, false), jobs = D.jobs.filter((j: any) => j.needs.some((n: any) => n.p === p.id) && (toMin(j.at) as number) >= NOW), s: any = sup(p.supplier);
    return <Kv cfacts={undefined} rows={[['On hand', p.onHand, L], ['Reorder level', p.reorder, p.expires ? `${p.expires.qty} expire ${p.expires.on}` : ''], jobs.length && ['Booked today', `${jobs.length} jobs`, `${jobs[0].jo} to ${jobs[jobs.length - 1].jo}`], r.short.length && ['Short without it', r.short.map((x: any) => x.ref).join(', '), r.short.map((x: any) => hm(x.t)).join(', '), true], ['Supplier', s.name, s.leadTime]]} />;
  }
  if (d.kind === 'variance' && d.po) {
    const l = d.po.lines.find((x: any) => x.variance < 0), mv: any = D.movements.find((m: any) => m.ref === d.po.no && m.p === l.p);
    return (
      <>
        <Kv rows={[['Ordered', `${l.ordered} ${l.product.unit}s`, l.product.name], ['Received', l.received, mv ? `${(d.po.receivedAt || '').replace(/^\w+ /, '')} · ${mv.byName}` : ''], ['Short', `${-l.variance} × ${peso(l.cost)}`, peso(d.po.shortValue), true], ['On hand now', l.product.onHand, `reorder level ${l.product.reorder}`]]} />
        <div className="mt-5">
          <h3 className="mb-1 text-[13px] font-semibold leading-5">{d.po.no} lines</h3>
          <table className="w-full border-collapse text-[13px] leading-[18px]">
            <thead><tr><Th>Item</Th><Th n>Ordered</Th><Th n>Received</Th><Th n>Short</Th><Th n>Value</Th></tr></thead>
            <tbody>{d.po.lines.map((x: any, i: number) => (
              <tr key={i}><Td>{x.product.name}<br /><span className={cn(idCls, 'text-[12px] text-muted')}>{x.product.sku}</span></Td><Td n>{x.ordered}</Td><Td n>{x.received}</Td><Td n bad={x.variance < 0}>{x.variance < 0 ? '−' + -x.variance : '—'}</Td><Td n>{peso(x.ordered * x.cost)}</Td></tr>))}</tbody>
            <tfoot><tr><td colSpan={4} className="border-t border-control py-[9px] pr-2 align-middle font-semibold">Bill as ordered</td><td className="whitespace-nowrap border-t border-control py-[9px] pl-3 text-right align-middle font-semibold tabular-nums">{d.po.totalLabel}</td></tr></tfoot>
          </table>
        </div>
      </>
    );
  }
  if (d.kind === 'transfer' && p) {
    const j: any = D.jobs.find((x: any) => x.jo === d.job), next: any = coming().find((po: any) => po.lines.some((l: any) => l.p === p.id && l.received < l.ordered));
    return <Kv rows={[['On hand', p.onHand, L], j && ['Job', j.jo, `${j.car} · ${j.work}`, false, true], j && ['Promised', j.promised || j.at, branch(j.branch)], ['Leave by', d.due.at, d.due.why], next && ['Next stock', next.no, `${next.lines.find((l: any) => l.p === p.id).ordered - next.lines.find((l: any) => l.p === p.id).received} on ${next.expected.split(' (')[0]}`, false]]} />;
  }
  if (p) return <Kv rows={[['On hand', p.onHand, L], ['Reorder level', p.reorder, ''], p.expires && ['Best before', p.expires.on, `${p.expires.qty} of ${p.onHand}`]]} />;
  void prod;
  return null;
}

/* home.js 641-658 */
export function HomeCase(props: HomeCaseProps) {
  const { M, d } = useCaseModel(props);
  if (!d) return null;
  const { D, S, NOW, toMin, left, hm, peso, isDone, runway, runConfirmed, arrival } = M;
  const p = d.product, t = toMin(d.due && d.due.at), lf = t != null ? left(t) : null, urgent = t != null && t - NOW <= 60;
  const done = isDone(d.id);
  const fact = 'relative inline-flex items-center gap-1.5 whitespace-nowrap before:ml-[10px] before:mr-1 before:h-[3px] before:w-[3px] before:flex-none before:rounded-full before:bg-control before:content-[\'\']';
  const fs: ReactNode[] = [];
  if (d.due) fs.push(<span key="due" className={fact}><b className="font-semibold text-text">{d.due.label}</b>{lf && !done ? <span className={cn('font-semibold', urgent ? 'text-bad' : 'text-warn')}>{lf} left</span> : null}</span>);
  if (d.po) fs.push(<span key="po" className={fact}><span className={idCls}>{d.po.no}</span></span>, <span key="sup" className={fact}>{d.po.supplierName}</span>, <span key="amt" className={fact}><b className="font-semibold tabular-nums text-text">{d.po.status === 'RECEIVED' ? peso(d.po.shortValue) : d.po.totalLabel}</b>{d.po.status === 'RECEIVED' ? 'short' : ''}</span>);
  else if (d.action && d.action.ref) fs.push(<span key="ref" className={fact}><span className={idCls}>{d.action.ref}</span></span>);
  fs.push(d.canDecide ? <span key="who" className={cn(fact, 'text-ok')}>Leda acts here</span> : <span key="who" className={cn(fact, 'text-muted')}>{d.waitingFor}</span>);
  const hasJobs = p && D.jobs.some((j: any) => j.needs.some((n: any) => n.p === p.id) && (toMin(j.at) as number) >= NOW);
  const showStrip = p && (hasJobs || (d.po && d.po.status !== 'RECEIVED')) && S.view === 'today';
  const r: any = showStrip ? runway(p.id, runConfirmed(p.id)) : null;
  const strip = showStrip ? (
    <section aria-label="This part today" className="mb-4">
      <div className="hidden min-h-8 items-center gap-2.5 pb-1 max-[640px]:flex">
        <Clock aria-hidden="true" className="self-center text-[18px] text-muted" />
        <h2 className="whitespace-nowrap text-[16px] font-semibold leading-[22px]">{p.name} today</h2>
      </div>
      {hasJobs ? (
        <div className="hidden pt-3 max-[640px]:block">
          <StepLine M={M} pid={p.id} W={280} H={44} />
          <p className="mt-2.5 text-[13px] text-muted">
            {r.short.length ? <>Short for {r.short.map((x: any, i: number) => <span key={i}>{i ? ', ' : ''}<span className={idCls}>{x.ref}</span> {hm(x.t)}</span>)}</> : `${r.end} on hand by close`}
            {d.po && d.po.status === 'DRAFT' ? ` · ${d.po.no} lands by ${hm((arrival(d.po) as any).t)} if sent by ${(d.due && d.due.at) || ''}` : ''}
          </p>
        </div>
      ) : null}
      <div className="max-[640px]:hidden">
        <DayTimeline
          {...homeTimelineProps(M, noop, { only: [d.id], pid: hasJobs ? p.id : null, caseP: p.id, po: d.po && d.po.status !== 'RECEIVED' ? d.po : null })}
          title={`${p.name} today`}
          subtitle={`as of ${D.now.time}`}
          variant="case"
          className="w-full"
        />
      </div>
    </section>
  ) : null;
  const note = (
    <div className="mt-5 flex items-start gap-2.5 text-[14px] leading-5">
      <LedaMark size={16} decorative className="mt-0.5 flex-none" />
      <p>{d.leda}<span className="mt-0.5 block text-[12px] leading-4 text-muted">Leda, {D.now.time}</span></p>
    </div>
  );
  return (
    <div id="case" className="@container [container-name:sheet_dt] min-w-0">
      <div className="flex items-center gap-2.5">
        <h1 className="text-case font-semibold">{d.title}</h1>
        {done ? <span className="inline-flex h-5 items-center gap-1.5 text-[13px] font-medium"><span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-ok" />Done</span> : null}
      </div>
      <div className="mt-2 overflow-hidden"><div className="-ml-[23px] flex flex-wrap items-center gap-y-1 text-[13px] leading-5 text-muted">{fs}</div></div>
      {strip ? (
        <>
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_400px] items-start gap-gap @max-[900px]/sheet:grid-cols-1 max-[640px]:grid-cols-1"><div>{strip}{note}</div><Well M={M} d={d} /></div>
          <div className="mt-6"><Evidence M={M} d={d} /></div>
        </>
      ) : (
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_400px] items-start gap-gap @max-[900px]/sheet:grid-cols-1 max-[640px]:grid-cols-1"><div><Evidence M={M} d={d} />{note}</div><Well M={M} d={d} /></div>
      )}
    </div>
  );
}

/* home.js 579-605: the phone vertical timeline */
export function HomeVerticalTimeline({ tenant = 'a', role = 'manager', state = 'live', earlier = false, all = false }: { tenant?: HomeTenant; role?: HomeRole; state?: HomeState; earlier?: boolean; all?: boolean }) {
  const M = useMemo(() => { const m = createHomeModel(homeData(tenant, role, state), {}); m.S.earlier = earlier; m.S.vtAll = all; return m; }, [tenant, role, state, earlier, all]);
  const { D, F, S, NOW, toMin, hm, plr, isDone, branch, sup, poErr, coming, arrival, poStatus, todayMoves, todayPid, runway, runConfirmed, rcvDay } = M;
  const head = (
    <div className="flex min-h-8 items-baseline gap-2.5 border-b border-border pb-2.5">
      <Clock aria-hidden="true" className="flex-none self-center text-[18px] text-muted" />
      <h2 id="vt-h" className="whitespace-nowrap text-[16px] font-semibold leading-[22px]">Today's timeline</h2>
    </div>
  );
  if (F.loading) return <section id="vt" aria-labelledby="vt-h" className="flex min-w-0 flex-col">{head}<div className="p-0">{Array.from({ length: 5 }, (_, i) => <span key={i} className="my-4 block h-[18px] w-4/5 animate-pulse rounded-card bg-skeleton" />)}</div></section>;
  const pid = todayPid(), rw: any = pid ? runway(pid, runConfirmed(pid)) : null, short = new Set(rw ? rw.short.map((x: any) => x.ref) : []);
  const items: any[] = [];
  if (!F.empty) {
    D.jobs.filter((j: any) => (toMin(j.at) as number) >= NOW).forEach((j: any) => items.push({ t: toMin(j.at), k: 'job', j }));
    D.decisions.filter((d: any) => d.kind === 'transfer' && d.due && d.due.at).forEach((d: any) => items.push({ t: toMin(d.due.at), k: 'tr', d }));
    if (!poErr) coming().forEach((po: any) => { const a = arrival(po); if (a && a.day === 0 && a.t != null) items.push({ t: a.t, k: 'del', po }); });
  }
  items.sort((a, b) => a.t - b.t);
  const R = (key: string | number, tm: ReactNode, icon: ReactNode, tx: ReactNode, cls: string, button: boolean) => {
    const inner = (
      <>
        <span className="text-[13px] font-medium leading-5 tabular-nums text-muted group-[.k-short]/li:font-semibold group-[.k-short]/li:text-bad">{tm}</span>
        <span className="text-[18px] text-muted group-[.k-short]/li:text-bad">{icon}</span>
        <span className="min-w-0 text-[14px] leading-5">{tx}</span>
        {button ? <CaretRight aria-hidden="true" className="text-[14px] text-faint" /> : <span />}
      </>
    );
    const rowCls = 'grid min-h-[58px] w-full grid-cols-[44px_22px_minmax(0,1fr)_14px] items-center gap-x-2 py-2.5 text-left text-text';
    return <li key={key} className={cn('group/li m-0 border-t border-rule first:border-t-transparent', cls)}>{button ? <button type="button" className={cn(rowCls, 'hover:bg-raised')}>{inner}</button> : <div className={rowCls}>{inner}</div>}</li>;
  };
  const S2 = ({ children }: { children: ReactNode }) => <span className="mt-0.5 block text-[12px] leading-4 text-muted">{children}</span>;
  const sid = (c: ReactNode) => <span className={cn(idCls, 'text-[13px]')}>{c}</span>;
  const li = (it: any, i: number) => {
    if (it.k === 'job') { const j = it.j, sh = short.has(j.jo); return R(i, j.at.replace(/^0/, ''), <ArrowSquareOut aria-hidden="true" />, <>{sid(j.jo)} · {branch(j.branch)}<S2>Out: {j.needs.map((n: any) => `${n.qty} ${(M.prod(n.p) as any).sku}`).join(', ')}{sh ? ' · short, none left' : ''}</S2></>, sh ? 'k-short' : '', true); }
    if (it.k === 'tr') { const d = it.d, j: any = D.jobs.find((x: any) => x.jo === d.job); return R(i, hm(it.t), <ArrowSquareOut aria-hidden="true" />, <>{sid(d.action.ref)} · to {j ? branch(j.branch) : ''}<S2>Out: 1 {d.product.sku} · {isDone(d.id) ? 'sent' : 'waiting to be sent'}</S2></>, '', true); }
    const po = it.po, firm = poStatus(po) !== 'DRAFT';
    return R(i, hm(it.t), <Truck aria-hidden="true" />, <>{sid(po.no)} · {po.supplierName}<S2>In: {plr(po.lines.reduce((s2: number, l: any) => s2 + l.ordered - l.received, 0), 'unit')} · {firm ? 'arriving' : `only if sent by ${(sup(po.supplier) as any).cutoff || ''}`}</S2></>, '', true);
  };
  const tm = todayMoves(), carry = D.decisions.filter((d: any) => d.kind === 'variance' && d.po);
  const shown = S.vtAll ? items : items.slice(0, 4), more = items.length - shown.length;
  return (
    <section id="vt" aria-labelledby="vt-h" className="flex min-w-0 flex-col">
      {head}
      <div aria-label="Today, by time" className="p-0">
        <button type="button" aria-expanded={!!S.earlier} className="group/e flex min-h-12 w-full items-center gap-2 border-b border-rule p-0 text-left text-[13px] text-muted"><ClockCounterClockwise aria-hidden="true" className="text-[18px]" /><span>Earlier today · <b className="font-semibold tabular-nums text-text">{tm.length}</b> moved</span><CaretRight aria-hidden="true" className={cn('ml-auto text-[12px] transition-transform duration-[120ms]', S.earlier && 'rotate-90')} /></button>
        {S.earlier ? <ol className="relative m-0 list-none p-0">{tm.map((m: any, i: number) => R(i, m.at.replace(/^0/, ''), m.qty > 0 ? <Truck aria-hidden="true" /> : <ArrowSquareOut aria-hidden="true" />, <>{m.product.name}<S2>{m.qty > 0 ? 'In' : 'Out'}: {Math.abs(m.qty)} · {m.ref ? <>{sid(m.ref)} · </> : null}{m.byName}</S2></>, 'k-gone', false))}</ol> : null}
        {carry.length ? <ol className="relative m-0 list-none p-0">{carry.map((d: any, i: number) => R(i, rcvDay(d.po.receivedAt) === 'today' ? String(d.po.receivedAt).replace(/^.* (\d+:\d+)$/, '$1').replace(/^0/, '') : 'Yday', <WarningCircle aria-hidden="true" />, <>{sid(d.po.no)} · short {d.po.unitsOrdered - d.po.unitsReceived}<S2>{isDone(d.id) ? 'Done' : d.canDecide ? 'In: arrived short · settle it' : d.waitingFor}</S2></>, isDone(d.id) ? '' : 'k-short', true))}</ol> : null}
        <div className="my-2.5 mb-1 flex items-center gap-2 after:h-0.5 after:flex-1 after:bg-accent after:content-['']"><span className="h-5 rounded-chip bg-accent px-[7px] text-[12px] font-semibold leading-5 tabular-nums text-accent-ink">Now {hm(NOW)}</span></div>
        <ol className="relative m-0 list-none p-0">{shown.length ? shown.map(li) : R('none', '', <CheckCircle aria-hidden="true" />, <span className="text-muted">{F.empty ? 'Nothing booked yet.' : 'Nothing else booked today.'}</span>, '', false)}</ol>
      </div>
      {more > 0 || S.vtAll ? <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-3"><Button variant="text" className="h-7 gap-1.5 px-2.5 text-[12px]">{S.vtAll ? 'Show less' : `Show ${more} more today`}{S.vtAll ? <CaretUp aria-hidden="true" /> : <CaretDown aria-hidden="true" />}</Button></div> : null}
    </section>
  );
}

/* home.js 694-720: the case inside the inventory shell. On the phone Confirm sits in the sticky bottom bar (#pbar). */
export function HomeCaseView(props: HomeCaseProps & { onBack?: () => void }) {
  const { M, d } = useCaseModel(props);
  const { D, S, isDone } = M;
  const platform = { name: D.business.platform, initials: D.business.platform.split(' ').map((w: string) => w[0]).join('') };
  const choice = d?.action?.choices ? d.action.choices.find((c: any) => c.id === (S.choice[d.id] || d.action.choices[0].id)) : null;
  const bar = d && d.canDecide && !isDone(d.id) ? <Button variant="primary" actionBar fullWidth>{choice ? `${choice.label} ${d.action.ref || ''}` : d.action.label}</Button> : undefined;
  const link: any = D.link;
  return (
    <InventoryChrome tenant={D.business.key as 'a' | 'b'} as={D.role as any} nav="home" page="Home" lists={2} detail actionBar={bar}
      sheetBar={<SheetBar wrapChildren={false} actionsFirst={false} actions={<AskLedaBar variant="bar" scope={d?.product?.sku || d?.action?.ref || 'Home'} shortcuts={false} />}><BackLink href="#today" onClick={(e) => { if (props.onBack) { e.preventDefault(); props.onBack(); } }}>{S.view === 'week' ? 'This week' : 'Today'}</BackLink><span className="self-center text-[13px] font-semibold text-text">/ {d?.title}</span></SheetBar>}
      status={<InventoryStatusBar platform={platform} dataLink={link ? { with: link.with, status: link.status === 'slow' ? 'slow' : 'linked', since: link.since, title: `${link.shares} · ${link.reads}` } : undefined} viewer={{ name: D.viewer.short, role: D.roleLabel }} leda={{ canDecide: D.decisions.some((x: any) => x.canDecide) || M.can('confirm_po'), managerName: D.manager.short }} updatedAt={D.now.time} />}>
      <div className="min-w-0 px-pad pb-10 pt-5 max-[640px]:px-4 max-[640px]:pb-[120px] max-[640px]:pt-4"><HomeCase {...props} /></div>
    </InventoryChrome>
  );
}
