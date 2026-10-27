import { createContext, forwardRef, useContext, useRef, useState, type Ref, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { ReadyMark, READY_SHINE_MS } from './ReadyMark';

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Focus ring for controls that sit on the frame colour (the ring gap is the frame, not the surface). */
const frameRing = cn(focusRing, 'focus-visible:ring-offset-frame');

/** Count text: counts above 99 read "99+". */
export function formatCount(count: number): string {
  return count > 99 ? '99+' : String(Math.max(0, Math.floor(count)));
}

export interface CountBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  count: number;
}

/**
 * Small ink count badge (14px high, 3px radius, 11px text). Absolutely positioned at the top right of
 * its (relative) parent, so it works on a rail item and on a phone bottom-nav tab alike. Decorative:
 * the parent's accessible name carries the number. Renders nothing for 0.
 */
export function CountBadge({ count, className, ...rest }: CountBadgeProps) {
  if (!(count > 0)) return null;
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inline-flex h-[14px] min-w-[14px] items-center justify-center rounded-[3px] bg-text px-[3px] text-tiny font-medium leading-[14px] text-surface',
        count > 99 ? 'right-[-3px] top-[1px]' : 'right-[2px] top-[3px]',
        className,
      )}
      {...rest}
    >
      {formatCount(count)}
    </span>
  );
}

const InRailTooltips = createContext(false);

const railLayout =
  'box-border flex w-rail min-w-[var(--rail)] max-w-[var(--rail)] shrink-0 flex-col items-center gap-1 pb-2 pt-3';

function RailTooltips({ children }: { children: ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={200} skipDelayDuration={400}>
      <InRailTooltips.Provider value>{children}</InRailTooltips.Provider>
    </RadixTooltip.Provider>
  );
}

export interface IconRailProps extends HTMLAttributes<HTMLElement> {}

export interface IconRailContentProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * The rail without its own landmark, for `PlatformShell`'s `rail` slot (the shell already wraps the
 * slot in a labelled `nav`, so a second one would nest). Same colour, 52px column layout and shared
 * tooltip timing as `IconRail`; it fills the height of the slot.
 */
export const IconRailContent = forwardRef<HTMLDivElement, IconRailContentProps>(function IconRailContent(
  { className, children, ...rest },
  ref,
) {
  return (
    <RailTooltips>
      <div ref={ref} {...rest} className={cn('min-h-0 flex-1 bg-frame text-muted', className, railLayout)}>
        {children}
      </div>
    </RailTooltips>
  );
});

/**
 * The 52px desktop icon rail (C2): a `nav` landmark on the `--frame` colour (no border: the frame is
 * the rail). Children stack from the top: `IconRailMark`, items, `IconRailSpacer`, then
 * `IconRailFoot` holding the AccountMenu. Width and direction are fixed; `className` can add
 * margins, height or position but cannot change them. Provides the shared tooltip timing.
 */
export const IconRail = forwardRef<HTMLElement, IconRailProps>(function IconRail(
  { className, children, 'aria-label': ariaLabel = 'Main', ...rest },
  ref,
) {
  return (
    <RailTooltips>
      <nav
        ref={ref}
        aria-label={ariaLabel}
        {...rest}
        className={cn(
          'bg-frame text-muted',
          className,
          railLayout,
        )}
      >
        {children}
      </nav>
    </RailTooltips>
  );
});

/** The mark inside the 36px link (RDY-365): the full-detail cut, so the beak hook, eye and cheek facets read. */
const RAIL_MARK_PX = 36;

export interface IconRailMarkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  /** Accessible name. Default "Ready". */
  label?: string;
  /** Play the shine (one light sweep): once on mount, and again on hover or keyboard focus. Default true. */
  animate?: boolean;
}

/**
 * The Ready falcon (RDY-363, RDY-365): the full-cut mark in a 36px link (the workshop `.rail a` rule, RDY-364) to Home. Sits above the items with 12px of air.
 * The shine plays once when the rail mounts (not on re-renders) and again on hover or keyboard focus, never in a loop, and only
 * after the last run has finished. `prefers-reduced-motion` turns it into one brightness step (see ReadyMark).
 */
export const IconRailMark = forwardRef<HTMLAnchorElement, IconRailMarkProps>(function IconRailMark(
  { label = 'Ready', href = '/', animate = true, className, onMouseEnter, onFocus, ...rest },
  ref,
) {
  const [run, setRun] = useState(animate ? 1 : 0);
  const startedAt = useRef(animate ? now() : -Infinity);
  const replay = () => {
    if (!animate || now() - startedAt.current < READY_SHINE_MS) return;
    startedAt.current = now();
    setRun((n) => n + 1);
  };
  return (
    <a
      ref={ref}
      href={href}
      aria-label={label}
      {...rest}
      onMouseEnter={(e) => {
        onMouseEnter?.(e);
        replay();
      }}
      onFocus={(e) => {
        onFocus?.(e);
        // Keyboard focus only: a click already played it through the hover.
        let visible = true;
        try {
          visible = e.currentTarget.matches(':focus-visible');
        } catch {
          /* engines without :focus-visible */
        }
        if (visible) replay();
      }}
      className={cn(
        'mb-3 grid size-9 shrink-0 place-items-center rounded-control transition-colors motion-reduce:transition-none hover:bg-frame-hover',
        frameRing,
        className,
      )}
    >
      <ReadyMark size={RAIL_MARK_PX} cut="full" decorative animate={run} effect="shine" />
    </a>
  );
});

/** Pushes whatever follows it to the foot of the rail. */
export function IconRailSpacer() {
  return <span aria-hidden className="min-h-2 flex-1" />;
}

/**
 * The rail's foot slot for the AccountMenu: gives the 36px avatar button its frame-colour hover,
 * open state and focus ring, so the menu button behaves like an item.
 */
export function IconRailFoot({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex shrink-0 [&>button]:transition-colors motion-reduce:[&>button]:transition-none [&>button:hover]:bg-frame-hover [&>button[data-state=open]]:bg-frame-active [&>button]:ring-offset-frame',
        className,
      )}
    >
      {children}
    </div>
  );
}

type ItemBase = {
  /** Phosphor icon (19px). */
  icon: PhosphorIcon;
  /** Accessible name and tooltip text. Required: the item has no visible text. */
  label: string;
  /** This item is the current page: `aria-current="page"` and `--frame-active`. */
  current?: boolean;
  /** @deprecated Legacy name for `current`. */
  active?: boolean;
  /** Unread/attention count. Above 99 reads "99+". The name becomes "{label}, {n}". */
  count?: number;
  /** Tooltip to the right on hover and keyboard focus. Turn off for the phone bottom nav. Default true. */
  tooltip?: boolean;
};

export type IconRailItemProps = ItemBase &
  (
    | (Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ItemBase> & { href: string })
    | (Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ItemBase> & { href?: undefined })
  );

const itemClass =
  'relative grid size-9 shrink-0 place-items-center rounded-control transition-colors motion-reduce:transition-none';

/**
 * A 36x36 rail item (C2): 19px icon, 5px radius. Default muted, hover `--frame-hover`, current
 * `--frame-active`, optional count badge. A link when `href` is set, otherwise a button. Reusable
 * outside the rail (phone bottom nav, RDY-261): pass `tooltip={false}` and size it with `className`.
 */
export const IconRailItem = forwardRef<HTMLAnchorElement | HTMLButtonElement, IconRailItemProps>(function IconRailItem(
  { icon: IconCmp, label, current, active, count = 0, tooltip = true, className, ...rest },
  ref,
) {
  const inRail = useContext(InRailTooltips);
  const isCurrent = current ?? active ?? false;
  const name = count > 0 ? `${label}, ${formatCount(count)}` : label;
  const classes = cn(
    itemClass,
    isCurrent ? 'bg-frame-active text-text' : 'text-muted hover:bg-frame-hover hover:text-text',
    frameRing,
    className,
  );
  const inner = (
    <>
      <IconCmp size={19} aria-hidden />
      <CountBadge count={count} />
    </>
  );
  const common = { 'aria-label': name, 'aria-current': isCurrent ? ('page' as const) : undefined, className: classes };
  const node =
    'href' in rest && rest.href !== undefined ? (
      <a ref={ref as Ref<HTMLAnchorElement>} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} {...common}>
        {inner}
      </a>
    ) : (
      <button ref={ref as Ref<HTMLButtonElement>} type="button" {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} {...common}>
        {inner}
      </button>
    );
  if (!tooltip) return node;
  const tip = (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{node}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side="right"
          sideOffset={8}
          collisionPadding={8}
          className="z-50 select-none whitespace-nowrap rounded-chip bg-text px-2 py-1 text-small text-surface"
        >
          {label}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
  return inRail ? tip : (
    <RadixTooltip.Provider delayDuration={200} skipDelayDuration={400}>{tip}</RadixTooltip.Provider>
  );
});
