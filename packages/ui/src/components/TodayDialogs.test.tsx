import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodayDialogs } from './TodayDialogs';

afterEach(cleanup);
const job = { number: 'JO-1042', extra: 1 };
const product = { name: 'Brake pad set', sku: 'BP-1' };
const base = { fromLocation: 'Main Branch (3 on hand)', toLocation: 'Kapitolyo stockroom' };

describe('TodayDialogs (public)', () => {
  it('renders nothing without a dialog', () => {
    render(<TodayDialogs dialog={null} onClose={() => {}} onTransfer={() => {}} onEta={() => {}} {...base} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('transfer: shows the passed locations and confirms with the job and part', async () => {
    const onTransfer = vi.fn(); const onClose = vi.fn();
    render(<TodayDialogs dialog={{ kind: 'transfer', job, product }} onClose={onClose} onTransfer={onTransfer} onEta={() => {}} {...base} />);
    expect(screen.getByText('Main Branch (3 on hand)')).toBeTruthy();
    expect(screen.getByText('Kapitolyo stockroom')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Request transfer' }));
    expect(onTransfer).toHaveBeenCalledWith(job, product);
    expect(onClose).toHaveBeenCalled();
  });
  it('transfer: says so when no other location has the part', () => {
    render(<TodayDialogs dialog={{ kind: 'transfer', job, product }} onClose={() => {}} onTransfer={() => {}} onEta={() => {}} toLocation="Here" />);
    expect(screen.getByText('No other location has it')).toBeTruthy();
  });
  it('eta: saves the typed time', async () => {
    const onEta = vi.fn();
    render(<TodayDialogs dialog={{ kind: 'eta', job, product }} onClose={() => {}} onTransfer={() => {}} onEta={onEta} {...base} />);
    const input = screen.getByLabelText('Expected today at');
    await userEvent.clear(input); await userEvent.type(input, '16:45');
    await userEvent.click(screen.getByRole('button', { name: 'Save time' }));
    expect(onEta).toHaveBeenCalledWith(job, product, '16:45');
  });
  it('cancel closes without calling the callbacks', async () => {
    const onTransfer = vi.fn(); const onEta = vi.fn(); const onClose = vi.fn();
    for (const kind of ['transfer', 'eta'] as const) {
      render(<TodayDialogs dialog={{ kind, job, product }} onClose={onClose} onTransfer={onTransfer} onEta={onEta} {...base} />);
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      cleanup();
    }
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onTransfer).not.toHaveBeenCalled();
    expect(onEta).not.toHaveBeenCalled();
  });
});
