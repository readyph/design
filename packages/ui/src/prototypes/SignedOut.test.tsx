import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { SignedOutPage, type SignedOutPageProps } from './SignedOut.page';

afterEach(cleanup);

describe('SignedOutPage', () => {
  it('says what the workshop page says', () => {
    render(<SignedOutPage />);
    expect(screen.getByText('Parts Stockroom')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'You are signed out' })).toBeTruthy();
    expect(screen.getByText('Your work is saved. Sign in to carry on.')).toBeTruthy();
    expect(screen.getByText('Signing in here takes you back to Home. (Prototype: no password is asked.)')).toBeTruthy();
    expect(document.title).toBe('Signed out · Parts Stockroom');
    expect(document.activeElement).toBe(screen.getByRole('heading'));
  });
  it('keeps tenant, viewer and theme on the Sign in link', () => {
    render(<SignedOutPage tenant="b" as="p2" theme="dark" />);
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('home.html?tenant=b&as=p2&theme=dark');
    expect(screen.getByText('Café Inventory')).toBeTruthy();
    cleanup();
    render(<SignedOutPage />);
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('home.html');
  });
});

describe('axe', () => {
  const cases: [string, SignedOutPageProps][] = [
    ['tenant A', { tenant: 'a' }],
    ['tenant B dark', { tenant: 'b', theme: 'dark' }],
  ];
  for (const [name, props] of cases) {
    it(`has no axe violations (${name})`, async () => {
      const { container } = render(<SignedOutPage {...props} />);
      const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
      expect(r.violations.map((v) => v.id)).toEqual([]);
    });
  }
});
