/** Services calendar: dates, booking blocks, lane packing and availability. Pure functions; figures come from ../data and ./scheduleData. */
import { HOURS, TODAY, mechanics, type Job, type Mechanic } from './data';
import { minOf } from './floorModel';
import { minutesOfName, typeFor } from './catalogue';

export const SLOT = 30;
/** Fixed scale: every hour is HOUR_H px tall; the calendar scrolls, it is never squeezed. */
/** 144px an hour: a 30 minute service is 72px, enough for number, plate and a two-line customer name. Heights stay true to length, so cards never need a fake minimum or overlap. */
export const HOUR_H = 144;
/** Narrowest a side-by-side lane may get: number + plate + avatar fit on one line at this width. */
export const LANE_MIN = 176;
export const px = (min: number) => ((min - HOURS.open) / 60) * HOUR_H;

export interface Slot { date: string; start: number; dur: number; /** Picked by dragging: the duration is the manager's, not a default. */ dragged?: boolean }
export interface Booking { date: string; start: number; dur: number }

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
export const pad2 = (n: number) => String(n).padStart(2, '0');
export const toIso = (date: string, min: number) => `${date}T${pad2(Math.floor(min / 60))}:${pad2(min % 60)}:00+08:00`;
export const durLabel = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}`);

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
export interface CalItem { job: Job; date: string; start: number; end: number }
export interface Placed extends CalItem { lane: number; lanes: number }
export function packDay(items: CalItem[]): { placed: Placed[]; maxLanes: number } {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end || a.job.number.localeCompare(b.job.number));
  const out: Placed[] = [];
  let group: Placed[] = []; let laneEnds: number[] = []; let groupEnd = -1; let maxLanes = 1;
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

// ---- closures and shifts ----
/** Sample closures (Portal Settings > company will own these). */
export const CLOSED: Record<string, string> = { '2026-11-08': 'Closed Sunday', '2026-11-15': 'Closed Sunday' };
export const isClosed = (date: string) => date in CLOSED;
export const isPastSlot = (date: string, startMin: number, now: number) => date < TODAY || (date === TODAY && startMin + SLOT <= now);

export const shiftOf = (m: Mechanic): { from: number; to: number } => {
  const [a, b] = m.shift.split('-').map((t) => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1] ?? 0));
  return { from: Math.max(HOURS.open, a!), to: Math.min(HOURS.close, b!) };
};
export const mechanicById = (id: string | null) => mechanics.find((m) => m.id === id) ?? null;

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
