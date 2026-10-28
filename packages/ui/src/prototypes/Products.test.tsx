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
    expect(screen.getByText('The stock is low and we need to restock soon.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Adjust stock' })).toBeTruthy();
    await axeOk();
  });
  it('clerk: Record stock out, no cost', () => {
    render(<ProductsPage as="clerk" open="p07" />);
    expect(screen.getByRole('button', { name: 'Record stock out' })).toBeTruthy();
    expect(screen.queryByText(/Stock value/)).toBeNull();
  });
});
