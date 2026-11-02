import { useState } from 'react';
import { CaretLeft, ClipboardText, Gear, Users, Wrench } from '@phosphor-icons/react';
import {
  AccountMenu, Button, ConfirmDialog, DetailTopBar, IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer, InventoryStatusBar, Notice,
  PlatformShell, SheetBar, SheetBarWhere, Skeleton, Toaster, cn, toast,
} from '../../index';
import { NOW, branch, customerOf, jobBalance, jobPaid, jobSubtotal, jobTotal, manager, type Discount, type Job, type PartLine, type Payment, type PaymentMethod, type ServiceLine } from './data';
import { STATUS_SHORT } from './floorModel';
import { fmt, isClosed, isFinalPrice, isQuoteStatus, jobFor, methodLabel, payStateOf, receiptOf } from './paymentModel';
import { PaymentDiscount } from './ext/PaymentDiscount';
import { PaymentStatement } from './ext/PaymentStatement';
import { BalancePanel, PaidNotice, PaymentList, RecordPayment } from './ext/PaymentPanel';
import { StatementActions } from './ext/StatementActions';
import { ReceiptModal } from './ext/ReceiptDoc';

export type PaymentOverlay = 'none' | 'discount' | 'add line' | 'receipt' | 'receipt slip' | 'void';

export interface PaymentScreenProps {
  job: Job;
  /** The mechanic sees the statement and the receipt, nothing that moves money. */
  role?: 'manager' | 'mechanic';
  state?: 'ready' | 'loading';
  /** Where Back goes ("Services", "Today"): the page the Collect payment click came from. */
  backLabel?: string;
  onBack: () => void;
  /** Persist a change to the job (payments, discount, lines, status). The host keeps it, so Today and Services show the new totals. */
  onChange: (patch: Partial<Job>) => void;
  initialOverlay?: PaymentOverlay;
  initialMethod?: PaymentMethod;
}

/**
 * v2 Shop floor, Payment: a full page in the shell, reached from "Collect payment" (Inspector, Today row, Services row). One question:
 * "What does this customer owe, and how much did they just hand me?" The final price sits on the left as a flat statement;
 * The Balance panel (Total due, Paid so far, Balance, the payment form) is sticky on the right and comes first on a phone. Download and Print sit once, top right of the header. Controlled: the host keeps the job.
 */
export function PaymentScreen({ job, role = 'manager', state = 'ready', backLabel = 'Services', onBack, onChange, initialOverlay = 'none', initialMethod }: PaymentScreenProps) {
  const [discountOpen, setDiscountOpen] = useState(initialOverlay === 'discount');
  const [addOpen, setAddOpen] = useState(initialOverlay === 'add line');
  const [receipt, setReceipt] = useState<null | 'a4' | 'slip'>(initialOverlay === 'receipt' ? 'a4' : initialOverlay === 'receipt slip' ? 'slip' : null);
  const [voidOpen, setVoidOpen] = useState(initialOverlay === 'void');
  const [last, setLast] = useState<null | { amount: number; method: PaymentMethod; change: number }>(null);

  const mgr = role === 'manager';
  const quote = isQuoteStatus(job); const closed = isClosed(job);
  const editable = mgr && !quote && !closed;
  const st = payStateOf(job); const bal = jobBalance(job);
  const c = customerOf(job);
  const title = isFinalPrice(job) ? 'Final price' : 'Price so far';

  const patchWithUndo = (patch: Partial<Job>, message: string) => {
    const before: Partial<Job> = {};
    (Object.keys(patch) as (keyof Job)[]).forEach((k) => { (before as Record<string, unknown>)[k] = job[k]; });
    onChange(patch);
    toast.undo(message, () => onChange(before));
  };
  const record = (p: Omit<Payment, 'at' | 'by'>) => {
    const next = { ...p, at: NOW, by: manager.short };
    const left = bal - p.amount;
    setLast({ amount: p.amount, method: p.method, change: p.tendered && p.tendered > p.amount ? p.tendered - p.amount : 0 });
    patchWithUndo({ payments: [...job.payments, next] }, `${fmt(p.amount)} received by ${methodLabel(p.method)} on ${job.number}. ${left > 0 ? `Balance ${fmt(left)}.` : 'Paid in full.'}`);
  };
  const doVoid = () => {
    const gone = job.payments[job.payments.length - 1];
    setVoidOpen(false); setLast(null);
    patchWithUndo({ payments: job.payments.slice(0, -1) }, `${fmt(gone.amount)} ${methodLabel(gone.method)} payment voided on ${job.number}.`);
  };
  const applyDiscount = (d: Discount) => { setDiscountOpen(false); patchWithUndo({ discount: d }, `Discount of ${d.kind === 'percent' ? `${d.value}%` : fmt(d.value)} added to ${job.number}.`); };
  const removeDiscount = () => { setDiscountOpen(false); patchWithUndo({ discount: undefined }, `Discount removed from ${job.number}.`); };
  const addLine = (l: { service?: ServiceLine; part?: PartLine }) => {
    patchWithUndo(l.service ? { services: [...job.services, l.service] } : { parts: [...job.parts, l.part!] }, `Line added at billing on ${job.number}.`);
  };
  const removeLine = (kind: 'service' | 'part', index: number) => {
    const next = kind === 'service' ? { services: job.services.filter((_, i) => i !== index) } : { parts: job.parts.filter((_, i) => i !== index) };
    if (jobTotal({ ...job, ...next }) < jobPaid(job)) { toast.info(`That would put the total under what is already paid (${fmt(jobPaid(job))}). Void a payment first.`); return; }
    patchWithUndo(next, `Line removed from ${job.number}.`);
  };
  const release = () => patchWithUndo({ status: 'COMPLETED' }, `${job.number} released to ${c.name}.`);

  // ---- chrome ----
  const platform = { name: branch.name, initials: 'DC' };
  const rail = (
    <IconRailContent>
      <IconRailMark href="#portal" label="Back to the ReadyPH Portal" />
      <IconRailItem icon={Wrench} label="Today" href="#today" />
      <IconRailItem icon={ClipboardText} label="Services" href="#services" current />
      <IconRailItem icon={Users} label="Customers" href="#customers" />
      <IconRailItem icon={Gear} label="Settings" href="#settings" />
      <IconRailSpacer />
      <IconRailFoot><AccountMenu name={manager.name} email="mon@delacruzauto.example" role="Branch manager" initials={manager.initials} applyToDocument={false} /></IconRailFoot>
    </IconRailContent>
  );
  const backBtn = (cls?: string) => <button type="button" onClick={onBack} className={cn('inline-flex min-h-11 items-center gap-1 text-[14px] font-semibold hover:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent', cls)}><CaretLeft size={14} aria-hidden />Back to {backLabel === 'Today' ? 'Today' : job.number}</button>;

  const discountAction = editable ? <button type="button" onClick={() => setDiscountOpen((o) => !o)} aria-expanded={discountOpen} className="inline-flex min-h-11 items-center text-[13px] font-semibold text-accent underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">{job.discount ? 'Change' : 'Add discount'}</button> : null;

  const body = state === 'loading' ? (
    <div className="space-y-6 p-pad" aria-busy="true" aria-label="Loading payment"><Skeleton variant="text" lines={2} /><Skeleton variant="rect" height={220} /><Skeleton variant="text" lines={4} /></div>
  ) : (
    <div className="mx-auto w-full max-w-[1180px] px-6 py-6 max-[640px]:px-0 max-[640px]:py-3">
      <header className="mb-6 px-4 max-[640px]:px-3">
        <div className="max-[640px]:hidden">{backBtn('-ml-1')}</div>
        <div className="mt-1 flex items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-baseline gap-x-3 text-[22px] font-semibold leading-8">Payment<span className="font-mono text-[18px] text-muted">{job.number}</span></h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[14px]"><span aria-hidden className={cn('size-1.5 rounded-full', STATUS_SHORT[job.status].dot)} />{STATUS_SHORT[job.status].label}<span aria-hidden className="text-faint">·</span><span className="tabular-nums text-muted">{c.phone}</span></p>
          </div>
          {!quote && <StatementActions doc={receiptOf(job)} onPrint={() => setReceipt('a4')} />}
        </div>
      </header>

      {quote && <div className="mb-6 px-4 max-[640px]:px-3"><Notice tone="info" title="Not booked yet">This is a quotation, so there is nothing to pay. Payment starts once the customer agrees and the service is booked.</Notice></div>}
      {!quote && job.status !== 'FOR_PICKUP' && job.status !== 'COMPLETED' && <div className="mb-6 px-4 max-[640px]:px-3"><Notice tone="info" title="Work is still going">Anything taken now is a down payment. The price can still change until the car is ready.</Notice></div>}
      {closed && <div className="mb-6 px-4 max-[640px]:px-3"><Notice tone="info" title="Completed and released">The statement is closed. You can still print the receipt.</Notice></div>}
      {!mgr && <div className="mb-6 px-4 max-[640px]:px-3"><Notice tone="info" title="View only">Payments and discounts are for the manager. You can read the statement and print the receipt.</Notice></div>}

      <div className="grid items-start gap-y-6 px-4 max-[640px]:px-3 min-[1100px]:grid-cols-[minmax(0,1fr)_360px] min-[1100px]:gap-x-8">
        <div className="min-[1100px]:sticky min-[1100px]:top-6 min-[1100px]:col-start-2 min-[1100px]:row-start-1">
          <BalancePanel job={job}>
            {last && st !== 'paid' && <PaidNotice>{fmt(last.amount)} received by {methodLabel(last.method)}.{last.change > 0 ? ` Give ${fmt(last.change)} change.` : ''} Balance {fmt(bal)}.</PaidNotice>}
            {st === 'paid' && !closed && !quote ? (
              <>
                {last && <PaidNotice>{fmt(last.amount)} received{last.change > 0 ? `, give ${fmt(last.change)} change` : ''}.</PaidNotice>}
                {job.status === 'FOR_PICKUP' && mgr ? <Button variant="primary" onClick={release} fullWidth>Release car to {c.name.split(' ')[0]}</Button> : null}
                {job.status !== 'FOR_PICKUP' && <p className="text-[13px] text-muted">The car is still in the shop. It can be released once it is ready for pick-up.</p>}
              </>
            ) : (
              <RecordPayment
                job={job} onRecord={record} initialMethod={initialMethod}
                disabledReason={!mgr ? 'Payments are taken at the counter by the manager.' : quote ? 'Not available for a quotation.' : closed ? 'This service is completed, so no more payments can be recorded.' : jobTotal(job) <= 0 ? 'Add a line first. There is nothing to pay yet.' : undefined}
              />
            )}
          </BalancePanel>
        </div>
        <div className="min-w-0 space-y-6 min-[1100px]:col-start-1 min-[1100px]:row-start-1">
          <PaymentStatement
            job={job} title={title} editable={editable} onAdd={addLine} onRemove={removeLine} addOpen={addOpen} onAddOpen={setAddOpen}
            discountAction={discountAction}
            discountSlot={discountOpen && editable ? <PaymentDiscount job={job} onApply={applyDiscount} onRemove={removeDiscount} onCancel={() => setDiscountOpen(false)} /> : undefined}
          />
          {jobSubtotal(job) > 0 && bal < 0 && <p className="text-[13px] text-bad">Paid is more than the total. Void the last payment or add a line.</p>}
          <PaymentList payments={job.payments} canVoid={editable} onVoid={() => setVoidOpen(true)} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PlatformShell
        railWidth="wide" railLabel="Shop" rail={rail}
        topBar={<DetailTopBar back={<button type="button" onClick={onBack} className="min-h-11 text-[14px] font-semibold">{backLabel}</button>} title={`Payment ${job.number}`} ledaScope={`Payment ${job.number}`} />}
        detail
        heading="Payment"
        hideSheetBarOnPhone
        sheetBar={
          <SheetBar wrapChildren={false} actionsFirst={false}>
            <SheetBarWhere platform={platform} page={`Payment ${job.number}`} parent={<button type="button" onClick={onBack} className="font-semibold hover:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">{backLabel}</button>} note={!mgr ? 'Viewing as Jun, mechanic' : undefined} />
          </SheetBar>
        }
        statusLabel="Status"
        status={<InventoryStatusBar platform={platform} dataLink={{ with: branch.inventory.platform, status: 'linked', since: '10:18' }} viewer={{ name: mgr ? 'Mon' : 'Jun', role: mgr ? 'Branch manager' : 'Mechanic' }} leda={{ canDecide: mgr, managerName: 'Mon' }} updatedAt="10:20" />}
      >
        <div className="h-full overflow-auto">{body}</div>
      </PlatformShell>

      {receipt && <ReceiptModal doc={receiptOf(job)} initialPaper={receipt} onClose={() => setReceipt(null)} />}
      <ConfirmDialog
        open={voidOpen} onOpenChange={setVoidOpen} title="Void the last payment?"
        description="It comes off the payments and the balance goes back up. You can undo this right after."
        name={job.payments.length ? `${fmt(job.payments[job.payments.length - 1].amount)} · ${methodLabel(job.payments[job.payments.length - 1].method)}` : undefined}
        confirmLabel="Void payment" cancelLabel="Keep it" onCancel={() => setVoidOpen(false)} onConfirm={doVoid}
      />
      <Toaster />
    </>
  );
}

export interface PaymentProps extends Partial<Omit<PaymentScreenProps, 'job' | 'onChange'>> {
  /** Which sample job (see paymentModel PAYMENT_JOBS). */
  jobId?: string;
}

/** Standalone Payment page for the Payment story: keeps the job in its own state. In Services and Today the same screen is reached with Collect payment. */
export function PaymentPage({ jobId = 'unpaid', onBack, ...rest }: PaymentProps) {
  const base = jobFor(jobId);
  const [patch, setPatch] = useState<Partial<Job>>({});
  const job = { ...base, ...patch } as Job;
  return <PaymentScreen {...rest} job={job} onChange={(p) => setPatch((x) => ({ ...x, ...p }))} onBack={onBack ?? (() => toast.info('In the full flow, Back returns to the Services list or Today. Open Collect payment there.'))} />;
}
