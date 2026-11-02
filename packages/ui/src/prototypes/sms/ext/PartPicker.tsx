import { useMemo, useState } from 'react';
import { StockStatus, cn } from '../../../index';
import { onHandHere, peso, products, stockState, type Product } from '../data';
import { Combobox, type ComboOption } from './Combobox';

/** Stock of one Inventory product at this branch as a word: In stock / Low stock / Out of stock, or "On order". */
export function PartStock({ product, className }: { product: Product; className?: string }) {
  const st = stockState(product);
  if (st === 'on_order') return <span className={cn('inline-flex h-5 items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-text', className)}><span aria-hidden className="size-[7px] flex-none rounded-full bg-warn" />Out, on order</span>;
  return <StockStatus status={st === 'in' ? 'ok' : st} className={className} />;
}

const matches = (p: Product, q: string) => { const n = q.trim().toLowerCase(); return !n || `${p.name} ${p.sku}`.toLowerCase().includes(n); };

/**
 * Studio-only PartPicker (NEW): search the Inventory products by name or SKU. Each option shows the name, SKU, unit, sell price and stock at this branch.
 * Products in `exclude` are hidden. Picking calls `onPick(productId)`.
 */
export function PartPicker({ label = 'Add a part from Inventory', exclude = [], onPick, autoFocus, hint = 'Search by name or SKU. Prices and stock come from Inventory.', className }: { label?: string; exclude?: string[]; onPick: (productId: string) => void; autoFocus?: boolean; hint?: string; className?: string }) {
  const [q, setQ] = useState('');
  const options: ComboOption[] = useMemo(() => products.filter((p) => !exclude.includes(p.id) && matches(p, q)).map((p) => ({
    id: p.id,
    label: `${p.name}, SKU ${p.sku}, ${peso(p.price)} per ${p.unit}, ${onHandHere(p)} in stock here`,
    node: (
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span className="min-w-0 flex-1"><span className="block truncate text-text">{p.name}</span><span className="block truncate text-[12px] text-muted">{p.sku} · {onHandHere(p)} {p.unit} here</span></span>
        <span className="flex flex-none flex-col items-end"><span className="text-[13px] tabular-nums text-text">{peso(p.price)}<span className="text-muted"> / {p.unit}</span></span><PartStock product={p} /></span>
      </span>
    ),
  })), [q, exclude]);
  return (
    <Combobox className={className} label={label} value={q} onValueChange={setQ} options={options} onSelect={(id) => { onPick(id); setQ(''); }} placeholder="Search parts, e.g. oil filter or BRK-PAD" minChars={0} search emptyText="No Inventory product matches." hint={hint} autoFocus={autoFocus} />
  );
}
