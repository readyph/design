/**
 * RDY-214 mock data: the shared ConnectionsMap datasets and the Needs attention strip.
 * Kept apart from data.ts so sibling tickets (RDY-215..217) editing data.ts do not conflict.
 */
import { Package, Storefront, Wrench, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import type { StatusTone } from '../../index';

export type PlatformKind = 'Storefront' | 'Inventory' | 'Repair shop';

export interface MapPlatform {
  id: string;
  label: string;
  kind: PlatformKind;
  icon: PhosphorIcon;
  status: StatusTone;
  /** Reads data (left column) or shares data (right column). */
  side: 'consumer' | 'provider';
  /** Open attention items for this platform (badge). */
  attention?: number;
  /** Highest open severity, picks the badge tone. */
  severity?: Severity;
  /** Viewer lacks the platform read permission (e.g. no `read:sms`): name and status only. */
  restricted?: boolean;
  /** A consumer that must read stock but has no source yet. */
  needsSource?: boolean;
}

export interface MapEdge {
  consumerId: string;
  providerId: string;
  /** Capability short name: Stock, Catalog, Parts. */
  capability: string;
}

export interface MapData {
  platforms: MapPlatform[];
  links: MapEdge[];
}

const storefront = (id: string, label: string, status: StatusTone, extra: Partial<MapPlatform> = {}): MapPlatform => ({
  id,
  label,
  kind: 'Storefront',
  icon: Storefront,
  status,
  side: 'consumer',
  ...extra,
});
const repair = (id: string, label: string, status: StatusTone, extra: Partial<MapPlatform> = {}): MapPlatform => ({
  id,
  label,
  kind: 'Repair shop',
  icon: Wrench,
  status,
  side: 'consumer',
  ...extra,
});
const inventory = (id: string, label: string, status: StatusTone, extra: Partial<MapPlatform> = {}): MapPlatform => ({
  id,
  label,
  kind: 'Inventory',
  icon: Package,
  status,
  side: 'provider',
  ...extra,
});

/** Default company: 5 consumers (SMS = one node per branch instance), 2 providers. */
export const MAP_DEFAULT: MapData = {
  platforms: [
    storefront('st-makati', 'Makati branch', 'active', { attention: 1, severity: 'info' }),
    storefront('st-bgc', 'BGC branch', 'active', { attention: 1, severity: 'info' }),
    storefront('st-cebu', 'Cebu branch', 'offline', { attention: 2, severity: 'critical', needsSource: true }),
    repair('sms-makati', 'Repair shop Makati', 'degraded', { attention: 1, severity: 'warning' }),
    repair('sms-cebu', 'Repair shop Cebu', 'active'),
    inventory('inv-central', 'Central stock', 'active', { attention: 3, severity: 'warning' }),
    inventory('inv-davao', 'Davao stock', 'degraded', { attention: 1, severity: 'warning' }),
  ],
  links: [
    { consumerId: 'st-makati', providerId: 'inv-central', capability: 'Stock' },
    { consumerId: 'st-bgc', providerId: 'inv-central', capability: 'Stock' },
    { consumerId: 'st-bgc', providerId: 'inv-davao', capability: 'Catalog' },
    { consumerId: 'sms-makati', providerId: 'inv-central', capability: 'Parts' },
    { consumerId: 'sms-cebu', providerId: 'inv-davao', capability: 'Parts' },
  ],
};

/** Member without `read:sms`: Repair shop nodes show name and status only. */
export const MAP_RESTRICTED: MapData = {
  platforms: MAP_DEFAULT.platforms.map((p) => (p.kind === 'Repair shop' ? { ...p, restricted: true, attention: undefined } : p)),
  links: MAP_DEFAULT.links,
};

/** One platform, nothing to link yet. */
export const MAP_ONE: MapData = {
  platforms: [inventory('inv-central', 'Central stock', 'active')],
  links: [],
};

/** 8+ platforms: 8 consumers, 3 providers. */
export const MAP_MANY: MapData = {
  platforms: [
    storefront('st-makati', 'Makati branch', 'active', { attention: 1, severity: 'info' }),
    storefront('st-bgc', 'BGC branch', 'active'),
    storefront('st-ortigas', 'Ortigas branch', 'active'),
    storefront('st-cebu', 'Cebu branch', 'offline', { attention: 2, severity: 'critical', needsSource: true }),
    storefront('st-iloilo', 'Iloilo branch', 'active', { attention: 1, severity: 'warning' }),
    repair('sms-makati', 'Repair shop Makati', 'degraded', { attention: 1, severity: 'warning' }),
    repair('sms-qc', 'Repair shop QC', 'active'),
    repair('sms-cebu', 'Repair shop Cebu', 'active'),
    inventory('inv-central', 'Central stock', 'active', { attention: 3, severity: 'warning' }),
    inventory('inv-visayas', 'Visayas stock', 'active'),
    inventory('inv-davao', 'Davao stock', 'degraded', { attention: 1, severity: 'warning' }),
  ],
  links: [
    { consumerId: 'st-makati', providerId: 'inv-central', capability: 'Stock' },
    { consumerId: 'st-bgc', providerId: 'inv-central', capability: 'Stock' },
    { consumerId: 'st-ortigas', providerId: 'inv-central', capability: 'Stock' },
    { consumerId: 'st-iloilo', providerId: 'inv-visayas', capability: 'Stock' },
    { consumerId: 'sms-makati', providerId: 'inv-central', capability: 'Parts' },
    { consumerId: 'sms-qc', providerId: 'inv-central', capability: 'Parts' },
    { consumerId: 'sms-cebu', providerId: 'inv-visayas', capability: 'Parts' },
    { consumerId: 'st-bgc', providerId: 'inv-davao', capability: 'Catalog' },
  ],
};

export const MAP_EMPTY: MapData = { platforms: [], links: [] };

/* ------------------------------------------------------- needs attention -- */

export type Severity = 'critical' | 'warning' | 'info';

export interface AttentionItem {
  id: string;
  severity: Severity;
  platformId: string;
  platform: string;
  title: string;
  /** Deep link into the owning platform (`/open/:id`). */
  href: string;
}

const RANK: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

const ALL_ITEMS: AttentionItem[] = [
  { id: 'att-401', severity: 'warning', platformId: 'inv-central', platform: 'Central stock', title: '7 products below reorder level', href: '/open/att-401' },
  { id: 'att-398', severity: 'critical', platformId: 'st-cebu', platform: 'Cebu branch', title: 'Offline since 9:12 AM; web orders are paused', href: '/open/att-398' },
  { id: 'att-402', severity: 'warning', platformId: 'sms-makati', platform: 'Repair shop Makati', title: '3 job orders waiting for parts', href: '/open/att-402' },
  { id: 'att-399', severity: 'critical', platformId: 'st-cebu', platform: 'Cebu branch', title: 'No stock source, so it cannot take orders', href: '/open/att-399' },
  { id: 'att-405', severity: 'warning', platformId: 'inv-davao', platform: 'Davao stock', title: 'Sync is 40 minutes behind', href: '/open/att-405' },
  { id: 'att-403', severity: 'warning', platformId: 'inv-central', platform: 'Central stock', title: '2 stock transfers awaiting approval', href: '/open/att-403' },
  { id: 'att-404', severity: 'warning', platformId: 'inv-central', platform: 'Central stock', title: 'Stock count for Aisle 4 is overdue', href: '/open/att-404' },
  { id: 'att-406', severity: 'info', platformId: 'st-makati', platform: 'Makati branch', title: '12 orders ready for pickup', href: '/open/att-406' },
  { id: 'att-407', severity: 'info', platformId: 'st-bgc', platform: 'BGC branch', title: 'New staff invite not yet accepted', href: '/open/att-407' },
];

/** All open items across platforms, most severe first (stable within a severity). */
export const ATTENTION_ITEMS: AttentionItem[] = [...ALL_ITEMS].sort((a, b) => RANK[a.severity] - RANK[b.severity]);

/** Items when the Repair shop provider is not responding: its rows are missing. */
export const ATTENTION_WITHOUT_SMS = ATTENTION_ITEMS.filter((i) => !i.platformId.startsWith('sms-'));

export const HOME_LEDA_SUGGESTIONS = ['What needs my attention?', 'Why is Cebu branch offline?', 'Summarize this week'];
