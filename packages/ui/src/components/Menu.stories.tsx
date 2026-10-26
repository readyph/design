import { forwardRef, useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DotsThree, PencilSimple, Trash, Copy, ArrowSquareOut } from '@phosphor-icons/react';
import { Menu } from './Menu';

const meta: Meta<typeof Menu> = {
  title: 'Components/Overlays/Menu',
  component: Menu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Dropdown menu on Radix DropdownMenu (RDY-295, handover C35). Surface bg, border, 6px radius, float shadow, 4px padding, min 200px; items 7x10px, 4px radius, 13px, optional right \`meta\`. \`type: 'radio'\` items render \`menuitemradio\` with a check (filters). Used for row menus, Home platform filter and Snooze.

\`\`\`tsx
<Menu trigger={<button>Open</button>} items={[
  { label: 'Edit', onSelect: edit },
  { type: 'separator' },
  { label: 'Delete', danger: true, onSelect: remove },
]} />
\`\`\``,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Menu>;

const Trigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<'button'>>((props, ref) => (
  <button
    ref={ref}
    type="button"
    {...props}
    className="grid h-8 w-8 place-items-center rounded-control border border-border bg-surface text-muted hover:bg-accent-tint"
  >
    <DotsThree size={16} weight="bold" aria-hidden />
  </button>
));

export const RowMenu: Story = {
  render: () => (
    <Menu
      trigger={<Trigger aria-label="Row actions" />}
      items={[
        { label: 'Edit', icon: PencilSimple, meta: 'E' },
        { label: 'Duplicate', icon: Copy, meta: 'D' },
        { label: 'Open in new tab', icon: ArrowSquareOut, href: '#open', target: '_blank' },
        { label: 'Archive (unavailable)', disabled: true },
        { type: 'separator' },
        { label: 'Delete', icon: Trash, danger: true },
      ]}
    />
  ),
};

export const WithLabel: Story = {
  render: () => (
    <Menu
      trigger={<Trigger aria-label="Account" />}
      items={[
        { type: 'label', label: 'Signed in as maria@readyph.com' },
        { label: 'Account' },
        { label: 'Settings', meta: '⌘,' },
        { type: 'separator' },
        { label: 'Sign out', danger: true },
      ]}
    />
  ),
};

export const RadioFilter: Story = {
  name: 'Radio (filter / Snooze)',
  render: () => {
    const [v, setV] = useState('all');
    const opts = [
      ['all', 'All platforms'],
      ['web', 'Web'],
      ['ios', 'iOS'],
      ['android', 'Android'],
    ];
    return (
      <Menu
        align="start"
        trigger={
          <button type="button" className="h-8 rounded-control border border-border bg-surface px-3 text-ui text-text">
            Platform: {opts.find(([k]) => k === v)?.[1]}
          </button>
        }
        items={opts.map(([value, label]) => ({
          type: 'radio' as const,
          value,
          label,
          checked: v === value,
          onSelect: () => setV(value),
        }))}
      />
    );
  },
};

export const Dark: Story = {
  parameters: { docs: { description: { story: 'Sets `data-theme="dark"` on the document: the menu renders in a portal, so a wrapper element would not theme it.' } } },
  render: () => {
    useEffect(() => {
      const root = document.documentElement;
      const prev = root.getAttribute('data-theme');
      root.setAttribute('data-theme', 'dark');
      return () => (prev === null ? root.removeAttribute('data-theme') : root.setAttribute('data-theme', prev));
    }, []);
    return (
      <Menu
        trigger={<Trigger aria-label="Row actions" />}
        items={[
          { label: 'Edit', icon: PencilSimple, meta: 'E' },
          { type: 'radio', value: 'a', label: 'Snooze 1 day', checked: true },
          { type: 'radio', value: 'b', label: 'Snooze 1 week' },
          { type: 'separator' },
          { label: 'Delete', icon: Trash, danger: true },
        ]}
      />
    );
  },
};
