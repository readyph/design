import type { Meta, StoryObj } from '@storybook/react';
import { StockLevelBar } from './StockLevelBar';
import { StockerFacts, StockerId, StockerRow, StockerStatus } from './StockerRow';

const meta: Meta<typeof StockerRow> = {
  title: 'Components/Lists/StockerRow',
  component: StockerRow,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        component:
          'Stocker list row and product facts (RDY-400, I18). what, where, how many, action; ruled rows, no cards. Source: inventory-home round-1/final stocker.css 59-74, 128-132, 224-225; stocker.js 99-100.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof StockerRow>;

export const ToReceive: Story = {
  args: { href: '#', what: 'Ace Hardware Supply', where: <><StockerId>PO-0112</StockerId> · Due today</>, qty: { value: 3, unit: 'products' }, go: 'Receive' },
};

export const NeedsStock: Story = {
  args: {
    href: '#',
    what: 'Brake pad set',
    where: <>Aisle 3, Shelf B · <StockerStatus state="low" /></>,
    qty: { value: 4, unit: 'pc' },
    go: true,
  },
};

export const OutOfStock: Story = {
  args: { href: '#', what: 'Oil filter', where: <>Aisle 1, Shelf A · <StockerStatus state="out" /></>, qty: { value: 0, unit: 'pc' }, go: true },
};

export const PickButton: Story = {
  args: { onClick: () => {}, what: 'Spark plug', where: <><StockerId>SKU-2201</StockerId> · Aisle 2</>, qty: { value: 12, unit: 'pc' } },
};

export const PlainRow: Story = {
  args: { what: 'Spark plug', where: <><StockerId>SKU-2201</StockerId> · Aisle 2 · 12 on hand</>, qty: { value: 2, unit: 'pc' } },
};

export const NoAction: Story = { args: { what: 'TR-0032 to Cebu', where: 'Draft transfer', go: 'Open', href: '#' } };

export const List: Story = {
  render: () => (
    <div>
      <StockerRow href="#" what="Brake pad set" where={<>Aisle 3, Shelf B · <StockerStatus state="low" /></>} qty={{ value: 4, unit: 'pc' }} go />
      <StockerRow href="#" what="Oil filter" where={<>Aisle 1, Shelf A · <StockerStatus state="out" /></>} qty={{ value: 0, unit: 'pc' }} go />
    </div>
  ),
};

export const Facts: StoryObj<typeof StockerFacts> = {
  render: () => (
    <StockerFacts
      items={[
        { label: 'On hand', value: <><b>4</b> pc <StockLevelBar variant="stocker" onHand={4} reorder={5} /> <StockerStatus state="low" /></> },
        { label: 'Where', value: 'Aisle 3, Shelf B' },
        { label: 'Barcode', value: <StockerId>4806512345678</StockerId> },
      ]}
    />
  ),
};
