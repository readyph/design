import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Buildings, Package, Wrench } from '@phosphor-icons/react';
import { Select } from './Select';

const roles = [
  { value: 'none', label: 'Not assigned' },
  { value: 'manager', label: 'Manager' },
  { value: 'advisor', label: 'Service advisor' },
  { value: 'mechanic', label: 'Mechanic' },
  { value: 'viewer', label: 'Viewer', meta: 'Read only' },
  { value: 'locked', label: 'Owner', disabled: true },
];

const meta: Meta<typeof Select> = {
  title: 'Components/Forms/Select',
  component: Select,
  parameters: {
    docs: {
      description: {
        component:
          'Custom listbox that replaces every native select. Arrow keys, Home/End, PageUp/PageDown, type-ahead (600ms), Enter/Space choose, Esc closes, Tab chooses and moves on. Opens upward when there is no room below.',
      },
    },
  },
  args: { options: roles, placeholder: 'Choose a role', 'aria-label': 'Role' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] }, icon: { table: { disable: true } } },
  decorators: [(Story) => <div className="w-64 pb-72"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Select>;

export const Playground: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const WithValue: Story = { args: { defaultValue: 'manager' } };
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'viewer' } };

export const WithIconsAndLogos: Story = {
  args: {
    defaultValue: 'all',
    'aria-label': 'Business',
    options: [
      { value: 'all', label: 'All businesses', icon: <Buildings size={16} /> },
      { value: 'auto', label: 'Auto Works', icon: <Wrench size={16} />, meta: 'Repair shop' },
      { value: 'parts', label: 'Parts Stockroom', icon: <Package size={16} />, meta: 'Inventory' },
    ],
  },
};

export const Controlled: Story = {
  render: (args) => {
    const [v, setV] = useState('mechanic');
    return <Select {...args} value={v} onValueChange={setV} />;
  },
};

export const OpensUpward: Story = {
  decorators: [(Story) => <div className="flex h-72 w-64 items-end"><Story /></div>],
};
