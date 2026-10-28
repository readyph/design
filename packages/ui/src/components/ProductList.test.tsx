import { afterEach, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Package } from '@phosphor-icons/react';
import { OrderListsStrip, ProductList, ProductSelectionBar, ProductStatusTabs, type ProductGroupData } from './ProductList';

afterEach(cleanup);

const row = { id: 'p1', name: 'Oil filter', sku: 'OF1', category: 'Filters', where: 'Aisle 2', onHand: 0, unit: 'pc', reorder: 6, status: 'out' as const, supplier: 'Autopro', action: { kind: 'add' as const, label: 'Add 12 to order list', ariaLabel: 'Add 12 Oil filter to the Autopro order list', onAdd: vi.fn() } };
const groups: ProductGroupData[] = [{ id: 'out', icon: Package, name: 'Out of stock', rows: [row, { ...row, id: 'p2', name: 'Belt', action: { kind: 'view', label: 'View' } }] }];

describe('ProductList', () => {
  it('row name is the one named button; row click opens', () => {
    const open = vi.fn();
    render(<ProductList groups={groups} total={612} onOpen={open} />);
    fireEvent.click(screen.getByRole('button', { name: 'Oil filter, 0 pc on hand, out of stock. Open' }));
    expect(open).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Showing 2 of 612 products')).toBeTruthy();
  });
  it('add action does not open the row; checkbox is labelled', () => {
    const open = vi.fn(); const sel = vi.fn();
    render(<ProductList groups={groups} total={2} addable={new Set(['p1'])} onSelectedChange={sel} onOpen={open} />);
    fireEvent.click(screen.getByLabelText('Add 12 Oil filter to the Autopro order list'));
    fireEvent.click(screen.getByLabelText('Select Oil filter'));
    expect(open).not.toHaveBeenCalled();
    expect(sel).toHaveBeenCalledWith('p1', true);
  });
  it('tabs are toggle buttons with counts', () => {
    render(<ProductStatusTabs value="low" counts={{ all: 612, low: 9, out: 3, order: 4 }} />);
    expect(screen.getByRole('button', { name: 'Low stock, 9' }).getAttribute('aria-pressed')).toBe('true');
  });
  it('selection bar says list or lists', () => {
    const { rerender } = render(<ProductSelectionBar count={3} goesTo="Autopro 3" lists={1} />);
    expect(screen.getByText('Add 3 to order list')).toBeTruthy();
    rerender(<ProductSelectionBar count={3} goesTo="A 2 · B 1" lists={2} />);
    expect(screen.getByText('Add 3 to order lists')).toBeTruthy();
  });
  it('strip error and empty copy', () => {
    const { rerender } = render(<OrderListsStrip lists={[]} error />);
    expect(screen.getByText('Did not load. Retry first.')).toBeTruthy();
    rerender(<OrderListsStrip lists={[]} />);
    expect(screen.getByText(/^None yet\./)).toBeTruthy();
  });
  it('has no axe violations', async () => {
    const { container } = render(<ProductList groups={groups} total={2} addable={new Set(['p1'])} onSelectedChange={() => {}} />);
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(r.violations).toEqual([]);
  });
});
