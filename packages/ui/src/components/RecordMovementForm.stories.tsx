import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RecordMovementForm, type RecordProduct, type RecordPermission } from './RecordMovementForm';

const oil: RecordProduct = { id: 'p1', name: 'Engine oil 5W-30', sku: 'OIL-530', onHand: 4, reorder: 3, unit: 'bottle', location: 'Shelf A2' };
const pads: RecordProduct = { id: 'p2', name: 'Brake pads, front', sku: 'BRK-110', onHand: 9, reorder: 4, unit: 'pc', location: 'Shelf B1' };
const coolant: RecordProduct = { id: 'p3', name: 'Coolant 1L', sku: 'CLT-001', onHand: 12, reorder: 6, unit: 'bottle', location: 'Shelf A3' };
const products = [oil, pads, coolant];
const likely = [
  { product: oil, why: 'Needed for JO-0413' },
  { product: pads, why: 'Went out today' },
];
const manager: RecordPermission[] = ['stock_out', 'transfer', 'adjust_stock'];
const clerk: RecordPermission[] = ['stock_out', 'transfer'];

const meta: Meta<typeof RecordMovementForm> = {
  title: 'Components/Data/RecordMovementForm',
  component: RecordMovementForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Record movement form (I14): product (search with scan button, "Likely today", or fixed), five reasons with their help always visible (radio list), quantity, job order, note, summary line and actions.',
          '',
          '```tsx',
          '<RecordMovementForm products={products} likely={likely} permissions={["stock_out","transfer","adjust_stock"]} onRecord={save} />',
          '```',
        ].join('\n'),
      },
    },
  },
  args: { products, likely, permissions: manager, jobsFor: () => ['JO-0413', 'JO-0417'], effect: () => 'Low stock 9 to 10.', onRecord: () => {}, onCancel: () => {}, onTransfer: () => {}, onScan: () => {}, placeName: 'Cubao' },
  render: (args) => {
    const [last, setLast] = useState('');
    return (
      <div className="max-w-[860px]">
        <RecordMovementForm {...args} onRecord={(e) => setLast(JSON.stringify(e))} />
        {last ? <p className="mt-4 text-small text-muted">{last}</p> : null}
      </div>
    );
  },
};
export default meta;
type Story = StoryObj<typeof RecordMovementForm>;

/** Reasons visible but not choosable until a product is picked. */
export const NoProduct: Story = {};
export const ProductPicked: Story = { args: { product: oil } };
export const Fixed: Story = { args: { product: oil, fixed: true } };
export const UsedOnJob: Story = { args: { product: oil, initialReason: 'used' } };
export const UsedInKitchen: Story = { args: { product: coolant, initialReason: 'used', jobOrders: false } };
export const Send: Story = { args: { product: oil, initialReason: 'send' } };
export const Damaged: Story = { args: { product: oil, initialReason: 'damaged' } };
export const CountCorrection: Story = { args: { product: oil, initialReason: 'count' } };
export const ClerkLocked: Story = { args: { product: oil, permissions: clerk } };
