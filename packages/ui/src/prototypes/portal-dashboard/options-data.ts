/**
 * RDY-217 mock data for the Home content options. Each block notes the data source it implies,
 * because the owner is choosing partly on what v1 can actually feed.
 */
import type { StatusTone } from '../../index';

export type KpiTone = 'success' | 'error' | 'neutral';

export interface Kpi {
  id: string;
  label: string;
  value: string;
  delta?: string;
  deltaTone?: KpiTone;
  /** Where the number comes from (review note and tooltip-free caption). */
  source: string;
  href: string;
}

/** Option A: one number per platform kind plus approvals. Each needs a small aggregate endpoint. */
export const KPIS: Kpi[] = [
  { id: 'sales', label: 'Sales today', value: 'PHP 84,250', delta: '+9% vs last Tuesday', deltaTone: 'success', source: 'Storefronts', href: '/open/sales' },
  { id: 'jobs', label: 'Open job orders', value: '14', delta: '3 waiting for parts', deltaTone: 'neutral', source: 'Repair shops', href: '/open/jobs' },
  { id: 'low', label: 'Low stock products', value: '7', delta: '2 more than yesterday', deltaTone: 'error', source: 'Inventory', href: '/open/low-stock' },
  { id: 'unpaid', label: 'Unpaid invoices', value: '5', delta: 'PHP 126,400 overdue', deltaTone: 'error', source: 'Storefronts and repair shops', href: '/open/unpaid' },
];

export interface Approval {
  id: string;
  title: string;
  detail: string;
  platform: string;
  requestedBy: string;
  requestedAgo: string;
  /** `leda`: a Leda proposal; Review opens its confirm card in the Leda panel (confirm-before-write unchanged). */
  kind?: 'request' | 'leda';
  /** Result line announced after Approve. */
  approvedNote: string;
}

/** Option B: decisions waiting on the owner. Source: each platform's own approval queue, aggregated. */
export const APPROVALS: Approval[] = [
  { id: 'apr-1', title: 'Stock transfer TR-2201: 40 units to Visayas stock', detail: 'Rebalancing Visayas', platform: 'Central stock', requestedBy: 'Liza Ramos', requestedAgo: '2 days ago', approvedNote: 'Transfer TR-2201 approved.' },
  { id: 'apr-2', title: 'Stock transfer TR-2203: 12 units to Davao stock', detail: 'Rebalancing Davao', platform: 'Central stock', requestedBy: 'Liza Ramos', requestedAgo: '1 day ago', approvedNote: 'Transfer TR-2203 approved.' },
  { id: 'apr-3', title: 'Purchase order PO-1042 for PHP 48,200', detail: 'Supplier: Mega Parts Trading', platform: 'Central stock', requestedBy: 'Joel Cruz', requestedAgo: '5 hours ago', approvedNote: 'Purchase order PO-1042 approved.' },
  { id: 'apr-4', title: 'Repair quote Q-0457: screen replacement, PHP 4,800', detail: 'Customer: Dela Cruz', platform: 'Repair shop Makati', requestedBy: 'Ana Reyes', requestedAgo: '35 minutes ago', approvedNote: 'Quote Q-0457 approved and sent to the customer.' },
  { id: 'apr-5', title: 'Leda proposes a reorder draft for 7 low stock products', detail: 'Draft purchase order, PHP 31,500', platform: 'Central stock', requestedBy: 'Leda', requestedAgo: '10 minutes ago', kind: 'leda', approvedNote: '' },
];

export interface ActivityEvent {
  id: string;
  actor: string;
  /** Plain sentence after the actor. */
  text: string;
  platform: string;
  status?: StatusTone;
  ago: string;
  href: string;
}

/** Option D: needs a cross-platform activity feed API (merged, time-ordered events). Not in v1. */
export const ACTIVITY: ActivityEvent[] = [
  { id: 'ev-1', actor: 'Ana Reyes', text: 'requested a 15% discount on job JO-3391', platform: 'Repair shop Makati', ago: '35 min ago', href: '/open/ev-1' },
  { id: 'ev-2', actor: 'Cebu branch', text: 'went offline; web orders are paused', platform: 'Cebu branch', status: 'offline', ago: '2 hours ago', href: '/open/ev-2' },
  { id: 'ev-3', actor: 'Joel Cruz', text: 'created purchase order PO-1042', platform: 'Central stock', ago: '5 hours ago', href: '/open/ev-3' },
  { id: 'ev-4', actor: 'Makati branch', text: 'received 12 new orders', platform: 'Makati branch', ago: '6 hours ago', href: '/open/ev-4' },
  { id: 'ev-5', actor: 'Liza Ramos', text: 'counted Aisle 3: 2 variances found', platform: 'Central stock', ago: 'Yesterday, 4:40 PM', href: '/open/ev-5' },
  { id: 'ev-6', actor: 'You', text: 'connected Davao stock to BGC branch for Catalog', platform: 'Davao stock', ago: 'Yesterday, 11:02 AM', href: '/open/ev-6' },
];

export const OPTION_LEDA_SUGGESTIONS = {
  kpi: ['What needs my attention?', 'Why are sales up today?', 'Which products should I reorder?'],
  approvals: ['What needs my approval?', 'Is PO-1042 a normal amount?', 'What needs my attention?'],
  activity: ['What happened today?', 'Why is Cebu branch offline?', 'What needs my attention?'],
} as const;
