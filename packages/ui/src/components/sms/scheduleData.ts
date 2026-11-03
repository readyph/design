/**
 * Services calendar data: services booked ahead for the next two weeks, so the calendar has full days and vacant ones.
 * Derived here (not in ../data.ts) so Today's 22 services, counts and totals never move. Sample data to replace.
 * Today's services and the 62 completed ones are placed from their promised time (see bookingOf in scheduleModel).
 */
import { customers, type Job, type PartLine, type ServiceLine } from './data';
import { everyService } from './servicesData';
import { SERVICE_MENU, toIso } from './scheduleModel';

const svc = (names: string[]): ServiceLine[] => names.map((name) => ({ name, price: SERVICE_MENU.find((s) => s.name === name)?.price ?? 600, qty: 1, done: false }));
const PARTS: Record<string, PartLine[]> = {
  'Oil change': [{ productId: 'pr01', qty: 1, issued: 0 }, { productId: 'pr02', qty: 1, issued: 0 }],
  '10,000 km PMS': [{ productId: 'pr01', qty: 1, issued: 0 }, { productId: 'pr02', qty: 1, issued: 0 }],
  'Aircon cleaning': [{ productId: 'pr11', qty: 1, issued: 0 }],
  'Battery replacement': [{ productId: 'pr10', qty: 1, issued: 0 }],
};

/** [date, start HH:MM, minutes, mechanic (null = not assigned yet), customer index, services] */
type Row = [string, string, number, string | null, number, string[]];
const JUN = 'm-jun'; const ARN = 'm-arnel'; const PAO = 'm-paolo'; const RIC = 'm-ricky';
const ROWS: Row[] = [
  // Tue 3 Nov: a middling day
  ['2026-11-03', '08:00', 60, JUN, 2, ['Oil change']], ['2026-11-03', '09:00', 120, ARN, 3, ['Brake pad replacement, front']],
  ['2026-11-03', '13:00', 60, PAO, 5, ['Wheel alignment']], ['2026-11-03', '14:00', 120, JUN, 6, ['Aircon cleaning']], ['2026-11-03', '10:00', 60, null, 11, ['Engine diagnosis']],
  // Wed 4 Nov: full day, everyone booked
  ['2026-11-04', '08:00', 120, JUN, 7, ['10,000 km PMS']], ['2026-11-04', '10:00', 120, JUN, 8, ['Tune-up']], ['2026-11-04', '13:00', 120, JUN, 9, ['Aircon cleaning']], ['2026-11-04', '15:00', 120, JUN, 12, ['Brake pad replacement, front']],
  ['2026-11-04', '08:00', 180, ARN, 13, ['Tune-up', 'Engine diagnosis']], ['2026-11-04', '11:00', 120, ARN, 14, ['10,000 km PMS']], ['2026-11-04', '13:00', 180, ARN, 15, ['Brake pad replacement, front', 'Wheel alignment']],
  ['2026-11-04', '09:00', 180, PAO, 16, ['Aircon cleaning']], ['2026-11-04', '13:00', 120, PAO, 17, ['Tune-up']], ['2026-11-04', '15:00', 150, PAO, 18, ['10,000 km PMS']],
  ['2026-11-04', '08:00', 60, RIC, 19, ['Oil change']], ['2026-11-04', '09:00', 90, RIC, 20, ['Oil change', 'Battery replacement']], ['2026-11-04', '10:30', 90, RIC, 21, ['Engine diagnosis']], ['2026-11-04', '13:00', 90, RIC, 1, ['Oil change']], ['2026-11-04', '14:30', 90, RIC, 4, ['Battery replacement']],
  // Thu 5 Nov: quiet
  ['2026-11-05', '09:00', 60, ARN, 10, ['Wheel alignment']], ['2026-11-05', '14:00', 120, JUN, 0, ['Tune-up']],
  // Fri 6 Nov: light
  ['2026-11-06', '08:30', 60, RIC, 2, ['Oil change']], ['2026-11-06', '10:00', 120, PAO, 3, ['10,000 km PMS']], ['2026-11-06', '13:30', 60, ARN, 5, ['Engine diagnosis']], ['2026-11-06', '15:00', 60, JUN, 6, ['Wheel alignment']],
  // Sat 7 Nov: busy morning
  ['2026-11-07', '08:00', 120, JUN, 7, ['Aircon cleaning']], ['2026-11-07', '08:00', 120, ARN, 8, ['Brake pad replacement, front']], ['2026-11-07', '08:30', 60, RIC, 9, ['Oil change']],
  ['2026-11-07', '09:00', 120, PAO, 12, ['Tune-up']], ['2026-11-07', '10:00', 60, RIC, 13, ['Battery replacement']], ['2026-11-07', '10:00', 60, JUN, 14, ['Oil change']],
  // Week of 9 Nov
  ['2026-11-09', '08:00', 60, JUN, 15, ['Oil change']], ['2026-11-09', '09:30', 120, ARN, 16, ['10,000 km PMS']], ['2026-11-09', '14:00', 60, PAO, 17, ['Wheel alignment']],
  ['2026-11-10', '10:00', 120, JUN, 18, ['Aircon cleaning']], ['2026-11-10', '13:00', 90, RIC, 19, ['Oil change', 'Battery replacement']],
  ['2026-11-11', '08:00', 120, JUN, 20, ['Tune-up']], ['2026-11-11', '08:00', 120, ARN, 21, ['Brake pad replacement, front']], ['2026-11-11', '09:00', 180, PAO, 1, ['Aircon cleaning']], ['2026-11-11', '08:30', 60, RIC, 2, ['Oil change']], ['2026-11-11', '13:00', 120, JUN, 4, ['10,000 km PMS']], ['2026-11-11', '13:00', 120, ARN, 5, ['Engine diagnosis']],
  ['2026-11-12', '11:00', 60, ARN, 6, ['Wheel alignment']],
];

const C = customers;
export const futureJobs: Job[] = ROWS.map(([date, hhmm, dur, mech, ci, names], i) => {
  const c = C[ci % 22]!;
  const start = Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
  const created = i % 3 === 0 ? '2026-11-01T15:20:00+08:00' : i % 3 === 1 ? '2026-10-31T11:05:00+08:00' : '2026-11-02T08:50:00+08:00';
  return {
    id: `f${String(i + 1).padStart(2, '0')}`, number: `JO-0${423 + i}`, status: 'TODO', customerId: c.id, vehicleId: c.vehicles[0]!.id, assigneeId: mech,
    createdAt: created, statusSince: created, promisedAt: toIso(date, start + dur),
    complaint: names.join(', '), services: svc(names), parts: names.flatMap((n) => PARTS[n] ?? []), payments: [],
  };
});

/** Everything Services can show: Today's 22, 62 completed, and what is booked ahead. */
export const allServices: Job[] = [...everyService, ...futureJobs];
/** Next free service number after the sample data. */
export const NEXT_NUMBER = 423 + ROWS.length;
