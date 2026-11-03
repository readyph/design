import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { PaymentDiscount } from './PaymentDiscount';
import { jobFor } from './sms/paymentModel';

const meta: Meta<typeof PaymentDiscount> = {
  title: 'Components/SMS/Payment discount',
  component: PaymentDiscount,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[760px]"><Story /></div>],
  args: { job: jobFor('unpaid'), onApply: () => {}, onRemove: () => {}, onCancel: () => {} },
};
export default meta;
type S = StoryObj<typeof PaymentDiscount>;

export const Open: S = {};
export const Existing: S = { args: { job: jobFor('discount') } };
export const Preview: S = {
  play: async ({ canvasElement }) => { await userEvent.type(within(canvasElement).getByLabelText('Amount off'), '200'); },
};
export const OverSubtotal: S = {
  play: async ({ canvasElement }) => { await userEvent.type(within(canvasElement).getByLabelText('Amount off'), '999999'); },
};
