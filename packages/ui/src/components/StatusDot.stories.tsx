import type { Meta, StoryObj } from '@storybook/react';
import { StatusDot } from './StatusDot';

const meta: Meta<typeof StatusDot> = {
  title: 'Components/Feedback/StatusDot',
  component: StatusDot,
  tags: ['autodocs'],
  args: { status: 'ok', label: 'Running' },
  argTypes: { status: { control: 'inline-radio', options: ['neutral', 'ok', 'warn', 'bad', 'accent'] } },
  parameters: {
    docs: {
      description: {
        component: [
          'Status dot (C34): 7px, tones neutral, ok, warn, bad, accent. Add a `label` for health copy.',
          '',
          '```tsx',
          "import { StatusDot } from '@readyph/ui';",
          '',
          '<StatusDot status="bad" label="Offline since Wed 18:05" />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof StatusDot>;

export const Playground: Story = {};

export const Health: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <StatusDot status="ok" label="Running" />
      <StatusDot status="warn" label="Slow since 7:40" />
      <StatusDot status="bad" label="Offline since Wed 18:05" />
      <StatusDot status="neutral" label="Setup needed" />
      <StatusDot status="accent" label="Setting up" />
    </div>
  ),
};
