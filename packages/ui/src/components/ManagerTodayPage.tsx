import { useMemo, useState } from 'react';
import { ClipboardText, Gear, List, Plus, Sparkle, Tray, Wrench } from '@phosphor-icons/react';
import {
  AccountMenu, AskLedaBar, Button, CountBadge, DetailTopBar, EmptyState, Fact, FactsLine, IconRailContent, IconRailFoot, IconRailItem,
  IconRailMark, IconRailSpacer, InventoryStatusBar, LedaRefusal, LedaNoteLink, PlatformShell, SegmentedControl, SheetBar, SheetBarWhere, Skeleton, Toaster, cn, toast,
} from '../index';
import { useServiceFlow } from './useServiceFlow';
import { HOURS, PIPELINE, branch, customers, productOf, manager, mechanics, firstRun, quietDay, jobBalance, jobs as allJobs, today as todayFacts, peso, inquiries, type Inquiry, type Job, type LedaProposalData } from './sms/data';
import { getMech, useMech } from './sms/mechModel';
import { needsCount } from './sms/requestsModel';
import { applyOverrides, lanesFor, reasonOf, todayEnv, viewOf, type LaneId, type NextAction, type Overrides } from './sms/floorModel';
import { PaymentScreen, type PaymentOverlay } from './PaymentPage';
import { FloorSidePanel as SidePanelLayout } from './sms/SidePanel';
import { Offcanvas } from './Offcanvas';
import { LiveTrackingLink as TrackingLink } from './sms/LiveTrackingLink';
import { InquiryDetail } from './InquiryDetail';
import { FloorLanes } from './FloorLanes';
import { LiveInspector as Inspector } from './sms/LiveInspector';
import { JobRow } from './JobRow';
import type { PartAction } from './PartChip';
import { FloorFeed, type FeedTab } from './sms/FloorFeed';
import { useSmsLeda } from './sms/LedaPanel';
import { TodayDialogs, type DialogState } from './sms/TodayDialogs';

export interface ManagerTodayProps {
  /** `loading`: skeleton lanes. `quiet`: nothing stuck. `first-run`: no mechanics yet. */
  state?: 'ready' | 'loading' | 'quiet' | 'first-run';
  /** Inventory link: `down` puts an ErrorBlock inside the inspector's parts. */
  inventory?: 'ok' | 'slow' | 'down';
  /** `mechanic` is the role-limited stub: Leda refuses, no floor. */
  as?: 'manager' | 'mechanic';
  initialSelected?: string | null;
  initialView?: 'floor' | 'status';
  /** Phone: open on a job page instead of the list. */
  initialPhoneJob?: string | null;
  initialPhoneLane?: LaneId;
  /** Phone: open on the updates list (needs you, inquiries, parts) instead of the lanes. */
  initialPhoneView?: 'floor' | 'updates';
  initialFeedTab?: FeedTab;
  /** Open the Leda conversation panel on load. */
  ledaOpen?: boolean;
  /** Desktop: open with the right panel collapsed to its rail. */
  initialPanelCollapsed?: boolean;
  /** Open with an inquiry's detail in the off-canvas. */
  initialInquiry?: string | null;
  /** Open on the Payment page of this job (Collect payment). */
  initialPaying?: { jobId: string; overlay?: PaymentOverlay } | null;
}

const PROPOSAL_EFFECT: Record<string, (move: (id: string, to: string) => void, transfer: () => void) => string> = {
  lp1: (_m, transfer) => { transfer(); return 'Transfer requested for JO-0412. Maricel Reyes has the new time.'; },
  lp2: (move) => { move('j0417', 'm-ricky'); return 'JO-0417 moved to Ricky.'; },
  lp3: () => '2 quote reminders sent.',
  lp4: () => 'Added 4 Bendix pads to the Kapitolyo order list.',
};

export function ManagerTodayPage({ state = 'ready', inventory = 'ok', as = 'manager', initialSelected = null, initialView = 'floor', initialPhoneJob = null, initialPhoneLane = 'counter', initialPhoneView = 'floor', initialFeedTab = 'needs', ledaOpen = false, initialPanelCollapsed = false, initialInquiry = null, initialPaying = null }: ManagerTodayProps) {
  const mechStore = useMech();
  const [panelOpen, setPanelOpen] = useState(!initialPanelCollapsed);
  const [ov, setOv] = useState<Overrides>(() => ({ ...getMech().ov })); // what the mechanic did this session (empty unless the Mechanic story ran)
  const [paying, setPaying] = useState<string | null>(initialPaying?.jobId ?? null);
  const [selectedId, setSelectedIdRaw] = useState<string | null>(initialSelected);
  const [inquiryId, setInquiryId] = useState<string | null>(initialInquiry);
  /** The detail is an off-canvas over the right panel: opening or closing it never touches the panel's tab, scroll or collapsed state. */
  const setSelectedId = (id: string | null) => { setSelectedIdRaw(id); if (id) setInquiryId(null); };
  const openInquiry = (q: Inquiry) => { setInquiryId(q.id); setSelectedIdRaw(null); };
  const closeDetail = () => { setSelectedIdRaw(null); setInquiryId(null); };
  const [view, setView] = useState<'floor' | 'status'>(initialView);
  const [prop, setProp] = useState<Record<string, 'waiting' | 'writing' | 'done' | 'discarded'>>({});
  const [dialog, setDialog] = useState<DialogState>(null);
  const [phoneJob, setPhoneJob] = useState<string | null>(initialPhoneJob);
  const [phoneLane, setPhoneLane] = useState<LaneId>(initialPhoneLane);
  const [cycle, setCycle] = useState(0);
  const [replied, setReplied] = useState<Record<string, string>>({});
  const [feedTab, setFeedTab] = useState<FeedTab>(initialFeedTab);
  const [phoneView, setPhoneView] = useState<'floor' | 'updates'>(initialPhoneView);

  const [added, setAdded] = useState<Job[]>([]);
  const basePool = state === 'quiet' ? quietDay.jobs : state === 'first-run' ? firstRun.jobs : allJobs;
  const pool = useMemo(() => [...basePool, ...added], [basePool, added]);
  const jobs = useMemo(() => applyOverrides(ov, pool), [ov, pool]);
  const flow = useServiceFlow({
    count: added.length, items: [], find: (id) => jobs.find((j) => j.id === id),
    add: (job) => setAdded((a) => [...a, job]),
    patch: (id, p) => { if (added.some((x) => x.id === id)) setAdded((a) => a.map((x) => (x.id === id ? { ...x, ...p } : x))); else setOv((o) => ({ ...o, [id]: { ...o[id], ...p } as Overrides[string] })); },
    remove: (id) => setAdded((a) => a.filter((x) => x.id !== id)),
    after: (_d, id) => setSelectedId(id),
  });
  const lanes = useMemo(() => lanesFor(jobs), [jobs]);
  const stuck = jobs.filter((j) => reasonOf(j));
  const selected = jobs.find((j) => j.id === selectedId) ?? null;
  const inquiry = inquiries.find((q) => q.id === inquiryId) ?? null;
  const detailOpen = !!(selected || inquiry);
  const set = (id: string, patch: Overrides[string]) => setOv((o) => ({ ...o, [id]: { ...o[id], ...patch } }));
  const undo = (id: string, keys: (keyof Overrides[string])[]) => setOv((o) => { const n = { ...o[id] }; keys.forEach((k) => delete n[k]); return { ...o, [id]: n }; });

  const completed = jobs.filter((j) => j.status === 'COMPLETED').length;
  const sessionPaid = jobs.reduce((a, j) => a + (ov[j.id]?.payments ? ov[j.id]!.payments!.filter((x) => !allJobs.find((b) => b.id === j.id)?.payments.includes(x)).reduce((t, x) => t + x.amount, 0) : 0), 0);
  const collected = todayFacts.collected + sessionPaid + jobs.filter((j) => ov[j.id]?.status === 'COMPLETED' && j.status === 'COMPLETED' && !ov[j.id]?.payments).reduce((a, j) => a + jobBalance(allJobs.find((x) => x.id === j.id)!), 0);
  const carsIn = state === 'ready' ? todayFacts.carsIn : jobs.filter((j) => j.createdAt.startsWith('2026-11-02')).length;

  const act = (job: Job, a: NextAction) => {
    if (a.pay) { setPaying(job.id); return; }
    const keys = Object.keys(a.to) as (keyof Overrides[string])[];
    set(job.id, a.to as Overrides[string]);
    toast.undo(a.toast, () => undo(job.id, keys));
  };
  const move = (job: Job, to: LaneId) => {
    if (to === 'counter') { toast.info('The Counter lane follows status: approvals and pick-ups wait there.'); return; }
    const prev = job.assigneeId; const next = to === 'unassigned' ? null : to;
    if (prev === next) return;
    set(job.id, { assigneeId: next });
    toast.undo(`${job.number} moved to ${mechanics.find((m) => m.id === to)?.short ?? 'unassigned'}.`, () => set(job.id, { assigneeId: prev }));
  };
  const assign = (job: Job, id: string) => move(job, id as LaneId);
  const doTransfer = (job: Job) => {
    set(job.id, { pendingNote: 'Transfer requested, expected 12:30' });
    toast.undo(`Transfer requested for ${job.number}.`, () => undo(job.id, ['pendingNote']));
  };
  const resolve = (job: Job, action: PartAction, productId: string) => {
    const product = job.parts.map((l) => l.productId).includes(productId) ? (productOf(productId)) : null;
    if (!product) return;
    if (action === 'order') { toast.undo(`${product.name.split(',')[0]} added to the Kapitolyo order list.`, () => undefined); return; }
    setDialog({ kind: action === 'transfer' ? 'transfer' : 'eta', job, product });
  };
  const confirmProposal = (p: LedaProposalData) => {
    setProp((s) => ({ ...s, [p.id]: 'writing' }));
    window.setTimeout(() => {
      const msg = PROPOSAL_EFFECT[p.id]?.((id, to) => { const j = jobs.find((x) => x.id === id); if (j) move(j, to as LaneId); }, () => doTransfer(jobs.find((x) => x.id === 'j0412')!));
      setProp((s) => ({ ...s, [p.id]: 'done' }));
      if (msg && p.id !== 'lp2') toast.undo(msg, () => setProp((s) => ({ ...s, [p.id]: 'waiting' })));
    }, 500);
  };
  const discardProposal = (p: LedaProposalData) => { setProp((s) => ({ ...s, [p.id]: 'discarded' })); toast.undo('Draft discarded.', () => setProp((s) => ({ ...s, [p.id]: 'waiting' }))); };
  const nextStuck = () => { const j = stuck[cycle % Math.max(stuck.length, 1)]; if (j) { setSelectedId(j.id); setPhoneJob(j.id); } setCycle((c) => c + 1); };

  const leda = useSmsLeda({
    startOpen: ledaOpen,
    onConfirmed: (id) => { if (id === 'lp1') { const j = jobs.find((x) => x.id === 'j0412'); if (j) doTransfer(j); } if (id === 'lp2') { const j = jobs.find((x) => x.id === 'j0417'); if (j) move(j, 'm-ricky'); } },
  });
  const reply = (q: Inquiry) => { setReplied((r) => ({ ...r, [q.id]: '10:20' })); toast.undo(`Reply to ${q.name} sent.`, () => setReplied((r) => { const n = { ...r }; delete n[q.id]; return n; })); };
  const newService = (q: Inquiry) => { const c = customers.find((x) => x.name === q.name); flow.openNew({ customerId: c?.id, plate: c ? undefined : q.name, notes: q.text }); };
  const pendingInquiries = ['iq1', 'iq2', 'iq4'].filter((id) => !replied[id]).length;

  const floorRead = `Ricky is free from 12:30 and Jun carries 5 active services. JO-0417 could move to Ricky and still make 16:00.`;
  const inspectorProps = {
    inventoryDown: inventory === 'down', proposalState: prop, onConfirmProposal: confirmProposal, onDiscardProposal: discardProposal,
    onAction: act, onAssign: assign, onResolve: resolve, floorRead, onViewQuote: flow.viewQuote, onBookQuote: flow.bookQuote, onEditQuote: flow.editQuote,
  };

  const platform = { name: branch.name, initials: 'DC' };
  const rail = (
    <IconRailContent>
      <IconRailMark href="#portal" label="Back to the ReadyPH Portal" />
      <IconRailItem icon={Wrench} label="Today" href="#today" current />
      <IconRailItem icon={ClipboardText} label="Services" href="#services" />
      <IconRailItem icon={Tray} label="Requests" href="#requests" count={needsCount(mechStore)} />
      <IconRailItem icon={Gear} label="Settings" href="#settings" />
      <IconRailSpacer />
      <IconRailFoot><AccountMenu name={manager.name} email="mon@delacruzauto.example" role="Branch manager" initials={manager.initials} applyToDocument={false} /></IconRailFoot>
    </IconRailContent>
  );
  const tab = 'relative flex min-h-11 flex-col items-center justify-center gap-[3px] text-tiny text-muted';
  const phoneNav = (
    <div className="grid h-[60px] w-full grid-cols-6 items-stretch">
      <a href="#today" aria-current="page" className={cn(tab, 'font-medium text-text')}><Wrench size={20} aria-hidden />Today<CountBadge count={stuck.length} placement="tab" /></a>
      <a href="#services" className={tab}><ClipboardText size={20} aria-hidden />Services</a>
      <a href="#requests" className={tab}><Tray size={20} aria-hidden />Requests<CountBadge count={needsCount(mechStore)} placement="tab" /></a>
      <button type="button" onClick={() => flow.openNew()} className={tab}><Plus size={20} aria-hidden />New</button>
      <button type="button" onClick={leda.openChat} className={tab}><Sparkle size={20} aria-hidden />Leda</button>
      <button type="button" className={tab}><List size={20} aria-hidden />More</button>
    </div>
  );
  const phoneJobObj = jobs.find((j) => j.id === phoneJob) ?? null;
  const topBar = phoneJobObj ? undefined : (
    <>
      <span className="flex-none whitespace-nowrap text-[15px] font-semibold">Today</span>
      <span className="min-w-0 truncate text-[13px] text-muted">· {branch.name}</span>
      <span className="flex-1" />
      <AskLedaBar variant="bar" scope="Today" shortcuts={false} paused={leda.paused} onOpen={leda.openPalette} />
      <span className="contents [&>button]:size-11"><AccountMenu name={manager.name} email="mon@delacruzauto.example" role="Branch manager" initials={manager.initials} applyToDocument={false} /></span>
    </>
  );

  const facts = (
    <div className="flex items-center gap-4 px-4 py-2 min-[641px]:px-6">
      <FactsLine className="min-w-0 flex-1" aria-label="Today in numbers">
        <Fact value={carsIn}>cars in</Fact>
        <Fact value={completed}>completed</Fact>
        {as === 'manager' && <Fact value={peso(collected)}>collected</Fact>}
        {as === 'manager' && <Fact tone="warn" value={peso(todayFacts.owedAtPickup)}>at pick-up</Fact>}
        <Fact><button type="button" onClick={nextStuck} className="text-[13px] font-semibold leading-5 text-accent underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">{stuck.length} need you</button></Fact>
      </FactsLine>
      <p className="hidden flex-none items-center gap-2 whitespace-nowrap text-[12px] leading-5 text-muted min-[641px]:flex"><span aria-hidden className="size-4 flex-none rounded-chip border border-warn-dot bg-warn-bg" />Tinted = waiting for you</p>
    </div>
  );

  const mechanicStub = (
    <div className="p-pad max-w-[640px]"><LedaRefusal action={<LedaNoteLink href="#my-jobs">Open my services</LedaNoteLink>}>Payments and other mechanics' jobs are for the manager. Ask Mon, or open your own jobs.</LedaRefusal></div>
  );

  const empty = state === 'first-run' ? (
    <div className="p-pad"><EmptyState title="Add your mechanics" description={firstRun.note} action={<Button variant="primary">Add a mechanic</Button>} /></div>
  ) : null;

  const statusView = (
    <div className="px-6 pb-8">
      {PIPELINE.map(({ status, label }) => {
        const rows = jobs.filter((j) => j.status === status);
        return (
          <section key={status} aria-label={label} className="pt-4">
            <h3 className="flex items-baseline gap-2 border-b border-control pb-1 text-[13px] font-semibold">{label}<span className="font-normal text-muted">{rows.length}</span></h3>
            {rows.map((j) => <JobRow key={j.id} env={todayEnv} view={viewOf(j)} mechanics={mechanics} job={j} selected={j.id === selectedId} onOpen={(x) => setSelectedId(x.id)} onAction={act} />)}
            {rows.length === 0 && <p className="py-2 text-[13px] text-muted">0</p>}
          </section>
        );
      })}
    </div>
  );

  const detailBody = selected
    ? <Inspector job={selected} trackingLink={<TrackingLink job={selected} />} onClose={closeDetail} {...inspectorProps} floorProposalIds={['lp2']} className="min-h-full" />
    : inquiry
      ? <InquiryDetail inquiry={inquiry} repliedAt={replied[inquiry.id]} job={inquiry.jobId ? jobs.find((j) => j.id === inquiry.jobId) : null} onReply={reply} onNewService={newService} onOpenJob={(j) => setSelectedId(j.id)} onClose={closeDetail} />
      : null;

  const desktop = (
    <div className="relative h-full overflow-hidden max-[640px]:hidden">
      <SidePanelLayout
        open={panelOpen} onOpenChange={setPanelOpen} jobs={jobs} replied={replied} tab={feedTab} onTabChange={setFeedTab}
        onOpenJob={(j) => setSelectedId(j.id)} onOpenInquiry={openInquiry} floorRead={floorRead} inventoryDown={inventory === 'down'}
        detailOpen={detailOpen} loading={state === 'loading'} limited={as === 'mechanic'}
      >
        <div className="flex-none">{facts}</div>
        {as === 'mechanic' ? <div className="min-h-0 flex-1 overflow-auto">{mechanicStub}</div> : empty ? <div className="min-h-0 flex-1 overflow-auto">{empty}</div> : view === 'floor'
          ? <FloorLanes lanes={lanes} open={HOURS.open} close={HOURS.close} selectedId={selectedId ?? undefined} state={state === 'loading' ? 'loading' : 'ready'} onSelect={(j) => setSelectedId(j.id)} onMove={move} />
          : <div className="min-h-0 flex-1 overflow-auto">{statusView}</div>}
      </SidePanelLayout>
      <Offcanvas open={detailOpen} onClose={closeDetail} label={selected ? `Service ${selected.number}` : inquiry ? `Inquiry from ${inquiry.name}` : 'Detail'}>{detailBody}</Offcanvas>
    </div>
  );

  const laneJobs = lanes.find((l) => l.id === phoneLane)?.jobs ?? [];
  const phone = (
    <div className="hidden h-full max-[640px]:block">
      {phoneJobObj ? (
        <Inspector asPage job={phoneJobObj} trackingLink={<TrackingLink job={phoneJobObj} />} onBack={() => setPhoneJob(null)} {...inspectorProps} className="min-h-full" />
      ) : (
        <>
          {facts}
          {as === 'mechanic' ? mechanicStub : empty ?? (
            <>
              <div className="px-4 pb-2">
                <SegmentedControl size="md" value={phoneView} onChange={(v) => setPhoneView(v as 'floor' | 'updates')} aria-label="Today view"
                  options={[{ value: 'floor', label: 'Floor' }, { value: 'updates', label: 'Updates', count: stuck.length + pendingInquiries }]} />
              </div>
              {phoneView === 'updates' ? <FloorFeed jobs={jobs} replied={replied} inventoryDown={inventory === 'down'} onOpenJob={(j) => setPhoneJob(j.id)} onOpenInquiry={openInquiry} floorRead={floorRead} tab={feedTab} onTabChange={setFeedTab} className="min-h-[60vh]" /> : (
              <>
              <div className="overflow-x-auto px-4 pb-2">
                <SegmentedControl
                  size="md"
                  value={phoneLane}
                  onChange={(v) => setPhoneLane(v as LaneId)}
                  options={lanes.map((l) => ({ value: l.id, label: l.id === 'unassigned' ? 'Not yet' : l.name, count: l.jobs.length }))}
                />
              </div>
              <div className="px-4 pb-6">
                {state === 'loading' ? <Skeleton variant="text" lines={6} /> : laneJobs.map((j) => <JobRow key={j.id} env={todayEnv} view={viewOf(j)} mechanics={mechanics} density="two-line" job={j} onOpen={(x) => setPhoneJob(x.id)} onAction={act} />)}
                {state !== 'loading' && laneJobs.length === 0 && <p className="py-4 text-[14px] text-muted">Nothing in this lane.</p>}
              </div>
              </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );

  const payingJob = paying ? jobs.find((j) => j.id === paying) : null;
  if (payingJob) return <PaymentScreen job={payingJob} backLabel="Today" initialOverlay={initialPaying?.overlay} onBack={() => setPaying(null)} onChange={(p) => set(payingJob.id, p as Overrides[string])} />;

  return (
    <>
      <PlatformShell
        railWidth="wide"
        railLabel="Shop"
        rail={rail}
        topBar={phoneJobObj ? <DetailTopBar back={<button type="button" onClick={() => setPhoneJob(null)} className="min-h-11 text-[14px] font-semibold">Today</button>} title={phoneJobObj.number} ledaScope={phoneJobObj.number} /> : topBar}
        phoneNav={phoneJobObj ? undefined : phoneNav}
        detail={!!phoneJobObj}
        heading="Today"
        hideSheetBarOnPhone
        sheetBar={
          <SheetBar wrapChildren={false} actionsFirst={false} actions={<><Button variant="primary" leftIcon={Plus} onClick={() => flow.openNew()}>New service</Button><AskLedaBar variant="bar" scope="Today" paused={leda.paused} onOpen={leda.openPalette} /></>}>
            <SheetBarWhere platform={platform} page="Today" note={as === 'mechanic' ? 'Viewing as Jun, mechanic' : undefined} />
            {as === 'manager' && <SegmentedControl size="sm" className="ml-4" value={view} onChange={(v) => setView(v as 'floor' | 'status')} options={[{ value: 'floor', label: 'Floor' }, { value: 'status', label: 'Status' }]} />}
          </SheetBar>
        }
        statusLabel="Status"
        status={
          <InventoryStatusBar
            platform={platform}
            dataLink={{ with: branch.inventory.platform, status: inventory === 'ok' ? 'linked' : 'slow', since: inventory === 'ok' ? '10:18' : '10:02' }}
            viewer={{ name: as === 'manager' ? 'Mon' : 'Jun', role: as === 'manager' ? 'Branch manager' : 'Mechanic' }}
            leda={{ canDecide: as === 'manager', managerName: 'Mon' }}
            updatedAt="10:20"
          />
        }
      >
        {desktop}
        {phone}
        <Offcanvas fullScreen open={!!inquiry} onClose={closeDetail} label={inquiry ? `Inquiry from ${inquiry.name}` : 'Inquiry'} className="min-[641px]:hidden">
          {inquiry && <InquiryDetail inquiry={inquiry} repliedAt={replied[inquiry.id]} job={inquiry.jobId ? jobs.find((j) => j.id === inquiry.jobId) : null} onReply={reply} onNewService={newService} onOpenJob={(j) => setPhoneJob(j.id)} onClose={closeDetail} />}
        </Offcanvas>
      </PlatformShell>
      <TodayDialogs
        dialog={dialog}
        onClose={() => setDialog(null)}
        onTransfer={(j) => doTransfer(j)}
        onEta={(j, _p, time) => { set(j.id, { pendingNote: `Expected ${time}` }); toast.undo(`${j.number} expected at ${time}.`, () => undo(j.id, ['pendingNote'])); }}
      />
      {leda.node}
      {flow.node}
      <Toaster />
    </>
  );
}
