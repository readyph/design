import type { Meta, StoryObj } from '@storybook/react';
import { ServiceTypeForm } from './ServiceTypeForm';
import { getCatalogue, typeById } from './sms/catalogue';

const meta: Meta<typeof ServiceTypeForm> = {
  title: 'Components/SMS/Service type form',
  component: ServiceTypeForm,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onSave: () => {}, onClose: () => {}, onToggleActive: () => {} },
};
export default meta;
type S = StoryObj<typeof ServiceTypeForm>;

export const Add: S = { args: { type: null, onToggleActive: undefined } };
export const EditLabourOnly: S = { name: 'Edit, labour only', args: { type: typeById('sv02') } };
export const EditWithParts: S = { name: 'Edit, with parts', args: { type: typeById('sv01') } };
export const EditLowStockPart: S = { name: 'Edit, a part is low on stock', args: { type: typeById('sv10') } };
export const EditOutOfStockPart: S = { name: 'Edit, a part is out of stock', args: { type: typeById('sv23') } };
export const EditInactive: S = { name: 'Edit, inactive (Reactivate)', args: { type: getCatalogue().find((t) => !t.active)! } };
