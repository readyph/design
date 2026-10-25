import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Components/Feedback/Usage meter',
  component: ProgressBar,
  tags: ['autodocs'],
  args: { value: 10, max: 15, warnAt: 13, layout: 'full', label: '10 of 15 seats used', actionHref: '/settings/billing' },
  parameters: {
    docs: {
      description: {
        component: [
          'Usage meter (C40, updates `ProgressBar`): a 4px bar with a readout. `layout="inline"` is a 56px bar beside the text (status bar); `layout="full"` is a full-width bar with the readout under it (Seats and Memory room).',
          '',
          'The tone follows the numbers. Accent by default, warn at `warnAt` (seats: `max - 2`, i.e. 2 left; memory: 85% of `max`, the default), bad when `value >= max`. The bad state shows a "Plan and billing" link (`actionHref` or `onAction`). The readout is the bar\'s accessible name and the tone is also announced in `aria-valuetext`, so colour is never the only signal. `className` goes on the wrapper; the bar keeps its own width and height.',
          '',
          '```tsx',
          "import { ProgressBar } from '@readyph/ui';",
          '',
          '<ProgressBar layout="full" value={10} max={15} warnAt={13} label="10 of 15 seats used" actionHref="/settings/billing" />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Playground: Story = {
  render: (args) => (
    <div className="w-full max-w-[var(--place)]">
      <ProgressBar {...args} />
    </div>
  ),
};

export const Seats: Story = {
  render: () => (
    <div className="flex w-full max-w-[var(--place)] flex-col gap-group-y">
      <ProgressBar layout="full" value={10} max={15} warnAt={13} label="10 of 15 seats used" actionHref="/settings/billing" />
      <ProgressBar layout="full" value={13} max={15} warnAt={13} label="13 of 15 seats used" actionHref="/settings/billing" />
      <ProgressBar layout="full" value={15} max={15} warnAt={13} label="15 of 15 seats used" actionHref="/settings/billing" />
      <ProgressBar layout="full" value={17} max={15} warnAt={13} label="17 of 15 seats used" actionHref="/settings/billing" />
    </div>
  ),
};

export const Memory: Story = {
  render: () => (
    <div className="flex w-full max-w-[var(--place)] flex-col gap-group-y">
      <ProgressBar layout="full" value={3140} max={16000} label="3,140 of 16,000 characters" />
      <ProgressBar layout="full" value={13700} max={16000} label="13,700 of 16,000 characters" />
      <ProgressBar layout="full" value={16000} max={16000} label="16,000 of 16,000 characters" actionHref="/settings/billing" />
    </div>
  ),
};

export const StatusBar: Story = {
  render: () => (
    <div className="flex flex-col gap-3 rounded-card bg-raised p-3">
      <ProgressBar layout="inline" value={10} max={15} warnAt={13} label="10 of 15 seats used" />
      <ProgressBar layout="inline" value={14} max={15} warnAt={13} label="14 of 15 seats used" />
      <ProgressBar layout="inline" value={15} max={15} warnAt={13} label="15 of 15 seats used" actionHref="/settings/billing" />
    </div>
  ),
};

export const Phone: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <div className="w-full max-w-[22.5rem]">
      <ProgressBar layout="full" value={16000} max={16000} label="16,000 of 16,000 characters used in Leda's memory" actionHref="/settings/billing" />
    </div>
  ),
};

export const Indeterminate: Story = {
  args: { value: null, label: 'Counting seats', actionHref: undefined },
  render: (args) => (
    <div className="w-full max-w-[var(--place)]">
      <ProgressBar {...args} />
    </div>
  ),
};
