import { forwardRef, type HTMLAttributes } from 'react';
import { CaretDown, DotsThree } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { Menu, type MenuItem } from './Menu';
import { IconButton } from './IconButton';

/** One bar / channel in the chart. */
export interface RevenueSeries {
  /** Channel name shown in the legend. */
  label: string;
  /** Pre-formatted value shown on the bar's pill, e.g. "₱3.53k". */
  value: string;
  /** Numeric magnitude — drives relative bar height. */
  amount: number;
  /** Optional explicit bar/legend color (any CSS color). Falls back to the palette. */
  color?: string;
}

export interface RevenueChartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Card heading, e.g. "Revenue Sources". */
  title: string;
  /** Large headline figure, pre-formatted, e.g. "₱8.83K". */
  total: string;
  /** Sub-label under the total. */
  caption?: string;
  /** Channels to plot. */
  series: RevenueSeries[];
  /** Optional comparison callout, e.g. { label: 'better than last month', value: '+72.4%' }. */
  delta?: { label: string; value: string };
  /** Options for the sort dropdown. Omit to hide it. */
  sortOptions?: string[];
  /** Currently selected sort option. */
  sortValue?: string;
  /** Called when a sort option is chosen. */
  onSortChange?: (value: string) => void;
  /** Called when the overflow (⋯) button is pressed. */
  onMore?: () => void;
  /** Narrow, vertically-stacked layout for sidebars / docked placement. */
  compact?: boolean;
}

/** Default series colours from the chart tokens (light and dark follow); overridable per series. */
const PALETTE = ['var(--chart-1)', 'var(--chart-muted)', 'var(--share-2)', 'var(--share-1)'];

/** A revenue-by-channel bar chart card: headline total, legend, and labelled bars. */
export const RevenueChart = forwardRef<HTMLDivElement, RevenueChartProps>(function RevenueChart(
  { title, total, caption, series, delta, sortOptions, sortValue, onSortChange, onMore, compact = false, className, ...rest },
  ref,
) {
  const max = Math.max(1, ...series.map((s) => s.amount));
  const colorAt = (s: RevenueSeries, i: number) => s.color ?? PALETTE[i % PALETTE.length];
  const sortItems: MenuItem[] = (sortOptions ?? []).map((o) => ({ label: o, onSelect: () => onSortChange?.(o) }));

  return (
    <div
      ref={ref}
      className={cn('flex flex-col gap-5 rounded-card bg-surface p-6 text-text', compact && 'gap-4 p-5', className)}
      {...rest}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className={cn('font-extrabold tracking-tight', compact ? 'text-base' : 'text-xl')}>{title}</h3>
        <div className="flex items-center gap-2">
          {sortOptions && sortOptions.length > 0 && (
            <Menu
              trigger={
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full bg-raised font-semibold text-text transition-colors hover:bg-raised-2',
                    compact ? 'h-8 px-3 text-xs' : 'h-9 px-3.5 text-sm',
                  )}
                >
                  {sortValue ?? sortOptions[0]}
                  <CaretDown aria-hidden size={14} className="text-faint" />
                </button>
              }
              items={sortItems}
            />
          )}
          <IconButton
            icon={DotsThree}
            label="More options"
            variant="text"
            className="rounded-full"
            onClick={onMore}
          />
        </div>
      </div>

      {/* Body */}
      <div className={cn('flex gap-7', compact && 'flex-col gap-5')}>
        {/* Total + legend */}
        <div className={cn('flex min-w-0 flex-col', compact ? 'w-full' : 'w-[36%] shrink-0')}>
          <div className={cn('font-extrabold leading-none tracking-tight tabular-nums', compact ? 'text-[2.25rem]' : 'text-[2.75rem]')}>
            {total}
          </div>
          {caption && <p className="mt-3 text-sm leading-snug text-muted">{caption}</p>}
          <div className={cn('grid grid-cols-2 gap-x-4 gap-y-3', compact ? 'mt-4' : 'mt-auto pt-5')}>
            {series.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2.5 text-sm text-text">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorAt(s, i) }} />
                <span className="truncate">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className={cn('relative min-w-0 flex-1', !compact && 'pt-9')}>
          {delta && (
            <div className={cn('text-sm leading-tight text-muted', compact ? 'mb-3' : 'absolute left-0.5 top-0')}>
              {delta.label}
              <b className="mt-0.5 block text-base font-extrabold text-text">{delta.value}</b>
            </div>
          )}
          <div className={cn('flex items-end gap-3.5', compact ? 'h-[150px]' : 'h-[224px]')}>
            {series.map((s, i) => (
              <div key={s.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2.5">
                <span className="whitespace-nowrap rounded-full bg-text px-2.5 py-1 text-xs font-bold text-surface">
                  {s.value}
                </span>
                <div
                  className="w-full rounded-card"
                  style={{
                    height: Math.round((s.amount / max) * (compact ? 104 : 180)),
                    minHeight: compact ? 26 : 40,
                    background: colorAt(s, i),
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
