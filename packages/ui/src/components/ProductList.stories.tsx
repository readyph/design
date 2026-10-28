import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Package, Prohibit, TrendDown } from '@phosphor-icons/react';
import {
  OrderListsStrip,
  ProductFilters,
  ProductList,
  ProductSelectionBar,
  ProductStatusTabs,
  ProductSupplierBar,
  type ProductGroupData,
  type ProductRowData,
  type ProductStatusFilter,
} from './ProductList';

const meta: Meta<typeof ProductList> = {
  title: 'Components/Data/ProductList',
  component: ProductList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Product list (I7): status tabs, search and filters, column heads, groups of ruled rows, selection bar, supplier line, Order lists strip and footer. Place it inside the PlatformShell sheet (`@container/sheet`): the Where and Supplier columns drop at 1100 and 760px of the sheet.',
          '',
          '```tsx',
          "import { ProductList, ProductStatusTabs, ProductFilters } from '@readyph/ui';",
          '',
          '<ProductList groups={groups} total={612} addable={addable} selected={selected} onOpen={open} />',
          '```',
        ].join('\n'),
      },
    },
  },
  decorators: [(Story) => <div className="@container/sheet max-w-[1240px]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ProductList>;

const add = (n: number, name: string, sup: string) => ({ kind: 'add' as const, label: `Add ${n} to order list`, ariaLabel: `Add ${n} ${name} to the ${sup} order list` });

const out: ProductRowData[] = [
  { id: 'p1', name: 'Fleetguard LF3349 oil filter', sku: 'FG-LF3349', category: 'Filters', where: 'Aisle 2', onHand: 0, unit: 'pc', reorder: 6, status: 'out', statusLine: 'No order yet', supplier: 'Autopro', action: add(12, 'Fleetguard LF3349 oil filter', 'Autopro') },
  { id: 'p2', name: 'Shell Helix HX7 10W-40 4L', sku: 'SH-HX7-4', category: 'Oil', where: 'Aisle 1', onHand: 0, unit: 'jug', reorder: 8, status: 'out', statusLine: 'On PO-0222 · Fri 23 Oct', supplier: 'Petron', action: { kind: 'receive', label: 'Receive' } },
];
const low: ProductRowData[] = [
  { id: 'p3', name: 'Brake pad set, front', sku: 'BP-F-221', category: 'Brakes', where: 'Aisle 4', onHand: 3, unit: 'set', reorder: 5, status: 'low', statusLine: 'On Autopro list · 5', supplier: 'Autopro', action: { kind: 'view', label: 'View' } },
  { id: 'p4', name: 'Air filter element', sku: 'AF-908', category: 'Filters', where: 'Aisle 2', onHand: 1, unit: 'pc', reorder: 4, status: 'low', statusLine: 'Draft PO-0224, not sent', supplier: 'Autopro', action: add(6, 'Air filter element', 'Autopro') },
];
const ok: ProductRowData[] = [
  { id: 'p5', name: 'Coolant 1L', sku: 'CL-1L', category: 'Fluids', where: 'Aisle 3', onHand: 24, unit: 'bottle', reorder: 10, status: 'ok', supplier: 'Petron', action: { kind: 'view', label: 'View' } },
];
const groups: ProductGroupData[] = [
  { id: 'out', icon: Prohibit, name: 'Out of stock', note: 'Order these first', rows: out },
  { id: 'low', icon: TrendDown, name: 'Low stock', note: 'At or under the reorder level', rows: low },
  { id: 'ok', icon: Package, name: 'In stock', rows: ok },
];
const addable = new Set(['p1', 'p4']);

function Page({ loading, stale }: { loading?: boolean; stale?: boolean }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<ProductStatusFilter>('all');
  const [q, setQ] = useState('');
  const [fopen, setFopen] = useState(false);
  const menu = (value: string, label: string) => ({ value, options: [{ value, label }] });
  return (
    <div className="flex flex-col gap-6">
      <OrderListsStrip
        summary="1 list to proceed, 1 draft PO, not sent"
        onOpenAll={() => {}}
        lists={[
          { id: 'a', name: 'Autopro order list', meta: '3 products · not a PO yet', ariaLabel: 'Autopro order list, still to proceed, 3 products' },
          { id: 'b', name: 'Petron order list', meta: '1 product · PO-0224 draft, not sent', ariaLabel: 'Petron draft PO-0224, not sent, 1 product' },
        ]}
      />
      <div className="flex flex-col gap-6">
        <ProductStatusTabs value={status} onValueChange={setStatus} counts={loading ? {} : { all: 612, low: 9, out: 3, order: 4 }} />
        <ProductFilters
          query={q}
          onQueryChange={setQ}
          onScan={() => {}}
          category={menu('all', 'All categories')}
          supplier={menu('all', 'All suppliers')}
          sort={menu('attn', 'Needs stock first')}
          open={fopen}
          onOpenChange={setFopen}
          onSetup={() => {}}
        />
      </div>
      <ProductList
        groups={groups}
        total={612}
        addable={addable}
        selected={sel}
        loading={loading}
        stale={stale}
        onSelectedChange={(id, v) => setSel((s) => { const n = new Set(s); if (v) n.add(id); else n.delete(id); return n; })}
        onSelectGroup={(g) => setSel(new Set(g.rows.filter((r) => addable.has(r.id)).map((r) => r.id)))}
        onShowMore={() => {}}
        onSetup={() => {}}
      />
      {sel.size ? <ProductSelectionBar count={sel.size} goesTo="Autopro 2" lists={1} onClear={() => setSel(new Set())} onAdd={() => {}} /> : null}
    </div>
  );
}

export const Default: Story = { render: () => <Page /> };
export const Loading: Story = { render: () => <Page loading /> };
export const ListDown: Story = { name: 'List did not load (stale)', render: () => <Page stale /> };
export const NoResults: Story = {
  render: () => (
    <ProductList
      groups={[]}
      total={612}
      noResults={{ title: 'No product matches “zzz”.', hint: 'Check the spelling, or search by SKU or supplier.', onClear: () => {}, onAskLeda: () => {}, start: low }}
    />
  ),
};
export const SupplierChosen: Story = {
  render: () => (
    <ProductSupplierBar supplier="Autopro" listName="Autopro" need={8} todo={6} cutoff="Order by 14:00 for same-day delivery (1h 20m left)." preview="Adds 12 Fleetguard LF3349 oil filter, 6 Air filter element, about ₱44,150. Nothing is sent." onAddAll={() => {}} />
  ),
};
export const OrderListsEmpty: Story = { render: () => <OrderListsStrip lists={[]} /> };
export const OrderListsError: Story = { render: () => <OrderListsStrip lists={[]} error /> };
export const Selected: Story = { render: () => <ProductSelectionBar count={3} goesTo="Autopro 2 · Petron 1" lists={2} /> };
