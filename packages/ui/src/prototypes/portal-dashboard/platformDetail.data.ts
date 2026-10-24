/**
 * Mock overview data for the RDY-215 platform detail modal. Keyed by the map instance ids in
 * `data.ts` plus the rail platforms, so a map node or a rail tile opens its own overview.
 * Shape mirrors what the Inventory and SMS overview providers return (RDY-212 feature 5).
 */
import { Package, Wrench, Storefront, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import type { StatusTone } from '../../index';

export type PlatformKind = 'Inventory' | 'SMS branch';
export type Severity = 'high' | 'medium' | 'low';
/** Data state of the overview fetch (not the platform health). */
export type DetailState = 'ready' | 'loading' | 'degraded' | 'offline' | 'restricted';

export interface KeyNumber {
  label: string;
  value: string;
  /** Short qualifier under the value, e.g. "of 412 items". */
  hint?: string;
  /** Needs attention (drawn in warning ink, never a filled tile). */
  warn?: boolean;
}

export interface AttentionItem {
  id: string;
  severity: Severity;
  title: string;
  meta: string;
  /** Deep link into the platform app: `/open/:id?to=…`. */
  href: string;
}

export interface PlatformAlert {
  id: string;
  severity: Severity;
  text: string;
  since: string;
}

export interface ActivityEvent {
  id: string;
  time: string;
  actor: string;
  summary: string;
  href: string;
}

export interface PlatformOverview {
  id: string;
  label: string;
  kind: PlatformKind;
  icon: PhosphorIcon;
  status: StatusTone;
  /** Seconds since the last successful refresh when the modal opens. */
  updatedAgo: number;
  /** Last good sync, for degraded/offline copy. */
  lastSync?: string;
  numbers: KeyNumber[];
  attention: AttentionItem[];
  alerts: PlatformAlert[];
  activity: ActivityEvent[];
}

const open = (id: string, to: string) => `/open/${id}?to=${encodeURIComponent(to)}`;

const CENTRAL: PlatformOverview = {
  id: 'inv-central',
  label: 'Central stock',
  kind: 'Inventory',
  icon: Package,
  status: 'active',
  updatedAgo: 4,
  numbers: [
    { label: 'Low stock', value: '18', hint: 'below reorder point', warn: true },
    { label: 'Out of stock', value: '3', hint: 'of 412 items', warn: true },
    { label: 'Open POs', value: '7', hint: '2 arriving today' },
    { label: 'Stock value', value: '₱1.84M', hint: 'at cost' },
  ],
  attention: [
    { id: 'a1', severity: 'high', title: '3 items out of stock', meta: 'Rice 25kg, Cooking oil 1L, Eggs (tray)', href: open('inv-central', '/stock?filter=out') },
    { id: 'a2', severity: 'medium', title: 'PO-1042 waiting for approval', meta: 'Pacific Foods · ₱86,400 · 2 days', href: open('inv-central', '/purchase-orders/PO-1042') },
    { id: 'a3', severity: 'medium', title: 'Stock count overdue', meta: 'Aisle 4 · last counted 41 days ago', href: open('inv-central', '/counts/new?aisle=4') },
    { id: 'a4', severity: 'low', title: '15 items below reorder point', meta: 'Suggested PO ready to review', href: open('inv-central', '/reorder') },
  ],
  alerts: [
    { id: 'l1', severity: 'medium', text: 'Sync to BGC branch took 48s (usually under 10s).', since: '12 min ago' },
    { id: 'l2', severity: 'low', text: 'Barcode scanner 2 has not checked in since yesterday.', since: '1 day' },
  ],
  activity: [
    { id: 'e1', time: '10:42', actor: 'Ana Reyes', summary: 'Received PO-1039 (64 lines)', href: open('inv-central', '/purchase-orders/PO-1039') },
    { id: 'e2', time: '10:15', actor: 'Leda', summary: 'Drafted reorder for 15 items', href: open('inv-central', '/reorder') },
    { id: 'e3', time: '09:58', actor: 'Jun Cruz', summary: 'Adjusted Cooking oil 1L: -12 (damaged)', href: open('inv-central', '/stock/oil-1l') },
    { id: 'e4', time: '09:30', actor: 'System', summary: 'Shared stock with Makati branch', href: open('inv-central', '/connections') },
    { id: 'e5', time: '09:02', actor: 'Ana Reyes', summary: 'Created PO-1042 for Pacific Foods', href: open('inv-central', '/purchase-orders/PO-1042') },
    { id: 'e6', time: '08:47', actor: 'Mila Tan', summary: 'Moved 40 units Rice 25kg to Aisle 2', href: open('inv-central', '/transfers/T-220') },
    { id: 'e7', time: '08:20', actor: 'Jun Cruz', summary: 'Counted Aisle 1 (no variance)', href: open('inv-central', '/counts/C-88') },
    { id: 'e8', time: 'Yesterday', actor: 'Ana Reyes', summary: 'Added supplier Northpoint Trading', href: open('inv-central', '/suppliers/northpoint') },
    { id: 'e9', time: 'Yesterday', actor: 'System', summary: 'Nightly valuation ₱1.84M', href: open('inv-central', '/reports/valuation') },
    { id: 'e10', time: 'Yesterday', actor: 'Mila Tan', summary: 'Archived 6 discontinued items', href: open('inv-central', '/stock?filter=archived') },
  ],
};

const DAVAO: PlatformOverview = {
  id: 'inv-davao',
  label: 'Davao stock',
  kind: 'Inventory',
  icon: Package,
  status: 'degraded',
  updatedAgo: 840,
  lastSync: '14 min ago',
  numbers: [
    { label: 'Low stock', value: '6', hint: 'below reorder point', warn: true },
    { label: 'Out of stock', value: '0', hint: 'of 188 items' },
    { label: 'Open POs', value: '2' },
    { label: 'Stock value', value: '₱612K', hint: 'at cost' },
  ],
  attention: [
    { id: 'a1', severity: 'medium', title: '6 items below reorder point', meta: 'Suggested PO ready to review', href: open('inv-davao', '/reorder') },
  ],
  alerts: [{ id: 'l1', severity: 'high', text: 'Overview provider timed out twice. Numbers may be out of date.', since: '14 min ago' }],
  activity: [
    { id: 'e1', time: '10:20', actor: 'Rico Lim', summary: 'Received PO-0311 (12 lines)', href: open('inv-davao', '/purchase-orders/PO-0311') },
    { id: 'e2', time: '09:05', actor: 'System', summary: 'Shared catalog with BGC branch', href: open('inv-davao', '/connections') },
  ],
};

const REPAIR: PlatformOverview = {
  id: 'sms',
  label: 'Repair shop · Makati',
  kind: 'SMS branch',
  icon: Wrench,
  status: 'active',
  updatedAgo: 9,
  numbers: [
    { label: 'Jobs today', value: '14', hint: '9 in progress' },
    { label: 'Awaiting approval', value: '4', hint: 'quotes sent', warn: true },
    { label: 'Ready for pickup', value: '6', hint: 'customers notified' },
    { label: 'Unpaid', value: '₱23,850', hint: '5 invoices', warn: true },
  ],
  attention: [
    { id: 'a1', severity: 'high', title: 'JO-2291 quote waiting 3 days', meta: 'L. Garcia · iPhone 13 screen · ₱7,200', href: open('sms', '/jobs/JO-2291') },
    { id: 'a2', severity: 'medium', title: '2 jobs past promised date', meta: 'JO-2280, JO-2284', href: open('sms', '/jobs?filter=overdue') },
    { id: 'a3', severity: 'low', title: 'Battery stock low for 2 models', meta: 'Reads parts from Central stock', href: open('sms', '/parts?filter=low') },
  ],
  alerts: [],
  activity: [
    { id: 'e1', time: '10:51', actor: 'Ben Ocampo', summary: 'Marked JO-2295 ready for pickup', href: open('sms', '/jobs/JO-2295') },
    { id: 'e2', time: '10:33', actor: 'Customer', summary: 'Approved quote for JO-2293', href: open('sms', '/jobs/JO-2293') },
    { id: 'e3', time: '10:02', actor: 'Ben Ocampo', summary: 'Opened JO-2296 (laptop, no power)', href: open('sms', '/jobs/JO-2296') },
    { id: 'e4', time: '09:40', actor: 'Leda', summary: 'Sent pickup reminders to 3 customers', href: open('sms', '/jobs?filter=ready') },
    { id: 'e5', time: '09:12', actor: 'Carla Uy', summary: 'Collected ₱4,500 for JO-2279', href: open('sms', '/invoices/INV-771') },
  ],
};

/** Storefront branches on the map are SMS branches in this prototype's data. */
const branch = (id: string, label: string, status: StatusTone, over: Partial<PlatformOverview> = {}): PlatformOverview => ({
  ...REPAIR,
  id,
  label,
  icon: Storefront,
  status,
  attention: REPAIR.attention.map((a) => ({ ...a, href: a.href.replace('/open/sms', `/open/${id}`) })),
  activity: REPAIR.activity.map((e) => ({ ...e, href: e.href.replace('/open/sms', `/open/${id}`) })),
  ...over,
});

export const OVERVIEWS: Record<string, PlatformOverview> = {
  'inv-central': CENTRAL,
  inventory: { ...CENTRAL, id: 'inventory' },
  'inv-davao': DAVAO,
  sms: {
    ...REPAIR,
    status: 'degraded',
    updatedAgo: 300,
    lastSync: '5 min ago',
    alerts: [{ id: 'l1', severity: 'high', text: 'Payments provider is not responding. Unpaid totals may be out of date.', since: '5 min ago' }],
  },
  'st-makati': branch('st-makati', 'Makati branch', 'active'),
  'st-bgc': branch('st-bgc', 'BGC branch', 'active', { updatedAgo: 2, attention: [], alerts: [], activity: [] }),
  'st-cebu': branch('st-cebu', 'Cebu branch', 'offline', { updatedAgo: 7200, lastSync: '2 hours ago' }),
};

/** The overview provider is polled while the modal is open (RDY-212). */
export const REFRESH_SECONDS = 30;
