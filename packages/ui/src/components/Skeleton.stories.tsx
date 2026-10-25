import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Skeleton bar (C32). Loading shows the final layout with skeleton bars, so nothing jumps when data arrives. Soft pulse; still under reduced motion. Skeletons are hidden from assistive tech, so mark the region `aria-busy="true"` and add a "Loading ..." label.',
          '',
          'Changes from the legacy component: the shimmer is now a soft pulse on the `skeleton` token (works in dark), corners use the new radii, and `lines` renders a text block with a shorter last line. Existing props are unchanged.',
          '',
          '```tsx',
          "import { Skeleton } from '@readyph/ui';",
          '',
          '<div aria-busy="true"><span className="sr-only">Loading products</span><Skeleton variant="text" lines={3} /></div>',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Variants: Story = {
  render: () => (
    <div className="flex w-full max-w-[var(--place)] items-center gap-3">
      <Skeleton variant="circle" width={40} height={40} />
      <Skeleton variant="rect" width={96} height={40} />
      <Skeleton variant="text" className="flex-1" />
    </div>
  ),
};

export const TextBlock: Story = {
  render: () => <Skeleton variant="text" lines={3} width="100%" className="max-w-[var(--place)]" />,
};

export const ListLoading: Story = {
  render: () => (
    <div aria-busy="true" className="w-full max-w-xl rounded-card border border-border bg-surface">
      <span className="sr-only">Loading products</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 border-b border-rule px-pad py-row-y last:border-b-0">
          <Skeleton variant="circle" width={32} height={32} />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton variant="text" className="w-2/5" />
            <Skeleton variant="text" className="h-3 w-3/5" />
          </div>
          <Skeleton variant="rect" width={56} height={20} />
        </div>
      ))}
    </div>
  ),
};
