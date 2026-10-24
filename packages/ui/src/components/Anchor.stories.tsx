import type { Meta, StoryObj } from '@storybook/react';
import { Anchor } from './Anchor';
import { Button } from './Button';

const meta: Meta<typeof Anchor> = {
  title: 'Components/Layout/Anchor',
  component: Anchor,
  parameters: {
    docs: {
      description: {
        component: `Positions children centred on an (x, y) percent point of the positioned parent, via CSS variables.

\`\`\`tsx
<div className="relative h-64">
  <Anchor x={25} y={40}><Button>Plot A</Button></Anchor>
</div>
\`\`\``,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Anchor>;

const points = [
  { x: 15, y: 25, label: 'North' },
  { x: 70, y: 20, label: 'East' },
  { x: 35, y: 70, label: 'South' },
  { x: 85, y: 75, label: 'West' },
];

export const DottedPlot: Story = {
  render: () => (
    <div className="relative h-72 w-full overflow-hidden rounded-md border border-border bg-surface-subtle bg-[radial-gradient(rgb(var(--ds-border-strong))_1px,transparent_1px)] bg-[length:1.5rem_1.5rem]">
      {points.map((p) => (
        <Anchor key={p.label} x={p.x} y={p.y}>
          <Button size="sm" variant="secondary">{p.label}</Button>
        </Anchor>
      ))}
    </div>
  ),
};
