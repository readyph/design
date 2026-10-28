import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { OrderListsPanel, type OrderListGroup, type OrderListsPanelProps } from './OrderListsPanel';

/* Sample data from the prototype's seed lists (inventory-home FINAL/data.js, orders.js). Replace with real data. */
const petron: OrderListGroup = {
  id: 'petron',
  supplier: 'Petron Direct',
  shortName: 'Petron',
  lines: [
    { id: 'p17', sku: 'EO-0317', name: 'Engine oil 1L', qty: 24, unit: 'bottle', cost: 285 },
    { id: 'p07', sku: 'OF-0107', name: 'Oil filter, small', qty: 12, unit: 'pc', cost: 96 },
  ],
};
const autopro: OrderListGroup = {
  id: 'autopro',
  supplier: 'Autopro Distribution',
  shortName: 'Autopro',
  cutoff: { at: '10:00', soon: true, left: '45 min' },
  lines: [{ id: 'p16', sku: 'BP-0216', name: 'Brake pad set', qty: 6, unit: 'box', cost: 640 }],
};
const draft: OrderListGroup = {
  id: 'dairy',
  supplier: 'Mabuhay Dairy Supply',
  shortName: 'Mabuhay',
  poNo: 'PO-0225',
  lines: [{ id: 'p31', sku: 'MK-0431', name: 'Fresh milk 1L', qty: 3, unit: 'carton', cost: 960 }],
};

const meta: Meta<typeof OrderListsPanel> = {
  title: 'Components/Overlays/OrderListsPanel',
  component: OrderListsPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Order lists panel (RDY-392, I8): the cart, a right sheet with one ruled group per supplier. Nothing is sent from here. Source: inventory-home FINAL/cart.css, cart.js.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof OrderListsPanel>;

function Host(p: Partial<OrderListsPanelProps>) {
  const [open, setOpen] = useState(true);
  const [groups, setGroups] = useState<OrderListGroup[]>(p.groups ?? []);
  return (
    <div className="p-6 text-body text-text">
      <button type="button" className="rounded-control border border-control px-3 py-2" onClick={() => setOpen(true)}>
        Open order lists
      </button>
      <OrderListsPanel
        purchaseOrdersHref="#"
        productsHref="#"
        onProceed={() => undefined}
        onOpenPo={() => undefined}
        onQuantityChange={(g, l, q) => setGroups((gs) => gs.map((x) => (x.id === g ? { ...x, lines: x.lines.map((y) => (y.id === l ? { ...y, qty: q } : y)) } : x)))}
        onRemove={(g, l) => setGroups((gs) => gs.map((x) => (x.id === g ? { ...x, lines: x.lines.filter((y) => y.id !== l) } : x)).filter((x) => x.lines.length))}
        {...p}
        groups={groups}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}

export const Groups: Story = { render: () => <Host groups={[autopro, petron, draft]} money canSend /> };
export const OneSupplier: Story = { render: () => <Host groups={[petron]} money canSend /> };
export const Clerk: Story = { render: () => <Host groups={[autopro, petron]} /> };
export const ClerkOneSupplier: Story = { render: () => <Host groups={[{ ...autopro, lines: [{ ...autopro.lines[0], unit: 'sleeve' }] }]} /> };
export const DraftOnly: Story = { render: () => <Host groups={[draft]} money canSend /> };
export const OpenOnOneList: Story = { render: () => <Host groups={[autopro, petron]} money canSend focusSupplier="petron" /> };
export const Empty: Story = { render: () => <Host groups={[]} /> };
export const EmptyOnProducts: Story = { render: () => <Host groups={[]} onProductsPage /> };
export const Loading: Story = { render: () => <Host groups={[]} loading /> };
export const ErrorState: Story = { render: () => <Host groups={[autopro, petron]} money error={{ lastLoaded: '09:12' }} /> };
export const Proceeding: Story = { render: () => <Host groups={[autopro, petron]} money busyId="petron" /> };
export const UndoStrip: Story = { render: () => <Host groups={[autopro, petron]} money undo="Oil filter, small taken off the Petron list." /> };
