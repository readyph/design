/**
 * Structural types and pure helpers for the Services calendar (WeekCalendar, CalCard, CalendarToolbar). They carry no data: the clock, the business
 * hours, the closed days, the mechanics and the car/customer lookup all arrive as arguments, so the same code runs on Storybook samples and on API data.
 */
import type { TodayEnv, TodayJob } from '../today/types';

export const SLOT = 30;
/** Fixed scale: every hour is HOUR_H px tall; the calendar scrolls, it is never squeezed. 144px an hour so a 30 minute service is 72px. */
export const HOUR_H = 144;
/** Narrowest a side-by-side lane may get: number + plate + avatar fit on one line at this width. */
export const LANE_MIN = 176;

/** Business hours as minutes from midnight. */
export interface CalendarHours { open: number; close: number }
/**
 * What the calendar needs that is not in a job: the clock (`now`, `today` from TodayEnv), the opening hours, and the days the shop is closed
 * (date -> the reason shown, e.g. "Closed Sunday"). Extends TodayEnv because the card's flags (late, parts, approval, unpaid) use the same rules.
 */
export interface CalendarEnv extends TodayEnv {
  hours: CalendarHours;
  closed: Record<string, string>;
}
/** A mechanic as the calendar shows them: avatar, bay and the shift that bounds their day (`"8:00-17:00"`). */
export interface CalMechanic { id: string; name: string; short: string; initials: string; bay: string; shift: string }
export interface CalMechanicOption { value: string; label: string }

export interface Slot { date: string; start: number; dur: number; /** Picked by dragging: the duration is the manager's, not a default. */ dragged?: boolean }
export interface Booking { date: string; start: number; dur: number }

/** A service placed on a day: start and end in minutes from midnight. */
export interface CalendarItem<J extends TodayJob = TodayJob> { job: J; date: string; start: number; end: number }
export interface PlacedCalendarItem<J extends TodayJob = TodayJob> extends CalendarItem<J> { lane: number; lanes: number }

/** The minutes of the clock in `env.now` (an ISO timestamp). */
export const nowMin = (env: Pick<TodayEnv, 'now'>) => Number(env.now.slice(11, 13)) * 60 + Number(env.now.slice(14, 16));
export const pxAt = (open: number, min: number) => ((min - open) / 60) * HOUR_H;

// ---- dates (ISO yyyy-mm-dd, UTC arithmetic so the time zone never shifts a day) ----
const utc = (d: string) => new Date(`${d}T00:00:00Z`);
export const addDays = (d: string, n: number) => { const t = utc(d); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
export const weekStart = (d: string) => addDays(d, -((utc(d).getUTCDay() + 6) % 7));
const fmt = (d: string, o: Intl.DateTimeFormatOptions) => utc(d).toLocaleDateString('en-PH', { timeZone: 'UTC', ...o });
export const dowShort = (d: string) => fmt(d, { weekday: 'short' });
export const dayNum = (d: string) => String(utc(d).getUTCDate());
export const monthShort = (d: string) => fmt(d, { month: 'short' });
export const longDay = (d: string) => fmt(d, { weekday: 'short', day: 'numeric', month: 'short' });
export const monthYear = (d: string) => fmt(d, { month: 'long', year: 'numeric' });
export function rangeLabel(days: string[]): string {
  const a = days[0]!; const b = days[days.length - 1]!;
  if (a === b) return fmt(a, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const sameMonth = monthShort(a) === monthShort(b);
  return `${dayNum(a)}${sameMonth ? '' : ` ${monthShort(a)}`} - ${dayNum(b)} ${monthShort(b)} ${utc(b).getUTCFullYear()}`;
}
export const hmin = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
export const durLabel = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}`);

// ---- lanes: overlapping services split side by side ----
export function packDay<J extends TodayJob>(items: CalendarItem<J>[]): { placed: PlacedCalendarItem<J>[]; maxLanes: number } {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end || a.job.number.localeCompare(b.job.number));
  const out: PlacedCalendarItem<J>[] = [];
  let group: PlacedCalendarItem<J>[] = []; let laneEnds: number[] = []; let groupEnd = -1; let maxLanes = 1;
  const flush = () => { group.forEach((p) => { p.lanes = laneEnds.length; }); maxLanes = Math.max(maxLanes, laneEnds.length); out.push(...group); group = []; laneEnds = []; };
  for (const it of sorted) {
    if (group.length && it.start >= groupEnd) flush();
    let lane = laneEnds.findIndex((e) => e <= it.start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = it.end; groupEnd = Math.max(groupEnd, it.end);
    group.push({ ...it, lane, lanes: 1 });
  }
  if (group.length) flush();
  return { placed: out, maxLanes };
}

// ---- closures, past time and shifts ----
export const isClosedDay = (env: Pick<CalendarEnv, 'closed'>, date: string) => date in env.closed;
export const isPastSlotAt = (env: Pick<CalendarEnv, 'today' | 'now'>, date: string, startMin: number) => date < env.today || (date === env.today && startMin + SLOT <= nowMin(env));
/** A mechanic's shift, kept inside business hours. */
export const shiftWithin = (m: Pick<CalMechanic, 'shift'>, hours: CalendarHours): { from: number; to: number } => {
  const [a, b] = m.shift.split('-').map((t) => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1] ?? 0));
  return { from: Math.max(hours.open, a!), to: Math.min(hours.close, b!) };
};
/** The mechanic filter names the bay, so "who" and "where" read together. */
export const mechanicOptionsOf = (mechanics: CalMechanic[]): CalMechanicOption[] => [{ value: 'any', label: 'All mechanics' }, { value: 'none', label: 'Not assigned' }, ...mechanics.map((m) => ({ value: m.id, label: `${m.short} · ${m.bay}` }))];
