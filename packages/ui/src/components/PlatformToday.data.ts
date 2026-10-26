import type { PlatformTodayProps, TodayList } from './PlatformToday';

/** Sample data for the PlatformToday stories and tests. Not exported from the package. */
export const autoWorks: PlatformTodayProps['platform'] = { name: 'Auto Works Quezon City', index: 1 };
export const stockroom: PlatformTodayProps['platform'] = { name: 'Cebu Parts Stockroom', index: 2 };
export const cafe: PlatformTodayProps['platform'] = { name: 'Café POS', index: 3 };

export const jobs: TodayList = {
  id: 'jobs',
  title: 'Open jobs',
  total: 7,
  items: [
    {
      id: 'jo412',
      ref: 'JO-0412',
      title: 'Alternator replacement, Toyota Vios',
      detail: 'Promised 11:00 AM · Mang Ben',
      state: 'Waiting for part',
      tone: 'warn',
      at: '9:40 AM',
      link: { platform: stockroom, ref: 'ALT-NCP150', text: '0 on hand · PO-0221 draft', onSelect: () => {} },
    },
    { id: 'jo413', ref: 'JO-0413', title: 'Oil change and filter', detail: 'Mitsubishi Mirage · Ana Cruz', state: 'In progress', tone: 'accent', at: '10:05 AM' },
    { id: 'jo414', ref: 'JO-0414', title: 'Brake pads, front', state: 'Ready', tone: 'ok', qty: '1 set', at: '10:30 AM' },
    { id: 'jo415', ref: 'JO-0415', title: 'Aircon check', state: 'Queued', at: '11:15 AM' },
  ],
};

export const stock: TodayList = {
  id: 'stock',
  title: 'Stock movements',
  total: 12,
  items: [
    { id: 'm1', title: 'ALT-NCP150 Alternator 12V', detail: 'Out to Auto Works Quezon City', state: 'Out', tone: 'bad', qty: '2 pcs', at: '9:12 AM' },
    { id: 'm2', title: 'FLT-OIL-33 Oil filter', detail: 'In from supplier', state: 'In', tone: 'ok', qty: '40 pcs', at: '8:30 AM' },
    { id: 'm3', title: 'PAD-FR-77 Brake pads', state: 'Out', tone: 'bad', qty: '6 pcs', at: '8:05 AM' },
    { id: 'm4', title: 'BLB-H4 Headlamp bulb', state: 'Out', tone: 'bad', qty: '10 pcs', at: '7:55 AM' },
  ],
};

export const longName: PlatformTodayProps['platform'] = {
  name: 'Southern Luzon Regional Distribution and Fulfilment Centre of Ready Parts Incorporated',
  index: 4,
};

export const unbreakable = 'SUPERCALIFRAGILISTICEXPIALIDOCIOUS-0000000000000000000000000000-REF';
