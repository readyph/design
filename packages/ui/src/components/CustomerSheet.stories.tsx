import type { Meta, StoryObj } from '@storybook/react';
import { CustomerSheet } from './CustomerSheet';
import { customers } from './sms/data';

const meta: Meta<typeof CustomerSheet> = {
  title: 'Components/SMS/Customer sheet',
  component: CustomerSheet,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="h-[760px] w-[480px] max-w-full border border-rule bg-surface"><Story /></div>],
  args: { onSave: () => {}, onClose: () => {}, onOpenExisting: () => {} },
};
export default meta;
type S = StoryObj<typeof CustomerSheet>;

export const New: S = {};
export const NewFromPlate: S = { name: 'New from a searched plate', args: { seed: 'NBC 4521' } };
export const Edit: S = { args: { customer: customers[0]!, keepIds: ['v01'] } };
export const DuplicatePhone: S = { name: 'Duplicate phone', args: { customer: customers[2]!, seed: '' } };
export const AsPage: S = { name: 'As a page (phone)', args: { customer: customers[5]!, asPage: true, onClose: undefined, onBack: () => {} } };
