import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { ShortDeliveryBlock } from './ShortDeliveryBlock';

afterEach(cleanup);
const order = { no: 'PO-0221', supplierName: 'Petron Auto Parts', closed: false, missing: '6', dueValue: '₱2,790' };
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

describe('ShortDeliveryBlock', () => {
  it('shows the heading, line and manager actions', () => {
    render(<ShortDeliveryBlock order={order} canSettle />);
    expect(screen.getByRole('heading', { name: '6 still due (₱2,790 at cost)' })).toBeTruthy();
    expect(screen.getByText(/You can keep waiting for the rest, or settle it now/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Accept the shortage' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dispute with Petron' })).toBeTruthy();
  });
  it('opens an inline group, not a dialog, and reports the values', () => {
    const onDispute = vi.fn();
    render(<ShortDeliveryBlock order={order} canSettle onDispute={onDispute} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dispute with Petron' }));
    expect(screen.getByRole('group', { name: 'Confirm disputing' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Record the dispute' }));
    expect(onDispute).toHaveBeenCalledWith({ reason: 'short', ref: '', note: '' });
  });
  it('gives a clerk Tell your manager, no amounts', () => {
    render(<ShortDeliveryBlock order={{ ...order, dueValue: undefined }} />);
    expect(screen.getByRole('button', { name: 'Tell your manager' })).toBeTruthy();
    expect(screen.queryByText(/at cost/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Accept the shortage' })).toBeNull();
  });
  it('disables the actions in the error state', () => {
    render(<ShortDeliveryBlock order={order} canSettle error />);
    expect((screen.getByRole('button', { name: 'Accept the shortage' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it.each(['accept', 'dispute', 'resolve', 'tell'] as const)('has no axe violations with the %s form open', async (c) => {
    const { container } = render(
      <ShortDeliveryBlock order={order} canSettle={c !== 'tell'} etaOptions={['Fri 30 Oct']} defaultConfirm={c} dispute={c === 'resolve' ? { reason: 'Damaged', by: 'Rica', at: 'x', status: 'open' } : undefined} />,
    );
    const r = await axe.run(container, axeOpts);
    expect(r.violations).toEqual([]);
  });
});
