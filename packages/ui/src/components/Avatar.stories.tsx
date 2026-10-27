import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Data/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: { name: 'Liza Santos', size: 32 },
  argTypes: { size: { control: 'inline-radio', options: [24, 32, 40] }, tone: { control: 'inline-radio', options: ['default', 'pending'] } },
  parameters: {
    docs: {
      description: {
        component: [
          'Person avatar: initials from the name, or a photo that falls back to initials if it fails. Sizes 24, 32, 40. Use `decorative` when the name is written beside it so it is not read twice. `tone="pending"` is the dashed outline for an invited person.',
          '',
          '```tsx',
          "import { Avatar } from '@readyph/ui';",
          '',
          '<Avatar name="Liza Santos" />',
          '<Avatar name="Jun Reyes" size={24} decorative />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Liza Santos" size={24} />
      <Avatar name="Liza Santos" size={32} />
      <Avatar name="Liza Santos" size={40} />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Ramon Dela Cruz" />
      <Avatar name="Mon" />
      <Avatar name="" />
      <Avatar name="Jun Reyes" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='%23888'/></svg>" />
      <Avatar name="Grace Lumbao" src="/missing.png" />
      <Avatar name="Invited Person" tone="pending" />
    </div>
  ),
};
