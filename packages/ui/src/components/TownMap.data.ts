import type { TownMapLink, TownMapPlatform, TownMapSlot } from './TownMap';

export const hq: TownMapPlatform = { id: 'hq', name: 'HQ', kind: 'Team and plan', status: 'ACTIVE', hq: true, count: 1 };
export const stockroom: TownMapPlatform = { id: 'stockroom', name: 'Main Stockroom', shortName: 'Stockroom', kind: 'Inventory', mapType: 'warehouse', status: 'ACTIVE', index: 1, count: 2 };
export const autoWorks: TownMapPlatform = { id: 'autoworks', name: 'Auto Works Quezon City', shortName: 'Auto Works', kind: 'Repair shop', mapType: 'service', status: 'DEGRADED', statusSince: '10:12 AM', index: 2 };
export const cafe: TownMapPlatform = { id: 'cafe', name: 'Café POS', shortName: 'Café', kind: 'Point of sale', mapType: 'store', status: 'ACTIVE', index: 3 };
export const books: TownMapPlatform = { id: 'books', name: 'Bookshop Loyalty', shortName: 'Books', kind: 'Books', status: 'OFFLINE', index: 4 };
export const longName: TownMapPlatform = { id: 'long', name: 'Southern Luzon Regional Distribution Centre and Cross-dock Warehouse', shortName: 'Southern Luzon Distribution', kind: 'Inventory', mapType: 'warehouse', status: 'ACTIVE', index: 5 };

export const two: TownMapSlot[] = [stockroom, autoWorks, hq, null];
export const three: TownMapSlot[] = [stockroom, autoWorks, cafe, hq];
export const eight: TownMapSlot[] = [
  hq,
  stockroom,
  autoWorks,
  cafe,
  books,
  { ...stockroom, id: 's2', name: 'Cebu Parts Stockroom', shortName: 'Cebu Parts', status: 'OFFLINE', index: 6, count: 0 },
  { ...cafe, id: 'c2', name: 'Makati Café', shortName: 'Makati', index: 7, count: 3 },
  { ...autoWorks, id: 'a2', name: 'Cubao Repair Shop', shortName: 'Cubao', status: 'ACTIVE', statusSince: undefined, index: 8 },
];
export const twoLinks: TownMapLink[] = [{ from: 'stockroom', to: 'autoworks', status: 'slow' }];
export const threeLinks: TownMapLink[] = [
  { from: 'stockroom', to: 'autoworks', status: 'slow' },
  { from: 'stockroom', to: 'cafe', status: 'ok' },
  { from: 'cafe', to: 'hq', status: 'broken' },
];
export const eightLinks: TownMapLink[] = [
  { from: 'stockroom', to: 'autoworks', status: 'ok' },
  { from: 'stockroom', to: 'cafe', status: 'slow' },
  { from: 's2', to: 'c2', status: 'broken' },
  { from: 'a2', to: 'stockroom', status: 'ok' },
];
