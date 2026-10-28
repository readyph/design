import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { ReceiveForm, receiveRule, type ReceiveFormProps } from './ReceiveForm';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

const lines: ReceiveFormProps['lines'] = [
  { id: 'a', name: 'Engine oil', sku: 'OIL', location: 'Aisle 2', unit: 'bottle', onHand: 4, reorder: 6, ordered: 9, stillDue: 9, cost: 100 },
  { id: 'b', name: 'Filter', sku: 'FLT', location: 'Aisle 5', unit: 'pc', onHand: 0, reorder: 5, ordered: 3, stillDue: 3, cost: 50 },
];
const props: ReceiveFormProps = {
  poNo: 'PO-1',
  lines,
  stock: lines.map((l) => ({ id: l.id, onHand: l.onHand, reorder: l.reorder })),
  people: [{ id: 'x', name: 'Ana' }],
  viewerId: 'x',
  canCloseShort: true,
};
const count = (name: string, v: string) => {
  const el = screen.getByRole('spinbutton', { name: `Quantity of ${name}` });
  fireEvent.change(el, { target: { value: v } });
  fireEvent.blur(el);
};

describe('receiveRule', () => {
  it('received + still due = ordered', () => {
    expect(receiveRule(9, 6)).toMatchObject({ received: 6, due: 3, extra: 0 });
    expect(receiveRule(9, 12)).toMatchObject({ received: 9, due: 0, extra: 3 });
  });
});

describe('ReceiveForm', () => {
  it('starts every line at what is still due, received by the viewer', () => {
    render(<ReceiveForm {...props} />);
    expect((screen.getByRole('spinbutton', { name: 'Quantity of Engine oil' }) as HTMLInputElement).value).toBe('9');
    expect(screen.getAllByRole('button', { name: 'Confirm: add to stock' })[0]).toBeTruthy();
  });
  it('says what is short and offers the reasons', () => {
    render(<ReceiveForm {...props} />);
    count('Engine oil', '6');
    expect(screen.getByText('3 still due')).toBeTruthy();
    expect(screen.getByText('Why is it short?')).toBeTruthy();
    expect(screen.getByText('What about the rest?')).toBeTruthy();
    expect(screen.getByText(/PO-1 stays Part in/)).toBeTruthy();
  });
  it('shows nothing counted as an alert on Confirm', () => {
    const onConfirm = vi.fn();
    render(<ReceiveForm {...props} onConfirm={onConfirm} />);
    count('Engine oil', '0');
    count('Filter', '0');
    fireEvent.click(screen.getAllByRole('button', { name: 'Confirm receipt' })[0]);
    expect(screen.getByRole('alert').textContent).toContain('Nothing is counted yet.');
    expect(onConfirm).not.toHaveBeenCalled();
  });
  it('has no axe violations', async () => {
    const { container } = render(<ReceiveForm {...props} />);
    const r = await axe.run(container, axeOpts);
    expect(r.violations).toEqual([]);
  });
});
