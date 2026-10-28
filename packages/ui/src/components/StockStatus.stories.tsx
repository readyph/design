import type { Meta, StoryObj } from '@storybook/react';
import { StockStatus } from './StockStatus';

const meta: Meta<typeof StockStatus> = {
  title: 'Components/Feedback/StockStatus',
  component: StockStatus,
  tags: ['autodocs'],
  args: { status: 'low' },
  argTypes: { status: { control: 'inline-radio', options: ['ok', 'low', 'out'] } },
  parameters: {
    docs: {
      description: {
        component: [
          'Stock status (I4): dot and word. "Low stock", "Out of stock"; in stock is a neutral dot with no word emphasis. Colour sits on the dot; the word is red only when out of stock.',
          '',
          '```tsx',
          "import { StockStatus } from '@readyph/ui';",
          '',
          '<StockStatus status="out" />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof StockStatus>;

export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-2">
      <StockStatus status="ok" />
      <StockStatus status="low" />
      <StockStatus status="out" />
    </div>
  ),
};
