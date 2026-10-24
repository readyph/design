import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Package, Gauge, Users } from '@phosphor-icons/react';
import { PlatformShell, type PlatformShellProps } from './PlatformShell';

const base: Omit<PlatformShellProps, 'children'> = {
  platform: { name: 'Portal', icon: Gauge },
  company: 'Montauto',
  platforms: [{ id: 'inv', label: 'Inventory', icon: Package, status: 'active' }],
  sections: [
    { items: [{ key: 'home', label: 'Home', icon: Gauge }] },
    { title: 'Settings', items: [{ key: 'team', label: 'Team', icon: Users, badge: '3' }] },
  ],
  activeKey: 'team',
  title: 'Team',
  account: { name: 'Maricel Santos', email: 'm@montauto.ph' },
};

describe('PlatformShell navigation', () => {
  it('defaults to the sidebar layout', () => {
    render(<PlatformShell {...base}>content</PlatformShell>);
    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Back to Portal home' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('menu mode has no sidebar and a rail Menu button listing every item', async () => {
    const user = userEvent.setup();
    render(<PlatformShell {...base} navigation="menu">content</PlatformShell>);
    expect(screen.queryByText('Home')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Back to Portal home' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /Home/ })).not.toHaveAttribute('aria-current');
    const team = within(menu).getByRole('menuitem', { name: /Team/ });
    expect(team).toHaveAttribute('aria-current', 'page');
    expect(within(menu).getByText('Settings')).toBeInTheDocument();
    expect(within(menu).getByText('Montauto')).toBeInTheDocument();
  });

  it('off-canvas nav in menu mode lists nav, platforms and account links, focusing the active item', async () => {
    render(<PlatformShell {...base} navigation="menu" menuOpen>content</PlatformShell>);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Platforms')).toBeInTheDocument();
    expect(within(dialog).getByText('Inventory')).toBeInTheDocument();
    expect(within(dialog).getByText('Add platform')).toBeInTheDocument();
    expect(within(dialog).getByText('Sign out')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Team/ })).toHaveFocus();
  });

  it('renders the aside beside main, and main is a size container', () => {
    render(
      <PlatformShell {...base} aside={<aside data-testid="aside">panel</aside>}>
        content
      </PlatformShell>,
    );
    const main = screen.getByRole('main');
    expect(main).toHaveClass('[container-type:inline-size]');
    expect(main.nextElementSibling).toBe(screen.getByTestId('aside'));
  });
});
