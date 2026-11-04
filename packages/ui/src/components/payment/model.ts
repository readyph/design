/**
 * Structural types and pure helpers for the Payment statement (PaymentStatement, AddLine, BalancePanel, RecordPayment, PaymentDiscount, StatementActions,
 * ReceiptDoc). They carry no data: a part line brings its own name, SKU and prices, the header (customer, car, mechanic) and the shop details arrive as
 * arguments, so the same code runs on Storybook samples and on API jobs. Every figure comes from the job's lines, never typed twice.
 */
import type { JobStatus } from '../today/types';

export type PaymentMethod = 'CASH' | 'GCASH' | 'MAYA' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';

/** A labour line. `listPrice` is the Services & prices set price when the line was edited from it. */
export interface BillService {
  name: string; price: number; qty: number; done?: boolean; billing?: boolean;
  typeId?: string | null; listPrice?: number; custom?: boolean;
}
/** A part line with the product details it is shown with. `listPrice` is the Inventory sell price, `price` a price set at billing instead of it. */
export interface BillPart {
  productId: string; name: string; sku: string; unit: string; qty: number; listPrice: number; price?: number; billing?: boolean; issued?: number;
}
export interface BillPayment { at: string; amount: number; method: PaymentMethod; ref?: string; by?: string; tendered?: number; remarks?: string }
export interface BillDiscount { kind: 'amount' | 'percent'; value: number; reason?: string }
/** What the statement needs from a service: its lines, discount and payments. Satisfied by the API job once its parts carry the product. */
export interface BillJob {
  number: string; status: JobStatus; quoteNo?: string;
  services: BillService[]; parts: BillPart[]; payments: BillPayment[]; discount?: BillDiscount;
}
/** The line under the statement title: who, which car, who worked on it. */
export interface StatementHeader { customer: string; phone: string; car: string; plate: string; mechanic: string | null; mechanicShort?: string | null }
export interface ReceiptShop { business: string; branch: string; address: string; phone: string }
/** One entry of the shop's price list (Services & prices) offered by AddLine. */
export interface BillCatalogueItem { id: string; name: string; price: number }
/** A product picked in AddLine: what a BillPart needs from Inventory. */
export interface BillProduct { id: string; name: string; sku: string; unit: string; price: number }

// ---------- Money (computed from lines) ----------
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const partUnit = (l: Pick<BillPart, 'price' | 'listPrice'>) => l.price ?? l.listPrice;
export const billServicesTotal = (j: Pick<BillJob, 'services'>) => sum(j.services.map((x) => x.price * x.qty));
export const billPartsTotal = (j: Pick<BillJob, 'parts'>) => sum(j.parts.map((x) => partUnit(x) * x.qty));
/** Before any discount. */
export const billSubtotal = (j: Pick<BillJob, 'services' | 'parts'>) => billServicesTotal(j) + billPartsTotal(j);
/** The discount in pesos, never above the subtotal. */
export const billDiscount = (j: Pick<BillJob, 'services' | 'parts' | 'discount'>) => {
  const d = j.discount; if (!d || d.value <= 0) return 0;
  const raw = d.kind === 'percent' ? Math.round((billSubtotal(j) * Math.min(d.value, 100)) / 100) : d.value;
  return Math.min(Math.max(raw, 0), billSubtotal(j));
};
/** The final price: subtotal less the discount. */
export const billTotal = (j: Pick<BillJob, 'services' | 'parts' | 'discount'>) => billSubtotal(j) - billDiscount(j);
export const billPaid = (j: Pick<BillJob, 'payments'>) => sum(j.payments.map((x) => x.amount));
export const billBalance = (j: Pick<BillJob, 'services' | 'parts' | 'discount' | 'payments'>) => billTotal(j) - billPaid(j);

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
export const payStateOf = (j: Pick<BillJob, 'services' | 'parts' | 'discount' | 'payments'>): PayState => {
  const bal = billBalance(j);
  return billTotal(j) > 0 && bal <= 0 ? 'paid' : billPaid(j) > 0 ? 'partial' : 'unpaid';
};
export const PAY_WORD: Record<PayState, string> = { unpaid: 'Unpaid', partial: 'Partly paid', paid: 'Paid in full' };

export const isQuoteStatus = (j: { status: JobStatus }) => j.status === 'QUOTATION' || j.status === 'FOR_APPROVAL';
/** Completed jobs are closed (the API answers 409 to a payment on a completed job). */
export const isClosed = (j: { status: JobStatus }) => j.status === 'COMPLETED';
/** The price is final once the work is done: ready for pick-up or completed. Earlier it is the price so far. */
export const isFinalPrice = (j: { status: JobStatus }) => j.status === 'FOR_PICKUP' || j.status === 'COMPLETED';

export interface StatementLine {
  key: string; kind: 'service' | 'part'; index: number; name: string; qty: number; unit: number; total: number;
  /** "Custom price (set: P1,200)" when the price was edited from the set one. */
  setPrice?: number; billing: boolean; sub?: string;
}
export function statementOf(j: Pick<BillJob, 'services' | 'parts'>): { services: StatementLine[]; parts: StatementLine[] } {
  const services = j.services.map((s, i) => ({
    key: `s${i}`, kind: 'service' as const, index: i, name: s.name, qty: s.qty, unit: s.price, total: s.price * s.qty,
    setPrice: s.listPrice !== undefined && s.listPrice !== s.price ? s.listPrice : undefined, billing: !!s.billing,
  }));
  const parts = j.parts.map((l, i) => ({
    key: `p${i}`, kind: 'part' as const, index: i, name: l.name, qty: l.qty, unit: partUnit(l), total: partUnit(l) * l.qty,
    setPrice: l.price !== undefined && l.price !== l.listPrice ? l.listPrice : undefined, billing: !!l.billing, sub: `${l.sku} · per ${l.unit}`,
  }));
  return { services, parts };
}

export const fmt = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
export const discountWord = (d: BillDiscount) => (d.kind === 'percent' ? `${d.value}%` : fmt(d.value));

/** What the discount field says, or null when it is fine. Percent is 0-100, an amount cannot pass the subtotal, the total cannot go under what is paid. */
export function discountError(kind: BillDiscount['kind'], raw: string, job: Pick<BillJob, 'services' | 'parts' | 'payments'>): string | null {
  const t = raw.trim();
  if (t === '') return 'Enter an amount.';
  const n = Number(t);
  if (!Number.isFinite(n)) return 'Numbers only.';
  if (n <= 0) return 'Must be more than zero.';
  const sub = billSubtotal(job);
  if (kind === 'percent') {
    if (n > 100) return 'A percent can be 100 at most.';
    if (!/^\d+(\.\d{1,2})?$/.test(t)) return 'Up to 2 decimals.';
  } else {
    if (n > sub) return `Cannot be more than the subtotal (${fmt(sub)}).`;
    if (!/^\d+(\.\d{1,2})?$/.test(t)) return 'Up to 2 decimals.';
  }
  const off = kind === 'percent' ? Math.round((sub * n) / 100) : n;
  if (sub - off < billPaid(job)) return `The total would fall below what is already paid (${fmt(billPaid(job))}). Void a payment first.`;
  return null;
}
export const discountPreview = (kind: BillDiscount['kind'], raw: string, job: Pick<BillJob, 'services' | 'parts'>): number => {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(billSubtotal(job), kind === 'percent' ? Math.round((billSubtotal(job) * Math.min(n, 100)) / 100) : n);
};

export interface PaymentCheck { error: string | null; refError: string | null; tenderedError: string | null; change: number }
export function checkPayment(job: Pick<BillJob, 'services' | 'parts' | 'discount' | 'payments'>, p: { amount: string; method: PaymentMethod; ref: string; tendered: string }): PaymentCheck {
  const bal = billBalance(job);
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
  number: string; shop: ReceiptShop;
  customer: string; phone: string; car: string; plate: string; mechanic: string | null; quoteNo?: string;
  lines: { name: string; qty: number; unit: number; total: number; part: boolean; billing: boolean }[];
  subtotal: number; discount: number; discountNote: string | null; total: number; payments: BillPayment[]; paid: number; balance: number; state: PayState;
}
/** The statement as one document: the job, the header (customer, car, mechanic) and the shop's own details. */
export function receiptOf(j: BillJob, header: StatementHeader, shop: ReceiptShop): ReceiptData {
  const st = statementOf(j);
  const row = (l: StatementLine) => ({ name: l.name, qty: l.qty, unit: l.unit, total: l.total, part: l.kind === 'part', billing: l.billing });
  return {
    number: j.number, shop, customer: header.customer, phone: header.phone, car: header.car, plate: header.plate, mechanic: header.mechanic, quoteNo: j.quoteNo,
    lines: [...st.services.map(row), ...st.parts.map(row)], subtotal: billSubtotal(j), discount: billDiscount(j),
    discountNote: j.discount ? `${discountWord(j.discount)}${j.discount.reason ? `, ${j.discount.reason}` : ''}` : null,
    total: billTotal(j), payments: j.payments, paid: billPaid(j), balance: billBalance(j), state: payStateOf(j),
  };
}
