import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TransferList, type TransferFilter, type TransferRowData } from './TransferList';

const rows: TransferRowData[] = [
  { id: 'TR-0032', status: 'draft', out: true, otherName: 'Cebu branch', hereShort: 'Main', job: 'JO-0412', statusNote: 'Not sent yet', items: '8 pcs and 2 boxes', itemNames: 'Oil filter, Brake pads', when: 'Today, 9:40', who: 'Ana', action: 'send' },
  { id: 'TR-0031', status: 'transit', out: false, otherName: 'Davao branch', hereShort: 'Main', statusNote: 'On its way', items: '12 bottles', itemNames: 'Engine oil 5W-30 1L', when: 'Yesterday, 4:10', who: 'Berto', action: 'receive' },
  { id: 'TR-0030', status: 'received', out: true, otherName: 'Cebu branch', hereShort: 'Main', statusNote: '6 of 8 in, 2 short', items: '8 pcs', itemNames: 'Spark plug', when: '20 Oct, 2:05', who: 'Jomar', action: 'view' },
  { id: 'TR-0029', status: 'cancelled', out: true, otherName: 'Davao branch', hereShort: 'Main', statusNote: 'By Ana', items: '3 pcs', itemNames: 'Air filter', when: '19 Oct, 11:20', who: 'Ana', action: 'view' },
];
const counts = { all: 4, draft: 1, transit: 1, received: 1, cancelled: 1 };

const meta: Meta<typeof TransferList> = {
  title: 'Components/Inventory/TransferList',
  component: TransferList,
  tags: ['autodocs'],
  args: { transfers: rows, filter: 'all', counts, onFilterChange: () => {}, onOpen: () => {}, onNew: () => {} },
  decorators: [(Story) => <div className="bg-surface px-pad py-5"><Story /></div>],
  parameters: { docs: { description: { component: 'Transfer list (RDY-398, I15). Transfer | Status | Items | When | action, filtered by status. Source: inventory-home FINAL/movements.css 89-105, movements.js 211-253.' } } },
};
export default meta;
type Story = StoryObj<typeof TransferList>;

export const Playground: Story = {
  render: (args) => {
    const [f, setF] = useState<TransferFilter>('all');
    return <TransferList {...args} filter={f} onFilterChange={setF} />;
  },
};
export const Loading: Story = { args: { loading: true } };
export const NoneInFilter: Story = { args: { transfers: [], filter: 'draft' } };
export const NoneAtAll: Story = { args: { transfers: [], filter: 'all', counts: { all: 0, draft: 0, transit: 0, received: 0, cancelled: 0 } } };
export const Phone: Story = { parameters: { viewport: { defaultViewport: 'mobile1' } } };
