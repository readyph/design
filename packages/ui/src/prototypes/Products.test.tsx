import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { cleanup, render, screen } from '@testing-library/react';
import { ProductsPage } from './Products.page';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
afterEach(cleanup);
const axeOk = async () => expect((await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);

describe('Products page', () => {
  it('list: headline, tabs, no axe violations', async () => {
    render(<ProductsPage />);
    expect(screen.getByText(/products need stock: \d+ low stock, \d+ out of stock/)).toBeTruthy();
    expect(screen.getAllByText('Order lists').length).toBeGreaterThan(0);
    await axeOk();
  });
  it('detail: low-stock note, manager actions, no axe violations', async () => {
    render(<ProductsPage open="p07" />);
    expect(screen.getAllByText('The stock is low and we need to restock soon.')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Adjust stock' })).toBeTruthy();
    await axeOk();
  });
  it('clerk: Record stock out, no cost', () => {
    render(<ProductsPage as="clerk" open="p07" />);
    expect(screen.getAllByRole('button', { name: 'Record stock out' })).toBeTruthy();
    expect(screen.queryByText(/Stock value/)).toBeNull();
  });
  it.each([
    ['adjust panel', { open: 'p07', panel: 'adjust' }],
    ['list panel', { open: 'p07', panel: 'list' }],
    ['steady use rate', { open: 'p01' }],
    ['add dialog', { addDialog: true }],
    ['loading', { state: 'loading' }],
    ['down', { state: 'down' }],
    ['error detail', { state: 'error', open: 'p07' }],
    ['empty', { state: 'empty' }],
    ['clerk detail', { as: 'clerk', open: 'p07' }],
    ['tenant B', { tenant: 'b' }],
    ['needs setting up', { requests: [{ id: 'np1', barcode: '4805550031415', name: 'Fleetguard LF3349', qty: 6, by: 'jomar', at: 'Thu 22 Oct 8:40' }] }],
    ['order lists panel', { ordersOpen: true }],
    ['error detail', { state: 'error', open: 'p07' }],
  ] as const)('%s: no axe violations', async (_n, props) => {
    render(<ProductsPage {...(props as object)} />);
    await axeOk();
  });
});
