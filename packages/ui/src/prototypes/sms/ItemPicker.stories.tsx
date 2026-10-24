import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MagnifyingGlass, Package } from '@phosphor-icons/react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { Input } from '../../components/Input';
import { Notice } from '../../components/Notice';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Skeleton } from '../../components/Skeleton';
import { RepairShell } from './Shell';
import { Page, RetryNotice } from './Page';
import { INVENTORY, peso, type InventoryItem } from './data';
import { StockBadge } from './LinkedInventory';
import { cn, focusRing } from '../../utils/cn';

/**
 * PROTOTYPE (RDY-72, RDY-73) - add an item to a job. An item is either an inventory product (picked from the linked
 * inventory, stocked) or a manual item (name, price, qty; not stocked). With no inventory linked only the manual form shows.
 */
const meta: Meta = {
  title: 'SMS/Job item picker',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

type Mode = 'inventory' | 'manual';
type ListState = 'default' | 'loading' | 'error';

function ManualForm({ startTried = false }: { startTried?: boolean }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [tried, setTried] = useState(startTried);
  const errs = {
    name: !name.trim() && 'Enter the item name.',
    qty: !(Number(qty) >= 1 && Number.isInteger(Number(qty))) && 'Enter a quantity of 1 or more.',
    price: price.trim() !== '' && !(Number(price) >= 0) && 'Enter a price of 0 or more.',
  };
  const e = (k: keyof typeof errs) => (tried && errs[k] ? (errs[k] as string) : undefined);
  return (
    <div className="flex flex-col gap-4">
      <Field label="Item name" required error={e('name')}><Input value={name} onChange={(ev) => setName(ev.target.value)} placeholder="e.g., Coolant, 1L" /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Price" error={e('price')}><Input value={price} onChange={(ev) => setPrice(ev.target.value)} inputMode="decimal" placeholder="0.00" /></Field>
        <Field label="Quantity" required error={e('qty')}><Input value={qty} onChange={(ev) => setQty(ev.target.value)} inputMode="numeric" placeholder="1" /></Field>
      </div>
      <p className="text-sm text-ink-muted">Manual items are not stocked, so they do not change inventory.</p>
      <div className="flex justify-end gap-2">
        <Button variant="subtle">Cancel</Button>
        <Button onClick={() => setTried(true)}>Add item</Button>
      </div>
    </div>
  );
}

function ProductRow({ item, selected, onSelect }: { item: InventoryItem; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn('flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left', selected ? 'border-primary bg-surface-sunken' : 'border-border hover:bg-surface-sunken', focusRing)}
    >
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-ink">{item.name}</span>
        <span className="text-xs text-ink-subtle">{item.sku}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="tabular-nums text-ink">{peso(item.price)}</span>
        <span className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="whitespace-nowrap tabular-nums">{item.onHand} on hand</span>
          <StockBadge item={item} />
        </span>
      </span>
    </button>
  );
}

function InventoryPick({ state, initialQuery }: { state: ListState; initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const [picked, setPicked] = useState<number | null>(null);
  const [qty, setQty] = useState('1');
  const rows = useMemo(() => INVENTORY.filter((i) => `${i.name} ${i.sku}`.toLowerCase().includes(q.toLowerCase())), [q]);
  const item = INVENTORY.find((i) => i.id === picked);
  if (state === 'error') return <RetryNotice title="Could not load linked inventory">Try again, or add the item by hand.</RetryNotice>;
  return (
    <div className="flex flex-col gap-4">
      <SearchBar aria-label="Search linked inventory" placeholder="Search by SKU or name…" value={q} onValueChange={setQ} onClear={() => setQ('')} />
      {state === 'loading' ? (
        <div className="flex flex-col gap-2" aria-busy="true">{[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-14 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={MagnifyingGlass} title="No matching products" description="Nothing in the linked inventory matches your search. You can add it as a manual item." />
      ) : (
        <div className="flex flex-col gap-2">{rows.map((i) => <ProductRow key={i.id} item={i} selected={picked === i.id} onSelect={() => setPicked(i.id)} />)}</div>
      )}
      {item && (
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Quantity" className="w-28"><Input value={qty} onChange={(ev) => setQty(ev.target.value)} inputMode="numeric" /></Field>
          <p className="text-sm text-ink-muted">{peso(item.price * (Number(qty) || 0))} for {item.name}</p>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="subtle">Cancel</Button>
        <Button disabled={!item || state === 'loading'}>Add item</Button>
      </div>
    </div>
  );
}

function ItemPicker({ linked = true, state = 'default', initialQuery = '', initialMode = 'inventory', tried = false }: { linked?: boolean; state?: ListState; initialQuery?: string; initialMode?: Mode; tried?: boolean }) {
  const [mode, setMode] = useState<Mode>(linked ? initialMode : 'manual');
  return (
    <RepairShell active="jobs">
      <Page width="form">
        <PageHeader title="Add item" description="Job JO-1042, Honda Civic LDP 5432" />
        <Card className="flex flex-col gap-4">
          {linked ? (
            <SegmentedControl
              aria-label="Item source"
              value={mode}
              onChange={(v) => setMode(v as Mode)}
              options={[{ value: 'inventory', label: 'From inventory' }, { value: 'manual', label: 'Manual item' }]}
            />
          ) : (
            <Notice tone="neutral" icon={Package} title="No inventory linked">Items are entered by hand and are not stocked. Link an Inventory platform to pick products with live stock.</Notice>
          )}
          {mode === 'inventory' && linked ? <InventoryPick state={state} initialQuery={initialQuery} /> : <ManualForm startTried={tried} />}
        </Card>
      </Page>
    </RepairShell>
  );
}

export const Default: Story = { name: 'Default (inventory tab)', render: () => <ItemPicker /> };
export const Linked: Story = { name: 'Linked - manual tab', render: () => <ItemPicker initialMode="manual" /> };
export const NotLinked: Story = { name: 'Not linked (manual only)', render: () => <ItemPicker linked={false} /> };
export const Loading: Story = { name: 'Loading', render: () => <ItemPicker state="loading" /> };
export const ErrorState: Story = { name: 'Error', render: () => <ItemPicker state="error" /> };
export const EmptySearch: Story = { name: 'Empty search', render: () => <ItemPicker initialQuery="radiator" /> };
export const Validation: Story = { name: 'Validation (manual, submit empty)', render: () => <ItemPicker linked={false} tried /> };
