/**
 * PROTOTYPE data (RDY-179). Shapes follow the API: `ReportResponse` (id, title, kind, summary,
 * data { kpis, series, rows }, updated_at) and `MemoryResponse` (id, title, content, version,
 * updated_at). Values mirror `api/scripts/seed_dev.py` so the page reads like the real tenant.
 */

export interface ReportKpi {
  label: string;
  value: string;
}

export type ReportRow = Record<string, string | number | null>;

export interface Report {
  id: string;
  title: string;
  kind: string;
  summary: string | null;
  updated: string;
  data: { kpis?: ReportKpi[]; series?: number[]; rows?: ReportRow[] };
}

export const reports: Report[] = [
  {
    id: 'weekly-sales',
    title: 'Weekly sales',
    kind: 'sales',
    summary: 'Revenue, orders and average order value for this week.',
    updated: '2h ago',
    data: {
      kpis: [
        { label: 'Revenue', value: '₱487k' },
        { label: 'Orders', value: '388' },
        { label: 'Avg order', value: '₱1,255' },
      ],
      series: [120, 150, 130, 180, 160, 210, 250],
      rows: [
        { branch: 'Makati', orders: 142, revenue: '₱186k', share: '38%' },
        { branch: 'Quezon City', orders: 118, revenue: '₱151k', share: '31%' },
        { branch: 'Pasig', orders: 97, revenue: '₱122k', share: '25%' },
        { branch: 'Taguig', orders: 31, revenue: '₱28k', share: '6%' },
      ],
    },
  },
  {
    id: 'low-stock',
    title: 'Low stock',
    kind: 'inventory',
    summary: 'Products below their reorder point.',
    updated: '5h ago',
    data: {
      kpis: [{ label: 'Below reorder', value: '7' }],
      rows: [
        { product: 'Calamansi 1kg', sku: 'FRT-014', stock: 18 },
        { product: 'Mango boxes', sku: 'FRT-022', stock: 0 },
        { product: 'Pomelo pack', sku: 'FRT-030', stock: 9 },
      ],
    },
  },
  {
    id: 'customer-growth',
    title: 'Customer growth',
    kind: 'customers',
    summary: 'New vs returning customers over 7 days.',
    updated: '1d ago',
    data: {
      kpis: [{ label: 'Customers', value: '342' }],
      series: [300, 310, 305, 320, 330, 335, 342],
    },
  },
  {
    id: 'service-jobs',
    title: 'Service jobs this month',
    kind: 'service',
    summary: 'Jobs opened, closed and still waiting on parts, by branch.',
    updated: '3d ago',
    data: {
      kpis: [
        { label: 'Opened', value: '126' },
        { label: 'Closed', value: '108' },
        { label: 'Waiting on parts', value: '11' },
        { label: 'Avg turnaround', value: '2.4 days' },
      ],
      series: [22, 31, 28, 45],
      rows: [
        { branch: 'Makati', opened: 58, closed: 52, waiting: 4 },
        { branch: 'Quezon City', opened: 41, closed: 35, waiting: 5 },
        { branch: 'Pasig', opened: 27, closed: 21, waiting: 2 },
      ],
    },
  },
  {
    id: 'draft',
    title: 'Q4 planning (draft)',
    kind: 'custom',
    summary: null,
    updated: '1w ago',
    data: {},
  },
];

export const kindLabel: Record<string, string> = {
  sales: 'Sales',
  inventory: 'Inventory',
  customers: 'Customers',
  service: 'Service',
  custom: 'Custom',
};

/** `total_sales` -> `Total sales` (same rule as the Portal's `humanize`, sentence case). */
export function humanize(key: string): string {
  const s = key.replace(/[_-]+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function isNumeric(value: unknown): boolean {
  if (typeof value === 'number') return true;
  if (typeof value !== 'string') return false;
  return /^[\s₱$+-]*[\d.,]+\s*[kKmM%]?$/.test(value.trim());
}

/** "3 KPIs · Trend · 4 rows" - what a report contains, shown in the list. */
export function contentsOf(r: Report): string {
  const parts: string[] = [];
  const k = r.data.kpis?.length ?? 0;
  if (k) parts.push(`${k} ${k === 1 ? 'KPI' : 'KPIs'}`);
  if ((r.data.series?.length ?? 0) > 1) parts.push('Trend');
  const n = r.data.rows?.length ?? 0;
  if (n) parts.push(`${n} ${n === 1 ? 'row' : 'rows'}`);
  return parts.length ? parts.join(' · ') : 'Empty';
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  version: number;
  updated: string;
}

export const memories: Memory[] = [
  {
    id: 'hours',
    title: 'Opening hours',
    content:
      'Monday to Saturday, 08:00 to 20:00. Closed on Sundays and public holidays.\n\nDuring Holy Week we close from Maundy Thursday to Easter Sunday. Customers can still book online; bookings are confirmed the next working day.',
    version: 3,
    updated: '2d ago',
  },
  {
    id: 'returns',
    title: 'Returns and refunds',
    content:
      'Items can be returned within 7 days with a receipt. Perishables are not returnable unless spoiled on delivery.\n\nRefunds go back to the original payment method. GCash refunds take 1 to 3 working days.',
    version: 5,
    updated: '4d ago',
  },
  {
    id: 'branches',
    title: 'Branches and contacts',
    content:
      'Makati (main): 0917 555 0101, Chino Roces Ave.\nQuezon City: 0917 555 0102, Tomas Morato.\nPasig: 0917 555 0103, Kapitolyo.\nTaguig: 0917 555 0104, BGC 7th Ave.',
    version: 2,
    updated: '1w ago',
  },
  {
    id: 'warranty',
    title: 'Service warranty',
    content:
      'Labour is guaranteed for 30 days or 1,000 km, whichever comes first. Parts follow the supplier warranty. Mechanics must log the warranty end date on the job.',
    version: 1,
    updated: '2w ago',
  },
  {
    id: 'delivery',
    title: 'Delivery areas and fees',
    content:
      'Free delivery within 5 km of a branch for orders over ₱1,500. Otherwise ₱80 within Metro Manila. No delivery outside Metro Manila yet.',
    version: 4,
    updated: '3w ago',
  },
  {
    id: 'tone',
    title: 'How we talk to customers',
    content:
      'Friendly and short. Use Taglish if the customer does. Never promise a delivery time that a branch has not confirmed.',
    version: 1,
    updated: '1mo ago',
  },
];
