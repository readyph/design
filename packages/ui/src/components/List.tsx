import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { cn } from '../utils/cn';

/** Width of the LIST (its container, not the viewport) below which a row stacks. */
export type ListStackBelow = 600 | 760 | 880;

type Mode = 'list' | 'table';

interface ListContextValue {
  mode: Mode;
  stack: ListStackBelow;
  cursorId: string | null;
  moveCursor: (id: string) => void;
}
const ListContext = createContext<ListContextValue>({ mode: 'list', stack: 760, cursorId: null, moveCursor: () => {} });

/*
 * Every class below is written out in full so Tailwind can see it. `@max-[Npx]/list:` is a container query on
 * the nearest ancestor named "list" (the List root), so stacking follows the list's own width.
 */
const stackClasses: Record<ListStackBelow, { header: string; row: string; lead: string; actions: string; body: string; flush: string; hide: string; only: string }> = {
  600: {
    header: '@max-[600px]/list:hidden',
    row: '@max-[600px]/list:grid-cols-[minmax(0,1fr)_auto] @max-[600px]/list:gap-y-2',
    lead: '@max-[600px]/list:col-start-1 @max-[600px]/list:row-start-1',
    actions: '@max-[600px]/list:col-start-2 @max-[600px]/list:row-start-1',
    body: '@max-[600px]/list:col-span-full @max-[600px]/list:pl-11',
    flush: '@max-[600px]/list:col-span-full',
    hide: '@max-[600px]/list:hidden',
    only: 'hidden @max-[600px]/list:block',
  },
  760: {
    header: '@max-[760px]/list:hidden',
    row: '@max-[760px]/list:grid-cols-[minmax(0,1fr)_auto] @max-[760px]/list:gap-y-2',
    lead: '@max-[760px]/list:col-start-1 @max-[760px]/list:row-start-1',
    actions: '@max-[760px]/list:col-start-2 @max-[760px]/list:row-start-1',
    body: '@max-[760px]/list:col-span-full @max-[760px]/list:pl-11',
    flush: '@max-[760px]/list:col-span-full',
    hide: '@max-[760px]/list:hidden',
    only: 'hidden @max-[760px]/list:block',
  },
  880: {
    header: '@max-[880px]/list:hidden',
    row: '@max-[880px]/list:grid-cols-[minmax(0,1fr)_auto] @max-[880px]/list:gap-y-2',
    lead: '@max-[880px]/list:col-start-1 @max-[880px]/list:row-start-1',
    actions: '@max-[880px]/list:col-start-2 @max-[880px]/list:row-start-1',
    body: '@max-[880px]/list:col-span-full @max-[880px]/list:pl-11',
    flush: '@max-[880px]/list:col-span-full',
    hide: '@max-[880px]/list:hidden',
    only: 'hidden @max-[880px]/list:block',
  },
};

/**
 * The hover / cursor / flash surface of a ruled row, exported so any other ruled row (a future Table) gets the
 * same rule. The row bleeds 8px each side as a transparent border and the background is clipped to the padding
 * box, so the highlight, the rule and the cursor mark start and end exactly on the header's edge. A `background`
 * shorthand would reset the clip, so `bg-clip-padding` is restated on hover, current and flash.
 */
export const listRowSurface =
  'bg-clip-padding hover:bg-raised hover:bg-clip-padding data-[current=true]:bg-raised data-[current=true]:bg-clip-padding ' +
  'data-[current=true]:shadow-[inset_2px_0_0_var(--accent)] data-[flash=true]:bg-clip-padding';

const INTERACTIVE = 'button,a[href],input,select,textarea,summary,[role="button"],[role="menuitem"],[role="menu"],[role="switch"],[role="checkbox"],[role="combobox"]';
// Any contenteditable value except "false" is editable ("", "true", "plaintext-only").
const EDITABLE = 'input,textarea,select,[contenteditable]:not([contenteditable="false"])';

export interface ListCursorOptions {
  shortcuts?: boolean;
  cursorId?: string | null;
  defaultCursorId?: string | null;
  onCursorChange?: (id: string) => void;
}

/**
 * The j / k / Enter cursor over every `[data-row-id]` inside `rootRef`, in document order. `List` uses it for its
 * own rows; `ListGroups` uses it once for all of its groups, so j / k cross group titles without a stop.
 */
export function useListCursor(
  rootRef: { current: HTMLElement | null },
  { shortcuts = true, cursorId, defaultCursorId = null, onCursorChange }: ListCursorOptions,
) {
  const [inner, setInner] = useState<string | null>(defaultCursorId);
  const [announce, setAnnounce] = useState('');
  const controlled = cursorId !== undefined;
  const current = controlled ? cursorId : inner;
  const currentRef = useRef(current);
  currentRef.current = current;
  const onChangeRef = useRef(onCursorChange);
  onChangeRef.current = onCursorChange;

  const moveCursor = useCallback(
    (id: string) => {
      if (!controlled) setInner(id);
      onChangeRef.current?.(id);
    },
    [controlled],
  );

  useEffect(() => {
    if (!shortcuts) return;
    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current;
      if (!root || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target instanceof HTMLElement ? e.target : null;
      if (t) {
        if (t.closest(EDITABLE)) return;
        // Keys belong to an open dialog, menu or listbox unless this list lives inside that dialog.
        const layer = t.closest('[role="dialog"],[role="menu"],[role="listbox"]');
        if (layer && !layer.contains(root)) return;
      }
      const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-row-id]'));
      if (!rows.length) return;
      const ids = rows.map((r) => r.dataset.rowId as string);
      const at = currentRef.current == null ? -1 : ids.indexOf(currentRef.current);
      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        const next = e.key === 'j' ? Math.min(at + 1, ids.length - 1) : Math.max(at - 1, 0);
        moveCursor(ids[next]);
        rows[next].scrollIntoView?.({ block: 'nearest' });
        setAnnounce(`${rows[next].dataset.rowLabel || 'Row'} ${next + 1} of ${ids.length}`);
      } else if (e.key === 'Enter' && at >= 0) {
        // Enter on a focused button or link keeps its own meaning.
        if (t && t !== document.body && t.closest(INTERACTIVE)) return;
        if (t && t !== document.body && !root.contains(t)) return;
        e.preventDefault();
        rows[at].dispatchEvent(new CustomEvent('list-activate', { bubbles: false }));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shortcuts, moveCursor]);

  return { current, moveCursor, announce };
}

export interface ListProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** `list` (default): a plain list. `table`: row / columnheader / cell roles, for rows that line up under column headers. */
  as?: Mode;
  /** CSS `grid-template-columns` for the header and every row, e.g. `minmax(0,300fr) minmax(0,168fr) 112px`. Default: one column. */
  columns?: string;
  /** Stack the row (identity + actions on top, the rest underneath) when the list is narrower than this. Default 760. */
  stackBelow?: ListStackBelow;
  /** Cursor row (controlled). A row is current when its `rowId` equals this. */
  cursorId?: string | null;
  /** Start with this row as the cursor (uncontrolled). */
  defaultCursorId?: string | null;
  onCursorChange?: (id: string) => void;
  /** j / k move the cursor and Enter opens the cursor row, from anywhere on the page. Default true. With several Lists on one page, leave it on for the primary list only; Lists inside a `ListGroups` do not listen, the group does. */
  shortcuts?: boolean;
  children?: ReactNode;
}

/**
 * List rows (C18): a ruled list. Header row (12px muted labels, bottom rule) over rows with 16px top and bottom
 * padding, a 1px rule between rows, square corners, a value-column subgrid, and a j/k cursor. Only the row under
 * the pointer highlights. Below `stackBelow` px of the list's own width each row stacks. `className` goes on the
 * outer element (margins, width); the columns, container and rule live on the parts, so a caller class cannot break them.
 */
export const List = forwardRef<HTMLElement, ListProps>(function List(
  { as = 'list', columns = 'minmax(0,1fr)', stackBelow = 760, cursorId, defaultCursorId = null, onCursorChange, shortcuts = true, className, children, ...rest },
  ref,
) {
  const rootRef = useRef<HTMLElement | null>(null);
  const { current, moveCursor, announce } = useListCursor(rootRef, { shortcuts, cursorId, defaultCursorId, onCursorChange });

  const ctx = useMemo<ListContextValue>(() => ({ mode: as, stack: stackBelow, cursorId: current, moveCursor }), [as, stackBelow, current, moveCursor]);
  const Root = (as === 'table' ? 'div' : 'ul') as 'div';
  return (
    <ListContext.Provider value={ctx}>
      <Root
        ref={(el: HTMLElement | null) => {
          rootRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        role={as === 'table' ? 'table' : 'list'}
        style={{ '--list-cols': columns } as CSSProperties}
        className={cn('@container/list m-0 block list-none p-0', className)}
        {...rest}
      >
        {children}
      </Root>
      {shortcuts ? (
        <span role="status" aria-live="polite" className="sr-only">
          {announce}
        </span>
      ) : null}
    </ListContext.Provider>
  );
});

export interface ListHeaderProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

/** Column labels: 12px muted, one `control` rule under them. Hidden once the rows stack. Use `ListHeaderCell` for each label. */
export function ListHeader({ className, children, ...rest }: ListHeaderProps) {
  const { mode, stack } = useContext(ListContext);
  const base = cn('grid grid-cols-[var(--list-cols)] gap-x-4 border-b border-control pb-2 text-small text-muted', stackClasses[stack].header, className);
  if (mode === 'table') {
    return (
      <div role="row" className={base} {...rest}>
        {children}
      </div>
    );
  }
  // In a plain list the labels are decoration (the cells carry their own words); keep them out of the list's count.
  return (
    <li aria-hidden="true" className={base} {...rest}>
      {children}
    </li>
  );
}

export function ListHeaderCell({ className, children, ...rest }: HTMLAttributes<HTMLElement>) {
  const { mode } = useContext(ListContext);
  return (
    <span role={mode === 'table' ? 'columnheader' : undefined} className={cn('min-w-0 font-normal', className)} {...rest}>
      {children}
    </span>
  );
}

export interface ListRowProps extends Omit<HTMLAttributes<HTMLElement>, 'onClick'> {
  /** Names the row for j/k and `cursorId`. Needed for the cursor to find the row. */
  rowId?: string;
  /** Spoken when j/k lands here, e.g. the platform name. */
  label?: string;
  /** Opens the row: a click on the row (not on a button or link inside it) and Enter on the cursor row. Also gives the row a pointer. */
  onActivate?: () => void;
  /** Mark as the cursor row regardless of the list's cursor. */
  current?: boolean;
  /** One 1.6s accent-tint flash, for a deep link landing on this row. Skipped under reduced motion. */
  flash?: boolean;
  /** Muted text, for suspended or inactive rows. */
  dimmed?: boolean;
  children?: ReactNode;
}

/** One ruled row. The primary action inside it should be a real button or link; the row click and Enter are shortcuts for it. */
export const ListRow = forwardRef<HTMLElement, ListRowProps>(function ListRow(
  { rowId, label, onActivate, current, flash = false, dimmed = false, className, children, ...rest },
  ref,
) {
  const { mode, stack, cursorId, moveCursor } = useContext(ListContext);
  const isCurrent = current ?? (rowId != null && cursorId === rowId);
  const innerRef = useRef<HTMLElement | null>(null);
  const activateRef = useRef(onActivate);
  activateRef.current = onActivate;

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const h = () => activateRef.current?.();
    el.addEventListener('list-activate', h);
    return () => el.removeEventListener('list-activate', h);
  }, []);

  const onClick = (e: ReactMouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
    if (rowId != null) moveCursor(rowId);
    activateRef.current?.();
  };
  const cls = cn(
    'relative -mx-2 grid grid-cols-[var(--list-cols)] items-start gap-x-4 border-x-8 border-transparent px-0 py-row-y',
    "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-rule after:content-['']",
    'transition-colors duration-hover motion-reduce:transition-none',
    listRowSurface,
    flash && 'motion-safe:animate-row-flash',
    onActivate && 'cursor-pointer',
    dimmed ? 'text-muted' : 'text-text',
    stackClasses[stack].row,
    className,
  );
  const common = {
    ref: (el: HTMLElement | null) => {
      innerRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    'data-row-id': rowId,
    'data-row-label': label,
    'data-current': isCurrent ? 'true' : undefined,
    'data-flash': flash ? 'true' : undefined,
    'aria-current': isCurrent ? ('true' as const) : undefined,
    className: cls,
    onClick: onActivate || rowId != null ? onClick : undefined,
    ...rest,
  };
  return mode === 'table' ? (
    <div role="row" {...(common as HTMLAttributes<HTMLDivElement>)}>
      {children}
    </div>
  ) : (
    <li {...(common as HTMLAttributes<HTMLLIElement>)}>{children}</li>
  );
});

export type ListCellKind = 'lead' | 'body' | 'actions';

export interface ListCellProps extends HTMLAttributes<HTMLElement> {
  /**
   * Where the cell goes once the row stacks. `lead` (identity) top left, `actions` top right, `body` (default) full
   * width underneath, indented 44px to sit under the name (32px logo + 12px gap). Wide rows ignore this.
   */
  kind?: ListCellKind;
  /** Wide: always show. `hide`: hide when stacked. `only`: show only when stacked (e.g. role chips instead of platform columns). */
  whenStacked?: 'hide' | 'only';
  /** Drop the 44px stacked indent. */
  flush?: boolean;
  /** Right-align (value columns). */
  end?: boolean;
  children?: ReactNode;
}

/** One cell of a row. Long unbreakable values wrap inside the cell instead of widening the row. */
export const ListCell = forwardRef<HTMLDivElement, ListCellProps>(function ListCell(
  { kind = 'body', whenStacked, flush = false, end = false, className, children, ...rest },
  ref,
) {
  const { mode, stack } = useContext(ListContext);
  const s = stackClasses[stack];
  return (
    <div
      ref={ref}
      role={mode === 'table' ? 'cell' : undefined}
      className={cn(
        'min-w-0 [overflow-wrap:anywhere]',
        kind === 'lead' && s.lead,
        kind === 'actions' && cn(s.actions, 'flex items-center justify-end gap-0.5'),
        kind === 'body' && !flush && s.body,
        kind === 'body' && flush && s.flush,
        end && 'text-right',
        whenStacked === 'hide' && s.hide,
        whenStacked === 'only' && s.only,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

/**
 * Value columns. The label column and the value column are shared by every metric in the list through a CSS
 * subgrid, so the values line up and right-align, tabular, whatever the label lengths.
 */
export function ListMetrics({ className, children, ...rest }: HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn('m-0 grid list-none grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 p-0', className)} {...rest}>
      {children}
    </ul>
  );
}

export interface ListMetricProps extends Omit<HTMLAttributes<HTMLLIElement>, 'children'> {
  label: ReactNode;
  value: ReactNode;
}

export function ListMetric({ label, value, className, ...rest }: ListMetricProps) {
  return (
    <li className={cn('col-span-full grid grid-cols-subgrid items-baseline text-ui', className)} {...rest}>
      <span className="min-w-0 text-muted">{label}</span>
      <span className="text-right font-medium tabular-nums">{value}</span>
    </li>
  );
}
