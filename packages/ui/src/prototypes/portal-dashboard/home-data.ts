/**
 * RDY-214 mock data: the shared ConnectionsMap datasets (Needs attention data removed in revision 2).
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

/* ------------------------------------------------------------- leda hooks -- */

export type Severity = 'critical' | 'warning' | 'info';

export const HOME_LEDA_SUGGESTIONS = ['What needs my attention?', 'Why is Cebu branch offline?', 'Summarize this week'];
