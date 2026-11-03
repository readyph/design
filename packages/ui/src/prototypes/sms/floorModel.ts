/** v2 Shop floor: data shaping only. Every figure comes from ../data; overrides hold the manager's moves this session. */
import {
  NOW, NOW_MIN, TODAY, jobs as allJobs, mechanics, customerOf, vehicleOf, productOf, jobBalance, jobTotal, jobPaid,
  onHandElsewhere, onHandHere, shortLines, stockState, peso, type Job, type JobStatus, type NeedsReason,
} from './data';
import { minOf, hm, serviceTitle, shortName, STATUS_SHORT } from '../../components/today/model';
import * as today from '../../components/today/model';
import type { TodayEnv, NextAction, Flag } from '../../components/today/types';

export type Overrides = Record<string, Partial<Omit<Job, 'id'>> & { paid?: boolean; approved?: boolean }>;

export const LANE_IDS = ['counter', 'm-jun', 'm-arnel', 'm-paolo', 'm-ricky', 'unassigned'] as const;
export type LaneId = (typeof LANE_IDS)[number];

export const applyOverrides = (ov: Overrides, pool: Job[] = allJobs): Job[] => pool.map((j) => (ov[j.id] ? { ...j, ...ov[j.id] } as Job : j));

/** The clock and stock rules of the mock data, handed to the public Today helpers. */
export const todayEnv: TodayEnv = {
  now: NOW, today: TODAY, stockState, elsewhere: onHandElsewhere,
  shortParts: (j) => shortLines(j as Job).map((l) => productOf(l.productId)),
  balance: (j) => jobBalance(j as Job), peso,
};
export { minOf, hm, serviceTitle, shortName, STATUS_SHORT };
export type { NextAction, Flag };
export const dayWord = (iso: string) => today.dayWord(iso, TODAY);
export const age = (iso: string) => today.age(iso, NOW);

const ACTIVE: JobStatus[] = ['TODO', 'IN_PROGRESS', 'PENDING'];
export const isOpen = today.isOpen;
export const isPast = (iso: string | null) => today.isPast(iso, NOW);

export const reasonOf = (j: Job): NeedsReason | null => today.reasonOf(todayEnv, j);

export function laneOf(j: Job): LaneId {
  if (j.status === 'FOR_APPROVAL' || j.status === 'FOR_PICKUP') return 'counter';
  if (!j.assigneeId) return 'unassigned';
  return j.assigneeId as LaneId;
}

export const flagOf = (j: Job): Flag | null => today.flagOf(todayEnv, j);

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

export interface JobView { job: Job; plate: string; vehicle: string; customer: string; phone: string; mechanic: string | null }
export const viewOf = (j: Job): JobView => {
  const v = vehicleOf(j); const c = customerOf(j);
  return { job: j, plate: v.plate, vehicle: `${v.make} ${v.model} ${v.year}`, customer: c.name, phone: c.phone, mechanic: mechanics.find((m) => m.id === j.assigneeId)?.short ?? null };
};

export const nextAction = (j: Job): NextAction | null => today.nextAction(todayEnv, j);

export const money = { total: jobTotal, paid: jobPaid, balance: jobBalance };
export { onHandElsewhere, onHandHere, stockState };
