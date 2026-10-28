/* [For Review] RDY-403 Inventory Home 5/5 (e): final assembly. Prototype only.
   Transcribed from workshop/prototypes/inventory-home/round-1/final/home.js: headline 141-154, weekFinding 439-445, markersHTML 615-627, todayHTML 628-640,
   sbarHTML 694-700, statusHTML 701-705, render 706-722; home.html CSS 21-408 (.pane.home 48, .trow 49-58, .marks 60-72, .stack 75, .first-run 183, phone 352-365).
   The timeline (I6), zones, vertical timeline and case are the earlier slices (InventoryHome.timeline / zones / case). */
import { useMemo, useState } from 'react';
import { CaretRight, CheckCircle, ClipboardText, HourglassMedium, Plus, TrendDown, Truck, Warning, WarningCircle } from '@phosphor-icons/react';
import { AskLedaBar } from '../components/AskLedaBar';
import { Button } from '../components/Button';
import { LedaMark } from '../components/Leda';
import { SegmentedControl } from '../components/SegmentedControl';
import { SheetBar, SheetBarWhere } from '../components/SheetBar';
import { InventoryStatusBar } from '../components/StatusBar';
import { cn } from '../utils/cn';
import { createHomeModel, homeData, type HomeModel, type HomeRole, type HomeState, type HomeTenant } from './InventoryHome.data';
import { HomeVerticalTimeline } from './InventoryHome.case';
import { HomeTimelinePanel } from './InventoryHome.timeline';
import { HomeZones, Pill } from './InventoryHome.zones';
import { InventoryChrome } from './Products.chrome';

const skel = 'block animate-pulse bg-skeleton';
const lc1 = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/* home.js 138 */
const verb = (d: any) => {
  const r = d.action && d.action.ref;
  if (d.kind === 'reorder' && r) return 'Review order list';
  if (d.kind === 'transfer' && r) return `Review ${r} and send`;
  if (d.kind === 'variance' && r) return `Settle ${r}`;
  return d.action.label;
};

/* home.js 439-445 */
function weekFinding(M: HomeModel) {
  const { hm, DAYS, WDATE, weekModel, runParts } = M;
  const dayLabel = (k: number) => (k === 0 ? 'today' : `${DAYS[WDATE[k].getDay()]} ${WDATE[k].getDate()}`);
  const pid = runParts()[0] && runParts()[0].id;
  if (!pid) return null;
  const m: any = weekModel(pid), o = m.outs[0];
  if (!o) return null;
  const b = m.bands[0], fix = m.dels.find((d: any) => !d.draft && b && d.k === b.k1 && d.t === b.t1), firm = m.dels.find((d: any) => !d.draft);
  const when = `${o.k ? dayLabel(o.k) : 'today'} about ${hm(Math.round(o.t / 15) * 15)}`;
  return { text: `${m.p.name} runs out ${when}${fix ? `, ${fix.k - o.k === 1 ? 'the day before' : 'before'} ${fix.no} lands ${dayLabel(fix.k).split(' ')[0]}` : firm ? `, even with ${firm.no} on ${dayLabel(firm.k).split(' ')[0]}` : ', with nothing ordered'}.` };
}

/* home.js 141-154 */
function Headline({ M }: { M: HomeModel }) {
  const { D, F, S, mgr, openDecs, hm, toMin } = M;
  const wrap = 'mt-2 flex items-start gap-2 text-[15px] leading-[22px] max-[640px]:text-[14px] max-[640px]:leading-[21px]';
  if (F.loading) return <p className={wrap}><LedaMark size={16} decorative active className="mt-[3px] flex-none" /><span className={cn(skel, 'mt-1 h-[14px] w-[420px] max-w-full rounded-card')} /></p>;
  const all = openDecs(), mine = all.filter((d: any) => d.canDecide), done = Object.keys(S.done).length;
  const wf = S.view === 'week' && !F.empty ? weekFinding(M) : null;
  const vs = (d: any) => (d.kind === 'reorder' ? 'review the order list' : lc1(verb(d)));
  const first = (d: any) => { const t = toMin(d.due && d.due.at); return `${d.title}${t != null ? `, so ${vs(d)} by ${hm(t)}` : ''}`; };
  let h = D.headline;
  if (F.empty) h = D.headline;
  else if (wf) h = `${wf.text}${mine[0] ? ` Today first: ${vs(mine[0])}${mine[0].due && mine[0].due.at ? ` by ${mine[0].due.at}` : ''}.` : ''}`;
  else if (!D.decisions.some((d: any) => d.canDecide) && all.length) h = `${all.length} ${all.length === 1 ? 'thing waits' : 'things wait'} for ${mgr()}. You can receive deliveries, look up parts and draft orders.`;
  else if (!mine.length) h = `Nothing needs you right now. Leda is watching ${D.watching.length} things.`;
  else h = `${done ? `${mine.length} left. Next` : `${mine.length === 1 ? 'One thing needs' : `${mine.length} things need`} you. First`}: ${first(mine[0])}.`;
  return <p className={wrap}><LedaMark size={16} decorative className="mt-[3px] flex-none" /><span>{h}</span></p>;
}

/* home.js 615-627 (.jump: home.html 62-68) */
const jumpCls = 'group/jump inline-flex h-[34px] items-center gap-2 whitespace-nowrap rounded-control border border-border bg-surface pl-2.5 pr-2 text-[13px] text-text no-underline transition-colors duration-[120ms] hover:border-control hover:bg-raised max-[640px]:h-10 [&>svg:first-child]:text-[17px] [&>svg:first-child]:text-muted';
const Jump = ({ href, icon, zero, children }: { href: string; icon: React.ReactNode; zero?: boolean; children: React.ReactNode }) => (
  <a href={href} className={cn(jumpCls, zero && 'text-muted')}>{icon}{children}<CaretRight aria-hidden="true" className="text-[12px] text-faint transition-transform duration-[120ms] group-hover/jump:translate-x-0.5 group-hover/jump:text-text" /></a>
);
const B = ({ children }: { children: React.ReactNode }) => <b className="font-semibold tabular-nums">{children}</b>;

function Markers({ M, retried }: { M: HomeModel; retried: boolean }) {
  const { D, F, mgr, openDecs, deliveries, isDone } = M;
  const wrap = 'mt-4 flex flex-wrap items-center gap-2';
  if (F.loading) return <div className={wrap}>{['w-[120px]', 'w-[150px]', 'w-[150px]'].map((w, i) => <span key={i} className={cn(skel, 'h-[34px] rounded-[5px]', w)} />)}</div>;
  const decFor = (r: string) => (D.decisions.find((d: any) => d.action && d.action.ref === r) || ({} as any)).id;
  const poErr = M.poErr && !retried;
  const mine = openDecs().filter((d: any) => d.canDecide).length, wait = openDecs().filter((d: any) => !d.canDecide).length;
  const dl = deliveries().filter((po: any) => po.status !== 'RECEIVED' || po.varianceState === 'awaiting' || po.varianceState === 'disputed');
  const nShort = dl.filter((po: any) => po.varianceState === 'awaiting' && !isDone(decFor(po.no))).length;
  const low = D.lowStock.length, out = D.outOfStock.length;
  const todo = mine ? <Jump href="#p-todo" icon={<ClipboardText aria-hidden="true" />}><span><B>{mine}</B> to do</span></Jump>
    : wait ? <Jump href="#p-todo" icon={<HourglassMedium aria-hidden="true" />}><span><B>{wait}</B> wait for {mgr()}</span></Jump>
    : <Jump href="#p-todo" zero icon={<CheckCircle aria-hidden="true" />}><span>Nothing to do</span></Jump>;
  const del = poErr ? <Jump href="#p-del" icon={<WarningCircle aria-hidden="true" />}><span>Deliveries not loaded</span></Jump>
    : <Jump href="#p-del" zero={!dl.length} icon={<Truck aria-hidden="true" />}><span><B>{dl.length}</B> {dl.length === 1 ? 'delivery' : 'deliveries'}</span>{nShort ? <Pill tone="bad">{nShort} short</Pill> : null}</Jump>;
  const lw = <Jump href="#p-low" zero={!(low + out)} icon={<TrendDown aria-hidden="true" />}><span><B>{low + out}</B> need stock</span>{out ? <Pill tone="bad">{out} out of stock</Pill> : null}</Jump>;
  const more: React.ReactNode[] = [<span key="p"><b className="mr-1 font-semibold tabular-nums text-text">{(D.facts[0] as any).value}</b>products</span>]
    .concat((D.facts as any[]).filter((f) => f.label === 'stock value').map((f) => <span key="v"><b className="mr-1 font-semibold tabular-nums text-text">{String(f.value)}</b>stock value</span>));
  if (F.degraded) more.push(<span key="d" className="inline-flex items-center gap-1 font-medium text-warn"><Warning aria-hidden="true" />{(F.degraded as any).note}</span>);
  return (
    <div className={wrap} aria-label="Jump to">
      {todo}{del}{lw}
      <span className="ml-1 inline-flex flex-wrap gap-y-1 text-[13px] text-muted max-[640px]:ml-0 max-[640px]:w-full [&>span+span]:before:mx-2 [&>span+span]:before:text-control [&>span+span]:before:content-['·']">{more}</span>
    </div>
  );
}

export interface InventoryHomePageProps {
  tenant?: HomeTenant;
  role?: HomeRole;
  state?: HomeState;
  /** Initial range; the segmented control changes it (?view=week). */
  view?: 'today' | 'week';
}

/* home.js 628-640 */
export function InventoryHomePage({ tenant = 'a', role = 'manager', state = 'live', view: initialView = 'today' }: InventoryHomePageProps) {
  const [view, setView] = useState<'today' | 'week'>(initialView);
  const M = useMemo(() => createHomeModel(homeData(tenant, role, state), { view }), [tenant, role, state, view]);
  const { D, F } = M;
  const platform = { name: D.business.platform, initials: D.business.platform.split(' ').map((w: string) => w[0]).join('') };
  const link: any = D.link;
  const week = view === 'week';
  const sheetBar = (
    <SheetBar wrapChildren={false} actionsFirst={false} actions={<AskLedaBar variant="bar" shortcuts={false} />}>
      <SheetBarWhere platform={platform} page="Home" note={D.role !== 'manager' ? `Viewing as ${D.viewer.short}, ${D.roleLabel.toLowerCase()}` : undefined} />
    </SheetBar>
  );
  const status = (
    <InventoryStatusBar platform={platform} dataLink={link ? { with: link.with, status: link.status === 'slow' ? 'slow' : 'linked', since: link.since, title: `${link.shares} · ${link.reads}` } : undefined} viewer={{ name: D.viewer.short, role: D.roleLabel }} leda={{ canDecide: D.decisions.some((x: any) => x.canDecide) || M.can('confirm_po'), managerName: D.manager.short }} updatedAt={F.loading ? `Loading… last loaded ${D.now.lastLoaded}` : D.now.time} />
  );
  return (
    <InventoryChrome tenant={D.business.key as 'a' | 'b'} as={D.role as any} nav="home" page="Home" lists={2} sheetBar={sheetBar} status={status}>
      <div id="today" className="min-w-0 px-pad pb-10 pt-6 max-[640px]:px-4 max-[640px]:pb-24 max-[640px]:pt-4">
        <div className="flex items-start gap-6 max-[640px]:flex-col max-[640px]:gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-[22px] font-semibold leading-7 tracking-[-0.01em] max-[640px]:text-[20px] max-[640px]:leading-[26px]">{week ? 'This week' : 'Today'}</h1>
            <Headline M={M} />
          </div>
          <div className="flex flex-none items-center gap-3 pt-0.5 max-[640px]:w-full max-[640px]:justify-between">
            <span className="whitespace-nowrap text-[12px] text-muted">{D.now.date} · {F.loading ? `Loading… last loaded ${D.now.lastLoaded}` : `Updated ${D.now.time}`}</span>
            <SegmentedControl size="md" aria-label="Range" value={view} onChange={(v) => setView(v as 'today' | 'week')} options={[{ value: 'today', label: 'Today' }, { value: 'week', label: 'This week' }]} />
          </div>
        </div>
        <Markers M={M} retried={false} />
        {F.empty ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="primary"><Plus aria-hidden="true" />Add your first product</Button>
            <Button variant="secondary"><LedaMark size={16} decorative />Let Leda read a supplier list</Button>
          </div>
        ) : null}
        <div className="mt-10 flex flex-col gap-12 max-[640px]:mt-6 max-[640px]:gap-8">
          <div className="max-[640px]:hidden"><HomeTimelinePanel key={`${tenant}${role}${state}${view}`} tenant={tenant} role={role} state={state} view={view} /></div>
          <HomeZones tenant={tenant} role={role} state={state} view={view} mid={<div className="hidden max-[640px]:block"><HomeVerticalTimeline tenant={tenant} role={role} state={state} /></div>} />
        </div>
      </div>
    </InventoryChrome>
  );
}
