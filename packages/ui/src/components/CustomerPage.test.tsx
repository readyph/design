import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import axe from 'axe-core';
import { CustomerPage } from './CustomerPage';
import { customers } from './sms/data';
import { allServices } from './sms/scheduleData';
import { extraHistory } from './sms/customerExtras';
import { recOf } from './sms/customersModel';

const rec = (id: string) => recOf(customers.find((c) => c.id === id)!, [...allServices, ...extraHistory]);
const noop = () => {};
const base = { onOpenService: noop, onNewService: noop, onEdit: noop, onCar: noop, onRemoveCar: noop, onBack: noop };

describe('CustomerPage', () => {
  afterEach(cleanup);
  it('goes back, edits, and starts a service for the only car', () => {
    const back = vi.fn(); const ns = vi.fn(); const r = rec('c03');
    render(<CustomerPage {...base} rec={r} notes="" onBack={back} onNewService={ns} />);
    fireEvent.click(screen.getByRole('button', { name: /Customers/ }));
    expect(back).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'New service' }));
    expect(ns).toHaveBeenCalledWith(r.customer.vehicles[0]!.id);
  });
  it('asks which car when there are several', () => {
    const ns = vi.fn();
    render(<CustomerPage {...base} rec={rec('c06')} notes="" onNewService={ns} />);
    fireEvent.click(screen.getByRole('button', { name: 'New service' }));
    expect(ns).toHaveBeenCalledWith(undefined);
  });
  it('explains why a car with services cannot be removed', () => {
    const r = rec('c01');
    render(<CustomerPage {...base} rec={r} notes="" initialRemove="v23" />);
    expect(screen.getByText(/Cannot remove/)).toBeTruthy();
  });
  it('has no axe violations (three cars, new customer)', async () => {
    for (const id of ['c06', 'c07']) {
      const { unmount } = render(<CustomerPage {...base} rec={rec(id)} notes="" />);
      const r = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
      expect(r.violations).toEqual([]);
      unmount();
    }
  });
});
