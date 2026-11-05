import type { Meta, StoryObj } from '@storybook/react';
import { RequestStepper } from './RequestStepper';

const meta: Meta<typeof RequestStepper> = {
  title: 'Components/SMS/Request stepper',
  component: RequestStepper,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[420px] max-w-full"><Story /></div>],
  args: { status: 'Requested' },
};
export default meta;
type S = StoryObj<typeof RequestStepper>;

export const Requested: S = {};
export const Approved: S = { args: { status: 'Approved' } };
export const ReadyAtStockroom: S = { args: { status: 'Ready at stockroom' } };
export const Collected: S = { args: { status: 'Collected' } };
export const Declined: S = { args: { status: 'Declined' } };
