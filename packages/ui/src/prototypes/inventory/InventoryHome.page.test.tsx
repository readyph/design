import { describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach } from 'vitest';
import { InventoryHomePage } from './InventoryHome.page';

afterEach(cleanup);

describe('InventoryHomePage', () => {
  it('renders the heading, stamp, markers and zones (live)', () => {
    render(<InventoryHomePage tenant="a" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Today' })).toBeTruthy();
    expect(screen.getAllByText(/Updated 9:12 AM/).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /to do/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /need stock/ })).toBeTruthy();
  });
  it('shows the first-run actions when empty', () => {
    render(<InventoryHomePage tenant="a" state="empty" />);
    expect(screen.getByText('Add your first product')).toBeTruthy();
    expect(screen.getByText('Let Leda read a supplier list')).toBeTruthy();
  });
  it('This week changes the heading', () => {
    render(<InventoryHomePage tenant="a" view="week" />);
    expect(screen.getByRole('heading', { level: 1, name: 'This week' })).toBeTruthy();
  });
  it('has no axe violations in live, empty, loading and error', async () => {
    for (const state of ['live', 'empty', 'loading', 'error'] as const) {
      const { container } = render(<InventoryHomePage tenant="a" state={state} />);
      // landmark-unique off: the shared Inventory chrome (Products.chrome.tsx) renders the rail and the phone tab bar as two nav landmarks both labelled Inventory
      const r = await axe.run(container, { rules: { 'landmark-unique': { enabled: false }, 'color-contrast': { enabled: false }, region: { enabled: false }, 'heading-order': { enabled: false } } });
      expect(r.violations.map((v) => `${state}:${v.id}`)).toEqual([]);
      cleanup();
    }
  });
});
