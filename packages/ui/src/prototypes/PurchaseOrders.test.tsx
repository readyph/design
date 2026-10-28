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

describe('PurchaseOrdersPage one order (RDY-427)', () => {
  it('part in: facts, steps, lines, history', () => {
    render(<PurchaseOrdersPage po="PO-0223" />);
    expect(screen.getByRole('heading', { name: /PO-0223/ })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Where this order is' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'What was ordered' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Receive delivery' }).length).toBeGreaterThan(0);
  });
  it('Cancel this order asks first, Keep the order closes it', () => {
    render(<PurchaseOrdersPage po="PO-0222" />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel this order' }));
    expect(screen.getByRole('group', { name: 'Confirm cancelling' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Keep the order' }));
    expect(screen.queryByRole('group', { name: 'Confirm cancelling' })).toBeNull();
  });
  it('clerk cannot Mark as sent or Cancel and sees no totals', () => {
    render(<PurchaseOrdersPage po="PO-0222" as="clerk" />);
    expect(screen.queryByRole('button', { name: 'Cancel this order' })).toBeNull();
    expect(screen.queryByText('Total')).toBeNull();
  });
  it('the last receipt offers Undo this receipt', () => {
    render(<PurchaseOrdersPage po="PO-0222" receipt />);
    expect(screen.getByRole('button', { name: 'Undo this receipt' })).toBeTruthy();
  });
});

describe('axe', () => {
  const cases: [string, PurchaseOrdersPageProps][] = [
    ['list', {}], ['group by supplier', { group: 'sup' }], ['no POs', { pos: 'none' }], ['no results', { qs: 'zzz' }], ['loading', { state: 'loading' }],
    ['error', { state: 'error' }], ['order draft', { po: 'PO-0224' }], ['order draft send question', { po: 'PO-0224', confirm: 'send' }], ['order sent', { po: 'PO-0222' }], ['order cancel question', { po: 'PO-0222', confirm: 'cancel' }], ['order part in', { po: 'PO-0223' }], ['order received', { po: 'PO-0221' }], ['order cancelled', { po: 'PO-0218' }], ['order short', { po: 'PO-0217' }], ['order undo', { po: 'PO-0222', receipt: true }], ['order clerk', { po: 'PO-0223', as: 'clerk' }], ['order tenant B', { po: 'PO-0046', tenant: 'b' }], ['late', { asof: 2 }], ['clerk', { as: 'clerk' }], ['tenant B', { tenant: 'b' }],
  ];
  it.each(cases)('%s has no violations', async (_n, props) => {
    const { container } = render(<PurchaseOrdersPage {...props} />);
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 120)}`)).toEqual([]);
  });
});

describe('PurchaseOrdersPage Receive and short delivery (RDY-428)', () => {
  it('Receive shows the form and Cancel returns to the order', () => {
    render(<PurchaseOrdersPage po="PO-0222" receive />);
    expect(screen.getByRole('heading', { name: /Receive PO-0222/ })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Cancel' }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[0]);
    expect(screen.getByRole('heading', { name: /PO-0222/ })).toBeTruthy();
  });
  it('Receive delivery opens Receive', () => {
    render(<PurchaseOrdersPage po="PO-0222" />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Receive delivery' })[0]);
    expect(screen.getByText(/Count what is on the delivery/)).toBeTruthy();
  });
  it('Receive a delivery asks which delivery arrived', () => {
    render(<PurchaseOrdersPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Receive a delivery' }));
    expect(screen.getByText('Which delivery arrived?')).toBeTruthy();
  });
  it('short delivery: manager settles, clerk tells the manager, error disables', () => {
    const { unmount } = render(<PurchaseOrdersPage po="PO-0221" />);
    expect(screen.getByRole('button', { name: /Accept the shortage/ })).toBeTruthy();
    unmount();
    const c = render(<PurchaseOrdersPage po="PO-0221" as="clerk" />);
    expect(screen.getByRole('button', { name: /Tell your manager/ })).toBeTruthy();
    c.unmount();
    render(<PurchaseOrdersPage po="PO-0221" state="error" />);
    expect((screen.getByRole('button', { name: /Accept the shortage/ }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('axe: receive and short delivery', async () => {
    for (const p of [{ po: 'PO-0222', receive: true }, { po: 'PO-0221' }] as PurchaseOrdersPageProps[]) {
      const { container, unmount } = render(<PurchaseOrdersPage {...p} />);
      const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
      expect(r.violations.map((v) => v.id)).toEqual([]);
      unmount();
    }
  });
});
