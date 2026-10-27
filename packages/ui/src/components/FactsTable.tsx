import { type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface FactsTableItem {
  label: ReactNode;
  /** Phrasing content. Sits in a row that wraps with an 8px gap, so a status, a muted note and a small button can share the line. */
  value: ReactNode;
}

export interface FactsTableProps {
  items: FactsTableItem[];
  /** Margins only (e.g. `mt-8`). */
  className?: string;
}

/**
 * Read-only facts (the workshop `.kv2`): a `dl` in a `140px | 1fr` grid (112px on a phone), 13/20, up to 720px wide,
 * each row 12px above and below its text with a rule on top. Labels are muted; values are regular weight and wrap.
 * Unlike `DataList` it never stacks and has no notes or tones: use it for the facts block under a form.
 */
export function FactsTable({ items, className }: FactsTableProps) {
  return (
    <dl className={cn('m-0 grid max-w-[720px] grid-cols-[140px_minmax(0,1fr)] text-ui leading-5 max-[640px]:grid-cols-[112px_minmax(0,1fr)]', className)}>
      {items.map((it, i) => (
        <div key={i} className="contents">
          <dt className="m-0 border-t border-rule py-3 text-muted">{it.label}</dt>
          <dd className="m-0 flex flex-wrap items-center gap-2 border-t border-rule py-3 text-text">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
