import { useState, type ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';

export interface SegmentOption {
  value: string;
  label: ReactNode;
  icon?: PhosphorIcon;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value (defaults to the first option). */
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
}

/** A single-select pill group — for compact view/filter toggles. */
export function SegmentedControl({
  options,
  value,
  defaultValue,
  onChange,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps) {
  const [internal, setInternal] = useState(defaultValue ?? options[0]?.value);
  const current = value ?? internal;
  const select = (v: string) => {
    if (value === undefined) setInternal(v);
    onChange?.(v);
  };
  const h = size === 'sm' ? 'h-7 text-xs' : 'h-8 text-sm';
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('inline-flex items-center gap-0.5 rounded-lg bg-surface-muted p-1', className)}>
      {options.map((o) => {
        const active = o.value === current;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => select(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 font-medium transition-colors',
              h,
              active ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
              focusRing,
            )}
          >
            {o.icon && <Icon icon={o.icon} size="sm" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
