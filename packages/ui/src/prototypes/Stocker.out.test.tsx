import { afterEach, describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StockerOutPage } from './Stocker.out';

afterEach(cleanup);
const axeOk = async () => expect((await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);

describe('Stocker Stock out', () => {
  it('start: scan, likely rows, transfers to send', async () => {
    render(<StockerOutPage />);
    expect(screen.getByText('Scan or type a barcode')).toBeTruthy();
    expect(screen.getByText('Transfers to send')).toBeTruthy();
    await axeOk();
  });
  it('loading', () => {
    const { container } = render(<StockerOutPage state="loading" />);
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
  it('sold: reason, how many, take out', async () => {
    render(<StockerOutPage p="p04" />);
    fireEvent.click(screen.getByRole('radio', { name: /Sold/ }));
    const b = screen.getByRole('button', { name: /Take out/ }) as HTMLButtonElement;
    expect(b.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'One more How many are going out' }));
    expect(b.disabled).toBe(false);
    expect(screen.getByText(/Take out 1 bottle/)).toBeTruthy();
    await axeOk();
  });
  it('used on a job needs a job order; damaged locks to the manager', async () => {
    render(<StockerOutPage p="p07" />);
    fireEvent.click(screen.getByRole('radio', { name: /Used on a job/ }));
    fireEvent.click(screen.getByRole('button', { name: 'One more How many are going out' }));
    expect((screen.getByRole('button', { name: /Take out/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'JO-0413' }));
    expect((screen.getByRole('button', { name: /Take out/ }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole('radio', { name: /Damaged or lost/ }));
    expect(screen.getByText(/writes off damaged or lost stock/)).toBeTruthy();
    await axeOk();
  });
  it('send a transfer and the done screen', async () => {
    render(<StockerOutPage tr="TR-0032" />);
    expect(screen.getByText(/sends this one/)).toBeTruthy();
    await axeOk();
    cleanup();
    render(<StockerOutPage done />);
    expect(screen.getByText('Back to Home')).toBeTruthy();
  });
});
