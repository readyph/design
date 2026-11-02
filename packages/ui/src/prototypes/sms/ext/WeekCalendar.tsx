import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { Skeleton, cn } from '../../../index';
import { HOURS, NOW_MIN, TODAY, type Job } from '../data';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { reasonOf } from '../floorModel';
import { CalCard } from './CalCard';
import {
  CLOSED, HOUR_H, LANE_MIN, SLOT, dayNum, dowShort, durLabel, hmin, isClosed, isPastSlot, mechanicById, packDay, px, shiftOf,
  type CalItem, type Slot,
} from '../scheduleModel';

export interface WeekCalendarProps {
  /** ISO dates, left to right: 1 (day), 3 or 7. */
  days: string[];
  items: CalItem[];
  selectedId?: string | null;
  /** The booking that was just made: ringed for a few seconds. */
  flashId?: string | null;
  /** Services that do not match the search or filters: shown faded, not hidden. */
  dimmed?: Set<string>;
  /** "Needs you": services that are not blocked fade, the blocked ones stay at full strength. */
  needsOnly?: boolean;
  /** One mechanic chosen: their shift bounds the day (off-shift hours are greyed) and the header says how long they are free. */
  mechanicId?: string | null;
  freeLabel?: (date: string) => string | null;
  onOpen: (job: Job) => void;
  onBook: (slot: Slot) => void;
  onPickDay?: (date: string) => void;
  state?: 'ready' | 'loading';
  /** Narrow screens: tighter day column, sub-lane minimum smaller, date strip lives outside. */
  phone?: boolean;
  /** Story helpers: show the vacant-slot hover or a drag selection without a pointer. */
  demoHover?: { date: string; start: number };
  demoSelect?: Slot;
  /** The slot a New service sheet is open for: stays marked on the grid until the sheet closes. */
  held?: Slot | null;
  className?: string;
}

const GUTTER = 56;
const HEAD_H = 56;
const H = px(HOURS.close);

/** Rounds to the 30 minute grid, inside business hours. */
const snap = (y: number) => Math.min(HOURS.close - SLOT, Math.max(HOURS.open, HOURS.open + Math.floor(((y / HOUR_H) * 60) / SLOT) * SLOT));

/**
 * Studio-only WeekCalendar (NEW): dates across, time down. Business hours bound the day; every hour is 144px so a service's height is its length.
 * Sticky date header and time gutter, a Now line on today, closed days and off-shift hours greyed. Overlapping services split the day column side by side
 * (the column grows to keep each card readable), never on top of each other. A vacant slot tints and shows "+" under the pointer; click books it, drag picks a duration.
 */
export function WeekCalendar({
  days, items, selectedId, flashId, dimmed, needsOnly, mechanicId, freeLabel, onOpen, onBook, onPickDay, state = 'ready', phone, demoHover, demoSelect, held, className,
}: WeekCalendarProps) {
  const [hover, setHover] = useState<{ date: string; start: number } | null>(demoHover ?? null);
  const [sel, setSel] = useState<Slot | null>(demoSelect ?? null);
  const drag = useRef<{ date: string; a: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const mech = mechanicId ? mechanicById(mechanicId) : null;
  const shift = mech ? shiftOf(mech) : null;
  const hasToday = days.includes(TODAY);

  const cols = useMemo(() => days.map((d) => {
    const { placed, maxLanes } = packDay(items.filter((i) => i.date === d));
    return { date: d, placed, minW: Math.max(phone ? 0 : days.length === 7 ? 184 : 224, maxLanes * LANE_MIN), count: placed.length };
  }), [days, items, phone]);
  const template = `${GUTTER}px ${cols.map((c) => `minmax(${c.minW}px, 1fr)`).join(' ')}`;
  const totalMin = GUTTER + cols.reduce((a, c) => a + c.minW, 0);
  const rowStyle = { gridTemplateColumns: template, width: `max(100%, ${totalMin}px)` };

  // Open on Now (a third down) when today is in view, otherwise on opening time.
  const jumpToNow = (smooth: boolean) => {
    const el = scroller.current; if (!el) return;
    const top = hasToday && NOW_MIN >= HOURS.open ? Math.max(0, px(NOW_MIN) - (el.clientHeight - HEAD_H) / 3) : 0;
    el.scrollTo({ top, behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
  };
  useEffect(() => { if (state === 'ready') jumpToNow(false); }, [state, hasToday, days[0]]); // eslint-disable-line react-hooks/exhaustive-deps

  const hours: number[] = [];
  for (let h = Math.ceil(HOURS.open / 60); h * 60 < HOURS.close; h++) if (h * 60 > HOURS.open) hours.push(h * 60);
  const lines: number[] = [];
  for (let m = HOURS.open + SLOT; m < HOURS.close; m += SLOT) lines.push(m);

  const bookable = (date: string, start: number) => !isClosed(date) && !isPastSlot(date, start, NOW_MIN) && (!shift || (start >= shift.from && start + SLOT <= shift.to));
  const finish = (date: string) => {
    const d = drag.current; drag.current = null;
    if (!d || !sel) { setSel(null); return; }
    const from = Math.min(d.a, sel.start); const to = Math.max(d.a, sel.start) + SLOT;
    setSel(null);
    const dragged = to - from > SLOT;
    onBook({ date, start: from, dur: dragged ? to - from : Math.min(60, HOURS.close - from), dragged });
  };

  if (state === 'loading') {
    return (
      <div className={cn('min-h-0 flex-1 overflow-hidden p-pad', className)} aria-busy="true" aria-label="Loading the calendar">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((d, i) => <div key={d} className="space-y-2"><Skeleton variant="text" width={64} />{[0, 1, 2].map((k) => <Skeleton key={k} variant="rect" height={64 + ((i + k) % 3) * 24} />)}</div>)}
        </div>
      </div>
    );
  }
  const empty = cols.every((c) => c.count === 0) && !days.every(isClosed);

  return (
    <RadixTooltip.Provider delayDuration={200} skipDelayDuration={400}>
    <div
      ref={scroller} tabIndex={0} role="group" aria-label={`Calendar, ${days.length === 1 ? 'one day' : `${days.length} days`}, hours down the side. Scrolls both ways. Use New service to book with the keyboard.`}
      className={cn('relative min-h-0 flex-1 overflow-auto focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent', className)}
    >
      {/* Date header: sticky to the top; the corner is also sticky to the left. */}
      <div style={{ ...rowStyle, height: HEAD_H }} className="sticky top-0 z-20 grid border-b border-control bg-surface">
        <div style={{ width: GUTTER }} className="sticky left-0 z-30 flex items-center justify-center border-r border-rule bg-surface">
          {hasToday && <button type="button" onClick={() => jumpToNow(true)} className="inline-flex h-6 items-center rounded-chip border border-control px-2 text-[12px] font-medium hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Now</button>}
        </div>
        {cols.map((c) => {
          const today = c.date === TODAY; const closed = isClosed(c.date);
          const sub = closed ? CLOSED[c.date] : freeLabel?.(c.date) ?? `${c.count} ${c.count === 1 ? 'service' : 'services'}`;
          const inner = (
            <>
              <span className="flex items-center gap-1.5"><span className={cn('text-[12px] uppercase tracking-wide', today ? 'font-semibold text-accent' : 'text-muted')}>{dowShort(c.date)}</span>
                <span className={cn('inline-flex h-6 min-w-6 items-center justify-center rounded-chip px-1 text-[15px] font-semibold tabular-nums', today && 'bg-accent text-accent-ink')}>{dayNum(c.date)}</span></span>
              <span className={cn('truncate text-[12px] leading-4', closed ? 'text-muted' : 'text-muted')}>{sub}</span>
            </>
          );
          return onPickDay && days.length > 1
            ? <button key={c.date} type="button" onClick={() => onPickDay(c.date)} aria-label={`${dowShort(c.date)} ${dayNum(c.date)}, ${sub}. Open this day`} className="flex min-w-0 flex-col items-start justify-center gap-0.5 border-l border-rule px-3 text-left hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">{inner}</button>
            : <div key={c.date} className="flex min-w-0 flex-col items-start justify-center gap-0.5 border-l border-rule px-3">{inner}</div>;
        })}
      </div>

      <div style={{ ...rowStyle, height: H }} className="relative grid">
        <div style={{ width: GUTTER, height: H }} className="sticky left-0 z-10 border-r border-rule bg-surface text-[12px] tabular-nums text-muted">
          <span className="absolute right-2 top-0.5">{hmin(HOURS.open)}</span>
          {hours.map((m) => <span key={m} style={{ top: px(m) }} className="absolute right-2 -translate-y-1/2">{hmin(m)}</span>)}
          <span className="absolute bottom-0.5 right-2">{hmin(HOURS.close)}</span>
          {hasToday && NOW_MIN >= HOURS.open && NOW_MIN <= HOURS.close && <span style={{ top: px(NOW_MIN) }} className="absolute right-1 z-[3] -translate-y-1/2 rounded-chip bg-accent px-1 text-[11px] font-semibold text-accent-ink">{hmin(NOW_MIN)}</span>}
        </div>
        {cols.map((c) => {
          const closed = isClosed(c.date);
          const showHover = hover?.date === c.date && !drag.current && !sel && bookable(c.date, hover.start);
          return (
            <div key={c.date} data-day={c.date} style={{ height: H }} className={cn('relative min-w-0 border-l border-rule', closed && 'bg-raised')}>
              {lines.map((m) => <span key={m} aria-hidden style={{ top: px(m) }} className={cn('pointer-events-none absolute inset-x-0 border-t', m % 60 === 0 ? 'border-rule' : 'border-dashed border-rule')} />)}
              {/* Past time on today and earlier days. */}
              {!closed && (c.date < TODAY || (c.date === TODAY && NOW_MIN > HOURS.open)) && <span aria-hidden style={{ top: 0, height: c.date < TODAY ? H : Math.min(H, px(NOW_MIN)) }} className="pointer-events-none absolute inset-x-0 bg-raised opacity-50" />}
              {shift && !closed && <>
                {shift.from > HOURS.open && <span aria-hidden style={{ top: 0, height: px(shift.from) }} className="pointer-events-none absolute inset-x-0 z-[1] bg-raised"><span className="block px-2 pt-1 text-[12px] text-muted">Off shift</span></span>}
                {shift.to < HOURS.close && <span aria-hidden style={{ top: px(shift.to), height: H - px(shift.to) }} className="pointer-events-none absolute inset-x-0 z-[1] bg-raised"><span className="block px-2 pt-1 text-[12px] text-muted">Off shift</span></span>}
              </>}
              {closed && <span className="pointer-events-none absolute inset-x-0 top-3 text-center text-[13px] font-medium text-muted">{CLOSED[c.date]}</span>}
              {/* Slot layer: everything that is not a card. */}
              {!closed && (
                <div
                  className="absolute inset-0 touch-pan-y"
                  onPointerMove={(e) => {
                    const r = e.currentTarget.getBoundingClientRect(); const m = snap(e.clientY - r.top);
                    if (drag.current && drag.current.date === c.date) { setSel({ date: c.date, start: m, dur: SLOT }); return; }
                    if (e.pointerType === 'mouse') setHover((h) => (h?.date === c.date && h.start === m ? h : { date: c.date, start: m }));
                  }}
                  onPointerLeave={() => { if (!drag.current) setHover(null); }}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    const r = e.currentTarget.getBoundingClientRect(); const m = snap(e.clientY - r.top);
                    if (!bookable(c.date, m)) return;
                    drag.current = { date: c.date, a: m }; setSel({ date: c.date, start: m, dur: SLOT });
                    if (e.pointerType === 'mouse') e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerUp={(e) => { if (drag.current?.date === c.date) { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); finish(c.date); } }}
                  onPointerCancel={() => { drag.current = null; setSel(null); }}
                />
              )}
              {showHover && hover && (
                <span aria-hidden style={{ top: px(hover.start) + 1, height: (SLOT / 60) * HOUR_H - 2 }} className="pointer-events-none absolute inset-x-1 z-[1] flex items-center justify-center gap-1 rounded-control border border-dashed border-accent bg-accent-tint text-[12px] font-medium tabular-nums text-accent">
                  <Plus size={14} aria-hidden />{hmin(hover.start)}
                </span>
              )}
              {sel?.date === c.date && (() => {
                const a = drag.current?.a; const from = a === undefined ? sel.start : Math.min(a, sel.start); const to = a === undefined ? sel.start + sel.dur : Math.max(a, sel.start) + SLOT;
                return (
                  <span aria-hidden style={{ top: px(from) + 1, height: ((to - from) / 60) * HOUR_H - 2 }} className="pointer-events-none absolute inset-x-1 z-[1] flex items-start justify-center rounded-control border border-accent bg-accent-tint pt-1 text-[12px] font-medium tabular-nums text-accent">
                    {hmin(from)}-{hmin(to)} · {durLabel(to - from)}
                  </span>
                );
              })()}
              {held?.date === c.date && !sel && (
                <span aria-hidden style={{ top: px(held.start) + 1, height: (held.dur / 60) * HOUR_H - 2 }} className="pointer-events-none absolute inset-x-1 z-[1] flex items-start justify-center rounded-control border border-accent bg-accent-tint pt-1 text-[12px] font-medium tabular-nums text-accent">
                  {hmin(held.start)}-{hmin(held.start + held.dur)} · New
                </span>
              )}
              {c.date === TODAY && NOW_MIN >= HOURS.open && NOW_MIN <= HOURS.close && <span aria-hidden style={{ top: px(NOW_MIN) - 1 }} className="pointer-events-none absolute inset-x-0 z-[3] h-0.5 bg-accent" />}
              {c.placed.map((p) => <CalCard key={p.job.id} placed={p} selected={p.job.id === selectedId} flash={p.job.id === flashId} dim={!!dimmed?.has(p.job.id) || (!!needsOnly && !reasonOf(p.job))} showMech={!mechanicId} onOpen={onOpen} />)}
            </div>
          );
        })}
      </div>
      {empty && (
        <div className="pointer-events-none sticky bottom-6 left-0 z-[4] flex w-full justify-center px-4" style={{ marginTop: -88 }}>
          <p className="max-w-[360px] rounded-control border border-control bg-surface px-4 py-3 text-center text-[13px] text-muted shadow-float">Nothing is booked here yet. Every slot is open: click one to book it, or drag across the hours a service needs.</p>
        </div>
      )}
    </div>
    </RadixTooltip.Provider>
  );
}

