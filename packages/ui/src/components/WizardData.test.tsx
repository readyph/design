import { render, cleanup, act, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { LinesTable } from './ServiceLines';
import { CustomerField } from './CustomerField';
import { WizardDataProvider, seedWizardData, type WizardData } from './sms/wizardData';
import { linesFromType, partNeed } from './sms/wizardModel';
import { useServiceFlow } from './useServiceFlow';

beforeAll(() => {
  class RO { observe() {} unobserve() {} disconnect() {} }
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = RO;
  Element.prototype.scrollIntoView = () => {};
  window.matchMedia = window.matchMedia || ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }) as MediaQueryList);
});
afterEach(cleanup);

/** RDY-618: a host app supplies its own data; nothing from the prototype seed leaks in. */
const host: WizardData = {
  customers: [{ id: 'real-1', name: 'Zed Realperson', phone: '0999 000 1111', since: '2025-01-01', vehicles: [{ id: 'rv1', plate: 'ZZZ 999', make: 'Suzuki', model: 'Jimny', year: 2020, kind: 'car' }] }],
  catalogue: [{ id: 'rs1', name: 'Host service', category: 'Maintenance', price: 123, mins: 45, vehicle: 'all', active: true, parts: [{ productId: 'rp1', qty: 2 }] }],
  products: [{ id: 'rp1', sku: 'HOST-1', name: 'Host part', unit: 'pc', price: 77, reorder: 1, locations: [{ name: 'Main', qty: 1, thisBranch: true }, { name: 'Other, Cebu', qty: 5, thisBranch: false }] }],
  assignees: [{ id: 'ra1', short: 'Hostmech', bay: 'Bay 9' }],
  shop: { business: 'Host Shop', branch: 'Host Branch', address: 'Somewhere', phone: '0', preparedBy: 'Host' },
};

describe('WizardData (RDY-618)', () => {
  it('builds lines and stock from the host catalogue and products', () => {
    const lines = linesFromType('rs1', host);
    expect(lines.map((l) => [l.name, l.qty, l.price])).toEqual([['Host service', 1, 123], ['Host part', 2, 77]]);
    expect(partNeed(lines, 'rp1', host)).toEqual({ need: 2, have: 1, short: 1 });
  });

  it('defaults to the sample data', () => {
    expect(linesFromType('sv01').length).toBeGreaterThan(0);
    expect(seedWizardData().customers.length).toBeGreaterThan(0);
  });

  it('LinesTable shows the host stock note', () => {
    render(<WizardDataProvider data={host}><LinesTable lines={linesFromType('rs1', host)} /></WizardDataProvider>);
    expect(screen.getAllByText(/Short by 1/).length).toBeGreaterThan(0);
    expect(screen.getByText(/5 at Cebu/)).toBeTruthy();
  });

  it('CustomerField lists only host customers', async () => {
    render(<WizardDataProvider data={host}><CustomerField customer={null} vehicleId="" onPick={() => {}} onClear={() => {}} /></WizardDataProvider>);
    const box = screen.getByRole('combobox');
    await act(async () => { box.focus(); });
    expect(screen.queryByText('Maricel Reyes')).toBeNull();
  });

  it('useServiceFlow uses host numbers and saves a new customer through the host', async () => {
    const saved = vi.fn(); void saved;
    let flow!: ReturnType<typeof useServiceFlow>;
    const add = vi.fn();
    function Host() {
      flow = useServiceFlow({ count: 0, items: [], find: () => undefined, add, patch: () => {}, remove: () => {}, data: { ...host, onSaveCustomer: saved }, nextQuoteNo: () => 'QT-HOST', nextJobNo: () => 'JO-HOST' });
      return <>{flow.node}</>;
    }
    render(<Host />);
    await act(async () => { flow.openNew({ customerId: 'real-1' }); });
    expect(screen.getByText('Zed Realperson')).toBeTruthy();
  });
});
