import { useRef } from 'react';
import { Moon, Sun } from '@phosphor-icons/react';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';
import { cn } from '../utils/cn';
import { HOURS, NOW_MIN, TODAY, type Job, type Mechanic } from './sms/data';
import { bookingOf, dayNum, dowShort, hmin } from './sms/scheduleModel';
import type { Day, MechScenario, MechState } from './sms/mechModel';
import { CalCard, type CalCardView, type PlacedItem } from './CalCard';
import { flagOf, reasonOf } from './sms/floorModel';
import { staffHeight, staffView, type Step } from './mechCardView';

/** Phone scale: 128px an hour (the desktop Floor view uses 144). Heights stay true to length above the minimum card height. */
export const MECH_HOUR_H = 128;
/** Tallest-needed card: number + plate, customer, two lines of service, status and flag all fit. */
export const MECH_CARD_MIN = 124;
const GAP = 4;
const pxM = (min: number) => ((min - HOURS.open) / 60) * MECH_HOUR_H;

export const VIEW: Record<Step, CalCardView> = {
  done: { label: 'Done', dot: 'bg-ok-dot', tone: 'done', hideUnpaid: true, full: true },
  now: { label: 'Working', dot: 'bg-accent', tone: 'working', hideUnpaid: true, full: true },
  next: { label: 'Not started', dot: 'bg-faint', hideUnpaid: true, full: true },
  waiting: { label: 'Waiting for parts', dot: 'bg-warn-dot', tone: 'warn', hideUnpaid: true, full: true },
};

export interface Slotted { job: Job; step: Step; top: number; height: number; start: number; end: number; view: CalCardView }
/** One column: each service starts at its scheduled time and is as tall as it runs; when two overlap (or a card is at its minimum height) the next one slides down under the previous, so cards never overlap. */
export function slotDay(items: { job: Job; step: Step }[], s: MechState): Slotted[] {
  const timed = items.map((it, i) => {
    const b = it.job.promisedAt?.startsWith(TODAY) ? bookingOf(it.job) : null;
    const staff = staffView(s, it.job, it.step);
    return { ...it, i, staff, start: b ? b.start : null as number | null, dur: b ? b.dur : 60 };
  });
  const order = [...timed].sort((a, b) => (a.start ?? 1e9) - (b.start ?? 1e9) || a.i - b.i);
  const out: Slotted[] = []; let bottom = -Infinity; let lastEnd = HOURS.open;
  for (const t of order) {
    const start = t.start ?? lastEnd;
    const height = Math.max(staffHeight(t.staff, !!flagOf(t.job) && !(reasonOf(t.job) === 'PICKUP_UNPAID')), (t.dur / 60) * MECH_HOUR_H - 2);
    const top = Math.max(pxM(start) + 1, bottom + GAP);
    out.push({ job: t.job, step: t.step, top, height, start, end: start + t.dur, view: { ...VIEW[t.step], staff: t.staff } });
    bottom = top + height; lastEnd = start + t.dur;
  }
  return out;
}

export interface MechHomeProps {
  me: Mechanic; day: Day; scenario: MechScenario; pool: Job[];
  /** The session store: unread manager messages, parts checklist and the Updates feed behind each card. */
  s: MechState;
  onOpen: (id: string) => void;
}

/** My services as a day schedule of the staff's own cards (revision 10): Currently working on, status with stats, unread manager message, last activity. Need a part lives inside each service, not here. */
export function MechHome({ me, day, scenario, s, onOpen }: MechHomeProps) {
  const nowRef = useRef<HTMLSpanElement>(null);
  if (scenario === 'loading') return <div role="status" className="px-4 pt-4" aria-busy="true" aria-label="Loading your services"><Skeleton variant="text" lines={6} /></div>;
  if (scenario === 'day off') return <div className="px-4 pt-4"><EmptyState icon={Moon} title="You are off today" description={`Your next shift is tomorrow, ${me.shift}.`} /></div>;
  const total = day.next.length + day.blocked.length + (day.now ? 1 : 0);
  if (!total && !day.done.length) return <div className="px-4 pt-4"><EmptyState icon={Sun} title="No cars for you yet" description="When your manager gives you a car, it shows here." /></div>;
  const now = day.now;
  const items: { job: Job; step: Step }[] = [
    ...day.done.map((job) => ({ job, step: 'done' as const })),
    ...(now ? [{ job: now, step: 'now' as const }] : []),
    ...day.next.map((job) => ({ job, step: 'next' as const })),
    ...day.blocked.map((job) => ({ job, step: 'waiting' as const })),
  ];
  const slots = slotDay(items, s);
  const axisEnd = HOURS.close;
  const H = Math.max(pxM(axisEnd), ...slots.map((x) => x.top + x.height + 12));
  const hours: number[] = [];
  for (let h = Math.ceil(HOURS.open / 60); h * 60 < axisEnd; h++) if (h * 60 > HOURS.open) hours.push(h * 60);
  const halves: number[] = [];
  for (let m = HOURS.open + 30; m < axisEnd; m += 30) if (m % 60 !== 0) halves.push(m);
  const showNow = NOW_MIN >= HOURS.open && NOW_MIN <= axisEnd;
  const jumpToNow = () => nowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  return (
    <>
      <section aria-label="Today">
        {/* Day header, as the Floor view's: DOW + date chip, the count, Now. */}
        <div data-day-header className="sticky top-0 z-20 flex h-12 flex-none items-center gap-3 border-b border-control bg-surface px-4">
          <span className="flex items-center gap-1.5"><span className="text-[12px] font-semibold uppercase tracking-wide text-accent">{dowShort(TODAY)}</span><span className="inline-flex h-6 min-w-6 items-center justify-center rounded-chip bg-accent px-1 text-[15px] font-semibold tabular-nums text-accent-ink">{dayNum(TODAY)}</span></span>
          <span className="min-w-0 flex-1 truncate text-[12px] leading-4 text-muted">{slots.length} {slots.length === 1 ? 'service' : 'services'}</span>
          {showNow && <button type="button" onClick={jumpToNow} className="inline-flex h-6 items-center rounded-chip border border-control px-2 text-[12px] font-medium hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Now</button>}
        </div>
        <div className="relative isolate z-0 mx-4 pl-11" style={{ height: H }}>
          <div aria-hidden className="absolute inset-y-0 left-0 w-11 border-r border-rule text-[12px] tabular-nums text-muted">
            <span className="absolute right-2 top-0.5">{hmin(HOURS.open)}</span>
            {hours.map((m) => <span key={m} data-axis style={{ top: pxM(m) }} className="absolute right-2 -translate-y-1/2">{hmin(m)}</span>)}
            {showNow && <span data-now-pill style={{ top: pxM(NOW_MIN) }} className="absolute right-1 z-[3] -translate-y-1/2 rounded-chip bg-accent px-1 text-[11px] font-semibold text-accent-ink">{hmin(NOW_MIN)}</span>}
          </div>
          <div className="relative h-full">
            {[...halves.map((m) => [m, false] as const), ...hours.map((m) => [m, true] as const)].map(([m, hr]) => <span key={m} aria-hidden style={{ top: pxM(m) }} className={cn('pointer-events-none absolute inset-x-0 border-t', hr ? 'border-rule' : 'border-dashed border-rule')} />)}
            {showNow && <span ref={nowRef} data-now-line aria-hidden style={{ top: pxM(NOW_MIN) - 1 }} className="pointer-events-none absolute inset-x-0 z-[1] h-0.5 bg-accent" />}
            <ol aria-label="Services today, in order" className="contents">
              {slots.map((x) => (
                <li key={x.job.id} data-step={x.step} data-top={Math.round(x.top)} data-height={Math.round(x.height)} className="contents">
                  <CalCard
                    placed={{ job: x.job, date: TODAY, start: x.start, end: x.end, lane: 0, lanes: 1 } as PlacedItem}
                    selected={false} flash={false} dim={false} showMech={false} onOpen={(j) => onOpen(j.id)}
                    layout={{ top: x.top, height: x.height }} view={x.view}
                  />
                </li>
              ))}
            </ol>
          </div>
        </div>
        {!now && !day.next.length && <p className="px-4 py-2 text-[14px] text-muted">All your cars are waiting for parts.</p>}
      </section>
    </>
  );
}
