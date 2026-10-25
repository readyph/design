// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Menu } from './Menu';

describe('Menu', () => {
  it('opens with keyboard, exposes roles and selects', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <Menu
        trigger={<button type="button">Open</button>}
        items={[
          { label: 'Edit', meta: 'E', onSelect },
          { type: 'separator' },
          { type: 'radio', value: 'a', label: 'A', checked: true },
          { type: 'radio', value: 'b', label: 'B' },
          { label: 'Docs', href: '#d', target: '_blank' },
        ]}
      />,
    );
    screen.getByText('Open').focus();
    await user.keyboard('{Enter}');
    expect(await screen.findAllByRole('menuitem')).toHaveLength(2);
    expect(screen.getByRole('menuitemradio', { name: 'A' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('menuitemradio', { name: 'B' }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('menuitem', { name: /Docs/ }).getAttribute('rel')).toBe('noopener noreferrer');
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalled();
  });
});
