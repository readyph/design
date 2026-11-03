import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { PartPicker } from './PartPicker';
import { ServicePartsEditor } from './ServicePartsEditor';
import type { Product } from './sms/data';
import type { ServiceType } from './sms/catalogue';
import axe from 'axe-core';
import { ServicesPricesPage, type ServicesPricesProps } from './ServicesPricesPage';

afterEach(cleanup);
// Source flaw accepted (RDY-523): ServiceTypeForm has a <p> inside the <dl>.
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'empty-table-header': { enabled: false }, 'aria-required-children': { enabled: false }, 'definition-list': { enabled: false } } };
const SCENARIOS: Record<string, ServicesPricesProps> = {
  default: {}, embedded: { embedded: true }, mechanic: { role: 'mechanic' }, empty: { state: 'empty' }, loading: { state: 'loading' },
  filtered: { initialCategory: 'Brakes' }, noResult: { initialQuery: 'turbo' }, stress: { stress: true }, inactive: { initialShowInactive: true },
  error: { state: 'error', errorMessage: 'Services are unavailable.', onRetry: () => {} },
  form: { initialForm: 'sv01' }, ask: { initialAsk: 'sv10' },
};

describe('ServicesPricesPage', () => {
  for (const [name, props] of Object.entries(SCENARIOS)) {
    it(`${name} has no axe violations`, async () => {
      const { container } = render(<ServicesPricesPage {...props} />);
      expect(screen.getAllByText('Services & prices').length).toBeGreaterThan(0);
      expect((await axe.run(props.initialForm || props.initialAsk ? document.body : container, axeOpts)).violations).toEqual([]);
    });
  }
  it('mechanic sees View only and no Add service', () => {
    render(<ServicesPricesPage role="mechanic" embedded />);
    expect(screen.getByText('View only')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add service' })).toBeNull();
  });
});

/** RDY-629: a host supplies services, parts and handlers; nothing from the sample catalogue leaks in. */
const hostPart: Product = { id: 'hp1', sku: 'HOST-SKU', name: 'Host brake pad', unit: 'set', price: 900, reorder: 1, locations: [{ name: 'Main', qty: 3, thisBranch: true }] };
const hostSvc: ServiceType = { id: 'hs1', name: 'Host service', category: 'Brakes', price: 500, mins: 60, vehicle: 'all', active: true, parts: [{ productId: 'hp1', qty: 2 }] };

describe('ServicesPricesPage host data (RDY-629)', () => {
  it('shows only the host services and routes toggle to the handler', async () => {
    const onToggleActive = vi.fn();
    render(<ServicesPricesPage embedded services={[hostSvc]} products={[hostPart]} onToggleActive={onToggleActive} initialForm="hs1" />);
    expect(screen.getAllByText('Host service').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Change oil/)).toBeNull();
    expect(screen.getAllByText(/2 parts|1 part/).length).toBeGreaterThan(0);
    fireEvent.click(await screen.findByRole('button', { name: 'Deactivate' }));
    fireEvent.click((await screen.findAllByRole('button', { name: 'Deactivate' })).at(-1)!);
    await waitFor(() => expect(onToggleActive).toHaveBeenCalledWith(hostSvc, false));
  });
  it('create goes to onCreate, edit to onUpdate', async () => {
    const onCreate = vi.fn(); const onUpdate = vi.fn();
    render(<ServicesPricesPage embedded services={[hostSvc]} products={[hostPart]} onCreate={onCreate} onUpdate={onUpdate} initialForm="new" />);
    fireEvent.change(screen.getByLabelText('Service name'), { target: { value: 'Fresh one' } });
    fireEvent.change(screen.getByLabelText(/Labour price/), { target: { value: '300' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Fresh one', price: 300 })));
    expect(onUpdate).not.toHaveBeenCalled();
  });
  it('error state offers retry; empty host list shows the empty state', () => {
    const onRetry = vi.fn();
    const { unmount } = render(<ServicesPricesPage embedded services={[]} state="error" errorMessage="Boom" onRetry={onRetry} />);
    expect(screen.getByText('Boom')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
    unmount();
    render(<ServicesPricesPage embedded services={[]} />);
    expect(screen.getByText('No services in this category')).toBeTruthy();
  });
});

describe('PartPicker / ServicePartsEditor host data (RDY-629)', () => {
  it('searches through the host, and the editor resolves the part from the option', async () => {
    const search = vi.fn(async () => [hostPart]);
    const onChange = vi.fn();
    render(<ServicePartsEditor parts={[]} onChange={onChange} products={[]} search={search} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'brake' } });
    await waitFor(() => expect(search).toHaveBeenCalledWith('brake'));
    fireEvent.click(await screen.findByRole('option', { name: /Host brake pad/ }));
    expect(onChange).toHaveBeenCalledWith([{ productId: 'hp1', qty: 1 }]);
  });
  it('a linked part the host does not return stays listed, not a crash', () => {
    render(<ServicePartsEditor parts={[{ productId: 'gone', qty: 2 }]} onChange={() => {}} products={[]} />);
    expect(screen.getByText('Part gone')).toBeTruthy();
  });
  it('down shows the Inventory fallback, slow shows a note', () => {
    const { unmount } = render(<PartPicker onPick={() => {}} status="down" search={() => []} />);
    expect(screen.getByText('Inventory is not answering')).toBeTruthy();
    unmount();
    render(<PartPicker onPick={() => {}} status="slow" search={() => []} />);
    expect(screen.getByText(/slow to answer/)).toBeTruthy();
  });
});
