import { forwardRef } from 'react';
import { Checkbox, PlatformLogo, Skeleton, cn } from '../../../index';
import { PersonAvatar } from './avatarTone';
import { branch, jobBalance, jobTotal, mechanics, peso, type Job } from '../data';
import { STATUS_SHORT, dayWord, flagOf, hm, reasonOf, serviceTitle, viewOf } from '../floorModel';
import { isUnpaid, partsFor } from '../servicesModel';
import { PartChip } from './PartChip';

export type InventoryLink = 'ok' | 'slow' | 'down';

export interface ServicesTableProps {
  rows: Job[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (on: boolean) => void;
  openId?: string | null;
  onOpen: (job: Job) => void;
  onOpenCustomer: (job: Job) => void;
  inventory?: InventoryLink;
  /** Opens the quotation document from a row that has one. */
  onViewQuote?: (job: Job) => void;
  loading?: boolean;
  /** Next batch is on its way: three placeholder rows after the last one. */
  loadingMore?: boolean;
  className?: string;
}

/**
 * Column template shared by the header and every row: select, number, service, customer, mechanic, status, promised, money, parts.
 * Set as an inline style (not a generated utility class), so the header and rows can never lose their columns, and the table's minimum width
 * is derived from the same numbers so no row can be wider than its box.
 */
import { hasQuotation, quoteNoOf } from '../wizardModel';
const COL_PX = [40, 88, 200, 150, 56, 128, 88, 104, 188];
const GRID_STYLE = { gridTemplateColumns: COL_PX.map((w, i) => (i === 2 ? `minmax(${w}px, 1fr)` : `${w}px`)).join(' ') };
const TABLE_MIN = COL_PX.reduce((a, b) => a + b, 0) + 32;
const ROW = 'grid items-center px-4';

const updated = (j: Job) => (j.status === 'COMPLETED' ? `done ${shortDate(j.statusSince)}` : shortDate(j.statusSince));
export const shortDate = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00+08:00`);
  return iso.startsWith('2026-11-02') ? `Today ${hm(iso)}` : d.toLocaleDateString('en-PH', { day: 'numeric', month: 'short' });
};

/** Parts-from-Inventory cell: the most urgent part as a read-only PartChip (short ones first), "+N" for the rest. Down: no live words. */
export function PartsCell({ job, inventory = 'ok' }: { job: Job; inventory?: InventoryLink }) {
  const { lines, lead, shortCount } = partsFor(job);
  if (!lead) return <span className="text-[13px] text-faint">No parts</span>;
  if (inventory === 'down') {
    return <span className="flex min-w-0 items-center gap-1.5 truncate text-[12px] text-muted"><PlatformLogo decorative name={branch.inventory.platform} size={14} />{lines.length} {lines.length === 1 ? 'part' : 'parts'} · stock unknown</span>;
  }
  const done = job.status === 'COMPLETED';
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {done
        ? <span className="inline-flex items-center gap-1.5 text-[12px] text-muted"><PlatformLogo decorative name={branch.inventory.platform} size={14} />{lines.length} {lines.length === 1 ? 'part' : 'parts'} issued</span>
        : <PartChip product={lead.product} readOnly staleSince={inventory === 'slow' ? '10:02' : undefined} className="min-w-0 max-w-[116px] overflow-hidden" />}
      {!done && lines.length > 1 && <span className="flex-none text-[12px] text-muted">{shortCount > 1 ? `+${lines.length - 1}, ${shortCount} short` : `+${lines.length - 1}`}</span>}
    </span>
  );
}

function StatusCell({ job }: { job: Job }) {
  const flag = flagOf(job);
  return (
    <span className="min-w-0">
      <span className="flex items-center gap-1.5 text-[13px]"><span aria-hidden className={cn('size-1.5 flex-none rounded-full', STATUS_SHORT[job.status].dot)} />{STATUS_SHORT[job.status].label}</span>
      <span className={cn('block truncate text-[12px]', flag ? (flag.tone === 'bad' ? 'font-medium text-bad' : 'font-medium text-text') : 'text-muted')}>{flag ? flag.word : updated(job)}</span>
    </span>
  );
}

export function MoneyCell({ job, align = 'right' }: { job: Job; align?: 'right' | 'left' }) {
  const bal = jobBalance(job);
  const quote = job.status === 'QUOTATION' || job.status === 'FOR_APPROVAL';
  const total = jobTotal(job);
  return (
    <span className={cn('block', align === 'right' ? 'text-right' : 'text-left')}>
      <span className="block text-[13px] tabular-nums">{peso(total)}</span>
      <span className={cn('block truncate text-[12px] tabular-nums', isUnpaid(job) ? 'font-medium text-warn-ink' : 'text-muted')}>{quote ? 'quote' : isUnpaid(job) ? `${peso(bal)} unpaid` : 'paid'}</span>
    </span>
  );
}

const Head = ({ children, right }: { children?: React.ReactNode; right?: boolean }) => (
  <div role="columnheader" className={cn('min-w-0 truncate px-2 text-[12px] font-medium text-muted', right && 'text-right')}>{children}</div>
);

/**
 * Studio-only ServicesTable (NEW): the dense ruled list. Two-line rows (56px): select, number + date, service + vehicle/plate, customer (opens the lookup),
 * mechanic, status + flag, promised, total/paid, parts from Inventory. Rows waiting for the manager use the warning tint; the open one is raised.
 */
export const ServicesTable = forwardRef<HTMLDivElement, ServicesTableProps>(function ServicesTable(
  { rows, selected, onToggle, onToggleAll, openId, onOpen, onOpenCustomer, onViewQuote, inventory = 'ok', loading, loadingMore, className }, ref,
) {
  const all = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const some = rows.some((r) => selected.has(r.id));
  return (
    <div ref={ref} role="table" aria-label="Services" aria-rowcount={rows.length + 1} style={{ minWidth: TABLE_MIN }} className={cn('relative', className)}>
      <div role="row" style={GRID_STYLE} className={cn(ROW, 'sticky top-0 z-10 h-9 border-b border-control bg-surface')}>
        <div role="columnheader" className="flex justify-center"><Checkbox aria-label={`Select all ${rows.length} loaded`} checked={all} indeterminate={!all && some} onChange={(e) => onToggleAll(e.target.checked)} /></div>
        <Head>Service</Head><Head>What and which car</Head><Head>Customer</Head><Head>Mechanic</Head><Head>Status</Head><Head>Promised</Head><Head right>Total</Head><Head>Parts</Head>
      </div>
      {loading && Array.from({ length: 9 }, (_, i) => <SkeletonRow key={i} />)}
      {!loading && rows.map((j) => {
        const v = viewOf(j);
        const m = mechanics.find((x) => x.id === j.assigneeId);
        const title = serviceTitle(j);
        const waiting = !!reasonOf(j);
        const on = selected.has(j.id);
        return (
          <div
            key={j.id} role="row" aria-selected={on} aria-current={openId === j.id || undefined} style={GRID_STYLE}
            className={cn(ROW, 'h-14 overflow-hidden border-b border-rule transition-colors duration-150 motion-reduce:transition-none hover:bg-raised', waiting && 'bg-warn-bg hover:bg-warn-bg', openId === j.id && 'bg-raised', on && 'bg-accent-tint hover:bg-accent-tint')}
          >
            <div role="cell" className="flex min-w-0 justify-center"><Checkbox aria-label={`Select ${j.number}`} checked={on} onChange={() => onToggle(j.id)} /></div>
            <div role="cell" className="min-w-0 px-2">
              <button type="button" onClick={() => onOpen(j)} className="block rounded-chip text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                <span className="block font-mono text-[13px]">{j.number}</span>{!(onViewQuote && hasQuotation(j)) && <span className="block text-[12px] text-muted">{shortDate(j.createdAt)}</span>}
              </button>
              {onViewQuote && hasQuotation(j) && <button type="button" onClick={() => onViewQuote(j)} className="block rounded-chip text-[12px] font-medium text-accent underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Quotation<span className="sr-only"> {quoteNoOf(j)}</span></button>}
            </div>
            <div role="cell" className="min-w-0 cursor-pointer px-2" onClick={() => onOpen(j)} title={`${title} · ${v.vehicle} · ${v.plate}`}>
              <span className="block truncate text-[14px] font-medium">{title}</span>
              <span className="block truncate text-[12px] text-muted">{v.vehicle} · <span className="font-mono">{v.plate}</span></span>
            </div>
            <div role="cell" className="min-w-0 px-2">
              <button type="button" onClick={() => onOpenCustomer(j)} title={`${v.customer}. Open customer`} className="block max-w-full truncate rounded-chip text-left text-[13px] underline decoration-rule underline-offset-2 hover:decoration-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">{v.customer}</button>
              <span className="block truncate text-[12px] tabular-nums text-muted">{v.phone}</span>
            </div>
            <div role="cell" className="min-w-0 px-2">{m ? <span title={m.name}><PersonAvatar personId={m.id} name={m.name} initials={m.initials} size={24} /></span> : <span className="text-[12px] text-faint">none</span>}</div>
            <div role="cell" className="min-w-0 cursor-pointer px-2" onClick={() => onOpen(j)}><StatusCell job={j} /></div>
            <div role="cell" className="min-w-0 cursor-pointer truncate px-2 text-[13px] tabular-nums text-muted" onClick={() => onOpen(j)}>{j.promisedAt ? dayWord(j.promisedAt) : 'not set'}</div>
            <div role="cell" className="min-w-0 cursor-pointer px-2" onClick={() => onOpen(j)}><MoneyCell job={j} /></div>
            <div role="cell" className="min-w-0 overflow-hidden px-2"><PartsCell job={j} inventory={inventory} /></div>
          </div>
        );
      })}
      {loadingMore && !loading && (
        <div data-loading-more role="status" aria-label="Loading more services">{Array.from({ length: 3 }, (_, i) => <SkeletonRow key={i} />)}</div>
      )}
    </div>
  );
});

/** A placeholder row on the same column template as a real row, so loading more never shifts the columns. */
function SkeletonRow() {
  return (
    <div role="row" aria-hidden style={GRID_STYLE} className={cn(ROW, 'h-14 border-b border-rule')}>
      <span /><div className="px-2"><Skeleton variant="text" width={64} /></div><div className="px-2"><Skeleton variant="text" lines={2} /></div><div className="px-2"><Skeleton variant="text" width={110} /></div><span /><div className="px-2"><Skeleton variant="text" width={80} /></div><div className="px-2"><Skeleton variant="text" width={56} /></div><div className="px-2"><Skeleton variant="text" width={72} /></div><div className="px-2"><Skeleton variant="text" width={140} /></div>
    </div>
  );
}

/** Phone card: three lines, tap opens the service page; select mode shows a checkbox. */
export function ServiceCard({ job, onOpen, selectMode, checked, onToggle, inventory = 'ok' }: {
  job: Job; onOpen: (j: Job) => void; selectMode?: boolean; checked?: boolean; onToggle?: (id: string) => void; inventory?: InventoryLink;
}) {
  const v = viewOf(job);
  const flag = flagOf(job);
  const { lead, lines, shortCount } = partsFor(job);
  return (
    <div className={cn('-mx-2 flex items-start gap-1 border-b border-rule px-2', reasonOf(job) && 'bg-warn-bg')}>
      {selectMode && <div className="flex min-h-11 w-11 flex-none items-center justify-center"><Checkbox aria-label={`Select ${job.number}`} checked={!!checked} onChange={() => onToggle?.(job.id)} /></div>}
      <button type="button" onClick={() => (selectMode ? onToggle?.(job.id) : onOpen(job))} className="block min-h-11 min-w-0 flex-1 py-2 text-left">
        <span className="flex items-baseline gap-2"><span className="font-mono text-[13px]">{job.number}</span><span className="min-w-0 flex-1 truncate font-mono text-[13px] text-muted">{v.plate}</span><span className="flex-none text-[13px] tabular-nums text-muted">{job.promisedAt ? dayWord(job.promisedAt) : shortDate(job.statusSince)}</span></span>
        <span title={serviceTitle(job)} className="mt-0.5 line-clamp-2 break-words text-[14px] font-medium leading-5">{serviceTitle(job)}</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-2 text-[13px] text-muted"><span className="inline-flex flex-none items-center gap-1.5 text-text"><span aria-hidden className={cn('size-1.5 rounded-full', STATUS_SHORT[job.status].dot)} />{STATUS_SHORT[job.status].label}</span><span className="min-w-0 truncate">{v.customer}</span></span>
        <span className="mt-0.5 flex items-center justify-between gap-2 text-[12px]">
          <span className={cn('min-w-0 truncate', flag?.tone === 'bad' ? 'font-medium text-bad' : 'text-muted')}>{flag ? flag.word : lead ? (inventory === 'down' ? `${lines.length} parts · stock unknown` : shortCount ? `${shortCount} part short` : `${lines.length} ${lines.length === 1 ? 'part' : 'parts'}`) : 'No parts'}</span>
          <span className={cn('flex-none tabular-nums', isUnpaid(job) ? 'font-medium text-warn-ink' : 'text-muted')}>{job.status === 'QUOTATION' || job.status === 'FOR_APPROVAL' ? `quote ${peso(jobBalance(job))}` : isUnpaid(job) ? `${peso(jobBalance(job))} unpaid` : 'paid'}</span>
        </span>
      </button>
    </div>
  );
}
