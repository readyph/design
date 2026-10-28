import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountMenu, applyTheme, initialsOf } from './AccountMenu';

const setup = (props = {}) => {
  const user = userEvent.setup();
  render(<AccountMenu name="Maria Santos" email="maria@x.ph" role="Owner" {...props} />);
  return user;
};
const focused = async (text: string) => {
  await waitFor(() => expect(document.activeElement?.textContent).toContain(text));
  await new Promise((r) => setTimeout(r, 60)); // let Radix's own entry focus settle
};
it('AccountButton name starts with its visible initials', () => {
  render(<AccountMenu name="Maria Santos" email="m@x.ph" role="Owner" />);
  const b = btn();
  expect(b.getAttribute('aria-label')!.startsWith(b.textContent!)).toBe(true);
  cleanup();
});
const btn = () => screen.getByRole('button', { name: /Account menu/, hidden: true });

afterEach(async () => {
  cleanup();
  await new Promise((r) => setTimeout(r, 50));
  document.body.removeAttribute('style');
  document.body.removeAttribute('data-scroll-locked');
  document.documentElement.removeAttribute('data-theme');
});

describe('AccountMenu', () => {
  it('has the menu button ARIA and header content', async () => {
    const user = setup();
    expect(btn().getAttribute('aria-haspopup')).toBe('menu');
    expect(btn().getAttribute('aria-expanded')).toBe('false');
    await user.click(btn());
    expect(btn().getAttribute('aria-expanded')).toBe('true');
    expect(btn().getAttribute('aria-controls')).toBeTruthy();
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(screen.getByText('Owner')).toBeTruthy();
    expect(screen.getByText('maria@x.ph')).toBeTruthy();
    expect(initialsOf('Maria Santos')).toBe('MS');
  });

  it('Enter opens focused on Account settings; ArrowUp opens on Log out', async () => {
    const user = setup();
    btn().focus();
    await user.keyboard('{Enter}');
    await focused('Account settings');
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(btn());
    await user.keyboard('{ArrowUp}');
    await focused('Log out');
  });

  it('Up/Down wrap through three stops; the theme row is one stop', async () => {
    const user = setup();
    btn().focus();
    await user.keyboard('{Enter}');
    await focused('Account settings');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement?.getAttribute('role')).toBe('menuitemradio');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toContain('Log out');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toContain('Account settings');
    await user.keyboard('{End}');
    expect(document.activeElement?.textContent).toContain('Log out');
    await user.keyboard('{Home}');
    expect(document.activeElement?.textContent).toContain('Account settings');
  });

  it('theme: Left/Right choose, keeps the menu open, sets data-theme; System removes it', async () => {
    const onThemeChange = vi.fn();
    const user = setup({ defaultTheme: 'light', onThemeChange });
    btn().focus();
    await user.keyboard('{Enter}');
    await focused('Account settings');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitemradio', { name: 'Light' }).getAttribute('aria-checked')).toBe('true');
    await user.keyboard('{ArrowRight}');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByRole('menu')).toBeTruthy();
    await user.keyboard('{ArrowRight}');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(onThemeChange).toHaveBeenLastCalledWith('system');
    await user.keyboard('{ArrowRight}');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('choosing an item closes; Tab closes and returns to the button', async () => {
    const onLogout = vi.fn();
    const user = setup({ onLogout });
    btn().focus();
    await user.keyboard('{Enter}');
    await focused('Account settings');
    await user.keyboard('{End}{Enter}');
    expect(onLogout).toHaveBeenCalled();
    expect(screen.queryByRole('menu')).toBeNull();
    await user.keyboard('{Enter}{Tab}');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('Account settings is a link with settingsHref', async () => {
    const user = setup({ settingsHref: '/settings' });
    await user.click(btn());
    expect(screen.getByRole('menuitem', { name: 'Account settings' }).getAttribute('href')).toBe('/settings');
  });
});

describe('AccountMenu workshop menu (RDY-364)', () => {
  it('avatar uses the avatar tokens and takes explicit initials', () => {
    setup({ initials: 'RD' });
    const b = btn();
    expect(b.textContent).toBe('RD');
    expect(b.firstElementChild!.className).toContain('bg-avatar-bg');
    expect(b.firstElementChild!.className).toContain('text-avatar-text');
  });
  it('head: 13px/600 name, outlined 18px role chip; theme row has icons and the 26px segments', async () => {
    const user = setup({ initials: 'RD' });
    await user.click(btn());
    const menu = await screen.findByRole('menu');
    const role = screen.getByText('Owner');
    expect(role.className).toContain('h-[18px]');
    expect(role.className).toContain('border-border');
    expect(screen.getByText('Maria Santos').className).toContain('font-semibold');
    expect(menu.className).toContain('text-[13px]');
    const light = screen.getByRole('menuitemradio', { name: 'Light' });
    expect(light.className).toContain('h-[26px]');
    expect(light.querySelector('svg')).toBeTruthy();
    expect(menu.querySelectorAll('[role="separator"]').length).toBe(2);
  });
});
