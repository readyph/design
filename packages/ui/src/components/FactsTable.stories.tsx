import type { Meta, StoryObj } from '@storybook/react';
import { FactsTable } from './FactsTable';
import { Button } from './Button';

const meta: Meta<typeof FactsTable> = {
  title: 'Components/Data display/Facts table',
  component: FactsTable,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: 'Read-only facts under a form (workshop `.kv2`): 140px label column (112px on a phone), 13/20, 12px row padding, a rule on top of each row, up to 720px wide. Values wrap on an 8px gap and may hold a button.' } } },
};
export default meta;
type Story = StoryObj<typeof FactsTable>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Kind', value: 'Repair shop' },
      { label: 'Version', value: 'v1.9.3' },
      { label: 'App', value: <Button variant="secondary" className="h-7">Open Auto Works</Button> },
    ],
  },
};
