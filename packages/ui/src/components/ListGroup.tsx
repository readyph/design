import {
  Children,
  createContext,
  forwardRef,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { CaretRight } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { List, ListHeader, useListCursor, type ListStackBelow } from './List';

type Mode = 'list' | 'table';

interface GroupsContextValue {
  mode: Mode;
  columns?: string;
  stackBelow: ListStackBelow;
  header: ReactNode;
  cursorId: string | null;
  moveCursor: (id: string) => void;
}
const GroupsContext = createContext<GroupsContextValue | null>(null);

/* Written out in full so Tailwind sees them: the visual column header hides once the rows stack. */
const headerHidden: Record<ListStackBelow, string> = {
  600: '@max-[600px]/list:hidden',
  760: '@max-[760px]/list:hidden',
  880: '@max-[880px]/list:hidden',
};

export interface ListGroupsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** `list` (default) or `table` (row / cell roles; each group is then its own table). Same as `List`. */
  as?: Mode;
  /** CSS `grid-template-columns` shared by the column header and every row of every group. */
  columns?: string;
  /** Stack the rows below this width of the groups. Default 760. */
  stackBelow?: ListStackBelow;
  /**
   * Column labels, written once as `ListHeaderCell`s. Drawn once above the first group. In `table` mode every group
   * also gets a visually hidden copy so each table still has its column headers.
   */
  header?: ReactNode;
  /** Cursor row across all groups (controlled). */
  cursorId?: string | null;
  defaultCursorId?: string | null;
  onCursorChange?: (id: string) => void;
  /** j / k / Enter for all groups together. Default true. The Lists inside never listen themselves. */
  shortcuts?: boolean;
  children?: ReactNode;
}

/**
 * Several titled lists that behave as one (C18 follow-up, RDY-304). Owns the container, the shared column header
 * and ONE j / k cursor over every row of every `ListGroup` in document order: the cursor steps over group titles,
 * crosses from one group to the next, and skips collapsed groups. Put the page's main `ListGroups` (or `List`) on
 * shortcuts and give any other list on the page `shortcuts={false}`.
 */
export const ListGroups = forwardRef<HTMLDivElement, ListGroupsProps>(function ListGroups(
  { as = 'list', columns = 'minmax(0,1fr)', stackBelow = 760, header, cursorId, defaultCursorId = null, onCursorChange, shortcuts = true, className, children, ...rest },
  ref,
) {
  const rootRef = useRef<HTMLElement | null>(null);
  const { current, moveCursor, announce } = useListCursor(rootRef, { shortcuts, cursorId, defaultCursorId, onCursorChange });
  const ctx = useMemo<GroupsContextValue>(
    () => ({ mode: as, columns, stackBelow, header, cursorId: current, moveCursor }),
    [as, columns, stackBelow, header, current, moveCursor],
  );
  return (
    <GroupsContext.Provider value={ctx}>
      <div
        ref={(el) => {
          rootRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        style={{ '--list-cols': columns } as CSSProperties}
        className={cn('@container/list block', className)}
        {...rest}
      >
        {header ? (
          <div
            aria-hidden="true"
            className={cn('grid grid-cols-[var(--list-cols)] gap-x-4 border-b border-control pb-2 text-small text-muted', headerHidden[stackBelow])}
          >
            {header}
          </div>
        ) : null}
        {children}
      </div>
      {shortcuts ? (
        <span role="status" aria-live="polite" className="sr-only">
          {announce}
        </span>
      ) : null}
    </GroupsContext.Provider>
  );
});

export interface ListGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The group's name: "People", "Waiting to join", "Reads from". Also the accessible name of the group. */
  title: ReactNode;
  /** Number of rows, shown after the title (tabular, muted). */
  count?: number;
  /** Quiet text on the right, e.g. "Newest first". */
  note?: ReactNode;
  /** Buttons on the right, e.g. an Invite button. They stay visible when the group is collapsed. */
  actions?: ReactNode;
  /** Heading level of the title. Default 3 (a page's h1 and a section h2 above it). */
  level?: 2 | 3 | 4;
  /** The title becomes a button that folds the rows away (and out of the j / k cursor). */
  collapsible?: boolean;
  /** Controlled fold state. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Shown instead of the list when the group has no rows. */
  empty?: ReactNode;
  /** Label for the list itself when the heading is not enough. Defaults to the title text via the group. */
  listLabel?: string;
  /** `ListRow`s. */
  children?: ReactNode;
}

/**
 * One titled group of rows: a heading (13px, 600) with a count, a note and actions, then the ruled rows. Rendered as
 * `role="group"` named by its heading, holding a real list, so a screen reader hears "People, group, 5 items".
 * Use inside `ListGroups` (shared columns, shared cursor). Because the column header is its own grid, give shared columns fixed or fr widths, not `auto`, or header and rows drift apart. On its own it is a titled `List` with the same props.
 */
export const ListGroup = forwardRef<HTMLDivElement, ListGroupProps>(function ListGroup(
  { title, count, note, actions, level = 3, collapsible = false, collapsed, defaultCollapsed = false, onCollapsedChange, empty, listLabel, className, children, ...rest },
  ref,
) {
  const g = useContext(GroupsContext);
  const uid = useId();
  const titleId = `${uid}-t`;
  const bodyId = `${uid}-b`;
  const [innerCollapsed, setInner] = useState(defaultCollapsed);
  const isCollapsed = collapsible && (collapsed ?? innerCollapsed);
  const toggle = () => {
    const next = !isCollapsed;
    if (collapsed === undefined) setInner(next);
    onCollapsedChange?.(next);
  };
  const Heading = `h${level}` as 'h3';
  const empty0 = Children.count(children) === 0;
  return (
    <div ref={ref} role="group" aria-labelledby={titleId} className={cn('min-w-0', className)} {...rest}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pb-1.5 pt-5 text-small text-muted">
        <Heading id={titleId} className="m-0 min-w-0 text-ui font-semibold text-text [overflow-wrap:anywhere]">
          {collapsible ? (
            <button
              type="button"
              aria-expanded={!isCollapsed}
              aria-controls={bodyId}
              onClick={toggle}
              className={cn('-mx-1 inline-flex min-w-0 items-baseline gap-1 rounded-chip px-1 text-left font-semibold max-[640px]:min-h-11 max-[640px]:items-center', focusRing)}
            >
              <CaretRight
                size={12}
                weight="bold"
                aria-hidden
                className={cn('shrink-0 self-center text-muted transition-transform duration-150 motion-reduce:transition-none', !isCollapsed && 'rotate-90')}
              />
              <span className="min-w-0">{title}</span>
            </button>
          ) : (
            title
          )}
        </Heading>
        {count != null ? <span className="tabular-nums">{count}</span> : null}
        {note || actions ? (
          <div className="ml-auto flex min-w-0 items-center gap-2">
            {note ? <span>{note}</span> : null}
            {actions}
          </div>
        ) : null}
      </div>
      <div id={bodyId} hidden={isCollapsed}>
        {isCollapsed ? null : empty0 ? (
          empty ? <p className="m-0 border-t border-rule py-row-y text-ui text-muted">{empty}</p> : null
        ) : (
          <List
            as={g?.mode ?? 'list'}
            columns={g?.columns}
            stackBelow={g?.stackBelow}
            cursorId={g ? g.cursorId : undefined}
            onCursorChange={g ? g.moveCursor : undefined}
            shortcuts={g ? false : undefined}
            aria-label={listLabel}
            aria-labelledby={listLabel ? undefined : titleId}
            className="border-t border-rule"
          >
            {g?.mode === 'table' && g.header ? (
              <ListHeader className="sr-only">{g.header}</ListHeader>
            ) : null}
            {children}
          </List>
        )}
      </div>
    </div>
  );
});
