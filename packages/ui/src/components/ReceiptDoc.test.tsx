import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { ReceiptDoc } from './ReceiptDoc';
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
