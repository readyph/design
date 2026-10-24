import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Menu } from './Menu';

async function open(items: Parameters<typeof Menu>[0]['items']) {
  const user = userEvent.setup();
  render(<Menu trigger={<button type="button">Open</button>} items={items} />);
  await user.click(screen.getByRole('button', { name: 'Open' }));
}

describe('Menu active items', () => {
  it('marks only the active item as the current page, with a check icon', async () => {
    await open([{ label: 'Home', active: true }, { label: 'Reports' }]);
    const home = screen.getByRole('menuitem', { name: /Home/ });
    const reports = screen.getByRole('menuitem', { name: /Reports/ });
    expect(home).toHaveAttribute('aria-current', 'page');
    expect(home.querySelector('svg')).not.toBeNull();
    expect(home).toHaveTextContent('(current page)');
    expect(reports).not.toHaveAttribute('aria-current');
    expect(reports.querySelector('svg')).toBeNull();
  });

  it('marks active link items too', async () => {
    await open([{ label: 'Home', href: '/home', active: true }]);
    expect(screen.getByRole('menuitem', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
  });

  it('renders meta on inactive items', async () => {
    await open([{ label: 'Inbox', meta: '12' }]);
    expect(screen.getByRole('menuitem', { name: /Inbox/ })).toHaveTextContent('12');
  });
});
