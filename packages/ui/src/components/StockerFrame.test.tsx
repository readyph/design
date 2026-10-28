import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { StockerFrame } from './StockerFrame';

afterEach(cleanup);
const base = { platform: 'Parts Stockroom', account: { initials: 'MR', name: 'Mara Reyes', href: '#' }, homeHref: '#' };

describe('StockerFrame', () => {
  it('has one h1, the platform name and a Stocker tab nav with aria-current', () => {
    render(<StockerFrame {...base} title="What do you want to do?" tab="out" />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText('Parts Stockroom')).toBeTruthy();
    const nav = screen.getByRole('navigation', { name: 'Stocker' });
    expect(nav.querySelectorAll('a')).toHaveLength(4);
    expect(screen.getByText('Stock out').closest('a')?.getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('Home').closest('a')?.getAttribute('aria-current')).toBeNull();
  });
  it('with back, steps and a bar the tabs stay visible', () => {
    render(<StockerFrame {...base} title="Find" tab="out" back={{ href: '#', label: 'Stock out' }} steps={{ n: 2, of: 3, label: 'Find the product' }} bar={<p>Stock goes from 4 to 3.</p>} />);
    expect(screen.getByRole('navigation', { name: 'Stocker' })).toBeTruthy();
    expect(screen.getByLabelText('Back to Stock out')).toBeTruthy();
    expect(screen.getByText('2 of 3')).toBeTruthy();
    expect(screen.getByText('Stock goes from 4 to 3.')).toBeTruthy();
  });
  it('signed out has no tabs and no account', () => {
    render(<StockerFrame {...base} title="You are signed out" signedOut />);
    expect(screen.queryByRole('navigation', { name: 'Stocker' })).toBeNull();
    expect(screen.queryByLabelText(/Account/)).toBeNull();
  });
  it('has no axe violations', async () => {
    const { container } = render(<StockerFrame {...base} title="Find a product" tab="find" steps={{ n: 1, of: 3, label: 'Scan' }} snack="Saved" />);
    const r = await axe.run(container, { rules: { region: { enabled: false } } });
    expect(r.violations).toEqual([]);
  });
});
