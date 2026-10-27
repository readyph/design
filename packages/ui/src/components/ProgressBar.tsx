import { forwardRef, useId, type ReactNode } from 'react';
import * as RadixProgress from '@radix-ui/react-progress';
import { cn, focusRing } from '../utils/cn';

export type ProgressBarTone = 'auto' | 'accent' | 'warn' | 'bad';
/** Legacy tone names, mapped to the current tones. Prefer the new names. */
export type LegacyProgressTone = 'primary' | 'success' | 'error';

export interface ProgressBarProps {
  /** Amount used. Omit (or pass `null`) for an indeterminate bar. */
  value?: number | null;
  /** Limit. Defaults to 100. */
  max?: number;
  /**
   * `auto` (default) works the tone out: `bad` when `value >= max`, `warn` from `warnAt`, else `accent`.
   * Pass a tone to force it.
   */
  tone?: ProgressBarTone | LegacyProgressTone;
  /** Value at or above which the bar turns warn. Defaults to 85% of `max`. For seats use `max - 2`. */
  warnAt?: number;
  /** `inline` is a 56px bar beside the text (status bar). `full` is a full-width bar with the text under it (Seats, Memory room). */
  layout?: 'inline' | 'full';
  /** The readout, e.g. "10 of 15 seats used". It also names the bar for assistive tech. */
  label?: ReactNode;
  /** Accessible name when there is no visible `label`. */
  'aria-label'?: string;
  /** Link shown when the bar is full or over. Defaults to "Plan and billing". */
  actionLabel?: ReactNode;
  /** Where the link goes. Without it, `onAction` renders a button instead. */
  actionHref?: string;
  onAction?: () => void;
  /** Applied to the wrapper. The bar keeps its own width and height. */
  className?: string;
}

const legacy: Record<LegacyProgressTone, Exclude<ProgressBarTone, 'auto'>> = { primary: 'accent', success: 'accent', error: 'bad' };

const fill = { accent: 'bg-accent', warn: 'bg-warn-dot', bad: 'bg-bad-dot' } as const;
const ink = { accent: 'text-muted', warn: 'text-warn-ink', bad: 'text-bad-ink' } as const;
const status = { accent: '', warn: ', nearly full', bad: ', limit reached' } as const;

/**
 * Usage meter (C40): a 4px bar with a readout. 56px wide inline in the status bar, full width in the Seats and Memory room.
 * The tone follows the numbers (accent, warn near the limit, bad when full or over) and the bad state offers a "Plan and billing" link.
 * `className` goes on the wrapper; the bar's own size is fixed.
 */
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(function ProgressBar(
  { value = null, max = 100, tone = 'auto', warnAt, layout = 'inline', label, 'aria-label': ariaLabel, actionLabel = 'Plan and billing', actionHref, onAction, className },
  ref,
) {
  const labelId = useId();
  const indeterminate = value === null || value === undefined;
  const used = indeterminate ? 0 : Math.max(0, value);
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const threshold = warnAt ?? max * 0.85;
  const resolved: Exclude<ProgressBarTone, 'auto'> =
    tone === 'auto' || indeterminate
      ? indeterminate ? 'accent' : used >= max ? 'bad' : used >= threshold ? 'warn' : 'accent'
      : tone in legacy ? legacy[tone as LegacyProgressTone] : (tone as Exclude<ProgressBarTone, 'auto'>);
  const showAction = resolved === 'bad' && !indeterminate && (actionHref || onAction);
  const full = layout === 'full';

  const bar = (
    <RadixProgress.Root
      value={indeterminate ? null : Math.min(used, max)}
      max={max}
      aria-labelledby={label ? labelId : undefined}
      aria-label={label ? undefined : ariaLabel}
      aria-valuetext={indeterminate ? undefined : `${typeof label === 'string' ? label : `${used} of ${max}`}${status[resolved]}`}
      className={cn('relative h-1 shrink-0 overflow-hidden rounded-full bg-frame-active forced-colors:outline forced-colors:outline-1 forced-colors:outline-[CanvasText]', full ? 'w-full' : 'w-14')}
    >
      <RadixProgress.Indicator
        className={cn(
          'h-full rounded-full transition-[width] duration-hover-slow motion-reduce:transition-none',
          fill[resolved],
          'forced-colors:bg-[Highlight]',
          indeterminate && 'w-1/3 animate-pulse motion-reduce:animate-none',
        )}
        style={indeterminate ? undefined : { width: `${pct}%` }}
      />
    </RadixProgress.Root>
  );

  const linkClass = cn('rounded-sm text-small font-medium text-accent underline-offset-2 hover:underline', focusRing);
  const action = showAction ? (
    actionHref ? (
      <a href={actionHref} onClick={onAction} className={linkClass}>
        {actionLabel}
      </a>
    ) : (
      <button type="button" onClick={onAction} className={linkClass}>
        {actionLabel}
      </button>
    )
  ) : null;

  const readout = label ? (
    <span id={labelId} className={cn('text-small tabular-nums', ink[resolved])}>
      {label}
    </span>
  ) : null;

  return (
    <div
      ref={ref}
      className={cn(full ? 'flex w-full flex-col gap-1.5' : 'inline-flex items-center gap-2', className)}
    >
      {bar}
      {(readout || action) && (
        <div className={cn('flex min-w-0 items-baseline', full ? 'flex-wrap justify-between gap-x-3 gap-y-1' : 'gap-2')}>
          {readout}
          {action}
        </div>
      )}
    </div>
  );
});
