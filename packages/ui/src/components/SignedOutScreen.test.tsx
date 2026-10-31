import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { heroGeometry } from './Button';
import { SignedOutScreen, signedOutTenants } from './SignedOutScreen';

afterEach(cleanup);

describe('SignedOutScreen', () => {
  it('shows the platform, one h1 and a Sign in link', () => {
    render(<SignedOutScreen platform={signedOutTenants.b.platform} logo={signedOutTenants.b.logo} signInHref="/stocker?tenant=b" />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText('Café Inventory')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('/stocker?tenant=b');
  });
  it('Sign in is the hero ButtonLink (workshop .so .go): 44px, px-6, 15px semibold, 52px and full width on phone, 24px top margin', () => {
    render(<SignedOutScreen platform="Parts Stockroom" signInHref="#" />);
    const link = screen.getByRole('link', { name: 'Sign in' });
    for (const c of heroGeometry.split(' ')) expect(link.className).toContain(c);
    expect(link.className).not.toContain('h-[var(--ctl-button)]');
    const wrap = link.parentElement as HTMLElement;
    expect(wrap.className).toContain('mt-6');
    expect(wrap.className).toContain('max-[640px]:grid');
  });
  it('has no axe violations', async () => {
    const { container } = render(<SignedOutScreen platform="Parts Stockroom" signInHref="#" note="Note" />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
