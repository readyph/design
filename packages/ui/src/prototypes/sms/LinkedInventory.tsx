import { useMemo, useState } from 'react';
import { LinkSimple, MagnifyingGlass } from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { SearchBar } from '../../components/SearchBar';
import { Table, type TableColumn } from '../../components/Table';
import { RetryNotice } from './Page';
import { INVENTORY, peso, stockTone, type InventoryItem } from './data';

export type InvState = 'default' | 'loading' | 'error';

export function StockBadge({ item }: { item: InventoryItem }) {
  const tone = stockTone(item);
  if (!tone) return null;
  return <Badge tone={tone} size="sm" dot className="whitespace-nowrap">{item.onHand === 0 ? 'Out of stock' : 'Low stock'}</Badge>;
}

/** RDY-33: read-only list of the products of the linked inventory platform. Edited in Inventory, never here. */
export function LinkedInventory({ linked = true, state = 'default', initialQuery = '' }: { linked?: boolean; state?: InvState; initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const rows = useMemo(() => INVENTORY.filter((i) => `${i.name} ${i.sku}`.toLowerCase().includes(q.toLowerCase())), [q]);
  const cols: TableColumn<InventoryItem>[] = [
    { key: 'sku', header: 'SKU', render: (i) => <span className="whitespace-nowrap text-ink-muted">{i.sku}</span> },
    { key: 'name', header: 'Product', render: (i) => <span className="font-medium text-ink">{i.name}</span> },
    { key: 'price', header: 'Unit price', align: 'right', render: (i) => <span className="tabular-nums text-ink">{peso(i.price)}</span> },
    { key: 'onhand', header: 'On hand', align: 'right', render: (i) => <span className="whitespace-nowrap tabular-nums text-ink">{i.onHand} <span className="text-xs text-ink-subtle">{i.unit}</span></span> },
    { key: 'stock', header: 'Stock', render: (i) => <StockBadge item={i} /> },
  ];

  return (
    <section className="flex flex-col gap-4" aria-labelledby="linked-inventory">
      <div className="flex flex-col gap-1">
        <h2 id="linked-inventory" className="text-lg font-semibold text-ink">Linked inventory</h2>
        <p className="text-sm text-ink-muted">Products from your Inventory platform. Job items can be picked from here. Edit them in Inventory.</p>
      </div>
      {!linked ? (
        <EmptyState
          icon={LinkSimple}
          title="No inventory linked"
          description="Link an Inventory platform to pick stocked products on jobs. Until then, add items by hand on each job."
          action={<Button size="sm" variant="secondary">Link inventory</Button>}
        />
      ) : state === 'error' ? (
        <RetryNotice title="Could not load linked inventory">Try again in a moment.</RetryNotice>
      ) : (
        <>
          <SearchBar aria-label="Search linked inventory" placeholder="Search by SKU or name…" value={q} onValueChange={setQ} onClear={() => setQ('')} />
          <Table
            columns={cols}
            data={state === 'loading' ? [] : rows}
            rowKey={(i) => i.id}
            loading={state === 'loading'}
            empty={<EmptyState icon={MagnifyingGlass} title="No matching products" description="Nothing in the linked inventory matches your search." />}
          />
          {state === 'default' && <p className="text-sm text-ink-muted">{rows.length} products displayed</p>}
        </>
      )}
    </section>
  );
}
