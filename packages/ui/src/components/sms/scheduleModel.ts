/** Services calendar: dates, booking blocks, lane packing and availability. Pure functions; figures come from ../data and ./scheduleData. */
import { HOURS, TODAY, mechanics, type Job, type Mechanic } from './data';
import { minOf, todayEnv } from './floorModel';
import { minutesOfName, typeFor } from './catalogue';
import {
  SLOT, isClosedDay, isPastSlotAt, mechanicOptionsOf, pxAt, shiftWithin,
  type CalendarEnv, type CalendarItem, type PlacedCalendarItem,
} from '../calendar/model';

// The pure calendar helpers live in ../calendar/model (data-agnostic, public). This module binds them to the sample data.
export {
  SLOT, HOUR_H, LANE_MIN, addDays, weekStart, dowShort, dayNum, monthShort, longDay, monthYear, rangeLabel, hmin, durLabel, packDay,
  type Slot, type Booking,
} from '../calendar/model';
import type { Booking } from '../calendar/model';

/** Sample closures (Portal Settings > company will own these). */
export const CLOSED: Record<string, string> = { '2026-11-08': 'Closed Sunday', '2026-11-15': 'Closed Sunday' };
export const px = (min: number) => pxAt(HOURS.open, min);
/** The sample clock, hours and closed days, in the shape the calendar components take as `env`. */
export const calendarEnv: CalendarEnv = { ...todayEnv, hours: HOURS, closed: CLOSED };

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const toIso = (date: string, min: number) => `${date}T${pad2(Math.floor(min / 60))}:${pad2(min % 60)}:00+08:00`;

// ---- what the shop offers (sample prices and times; replace with the branch's service list) ----
export interface MenuService { name: string; price: number; min: number }
/** The eight services the sample bookings use, read from the shared catalogue (catalogue.ts) so price and minutes have one source. */
export const SERVICE_MENU: MenuService[] = ['Oil change', '10,000 km PMS', 'Brake pad replacement, front', 'Wheel alignment', 'Aircon cleaning', 'Tune-up', 'Battery replacement', 'Engine diagnosis']
  .map((name) => { const t = typeFor(name); return { name, price: t?.price ?? 600, min: t?.mins ?? 60 }; });
const KEYWORDS: [RegExp, number][] = [
  [/timing belt/i, 240], [/clutch/i, 240], [/alternator/i, 180], [/overhaul/i, 180], [/50,000|40,000/i, 180], [/pms/i, 120], [/shock/i, 120], [/brake/i, 120],
  [/aircon|freon/i, 120], [/tune-up/i, 120], [/radiator|cvt|stabilizer/i, 90], [/oil/i, 60], [/alignment|diagnos|check|flush|starter/i, 60], [/battery|belt|test|resurfac/i, 30],
];
export const minutesFor = (names: string[]): number => {
  const sum = names.reduce((a, n) => a + (minutesOfName(n) ?? KEYWORDS.find(([re]) => re.test(n))?.[1] ?? 60), 0);
  return Math.min(240, Math.max(SLOT, Math.round(sum / SLOT) * SLOT));
};

/** The block a service occupies: it ends at its promised time and runs back by its work time, kept inside business hours. */
export function bookingOf(j: Job): Booking | null {
  if (!j.promisedAt) return null;
  const date = j.promisedAt.slice(0, 10);
  const dur = minutesFor(j.services.map((s) => s.name));
  let end = Math.min(HOURS.close, Math.max(HOURS.open + SLOT, minOf(j.promisedAt)));
  let start = Math.max(HOURS.open, end - dur);
  if (end - start < SLOT) end = start + SLOT;
  return { date, start, dur: end - start };
}

// ---- lanes: overlapping services split side by side ----
export type CalItem<J extends Job = Job> = CalendarItem<J>;
export type Placed<J extends Job = Job> = PlacedCalendarItem<J>;

// ---- closures and shifts ----
export const isClosed = (date: string) => isClosedDay(calendarEnv, date);
export const isPastSlot = (date: string, startMin: number, now: number) => isPastSlotAt({ today: TODAY, now: `${TODAY}T${String(Math.floor(now / 60)).padStart(2, '0')}:${String(now % 60).padStart(2, '0')}` }, date, startMin);

export const shiftOf = (m: Mechanic): { from: number; to: number } => shiftWithin(m, HOURS);
export const mechanicById = (id: string | null) => mechanics.find((m) => m.id === id) ?? null;

/** The mechanic filter options for the sample mechanics. */
export const calMechanicOptions = () => mechanicOptionsOf(mechanics);

export const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }) => a.start < b.end && b.start < a.end;
/** The service that already holds this mechanic in this window, if any. */
export function busyWith(items: CalItem[], mechanicId: string, date: string, start: number, dur: number): CalItem | null {
  return items.find((i) => i.date === date && i.job.assigneeId === mechanicId && overlaps(i, { start, end: start + dur })) ?? null;
}
/** Free minutes for one mechanic on one day: their shift, minus what is booked. */
export function freeMinutes(items: CalItem[], m: Mechanic, date: string, now: number): number {
  if (isClosed(date) || date < TODAY) return 0;
  const sh = shiftOf(m);
  const from = date === TODAY ? Math.max(sh.from, Math.ceil(now / SLOT) * SLOT) : sh.from;
  let free = Math.max(0, sh.to - from);
  for (const i of items) if (i.date === date && i.job.assigneeId === m.id) free -= Math.max(0, Math.min(i.end, sh.to) - Math.max(i.start, from));
  return Math.max(0, free);
}
