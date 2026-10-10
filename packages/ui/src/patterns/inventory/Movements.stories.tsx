import type { Meta, StoryObj } from '@storybook/react';
import {
  ArrowDown,
  ArrowUp,
  ClipboardText,
  Plus,
  ArrowsDownUp,
} from '@phosphor-icons/react';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { Table, type TableColumn } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { InventoryShell } from './shell';

/**
 * Stock & Movements — the ledger. Every ±qty event with a reason and a
 * reference; stock levels are derived from it, never typed directly.
 * Stocktake posts `count` adjustments. See 04-Inventory.md §7. Mock data.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Inventory/Stock & Movements',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

type Reason = 'received' | 'sold' | 'damaged' | 'count' | 'transfer';

interface Movement {
  id: string;
  time: string;
  product: string;
  sku: string;
  reason: Reason;
  reference: string;
  qty: number;
  by: string;
}

const reasonMeta: Record<Reason, { label: string; tone: 'success' | 'neutral' | 'error' | 'info' }> = {
  received: { label: 'Received', tone: 'success' },
  sold: { label: 'Sold', tone: 'neutral' },
  damaged: { label: 'Damaged', tone: 'error' },
  count: { label: 'Count', tone: 'info' },
  transfer: { label: 'Transfer', tone: 'neutral' },
};

const movements: Movement[] = [
  { id: 'm1', time: 'Today, 4:20 PM', product: 'Calamansi 1kg', sku: 'FRT-014', reason: 'received', reference: 'PO-1043', qty: 40, by: 'Leda · photo' },
  { id: 'm2', time: 'Today, 2:05 PM', product: 'Mango boxes', sku: 'FRT-022', reason: 'sold', reference: 'ORD-882', qty: -6, by: 'POS' },
  { id: 'm3', time: 'Today, 1:12 PM', product: 'Pomelo pack', sku: 'FRT-030', reason: 'damaged', reference: '—', qty: -2, by: 'Maria S.' },
  { id: 'm4', time: 'Today, 11:40 AM', product: 'Rice 25kg', sku: 'GRN-004', reason: 'received', reference: 'PO-1038', qty: 15, by: 'John L.' },
  { id: 'm5', time: 'Yesterday', product: 'Red onions 1kg', sku: 'VEG-011', reason: 'count', reference: 'Stocktake #12', qty: -3, by: 'Maria S.' },
  { id: 'm6', time: 'Yesterday', product: 'Carton box (M)', sku: 'PKG-002', reason: 'transfer', reference: 'Branch 2', qty: -50, by: 'John L.' },
  { id: 'm7', time: 'Yesterday', product: 'Calamansi 1kg', sku: 'FRT-014', reason: 'sold', reference: 'ORD-874', qty: -10, by: 'POS' },
];

const reasonFilters = [
  { value: 'all', label: 'All' },
  { value: 'in', label: 'Stock in' },
  { value: 'out', label: 'Stock out' },
  { value: 'adjust', label: 'Adjustments' },
];

const ranges = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

export const Movements: Story = {
  name: 'Stock & Movements',
  render: () => {
    const columns: TableColumn<Movement>[] = [
      { key: 'time', header: 'Time', render: (m) => <span className="whitespace-nowrap text-xs text-ink-subtle">{m.time}</span> },
      {
        key: 'product',
        header: 'Product',
        render: (m) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{m.product}</p>
            <p className="text-xs text-ink-subtle">{m.sku}</p>
          </div>
        ),
      },
      { key: 'reason', header: 'Reason', render: (m) => <Badge tone={reasonMeta[m.reason].tone} size="sm">{reasonMeta[m.reason].label}</Badge> },
      { key: 'reference', header: 'Reference', render: (m) => <span className="text-ink-muted">{m.reference}</span> },
      { key: 'by', header: 'By', render: (m) => <span className="text-xs text-ink-subtle">{m.by}</span> },
      {
        key: 'qty',
        header: 'Change',
        align: 'right',
        render: (m) => (
          <span className={m.qty > 0 ? 'inline-flex items-center gap-1 font-medium tabular-nums text-success' : 'inline-flex items-center gap-1 font-medium tabular-nums text-error'}>
            <Icon icon={m.qty > 0 ? ArrowDown : ArrowUp} size="sm" weight="bold" />
            {m.qty > 0 ? `+${m.qty}` : m.qty}
          </span>
        ),
      },
    ];

    return (
      <InventoryShell active="movements" title="Stock & Movements">
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
          <PageHeader
            title="Stock & Movements"
            description="The ledger — stock levels are the sum of every movement."
            actions={
              <>
                <Button variant="secondary" leftIcon={ClipboardText}>Stocktake</Button>
                <Button leftIcon={Plus}>New movement</Button>
              </>
            }
          />

          {/* Today's net */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="rounded-lg bg-surface p-4">
              <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
                <Icon icon={ArrowDown} size="sm" className="text-success" /> In today
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">+55</p>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
                <Icon icon={ArrowUp} size="sm" className="text-error" /> Out today
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">−8</p>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
                <Icon icon={ArrowsDownUp} size="sm" /> Net
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">+47</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:min-w-56 sm:flex-1">
              <SearchBar placeholder="Search product, SKU, or reference…" />
            </div>
            <SegmentedControl options={reasonFilters} defaultValue="all" aria-label="Filter by movement type" />
            <div className="w-full sm:w-40">
              <Select options={ranges} defaultValue="today" aria-label="Date range" />
            </div>
          </div>

          <Table columns={columns} data={movements} rowKey={(m) => m.id} />
        </div>
      </InventoryShell>
    );
  },
};
