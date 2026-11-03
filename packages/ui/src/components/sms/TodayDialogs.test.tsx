import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { TodayDialogs } from './TodayDialogs';
import { jobs, products } from './data';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const job = jobs[0];
const product = products[0];

describe('TodayDialogs', () => {
  it('renders nothing without a dialog', () => {
    render(<TodayDialogs dialog={null} onClose={() => {}} onTransfer={() => {}} onEta={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('transfer: lists the job and confirms', async () => {
    const onTransfer = vi.fn(); const onClose = vi.fn();
    render(<TodayDialogs dialog={{ kind: 'transfer', job, product }} onClose={onClose} onTransfer={onTransfer} onEta={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'Request a transfer' })).toBeTruthy();
    expect(screen.getByText(job.number)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Request transfer' }));
    expect(onTransfer).toHaveBeenCalledWith(job, product);
    expect(onClose).toHaveBeenCalled();
  });
  it('eta: saves the default 14:30', async () => {
    const onEta = vi.fn();
    render(<TodayDialogs dialog={{ kind: 'eta', job, product }} onClose={() => {}} onTransfer={() => {}} onEta={onEta} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save time' }));
    expect(onEta).toHaveBeenCalledWith(job, product, '14:30');
  });
  it('has no axe violations (both dialogs)', async () => {
    for (const kind of ['transfer', 'eta'] as const) {
      render(<TodayDialogs dialog={{ kind, job, product }} onClose={() => {}} onTransfer={() => {}} onEta={() => {}} />);
      expect((await axe.run(document.body, axeOpts)).violations).toEqual([]);
      cleanup();
    }
  });
});
