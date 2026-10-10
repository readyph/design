import type { Meta, StoryObj } from '@storybook/react';
import {
  Camera,
  Plus,
  Receipt,
  ArrowLeft,
  Truck,
  CalendarBlank,
  Buildings,
  MagicWand,
  Image as ImageIcon,
  CheckCircle,
  WarningCircle,
  Check,
  Trash,
  Export,
  Package,
} from '@phosphor-icons/react';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Table, type TableColumn } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Card } from '../../components/Card';
import { Notice } from '../../components/Notice';
import { DataList } from '../../components/DataList';
import { Select } from '../../components/Select';
import { InventoryShell } from './shell';
import { goToStory, routes } from '../nav';

/**
 * Purchase Orders — the backbone. Create by photo (Leda extracts the lines),
 * receive against the order, and reconcile ordered vs received vs variance.
 * See 04-Inventory.md §8. Three stories: List, Detail, and the photo-extract
 * review. Mock data.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Inventory/Purchase Orders',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

type PoStatus = 'draft' | 'ordered' | 'partial' | 'received';

const statusMeta: Record<PoStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  ordered: { label: 'Ordered', tone: 'info' },
  partial: { label: 'Partially received', tone: 'warning' },
  received: { label: 'Received', tone: 'success' },
};

/* ------------------------------------------------------------------ List -- */

interface Po {
  id: string;
  supplier: string;
  date: string;
  status: PoStatus;
  received: number;
  ordered: number;
  total: string;
  variance?: string;
}

const pos: Po[] = [
  { id: 'PO-1043', supplier: 'Fresh Fields Co.', date: '4 Oct', status: 'partial', received: 10, ordered: 12, total: '₱14,200', variance: '2 short' },
  { id: 'PO-1041', supplier: 'Dizon Produce', date: '3 Oct', status: 'ordered', received: 0, ordered: 30, total: '₱38,500' },
  { id: 'PO-1038', supplier: 'Metro Packaging', date: '2 Oct', status: 'partial', received: 6, ordered: 8, total: '₱6,040', variance: '2 short' },
  { id: 'PO-1035', supplier: 'Fresh Fields Co.', date: '28 Sep', status: 'received', received: 20, ordered: 20, total: '₱22,900' },
  { id: 'PO-1031', supplier: 'Sunrise Rice Mill', date: '24 Sep', status: 'draft', received: 0, ordered: 5, total: '₱6,750' },
];

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'partial', label: 'Partial' },
  { value: 'received', label: 'Received' },
];

export const List: Story = {
  name: 'Purchase orders (list)',
  render: () => {
    const columns: TableColumn<Po>[] = [
      {
        key: 'id',
        header: 'PO',
        render: (p) => (
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-ink-subtle">
              <Icon icon={Receipt} size="md" />
            </span>
            <div>
              <p className="font-medium text-ink">{p.id}</p>
              <p className="text-xs text-ink-subtle">{p.supplier}</p>
            </div>
          </div>
        ),
      },
      { key: 'date', header: 'Date', render: (p) => <span className="text-ink-muted">{p.date}</span> },
      { key: 'status', header: 'Status', render: (p) => <Badge tone={statusMeta[p.status].tone} size="sm">{statusMeta[p.status].label}</Badge> },
      {
        key: 'lines',
        header: 'Received',
        align: 'right',
        render: (p) => (
          <div className="text-right">
            <span className="tabular-nums text-ink">{p.received}/{p.ordered}</span>
            {p.variance && <p className="text-xs text-warning">{p.variance}</p>}
          </div>
        ),
      },
      { key: 'total', header: 'Total', align: 'right', render: (p) => <span className="tabular-nums text-ink">{p.total}</span> },
    ];

    return (
      <InventoryShell active="purchase-orders" title="Purchase Orders">
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
          <PageHeader
            title="Purchase Orders"
            description="3 open · 2 with variances"
            actions={
              <>
                <Button variant="secondary" leftIcon={Plus}>New PO</Button>
                <Button leftIcon={Camera}>New from photo</Button>
              </>
            }
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:min-w-56 sm:flex-1">
              <SearchBar placeholder="Search PO number or supplier…" />
            </div>
            <SegmentedControl options={statusFilters} defaultValue="all" aria-label="Filter by status" />
          </div>
          <Table columns={columns} data={pos} rowKey={(p) => p.id} onRowClick={() => goToStory(routes.inventoryPoDetail)} />
        </div>
      </InventoryShell>
    );
  },
};

/* ---------------------------------------------------------------- Detail -- */

interface Line {
  product: string;
  sku: string;
  ordered: number;
  received: number;
  unitPrice: string;
}

const lines: Line[] = [
  { product: 'Calamansi 1kg', sku: 'FRT-014', ordered: 12, received: 10, unitPrice: '₱780' },
  { product: 'Pomelo pack', sku: 'FRT-030', ordered: 6, received: 6, unitPrice: '₱110' },
  { product: 'Mango boxes', sku: 'FRT-022', ordered: 4, received: 4, unitPrice: '₱590' },
];

export const Detail: Story = {
  name: 'Purchase order (detail)',
  render: () => {
    const columns: TableColumn<Line>[] = [
      {
        key: 'product',
        header: 'Product',
        render: (l) => (
          <div>
            <p className="font-medium text-ink">{l.product}</p>
            <p className="text-xs text-ink-subtle">{l.sku}</p>
          </div>
        ),
      },
      { key: 'unitPrice', header: 'Unit price', align: 'right', render: (l) => <span className="tabular-nums text-ink-muted">{l.unitPrice}</span> },
      { key: 'ordered', header: 'Ordered', align: 'right', render: (l) => <span className="tabular-nums text-ink">{l.ordered}</span> },
      { key: 'received', header: 'Received', align: 'right', render: (l) => <span className="tabular-nums text-ink">{l.received}</span> },
      {
        key: 'variance',
        header: 'Variance',
        align: 'right',
        render: (l) => {
          const v = l.received - l.ordered;
          if (v === 0) return <Badge tone="success" size="sm">OK</Badge>;
          return <Badge tone="warning" size="sm">{v > 0 ? `+${v}` : v}</Badge>;
        },
      },
    ];

    return (
      <InventoryShell active="purchase-orders" title="PO-1043">
        <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
          <button onClick={() => goToStory(routes.inventoryPoList)} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
            <Icon icon={ArrowLeft} size="sm" /> Purchase orders
          </button>

          <PageHeader
            title={
              <span className="flex items-center gap-3">
                PO-1043
                <Badge tone="warning" size="sm">Partially received</Badge>
              </span>
            }
            description="Fresh Fields Co. · ordered 4 Oct 2026"
            actions={
              <>
                <Button variant="subtle" leftIcon={Export}>Export</Button>
                <Button leftIcon={Truck}>Receive delivery</Button>
              </>
            }
          />

          <Notice tone="warning" title="2 items short-delivered">
            Calamansi arrived 10 of 12. Receiving the rest will clear the variance; marking the PO
            closed will record the shortfall.
          </Notice>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Card padding="none">
                <div className="px-4 py-3">
                  <h2 className="text-sm font-semibold text-ink">Lines · ordered vs received</h2>
                </div>
                <div className="border-t border-border">
                  <Table columns={columns} data={lines} rowKey={(l) => l.sku} className="rounded-none border-0" />
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Summary</h3>
                <DataList
                  stacked
                  items={[
                    { icon: Buildings, label: 'Supplier', value: 'Fresh Fields Co.' },
                    { icon: CalendarBlank, label: 'Ordered', value: '4 Oct 2026' },
                    { icon: Package, label: 'Lines', value: '3 · 22 units' },
                    { label: 'Total', value: '₱14,200' },
                  ]}
                />
              </Card>

              <Card>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Source document</h3>
                <div className="flex items-center gap-3 rounded-lg bg-surface p-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-surface-muted text-ink-subtle">
                    <Icon icon={ImageIcon} size="lg" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">fresh-fields-oct4.jpg</p>
                    <p className="text-xs text-ink-subtle">Read by Leda · 4 Oct</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </InventoryShell>
    );
  },
};

/* --------------------------------------------------------------- Extract -- */

interface Draft {
  extracted: string;
  match: string;
  matchOptions: { value: string; label: string }[];
  qty: number;
  unitPrice: string;
  confident: boolean;
}

const drafts: Draft[] = [
  {
    extracted: 'Calamansi 1kg',
    match: 'FRT-014',
    matchOptions: [{ value: 'FRT-014', label: 'Calamansi 1kg (FRT-014)' }],
    qty: 12,
    unitPrice: '₱780',
    confident: true,
  },
  {
    extracted: 'Pomelo pack',
    match: 'FRT-030',
    matchOptions: [{ value: 'FRT-030', label: 'Pomelo pack (FRT-030)' }],
    qty: 6,
    unitPrice: '₱110',
    confident: true,
  },
  {
    extracted: 'Mango boxes (lg)',
    match: 'FRT-022',
    matchOptions: [
      { value: 'FRT-022', label: 'Mango boxes (FRT-022)' },
      { value: 'new', label: '+ Create new product' },
    ],
    qty: 4,
    unitPrice: '₱590',
    confident: false,
  },
];

export const Extract: Story = {
  name: 'Create from photo (extract)',
  render: () => (
    <InventoryShell active="purchase-orders" title="New PO from photo">
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <button onClick={() => goToStory(routes.inventoryPoList)} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <Icon icon={ArrowLeft} size="sm" /> Purchase orders
        </button>

        <PageHeader
          title="Review extracted purchase order"
          description="Leda read the photo. Check the lines, then create the PO."
        />

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Source image */}
          <div className="lg:col-span-2">
            <Card padding="none">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-medium text-ink">
                  <Icon icon={ImageIcon} size="md" className="text-ink-subtle" /> fresh-fields-oct4.jpg
                </span>
                <Button size="sm" variant="subtle">Replace</Button>
              </div>
              <div className="grid aspect-[3/4] place-items-center bg-surface-subtle">
                <div className="text-center text-ink-subtle">
                  <Icon icon={Receipt} size="lg" />
                  <p className="mt-2 text-xs">Purchase order photo</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Extracted draft */}
          <div className="space-y-4 lg:col-span-3">
            <Notice tone="info" icon={MagicWand} title="Leda extracted 3 lines">
              One line needs a quick check — the product match wasn't certain. Nothing is saved until
              you create the PO.
            </Notice>

            <Card padding="none">
              <div className="grid grid-cols-[1fr_5rem_6rem] gap-3 border-b border-border px-4 py-2 text-xs font-medium text-ink-subtle">
                <span>Product match</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Unit price</span>
              </div>
              <div className="divide-y divide-border">
                {drafts.map((d, i) => (
                  <div key={i} className="grid grid-cols-[1fr_5rem_6rem] items-center gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon
                          icon={d.confident ? CheckCircle : WarningCircle}
                          size="sm"
                          weight="fill"
                          className={d.confident ? 'text-success' : 'text-warning'}
                        />
                        <span className="truncate text-xs text-ink-subtle">read: &ldquo;{d.extracted}&rdquo;</span>
                      </div>
                      <div className="mt-1">
                        <Select options={d.matchOptions} defaultValue={d.match} size="sm" aria-label={`Match for ${d.extracted}`} />
                      </div>
                    </div>
                    <input
                      defaultValue={d.qty}
                      className="h-8 w-full rounded-base border border-border bg-surface px-2 text-right text-sm tabular-nums text-ink outline-none focus:border-primary-300"
                      aria-label={`Quantity for ${d.extracted}`}
                    />
                    <input
                      defaultValue={d.unitPrice}
                      className="h-8 w-full rounded-base border border-border bg-surface px-2 text-right text-sm tabular-nums text-ink outline-none focus:border-primary-300"
                      aria-label={`Unit price for ${d.extracted}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <Button size="sm" variant="subtle" leftIcon={Plus}>Add line</Button>
                <span className="text-sm text-ink-muted">
                  Total <span className="font-semibold text-ink">₱14,200</span>
                </span>
              </div>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-56">
                <Select
                  options={[
                    { value: 'ff', label: 'Fresh Fields Co.' },
                    { value: 'dz', label: 'Dizon Produce' },
                    { value: 'new', label: '+ New supplier' },
                  ]}
                  defaultValue="ff"
                  aria-label="Supplier"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="subtle" leftIcon={Trash}>Discard</Button>
                <Button leftIcon={Check}>Create PO</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InventoryShell>
  ),
};
