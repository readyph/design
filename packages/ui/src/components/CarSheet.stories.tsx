import type { Meta, StoryObj } from '@storybook/react';
import { CarSheet } from './CarSheet';
import { customers } from './sms/data';

const meta: Meta<typeof CarSheet> = {
  title: 'Components/SMS/Car sheet',
  component: CarSheet,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="h-[640px] w-[480px] max-w-full border border-rule bg-surface"><Story /></div>],
  args: { customer: customers[0]!, onSave: () => {}, onClose: () => {}, onOpenCustomer: () => {} },
};
export default meta;
type S = StoryObj<typeof CarSheet>;

export const AddCar: S = { name: 'Add car' };
export const EditCar: S = { name: 'Edit car', args: { car: customers[0]!.vehicles[1]! } };
export const DuplicatePlate: S = { name: 'Duplicate plate', args: { customer: customers[1]!, car: { ...customers[1]!.vehicles[0]!, plate: 'NBC 4521' } } };
export const AsPage: S = { name: 'As a page (phone)', args: { asPage: true, onClose: undefined, onBack: () => {} } };
