import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BarcodeSheet, digitsOf, isCode, UNKNOWN_BARCODE, type BarcodeProduct } from './BarcodeSheet';

const products: BarcodeProduct[] = [
  { id: 'a', name: 'Oil filter', sku: 'OF-1', barcode: '4805550000017', unit: 'pc', onHand: 3, location: 'Shelf A' },
];

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); };
});
afterEach(cleanup);

const setup = (over = {}) => {
  const onFound = vi.fn();
  const onOpenChange = vi.fn();
  render(<BarcodeSheet open onOpenChange={onOpenChange} products={products} samples={products} onFound={onFound} {...over} />);
  return { onFound, onOpenChange };
};

describe('BarcodeSheet', () => {
  it('shows the prototype section when samples are given', () => {
    setup();
    expect(screen.getByText('Pretend you scanned one')).toBeTruthy();
    expect(screen.getByText('A product we do not have')).toBeTruthy();
  });
  it('production: empty samples hide the whole prototype section', () => {
    setup({ samples: [] });
    expect(screen.queryByText('Pretend you scanned one')).toBeNull();
    expect(screen.queryByText(/Prototype only/)).toBeNull();
    expect(screen.queryByText('A product we do not have')).toBeNull();
    expect(screen.queryByText(UNKNOWN_BARCODE)).toBeNull();
  });
  it('production: omitted samples hide it too', () => {
    setup({ samples: undefined });
    expect(screen.queryByText('Pretend you scanned one')).toBeNull();
  });
  it('helpers', () => {
    expect(digitsOf('48 05-5')).toBe('48055');
    expect(isCode('12345678')).toBe(true);
    expect(isCode('1234567')).toBe(false);
  });
  it('is a labelled dialog with the live results region', () => {
    setup();
    const d = document.querySelector('dialog')!;
    expect(d.getAttribute('aria-labelledby')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Scan or type the barcode');
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy();
  });
  it('13 digits of a known product go to onFound', () => {
    const { onFound } = setup();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '4805550000017' } });
    expect(onFound).toHaveBeenCalledWith(products[0], '4805550000017');
  });
  it('unknown barcode shows the unknown state with one action and Try another barcode', () => {
    setup({ unknown: { label: 'Tell your manager', href: '#' } });
    fireEvent.click(screen.getByText('A product we do not have'));
    expect(screen.getByText("We don't have this product yet.")).toBeTruthy();
    expect(screen.getAllByText(UNKNOWN_BARCODE).length).toBe(2);
    expect(screen.getByRole('link', { name: /Tell your manager/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try another barcode' })).toBeTruthy();
  });
  it('fewer digits say how many are typed', () => {
    setup();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '123' } });
    expect(screen.getByText(/3 digits so far/)).toBeTruthy();
  });
  it('capture mode sends any code to onCode', () => {
    const onCode = vi.fn();
    setup({ mode: 'capture', onCode });
    fireEvent.click(screen.getByText('A product we do not have'));
    expect(onCode).toHaveBeenCalledWith(UNKNOWN_BARCODE, null);
  });
  it('has no axe violations (open, unknown state)', async () => {
    setup({ unknown: { label: 'Tell your manager', href: '#' } });
    fireEvent.click(screen.getByText('A product we do not have'));
    const r = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
    expect(r.violations).toEqual([]);
  });
});
