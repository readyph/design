import { type ReactNode } from 'react';
import { CaretRight } from '@phosphor-icons/react';
import { cn, focusForced } from '../utils/cn';

/*
 * RDY-400 I18. Transcribed from inventory-home round-1/final: stocker.css 59-74 (.row, .t1, .t2, .rv, .go, .st-low, .st-out), 123-124 (.lvl; StockLevelBar variant="stocker"),
 * 128-132 and 224-225 (.sdl); stocker.js 99-100 (row(), qtyHTML), 50 (stHTML), 235 (facts markup); shell.css 70 (.id).
 * One-off: .row has min-height 64px, padding 10px 0, hover colour on a.row/button.row only (a plain div row has no hover).
 * Note: .row.has-go (stocker.css 68) repeats the same three columns, so a row with `go` and no `qty` puts the action in the second (auto) column.
 */
const ring = 'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px] ' + focusForced;

export type StockerStatusState = 'low' | 'out';

const statusWords: Record<StockerStatusState, string> = { low: 'Low stock', out: 'Out of stock' };

export interface StockerStatusProps {
  /** `low` is "Low stock" (warn, 600); `out` is "Out of stock" (bad, 600). */
  state: StockerStatusState;
  className?: string;
}

/** Stocker status words (.st-low, .st-out): coloured 600 text, no dot. Red only as text. */
export function StockerStatus({ state, className }: StockerStatusProps) {
  return <span className={cn('whitespace-nowrap font-semibold', state === 'out' ? 'text-bad' : 'text-warn', className)}>{statusWords[state]}</span>;
}

export interface StockerRowProps {
  /** What: the name (first line, 15/21 600). */
  what: ReactNode;
  /** Where: the second line (13/19 muted): aisle, order number, status. Wrap an id in `<StockerId>`. */
  where?: ReactNode;
  /** How many: the inline figure, e.g. `{ value: 4, unit: 'pc' }`. */
  qty?: { value: ReactNode; unit: string };
  /** Action: accent link text with a chevron. `true` shows the chevron only. */
  go?: boolean | string;
  /** Renders an `a`. */
  href?: string;
  /** Renders a `button` (no `href`). Without either, a plain `div`. */
  onClick?: () => void;
  className?: string;
}

/** Wraps an id (order number, SKU) inside a row's second line: mono 12px. */
export function StockerId({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[12px] tracking-[0]">{children}</span>;
}

/** Stocker list row (I18): what · where · how many · action. Ruled rows, no cards. One anatomy for every list on the Stocker pages. */
export function StockerRow({ what, where, qty, go, href, onClick, className }: StockerRowProps) {
  const cls = cn(
    'group/row grid w-full min-h-[64px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 border-b border-rule py-[10px] text-left text-text',
    (href || onClick) && 'cursor-pointer',
    (href || onClick) && ring,
    className,
  );
  const body = (
    <>
      <span>
        <span className="block text-[15px] font-semibold leading-[21px] group-hover/row:[a&]:text-lk-hover group-hover/row:[button&]:text-lk-hover">{what}</span>
        <span className="mt-px block text-[13px] leading-[19px] text-muted">{where}</span>
      </span>
      {qty && (
        <span className="whitespace-nowrap text-right text-[15px] leading-[22px] tabular-nums">
          <b className="inline text-[15px] font-semibold leading-[22px]">{qty.value}</b>
          <small className="ml-[3px] inline text-[13px] leading-[19px] text-muted">{qty.unit}</small>
        </span>
      )}
      {go && (
        <span className="inline-flex items-center gap-1 text-[15px] font-semibold text-accent group-hover/row:text-lk-hover">
          {go === true ? '' : go}
          <CaretRight size={14} aria-hidden="true" />
        </span>
      )}
    </>
  );
  if (href) return <a className={cls} href={href}>{body}</a>;
  if (onClick) return <button type="button" className={cls} onClick={onClick}>{body}</button>;
  return <div className={cls}>{body}</div>;
}

export interface StockerFactsProps {
  /** Ruled facts: a label (13/22 muted, 96px column) and its value (15/22 500). */
  items: { label: string; value: ReactNode }[];
  className?: string;
}

/** Stocker facts list (.sdl): ruled label/value pairs, e.g. On hand with bar and status, Where. */
export function StockerFacts({ items, className }: StockerFactsProps) {
  return (
    <dl className={cn('m-0 mt-[14px] border-t border-border', className)}>
      {items.map((it) => (
        <div key={it.label} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 border-b border-rule py-[10px]">
          <dt className="text-[13px] leading-[22px] text-muted">{it.label}</dt>
          <dd className="m-0 text-[15px] font-medium leading-[22px] [&>span[aria-hidden=true]]:mx-2 [&>b]:font-semibold">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
