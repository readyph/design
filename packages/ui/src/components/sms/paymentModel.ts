/** Payment page: pure money logic and the story fixtures. Every figure comes from the job's lines (../data), never typed twice. */
import {
  branch, customerOf, discountOf, jobBalance, jobPaid, jobSubtotal, jobTotal, jobs as allJobs, mechanicOf, partPrice, productOf, vehicleOf,
  type Discount, type Job, type PartLine, type Payment, type PaymentMethod, type ServiceLine,
} from './data';

export const METHODS: { id: PaymentMethod; label: string; refLabel: string | null }[] = [
  { id: 'CASH', label: 'Cash', refLabel: null },
  { id: 'GCASH', label: 'GCash', refLabel: 'GCash reference no.' },
  { id: 'MAYA', label: 'Maya', refLabel: 'Maya reference no.' },
  { id: 'BANK_TRANSFER', label: 'Bank transfer', refLabel: 'Transfer reference no.' },
  { id: 'CARD', label: 'Card', refLabel: 'Card approval code' },
  { id: 'CHECK', label: 'Check', refLabel: 'Check no.' },
];
export const methodLabel = (m: PaymentMethod) => METHODS.find((x) => x.id === m)?.label ?? m;
export const refLabelOf = (m: PaymentMethod) => METHODS.find((x) => x.id === m)?.refLabel ?? null;

export const DISCOUNT_REASONS = ['Loyal customer', 'Goodwill', 'Referral', 'Price match'] as const;

export type PayState = 'unpaid' | 'partial' | 'paid';
export const payStateOf = (j: Job): PayState => {
  const bal = jobBalance(j);
  return jobTotal(j) > 0 && bal <= 0 ? 'paid' : jobPaid(j) > 0 ? 'partial' : 'unpaid';
};
export const PAY_WORD: Record<PayState, string> = { unpaid: 'Unpaid', partial: 'Partly paid', paid: 'Paid in full' };

export const isQuoteStatus = (j: Job) => j.status === 'QUOTATION' || j.status === 'FOR_APPROVAL';
/** Completed jobs are closed (the API answers 409 to a payment on a completed job). */
export const isClosed = (j: Job) => j.status === 'COMPLETED';
/** The price is final once the work is done: ready for pick-up or completed. Earlier it is the price so far. */
export const isFinalPrice = (j: Job) => j.status === 'FOR_PICKUP' || j.status === 'COMPLETED';

export interface StatementLine {
  key: string; kind: 'service' | 'part'; index: number; name: string; qty: number; unit: number; total: number;
  /** "Custom price (set: P1,200)" when the price was edited from the set one. */
  setPrice?: number; billing: boolean; sub?: string;
}
export function statementOf(j: Job): { services: StatementLine[]; parts: StatementLine[] } {
  const services = j.services.map((s: ServiceLine, i) => ({
    key: `s${i}`, kind: 'service' as const, index: i, name: s.name, qty: s.qty, unit: s.price, total: s.price * s.qty,
    setPrice: s.listPrice !== undefined && s.listPrice !== s.price ? s.listPrice : undefined, billing: !!s.billing,
  }));
  const parts = j.parts.map((l: PartLine, i) => {
    const pr = productOf(l.productId);
    return {
      key: `p${i}`, kind: 'part' as const, index: i, name: pr.name, qty: l.qty, unit: partPrice(l), total: partPrice(l) * l.qty,
      setPrice: l.price !== undefined && l.price !== pr.price ? pr.price : undefined, billing: !!l.billing, sub: `${pr.sku} · per ${pr.unit}`,
    };
  });
  return { services, parts };
}

/** What the discount field says, or null when it is fine. Percent is 0-100, an amount cannot pass the subtotal, the total cannot go under what is paid. */
export function discountError(kind: Discount['kind'], raw: string, job: Job): string | null {
  const t = raw.trim();
  if (t === '') return 'Enter an amount.';
  const n = Number(t);
  if (!Number.isFinite(n)) return 'Numbers only.';
  if (n <= 0) return 'Must be more than zero.';
  const sub = jobSubtotal(job);
  if (kind === 'percent') {
    if (n > 100) return 'A percent can be 100 at most.';
    if (!/^\d+(\.\d{1,2})?$/.test(t)) return 'Up to 2 decimals.';
  } else {
    if (n > sub) return `Cannot be more than the subtotal (${fmt(sub)}).`;
    if (!/^\d+(\.\d{1,2})?$/.test(t)) return 'Up to 2 decimals.';
  }
  const off = kind === 'percent' ? Math.round((sub * n) / 100) : n;
  if (sub - off < jobPaid(job)) return `The total would fall below what is already paid (${fmt(jobPaid(job))}). Void a payment first.`;
  return null;
}
export const discountPreview = (kind: Discount['kind'], raw: string, job: Job): number => {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(jobSubtotal(job), kind === 'percent' ? Math.round((jobSubtotal(job) * Math.min(n, 100)) / 100) : n);
};

export const fmt = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
export const discountWord = (d: Discount) => (d.kind === 'percent' ? `${d.value}%` : fmt(d.value));

export interface PaymentCheck { error: string | null; refError: string | null; tenderedError: string | null; change: number }
export function checkPayment(job: Job, p: { amount: string; method: PaymentMethod; ref: string; tendered: string }): PaymentCheck {
  const bal = jobBalance(job);
  const n = Number(p.amount);
  let error: string | null = null;
  if (p.amount.trim() === '' || !Number.isFinite(n)) error = 'Enter the amount received.';
  else if (n <= 0) error = 'Must be more than zero.';
  else if (n > bal) error = `More than the balance (${fmt(bal)}). Change is for cash only.`;
  else if (!/^\d+(\.\d{1,2})?$/.test(p.amount.trim())) error = 'Up to 2 decimals.';
  const refError = refLabelOf(p.method) && !p.ref.trim() ? 'Required for this method.' : null;
  const tendered = p.tendered.trim() === '' ? null : Number(p.tendered);
  const tenderedError = p.method === 'CASH' && tendered !== null && (!Number.isFinite(tendered) || tendered < n) ? 'Less than the amount. Collect the rest, or lower the amount.' : null;
  const change = p.method === 'CASH' && tendered !== null && !tenderedError && Number.isFinite(n) ? Math.max(0, tendered - n) : 0;
  return { error, refError, tenderedError, change };
}

export interface ReceiptData {
  number: string; shop: { business: string; branch: string; address: string; phone: string };
  customer: string; phone: string; car: string; plate: string; mechanic: string | null; quoteNo?: string;
  lines: { name: string; qty: number; unit: number; total: number; part: boolean; billing: boolean }[];
  subtotal: number; discount: number; discountNote: string | null; total: number; payments: Payment[]; paid: number; balance: number; state: PayState;
}
export function receiptOf(j: Job): ReceiptData {
  const v = vehicleOf(j); const c = customerOf(j); const st = statementOf(j);
  const row = (l: StatementLine) => ({ name: l.name, qty: l.qty, unit: l.unit, total: l.total, part: l.kind === 'part', billing: l.billing });
  return {
    number: j.number, shop: { business: branch.business, branch: branch.name, address: branch.address, phone: '(02) 8555 0142' },
    customer: c.name, phone: c.phone, car: `${v.make} ${v.model} ${v.year}`, plate: v.plate, mechanic: mechanicOf(j)?.name ?? null, quoteNo: j.quoteNo,
    lines: [...st.services.map(row), ...st.parts.map(row)], subtotal: jobSubtotal(j), discount: discountOf(j),
    discountNote: j.discount ? `${discountWord(j.discount)}${j.discount.reason ? `, ${j.discount.reason}` : ''}` : null,
    total: jobTotal(j), payments: j.payments, paid: jobPaid(j), balance: jobBalance(j), state: payStateOf(j),
  };
}

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
/** The pool the standalone Payment story looks jobs up in. */
export const paymentPool: Job[] = [...allJobs, ...PAYMENT_JOBS.map((x) => x.job).filter((j) => !allJobs.some((a) => a.id === j.id))];
