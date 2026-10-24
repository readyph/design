/**
 * Mock data for the RDY-212 Portal dashboard prototypes (shell first, RDY-213).
 * Pages in RDY-214..217 reuse this file and the shell in `DashboardShell.tsx`.
 */
import {
  House,
  ChartBar,
  Users,
  SquaresFour,
  BookOpen,
  Gear,
  Package,
  Wrench,
  Storefront,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import type { StatusTone } from '../../index';

export const COMPANY = 'Sunrise Groceries';
export const USER = { name: 'Maria Santos', email: 'maria@readyph.com' };

export type PortalNavKey = 'home' | 'reports' | 'team' | 'platforms' | 'memory' | 'settings';

export interface PortalNavLink {
  key: PortalNavKey;
  label: string;
  icon: PhosphorIcon;
  /** Real app route (for Mark). */
  route: string;
  /** Team/admin-only links are hidden for members. */
  adminOnly?: boolean;
  /** `settings` links render under the Settings heading. */
  group: 'main' | 'settings';
  badge?: number;
}

/** Every link from today's Portal sidebar, in sidebar order. */
export const NAV_LINKS: PortalNavLink[] = [
  { key: 'home', label: 'Home', icon: House, route: '/', group: 'main' },
  { key: 'reports', label: 'Reports', icon: ChartBar, route: '/reports', group: 'main' },
  { key: 'team', label: 'Team', icon: Users, route: '/team', group: 'main', adminOnly: true, badge: 8 },
  { key: 'platforms', label: 'Platforms', icon: SquaresFour, route: '/platforms', group: 'main' },
  { key: 'memory', label: 'Memory', icon: BookOpen, route: '/memory', group: 'main' },
  { key: 'settings', label: 'Company', icon: Gear, route: '/settings', group: 'settings', adminOnly: true },
];

export function linksFor(member: boolean): PortalNavLink[] {
  return member ? NAV_LINKS.filter((l) => !l.adminOnly) : NAV_LINKS;
}

export interface RailPlatform {
  id: string;
  label: string;
  icon: PhosphorIcon;
  status: StatusTone;
}

export const PLATFORMS: RailPlatform[] = [
  { id: 'inventory', label: 'Inventory', icon: Package, status: 'active' },
  { id: 'sms', label: 'Repair shop', icon: Wrench, status: 'degraded' },
];

/** Page context Leda receives from the current page (shown as a chip in the panel header). */
export const PAGE_CONTEXT: Record<PortalNavKey, string> = {
  home: 'dashboard',
  reports: 'reports',
  team: 'team',
  platforms: 'platforms',
  memory: 'memory',
  settings: 'company settings',
};

export const LEDA_SUGGESTIONS = [
  'What needs my attention today?',
  'How did Inventory do this week?',
  'Why is Repair shop degraded?',
];

/** localStorage key and values agreed in the epic (RDY-212). */
export const LEDA_PANEL_KEY = 'readyph.leda_panel';

/* ------------------------------------------------ platform connections -- */
/* Same model as the Platforms page Connections view (patterns/portal/Platforms):
 * consumers read a capability from one provider; one provider serves many. */

export interface MapInstance {
  id: string;
  label: string;
  kind: 'Storefront' | 'Inventory';
  icon: PhosphorIcon;
  status: StatusTone;
}

export interface MapLink {
  consumerId: string;
  providerId: string;
  /** Capability short name, e.g. Stock (inventory.stock). */
  capability: string;
}

export const MAP_CONSUMERS: MapInstance[] = [
  { id: 'st-makati', label: 'Makati branch', kind: 'Storefront', icon: Storefront, status: 'active' },
  { id: 'st-bgc', label: 'BGC branch', kind: 'Storefront', icon: Storefront, status: 'active' },
  { id: 'st-cebu', label: 'Cebu branch', kind: 'Storefront', icon: Storefront, status: 'offline' },
];

export const MAP_PROVIDERS: MapInstance[] = [
  { id: 'inv-central', label: 'Central stock', kind: 'Inventory', icon: Package, status: 'active' },
  { id: 'inv-davao', label: 'Davao stock', kind: 'Inventory', icon: Package, status: 'degraded' },
];

export const MAP_LINKS: MapLink[] = [
  { consumerId: 'st-makati', providerId: 'inv-central', capability: 'Stock' },
  { consumerId: 'st-bgc', providerId: 'inv-central', capability: 'Stock' },
  { consumerId: 'st-bgc', providerId: 'inv-davao', capability: 'Catalog' },
];
