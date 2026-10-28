import { afterEach, describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { cleanup, render, screen } from '@testing-library/react';
import { StockerFramePage } from './Stocker.page';
import { stockerData } from './Stocker.data';

afterEach(cleanup);
const axeOk = async () => expect((await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);

describe('Stocker frame page', () => {
  it('live: platform, tabs, lead, receive row, no axe violations', async () => {
    render(<StockerFramePage />);
    expect(screen.getByText('Parts Stockroom')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Stocker' }).querySelectorAll('a')).toHaveLength(4);
    expect(screen.getByText('To receive')).toBeTruthy();
    await axeOk();
  });
  it('loading: busy skeleton, no axe violations', async () => {
    const { container } = render(<StockerFramePage state="loading" />);
    expect(container.querySelector('[aria-busy="true"]')?.children).toHaveLength(6);
    await axeOk();
  });
  it('error: message with Try again that drops the state', async () => {
    render(<StockerFramePage state="error" />);
    expect(screen.getByText(/Orders did not load\./)).toBeTruthy();
    expect(screen.getByText(/Last loaded 9:10 AM\./)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Try again' }).getAttribute('href')).toBe('stocker.html');
    await axeOk();
  });
  it('empty: no products message', async () => {
    render(<StockerFramePage state="empty" />);
    expect(screen.getByText('No products yet.')).toBeTruthy();
    await axeOk();
  });
  it('quiet: nothing to send or check in; adapter links keep tenant and state', () => {
    const s = stockerData({ tenant: 'b', state: 'quiet' });
    expect(s.toSend()).toHaveLength(0);
    expect(s.toCheck()).toHaveLength(0);
    expect(s.href('stocker-in.html', { po: 'PO-1' })).toBe('stocker-in.html?tenant=b&state=quiet&po=PO-1');
  });
});
