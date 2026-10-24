/**
 * PROTOTYPE data (RDY-178). Mirrors the shapes the Portal renders today
 * (portal `src/modules/platforms`, `src/modules/team`); no functional change.
 */
import {
  Calculator,
  DeviceMobile,
  Gift,
  Package,
  Storefront,
  Truck,
  Wrench,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';

/* --------------------------------------------------------------- platforms */

export type PlatformStatus = 'active' | 'degraded' | 'offline';

export interface Requirement {
  capability: string;
  required: boolean;
}

export interface Instance {
  id: string;
  kind: 'inventory' | 'sms';
  label: string;
  status: PlatformStatus;
  version: string | null;
  host: string | null;
  lastSync: string;
  metrics: string;
  alerts: string[];
  provides: string[];
  requires: Requirement[];
}

export interface DataLink {
  id: string;
  consumerId: string;
  capability: string;
  providerId: string;
}

export const KIND: Record<Instance['kind'], { label: string; group: string; icon: PhosphorIcon }> = {
  inventory: { label: 'Inventory', group: 'Inventory', icon: Package },
  sms: { label: 'Service Management System', group: 'Service Management System (SMS)', icon: Wrench },
};

export const CAP: Record<string, { title: string; short: string; shares: string }> = {
  'inventory.stock': { title: 'Inventory · Stock', short: 'Stock', shares: 'Products, stock levels and movements.' },
  'inventory.catalog': { title: 'Inventory · Catalog', short: 'Catalog', shares: 'Product catalog and pricing.' },
};

const SMS_REQUIRES: Requirement[] = [{ capability: 'inventory.stock', required: true }];
const INV_PROVIDES = ['inventory.stock', 'inventory.catalog'];

export const SEED_INSTANCES: Instance[] = [
  {
    id: 'inv-central',
    kind: 'inventory',
    label: 'Central stock',
    status: 'active',
    version: '2.4.1',
    host: 'stock.acmemotors.ph',
    lastSync: 'Just now',
    metrics: '412 products · 7 low stock',
    alerts: [],
    provides: INV_PROVIDES,
    requires: [],
  },
  {
    id: 'inv-davao',
    kind: 'inventory',
    label: 'Davao stock',
    status: 'active',
    version: '2.4.1',
    host: 'davao-stock.acmemotors.ph',
    lastSync: '4 min ago',
    metrics: '88 products · 1 low stock',
    alerts: [],
    provides: INV_PROVIDES,
    requires: [],
  },
  {
    id: 'sms-makati',
    kind: 'sms',
    label: 'Makati branch',
    status: 'degraded',
    version: '0.9.4',
    host: 'makati.acmemotors.ph',
    lastSync: '41 min ago',
    metrics: '18 open jobs · 4 quotations',
    alerts: ['3 sync errors since 09:40', 'Stock levels may be out of date'],
    provides: [],
    requires: SMS_REQUIRES,
  },
  {
    id: 'sms-bgc',
    kind: 'sms',
    label: 'BGC branch',
    status: 'active',
    version: '0.9.4',
    host: 'bgc.acmemotors.ph',
    lastSync: '2 min ago',
    metrics: '11 open jobs · 2 quotations',
    alerts: [],
    provides: [],
    requires: SMS_REQUIRES,
  },
  {
    id: 'sms-cebu',
    kind: 'sms',
    label: 'Cebu branch',
    status: 'offline',
    version: null,
    host: null,
    lastSync: 'Never',
    metrics: 'Offline, no activity yet',
    alerts: [],
    provides: [],
    requires: SMS_REQUIRES,
  },
];

export const SEED_LINKS: DataLink[] = [
  { id: 'l1', consumerId: 'sms-makati', capability: 'inventory.stock', providerId: 'inv-central' },
  { id: 'l2', consumerId: 'sms-bgc', capability: 'inventory.stock', providerId: 'inv-central' },
];

export interface CatalogEntry {
  id: string;
  kind?: Instance['kind'];
  name: string;
  icon: PhosphorIcon;
  category: string;
  description: string;
  comingSoon?: boolean;
}

export const CATALOG: CatalogEntry[] = [
  { id: 'inventory', kind: 'inventory', name: 'Inventory', icon: Package, category: 'Operations', description: 'Products, stock levels and movements.' },
  { id: 'sms', kind: 'sms', name: 'Service Management System (SMS)', icon: Wrench, category: 'Operations', description: 'Job orders, quotations and mechanics for a service branch.' },
  { id: 'storefront', name: 'Storefront', icon: Storefront, category: 'Sales', description: 'An online store for web orders.', comingSoon: true },
  { id: 'mobile', name: 'Mobile app', icon: DeviceMobile, category: 'Sales', description: 'Your branded customer app for orders and messages.', comingSoon: true },
  { id: 'accounting', name: 'Accounting', icon: Calculator, category: 'Finance', description: 'Sync sales and expenses to your books.', comingSoon: true },
  { id: 'delivery', name: 'Delivery', icon: Truck, category: 'Operations', description: 'Assign riders and track drop-offs.', comingSoon: true },
  { id: 'loyalty', name: 'Loyalty', icon: Gift, category: 'Growth', description: 'Points and rewards for repeat customers.', comingSoon: true },
];

/* -------------------------------------------------------------------- team */

export type MemberStatus = 'ACTIVE' | 'SUSPENDED';

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: MemberStatus;
  lastActive: string;
  creator?: boolean;
  you?: boolean;
}

export const ME_ID = 'm1';

export const SEED_MEMBERS: Member[] = [
  { id: 'm1', name: 'Earvin Gemenez', email: 'earvin@acmemotors.ph', role: 'admin', status: 'ACTIVE', lastActive: 'just now', creator: true, you: true },
  { id: 'm2', name: 'John Lim', email: 'john@acmemotors.ph', role: 'admin', status: 'ACTIVE', lastActive: '2h ago' },
  { id: 'm3', name: 'Ana Reyes', email: 'ana@acmemotors.ph', role: 'manager', status: 'ACTIVE', lastActive: 'yesterday' },
  { id: 'm4', name: 'Paolo Cruz', email: 'paolo@acmemotors.ph', role: 'mechanic', status: 'ACTIVE', lastActive: '3d ago' },
  { id: 'm5', name: 'Bea Villanueva', email: 'bea@acmemotors.ph', role: 'user', status: 'ACTIVE', lastActive: '5d ago' },
  { id: 'm6', name: 'Lea Dizon', email: 'lea@acmemotors.ph', role: 'mechanic', status: 'SUSPENDED', lastActive: '2w ago' },
];

export interface Invite {
  id: string;
  email: string;
  role: string;
  sent: string;
  expired?: boolean;
}

export const SEED_INVITES: Invite[] = [
  { id: 'i1', email: 'carlo@acmemotors.ph', role: 'mechanic', sent: '1d ago' },
  { id: 'i2', email: 'nina@acmemotors.ph', role: 'manager', sent: '9d ago', expired: true },
];

export interface Role {
  name: string;
  description: string;
}

export const ROLES: Role[] = [
  { name: 'admin', description: 'Full access: platforms, team, billing and settings.' },
  { name: 'manager', description: 'Runs operations and manages Service Management System (SMS); no billing or team removal.' },
  { name: 'user', description: 'Day-to-day work on the platforms their role allows.' },
  { name: 'mechanic', description: 'Works SMS jobs assigned to them.' },
];

export const SMS_ACCESS = [
  'View Service Management System (SMS) (read:sms)',
  'Manage Service Management System (SMS) (write:sms)',
  'Work SMS jobs (mechanic) (work:sms)',
];

/** `admin` shows as "Administrator"; others title-cased (portal `roleLabel`). */
export function roleLabel(name: string): string {
  if (name === 'admin') return 'Administrator';
  return name.charAt(0).toUpperCase() + name.slice(1);
}
