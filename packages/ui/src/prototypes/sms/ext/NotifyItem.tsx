import type { ReactNode } from 'react';
import { Badge, cn, type BadgeProps } from '../../../index';

export interface NotifyItemProps {
  /** Leading marker: a 20px icon, no fill. */
  marker?: ReactNode;
  /** Replaces the 20px marker slot (e.g. a 32px avatar on the phone feed). */
  leading?: ReactNode;
  markerTone?: 'bad' | 'warn' | 'ok' | 'muted';
  title: string;
  /** Right-aligned time on the title line. */
  time?: string;
  /** One line, truncated. */
  detail?: ReactNode;
  /** The tag under the detail: current status in Needs you, kind in Inquiries and Parts. */
  tag?: string;
  tagTone?: BadgeProps['tone'];
  /** Makes the whole row a button that opens the detail. Without it the row only informs. */
  onOpen?: () => void;
  /** Phone checklist rows: the row is a checkbox (role + aria-checked) and `disabled` locks it. */
  checked?: boolean;
  disabled?: boolean;
  /** Let the detail wrap over several lines instead of truncating (feed posts, item needs). */
  wrap?: boolean;
  /** Accessible name for the row button; defaults to its text. */
  ariaLabel?: string;
  /** Compact row (phone checklists): tighter padding and the tag on the title line. Additive; the desktop panel does not set it. */
  dense?: boolean;
  className?: string;
}

const TONE = { bad: 'text-bad', warn: 'text-warn-ink', ok: 'text-ok', muted: 'text-muted' } as const;

/**
 * Studio-only NotifyItem (NEW): a notification-list row with no background: marker, title + time, one-line detail, a tag. No inline actions: the row
 * informs and, when `onOpen` is set, the WHOLE row is one button (Enter / Space, focus ring, hover fills the rounded, inset row with bg-raised; rows are separated by spacing, not rules; resting rows have no fill).
 */
export function NotifyItem({ marker, leading, markerTone = 'muted', title, time, detail, tag, tagTone = 'neutral', onOpen, checked, disabled, wrap, ariaLabel, dense, className }: NotifyItemProps) {
  const body = (
    <>
      {leading ?? <span aria-hidden className={cn('flex size-5 flex-none items-center justify-center pt-0.5', TONE[markerTone])}>{marker}</span>}
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span title={title} className={cn('min-w-0 line-clamp-2 break-words text-[14px] font-medium leading-5')}>{title}</span>
          {dense && tag && <Badge tone={tagTone} className="ml-auto flex-none">{tag}</Badge>}
          {time && <span className="ml-auto flex-none whitespace-nowrap text-[13px] tabular-nums text-muted">{time}</span>}
        </span>
        {detail && <span className={cn('mt-0.5 block text-[13px] leading-5 text-muted', wrap ? 'whitespace-pre-line break-words' : 'truncate')} title={typeof detail === 'string' ? detail : undefined}>{detail}</span>}
        {!dense && tag && <span className="mt-2 flex items-center"><Badge tone={tagTone}>{tag}</Badge></span>}
      </span>
    </>
  );
  return (
    <li className={cn('group mx-1 mb-2 last:mb-0', className)}>
      {onOpen ? (
        <button type="button" onClick={onOpen} aria-label={ariaLabel} disabled={disabled} {...(checked === undefined ? {} : { role: 'checkbox', 'aria-checked': checked })} className={cn('flex w-full gap-3 rounded-control px-3 text-left transition-colors duration-150 ease-out hover:bg-raised motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:hover:bg-transparent', dense ? 'py-2' : 'py-3')}>{body}</button>
      ) : (
        <div className={cn('flex gap-3 rounded-control px-3', dense ? 'py-2' : 'py-3')}>{body}</div>
      )}
    </li>
  );
}
