import { type ReactNode } from 'react';
import { ArrowLineDown, ArrowLineUp, CaretLeft, House, MagnifyingGlass } from '@phosphor-icons/react';
import { cn } from '../utils/cn';

/*
 * RDY-399 I17. Transcribed from inventory-home round-1/final: stocker.css 3-6 (tokens), 8-13 (.stk), 15-39 (.sh, .sh-top, .back, .lg, .who, .steps, h1, .lead),
 * 41-45 (.sm), 178-191 (.bar, .tabs), 203-205 (.snack), 208 (<=360px), 218-219 (.signed, signedout); shell.css 83 (.mark), 61 (body);
 * stocker.js 78-95 (TABS, logo, stepsHTML, frame), 625-636 (signedOut).
 * GAP: stocker.css --pad is 20px here; the global `pad` token is not used (it would be 16px at <=640px). Literal 20px, 16px at <=360px.
 * GAP: stocker.css 44-45 (hasbar padding 140px) is overridden by line 212 (same specificity, later), so the computed main padding is tabh+16px with or without a bar; transcribed as computed.
 * Owner ruling: the workshop never sets body.notabbar (stocker.css 186), so the tab bar is always shown except signed out (stocker.css 219); .bar keeps bottom: tabh (line 184).
 * GAP: body background (frame colour at >=700px) is a wrapper background here, because a component cannot set body.
 */

export type StockerTab = 'home' | 'in' | 'out' | 'find';

const TABS: { id: StockerTab; label: string; Icon: typeof House }[] = [
  { id: 'home', label: 'Home', Icon: House },
  { id: 'in', label: 'Stock in', Icon: ArrowLineDown },
  { id: 'out', label: 'Stock out', Icon: ArrowLineUp },
  { id: 'find', label: 'Find', Icon: MagnifyingGlass },
];

export interface StockerFrameProps {
  /** The platform's own name (DATA.business.platform), e.g. "Parts Stockroom". */
  platform: string;
  /** The one `h1` of the page (the focus target after a transition). */
  title: string;
  /** One plain sentence under the title. */
  lead?: ReactNode;
  /** Step line inside a flow: `{ n: 2, of: 3, label: 'Find the product' }`. */
  steps?: { n: number; of: number; label: string };
  /** The way back inside a flow; shows the chevron. */
  back?: { href: string; label: string };
  /** The account at the right of the header (initials link to the account page). */
  account?: { initials: string; name: string; href: string; current?: boolean };
  /** Link for the logo (Home). */
  homeHref?: string;
  /** Current tab; the bar is shown unless `signedOut`. */
  tab?: StockerTab;
  /** Link per tab. */
  tabHrefs?: Partial<Record<StockerTab, string>>;
  /** The one primary action of a flow, pinned above the tab bar (with its plain sentence). */
  bar?: ReactNode;
  /** Signed-out screen: logo only, no tabs. Children carry the content. */
  signedOut?: boolean;
  /** Transient message shown above the tab bar (role="status", aria-live). */
  snack?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const safeTop = 'pt-[calc(4px+env(safe-area-inset-top))]';

function Logo({ platform, href }: { platform: string; href?: string }) {
  const inner = (
    <>
      <span
        aria-hidden="true"
        className="grid h-8 w-8 flex-none place-items-center rounded-control bg-raised-2 text-[18px] font-semibold leading-none tracking-[-0.02em] text-text"
      >
        R
      </span>
      <span className="whitespace-nowrap text-[15px] font-semibold leading-5 group-hover/lg:text-muted">{platform}</span>
    </>
  );
  const cls = 'group/lg inline-flex min-h-[var(--tap)] min-w-0 items-center gap-2.5 rounded-[6px] px-2.5 text-text';
  return href ? (
    <a className={cls} href={href} aria-label={`${platform}, Home`}>
      {inner}
    </a>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

/**
 * Stocker app frame (I17): header (portal R mark + platform name, account initials, back chevron, step line, h1, lead),
 * scrolling main, pinned primary-action bar and bottom tab bar. Column max 520px, centred. Variants: page with tabs,
 * page with a pinned `bar` above the tabs, signed out (`signedOut`).
 */
export function StockerFrame({
  platform,
  title,
  lead,
  steps,
  back,
  account,
  homeHref,
  tab,
  tabHrefs = {},
  bar,
  signedOut = false,
  snack,
  children,
  className,
}: StockerFrameProps) {
  const showTabs = !signedOut;
  const hasBar = !!bar;
  const pad = 'px-5 max-[360px]:px-4';
  return (
    <div className={cn('min-h-svh bg-surface text-[15px] leading-[22px] text-text min-[700px]:bg-frame', className)}>
      <div className="mx-auto flex min-h-svh max-w-[var(--col)] flex-col bg-surface min-[700px]:border-x min-[700px]:border-border">
        <header className={cn(safeTop, pad)}>
          <div className="-mx-2.5 flex min-h-[56px] items-center gap-1">
            {back && !signedOut ? (
              <a
                href={back.href}
                aria-label={`Back to ${back.label}`}
                className="grid h-[var(--tap)] w-[var(--tap)] flex-none place-items-center rounded-full text-[22px] text-text hover:bg-raised"
              >
                <CaretLeft aria-hidden="true" />
              </a>
            ) : null}
            <Logo platform={platform} href={signedOut ? undefined : homeHref} />
            <span className="flex-1" />
            {account && !signedOut ? (
              <a
                href={account.href}
                aria-current={account.current ? 'page' : undefined}
                aria-label={`Account, ${account.name}`}
                className="group/who grid h-[var(--tap)] w-[var(--tap)] flex-none place-items-center rounded-full text-text"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'grid h-9 w-9 place-items-center rounded-full bg-raised-2 text-[13px] font-semibold text-text shadow-[inset_0_0_0_1px_var(--border)] group-hover/who:bg-accent-tint',
                    account.current && 'shadow-[inset_0_0_0_2px_var(--accent)]',
                  )}
                >
                  {account.initials}
                </span>
              </a>
            ) : null}
          </div>
          {steps && !signedOut ? (
            <div className="mt-1.5" role="status">
              <span className="block text-[13px] leading-[18px] text-muted">
                Step <b className="font-semibold text-text">{steps.n} of {steps.of}</b> · {steps.label}
              </span>
              <span aria-hidden="true" className="mt-1.5 grid auto-cols-fr grid-flow-col gap-1">
                {Array.from({ length: steps.of }, (_, i) => (
                  <i key={i} className={cn('block h-1 rounded-[2px]', i < steps.n ? 'bg-accent' : 'bg-border')} />
                ))}
              </span>
            </div>
          ) : null}
          {signedOut ? null : (
            <>
              <h1
                tabIndex={-1}
                className="mt-3 text-[20px] font-semibold leading-[26px] tracking-[-.005em] focus:outline-none max-[360px]:text-[19px] max-[360px]:leading-[25px]"
              >
                {title}
              </h1>
              {lead ? <p className="mt-1 text-[15px] leading-[22px] text-muted [&_b]:font-semibold [&_b]:text-text">{lead}</p> : null}
            </>
          )}
        </header>
        <main
          tabIndex={-1}
          className={cn(
            'flex-1 pt-1.5 focus:outline-none',
            pad,
            signedOut ? 'pb-[calc(var(--tabh)+28px+env(safe-area-inset-bottom))]' : 'pb-[calc(var(--tabh)+16px+env(safe-area-inset-bottom))]',
          )}
        >
          {signedOut ? (
            <div className="mt-14 text-left">
              <h1 tabIndex={-1} className="mt-0 text-[20px] font-semibold leading-[26px] tracking-[-.005em] focus:outline-none max-[360px]:text-[19px] max-[360px]:leading-[25px]">
                {title}
              </h1>
              {lead ? <p className="mt-1 text-[15px] leading-[22px] text-muted [&_b]:font-semibold [&_b]:text-text">{lead}</p> : null}
              {children}
            </div>
          ) : (
            children
          )}
        </main>
        {hasBar ? (
          <div className="fixed inset-x-0 bottom-[calc(var(--tabh)+env(safe-area-inset-bottom))] z-[5] mx-auto max-w-[var(--col)] border-t border-border bg-surface px-5 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 max-[360px]:px-4">
            {bar}
          </div>
        ) : null}
        {showTabs ? (
          <nav
            aria-label="Stocker"
            className="fixed inset-x-0 bottom-0 z-[6] mx-auto grid max-w-[var(--col)] grid-cols-4 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
          >
            {TABS.map(({ id, label, Icon }) => (
              <a
                key={id}
                href={tabHrefs[id] ?? '#'}
                aria-current={tab === id ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-[var(--tabh)] flex-col items-center justify-center gap-px text-[12px] font-semibold leading-4 hover:text-lk-hover',
                  tab === id ? 'text-accent before:absolute before:inset-x-[22%] before:top-0 before:h-[3px] before:rounded-b-[3px] before:bg-accent before:content-[""]' : 'text-muted',
                )}
              >
                <Icon size={22} aria-hidden="true" />
                {label}
              </a>
            ))}
          </nav>
        ) : null}
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'pointer-events-none fixed inset-x-0 bottom-[calc(var(--tabh)+16px+env(safe-area-inset-bottom))] z-[8] mx-auto max-w-[var(--col)] px-5 opacity-0 transition-[opacity,transform] duration-150 max-[360px]:px-4',
            snack ? 'pointer-events-auto translate-y-0 opacity-100' : 'translate-y-2',
          )}
        >
          {snack ? <div className="rounded-[8px] bg-text px-3.5 py-3 text-[14px] leading-5 text-surface">{snack}</div> : null}
        </div>
      </div>
    </div>
  );
}
