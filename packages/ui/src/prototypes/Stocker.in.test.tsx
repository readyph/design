import { afterEach, describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StockerInPage } from './Stocker.in';

afterEach(cleanup);
const axeOk = async () => expect((await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);

describe('Stocker Stock in', () => {
  it('landing: two paths with waiting counts', async () => {
    render(<StockerInPage />);
    expect(screen.getByText('It is on an order')).toBeTruthy();
    expect(screen.getByText(/Waiting: 2 orders and 1 transfer\./)).toBeTruthy();
    await axeOk();
  });
  it('loading and which order', async () => {
    const { container, unmount } = render(<StockerInPage state="loading" />);
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    unmount();
    render(<StockerInPage via="order" />);
    expect(screen.getByText('Orders on their way')).toBeTruthy();
    await axeOk();
  });
  it('something else: pick a product, count, confirm', async () => {
    render(<StockerInPage via="other" p="p04" />);
    expect((screen.getByRole('button', { name: /Put into stock/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'One more How many arrived' }));
    fireEvent.click(screen.getByRole('button', { name: 'Put 1 into stock' }));
    expect(screen.getByText('Undo this')).toBeTruthy();
    await axeOk();
  });
  it('receive an order: All here enables Put into stock', async () => {
    render(<StockerInPage po="PO-0222" />);
    const b = screen.getByRole('button', { name: 'Put into stock' }) as HTMLButtonElement;
    expect(b.disabled).toBe(true);
    fireEvent.click(screen.getAllByRole('button', { name: /^All \d+ here$/ })[0]);
    expect(b.disabled).toBe(false);
    await axeOk();
  });
  it('check in a transfer and the done screen', async () => {
    render(<StockerInPage tr="TR-0030" />);
    expect((screen.getByRole('button', { name: 'Check in' }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    render(<StockerInPage done />);
    expect(screen.getByText('Back to Home')).toBeTruthy();
    await axeOk();
  });
});
