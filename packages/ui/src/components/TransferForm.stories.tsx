import type { Meta, StoryObj } from '@storybook/react';
import { TransferForm, type TransferFormProps } from './TransferForm';

const products = [
  { id: 'p1', name: 'Oil filter, small', sku: 'FLT-OIL-S', onHand: 1, unit: 'pc', location: 'Aisle 5' },
  { id: 'p2', name: 'Engine oil 5W-30 1L', sku: 'OIL-5W30', onHand: 12, unit: 'bottle', location: 'Aisle 2' },
  { id: 'p3', name: 'Brake pads, front', sku: 'BRK-PAD-F', onHand: 6, unit: 'set', location: 'Aisle 3' },
];
const base: TransferFormProps = {
  hereShort: 'Main',
  hereName: 'Main stockroom',
  places: [{ id: 'cebu', name: 'Cebu branch' }, { id: 'davao', name: 'Davao branch' }],
  products,
  onSave: () => {},
  onCancel: () => {},
  alsoFor: (id) => (id === 'p1' ? 'TR-0032 also needs 1' : ''),
  warningFor: (id, qty) => (id === 'p1' ? <><b>TR-0032</b> is a draft for JO-0412 and also needs 1 of this part.{qty + 1 > 1 ? ' Only 1 on hand here, so both cannot go.' : ''}</> : null),
};
const meta: Meta<typeof TransferForm> = {
  title: 'Components/Inventory/TransferForm',
  component: TransferForm,
  tags: ['autodocs'],
  args: base,
  decorators: [(Story) => <div className="bg-surface px-pad py-5"><Story /></div>],
  parameters: { docs: { description: { component: 'Transfer form (RDY-398, I15). Source: inventory-home FINAL/movements.css 124-139, movements.js 427-452.' } } },
};
export default meta;
type Story = StoryObj<typeof TransferForm>;

export const NewTransfer: Story = {};
export const WithLinesAndWarning: Story = { args: { initial: { to: 'cebu', job: 'JO-0412', note: 'For the car waiting at the branch.', lines: [{ productId: 'p1', qty: 1 }, { productId: 'p2', qty: 4 }] } } };
export const ChangeDraft: Story = { args: { editingId: 'TR-0030', initial: { to: 'davao', lines: [{ productId: 'p3', qty: 2 }] } } };
export const NoJobOrders: Story = { args: { jobOrders: false, canSend: false, managerName: 'Berto' } };
