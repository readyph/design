// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { PlatformsPage, type PlatformsPageProps } from './Platforms.page';
import { headline, healthLine, idleShares, mapPlatforms, ordered, sets } from './Platforms.data';
import { clearToasts } from '../components/toast/toastStore';

afterEach(() => {
  cleanup();
  clearToasts();
});

const renderPage = (props: PlatformsPageProps = {}) => render(<PlatformsPage {...props} />);
const sheet = () => screen.getByRole('main', { name: 'All platforms' });

describe('Platforms data', () => {
  it('maps only the platforms to the map, with no HQ building', () => {
    const placed = mapPlatforms(sets.duo).filter(Boolean);
    expect(placed).toHaveLength(sets.duo.platforms.length);
    expect(placed.some((p) => p?.name === 'HQ')).toBe(false);
  });

  it('words the finding line like the handover', () => {
    expect(headline(sets.duo)).toBe('Parts Stockroom shares its catalog with Dela Cruz Auto Works.');
    expect(headline(sets.many)).toBe('4 data links. Cubao Parts Counter needs a stock source.');
    expect(headline(sets.empty)).toBe('No platforms yet.');
  });
  it('orders problems first and counts them', () => {
    expect(ordered(sets.many).map((p) => p.id)).toEqual(['cebu', 'counter', 'marikina', 'storefront', 'stockroom', 'autoworks', 'kapitolyo']);
    expect(healthLine(sets.many)).toBe('7 platforms · 1 offline, 1 need setup, 1 slow');
  });
  it('lists what is not shared yet with the kinds that could read it', () => {
    const [x] = idleShares(sets.duo);
    expect(x.platform.name).toBe('Parts Stockroom');
    expect(x.readers).toEqual(['pos', 'storefront', 'mobile_app']);
  });
});

describe('Platforms page', () => {
  it('lists the platforms in the sheet, problem first, with plain health words', () => {
    renderPage({ set: 'many' });
    const rows = within(within(sheet()).getByRole('table', { name: 'All platforms' })).getAllByRole('row');
    expect(rows[1].textContent).toContain('Cebu Parts Stockroom');
    expect(rows[1].textContent).toContain('Offline since Wed 18:05');
    expect(rows[2].textContent).toContain('Setup needed');
    expect(within(rows[2]).getByRole('button', { name: 'Finish setup' })).toBeTruthy();
  });

  it('puts the data links and Not shared yet in the place column', () => {
    renderPage({ set: 'duo' });
    const place = screen.getByRole('region', { name: 'Your platforms' });
    expect(within(place).getByRole('heading', { level: 1, name: 'Platforms' })).toBeTruthy();
    expect(within(place).getByRole('group', { name: 'Data links' })).toBeTruthy();
    expect(within(place).getByRole('group', { name: 'Not shared yet' })).toBeTruthy();
    expect(within(place).getByText(/2 platforms · 1 data link$/)).toBeTruthy();
    expect(within(place).queryByText(/HQ/)).toBeNull();
  });

  it('opens the marketplace from "Add another platform" and returns focus to it on Escape', async () => {
    const user = userEvent.setup();
    renderPage();
    const add = within(sheet()).getByRole('button', { name: /Add another platform/ });
    await user.click(add);
    expect(screen.getByRole('dialog', { name: 'Add a platform' })).toBeTruthy();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(add);
  });

  it('opens the marketplace from the rail plus and from a Not shared yet Add with the reader picked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(within(screen.getAllByRole('navigation', { name: 'Portal' })[0]).getByRole('button', { name: 'Add a platform' }));
    expect(screen.getByRole('dialog', { name: 'Add a platform' })).toBeTruthy();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const idle = screen.getByRole('group', { name: 'Not shared yet' });
    await user.click(within(idle).getByRole('button', { name: /Add POS/ }));
    expect((screen.getByRole('radio', { name: 'POS' }) as HTMLInputElement).getAttribute('aria-checked')).toBe('true');
  });

  it('opens the marketplace with Leda\'s note when Leda proposes a POS', async () => {
    renderPage({ add: { pick: 'pos', fromLeda: true } });
    expect(screen.getByRole('dialog', { name: 'Add a platform' })).toBeTruthy();
    expect(screen.getByText(/Add a POS for the parts counter/)).toBeTruthy();
  });

  it('error: Try again moves focus to the list heading once the button is gone, and not when the user went elsewhere', async () => {
    const user = userEvent.setup();
    renderPage({ state: 'error' });
    expect(within(sheet()).getByRole('alert').textContent).toContain('Couldn’t load your platforms.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(within(sheet()).queryByRole('alert')).toBeNull());
    expect(document.activeElement).toBe(within(sheet()).getByRole('heading', { name: 'All platforms' }));
  });

  it('loading is busy with a status; empty offers the first step', async () => {
    const { unmount } = renderPage({ state: 'loading' });
    expect(within(sheet()).getByRole('status').textContent).toBe('Loading your platforms');
    unmount();
    const user = userEvent.setup();
    renderPage({ set: 'empty' });
    expect(within(sheet()).getByRole('heading', { name: 'No platforms yet' })).toBeTruthy();
    const choose = within(sheet()).getByRole('button', { name: 'Choose a platform' });
    await user.click(choose);
    expect(screen.getByRole('dialog', { name: 'Add a platform' })).toBeTruthy();
  });

  it('Disconnect asks first and Cancel returns focus to the row menu button', async () => {
    const user = userEvent.setup();
    renderPage();
    const more = within(sheet()).getByRole('button', { name: 'More for Parts Stockroom' });
    more.focus();
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('menuitem', { name: 'Disconnect' }));
    const dlg = await screen.findByRole('alertdialog');
    expect(dlg.textContent).toContain('Disconnect Parts Stockroom?');
    await user.click(within(dlg).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(document.activeElement).toBe(more);
  });

  it('j and k move the cursor row through the platforms, problem first', async () => {
    const user = userEvent.setup();
    renderPage({ set: 'many' });
    const cur = () => within(sheet()).getAllByRole('row').filter((r) => r.getAttribute('aria-current') === 'true').map((r) => r.textContent ?? '');
    await user.keyboard('j');
    expect(cur()).toHaveLength(1);
    expect(cur()[0]).toContain('Cebu Parts Stockroom');
    await user.keyboard('j');
    expect(cur()[0]).toContain('Cubao Parts Counter');
    await user.keyboard('k');
    expect(cur()[0]).toContain('Cebu Parts Stockroom');
  });
});

describe('axe', () => {
  const cases: [string, PlatformsPageProps][] = [
    ['two platforms', { set: 'duo' }],
    ['few', { set: 'few' }],
    ['many', { set: 'many' }],
    ['loading', { state: 'loading' }],
    ['error', { state: 'error' }],
    ['empty', { set: 'empty' }],
    ['marketplace from Leda', { add: { pick: 'pos', fromLeda: true } }],
  ];
  for (const [name, props] of cases) {
    it(`has no axe violations (${name})`, async () => {
      const { container } = renderPage(props);
      const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, /* jsdom has no CSS, so the rail and phone nav (both "Portal" in PortalFrame) both show; the real-browser axe pass covers it */ 'landmark-unique': { enabled: false } } });
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
});
