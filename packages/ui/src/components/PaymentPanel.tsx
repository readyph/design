import { useRef, useState, type ReactNode } from 'react';
import { ArrowCounterClockwise, CheckCircle } from '@phosphor-icons/react';
import { Button } from './Button';
import { Select } from './Select';
import { TextField, Textarea } from './TextField';
import { cn } from '../utils/cn';
import { MoneyField } from './MoneyField';
import { Modal } from './Modal';
import { dayWord } from './sms/floorModel';
import { METHODS, PAY_WORD, billBalance, billPaid, billTotal, checkPayment, fmt, methodLabel, payStateOf, refLabelOf, type BillJob, type BillPayment as Payment, type PaymentMethod } from './payment/model';

/**
 * Studio-only BalancePanel (NEW, same recipe as the accepted "Price at a glance" box in the service form: rounded-card, border-rule, bg-raised):
 * the headline amount, Paid so far and Balance, then whatever the host puts under it (the payment form, or Release car). Total due lives here only.
 */
export function BalancePanel({ job, children, className }: { job: BillJob; children?: ReactNode; className?: string }) {
  const st = payStateOf(job); const bal = billBalance(job);
  return (
    <aside aria-label="Balance" className={cn('rounded-card border border-rule bg-raised p-4 text-[14px]', className)}>
      <p className={cn('flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide', st === 'paid' ? 'text-ok-ink' : 'text-muted')}>
        {st === 'paid' ? <><CheckCircle size={16} aria-hidden />Paid in full</> : 'Total due'}
      </p>
      <p className="mt-1 text-[26px] font-semibold leading-8 tabular-nums" data-testid="total-due">{fmt(billTotal(job))}</p>
      <dl className="mt-3 space-y-1.5">
        <div className="flex justify-between gap-3"><dt className="text-muted">Paid so far</dt><dd className="tabular-nums">{fmt(billPaid(job))}</dd></div>
        <div className="flex items-baseline justify-between gap-3 border-t border-control pt-2">
          <dt className="font-semibold">Balance</dt>
          <dd className={cn('text-[20px] font-semibold tabular-nums', st === 'paid' ? 'text-ok-ink' : bal > 0 ? 'text-warn-ink' : '')} data-testid="balance">{fmt(Math.max(0, bal))}</dd>
        </div>
      </dl>
      {st !== 'paid' && <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium"><span aria-hidden className={cn('size-2 rounded-full', st === 'partial' ? 'bg-warn-dot' : 'bg-faint')} />{PAY_WORD[st]}</p>}
      {children && <div className="mt-4 space-y-3 border-t border-control pt-4">{children}</div>}
    </aside>
  );
}

const PGRID = 'grid grid-cols-[96px_minmax(0,1fr)_minmax(0,1fr)_120px] items-baseline gap-x-3 max-[640px]:grid-cols-[minmax(0,1fr)_auto]';

/** "Payments received": a ruled table in the statement column (when, method and reference, received by, amount). The last one can be voided (manager, with a confirm). */
export function PaymentList({ payments, canVoid, onVoid }: { payments: Payment[]; canVoid: boolean; onVoid: () => void }) {
  return (
    <section aria-label="Payments received" className="rounded-card border border-rule bg-surface">
      <h2 className="px-4 py-3 text-[15px] font-semibold">Payments received</h2>
      {payments.length === 0 ? <p className="border-t border-rule px-4 py-3 text-[13px] text-muted">No payment yet.</p> : (
        <>
          <div className={cn(PGRID, 'border-y border-control px-4 py-2 text-[12px] text-muted max-[640px]:hidden')} aria-hidden><span>When</span><span>Method</span><span>Received by</span><span className="text-right">Amount</span></div>
          <ul>
            {payments.map((p, i) => (
              <li key={i} className={cn(PGRID, 'border-b border-rule px-4 py-2.5 text-[14px] last:border-b-0 max-[640px]:px-3 max-[640px]:first:border-t')}>
                <span className="text-muted max-[640px]:order-2 max-[640px]:col-span-2 max-[640px]:text-[12px]">{dayWord(p.at)}</span>
                <span className="min-w-0 max-[640px]:order-1">{methodLabel(p.method)}{p.ref && <span className="block text-[12px] text-muted">{p.ref}</span>}{p.remarks && <span className="block text-[12px] text-muted" data-testid="pay-remarks">Remarks: {p.remarks}</span>}{p.tendered && p.tendered > p.amount && <span className="block text-[12px] text-muted">change {fmt(p.tendered - p.amount)}</span>}</span>
                <span className="text-muted max-[640px]:hidden">{p.by ?? ''}</span>
                <span className="text-right tabular-nums max-[640px]:order-1">{fmt(p.amount)}</span>
              </li>
            ))}
          </ul>
          {canVoid && <div className="border-t border-rule px-4 py-1"><Button variant="text" leftIcon={ArrowCounterClockwise} onClick={onVoid} className="-ml-2">Void last payment</Button></div>}
        </>
      )}
    </section>
  );
}

export interface RecordPaymentProps {
  job: BillJob; onRecord: (p: Omit<Payment, 'at' | 'by'>) => void; disabledReason?: ReactNode;
  /** Story helper: open with a method already chosen. */
  initialMethod?: PaymentMethod;
}

/**
 * Studio-only RecordPayment (NEW): amount received (starts at the whole balance), method, a reference when the method is not cash,
 * and for cash the amount handed over with the change worked out. "Record payment" is the one primary. Partial amounts are normal (down payment).
 */
export function RecordPayment({ job, onRecord, disabledReason, initialMethod = 'CASH' }: RecordPaymentProps) {
  const bal = billBalance(job);
  const [amount, setAmount] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(initialMethod);
  const [ref, setRef] = useState('');
  const [tendered, setTendered] = useState('');
  const [tried, setTried] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [remarks, setRemarks] = useState('');
  const submitRef = useRef<HTMLButtonElement>(null);
  const amt = amount ?? String(bal);
  const chk = checkPayment(job, { amount: amt, method, ref, tendered });
  const refLabel = refLabelOf(method);
  const submit = () => {
    setTried(true);
    if (chk.error || chk.refError || chk.tenderedError) return;
    setConfirming(true);
  };
  const confirm = () => {
    onRecord({ amount: Number(amt), method, ref: refLabel ? ref.trim() : undefined, tendered: method === 'CASH' && tendered.trim() ? Number(tendered) : undefined, remarks: remarks.trim() || undefined });
    setConfirming(false); setAmount(null); setRef(''); setTendered(''); setRemarks(''); setTried(false);
  };
  if (disabledReason) return <section aria-label="Record a payment"><h2 className="mb-1 text-[15px] font-semibold">Record payment</h2><p className="text-[13px] text-muted">{disabledReason}</p></section>;
  const partial = Number(amt) > 0 && Number(amt) < bal;
  return (
    <form id="record-payment" onSubmit={(e) => { e.preventDefault(); submit(); }} aria-label="Record a payment">
      <h2 className="mb-2 text-[15px] font-semibold">Record payment</h2>
      <div className="space-y-3">
        <MoneyField
          size="large" label="Amount received" type="number" inputMode="decimal" min={0} unit="PHP" value={amt} onChange={(e) => setAmount(e.target.value)}
          error={tried || amount !== null ? chk.error ?? undefined : undefined}
          hint={partial ? `Partial payment. ${fmt(bal - Number(amt))} stays as the balance.` : 'The whole balance. Lower it for a down payment or part payment.'}
        />
        <div>
          <span id="pay-method" className="mb-1 block text-ui font-medium">Paid by</span>
          <Select aria-labelledby="pay-method" value={method} onValueChange={(m) => { setMethod(m as PaymentMethod); setRef(''); setTendered(''); }} options={METHODS.map((m) => ({ value: m.id, label: m.label }))} />
        </div>
        {refLabel && <TextField size="large" label={refLabel} value={ref} onChange={(e) => setRef(e.target.value)} error={tried ? chk.refError ?? undefined : undefined} />}
        {method === 'CASH' && (
          <div>
            <MoneyField size="large" label="Cash handed over (optional)" type="number" inputMode="decimal" min={0} unit="PHP" value={tendered} onChange={(e) => setTendered(e.target.value)} error={chk.tenderedError ?? undefined} hint="Type it to get the change." />
            {chk.change > 0 && <p className="mt-2 flex items-baseline justify-between border-y border-rule py-2 text-[14px]" aria-live="polite"><span className="font-medium">Change to give back</span><span className="text-[20px] font-semibold tabular-nums" data-testid="change">{fmt(chk.change)}</span></p>}
          </div>
        )}
        <Button ref={submitRef} type="submit" variant="primary" fullWidth>Record payment{Number(amt) > 0 && !chk.error ? ` · ${fmt(Number(amt))}` : ''}</Button>
      </div>
      {confirming && (
        <Modal open onOpenChange={(o) => !o && setConfirming(false)} size="sm" aria-label="Record payment"
          // The Remarks field takes focus on open, so the modal cannot know its opener: focus goes back to the Record payment button on Cancel, Esc and confirm.
          onCloseAutoFocus={(e) => { e.preventDefault(); submitRef.current?.focus(); }}>
          <Modal.Header>Record payment</Modal.Header>
          <Modal.Body>
            <p className="text-[14px] text-muted" data-testid="confirm-caption">Please confirm. This payment will be recorded on {job.number} and can't be edited, only voided.</p>
            <dl className="my-3 border-t border-rule text-[14px]" aria-label="Payment summary">
              <SumRow k="Amount"><span className="font-semibold tabular-nums">{fmt(Number(amt))}</span></SumRow>
              <SumRow k="Method">{methodLabel(method)}</SumRow>
              {refLabel && <SumRow k="Reference">{ref.trim()}</SumRow>}
              {method === 'CASH' && chk.change > 0 && <SumRow k="Change to give back"><span className="tabular-nums">{fmt(chk.change)}</span></SumRow>}
            </dl>
            <Textarea label="Remarks (optional)" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. paid by customer's sister" autoFocus />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirm}>Record payment</Button>
          </Modal.Footer>
        </Modal>
      )}
    </form>
  );
}

const SumRow = ({ k, children }: { k: string; children: ReactNode }) => (
  <div className="flex justify-between gap-3 border-b border-rule py-2"><dt className="text-muted">{k}</dt><dd className="m-0 text-right">{children}</dd></div>
);

export const PaidNotice = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-control border border-ok-dot bg-ok-bg px-3 py-2.5 text-[14px]">
    <CheckCircle size={20} aria-hidden className="flex-none text-ok-ink" /><span className="min-w-0 flex-1">{children}</span>{action}
  </div>
);
