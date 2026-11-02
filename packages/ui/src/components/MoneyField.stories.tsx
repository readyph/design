import type { Meta, StoryObj } from '@storybook/react';
import { MoneyField } from './MoneyField';

const meta: Meta<typeof MoneyField> = {
  title: 'Components/Forms/MoneyField',
  component: MoneyField,
  tags: ['autodocs'],
  args: { label: 'Amount received', unit: 'PHP', placeholder: '0.00' },
  parameters: {
    docs: {
      description: {
        component: 'Money / amount field: one joined group (TextField with a unit segment). Only the outer corners round; the value is right-aligned with tabular numbers and the unit is 14px muted. Unit defaults to PHP; pass `unit="%"` for a percent.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MoneyField>;

export const Default: Story = {};
export const Percent: Story = { args: { label: 'Discount', unit: '%' } };
export const WithError: Story = { args: { error: 'Enter an amount' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: '1,200.00' } };
