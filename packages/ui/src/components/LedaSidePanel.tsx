import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { CaretLineRight, NotePencil, WaveTriangle, X } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Chat } from './Chat';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { OffCanvas } from './Drawer';
import { Tag } from './Tag';

/** Desktop = docked panel; below this the panel is a right drawer. Matches Tailwind `lg`. */
const DESKTOP_QUERY = '(min-width: 1024px)';

export interface LedaSidePanelProps {
  /** Panel open. Controlled; omit to let the panel manage it (default: open on desktop, closed below lg). Below lg this is the drawer. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Page context Leda receives; shown as an "On this page" Tag in the header. */
  context?: string;
  /** Chat body: messages, suggestions and the composer. */
  children?: ReactNode;
  /** Replaces the default "New conversation" button. The collapse / close button is always rendered. */
  headerActions?: ReactNode;
  /** Called by the default "New conversation" button. */
  onNewConversation?: () => void;
  /**
   * localStorage key (e.g. `readyph.leda_panel`) that remembers `open` / `closed` on desktop.
   * Storage errors are swallowed. Not used below lg, where the drawer always starts closed.
   */
  persistKey?: string;
  className?: string;
}

function readStored(key: string): boolean | undefined {
  try {
    const value = window.localStorage.getItem(key);
    return value === 'open' ? true : value === 'closed' ? false : undefined;
  } catch {
    return undefined;
  }
}

function writeStored(key: string, open: boolean): void {
  try {
    window.localStorage.setItem(key, open ? 'open' : 'closed');
  } catch {
    /* storage blocked: the state just is not remembered */
  }
}

/** Widgets inside the panel share one hairline treatment (stats, proposals, tables). */
const widgetBorders =
  '[&_[data-leda-widget]]:border [&_[data-leda-widget]]:border-border [&_[data-leda-widget]]:shadow-none';

interface BodyProps {
  context?: string;
  overlay: boolean;
  onClose: () => void;
  headerActions?: ReactNode;
  onNewConversation?: () => void;
  children?: ReactNode;
}

function PanelBody({ context, overlay, onClose, headerActions, onNewConversation, children }: BodyProps) {
  return (
    <Chat size="fill" aria-label="Leda" className="min-h-0 flex-1">
      <Chat.Header
        title="Leda"
        subtitle={
          context ? (
            <span className="inline-flex items-center gap-1.5">
              On this page <Tag className="py-0">{context}</Tag>
            </span>
          ) : undefined
        }
        actions={
          <>
            {headerActions ?? (
              <IconButton icon={NotePencil} label="New conversation" variant="subtle" size="sm" onClick={onNewConversation} />
            )}
            <IconButton
              icon={overlay ? X : CaretLineRight}
              label={overlay ? 'Close Leda' : 'Collapse Leda'}
              variant="subtle"
              size="sm"
              onClick={onClose}
            />
          </>
        }
        className="border-b border-border"
      />
      <div className={cn('flex min-h-0 flex-1 flex-col', widgetBorders)}>{children}</div>
    </Chat>
  );
}

/**
 * The Leda entry point on every page: a docked inset card at lg+ (22.5rem, the
 * `leda-panel` width token), a 40px edge tab when collapsed, and a right drawer
 * below lg (full width under 640px, 24rem above). Presentational and controlled;
 * the project owns the chat inside (`children`) and what Leda receives (`context`).
 *
 * Desktop vs drawer is decided in JS so a hidden dialog never traps focus.
 */
export function LedaSidePanel({
  open,
  onOpenChange,
  context,
  children,
  headerActions,
  onNewConversation,
  persistKey,
  className,
}: LedaSidePanelProps) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const [inner, setInner] = useState<boolean>(() => {
    if (open !== undefined) return open;
    const isDesktop = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(DESKTOP_QUERY).matches : true;
    if (!isDesktop) return false;
    return (persistKey ? readStored(persistKey) : undefined) ?? true;
  });
  const isOpen = open ?? inner;

  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) setInner(next);
      if (persistKey && desktop) writeStored(persistKey, next);
      onOpenChange?.(next);
    },
    [open, persistKey, desktop, onOpenChange],
  );

  // Controlled: honour a remembered value on mount (desktop only).
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    if (!persistKey || open === undefined || !desktop) return;
    const stored = readStored(persistKey);
    if (stored !== undefined && stored !== open) onOpenChange?.(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drawer: put the cursor in the composer once it opens (after Radix places focus).
  const drawerOpen = !desktop && isOpen;
  useEffect(() => {
    if (!drawerOpen) return;
    const id = window.requestAnimationFrame(() => {
      document.querySelector<HTMLTextAreaElement>('[data-leda-drawer] textarea')?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [drawerOpen]);

  const body = (overlay: boolean) => (
    <PanelBody
      context={context}
      overlay={overlay}
      onClose={() => setOpen(false)}
      headerActions={headerActions}
      onNewConversation={onNewConversation}
    >
      {children}
    </PanelBody>
  );

  if (desktop) {
    return isOpen ? (
      <aside
        aria-label="Leda panel"
        className={cn(
          'mb-2 mr-2 flex w-leda-panel shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-surface',
          className,
        )}
      >
        {body(false)}
      </aside>
    ) : (
      <aside
        aria-label="Leda panel, collapsed"
        className={cn(
          'mb-2 mr-2 flex w-10 shrink-0 flex-col items-center rounded-lg border border-border bg-surface py-2',
          className,
        )}
      >
        <button
          type="button"
          aria-label="Open Leda"
          onClick={() => setOpen(true)}
          className={cn(
            'flex flex-col items-center gap-2 rounded-base px-1 py-2 text-ink-muted hover:bg-surface-muted hover:text-ink',
            focusRing,
          )}
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-50 text-primary-600">
            <Icon icon={WaveTriangle} size="sm" weight="fill" />
          </span>
          <span aria-hidden="true" className="text-xs font-semibold [writing-mode:vertical-rl]">
            Leda
          </span>
        </button>
      </aside>
    );
  }

  return (
    <OffCanvas
      open={isOpen}
      onOpenChange={setOpen}
      side="right"
      width="100vw"
      hideClose
      className={cn('max-w-none sm:max-w-[24rem]', className)}
    >
      <OffCanvas.Header className="sr-only">Leda</OffCanvas.Header>
      <div data-leda-drawer="" className="flex min-h-0 flex-1 flex-col">
        {body(true)}
      </div>
    </OffCanvas>
  );
}
