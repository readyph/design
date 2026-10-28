import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';
import { useMatchMedia } from '../utils/useMatchMedia';
import { SUBPAGE_PHONE, SubpageScreensContext, useSubpageShell } from './SubpageTransition';

export interface PlatformShellProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Icon rail (C2). Rendered inside the shell's 'nav' landmark, so pass the items, not another 'nav'. Hidden on phone. */
  rail?: ReactNode;
  /** Accessible name of the rail 'nav' (default "Main"). */
  railLabel?: string;
  /** Place column content (map, lists). Omit it and the sheet takes the column. */
  place?: ReactNode;
  /** Accessible name of the place 'section' (required by the landmark; default "Places"). */
  placeLabel?: string;
  /** Sheet bar (C5): tabs or breadcrumb plus the Ask Leda bar. Stays put while the sheet body scrolls. */
  sheetBar?: ReactNode;
  /** Phone only: hide the sheet bar (and its border), for a page whose own top bar already carries the back link and Ask Leda. Default false. */
  hideSheetBarOnPhone?: boolean;
  /** Sticky action bar at the foot of the sheet. Shown on phone in detail mode only. */
  actionBar?: ReactNode;
  /** Status bar content (C4), rendered inside the shell's 'footer'. Hidden on phone. */
  status?: ReactNode;
  /** Accessible name of the status 'footer' (default "Status"). */
  statusLabel?: string;
  /** Phone top bar (48px): word, page name, Leda icon button, avatar. Rendered inside a 'header' (banner). Hidden above 640px. */
  topBar?: ReactNode;
  /** Phone bottom nav items (60px). Rendered inside a 'nav'. Hidden above 640px. */
  phoneNav?: ReactNode;
  /** Accessible name of the phone 'nav' (default "Main"). */
  phoneNavLabel?: string;
  /** Phone only: show the sheet (detail) instead of the place column. One region at a time. */
  detail?: boolean;
  /** Accessible name of the 'main' (the sheet). Optional. */
  sheetLabel?: string;
  /**
   * Page heading (the platform name). Rendered as a visually hidden 'h1' inside whichever region is visible, so the page
   * always has one visible 'main' and one 'h1'. Omit it if your sheet content already renders its own 'h1' (a second would
   * break "one h1"). On phone, with the place column showing and no 'heading', 'placeLabel' is used.
   * Pass 'null' to opt out: no 'h1' is rendered at all (no 'placeLabel' fallback), for content that has its own 'h1'.
   */
  heading?: string | null;
  /**
   * Rail width from 641px up. `default` is the token (--rail, 52px). `wide` is 64px (Inventory, RDY-382: cart.css 116, so a word under an icon keeps
   * 16px to the screen edge). Phone has no rail, so it does not change there.
   */
  railWidth?: 'default' | 'wide';
  /** Sheet body. */
  children?: ReactNode;
}

/** '[hidden]' always wins over any display utility. */
const hiddenWins = '[&[hidden]]:!hidden';

/**
 * Portal app shell (C1). A CSS grid: 'rail | place column | sheet' over a status row.
 * The frame colour sits behind the rail, place column and status bar; the sheet is a 'surface'
 * panel (1px border, 8px radius, 8px inset from the top and right) and a container named 'sheet'
 * ('@container/sheet', '@max-[760px]/sheet:' ...). The shell fills its parent's height (use it as the page root,
 * or in a sized box): the sheet body scrolls, the frame does not.
 *
 * Landmarks: 'header' (phone top bar), 'nav' (rail, phone nav), 'section' (place), 'main' (sheet), 'footer' (status).
 * Phone (640px and below): 48px top bar, one region at a time (place, or the sheet with 'detail'), 60px bottom nav.
 * The shell owns layout; 'className' is merged underneath it, so it can add colours or margins but cannot move the regions.
 */
export function PlatformShell({
  rail,
  railLabel = 'Main',
  place,
  placeLabel = 'Places',
  sheetBar,
  hideSheetBarOnPhone = false,
  actionBar,
  status,
  statusLabel = 'Status',
  topBar,
  phoneNav,
  phoneNavLabel = 'Main',
  detail = false,
  sheetLabel,
  heading,
  railWidth = 'default',
  className,
  children,
  ...rest
}: PlatformShellProps) {
  const hasPlace = place != null;
  // Phone + a running subpage transition: both regions show for the slide (the sheet slides over the place column, or back).
  const sub = useSubpageShell();
  const phoneNow = useMatchMedia(SUBPAGE_PHONE);
  const slide = !!sub && sub.running && !sub.reduced && hasPlace && phoneNow;
  const slideIn = sub?.direction === 'in';
  // The region under the slide is inert. It is an attribute in the render (not an effect) so it is already right in the same commit
  // in which a lane moves focus; a later effect would still see the previous state and focus would be lost.
  const underPlace = slide && slideIn;
  const underSheet = slide && !slideIn;
  // Phone, place column showing (the sheet is display:none): the place section is the page's visible main region.
  const placeIsMain = phoneNow && hasPlace && !detail && !slide;
  const h1Text = heading === null ? undefined : heading ?? (placeIsMain ? placeLabel : undefined);
  const h1 = h1Text ? <h1 className="sr-only">{h1Text}</h1> : null;
  const inertAttr = { inert: '' } as Record<string, string>;
  const hasStatus = status != null;
  const hasRail = rail != null;
  const hasTop = topBar != null;
  // Workshop shell.css `body.detail .pnav { display: none }`: a phone detail screen has no bottom nav (its own back bar leads out).
  const hasPhoneNav = phoneNav != null;
  const phoneNavShown = hasPhoneNav && !detail;

  // Class lookups are literal strings so Tailwind can see every utility.
  const cols = hasRail
    ? hasPlace ? 'grid-cols-[var(--rail)_var(--place)_minmax(0,1fr)]' : 'grid-cols-[var(--rail)_minmax(0,1fr)]'
    : hasPlace ? 'grid-cols-[var(--place)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)]';
  const rows = hasStatus ? 'grid-rows-[minmax(0,1fr)_var(--status)]' : 'grid-rows-[minmax(0,1fr)]';
  const phoneRows = hasTop
    ? phoneNavShown ? 'max-[640px]:grid-rows-[var(--sheet-bar)_minmax(0,1fr)_calc(60px+env(safe-area-inset-bottom,0px))]' : 'max-[640px]:grid-rows-[var(--sheet-bar)_minmax(0,1fr)]'
    : phoneNavShown ? 'max-[640px]:grid-rows-[minmax(0,1fr)_calc(60px+env(safe-area-inset-bottom,0px))]' : 'max-[640px]:grid-rows-[minmax(0,1fr)]';
  const placeCol = hasRail ? 'col-start-2' : 'col-start-1';
  const sheetCol = hasRail ? (hasPlace ? 'col-start-3' : 'col-start-2') : hasPlace ? 'col-start-2' : 'col-start-1';
  const phoneRegionRow = hasTop ? 'max-[640px]:row-start-2' : 'max-[640px]:row-start-1';
  const phoneNavRow = hasTop ? 'max-[640px]:row-start-3' : 'max-[640px]:row-start-2';

  return (
    <SubpageScreensContext.Provider value={hasPlace}>
    <div
      {...rest}
      className={cn(
        className,
        'grid h-dvh w-full min-w-0 overflow-hidden bg-frame font-sans text-text print:block print:h-auto print:overflow-visible print:bg-white print:text-black',
        cols,
        rows,
        phoneRows,
        'max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:bg-surface',
        railWidth === 'wide' && 'min-[641px]:[--rail:64px]',
      )}
    >
      {hasTop && (
        <header
          className={cn(
            'hidden print:hidden',
            'max-[640px]:col-start-1 max-[640px]:row-start-1 max-[640px]:flex max-[640px]:min-w-0 max-[640px]:items-center max-[640px]:gap-2 max-[640px]:bg-frame max-[640px]:pl-pad max-[640px]:pr-1',
            hiddenWins,
          )}
        >
          {topBar}
        </header>
      )}

      {hasRail && (
        <nav
          aria-label={railLabel}
          className={cn('col-start-1 row-start-1 flex min-h-0 min-w-0 flex-col print:hidden', 'max-[640px]:hidden', hiddenWins)}
        >
          {rail}
        </nav>
      )}

      {hasPlace && (
        <section
          {...(underPlace ? inertAttr : {})}
          aria-hidden={underPlace ? true : undefined}
          role={placeIsMain ? 'main' : undefined}
          aria-label={placeLabel}
          data-surface="frame"
          data-shell-place=""
          className={cn(
            'row-start-1 flex min-h-0 min-w-0 flex-col pb-0 pl-1 pr-3 pt-inset print:hidden',
            placeCol,
            'max-[640px]:col-start-1 max-[640px]:pl-0 max-[640px]:pr-0 max-[640px]:pt-0',
            phoneRegionRow,
            detail && !slide && 'max-[640px]:hidden',
            slide && cn('max-[640px]:bg-surface', slideIn ? 'max-[640px]:animate-sub-drift-l' : 'max-[640px]:animate-sub-back-l'),
            hiddenWins,
          )}
        >
          <div tabIndex={0} className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-card focus-visible:outline focus-visible:-outline-offset-2">
            {placeIsMain && h1}
            {place}
          </div>
        </section>
      )}

      <main
        {...(underSheet ? inertAttr : {})}
        aria-hidden={underSheet ? true : undefined}
        onAnimationEnd={slide ? (e) => { if (e.target === e.currentTarget) sub?.screenEnded(sub.seq); } : undefined}
        data-shell="sheet"
        hidden={placeIsMain || undefined}
        aria-label={sheetLabel}
        className={cn(
          '@container/sheet row-start-1 flex min-h-0 min-w-0 flex-col overflow-hidden border border-border bg-surface rounded-sheet print:block print:overflow-visible print:border-0 print:bg-white',
          'mr-inset mt-inset',
          sheetCol,
          'max-[640px]:col-start-1 max-[640px]:m-0 max-[640px]:rounded-none max-[640px]:border-0',
          phoneRegionRow,
          !detail && hasPlace && !slide && 'max-[640px]:hidden',
          slide && (slideIn ? 'max-[640px]:z-10 max-[640px]:animate-sub-in-r' : 'max-[640px]:z-10 max-[640px]:animate-sub-out-r'),
          hiddenWins,
        )}
      >
        {sheetBar != null && <div className={cn('shrink-0 border-b border-border print:hidden', hideSheetBarOnPhone && 'max-[640px]:hidden')}>{sheetBar}</div>}
        <div tabIndex={0} className="min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline focus-visible:-outline-offset-2 print:h-auto print:overflow-visible">
          {!placeIsMain && h1}
          {children}
        </div>
        {actionBar != null && (
          <div className={cn('hidden shrink-0 print:hidden', 'max-[640px]:flex max-[640px]:items-center max-[640px]:gap-2 max-[640px]:bg-frame max-[640px]:px-4 max-[640px]:pt-2 max-[640px]:pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] max-[640px]:[&>*]:h-11 max-[640px]:[&>*]:flex-1 max-[640px]:[&>*]:text-[14px]', hiddenWins)}>
            {actionBar}
          </div>
        )}
      </main>

      {hasStatus && (
        <footer
          aria-label={statusLabel}
          className={cn(
            'col-span-full row-start-2 flex h-status min-w-0 items-center overflow-hidden pl-3 pr-2 text-small text-muted print:hidden',
            'max-[640px]:hidden',
            hiddenWins,
          )}
        >
          {status}
        </footer>
      )}

      {phoneNavShown && (
        <nav
          data-shell="phone-nav"
          aria-label={phoneNavLabel}
          className={cn(
            'hidden print:hidden',
            'max-[640px]:col-start-1 max-[640px]:flex max-[640px]:min-w-0 max-[640px]:items-stretch max-[640px]:bg-frame',
            phoneNavRow,
            hiddenWins,
          )}
        >
          {phoneNav}
        </nav>
      )}
    </div>
    </SubpageScreensContext.Provider>
  );
}
