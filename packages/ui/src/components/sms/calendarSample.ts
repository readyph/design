/** Story helper (not exported): the Services calendar items as the Services page builds them from allServices. */
import type { Job } from './data';
import { allServices } from './scheduleData';
import { addDays, bookingOf, weekStart, type CalItem } from './scheduleModel';

export const calItems: CalItem[] = allServices.flatMap((j) => {
  const b = bookingOf(j);
  return b ? [{ job: j, date: b.date, start: b.start, end: b.start + b.dur }] : [];
});
export const weekDays = (anchor: string) => Array.from({ length: 7 }, (_, i) => addDays(weekStart(anchor), i));
export const findJob = (id: string): Job => allServices.find((j) => j.id === id)!;
