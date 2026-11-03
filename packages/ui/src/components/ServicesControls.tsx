import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export { SearchBox, type SearchBoxProps } from './sms/SearchBox';

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
