import { forwardRef } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { Menu, type MenuItem } from './Menu';
import { PlatformLogo } from './PlatformLogo';
import { StockStatus } from './StockStatus';
import { cn } from '../utils/cn';
import { branch, onHandElsewhere, stockState, type Product } from './sms/data';
import { dayWord, shortName } from './sms/floorModel';

export type PartAction = 'transfer' | 'order' | 'eta';
export interface PartChipProps {
  product: Product;
  /** Disable the resolve menu (read-only roles, or the job is done). */
  readOnly?: boolean;
  /** Inventory link stale: shows the last sync instead of a live word. */
  staleSince?: string;
  onResolve?: (action: PartAction, product: Product) => void;
  className?: string;
}

/**
 * Studio-only PartChip (NEW): Inventory logo 14px, short name, stock word or "on order · Tue 11:00", the place when it is not here.
 * A real button that opens the part's resolve menu.
 */
export const PartChip = forwardRef<HTMLButtonElement, PartChipProps>(function PartChip({ product, readOnly, staleSince, onResolve, className }, ref) {
  const st = stockState(product);
  const away = onHandElsewhere(product)[0];
  const word = st === 'on_order'
    ? <span className="text-[12px] text-text">on order · {dayWord(product.onOrder!.eta)}</span>
    : <StockStatus status={st === 'in' ? 'ok' : st} />;
  const items: MenuItem[] = [
    { label: 'Request transfer', meta: away ? `${away.qty} at ${away.name.split(', ').pop()}` : 'none elsewhere', disabled: !away, onSelect: () => onResolve?.('transfer', product) },
    { label: 'Add to order list', onSelect: () => onResolve?.('order', product) },
    { label: 'Set expected time', onSelect: () => onResolve?.('eta', product) },
  ];
  const body = (
    <button
      ref={ref}
      type="button"
      disabled={readOnly}
      aria-label={`${product.name}, ${st === 'on_order' ? 'on order' : st === 'in' ? 'in stock' : st === 'low' ? 'low stock' : 'out of stock'}. Resolve`}
      className={cn('inline-flex h-7 max-w-full items-center gap-1.5 rounded-control border border-control bg-surface px-2 text-[12px] text-text hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default disabled:hover:bg-surface', className)}
    >
      <PlatformLogo decorative name={branch.inventory.platform} size={14} />
      <span className="truncate font-medium">{shortName(product)}</span>
      {word}
      {away && st !== 'in' && <span className="whitespace-nowrap text-muted">· {away.qty} at {away.name.split(', ').pop()}</span>}
      {staleSince && <span className="whitespace-nowrap text-muted">· synced {staleSince}</span>}
      {!readOnly && <CaretDown size={12} aria-hidden className="flex-none text-muted" />}
    </button>
  );
  return readOnly ? body : <Menu trigger={body} items={items} align="start" />;
});
