import { useEffect, useMemo, useRef, useState } from 'react';
import { CaretLeft, CaretRight, ClipboardText, Funnel, Gear, List, Plus, Sparkle, Wrench } from '@phosphor-icons/react';
import {
  AccountMenu, AskLedaBar, Button, ConfirmDialog, CountBadge, DetailTopBar, EmptyState, IconRailContent, IconRailFoot, IconRailItem, IconRailMark,
  IconRailSpacer, InventoryStatusBar, Modal, Notice, PlatformShell, SegmentedControl, Select, SheetBar, SheetBarWhere, Skeleton, Toaster, cn, toast,
} from '../index';
import { TODAY, branch, customers, inquiries, jobBalance, jobs as todayJobs, manager, mechanics, peso, productOf, type Inquiry, type Job, type LedaProposalData } from './sms/data';
import { applyOverrides, reasonOf, viewOf, type NextAction, type Overrides } from './sms/floorModel';
import { PaymentScreen, type PaymentOverlay } from './PaymentPage';
import {
  NO_FILTERS, RANGES, SORTS, VIEWS, activeCount, describe, isFiltered, isUnpaid, matches, parseAsk, sortJobs,
  type Filters, type RangeId, type SortId, type ViewId,
} from './sms/servicesModel';
import { allServices } from './sms/scheduleData';
import {
  addDays, bookingOf, calMechanicOptions, calendarEnv, dayNum, dowShort, durLabel, freeMinutes, isClosed, longDay, mechanicById, weekStart,
  type Booking, type CalItem, type Slot,
} from './sms/scheduleModel';
import { useSmsLeda } from './sms/LedaPanel';
import { TodayDialogs, type DialogState } from './sms/TodayDialogs';
import { Offcanvas } from './Offcanvas';
import { LiveInspector as Inspector } from './sms/LiveInspector';
import { InquiryDetail } from './sms/InquiryDetail';
import { CustomerPanel } from './CustomerPanel';
import { CardSkeletons, InfiniteSentinel, ListEnd, ResultCount, scrollTop } from './InfiniteList';
import { useServiceFlow, type FlowState } from './useServiceFlow';
import { FloorSidePanel as SidePanelLayout } from './sms/SidePanel';
import { FloorFeed, type FeedTab } from './sms/FloorFeed';
import { WeekCalendar } from './WeekCalendar';
import { CalendarToolbar, SPAN_DAYS, type Span } from './CalendarToolbar';
import type { PartAction } from './PartChip';
import { SearchBox, ToggleChip } from './ServicesControls';
import { ServiceCard, ServicesTable, type InventoryLink } from './ServicesTable';
import { BulkBar, ServicesToolbar, mechanicOptions } from './ServicesToolbar';

export type Detail =
  | { kind: 'service'; id: string }
  | { kind: 'customer'; id: string }
  | { kind: 'inquiry'; id: string }
  | null;

export type ServicesTab = 'calendar' | 'list';

export interface ServicesProps {
  /** `loading`: skeleton calendar and rows. `first-run`: the branch has no services yet. */
  state?: 'ready' | 'loading' | 'first-run';
  inventory?: InventoryLink;
  /** The tab it opens on. The calendar is the default. */
  initialTab?: ServicesTab;
  /** A date inside the range to show (ISO). Defaults to today. */
  initialDate?: string;
  initialSpan?: Span;
  /** Story helper: the "Needs you" filter starts on. */
  initialNeedsOnly?: boolean;
  initialFilters?: Partial<Filters>;
  initialSort?: SortId;
  /** Batches already loaded minus one (0 = the first 20). */
  initialPage?: number;
  /** Story helper: the next batch is loading (skeleton rows at the bottom) and stays so. */
  initialLoadingMore?: boolean;
  /** Ids ticked on load (bulk bar open). */
  initialSelected?: string[];
  /** Off-canvas on desktop, pushed page on a phone. */
  initialDetail?: Detail;
  /** Story helper: open the New service wizard, or a quotation, on load. */
  initialFlow?: FlowState;
  /** Open on the Payment page of this job (Collect payment). */
  initialPaying?: { jobId: string; overlay?: PaymentOverlay } | null;
  ledaOpen?: boolean;
  /** Desktop: open with the right panel collapsed to its rail. */
  initialPanelCollapsed?: boolean;
  initialFeedTab?: FeedTab;
  /** Phone: open on the updates list (needs you, inquiries, parts). */
  initialPhoneUpdates?: boolean;
  /** Phone: open the Filters sheet. */
  initialPhoneFilters?: boolean;
  /** Phone: start in select mode. */
  initialPhoneSelect?: boolean;
  /** Story helpers: show the vacant-slot hover or a drag selection without a pointer. */
  demoHover?: { date: string; start: number };
  demoSelect?: Slot;
  /** Opened from another page (Requests > Open service): called when the detail is closed, so that page can take over again. */
  onLeaveDetail?: () => void;
}

const PAGE = 20;
const ledaQuestions = ['Show unpaid ready cars', 'Which quotes are still waiting for an OK?', 'What is Jun working on?', 'Who still owes us money?'];
const floorRead = 'Ricky is free from 12:30 and Jun carries 5 active services. JO-0417 could move to Ricky and still make 16:00.';
const todayIds = new Set(todayJobs.map((j) => j.id));

export function ServicesPage({
  state = 'ready', inventory = 'ok', initialTab = 'calendar', initialDate = TODAY, initialSpan = 'week', initialNeedsOnly = false, initialFilters, initialSort = 'attention', initialPage = 0, initialLoadingMore = false,
  initialSelected = [], initialDetail = null, initialFlow = null, ledaOpen = false, initialPanelCollapsed = false, initialFeedTab = 'needs', initialPhoneUpdates = false,
  initialPhoneFilters = false, initialPhoneSelect = false, demoHover, demoSelect, initialPaying = null, onLeaveDetail,
}: ServicesProps) {
  const [tab, setTab] = useState<ServicesTab>(initialTab);
  const [phoneUpdates, setPhoneUpdates] = useState(initialPhoneUpdates);
  const [anchor, setAnchor] = useState(initialDate);
  const [span, setSpan] = useState<Span>(initialSpan);
  /** The range a day was opened from (a week or 3 days), so "Back" restores exactly that. */
  const [back, setBack] = useState<{ span: Span; anchor: string } | null>(null);
  const [needsOnly, setNeedsOnly] = useState(initialNeedsOnly);
  const [f, setF] = useState<Filters>({ ...NO_FILTERS, ...initialFilters });
  const [sort, setSort] = useState<SortId>(initialSort);
  /** Infinite list: how many rows are loaded (20 at a time) and whether the next batch is on its way. */
  const [count, setCount] = useState((initialPage + 1) * PAGE);
  const [more, setMore] = useState(initialLoadingMore);
  const moreTimer = useRef<number | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => window.clearTimeout(moreTimer.current), []);
  /** A new filter or sort starts the list again from the top and from the first 20. */
  const resetList = () => { window.clearTimeout(moreTimer.current); setMore(false); setCount(PAGE); scrollTop(listRef); scrollTop(phoneRef); };
  const [sel, setSel] = useState<Set<string>>(new Set(initialSelected));
  const [detail, setDetail] = useState<Detail>(initialDetail);
  const [ov, setOv] = useState<Overrides>({});
  const [paying, setPaying] = useState<string | null>(initialPaying?.jobId ?? null);
  const [added, setAdded] = useState<Job[]>([]);
  const [slots, setSlots] = useState<Record<string, Booking>>({});
  const [flash, setFlash] = useState<string | null>(null);
  const [replied, setReplied] = useState<Record<string, string>>({});
  const [panelOpen, setPanelOpen] = useState(!initialPanelCollapsed);
  const [feedTab, setFeedTab] = useState<FeedTab>(initialFeedTab);
  const [prop, setProp] = useState<Record<string, 'waiting' | 'writing' | 'done' | 'discarded'>>({});
  const [dialog, setDialog] = useState<DialogState>(null);
  const [confirm, setConfirm] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(initialPhoneFilters);
  const [selectMode, setSelectMode] = useState(initialPhoneSelect || initialSelected.length > 0);

  const pool = useMemo(() => applyOverrides(ov, state === 'first-run' ? [] : [...allServices, ...added]), [ov, state, added]);
  const panelJobs = useMemo(() => pool.filter((j) => todayIds.has(j.id)), [pool]);
  const patch = (p: Partial<Filters>) => { setF((x) => ({ ...x, ...p })); resetList(); };
  const clear = () => { setF(NO_FILTERS); resetList(); };
  const rows = useMemo(() => sortJobs(pool.filter((j) => matches(j, f)), sort), [pool, f, sort]);
  const counts = useMemo(() => Object.fromEntries(VIEWS.map((v) => [v.id, pool.filter((j) => matches(j, { ...f, view: v.id })).length])) as Record<ViewId, number>, [pool, f]);
  const waiting = panelJobs.filter((j) => reasonOf(j)).length;
  const unpaidSum = rows.filter((j) => isUnpaid(j)).reduce((a, j) => a + jobBalance(j), 0);
  const pageRows = rows.slice(0, count);
  const hasMore = pageRows.length < rows.length;
  const loadMore = () => {
    if (more || !hasMore) return;
    setMore(true);
    moreTimer.current = window.setTimeout(() => { setCount((c) => c + PAGE); setMore(false); }, 600);
  };
  const selected = pool.filter((j) => sel.has(j.id));
  const loading = state === 'loading';

  // ---- calendar model ----
  const step = SPAN_DAYS[span];
  const days = useMemo(() => (span === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(weekStart(anchor), i)) : Array.from({ length: step }, (_, i) => addDays(anchor, i))), [span, anchor, step]);
  const allItems = useMemo<CalItem[]>(() => pool.flatMap((j) => {
    const b = slots[j.id] ?? bookingOf(j);
    return b ? [{ job: j, date: b.date, start: b.start, end: b.start + b.dur }] : [];
  }), [pool, slots]);
  const flow = useServiceFlow({
    count: added.length, items: allItems, find: (id) => pool.find((j) => j.id === id), initial: initialFlow,
    add: (job, b) => { setAdded((a) => [...a, job]); setSlots((x) => ({ ...x, [job.id]: b })); },
    patch: (id, p, b) => { if (added.some((x) => x.id === id)) setAdded((a) => a.map((x) => (x.id === id ? { ...x, ...p } : x))); else set(id, p as Overrides[string]); if (b) setSlots((x) => ({ ...x, [id]: b })); },
    remove: (id) => { setAdded((a) => a.filter((x) => x.id !== id)); setFlash(null); },
    after: (date, id) => { setAnchor(date); setFlash(id); setDetail(null); },
  });
  const items = useMemo(() => allItems.filter((i) => f.mechanic === 'any' || (f.mechanic === 'none' ? !i.job.assigneeId : i.job.assigneeId === f.mechanic)), [allItems, f.mechanic]);
  const dimmed = useMemo(() => (f.q.trim() ? new Set(pool.filter((j) => !matches(j, { ...NO_FILTERS, q: f.q })).map((j) => j.id)) : undefined), [pool, f.q]);
  const mechanicId = f.mechanic !== 'any' && f.mechanic !== 'none' ? f.mechanic : null;
  const freeLabel = (date: string): string | null => {
    const m = mechanicById(mechanicId);
    if (m) {
      if (isClosed(date) || date < TODAY) return null;
      const free = freeMinutes(allItems, m, date, 10 * 60 + 20);
      return free === 0 ? `${m.short} is full` : `${m.short} free ${durLabel(free)}`;
    }
    const n = allItems.filter((i) => i.date === date).length;
    return n >= 12 ? `${n} services · full day` : null;
  };
  const unscheduled = pool.filter((j) => !j.promisedAt && j.status !== 'COMPLETED');
  const goto = (d: number) => { setBack(null); setAnchor((a) => addDays(a, d)); };
  const changeSpan = (s: Span) => { setBack(null); setSpan(s); };
  const pickDay = (d: string) => { if (span !== 'day') setBack({ span, anchor }); setAnchor(d); setSpan('day'); };
  const backToRange = () => { if (!back) return; setSpan(back.span); setAnchor(back.anchor); setBack(null); };
  const needsCount = useMemo(() => items.filter((i) => reasonOf(i.job)).length, [items]);
  useEffect(() => { if (!flash) return; const t = window.setTimeout(() => setFlash(null), 3500); return () => window.clearTimeout(t); }, [flash]);

  const set = (id: string, p: Overrides[string]) => setOv((o) => ({ ...o, [id]: { ...o[id], ...p } }));
  const undo = (id: string, keys: (keyof Overrides[string])[]) => setOv((o) => { const n = { ...o[id] }; keys.forEach((k) => delete n[k]); return { ...o, [id]: n }; });
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = (on: boolean) => setSel((s) => { const n = new Set(s); pageRows.forEach((r) => (on ? n.add(r.id) : n.delete(r.id))); return n; });
  const selectEvery = () => setSel(new Set(rows.map((r) => r.id)));
  const loadedAll = pageRows.length > 0 && pageRows.every((r) => sel.has(r.id));
  /** One detail at a time, in the same off-canvas: it covers the panel and never resets it. */
  const open = (j: Job) => setDetail({ kind: 'service', id: j.id });
  const openCustomer = (j: Job) => setDetail({ kind: 'customer', id: j.customerId });
  const openInquiry = (q: Inquiry) => setDetail({ kind: 'inquiry', id: q.id });
  const bookSlot = (slot: Slot) => flow.openNew({ slot });
  const close = () => { setDetail(null); onLeaveDetail?.(); };

  const act = (job: Job, a: NextAction) => {
    if (a.pay) { setPaying(job.id); return; }
    const keys = Object.keys(a.to) as (keyof Overrides[string])[];
    set(job.id, a.to as Overrides[string]);
    toast.undo(a.toast, () => undo(job.id, keys));
  };
  const assign = (job: Job, id: string) => {
    const prev = job.assigneeId;
    if (prev === id) return;
    set(job.id, { assigneeId: id });
    toast.undo(`${job.number} moved to ${mechanics.find((m) => m.id === id)?.short}.`, () => set(job.id, { assigneeId: prev }));
  };
  const resolve = (job: Job, action: PartAction, productId: string) => {
    const product = productOf(productId);
    if (action === 'order') { toast.undo(`${product.name.split(',')[0]} added to the Kapitolyo order list.`, () => undefined); return; }
    setDialog({ kind: action === 'transfer' ? 'transfer' : 'eta', job, product });
  };
  const confirmProposal = (p: LedaProposalData) => {
    setProp((s) => ({ ...s, [p.id]: 'writing' }));
    window.setTimeout(() => {
      setProp((s) => ({ ...s, [p.id]: 'done' }));
      if (p.id === 'lp2') assign(pool.find((x) => x.id === 'j0417')!, 'm-ricky');
      else toast.undo(`${p.confirmLabel}: done.`, () => setProp((s) => ({ ...s, [p.id]: 'waiting' })));
    }, 500);
  };
  const discardProposal = (p: LedaProposalData) => { setProp((s) => ({ ...s, [p.id]: 'discarded' })); toast.undo('Draft discarded.', () => setProp((s) => ({ ...s, [p.id]: 'waiting' }))); };
  const reply = (q: Inquiry) => { setReplied((r) => ({ ...r, [q.id]: '10:20' })); toast.undo(`Reply to ${q.name} sent.`, () => setReplied((r) => { const n = { ...r }; delete n[q.id]; return n; })); };
  const newFromInquiry = (q: Inquiry) => { const c = customers.find((x) => x.name === q.name); flow.openNew({ customerId: c?.id, plate: c ? undefined : q.name, notes: q.text }); };
  const inspectorProps = { inventoryDown: inventory === 'down', proposalState: prop, onConfirmProposal: confirmProposal, onDiscardProposal: discardProposal, onAction: act, onAssign: assign, onResolve: resolve, onViewQuote: flow.viewQuote, onBookQuote: flow.bookQuote, onEditQuote: flow.editQuote, backLabel: 'Services', floorRead };

  const exportCsv = (n: number) => toast.info(`${n} ${n === 1 ? 'service' : 'services'} exported to CSV.`);
  const remindees = selected.filter((j) => j.status === 'FOR_APPROVAL');
  const bulkAssign = (mid: string) => {
    const targets = selected.filter((j) => j.status !== 'COMPLETED' && j.assigneeId !== mid);
    const before = targets.map((j) => [j.id, j.assigneeId] as const);
    targets.forEach((j) => set(j.id, { assigneeId: mid }));
    toast.undo(`${targets.length} ${targets.length === 1 ? 'service' : 'services'} moved to ${mechanics.find((m) => m.id === mid)?.short}.`, () => before.forEach(([id, prev]) => set(id, { assigneeId: prev })));
  };

  /** Leda reads a list question into filters and says what she did; "clear" undoes it. */
  const leda = useSmsLeda({
    scope: 'Services', chips: ledaQuestions, startOpen: ledaOpen,
    handle: (q) => {
      const t = q.toLowerCase();
      if (/^(clear|reset|show all)/.test(t)) { clear(); return [{ type: 'text', text: 'Filters cleared. Showing every service.', stream: true }]; }
      if (/remind|send|move|get the|record|transfer/.test(t)) return null;
      const p = parseAsk(q);
      if (!p) return null;
      const next = { ...NO_FILTERS, ...p };
      const n = pool.filter((j) => matches(j, next)).length;
      setF(next); resetList(); setTab('list'); setPhoneUpdates(false);
      return [
        { type: 'text', text: n === 0 ? `Nothing matches ${describe(next).join(', ')}.` : `${n} ${n === 1 ? 'service matches' : 'services match'}: ${describe(next).join(', ')}. The List tab is filtered; nothing was changed.`, stream: true },
        { type: 'meta', text: 'Read from Services and Parts Stockroom, 10:20' },
        { type: 'chips', chips: [{ id: 'cl', label: 'Clear filters' }] },
      ];
    },
  });

  const platform = { name: branch.name, initials: 'DC' };
  const rail = (
    <IconRailContent>
      <IconRailMark href="#portal" label="Back to the ReadyPH Portal" />
      <IconRailItem icon={Wrench} label="Today" href="#today" />
      <IconRailItem icon={ClipboardText} label="Services" href="#services" current />
      <IconRailItem icon={Gear} label="Settings" href="#settings" />
      <IconRailSpacer />
      <IconRailFoot><AccountMenu name={manager.name} email="mon@delacruzauto.example" role="Branch manager" initials={manager.initials} applyToDocument={false} /></IconRailFoot>
    </IconRailContent>
  );
  const navTab = 'relative flex min-h-11 flex-col items-center justify-center gap-[3px] text-tiny text-muted';
  const phoneNav = (
    <div className="grid h-[60px] w-full grid-cols-5 items-stretch">
      <a href="#today" className={navTab}><Wrench size={20} aria-hidden />Today<CountBadge count={waiting} placement="tab" /></a>
      <a href="#services" aria-current="page" className={cn(navTab, 'font-medium text-text')}><ClipboardText size={20} aria-hidden />Services</a>
      <button type="button" onClick={() => flow.openNew()} className={navTab}><Plus size={20} aria-hidden />New</button>
      <button type="button" onClick={leda.openChat} className={navTab}><Sparkle size={20} aria-hidden />Leda</button>
      <button type="button" className={navTab}><List size={20} aria-hidden />More</button>
    </div>
  );

  const customer = detail?.kind === 'customer' ? customers.find((c) => c.id === detail.id) ?? null : null;
  const service = detail?.kind === 'service' ? pool.find((j) => j.id === detail.id) ?? null : null;
  const inquiry = detail?.kind === 'inquiry' ? (inquiries.find((q) => q.id === detail.id) ?? null) : null;
  const heldSlot = flow.slot;
  const detailLabel = service ? `Service ${service.number}` : customer ? `Customer ${customer.name}` : inquiry ? `Inquiry from ${inquiry.name}` : 'New service';
  const inquiryBody = inquiry && (
    <InquiryDetail inquiry={inquiry} repliedAt={replied[inquiry.id]} job={inquiry.jobId ? pool.find((j) => j.id === inquiry.jobId) : null} onReply={reply} onNewService={newFromInquiry} onOpenJob={open} onClose={close} />
  );
  const detailBody = (asPage: boolean) => {
    const common = { asPage, onBack: close, onClose: close };
    if (service) return <Inspector job={service} {...inspectorProps} {...common} className="min-h-full" />;
    if (customer) return <CustomerPanel customer={customer} pool={pool} onOpenService={open} onNewService={(c) => flow.openNew({ customerId: c.id })} {...common} className="min-h-full" />;
    if (inquiryBody) return inquiryBody;
    return null;
  };
  /** Off-canvas (desktop) covers inquiries too; a phone pushes a page for these, and shows an inquiry as a full-screen sheet like Today. */
  const detailOpen = !!(service || customer || inquiry);
  const pageOpen = !!(service || customer);

  const empty = state === 'first-run' ? (
    <EmptyState title="No services yet" description="Take the first car in. Every service you start lives here, from quote to pick-up." action={<Button variant="primary" leftIcon={Plus} onClick={() => flow.openNew()}>New service</Button>} />
  ) : rows.length === 0 && !loading ? (
    <EmptyState
      title={f.q.trim() ? `No service matches "${f.q.trim()}"` : 'No services match these filters'}
      description={f.q.trim() ? 'Check the plate or number for a typo, or clear the filters. If this car has not been here, start its service now.' : `Nothing in ${describe(f).join(', ')}. Clear a filter to widen the list.`}
      action={<span className="flex flex-wrap justify-center gap-2"><Button variant="secondary" onClick={clear}>Clear filters</Button>{f.q.trim() && <Button variant="primary" leftIcon={Plus} onClick={() => flow.openNew({ plate: f.q.trim() })}>New service for {f.q.trim()}</Button>}</span>}
    />
  ) : null;

  const invNotice = inventory !== 'ok' && (
    <div className="px-6 pt-3 max-[640px]:px-4">
      <Notice tone="warn" title={inventory === 'down' ? 'Parts stock is not loading' : 'Parts stock is slow'} action={<Button variant="secondary">Try again</Button>}>
        {inventory === 'down' ? `${branch.inventory.platform} did not answer (last synced 10:02). Parts show what each service needs, not what is in stock. Everything else is current.` : `Stock words come from the 10:02 sync of ${branch.inventory.platform}.`}
      </Notice>
    </div>
  );

  const bulk = selected.length > 0 && (
    <BulkBar selected={selected} onClear={() => { setSel(new Set()); setSelectMode(false); }} onRemind={() => setConfirm(true)} onAssign={bulkAssign} onExport={() => exportCsv(selected.length)} />
  );

  const selectBanner = loadedAll && (
    <div role="status" className="flex flex-none flex-wrap items-center gap-x-2 border-b border-rule bg-accent-tint px-4 py-1.5 text-[13px] text-text min-[641px]:px-6">
      {sel.size >= rows.length
        ? <>All {rows.length} {rows.length === 1 ? 'service is' : 'services are'} selected.</>
        : <>All {pageRows.length} loaded selected.</>}
      {sel.size < rows.length && <button type="button" onClick={selectEvery} className="min-h-8 font-semibold text-accent underline max-[640px]:min-h-11">Select all {rows.length}</button>}
      <button type="button" onClick={() => { setSel(new Set()); setSelectMode(false); }} className="min-h-8 font-semibold text-accent underline max-[640px]:min-h-11">Clear selection</button>
    </div>
  );

  const calendar = (
    <WeekCalendar
      env={calendarEnv} view={viewOf} mechanics={mechanics} days={days} items={items} selectedId={service?.id} flashId={flash} dimmed={dimmed} needsOnly={needsOnly} mechanicId={mechanicId} freeLabel={freeLabel}
      onOpen={open} onBook={bookSlot} onPickDay={pickDay} state={loading ? 'loading' : 'ready'} demoHover={demoHover} demoSelect={demoSelect} held={heldSlot}
    />
  );

  const calendarArea = (
    <>
      <CalendarToolbar
        days={days} span={span} onSpan={changeSpan} onPrev={() => goto(-step)} onNext={() => goto(step)} onToday={() => { setBack(null); setAnchor(TODAY); }} onJump={(d) => { setBack(null); setAnchor(d); }}
        needsCount={needsCount} needsOnly={needsOnly} onNeedsOnly={setNeedsOnly} backLabel={back ? `Back to ${back.span === 'week' ? 'week' : '3 days'}` : undefined} onBack={back ? backToRange : undefined}
        q={f.q} onQ={(q) => patch({ q })} mechanic={f.mechanic} mechanicOptions={calMechanicOptions()} onMechanic={(mechanic) => patch({ mechanic })} unscheduled={unscheduled} onOpen={open}
      />
      {invNotice}
      {calendar}
    </>
  );

  const listArea = empty && state === 'first-run' ? <div className="min-h-0 flex-1 overflow-auto p-pad">{empty}</div> : (
    <>
      <ServicesToolbar f={f} onChange={patch} sort={sort} onSort={(s) => { setSort(s); resetList(); }} counts={counts} results={rows.length} unpaidTotal={unpaidSum > 0 ? peso(unpaidSum) : null} onClear={clear} onExport={() => exportCsv(rows.length)} disabled={loading} />
      {invNotice}
      {bulk}
      {selectBanner}
      <div ref={listRef} className="min-h-0 flex-1 overflow-auto">
        {empty ? <div className="p-pad">{empty}</div> : (
          <>
            <ServicesTable rows={pageRows} loading={loading} loadingMore={more} inventory={inventory} selected={sel} onToggle={toggle} onToggleAll={toggleAll} openId={service?.id} onOpen={open} onOpenCustomer={openCustomer} onViewQuote={flow.viewQuote} />
            {!loading && <InfiniteSentinel hasMore={hasMore} loading={more} onLoadMore={loadMore} />}
            {!loading && !hasMore && <ListEnd total={rows.length} />}
          </>
        )}
      </div>
      {!empty && !loading && <ResultCount shown={pageRows.length} total={rows.length} loadingMore={more} />}
    </>
  );

  const desktop = (
    <div className="relative h-full overflow-hidden max-[640px]:hidden">
      <SidePanelLayout
        open={panelOpen} onOpenChange={setPanelOpen} jobs={panelJobs} replied={replied} tab={feedTab} onTabChange={setFeedTab}
        onOpenJob={open} onOpenInquiry={openInquiry} floorRead={floorRead} inventoryDown={inventory === 'down'} detailOpen={detailOpen} loading={loading}
      >
        {tab === 'calendar' ? calendarArea : listArea}
      </SidePanelLayout>
      <Offcanvas open={detailOpen} onClose={close} label={detailLabel}>{detailBody(false)}</Offcanvas>
    </div>
  );

  // ---- phone ----
  const nActive = activeCount(f);
  const shown = pageRows;
  const phoneList = (
    <>
      <div className="space-y-2 px-4 pb-2 pt-1">
        <SearchBox value={f.q} onChange={(q) => patch({ q })} />
        <div className="overflow-x-auto pb-1">
          <SegmentedControl size="md" aria-label="Saved views" value={f.view} onChange={(v) => patch({ view: v as ViewId })} options={VIEWS.map((v) => ({ value: v.id, label: v.label, count: counts[v.id] }))} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={Funnel} onClick={() => setFiltersOpen(true)}>Filters{nActive ? ` (${nActive})` : ''}</Button>
          <Button variant="secondary" onClick={() => { setSelectMode((m) => !m); if (selectMode) setSel(new Set()); }}>{selectMode ? 'Done' : 'Select'}</Button>
          <span className="flex-1 text-right text-[13px] tabular-nums text-muted">{loading || empty ? rows.length : `Showing ${shown.length} of ${rows.length}`} {rows.length === 1 ? 'service' : 'services'}{unpaidSum > 0 ? ` · ${peso(unpaidSum)} unpaid` : ''}</span>
        </div>
        {isFiltered(f) && describe(f).length > 0 && <p className="text-[13px] text-muted">{describe(f).join(' · ')} <button type="button" onClick={clear} className="ml-1 min-h-11 font-semibold text-accent underline">Clear</button></p>}
      </div>
      {invNotice}
      {selectMode && bulk}
      {selectMode && selectBanner}
      <div ref={phoneRef} className="px-4 pb-6">
        {loading ? <div className="space-y-4 py-2"><Skeleton variant="text" lines={3} /><Skeleton variant="text" lines={3} /><Skeleton variant="text" lines={3} /></div>
          : empty ? empty
            : shown.map((j) => <ServiceCard key={j.id} job={j} inventory={inventory} onOpen={open} selectMode={selectMode} checked={sel.has(j.id)} onToggle={toggle} />)}
        {more && !loading && <CardSkeletons />}
        {!loading && !empty && <InfiniteSentinel hasMore={hasMore} loading={more} onLoadMore={loadMore} />}
        {!loading && !empty && !hasMore && <ListEnd total={rows.length} />}
      </div>
    </>
  );

  const strip = Array.from({ length: 7 }, (_, i) => addDays(weekStart(anchor), i));
  const stripBtn = 'inline-flex size-11 flex-none items-center justify-center rounded-control text-muted hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';
  const phoneCalendar = (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex flex-none items-center gap-1 px-2">
        <button type="button" aria-label="Previous week" onClick={() => goto(-7)} className={stripBtn}><CaretLeft size={18} aria-hidden /></button>
        <div role="group" aria-label="Pick a day" className="grid min-w-0 flex-1 grid-cols-7 gap-1">
          {strip.map((d) => {
            const on = d === anchor; const today = d === TODAY; const closed = isClosed(d);
            return (
              <button key={d} type="button" aria-pressed={on} aria-label={`${longDay(d)}${today ? ', today' : ''}${closed ? ', closed' : ''}`} onClick={() => setAnchor(d)}
                className={cn('flex min-h-11 flex-col items-center justify-center rounded-control text-[12px] leading-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent', on ? 'bg-accent text-accent-ink' : closed ? 'bg-raised text-muted' : 'text-text hover:bg-raised')}>
                <span className={cn(!on && 'text-muted')}>{dowShort(d).slice(0, 3)}</span>
                <span className="text-[15px] font-semibold tabular-nums">{dayNum(d)}</span>
                <span aria-hidden className={cn('mt-0.5 h-0.5 w-3 rounded-full', today ? (on ? 'bg-accent-ink' : 'bg-accent') : 'bg-transparent')} />
              </button>
            );
          })}
        </div>
        <button type="button" aria-label="Next week" onClick={() => goto(7)} className={stripBtn}><CaretRight size={18} aria-hidden /></button>
      </div>
      <div className="flex flex-none items-center gap-2 px-4 pb-2 pt-1">
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold tabular-nums" aria-live="polite">{longDay(anchor)}</p>
        <Select size="sm" aria-label="Mechanic" className="w-[150px]" value={f.mechanic} onValueChange={(mechanic) => patch({ mechanic })} options={calMechanicOptions()} />
        {anchor !== TODAY && <Button variant="secondary" onClick={() => setAnchor(TODAY)}>Today</Button>}
      </div>
      <WeekCalendar
        phone env={calendarEnv} view={viewOf} mechanics={mechanics} days={[anchor]} items={items} selectedId={service?.id} flashId={flash} dimmed={dimmed} needsOnly={needsOnly} mechanicId={mechanicId} freeLabel={freeLabel}
        onOpen={open} onBook={bookSlot} state={loading ? 'loading' : 'ready'} held={heldSlot}
      />
      <Button variant="primary" leftIcon={Plus} className="absolute bottom-4 right-4 z-[5] shadow-float" onClick={() => flow.openNew()}>New service</Button>
    </div>
  );

  const phoneView = phoneUpdates ? 'updates' : tab;
  const phone = (
    <div className="hidden h-full max-[640px]:flex max-[640px]:flex-col">
      {pageOpen ? <div className="min-h-0 flex-1 overflow-auto">{detailBody(true)}</div> : (
        <>
          <div className="flex-none px-4 pb-2 pt-3">
            <SegmentedControl size="md" aria-label="Services view" value={phoneView} onChange={(v) => { if (v === 'updates') setPhoneUpdates(true); else { setPhoneUpdates(false); setTab(v as ServicesTab); } }}
              options={[{ value: 'calendar', label: 'Calendar' }, { value: 'list', label: 'List' }, { value: 'updates', label: 'Updates', count: waiting + ['iq1', 'iq2', 'iq4'].filter((id) => !replied[id]).length }]} />
          </div>
          {phoneUpdates ? <div className="min-h-0 flex-1 overflow-auto"><FloorFeed jobs={panelJobs} replied={replied} inventoryDown={inventory === 'down'} onOpenJob={open} onOpenInquiry={openInquiry} floorRead={floorRead} tab={feedTab} onTabChange={setFeedTab} className="min-h-[60vh]" /></div>
            : tab === 'calendar' ? phoneCalendar
              : <div className="min-h-0 flex-1 overflow-auto">{state === 'first-run' ? <div className="p-pad">{empty}</div> : phoneList}</div>}
        </>
      )}
    </div>
  );

  const phoneTitle = service ? service.number : customer ? customer.name : 'New service';
  const topBar = pageOpen ? undefined : (
    <>
      <span className="flex-none whitespace-nowrap text-[15px] font-semibold">Services</span>
      <span className="min-w-0 truncate text-[13px] text-muted">· {branch.name}</span>
      <span className="flex-1" />
      <AskLedaBar variant="bar" scope="Services" shortcuts={false} paused={leda.paused} onOpen={leda.openPalette} />
      <span className="contents [&>button]:size-11"><AccountMenu name={manager.name} email="mon@delacruzauto.example" role="Branch manager" initials={manager.initials} applyToDocument={false} /></span>
    </>
  );

  const payingJob = paying ? pool.find((j) => j.id === paying) : null;
  if (payingJob) return <PaymentScreen job={payingJob} backLabel="Services" initialOverlay={initialPaying?.overlay} onBack={() => setPaying(null)} onChange={(p) => set(payingJob.id, p as Overrides[string])} />;

  return (
    <>
      <PlatformShell
        railWidth="wide" railLabel="Shop" rail={rail}
        topBar={pageOpen ? <DetailTopBar back={<button type="button" onClick={close} className="min-h-11 text-[14px] font-semibold">Services</button>} title={phoneTitle} ledaScope={phoneTitle} /> : topBar}
        phoneNav={pageOpen ? undefined : phoneNav}
        detail={pageOpen}
        heading="Services"
        hideSheetBarOnPhone
        sheetBar={
          <SheetBar wrapChildren={false} actionsFirst={false} actions={<><Button variant="primary" leftIcon={Plus} onClick={() => flow.openNew()}>New service</Button><AskLedaBar variant="bar" scope="Services" paused={leda.paused} onOpen={leda.openPalette} /></>}>
            <SheetBarWhere platform={platform} page="Services" />
            <SegmentedControl size="sm" aria-label="Services view" className="ml-4" value={tab} onChange={(v) => setTab(v as ServicesTab)} options={[{ value: 'calendar', label: 'Calendar' }, { value: 'list', label: 'List' }]} />
          </SheetBar>
        }
        statusLabel="Status"
        status={
          <InventoryStatusBar
            platform={platform}
            dataLink={{ with: branch.inventory.platform, status: inventory === 'ok' ? 'linked' : 'slow', since: inventory === 'ok' ? '10:18' : '10:02' }}
            viewer={{ name: 'Mon', role: 'Branch manager' }}
            leda={{ canDecide: true, managerName: 'Mon' }}
            updatedAt="10:20"
          />
        }
      >
        {desktop}
        {phone}
        <Offcanvas fullScreen open={!!inquiry} onClose={close} label={inquiry ? `Inquiry from ${inquiry.name}` : 'Inquiry'} className="min-[641px]:hidden">{inquiryBody}</Offcanvas>
      </PlatformShell>

      <Modal
        open={filtersOpen} onOpenChange={setFiltersOpen} title="Filters" size="sm"
        footer={<><Button variant="text" onClick={() => { clear(); }}>Clear</Button><Button variant="primary" onClick={() => setFiltersOpen(false)}>Show {rows.length} {rows.length === 1 ? 'service' : 'services'}</Button></>}
      >
        <div className="space-y-4">
          <div><span id="fm-mech" className="mb-1 block text-ui font-medium">Mechanic</span><Select aria-labelledby="fm-mech" value={f.mechanic} onValueChange={(mechanic) => patch({ mechanic })} options={mechanicOptions()} /></div>
          <div><span id="fm-upd" className="mb-1 block text-ui font-medium">Updated</span><Select aria-labelledby="fm-upd" value={f.range} onValueChange={(range) => patch({ range: range as RangeId })} options={RANGES.map((r) => ({ value: r.id, label: r.label }))} /></div>
          <div><span id="fm-sort" className="mb-1 block text-ui font-medium">Sort by</span><Select aria-labelledby="fm-sort" value={sort} onValueChange={(s) => { setSort(s as SortId); resetList(); }} options={SORTS.map((s) => ({ value: s.id, label: s.label }))} /></div>
          <div className="flex flex-wrap gap-2"><ToggleChip pressed={f.unpaid} onChange={(unpaid) => patch({ unpaid })}>Unpaid</ToggleChip><ToggleChip pressed={f.parts} onChange={(parts) => patch({ parts })}>Waiting on parts</ToggleChip></div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm} onOpenChange={setConfirm} title={`Send quote reminders to ${remindees.length} ${remindees.length === 1 ? 'customer' : 'customers'}?`}
        description={`A text goes from ${branch.name} to each customer below.${selected.length > remindees.length ? ` ${selected.length - remindees.length} selected ${selected.length - remindees.length === 1 ? 'service is' : 'services are'} not awaiting an OK and ${selected.length - remindees.length === 1 ? 'is' : 'are'} skipped.` : ''}`}
        name={remindees.map((j) => viewOf(j).customer).join(', ')}
        confirmLabel="Send reminders" cancelLabel="Cancel"
        onCancel={() => setConfirm(false)}
        onConfirm={() => { setConfirm(false); toast.undo(`${remindees.length} quote ${remindees.length === 1 ? 'reminder' : 'reminders'} sent.`, () => undefined); setSel(new Set()); }}
      />
      <TodayDialogs
        dialog={dialog} onClose={() => setDialog(null)}
        onTransfer={(j) => { set(j.id, { pendingNote: 'Transfer requested, expected 12:30' }); toast.undo(`Transfer requested for ${j.number}.`, () => undo(j.id, ['pendingNote'])); }}
        onEta={(j, _p, time) => { set(j.id, { pendingNote: `Expected ${time}` }); toast.undo(`${j.number} expected at ${time}.`, () => undo(j.id, ['pendingNote'])); }}
      />
      {leda.node}
      {flow.node}
      <Toaster />
    </>
  );
}

