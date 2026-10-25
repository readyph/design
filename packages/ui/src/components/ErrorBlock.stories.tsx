import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBlock } from './ErrorBlock';

const meta: Meta<typeof ErrorBlock> = {
  title: 'Components/Feedback/ErrorBlock',
  component: ErrorBlock,
  tags: ['autodocs'],
  args: { thing: 'products', lastLoaded: '9:10 AM', onRetry: () => {} },
  parameters: {
    docs: {
      description: {
        component: [
          'Inline error block (C32), new. A dashed block placed inside the region that failed to load: "Couldn\'t load your {thing}. Last loaded 9:10 AM." with a Try again button. Keep the rest of the page usable. Announced to screen readers when it appears. Leave out `lastLoaded` if it never loaded.',
          '',
          '```tsx',
          "import { ErrorBlock } from '@readyph/ui';",
          '',
          '<ErrorBlock thing="products" lastLoaded="9:10 AM" onRetry={reload} retrying={loading} />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ErrorBlock>;

export const Playground: Story = { render: (args) => <div className="w-full max-w-xl"><ErrorBlock {...args} /></div> };

export const NeverLoaded: Story = { render: (args) => <div className="w-full max-w-xl"><ErrorBlock {...args} lastLoaded={undefined} thing="branches" /></div> };

export const Retrying: Story = { render: (args) => <div className="w-full max-w-xl"><ErrorBlock {...args} retrying /></div> };

export const InsideAPanel: Story = {
  render: function Panel() {
    const [tries, setTries] = useState(0);
    return (
      <div className="w-full max-w-xl rounded-card border border-border bg-surface">
        <div className="border-b border-rule px-pad py-row-y text-body font-semibold text-text">Recent orders</div>
        <div className="p-pad">
          <ErrorBlock thing="orders" lastLoaded="9:10 AM" onRetry={() => setTries(tries + 1)}>
            {tries > 0 ? `Tried ${tries} time${tries > 1 ? 's' : ''}. Still offline.` : undefined}
          </ErrorBlock>
        </div>
      </div>
    );
  },
};
