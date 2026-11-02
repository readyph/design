import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { ClipboardText, Gear, MagnifyingGlass, Tray, Wrench } from '@phosphor-icons/react';
import {
  AccountMenu, CountBadge, DetailTopBar, EmptyState, IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer, InventoryStatusBar,
  PlatformShell, SegmentedControl, SheetBar, SheetBarWhere, Skeleton, Toaster, cn, toast,
} from '../../index';
import { branch, manager, productOf, vehicleOf } from './data';
import { shortName } from './floorModel';
import { useMech, type QuoteState } from './mechModel';
import {
  KIND_LABEL, answerQuote, countsOf, declinePart, dismissProblem, itemsOf, jobOf, markItemRead, matches, mechOf, needsCount, pesos, quoteProblem, replyInThread, replyToCustomer, senderOf, seedRequests, setPartStatus,
  type Filter, type RequestsScenario,
} from './requestsModel';
import { ServicesPage } from './Services.page';
import { RequestBody, RequestHeader, type DetailActions } from './ext/RequestDetail';
import { RequestList } from './ext/RequestList';
import { DeclineModal, DismissModal, QuoteModal } from './ext/RequestModals';
import { RequestThread } from './ext/RequestThread';
import { CustomerThread } from './ext/CustomerThread';

export type RequestsOverlay = 'none' | 'quote' | 'decline' | 'dismiss' | 'service';
export interface RequestsProps {
  /** `loading` shows skeleton rows. */
  state?: 'ready' | 'loading';
  /** What the store is seeded with. */
  scenario?: RequestsScenario;
  /** Item id to open (`part:rq2`, `problem:pp1`, `question:ms10`, `note:n2`), `auto` = the first one waiting for you on desktop, `null` = none. */
  initialSelected?: string | null | 'auto';
  initialFilter?: Filter;
  /** Where a new or seeded quote stands with the customer. Story control only: the real answer comes from the customer. */
  customerApproval?: QuoteState['customer'];
  /** Open on a dialog or the Inspector for the selected item. */
  overlay?: RequestsOverlay;
}

const FILTERS: Filter[] = ['all', 'needs', 'parts', 'problems', 'messages'];
const FILTER_LABEL: Record<Filter, string> = { all: 'All', needs: 'Needs you', parts: 'Parts', problems: 'Problems', messages: 'Messages' };

/** Manager "Requests & messages": what mechanics sent (parts, found problems, questions, notes) with the moves to answer each. Reads and writes the SAME store as the Mechanic app. */
export function RequestsPage({ state = 'ready', scenario = 'default', initialSelected = 'auto', initialFilter = 'all', customerApproval = 'waiting', overlay = 'none' }: RequestsProps) {
  useState(() => { seedRequests({ scenario, customer: customerApproval }); return 0; });
  const s = useMech();
  const items = useMemo(() => itemsOf(s), [s]);
  const counts = countsOf(items);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [q, setQ] = useState('');
  const wide = typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 641px)').matches;
  const [selectedId, setSelectedId] = useState<string | null>(() => (initialSelected === 'auto' ? (wide ? itemsOf(s).find((i) => i.needsYou)?.id ?? null : null) : initialSelected));
  const [phoneOpen, setPhoneOpen] = useState(initialSelected !== null && initialSelected !== 'auto');
  const [dlg, setDlg] = useState<'quote' | 'decline' | 'dismiss' | null>(overlay === 'quote' || overlay === 'decline' || overlay === 'dismiss' ? overlay : null);
  /** The service whose real detail (the Services page) is open; `selected` = the open item's service. */
  const [svc, setSvc] = useState<string | null | 'selected'>(overlay === 'service' ? 'selected' : null);

  const shown = useMemo(() => items.filter((i) => matches(i, filter, q)), [items, filter, q]);
  const item = items.find((i) => i.id === selectedId) ?? null;
  const job = item ? jobOf(item.jobId) : null;
  useEffect(() => { if (selectedId) markItemRead(selectedId); }, [selectedId]);
  const svcId = svc === 'selected' ? job?.id ?? null : svc;

  const open = (id: string) => { setSelectedId(id); setPhoneOpen(true); };
  const close = () => setPhoneOpen(false);
  const mech = item ? senderOf(item) : null;

  const a: DetailActions = {
    onApprove: () => { const r = item?.part; if (!r) return; setPartStatus(r.id, 'Approved'); toast.undo(`Approved ${shortName(productOf(r.productId))}. ${mechOf(r.by).short} sees it as Approved.`, () => setPartStatus(r.id, 'Requested')); },
    onReady: () => { const r = item?.part; if (!r) return; setPartStatus(r.id, 'Ready at stockroom'); toast.undo(`${shortName(productOf(r.productId))} is ready at the stockroom. ${mechOf(r.by).short} can collect it.`, () => setPartStatus(r.id, 'Approved')); },
    onDecline: () => setDlg('decline'), onQuote: () => setDlg('quote'), onDismiss: () => setDlg('dismiss'),
    onAnswer: (text) => { if (!item?.jobId || !mech) return; replyInThread(item.jobId, mech.id, text, item.id); toast.info(`${text} sent to ${mech.short}.`); },
    onCustomerAnswer: (ans) => { if (!item?.problem) return; answerQuote(item.problem.id, ans); toast.info(ans === 'approved' ? `Customer approved. ${mech!.short} was told to go ahead.` : `Customer declined. ${mech!.short} was told not to do it.`); },
    onOpenService: (j) => setSvc(j.id),
    onBack: close,
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Escape' && phoneOpen && !dlg && !svcId && !e.defaultPrevented) close(); };
  const needs = needsCount(s);
  const platform = { name: branch.name, initials: 'DC' };

  const rail = (
    <IconRailContent>
      <IconRailMark href="#portal" label="Back to the ReadyPH Portal" />
      <IconRailItem icon={Wrench} label="Today" href="#today" />
      <IconRailItem icon={ClipboardText} label="Services" href="#services" />
      <IconRailItem icon={Tray} label="Requests" href="#requests" current count={needs} />
      <IconRailItem icon={Gear} label="Settings" href="#settings" />
      <IconRailSpacer />
      <IconRailFoot><AccountMenu name={manager.name} email="mon@delacruzauto.example" role="Branch manager" initials={manager.initials} applyToDocument={false} /></IconRailFoot>
    </IconRailContent>
  );
  const tab = 'relative flex min-h-11 flex-col items-center justify-center gap-[3px] text-tiny text-muted';
  const phoneNav = (
    <div className="grid h-[60px] w-full grid-cols-3 items-stretch">
      <a href="#today" className={tab}><Wrench size={20} aria-hidden />Today</a>
      <a href="#services" className={tab}><ClipboardText size={20} aria-hidden />Services</a>
      <a href="#requests" aria-current="page" className={cn(tab, 'font-medium text-text')}><Tray size={20} aria-hidden />Requests<CountBadge count={needs} placement="tab" /></a>
    </div>
  );
  const topBar = (
    <>
      <span className="flex-none whitespace-nowrap text-[15px] font-semibold">Requests & messages</span>
      <span className="min-w-0 truncate text-[13px] text-muted">· {branch.name}</span>
      <span className="flex-1" />
      <span className="contents [&>button]:size-11"><AccountMenu name={manager.name} email="mon@delacruzauto.example" role="Branch manager" initials={manager.initials} applyToDocument={false} /></span>
    </>
  );

  const listPane = (
    <div className={cn('flex h-full min-h-0 w-[420px] flex-none flex-col border-r border-rule max-[640px]:w-full max-[640px]:border-r-0', phoneOpen && 'max-[640px]:hidden')}>
      <div className="flex-none px-4 pb-2 pt-3">
        <div className="overflow-x-auto">
          <SegmentedControl size="md" semantics="radio" value={filter} onChange={(v) => setFilter(v as Filter)} aria-label="Filter requests" options={FILTERS.map((f) => ({ value: f, label: FILTER_LABEL[f], count: counts[f] }))} />
        </div>
        <div className="relative mt-2">
          <MagnifyingGlass size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="search" aria-label="Search by plate or mechanic" placeholder="Search plate or mechanic" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 w-full rounded-control border border-control bg-surface pl-9 pr-3 text-[14px] text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:h-11" />
        </div>
        <p className="mt-2 hidden items-center gap-2 text-[12px] leading-5 text-muted min-[641px]:flex"><span aria-hidden className="size-4 flex-none rounded-chip border border-warn-dot bg-warn-bg" />Tinted = waiting for you</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {state === 'loading' ? (
          <div aria-busy="true" aria-label="Loading requests" className="px-4"><Skeleton variant="text" lines={9} /></div>
        ) : (
          <RequestList
            items={shown} selectedId={selectedId} onOpen={open}
            empty={<div className="p-4"><EmptyState align="start" icon={Tray} title={items.length === 0 || (items.every((i) => !i.needsYou) && filter === 'needs') ? 'All clear' : 'Nothing matches'} description={filter === 'needs' && !q ? 'Nothing is waiting for you. New requests from mechanics show up here.' : q ? `No request matches "${q}".` : `No ${FILTER_LABEL[filter].toLowerCase()} from mechanics yet.`} /></div>}
          />
        )}
      </div>
    </div>
  );

  const detailPane = (
    <div className={cn('min-h-0 min-w-0 flex-1 overflow-y-auto', !phoneOpen && 'max-[640px]:hidden')} data-detail>
      {state === 'loading' ? (
        <div className="px-4 pt-4"><Skeleton variant="text" lines={7} /></div>
      ) : item ? (
        <article aria-label={`${KIND_LABEL[item.kind]} from ${mech!.short}`} key={item.id} className="pb-4">
          <RequestHeader item={item} job={job} a={a} />
          <RequestBody item={item} job={job} a={a} />
          {item.kind === 'customer' && job ? <CustomerThread job={job} s={s} onSend={(t) => { replyToCustomer(job.id, t); toast.info(`Sent to ${mech!.short}.`); }} /> : <RequestThread job={job} s={s} mech={mechOf(item.mechId)} itemKey={item.id} onSend={(t) => { if (!item.jobId) return; replyInThread(item.jobId, mech!.id, t, item.id); toast.info(`Sent to ${mech!.short}.`); }} />}
        </article>
      ) : (
        <div className="grid h-full place-items-center p-6"><EmptyState icon={Tray} title={counts.needs ? 'Pick a request' : 'All clear'} description={counts.needs ? `${counts.needs} waiting for you. Choose one on the left.` : 'Nothing is waiting for you.'} /></div>
      )}
    </div>
  );

  const partName = item?.part ? shortName(productOf(item.part.productId)) : '';
  const sheet = (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="relative flex h-full min-h-0 overflow-hidden" onKeyDown={onKeyDown}>
      {listPane}
      {detailPane}
    </div>
  );

  // "Open service" goes to the real service detail on the Services page; closing it comes back here with the same item selected.
  if (svcId) return <ServicesPage initialTab="list" initialDetail={{ kind: 'service', id: svcId }} onLeaveDetail={() => setSvc(null)} />;

  return (
    <>
      <PlatformShell
        railWidth="wide" railLabel="Shop" rail={rail}
        topBar={phoneOpen && item ? <DetailTopBar back={<button type="button" onClick={close} className="min-h-11 text-[14px] font-semibold">Requests</button>} title={job ? vehicleOfPlate(job) : 'Shop use'} ledaScope="Requests" /> : topBar}
        phoneNav={phoneOpen && item ? undefined : phoneNav} detail={phoneOpen && !!item} heading="Requests & messages" hideSheetBarOnPhone
        sheetBar={<SheetBar wrapChildren={false} actionsFirst={false}><SheetBarWhere platform={platform} page="Requests" /></SheetBar>}
        statusLabel="Status"
        status={<InventoryStatusBar platform={platform} dataLink={{ with: branch.inventory.platform, status: 'linked', since: '10:18' }} viewer={{ name: 'Mon', role: 'Branch manager' }} leda={{ canDecide: true, managerName: 'Mon' }} updatedAt="10:20" />}
      >
        {sheet}
      </PlatformShell>
      {item?.part && <DeclineModal key={item.id} open={dlg === 'decline'} partName={partName} onClose={() => setDlg(null)} onConfirm={(reason, note) => { declinePart(item.part!.id, reason, note); setDlg(null); toast.info(`Declined ${partName}. ${mech!.short} was told why.`); }} />}
      {item?.problem && (
        <>
          <QuoteModal key={`q${item.id}`} open={dlg === 'quote'} problem={item.problem.text} customerAfter={customerApproval} onClose={() => setDlg(null)} onSend={(quote) => { quoteProblem(item.problem!.id, quote); setDlg(null); toast.info(`Quoted ${pesos(quote.amount)}. Waiting for the customer.`); }} />
          <DismissModal key={`d${item.id}`} open={dlg === 'dismiss'} onClose={() => setDlg(null)} onConfirm={(reason) => { dismissProblem(item.problem!.id, reason); setDlg(null); toast.info('Dismissed. The mechanic was told.'); }} />
        </>
      )}
      <Toaster />
    </>
  );
}

const vehicleOfPlate = (j: NonNullable<ReturnType<typeof jobOf>>) => vehicleOf(j).plate;
