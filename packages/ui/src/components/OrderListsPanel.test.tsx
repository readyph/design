import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { OrderListsPanel, type OrderListGroup } from './OrderListsPanel';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); };
});
afterEach(cleanup);

const g = (id: string, poNo?: string): OrderListGroup => ({
  id, supplier: `${id} Supply`, shortName: id, poNo,
  lines: [{ id: 'a', sku: 'A-1', name: 'Oil filter', qty: 2, unit: 'carton', cost: 100 }],
});

const setup = (over = {}) => {
  const fns = { onOpenChange: vi.fn(), onProceed: vi.fn(), onOpenPo: vi.fn(), onRemove: vi.fn(), onQuantityChange: vi.fn(), onRetry: vi.fn() };
  const r = render(<OrderListsPanel open groups={[g('petron')]} purchaseOrdersHref="#" {...fns} {...over} />);
  return { ...fns, ...r };
};

describe('OrderListsPanel', () => {
  it('is a labelled, described dialog with the summary sentence', () => {
    setup({ groups: [g('petron'), g('dairy', 'PO-0225')] });
    const d = document.querySelector('dialog')!;
    expect(d.getAttribute('aria-labelledby')).toBeTruthy();
    expect(d.getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.getByText('1 list to proceed, 1 draft PO, not sent. 2 products in all. Nothing is sent from here.')).toBeTruthy();
    expect(screen.getByText('Still to proceed (1)')).toBeTruthy();
    expect(screen.getByText('Draft POs, not sent (1)')).toBeTruthy();
  });
  it('one supplier: one Proceed in the foot; clerk sees units to order', () => {
    const { onProceed } = setup();
    expect(screen.getByText('cartons to order')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Proceed' }));
    expect(onProceed).toHaveBeenCalledWith('petron');
  });
  it('several suppliers: each group has its own button, drafts open the PO', () => {
    const { onOpenPo } = setup({ groups: [g('petron'), g('dairy', 'PO-0225')], money: true });
    expect(screen.getByRole('button', { name: 'Proceed with the petron Supply order list' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open PO-0225 for dairy Supply' }));
    expect(onOpenPo).toHaveBeenCalledWith('dairy');
    expect(screen.getByText('Each supplier gets its own purchase order. Use the Proceed button under each list; scroll for the rest.')).toBeTruthy();
  });
  it('remove and quantity events', () => {
    const { onRemove, onQuantityChange } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'One more Oil filter' }));
    expect(onQuantityChange).toHaveBeenCalledWith('petron', 'a', 3);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Oil filter from the petron order list' }));
    expect(onRemove).toHaveBeenCalledWith('petron', 'a');
  });
  it('empty, loading, error and proceeding states', () => {
    setup({ groups: [] });
    expect(screen.getByText('No order lists are open')).toBeTruthy();
    cleanup();
    setup({ loading: true });
    expect(screen.queryByRole('button', { name: /Proceed/ })).toBeNull();
    cleanup();
    const { onRetry } = setup({ error: { lastLoaded: '09:12' } });
    expect(screen.getByRole('alert').textContent).toContain('the list from 09:12');
    expect(document.querySelector('[inert]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
    cleanup();
    setup({ busyId: 'petron' });
    expect(screen.getByText('Creating the purchase order…')).toBeTruthy();
  });
  it('has no axe violations', async () => {
    setup({ groups: [g('petron'), g('dairy', 'PO-0225')], money: true, undo: 'Taken off.' });
    const r = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
    expect(r.violations).toEqual([]);
  });
});
