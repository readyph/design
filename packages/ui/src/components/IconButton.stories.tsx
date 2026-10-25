import type { Meta, StoryObj } from '@storybook/react';
import { Gear, Trash, Plus, X } from '@phosphor-icons/react';
import { IconButton } from './IconButton';

const meta: Meta<typeof IconButton> = {
  title: 'Components/Actions/IconButton',
  component: IconButton,
  args: { icon: Gear, label: 'Settings' },
  argTypes: { icon: { table: { disable: true } }, variant: { control: 'inline-radio', options: ['primary', 'secondary', 'text', 'danger'] } },
};
export default meta;
type Story = StoryObj<typeof IconButton>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton variant="primary" icon={Plus} label="Add" />
      <IconButton variant="secondary" icon={Gear} label="Settings" />
      <IconButton variant="text" icon={X} label="Close" />
      <IconButton variant="danger" icon={Trash} label="Delete" />
      <IconButton icon={Gear} label="Disabled" disabled />
      <IconButton icon={Gear} label="Loading" loading />
    </div>
  ),
};
