import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { ReceiptDoc, ReceiptModal, printReceipt } from './ReceiptDoc';
import { jobFor, receiptOfJob } from './sms/paymentModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

describe('ReceiptDoc', () => {
  it('shows Receipt once paid and Statement of account before', () => {
    render(<ReceiptDoc doc={receiptOfJob(jobFor('paid'))} paper="a4" />);
    expect(screen.getByText('Receipt', { selector: 'p' })).toBeTruthy();
    cleanup();
    render(<ReceiptDoc doc={receiptOfJob(jobFor('unpaid'))} paper="a4" />);
    expect(screen.getByText('Statement of account')).toBeTruthy();
    expect(screen.getByText('No payment yet.')).toBeTruthy();
  });
  it('drops the Price column on the slip', () => {
    render(<ReceiptDoc doc={receiptOfJob(jobFor('partial'))} paper="slip" />);
    expect(screen.queryByText('Price')).toBeNull();
    expect(screen.getByText(/not an official receipt/)).toBeTruthy();
  });
  it.each(['a4', 'slip'] as const)('has no axe violations (%s)', async (paper) => {
    const { container } = render(<ReceiptDoc doc={receiptOfJob(jobFor('partial'))} paper={paper} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('ReceiptModal print', () => {
  it('calls onPrint when Print is pressed', () => {
    const onPrint = vi.fn();
    render(<ReceiptModal doc={receiptOfJob(jobFor('paid'))} onClose={() => {}} onPrint={onPrint} />);
    fireEvent.click(screen.getByRole('button', { name: 'Print' }));
    expect(onPrint).toHaveBeenCalledTimes(1);
  });
  it('defaults to window.print with the body flag, cleared after printing', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<ReceiptModal doc={receiptOfJob(jobFor('paid'))} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Print' }));
    expect(print).toHaveBeenCalledTimes(1);
    expect(document.body.hasAttribute('data-print-receipt')).toBe(true);
    window.dispatchEvent(new Event('afterprint'));
    expect(document.body.hasAttribute('data-print-receipt')).toBe(false);
    print.mockRestore();
  });
  it('marks the receipt article for print isolation', () => {
    render(<ReceiptDoc doc={receiptOfJob(jobFor('paid'))} paper="a4" />);
    expect(document.querySelector('article[data-receipt-doc]')).toBeTruthy();
    expect(typeof printReceipt).toBe('function');
  });
});
