import { ArrowLeft, CalendarBlank, CaretLeft, CaretRight, Warning } from '@phosphor-icons/react';
import { Button, Menu, SegmentedControl, Select, cn } from '../../../index';
import { mechanics, type Job } from '../data';
import { rangeLabel } from '../scheduleModel';
import { SearchBox } from './ServicesControls';

export type Span = 'day' | '3day' | 'week';
export const SPAN_DAYS: Record<Span, number> = { day: 1, '3day': 3, week: 7 };

/** The mechanic filter names the bay, so "who" and "where" read together. */
export const calMechanicOptions = () => [{ value: 'any', label: 'All mechanics' }, { value: 'none', label: 'Not assigned' }, ...mechanics.map((m) => ({ value: m.id, label: `${m.short} · ${m.bay}` }))];

/** Every control in the bar is one height: the library's button height (32px), 4px radius, 16px icons. */
const H = 'h-[var(--ctl-button)]';
const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';
const arrow = cn('inline-flex w-8 flex-none items-center justify-center bg-surface text-text hover:bg-raised', H, focus);

export interface CalendarToolbarProps {
  days: string[];
  span: Span;
  onSpan: (s: Span) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onJump: (date: string) => void;
  q: string;
  onQ: (q: string) => void;
  mechanic: string;
  onMechanic: (id: string) => void;
  /** Open services with no date or time yet. */
  unscheduled?: Job[];
  onOpen?: (j: Job) => void;
  /** Services that need the manager (late, parts, approval, unpaid): count and the toggle that fades the rest. */
  needsCount?: number;
  needsOnly?: boolean;
  onNeedsOnly?: (on: boolean) => void;
  /** Set when a day was opened from a week or 3-day view: the way back restores that range. */
  backLabel?: string;
  onBack?: () => void;
  className?: string;
}

/**
 * Studio-only CalendarToolbar (NEW): one slim row above the week. Navigator (prev, next, Today, range, date jump), Day / 3 days / Week,
 * then search and the mechanic filter shared with the List tab.
 */
export function CalendarToolbar({ days, span, onSpan, onPrev, onNext, onToday, onJump, q, onQ, mechanic, onMechanic, unscheduled = [], onOpen, needsCount = 0, needsOnly, onNeedsOnly, backLabel, onBack, className }: CalendarToolbarProps) {
  const unit = span === 'week' ? 'week' : span === '3day' ? '3 days' : 'day';
  return (
    <div className={cn('flex flex-none flex-wrap items-center gap-x-2 gap-y-2 border-b border-rule px-6 py-3', className)} role="group" aria-label="Calendar controls">
      {onBack && (
        <Button variant="secondary" leftIcon={ArrowLeft} onClick={onBack}>{backLabel}</Button>
      )}
      <Button variant="secondary" onClick={onToday}>Today</Button>
      <div role="group" aria-label="Move the range" className="inline-flex flex-none overflow-hidden rounded-control border border-control">
        <button type="button" aria-label={`Previous ${unit}`} onClick={onPrev} className={arrow}><CaretLeft size={16} aria-hidden /></button>
        <button type="button" aria-label={`Next ${unit}`} onClick={onNext} className={cn(arrow, 'border-l border-control')}><CaretRight size={16} aria-hidden /></button>
      </div>
      <label className={cn('relative inline-flex min-w-[196px] flex-none items-center gap-2 rounded-control border border-control bg-surface px-3 text-ui font-medium tabular-nums hover:bg-raised focus-within:outline focus-within:outline-2 focus-within:outline-accent', H)}>
        <CalendarBlank size={16} aria-hidden className="flex-none text-muted" />
        <span className="flex-1 whitespace-nowrap" aria-live="polite">{rangeLabel(days)}</span>
        <span className="sr-only">Jump to date</span>
        <input type="date" value={days[0]} onChange={(e) => e.target.value && onJump(e.target.value)} onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch { /* the native picker opens from the input itself */ } }} className="absolute inset-0 size-full cursor-pointer opacity-0" />
      </label>
      <SegmentedControl size="md" aria-label="Calendar span" value={span} onChange={(v) => onSpan(v as Span)} options={[{ value: 'day', label: 'Day' }, { value: '3day', label: '3 days' }, { value: 'week', label: 'Week' }]} />
      <span className="flex-1" />
      {onNeedsOnly && (
        <button
          type="button" aria-pressed={!!needsOnly} onClick={() => onNeedsOnly(!needsOnly)} title="Late, waiting on parts, awaiting approval or unpaid. The rest fade."
          className={cn('inline-flex flex-none items-center gap-1.5 rounded-control border px-3 text-ui font-medium', H, focus, needsOnly ? 'border-accent bg-accent-tint text-accent' : 'border-control bg-surface text-text hover:bg-raised')}
        >
          <Warning size={16} aria-hidden />Needs you<span className="tabular-nums text-muted">{needsCount}</span>
        </button>
      )}
      {unscheduled.length > 0 && (
        <Menu align="end" trigger={<Button variant="text">{unscheduled.length} not scheduled</Button>} items={unscheduled.map((j) => ({ label: j.number, meta: 'No date yet', onSelect: () => onOpen?.(j) }))} />
      )}
      <SearchBox value={q} onChange={onQ} className={cn('w-[240px] max-w-full', `${H}`)} />
      <Select size="sm" aria-label="Mechanic" className="w-[172px]" value={mechanic} onValueChange={onMechanic} options={calMechanicOptions()} />
    </div>
  );
}
