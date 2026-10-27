import { Fragment, forwardRef, useCallback, useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { X } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn } from '../utils/cn';

export interface TabItem {
  value: string;
  label: ReactNode;
  /** Leading icon component (Phosphor). Decorative. */
  icon?: PhosphorIcon;
  /** Leading node instead of an icon, for example a `PlatformLogo`. Decorative. */
  leading?: ReactNode;
  disabled?: boolean;
  /** Optional trailing count/badge. */
  badge?: ReactNode;
  /** Editor tabs: show the close button (and let Delete close the tab). */
  closable?: boolean;
  /** Editor tabs: italic label; the next preview replaces it. Double-click pins it (`onPin`). */
  preview?: boolean;
  /** Vertical list: a status word under the right edge, for example "Saved" or "Unsaved". */
  status?: string;
  /** `warn` colours the status word (use it for "Unsaved"). */
  statusTone?: 'muted' | 'warn';
}

/**
 * - `editor`: closable tabs in the sheet bar (Home). 96-180px, shrink before the strip scrolls.
 * - `fixed`: no close, natural width up to 16rem then ellipsis (Memory, Home "Today"). 48px with its own bottom border; inside a `SheetBar` the bar supplies the border.
 * - `vertical`: left list with icon, name and a status word (platform.html).
 * - `chips`: the phone form; 44px chips, the chosen chip scrolls into view.
 * - `underline` / `pill`: legacy names, kept as aliases of `fixed` / `chips` (desktop height).
 */
export type TabsVariant = 'editor' | 'fixed' | 'vertical' | 'chips' | 'underline' | 'pill';

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  /**
   * Called by the close X (pointer) and the Delete key on a `closable` tab. On Delete, focus has already moved to the
   * next tab (else the previous) and automatic activation has selected it: keep that selection, and only pick a
   * neighbour yourself when the closed tab is still the selected one (X click).
   */
  onClose?: (value: string) => void;
  /** Called when a preview tab is double-clicked. */
  onPin?: (value: string) => void;
  /** Accessible name of the tab list. */
  'aria-label'?: string;
  /** Tab panels, usually `<TabPanel>` children. Leave empty when the tabs only navigate. */
  children?: ReactNode;
  className?: string;
}

const CONTROLS_KEY = 'tabControls';

/**
 * Radix always sets `aria-controls` on a trigger, even when no `TabPanel` is
 * rendered for it (inactive panels, or tabs used purely as navigation). A dangling
 * reference is an invalid ARIA value, so drop it while the panel is absent and
 * restore it when the panel mounts.
 */
function syncControls(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[role="tab"]').forEach((tab) => {
    const id = tab.getAttribute('aria-controls') ?? tab.dataset[CONTROLS_KEY];
    if (!id) return;
    tab.dataset[CONTROLS_KEY] = id;
    const present = tab.ownerDocument.getElementById(id) !== null;
    if (present && tab.getAttribute('aria-controls') !== id) tab.setAttribute('aria-controls', id);
    if (!present && tab.hasAttribute('aria-controls')) tab.removeAttribute('aria-controls');
  });
}

/** Inset ring: the strips scroll, so an outside ring would be clipped. */
const ring = 'outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent forced-colors:outline-0 forced-colors:focus-visible:outline forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-[Highlight]';

const toSurface = (v: TabsVariant) => (v === 'underline' ? 'fixed' : v === 'pill' ? 'chips' : v);

const rootCls: Record<ReturnType<typeof toSurface>, string> = {
  editor: 'flex h-full min-w-0 flex-1 flex-col',
  fixed: 'flex h-full min-w-0 flex-col gap-4',
  vertical: 'flex min-w-0 flex-col gap-4',
  chips: 'flex min-w-0 flex-col gap-4',
};

const listCls: Record<ReturnType<typeof toSurface>, string> = {
  editor: 'flex h-full min-w-0 items-stretch overflow-x-auto overflow-y-hidden',
  fixed: 'flex min-h-0 min-w-0 flex-1 items-stretch gap-1 overflow-x-auto overflow-y-hidden border-b border-border',
  vertical: 'flex flex-col gap-1',
  chips: 'flex min-w-0 items-center gap-2 overflow-x-auto overflow-y-hidden py-0.5',
};

/** Keyboard-navigable tabs (arrows, Home, End; roving tabindex) built on Radix Tabs. */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    items,
    value,
    defaultValue,
    onValueChange,
    variant = 'fixed',
    onClose,
    onPin,
    'aria-label': ariaLabel = 'Tabs',
    children,
    className,
  },
  ref,
) {
  const v = toSurface(variant);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    syncControls(root);
    const observer = new MutationObserver(() => syncControls(root));
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected', 'id'] });
    return () => observer.disconnect();
  }, []);

  // Keep the chosen tab in view when the strip scrolls.
  useEffect(() => {
    if (v === 'vertical') return;
    rootRef.current
      ?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
      ?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' });
  }, [value, v, items.length]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, item: TabItem) => {
    if (e.key !== 'Delete' || !item.closable || !onClose || item.disabled) return;
    e.preventDefault();
    const tabs = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])') ?? []);
    const i = tabs.indexOf(e.currentTarget);
    // Hand focus to a neighbour first so it is not lost when the tab unmounts.
    (tabs[i + 1] ?? tabs[i - 1])?.focus();
    onClose(item.value);
  };

  return (
    <RadixTabs.Root
      ref={setRefs}
      value={value}
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={onValueChange}
      orientation={v === 'vertical' ? 'vertical' : 'horizontal'}
      className={cn(rootCls[v], className)}
    >
      <RadixTabs.List aria-label={ariaLabel} className={listCls[v]}>
        {items.map((item) => {
          const Lead = item.icon;
          const closable = v === 'editor' && item.closable && !!onClose;
          const title = typeof item.label === 'string' ? item.label : undefined;
          const trigger = (
            <RadixTabs.Trigger
              value={item.value}
              disabled={item.disabled}
              title={title}
              aria-keyshortcuts={closable ? 'Delete' : undefined}
              onKeyDown={(e) => onKeyDown(e, item)}
              onDoubleClick={item.preview && onPin ? () => onPin(item.value) : undefined}
              className={cn(
                'text-ui text-muted transition-colors duration-hover disabled:cursor-not-allowed disabled:opacity-50',
                ring,
                v === 'editor' &&
                  cn(
                    'relative flex h-full min-w-0 flex-1 items-center gap-2 px-3 hover:bg-raised hover:text-text',
                    'data-[state=active]:font-medium data-[state=active]:text-text',
                    'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:after:bg-accent',
                    closable && 'pr-8',
                  ),
                v === 'fixed' &&
                  cn(
                    'relative inline-flex h-full min-h-[47px] max-w-[16rem] shrink-0 items-center gap-[7px] whitespace-nowrap rounded-t-chip px-2 text-[13px] hover:bg-raised hover:text-text',
                    'data-[state=active]:font-medium data-[state=active]:text-text',
                    'after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 data-[state=active]:after:bg-accent',
                  ),
                v === 'vertical' &&
                  'flex w-full items-center gap-2 rounded-control p-2.5 text-left hover:bg-raised hover:text-text data-[state=active]:bg-accent-tint data-[state=active]:font-medium data-[state=active]:text-text',
                v === 'chips' &&
                  'inline-flex h-[30px] shrink-0 items-center gap-2 whitespace-nowrap rounded-control border border-border px-3 hover:bg-raised hover:text-text max-[640px]:h-11 data-[state=active]:border-accent data-[state=active]:bg-accent-tint data-[state=active]:font-medium data-[state=active]:text-text',
              )}
            >
              {Lead && <Lead size={16} aria-hidden className="shrink-0" />}
              {item.leading && <span aria-hidden className="inline-flex shrink-0">{item.leading}</span>}
              <span className={cn('min-w-0', v === 'editor' || v === 'fixed' ? 'truncate' : v === 'vertical' ? 'flex-1 truncate' : '', item.preview && 'italic')}>
                {item.label}
              </span>
              {item.badge != null && <span className="shrink-0 text-small tabular-nums text-muted">{item.badge}</span>}
              {item.status && v === 'vertical' && (
                <span className={cn('shrink-0 text-small', item.statusTone === 'warn' ? 'text-warn' : 'text-muted')}>
                  {item.status}
                </span>
              )}
              {closable && (
                // A tablist may only hold tabs, and a button cannot nest in a tab: the X is a pointer
                // affordance only. Keyboard and screen-reader users close with Delete (aria-keyshortcuts).
                <span
                  aria-hidden
                  data-close=""
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose?.(item.value);
                  }}
                  className="absolute right-1.5 top-1/2 inline-flex size-[18px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-chip text-muted transition-colors duration-hover hover:bg-raised-2 hover:text-text"
                >
                  <X size={12} aria-hidden />
                </span>
              )}
            </RadixTabs.Trigger>
          );
          if (v !== 'editor') return <Fragment key={item.value}>{trigger}</Fragment>;
          return (
            <span key={item.value} className="relative flex h-full min-w-[96px] max-w-[180px] shrink basis-auto" role="presentation">
              {trigger}
            </span>
          );
        })}
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  );
});

export interface TabPanelProps {
  value: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Panel for a `Tabs` value. Only the active panel mounts; it fades in over 120ms
 * (opacity only, never a slide, so it is kept under reduced motion too).
 */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { value, children, className },
  ref,
) {
  return (
    <RadixTabs.Content ref={ref} value={value} className={cn(ring, 'animate-tab-fade rounded-control', className)}>
      {children}
    </RadixTabs.Content>
  );
});
