import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { PurchaseOrdersPage, type PurchaseOrdersPageProps } from './PurchaseOrders.page';

afterEach(cleanup);

describe('PurchaseOrdersPage list (RDY-426)', () => {
  it('shows the headline, the status words and the Receive action', () => {
    render(<PurchaseOrdersPage />);
    expect(screen.getByRole('heading', { name: 'Purchase orders' })).toBeTruthy();
    expect(screen.getAllByText('Part in').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /^Receive Motolite PH, PO-0222$/ }).length).toBe(1);
  });
  it('groups by supplier', () => {
    render(<PurchaseOrdersPage />);
    fireEvent.click(screen.getByRole('button', { name: 'By supplier' }));
    expect(screen.getByRole('region', { name: 'Autopro Distribution' })).toBeTruthy();
  });
  it('clerk sees no totals', () => {
    render(<PurchaseOrdersPage as="clerk" />);
    expect(screen.queryByText('Total')).toBeNull();
  });
  it('error disables Receive a delivery and Retry clears it', () => {
    render(<PurchaseOrdersPage state="error" />);
    expect((screen.getByRole('button', { name: 'Receive a delivery' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect((screen.getByRole('button', { name: 'Receive a delivery' }) as HTMLButtonElement).disabled).toBe(false);
  });
  it('no results offers Clear filters', () => {
    render(<PurchaseOrdersPage qs="zzz" />);
    expect(screen.getByText('No purchase order matches')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeTruthy();
  });
});

describe('axe', () => {
  const cases: [string, PurchaseOrdersPageProps][] = [
    ['list', {}], ['group by supplier', { group: 'sup' }], ['no POs', { pos: 'none' }], ['no results', { qs: 'zzz' }], ['loading', { state: 'loading' }],
    ['error', { state: 'error' }], ['late', { asof: 2 }], ['clerk', { as: 'clerk' }], ['tenant B', { tenant: 'b' }],
  ];
  it.each(cases)('%s has no violations', async (_n, props) => {
    const { container } = render(<PurchaseOrdersPage {...props} />);
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 120)}`)).toEqual([]);
  });
});
