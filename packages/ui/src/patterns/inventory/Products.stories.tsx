import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Plus,
  Package,
  ArrowDown,
  ArrowUp,
  Tag,
  Hash,
  Cube,
  Barcode,
  PencilSimple,
  CurrencyDollar,
  DotsThree,
} from '@phosphor-icons/react';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { Table, type TableColumn } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Icon } from '../../components/Icon';
import { OffCanvas } from '../../components/Drawer';
import { DataList } from '../../components/DataList';
import { Menu } from '../../components/Menu';
import { InventoryShell } from './shell';

/**
 * Products — searchable, filterable catalog. Row click opens an off-canvas
 * detail with current stock, this product's movement history, and inline
 * stock-in / stock-out. See 04-Inventory.md §6. Mock data.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Inventory/Products',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

type StockState = 'in' | 'low' | 'out';

interface Product {
  sku: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  reorder: number;
  unit: string;
  state: StockState;
}

const products: Product[] = [
  { sku: 'FRT-014', name: 'Calamansi 1kg', category: 'Fruit', price: '₱85', stock: 18, reorder: 20, unit: 'pack', state: 'low' },
  { sku: 'FRT-022', name: 'Mango boxes', category: 'Fruit', price: '₱640', stock: 0, reorder: 10, unit: 'box', state: 'out' },
  { sku: 'FRT-030', name: 'Pomelo pack', category: 'Fruit', price: '₱120', stock: 9, reorder: 12, unit: 'pack', state: 'low' },
  { sku: 'GRN-004', name: 'Rice 25kg', category: 'Grain', price: '₱1,350', stock: 64, reorder: 20, unit: 'sack', state: 'in' },
  { sku: 'VEG-011', name: 'Red onions 1kg', category: 'Vegetable', price: '₱110', stock: 140, reorder: 40, unit: 'kg', state: 'in' },
  { sku: 'PKG-002', name: 'Carton box (M)', category: 'Packaging', price: '₱18', stock: 220, reorder: 100, unit: 'piece', state: 'in' },
];

const stateBadge: Record<StockState, { label: string; tone: 'success' | 'warning' | 'error' }> = {
  in: { label: 'In stock', tone: 'success' },
  low: { label: 'Low', tone: 'warning' },
  out: { label: 'Out', tone: 'error' },
};

const filters = [
  { value: 'all', label: 'All' },
  { value: 'in', label: 'In stock' },
  { value: 'low', label: 'Low' },
  { value: 'out', label: 'Out' },
];

const categories = [
  { value: 'all', label: 'All categories' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'grain', label: 'Grain' },
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'packaging', label: 'Packaging' },
];

interface Move {
  qty: number;
  reason: string;
  ref: string;
  time: string;
}

const history: Move[] = [
  { qty: 40, reason: 'received', ref: 'PO-1043', time: 'Today, 4:20 PM' },
  { qty: -12, reason: 'sold', ref: 'ORD-880', time: 'Today, 2:05 PM' },
  { qty: -10, reason: 'sold', ref: 'ORD-874', time: 'Yesterday' },
  { qty: -2, reason: 'damaged', ref: '—', time: 'Yesterday' },
];

function ProductThumb({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-9 w-9' : 'h-14 w-14';
  return (
    <span className={`grid ${dim} shrink-0 place-items-center rounded-lg bg-surface-muted text-ink-subtle`}>
      <Icon icon={Package} size={size === 'sm' ? 'md' : 'lg'} />
    </span>
  );
}

export const Products: Story = {
  name: 'Products',
  render: function ProductsPage() {
    const [selected, setSelected] = useState<Product | null>(null);

    const columns: TableColumn<Product>[] = [
      {
        key: 'name',
        header: 'Product',
        render: (p) => (
          <div className="flex items-center gap-3">
            <ProductThumb size="sm" />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{p.name}</p>
              <p className="text-xs text-ink-subtle">{p.sku}</p>
            </div>
          </div>
        ),
      },
      { key: 'category', header: 'Category', render: (p) => <span className="text-ink-muted">{p.category}</span> },
      { key: 'price', header: 'Price', align: 'right', render: (p) => <span className="tabular-nums text-ink">{p.price}</span> },
      {
        key: 'stock',
        header: 'Stock',
        align: 'right',
        render: (p) => (
          <span className="tabular-nums text-ink">
            {p.stock} <span className="text-xs text-ink-subtle">/ {p.reorder}</span>
          </span>
        ),
      },
      {
        key: 'state',
        header: 'Status',
        render: (p) => (
          <Badge tone={stateBadge[p.state].tone} size="sm" dot>
            {stateBadge[p.state].label}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        width: 48,
        render: () => (
          <Menu
            trigger={<IconButton icon={DotsThree} label="Product actions" variant="subtle" size="sm" />}
            items={[
              { label: 'Stock in', icon: ArrowDown },
              { label: 'Stock out', icon: ArrowUp },
              { type: 'separator' },
              { label: 'Edit', icon: PencilSimple },
            ]}
          />
        ),
      },
    ];

    return (
      <InventoryShell active="products" title="Products">
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
          <PageHeader
            title="Products"
            description="128 products · 7 low · 2 out"
            actions={
              <>
                <Button variant="secondary" leftIcon={ArrowDown}>Stock in</Button>
                <Button leftIcon={Plus}>Add product</Button>
              </>
            }
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:min-w-56 sm:flex-1">
              <SearchBar placeholder="Search name or SKU…" shortcut="/" />
            </div>
            <SegmentedControl options={filters} defaultValue="all" aria-label="Filter by stock status" />
            <div className="w-full sm:w-44">
              <Select options={categories} defaultValue="all" aria-label="Category" />
            </div>
          </div>

          <Table
            columns={columns}
            data={products}
            rowKey={(p) => p.sku}
            onRowClick={(p) => setSelected(p)}
          />
        </div>

        {/* Off-canvas product detail */}
        <OffCanvas open={selected !== null} onOpenChange={(o) => !o && setSelected(null)} width="30rem">
          {selected && (
            <>
              <OffCanvas.Header>
                <div className="flex items-center gap-3 pr-8">
                  <ProductThumb />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-ink">{selected.name}</p>
                    <p className="text-xs text-ink-subtle">{selected.sku}</p>
                  </div>
                  <span className="ml-auto">
                    <Badge tone={stateBadge[selected.state].tone} size="sm" dot>
                      {stateBadge[selected.state].label}
                    </Badge>
                  </span>
                </div>
              </OffCanvas.Header>

              <OffCanvas.Body className="space-y-6">
                {/* Stock summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface p-3">
                    <p className="text-xs text-ink-subtle">On hand</p>
                    <p className="mt-0.5 text-2xl font-semibold tabular-nums text-ink">
                      {selected.stock}
                      <span className="ml-1 text-sm font-normal text-ink-subtle">{selected.unit}</span>
                    </p>
                  </div>
                  <div className="rounded-lg bg-surface p-3">
                    <p className="text-xs text-ink-subtle">Reorder at</p>
                    <p className="mt-0.5 text-2xl font-semibold tabular-nums text-ink">{selected.reorder}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" leftIcon={ArrowDown} fullWidth>Stock in</Button>
                  <Button variant="secondary" leftIcon={ArrowUp} fullWidth>Stock out</Button>
                </div>

                {/* Details */}
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Details</h3>
                  <DataList
                    items={[
                      { icon: Tag, label: 'Category', value: selected.category },
                      { icon: CurrencyDollar, label: 'Price', value: selected.price },
                      { icon: Cube, label: 'Unit', value: selected.unit },
                      { icon: Hash, label: 'Reorder level', value: `${selected.reorder} ${selected.unit}` },
                      { icon: Barcode, label: 'SKU', value: selected.sku },
                    ]}
                  />
                </div>

                {/* Movement history */}
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Recent movements</h3>
                  <div className="divide-y divide-border rounded-lg bg-surface">
                    {history.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2">
                        <span
                          className={
                            m.qty > 0
                              ? 'grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success/10 text-success'
                              : 'grid h-6 w-6 shrink-0 place-items-center rounded-full bg-error/10 text-error'
                          }
                        >
                          <Icon icon={m.qty > 0 ? ArrowDown : ArrowUp} size="sm" weight="bold" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-ink">
                            {m.reason} <span className="text-ink-subtle">· {m.ref}</span>
                          </p>
                          <p className="text-xs text-ink-subtle">{m.time}</p>
                        </div>
                        <span className={m.qty > 0 ? 'text-sm font-medium tabular-nums text-success' : 'text-sm font-medium tabular-nums text-error'}>
                          {m.qty > 0 ? `+${m.qty}` : m.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </OffCanvas.Body>

              <OffCanvas.Footer>
                <Button variant="subtle" leftIcon={PencilSimple}>Edit</Button>
                <Button>Done</Button>
              </OffCanvas.Footer>
            </>
          )}
        </OffCanvas>
      </InventoryShell>
    );
  },
};
