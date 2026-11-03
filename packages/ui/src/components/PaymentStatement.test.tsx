import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { PaymentStatement } from './PaymentStatement';
import { StatementActions } from './StatementActions';
import { docFileName, documentHtml } from './sms/statementFile';
import { jobFor, receiptOf } from './sms/paymentModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const base = { title: 'Price so far', editable: true, onAdd: () => {}, onRemove: () => {}, addOpen: false, onAddOpen: () => {} };

describe('PaymentStatement', () => {
  it('marks lines added at billing and opens the add form', () => {
    const onAddOpen = vi.fn();
    render(<PaymentStatement {...base} job={jobFor('quote')} onAddOpen={onAddOpen} />);
    expect(screen.getAllByText('Added at billing').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Add line' }));
    expect(onAddOpen).toHaveBeenCalledWith(true);
  });
  it('shows the empty state when there are no lines', () => {
    render(<PaymentStatement {...base} job={jobFor('nolines')} />);
    expect(screen.getByText('Nothing to bill yet')).toBeTruthy();
  });
  it('builds the download file name and html', () => {
    const doc = receiptOf(jobFor('unpaid'));
    expect(docFileName(doc, 'a4')).toMatch(/^statement-JO-0403-.*\.html$/);
    expect(docFileName(doc, 'slip')).toMatch(/^receipt-80mm-/);
    expect(documentHtml(doc, 'a4')).toContain('Statement of account');
  });
  it('has no axe violations (statement, add form, actions)', async () => {
    const { container } = render(<><PaymentStatement {...base} job={jobFor('discount')} addOpen /><StatementActions doc={receiptOf(jobFor('discount'))} onPrint={() => {}} /></>);
    const r = await axe.run(container, axeOpts);
    expect(r.violations).toEqual([]);
  });
});
