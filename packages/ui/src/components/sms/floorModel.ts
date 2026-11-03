/** v2 Shop floor: data shaping only. Every figure comes from ../data; overrides hold the manager's moves this session. */
import {
  NOW, NOW_MIN, TODAY, jobs as allJobs, mechanics, customerOf, vehicleOf, productOf, jobBalance, jobTotal, jobPaid,
  onHandElsewhere, onHandHere, shortLines, stockState, peso, type Job, type JobStatus, type NeedsReason, type Product,
} from './data';

export type Overrides = Record<string, Partial<Omit<Job, 'id'>> & { paid?: boolean; approved?: boolean }>;

export const LANE_IDS = ['counter', 'm-jun', 'm-arnel', 'm-paolo', 'm-ricky', 'unassigned'] as const;
export type LaneId = (typeof LANE_IDS)[number];

export const minOf = (iso: string) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));
export const hm = (iso: string) => iso.slice(11, 16);
export const shortDate = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00+08:00`);
  return iso.startsWith('2026-11-02') ? `Today ${hm(iso)}` : d.toLocaleDateString('en-PH', { day: 'numeric', month: 'short' });
};
export const dayWord = (iso: string) => {
  const d = iso.slice(0, 10);
  if (d === TODAY) return hm(iso);
  const dt = new Date(`${d}T12:00:00+08:00`);
  return `${dt.toLocaleDateString('en-PH', { weekday: 'short' })} ${hm(iso)}`;
};
/** "2d" style age of a timestamp against Now. */
export const age = (iso: string) => {
  const mins = Math.max(0, Math.round((new Date(NOW).getTime() - new Date(iso).getTime()) / 60000));
  if (mins >= 1440) return `${Math.floor(mins / 1440)}d`;
  if (mins >= 60) return `${Math.floor(mins / 60)}h`;
  return `${mins}m`;
};

export const applyOverrides = (ov: Overrides, pool: Job[] = allJobs): Job[] => pool.map((j) => (ov[j.id] ? { ...j, ...ov[j.id] } as Job : j));

const ACTIVE: JobStatus[] = ['TODO', 'IN_PROGRESS', 'PENDING'];
export const isOpen = (j: Job) => j.status !== 'COMPLETED';
export const isPast = (iso: string | null) => !!iso && iso < NOW;

export function reasonOf(j: Job): NeedsReason | null {
  if (!isOpen(j)) return null;
  if (ACTIVE.includes(j.status) && isPast(j.promisedAt)) return 'OVERDUE';
  if (j.status === 'PENDING' && j.pendingReason === 'WAITING_FOR_PARTS' && shortLines(j).length > 0) return 'PARTS';
  if (j.status === 'FOR_APPROVAL' || (j.status === 'QUOTATION' && j.quoteParked)) return 'APPROVAL';
  if (j.status === 'FOR_PICKUP' && jobBalance(j) > 0) return 'PICKUP_UNPAID';
  return null;
}

export function laneOf(j: Job): LaneId {
  if (j.status === 'FOR_APPROVAL' || j.status === 'FOR_PICKUP') return 'counter';
  if (!j.assigneeId) return 'unassigned';
  return j.assigneeId as LaneId;
}

export interface Flag { tone: 'bad' | 'warn'; word: string }
/** The word a stuck chip carries where it sits. */
export function flagOf(j: Job): Flag | null {
  const r = reasonOf(j);
  if (!r) return null;
  if (r === 'OVERDUE') return { tone: 'bad', word: `late ${age(j.promisedAt!)}` };
  if (r === 'PARTS' && j.pendingNote?.startsWith('Transfer requested')) return { tone: 'warn', word: 'transfer asked' };
  if (r === 'PARTS') { const l = shortLines(j)[0]; return { tone: 'bad', word: `${shortName(productOf(l.productId))} ${stockState(productOf(l.productId)) === 'on_order' ? 'on order' : 'out'}` }; }
  if (r === 'APPROVAL') return { tone: 'warn', word: `quote ${age(j.quoteSentAt ?? j.statusSince)}` };
  return { tone: 'warn', word: `${peso(jobBalance(j))} unpaid` };
}

export const shortName = (pr: Product) => pr.name.split(',')[0].replace(/^(Denso|Bendix|NGK|KYB|Motolite Gold|Prestone|Shell Helix)\s/, '').replace(/ NS60| 10W-40.*/, '');

export interface LaneModel { id: LaneId; name: string; sub: string; initials?: string; jobs: Job[]; free?: string; manager?: boolean }

export function lanesFor(js: Job[]): LaneModel[] {
  const open = js.filter(isOpen);
  const by = (id: LaneId) => open.filter((j) => laneOf(j) === id);
  const mech = mechanics.map((m) => {
    const mine = by(m.id as LaneId);
    const active = mine.filter((j) => ACTIVE.includes(j.status));
    const lastDue = Math.max(NOW_MIN, ...mine.map((j) => (j.promisedAt && j.promisedAt.startsWith(TODAY) ? minOf(j.promisedAt) : 0)));
    return { id: m.id as LaneId, name: m.short, sub: `${m.bay}${active.length ? '' : ' · free'}`, initials: m.initials, jobs: mine, activeCount: active.length, lastDue };
  }).sort((a, b) => b.activeCount - a.activeCount);
  const lanes: LaneModel[] = [
    { id: 'counter', name: 'Counter', sub: 'Mon', jobs: by('counter'), manager: true },
    ...mech.map(({ activeCount, lastDue, ...l }) => ({ ...l, sub: `${l.sub.split(' · ')[0]} · ${activeCount} active` })),
    { id: 'unassigned', name: 'Not yet assigned', sub: 'quotes', jobs: by('unassigned') },
  ];
  return lanes;
}

/** The latest promised time today in a lane, for "free from". */
export function freeFrom(lane: LaneModel): string | null {
  const times = lane.jobs.filter((j) => j.promisedAt?.startsWith(TODAY) && ACTIVE.includes(j.status)).map((j) => minOf(j.promisedAt!));
  if (!times.length) return null;
  const t = Math.max(...times);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

/** The service's full title: its service lines joined. Surfaces clamp it and carry the full text in a title attribute. */
export const serviceTitle = (j: Job) => j.services.map((s) => s.name).join(' + ');

export interface JobView { job: Job; plate: string; vehicle: string; customer: string; phone: string; mechanic: string | null }
export const viewOf = (j: Job): JobView => {
  const v = vehicleOf(j); const c = customerOf(j);
  return { job: j, plate: v.plate, vehicle: `${v.make} ${v.model} ${v.year}`, customer: c.name, phone: c.phone, mechanic: mechanics.find((m) => m.id === j.assigneeId)?.short ?? null };
};

/** `pay`: the action opens the Payment page instead of changing the status. */
export interface NextAction { label: string; to: Partial<Job>; toast: string; pay?: boolean }
export function nextAction(j: Job): NextAction | null {
  const n = j.number;
  switch (j.status) {
    case 'QUOTATION': return { label: 'Send quote', to: { status: 'FOR_APPROVAL' }, toast: `Quote for ${n} sent.` };
    case 'FOR_APPROVAL': return { label: 'Mark approved', to: { status: 'TODO' }, toast: `${n} approved and queued.` };
    case 'TODO': return { label: 'Start work', to: { status: 'IN_PROGRESS' }, toast: `${n} started.` };
    case 'IN_PROGRESS': return { label: 'Ready for pick-up', to: { status: 'FOR_PICKUP' }, toast: `${n} is ready for pick-up.` };
    case 'PENDING': return shortLines(j).length ? null : { label: 'Resume', to: { status: 'IN_PROGRESS' }, toast: `${n} resumed.` };
    case 'FOR_PICKUP': return jobBalance(j) > 0 ? { label: 'Collect payment', to: {}, toast: '', pay: true } : { label: 'Release car', to: { status: 'COMPLETED' }, toast: `${n} released to the customer.` };
    default: return null;
  }
}

export const money = { total: jobTotal, paid: jobPaid, balance: jobBalance };
export { onHandElsewhere, onHandHere, stockState };

/** Short status word for chips and rows, with the tone of its dot. Always shown as text; the dot is a second cue. */
export const STATUS_SHORT: Record<JobStatus, { label: string; dot: string }> = {
  QUOTATION: { label: 'Quote draft', dot: 'bg-faint' },
  FOR_APPROVAL: { label: 'Awaiting OK', dot: 'bg-warn-dot' },
  TODO: { label: 'To-do', dot: 'bg-faint' },
  IN_PROGRESS: { label: 'Working', dot: 'bg-accent' },
  PENDING: { label: 'On hold', dot: 'bg-warn-dot' },
  FOR_PICKUP: { label: 'Ready', dot: 'bg-ok-dot' },
  COMPLETED: { label: 'Done', dot: 'bg-ok-dot' },
};
