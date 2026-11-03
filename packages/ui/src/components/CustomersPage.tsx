import { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardText, Gear, List, Plus, Sparkle, UsersThree, Wrench } from '@phosphor-icons/react';
import {
  AccountMenu, AskLedaBar, Button, CountBadge, DetailTopBar, EmptyState, Fact, FactsLine, IconRailContent, IconRailFoot, IconRailItem, IconRailMark,
  IconRailSpacer, InventoryStatusBar, Modal, Notice, PlatformShell, SegmentedControl, Select, SheetBar, SheetBarWhere, Skeleton, Textarea, Toaster, cn, toast,
} from '../index';
import { NOW, branch, customers, inquiries, jobs as todayJobs, manager, mechanics, peso, productOf, type Customer, type Inquiry, type Vehicle, type Job, type LedaProposalData } from './sms/data';
import { extraHistory, profileOf } from './sms/customerExtras';
import { applyOverrides, reasonOf, type NextAction, type Overrides } from './sms/floorModel';
import { allServices } from './sms/scheduleData';
import {
  SEED_NOTES, SORTS, VIEWS, inView, looksLikePlate, matchesQuery, platePretty, draftToCar, recOf, sortRecs, type CustomerRec, type CarDraft, type Draft, type SortId, type ViewId,
} from './sms/customersModel';
import { useSmsLeda } from './sms/LedaPanel';
import { TodayDialogs, type DialogState } from './sms/TodayDialogs';
import { Offcanvas } from './Offcanvas';
import { Inspector } from './Inspector';
import { TrackingLink } from './TrackingLink';
import { InquiryDetail } from './InquiryDetail';
import { CustomerPage, type StatusId } from './CustomerPage';
import { CustomerSheet } from './CustomerSheet';
import { CarSheet } from './CarSheet';
import { CustomerCard, CustomersTable } from './CustomersTable';
import { CardSkeletons, InfiniteSentinel, ListEnd, ResultCount, scrollTop } from './InfiniteList';
import { useServiceFlow, type FlowState } from './useServiceFlow';
import { FloorSidePanel as SidePanelLayout } from './sms/SidePanel';
import { type FeedTab } from './sms/FloorFeed';
import type { PartAction } from './PartChip';
import { SearchBox, ToggleChip } from './ServicesControls';
import type { InventoryLink } from './ServicesTable';

export type CustomerDetailState =
  /** Opens the Customer detail page (not an off-canvas). */
  | { kind: 'customer'; id: string; car?: string; status?: StatusId }
  | { kind: 'edit'; id?: string; seed?: string }
  /** Add a car to a customer, or edit one (vehicleId). */
  | { kind: 'car'; customerId: string; vehicleId?: string }
  | { kind: 'service'; id: string; from?: string }
  | { kind: 'inquiry'; id: string }
  | null;

export interface CustomersProps {
  /** `loading`: skeleton rows. `first-run`: no customers yet. `error`: the list did not load. */
  state?: 'ready' | 'loading' | 'first-run' | 'error';
  inventory?: InventoryLink;
  initialQuery?: string;
  initialView?: ViewId;
  initialSort?: SortId;
  /** Batches loaded minus one (0 = the first 10). */
  initialPage?: number;
  /** The next batch is loading and stays so. */
  initialLoadingMore?: boolean;
  initialDetail?: CustomerDetailState;
  /** Open the Remove car confirmation for this vehicle on the Customer page. */
  initialRemoveCar?: string;
  /** Open on the Customer detail page (with an optional car and status filter); initialDetail then opens on top of it. */
  initialCustomer?: { id: string; car?: string; status?: StatusId };
  ledaOpen?: boolean;
  initialPanelCollapsed?: boolean;
  initialFeedTab?: FeedTab;
  /** Open the Text dialog on load. */
  initialText?: string;
  /** Story helper: open the New service wizard, or a quotation, on load. */
  initialFlow?: FlowState;
}

const PAGE = 10;
const customerQuestions = ['What is due on their cars?', 'What do they owe?', 'What is open now?'];
const STATUS_LABEL: Record<Job['status'], string> = { QUOTATION: 'quote draft', FOR_APPROVAL: 'awaiting OK', TODO: 'to-do', IN_PROGRESS: 'working', PENDING: 'on hold', FOR_PICKUP: 'ready', COMPLETED: 'done' };
const ledaQuestions = ['Who owns NBC 4521?', 'Which customers owe us money?', 'Who has not visited in 30 days?', 'Find 0917 803 2214'];
const floorRead = 'Ricky is free from 12:30 and Jun carries 5 active services. JO-0417 could move to Ricky and still make 16:00.';
const todayIds = new Set(todayJobs.map((j) => j.id));
const TEMPLATES = [
  { id: 'ready', label: 'Ready for pick-up', text: (n: string) => `Hi ${n}, your car is ready for pick-up at ${branch.name}. We close at 5:30 PM. Thank you!` },
  { id: 'quote', label: 'Quote reminder', text: (n: string) => `Hi ${n}, a reminder about the quote we sent you. Reply OK and we will start right away.` },
  { id: 'blank', label: 'Blank', text: (n: string) => `Hi ${n}, this is ${branch.name}. ` },
];

export function CustomersPage({
  state = 'ready', inventory = 'ok', initialQuery = '', initialView = 'all', initialSort = 'recent', initialPage = 0, initialLoadingMore = false,
  initialDetail = null, initialRemoveCar, initialCustomer, ledaOpen = false, initialPanelCollapsed = false, initialFeedTab = 'needs', initialText, initialFlow = null,
}: CustomersProps) {
  const [q, setQ] = useState(initialQuery);
  const [view, setView] = useState<ViewId>(initialView);
  const [sort, setSort] = useState<SortId>(initialSort);
  const [count, setCount] = useState((initialPage + 1) * PAGE);
  const [more, setMore] = useState(initialLoadingMore);
  const moreTimer = useRef<number | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => window.clearTimeout(moreTimer.current), []);
  const resetList = () => { window.clearTimeout(moreTimer.current); setMore(false); setCount(PAGE); scrollTop(listRef); scrollTop(phoneRef); };
  /** The Customer detail page, when one is open. Everything else (service, edit, new service, inquiry) is a detail over it or over the list. */
  const [customerId, setCustomerId] = useState<string | null>(initialCustomer?.id ?? (initialDetail?.kind === 'customer' ? initialDetail.id : initialDetail?.kind === 'service' ? initialDetail.from ?? null : null));
  const [detail, setDetail] = useState<CustomerDetailState>(initialDetail?.kind === 'customer' ? null : initialDetail);
  const [rev, setRev] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>(SEED_NOTES);
  const [ov, setOv] = useState<Overrides>({});
  const [added, setAdded] = useState<Job[]>([]);
  const [replied, setReplied] = useState<Record<string, string>>({});
  const [panelOpen, setPanelOpen] = useState(!initialPanelCollapsed);
  const [feedTab, setFeedTab] = useState<FeedTab>(initialFeedTab);
  const [prop, setProp] = useState<Record<string, 'waiting' | 'writing' | 'done' | 'discarded'>>({});
  const [dialog, setDialog] = useState<DialogState>(null);
  const [text, setText] = useState<{ id: string; body: string; tpl: string } | null>(initialText ? { id: initialText, body: TEMPLATES[0]!.text(customers.find((c) => c.id === initialText)?.name.split(' ')[0] ?? ''), tpl: 'ready' } : null);

  const loading = state === 'loading';
  const pool = useMemo(() => applyOverrides(ov, [...allServices, ...extraHistory, ...added]), [ov, added]);
  const panelJobs = useMemo(() => pool.filter((j) => todayIds.has(j.id)), [pool]);
  const flow = useServiceFlow({
    count: added.length, items: [], find: (id) => pool.find((j) => j.id === id), initial: initialFlow,
    add: (job) => setAdded((a) => [...a, job]),
    patch: (id, p) => { if (added.some((x) => x.id === id)) setAdded((a) => a.map((x) => (x.id === id ? { ...x, ...p } : x))); else setOv((o) => ({ ...o, [id]: { ...o[id], ...p } as Overrides[string] })); },
    remove: (id) => setAdded((a) => a.filter((x) => x.id !== id)),
    after: (_d, _id, cid) => { setDetail(null); setCustomerId(cid); },
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recs = useMemo(() => (state === 'first-run' ? [] : customers.map((c) => recOf(c, pool))), [pool, state, rev]);
  const searched = useMemo(() => recs.filter((r) => matchesQuery(r.customer, q)), [recs, q]);
  const counts = useMemo(() => Object.fromEntries(VIEWS.map((v) => [v.id, searched.filter((r) => inView(r, v.id)).length])) as Record<ViewId, number>, [searched]);
  const rows = useMemo(() => sortRecs(searched.filter((r) => inView(r, view)), sort), [searched, view, sort]);
  const pageRows = rows.slice(0, count);
  const hasMore = pageRows.length < rows.length;
  const loadMore = () => {
    if (more || !hasMore) return;
    setMore(true);
    moreTimer.current = window.setTimeout(() => { setCount((c) => c + PAGE); setMore(false); }, 600);
  };
  const owedAll = rows.reduce((a, r) => a + r.owed, 0);
  const openAll = rows.reduce((a, r) => a + r.open.length, 0);
  const waiting = panelJobs.filter((j) => reasonOf(j)).length;
  const search = (v: string) => { setQ(v); resetList(); };
  const pickView = (v: ViewId) => { setView(v); resetList(); };
  const clearAll = () => { setQ(''); setView('all'); resetList(); };

  // "/" jumps to the search box from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== '/' || e.metaKey || e.ctrlKey || (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault(); searchRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const onSearchKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && rows[0] && q.trim()) openCustomer(rows[0]); };

  const recFor = (id: string) => recOf(customers.find((c) => c.id === id)!, pool);
  const customerRec = customerId && customers.some((c) => c.id === customerId) ? recFor(customerId) : null;
  const openCustomer = (r: CustomerRec) => { setDetail(null); setCustomerId(r.customer.id); };
  const close = () => setDetail(null);
  /** Desktop panel and phone page are both mounted; each registers its own guard and the visible one is used. */
  const guardRef = useRef<{ p?: ((leave: () => void) => void) | null; d?: ((leave: () => void) => void) | null }>({});
  const registerGuard = (asPage: boolean) => (g: ((leave: () => void) => void) | null) => { guardRef.current[asPage ? 'p' : 'd'] = g; };
  /** Back, backdrop and Esc on a form sheet ask first when something was typed. */
  const closeGuarded = () => { const g = guardRef.current[typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches ? 'p' : 'd']; return g ? g(close) : close(); };
  const toList = () => { setDetail(null); setCustomerId(null); };
  const openService = (j: Job, from?: string) => setDetail({ kind: 'service', id: j.id, from });
  const openInquiry = (x: Inquiry) => setDetail({ kind: 'inquiry', id: x.id });

  // ---- service actions (same as Services, so the Inspector behaves identically) ----
  const set = (id: string, p: Overrides[string]) => setOv((o) => ({ ...o, [id]: { ...o[id], ...p } }));
  const undo = (id: string, keys: (keyof Overrides[string])[]) => setOv((o) => { const n = { ...o[id] }; keys.forEach((k) => delete n[k]); return { ...o, [id]: n }; });
  const act = (job: Job, a: NextAction) => { const keys = Object.keys(a.to) as (keyof Overrides[string])[]; set(job.id, a.to as Overrides[string]); toast.undo(a.toast, () => undo(job.id, keys)); };
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
  const reply = (x: Inquiry) => { setReplied((r) => ({ ...r, [x.id]: '10:20' })); toast.undo(`Reply to ${x.name} sent.`, () => setReplied((r) => { const n = { ...r }; delete n[x.id]; return n; })); };
  const newFromInquiry = (x: Inquiry) => { const c = customers.find((y) => y.name === x.name); flow.openNew({ customerId: c?.id, plate: c ? undefined : x.name, notes: x.text }); };

  // ---- customers ----
  const saveCustomer = (d: Draft, existing: Customer | null) => {
    const vehicles = d.vehicles.map((v) => draftToCar(v, new Date(NOW).getFullYear()));
    if (existing) {
      const before = { name: existing.name, phone: existing.phone, vehicles: existing.vehicles, note: notes[existing.id] ?? '' };
      Object.assign(existing, { name: d.name, phone: d.phone.trim(), vehicles });
      setNotes((n) => ({ ...n, [existing.id]: d.notes.trim() })); setRev((r) => r + 1); close();
      toast.undo(`${d.name} updated.`, () => { Object.assign(existing, { name: before.name, phone: before.phone, vehicles: before.vehicles }); setNotes((n) => ({ ...n, [existing.id]: before.note })); setRev((r) => r + 1); });
      return;
    }
    const c: Customer = { id: `cn${customers.length + 1}`, name: d.name, phone: d.phone.trim(), since: NOW.slice(0, 10), vehicles };
    customers.push(c);
    setNotes((n) => ({ ...n, [c.id]: d.notes.trim() })); setRev((r) => r + 1); setQ(''); resetList(); setDetail(null); setCustomerId(c.id);
    toast.undo(`${c.name} saved. Start a service for ${vehicles[0]!.plate}.`, () => { customers.splice(customers.indexOf(c), 1); setRev((r) => r + 1); toList(); });
  };

  /** Add or edit one car. The customer's own record is changed in place, so the list plates, the page and the New service picker all see it at once. */
  const saveCar = (cust: Customer, d: CarDraft, existing: Vehicle | null) => {
    const v = draftToCar(d, new Date(NOW).getFullYear());
    const before = cust.vehicles;
    cust.vehicles = existing ? cust.vehicles.map((x) => (x.id === existing.id ? v : x)) : [...cust.vehicles, v];
    setRev((r) => r + 1); setDetail(null); setCustomerId(cust.id);
    toast.undo(existing ? `${v.plate} updated.` : `${v.plate} added to ${cust.name}.`, () => { cust.vehicles = before; setRev((r) => r + 1); });
  };
  const removeCar = (cust: Customer, vehicleId: string) => {
    const before = cust.vehicles; const gone = before.find((x) => x.id === vehicleId);
    cust.vehicles = before.filter((x) => x.id !== vehicleId); setRev((r) => r + 1);
    toast.undo(`${gone?.plate} removed from ${cust.name}.`, () => { cust.vehicles = before; setRev((r) => r + 1); });
  };

  const sendText = () => {
    if (!text) return;
    const c = customers.find((x) => x.id === text.id)!;
    setText(null);
    toast.info(`Text sent to ${c.name} (${c.phone}).`);
  };

  /** Leda reads a lookup question into the search or a view, and says what she did. Nothing is changed. */
  const leda = useSmsLeda({
    scope: customerRec ? customerRec.customer.name : 'Customers', chips: customerRec ? customerQuestions : ledaQuestions, startOpen: ledaOpen,
    handle: (t) => {
      const l = t.toLowerCase();
      if (customerRec) {
        const r = customerRec; const c = r.customer;
        if (/due|remind|next service/.test(l)) {
          const lines = c.vehicles.map((v) => { const last = r.services.find((j) => j.vehicleId === v.id && j.status === 'COMPLETED'); return last ? `${v.plate}: last done ${last.statusSince.slice(0, 10)}` : `${v.plate}: nothing finished here yet`; });
          return [{ type: 'text', text: `${lines.join('. ')}. Reminders go out ${profileOf(c).remindEvery} months after the last service${profileOf(c).remindByText ? '' : ', but this customer has texts turned off'}.`, stream: true }, { type: 'meta', text: 'Read from Services, 10:20' }];
        }
        if (/owe|balance|unpaid|spend|spent/.test(l)) return [{ type: 'text', text: `${c.name} has spent ${peso(r.spend)} over ${r.services.filter((j) => j.status === 'COMPLETED').length} finished services and owes ${peso(r.owed)} now.`, stream: true }, { type: 'meta', text: 'Read from Services, 10:20' }];
        if (/remind|send|text|move|record|transfer|get the|book/.test(l)) return null;
        if (/open|working|now/.test(l)) return [{ type: 'text', text: r.open.length ? r.open.map((j) => `${j.number} ${j.services.map((x) => x.name).join(' + ')} (${STATUS_LABEL[j.status]})`).join('. ') + '.' : `Nothing is open for ${c.name}.`, stream: true }];
      }
      if (/^(clear|reset|show all)/.test(l)) { clearAll(); return [{ type: 'text', text: 'Search cleared. Showing every customer.', stream: true }]; }
      if (/remind|send|text|move|record|transfer|get the/.test(l)) return null;
      if (/owe|money|unpaid/.test(l)) { setQ(''); pickView('owes'); return [{ type: 'text', text: `${recs.filter((r) => inView(r, 'owes')).length} customers owe the shop ${peso(recs.reduce((a, r) => a + r.owed, 0))}. The list is filtered; nothing was changed.`, stream: true }, { type: 'meta', text: 'Read from Services, 10:20' }, { type: 'chips', chips: [{ id: 'cl', label: 'Clear search' }] }]; }
      if (/30 days|lapsed|not visited|haven.t/.test(l)) { setQ(''); pickView('quiet'); return [{ type: 'text', text: `${recs.filter((r) => inView(r, 'quiet')).length} customers have not been in for 30 days.`, stream: true }, { type: 'chips', chips: [{ id: 'cl', label: 'Clear search' }] }]; }
      const term = t.replace(/^(who (owns|is)|find|show|look ?up|open)\s+/i, '').replace(/[?.]+$/, '').trim();
      const hit = recs.filter((r) => matchesQuery(r.customer, term));
      if (!term || hit.length === 0) return null;
      search(term); setView('all');
      const first = hit[0]!;
      return [
        { type: 'text', text: hit.length === 1 ? `${first.customer.name}, ${first.customer.vehicles.map((v) => v.plate).join(' and ')}, ${first.customer.phone}. ${first.open.length} open now.` : `${hit.length} customers match "${term}". The list is filtered.`, stream: true },
        { type: 'meta', text: 'Read from Customers and Services, 10:20' },
        { type: 'chips', chips: [{ id: 'cl', label: 'Clear search' }] },
      ];
    },
  });

  const platform = { name: branch.name, initials: 'DC' };
  const rail = (
    <IconRailContent>
      <IconRailMark href="#portal" label="Back to the ReadyPH Portal" />
      <IconRailItem icon={Wrench} label="Today" href="#today" />
      <IconRailItem icon={ClipboardText} label="Services" href="#services" />
      <IconRailItem icon={UsersThree} label="Customers" href="#customers" current />
      <IconRailItem icon={Gear} label="Settings" href="#settings" />
      <IconRailSpacer />
      <IconRailFoot><AccountMenu name={manager.name} email="mon@delacruzauto.example" role="Branch manager" initials={manager.initials} applyToDocument={false} /></IconRailFoot>
    </IconRailContent>
  );
  const navTab = 'relative flex min-h-11 flex-col items-center justify-center gap-[3px] text-tiny text-muted';
  const phoneNav = (
    <div className="grid h-[60px] w-full grid-cols-5 items-stretch">
      <a href="#today" className={navTab}><Wrench size={20} aria-hidden />Today<CountBadge count={waiting} placement="tab" /></a>
      <a href="#services" className={navTab}><ClipboardText size={20} aria-hidden />Services</a>
      <a href="#customers" aria-current="page" className={cn(navTab, 'font-medium text-text')}><UsersThree size={20} aria-hidden />Customers</a>
      <button type="button" onClick={leda.openChat} className={navTab}><Sparkle size={20} aria-hidden />Leda</button>
      <button type="button" className={navTab}><List size={20} aria-hidden />More</button>
    </div>
  );

  // ---- detail ----
  const editing = detail?.kind === 'edit' ? customers.find((c) => c.id === detail.id) ?? null : null;
  const carCustomer = detail?.kind === 'car' ? customers.find((c) => c.id === detail.customerId) ?? null : null;
  const service = detail?.kind === 'service' ? pool.find((j) => j.id === detail.id) ?? null : null;
  const inquiry = detail?.kind === 'inquiry' ? inquiries.find((x) => x.id === detail.id) ?? null : null;
  const detailLabel = service ? `Service ${service.number}` : detail?.kind === 'car' ? (detail.vehicleId ? 'Edit car' : 'Add car') : customerRec ? `Customer ${customerRec.customer.name}` : detail?.kind === 'edit' ? (editing ? `Edit ${editing.name}` : 'New customer') : inquiry ? `Inquiry from ${inquiry.name}` : 'New service';
  const inspectorProps = { inventoryDown: inventory === 'down', proposalState: prop, onConfirmProposal: confirmProposal, onDiscardProposal: discardProposal, onAction: act, onAssign: assign, onResolve: resolve, floorRead, onViewQuote: flow.viewQuote, onBookQuote: flow.bookQuote, onEditQuote: flow.editQuote };
  const inquiryBody = inquiry && <InquiryDetail inquiry={inquiry} repliedAt={replied[inquiry.id]} job={inquiry.jobId ? pool.find((j) => j.id === inquiry.jobId) : null} onReply={reply} onNewService={newFromInquiry} onOpenJob={(j) => openService(j)} onClose={close} />;
  const detailBody = (asPage: boolean) => {
    if (detail?.kind === 'service' && service) {
      return <Inspector job={service} {...inspectorProps} trackingLink={<TrackingLink job={service} />} asPage={asPage} backLabel={customerRec ? 'Customer' : 'Customers'} onBack={close} onClose={close} className="min-h-full" />;
    }
    if (detail?.kind === 'edit') return <CustomerSheet registerGuard={registerGuard(asPage)} key={detail.id ?? detail.seed ?? 'new'} customer={editing} keepIds={editing ? pool.filter((j) => j.customerId === editing.id).map((j) => j.vehicleId) : []} notes={editing ? notes[editing.id] ?? '' : ''} seed={detail.seed} onSave={saveCustomer} onOpenExisting={(c) => { setDetail(null); setCustomerId(c.id); }} asPage={asPage} onBack={close} onClose={close} backLabel={editing ? 'Customer' : 'Customers'} className="min-h-full" />;
    if (detail?.kind === 'car' && carCustomer) {
      return <CarSheet registerGuard={registerGuard(asPage)} key={`${detail.customerId}${detail.vehicleId ?? 'new'}`} customer={carCustomer} car={carCustomer.vehicles.find((v) => v.id === detail.vehicleId) ?? null} onSave={(d, ex) => saveCar(carCustomer, d, ex)} onOpenCustomer={(id) => { setDetail(null); setCustomerId(id); }} asPage={asPage} onBack={close} onClose={close} className="min-h-full" />;
    }
    return inquiryBody;
  };
  /** Phone: a detail takes the whole screen. Desktop: a detail slides over the list or the customer page. */
  const pageOpen = !!(service || (detail?.kind === 'car' && carCustomer) || detail?.kind === 'edit');
  const detailOpen = pageOpen || !!inquiry;
  const customerNode = customerRec && (
    <CustomerPage key={customerRec.customer.id} rec={customerRec} notes={notes[customerRec.customer.id] ?? ''} onOpenService={(j) => openService(j, customerRec.customer.id)}
      onNewService={(vehicleId) => flow.openNew({ customerId: customerRec.customer.id, vehicleId })}
      onEdit={() => setDetail({ kind: 'edit', id: customerRec.customer.id })} onBack={toList}
      onCar={(vehicleId) => setDetail({ kind: 'car', customerId: customerRec.customer.id, vehicleId })} onRemoveCar={(id) => removeCar(customerRec.customer, id)} initialRemove={initialRemoveCar}
      initialCar={initialCustomer?.car ?? (initialDetail?.kind === 'customer' ? initialDetail.car : undefined)} initialStatus={initialCustomer?.status ?? (initialDetail?.kind === 'customer' ? initialDetail.status : undefined)} />
  );

  // ---- states ----
  const typed = q.trim();
  const empty = state === 'first-run' ? (
    <EmptyState title="No customers yet" description="Take the first car in. Its owner is saved as a customer, with their phone and plate, and shows up here." action={<Button variant="primary" leftIcon={Plus} onClick={() => setDetail({ kind: 'edit' })}>New customer</Button>} />
  ) : state === 'error' ? (
    <Notice tone="warn" title="Customers did not load" action={<Button variant="secondary">Try again</Button>}>The list could not be read just now (last synced 10:02). Services and the right panel are current. Try again, or open a customer from a service.</Notice>
  ) : rows.length === 0 && !loading ? (
    typed ? (
      <EmptyState
        title={`No customer matches "${typed}"`}
        description={looksLikePlate(typed) ? 'Not here yet. If the car is at the counter, take it in now: its owner is saved with it.' : 'Check the spelling, try the plate or the last digits of the phone, or add them as a new customer.'}
        action={<span className="flex flex-wrap justify-center gap-2"><Button variant="secondary" onClick={clearAll}>Clear search</Button><Button variant="primary" leftIcon={Plus} onClick={() => setDetail({ kind: 'edit', seed: typed })}>{looksLikePlate(typed) ? `Take in ${platePretty(typed)}` : `Add ${typed}`}</Button></span>}
      />
    ) : <EmptyState title="No customers in this view" description="Nothing fits. Show every customer to look further." action={<Button variant="secondary" onClick={clearAll}>Show all</Button>} />
  ) : null;

  const invNotice = inventory !== 'ok' && (
    <div className="px-6 pt-3 max-[640px]:px-4"><Notice tone="warn" title="Parts stock is not loading">Customers are current. Parts on a service show what it needs, not what is in stock.</Notice></div>
  );
  const control = 'max-[640px]:min-h-11';
  const toolbar = (
    <div className="flex-none">
      <div className="flex flex-wrap items-center gap-2 px-6 pt-3" onKeyDown={onSearchKey}>
        <SearchBox ref={searchRef} label="Search customers" value={q} onChange={search} placeholder="Search name, phone or plate  ( / )" className="w-[480px] max-w-full" />
        <span className="flex-1" />
        <Button variant="secondary" leftIcon={Plus} onClick={() => setDetail({ kind: 'edit', seed: looksLikePlate(typed) || /^[\d\s+()-]{6,}$/.test(typed) ? typed : '' })}>New customer</Button>
      </div>
      <div className="flex items-center gap-4 px-6 py-3">
        <SegmentedControl size="md" aria-label="Customer views" value={view} onChange={(v) => pickView(v as ViewId)} options={VIEWS.map((v) => ({ value: v.id, label: v.label, count: counts[v.id] }))} />
      </div>
      <div className="flex items-center gap-4 border-b border-rule px-6 pb-2">
        <FactsLine className="min-w-0 flex-1" aria-label="Results">
          <Fact value={rows.length}>{rows.length === 1 ? 'customer' : 'customers'}</Fact>
          <Fact value={openAll}>open now</Fact>
          {owedAll > 0 && <Fact value={peso(owedAll)}>owed</Fact>}
          {(typed || view !== 'all') && <Fact><button type="button" onClick={clearAll} className="text-[13px] font-semibold text-accent underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Clear</button></Fact>}
        </FactsLine>
        <label className="flex flex-none items-center gap-2 text-[13px] text-muted">Sort<Select size="sm" aria-label="Sort by" className="w-[188px]" value={sort} onValueChange={(s) => { setSort(s as SortId); resetList(); }} options={SORTS.map((s) => ({ value: s.id, label: s.label }))} /></label>
      </div>
    </div>
  );

  const listArea = state === 'first-run' ? <div className="min-h-0 flex-1 overflow-auto p-pad">{empty}</div> : (
    <>
      {toolbar}
      {invNotice}
      <div ref={listRef} className="min-h-0 flex-1 overflow-auto">
        {empty ? <div className="p-pad">{empty}</div> : (
          <>
            <CustomersTable rows={pageRows} loading={loading} loadingMore={more} query={typed} onOpen={openCustomer} onNewService={(r) => flow.openNew({ customerId: r.customer.id })} />
            {!loading && <InfiniteSentinel hasMore={hasMore} loading={more} onLoadMore={loadMore} />}
            {!loading && !hasMore && <ListEnd total={rows.length} noun="customers" />}
          </>
        )}
      </div>
      {!empty && !loading && <ResultCount shown={pageRows.length} total={rows.length} loadingMore={more} noun="customers" />}
    </>
  );

  const desktop = (
    <div className="relative h-full overflow-hidden max-[640px]:hidden">
      <SidePanelLayout open={panelOpen} onOpenChange={setPanelOpen} jobs={panelJobs} replied={replied} tab={feedTab} onTabChange={setFeedTab} onOpenJob={(j) => openService(j)} onOpenInquiry={openInquiry} floorRead={floorRead} inventoryDown={inventory === 'down'} detailOpen={detailOpen} loading={loading}>
        {customerNode ? <div className="min-h-0 flex-1 overflow-auto">{customerNode}</div> : listArea}
      </SidePanelLayout>
      <Offcanvas open={detailOpen} onClose={closeGuarded} label={detailLabel}>{detailBody(false)}</Offcanvas>
    </div>
  );

  const phone = (
    <div className="hidden h-full max-[640px]:flex max-[640px]:flex-col">
      {pageOpen ? <div className="min-h-0 flex-1 overflow-auto">{detailBody(true)}</div> : customerNode ? <div className="min-h-0 flex-1 overflow-auto">{customerNode}</div> : (
        <div ref={phoneRef} className="min-h-0 flex-1 overflow-auto">
          <div className="space-y-2 px-4 pb-2 pt-3" onKeyDown={onSearchKey}>
            <SearchBox label="Search customers" value={q} onChange={search} placeholder="Name, phone or plate" />
            <div className="overflow-x-auto pb-1"><SegmentedControl size="md" aria-label="Customer views" value={view} onChange={(v) => pickView(v as ViewId)} options={VIEWS.map((v) => ({ value: v.id, label: v.label, count: counts[v.id] }))} /></div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" leftIcon={Plus} className={control} onClick={() => setDetail({ kind: 'edit', seed: looksLikePlate(typed) ? typed : '' })}>New customer</Button>
              <span className="flex-1 text-right text-[13px] tabular-nums text-muted">{loading || empty ? rows.length : `Showing ${pageRows.length} of ${rows.length}`} {rows.length === 1 ? 'customer' : 'customers'}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-muted">Sort<Select size="sm" aria-label="Sort by" className="w-[200px]" value={sort} onValueChange={(s) => { setSort(s as SortId); resetList(); }} options={SORTS.map((s) => ({ value: s.id, label: s.label }))} /></div>
          </div>
          <div className="px-4 pb-6">
            {loading ? <div className="space-y-4 py-2"><Skeleton variant="text" lines={3} /><Skeleton variant="text" lines={3} /><Skeleton variant="text" lines={3} /></div>
              : empty ? empty : pageRows.map((r) => <CustomerCard key={r.customer.id} rec={r} query={typed} onOpen={openCustomer} />)}
            {more && !loading && <CardSkeletons />}
            {!loading && !empty && <InfiniteSentinel hasMore={hasMore} loading={more} onLoadMore={loadMore} />}
            {!loading && !empty && !hasMore && <ListEnd total={rows.length} noun="customers" />}
          </div>
        </div>
      )}
    </div>
  );

  const phoneTitle = service ? service.number : detail?.kind === 'car' ? (detail.vehicleId ? 'Edit car' : 'Add car') : detail?.kind === 'edit' ? (editing ? 'Edit customer' : 'New customer') : customerRec ? customerRec.customer.name : '';
  const phoneBackLabel = pageOpen ? (customerRec ? 'Customer' : 'Customers') : 'Customers';
  const onPhoneBack = pageOpen ? closeGuarded : toList;
  const topBar = pageOpen || customerRec ? undefined : (
    <>
      <span className="flex-none whitespace-nowrap text-[15px] font-semibold">Customers</span>
      <span className="min-w-0 truncate text-[13px] text-muted">· {branch.name}</span>
      <span className="flex-1" />
      <AskLedaBar variant="bar" scope="Customers" shortcuts={false} paused={leda.paused} onOpen={leda.openPalette} />
      <span className="contents [&>button]:size-11"><AccountMenu name={manager.name} email="mon@delacruzauto.example" role="Branch manager" initials={manager.initials} applyToDocument={false} /></span>
    </>
  );
  const textCustomer = text ? customers.find((c) => c.id === text.id) ?? null : null;

  return (
    <>
      <PlatformShell
        railWidth="wide" railLabel="Shop" rail={rail}
        topBar={pageOpen || customerRec ? <DetailTopBar back={<button type="button" onClick={onPhoneBack} className="min-h-11 text-[14px] font-semibold">{phoneBackLabel}</button>} title={phoneTitle} ledaScope={phoneTitle} /> : topBar}
        phoneNav={pageOpen || customerRec ? undefined : phoneNav}
        detail={pageOpen || !!customerRec}
        heading="Customers"
        hideSheetBarOnPhone
        sheetBar={
          <SheetBar wrapChildren={false} actionsFirst={false} actions={<><Button variant="primary" leftIcon={Plus} onClick={() => flow.openNew()}>New service</Button><AskLedaBar variant="bar" scope="Customers" paused={leda.paused} onOpen={leda.openPalette} /></>}>
            <SheetBarWhere platform={platform} page="Customers" />
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
        open={!!text} onOpenChange={(o) => !o && setText(null)} title={textCustomer ? `Text ${textCustomer.name}` : 'Text'} size="sm"
        footer={<><Button variant="text" onClick={() => setText(null)}>Cancel</Button><Button variant="primary" onClick={sendText} disabled={!text?.body.trim()}>Send text</Button></>}
      >
        {textCustomer && text && (
          <div className="space-y-3">
            <p className="text-[13px] text-muted">To <span className="tabular-nums text-text">{textCustomer.phone}</span> from {branch.name}.</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Message">{TEMPLATES.map((t) => <ToggleChip key={t.id} pressed={text.tpl === t.id} onChange={() => setText({ ...text, tpl: t.id, body: t.text(textCustomer.name.split(' ')[0]!) })}>{t.label}</ToggleChip>)}</div>
            <Textarea label="Message" rows={4} value={text.body} onChange={(e) => setText({ ...text, body: e.target.value })} />
          </div>
        )}
      </Modal>
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
