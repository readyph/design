import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Feedback/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { tone: 'neutral', children: 'Draft' },
  argTypes: { tone: { control: 'inline-radio', options: ['neutral', 'ok', 'warn', 'bad', 'err', 'accent'] }, dot: { control: 'boolean' } },
  parameters: {
    docs: {
      description: {
        component: [
          'Status pill (C34): 20px high, 4px radius, 12px medium. Tones: neutral, ok, warn, bad, accent. `dot` adds a leading 7px dot; `pulse` (opt-in) slowly pulses it. Count badges (3-4px radius) are a separate component.',
          '',
          '```tsx',
          "import { Badge } from '@readyph/ui';",
          '',
          '<Badge tone="ok" dot>Running</Badge>',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['neutral', 'ok', 'warn', 'bad', 'err', 'accent'] as const).map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};

export const Health: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="ok" dot>Running</Badge>
      <Badge tone="warn" dot>Slow since 7:40</Badge>
      <Badge tone="bad" dot>Offline since Wed 18:05</Badge>
      <Badge tone="err" dot>Error</Badge>
      <Badge tone="neutral" dot>Setup needed</Badge>
      <Badge tone="accent" dot>Setting up</Badge>
    </div>
  ),
};

export const Pulse: Story = {
  render: () => <Badge tone="ok" dot pulse>Running</Badge>,
};
