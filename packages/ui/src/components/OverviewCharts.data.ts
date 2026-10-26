import { chartNumberFormat } from './WeekChart';
import type { OverviewPlatform } from './OverviewCharts';

export const days = ['Fri 16', 'Sat 17', 'Sun 18', 'Mon 19', 'Tue 20', 'Wed 21', 'Thu 22'];
const peso = chartNumberFormat({ locale: 'en-PH', currency: 'PHP' });
const pesoK = chartNumberFormat({ locale: 'en-PH', currency: 'PHP', compact: true });

export const autoWorks: OverviewPlatform = {
  id: 'auto', name: 'Santos Auto Works', kind: 'Auto repair', logo: { index: 1 },
  status: { tone: 'ok', label: 'Running' },
  figure: { value: peso(128400), label: 'revenue' }, sub: '34 jobs, best day Wed 21',
  chart: { title: 'Revenue', note: 'Closed Sundays', labels: days, values: [21800, 24300, null, 17900, 20100, 31200, 13100], format: peso, tickFormat: pesoK, unit: 'revenue' },
  shares: [{ title: 'Open jobs', total: 7, parts: [{ label: 'In progress', value: 4, tone: 'accent' }, { label: 'Waiting for part', value: 2, tone: 'warn' }, { label: 'Late', value: 1, tone: 'bad' }] }],
};
export const stockroom: OverviewPlatform = {
  id: 'stock', name: 'Stockroom', kind: 'Inventory', logo: { index: 2 },
  status: { tone: 'warn', label: 'Slow', since: 'since 9:40 AM' },
  figure: { value: '412', label: 'products' }, sub: '58 units moved, best day Tue 20',
  chart: { kind: 'diverging', title: 'Stock in and out', labels: days, up: [12, 9, 0, 18, 22, 11, 8], down: [8, 14, 0, 10, 16, 19, 6], unit: 'units' },
  shares: [{ title: 'Stock movements', total: 12, parts: [{ label: 'Received', value: 7 }, { label: 'Shipped', value: 5 }] }],
};
export const cafe: OverviewPlatform = {
  id: 'cafe', name: 'Lia’s Cafe', kind: 'Point of sale', logo: { index: 3 },
  status: { tone: 'ok', label: 'Running' },
  figure: { value: '642', label: 'sales' }, sub: 'best day Sat 17, 121',
  chart: { title: 'Sales', labels: days, values: [88, 121, 64, 92, 97, 104, 76], unit: 'sales' },
};
export const hardware: OverviewPlatform = {
  id: 'hw', name: 'Dela Cruz Hardware', kind: 'Point of sale', logo: { index: 4 },
  status: { tone: 'ok', label: 'Running' },
  figure: { value: peso(54200), label: 'revenue' }, sub: 'best day Sat 17',
  chart: { title: 'Revenue', labels: days, values: [6200, 9400, 3100, 7800, 8200, 10100, 9400], format: peso, tickFormat: pesoK, unit: 'revenue' },
};
export const failed: OverviewPlatform = { ...cafe, id: 'cafe-x', state: 'error' };
export const loading: OverviewPlatform = { ...cafe, id: 'cafe-l', state: 'loading' };
export const noHistory: OverviewPlatform = { ...cafe, id: 'cafe-n', name: 'New Branch', chart: null, figure: { value: '0', label: 'sales' }, sub: undefined };
