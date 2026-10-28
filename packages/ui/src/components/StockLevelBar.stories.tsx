import type { Meta, StoryObj } from '@storybook/react';
import { StockLevelBar } from './StockLevelBar';

const meta: Meta<typeof StockLevelBar> = {
  title: 'Components/Feedback/StockLevelBar',
  component: StockLevelBar,
  tags: ['autodocs'],
  args: { onHand: 6, reorder: 10, variant: 'row' },
  argTypes: { variant: { control: 'inline-radio', options: ['row', 'wide', 'stocker'] } },
  parameters: {
    docs: {
      description: {
        component: [
          'Stock level bar (I3): fill = on hand / max(2 x reorder, on hand, 1), with a 2px tick at the reorder level. Violet is only for this bar; status is the dot and word.',
          '',
          '```tsx',
          "import { StockLevelBar } from '@readyph/ui';",
          '',
          '<StockLevelBar onHand={6} reorder={10} />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof StockLevelBar>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex w-[420px] flex-col gap-6">
      <div className="flex"><StockLevelBar onHand={6} reorder={10} /></div>
      <StockLevelBar variant="wide" onHand={6} reorder={10} />
      <StockLevelBar variant="stocker" onHand={6} reorder={10} />
    </div>
  ),
};

export const Levels: Story = {
  render: () => (
    <div className="flex w-[200px] flex-col gap-4">
      <div className="flex"><StockLevelBar onHand={0} reorder={10} /></div>
      <div className="flex"><StockLevelBar onHand={10} reorder={10} /></div>
      <div className="flex"><StockLevelBar onHand={40} reorder={10} /></div>
    </div>
  ),
};
