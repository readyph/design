import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Tag,
  Cube,
  ArrowCounterClockwise,
  Truck,
  PlugsConnected,
  Plus,
  PencilSimple,
  DotsThree,
  Package,
} from '@phosphor-icons/react';
import { PageHeader } from '../../components/PageHeader';
import { Tabs } from '../../components/Tabs';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Table, type TableColumn } from '../../components/Table';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { AvatarGroup } from '../../components/AvatarGroup';
import { StatusDot } from '../../components/StatusDot';
import { Notice } from '../../components/Notice';
import { Menu } from '../../components/Menu';
import { Icon } from '../../components/Icon';
import { InventoryShell } from './shell';

/**
 * Settings — categories, units, reorder defaults, a light suppliers list, and
 * the platform connection back to the Portal. See 04-Inventory.md §10. Mock data.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Inventory/Settings',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const tabs = [
  { value: 'categories', label: 'Categories', icon: Tag },
  { value: 'units', label: 'Units', icon: Cube },
  { value: 'reorder', label: 'Reorder defaults', icon: ArrowCounterClockwise },
  { value: 'suppliers', label: 'Suppliers', icon: Truck },
  { value: 'platform', label: 'Platform', icon: PlugsConnected },
];

const categories = [
  { name: 'Fruit', count: 38 },
  { name: 'Grain', count: 22 },
  { name: 'Vegetable', count: 41 },
  { name: 'Packaging', count: 19 },
  { name: 'Beverage', count: 8 },
];

const units = ['Piece', 'Pack', 'Box', 'Case', 'Sack', 'Kilogram (kg)', 'Litre (L)'];

interface Supplier {
  name: string;
  contact: string;
  pos: number;
}
const suppliers: Supplier[] = [
  { name: 'Fresh Fields Co.', contact: 'orders@freshfields.ph', pos: 12 },
  { name: 'Dizon Produce', contact: '(02) 8123 4567', pos: 7 },
  { name: 'Metro Packaging', contact: 'sales@metropack.ph', pos: 5 },
  { name: 'Sunrise Rice Mill', contact: '(044) 791 2200', pos: 3 },
];

const team = [
  { name: 'Maria Santos' },
  { name: 'John Lim' },
  { name: 'Ana Reyes' },
  { name: 'Paolo Cruz' },
  { name: 'Lea Dizon' },
];

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 py-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {action}
      </div>
      <div>{children}</div>
    </Card>
  );
}

export const Settings: Story = {
  name: 'Settings',
  render: function SettingsPage() {
    const [tab, setTab] = useState('categories');

    const supplierCols: TableColumn<Supplier>[] = [
      { key: 'name', header: 'Supplier', render: (s) => <span className="font-medium text-ink">{s.name}</span> },
      { key: 'contact', header: 'Contact', render: (s) => <span className="text-ink-muted">{s.contact}</span> },
      { key: 'pos', header: 'POs', align: 'right', render: (s) => <span className="tabular-nums text-ink-muted">{s.pos}</span> },
      {
        key: 'actions',
        header: '',
        align: 'right',
        width: 48,
        render: () => (
          <Menu
            trigger={<IconButton icon={DotsThree} label="Supplier actions" variant="subtle" size="sm" />}
            items={[{ label: 'Edit', icon: PencilSimple }, { type: 'separator' }, { label: 'Remove', danger: true }]}
          />
        ),
      },
    ];

    return (
      <InventoryShell active="settings" title="Settings">
        <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
          <PageHeader title="Settings" description="Catalog structure, defaults, suppliers, and platform connection." />

          <Tabs items={tabs} value={tab} onValueChange={setTab} variant="underline" />

          {tab === 'categories' && (
            <SectionCard title="Categories" action={<Button size="sm" leftIcon={Plus}>Add category</Button>}>
              <div className="divide-y divide-border">
                {categories.map((c) => (
                  <div key={c.name} className="flex items-center gap-3 px-5 py-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-muted text-ink-subtle">
                      <Icon icon={Tag} size="sm" />
                    </span>
                    <span className="flex-1 text-sm font-medium text-ink">{c.name}</span>
                    <span className="text-xs text-ink-subtle">{c.count} products</span>
                    <IconButton icon={PencilSimple} label="Edit" variant="subtle" size="sm" />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {tab === 'units' && (
            <SectionCard title="Units of measure" action={<Button size="sm" leftIcon={Plus}>Add unit</Button>}>
              <div className="flex flex-wrap gap-2 p-5">
                {units.map((u) => (
                  <span key={u} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-ink">
                    <Icon icon={Cube} size="sm" className="text-ink-subtle" />
                    {u}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {tab === 'reorder' && (
            <SectionCard title="Reorder defaults">
              <div className="space-y-5 p-5">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="mb-1 block text-sm font-medium text-ink">Default reorder level</label>
                    <p className="mb-2 text-xs text-ink-subtle">Applied to new products unless overridden.</p>
                    <div className="w-40">
                      <Input type="number" defaultValue={20} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">Per-category override</label>
                  <div className="mt-2 space-y-2">
                    {['Fruit', 'Packaging'].map((c) => (
                      <div key={c} className="flex items-center gap-3">
                        <div className="w-40">
                          <Select
                            options={categories.map((x) => ({ value: x.name, label: x.name }))}
                            defaultValue={c}
                            size="sm"
                            aria-label="Category"
                          />
                        </div>
                        <span className="text-sm text-ink-subtle">reorder at</span>
                        <div className="w-24">
                          <Input type="number" defaultValue={c === 'Fruit' ? 15 : 100} inputSize="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>Save defaults</Button>
                </div>
              </div>
            </SectionCard>
          )}

          {tab === 'suppliers' && (
            <div className="space-y-4">
              <Notice tone="neutral">
                A light list for v1 — just what a PO needs to reference. Terms, catalogs, and
                per-supplier history come later (04-Inventory.md §10).
              </Notice>
              <SectionCard title="Suppliers" action={<Button size="sm" leftIcon={Plus}>Add supplier</Button>}>
                <Table columns={supplierCols} data={suppliers} rowKey={(s) => s.name} className="rounded-none border-0" />
              </SectionCard>
            </div>
          )}

          {tab === 'platform' && (
            <div className="space-y-4">
              <SectionCard title="Connection">
                <div className="flex items-center gap-3 px-5 py-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
                    <Icon icon={Package} size="md" weight="fill" />
                  </span>
                  <div className="flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium text-ink">
                      Inventory <StatusDot status="active" label="Connected to Portal" />
                    </p>
                    <p className="text-xs text-ink-subtle">v2.4 · synced 2m ago · Leda can query this platform</p>
                  </div>
                  <Button size="sm" variant="secondary">Reconnect</Button>
                </div>
              </SectionCard>

              <SectionCard title="Who has access" action={<Button size="sm" variant="subtle" leftIcon={Plus}>Manage in Portal</Button>}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <AvatarGroup people={team} max={4} />
                  <p className="text-sm text-ink-muted">5 staff · managed from the Portal's Team page</p>
                </div>
              </SectionCard>

              <div className="flex justify-end">
                <Button variant="danger">Disconnect platform</Button>
              </div>
            </div>
          )}
        </div>
      </InventoryShell>
    );
  },
};
