import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QuantityStepper } from './QuantityStepper';

const meta: Meta<typeof QuantityStepper> = {
  title: 'Components/Forms/QuantityStepper',
  component: QuantityStepper,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Quantity stepper (I2): whole numbers, 1 to 9,999. 0 or empty becomes 1 with a note; over the maximum becomes 9,999 with a note. Enter commits. Receive and Record movement allow 0 (`min={0}`); stock-out and transfer cap at on hand (`max`).',
          '',
          '```tsx',
          "import { QuantityStepper } from '@readyph/ui';",
          '',
          '<QuantityStepper productName="Cooking oil 1L" value={qty} onValueChange={setQty} />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof QuantityStepper>;

function Demo(props: { initial: number; min?: number; max?: number; productName?: string }) {
  const [v, setV] = useState(props.initial);
  return <QuantityStepper value={v} onValueChange={setV} min={props.min} max={props.max} productName={props.productName} />;
}

export const Default: Story = { render: () => <Demo initial={3} productName="Cooking oil 1L" /> };
export const AllowsZero: Story = { render: () => <Demo initial={0} min={0} productName="Cooking oil 1L" /> };
export const CappedAtOnHand: Story = { render: () => <Demo initial={4} max={12} productName="Cooking oil 1L" /> };
