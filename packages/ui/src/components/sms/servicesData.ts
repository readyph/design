/**
 * Services page data: the branch's history behind Today's 22 services. Derived here (not in ../data.ts) so Today's counts and totals never move.
 * 62 completed services, 2 Oct to 1 Nov 2026, deterministic. Sample data to replace.
 */
import { typeIdFor } from './catalogue';
import { customers, jobs as todayJobs, jobBalance, type Job, type PaymentMethod, type ServiceLine, type PartLine } from './data';

type Recipe = { complaint: string; services: [string, number][]; parts: [string, number][] };
const RECIPES: Recipe[] = [
  { complaint: 'Oil change', services: [['Oil change', 450]], parts: [['pr01', 1], ['pr02', 1]] },
  { complaint: '10,000 km PMS', services: [['10,000 km PMS', 2800]], parts: [['pr01', 1], ['pr02', 1]] },
  { complaint: 'Brakes squeaking', services: [['Brake pad replacement, front', 800]], parts: [['pr03', 1]] },
  { complaint: 'Overheating', services: [['Radiator flush', 900]], parts: [['pr07', 2]] },
  { complaint: 'Aircon not cold', services: [['Aircon cleaning', 2500]], parts: [['pr11', 1]] },
  { complaint: 'Rough idle', services: [['Tune-up', 1200]], parts: [['pr06', 4]] },
  { complaint: 'Battery weak', services: [['Battery replacement', 300]], parts: [['pr10', 1]] },
  { complaint: 'Pulls to the left', services: [['Wheel alignment', 700]], parts: [] },
  { complaint: 'Bouncy ride', services: [['Shock absorber replacement, front', 1400]], parts: [['pr08', 1]] },
  { complaint: 'Scooter oil and CVT', services: [['Oil change', 250], ['CVT cleaning', 350]], parts: [['pr12', 1]] },
  { complaint: 'Clutch slipping', services: [['Clutch replacement', 4500]], parts: [] },
  { complaint: 'Engine diagnosis', services: [['Engine diagnosis', 500]], parts: [] },
];
const METHODS: PaymentMethod[] = ['CASH', 'GCASH', 'CASH', 'CARD', 'GCASH', 'BANK_TRANSFER'];
const MECH = ['m-jun', 'm-arnel', 'm-paolo', 'm-ricky'];
const pad = (n: number) => String(n).padStart(2, '0');

const productPrice: Record<string, number> = { pr01: 1850, pr02: 320, pr03: 2450, pr06: 180, pr07: 650, pr08: 3600, pr10: 5200, pr11: 420, pr12: 380 };

function build(n: number): Job {
  const r = RECIPES[(n * 7 + 3) % RECIPES.length]!;
  const c = customers[(n * 5 + 2) % 22]!;
  const day = 1 + Math.floor((n * 31) / 62); // 1..31 Oct
  const doneH = 10 + ((n * 3) % 7);
  const completed = n >= 58 ? `2026-11-01T${pad(doneH)}:10:00+08:00` : `2026-10-${pad(Math.min(31, day))}T${pad(doneH)}:10:00+08:00`;
  const created = `${completed.slice(0, 8)}${pad(Math.max(1, Number(completed.slice(8, 10)) - (n % 3 === 0 ? 1 : 0)))}T08:${pad(10 + (n % 40))}:00+08:00`;
  const services: ServiceLine[] = r.services.map(([name, price]) => ({ name, price, qty: 1, done: true, typeId: typeIdFor(name) }));
  const parts: PartLine[] = r.parts.map(([productId, qty]) => ({ productId, qty, issued: qty }));
  const total = services.reduce((a, x) => a + x.price, 0) + parts.reduce((a, x) => a + (productPrice[x.productId] ?? 0) * x.qty, 0);
  return {
    id: `h${400 - 1 - n}`, number: `JO-0${339 + n}`, status: 'COMPLETED', customerId: c.id, vehicleId: c.vehicles[0]!.id,
    assigneeId: MECH[n % 4]!, createdAt: created, statusSince: completed, promisedAt: completed.slice(0, 11) + `${pad(Math.max(9, doneH - 1))}:00:00+08:00`,
    complaint: r.complaint, services, parts,
    payments: [{ at: completed, amount: total, method: METHODS[n % METHODS.length]! }],
  };
}

export const history: Job[] = Array.from({ length: 62 }, (_, n) => build(n)).sort((a, b) => (a.statusSince < b.statusSince ? 1 : -1));

/** Today's 22 plus history: 84 services. */
export const everyService: Job[] = [...todayJobs, ...history];

export const servicesOf = (customerId: string, pool: Job[] = everyService) => pool.filter((j) => j.customerId === customerId);
export const owedBy = (customerId: string, pool: Job[] = everyService) => servicesOf(customerId, pool).filter((j) => j.status !== 'QUOTATION' && j.status !== 'FOR_APPROVAL').reduce((a, j) => a + Math.max(0, jobBalance(j)), 0);
