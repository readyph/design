import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { TransferList, type TransferRowData } from './TransferList';
import { TransferForm } from './TransferForm';
import { TransferDetail } from './TransferDetail';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const row: TransferRowData = { id: 'TR-0032', status: 'draft', out: true, otherName: 'Cebu branch', hereShort: 'Main', statusNote: 'Not sent yet', items: '8 pcs', itemNames: 'Oil filter', when: 'Today', who: 'Ana', action: 'send' };
const counts = { all: 1, draft: 1, transit: 0, received: 0, cancelled: 0 };
const products = [{ id: 'p1', name: 'Oil filter', sku: 'FLT', onHand: 3, unit: 'pc' }, { id: 'p2', name: 'Engine oil', sku: 'OIL', onHand: 5, unit: 'bottle' }];

describe('TransferList', () => {
  it('shows the Send link and opens the transfer', () => {
    const onOpen = vi.fn();
    render(<TransferList transfers={[row]} filter="all" counts={counts} onFilterChange={() => {}} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send TR-0032, to Cebu branch' }));
    expect(onOpen).toHaveBeenCalledWith('TR-0032', 'send');
  });
  it('says so when the filter has no transfer', () => {
    render(<TransferList transfers={[row]} filter="received" counts={counts} onFilterChange={() => {}} onOpen={() => {}} />);
    expect(screen.getByText('No transfer here')).toBeTruthy();
    expect(screen.getByText(/No received transfer\./)).toBeTruthy();
  });
  it('has no axe violations', async () => {
    const { container } = render(<TransferList transfers={[row]} filter="all" counts={counts} onFilterChange={() => {}} onOpen={() => {}} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('TransferForm', () => {
  it('Enter adds the first match, Escape clears the search, Create draft needs a place and a line', () => {
    const onSave = vi.fn();
    render(<TransferForm hereShort="Main" hereName="Main stockroom" places={[{ id: 'c', name: 'Cebu' }]} products={products} onSave={onSave} onCancel={() => {}} />);
    expect((screen.getByRole('button', { name: 'Create draft' }) as HTMLButtonElement).disabled).toBe(true);
    const q = screen.getByPlaceholderText('Add a product: type a name or code');
    fireEvent.change(q, { target: { value: 'oil' } });
    expect(screen.getByText('Engine oil')).toBeTruthy();
    fireEvent.keyDown(q, { key: 'Escape' });
    expect((q as HTMLInputElement).value).toBe('');
    fireEvent.change(q, { target: { value: 'filter' } });
    fireEvent.keyDown(q, { key: 'Enter' });
    expect(screen.getByRole('button', { name: 'Remove Oil filter' })).toBeTruthy();
    expect(screen.getByText('Choose where it goes.')).toBeTruthy();
  });
  it('has no axe violations', async () => {
    const { container } = render(<TransferForm hereShort="Main" hereName="Main stockroom" places={[{ id: 'c', name: 'Cebu' }]} products={products} initial={{ to: 'c', lines: [{ productId: 'p1', qty: 1 }] }} onSave={() => {}} onCancel={() => {}} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('TransferDetail', () => {
  const base = { id: 'TR-0032', out: true, otherName: 'Cebu', status: 'draft' as const, facts: ['8 pcs'], steps: null, paper: null, history: [{ at: '22 Oct', what: 'Drafted' }], can: { send: true, receive: true, change: true }, otherShort: 'Cebu', hereShort: 'Main', managerName: 'Berto', onAskSend() {}, onSend() {}, onNotYet() {}, onPrint() {}, onReceive() {}, onChange() {}, onCancelDraft() {} };
  it('opening the send question removes the top Mark as sent (one primary)', () => {
    const { rerender } = render(<TransferDetail {...base} />);
    expect(screen.getAllByRole('button', { name: 'Mark as sent' })).toHaveLength(1);
    rerender(<TransferDetail {...base} confirming confirmText="x" />);
    expect(screen.getAllByRole('button', { name: 'Mark as sent' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Not yet' })).toBeTruthy();
  });
  it('a clerk sees Waiting for a manager and can still print', () => {
    render(<TransferDetail {...base} can={{ send: false, receive: true, change: false }} />);
    expect(screen.getByText(/Waiting for berto/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Print' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mark as sent' })).toBeNull();
  });
  it('has no axe violations', async () => {
    const { container } = render(<TransferDetail {...base} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});
