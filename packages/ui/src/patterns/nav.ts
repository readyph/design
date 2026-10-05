/**
 * Navigation manifest for the pattern prototypes.
 *
 * This is the single source of truth for "which nav item goes where". Each
 * destination declares the **real application route** it maps to (`route`) and
 * the Storybook story id (`storyId`) that lets the prototype nav click through.
 *
 * When this is built into the real app, `route` is the path to wire into the
 * router — no need to reverse-engineer it from the layouts.
 */
import {
  House,
  ChartBar,
  Users,
  SquaresFour,
  BookOpen,
  Gear,
  Gauge,
  Package,
  ArrowsLeftRight,
  Receipt,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';

export interface NavDest {
  key: string;
  label: string;
  icon: PhosphorIcon;
  /** Intended application route this nav item maps to. */
  route: string;
  /** Storybook story id, so the prototype nav actually clicks through. */
  storyId: string;
  badge?: number;
}

export const portalNav: NavDest[] = [
  { key: 'home', label: 'Home', icon: House, route: '/', storyId: 'portal-dashboard--dashboard' },
  { key: 'reports', label: 'Reports', icon: ChartBar, route: '/reports', storyId: 'portal-reports--reports' },
  { key: 'team', label: 'Team', icon: Users, route: '/team', storyId: 'portal-team--team', badge: 8 },
  { key: 'platforms', label: 'Platforms', icon: SquaresFour, route: '/platforms', storyId: 'portal-platforms--platforms' },
  { key: 'memory', label: 'Memory', icon: BookOpen, route: '/memory', storyId: 'portal-memory--memory' },
  { key: 'settings', label: 'Company', icon: Gear, route: '/settings', storyId: 'portal-settings--settings' },
];

export const inventoryNav: NavDest[] = [
  { key: 'dashboard', label: 'Dashboard', icon: Gauge, route: '/inventory', storyId: 'inventory-dashboard--dashboard' },
  { key: 'products', label: 'Products', icon: Package, route: '/inventory/products', storyId: 'inventory-products--products' },
  { key: 'movements', label: 'Stock & Movements', icon: ArrowsLeftRight, route: '/inventory/movements', storyId: 'inventory-stock-movements--movements' },
  { key: 'purchase-orders', label: 'Purchase Orders', icon: Receipt, route: '/inventory/purchase-orders', storyId: 'inventory-purchase-orders--list', badge: 3 },
  { key: 'reports', label: 'Reports', icon: ChartBar, route: '/inventory/reports', storyId: 'inventory-reports--reports' },
  { key: 'settings', label: 'Settings', icon: Gear, route: '/inventory/settings', storyId: 'inventory-settings--settings' },
];

/** Named story ids used for cross-flow links (back buttons, row clicks, rail). */
export const routes = {
  portalHome: 'portal-dashboard--dashboard',
  portalForgot: 'portal-auth--forgot-password',
  portalForgotSent: 'portal-auth--forgot-password-sent',
  portalReset: 'portal-auth--reset-password',
  portalResetDone: 'portal-auth--reset-password-done',
  portalResetExpired: 'portal-auth--reset-link-expired',
  inventoryHome: 'inventory-dashboard--dashboard',
  inventoryProducts: 'inventory-products--products',
  inventoryMovements: 'inventory-stock-movements--movements',
  inventoryPoList: 'inventory-purchase-orders--list',
  inventoryPoDetail: 'inventory-purchase-orders--detail',
  inventoryPoExtract: 'inventory-purchase-orders--extract',
} as const;

/**
 * Navigate the Storybook preview to another story. Dependency-free: it uses
 * Storybook's own `?path=/story/<id>` deep link. No-ops outside Storybook.
 */
export function goToStory(storyId: string): void {
  try {
    const top = window.top ?? window;
    const url = new URL(top.location.href);
    url.searchParams.set('path', `/story/${storyId}`);
    top.location.href = url.toString();
  } catch {
    /* no-op outside a Storybook iframe */
  }
}
