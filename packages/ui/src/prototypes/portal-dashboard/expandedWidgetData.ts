/**
 * RDY-216 mock data: the four Leda widget types that can expand into the content panel.
 * Kept out of data.ts so the sibling RDY-214/215/217 prototypes do not touch the same file.
 */
import type { StatusTone } from '../../index';
import type { LedaMessage } from './DashboardShell';

export type WidgetId = 'low-stock' | 'week-stats' | 'sales-chart' | 'platform-overview';

/** Inline row limit in the panel (live Portal uses 20; the prototype shows 6 so the cut is visible). */
export const INLINE_ROWS = 6;

export interface LowStockRow {
  sku: string;
  item: string;
  location: string;
  onHand: number;
  reorderAt: number;
  daysLeft: number;
}

const ITEMS: Array<[string, string, string, number, number, number]> = [
  ['RCE-25', 'Jasmine rice 25 kg', 'Central stock', 3, 20, 1],
  ['OIL-1L', 'Cooking oil 1 L', 'Central stock', 8, 40, 2],
  ['EGG-30', 'Eggs, tray of 30', 'Davao stock', 5, 24, 2],
  ['SUG-1K', 'White sugar 1 kg', 'Central stock', 12, 36, 3],
  ['SDN-155', 'Sardines 155 g', 'Davao stock', 18, 60, 3],
  ['NDL-55', 'Instant noodles 55 g', 'Central stock', 40, 120, 4],
  ['COF-3IN1', 'Coffee 3-in-1, pack of 30', 'Central stock', 6, 15, 4],
  ['SOY-1L', 'Soy sauce 1 L', 'Davao stock', 9, 24, 5],
  ['VIN-1L', 'Cane vinegar 1 L', 'Davao stock', 10, 24, 5],
  ['MLK-1L', 'UHT milk 1 L', 'Central stock', 14, 36, 5],
  ['BRD-600', 'Loaf bread 600 g', 'Central stock', 7, 18, 6],
  ['SOAP-4', 'Bath soap, pack of 4', 'Davao stock', 11, 24, 6],
  ['DET-1K', 'Detergent powder 1 kg', 'Central stock', 9, 20, 7],
  ['TP-12', 'Toilet paper, 12 rolls', 'Central stock', 8, 16, 7],
  ['CRN-425', 'Corned beef 175 g', 'Davao stock', 15, 30, 8],
  ['SLT-1K', 'Iodized salt 1 kg', 'Central stock', 10, 20, 8],
  ['FLR-1K', 'All-purpose flour 1 kg', 'Davao stock', 6, 12, 9],
  ['WTR-6L', 'Drinking water 6 L', 'Central stock', 22, 40, 9],
  ['BAT-AA', 'AA batteries, pack of 4', 'Central stock', 5, 10, 10],
  ['TUN-155', 'Tuna flakes 155 g', 'Davao stock', 20, 36, 10],
  ['SHP-12', 'Shampoo sachets, 12 pc', 'Central stock', 13, 24, 11],
  ['KTC-320', 'Ketchup 320 g', 'Davao stock', 9, 15, 12],
  ['MAY-470', 'Mayonnaise 470 ml', 'Central stock', 6, 10, 13],
  ['CND-LG', 'Candles, large', 'Davao stock', 12, 18, 14],
];

export const LOW_STOCK: LowStockRow[] = ITEMS.map(([sku, item, location, onHand, reorderAt, daysLeft]) => ({
  sku,
  item,
  location,
  onHand,
  reorderAt,
  daysLeft,
}));

export function urgency(daysLeft: number): {
  tone: 'error' | 'warning' | 'neutral';
  label: string;
} {
  if (daysLeft <= 2) return { tone: 'error', label: `${daysLeft} d left` };
  if (daysLeft <= 5) return { tone: 'warning', label: `${daysLeft} d left` };
  return { tone: 'neutral', label: `${daysLeft} d left` };
}

export interface WeekStat {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: 'success' | 'error' | 'neutral';
  points?: number[];
}

export const WEEK_STATS: WeekStat[] = [
  {
    label: 'Sales',
    value: '₱412.8k',
    delta: '+8.4%',
    points: [42, 48, 51, 47, 58, 62, 66],
  },
  {
    label: 'Orders',
    value: '1,284',
    delta: '+5.1%',
    points: [160, 172, 181, 175, 190, 198, 208],
  },
  {
    label: 'Avg. basket',
    value: '₱321',
    delta: '+3.2%',
    points: [300, 305, 302, 310, 314, 318, 321],
  },
  {
    label: 'Repairs closed',
    value: '46',
    delta: '−4',
    deltaTone: 'error',
    points: [9, 8, 7, 6, 6, 5, 5],
  },
  { label: 'Low stock items', value: '24', delta: '+6', deltaTone: 'error' },
  {
    label: 'Leda actions confirmed',
    value: '31',
    delta: '+12',
    deltaTone: 'neutral',
  },
];

/** Per-platform split for the expanded stats view. */
export const WEEK_BY_PLATFORM: Array<{
  platform: string;
  status: StatusTone;
  sales: string;
  orders: string;
  change: string;
  tone: 'success' | 'error';
}> = [
  {
    platform: 'Makati branch',
    status: 'active',
    sales: '₱168.2k',
    orders: '524',
    change: '+11.0%',
    tone: 'success',
  },
  {
    platform: 'BGC branch',
    status: 'active',
    sales: '₱201.5k',
    orders: '618',
    change: '+9.3%',
    tone: 'success',
  },
  {
    platform: 'Cebu branch',
    status: 'offline',
    sales: '₱43.1k',
    orders: '142',
    change: '−6.2%',
    tone: 'error',
  },
];

export const SALES_14D: Array<{ label: string; value: number }> = [
  ['Oct 10', 48],
  ['Oct 11', 61],
  ['Oct 12', 55],
  ['Oct 13', 52],
  ['Oct 14', 57],
  ['Oct 15', 63],
  ['Oct 16', 70],
  ['Oct 17', 51],
  ['Oct 18', 58],
  ['Oct 19', 54],
  ['Oct 20', 60],
  ['Oct 21', 66],
  ['Oct 22', 72],
  ['Oct 23', 69],
].map(([label, value]) => ({ label: label as string, value: value as number }));

export interface OverviewRow {
  id: string;
  label: string;
  kind: string;
  status: StatusTone;
  statusText: string;
  synced: string;
  links: string;
  note?: string;
}

export const PLATFORM_OVERVIEW: OverviewRow[] = [
  {
    id: 'inv-central',
    label: 'Central stock',
    kind: 'Inventory',
    status: 'active',
    statusText: 'Online',
    synced: '1 min ago',
    links: 'Shares with 2',
  },
  {
    id: 'inv-davao',
    label: 'Davao stock',
    kind: 'Inventory',
    status: 'degraded',
    statusText: 'Slow sync',
    synced: '18 min ago',
    links: 'Shares with 1',
    note: 'Sync is taking 4x longer than usual since 09:40.',
  },
  {
    id: 'st-makati',
    label: 'Makati branch',
    kind: 'Storefront',
    status: 'active',
    statusText: 'Online',
    synced: '2 min ago',
    links: 'Reads 1',
  },
  {
    id: 'st-bgc',
    label: 'BGC branch',
    kind: 'Storefront',
    status: 'active',
    statusText: 'Online',
    synced: '1 min ago',
    links: 'Reads 2',
  },
  {
    id: 'st-cebu',
    label: 'Cebu branch',
    kind: 'Storefront',
    status: 'offline',
    statusText: 'Offline',
    synced: '2 days ago',
    links: 'No source',
    note: 'No stock source, cannot take orders.',
  },
  {
    id: 'sms-main',
    label: 'Repair shop',
    kind: 'Service management',
    status: 'degraded',
    statusText: 'Degraded',
    synced: '6 min ago',
    links: 'Reads 1',
    note: '3 jobs waiting on parts from Central stock.',
  },
];

export const WIDGET_TITLE: Record<WidgetId, string> = {
  'low-stock': 'Low stock items',
  'week-stats': 'This week across platforms',
  'sales-chart': 'Sales, last 14 days',
  'platform-overview': 'Platform overview',
};

/** The conversation that produced the widgets (stable identity: the shell resets on change). */
export const WIDGET_CONVERSATION: LedaMessage[] = [
  { id: 1, role: 'user', text: "What's low on stock?" },
  {
    id: 2,
    role: 'assistant',
    text: '24 items are at or below their reorder point. The most urgent are first.',
    attachment: 'low-stock',
  },
  { id: 3, role: 'user', text: 'How did this week go?' },
  {
    id: 4,
    role: 'assistant',
    text: 'Sales are up 8.4% on last week. Repairs closed dipped because jobs are waiting on parts.',
    attachment: 'week-stats',
  },
  { id: 5, role: 'user', text: 'Show sales for the last 14 days.' },
  {
    id: 6,
    role: 'assistant',
    text: 'Sales peaked on Wednesday Oct 22.',
    attachment: 'sales-chart',
  },
  { id: 7, role: 'user', text: 'How are my platforms doing?' },
  {
    id: 8,
    role: 'assistant',
    text: 'Four of six are healthy. Davao stock is slow to sync and Cebu branch is offline.',
    attachment: 'platform-overview',
  },
];

/** Same conversation plus a follow-up that refers to the expanded low stock list. */
export const FOLLOW_UP_CONVERSATION: LedaMessage[] = [
  ...WIDGET_CONVERSATION.slice(0, 2),
  { id: 9, role: 'user', text: 'Which of these should I reorder first?' },
  {
    id: 10,
    role: 'assistant',
    text: 'From the low stock list you have open: Jasmine rice 25 kg, Cooking oil 1 L and Eggs run out within 2 days. Want me to draft a purchase order for those three?',
  },
];
