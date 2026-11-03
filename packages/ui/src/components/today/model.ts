import type { Flag, JobStatus, NeedsReason, NextAction, TodayEnv, TodayJob, TodayProduct } from './types';

/** Pure helpers for the Today components. The clock and the stock rules arrive in `env`; nothing here reads a module constant. */
export const minOf = (iso: string) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));
export const hm = (iso: string) => iso.slice(11, 16);
/** Today: the time. Another day: "Tue 11:00". */
export const dayWord = (iso: string, today: string) => {
  const d = iso.slice(0, 10);
  if (d === today) return hm(iso);
  const dt = new Date(`${d}T12:00:00+08:00`);
  return `${dt.toLocaleDateString('en-PH', { weekday: 'short' })} ${hm(iso)}`;
};
/** "2d" style age of a timestamp against `now`. */
export const age = (iso: string, now: string) => {
  const mins = Math.max(0, Math.round((new Date(now).getTime() - new Date(iso).getTime()) / 60000));
  if (mins >= 1440) return `${Math.floor(mins / 1440)}d`;
  if (mins >= 60) return `${Math.floor(mins / 60)}h`;
  return `${mins}m`;
};

const ACTIVE: JobStatus[] = ['TODO', 'IN_PROGRESS', 'PENDING'];
export const isOpen = (j: TodayJob) => j.status !== 'COMPLETED';
export const isPast = (iso: string | null, now: string) => !!iso && iso < now;

export function reasonOf(env: TodayEnv, j: TodayJob): NeedsReason | null {
  if (!isOpen(j)) return null;
  if (ACTIVE.includes(j.status) && isPast(j.promisedAt, env.now)) return 'OVERDUE';
  if (j.status === 'PENDING' && j.pendingReason === 'WAITING_FOR_PARTS' && env.shortParts(j).length > 0) return 'PARTS';
  if (j.status === 'FOR_APPROVAL' || (j.status === 'QUOTATION' && j.quoteParked)) return 'APPROVAL';
  if (j.status === 'FOR_PICKUP' && env.balance(j) > 0) return 'PICKUP_UNPAID';
  return null;
}

/** The product's name without the brand and the pack size. */
export const shortName = (pr: Pick<TodayProduct, 'name'>) => pr.name.split(',')[0].replace(/^(Denso|Bendix|NGK|KYB|Motolite Gold|Prestone|Shell Helix)\s/, '').replace(/ NS60| 10W-40.*/, '');

/** The word a stuck chip carries where it sits. */
export function flagOf(env: TodayEnv, j: TodayJob): Flag | null {
  const r = reasonOf(env, j);
  if (!r) return null;
  if (r === 'OVERDUE') return { tone: 'bad', word: `late ${age(j.promisedAt!, env.now)}` };
  if (r === 'PARTS' && j.pendingNote?.startsWith('Transfer requested')) return { tone: 'warn', word: 'transfer asked' };
  if (r === 'PARTS') { const p = env.shortParts(j)[0]; return { tone: 'bad', word: `${shortName(p)} ${env.stockState(p) === 'on_order' ? 'on order' : 'out'}` }; }
  if (r === 'APPROVAL') return { tone: 'warn', word: `quote ${age(j.quoteSentAt ?? j.statusSince, env.now)}` };
  return { tone: 'warn', word: `${env.peso(env.balance(j))} unpaid` };
}

/** The service's full title: its service lines joined. Surfaces clamp it and carry the full text in a title attribute. */
export const serviceTitle = (j: Pick<TodayJob, 'services'>) => j.services.map((s) => s.name).join(' + ');

export function nextAction(env: TodayEnv, j: TodayJob): NextAction | null {
  const n = j.number;
  switch (j.status) {
    case 'QUOTATION': return { label: 'Send quote', to: { status: 'FOR_APPROVAL' }, toast: `Quote for ${n} sent.` };
    case 'FOR_APPROVAL': return { label: 'Mark approved', to: { status: 'TODO' }, toast: `${n} approved and queued.` };
    case 'TODO': return { label: 'Start work', to: { status: 'IN_PROGRESS' }, toast: `${n} started.` };
    case 'IN_PROGRESS': return { label: 'Ready for pick-up', to: { status: 'FOR_PICKUP' }, toast: `${n} is ready for pick-up.` };
    case 'PENDING': return env.shortParts(j).length ? null : { label: 'Resume', to: { status: 'IN_PROGRESS' }, toast: `${n} resumed.` };
    case 'FOR_PICKUP': return env.balance(j) > 0 ? { label: 'Collect payment', to: {}, toast: '', pay: true } : { label: 'Release car', to: { status: 'COMPLETED' }, toast: `${n} released to the customer.` };
    default: return null;
  }
}

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

/** The latest promised minute today among a lane's active jobs, for "free from". Null when nothing is promised today. */
export function freeFromMin(jobs: Pick<TodayJob, 'status' | 'promisedAt'>[], today: string): number | null {
  const times = jobs.filter((j) => j.promisedAt?.startsWith(today) && ACTIVE.includes(j.status)).map((j) => minOf(j.promisedAt!));
  return times.length ? Math.max(...times) : null;
}
