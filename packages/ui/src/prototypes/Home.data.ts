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
  ledaCanRead?: boolean;
  initials?: string;
  /** The yesterday line: `value label` pairs in the platform's own words. */
  yesterday: TodayFact[];
}

export interface HomeCase {
  /** Same id as the queue item. */
  id: string;
  /** Facts line (C37): the first is the due time. */
  due?: string;
  left?: { text: string; tone: 'warn' | 'bad' };
  deadline?: string;
  impact?: string;
  day?: { hours: { open: number; close: number }; now: number; marks: DayBarMark[] };
  evidence: DataListItem[];
  note: string;
  proposal?: { id?: string; title: string; writes: string[]; notes?: string[]; cannot?: string; confirmLabel: string; toast: string; van?: [string, string] };
  /** Dispute or accept before Confirm. */
  variance?: boolean;
  /** Leda cannot write to this platform yet. */
  noDraft?: boolean;
}

export interface HomeSet {
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
  plan: { used: number; max: number; cycleStart: string; cycleEnd: string; daysLeft: number };
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





export const cases: Record<string, HomeCase> = {
  q1: {
    id: 'q1',
    due: 'Order by 9:45',
    left: { text: '33 min left', tone: 'warn' },
    deadline: '11:00 pickup',
    impact: '1 job waits',
    day: {
      hours: { open: 8 * 60, close: 17 * 60 },
      now: 9 * 60 + 12,
      marks: [
        { kind: 'due', at: 9 * 60 + 45, label: 'Order by 9:45', shortLabel: '9:45', tone: 'bad' },
        { kind: 'deadline', at: 11 * 60, label: 'Pickup 11:00', shortLabel: '11:00' },
      ],
    },
    evidence: [
      { label: 'Job', value: 'JO-0412 · Vios alternator', note: 'Dennis' },
      { label: 'Customer', value: 'Ana Villanueva' },
      { label: 'Part', value: 'ALT-NCP150', note: '0 on hand', tone: 'bad' },
      { label: 'Supplier', value: 'Banawe Autoparts Supply', note: 'rush' },
      { label: 'Rush PO arrives', value: '10:30' },
    ],
    note: 'None in stock at Parts Stockroom. A rush order now lands at 10:30, before the 11:00 pickup.',
    proposal: {
      id: 'PO-0221',
      title: 'Order 1 alternator (ALT-NCP150)',
      writes: ['Parts Stockroom: PO-0221 gets 1 line for ALT-NCP150', 'PO-0221 goes to Banawe Autoparts Supply as a rush order'],
      notes: ['Notifies Dennis when the part arrives.', 'Nothing is charged until Banawe Autoparts Supply confirms.'],
      confirmLabel: 'Order alternator',
      toast: 'Alternator ordered from Banawe Autoparts Supply.',
      van: ['stockroom', 'autoworks'],
    },
  },
  q2: {
    id: 'q2',
    due: 'Order by 12:00',
    left: { text: '2h 48m left', tone: 'warn' },
    deadline: '12:00 cutoff',
    impact: '6 jobs today',
    day: {
      hours: { open: 8 * 60, close: 17 * 60 },
      now: 9 * 60 + 12,
      marks: [{ kind: 'due', at: 12 * 60, label: 'Order by 12:00', shortLabel: '12:00' }],
    },
    evidence: [
      { label: 'Product', value: 'Toyota oil filter', note: '4 left' },
      { label: 'Reorder level', value: '20' },
      { label: 'Draft', value: 'PO-0219', note: '₱18,450' },
      { label: 'Supplier', value: 'Banawe Autoparts Supply' },
    ],
    note: 'Six maintenance jobs today use this filter. The draft covers two weeks.',
    proposal: {
      id: 'PO-0219',
      title: 'Confirm PO-0219',
      writes: ['PO-0219: draft → ordered', 'Sent to Banawe Autoparts Supply'],
      notes: ['Notifies Arnel'],
      confirmLabel: 'Confirm PO',
      toast: 'PO-0219 sent to Banawe Autoparts Supply.',
      van: ['stockroom', 'stockroom'],
    },
  },
  q3: {
    id: 'q3',
    due: 'Dispute by Fri 23 Oct',
    deadline: 'Fri 23 Oct',
    impact: '₱2,790',
    evidence: [
      { label: 'Delivery', value: 'PO-0214', note: '42 of 48' },
      { label: 'Short', value: '6 bottles', note: '₱2,790', tone: 'bad' },
      { label: 'Supplier', value: 'Petron Depot Manila' },
      { label: 'Invoice', value: 'INV-5521' },
    ],
    note: 'The supplier billed 48 bottles and delivered 42. You can dispute the 6 or accept the invoice as it is.',
    variance: true,
    proposal: {
      id: 'VAR-0214',
      title: 'Settle PO-0214',
      writes: ['PO-0214 variance: 6 × ₱465 not received'],
      notes: ['Nothing is paid by this step.'],
      confirmLabel: 'Dispute',
      toast: 'Variance on PO-0214 recorded.',
    },
  },
  q4: {
    id: 'q4',
    due: 'Today',
    impact: '1 seat',
    evidence: [
      { label: 'Person', value: 'Rico Lim', note: 'accepted 8:50' },
      { label: 'Invited by', value: 'Jun' },
      { label: 'Access', value: 'Write access to Auto Works' },
      { label: 'Seats', value: '9 of 10 used' },
    ],
    note: 'Rico accepted the invite. Approving gives him write access to Dela Cruz Auto Works only.',
    proposal: {
      id: 'INV-RL',
      title: 'Approve Rico Lim as Mechanic',
      writes: ['Rico Lim: role Mechanic at Dela Cruz Auto Works'],
      notes: ['Notifies Rico by email.', 'Uses 1 of your seats.'],
      confirmLabel: 'Approve invite',
      toast: 'Rico Lim approved as Mechanic.',
    },
  },
};

const liveItems: QueueItem[] = [
  { id: 'q1', platform: { id: 'autoworks', name: 'Dela Cruz Auto Works', index: 8, src: logoAutoworks }, due: 'Order by 9:45', urgent: true, title: 'Alternator needed for 11:00 Vios pickup', detail: 'None in stock · rush PO arrives 10:30', action: 'Order alternator' },
  { id: 'q2', platform: { id: 'stockroom', name: 'Parts Stockroom', index: 1 }, due: 'Order by 12:00', title: 'Oil filters at 4, reorder level 20', detail: '6 maintenance jobs today · draft PO ₱18,450', action: 'Confirm PO' },
  { id: 'q3', platform: { id: 'stockroom', name: 'Parts Stockroom', index: 1 }, due: 'Dispute by Fri 23 Oct', title: 'Petron delivery 6 bottles short', detail: 'PO-0214 · 6 × ₱465 not received', action: 'Dispute or accept' },
  { id: 'q4', platform: { id: 'hq', name: 'HQ', hq: true }, source: 'HQ · Team', title: 'Approve Rico Lim as mechanic', detail: 'Invited by Jun · write access to Auto Works', action: 'Approve invite' },
];
const watching: QueueWatchItem[] = [
  { id: 'w1', platform: { id: 'stockroom', name: 'Parts Stockroom', index: 1 }, title: 'Brake pads reorder point in 2 days', detail: 'Leda will draft when it hits 6 left' },
  { id: 'w2', platform: { id: 'autoworks', name: 'Dela Cruz Auto Works', index: 8, src: logoAutoworks }, title: 'Fortuner PMS ready for pickup', detail: 'Leda tells Dr. Uy at 10:00' },
];
const snoozed: QueueSnoozedItem[] = [];
const done: QueueDoneItem[] = [];

const common = { cases, next: 'Next: PO-0221 from Banawe Autoparts Supply arrives at 10:30 · 12 lines.', yesterdayDate: 'Sun 25 Oct', plan: { used: 1742, max: 2000, cycleStart: '30 Sep', cycleEnd: '29 Oct', daysLeft: 7 } };

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
  items: liveItems,
  watching,
  snoozed,
  done,
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
