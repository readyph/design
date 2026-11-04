import type { Meta, StoryObj } from '@storybook/react';
import { ReceiptDoc } from './ReceiptDoc';
import { jobFor, receiptOfJob } from './sms/paymentModel';

const meta: Meta<typeof ReceiptDoc> = {
  title: 'Components/SMS/Receipt document',
  component: ReceiptDoc,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { doc: receiptOfJob(jobFor('paid')), paper: 'a4' },
};
export default meta;
type S = StoryObj<typeof ReceiptDoc>;

export const ReceiptA4: S = {};
export const ReceiptSlip: S = { args: { paper: 'slip' } };
export const StatementPartial: S = { args: { doc: receiptOfJob(jobFor('partial')) } };
export const StatementUnpaid: S = { args: { doc: receiptOfJob(jobFor('unpaid')) } };
export const StatementSlip: S = { args: { doc: receiptOfJob(jobFor('partial')), paper: 'slip' } };
