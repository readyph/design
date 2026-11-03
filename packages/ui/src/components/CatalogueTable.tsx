import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { DotsThreeVertical, PencilSimple, Power } from '@phosphor-icons/react';
import { Menu } from './Menu';
import { Skeleton } from './Skeleton';
import { StockStatus } from './StockStatus';
import { cn } from '../utils/cn';
import { peso } from './sms/data';
import { partsCost, partsStock, type ServiceType } from './sms/catalogue';
import { useWizardData } from './sms/wizardData';
import type { Product } from './sms/data';
import { durLabel } from './sms/scheduleModel';

/** ONE column template for the header, every row and the loading rows (same array, same padding). Service takes what is left. */
const GRID = 'grid-cols-[minmax(220px,1fr)_132px_72px_104px_148px_76px_44px]';
/** Below this width of the list itself (not the screen) rows collapse to two lines: sum of fixed columns + the Service minimum + row padding. */
const WIDE_MIN = 840;
const VEHICLE_SHORT = { all: 'Cars and motorcycles', car: 'Cars', motorcycle: 'Motorcycles' } as const;

/** Container width in px (0 until measured). The page sits next to a rail and a settings menu, so the screen width says little about the room. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => setW(Math.round(e!.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const Head = ({ children, right }: { children?: ReactNode; right?: boolean }) => <div role="columnheader" className={cn('px-2 text-[12px] font-medium text-muted', right && 'text-right')}>{children}</div>;

/** Linked parts as text: "2 parts" and, when one is short, the stock word of the worst one. Never colour alone. */
function PartsInfo({ t, inline, products }: { t: ServiceType; inline?: boolean; products: Product[] }) {
  const n = t.parts?.length ?? 0;
  if (!n) return <span className="text-muted">{inline ? 'Labour only' : '-'}</span>;
  const { state, worst } = partsStock(t.parts, products);
  const word = state === 'out' ? <StockStatus status="out" /> : state === 'low' ? <StockStatus status="low" /> : state === 'on_order'
    ? <span className="inline-flex h-5 items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-text"><span aria-hidden className="size-[7px] rounded-full bg-warn" />On order</span> : null;
  return (
    <span className={cn('min-w-0', inline ? 'inline-flex flex-wrap items-center gap-x-2' : 'block')} title={word ? `${worst}` : undefined}>
      <span className="text-text">{n} {n === 1 ? 'part' : 'parts'}</span>{!inline && <span className="text-muted tabular-nums"> · {peso(partsCost(t.parts, products))}</span>}
      {word && <span className={inline ? '' : 'block'}>{word}</span>}
    </span>
  );
}

/** The row's three-dot menu. It swallows click and key events (React bubbles them out of the menu portal too), so opening it never opens the row. */
function RowMenu({ t, onEdit, onToggle }: { t: ServiceType; onEdit: (t: ServiceType) => void; onToggle: (t: ServiceType) => void }) {
  return (
    <span className="flex flex-none items-center justify-center" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Menu align="end" items={[
        { label: 'Edit', icon: PencilSimple, onSelect: () => onEdit(t) },
        { label: t.active ? 'Deactivate' : 'Activate', icon: Power, onSelect: () => onToggle(t) },
      ]} trigger={
        <button type="button" aria-label={`More actions for ${t.name}`} className="inline-flex size-9 items-center justify-center rounded-control text-muted hover:bg-raised-2 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent data-[state=open]:bg-raised-2 max-[640px]:size-11">
          <DotsThreeVertical size={20} weight="bold" aria-hidden />
        </button>} />
    </span>
  );
}

const rowKeys = (open: () => void) => (e: KeyboardEvent) => { if (e.target !== e.currentTarget) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
const rowCls = 'cursor-pointer border-b border-rule hover:bg-raised focus-visible:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent';

/**
 * Studio-only CatalogueTable (NEW, rev 2): the shop's services. Wide list: one grid template for header and rows (Service, Category with vehicle, Time, Labour price,
 * Parts, Status, menu). Narrow list or phone: two-line rows. The whole row opens the edit modal (hover, pointer, focus ring); the three-dot menu has Edit and Deactivate / Activate.
 * A mechanic gets the same list, not clickable, without the menu.
 */
export function CatalogueTable({ rows, canEdit, onEdit, onToggle, loading, loadingMore, products: hostProducts }: { /** Host Inventory products, to show the linked parts' cost and stock. Default: the WizardDataProvider's, else the sample products. */ products?: Product[]; rows: ServiceType[]; canEdit: boolean; onEdit: (t: ServiceType) => void; onToggle: (t: ServiceType) => void; loading?: boolean; loadingMore?: boolean }) {
  const wd = useWizardData();
  const products = hostProducts ?? wd.products;
  const [ref, w] = useWidth<HTMLDivElement>();
  // Hysteresis: a classic scrollbar can appear when the tier flips and change the width by ~15px, which would flip it back (a resize loop). Switch down at WIDE_MIN, back up only 32px above.
  const wasWide = useRef(true);
  const wide = w === 0 || (wasWide.current ? w >= WIDE_MIN : w >= WIDE_MIN + 32);
  wasWide.current = wide;
  const interact = (t: ServiceType) => canEdit ? { tabIndex: 0, onClick: () => onEdit(t), onKeyDown: rowKeys(() => onEdit(t)), 'aria-label': `Edit ${t.name}` } : {};

  return (
    <div ref={ref} data-tier={wide ? 'wide' : 'compact'}>
      {wide ? (
        <div role="table" aria-label="Services and prices">
          <div role="row" className={cn('sticky top-0 z-10 grid h-9 items-center border-b border-control bg-surface px-4', GRID)}>
            <Head>Service</Head><Head>Category</Head><Head right>Time</Head><Head right>Labour price</Head><Head>Parts</Head><Head>Status</Head><Head><span className="sr-only">Actions</span></Head>
          </div>
          {loading && Array.from({ length: 10 }, (_, i) => (
            <div key={i} role="row" aria-hidden className={cn('grid h-14 items-center border-b border-rule px-4', GRID)}>
              <div className="px-2"><Skeleton variant="text" width={200} /></div><div className="px-2"><Skeleton variant="text" width={80} /></div><div className="px-2"><Skeleton variant="text" width={40} /></div>
              <div className="px-2"><Skeleton variant="text" width={60} /></div><div className="px-2"><Skeleton variant="text" width={70} /></div><div className="px-2"><Skeleton variant="text" width={44} /></div><div />
            </div>
          ))}
          {!loading && rows.map((t) => (
            <div key={t.id} role="row" {...interact(t)} className={cn('grid h-14 items-center px-4', GRID, rowCls, !canEdit && 'cursor-default hover:bg-transparent', !t.active && 'text-muted')}>
              <div role="cell" className="min-w-0 px-2">
                <span className={cn('block truncate text-[14px] font-medium', t.active && 'text-text')} title={t.name}>{t.name}</span>
                {t.description && <span className="block truncate text-[12px] text-muted" title={t.description}>{t.description}</span>}
              </div>
              <div role="cell" className="min-w-0 px-2 text-[13px]"><span className="block truncate">{t.category}</span><span className="block truncate text-[12px] text-muted">{VEHICLE_SHORT[t.vehicle]}</span></div>
              <div role="cell" className="px-2 text-right text-[13px] tabular-nums">{durLabel(t.mins)}</div>
              <div role="cell" className={cn('px-2 text-right text-[14px] tabular-nums', t.active && 'text-text')}>{peso(t.price)}</div>
              <div role="cell" className="min-w-0 px-2 text-[13px]"><PartsInfo t={t} products={products} /></div>
              <div role="cell" className="px-2 text-[13px]">{t.active ? 'Active' : 'Inactive'}</div>
              <div role="cell" className="flex justify-end">{canEdit && <RowMenu t={t} onEdit={onEdit} onToggle={onToggle} />}</div>
            </div>
          ))}
          {loadingMore && !loading && <div data-loading-more role="status" aria-label="Loading more services">{Array.from({ length: 3 }, (_, i) => <div key={i} aria-hidden className="h-14 border-b border-rule px-6 py-4"><Skeleton variant="text" width={240} /></div>)}</div>}
        </div>
      ) : (
        <ul aria-label="Services and prices">
          {loading && Array.from({ length: 6 }, (_, i) => <li key={i} aria-hidden className="border-b border-rule px-2 py-3"><Skeleton variant="text" lines={2} /></li>)}
          {!loading && rows.map((t) => (
            <li key={t.id} {...interact(t)} className={cn('flex min-h-14 items-center gap-1 pl-2', rowCls, !canEdit && 'cursor-default hover:bg-transparent', !t.active && 'text-muted')}>
              <div className="min-w-0 flex-1 py-2">
                <span className="flex items-baseline justify-between gap-3">
                  <span className={cn('line-clamp-2 min-w-0 break-words text-[14px] font-medium', t.active && 'text-text')}>{t.name}</span>
                  <span className={cn('flex-none text-[14px] tabular-nums', t.active && 'text-text')}>{peso(t.price)}</span>
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
                  <span>{t.category}</span><span aria-hidden>·</span><span>{VEHICLE_SHORT[t.vehicle]}</span><span aria-hidden>·</span><span className="tabular-nums">{durLabel(t.mins)}</span>
                  <span aria-hidden>·</span><PartsInfo t={t} inline products={products} />{!t.active && <><span aria-hidden>·</span><span className="font-medium text-text">Inactive</span></>}
                </span>
              </div>
              {canEdit ? <RowMenu t={t} onEdit={onEdit} onToggle={onToggle} /> : <span className="w-2" />}
            </li>
          ))}
          {loadingMore && !loading && <li data-loading-more role="status" aria-label="Loading more services" className="py-3"><Skeleton variant="text" lines={3} /></li>}
        </ul>
      )}
    </div>
  );
}
