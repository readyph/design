import { useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowSquareOut, ChatCircleText, ClipboardText, Clock, Coins, Package } from '@phosphor-icons/react';
import { LedaNote, SegmentedControl, cn } from '../../../index';
import { branch, inquiries, partMovements, productOf, type Inquiry, type Job } from '../data';
import { STATUS_SHORT, dayWord, flagOf, hm, reasonOf, serviceTitle, shortName, viewOf } from '../floorModel';
import { NotifyItem } from './NotifyItem';
import { useMech } from '../mechModel';

export type FeedTab = 'needs' | 'inquiries' | 'parts';

export interface FloorFeedProps {
  jobs: Job[];
  /** Ids of inquiries the manager has replied to this session. */
  replied: Record<string, string>;
  /** Rows only inform: opening a row shows the full detail (off-canvas), where every action lives. */
  onOpenJob: (job: Job) => void;
  onOpenInquiry: (q: Inquiry) => void;
  /** Leda's one-line floor read, shown above the needs list. */
  floorRead?: string;
  inventoryDown?: boolean;
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
 * Studio-only FloorFeed (NEW): the default right panel. One ruled list with three tabs: what needs the manager (stuck services),
 * customer inquiries, and parts activity read from Inventory (stock in / out). Rows have no inline actions; a click opens the detail in the off-canvas.
 */
export function FloorFeed({ jobs, replied, onOpenJob, onOpenInquiry, floorRead, inventoryDown, tab: tabProp, onTabChange, headerAction, className }: FloorFeedProps) {
  const [inner, setInner] = useState<FeedTab>('needs');
  const tab = tabProp ?? inner;
  const setTab = (t: FeedTab) => { setInner(t); onTabChange?.(t); };
  const stuck = jobs.filter((j) => reasonOf(j)).sort((a, b) => ORDER.indexOf(reasonOf(a)!) - ORDER.indexOf(reasonOf(b)!));
  const mech = useMech();
  /** From the mechanic app: part requests waiting for an OK and found issues waiting for a quote. */
  const fromMechanics = [
    ...mech.requests.filter((r) => r.status === 'Requested' && /^rq\d{3}/.test(r.id)).map((r) => ({ id: r.id, title: shortName(productOf(r.productId)), time: hm(r.at), detail: `${r.qty} for ${jobs.find((j) => j.id === r.jobId)?.number ?? 'shop use'} · asked by ${r.by.replace('m-', '')}`, tag: 'Part requested' })),
    ...mech.proposals.filter((p) => !p.status).map((p) => ({ id: p.id, title: 'Found issue', time: hm(p.at), detail: `${jobs.find((j) => j.id === p.jobId)?.number ?? ''} · ${p.text}`, tag: 'Needs your quote' })),
  ];
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
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {tab === 'needs' && (
          <section aria-label="Needs you">
            {floorRead && <div className="pb-2 pt-1"><LedaNote byline="Leda · 10:20">{floorRead}</LedaNote></div>}
            {stuck.length === 0 && <p className="py-4 text-[14px] text-muted">Nothing is stuck. Every service is on time.</p>}
            <ul>
              {stuck.map((j) => {
                const r = reasonOf(j)!; const v = viewOf(j); const flag = flagOf(j); const st = STATUS_SHORT[j.status];
                return (
                  <NotifyItem
                    key={j.id} marker={MARK[r].icon} markerTone={MARK[r].tone}
                    title={`${j.number} ${serviceTitle(j)}`} time={j.promisedAt ? dayWord(j.promisedAt) : 'no time'}
                    detail={<>{v.vehicle.replace(/ \d{4}$/, '')} · {v.customer}{flag && <> · <span className={flag.tone === 'bad' ? 'font-medium text-bad' : undefined}>{flag.word}</span></>}</>}
                    tag={st.label} tagTone={j.status === 'FOR_PICKUP' ? 'ok' : j.status === 'FOR_APPROVAL' || j.status === 'PENDING' ? 'warn' : 'neutral'} onOpen={() => onOpenJob(j)}
                  />
                );
              })}
            </ul>
          </section>
        )}
        {tab === 'inquiries' && (
          <section aria-label="Inquiries">
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
        {tab === 'parts' && (
          <section aria-label="Parts activity">
            <div className="flex items-baseline justify-between pb-1 pt-1 text-[12px] text-muted"><span>Today at {branch.name}, from {branch.inventory.platform}</span></div>
            {inventoryDown ? (
              <p className="py-4 text-[14px] text-muted">Can't reach {branch.inventory.platform}. Last movements loaded 10:02.</p>
            ) : (
              <ul>
                {fromMechanics.map((x) => <NotifyItem key={x.id} marker={<Package size={20} />} markerTone="warn" title={x.title} time={x.time} detail={x.detail} tag={x.tag} tagTone="warn" />)}
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
            <a href="#inventory" className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-accent underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Open in {branch.inventory.platform}<ArrowSquareOut size={16} aria-hidden /></a>
          </section>
        )}
      </div>
    </div>
  );
}
