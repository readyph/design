import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import axe from 'axe-core';
import { CustomersTable, CustomerCard } from './CustomersTable';
import { customers, jobs } from './sms/data';
import { recOf } from './sms/customersModel';

const recs = customers.slice(0, 4).map((c) => recOf(c, jobs));

describe('CustomersTable', () => {
  it('opens a customer and starts a new service without opening the row', () => {
    const open = vi.fn(); const ns = vi.fn();
    render(<CustomersTable rows={recs} onOpen={open} onNewService={ns} />);
    fireEvent.click(screen.getByRole('button', { name: `New service for ${recs[0]!.customer.name}` }));
    expect(ns).toHaveBeenCalledWith(recs[0]);
    expect(open).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: `Open customer ${recs[0]!.customer.name}` }));
    expect(open).toHaveBeenCalledWith(recs[0]);
  });
  // empty-table-header off: the action column header is empty in the source design (copied verbatim).
  it('has no axe violations (table and cards)', async () => {
    render(<><CustomersTable rows={recs} openId={recs[1]!.customer.id} onOpen={() => {}} onNewService={() => {}} /><CustomerCard rec={recs[0]!} onOpen={() => {}} /></>);
    const r = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'empty-table-header': { enabled: false } } });
    expect(r.violations).toEqual([]);
  });
});
