import type { Meta, StoryObj } from '@storybook/react';
import { SignOut, User, Gear, CreditCard } from '@phosphor-icons/react';
import { Menu } from './Menu';
import { Button } from './Button';
import { ShortcutModeProvider } from '../providers/ShortcutModeProvider';

const meta: Meta<typeof Menu> = {
  parameters: {
    docs: {
      description: {
        component: `A dropdown menu (ProfileMenu pattern) built on Radix DropdownMenu. Shortcut hints show in shortcut mode; the app binds the keys.

\`\`\`tsx
import { Menu, Button } from '@readyph/ui';

<Menu
  trigger={<Button>Profile</Button>}
  items={[
    { label: 'Account', onSelect: openAccount },
    { type: 'separator' },
    { label: 'Sign out', danger: true, onSelect: signOut },
  ]}
/>
\`\`\``,
      },
    },
  },
  title: 'Components/Overlays/Menu',
  component: Menu,
};
export default meta;
type Story = StoryObj<typeof Menu>;

export const Basic: Story = {
  render: () => (
    <ShortcutModeProvider defaultOn>
      <Menu
        trigger={<Button variant="secondary">Profile ▾</Button>}
        items={[
          { type: 'label', label: 'Signed in as maria@readyph.com' },
          { label: 'Account', icon: User, shortcut: 'mod+,' },
          { label: 'Billing', icon: CreditCard },
          { label: 'Settings', icon: Gear, shortcut: 'mod+k' },
          { type: 'separator' },
          { label: 'Sign out', icon: SignOut, danger: true },
        ]}
      />
    </ShortcutModeProvider>
  ),
};

export const WithLinks: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Items with `href` render a real `<a role="menuitem">`: middle-click and copy-link work, arrows / Enter / Esc behave as for action items. Disabled link items drop the href. `target="_blank"` gets `rel="noopener noreferrer"`.',
      },
    },
  },
  render: () => (
    <Menu
      trigger={<Button variant="secondary">Account ▾</Button>}
      items={[
        { type: 'label', label: 'Signed in as maria@readyph.com' },
        { label: 'Account', icon: User, href: '#account' },
        { label: 'Billing', icon: CreditCard, href: '#billing', target: '_blank' },
        { label: 'Settings (unavailable)', icon: Gear, href: '#settings', disabled: true },
        { type: 'separator' },
        { label: 'Sign out', icon: SignOut, danger: true },
      ]}
    />
  ),
};
