import { useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowSquareOut, ChatCircleText, ClipboardText, Clock, Coins, Package } from '@phosphor-icons/react';
import { LedaNote } from './LedaNote';
import { SegmentedControl } from './SegmentedControl';
import { Skeleton } from './Skeleton';
import { cn } from '../utils/cn';
import { STATUS_SHORT, dayWord, flagOf, hm, reasonOf, serviceTitle, shortName } from './today/model';
import { NotifyItem } from './NotifyItem';
import type { FeedMechItem, TodayEnv, TodayInquiry, TodayJob, TodayJobView, TodayPartMovement, TodayProduct } from './today/types';

export type FeedTab = 'needs' | 'inquiries' | 'parts';

export interface FloorFeedProps<J extends TodayJob = TodayJob> {
  jobs: J[];
  /** The clock and the stock rules behind each "needs you" reason. */
  env: TodayEnv;
  /** Car and customer shown on a row. */
  view: (job: J) => TodayJobView;
  inquiries: TodayInquiry[];
  /** Time (`HH:MM`) the manager replied to an inquiry this session, by inquiry id. */
  replied: Record<string, string>;
  /** Stock in / out of the day, newest first. */
  partMovements: TodayPartMovement[];
  /** The product behind a movement. */
  productOf: (id: string) => TodayProduct;
  /** Part requests and found issues from the mechanic app, shown above the movements. */
  mechItems?: FeedMechItem[];
  /** Name of the linked Inventory app, e.g. "ReadyPH Inventory". */
  inventoryName: string;
  /** Branch whose movements the Parts tab shows. */
  branchName: string;
  /** Rows only inform: opening a row shows the full detail (off-canvas), where every action lives. */
  onOpenJob: (job: J) => void;
  onOpenInquiry: (q: TodayInquiry) => void;
  /** Leda's one-line floor read, shown above the needs list. */
  floorRead?: string;
  /** Time shown on the Leda note's byline. */
  floorReadAt?: string;
  /** When the Parts tab last loaded, shown if the inventory is down. */
  partsLoadedAt?: string;
  inventoryDown?: boolean;
  /** `loading`: skeleton rows in place of the list. */
  state?: 'ready' | 'loading';
  tab?: FeedTab;
  onTabChange?: (t: FeedTab) => void;
  /** Right-aligned control on the tab row (desktop: the panel's hide toggle). */
  headerAction?: ReactNode;
  /** Phone gives the rows the two-line density and no outer padding. */
  className?: string;
}

const MARK = {
  OVERDUE: { icon: <Clock size={20} />, tone: 'bad' as const },
  PARTS: { icon: <Package size={20} />, tone: 'bad' as const },
  APPROVAL: { icon: <ClipboardText size={20} />, tone: 'warn' as const },
  PICKUP_UNPAID: { icon: <Coins size={20} />, tone: 'warn' as const },
};
const ORDER = ['OVERDUE', 'PARTS', 'PICKUP_UNPAID', 'APPROVAL'] as const;

/**
 * FloorFeed: the default right panel. One ruled list with three tabs: what needs the manager (stuck services),
 * customer inquiries, and parts activity read from Inventory (stock in / out). Rows have no inline actions; a click opens the detail in the off-canvas.
 * Data-agnostic: the jobs, inquiries, movements, lookups and the mechanic app's items all arrive as props.
 */
export function FloorFeed<J extends TodayJob = TodayJob>({ jobs, env, view, inquiries, replied, partMovements, productOf, mechItems = [], inventoryName, branchName, onOpenJob, onOpenInquiry, floorRead, floorReadAt, partsLoadedAt, inventoryDown, state = 'ready', tab: tabProp, onTabChange, headerAction, className }: FloorFeedProps<J>) {
  const [inner, setInner] = useState<FeedTab>('needs');
  const tab = tabProp ?? inner;
  const setTab = (t: FeedTab) => { setInner(t); onTabChange?.(t); };
  const stuck = jobs.filter((j) => reasonOf(env, j)).sort((a, b) => ORDER.indexOf(reasonOf(env, a)!) - ORDER.indexOf(reasonOf(env, b)!));
  const open = inquiries.filter((q) => !q.repliedAt && !replied[q.id]);
  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className={cn('flex flex-none items-center gap-2 px-4', headerAction ? 'h-14' : 'pb-2 pt-3')}>
        <div className="min-w-0 flex-1"><SegmentedControl
          size="md" value={tab} onChange={(v) => setTab(v as FeedTab)} aria-label="Right panel list"
          options={[
            { value: 'needs', label: 'Needs you', count: stuck.length },
            { value: 'inquiries', label: 'Inquiries', count: open.length },
            { value: 'parts', label: 'Parts' },
          ]}
        /></div>
        {headerAction}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" aria-busy={state === 'loading' || undefined}>
        {state === 'loading' && (
          <div role="status" aria-label="Loading the list" className="space-y-3 pt-2">
            {[0, 1, 2, 3].map((i) => <div key={i} className="flex items-start gap-3"><Skeleton variant="rect" width={20} height={20} /><div className="flex-1 space-y-2"><Skeleton variant="rect" width="70%" height={14} /><Skeleton variant="rect" width="45%" height={12} /></div></div>)}
          </div>
        )}
        {state !== 'loading' && tab === 'needs' && (
          <section aria-label="Needs you">
            {floorRead && <div className="pb-2 pt-1"><LedaNote byline={floorReadAt ? `Leda · ${floorReadAt}` : 'Leda'}>{floorRead}</LedaNote></div>}
            {stuck.length === 0 && <p className="py-4 text-[14px] text-muted">Nothing is stuck. Every service is on time.</p>}
            <ul>
              {stuck.map((j) => {
                const r = reasonOf(env, j)!; const v = view(j); const flag = flagOf(env, j); const st = STATUS_SHORT[j.status];
                return (
                  <NotifyItem
                    key={j.id} marker={MARK[r].icon} markerTone={MARK[r].tone}
                    title={`${j.number} ${serviceTitle(j)}`} time={j.promisedAt ? dayWord(j.promisedAt, env.today) : 'no time'}
                    detail={<>{v.vehicle.replace(/ \d{4}$/, '')} · {v.customer}{flag && <> · <span className={flag.tone === 'bad' ? 'font-medium text-bad' : undefined}>{flag.word}</span></>}</>}
                    tag={st.label} tagTone={j.status === 'FOR_PICKUP' ? 'ok' : j.status === 'FOR_APPROVAL' || j.status === 'PENDING' ? 'warn' : 'neutral'} onOpen={() => onOpenJob(j)}
                  />
                );
              })}
            </ul>
          </section>
        )}
        {state !== 'loading' && tab === 'inquiries' && (
          <section aria-label="Inquiries">
            {inquiries.length === 0 && <p className="py-4 text-[14px] text-muted">No inquiries today.</p>}
            <ul>
              {inquiries.map((q) => {
                const done = q.repliedAt ? hm(q.repliedAt) : replied[q.id];
                return (
                  <NotifyItem
                    key={q.id} marker={<ChatCircleText size={20} />} markerTone={done ? 'muted' : 'warn'}
                    title={q.name} time={hm(q.at)}
                    detail={<>{q.channel} · {q.text}</>}
                    tag={done ? `Replied ${done}` : 'Reply'} tagTone={done ? 'neutral' : 'warn'}
                    onOpen={() => onOpenInquiry(q)}
                  />
                );
              })}
            </ul>
          </section>
        )}
        {state !== 'loading' && tab === 'parts' && (
          <section aria-label="Parts activity">
            <div className="flex items-baseline justify-between pb-1 pt-1 text-[12px] text-muted"><span>Today at {branchName}, from {inventoryName}</span></div>
            {inventoryDown ? (
              <p className="py-4 text-[14px] text-muted">Can't reach {inventoryName}.{partsLoadedAt ? ` Last movements loaded ${partsLoadedAt}.` : ''}</p>
            ) : (
              <ul>
                {mechItems.map((x) => <NotifyItem key={x.id} marker={<Package size={20} />} markerTone="warn" title={x.title} time={x.time} detail={x.detail} tag={x.tag} tagTone="warn" />)}
                {mechItems.length === 0 && partMovements.length === 0 && <p className="py-4 text-[14px] text-muted">No stock movements yet today.</p>}
                {partMovements.map((m) => {
                  const pr = productOf(m.productId);
                  const inn = m.dir === 'in';
                  return (
                    <NotifyItem
                      key={m.id} marker={inn ? <ArrowDown size={20} /> : <ArrowUp size={20} />} markerTone={inn ? 'ok' : 'muted'}
                      title={shortName(pr)} time={hm(m.at)} detail={`${m.ref} · ${m.by}`}
                      tag={`${inn ? 'Stock in' : 'Stock out'} ${inn ? '+' : '-'}${m.qty}`} tagTone={inn ? 'ok' : 'neutral'}
                    />
                  );
                })}
              </ul>
            )}
            <a href="#inventory" className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-accent underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Open in {inventoryName}<ArrowSquareOut size={16} aria-hidden /></a>
          </section>
        )}
      </div>
    </div>
  );
}
