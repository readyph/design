import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';

export interface SegmentOption {
  value: string;
  label: ReactNode;
  /** Optional leading icon component (for example a Phosphor icon). Decorative. */
  icon?: PhosphorIcon;
  /** Optional count shown after the label (Memory filters: All 12, On 8). */
  count?: number;
  disabled?: boolean;
}

/**
 * How the control is exposed to assistive tech:
 * - `pressed` (default): a group of toggle buttons with `aria-pressed`. Every segment is a tab stop.
 * - `radio`: a `radiogroup` with `aria-checked` and one tab stop (roving tabindex, arrow keys, Home/End).
 * - `menu`: for use inside a menu (theme row): `menuitemradio` with `aria-checked`; the menu owns arrow keys.
 */
export type SegmentedSemantics = 'pressed' | 'radio' | 'menu';

export interface SegmentedControlProps {
  options: SegmentOption[];
  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value (defaults to the first enabled option). */
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** `md` is the 28px segment; `sm` is a 24px segment for dense bars. */
  size?: 'sm' | 'md';
  semantics?: SegmentedSemantics;
  /** Disable every segment. */
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/** Segmented control (C39): raised-2 track, 2px padding, 5px radius; 28px segments, 13px text. */
export function SegmentedControl({
  options,
  value,
  defaultValue,
  onChange,
  size = 'md',
  semantics = 'pressed',
  disabled = false,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SegmentedControlProps) {
  const [internal, setInternal] = useState(defaultValue ?? options.find((o) => !o.disabled)?.value);
  const current = value ?? internal;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const off = (o: SegmentOption) => disabled || !!o.disabled;

  const select = (v: string) => {
    if (value === undefined) setInternal(v);
    if (v !== current) onChange?.(v);
  };

  // Roving tabindex: the checked segment, else the first enabled one, is the tab stop.
  const tabStop = options.some((o) => o.value === current && !off(o)) ? current : options.find((o) => !off(o))?.value;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (semantics !== 'radio') return;
    const n = options.length;
    let dir = 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') dir = 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') dir = -1;
    else if (e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    let next = index;
    if (dir === 0) {
      next = e.key === 'Home' ? 0 : n - 1;
      const step = e.key === 'Home' ? 1 : -1;
      while (options[next] && off(options[next])) next += step;
    } else {
      for (let i = 1; i <= n; i++) {
        const c = (index + dir * i + n * i) % n;
        if (!off(options[c])) {
          next = c;
          break;
        }
      }
    }
    if (next < 0 || next >= n || off(options[next])) return;
    refs.current[next]?.focus();
    select(options[next].value);
  };

  const groupRole = semantics === 'radio' ? 'radiogroup' : 'group';
  const itemRole = semantics === 'radio' ? 'radio' : semantics === 'menu' ? 'menuitemradio' : undefined;

  return (
    <div
      role={groupRole}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cn('inline-flex items-center gap-0.5 rounded-control bg-raised-2 p-0.5', className)}
    >
      {options.map((o, i) => {
        const active = o.value === current;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role={itemRole}
            {...(itemRole ? { 'aria-checked': active } : { 'aria-pressed': active })}
            tabIndex={semantics === 'radio' ? (o.value === tabStop ? 0 : -1) : undefined}
            disabled={off(o)}
            onClick={() => select(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-chip border px-3 text-ui transition-colors',
              size === 'sm' ? 'h-6' : 'h-7',
              semantics === 'menu' && 'max-sm:h-9',
              active ? 'border-border bg-surface font-medium text-text' : 'border-transparent text-muted hover:text-text',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-muted',
              active && 'disabled:hover:text-text',
              focusRing,
            )}
          >
            {Icon && <Icon size={16} aria-hidden />}
            {o.label}
            {o.count !== undefined && (
              <span className={cn('text-small tabular-nums', active ? 'text-muted' : 'text-faint')}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
