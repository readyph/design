import { useEffect, useMemo, useRef } from 'react';
import { DotsSixVertical } from '@phosphor-icons/react';
import { Menu } from './Menu';
import { Skeleton } from './Skeleton';
import { cn } from '../utils/cn';
import { PersonAvatar } from './avatarTone';
import { HOURS, NOW_MIN, TODAY, mechanics, type Job } from './sms/data';
import { STATUS_SHORT, flagOf, reasonOf, serviceTitle, freeFrom, hm, minOf, viewOf, type LaneId, type LaneModel } from './sms/floorModel';

export interface FloorLanesProps {
  lanes: LaneModel[];
  selectedId?: string;
  state?: 'ready' | 'loading';
  /** Business hours in minutes since midnight (Portal Settings > company > business hours). Half-hours allowed. */
  open?: number;
  close?: number;
  /** Current time in minutes since midnight. */
  now?: number;
  onSelect: (job: Job) => void;
  /** Reassign (drag between lanes, or the "Move to..." menu). */
  onMove: (job: Job, to: LaneId) => void;
  className?: string;
}

/** Fixed scale: every hour is HOUR_W px wide, never squeezed to the container; the timeline scrolls sideways instead. */
const HOUR_W = 132;
const hmin = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const CHIP_MIN = 90; // a chip covers the 90 minutes before its promised time (198px): number, model, time and status
const CHIP_MIN_W = 168;
const ROW_H = 80; // chip height 72 + 8 gap: every chip is the same height whatever its title
const WELL_W = 116;
const HEAD_W = 140;

interface Placed { job: Job; left: number; width: number; row: number }

/** Greedy row packing: chips sit left of their promised time; a chip that would overlap drops to the next row. */
function place(jobs: Job[], px: (m: number) => number, open: number, close: number): { placed: Placed[]; rows: number; well: Job[] } {
  const inHours = (j: Job) => !!j.promisedAt?.startsWith(TODAY) && minOf(j.promisedAt) >= open && minOf(j.promisedAt) <= close;
  // No time, another day, or promised outside business hours: all wait in the well (the chip still shows its time).
  const timed = jobs.filter(inHours).sort((a, b) => a.promisedAt!.localeCompare(b.promisedAt!));
  const well = jobs.filter((j) => !inHours(j));
  const ends: number[] = [];
  const placed = timed.map((job) => {
    const rightPx = px(minOf(job.promisedAt!));
    const left = Math.max(0, rightPx - (CHIP_MIN / 60) * HOUR_W);
    const width = Math.max(CHIP_MIN_W, rightPx - left); // a very early promise grows rightward instead of shrinking below readable
    let row = ends.findIndex((e) => e <= left);
    if (row < 0) row = ends.length;
    ends[row] = left + width + 4;
    return { job, left, width, row };
  });
  return { placed, rows: Math.max(1, ends.length), well };
}

function Chip({ job, selected, style, onSelect, onMove, className }: { job: Job; selected: boolean; style?: React.CSSProperties; onSelect: () => void; onMove: (to: LaneId) => void; className?: string }) {
  const v = viewOf(job);
  const flag = flagOf(job);
  const st = STATUS_SHORT[job.status];
  const title = serviceTitle(job);
  const moveItems = [
    ...mechanics.map((m) => ({ label: m.short, meta: m.bay, onSelect: () => onMove(m.id as LaneId) })),
  ];
  return (
    <div
      style={style}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/job', job.id); e.dataTransfer.effectAllowed = 'move'; }}
      className={cn('group absolute flex h-[72px] min-w-0 items-stretch overflow-hidden rounded-control border text-left', reasonOf(job) ? 'bg-warn-bg' : 'bg-surface', flag?.tone === 'bad' ? 'border-bad' : 'border-control', selected && 'ring-2 ring-accent', className)}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        title={`${job.number} · ${title} · ${v.vehicle} · ${v.customer}`}
        aria-label={`${job.number}, ${v.vehicle}, ${v.customer}, ${title}${job.promisedAt ? `, promised ${hm(job.promisedAt)}` : ', no promised time'}${STATUS_SHORT[job.status].label}${flag ? `, ${flag.word}` : ''}`}
        className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden px-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="flex items-baseline gap-1.5 text-[12px] leading-4"><span className="font-mono">{job.number.replace('JO-', '')}</span><span className="min-w-0 flex-1 truncate text-muted">{v.vehicle.replace(/^\S+ /, '').replace(/ \d{4}$/, '')}</span>{job.promisedAt && <span className="ml-auto flex-none tabular-nums text-muted">{hm(job.promisedAt)}</span>}</span>
        <span className="line-clamp-2 break-words text-[12px] font-medium leading-4">{title}</span>
        <span className="flex items-center gap-1.5 text-[12px] leading-4"><span aria-hidden className={cn('size-1.5 flex-none rounded-full', st.dot)} /><span className="flex-none">{st.label}</span>{flag && <span className={cn('truncate', flag.tone === 'bad' ? 'font-medium text-bad' : 'text-muted')}>· {flag.word}</span>}</span>
      </button>
      <Menu
        trigger={<button type="button" aria-label={`Move ${job.number} to...`} className="flex w-5 flex-none items-center justify-center rounded-r-control text-faint hover:bg-raised hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><DotsSixVertical size={14} aria-hidden /></button>}
        items={[{ type: 'label', label: 'Move to...' }, ...moveItems, { type: 'separator' }, { label: 'Counter', onSelect: () => onMove('counter') }]}
        align="end"
      />
    </div>
  );
}

/**
 * Studio-only FloorLanes: stand-in for the proposed DayTimeline CHANGE (chips draggable between lanes, a "no time" well at the lane's left edge,
 * keyboard alternative = the "Move to..." menu on every chip).
 */
export function FloorLanes({ lanes, selectedId, state = 'ready', open = HOURS.open, close = HOURS.close, now = NOW_MIN, onSelect, onMove, className }: FloorLanesProps) {
  const dragOver = useRef<string | null>(null);
  const px = (min: number) => ((min - open) / 60) * HOUR_W;
  const TIMELINE_W = px(close);
  const TOTAL_W = HEAD_W + WELL_W + TIMELINE_W;
  const nowIn = now >= open && now <= close;
  // Whole hours strictly inside the day; the opening and closing times are labelled at the edges (may be half-hours).
  const hours: number[] = [];
  for (let h = Math.ceil(open / 60); h * 60 < close; h++) if (h * 60 > open) hours.push(h);
  const scroller = useRef<HTMLDivElement>(null);
  const jumpToNow = (smooth: boolean) => {
    const el = scroller.current;
    if (!el) return;
    // Inside hours: Now a third in. Before opening: start at open. After closing: show the end of the day.
    const left = now < open ? 0 : now > close ? el.scrollWidth : HEAD_W + WELL_W + px(now) - el.clientWidth / 3;
    el.scrollTo({ left: Math.max(0, left), behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
  };
  useEffect(() => { if (state === 'ready') jumpToNow(false); }, [state, open, close, now]);
  const packed = useMemo(() => lanes.map((l) => ({ lane: l, ...place(l.jobs, px, open, close) })), [lanes, open, close]);
  if (state === 'loading') {
    return (
      <div className={cn('min-h-0 flex-1 overflow-auto p-pad', className)} aria-busy="true">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="flex items-center gap-3 border-b border-rule py-3"><Skeleton variant="rect" width={HEAD_W - 16} height={28} /><Skeleton variant="rect" width={`${30 + i * 9}%`} height={40} /></div>)}
      </div>
    );
  }
  return (
    <div ref={scroller} tabIndex={0} role="group" aria-label="Shop floor, one lane per mechanic. Scrolls sideways." className={cn('min-h-0 flex-1 overflow-auto [scrollbar-color:var(--control)_transparent] [scrollbar-width:thin] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent', className)}>
      <div style={{ width: TOTAL_W }} className="relative">
        <div className="sticky top-0 z-20 flex h-12 border-b border-control bg-surface text-[12px] text-muted">
          <div className="w-[140px] sticky left-0 z-30 flex flex-none items-center bg-surface px-3">
            <button type="button" onClick={() => jumpToNow(true)} className="inline-flex h-6 items-center rounded-chip border border-control px-2 text-[12px] font-medium text-text hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">{nowIn ? 'Jump to Now' : now < open ? 'Opens ' + hmin(open) : 'Closed ' + hmin(close)}</button>
          </div>
          <div className="w-[116px] flex-none border-l border-rule px-2"><span className="flex h-6 items-center">No time</span><span className="block text-[12px] leading-4 text-faint">or after hours</span></div>
          <div style={{ width: TIMELINE_W }} className="relative flex-none border-l border-rule">
            {/* Row 1 holds the hour labels, row 2 holds the Now pill: they never share a line, so neither hides the other. */}
            <span className="absolute left-0 top-0 flex h-6 items-center pl-2 tabular-nums">{hmin(open)}</span>
            {hours.map((h) => <span key={h} style={{ left: px(h * 60) }} className="absolute top-0 flex h-6 -translate-x-1/2 items-center tabular-nums">{h}:00</span>)}
            <span className="absolute right-0 top-0 flex h-6 items-center pr-2 tabular-nums">{hmin(close)}</span>
            {nowIn && <>
              <span aria-hidden style={{ left: px(now) }} className="absolute bottom-0 top-6 w-0.5 -translate-x-1/2 bg-accent" />
              <span style={{ left: px(now) }} className="absolute bottom-1 flex h-5 -translate-x-1/2 items-center whitespace-nowrap rounded-chip bg-accent px-2 text-[12px] font-semibold tabular-nums text-accent-ink">Now {hmin(now)}</span>
            </>}
          </div>
        </div>
        {packed.map(({ lane, placed, rows, well }) => {
          const h = Math.max(rows, well.length) * ROW_H + 8;
          const free = lane.id.startsWith('m-') ? freeFrom(lane) : null;
          return (
            <div
              key={lane.id}
              className="flex border-b border-rule"
              style={{ minHeight: h }}
              onDragOver={(e) => { e.preventDefault(); dragOver.current = lane.id; }}
              onDrop={(e) => { e.preventDefault(); const j = lane.jobs; const id = e.dataTransfer.getData('text/job'); const job = lanes.flatMap((l) => l.jobs).find((x) => x.id === id); if (job && !j.some((x) => x.id === id)) onMove(job, lane.id); }}
            >
              <div className="w-[140px] sticky left-0 z-10 flex flex-none items-start gap-2 bg-surface px-3 py-2">
                {lane.initials ? <PersonAvatar personId={lane.id} name={lane.name} initials={lane.initials} size={24} decorative /> : <span className="size-6 flex-none" />}
                <div className="min-w-0"><div className="truncate text-[14px] font-semibold leading-5">{lane.name}</div><div className="truncate text-[12px] leading-4 text-muted">{lane.sub}</div></div>
              </div>
              <div className="w-[116px] relative flex-none border-l border-dashed border-rule">
                {well.map((job, i) => <Chip key={job.id} job={job} selected={job.id === selectedId} onSelect={() => onSelect(job)} onMove={(to) => onMove(job, to)} style={{ top: 8 + i * ROW_H, left: 8, right: 8 }} />)}
              </div>
              <div style={{ width: TIMELINE_W }} className="relative flex-none border-l border-rule">
                {hours.map((t) => <span key={t} aria-hidden style={{ left: px(t * 60) }} className="absolute inset-y-0 w-px bg-rule" />)}
                {nowIn && <span aria-hidden style={{ left: px(now) }} className="pointer-events-none absolute inset-y-0 z-[1] w-0.5 -translate-x-1/2 bg-accent" />}
                {free && lane.jobs.length > 0 && lane.jobs.length <= 1 && <span style={{ left: px(minOf(`2026-11-02T${free.padStart(5, '0')}:00`)) }} className="absolute top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap text-[12px] text-muted">free from {free}</span>}
                {placed.map(({ job, left, width, row }) => <Chip key={job.id} job={job} selected={job.id === selectedId} onSelect={() => onSelect(job)} onMove={(to) => onMove(job, to)} style={{ top: 8 + row * ROW_H, left, width }} />)}
                {placed.length === 0 && well.length === 0 && <span className="absolute left-4 top-4 text-[12px] text-muted">Nothing here</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
