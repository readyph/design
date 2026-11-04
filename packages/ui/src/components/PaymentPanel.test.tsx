import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { BalancePanel, PaymentList, RecordPayment } from './PaymentPanel';
import { PaymentDiscount } from './PaymentDiscount';
import { billFor } from './sms/paymentModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

describe('PaymentPanel', () => {
  it('starts the amount at the whole balance and shows the change for cash', () => {
    const job = billFor('unpaid');
    render(<BalancePanel job={job}><RecordPayment job={job} onRecord={() => {}} /></BalancePanel>);
    expect((screen.getByLabelText('Amount received') as HTMLInputElement).value).toBe(String(screen.getByTestId('balance').textContent!.replace(/[^\d.]/g, '')));
    fireEvent.change(screen.getByLabelText('Cash handed over (optional)'), { target: { value: '5000' } });
    expect(screen.getByTestId('change')).toBeTruthy();
  });
  it('asks for a reference when the method is not cash', () => {
    const job = billFor('unpaid');
    render(<RecordPayment job={job} onRecord={() => {}} initialMethod="GCASH" />);
    expect(screen.getByLabelText('GCash reference no.')).toBeTruthy();
  });
  it('confirms before recording', () => {
    const job = billFor('unpaid'); const onRecord = vi.fn();
    render(<RecordPayment job={job} onRecord={onRecord} />);
    fireEvent.click(screen.getByRole('button', { name: /^Record payment/ }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Record payment' }).pop()!);
    expect(onRecord).toHaveBeenCalledOnce();
  });
  it('has no axe violations (panel, list, discount)', async () => {
    const job = billFor('partial');
    render(<><BalancePanel job={job}><RecordPayment job={job} onRecord={() => {}} /></BalancePanel><PaymentList payments={job.payments} canVoid onVoid={() => {}} /><PaymentDiscount job={job} onApply={() => {}} onRemove={() => {}} onCancel={() => {}} /></>);
    const r = await axe.run(document.body, axeOpts);
    expect(r.violations).toEqual([]);
  });
});
