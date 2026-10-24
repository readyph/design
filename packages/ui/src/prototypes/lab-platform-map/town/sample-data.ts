/** PROTOTYPE (RDY-224) - sample tenants for the Lab platform town (shape of `GET /platforms` + `/platforms/graph`). */

export const THREE: TownBuilding[] = [
  { id: 'inv', label: 'Warehouse', kind: 'inventory', status: 'ACTIVE', alerts: 0 },
  { id: 'sms', label: 'Service Shop', kind: 'sms', status: 'OFFLINE', alerts: 0 },
  { id: 'pos', label: 'Store', kind: 'pos', status: 'ACTIVE', alerts: 2 },
];
export const THREE_LINKS: TownLink[] = [
  { from: 'inv', to: 'sms' }, { from: 'inv', to: 'pos' }, { from: 'sms', to: 'pos' },
];

import type { TownBuilding, TownLink } from '../TownScene';

export const MIXED: TownBuilding[] = [
  { id: 'inv-davao', label: 'Davao warehouse', kind: 'inventory', status: 'ACTIVE', alerts: 0 },
  { id: 'inv-cebu', label: 'Cebu warehouse', kind: 'inventory', status: 'DEGRADED', alerts: 3 },
  { id: 'sms-davao', label: 'Davao service', kind: 'sms', status: 'ACTIVE', alerts: 1 },
  { id: 'sms-makati', label: 'Makati service center', kind: 'sms', status: 'OFFLINE', alerts: 0 },
  { id: 'pos-ortigas', label: 'Ortigas kiosk', kind: 'pos', status: 'ACTIVE', alerts: 0 },
];

/** Includes a reversed duplicate and a self-link: both must collapse to the two roads. */
export const MIXED_LINKS: TownLink[] = [
  { from: 'inv-davao', to: 'sms-davao' },
  { from: 'sms-davao', to: 'inv-davao' },
  { from: 'inv-cebu', to: 'sms-makati' },
  { from: 'pos-ortigas', to: 'pos-ortigas' },
];

export const SINGLE: TownBuilding[] = [{ id: 'inv-main', label: 'Main warehouse', kind: 'inventory', status: 'ACTIVE', alerts: 0 }];

const CITIES = ['Davao', 'Cebu', 'Makati', 'Ortigas', 'Iloilo', 'Baguio', 'Bacolod', 'Tagum', 'Pasig', 'Taguig'];
const STATUSES = ['ACTIVE', 'ACTIVE', 'DEGRADED', 'ACTIVE', 'OFFLINE'] as const;

/** 20 buildings: 8 warehouses, 8 shops, 4 stores, with roads between each city's pair. */
export const TWENTY: TownBuilding[] = Array.from({ length: 20 }, (_, i) => {
  const kind = i < 8 ? 'inventory' : i < 16 ? 'sms' : 'storefront';
  const city = CITIES[i % CITIES.length];
  const noun = kind === 'inventory' ? 'warehouse' : kind === 'sms' ? 'service' : 'store';
  return { id: `p${i}`, label: `${city} ${noun}`, kind, status: STATUSES[i % STATUSES.length], alerts: i % 6 === 2 ? (i % 4) + 1 : i === 11 ? 14 : 0 };
});

export const TWENTY_LINKS: TownLink[] = Array.from({ length: 8 }, (_, i) => ({ from: `p${i}`, to: `p${i + 8}` }));
