import type { Meta, StoryObj } from '@storybook/react';
import {
  WaveTriangle,
  Export,
  CurrencyDollar,
  ArrowsClockwise,
  TrendDown,
  Receipt,
  ChartBar,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Icon } from '../../components/Icon';
import { Table, type TableColumn } from '../../components/Table';
import { InventoryShell } from './shell';

/**
 * Reports — inventory analytics, same "generate with Leda → save" pattern as
 * the Portal. A saved-reports list plus a viewer (chart + table). See
 * 04-Inventory.md §9. Mock data.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Inventory/Reports',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

interface Saved {
  name: string;
  icon: PhosphorIcon;
  updated: string;
  active?: boolean;
}

const saved: Saved[] = [
  { name: 'Stock valuation', icon: CurrencyDollar, updated: 'today', active: true },
  { name: 'Turnover rate', icon: ArrowsClockwise, updated: '2d ago' },
  { name: 'Slow movers', icon: TrendDown, updated: '1w ago' },
  { name: 'PO spend & variance', icon: Receipt, updated: '1w ago' },
];

const bars = [
  { label: 'Fruit', value: 182, display: '₱182k' },
  { label: 'Grain', value: 132, display: '₱132k' },
  { label: 'Vegetable', value: 96, display: '₱96k' },
  { label: 'Packaging', value: 44, display: '₱44k' },
  { label: 'Other', value: 28, display: '₱28k' },
];
const maxBar = Math.max(...bars.map((b) => b.value));

interface Row {
  category: string;
  skus: number;
  units: string;
  value: string;
  share: string;
}

const rows: Row[] = [
  { category: 'Fruit', skus: 38, units: '1,240', value: '₱182,400', share: '38%' },
  { category: 'Grain', skus: 22, units: '860', value: '₱132,100', share: '27%' },
  { category: 'Vegetable', skus: 41, units: '2,090', value: '₱96,300', share: '20%' },
  { category: 'Packaging', skus: 19, units: '4,500', value: '₱44,200', share: '9%' },
  { category: 'Other', skus: 8, units: '320', value: '₱27,600', share: '6%' },
];

export const Reports: Story = {
  name: 'Reports',
  render: () => {
    const columns: TableColumn<Row>[] = [
      { key: 'category', header: 'Category', render: (r) => <span className="font-medium text-ink">{r.category}</span> },
      { key: 'skus', header: 'SKUs', align: 'right', render: (r) => <span className="tabular-nums text-ink-muted">{r.skus}</span> },
      { key: 'units', header: 'Units', align: 'right', render: (r) => <span className="tabular-nums text-ink-muted">{r.units}</span> },
      { key: 'value', header: 'Value', align: 'right', render: (r) => <span className="tabular-nums text-ink">{r.value}</span> },
      { key: 'share', header: 'Share', align: 'right', render: (r) => <span className="tabular-nums text-ink-muted">{r.share}</span> },
    ];

    return (
      <InventoryShell active="reports" title="Reports">
        <div className="mx-auto max-w-6xl p-4 sm:p-6">
          <PageHeader
            title="Reports"
            description="Saved reports · generate new ones with Leda"
            actions={<Button leftIcon={WaveTriangle}>Generate with Leda</Button>}
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Saved list */}
            <div className="space-y-1">
              {saved.map((s) => (
                <button
                  key={s.name}
                  className={
                    s.active
                      ? 'flex w-full items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2.5 text-left'
                      : 'flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left hover:bg-surface-muted'
                  }
                >
                  <span className={s.active ? 'text-primary-600' : 'text-ink-subtle'}>
                    <Icon icon={s.icon} size="md" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                    <p className="text-xs text-ink-subtle">Updated {s.updated}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Viewer */}
            <div className="lg:col-span-2">
              <Card padding="none">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                      <Icon icon={CurrencyDollar} size="md" className="text-primary-600" /> Stock valuation
                    </h2>
                    <p className="mt-0.5 text-xs text-ink-subtle">By category · as of 4 Oct 2026</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral" size="sm">₱482k total</Badge>
                    <Button size="sm" variant="subtle" leftIcon={Export}>Export</Button>
                  </div>
                </div>

                {/* Chart */}
                <div className="border-t border-border px-5 py-5">
                  <div className="space-y-3">
                    {bars.map((b) => (
                      <div key={b.label} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-xs text-ink-muted">{b.label}</span>
                        <div className="h-5 flex-1 overflow-hidden rounded-base bg-surface-muted">
                          <div
                            className="h-full rounded-base bg-primary-500"
                            style={{ width: `${(b.value / maxBar) * 100}%` }}
                          />
                        </div>
                        <span className="w-14 shrink-0 text-right text-xs tabular-nums text-ink">{b.display}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-subtle">
                    <Icon icon={ChartBar} size="sm" /> Mock figures — wired to a live chart block in production.
                  </p>
                </div>

                {/* Table */}
                <div className="border-t border-border">
                  <Table columns={columns} data={rows} rowKey={(r) => r.category} className="rounded-none border-0" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </InventoryShell>
    );
  },
};
