/**
 * SMS round 1 shared dataset (Manager Today). Studio only, never shipped.
 * One branch: Dela Cruz Auto Works - Kapitolyo (Pasig). Business date Mon 2 Nov 2026, now 10:20.
 * Every total is computed from rows below; never type a figure twice.
 */

// ---------- Types ----------
export type JobStatus = 'QUOTATION' | 'FOR_APPROVAL' | 'TODO' | 'IN_PROGRESS' | 'PENDING' | 'FOR_PICKUP' | 'COMPLETED';
export type PendingReason = 'WAITING_FOR_PARTS' | 'WAITING_FOR_CUSTOMER' | 'WAITING_FOR_ANOTHER_MECHANIC' | 'OTHER';
export type PaymentMethod = 'CASH' | 'GCASH' | 'MAYA' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';
export type StockState = 'in' | 'low' | 'out' | 'on_order';
export type Role = 'manager' | 'mechanic';
export type NeedsReason = 'OVERDUE' | 'PARTS' | 'APPROVAL' | 'PICKUP_UNPAID';

export interface Person { id: string; name: string; short: string; initials: string; role: Role; phone: string }
export interface Mechanic extends Person { role: 'mechanic'; bay: string; onShift: boolean; shift: string }
export interface Vehicle { id: string; plate: string; make: string; model: string; year: number; kind: 'car' | 'van' | 'pickup' | 'motorcycle';
  /** Optional car details (studio extension): set when a car is added or edited on the Customer page. */
  colour?: string; mileage?: number; vin?: string; fuel?: 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'lpg'; transmission?: 'manual' | 'automatic'; notes?: string; remindEvery?: 3 | 6 | 12 }
export interface Customer { id: string; name: string; phone: string; vehicles: Vehicle[]; since: string }
export interface StockLocation { name: string; qty: number; thisBranch: boolean }
export interface OnOrder { po: string; qty: number; eta: string; supplier: string }
export interface Product {
  id: string; sku: string; name: string; unit: string; price: number;
  reorder: number; locations: StockLocation[]; onOrder?: OnOrder;
}
export interface ServiceLine {
  name: string; price: number; qty: number; done: boolean;
  /** Studio extension: the Services & prices catalogue entry (null for a custom line), the catalogue's set price when this line was edited, and whether it is a custom line. */
  typeId?: string | null; listPrice?: number; custom?: boolean;
  /** Payment page (studio): added at billing because the final work differed from the quote. */
  billing?: boolean;
}
export interface PartLine {
  productId: string; qty: number; issued: number;
  /** Payment page (studio): a price set at billing instead of the Inventory sell price, and whether the line was added at billing. */
  price?: number; billing?: boolean;
}
/** `by` and `tendered` are studio extensions: who took the payment, and the cash handed over (change = tendered - amount). */
export interface Payment { at: string; amount: number; method: PaymentMethod; ref?: string; by?: string; tendered?: number; remarks?: string }
/** Custom discount on the final price (studio): a fixed peso amount or a percent of the subtotal, with an optional reason. The API stores only a peso amount. */
export interface Discount { kind: 'amount' | 'percent'; value: number; reason?: string }
export interface Job {
  id: string; number: string; status: JobStatus;
  customerId: string; vehicleId: string; assigneeId: string | null;
  createdAt: string; statusSince: string; promisedAt: string | null;
  complaint: string; pendingReason?: PendingReason; pendingNote?: string;
  quoteSentAt?: string; services: ServiceLine[]; parts: PartLine[]; payments: Payment[];
  /** Studio extension (New service wizard): quotation number kept after it becomes a job order (QT-0007 -> JO-0431), valid-until date, parked flag, remarks and mileage in (km). */
  quoteNo?: string; quoteValidUntil?: string; quoteParked?: boolean; remarks?: string; mileageIn?: number;
  /** Payment page (studio): the custom discount. */
  discount?: Discount;
}

// ---------- Clock ----------
export const TODAY = '2026-11-02';
export const NOW = '2026-11-02T10:20:00+08:00';
/** Minutes since midnight, for DayBar / DayTimeline. */
/** Source of truth: Portal Settings > company > business hours (this branch). */
export const businessHours = { open: '07:30', close: '17:30' };
const toMin = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
export const HOURS = { open: toMin(businessHours.open), close: toMin(businessHours.close) };
export const NOW_MIN = 10 * 60 + 20;

// ---------- Branch and people ----------
export const branch = {
  business: 'Dela Cruz Auto Works',
  name: 'Kapitolyo',
  full: 'Dela Cruz Auto Works - Kapitolyo',
  address: 'United St., Kapitolyo, Pasig City',
  inventory: { platform: 'Dela Cruz Parts', link: 'linked' as 'linked' | 'slow' | 'down', lastSync: '2026-11-02T10:18:00+08:00' },
};

export const manager: Person = { id: 'p-mon', name: 'Ramon "Mon" Aquino', short: 'Mon', initials: 'MA', role: 'manager', phone: '0917 555 0142' };

export const mechanics: Mechanic[] = [
  { id: 'm-jun', name: 'Jun Bautista', short: 'Jun', initials: 'JB', role: 'mechanic', phone: '0918 220 4471', bay: 'Bay 1', onShift: true, shift: '8:00-17:00' },
  { id: 'm-arnel', name: 'Arnel Villanueva', short: 'Arnel', initials: 'AV', role: 'mechanic', phone: '0927 813 0096', bay: 'Bay 2', onShift: true, shift: '8:00-17:00' },
  { id: 'm-paolo', name: 'Paolo Mendoza', short: 'Paolo', initials: 'PM', role: 'mechanic', phone: '0995 402 7718', bay: 'Bay 3', onShift: true, shift: '9:00-18:00' },
  { id: 'm-ricky', name: 'Ricky Santos', short: 'Ricky', initials: 'RS', role: 'mechanic', phone: '0906 377 2150', bay: 'Moto bay', onShift: true, shift: '8:00-17:00' },
];

// ---------- Customers and vehicles ----------
const v = (id: string, plate: string, make: string, model: string, year: number, kind: Vehicle['kind'] = 'car'): Vehicle => ({ id, plate, make, model, year, kind });

export const customers: Customer[] = [
  { id: 'c01', name: 'Maricel Reyes', phone: '0917 803 2214', since: '2023-04-11', vehicles: [v('v01', 'NBC 4521', 'Toyota', 'Vios', 2016), v('v23', 'NDH 5502', 'Honda', 'Jazz', 2012)] },
  { id: 'c02', name: 'Rogelio Pascual', phone: '0928 441 9030', since: '2021-09-02', vehicles: [v('v02', 'NAB 2287', 'Mitsubishi', 'L300', 2014, 'van'), v('v24', 'NAB 2290', 'Mitsubishi', 'L300', 2016, 'van')] },
  { id: 'c03', name: 'Jennifer Lim', phone: '0917 662 5108', since: '2024-01-20', vehicles: [v('v03', 'NDQ 7731', 'Honda', 'City', 2019)] },
  { id: 'c04', name: 'Carlo Gutierrez', phone: '0939 120 8845', since: '2022-06-15', vehicles: [v('v04', 'NEF 1163', 'Ford', 'Ranger', 2018, 'pickup')] },
  { id: 'c05', name: 'Bong Navarro', phone: '0905 718 3329', since: '2025-02-08', vehicles: [v('v05', '7821 QK', 'Honda', 'Click 125', 2021, 'motorcycle')] },
  { id: 'c06', name: 'Grace Villareal', phone: '0918 904 6672', since: '2020-11-30', vehicles: [v('v06', 'DAE 5512', 'Toyota', 'Innova', 2017, 'van'), v('v25', 'DAK 8830', 'Toyota', 'Innova', 2019, 'van'), v('v26', 'NHP 1147', 'Honda', 'City', 2018)] },
  { id: 'c07', name: 'Mark Anthony Cruz', phone: '0966 213 4407', since: '2026-11-02', vehicles: [v('v07', 'NFE 3390', 'Nissan', 'Almera', 2020)] },
  { id: 'c08', name: 'Liza Fernandez', phone: '0917 330 1985', since: '2022-03-14', vehicles: [v('v08', 'NAQ 6604', 'Mitsubishi', 'Mirage', 2019)] },
  { id: 'c09', name: 'Dennis Ocampo', phone: '0947 556 0213', since: '2023-08-22', vehicles: [v('v09', 'NDA 9047', 'Suzuki', 'Ertiga', 2020, 'van')] },
  { id: 'c10', name: 'Arturo Manalo', phone: '0919 287 7741', since: '2019-05-06', vehicles: [v('v10', 'ZTH 3318', 'Toyota', 'Hilux', 2015, 'pickup'), v('v27', 'NCE 6071', 'Toyota', 'Vios', 2010)] },
  { id: 'c11', name: 'Teresita Gomez', phone: '0920 114 5536', since: '2021-12-01', vehicles: [v('v11', 'NCT 2290', 'Toyota', 'Fortuner', 2017)] },
  { id: 'c12', name: 'Ramil Dizon-Villanueva y Guzman', phone: '0915 668 3092', since: '2024-07-19', vehicles: [v('v12', 'UIQ 8125', 'Hyundai', 'Accent 1.4 GL Sedan Limited Edition', 2015)] },
  { id: 'c13', name: 'Joy Castillo', phone: '0977 245 8810', since: '2025-10-03', vehicles: [v('v13', 'NGB 4417', 'Toyota', 'Wigo', 2021)] },
  { id: 'c14', name: 'Edwin Salazar', phone: '0932 870 1124', since: '2022-02-27', vehicles: [v('v14', 'NBR 7356', 'Isuzu', 'D-Max', 2016, 'pickup')] },
  { id: 'c15', name: 'Kristine Aquino', phone: '0917 491 6630', since: '2023-10-10', vehicles: [v('v15', 'NEK 5021', 'Kia', 'Picanto', 2018)] },
  { id: 'c16', name: 'Benjie Torres', phone: '0921 307 5594', since: '2020-08-18', vehicles: [v('v16', 'NCX 8812', 'Toyota', 'Vios', 2018)] },
  { id: 'c17', name: 'Rowena Bautista', phone: '0908 652 7703', since: '2024-05-25', vehicles: [v('v17', 'NAU 1478', 'Honda', 'Civic', 2016)] },
  { id: 'c18', name: 'Jayson Robles', phone: '0956 731 0082', since: '2025-06-12', vehicles: [v('v18', '4410 RF', 'Yamaha', 'NMAX 155', 2022, 'motorcycle')] },
  { id: 'c19', name: 'Nestor Dimaculangan', phone: '0917 229 4185', since: '2018-03-03', vehicles: [v('v19', 'NIO 6630', 'Toyota', 'Corolla Altis', 2014), v('v28', 'NGS 3359', 'Honda', 'CR-V', 2013)] },
  { id: 'c20', name: 'Abigail Ramos', phone: '0929 558 3371', since: '2024-12-09', vehicles: [v('v20', 'NFH 2051', 'Mitsubishi', 'Xpander', 2021, 'van')] },
  { id: 'c21', name: 'Rodel Panganiban', phone: '0910 846 2239', since: '2023-02-14', vehicles: [v('v21', '9932 PL', 'Honda', 'Beat', 2020, 'motorcycle')] },
  { id: 'c22', name: 'Cecilia Tan', phone: '0917 775 9046', since: '2021-07-07', vehicles: [v('v22', 'NDE 3384', 'Toyota', 'Vios', 2020)] },
];

// ---------- Inventory products (read through the platform link) ----------
const here = (qty: number): StockLocation => ({ name: 'Kapitolyo stockroom', qty, thisBranch: true });
const main = (qty: number): StockLocation => ({ name: 'Main warehouse, Ortigas', qty, thisBranch: false });

export const products: Product[] = [
  { id: 'pr01', sku: 'OIL-SH-1040-4L', name: 'Shell Helix HX7 10W-40, 4 L', unit: 'gallon', price: 1850, reorder: 6, locations: [here(14), main(40)] },
  { id: 'pr02', sku: 'FLT-OIL-TY90915', name: 'Oil filter, Toyota 90915-YZZE1', unit: 'pc', price: 320, reorder: 8, locations: [here(11), main(30)] },
  { id: 'pr03', sku: 'BRK-PAD-BEN-F', name: 'Bendix brake pads, front set', unit: 'set', price: 2450, reorder: 4, locations: [here(2), main(0)], onOrder: { po: 'PO-0233', qty: 6, eta: '2026-11-04T14:00:00+08:00', supplier: 'Autopro Pasig' } },
  { id: 'pr04', sku: 'ALT-DEN-VIOS', name: 'Denso alternator, Vios 2013-2018', unit: 'pc', price: 9800, reorder: 1, locations: [here(0), main(2)] },
  { id: 'pr05', sku: 'TMB-KIT-4D56', name: 'Timing belt kit, Mitsubishi 4D56', unit: 'kit', price: 3200, reorder: 1, locations: [here(0), main(0)], onOrder: { po: 'PO-0231', qty: 2, eta: '2026-11-03T11:00:00+08:00', supplier: 'Gerry\'s Auto Supply' } },
  { id: 'pr06', sku: 'PLG-NGK-BKR6', name: 'NGK spark plug BKR6E', unit: 'pc', price: 180, reorder: 12, locations: [here(24), main(60)] },
  { id: 'pr07', sku: 'CLT-PRS-1L', name: 'Prestone coolant, 1 L', unit: 'bottle', price: 650, reorder: 6, locations: [here(5), main(18)] },
  { id: 'pr08', sku: 'SHK-KYB-HLX-F', name: 'KYB shock absorber, Hilux front (pair)', unit: 'pair', price: 3600, reorder: 1, locations: [here(1), main(3)] },
  { id: 'pr09', sku: 'BLT-CVT-CLICK', name: 'CVT drive belt, Honda Click 125', unit: 'pc', price: 850, reorder: 3, locations: [here(4), main(10)] },
  { id: 'pr10', sku: 'BAT-MTL-NS60', name: 'Motolite Gold NS60 battery', unit: 'pc', price: 5200, reorder: 2, locations: [here(3), main(8)] },
  { id: 'pr11', sku: 'ACC-CLN-FOAM', name: 'Aircon cleaning foam, 500 mL', unit: 'can', price: 420, reorder: 4, locations: [here(6), main(20)] },
  { id: 'pr12', sku: 'OIL-MOT-10W30-1L', name: 'Motul scooter oil 10W-30, 1 L', unit: 'bottle', price: 380, reorder: 6, locations: [here(9), main(24)] },
];

// ---------- Jobs ----------
const s = (name: string, price: number, done = false, qty = 1): ServiceLine => ({ name, price, qty, done });
const p = (productId: string, qty: number, issued = 0): PartLine => ({ productId, qty, issued });
const t = (dayTime: string) => `2026-${dayTime}:00+08:00`; // "11-02T10:20"

export const jobs: Job[] = [
  // Pending: parts
  { id: 'j0398', number: 'JO-0398', status: 'PENDING', customerId: 'c02', vehicleId: 'v02', assigneeId: 'm-arnel',
    createdAt: t('10-30T09:10'), statusSince: t('10-30T15:40'), promisedAt: t('11-03T17:00'),
    complaint: 'Engine noise at idle, timing belt due', pendingReason: 'WAITING_FOR_PARTS', pendingNote: 'Timing belt kit on PO-0231',
    services: [s('Timing belt replacement', 2800), s('Engine diagnosis', 500, true)], parts: [p('pr05', 1)], payments: [{ at: t('10-30T09:30'), amount: 2000, method: 'GCASH', ref: '7012 448 1190' }] },
  { id: 'j0412', number: 'JO-0412', status: 'PENDING', customerId: 'c01', vehicleId: 'v01', assigneeId: 'm-jun',
    createdAt: t('11-01T14:20'), statusSince: t('11-01T16:05'), promisedAt: t('11-02T11:00'),
    complaint: 'Battery light on, car died on EDSA', pendingReason: 'WAITING_FOR_PARTS', pendingNote: 'Alternator out here',
    services: [s('Alternator replacement incl. drive belt, charging system test and battery terminal service', 1500), s('Charging system test', 400, true)], parts: [p('pr04', 1)], payments: [] },
  // For approval (quote sent)
  { id: 'j0414', number: 'JO-0414', status: 'FOR_APPROVAL', customerId: 'c03', vehicleId: 'v03', assigneeId: null,
    createdAt: t('10-31T10:00'), statusSince: t('10-31T11:15'), promisedAt: null, quoteSentAt: t('10-31T11:15'),
    complaint: 'Aircon not cold, smells', services: [s('Aircon cleaning', 2500), s('Freon recharge', 1800)], parts: [p('pr11', 1)], payments: [] },
  { id: 'j0416', number: 'JO-0416', status: 'FOR_APPROVAL', customerId: 'c04', vehicleId: 'v04', assigneeId: null,
    createdAt: t('11-01T15:30'), statusSince: t('11-01T16:10'), promisedAt: null, quoteSentAt: t('11-01T16:10'),
    complaint: 'Squeaking brakes', services: [s('Brake pad replacement, front', 800), s('Rotor resurfacing', 1200)], parts: [p('pr03', 1)], payments: [] },
  { id: 'j0419', number: 'JO-0419', status: 'FOR_APPROVAL', customerId: 'c05', vehicleId: 'v05', assigneeId: null,
    createdAt: t('11-02T08:30'), statusSince: t('11-02T08:45'), promisedAt: null, quoteSentAt: t('11-02T08:45'),
    complaint: 'Vibration when accelerating', services: [s('CVT cleaning', 350), s('Drive belt replacement', 300)], parts: [p('pr09', 1)], payments: [] },
  // Quotation (being written)
  { id: 'j0421', number: 'JO-0421', status: 'QUOTATION', customerId: 'c06', vehicleId: 'v06', assigneeId: null,
    createdAt: t('11-02T09:40'), statusSince: t('11-02T09:40'), promisedAt: null,
    complaint: 'Overheating in traffic', services: [s('Radiator flush', 900)], parts: [p('pr07', 2)], payments: [] },
  { id: 'j0422', number: 'JO-0422', status: 'QUOTATION', customerId: 'c07', vehicleId: 'v07', assigneeId: null,
    createdAt: t('11-02T10:05'), statusSince: t('11-02T10:05'), promisedAt: null,
    complaint: 'Brakes soft, 40,000 km service', services: [s('40,000 km PMS', 3500), s('Brake pad replacement, front', 800)], parts: [p('pr01', 1), p('pr03', 1)], payments: [] },
  // To-do
  { id: 'j0415', number: 'JO-0415', status: 'TODO', customerId: 'c08', vehicleId: 'v08', assigneeId: 'm-jun',
    createdAt: t('11-01T17:10'), statusSince: t('11-02T08:00'), promisedAt: t('11-02T13:00'),
    complaint: 'Oil change', services: [s('Oil change', 450)], parts: [p('pr01', 1), p('pr02', 1)], payments: [] },
  { id: 'j0417', number: 'JO-0417', status: 'TODO', customerId: 'c09', vehicleId: 'v09', assigneeId: 'm-jun',
    createdAt: t('11-02T08:05'), statusSince: t('11-02T08:25'), promisedAt: t('11-02T16:00'),
    complaint: 'Rough idle, tune-up', services: [s('Major tune-up incl. spark plug set, throttle body cleaning and valve clearance check', 1200)], parts: [p('pr06', 4)], payments: [] },
  { id: 'j0420', number: 'JO-0420', status: 'TODO', customerId: 'c10', vehicleId: 'v10', assigneeId: 'm-paolo',
    createdAt: t('11-01T16:40'), statusSince: t('11-02T09:00'), promisedAt: t('11-02T15:00'),
    complaint: 'Pulls to the left, bouncy', services: [s('Wheel alignment', 700), s('Shock absorber replacement, front', 1400)], parts: [p('pr08', 1)], payments: [{ at: t('11-02T09:00'), amount: 3000, method: 'GCASH', ref: '7012 530 6617' }] },
  // In progress
  { id: 'j0408', number: 'JO-0408', status: 'IN_PROGRESS', customerId: 'c11', vehicleId: 'v11', assigneeId: 'm-jun',
    createdAt: t('11-01T10:30'), statusSince: t('11-02T08:10'), promisedAt: t('11-02T12:00'),
    complaint: 'Temperature gauge high', services: [s('Radiator flush', 900, true), s('Thermostat check', 400)], parts: [p('pr07', 3, 3)], payments: [] },
  { id: 'j0410', number: 'JO-0410', status: 'IN_PROGRESS', customerId: 'c12', vehicleId: 'v12', assigneeId: 'm-arnel',
    createdAt: t('11-01T11:00'), statusSince: t('11-02T08:20'), promisedAt: t('11-02T10:00'),
    complaint: 'Grinding when braking', services: [s('Full brake system overhaul incl. rotor resurfacing and brake fluid flush', 800, true), s('Brake fluid flush', 600)], parts: [p('pr03', 1, 1)], payments: [{ at: t('11-01T11:20'), amount: 1500, method: 'CASH' }] },
  { id: 'j0413', number: 'JO-0413', status: 'IN_PROGRESS', customerId: 'c13', vehicleId: 'v13', assigneeId: 'm-jun',
    createdAt: t('11-02T08:15'), statusSince: t('11-02T09:50'), promisedAt: t('11-02T11:30'),
    complaint: 'Oil change, first service', services: [s('Oil change', 450)], parts: [p('pr01', 1, 1), p('pr02', 1, 1)], payments: [] },
  { id: 'j0411', number: 'JO-0411', status: 'IN_PROGRESS', customerId: 'c14', vehicleId: 'v14', assigneeId: 'm-paolo',
    createdAt: t('11-01T13:15'), statusSince: t('11-02T09:05'), promisedAt: t('11-02T14:00'),
    complaint: 'Hard starting in the morning', services: [s('Battery replacement', 300), s('Starter check', 600)], parts: [p('pr10', 1, 1)], payments: [] },
  { id: 'j0418', number: 'JO-0418', status: 'IN_PROGRESS', customerId: 'c15', vehicleId: 'v15', assigneeId: 'm-ricky',
    createdAt: t('11-02T08:20'), statusSince: t('11-02T08:40'), promisedAt: t('11-02T12:30'),
    complaint: 'Aircon weak', services: [s('Aircon cleaning', 2500)], parts: [p('pr11', 1, 1)], payments: [] },
  // For pick-up
  { id: 'j0403', number: 'JO-0403', status: 'FOR_PICKUP', customerId: 'c16', vehicleId: 'v16', assigneeId: 'm-arnel',
    createdAt: t('10-31T09:00'), statusSince: t('11-01T17:30'), promisedAt: t('11-01T17:00'),
    complaint: 'Front suspension noise', services: [s('Stabilizer link replacement', 1600, true), s('Wheel alignment', 700, true)], parts: [], payments: [] },
  { id: 'j0407', number: 'JO-0407', status: 'FOR_PICKUP', customerId: 'c17', vehicleId: 'v17', assigneeId: 'm-paolo',
    createdAt: t('10-31T14:00'), statusSince: t('11-02T09:30'), promisedAt: t('11-02T10:00'),
    complaint: 'Battery dead, 50,000 km PMS', services: [s('50,000 km PMS', 4200, true), s('Battery replacement', 300, true)], parts: [p('pr10', 1, 1), p('pr01', 1, 1), p('pr02', 1, 1)], payments: [{ at: t('10-31T14:15'), amount: 3000, method: 'GCASH', ref: '7011 902 3341' }] },
  { id: 'j0409', number: 'JO-0409', status: 'FOR_PICKUP', customerId: 'c18', vehicleId: 'v18', assigneeId: 'm-ricky',
    createdAt: t('11-01T09:00'), statusSince: t('11-02T09:15'), promisedAt: t('11-02T12:00'),
    complaint: 'Change oil and CVT cleaning', services: [s('Oil change', 250, true), s('CVT cleaning', 350, true)], parts: [p('pr12', 1, 1)], payments: [{ at: t('11-02T09:20'), amount: 980, method: 'GCASH', ref: '7012 655 0408' }] },
  // Completed today
  { id: 'j0401', number: 'JO-0401', status: 'COMPLETED', customerId: 'c19', vehicleId: 'v19', assigneeId: 'm-jun',
    createdAt: t('10-30T08:30'), statusSince: t('11-02T08:35'), promisedAt: t('11-01T17:00'),
    complaint: 'Clutch slipping', services: [s('Clutch replacement', 4500, true)], parts: [], payments: [{ at: t('11-02T08:35'), amount: 4500, method: 'BANK_TRANSFER', ref: 'BDO 448812' }] },
  { id: 'j0404', number: 'JO-0404', status: 'COMPLETED', customerId: 'c20', vehicleId: 'v20', assigneeId: 'm-arnel',
    createdAt: t('10-31T10:10'), statusSince: t('11-02T09:05'), promisedAt: t('11-02T09:00'),
    complaint: '20,000 km PMS', services: [s('20,000 km PMS', 3500, true)], parts: [p('pr01', 1, 1), p('pr02', 1, 1)], payments: [{ at: t('11-02T09:05'), amount: 5670, method: 'CARD' }] },
  { id: 'j0405', number: 'JO-0405', status: 'COMPLETED', customerId: 'c21', vehicleId: 'v21', assigneeId: 'm-ricky',
    createdAt: t('11-01T15:00'), statusSince: t('11-02T09:40'), promisedAt: t('11-02T10:00'),
    complaint: 'Change oil', services: [s('Oil change', 250, true)], parts: [p('pr12', 1, 1)], payments: [{ at: t('11-02T09:40'), amount: 630, method: 'CASH' }] },
  { id: 'j0406', number: 'JO-0406', status: 'COMPLETED', customerId: 'c22', vehicleId: 'v22', assigneeId: 'm-paolo',
    createdAt: t('11-01T09:30'), statusSince: t('11-02T10:10'), promisedAt: t('11-02T10:00'),
    complaint: 'Aircon cleaning', services: [s('Aircon cleaning', 2500, true)], parts: [p('pr11', 1, 1)], payments: [{ at: t('11-02T10:10'), amount: 2920, method: 'GCASH', ref: '7012 771 9024' }] },
];

// ---------- Lookups ----------
export const customerOf = (j: Job) => customers.find((c) => c.id === j.customerId)!;
export const vehicleOf = (j: Job) => customerOf(j).vehicles.find((x) => x.id === j.vehicleId)!;
export const mechanicOf = (j: Job) => mechanics.find((m) => m.id === j.assigneeId) ?? null;
export const productOf = (id: string) => products.find((x) => x.id === id)!;

// ---------- Money (computed from lines) ----------
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const servicesTotal = (j: Job) => sum(j.services.map((x) => x.price * x.qty));
export const partPrice = (l: PartLine) => l.price ?? productOf(l.productId).price;
export const partsTotal = (j: Job) => sum(j.parts.map((x) => partPrice(x) * x.qty));
/** Before any discount. */
export const jobSubtotal = (j: Job) => servicesTotal(j) + partsTotal(j);
/** The discount in pesos, never above the subtotal. */
export const discountOf = (j: Job) => {
  const d = j.discount; if (!d || d.value <= 0) return 0;
  const raw = d.kind === 'percent' ? Math.round((jobSubtotal(j) * Math.min(d.value, 100)) / 100) : d.value;
  return Math.min(Math.max(raw, 0), jobSubtotal(j));
};
/** The final price: subtotal less the discount. */
export const jobTotal = (j: Job) => jobSubtotal(j) - discountOf(j);
export const jobPaid = (j: Job) => sum(j.payments.map((x) => x.amount));
export const jobBalance = (j: Job) => jobTotal(j) - jobPaid(j);
export const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;

// ---------- Stock (computed from locations and open jobs) ----------
export const onHandHere = (pr: Product) => sum(pr.locations.filter((l) => l.thisBranch).map((l) => l.qty));
export const onHandElsewhere = (pr: Product) => pr.locations.filter((l) => !l.thisBranch && l.qty > 0);
/** Parts still to issue to open jobs (approved or not), per product. */
export const reservedFor = (pr: Product) =>
  sum(jobs.filter((j) => j.status !== 'COMPLETED').flatMap((j) => j.parts).filter((l) => l.productId === pr.id).map((l) => l.qty - l.issued));
export const stockState = (pr: Product): StockState => {
  const left = onHandHere(pr);
  if (left === 0) return pr.onOrder ? 'on_order' : 'out';
  return left <= pr.reorder ? 'low' : 'in';
};
/** A part line is short when the branch cannot cover what is still to issue. */
export const shortLines = (j: Job) => j.parts.filter((l) => l.qty - l.issued > onHandHere(productOf(l.productId)));

// ---------- Derived views ----------
export const openJobs = jobs.filter((j) => j.status !== 'COMPLETED');
export const PIPELINE: { status: JobStatus; label: string }[] = [
  { status: 'QUOTATION', label: 'Quotation' }, { status: 'FOR_APPROVAL', label: 'For approval' },
  { status: 'TODO', label: 'To-do' }, { status: 'IN_PROGRESS', label: 'In progress' },
  { status: 'PENDING', label: 'Pending' }, { status: 'FOR_PICKUP', label: 'For pick-up' },
  { status: 'COMPLETED', label: 'Completed today' },
];
export const jobsIn = (st: JobStatus) =>
  jobs.filter((j) => j.status === st && (st !== 'COMPLETED' || j.statusSince.startsWith(TODAY)));
export const pipelineCounts = PIPELINE.map((x) => ({ ...x, count: jobsIn(x.status).length }));

const isPast = (iso: string | null) => !!iso && iso < NOW;
const ACTIVE: JobStatus[] = ['TODO', 'IN_PROGRESS', 'PENDING'];

/** Each open job shows once, under its first reason (priority order of NeedsReason). */
export const needsYou = openJobs
  .map((j) => {
    let reason: NeedsReason | null = null;
    if (ACTIVE.includes(j.status) && isPast(j.promisedAt)) reason = 'OVERDUE';
    else if (j.status === 'PENDING' && j.pendingReason === 'WAITING_FOR_PARTS') reason = 'PARTS';
    else if (j.status === 'FOR_APPROVAL') reason = 'APPROVAL';
    else if (j.status === 'FOR_PICKUP' && jobBalance(j) > 0) reason = 'PICKUP_UNPAID';
    return reason ? { job: j, reason } : null;
  })
  .filter((x): x is { job: Job; reason: NeedsReason } => x !== null);

export const NEEDS_LABEL: Record<NeedsReason, string> = {
  OVERDUE: 'Past promised time', PARTS: 'Waiting on parts', APPROVAL: 'Waiting for customer approval',
  PICKUP_UNPAID: 'Ready, not paid',
};

/** Who is working on what: active jobs per mechanic. */
export const mechanicLoad = mechanics.map((m) => {
  const mine = openJobs.filter((j) => j.assigneeId === m.id && ACTIVE.includes(j.status));
  return { mechanic: m, jobs: mine, inProgress: mine.filter((j) => j.status === 'IN_PROGRESS').length, count: mine.length };
});

/** Parts awareness for the page: every product an open job still needs, worst first. */
export const partsWatch = products
  .map((pr) => ({ product: pr, state: stockState(pr), here: onHandHere(pr), reserved: reservedFor(pr),
    elsewhere: onHandElsewhere(pr), blocking: openJobs.filter((j) => shortLines(j).some((l) => l.productId === pr.id)) }))
  .filter((x) => x.reserved > 0 && (x.state !== 'in' || x.reserved > x.here))
  .sort((a, b) => b.blocking.length - a.blocking.length);

// ---------- Today's numbers (inline facts, never stat cards) ----------
const paymentsToday = jobs.flatMap((j) => j.payments.map((pay) => ({ ...pay, job: j }))).filter((x) => x.at.startsWith(TODAY));
export const today = {
  carsIn: jobs.filter((j) => j.createdAt.startsWith(TODAY)).length,
  completed: jobsIn('COMPLETED').length,
  collected: sum(paymentsToday.map((x) => x.amount)),
  payments: paymentsToday,
  open: openJobs.length,
  /** Owed on cars that are ready: money waiting at the counter. */
  owedAtPickup: sum(jobsIn('FOR_PICKUP').map(jobBalance)),
};

// ---------- Leda (manager scope; every write is confirmed) ----------
export interface LedaProposalData {
  id: string; title: string; why: string; jobIds: string[];
  writes: string[]; cannot?: string; confirmLabel: string; platform: 'SMS' | 'Inventory' | 'SMS + Inventory';
}
const alt = productOf('pr04');
export const ledaHeadline =
  `JO-0412 is promised at 11:00 but the alternator is out here; ${onHandElsewhere(alt)[0].name} has ${onHandElsewhere(alt)[0].qty}. ` +
  `Jun has ${mechanicLoad[0].count} jobs, Ricky has ${mechanicLoad[3].count}.`;

export const ledaProposals: LedaProposalData[] = [
  { id: 'lp1', platform: 'SMS + Inventory', jobIds: ['j0412'], confirmLabel: 'Request transfer',
    title: 'Get the Vios alternator from Ortigas for JO-0412',
    why: 'Out at Kapitolyo, 2 at Main warehouse, Ortigas. A transfer usually arrives in about 2 hours.',
    writes: ['Inventory: transfer request, 1 x Denso alternator, Ortigas to Kapitolyo, for JO-0412',
      'SMS: JO-0412 pending note "Transfer requested, expected 12:30"',
      'SMS: text Maricel Reyes the new time, 14:30'],
    cannot: 'Send the transfer. Ortigas staff send it in Inventory.' },
  { id: 'lp2', platform: 'SMS', jobIds: ['j0417'], confirmLabel: 'Reassign',
    title: 'Move JO-0417 major tune-up incl. spark plug set, throttle body cleaning and valve clearance check from Jun to Ricky',
    why: 'Jun has 5 active services and JO-0412 coming back; Ricky has 1 and is free after 12:30. Promised 16:00.',
    writes: ['SMS: JO-0417 assignee Jun Bautista to Ricky Santos', 'SMS: notify Jun and Ricky'] },
  { id: 'lp3', platform: 'SMS', jobIds: ['j0414', 'j0416'], confirmLabel: 'Send 2 reminders',
    title: 'Remind 2 customers about their quotes',
    why: 'Jennifer Lim has not answered since Sat 11:15; Carlo Gutierrez since yesterday 16:10.',
    writes: ['SMS: text Jennifer Lim, quote JO-0414', 'SMS: text Carlo Gutierrez, quote JO-0416'] },
  { id: 'lp4', platform: 'Inventory', jobIds: ['j0416', 'j0422'], confirmLabel: 'Add to order list',
    title: 'Add Bendix front pads to the Kapitolyo order list',
    why: '2 left, 2 quotes need them, PO-0233 arrives Wed 14:00.',
    writes: ['Inventory: order list Autopro Pasig, +4 Bendix brake pads, front set'],
    cannot: 'Place the purchase order. That needs an Inventory purchaser.' },
];

/** Starter questions, manager scope. */
export const ledaChips = [
  'Which services can finish before 12:00?', 'What is Jun working on?', 'Who still owes us money?', 'Do we have pads for a Ranger?',
];
/** What Leda refuses for a mechanic (shown in the role-limited view). */
export const ledaRefusalMechanic = 'Payments and other mechanics’ jobs are for the manager. Ask Mon, or open your own services.';

// ---------- Inquiries (customers asking, before or beside a service) ----------
export interface Inquiry { id: string; at: string; channel: 'Text' | 'Call' | 'Walk-in' | 'Messenger'; name: string; text: string; jobId?: string; repliedAt?: string }
/** Newest first. Linked inquiries belong to a service already on the floor. */
export const inquiries: Inquiry[] = [
  { id: 'iq1', at: t('11-02T10:12'), channel: 'Text', name: 'Jennifer Lim', jobId: 'j0414', text: 'Magkano po lahat ng aircon? Pwede po bang ma-approve ko mamaya?' },
  { id: 'iq2', at: t('11-02T09:58'), channel: 'Call', name: 'Rodel Pascual', text: 'Brake pads for a Ford Ranger 2019. Pa-quote po, may stock ba?' },
  { id: 'iq3', at: t('11-02T09:30'), channel: 'Messenger', name: 'Anna Dizon', text: 'Open po ba kayo ng Sunday? Oil change for a Mirage.', repliedAt: t('11-02T09:35') },
  { id: 'iq4', at: t('11-02T08:50'), channel: 'Text', name: 'Maricel Reyes', jobId: 'j0412', text: 'Ready na po ba ang Vios ko by 11? May lakad po kami.' },
];

// ---------- Parts activity (read from Inventory, this branch, today) ----------
export interface PartMovement { id: string; at: string; productId: string; qty: number; dir: 'in' | 'out'; ref: string; by: string }
/** Newest first. Every "out" is a part issued to a service above (issued lines); "in" is a transfer received from Main warehouse. */
export const partMovements: PartMovement[] = [
  { id: 'mv1', at: t('11-02T10:10'), productId: 'pr11', qty: 1, dir: 'out', ref: 'JO-0406', by: 'Paolo' },
  { id: 'mv2', at: t('11-02T09:40'), productId: 'pr12', qty: 1, dir: 'out', ref: 'JO-0405', by: 'Ricky' },
  { id: 'mv3', at: t('11-02T09:25'), productId: 'pr10', qty: 1, dir: 'out', ref: 'JO-0407', by: 'Paolo' },
  { id: 'mv4', at: t('11-02T09:15'), productId: 'pr12', qty: 1, dir: 'out', ref: 'JO-0409', by: 'Ricky' },
  { id: 'mv5', at: t('11-02T09:00'), productId: 'pr02', qty: 1, dir: 'out', ref: 'JO-0404', by: 'Arnel' },
  { id: 'mv6', at: t('11-02T08:40'), productId: 'pr11', qty: 1, dir: 'out', ref: 'JO-0418', by: 'Ricky' },
  { id: 'mv7', at: t('11-02T08:30'), productId: 'pr06', qty: 12, dir: 'in', ref: 'TRF-0187 from Main warehouse', by: 'Mon' },
  { id: 'mv8', at: t('11-02T08:30'), productId: 'pr02', qty: 10, dir: 'in', ref: 'TRF-0187 from Main warehouse', by: 'Mon' },
  { id: 'mv9', at: t('11-02T08:20'), productId: 'pr03', qty: 1, dir: 'out', ref: 'JO-0410', by: 'Arnel' },
  { id: 'mv10', at: t('11-02T08:10'), productId: 'pr07', qty: 3, dir: 'out', ref: 'JO-0408', by: 'Jun' },
];

// ---------- Other states ----------
export const quietDay = { jobs: jobs.filter((j) => ['j0415', 'j0420', 'j0409'].includes(j.id)), note: 'Nothing is stuck. 3 open services, all on time.' };
export const firstRun = { jobs: [] as Job[], mechanics: [] as Mechanic[], note: 'Add your mechanics, then take the first car in.' };
export const loadError = { block: 'Inventory stock', lastLoaded: '2026-11-02T10:02:00+08:00' };
