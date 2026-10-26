import { DAY_KEYS, type DayHours, type DayKey, type OpeningHoursValue, type PublicHoliday } from './OpeningHours';

/** Sample data for stories and tests. */
const day = (from: string, to: string, open = true): DayHours => ({ open, from, to });

export const companyWeek: Record<DayKey, DayHours> = {
  mon: day('08:00', '18:00'),
  tue: day('08:00', '18:00'),
  wed: day('08:00', '18:00'),
  thu: day('08:00', '18:00'),
  fri: day('08:00', '18:00'),
  sat: day('08:00', '18:00'),
  sun: day('08:00', '18:00', false),
};

export const sameValue: OpeningHoursValue = {
  sameAsCompany: true,
  week: { ...companyWeek },
  holidays: { closed: true, openOn: [] },
  closures: [],
};

export const ownValue: OpeningHoursValue = {
  sameAsCompany: false,
  week: { ...companyWeek, sat: day('09:00', '14:00'), wed: day('08:00', '18:00', false) },
  holidays: { closed: true, openOn: ['2026-11-30'] },
  closures: [
    { id: 'c1', date: '2026-11-02', reason: 'Stock count' },
    { id: 'c2', date: '2026-12-24', reason: 'Staff Christmas lunch and year-end inventory at the Cubao branch' },
  ],
};

export const publicHolidays: PublicHoliday[] = [
  { date: '2026-10-20', name: 'Past holiday (not listed)' },
  { date: '2026-11-01', name: 'All Saints’ Day' },
  { date: '2026-11-02', name: 'All Souls’ Day' },
  { date: '2026-11-30', name: 'Bonifacio Day' },
  { date: '2026-12-08', name: 'Feast of the Immaculate Conception' },
  { date: '2026-12-25', name: 'Christmas Day' },
  { date: '2026-12-30', name: 'Rizal Day' },
];

export const todayIso = '2026-10-22';
export const nowSample = { day: 'thu' as DayKey, minutes: 9 * 60 + 12, date: todayIso };
export { DAY_KEYS };
