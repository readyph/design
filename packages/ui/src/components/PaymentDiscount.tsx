import { useState, type ReactNode } from 'react';
import { Button } from './Button';
import { SegmentedControl } from './SegmentedControl';
import { TextField } from './TextField';
import { MoneyField } from './MoneyField';
import { cn } from '../utils/cn';
import type { Discount, Job } from './sms/data';
import { DISCOUNT_REASONS, discountError, discountPreview, fmt } from './sms/paymentModel';
import { jobSubtotal } from './sms/data';

/** Studio-only ToggleChip (NEW): an on/off filter as a pressed button, text-labelled (never colour alone). */
function ToggleChip({ pressed, onChange, children, className }: { pressed: boolean; onChange: (on: boolean) => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button" aria-pressed={pressed} onClick={() => onChange(!pressed)}
      className={cn('inline-flex h-[34px] flex-none items-center gap-1.5 whitespace-nowrap rounded-control border px-3 text-[13px] transition-colors duration-150 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:h-11',
        pressed ? 'border-accent bg-accent-tint font-medium text-text' : 'border-control bg-surface text-text hover:bg-raised', className)}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', pressed ? 'bg-accent' : 'bg-faint')} />{children}
    </button>
  );
}

/**
 * Studio-only PaymentDiscount (NEW): the optional custom discount, collapsed until asked for. Peso amount or percent, a reason,
 * a live preview of the discount and the new total, and plain validation. Manager only (the page does not mount it for a mechanic).
 */
export function PaymentDiscount({ job, onApply, onRemove, onCancel }: { job: Job; onApply: (d: Discount) => void; onRemove: () => void; onCancel: () => void }) {
  const cur = job.discount;
  const [kind, setKind] = useState<Discount['kind']>(cur?.kind ?? 'amount');
  const [raw, setRaw] = useState(cur ? String(cur.value) : '');
  const [reason, setReason] = useState(cur?.reason ?? '');
  const [tried, setTried] = useState(false);
  const err = discountError(kind, raw, job);
  const off = discountPreview(kind, raw, job);
  const apply = () => { setTried(true); if (!err) onApply({ kind, value: Number(raw), reason: reason.trim() || undefined }); };
  return (
    <form onSubmit={(e) => { e.preventDefault(); apply(); }} aria-label="Custom discount" className="border-t border-rule bg-raised px-4 py-4 max-[640px]:px-3">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-3 max-[640px]:grid-cols-1">
        <div>
          <span id="disc-kind" className="mb-1 block text-ui font-medium">Take off</span>
          <SegmentedControl size="md" aria-labelledby="disc-kind" value={kind} onChange={(v) => { setKind(v as Discount['kind']); setTried(false); }} options={[{ value: 'amount', label: 'Pesos (₱)' }, { value: 'percent', label: 'Percent (%)' }]} />
        </div>
        <MoneyField
          size="large" label={kind === 'percent' ? 'Percent off' : 'Amount off'} type="number" inputMode="decimal" min={0} unit={kind === 'percent' ? '%' : 'PHP'} value={raw}
          onChange={(e) => setRaw(e.target.value)} error={tried || raw ? err ?? undefined : undefined}
          hint={kind === 'percent' ? `0 to 100, taken from the subtotal ${fmt(jobSubtotal(job))}.` : `Up to the subtotal, ${fmt(jobSubtotal(job))}.`}
        />
      </div>
      <div className="mt-3">
        <TextField size="large" label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Shown on the receipt" />
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Common reasons">
          {DISCOUNT_REASONS.map((r) => <ToggleChip key={r} pressed={reason === r} onChange={(on) => setReason(on ? r : '')}>{r}</ToggleChip>)}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="min-w-0 flex-1 text-[13px] text-muted" aria-live="polite">
          {!err && off > 0 ? <>Takes off <b className="font-semibold text-text tabular-nums">{fmt(off)}</b>. New total <b className="font-semibold text-text tabular-nums">{fmt(jobSubtotal(job) - off)}</b>.</> : 'The customer sees this line on the receipt.'}
        </p>
        {cur && <Button type="button" variant="text" onClick={onRemove}>Remove discount</Button>}
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={!!err && tried}>{cur ? 'Update discount' : 'Apply discount'}</Button>
      </div>
    </form>
  );
}
