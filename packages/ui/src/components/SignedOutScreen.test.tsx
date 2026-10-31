import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { SignedOutScreen, signedOutTenants } from './SignedOutScreen';

afterEach(cleanup);

describe('SignedOutScreen', () => {
  it('shows the platform, one h1 and a Sign in link', () => {
    render(<SignedOutScreen platform={signedOutTenants.b.platform} logo={signedOutTenants.b.logo} signInHref="/stocker?tenant=b" />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText('Café Inventory')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('/stocker?tenant=b');
  });
  it('has no axe violations', async () => {
    const { container } = render(<SignedOutScreen platform="Parts Stockroom" signInHref="#" note="Note" />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
