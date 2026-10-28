import { type HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export type StockState = 'ok' | 'low' | 'out';

export interface StockStatusProps extends HTMLAttributes<HTMLSpanElement> {
  /** Stock state: `ok` in stock, `low` at or under the reorder level, `out` nothing left. */
  status: StockState;
}

const words: Record<StockState, string> = { out: 'Out of stock', low: 'Low stock', ok: 'In stock' };

const dot: Record<StockState, string> = { out: 'bg-bad', low: 'bg-warn', ok: 'bg-faint' };

const word: Record<StockState, string> = {
  out: 'text-bad font-medium',
  low: 'text-text font-medium',
  ok: 'text-muted font-normal',
};

/** Stock status (I4): a 7px dot and a word. Colour sits on the dot; the word is red only when out of stock. */
export function StockStatus({ status, className, ...rest }: StockStatusProps) {
  return (
    <span className={cn('inline-flex h-5 flex-none items-center gap-1.5 whitespace-nowrap text-[12px]', word[status], className)} {...rest}>
      <span aria-hidden className={cn('h-[7px] w-[7px] flex-none rounded-full', dot[status])} />
      {words[status]}
    </span>
  );
}
