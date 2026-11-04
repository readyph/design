import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ServiceCard, ServicesTable } from './ServicesTable';
import { BulkBar, ServicesToolbar } from './ServicesToolbar';
import { NO_FILTERS, VIEWS, describe as describeFilters, matches, partsFor, type ViewId } from './sms/servicesModel';
import { ServicesDataProvider, buildServicesApi, type ServicesSource } from './sms/servicesSource';
import type { Job } from './sms/data';

afterEach(cleanup);
const noop = () => {};

// Ids that exist nowhere in sms/data.ts: everything below must resolve through the host source.
const host: ServicesSource = {
  now: '2027-03-15T09:00:00+08:00',
  customers: [{ id: 'api-c1', name: 'Lorna Bautista', phone: '0917 555 0101', since: '2026-01-01', vehicles: [{ id: 'api-v1', plate: 'ZQX 9081', make: 'Mazda', model: 'CX-5', year: 2021, kind: 'car' }] }],
  products: [{ id: 'api-p1', sku: 'OIL-9', name: 'Synthetic oil 5W-30', unit: 'L', price: 450, reorder: 4, locations: [{ name: 'Main', qty: 1, thisBranch: true }] }],
  mechanics: [{ id: 'api-m1', name: 'Dennis Ocampo', short: 'Dennis', initials: 'DO', bay: 'Bay 7' }],
};
const job = (over: Partial<Job> = {}): Job => ({
  id: 'api-j1', number: 'JO-9001', status: 'IN_PROGRESS', customerId: 'api-c1', vehicleId: 'api-v1', assigneeId: 'api-m1',
  createdAt: '2027-03-15T08:00:00+08:00', statusSince: '2027-03-15T08:30:00+08:00', promisedAt: '2027-03-15T15:00:00+08:00', complaint: 'Oil change',
  services: [{ name: 'Oil change', price: 800, qty: 1, done: false }], parts: [{ productId: 'api-p1', qty: 3, issued: 0 }], payments: [], ...over,
});
const wrap = (ui: React.ReactNode) => <ServicesDataProvider data={host}>{ui}</ServicesDataProvider>;

describe('Services list with host data', () => {
  it('renders a table row and a card from host customers, vehicles, mechanics and parts', () => {
    const j = job();
    const { unmount } = render(wrap(<ServicesTable rows={[j]} selected={new Set()} onToggle={noop} onToggleAll={noop} onOpen={noop} onOpenCustomer={noop} />));
    expect(screen.getByText('Lorna Bautista')).toBeTruthy();
    expect(screen.getByText('0917 555 0101')).toBeTruthy();
    expect(screen.getByText(/ZQX 9081/)).toBeTruthy();
    expect(screen.getByTitle('Dennis Ocampo')).toBeTruthy();
    expect(screen.getByText('₱2,150')).toBeTruthy(); // 800 + 3 x 450
    expect(screen.getByText('₱2,150 unpaid')).toBeTruthy();
    unmount();
    render(wrap(<ServiceCard job={j} onOpen={noop} />));
    expect(screen.getByRole('button', { name: /JO-9001/ })).toBeTruthy();
    expect(screen.getByText('1 part short')).toBeTruthy();
  });
  it('does not throw on a customer or product the host did not supply', () => {
    render(wrap(<ServicesTable rows={[job({ customerId: 'gone', parts: [{ productId: 'gone', qty: 1, issued: 0 }] })]} selected={new Set()} onToggle={noop} onToggleAll={noop} onOpen={noop} onOpenCustomer={noop} />));
    expect(screen.getByText('Unknown customer')).toBeTruthy();
  });
  it('toolbar and bulk bar list mechanics and counts from props', () => {
    const counts = Object.fromEntries(VIEWS.map((v, i) => [v.id, 40 + i])) as Record<ViewId, number>;
    const { unmount } = render(<ServicesToolbar f={NO_FILTERS} onChange={noop} sort="attention" onSort={noop} counts={counts} results={7} unpaidTotal={null} onClear={noop} onExport={noop} mechanics={host.mechanics} />);
    expect(screen.getByText('40')).toBeTruthy();
    expect(screen.getByText('45')).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Mechanic' })).toBeTruthy();
    unmount();
    render(wrap(<BulkBar selected={[job()]} onClear={noop} onRemind={noop} onAssign={noop} onExport={noop} />));
    expect(screen.getByRole('button', { name: 'Assign to...' })).toBeTruthy();
  });
  it('describes the mechanic filter with the host person', () => {
    expect(describeFilters({ ...NO_FILTERS, mechanic: 'api-m1' }, buildServicesApi(host))).toEqual(['Dennis']);
  });
  it('range filters count from the supplied "today"', () => {
    const api = buildServicesApi(host);
    const at = (d: string) => job({ statusSince: `${d}T10:00:00+08:00` });
    expect(matches(at('2027-03-15'), { ...NO_FILTERS, range: 'today' }, undefined, api)).toBe(true);
    expect(matches(at('2027-03-14'), { ...NO_FILTERS, range: 'today' }, undefined, api)).toBe(false);
    expect(matches(at('2027-03-08'), { ...NO_FILTERS, range: '7d' }, undefined, api)).toBe(true);
    expect(matches(at('2027-03-07'), { ...NO_FILTERS, range: '7d' }, undefined, api)).toBe(false);
    expect(matches(at('2027-02-13'), { ...NO_FILTERS, range: '30d' }, undefined, api)).toBe(true);
    expect(matches(at('2027-02-12'), { ...NO_FILTERS, range: '30d' }, undefined, api)).toBe(false);
    expect(partsFor(job(), api).shortCount).toBe(1);
  });
});
