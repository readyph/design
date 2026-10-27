import { logoAutoworks, logoCafe } from './Home.logos';
import type { DataListItem } from '../components/DataList';
import type { DayBarMark } from '../components/DayBar';
import type { OverviewPlatform } from '../components/OverviewCharts';
import { autoWorks as weekAuto, cafe as weekCafe, stockroom as weekStock } from '../components/OverviewCharts.data';
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
  week: Omit<OverviewPlatform, 'onOpen' | 'onRetry' | 'state'>;
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
  plan: { used: number; max: number };
}

/** The words of each list's "View all" link, as in the workshop data.js (`viewAll`). */
const viewAll: Record<string, string> = { jobs: 'View all job orders', inq: 'View all inquiries', moves: 'View all movements', low: 'View all low stock' };
const today = (id: string, title: string, total: number, items: HomeListItem[]): HomeList => ({ id, title, total, items, ...(viewAll[id] ? { viewAllLabel: viewAll[id] } : {}) });

const hqPlatform: HomePlatform = {
  id: 'hq', name: 'HQ', shortName: 'HQ', kind: 'Team and plan', status: 'ACTIVE', hq: true, count: 1,
  ledaCanAct: true,
  facts: [{ value: 9, label: 'people' }, { value: 1, label: 'invite pending' }],
  lists: [today('invites', 'Invites', 1, [{ id: 'inv1', title: 'Rico Lim', detail: 'Invited by Jun, write access to Auto Works', state: 'Accepted', tone: 'ok', at: '8:50 AM' }])],
  week: { id: 'hq', name: 'HQ', kind: 'Team and plan', logo: { hq: true }, status: { tone: 'ok', label: 'Running' } },
  yesterday: [],
};

const stockroom: HomePlatform = {
  id: 'stockroom', name: 'Parts Stockroom', shortName: 'Stockroom', kind: 'Inventory', mapType: 'warehouse', status: 'ACTIVE', index: 1, count: 2,
  ledaCanAct: true,
  facts: [{ value: 612, label: 'products' }, { value: 9, label: 'low stock' }, { value: 2, label: 'POs open' }],
  lists: [
    today('moves', 'Stock in and out since yesterday', 9, [
      { id: 'm1', ref: 'JO-0414', title: 'Toyota oil filter', detail: 'for JO-0414', state: 'Out', tone: 'neutral', qty: '−1 pc', at: '9:05' },
      { id: 'm2', ref: 'PH-H4-12V', title: 'Headlight bulb H4', detail: 'dropped', state: 'Damaged', tone: 'bad', qty: '−1 pc', at: 'Wed 16:10' },
      { id: 'm3', ref: 'PO-0214', title: 'Petron Blaze Racing 10W-40, 1L', detail: 'PO-0214 · 42 of 48', state: 'In', tone: 'ok', qty: '+42 bottle', at: 'Wed 14:30' },
    ]),
    today('low', 'Low stock', 9, [
      { id: 'l1', ref: 'ALT-NCP150', title: 'Alternator, Vios NCP150 (reman.)', detail: 'reorder level 1 · PO-0221', state: 'Out of stock', tone: 'bad', qty: '0 pc', linkTo: 'autoworks', linkRef: 'JO-0412', linkText: 'waiting for it · promised 11:00' },
      { id: 'l2', ref: '90915-YZZE1', title: 'Toyota oil filter', detail: 'reorder level 20 · PO-0219', state: 'Low', tone: 'warn', qty: '4 pc' },
      { id: 'l3', ref: 'BX-DB1863', title: 'Bendix brake pads, Vios front', detail: 'reorder level 6 · PO-0219', state: 'Low', tone: 'warn', qty: '2 set' },
    ]),
  ],
  week: { ...weekStock, id: 'stockroom', name: 'Parts Stockroom', logo: { index: 1 }, status: { tone: 'ok', label: 'Running' } },
  yesterday: [{ value: 14, label: 'received' }, { value: 31, label: 'shipped' }],
};

const autoworks: HomePlatform = {
  id: 'autoworks', name: 'Dela Cruz Auto Works', shortName: 'Auto Works', kind: 'Repair shop', mapType: 'service', status: 'ACTIVE', index: 8, logo: logoAutoworks, count: 1,
  ledaCanAct: false,
  facts: [{ value: 12, label: 'open jobs' }, { value: 4, label: 'inquiries' }, { value: 3, label: 'for pickup' }],
  lists: [
    today('jobs', 'Open job orders', 12, [
      { id: 'j1', ref: 'JO-0412', title: 'Vios · Alternator', detail: 'Ana Villanueva · Dennis', state: 'Waiting for parts', tone: 'warn', at: '8:47', linkTo: 'stockroom', linkRef: 'ALT-NCP150', linkText: '0 on hand · PO-0221 draft' },
      { id: 'j2', ref: 'JO-0411', title: 'Hilux · Clutch, approval of extra', detail: 'Rodel Castro · Mark', state: 'Waiting for customer', tone: 'warn', at: 'Wed 16:20' },
      { id: 'j3', ref: 'JO-0409', title: 'Fortuner · PMS 50,000 km', detail: 'Dr. Ramil Uy · Tonyo', state: 'For pickup', tone: 'ok', at: '8:40' },
    ]),
    today('inq', 'Inquiries', 4, [
      { id: 'i1', ref: 'QT-0088', title: 'Fortuner · Suspension overhaul', detail: 'Victor Ramos · ₱14,800', state: 'For approval', tone: 'warn', at: 'since Tue' },
      { id: 'i2', ref: 'QT-0091', title: 'Mirage · Aircon compressor', detail: 'Liezl Cruz · ₱3,950', state: 'For approval', tone: 'warn', at: '8:55' },
      { id: 'i3', ref: 'QT-0092', title: 'Ranger · Noise check, front', detail: 'Gerry Ong', state: 'Quotation', at: '9:02' },
    ]),
  ],
  week: { ...weekAuto, id: 'autoworks', name: 'Dela Cruz Auto Works', logo: { index: 8, src: logoAutoworks }, status: { tone: 'ok', label: 'Running' } },
  yesterday: [{ value: '₱24,300', label: 'revenue' }, { value: 6, label: 'jobs closed' }],
};

const cafe: HomePlatform = {
  id: 'cafe', name: 'Lia’s Cafe', shortName: 'Café', kind: 'Point of sale', mapType: 'store', status: 'ACTIVE', index: 7, logo: logoCafe, count: 1,
  ledaCanAct: false,
  facts: [{ value: 64, label: 'sales' }],
  lists: [today('sales', 'Sales so far', 64, [
    { id: 's1', ref: 'INV-77', title: 'Supplier invoice', detail: 'Delivery DR-3381', state: 'Differs', tone: 'warn', qty: '₱420', at: 'Fri' },
    { id: 's2', title: 'Closed shift for Lia Santos', at: '10:12 AM' },
  ])],
  week: { ...weekCafe, id: 'cafe', name: 'Lia’s Cafe', logo: { index: 7, src: logoCafe }, status: { tone: 'ok', label: 'Running' } },
  yesterday: [{ value: 104, label: 'sales' }],
};



const caseFor = (id: string, platformName: string): HomeCase => ({
  id,
  evidence: [{ label: 'Platform', value: platformName }],
  note: `Leda reads ${platformName} but cannot write to it yet, so there is no draft. Open it to decide.`,
  noDraft: true,
});

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
  { id: 'q4', platform: { id: 'hq', name: 'HQ', hq: true }, source: 'HQ · Team', due: 'Today', title: 'Approve Rico Lim as mechanic', detail: 'Invited by Jun · write access to Auto Works', action: 'Approve invite' },
];
const watching: QueueWatchItem[] = [
  { id: 'w1', platform: { id: 'stockroom', name: 'Parts Stockroom', index: 1 }, title: 'Brake pads reorder point in 2 days', detail: 'Leda will draft when it hits 6 left' },
  { id: 'w2', platform: { id: 'autoworks', name: 'Dela Cruz Auto Works', index: 8, src: logoAutoworks }, title: 'Fortuner PMS ready for pickup', detail: 'Leda tells Dr. Uy at 10:00' },
];
const snoozed: QueueSnoozedItem[] = [{ id: 's1', platform: { id: 'stockroom', name: 'Parts Stockroom', index: 1 }, title: 'Cycle count off by 3', until: 'Later today · 13:00' }];
const done: QueueDoneItem[] = [{ id: 'd1', platform: { id: 'autoworks', name: 'Dela Cruz Auto Works', index: 8, src: logoAutoworks }, title: 'Oil filter order sent to Banawe Autoparts Supply', at: '8:12' }];

const common = { cases, next: 'Next: PO-0221 from Banawe Autoparts Supply arrives at 10:30 · 12 lines.', yesterdayDate: 'Sun 25 Oct', plan: { used: 1742, max: 2000 } };

export const live: HomeSet = {
  key: 'live',
  ...common,
  platforms: [autoworks, stockroom],
  hq: hqPlatform,
  links: [{ from: 'stockroom', to: 'autoworks', status: 'ok' }],
  items: liveItems,
  watching,
  snoozed,
  done,
};

export const few: HomeSet = {
  ...live,
  key: 'few',
  platforms: [autoworks, stockroom, cafe],
  links: [{ from: 'stockroom', to: 'autoworks', status: 'ok' }, { from: 'stockroom', to: 'cafe', status: 'slow' }],
  items: [
    ...liveItems.slice(0, 3),
    { id: 'q5', platform: { id: 'cafe', name: 'Lia’s Cafe', index: 7, src: logoCafe }, due: 'Fri 23 Oct', title: 'Supplier invoice differs by ₱420', detail: 'Delivery DR-3381 vs invoice INV-77', action: 'Dispute or accept' },
    liveItems[3]!,
  ],
  cases: { ...cases, q5: { ...cases.q3!, id: 'q5', evidence: [{ label: 'Invoice', value: 'INV-77', note: '₱420 more', tone: 'bad' }, { label: 'Delivery', value: 'DR-3381' }], note: 'The invoice is ₱420 higher than the delivery note.' } },
};

const manyNames: [string, string, string, TownMapPlatform['mapType'], TownMapPlatform['status']][] = [
  ['books', 'Bookshop Loyalty', 'Books', undefined, 'OFFLINE'],
  ['cebu', 'Cebu Parts Stockroom', 'Cebu Parts', 'warehouse', 'OFFLINE'],
  ['makati', 'Makati Café', 'Makati', 'store', 'ACTIVE'],
  ['cubao', 'Cubao Repair Shop', 'Cubao', 'service', 'ACTIVE'],
  ['pasig', 'Pasig Hardware', 'Pasig', 'store', 'ACTIVE'],
];
const manyExtra: HomePlatform[] = manyNames.map(([id, name, shortName, mapType, status], i) => ({
  ...(i % 2 ? stockroom : cafe),
  id, name, shortName, mapType, status, index: 4 + i, count: i % 3 === 0 ? 0 : 1,
  kind: i % 2 ? 'Inventory' : 'Point of sale',
  week: { ...(i % 2 ? weekStock : weekCafe), id, name, logo: { index: 4 + i }, status: status === 'ACTIVE' ? { tone: 'ok' as const, label: 'Running' } : { tone: 'bad' as const, label: 'Offline' } },
  lists: [today(`${id}-l`, i % 2 ? 'Stock movements' : 'Sales so far', 3, [{ id: `${id}-1`, title: 'Latest activity', detail: 'Nothing unusual', at: '9:05' }])],
  ledaCanAct: false,
}));
export const many: HomeSet = {
  ...live,
  key: 'many',
  platforms: [autoworks, stockroom, cafe, ...manyExtra],
  links: [{ from: 'stockroom', to: 'autoworks', status: 'ok' }, { from: 'stockroom', to: 'cafe', status: 'slow' }, { from: 'cebu', to: 'makati', status: 'broken' }],
  items: [...few.items, ...Array.from({ length: 5 }, (_, i): QueueItem => {
    const p = manyExtra[i]!;
    return { id: `x${i}`, platform: { id: p.id, name: p.name, index: p.index }, due: 'Today', title: `${p.shortName}: review ${i + 2} flagged items`, detail: 'Leda cannot draft this yet', action: 'Open' };
  })],
  cases: { ...few.cases, ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`x${i}`, caseFor(`x${i}`, manyExtra[i]!.name)])) },
};

export const sets: Record<HomeSetKey, HomeSet> = { live, few, many };

/**
 * Workshop map order (data.js `mapOrder`): the platforms in order, the empty lots, and HQ in the last plot
 * (two platforms: Stockroom, Auto Works, an empty lot, HQ).
 */
export const mapSlots = (s: HomeSet): TownMapSlot[] => {
  const slim = (p: HomePlatform): TownMapSlot => {
    const { ledaCanAct: _a, facts: _f, lists: _l, week: _w, yesterday: _y, ...rest } = p;
    return rest;
  };
  const n = s.platforms.length + 1;
  const total = Math.ceil(n / Math.max(1, Math.ceil(Math.sqrt(n)))) * Math.max(1, Math.ceil(Math.sqrt(n)));
  // data.js mapOrder for the duo: Stockroom first, then Auto Works.
  const order = (id: string) => (id === 'stockroom' ? 0 : id === 'autoworks' ? 1 : 2);
  const ordered = [...s.platforms].sort((x, y) => order(x.id) - order(y.id));
  return [...ordered.map(slim), ...Array.from({ length: total - n }, () => null), slim(s.hq)];
};

export const queuePlatforms = (s: HomeSet): QueuePlatform[] => [
  ...s.platforms.map((p) => ({ id: p.id, name: p.name, index: p.index })),
  { id: 'hq', name: 'HQ', hq: true },
];

export const ledaMode = (p: HomePlatform): TodayLedaMode => (p.status === 'OFFLINE' ? 'offline' : p.ledaCanAct ? 'acts' : 'reads');

export const suggestions = [
  'How did the shop do this week?',
  'Anong parts ang pinakamaraming nagamit kahapon?',
  'Raise oil filter reorder level to 30',
  'Move JO-0412 to In progress',
];
