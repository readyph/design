import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { PaymentStatement } from './PaymentStatement';
import { StatementActions } from './StatementActions';
import { jobFor, receiptOf } from './sms/paymentModel';

const meta: Meta<typeof PaymentStatement> = {
  title: 'Components/SMS/Payment statement',
  component: PaymentStatement,
  tags: ['autodocs'],
  args: { job: jobFor('unpaid'), title: 'Price so far', editable: true, addOpen: false, onAdd: () => {}, onRemove: () => {}, onAddOpen: () => {} },
  render: (args) => {
    const [open, setOpen] = useState(args.addOpen);
    return <PaymentStatement {...args} addOpen={open} onAddOpen={setOpen} />;
  },
};
export default meta;
type S = StoryObj<typeof PaymentStatement>;

export const Unpaid: S = {};
export const AddedAtBilling: S = { args: { job: jobFor('quote') } };
export const WithDiscount: S = { args: { job: jobFor('discount') } };
export const ReadOnly: S = { args: { job: jobFor('paid'), editable: false, title: 'Final price' } };
export const NothingToBill: S = { args: { job: jobFor('nolines') } };
export const Many: S = { args: { job: jobFor('many') } };
export const AddLineOpen: S = { args: { addOpen: true } };
export const AddLinePart: S = {
  args: { addOpen: true },
  play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole('radio', { name: 'Part' })); },
};

export const Actions: StoryObj<typeof StatementActions> = {
  render: () => <StatementActions doc={receiptOf(jobFor('unpaid'))} onPrint={() => {}} />,
};
export const ActionsPaid: StoryObj<typeof StatementActions> = {
  render: () => <StatementActions doc={receiptOf(jobFor('paid'))} onPrint={() => {}} />,
};
