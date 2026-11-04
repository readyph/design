/** Payment page: re-exports the pure money logic (../payment/model), the studio adapters (Job -> BillJob) and the story fixtures (sample jobs for the Payment page's job control). */
import {
  branch, customerOf, jobs as allJobs, mechanicOf, productOf, vehicleOf, type Job, type ServiceLine,
} from './data';
import { receiptOf as buildReceipt, type BillJob, type ReceiptData, type StatementHeader } from '../payment/model';

export * from '../payment/model';

/** The studio job as the statement reads it: each part line carries its product's name, SKU, unit and sell price. */
export const billOf = (j: Job): BillJob => ({
  number: j.number, status: j.status, quoteNo: j.quoteNo, discount: j.discount, payments: j.payments, services: j.services,
  parts: j.parts.map((l) => { const pr = productOf(l.productId); return { productId: l.productId, name: pr.name, sku: pr.sku, unit: pr.unit, qty: l.qty, listPrice: pr.price, price: l.price, billing: l.billing, issued: l.issued }; }),
});
export const headerOf = (j: Job): StatementHeader => {
  const c = customerOf(j); const v = vehicleOf(j); const m = mechanicOf(j);
  return { customer: c.name, phone: c.phone, car: `${v.make} ${v.model} ${v.year}`, plate: v.plate, mechanic: m?.name ?? null, mechanicShort: m?.short ?? null };
};
export const shopOf = () => ({ business: branch.business, branch: branch.name, address: branch.address, phone: '(02) 8555 0142' });
export const receiptOfJob = (j: Job): ReceiptData => buildReceipt(billOf(j), headerOf(j), shopOf());

// ---------- Story fixtures (sample jobs for the Payment page's job control) ----------
const find = (id: string) => allJobs.find((j) => j.id === id)!;
const at = (hm: string) => `2026-11-02T${hm}:00+08:00`;
const svc = (name: string, price: number, extra: Partial<ServiceLine> = {}): ServiceLine => ({ name, price, qty: 1, done: true, ...extra });

const many: Job = {
  ...find('j0412'), id: 'pay-many', number: 'JO-0440', status: 'FOR_PICKUP', customerId: 'c12', vehicleId: 'v12', assigneeId: 'm-arnel',
  services: [
    svc('Full brake system overhaul incl. rotor resurfacing and brake fluid flush', 3800), svc('Engine tune-up', 2400), svc('Wheel alignment', 700), svc('Wheel balancing, four wheels', 600),
    svc('Aircon cleaning', 2500), svc('Radiator flush', 900), svc('Transmission fluid change', 1800, { qty: 1, listPrice: 2200 }), svc('Suspension check', 400), svc('Battery terminal service', 250),
    svc('CV boot replacement, left', 1400), svc('CV boot replacement, right', 1400), svc('Underchassis wash', 350), svc('Headlight restoration', 900, { billing: true }), svc('Road test', 0),
  ],
  parts: [
    { productId: 'pr01', qty: 2, issued: 2 }, { productId: 'pr02', qty: 1, issued: 1 }, { productId: 'pr03', qty: 1, issued: 1 }, { productId: 'pr06', qty: 4, issued: 4 },
    { productId: 'pr07', qty: 3, issued: 3 }, { productId: 'pr08', qty: 1, issued: 1 }, { productId: 'pr11', qty: 1, issued: 1 }, { productId: 'pr12', qty: 2, issued: 2, price: 350 },
    { productId: 'pr09', qty: 1, issued: 1, billing: true },
  ],
  payments: [
    { at: at('08:10'), amount: 5000, method: 'CASH', by: 'Mon' }, { at: at('08:40'), amount: 4000, method: 'GCASH', ref: '7012 100 2231', by: 'Mon' },
    { at: at('09:15'), amount: 3000, method: 'BANK_TRANSFER', ref: 'BDO 552010', by: 'Mon' }, { at: at('09:50'), amount: 2000, method: 'CARD', ref: 'APR 884412', by: 'Mon' },
  ],
};
const discounted: Job = { ...find('j0407'), id: 'pay-disc', number: 'JO-0441', discount: { kind: 'percent', value: 10, reason: 'Loyal customer' }, payments: [{ at: at('09:00'), amount: 3000, method: 'GCASH', ref: '7011 902 3341', by: 'Mon' }] };
const fromQuote: Job = {
  ...find('j0403'), id: 'pay-quote', number: 'JO-0431', quoteNo: 'QT-0007', customerId: 'c16', vehicleId: 'v16',
  services: [svc('Stabilizer link replacement', 1600), svc('Wheel alignment', 700, { listPrice: 850 }), svc('Brake fluid flush', 600, { billing: true })], parts: [{ productId: 'pr03', qty: 1, issued: 1, billing: true }], payments: [],
};
const noParts: Job = { ...find('j0403'), id: 'pay-noparts', number: 'JO-0403', payments: [] };
const empty: Job = { ...find('j0403'), id: 'pay-empty', number: 'JO-0442', services: [], parts: [], payments: [] };
const inProgress: Job = { ...find('j0408'), payments: [{ at: at('08:20'), amount: 500, method: 'CASH', by: 'Mon' }] };

export const PAYMENT_JOBS: { id: string; label: string; job: Job }[] = [
  { id: 'unpaid', label: 'Unpaid, ready for pick-up (JO-0403)', job: noParts },
  { id: 'partial', label: 'Partly paid, down payment taken (JO-0407)', job: find('j0407') },
  { id: 'paid', label: 'Paid in full, ready to release (JO-0409)', job: find('j0409') },
  { id: 'discount', label: 'With a discount, partly paid (JO-0441)', job: discounted },
  { id: 'quote', label: 'Booked from a quotation, lines added at billing (JO-0431)', job: fromQuote },
  { id: 'many', label: 'Stress: 14 services, 9 parts, 4 payments (JO-0440)', job: many },
  { id: 'inprogress', label: 'Still in progress, down payment (JO-0408)', job: inProgress },
  { id: 'completed', label: 'Completed and released (JO-0404)', job: find('j0404') },
  { id: 'nolines', label: 'Nothing to bill yet (JO-0442)', job: empty },
];
export const jobFor = (id: string) => (PAYMENT_JOBS.find((x) => x.id === id) ?? PAYMENT_JOBS[0]).job;
/** Sample job `id` as the statement reads it, and its header (customer, car, mechanic). */
export const billFor = (id: string) => billOf(jobFor(id));
export const headerFor = (id: string) => headerOf(jobFor(id));
/** The pool the standalone Payment story looks jobs up in. */
export const paymentPool: Job[] = [...allJobs, ...PAYMENT_JOBS.map((x) => x.job).filter((j) => !allJobs.some((a) => a.id === j.id))];
