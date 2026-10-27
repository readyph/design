import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Prohibit, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { LedaMark } from './Leda';

/** One row of the palette. Rows are display-only (no buttons inside): the whole row is the option. */
export interface CommandPaletteItem {
  id: string;
  label: string;
  /** Phosphor icon (16px, muted; accent on the selected row). */
  icon?: PhosphorIcon;
  /** Any leading node instead of `icon`, e.g. `<PlatformLogo name="Books" size={16} />`. */
  leading?: ReactNode;
  /** Leda's mark as the leading icon (20px, 22px on a phone) for Leda rows. */
  leda?: boolean;
  /** A command Leda will refuse: carries the Prohibit icon. Still selectable (Leda explains why). */
  refused?: boolean;
  /** Right-hand meta text (12px muted), e.g. "Platform", "Go". */
  meta?: ReactNode;
  /** Extra words the type-ahead matches, e.g. `["system"]` on a Settings row. */
  keywords?: string[];
  /** Not selectable; skipped by the arrow keys. */
  disabled?: boolean;
  /** Keep the palette open after the row runs. */
  keepOpen?: boolean;
}

export interface CommandPaletteGroup {
  id: string;
  /** Group header (12px muted): "Ask Leda", "Tell Leda to do", "People", "Go to". */
  label: string;
  items: CommandPaletteItem[];
}

export interface CommandPaletteProps {
  /** Controlled open state. The consumer (usually next to `AskLedaBar`) owns it. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The page's groups, in order (Ask Leda, Tell Leda to do, page objects, Go to). Filtered by the typed text unless `filter={false}`. */
  groups: CommandPaletteGroup[];
  /** A row ran (the palette has already asked to close unless `item.keepOpen`). */
  onSelect: (item: CommandPaletteItem, group: CommandPaletteGroup) => void;
  /** With text: a first "Ask" group with `Ask Leda: "text"` and an Enter hint. Called with the trimmed text. Omit to hide the row. */
  onAsk?: (query: string) => void;
  /** Messages in the current Leda thread. With text empty and N > 0 a "Leda" group offers "Open your conversation with Leda (N messages)". */
  conversationMessages?: number;
  onOpenConversation?: () => void;
  /** Controlled input text. Pass `defaultQuery` for uncontrolled use (cleared each time the palette opens). */
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /**
   * Type-ahead. Default: every typed word must appear in the label, keywords or meta (case-insensitive).
   * A function replaces it; `false` shows the groups as given (the consumer filters or searches remotely).
   */
  filter?: false | ((item: CommandPaletteItem, query: string) => boolean);
  /** Shows a "Searching…" status (and Leda's Aurora in the input row) while the consumer fetches results. */
  loading?: boolean;
  placeholder?: string;
  /** Text when nothing matches and there is no Ask row. Default: `No match for "text"`. */
  emptyLabel?: ReactNode;
  /** Accessible name of the dialog. Default "Ask Leda". */
  'aria-label'?: string;
  /** Element that takes focus back when the palette closes. Default: whatever had focus when it opened. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
}

const ASK_ID = '__ask';
const CONVO_ID = '__convo';

const norm = (s: string) => s.toLocaleLowerCase();

function defaultFilter(item: CommandPaletteItem, query: string) {
  const hay = norm([item.label, ...(item.keywords ?? []), typeof item.meta === 'string' ? item.meta : ''].join(' '));
  return norm(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

interface Row {
  group: CommandPaletteGroup;
  item: CommandPaletteItem;
  domId: string;
}

/**
 * Command palette (C7): scrim, a 640px translucent panel 72px from the top, a 48px input row with Leda's mark and a
 * grouped listbox. NEW (not the reverted RDY-176/199 `CommandPalette`).
 *
 * Shortcuts: this component registers NO global keys. `AskLedaBar` owns Cmd/Ctrl+K and "/" (one bar per page, its
 * `shortcuts` prop, ON for ONE bar per page) and calls `onOpen(source)`; the page sets `open` here (Cmd/Ctrl+K TOGGLES, so
 * `setOpen((o) => (src === 'shortcut' ? !o : true))`) and passes `paused={open}` to the bar (paused only stops the shine; the
 * bar's keys keep firing, which is what lets Cmd+K close the palette). Inside the
 * palette: arrows move, Enter runs, Esc closes (first press, text and all), Tab stays inside.
 *
 * ARIA: a Radix dialog (focus trap, portal, `aria-modal`) holding a combobox input (`aria-activedescendant`) that
 * controls a listbox of option rows grouped by `role="group"`. Options hold no interactive children.
 */
export function CommandPalette({
  open,
  onOpenChange,
  groups,
  onSelect,
  onAsk,
  conversationMessages = 0,
  onOpenConversation,
  query: controlled,
  defaultQuery = '',
  onQueryChange,
  filter,
  loading = false,
  placeholder = 'Ask Leda or tell it what to do',
  emptyLabel,
  'aria-label': ariaLabel = 'Ask Leda',
  returnFocusRef,
  className,
}: CommandPaletteProps) {
  const uid = useId().replace(/:/g, '');
  const [inner, setInner] = useState(defaultQuery);
  const isControlled = controlled !== undefined;
  const query = isControlled ? controlled : inner;
  const setQuery = (q: string) => {
    if (!isControlled) setInner(q);
    onQueryChange?.(q);
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const viaKeys = useRef(false);
  const composing = useRef(false);

  // Uncontrolled text starts empty (or at defaultQuery) each time the palette opens. Derived during render (not in an
  // effect) so the first paint after opening is already clean and keys typed right away are never appended to old text.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && !isControlled) setInner(defaultQuery);
  }

  const text = query.trim();

  /** Final groups: Leda conversation / Ask (system), then the page's groups filtered. */
  const shown = useMemo<CommandPaletteGroup[]>(() => {
    const out: CommandPaletteGroup[] = [];
    if (text && onAsk) {
      out.push({ id: ASK_ID, label: 'Ask', items: [{ id: ASK_ID, label: `Ask Leda: “${text}”`, leda: true, meta: '↵' }] });
    }
    if (!text && conversationMessages > 0 && onOpenConversation) {
      out.push({
        id: CONVO_ID,
        label: 'Leda',
        items: [{ id: CONVO_ID, label: `Open your conversation with Leda (${conversationMessages} ${conversationMessages === 1 ? 'message' : 'messages'})`, leda: true }],
      });
    }
    const fn = filter === false ? null : filter ?? defaultFilter;
    for (const g of groups) {
      const items = fn && text ? g.items.filter((i) => fn(i, text)) : g.items;
      if (items.length) out.push({ ...g, items });
    }
    return out;
  }, [groups, text, onAsk, conversationMessages, onOpenConversation, filter]);

  const rows = useMemo<Row[]>(
    () => shown.flatMap((group) => group.items.map((item) => ({ group, item, domId: `${uid}-o-${group.id}-${item.id}` }))),
    [shown, uid],
  );
  const selectable = useMemo(() => rows.filter((r) => !r.item.disabled), [rows]);

  const [activeDom, setActiveDom] = useState<string | null>(null);
  const active = selectable.find((r) => r.domId === activeDom) ?? selectable[0] ?? null;

  // A new query starts at the first row.
  useEffect(() => { setActiveDom(null); }, [text, open]);

  // Keep the keyboard-selected row in view (no smooth scrolling, so reduced motion needs nothing).
  useEffect(() => {
    if (!viaKeys.current || !active) return;
    viaKeys.current = false;
    document.getElementById(active.domId)?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  const run = useCallback(
    (row: Row | null) => {
      if (!row || row.item.disabled) return;
      if (!row.item.keepOpen) onOpenChange(false);
      if (row.item.id === ASK_ID && row.group.id === ASK_ID) onAsk?.(text);
      else if (row.item.id === CONVO_ID && row.group.id === CONVO_ID) onOpenConversation?.();
      else onSelect(row.item, row.group);
    },
    [onAsk, onOpenChange, onOpenConversation, onSelect, text],
  );

  const move = (dir: 1 | -1) => {
    if (!selectable.length) return;
    const i = active ? selectable.indexOf(active) : -1;
    const next = selectable[(i + dir + selectable.length) % selectable.length];
    viaKeys.current = true;
    setActiveDom(next.domId);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // IME: keys that confirm or navigate a composition must not move or run a row.
    if (composing.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); run(active); }
  };

  const listId = `${uid}-list`;
  const count = rows.length;
  const hasList = count > 0;
  const status = loading ? 'Searching…' : hasList ? `${count} ${count === 1 ? 'result' : 'results'}` : '';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-scrim" />
        <Dialog.Content
          aria-label={ariaLabel}
          aria-describedby={undefined}
          aria-modal="true"
          data-command-palette=""
          onOpenAutoFocus={(e) => {
            opener.current = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
            e.preventDefault();
            inputRef.current?.focus();
          }}
          onEscapeKeyDown={(e) => {
            // Esc during IME composition cancels the composition; it must not close the palette.
            if (composing.current || e.isComposing || e.keyCode === 229) e.preventDefault();
          }}
          onCloseAutoFocus={(e) => {
            // The page may point focus somewhere else by the time the palette closes (Leda's composer after an ask).
            const target = returnFocusRef?.current?.isConnected ? returnFocusRef.current : opener.current;
            if (target?.isConnected) {
              e.preventDefault();
              target.focus();
            }
          }}
          className={cn(
            'fixed left-1/2 top-[72px] z-50 flex max-h-[calc(100svh-88px)] w-[min(640px,calc(100vw-32px))] -translate-x-1/2 flex-col overflow-hidden rounded-sheet border border-border bg-overlay text-text shadow-float backdrop-blur-[20px] backdrop-saturate-[1.4] focus:outline-none',
            'max-sm:inset-0 max-sm:max-h-none max-sm:w-full max-sm:translate-x-0 max-sm:rounded-none max-sm:border-0',
            className,
          )}
        >
          <Dialog.Title className="sr-only">{ariaLabel}</Dialog.Title>
          <div className="flex h-[48px] shrink-0 items-center gap-2.5 border-b border-border px-3.5">
            <span aria-hidden className="grid shrink-0 place-items-center">
              <span className="max-sm:hidden"><LedaMark size={20} decorative effect="aurora" active={loading} /></span>
              <span className="hidden max-sm:block"><LedaMark size={22} decorative effect="aurora" active={loading} /></span>
            </span>
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-label={placeholder}
              aria-expanded={hasList}
              aria-controls={hasList ? listId : undefined}
              aria-activedescendant={hasList && active ? active.domId : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              value={query}
              placeholder={placeholder}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              onCompositionStart={() => { composing.current = true; }}
              onCompositionEnd={() => { composing.current = false; }}
              className="min-w-0 flex-1 border-0 bg-transparent text-[15px] leading-[20px] text-text outline-none placeholder:text-faint"
            />
            <kbd aria-hidden className="inline-block min-w-[18px] rounded-[3px] bg-frame-active px-1 text-center font-sans text-tiny text-text [@media(hover:none)]:hidden max-sm:hidden">esc</kbd>
          </div>

          {/* tabIndex=0 is kept on purpose: axe `scrollable-region-focusable` fails a scroller with no focusable content (options are display-only; the input drives them). */}
          <div tabIndex={0} className="min-h-0 flex-1 overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent forced-colors:outline-0 forced-colors:focus-visible:outline forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-[Highlight] overscroll-contain p-1.5 max-sm:max-h-none max-sm:flex-1 sm:max-h-[min(460px,60vh)]">
            {hasList && (
              <div id={listId} role="listbox" aria-label="Results" aria-busy={loading || undefined}>
                {shown.map((g) => (
                  <div key={g.id} role="group" aria-labelledby={`${uid}-g-${g.id}`}>
                    <div id={`${uid}-g-${g.id}`} className="px-2.5 pb-1 pt-2 text-[12px] leading-5 text-muted">{g.label}</div>
                    {g.items.map((item) => {
                      const domId = `${uid}-o-${g.id}-${item.id}`;
                      const selected = active?.domId === domId;
                      const Ico = item.refused ? Prohibit : item.icon;
                      return (
                        <div
                          key={item.id}
                          id={domId}
                          role="option"
                          aria-selected={selected}
                          aria-disabled={item.disabled || undefined}
                          onMouseMove={() => { if (!item.disabled && !selected) setActiveDom(domId); }}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => run({ group: g, item, domId })}
                          className={cn(
                            'flex w-full cursor-default items-center gap-2.5 rounded-control px-2.5 py-2 text-left text-[14px] leading-[20px] text-text max-sm:min-h-[44px]',
                            selected && 'bg-accent-tint',
                            item.disabled && 'opacity-50',
                          )}
                        >
                          <span aria-hidden className={cn('grid h-5 w-5 shrink-0 place-items-center', selected ? 'text-accent' : 'text-muted')}>
                            {item.leda ? (
                              <>
                                <span className="max-sm:hidden"><LedaMark size={20} decorative /></span>
                                <span className="hidden max-sm:block"><LedaMark size={22} decorative /></span>
                              </>
                            ) : item.leading ? (
                              item.leading
                            ) : Ico ? (
                              <Ico size={16} />
                            ) : null}
                          </span>
                          <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{item.label}</span>
                          {item.meta != null && <span className="ml-auto shrink-0 whitespace-nowrap pl-2 text-[12px] leading-[16px] text-muted">{item.meta}</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
            {!hasList && !loading && (
              <p className="px-2.5 py-6 text-center text-small text-muted">{emptyLabel ?? (text ? `No match for “${text}”` : 'Nothing to show')}</p>
            )}
            {!hasList && loading && <p className="px-2.5 py-6 text-center text-small text-muted">Searching{'…'}</p>}
          </div>
          <div role="status" aria-live="polite" className="sr-only">{status}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
