import type { ReactNode } from 'react';
import { Skeleton } from './Skeleton';
import { cn } from '../utils/cn';
import { PanelToggle } from './PanelToggle';

export interface SidePanelStat {
  id: string;
  count: number;
  label: string;
  /** The first stat is the loud one (filled chip). */
  accent?: boolean;
}

export interface SidePanelLayoutProps {
  /** The page's own content, left of the panel. */
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The panel's body. Receives the hide toggle to place on its own header row. */
  feed: (headerAction: ReactNode) => ReactNode;
  /** The counts shown on the collapsed rail; a click calls `onStatSelect` and opens the panel. */
  stats: SidePanelStat[];
  onStatSelect: (id: string) => void;
  /** Said in the show toggle's label, e.g. "3 need you". */
  hint?: string;
  /** An off-canvas detail covers the panel: it goes inert, and keeps its tab, scroll and collapsed state. */
  detailOpen?: boolean;
  loading?: boolean;
  /** Role-limited (mechanic): no feed, only the hide / show toggle. */
  limited?: boolean;
}

const ease = 'duration-200 ease-out motion-reduce:transition-none';
const inert = (on: boolean) => (on ? ({ inert: '' } as Record<string, string>) : {});

/**
 * SidePanelLayout: the right panel shared by Today and Services. A 400px column that collapses to a 48px rail with counts; the minus sits on the
 * header row of the body. Data-agnostic: the body (`feed`) and the rail counts (`stats`) are props.
 */
export function SidePanelLayout({
  children, open, onOpenChange, feed, stats, onStatSelect, hint, detailOpen = false, loading, limited,
}: SidePanelLayoutProps) {
  return (
    <div className={cn('grid h-full transition-[grid-template-columns]', ease, open ? 'grid-cols-[minmax(0,1fr)_400px]' : 'grid-cols-[minmax(0,1fr)_48px]')}>
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">{children}</div>
      {/* The panel stays mounted and keeps its state; the off-canvas covers it and makes it inert. Both layers cross-fade while the column animates. */}
      <aside aria-label="Updates" {...inert(detailOpen)} className="relative min-h-0 overflow-hidden border-l border-rule">
        <div aria-hidden={!open} {...inert(!open)} className={cn('absolute inset-y-0 right-0 flex w-[400px] flex-col transition-opacity', ease, open ? 'opacity-100' : 'pointer-events-none opacity-0')}>
          {(loading || limited) && (
            <div className="flex h-14 flex-none items-center justify-end px-4"><PanelToggle mode="hide" onClick={() => onOpenChange(false)} className="-mr-2" /></div>
          )}
          <div className="min-h-0 flex-1 overflow-auto">
            {loading ? <div className="space-y-3 p-4"><Skeleton variant="text" lines={3} /><Skeleton variant="rect" height={96} /></div>
              : limited ? null : feed(<PanelToggle mode="hide" onClick={() => onOpenChange(false)} className="-mr-2 flex-none" />)}
          </div>
        </div>
        <div aria-hidden={open} {...inert(open)} className={cn('absolute inset-y-0 left-0 flex w-12 flex-col items-center transition-opacity', ease, open ? 'pointer-events-none opacity-0' : 'opacity-100')}>
          <div className="flex h-14 w-full flex-none items-center justify-center">
            <PanelToggle mode="show" hint={hint} onClick={() => onOpenChange(true)} />
          </div>
          {!limited && !loading && (
            <div className="flex flex-col items-center gap-4">
              {stats.map((r) => (
                <button key={r.id} type="button" onClick={() => { onStatSelect(r.id); onOpenChange(true); }}
                  className="flex flex-col items-center gap-2 rounded-control px-1 py-1 text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                  <span className={cn('min-w-6 rounded-chip px-1.5 text-center text-[12px] font-semibold leading-5 tabular-nums', r.accent ? 'bg-accent text-accent-ink' : 'border border-control text-text')}>{r.count}</span>{' '}
                  <span className="text-muted [writing-mode:vertical-rl]">{r.label}</span>
                  <span className="sr-only">, show the list</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
