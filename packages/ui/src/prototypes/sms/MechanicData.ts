/**
 * PROTOTYPE data for the mechanic mobile workspace (RDY-63). Mock values only.
 * The signed-in mechanic is Joel Mendoza at Montauto Auto Care, Davao City. "Today" is Oct 17, 2026 (see data.ts).
 */
import { isDueToday, isOverdue, type JobStatus } from './data';

export const ME = { name: 'Joel Mendoza', branch: 'Davao City', company: 'Montauto Auto Care' };

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export interface MechanicTask { id: number; name: string; status: TaskStatus }
export interface UsedItem { id: number; name: string; sku: string; qty: number; unit: string; /** Saved on the phone only, not sent yet. */ pending?: boolean }
export interface JobComment { who: string; text: string; when: string; pending?: boolean }
export interface JobFile { name: string; size: string; kind: 'photo' | 'pdf' }

export interface MechanicJob {
  id: number;
  customer: string;
  phone: string;
  plate: string;
  vehicle: string;
  status: JobStatus;
  due: string;
  /** What the customer reported. */
  concern: string;
  /** Why the job is on hold, when status is pending. */
  holdReason?: string;
  tasks: MechanicTask[];
  items: UsedItem[];
  comments: JobComment[];
  files: JobFile[];
}

export const MY_JOBS: MechanicJob[] = [
  {
    id: 13, customer: 'James Castro', phone: '+63 95 1225 2522', plate: 'LLK 5515', vehicle: 'Honda Civic', status: 'in_progress', due: 'Oct 17, 2026',
    concern: 'Battery drains overnight. Dashboard battery light on.',
    tasks: [{ id: 1, name: 'Battery Services', status: 'done' }, { id: 2, name: 'Alternator Services', status: 'in_progress' }],
    items: [{ id: 1, name: 'Battery 55Ah', sku: 'BAT-55', qty: 1, unit: 'pc' }, { id: 2, name: 'Terminal cleaner spray', sku: 'TC-200', qty: 1, unit: 'pc' }],
    comments: [{ who: 'Joel Mendoza', text: 'Terminals were corroded. Cleaned them and replaced the battery.', when: 'Today, 10:12 AM' }, { who: 'Maricel Santos', text: 'Customer will wait at the lounge until 4 PM.', when: 'Today, 9:30 AM' }],
    files: [{ name: 'battery-old.jpg', size: '0.9 MB', kind: 'photo' }, { name: 'alternator-test.jpg', size: '0.4 MB', kind: 'photo' }],
  },
  {
    id: 19, customer: 'Miguel Sorento', phone: '+63 91 5860 6972', plate: 'LDP 5432', vehicle: 'Honda Civic', status: 'todo', due: 'Oct 16, 2026',
    concern: 'Squeaking noise from the front wheels when braking.',
    tasks: [{ id: 1, name: 'Brake Pad Replacement', status: 'todo' }, { id: 2, name: 'Tire Services', status: 'todo' }],
    items: [], comments: [], files: [{ name: 'intake-photo.jpg', size: '1.1 MB', kind: 'photo' }],
  },
  {
    id: 21, customer: 'Nicole Villanueva', phone: '+63 91 5860 6975', plate: 'LAQ 8735', vehicle: 'Toyota Vios', status: 'todo', due: 'Oct 17, 2026',
    concern: 'Regular change oil and filter. Aircon smells musty.',
    tasks: [{ id: 1, name: 'Oil & Filter Change', status: 'todo' }, { id: 2, name: 'AC Diagnostics', status: 'todo' }],
    items: [], comments: [], files: [],
  },
  {
    id: 23, customer: 'Grace Tan', phone: '+63 91 7525 4425', plate: 'KJK 4441', vehicle: 'Mitsubishi Montero Sport', status: 'in_progress', due: 'Oct 18, 2026',
    concern: 'Engine check light is on. Rough idle.',
    tasks: [{ id: 1, name: 'Engine Diagnostics', status: 'in_progress' }, { id: 2, name: 'Spark plug replacement', status: 'todo' }],
    items: [{ id: 1, name: 'Spark plug, iridium', sku: 'SP-NGK-IR', qty: 4, unit: 'pc' }],
    comments: [{ who: 'Joel Mendoza', text: 'Code P0301 on cylinder 1. Replacing plugs and coil check next.', when: 'Yesterday, 4:48 PM' }],
    files: [{ name: 'scan-report.pdf', size: '0.3 MB', kind: 'pdf' }],
  },
  {
    id: 17, customer: 'Fred Go', phone: '+63 95 2998 8888', plate: 'GHH 5433', vehicle: 'Honda Civic', status: 'pending', due: 'Oct 19, 2026',
    concern: 'Air conditioning not cold. Compressor noise.',
    holdReason: 'Waiting for parts: compressor clutch ordered, ETA Oct 19.',
    tasks: [{ id: 1, name: 'AC Diagnostics', status: 'done' }, { id: 2, name: 'Compressor clutch replacement', status: 'todo' }],
    items: [], comments: [{ who: 'Joel Mendoza', text: 'Clutch is worn. Ordered from the supplier.', when: 'Oct 15, 2:20 PM' }], files: [],
  },
  {
    id: 24, customer: 'Ramon Aquino', phone: '+63 93 5502 7788', plate: 'DAB 9087', vehicle: 'Toyota Hilux', status: 'for_approval', due: 'Oct 21, 2026',
    concern: 'Rear shock absorbers leaking. Bouncy ride when loaded.',
    holdReason: 'Waiting for the customer to approve the quotation.',
    tasks: [{ id: 1, name: 'Shock absorber replacement', status: 'todo' }], items: [], comments: [], files: [],
  },
  {
    id: 15, customer: 'Jude Ramos', phone: '+63 95 4445 1445', plate: 'GGS 5444', vehicle: 'KIA Picanto', status: 'for_pickup', due: 'Oct 16, 2026',
    concern: 'Pre-trip check and oil change.',
    tasks: [{ id: 1, name: 'Oil & Filter Change', status: 'done' }, { id: 2, name: 'Tire Services', status: 'done' }],
    items: [{ id: 1, name: 'Oil filter', sku: 'OEM-156', qty: 1, unit: 'box' }, { id: 2, name: 'Engine oil 5W-30, 4L', sku: 'EO-5W30-4L', qty: 1, unit: 'pc' }],
    comments: [], files: [],
  },
  {
    id: 22, customer: 'Clarke Sorento', phone: '+63 91 5860 6971', plate: 'LAN 3852', vehicle: 'Honda Civic Type-R', status: 'completed', due: 'Oct 12, 2026',
    concern: 'Battery and tire services.',
    tasks: [{ id: 1, name: 'Battery Services', status: 'done' }, { id: 2, name: 'Tire Services', status: 'done' }],
    items: [{ id: 1, name: 'Battery 55Ah', sku: 'BAT-55', qty: 1, unit: 'pc' }], comments: [], files: [],
  },
];

/** The jobs the mechanic can start now, most urgent first. */
export const urgency = (j: MechanicJob) => (isOverdue(j) ? 0 : isDueToday(j) ? 1 : j.status === 'in_progress' ? 2 : 3);

export type JobGroup = 'now' | 'waiting' | 'pickup' | 'done';
export const GROUPS: { key: JobGroup; label: string; hint: string }[] = [
  { key: 'now', label: 'Needs you now', hint: 'To-do and in progress' },
  { key: 'waiting', label: 'Waiting', hint: 'Pending or with the customer' },
  { key: 'pickup', label: 'For pick-up', hint: 'Your part is done' },
  { key: 'done', label: 'Completed', hint: 'Locked' },
];
export const groupOf = (j: MechanicJob): JobGroup =>
  j.status === 'todo' || j.status === 'in_progress' ? 'now' : j.status === 'pending' || j.status === 'for_approval' ? 'waiting' : j.status === 'for_pickup' ? 'pickup' : 'done';

/** Friendly due text. */
export const dueLabel = (j: MechanicJob): { text: string; tone: 'error' | 'warning' | 'neutral' } =>
  isOverdue(j) ? { text: 'Overdue', tone: 'error' } : isDueToday(j) ? { text: 'Due today', tone: 'warning' } : { text: `Due ${j.due.replace(', 2026', '')}`, tone: 'neutral' };

/** What a mechanic can move a job to. Completing a job (it locks) is the cashier's step, so it is not offered. */
export const MECHANIC_MOVES: { value: JobStatus; label: string; hint: string }[] = [
  { value: 'todo', label: 'To-do', hint: 'Not started yet' },
  { value: 'in_progress', label: 'In progress', hint: 'You are working on it' },
  { value: 'pending', label: 'Pending', hint: 'Waiting for parts or the customer' },
  { value: 'for_pickup', label: 'For pick-up', hint: 'Your work is done' },
];
export const HOLD_REASONS = ['Waiting for parts', 'Waiting for the customer', 'Needs another mechanic', 'Other'];

/** The mechanic's one next step per status. For pick-up has none: the cashier takes over. */
export interface MechanicNext { label: string; to: JobStatus }
export const mechanicNext = (s: JobStatus): MechanicNext | null =>
  s === 'todo' ? { label: 'Start work', to: 'in_progress' }
  : s === 'in_progress' ? { label: 'Mark ready', to: 'for_pickup' }
  : s === 'pending' ? { label: 'Resume work', to: 'in_progress' }
  : null;

export interface MCustomer { id: number; name: string; phone: string; vehicles: { plate: string; vehicle: string }[] }
export const MY_CUSTOMERS: MCustomer[] = [
  { id: 14, name: 'Miguel Sorento', phone: '+63 91 5860 6972', vehicles: [{ plate: 'LDP 5432', vehicle: 'Honda Civic' }, { plate: 'LDP 4321', vehicle: 'Honda City' }] },
  { id: 8, name: 'Grace Tan', phone: '+63 91 7525 4425', vehicles: [{ plate: 'KJK 4441', vehicle: 'Mitsubishi Montero Sport' }] },
  { id: 20, name: 'James Castro', phone: '+63 95 1225 2522', vehicles: [{ plate: 'LLK 5515', vehicle: 'Honda Civic' }] },
  { id: 11, name: 'Nicole Villanueva', phone: '+63 91 5860 6975', vehicles: [{ plate: 'LAQ 8735', vehicle: 'Toyota Vios' }] },
  { id: 12, name: 'Fred Go', phone: '+63 95 2998 8888', vehicles: [{ plate: 'GHH 5433', vehicle: 'Honda Civic' }] },
];
