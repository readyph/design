import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StockerApp, parseStockerHref } from './Stocker.app';

afterEach(cleanup);

describe('Stocker app', () => {
  it('parses workshop links into page and params; stocker.html?p= goes to Find', () => {
    expect(parseStockerHref('stocker-in.html?tenant=b&state=quiet&po=PO-1')).toEqual({ file: 'stocker-in.html', params: { tenant: 'b', state: 'quiet', po: 'PO-1' } });
    expect(parseStockerHref('stocker.html?p=p07')?.file).toBe('stocker-find.html');
    expect(parseStockerHref('stocker.html?np=123')?.file).toBe('stocker.html');
    expect(parseStockerHref('https://x.test/')).toBeNull();
  });
  it('a tab link opens the other page', () => {
    render(<StockerApp />);
    const nav = screen.getByRole('navigation', { name: 'Stocker' });
    const link = Array.from(nav.querySelectorAll('a')).find((a) => a.getAttribute('href')?.startsWith('stocker-out.html'));
    expect(link).toBeTruthy();
    fireEvent.click(link as HTMLAnchorElement);
    expect(screen.getByText('What are you taking out?')).toBeTruthy();
  });
});
