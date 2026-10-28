import { type HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface StockLevelBarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Units on hand. */
  onHand: number;
  /** Reorder level. */
  reorder: number;
  /** `row` is the 88px bar in the Products list, `wide` the 6px bar on the product detail (100% up to 360px), `stocker` the 6px, 100px bar without a tick (hidden from assistive tech). */
  variant?: 'row' | 'wide' | 'stocker';
}

const track = {
  row: 'ml-auto h-1 w-[88px] rounded-[2px]',
  wide: 'h-[6px] w-full max-w-[360px] rounded-[3px]',
  stocker: 'h-[6px] w-[100px] rounded-[3px] align-middle',
} as const;

const fillRadius = { row: 'rounded-[2px]', wide: 'rounded-[3px]', stocker: 'rounded-[3px]' } as const;

const tick = { row: '-top-[3px] -bottom-[3px]', wide: '-top-[4px] -bottom-[4px]' } as const;

/** Stock level bar (I3): violet fill on a violet track, with a tick at the reorder level. Violet is only for this bar; status is the dot and word (StockStatus). */
export function StockLevelBar({ onHand, reorder, variant = 'row', className, ...rest }: StockLevelBarProps) {
  const stocker = variant === 'stocker';
  const max = Math.max(reorder * 2, onHand, 1);
  const pct = stocker
    ? Math.max(onHand > 0 ? 6 : 0, Math.min(100, Math.round((onHand / Math.max(1, reorder * 2)) * 100)))
    : Math.min(100, (onHand / max) * 100);
  const a11y = stocker ? { 'aria-hidden': true } : { role: 'img', 'aria-label': `${onHand} on hand, reorder at ${reorder}` };
  return (
    <span className={cn('relative inline-block flex-none bg-lv-track', track[variant], className)} {...a11y} {...rest}>
      <i className={cn('absolute bottom-0 left-0 top-0 bg-lv-fill', fillRadius[variant])} style={{ width: `${pct}%` }} />
      {!stocker && <u className={cn('absolute w-0.5 bg-text no-underline', tick[variant])} style={{ left: `${(reorder / max) * 100}%` }} />}
    </span>
  );
}
