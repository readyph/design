import type { Meta, StoryObj } from '@storybook/react';
import { DotsThree } from '@phosphor-icons/react';
import { Tooltip } from './Tooltip';
import { Button } from './Button';
import { IconButton } from './IconButton';

const meta: Meta<typeof Tooltip> = {
  parameters: {
    docs: {
      description: {
        component: `A hover/focus tooltip built on Radix Tooltip.

\`\`\`tsx
import { Tooltip, Button } from '@readyph/ui';

<Tooltip content="Create a new item">
  <Button>New</Button>
</Tooltip>
\`\`\``,
      },
    },
  },
  title: 'Components/Overlays/Tooltip',
  component: Tooltip,
};
export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Basic: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="Create a new item">
        <Button>Hover me</Button>
      </Tooltip>
      <Tooltip content="More actions" side="right">
        <IconButton icon={DotsThree} label="More" variant="secondary" />
      </Tooltip>
    </div>
  ),
};

export const Sides: Story = {
  render: () => (
    <div className="flex gap-4">
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Tooltip key={side} content={`On the ${side}`} side={side}>
          <Button variant="secondary">{side}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const SurfaceRichContent: Story = {
  name: 'Surface (rich content)',
  render: () => (
    <div className="pt-40">
      <Tooltip
        tone="surface"
        open
        side="top"
        content={
          <div className="flex w-56 flex-col gap-2">
            <div className="text-sm font-semibold text-ink">Main Lab</div>
            <div className="text-xs text-ink-muted">Clinic platform, synced 5 min ago</div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt className="text-ink-muted">Status</dt><dd>Online</dd>
              <dt className="text-ink-muted">Alerts</dt><dd>0</dd>
              <dt className="text-ink-muted">Lights</dt><dd>On</dd>
              <dt className="text-ink-muted">Links</dt><dd>3</dd>
            </dl>
          </div>
        }
      >
        <Button variant="secondary">Main Lab</Button>
      </Tooltip>
    </div>
  ),
};
