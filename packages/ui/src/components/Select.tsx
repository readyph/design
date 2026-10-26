import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';
import { cn } from '../utils/cn';

export interface SelectOption {
  value: string;
  label: ReactNode;
  /** Plain-text label used for type-ahead; defaults to `label` when it is a string. */
  textValue?: string;
  disabled?: boolean;
  /** Leading icon or platform logo, shown in the list and on the button when selected. */
  icon?: ReactNode;
  /** Right-aligned 12px muted text. */
  meta?: ReactNode;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** `sm` is 34px (44px on phone); default is 40px (44px on phone). */
  size?: 'sm' | 'md';
  invalid?: boolean;
  disabled?: boolean;
  /** Long labels wrap inside the button instead of being cut off (the button grows to fit; Try it, C30). The list always wraps. */
  wrap?: boolean;
  /** Name for the hidden input that carries the value in a form. */
  name?: string;
  id?: string;
  className?: string;
  /** Leading icon or logo on the button when nothing is selected. */
  icon?: ReactNode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

const LISTBOX_MAX = 264;
const TYPEAHEAD_MS = 600;

function textOf(o: SelectOption): string {
  return (o.textValue ?? (typeof o.label === 'string' ? o.label : o.value)).toLowerCase();
}

/**
 * Custom single-select listbox (replaces every native select).
 * Keys: arrows, Home/End, PageUp/PageDown, type-ahead, Enter/Space choose,
 * Esc closes and returns focus, Tab chooses and moves on.
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    options,
    value,
    defaultValue,
    onValueChange,
    placeholder = 'Select',
    size = 'md',
    invalid,
    disabled,
    wrap = false,
    name,
    id,
    className,
    icon,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
  },
  ref,
) {
  const uid = useId();
  const listId = `${uid}-list`;
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? '');
  const current = controlled ? value : inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [up, setUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const buffer = useRef({ text: '', at: 0 });

  const selected = useMemo(() => options.find((o) => o.value === current), [options, current]);
  const enabled = useCallback((i: number) => i >= 0 && i < options.length && !options[i].disabled, [options]);

  const hidden = useRef<HTMLInputElement>(null);
  const lastValue = useRef(current);
  // Fire a bubbling `change` on the hidden input when the value changes, so form listeners hear it.
  useEffect(() => {
    if (lastValue.current === current) return;
    lastValue.current = current;
    const el = hidden.current;
    if (!el) return;
    el.value = current;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, [current]);

  const setRef = (node: HTMLButtonElement | null) => {
    btn.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const choose = (v: string) => {
    if (!controlled) setInner(v);
    if (v !== current) onValueChange?.(v);
  };

  const openList = () => {
    if (disabled) return;
    const i = options.findIndex((o) => o.value === current && !o.disabled);
    setActive(i >= 0 ? i : options.findIndex((o) => !o.disabled));
    setOpen(true);
  };
  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) btn.current?.focus();
  };

  // Open upward when there is no room below.
  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const need = Math.min(LISTBOX_MAX, options.length * 32 + 8) + 8;
    setUp(window.innerHeight - r.bottom < need && r.top > window.innerHeight - r.bottom);
  }, [open, options.length]);

  // Keep the active option in view.
  useEffect(() => {
    if (!open || active < 0) return;
    list.current?.children[active]?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active]);

  // Outside click closes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const move = (from: number, step: number) => {
    let i = from;
    do {
      i += step;
    } while (i >= 0 && i < options.length && !enabled(i));
    return enabled(i) ? i : from;
  };
  const edge = (end: boolean) => {
    const idx = options.map((_, i) => i).filter(enabled);
    return idx.length ? (end ? idx[idx.length - 1] : idx[0]) : -1;
  };

  // Jump up to 7 enabled options; stop at the first/last enabled one when fewer remain.
  const page = (dir: 1 | -1) => {
    let i = active;
    for (let n = 0; n < 7; n++) {
      const next = move(i, dir);
      if (next === i) break;
      i = next;
    }
    return i;
  };

  const typeAhead = (ch: string) => {
    const now = Date.now();
    const b = buffer.current;
    b.text = now - b.at > TYPEAHEAD_MS ? ch : b.text + ch;
    b.at = now;
    const t = b.text.toLowerCase();
    const start = b.text.length === 1 ? active + 1 : Math.max(active, 0);
    for (let n = 0; n < options.length; n++) {
      const i = (start + n) % options.length;
      if (enabled(i) && textOf(options[i]).startsWith(t)) {
        if (open) setActive(i);
        else choose(options[i].value);
        return;
      }
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const k = e.key;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(k)) {
        e.preventDefault();
        openList();
      } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeAhead(k);
      return;
    }
    switch (k) {
      case 'ArrowDown': e.preventDefault(); setActive(move(active, 1)); break;
      case 'ArrowUp': e.preventDefault(); setActive(move(active, -1)); break;
      case 'Home': e.preventDefault(); setActive(edge(false)); break;
      case 'End': e.preventDefault(); setActive(edge(true)); break;
      case 'PageDown': e.preventDefault(); setActive(page(1)); break;
      case 'PageUp': e.preventDefault(); setActive(page(-1)); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (enabled(active)) choose(options[active].value);
        close(true);
        break;
      case 'Escape': e.preventDefault(); close(true); break;
      case 'Tab':
        if (enabled(active)) choose(options[active].value);
        setOpen(false);
        break;
      default:
        if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          typeAhead(k);
        }
    }
  };

  const lead = selected?.icon ?? icon;

  return (
    <div ref={root} className={cn('relative w-full', className)}>
      <button
        ref={setRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${uid}-o${active}` : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          'flex w-full items-center gap-2 rounded-control border bg-surface px-3 text-left text-body text-text transition-colors',
          'hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          'disabled:cursor-not-allowed disabled:bg-raised disabled:text-faint',
          wrap
            ? cn('py-2', size === 'sm' ? 'min-h-[var(--ctl-dropdown-sm)]' : 'min-h-[var(--ctl-dropdown)]')
            : size === 'sm' ? 'h-[var(--ctl-dropdown-sm)]' : 'h-[var(--ctl-dropdown)]',
          invalid ? 'border-bad' : 'border-control',
        )}
      >
        {lead ? <span className="inline-flex shrink-0 items-center text-muted">{lead}</span> : null}
        <span className={cn('min-w-0 flex-1', wrap ? '[overflow-wrap:anywhere]' : 'truncate', !selected && 'text-muted')}>
          {selected ? selected.label : placeholder}
        </span>
        <CaretDown
          size={14}
          aria-hidden
          className={cn('shrink-0 text-muted transition-transform duration-150 motion-reduce:transition-none', open && 'rotate-180')}
        />
      </button>
      {name ? <input ref={hidden} type="hidden" name={name} value={current} readOnly /> : null}
      {open ? (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={ariaLabelledBy}
          aria-label={ariaLabelledBy ? undefined : ariaLabel}
          className={cn(
            'absolute left-0 z-50 max-h-[264px] w-max min-w-full max-w-[max(100%,min(32rem,calc(100vw-2rem)))] overflow-y-auto rounded-card border border-border bg-surface p-1 shadow-float',
            up ? 'bottom-full mb-1' : 'top-full mt-1',
          )}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${uid}-o${i}`}
              role="option"
              aria-selected={o.value === current}
              aria-disabled={o.disabled || undefined}
              onMouseEnter={() => enabled(i) && setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (o.disabled) return;
                choose(o.value);
                close(true);
              }}
              className={cn(
                'flex min-h-8 cursor-pointer items-center gap-2 rounded-chip px-2 text-body text-text max-sm:min-h-10',
                i === active && 'bg-frame-hover',
                o.disabled && 'cursor-not-allowed text-faint',
              )}
            >
              {o.icon ? <span className="inline-flex shrink-0 items-center text-muted">{o.icon}</span> : null}
              <span className="min-w-0 flex-1 py-1 [overflow-wrap:anywhere]">{o.label}</span>
              {o.meta ? <span className="shrink-0 text-small text-muted">{o.meta}</span> : null}
              <span className="inline-flex w-4 shrink-0 justify-center text-accent">
                {o.value === current ? <Check size={14} weight="bold" aria-hidden /> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});
