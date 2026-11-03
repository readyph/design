import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { cn } from '../utils/cn';

export interface ComboOption { id: string; /** Plain text, read by screen readers. */ label: string; node: ReactNode }
export interface ComboAction { id: string; label: string; node: ReactNode; onSelect: () => void }

export interface ComboboxProps {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: ComboOption[];
  onSelect: (id: string) => void;
  /** A persistent last row ("+ Add new customer"). Always shown at the bottom of the list. */
  action?: ComboAction | null;
  placeholder?: string;
  /** One line under the field. The line is always reserved, so the list opening or closing never moves what is below. */
  hint?: ReactNode;
  /** Small heading above the options (for example "Recent customers"). */
  heading?: string;
  emptyText?: string;
  /** The list stays closed until this many characters are typed. */
  minChars?: number;
  autoFocus?: boolean;
  className?: string;
  /** Leading magnifier, and the 40px library control height (`--ctl-dropdown`; 44px on a phone). */
  search?: boolean;
  /** The label stays for screen readers only (the row already names the field). */
  hideLabel?: boolean;
}

interface Pos { left: number; width: number; top?: number; bottom?: number; max: number }

/**
 * Studio-only Combobox (NEW): a text input with a floating suggestion list (WAI-ARIA combobox, list autocomplete).
 * The list is an overlay in a portal anchored under the input (flips above when there is no room), so nothing below the field moves.
 * Arrows move, Enter picks, Esc closes (and is not passed on, so an open off-canvas stays open), Tab closes. Enter never submits the surrounding form.
 * An optional `action` row is pinned last. Focus stays in the input; the active row is announced with aria-activedescendant.
 */
export function Combobox({ label, value, onValueChange, options, onSelect, action, placeholder, hint, heading, emptyText = 'No match.', minChars = 0, autoFocus, className, search, hideLabel }: ComboboxProps) {
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<Pos | null>(null);
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const n = options.length + (action ? 1 : 0);
  const show = open && value.trim().length >= minChars;
  const optId = (i: number) => `${uid}-o${i}`;

  useLayoutEffect(() => {
    if (!show) return;
    const place = () => {
      const el = inputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const up = below < 220 && above > below;
      setPos({ left: r.left, width: r.width, top: up ? undefined : r.bottom + 4, bottom: up ? window.innerHeight - r.top + 4 : undefined, max: Math.max(160, Math.min(340, up ? above : below)) });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [show]);

  // Root cause of the "list will not scroll" bug: the list is portalled to <body>, outside the Radix Dialog, and the dialog's scroll lock (react-remove-scroll)
  // cancels wheel / touchmove events that start outside the dialog content. Stop them at the list so the lock never sees them; the list then scrolls natively.
  useEffect(() => {
    if (!scroller) return;
    const stop = (e: Event) => e.stopPropagation();
    scroller.addEventListener('wheel', stop, { passive: true });
    scroller.addEventListener('touchmove', stop, { passive: true });
    return () => { scroller.removeEventListener('wheel', stop); scroller.removeEventListener('touchmove', stop); };
  }, [scroller]);

  useEffect(() => { setActive(0); }, [value, n]);
  useEffect(() => { if (show) document.getElementById(optId(active))?.scrollIntoView({ block: 'nearest' }); }, [active, show]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (i: number) => {
    setOpen(false);
    if (i < options.length) onSelect(options[i]!.id);
    else action?.onSelect();
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!show) setOpen(true); else if (n) setActive((a) => (a + 1) % n); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (!show) setOpen(true); else if (n) setActive((a) => (a - 1 + n) % n); }
    else if (e.key === 'Enter') { e.preventDefault(); if (show && n) pick(Math.min(active, n - 1)); }
    else if (e.key === 'Escape') { if (show) { e.preventDefault(); e.stopPropagation(); setOpen(false); } }
    else if (e.key === 'Tab') setOpen(false);
  };
  const row = 'flex w-full min-h-11 items-center gap-2 px-3 py-1.5 text-left text-[13px] min-[641px]:min-h-10';

  return (
    <div className={className}>
      <label htmlFor={`${uid}-in`} className={hideLabel ? 'sr-only' : 'mb-1 block text-ui font-medium text-text'}>{label}</label>
      <div className={cn(search && 'relative')}>
      {search && <MagnifyingGlass size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />}
      <input
        ref={inputRef} id={`${uid}-in`} type="text" role="combobox" autoComplete="off" autoFocus={autoFocus} value={value} placeholder={placeholder}
        aria-expanded={show} aria-controls={`${uid}-list`} aria-autocomplete="list" aria-activedescendant={show && n ? optId(Math.min(active, n - 1)) : undefined}
        onChange={(e) => { onValueChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={onKeyDown}
        className={cn('w-full rounded-control border border-control bg-surface text-text placeholder:text-muted focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent', search ? 'h-[var(--ctl-dropdown)] pl-9 pr-3 text-body' : 'h-9 px-3 text-ui max-[640px]:h-11')}
      />
      </div>
      {(hint || !hideLabel) && <p className="mt-1 min-h-5 text-[13px] leading-5 text-muted">{hint}</p>}
      {show && pos && createPortal(
        <div
          id={`${uid}-list`} role="listbox" aria-label={label} onMouseDown={(e) => e.preventDefault()}
          style={{ position: 'fixed', pointerEvents: 'auto', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.max }}
          className="z-[200] flex flex-col overflow-hidden rounded-control border border-control bg-surface shadow-float"
        >
          <div ref={setScroller} role="presentation" data-combo-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {heading && options.length > 0 && <p role="presentation" className="px-3 pb-1 pt-2 text-[12px] font-medium uppercase tracking-wide text-muted">{heading}</p>}
            {options.map((o, i) => (
              <div key={o.id} id={optId(i)} role="option" aria-selected={i === active} aria-label={o.label} onMouseEnter={() => setActive(i)} onClick={() => pick(i)} className={cn(row, 'cursor-pointer border-b border-rule last:border-b-0', i === active && 'bg-raised')}>{o.node}</div>
            ))}
            {options.length === 0 && <p role="presentation" className="px-3 py-3 text-[13px] text-muted">{emptyText}</p>}
          </div>
          {action && (
            <div id={optId(options.length)} role="option" aria-selected={active === options.length} aria-label={action.label} onMouseEnter={() => setActive(options.length)} onClick={() => pick(options.length)} className={cn(row, 'flex-none cursor-pointer border-t border-control font-medium text-accent', active === options.length && 'bg-raised')}>{action.node}</div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
