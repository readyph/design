import { afterEach, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RecordMovementForm, type RecordProduct } from './RecordMovementForm';

afterEach(cleanup);
const oil: RecordProduct = { id: 'p1', name: 'Engine oil 5W-30', sku: 'OIL-530', onHand: 4, reorder: 3, unit: 'bottle', location: 'Shelf A2' };
const setup = (over = {}) => {
  const onRecord = vi.fn();
  render(<RecordMovementForm products={[oil]} likely={[{ product: oil, why: 'Needed for JO-0413' }]} permissions={['stock_out', 'transfer']} onRecord={onRecord} {...over} />);
  return onRecord;
};

describe('RecordMovementForm', () => {
  it('waits for a product, then lets one be picked', () => {
    setup();
    expect(screen.getByText('Choose a product above, then pick what happened.')).toBeTruthy();
    expect(screen.getAllByRole('radio').every((r) => r.getAttribute('tabindex') === '-1')).toBe(true);
    fireEvent.click(screen.getByText('Engine oil 5W-30'));
    expect(screen.getByRole('radio', { name: /Sold/ }).getAttribute('aria-checked')).toBe('true');
  });
  it('locks manager reasons and skips them with the arrows', () => {
    setup({ product: oil });
    const damaged = screen.getByRole('radio', { name: /Damaged or lost/ });
    expect((damaged as HTMLButtonElement).disabled).toBe(true);
    expect(damaged.textContent).toContain('Your manager records this.');
    fireEvent.keyDown(screen.getByRole('radio', { name: /Sold/ }), { key: 'ArrowUp' });
    expect(screen.getByRole('radio', { name: /Sent to another branch/ }).getAttribute('aria-checked')).toBe('true');
  });
  it('blocks below zero and records', () => {
    const onRecord = setup({ product: oil, jobOrders: false });
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '9' } });
    fireEvent.blur(input);
    expect(screen.getByRole('status').textContent).toBe('Only 4 on hand. Use 4 or fewer.');
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.blur(input);
    expect(screen.getByRole('status').textContent).toBe('Stock goes from 4 to 2. It will be low stock (reorder level 3).');
    fireEvent.click(screen.getByRole('button', { name: 'Record 2 sold' }));
    expect(onRecord.mock.calls[0][0]).toMatchObject({ type: 'sold', qty: -2, after: 2, ref: 'Sold' });
  });
  it('has no axe violations', async () => {
    setup({ product: oil });
    const r = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
});
