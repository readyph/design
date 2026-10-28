import type { Meta, StoryObj } from '@storybook/react';
import { ShortDeliveryBlock, type ShortDeliveryBlockProps } from './ShortDeliveryBlock';

const etaOptions = ['Fri 30 Oct', 'Sat 31 Oct', 'Sun 1 Nov', 'Mon 2 Nov', 'Tue 3 Nov', 'Wed 4 Nov', 'Thu 5 Nov'];
const partIn = { no: 'PO-0221', supplierName: 'Petron Auto Parts', closed: false, missing: '6', dueValue: '₱2,790' };
const shortOrder = { ...partIn, closed: true };
const base: ShortDeliveryBlockProps = { order: partIn, canSettle: true, etaOptions };

const meta: Meta<typeof ShortDeliveryBlock> = {
  title: 'Components/Feedback/ShortDeliveryBlock',
  component: ShortDeliveryBlock,
  tags: ['autodocs'],
  args: base,
  parameters: {
    docs: {
      description: {
        component:
          'Short-delivery block (RDY-396, I12): settle a short purchase-order delivery. Inline confirm forms, never dialogs. Source: inventory-home FINAL/purchase-orders.css (.sett), purchase-orders.js 343-375, 600-619.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ShortDeliveryBlock>;

export const StillDue: Story = {};
export const ClosedShort: Story = { args: { order: shortOrder } };
export const ShortAccepted: Story = {
  args: { order: shortOrder, accepted: { by: 'Rica', at: '28 Oct, 9:12', why: 'The supplier will not send the rest', note: 'Called the driver' } },
};
export const DisputedOpen: Story = {
  args: { dispute: { reason: 'Short delivery', by: 'Rica', at: '28 Oct, 9:12', ref: 'CL-5521', note: 'Driver will check', status: 'open' } },
};
export const DisputedOpenClerk: Story = {
  args: { canSettle: false, dispute: { reason: 'Short delivery', by: 'Rica', at: '28 Oct, 9:12', status: 'open' } },
};
export const ResolvedCredit: Story = {
  args: {
    order: shortOrder,
    dispute: { reason: 'Short delivery', by: 'Rica', at: '28 Oct, 9:12', status: 'resolved', outcome: 'credit', credit: '₱500', rby: 'Rica', rat: '29 Oct, 10:00' },
  },
};
export const ResolvedReplacement: Story = {
  args: {
    dispute: { reason: 'Damaged', by: 'Rica', at: '28 Oct, 9:12', status: 'resolved', outcome: 'replacement', eta: 'Mon 2 Nov', rby: 'Rica', rat: '29 Oct, 10:00' },
  },
};
export const ResolvedRefused: Story = {
  args: {
    order: shortOrder,
    dispute: { reason: 'Wrong item', by: 'Rica', at: '28 Oct, 9:12', status: 'resolved', outcome: 'refused', rby: 'Rica', rat: '29 Oct, 10:00' },
  },
};
export const SettledEarlier: Story = { args: { order: { ...shortOrder, settledEarlier: true } } };
export const ClerkTellYourManager: Story = { args: { canSettle: false, order: { ...partIn, dueValue: undefined } } };
export const ClerkTold: Story = { args: { canSettle: false, order: { ...partIn, dueValue: undefined }, told: { by: 'Dandy', at: '28 Oct, 9:30', note: 'Two boxes missing' } } };
export const ManagerSeesClerkNote: Story = { args: { told: { by: 'Dandy', at: '28 Oct, 9:30', note: 'Two boxes missing' } } };
export const ErrorState: Story = { args: { error: true } };
export const ConfirmAccept: Story = { args: { defaultConfirm: 'accept' } };
export const ConfirmDispute: Story = { args: { defaultConfirm: 'dispute' } };
export const ConfirmResolve: Story = {
  args: { defaultConfirm: 'resolve', dispute: { reason: 'Short delivery', by: 'Rica', at: '28 Oct, 9:12', status: 'open' } },
};
export const ConfirmTell: Story = { args: { canSettle: false, order: { ...partIn, dueValue: undefined }, defaultConfirm: 'tell' } };
