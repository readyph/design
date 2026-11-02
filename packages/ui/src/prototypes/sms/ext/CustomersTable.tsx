import { forwardRef } from 'react';
import { Plus } from '@phosphor-icons/react';
import { Button, Skeleton, cn } from '../../../index';
import { peso, type Vehicle } from '../data';
import type { CustomerRec } from '../customersModel';
import { shortDate } from './ServicesTable';

/** Column template shared by header, rows and placeholders: customer, cars, open, last visit, spend, action. */
const COL_PX = [240, 260, 132, 104, 104, 128];
const GRID_STYLE = { gridTemplateColumns: COL_PX.map((w, i) => (i < 2 ? `minmax(${w}px, 1fr)` : `${w}px`)).join(' ') };
const TABLE_MIN = COL_PX.reduce((a, b) => a + b, 0) + 32;
const ROW = 'grid items-center px-4';

const carLine = (v: Vehicle) => `${v.make} ${v.model} ${v.year}`;
const Head = ({ children, right }: { children?: React.ReactNode; right?: boolean }) => <div role="columnheader" className={cn('px-2 text-[12px] font-medium text-muted', right && 'text-right')}>{children}</div>;

/** Cars of a customer: plate never truncated, make/model wraps; several cars stack, each on its own line. */
export function CarsCell({ vehicles, match }: { vehicles: Vehicle[]; match?: string }) {
  const flat = (s: string) => s.toLowerCase().replace(/[\s-]/g, '');
  const q = match ? flat(match) : '';
  return (
    <ul className="space-y-0.5">
      {vehicles.map((v) => (
        <li key={v.id} className="flex items-baseline gap-2 text-[13px]">
          <span className={cn('flex-none whitespace-nowrap font-mono text-[13px]', q && flat(v.plate).includes(q) && 'rounded-chip bg-accent-tint px-1 font-semibold')}>{v.plate}</span>
          <span className="min-w-0 break-words text-[12px] text-muted">{carLine(v)}</span>
        </li>
      ))}
    </ul>
  );
}

export function OpenCell({ rec }: { rec: CustomerRec }) {
  if (rec.open.length === 0) return <span className="text-[13px] text-faint">none open</span>;
  const lead = rec.open[0]!;
  return (
    <span className="block text-[13px]">
      <span className="font-medium tabular-nums">{rec.open.length} open</span>
      <span className="block font-mono text-[12px] text-muted">{lead.number}{rec.open.length > 1 ? ` +${rec.open.length - 1}` : ''}</span>
    </span>
  );
}

export interface CustomersTableProps {
  rows: CustomerRec[];
  openId?: string | null;
  query?: string;
  onOpen: (r: CustomerRec) => void;
  onNewService: (r: CustomerRec) => void;
  loading?: boolean;
  loadingMore?: boolean;
  className?: string;
}

/**
 * Studio-only CustomersTable (NEW): the list view of the Customers lookup. A row is one person: name and phone, every car with its plate, what is open
 * now, last visit, total spend, and the one action that follows a lookup (New service). Name and plate wrap and never truncate; the row grows.
 * Warning tint only when an open service is waiting on the manager.
 */
export const CustomersTable = forwardRef<HTMLDivElement, CustomersTableProps>(function CustomersTable({ rows, openId, query, onOpen, onNewService, loading, loadingMore, className }, ref) {
  return (
    <div ref={ref} role="table" aria-label="Customers" aria-rowcount={rows.length + 1} style={{ minWidth: TABLE_MIN }} className={cn('relative', className)}>
      <div role="row" style={GRID_STYLE} className={cn(ROW, 'sticky top-0 z-10 h-9 border-b border-control bg-surface')}>
        <Head>Customer</Head><Head>Cars</Head><Head>Open now</Head><Head>Last visit</Head><Head right>Spent here</Head><Head />
      </div>
      {loading && Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)}
      {!loading && rows.map((r) => {
        const c = r.customer;
        return (
          <div
            key={c.id} role="row" aria-current={openId === c.id || undefined} style={GRID_STYLE}
            className={cn(ROW, 'min-h-14 cursor-pointer border-b border-rule py-2 transition-colors duration-150 motion-reduce:transition-none hover:bg-raised', r.stuck > 0 && 'bg-warn-bg hover:bg-warn-bg', openId === c.id && 'bg-raised')}
            onClick={() => onOpen(r)}
          >
            <div role="cell" className="min-w-0 px-2">
              <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(r); }} aria-label={`Open customer ${c.name}`} className="block max-w-full break-words rounded-chip text-left text-[14px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">{c.name}</button>
              <span className="block text-[12px] tabular-nums text-muted">{c.phone}</span>
            </div>
            <div role="cell" className="min-w-0 px-2"><CarsCell vehicles={c.vehicles} match={query} /></div>
            <div role="cell" className="min-w-0 px-2"><OpenCell rec={r} /></div>
            <div role="cell" className="min-w-0 px-2 text-[13px] tabular-nums text-muted">{r.last ? shortDate(r.last) : 'no visits yet'}</div>
            <div role="cell" className="min-w-0 px-2 text-right text-[13px] tabular-nums">{r.spend > 0 ? peso(r.spend) : <span className="text-faint">none yet</span>}</div>
            <div role="cell" className="flex min-w-0 justify-end px-2">
              <Button variant="secondary" leftIcon={Plus} aria-label={`New service for ${c.name}`} onClick={(e) => { e.stopPropagation(); onNewService(r); }}>New service</Button>
            </div>
          </div>
        );
      })}
      {loadingMore && !loading && <div data-loading-more role="status" aria-label="Loading more customers">{Array.from({ length: 3 }, (_, i) => <SkeletonRow key={i} />)}</div>}
    </div>
  );
});

function SkeletonRow() {
  return (
    <div role="row" aria-hidden style={GRID_STYLE} className={cn(ROW, 'h-14 border-b border-rule')}>
      <div className="px-2"><Skeleton variant="text" lines={2} /></div><div className="px-2"><Skeleton variant="text" lines={2} /></div><div className="px-2"><Skeleton variant="text" width={72} /></div>
      <div className="px-2"><Skeleton variant="text" width={56} /></div><div className="px-2"><Skeleton variant="text" width={64} /></div><span />
    </div>
  );
}

/** Phone card: name, phone, cars, and one line of facts. Tap opens the customer as a pushed page. */
export function CustomerCard({ rec, query, onOpen }: { rec: CustomerRec; query?: string; onOpen: (r: CustomerRec) => void }) {
  const c = rec.customer;
  return (
    <div className={cn('-mx-2 border-b border-rule px-2', rec.stuck > 0 && 'bg-warn-bg')}>
      <button type="button" onClick={() => onOpen(rec)} aria-label={`${c.name}, ${c.vehicles.map((v) => v.plate).join(', ')}`} className="block min-h-11 w-full py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
        <span className="flex items-baseline justify-between gap-3"><span className="min-w-0 break-words text-[15px] font-medium leading-5">{c.name}</span><span className="flex-none text-[12px] tabular-nums text-muted">{rec.last ? shortDate(rec.last) : 'new'}</span></span>
        <span className="mt-0.5 block text-[13px] tabular-nums text-muted">{c.phone}</span>
        <span className="mt-1 block"><CarsCell vehicles={c.vehicles} match={query} /></span>
        <span className="mt-1 flex items-center justify-between gap-2 text-[12px] text-muted">
          <span className={cn(rec.open.length ? 'font-medium text-text' : 'text-faint')}>{rec.open.length ? `${rec.open.length} open · ${rec.open[0]!.number}` : 'none open'}</span>
          <span className="tabular-nums">{rec.spend > 0 ? `${peso(rec.spend)} spent` : 'no spend yet'}</span>
        </span>
      </button>
    </div>
  );
}
