import { forwardRef, type ReactNode } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { cn } from '../../../index';

export interface SearchBoxProps { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; autoFocus?: boolean; label?: string }

/** Studio-only SearchBox (NEW): one field for plate, service number, customer or phone. Clear button inside; Esc clears. Same 34px control height as Select (44px on a phone). */
export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(function SearchBox({ value, onChange, placeholder = 'Search plate, service no., customer or phone', className, label = 'Search services' }, ref) {
  return (
    <div role="search" className={cn('flex h-[34px] min-w-0 items-center gap-2 rounded-control border border-control bg-surface px-2.5 focus-within:border-accent focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent max-[640px]:h-11', className)}>
      <MagnifyingGlass size={16} aria-hidden className="flex-none text-muted" />
      <input
        ref={ref} type="search" value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape' && value) { e.stopPropagation(); onChange(''); } }}
        aria-label={label} placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[14px] text-text outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {value && <button type="button" aria-label="Clear search" onClick={() => onChange('')} className="inline-flex size-6 flex-none items-center justify-center rounded-chip text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><X size={14} aria-hidden /></button>}
    </div>
  );
});

/** Studio-only ToggleChip (NEW): an on/off filter as a pressed button, text-labelled (never colour alone). */
export function ToggleChip({ pressed, onChange, children, className }: { pressed: boolean; onChange: (on: boolean) => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button" aria-pressed={pressed} onClick={() => onChange(!pressed)}
      className={cn('inline-flex h-[34px] flex-none items-center gap-1.5 whitespace-nowrap rounded-control border px-3 text-[13px] transition-colors duration-150 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:h-11',
        pressed ? 'border-accent bg-accent-tint font-medium text-text' : 'border-control bg-surface text-text hover:bg-raised', className)}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', pressed ? 'bg-accent' : 'bg-faint')} />{children}
    </button>
  );
}
