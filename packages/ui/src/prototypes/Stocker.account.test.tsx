import { afterEach, describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { cleanup, render, screen } from '@testing-library/react';
import { StockerAccountPage, StockerSignedOutPage } from './Stocker.account';

afterEach(cleanup);
const axeOk = async () => expect((await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);

describe('Stocker Account', () => {
  it('one long form, stocker notifications, no Leda, Log out', async () => {
    render(<StockerAccountPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Account' })).toBeTruthy();
    expect(screen.getByText('Your manager answered me')).toBeTruthy();
    expect(screen.getByText('An order is due to arrive')).toBeTruthy();
    expect(screen.queryByText('Stock is low or out')).toBeNull();
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByRole('link', { name: /Log out/ }).getAttribute('href')).toBe('stocker-signedout.html');
    await axeOk();
  });
  it('tenant B and load states', () => {
    const a = render(<StockerAccountPage tenant="b" />);
    expect(screen.getByRole('link', { name: /Log out/ }).getAttribute('href')).toBe('stocker-signedout.html?tenant=b');
    a.unmount();
    render(<StockerAccountPage state="error" />);
    expect(screen.getByText(/did not load/i)).toBeTruthy();
  });
});

describe('Stocker Signed out', () => {
  it('heading, lead, Sign in to Home', async () => {
    render(<StockerSignedOutPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'You are signed out' })).toBeTruthy();
    expect(screen.getByText('Your work is saved. Sign in to carry on.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('stocker.html');
    expect(screen.getByText(/Prototype: no password is asked/)).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Stocker' })).toBeNull();
    await axeOk();
  });
});
