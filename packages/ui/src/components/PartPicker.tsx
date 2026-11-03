import { useEffect, useMemo, useRef, useState } from 'react';
import { Notice } from './Notice';
import { StockStatus } from './StockStatus';
import { cn } from '../utils/cn';
import { onHandHere, peso, stockState, type Product } from './sms/data';
import { useWizardData } from './sms/wizardData';
import { Combobox, type ComboOption } from './Combobox';

/** Stock of one Inventory product at this branch as a word: In stock / Low stock / Out of stock, or "On order". */
export function PartStock({ product, className }: { product: Product; className?: string }) {
  const st = stockState(product);
  if (st === 'on_order') return <span className={cn('inline-flex h-5 items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-text', className)}><span aria-hidden className="size-[7px] flex-none rounded-full bg-warn" />Out, on order</span>;
  return <StockStatus status={st === 'in' ? 'ok' : st} className={className} />;
}

const matches = (p: Product, q: string) => { const n = q.trim().toLowerCase(); return !n || `${p.name} ${p.sku}`.toLowerCase().includes(n); };

/** Host search: query in, Inventory products out (name, SKU, unit, price, stock per location). May be async. */
export type PartSearch = (query: string) => Product[] | Promise<Product[]>;
/** How Inventory is answering: `slow` keeps working with a note; `down` cannot search, the service can still be saved without parts. */
export type PartsStatus = 'ok' | 'slow' | 'down';

/**
 * PartPicker: search the Inventory products by name or SKU. Each option shows the name, SKU, unit, sell price and stock at this branch.
 * Products in `exclude` are hidden. Picking calls `onPick(productId, product)`.
 * Data (RDY-629): pass `search` (the host's Inventory query) and `status`; without `search` it filters the WizardDataProvider's products (default: the sample products).
 */
export function PartPicker({ label = 'Add a part from Inventory', exclude = [], onPick, autoFocus, hint = 'Search by name or SKU. Prices and stock come from Inventory.', className, search, status = 'ok' }: { label?: string; exclude?: string[]; onPick: (productId: string, product: Product) => void; autoFocus?: boolean; hint?: string; className?: string; search?: PartSearch; status?: PartsStatus }) {
  const [q, setQ] = useState('');
  const { products } = useWizardData();
  const [found, setFound] = useState<Product[] | null>(null);
  const [failed, setFailed] = useState(false);
  const searchRef = useRef(search);
  searchRef.current = search;
  const hasSearch = !!search;
  useEffect(() => {
    if (!hasSearch || status === 'down') return;
    let live = true;
    setFailed(false);
    const t = window.setTimeout(() => {
      Promise.resolve(searchRef.current!(q)).then((r) => { if (live) setFound(r); }, () => { if (live) { setFound([]); setFailed(true); } });
    }, 200);
    return () => { live = false; window.clearTimeout(t); };
  }, [q, hasSearch, status]);
  const source = hasSearch ? found ?? [] : products;
  const options: ComboOption[] = useMemo(() => source.filter((p) => !exclude.includes(p.id) && (hasSearch || matches(p, q))).map((p) => ({
    id: p.id,
    label: `${p.name}, SKU ${p.sku}, ${peso(p.price)} per ${p.unit}, ${onHandHere(p)} in stock here`,
    node: (
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span className="min-w-0 flex-1"><span className="block truncate text-text">{p.name}</span><span className="block truncate text-[12px] text-muted">{p.sku} · {onHandHere(p)} {p.unit} here</span></span>
        <span className="flex flex-none flex-col items-end"><span className="text-[13px] tabular-nums text-text">{peso(p.price)}<span className="text-muted"> / {p.unit}</span></span><PartStock product={p} /></span>
      </span>
    ),
  })), [q, exclude, source, hasSearch]);
  if (status === 'down' || failed) {
    return (
      <div className={className}>
        <Notice tone="warn" title="Inventory is not answering">Parts cannot be searched right now. You can save the service without parts and add them later.</Notice>
      </div>
    );
  }
  return (
    <div className={className}>
      <Combobox label={label} value={q} onValueChange={setQ} options={options} onSelect={(id) => { const p = source.find((x) => x.id === id); if (p) onPick(id, p); setQ(''); }} placeholder="Search parts, e.g. oil filter or BRK-PAD" minChars={0} search emptyText={hasSearch && found === null ? 'Searching Inventory...' : 'No Inventory product matches.'} hint={hint} autoFocus={autoFocus} />
      {status === 'slow' && <p role="status" className="mt-1 text-[12px] text-muted">Inventory is slow to answer. Results may take a moment.</p>}
    </div>
  );
}
