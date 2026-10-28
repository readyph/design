import { Plus } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { ActionLink } from './ActionLink';
import { Select } from './Select';
import { Button } from './Button';

/*
 * RDY-398 I15 (list). Transcribed from inventory-home FINAL/movements.css 89-105 (.trrow), 159-160 (<=1099), 206, 221-228 (<=640),
 * products.css 94-102 (.pane .state), 284-287 + products.css 38, 120-122 (.seg); movements.js 211-253 (trAction, trRow, trHead, trResults, trSeg).
 * Status = .pane .state with dot (products.css 94-102, 110-111; purchase-orders.css 6-7).
 */
export type TransferStatus = 'draft' | 'transit' | 'received' | 'cancelled';
export type TransferFilter = 'all' | TransferStatus;
export type TransferActionKind = 'send' | 'receive' | 'open' | 'view';

export const TRANSFER_STATUS_LABEL: Record<TransferStatus, string> = { draft: 'Draft', transit: 'In transit', received: 'Received', cancelled: 'Cancelled' };
export interface TransferRowData {
  /** "TR-0032". */
  id: string;
  status: TransferStatus;
  /** True when this stockroom sends it. */
  out: boolean;
  /** Full name of the other place ("Cebu branch"). */
  otherName: string;
  /** Short name of this place ("Main"). */
  hereShort: string;
  /** Job order, for example JO-0412. */
  job?: string;
  /** Second line under the status ("Not sent yet", "On its way", "All in", "6 of 8 in, 2 short"). */
  statusNote: string;
  /** "8 pcs and 2 boxes". */
  items: string;
  /** Product names, one line. */
  itemNames: string;
  /** "Today, 9:40". */
  when: string;
  /** Who did the last step. */
  who: string;
  /** Which action the right-hand link offers. */
  action: TransferActionKind;
}

/* .pane .state (products.css 94-102, 110-111; purchase-orders.css 6-7): 12px/500 word after a 7px dot; Draft is a dashed ring, Cancelled a faint ring. */
const dot: Record<TransferStatus, string> = {
  draft: 'h-1.5 w-1.5 border-[1.5px] border-dashed border-muted',
  transit: 'h-[7px] w-[7px] bg-accent',
  received: 'h-[7px] w-[7px] bg-faint',
  cancelled: 'h-1.5 w-1.5 border-[1.5px] border-faint',
};
const word: Record<TransferStatus, string> = {
  draft: 'font-medium text-muted',
  transit: 'font-medium text-text',
  received: 'font-normal text-muted',
  cancelled: 'font-medium text-muted',
};

export function TransferStatusBadge({ status, className }: { status: TransferStatus; className?: string }) {
  return (
    <span className={cn('inline-flex h-5 flex-none items-center gap-1.5 whitespace-nowrap rounded-chip text-[12px]', word[status], className)}>
      <span aria-hidden className={cn('flex-none rounded-full', dot[status])} />
      {TRANSFER_STATUS_LABEL[status]}
    </span>
  );
}

const cols =
  'grid items-center gap-x-6 grid-cols-[minmax(0,1.3fr)_170px_minmax(0,1.5fr)_150px_96px] ' +
  'max-[1099px]:gap-x-4 max-[1099px]:grid-cols-[minmax(0,1.3fr)_150px_minmax(0,1.3fr)_96px] ' +
  'max-[640px]:grid-cols-[minmax(0,1fr)_auto] max-[640px]:gap-x-3 max-[640px]:gap-y-1';
const t1 = 'block truncate text-[14px] leading-5 font-medium max-[640px]:whitespace-normal';
const t2 = 'block mt-[3px] truncate text-[13px] leading-[18px] text-muted max-[640px]:whitespace-normal';

const ACTION_LABEL: Record<TransferActionKind, string> = { send: 'Send', receive: 'Receive', open: 'Open', view: 'View' };

export interface TransferListProps {
  transfers: TransferRowData[];
  filter: TransferFilter;
  counts: Record<TransferFilter, number>;
  onFilterChange: (f: TransferFilter) => void;
  /** The row name and the action link both call this; `kind` says which link was used. */
  onOpen: (id: string, kind: TransferActionKind | 'name') => void;
  /** Shown only when the role may make a transfer. */
  onNew?: () => void;
  /** Disables nothing in the list; the loading skeleton is shown instead of rows. */
  loading?: boolean;
  className?: string;
}

const FILTERS: [TransferFilter, string][] = [
  ['all', 'All'],
  ['draft', 'Draft'],
  ['transit', 'In transit'],
  ['received', 'Received'],
  ['cancelled', 'Cancelled'],
];

function Head() {
  return (
    <div
      aria-hidden="true"
      className={cn(cols, '-mx-2 w-[calc(100%+16px)] border-b border-border px-2 pb-[10px] text-[12px] text-muted max-[640px]:hidden')}
    >
      <span>Transfer</span>
      <span>Status</span>
      <span>Items</span>
      <span className="max-[1099px]:hidden">When</span>
      <span />
    </div>
  );
}

function Skeleton() {
  return (
    <section aria-busy="true">
      <Head />
      <div className="[&>div:first-child]:border-t-transparent">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(cols, 'min-h-[72px] border-t border-rule py-[14px]')}>
            <span className="min-w-0"><span className="block h-4 w-3/5 rounded-[4px] bg-raised-2" /><span className="mt-1 block h-3 w-2/5 rounded-[4px] bg-raised-2" /></span>
            <span><span className="block h-[14px] w-[70px] rounded-[4px] bg-raised-2" /><span className="mt-1 block h-3 w-[90px] rounded-[4px] bg-raised-2" /></span>
            <span><span className="block h-[14px] w-[70%] rounded-[4px] bg-raised-2" /><span className="mt-1 block h-3 w-1/2 rounded-[4px] bg-raised-2" /></span>
            <span className="max-[1099px]:hidden"><span className="block h-[14px] w-[70px] rounded-[4px] bg-raised-2" /></span>
            <span />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Transfer list (I15): Transfer | Status | Items | When | action, filtered by status. Right-aligned Send, Receive, Open or View link per row. */
export function TransferList({ transfers, filter, counts, onFilterChange, onOpen, onNew, loading = false, className }: TransferListProps) {
  const rows = transfers.filter((t) => filter === 'all' || t.status === filter);
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div role="group" aria-label="Show" className="mt-3 inline-flex gap-0.5 self-start rounded-control bg-raised-2 p-0.5 max-[640px]:hidden">
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => onFilterChange(id)}
            className={cn(
              'h-8 whitespace-nowrap rounded-[4px] border border-transparent px-[14px] text-[13px] hover:text-text outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
              filter === id ? 'border-border bg-surface font-medium text-text' : 'text-muted',
            )}
          >
            {label}{' '}
            <span className={cn('ml-1 tabular-nums', filter === id ? 'font-medium text-text' : 'font-normal text-muted')}>{counts[id]}</span>
          </button>
        ))}
      </div>
      <div className="hidden max-[640px]:block">
        <span id="transfer-filter-l" className="text-[12px] text-muted">Show</span>
        <Select
          id="transfer-filter"
          aria-labelledby="transfer-filter-l"
          size="sm"
          className="w-full"
          value={filter}
          onValueChange={(v: string) => onFilterChange(v as TransferFilter)}
          options={[{ value: 'all', label: 'All transfers' }, ...FILTERS.slice(1).map(([value, label]) => ({ value, label }))].map((o) => ({ ...o, meta: String(counts[o.value as TransferFilter]) }))}
        />
      </div>
      {loading ? (
        <Skeleton />
      ) : rows.length === 0 ? (
        <div className="py-8">
          <p className="text-[16px] font-semibold">No transfer here</p>
          <p className="mt-1 max-w-[560px] text-[14px] leading-[21px] text-muted">
            {filter === 'all' ? 'No transfer has been made yet.' : `No ${TRANSFER_STATUS_LABEL[filter].toLowerCase()} transfer.`} A transfer is one document for stock going from one place to another.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {filter !== 'all' && <Button variant="secondary" onClick={() => onFilterChange('all')}>Show all transfers</Button>}
            {onNew && <Button variant="primary" onClick={onNew} leftIcon={Plus}>New transfer</Button>}
          </div>
        </div>
      ) : (
        <section aria-live="polite">
          <Head />
          <div className="[&>div:first-child]:border-t-transparent">
            {rows.map((t) => {
              const nm = `${t.id}, ${t.out ? 'to' : 'from'} ${t.otherName}`;
              return (
                <div
                  key={t.id}
                  data-trrow={t.id}
                  className={cn(cols, 'group/row min-h-[72px] cursor-pointer border-t border-rule py-[14px] hover:bg-raised max-[640px]:min-h-0 max-[640px]:py-4')}
                  onClick={() => onOpen(t.id, 'name')}
                >
                  <span className="min-w-0 max-[640px]:[grid-area:1/1]">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(t.id, 'name'); }} className={cn(t1, 'w-full cursor-pointer p-0 text-left text-text hover:text-lk-hover outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent')}>
                      <span className="font-mono text-[13px] font-semibold">{t.id}</span> {t.out ? 'to' : 'from'} {t.otherName}
                    </button>
                    <span className={t2}>
                      {t.out ? 'Out of' : 'Into'} {t.hereShort}
                      {t.job && <> · for <span className="font-mono text-[12px]">{t.job}</span></>}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-col items-start gap-[3px] max-[640px]:[grid-area:2/1] max-[640px]:flex-row max-[640px]:flex-wrap max-[640px]:items-center max-[640px]:gap-x-[10px] max-[640px]:gap-y-1">
                    <TransferStatusBadge status={t.status} />
                    <span className={cn(t2, 'mt-0 whitespace-normal')}>{t.statusNote}</span>
                  </span>
                  <span className="min-w-0 max-[640px]:[grid-area:3/1]">
                    <span className={t1}>{t.items}</span>
                    <span className={t2}>{t.itemNames}</span>
                  </span>
                  <span className="min-w-0 max-[1099px]:hidden">
                    <span className={t1}>{t.when}</span>
                    <span className={t2}>{t.who}</span>
                  </span>
                  <span className="flex min-w-0 justify-end text-right max-[640px]:[grid-area:1/2/4/2] max-[640px]:self-center">
                    <ActionLink caret aria-label={`${ACTION_LABEL[t.action]} ${nm}`} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onOpen(t.id, t.action); }} className="min-h-7 max-[640px]:min-h-11 max-[640px]:px-1">
                      {ACTION_LABEL[t.action]}
                    </ActionLink>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
