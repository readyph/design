import { type ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn } from '../utils/cn';

export interface DataListItem {
  /** Phrasing content only (text, inline elements). Kept to one line; long labels are cut with an ellipsis. */
  label: ReactNode;
  /** Phrasing content only. Wraps, and breaks inside long unbroken strings. */
  value: ReactNode;
  /** Muted note at the right of the value, one line, cut with an ellipsis (e.g. "2 days ago"). */
  note?: ReactNode;
  /** `bad` colours the value and note for a problem value (e.g. an overdue date). */
  tone?: 'bad';
  /** Optional small icon before the label. */
  icon?: PhosphorIcon;
}

export interface DataListProps {
  items: DataListItem[];
  /** Always stack the label above the value. Without it the list stacks by itself when it is narrower than 600px. */
  stacked?: boolean;
  /** Margins and width only (e.g. `mt-4`). Do not pass `p-*` (it shrinks the container, so the list stacks earlier) or `text-*` (changes the type size). */
  className?: string;
}

/**
 * Key-value rows (C41): a `dl` of rows in a `minmax(120px, 34%) | 1fr` grid, 13/20, 7px row padding with a top rule.
 * The label is muted on one line; the value is weight 500 with an optional right note and a `bad` tone.
 * Stacks when the list is narrower than 600px (a phone, a narrow sheet) or with `stacked`.
 * Needs a definite width (block, `1fr` track or flex child): it is `w-full` and never content-sized,
 * because the container query removes its intrinsic width.
 * Works on surface, raised and raised-2.
 */
export function DataList({ items, stacked = false, className }: DataListProps) {
  return (
    <dl className={cn('m-0 min-w-0 w-full text-[13px] [container-type:inline-size]', className)}>
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            'grid items-start gap-x-3 border-t leading-5 border-rule py-[7px]',
            stacked ? 'grid-cols-1' : 'grid-cols-[minmax(120px,34%)_1fr] [@container_(max-width:599px)]:grid-cols-1',
          )}
        >
          <dt className="m-0 flex min-w-0 items-center gap-2 text-muted">
            {item.icon && <item.icon aria-hidden size={14} className="shrink-0" />}
            <span className="min-w-0 truncate">{item.label}</span>
          </dt>
          <dd className={cn('m-0 flex min-w-0 items-baseline gap-2 font-medium', item.tone === 'bad' ? 'text-bad' : 'text-text')}>
            <span className="min-w-0 [overflow-wrap:anywhere]">{item.value}</span>
            {item.note && (
              <span className={cn('ml-auto min-w-0 max-w-[50%] shrink-0 truncate font-normal', item.tone === 'bad' ? 'text-bad' : 'text-muted')}>
                {item.note}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
