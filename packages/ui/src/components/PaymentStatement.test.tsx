import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { PaymentStatement } from './PaymentStatement';
import { StatementActions } from './StatementActions';
import { docFileName, documentHtml } from './sms/statementFile';
import { receiptOf, type BillJob } from './payment/model';
import { billFor, headerFor, jobFor, receiptOfJob } from './sms/paymentModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const base = { title: 'Price so far', editable: true, onAdd: () => {}, onRemove: () => {}, addOpen: false, onAddOpen: () => {} };

describe('PaymentStatement', () => {
  it('marks lines added at billing and opens the add form', () => {
    const onAddOpen = vi.fn();
    render(<PaymentStatement {...base} job={billFor('quote')} header={headerFor('quote')} onAddOpen={onAddOpen} />);
    expect(screen.getAllByText('Added at billing').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Add line' }));
    expect(onAddOpen).toHaveBeenCalledWith(true);
  });
  it('shows the empty state when there are no lines', () => {
    render(<PaymentStatement {...base} job={billFor('nolines')} header={headerFor('nolines')} />);
    expect(screen.getByText('Nothing to bill yet')).toBeTruthy();
  });
  it('builds the download file name and html', () => {
    const doc = receiptOfJob(jobFor('unpaid'));
    expect(docFileName(doc, 'a4')).toMatch(/^statement-JO-0403-.*\.html$/);
    expect(docFileName(doc, 'slip')).toMatch(/^receipt-80mm-/);
    expect(documentHtml(doc, 'a4')).toContain('Statement of account');
  });
  it('has no axe violations (statement, add form, actions)', async () => {
    const { container } = render(<><PaymentStatement {...base} job={billFor('discount')} header={headerFor('discount')} addOpen /><StatementActions doc={receiptOfJob(jobFor('discount'))} onPrint={() => {}} /></>);
    const r = await axe.run(container, axeOpts);
    expect(r.violations).toEqual([]);
  });
  it('renders a real API job whose ids are in no mock array', async () => {
    const job: BillJob = {
      number: 'JO-9001', status: 'FOR_PICKUP', quoteNo: 'QT-9000', payments: [{ at: '2026-11-02T08:00:00+08:00', amount: 500, method: 'CASH' }],
      services: [{ name: 'Valve cover gasket', price: 1500, qty: 1, billing: true }],
      parts: [{ productId: 'api-77', name: 'Gasket set 2ZR', sku: 'GS-2ZR', unit: 'set', qty: 2, listPrice: 800, price: 700 }],
    };
    const header = { customer: 'Zed Ocampo', phone: '0917 000 0000', car: 'Toyota Vios 2019', plate: 'ZED 123', mechanic: 'Ria Lopez', mechanicShort: 'Ria' };
    render(<PaymentStatement {...base} job={job} header={header} catalogue={[{ id: 'svc1', name: 'Oil change', price: 450 }]} addOpen />);
    expect(screen.getByText(/Zed Ocampo · Toyota Vios 2019/)).toBeTruthy();
    expect(screen.getByText('Gasket set 2ZR')).toBeTruthy();
    expect(screen.getByText('Custom price (set: ₱800)')).toBeTruthy();
    expect(screen.getByTestId('statement-total').textContent).toBe('₱2,900');
    expect(screen.getByRole('combobox', { name: /price list/i })).toBeTruthy();
    const doc = receiptOf(job, header, { business: 'Real Shop', branch: 'Main', address: 'Somewhere', phone: '123' });
    expect(doc.shop.business).toBe('Real Shop'); expect(doc.mechanic).toBe('Ria Lopez'); expect(doc.balance).toBe(2400); expect(doc.state).toBe('partial');
    expect(documentHtml(doc, 'a4')).toContain('Real Shop');
  });
});
