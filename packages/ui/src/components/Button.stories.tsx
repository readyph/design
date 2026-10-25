import type { Meta, StoryObj } from '@storybook/react';
import { FloppyDisk, Plus, ArrowRight, Trash } from '@phosphor-icons/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Actions/Button',
  component: Button,
  args: { children: 'Button', variant: 'primary' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'text', 'danger'] },
    leftIcon: { table: { disable: true } },
    rightIcon: { table: { disable: true } },
  },
  parameters: { docs: { description: { component: 'C33. 32px tall (40 phone, 44 in phone action bars), 5px radius, 13px / 500. No pill, no sharp buttons. `text` replaces the legacy `subtle`; the `size` prop is gone.' } } },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="text">Text</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button leftIcon={Plus}>New item</Button>
      <Button variant="secondary" leftIcon={FloppyDisk}>Save</Button>
      <Button rightIcon={ArrowRight}>Continue</Button>
      <Button variant="danger" leftIcon={Trash}>Delete</Button>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
      <Button variant="secondary" disabled>Disabled</Button>
      <Button variant="text" loading>Loading</Button>
    </div>
  ),
};

export const ActionBar: Story = {
  render: () => (
    <div className="flex gap-3">
      <Button variant="secondary" actionBar fullWidth>Cancel</Button>
      <Button actionBar fullWidth>Save</Button>
    </div>
  ),
};
