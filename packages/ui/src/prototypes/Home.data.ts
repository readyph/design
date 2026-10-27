import { logoAutoworks } from './Home.logos';
import { duoLive, duoQuiet, fewLive, fewQuiet, liveMeta, liveWeeks, manyLive, manyQuiet } from './Home.sets.data';
import type { DataListItem } from '../components/DataList';
import type { DayBarMark } from '../components/DayBar';
import type { OverviewPlatform } from '../components/OverviewCharts';
import type { QueueDoneItem, QueueItem, QueuePlatform, QueueSnoozedItem, QueueWatchItem } from '../components/Queue';
import type { TodayFact, TodayItem, TodayLedaMode, TodayList } from '../components/PlatformToday';
import type { TownMapLink, TownMapPlatform, TownMapSlot } from '../components/TownMap';

/**
 * Sample data for the Home prototype (RDY-255). Prototype only, not exported from the package. Replace before real use.
 * One shape for every dataset: Home reads the common per-platform overview (handover 7.1) and has no kind-specific code.
 */

export type HomeSetKey = 'live' | 'few' | 'many';
export type HomeState = 'live' | 'quiet' | 'loading' | 'error';

export interface HomeListItem extends TodayItem {
  /** Id of the platform the link chip leads to. */
  linkTo?: string;
  linkRef?: string;
  linkText?: string;
}
export interface HomeList extends Omit<TodayList, 'items'> {
  items: HomeListItem[];
}
export interface HomePlatform extends TownMapPlatform {
  ledaCanAct: boolean;
  facts: TodayFact[];
  lists: HomeList[];
  /** Street or area, from the workshop data (platform tab crumbs). */
  place?: string;
  week: Omit<OverviewPlatform, 'onOpen' | 'onRetry' | 'state'>;
  activity?: { id: string; at: string; text: string }[];
  statusNote?: string;
  statusSince?: string;
  ledaCanRead?: boolean;
  initials?: string;
  /** The yesterday line: `value label` pairs in the platform's own words. */
  yesterday: TodayFact[];
}

/** One fact of a case's facts line, as the workshop builds it: `pre` label, bold `b`, `post` label; `left` is the due minute (time left is worked out from the clock); `leda` is the "Leda acts in ..." line. */
export interface HomeCaseFact { pre?: string; b?: string; num?: boolean; post?: string; text?: string; mono?: boolean; left?: number; leda?: 'can' | 'cant' | 'plain' }
export interface HomeCaseLine { name: string; ref?: string; supplier?: string; qty: number; unit: string; unitCost: number }
export interface HomeCaseOption { id: string; label: string; writes: string[]; notifies?: string; confirmLabel: string; after: string }
export interface HomeCase {
  /** Same id as the queue item. */
  id: string;
  facts: HomeCaseFact[];
  day?: { hours: { open: number; close: number }; now: number; marks: DayBarMark[] };
  evidence: (DataListItem & { mono?: boolean })[];
  note: string;
  /** Leda's draft: lines, what she writes, who is notified, options (dispute or accept), an add-on. */
  proposal?: { id: string; title: string; lines?: HomeCaseLine[]; writes: string[]; cannot?: string; notifies?: string; confirmLabel: string; after: string; options?: HomeCaseOption[]; addOn?: { label: string; proposalId: string; line: HomeCaseLine } };
  /** No draft: Leda cannot write here, so the well opens the platform. */
  open?: { label: string; platformId: string; primary: boolean };
  /** The plan well (usage track). */
  plan?: boolean;
  /** The van runs along this road when a write lands: [from, to]. */
  van?: [string, string];
  /** Platforms the item touches (its own, those it involves, where Leda acts). */
  pids?: string[];
}

export interface HomeLedaAnswer { q: string; kind: 'figure' | 'table'; figure?: string; sub?: string; columns?: string[]; rows?: { label: string; values: (string | number)[] }[]; unit?: string; note?: string; from: string; next?: string[] }
export interface HomeLedaCommand { q: string; platformId: string; platformLabel: string; allowed: boolean; proposal?: { id: string; title: string; lines: HomeCaseLine[]; writes: string[]; notifies?: string; confirmLabel: string; after: string }; refusal?: string; offerLabel?: string }

export interface HomeSet {
  /** What Leda answers and does in the conversation, from the workshop data. */
  leda?: { answers: HomeLedaAnswer[]; commands: HomeLedaCommand[] };
  key: HomeSetKey;
  platforms: HomePlatform[];
  hq: HomePlatform;
  links: TownMapLink[];
  items: QueueItem[];
  watching: QueueWatchItem[];
  snoozed: QueueSnoozedItem[];
  done: QueueDoneItem[];
  cases: Record<string, HomeCase>;
  /** Quiet day's "Next: ..." line. */
  next: string;
  yesterdayDate: string;
  plan: { name?: string; used: number; max: number; cycleStart: string; cycleEnd: string; daysLeft: number };
  /** Place of each building on the map grid (workshop `mapOrder`): platform ids, `'hq'`, or `null` for an empty lot. Default: HQ then the platforms. */
  mapOrder?: (string | null)[];
  /** False when the owner has no HQ plot (a set from the workshop's single-business data). Default true. */
  hasHq?: boolean;
  /** Leda's headline lines from the workshop data. */
  headline?: string;
  owner?: { name: string; short: string; initials: string };
  suggestions?: string[];
  weekRange?: string;
  quietHeadline?: string;
  yesterdayLine?: string;
  /** The set as it reads on a quiet day (its own platforms, watching, yesterday), when it differs from the live one. */
  quietSet?: HomeSet;
}

/** The words of each list's "View all" link, as in the workshop data.js (`viewAll`). */
const viewAll: Record<string, string> = { jobs: 'View all job orders', inq: 'View all inquiries', moves: 'View all movements', low: 'View all low stock' };
const today = (id: string, title: string, total: number, items: HomeListItem[]): HomeList => ({ id, title, total, items, ...(viewAll[id] ? { viewAllLabel: viewAll[id] } : {}) });

const hqPlatform: HomePlatform = {
  id: 'hq', name: 'HQ', shortName: 'HQ', kind: 'Team and plan', status: 'ACTIVE', hq: true, count: 1,
  ledaCanAct: true,
  facts: [{ value: 9, label: 'people' }, { value: 1, label: 'invite pending' }, { value: '1,742 / 2,000', label: 'Leda requests' }],
  lists: [today('invites', 'Invites', 1, [{ id: 'inv1', ref: 'Wed 21 Oct', refPlain: true, title: 'Rico Lim · Mechanic', detail: 'Write · Dela Cruz Auto Works · by Jun', state: 'Waiting for you', tone: 'warn' }])],
  week: { id: 'hq', name: 'HQ', kind: 'Team and plan', logo: { hq: true }, status: { tone: 'ok', label: 'Running' } },
  yesterday: [],
};

const sharesOfP = (id: string) => duoLive.platforms.find((p) => p.id === id)!;
const sharesOf = (id: string) => duoLive.platforms.find((p) => p.id === id)?.week.shares;

const stockroom: HomePlatform = {
  id: 'stockroom', name: 'Parts Stockroom', shortName: 'Stockroom', kind: 'Inventory', mapType: 'warehouse', status: 'ACTIVE', index: 1, count: 2,
  ledaCanAct: true,
  facts: [{ value: 612, label: 'products' }, { value: 9, label: 'low stock' }, { value: 2, label: 'POs open' }],
  place: sharesOfP('stockroom').place,
  lists: sharesOfP('stockroom').lists,
  activity: sharesOfP('stockroom').activity,
  week: { ...liveWeeks.stockroom!, shares: sharesOf('stockroom') },
  yesterday: [{ value: 14, label: 'received' }, { value: 31, label: 'shipped' }],
};

const autoworks: HomePlatform = {
  id: 'autoworks', name: 'Dela Cruz Auto Works', shortName: 'Auto Works', kind: 'Repair shop', mapType: 'service', status: 'ACTIVE', index: 8, logo: logoAutoworks, count: 1,
  ledaCanAct: false,
  facts: [{ value: 12, label: 'open jobs' }, { value: 4, label: 'inquiries' }, { value: 3, label: 'for pickup' }],
  place: sharesOfP('autoworks').place,
  lists: sharesOfP('autoworks').lists,
  activity: sharesOfP('autoworks').activity,
  week: { ...liveWeeks.autoworks!, shares: sharesOf('autoworks') },
  yesterday: [{ value: '₱24,300', label: 'revenue' }, { value: 6, label: 'jobs closed' }],
};





const common = { cases: duoLive.cases, next: 'Next: PO-0221 from Banawe Autoparts Supply arrives at 10:30 · 12 lines.', yesterdayDate: 'Sun 25 Oct', plan: { used: 1742, max: 2000, cycleStart: '30 Sep', cycleEnd: '29 Oct', daysLeft: 7 } };

const liveQuiet: HomeSet = { ...duoQuiet, owner: liveMeta.owner, suggestions: [...liveMeta.suggestions], weekRange: liveMeta.weekRange };

export const live: HomeSet = {
  quietSet: liveQuiet,
  key: 'live',
  owner: liveMeta.owner,
  suggestions: [...liveMeta.suggestions],
  weekRange: liveMeta.weekRange,
  ...common,
  platforms: [autoworks, stockroom],
  hq: hqPlatform,
  links: [{ from: 'stockroom', to: 'autoworks', status: 'ok' }],
  mapOrder: ['stockroom', 'autoworks', null, 'hq'],
  leda: duoLive.leda,
  headline: duoLive.headline,
  quietHeadline: duoLive.quietHeadline,
  yesterdayLine: duoLive.yesterdayLine,
  items: duoLive.items,
  watching: duoLive.watching,
  snoozed: duoLive.snoozed,
  done: duoLive.done,
};

export const few: HomeSet = { ...fewLive, quietSet: fewQuiet };
export const many: HomeSet = { ...manyLive, quietSet: manyQuiet };

export const sets: Record<HomeSetKey, HomeSet> = { live, few, many };

export const mapSlots = (s: HomeSet): TownMapSlot[] => {
  const all = [s.hq, ...s.platforms];
  const slots = s.mapOrder ? s.mapOrder.map((id) => (id ? all.find((p) => p.id === id) ?? null : null)) : all;
  return slots.map((p) => {
    if (!p) return null;
    const { ledaCanAct: _a, facts: _f, lists: _l, week: _w, yesterday: _y, ...rest } = p;
    return rest;
  });
};

export const queuePlatforms = (s: HomeSet): QueuePlatform[] => [
  ...s.platforms.map((p) => ({ id: p.id, name: p.name, index: p.index })),
  ...(s.hasHq === false ? [] : [{ id: 'hq', name: 'HQ', hq: true }]),
];

export const ledaMode = (p: HomePlatform): TodayLedaMode => (p.status === 'OFFLINE' ? 'offline' : p.ledaCanAct ? 'acts' : 'reads');

export const defaultSuggestions = [
  'How did the shop do this week?',
  'Anong parts ang pinakamaraming nagamit kahapon?',
  'Raise oil filter reorder level to 30',
  'Move JO-0412 to In progress',
];
