import { useId, useState, type HTMLAttributes } from 'react';
import { Minus, Plus } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';

export const QUANTITY_MAX = 9999;

export interface QuantityStepperProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Current quantity (whole number). */
  value: number;
  /** Called with the committed, clamped quantity. */
  onValueChange: (value: number) => void;
  /** Lowest allowed quantity. 1 by default; Receive and Record movement pass 0. */
  min?: number;
  /** Highest allowed quantity. 9,999 by default; stock-out and transfer pass the on-hand count. */
  max?: number;
  /** Product name, used in the accessible labels ("Quantity of {product}", "One less {product}"). */
  productName?: string;
  /**
   * `receive` (arrived count) and `damaged` (damaged count) are the Receive form's count lines (purchase-orders.css 134-137, 268-270; products.css 226, 363):
   * transparent background, 72px (arrived) or 88px (damaged) field, 48px phone buttons. Default keeps every existing consumer unchanged.
   */
  look?: 'default' | 'receive' | 'damaged';
}

const control =
  'grid h-9 w-9 flex-none cursor-pointer place-items-center border border-control bg-surface text-[14px] text-text hover:border-muted hover:bg-raised max-[640px]:h-11 max-[640px]:w-[52px]';
const controlCount =
  'grid h-9 w-9 flex-none cursor-pointer place-items-center border border-control bg-transparent text-[14px] text-text hover:border-muted hover:bg-raised max-[640px]:h-12 max-[640px]:w-12';
const fieldBase =
  'rounded-none border border-x-0 border-control p-0 text-center font-semibold tabular-nums text-text [appearance:textfield] focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none';
const FIELD = {
  default: `${fieldBase} h-9 w-[88px] bg-surface text-[16px] max-[640px]:h-11 max-[640px]:w-auto max-[640px]:flex-1`,
  receive: `${fieldBase} h-9 w-[72px] bg-transparent text-[16px] max-[640px]:h-12 max-[640px]:w-auto max-[640px]:flex-1 max-[640px]:text-[18px]`,
  damaged: `${fieldBase} h-9 w-[88px] bg-transparent text-[16px] max-[640px]:h-11 max-[640px]:w-auto max-[640px]:flex-1`,
} as const;

/** Quantity stepper (I2): joined minus button, whole-number field and plus button, with a polite note line for clamped entries. */
export function QuantityStepper({
  value,
  onValueChange,
  min = 1,
  max = QUANTITY_MAX,
  productName,
  look = 'default',
  className,
  ...rest
}: QuantityStepperProps) {
  const noteId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const commit = (raw: string) => {
    const n = raw.trim() === '' ? NaN : Math.trunc(Number(raw));
    let next = n;
    let message = '';
    if (Number.isNaN(n) || n < min) {
      next = min;
      if (min >= 1) message = 'Quantity must be at least 1. To take it off the list, use Remove.';
    } else if (n > max) {
      next = max;
      message = max === QUANTITY_MAX ? `Most you can order here is 9,999. Set to 9,999.` : `Most you can enter is ${max.toLocaleString('en-US')}. Set to ${max.toLocaleString('en-US')}.`;
    }
    setNote(message);
    setDraft(null);
    onValueChange(next);
  };

  const step = (by: number) => {
    const next = Math.min(max, Math.max(min, value + by));
    setNote('');
    setDraft(null);
    onValueChange(next);
  };

  const ctl = look === 'default' ? control : controlCount;
  const suffix = productName ? ` ${productName}` : '';

  return (
    <div className={cn('flex flex-col gap-1', className)} {...rest}>
      <div role="group" aria-label={productName ? `Quantity of ${productName}` : 'Quantity'} className="flex w-fit items-center max-[640px]:w-full">
        <button type="button" aria-label={`One less${suffix}`} onClick={() => step(-1)} className={cn(ctl, focusRing, 'rounded-l-control rounded-r-none')}>
          <Minus aria-hidden size={14} />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          aria-label={productName ? `Quantity of ${productName}` : 'Quantity'}
          aria-describedby={noteId}
          value={draft ?? String(value)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => draft !== null && commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(e.currentTarget.value);
          }}
          className={FIELD[look]}
        />
        <button type="button" aria-label={`One more${suffix}`} onClick={() => step(1)} className={cn(ctl, focusRing, 'rounded-l-none rounded-r-control')}>
          <Plus aria-hidden size={14} />
        </button>
      </div>
      <p id={noteId} aria-live="polite" className="text-[13px] leading-[19px] text-text empty:hidden">
        {note}
      </p>
    </div>
  );
}
