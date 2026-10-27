import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { BookOpen, FileText, Graph, House, List, Plus, Users, type Icon } from '@phosphor-icons/react';
import { AccountMenu } from './AccountMenu';
import { AskLedaBar } from './AskLedaBar';
import { IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer } from './IconRail';
import { Menu } from './Menu';
import { PlatformShell, type PlatformShellProps } from './PlatformShell';
import { ReadyLogo } from './ReadyMark';
import { cn, focusRing } from '../utils/cn';
import { focusIfLost } from '../utils/focusIfLost';

/**
 * Portal frame (RDY-316, exported): the one chrome every Portal page wraps its content in. It fills PlatformShell's rail and phone slots so pages do not each
 * carry their own: the icon rail (Home, Platforms, Reports, Team, Memory, account), the phone top bar
 * (the Ready logo, page name, Leda entry, account avatar) and the phone nav (Home, Platforms, Reports, Team, More).
 * Everything else (place, sheetBar, sheetLabel, status, detail, actionBar, heading, children) is PlatformShell's own prop and passes straight through.
 */
export type PortalPage = 'home' | 'platforms' | 'reports' | 'team' | 'memory';
/** Where a frame control leads. No routing library lives here: the app maps it to its own routes (`onNavigate`). */
export type PortalDest = { to: PortalPage } | { to: 'settings' } | { to: 'logout' };

const PAGES: { id: PortalPage; label: string; icon: Icon; href: string }[] = [
  { id: 'home', label: 'Home', icon: House, href: '#home' },
  { id: 'platforms', label: 'Platforms', icon: Graph, href: '#platforms' },
  { id: 'reports', label: 'Reports', icon: FileText, href: '#reports' },
  { id: 'team', label: 'Team', icon: Users, href: '#team' },
  { id: 'memory', label: 'Memory', icon: BookOpen, href: '#memory' },
];
const DEST: Record<PortalPage, PortalDest> = { home: { to: 'home' }, platforms: { to: 'platforms' }, reports: { to: 'reports' }, team: { to: 'team' }, memory: { to: 'memory' } };
const byId = (id: PortalPage) => PAGES.find((p) => p.id === id)!;
/** Rail order as in the workshop shell.js: Home, Platforms, Reports, Team, Memory. */
const RAIL = ['home', 'platforms', 'reports', 'team', 'memory'].map((id) => byId(id as PortalPage));
/** Phone nav shows these four; Memory lives under More. */
const PHONE_TABS = PAGES.filter((p) => p.id !== 'memory');

export interface PortalFrameProps extends Omit<PlatformShellProps, 'rail' | 'railLabel' | 'phoneNav' | 'phoneNavLabel' | 'topBar'> {
  /** The page this is: marks its rail item and phone tab as current (Memory, under More, marks no tab, as in the workshop). */
  current: PortalPage;
  /** Phone top bar page name. Default: the current page's label. */
  pageName?: string;
  /** Phone top bar Leda entry (an icon button or your page's AskLedaBar), placed before the avatar. */
  leda?: ReactNode;
  /** Replaces the whole phone top bar (a detail screen's back bar). The avatar is yours to add then; the frame does not repeat it. */
  topBar?: ReactNode;
  /** Phone only: hide the bottom nav (the workshop's detail screens). Default false. */
  hidePhoneNav?: boolean;
  /** Unread count on Team (rail and phone tab). */
  teamCount?: number;
  /** "Add a platform" in the rail and under More. Omit to hide it. */
  onAddPlatform?: () => void;
  /**
   * Called with the destination when a rail item, phone tab, More entry, the Ready mark or an account menu entry is chosen
   * (RDY-357). Optional and additive: omitted, the links keep their plain `#` hrefs and nothing else changes.
   * A plain click on a link calls it instead of following the href; Ctrl/Cmd/Shift-click and middle-click keep the href.
   */
  onNavigate?: (dest: PortalDest) => void;
  /** Signed-in person for the account menu. */
  account?: PortalAccount;
  /** Move focus to the page's heading when the frame mounts after an in-app navigation. Read once, on mount. Default false. */
  focusOnArrival?: boolean;
}

export interface PortalAccount { name: string; email: string; role: string; initials?: string }

const defaultAccount: PortalAccount = { name: 'Ramon Dela Cruz', email: 'mon@delacruzauto.ph', role: 'Owner' };
/** Workshop initials: the first letters of the first two words (Ramon Dela Cruz = RD), unless given. */
const initialsFor = (a: PortalAccount) => a.initials ?? a.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
/** Plain click on a link reports the destination; Ctrl/Cmd/Shift/Alt-click and middle-click keep the href. */
function useLinkProps(onNavigate?: (dest: PortalDest) => void) {
  const link = (dest: PortalDest) => onNavigate ? {
    onClick: (e: MouseEvent<HTMLElement>) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      onNavigate(dest);
    },
  } : {};
  const acct = onNavigate ? { onSettings: () => onNavigate({ to: 'settings' }), onLogout: () => onNavigate({ to: 'logout' }) } : {};
  return { link, acct };
}
const tabClass = cn(
  'relative flex min-h-11 flex-col items-center justify-center gap-[3px] rounded-chip text-tiny leading-5 text-muted',
  focusRing,
);

export function PortalFrame({ current, pageName, leda, topBar, hidePhoneNav = false, teamCount = 0, onAddPlatform, account = defaultAccount, onNavigate, focusOnArrival = false, children, ...shell }: PortalFrameProps) {
  const { link, acct } = useLinkProps(onNavigate);
  useArrivalFocus(focusOnArrival);
  const name = pageName ?? byId(current).label;
  const acctInitials = initialsFor(account);
  const rail = (
    <IconRailContent>
      <IconRailMark href="#home" {...link({ to: 'home' })} />
      {RAIL.map((p) => <IconRailItem key={p.id} icon={p.icon} label={p.label} href={p.href} {...link(DEST[p.id])} current={p.id === current} count={p.id === 'team' ? teamCount : 0} />)}
      {onAddPlatform ? <IconRailItem icon={Plus} label="Add a platform" onClick={onAddPlatform} className="mt-2" /> : null}
      <IconRailSpacer />
      <IconRailFoot><AccountMenu name={account.name} email={account.email} role={account.role} initials={acctInitials} applyToDocument={false} {...acct} /></IconRailFoot>
    </IconRailContent>
  );
  const bar = topBar ?? (
    <>
      <ReadyLogo size={28} />
      <span className="min-w-0 flex-1 truncate text-[13px] leading-5 text-muted">{name}</span>
      {leda}
      <span className="contents [&>button]:size-11"><AccountMenu name={account.name} email={account.email} role={account.role} initials={acctInitials} applyToDocument={false} {...acct} /></span>
    </>
  );
  const phoneNav = (
    <div className="grid h-[60px] w-full grid-cols-5 items-stretch">
      {PHONE_TABS.map((p) => {
        const on = p.id === current;
        const n = p.id === 'team' ? teamCount : 0;
        return (
          <a key={p.id} href={p.href} {...link(DEST[p.id])} aria-current={on ? 'page' : undefined} aria-label={n ? `${p.label}, ${n}` : undefined} className={cn(tabClass, on && 'font-medium text-text')}>
            <p.icon size={20} aria-hidden />
            <span aria-hidden={n ? true : undefined}>{p.label}</span>
          </a>
        );
      })}
      <Menu
        side="top"
        align="end"
        trigger={
          <button type="button" className={tabClass}>
            <List size={20} aria-hidden />
            <span>More</span>
          </button>
        }
        items={[
          onNavigate ? { label: 'Memory', icon: BookOpen, onSelect: () => onNavigate(DEST.memory) } : { label: 'Memory', icon: BookOpen, href: byId('memory').href },
          ...(onAddPlatform ? [{ label: 'Add a platform', icon: Plus, onSelect: onAddPlatform }] : []),
        ]}
      />
    </div>
  );
  return <PlatformShell {...shell} rail={rail} railLabel="Portal" topBar={bar} phoneNav={hidePhoneNav || shell.detail ? undefined : phoneNav} phoneNavLabel="Portal">{children}</PlatformShell>;
}

export interface DetailTopBarProps {
  /** The back link (for example `<Breadcrumbs variant="phone" aria-label="Back" items={...} />`). */
  back: ReactNode;
  /** The detail screen's title. */
  title: ReactNode;
  /** Opens Leda. Renders the Ask Leda button; ignored when `leda` is given. */
  onAskLeda?: () => void;
  /** Scope in the Ask Leda button's accessible name. Default "your platforms". */
  ledaScope?: string;
  /** Replaces the default Ask Leda button. */
  leda?: ReactNode;
  account?: PortalAccount;
  /** Same as PortalFrame's: settings and log out report here. */
  onNavigate?: (dest: PortalDest) => void;
}

/**
 * Phone top bar for a detail screen: back link, title, Ask Leda, account avatar. Pass it as `PortalFrame`'s `topBar`
 * (which replaces the default bar), so a detail page no longer assembles it by hand.
 */
export function DetailTopBar({ back, title, onAskLeda, ledaScope = 'your platforms', leda, account = defaultAccount, onNavigate }: DetailTopBarProps) {
  const { acct } = useLinkProps(onNavigate);
  return (
    <>
      {back}
      <span className="min-w-0 flex-1 truncate font-semibold">{title}</span>
      {leda ?? <AskLedaBar variant="bar" scope={ledaScope} shortcuts={false} onOpen={onAskLeda ? () => onAskLeda() : undefined} />}
      <AccountMenu name={account.name} email={account.email} role={account.role} initials={initialsFor(account)} applyToDocument={false} {...acct} />
    </>
  );
}

/**
 * After an in-app navigation the destination re-mounts: put focus on the page's heading, but only when this
 * mount follows a navigation (`focusOnArrival`), and only while focus is lost (focusIfLost). Watches until the person
 * touches the page, because the heading can be swapped when a loading state ends.
 */
function useArrivalFocus(enabled: boolean) {
  const [arrived] = useState(enabled);
  useEffect(() => {
    if (!arrived) return;
    const move = () => {
      const h = Array.from(document.querySelectorAll<HTMLElement>('h1')).find((x) => x.getClientRects().length > 0 && !x.closest('.sb-nopreview'));
      if (!h) return;
      if (!h.hasAttribute('tabindex')) h.tabIndex = -1;
      focusIfLost(null, h, { preventScroll: true });
    };
    move();
    const mo = new MutationObserver(move);
    mo.observe(document.body, { childList: true, subtree: true });
    const stop = () => mo.disconnect();
    document.addEventListener('pointerdown', stop, { once: true, capture: true });
    document.addEventListener('keydown', stop, { once: true, capture: true });
    return () => { mo.disconnect(); document.removeEventListener('pointerdown', stop, true); document.removeEventListener('keydown', stop, true); };
  }, [arrived]);
}
