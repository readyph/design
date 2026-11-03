/**
 * Customer page sample data the shared data.ts does not carry: contact details, reminder consent, per-car colour and mileage,
 * and older services on the customers' second and third cars. Sample data to replace. Kept out of data.ts and Services so Today's and Services' counts never move.
 */
import { jobTotal, TODAY, type Customer, type Job, type PartLine, type PaymentMethod, type ServiceLine, type Vehicle } from './data';

export interface Profile { email?: string; address?: string; remindByText: boolean; remindEvery: 3 | 6 | 12 }
export const PROFILES: Record<string, Partial<Profile>> = {
  c01: { email: 'maricel.reyes@example.ph', address: '12 Shaw Blvd, Kapitolyo, Pasig City' },
  c02: { address: 'Warehouse 4, Ortigas Ave Ext, Pasig City', remindEvery: 3 },
  c03: { email: 'jlim@example.ph' },
  c06: { email: 'grace.villareal@example.ph', address: '88 Dr. Sixto Antonio Ave, Pasig City' },
  c10: { address: '5 Mercedes Ave, Pasig City' },
  c12: { remindByText: false },
  c19: { email: 'nestor.d@example.ph', address: '31 Pioneer St, Mandaluyong City', remindEvery: 12 },
};
export const profileOf = (c: Customer): Profile => ({ remindByText: true, remindEvery: 6, ...PROFILES[c.id] });

const COLOURS = ['White', 'Silver', 'Black', 'Grey', 'Red', 'Blue', 'Beige'];
const COLOUR_OF: Record<string, string> = { v01: 'Silver', v23: 'Red', v06: 'White', v25: 'Black', v26: 'Silver' };
export const colourOf = (v: Vehicle) => v.colour ?? COLOUR_OF[v.id] ?? COLOURS[Number(v.id.slice(1)) % COLOURS.length]!;
/** Odometer at the last visit, in km. A sample figure derived from the car's age. */
export const mileageOf = (v: Vehicle) => v.mileage ?? Math.round(((2026 - v.year) * 9000 + (Number(v.id.slice(1)) % 7) * 1300) / 100) * 100;

/** Next service is due this many months after the last finished one on the car (the customer's reminder interval). */
export function dueOn(lastIso: string, months: number): string {
  const d = new Date(`${lastIso.slice(0, 10)}T12:00:00+08:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
/** The car's own interval wins over the customer's. */
export const intervalOf = (v: Vehicle, c: Customer): 3 | 6 | 12 => v.remindEvery ?? profileOf(c).remindEvery;
export const isOverdue = (due: string) => due < TODAY;

const s = (name: string, price: number): ServiceLine => ({ name, price, qty: 1, done: true });
const p = (productId: string, qty: number): PartLine => ({ productId, qty, issued: qty });
type H = [id: string, customerId: string, vehicleId: string, date: string, complaint: string, lines: ServiceLine[], parts: PartLine[], method: PaymentMethod, mech: string];
const H: H[] = [
  ['x01', 'c01', 'v23', '2026-10-14', 'Oil change', [s('Oil change', 450)], [p('pr01', 1), p('pr02', 1)], 'GCASH', 'm-jun'],
  ['x02', 'c01', 'v23', '2026-05-09', 'Aircon not cold', [s('Aircon cleaning', 2500)], [p('pr11', 1)], 'GCASH', 'm-arnel'],
  ['x03', 'c01', 'v01', '2026-04-22', 'Brakes squeaking', [s('Brake pad replacement, front', 800)], [p('pr03', 1)], 'GCASH', 'm-paolo'],
  ['x04', 'c02', 'v24', '2026-09-18', 'Rough idle', [s('Tune-up', 1200)], [p('pr06', 4)], 'CASH', 'm-arnel'],
  ['x05', 'c06', 'v25', '2026-10-09', '10,000 km PMS', [s('10,000 km PMS', 2800)], [p('pr01', 1), p('pr02', 1)], 'CARD', 'm-jun'],
  ['x06', 'c06', 'v26', '2026-07-15', 'Pulls to the left', [s('Wheel alignment', 700)], [], 'CASH', 'm-ricky'],
  ['x07', 'c06', 'v06', '2026-05-30', 'Overheating', [s('Radiator flush', 900)], [p('pr07', 2)], 'CARD', 'm-arnel'],
  ['x08', 'c10', 'v27', '2026-10-20', 'Battery weak', [s('Battery replacement', 300)], [p('pr10', 1)], 'CASH', 'm-ricky'],
  ['x09', 'c19', 'v28', '2026-06-02', 'Change oil', [s('Oil change', 450)], [p('pr01', 1), p('pr02', 1)], 'BANK_TRANSFER', 'm-paolo'],
];
export const extraHistory: Job[] = H.map(([id, customerId, vehicleId, date, complaint, services, parts, method, mech], i) => {
  const at = `${date}T14:30:00+08:00`;
  const j: Job = { id, number: `JO-0${300 + i}`, status: 'COMPLETED', customerId, vehicleId, assigneeId: mech, createdAt: `${date}T08:40:00+08:00`, statusSince: at, promisedAt: at, complaint, services, parts, payments: [] };
  return { ...j, payments: [{ at, amount: jobTotal(j), method }] };
});
