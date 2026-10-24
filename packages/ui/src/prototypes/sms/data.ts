/**
 * PROTOTYPE data + rules for the sms platform (RDY-18).
 * Behaviour captured from the Montauto QA app; mock values only, no real records.
 */
export type JobStatus = 'quotation' | 'for_approval' | 'todo' | 'in_progress' | 'pending' | 'for_pickup' | 'completed';

export const JOB_STATUSES: { value: JobStatus; label: string; tone: 'neutral' | 'info' | 'primary' | 'warning' | 'success' }[] = [
  { value: 'quotation', label: 'Quotation', tone: 'neutral' },
  { value: 'for_approval', label: 'For approval', tone: 'warning' },
  { value: 'todo', label: 'To-do', tone: 'info' },
  { value: 'in_progress', label: 'In progress', tone: 'primary' },
  { value: 'pending', label: 'Pending', tone: 'warning' },
  { value: 'for_pickup', label: 'For pick-up', tone: 'info' },
  { value: 'completed', label: 'Completed', tone: 'success' },
];
export const statusMeta = (s: JobStatus) => JOB_STATUSES.find((x) => x.value === s)!;

/** QA UI lets staff move a job to any status except the current one (server rules unverified). */
export const nextStatuses = (s: JobStatus): JobStatus[] =>
  JOB_STATUSES.map((x) => x.value).filter((v) => v !== s && v !== 'quotation' && v !== 'for_approval');

/** Completed jobs lock add/remove of services and parts. */
export const isLocked = (s: JobStatus) => s === 'completed';

export interface Job {
  id: number;
  customer: string;
  phone: string;
  plate: string;
  brand: string;
  model: string;
  assignee: string | null;
  status: JobStatus;
  since: string;
  due: string;
  branch: string;
  /** Unpaid amount in pesos; drives the suggested next action and the Unpaid stat. */
  balance: number;
}

export const JOBS: Job[] = [
  { id: 25, customer: 'Ana Dizon', phone: '+63 92 7811 2040', plate: 'NBC 2210', brand: 'Mitsubishi', model: 'Mirage', assignee: null, status: 'quotation', since: 'Oct 16, 2026', due: 'Oct 23, 2026', branch: 'davao', balance: 4500 },
  { id: 24, customer: 'Ramon Aquino', phone: '+63 93 5502 7788', plate: 'DAB 9087', brand: 'Toyota', model: 'Hilux', assignee: null, status: 'for_approval', since: 'Oct 15, 2026', due: 'Oct 21, 2026', branch: 'davao', balance: 7800 },
  { id: 23, customer: 'Grace Tan', phone: '+63 91 7525 4425', plate: 'KJK 4441', brand: 'Mitsubishi', model: 'Montero Sport', assignee: 'Joel Mendoza', status: 'in_progress', since: 'Oct 13, 2026', due: 'Oct 18, 2026', branch: 'davao', balance: 6200 },
  { id: 22, customer: 'Clarke Sorento', phone: '+63 91 5860 6971', plate: 'LAN 3852', brand: 'Honda', model: 'Civic Type-R', assignee: 'Maricel Santos', status: 'completed', since: 'Oct 7, 2026', due: 'Oct 12, 2026', branch: 'davao', balance: 1200 },
  { id: 21, customer: 'Nicole Villanueva', phone: '+63 91 5860 6975', plate: 'LAQ 8735', brand: 'Toyota', model: 'Vios', assignee: 'Rey Bautista', status: 'todo', since: 'Oct 14, 2026', due: 'Oct 20, 2026', branch: 'davao', balance: 3000 },
  { id: 19, customer: 'Miguel Sorento', phone: '+63 91 5860 6972', plate: 'LDP 5432', brand: 'Honda', model: 'Civic', assignee: 'Rey Bautista', status: 'todo', since: 'Oct 10, 2026', due: 'Oct 17, 2026', branch: 'davao', balance: 1800 },
  { id: 17, customer: 'Fred Go', phone: '+63 95 2998 8888', plate: 'GHH 5433', brand: 'Honda', model: 'Civic', assignee: 'Rey Bautista', status: 'pending', since: 'Apr 9, 2026', due: 'May 13, 2026', branch: 'davao', balance: 2500 },
  { id: 15, customer: 'Jude Ramos', phone: '+63 95 4445 1445', plate: 'GGS 5444', brand: 'KIA', model: 'Picanto', assignee: null, status: 'for_pickup', since: 'Oct 9, 2026', due: 'Oct 16, 2026', branch: 'davao', balance: 3500 },
  { id: 13, customer: 'James Castro', phone: '+63 95 1225 2522', plate: 'LLK 5515', brand: 'Honda', model: 'Civic', assignee: 'Rey Bautista', status: 'in_progress', since: 'Oct 12, 2026', due: 'Oct 19, 2026', branch: 'davao', balance: 3000 },
  { id: 31, customer: 'Liza Fernandez', phone: '+63 917 302 5541', plate: 'CAX 7712', brand: 'Suzuki', model: 'Ertiga', assignee: 'Dennis Alcala', status: 'in_progress', since: 'Oct 14, 2026', due: 'Oct 18, 2026', branch: 'cebu', balance: 4000 },
  { id: 30, customer: 'Paolo Ybanez', phone: '+63 927 440 1189', plate: 'GBT 3086', brand: 'Toyota', model: 'Innova', assignee: null, status: 'quotation', since: 'Oct 16, 2026', due: 'Oct 22, 2026', branch: 'cebu', balance: 2800 },
  { id: 29, customer: 'Mylene Cabahug', phone: '+63 998 215 7364', plate: 'NDF 1590', brand: 'Nissan', model: 'Almera', assignee: 'Dennis Alcala', status: 'for_pickup', since: 'Oct 9, 2026', due: 'Oct 17, 2026', branch: 'cebu', balance: 1500 },
  { id: 42, customer: 'Jerome Villaruel', phone: '+63 906 118 9023', plate: 'UVK 6628', brand: 'Ford', model: 'Ranger', assignee: 'Carlo Reyes', status: 'todo', since: 'Oct 15, 2026', due: 'Oct 19, 2026', branch: 'qc', balance: 5200 },
  { id: 41, customer: 'Cherry Manalo', phone: '+63 945 772 3310', plate: 'NAB 4471', brand: 'Honda', model: 'City', assignee: 'Carlo Reyes', status: 'pending', since: 'Oct 8, 2026', due: 'Oct 15, 2026', branch: 'qc', balance: 2100 },
  { id: 40, customer: 'Benjie Salonga', phone: '+63 918 604 2275', plate: 'TXR 2058', brand: 'Toyota', model: 'Fortuner', assignee: null, status: 'for_approval', since: 'Oct 16, 2026', due: 'Oct 24, 2026', branch: 'qc', balance: 9400 },
  { id: 39, customer: 'Teresita Lim', phone: '+63 929 331 8806', plate: 'ZPA 9034', brand: 'Mitsubishi', model: 'Xpander', assignee: 'Maricel Santos', status: 'completed', since: 'Oct 5, 2026', due: 'Oct 11, 2026', branch: 'qc', balance: 0 },
];

export interface JobService { id: number; name: string; description: string; updated: string; assignees: string[]; price: number; status: 'todo' | 'in_progress' | 'completed'; comments: number }
export interface JobPart { id: number; name: string; sku: string; qty: number; unit: string; unitPrice: number }

export const JOB_SERVICES: JobService[] = [
  { id: 9, name: 'Tire Services', description: 'Rotation, balancing, pressure checks.', updated: 'Apr 7, 2026', assignees: ['Rey Bautista'], price: 0, status: 'completed', comments: 0 },
  { id: 10, name: 'Battery Services', description: 'Test, clean terminals, replace battery.', updated: 'Apr 7, 2026', assignees: ['Rey Bautista'], price: 1000, status: 'completed', comments: 1 },
  { id: 13, name: 'AC Diagnostics', description: 'Pressure, sensors, leak test.', updated: 'Apr 7, 2026', assignees: [], price: 2500, status: 'in_progress', comments: 0 },
];
export const JOB_PARTS: JobPart[] = [
  { id: 1, name: 'Aircon filter', sku: 'AR1256', qty: 2, unit: 'pc', unitPrice: 750 },
  { id: 2, name: 'Oil filter', sku: 'OEM 156', qty: 2, unit: 'box', unitPrice: 1500 },
];

export interface ShopService { id: number; name: string; description: string; scope: string; price: number; added: string; active: boolean }
export const SERVICES: ShopService[] = [
  { id: 9, name: 'Brake Pad Replacement', description: 'Inspect braking system and replace worn-out pads.', scope: 'Mechanical', price: 3000, added: 'Oct 06, 2026', active: false },
  { id: 6, name: 'Test service', description: 'Service testing', scope: 'Essential Routine Maintenance', price: 5000, added: 'Apr 08, 2026', active: true },
  { id: 5, name: 'AC Diagnostics/Troubleshooting', description: 'Testing for low pressure, faulty sensors, or leaks.', scope: 'Air conditioning', price: 2500, added: 'Mar 30, 2026', active: true },
  { id: 4, name: 'Alternator Services', description: 'Troubleshoot, repair or replace alternators.', scope: 'Electrical', price: 500, added: 'Mar 30, 2026', active: true },
  { id: 1, name: 'Oil & Filter Change', description: 'Replaces dirty oil to keep the engine lubricated.', scope: 'Essential Routine Maintenance', price: 1000, added: 'Mar 30, 2026', active: true },
];

export interface ShopPart { id: number; name: string; description: string; price: number; cost: number; category: string; brand: string; stock: number; minStock: number; unit: string; active: boolean }
export const PARTS: ShopPart[] = [
  { id: 6, name: 'Front brake pad set, Toyota Vios', description: 'Reduced noise, long service life.', price: 1500, cost: 1100, category: 'Brake System', brand: 'Bendix', stock: 25, minStock: 5, unit: 'Set (set)', active: false },
  { id: 5, name: 'Car wash shampoo 1.42L', description: 'pH neutral ceramic wash and wax.', price: 350, cost: 180, category: 'Cleaning', brand: 'Hybrid Solutions', stock: 3, minStock: 10, unit: 'Liter (L)', active: true },
  { id: 3, name: 'Aircon filter', description: 'Cabin aircon filter.', price: 750, cost: 700, category: 'Aircon Filter', brand: 'Ac Filter', stock: 10, minStock: 5, unit: 'Pack (pack)', active: true },
  { id: 1, name: 'Oil filter', description: 'Traps contaminants, lets oil flow freely.', price: 1500, cost: 1300, category: 'Oil Filter', brand: 'Vic', stock: 20, minStock: 5, unit: 'Box (box)', active: true },
];

export interface Customer { id: number; name: string; phone: string; email: string; address: string; vehicles: Vehicle[] }
export interface Vehicle { plate: string; brand: string; model: string; variant: string; year: string; mileage: string; vin: string }
export const CUSTOMERS: Customer[] = [
  { id: 16, name: 'Clarke Sorento', phone: '+63 91 5860 6971', email: 'clarke@example.com', address: '', vehicles: [{ plate: 'LAN 3852', brand: 'Honda', model: 'Civic Type-R', variant: 'Type-R', year: '2026', mileage: '35,000', vin: '' }] },
  { id: 14, name: 'Miguel Sorento', phone: '+63 91 5860 6972', email: 'miguel@example.com', address: '123 Rizal St., Davao City', vehicles: [
    { plate: 'LDP 5432', brand: 'Honda', model: 'Civic', variant: '1.8 E', year: '2018', mileage: '82,000', vin: '' },
    { plate: 'LDP 4321', brand: 'Honda', model: 'City', variant: '', year: '2020', mileage: '40,500', vin: 'JTDBT923771000001' },
    { plate: 'GGH 1111', brand: 'Toyota', model: 'Rush', variant: '', year: '2021', mileage: '22,000', vin: '' },
  ] },
  { id: 8, name: 'Grace Tan', phone: '+63 91 7525 4425', email: 'grace@example.com', address: '', vehicles: [{ plate: 'KJK 4441', brand: 'Mitsubishi', model: 'Montero Sport', variant: '', year: '2019', mileage: '64,200', vin: '' }] },
  { id: 3, name: 'New Walk-in', phone: '+63 91 0000 0000', email: 'walkin@example.com', address: '', vehicles: [] },
];

export const PAYMENT_MODES = ['Cash', 'GCash', 'Bank Transfer', 'Debit/Credit Card'] as const;

export const peso = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(n);

export const jobTotals = (services: JobService[], parts: JobPart[]) => {
  const s = services.reduce((a, x) => a + x.price, 0);
  const p = parts.reduce((a, x) => a + x.qty * x.unitPrice, 0);
  return { services: s, parts: p, total: s + p };
};

/** PH mobile: 10 digits after +63, no leading zero. */
export const validPhone = (v: string) => /^9\d{9}$/.test(v.replace(/[\s-]/g, ''));
export const validEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

/** Branch model (RDY-18 open decision). Mock branches of one company. */
export const COMPANY = { name: 'Montauto Auto Care', initials: 'MA' };
export interface Branch { id: string; name: string; short: string; address: string; openJobs: number }
export const BRANCHES: Branch[] = [
  { id: 'davao', name: 'Davao City', short: 'DC', address: 'J.P. Laurel Ave., Davao City', openJobs: 9 },
  { id: 'cebu', name: 'Cebu - Mandaue', short: 'CM', address: 'A.C. Cortes Ave., Mandaue City', openJobs: 6 },
  { id: 'qc', name: 'Quezon City', short: 'QC', address: 'Timog Ave., Quezon City', openJobs: 12 },
];

/** Fixed "today" so overdue logic is stable in stories. */
export const TODAY = new Date('2026-10-17T00:00:00');
export const isOverdue = (j: Pick<Job, 'due' | 'status'>) => j.status !== 'completed' && new Date(j.due) < TODAY;
export const isDueToday = (j: Pick<Job, 'due' | 'status'>) => j.status !== 'completed' && new Date(j.due).getTime() === TODAY.getTime();

/** The one suggested next step for a job, from its status and balance. */
export interface NextAction { key: 'send' | 'approve' | 'start' | 'ready' | 'complete' | 'pay'; label: string; to?: JobStatus }
export const nextAction = (status: JobStatus, balance: number): NextAction | null => {
  switch (status) {
    case 'quotation': return { key: 'send', label: 'Send quotation', to: 'for_approval' };
    case 'for_approval': return { key: 'approve', label: 'Mark approved', to: 'todo' };
    case 'todo':
    case 'pending': return { key: 'start', label: 'Start work', to: 'in_progress' };
    case 'in_progress': return { key: 'ready', label: 'Mark ready', to: 'for_pickup' };
    case 'for_pickup': return balance > 0 ? { key: 'pay', label: 'Record payment' } : { key: 'complete', label: 'Complete job', to: 'completed' };
    case 'completed': return balance > 0 ? { key: 'pay', label: 'Record payment' } : null;
  }
};

/** Why a job is on the Today list, most urgent first. Null when it needs nothing today. */
export const attentionReason = (j: Job): { label: string; tone: 'error' | 'warning' | 'info' } | null => {
  if (isOverdue(j)) return { label: 'Overdue', tone: 'error' };
  if (isDueToday(j)) return { label: 'Due today', tone: 'warning' };
  if (j.status === 'for_approval') return { label: 'Waiting on customer', tone: 'info' };
  if (j.balance > 0 && (j.status === 'for_pickup' || j.status === 'completed')) return { label: `Unpaid ${peso(j.balance)}`, tone: 'warning' };
  return null;
};

/** Inventory products read from the linked inventory platform (inventory.catalog). Read-only in the SMS. */
export interface InventoryItem { id: number; sku: string; name: string; price: number; onHand: number; minQty: number; unit: string }
export const INVENTORY: InventoryItem[] = [
  { id: 1, sku: 'OEM-156', name: 'Oil filter', price: 1500, onHand: 20, minQty: 5, unit: 'box' },
  { id: 3, sku: 'AR-1256', name: 'Aircon filter', price: 750, onHand: 10, minQty: 5, unit: 'pc' },
  { id: 5, sku: 'CW-142', name: 'Car wash shampoo 1.42L', price: 350, onHand: 3, minQty: 10, unit: 'pc' },
  { id: 6, sku: 'BP-VIOS-F', name: 'Front brake pad set, Toyota Vios', price: 1500, onHand: 25, minQty: 5, unit: 'set' },
  { id: 8, sku: 'EO-5W30-4L', name: 'Engine oil 5W-30, 4L', price: 2150, onHand: 0, minQty: 6, unit: 'pc' },
  { id: 9, sku: 'SP-NGK-IR', name: 'Spark plug, iridium', price: 480, onHand: 32, minQty: 12, unit: 'pc' },
];
export const stockTone = (i: InventoryItem) => (i.onHand === 0 ? 'error' : i.onHand <= i.minQty ? 'warning' : null);
