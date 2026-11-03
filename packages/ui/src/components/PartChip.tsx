import { forwardRef } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { Menu, type MenuItem } from './Menu';
import { PlatformLogo } from './PlatformLogo';
import { StockStatus } from './StockStatus';
import { cn } from '../utils/cn';
import { dayWord, shortName } from './today/model';
import type { TodayEnv, TodayProduct } from './today/types';

export type PartAction = 'transfer' | 'order' | 'eta';
export interface PartChipProps {
  product: TodayProduct;
  /** The clock and the stock rules (state, stock held elsewhere). */
  env: Pick<TodayEnv, 'today' | 'stockState' | 'elsewhere'>;
  /** Name of the linked Inventory platform; its logo shows in the chip. */
  inventoryName: string;
  /** Disable the resolve menu (read-only roles, or the job is done). */
  readOnly?: boolean;
  /** Inventory link stale: shows the last sync instead of a live word. */
  staleSince?: string;
  onResolve?: (action: PartAction, product: TodayProduct) => void;
  className?: string;
}

/**
 * PartChip: Inventory logo 14px, short name, stock word or "on order · Tue 11:00", the place when it is not here.
 * A real button that opens the part's resolve menu.
 */
export const PartChip = forwardRef<HTMLButtonElement, PartChipProps>(function PartChip({ product, env, inventoryName, readOnly, staleSince, onResolve, className }, ref) {
  const st = env.stockState(product);
  const away = env.elsewhere(product)[0];
  const word = st === 'on_order'
    ? <span className="text-[12px] text-text">on order · {dayWord(product.onOrder!.eta, env.today)}</span>
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
      <PlatformLogo decorative name={inventoryName} size={14} />
      <span className="truncate font-medium">{shortName(product)}</span>
      {word}
      {away && st !== 'in' && <span className="whitespace-nowrap text-muted">· {away.qty} at {away.name.split(', ').pop()}</span>}
      {staleSince && <span className="whitespace-nowrap text-muted">· synced {staleSince}</span>}
      {!readOnly && <CaretDown size={12} aria-hidden className="flex-none text-muted" />}
    </button>
  );
  return readOnly ? body : <Menu trigger={body} items={items} align="start" />;
});
