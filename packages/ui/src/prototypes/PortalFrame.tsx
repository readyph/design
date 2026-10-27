import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { BookOpen, FileText, Graph, House, List, Plus, Users, type Icon } from '@phosphor-icons/react';
import { AccountMenu } from '../components/AccountMenu';
import { IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer } from '../components/IconRail';
import { Menu } from '../components/Menu';
import { PlatformShell, type PlatformShellProps } from '../components/PlatformShell';
import { ReadyLogo } from '../components/ReadyMark';
import { cn, focusRing } from '../utils/cn';
import { focusIfLost } from '../utils/focusIfLost';
import { arrivedByNav, clearHandoff, type Dest } from './protoNav';

/**
 * Portal frame (prototype composition, NOT exported from the package index): the one chrome every Portal
 * prototype page wraps its content in. It fills PlatformShell's rail and phone slots so pages do not each
 * carry their own: the icon rail (Home, Platforms, Reports, Team, Memory, account), the phone top bar
 * (the Ready logo, page name, Leda entry, account avatar) and the phone nav (Home, Platforms, Reports, Team, More).
 * Everything else (place, sheetBar, sheetLabel, status, detail, actionBar, heading, children) is PlatformShell's own prop and passes straight through.
 */
export type PortalPage = 'home' | 'platforms' | 'reports' | 'team' | 'memory';

const PAGES: { id: PortalPage; label: string; icon: Icon; href: string }[] = [
  { id: 'home', label: 'Home', icon: House, href: '#home' },
  { id: 'platforms', label: 'Platforms', icon: Graph, href: '#platforms' },
  { id: 'reports', label: 'Reports', icon: FileText, href: '#reports' },
  { id: 'team', label: 'Team', icon: Users, href: '#team' },
  { id: 'memory', label: 'Memory', icon: BookOpen, href: '#memory' },
];
const DEST: Record<PortalPage, Dest> = { home: { to: 'home' }, platforms: { to: 'platforms' }, reports: { to: 'reports' }, team: { to: 'team' }, memory: { to: 'memory' } };
const byId = (id: PortalPage) => PAGES.find((p) => p.id === id)!;
/** Rail order as in the workshop shell.js: Home, Platforms, Reports, Team, Memory. */
const RAIL = ['home', 'platforms', 'reports', 'team', 'memory'].map((id) => byId(id as PortalPage));
/** Phone nav shows these four; Memory lives under More. */
const PHONE_TABS = PAGES.filter((p) => p.id !== 'memory');

export interface PortalFrameProps extends Omit<PlatformShellProps, 'rail' | 'railLabel' | 'phoneNav' | 'phoneNavLabel' | 'topBar'> {
  /** The page this is: marks its rail item and phone tab as current (a page under More marks More). */
  current: PortalPage;
  /** Phone top bar page name. Default: the current page's label. */
  pageName?: string;
  /** Phone top bar Leda entry (an icon button or your page's AskLedaBar), placed before the avatar. */
  leda?: ReactNode;
  /** Replaces the whole phone top bar (a detail screen's back bar). The avatar is yours to add then; the frame does not repeat it. */
  topBar?: ReactNode;
  /** Unread count on Team (rail and phone tab). */
  teamCount?: number;
  /** "Add a platform" in the rail and under More. Omit to hide it. */
  onAddPlatform?: () => void;
  /**
   * Called with the destination when a rail item, phone tab, More entry, the Ready mark or an account menu entry is chosen
   * (RDY-357, prototype navigation). Optional and additive: omitted, the links keep their plain `#` hrefs and nothing else changes.
   * A plain click on a link calls it instead of following the href; Ctrl/Cmd/Shift-click and middle-click keep the href.
   */
  onNavigate?: (dest: Dest) => void;
  /** Signed-in person for the account menu. */
  account?: { name: string; email: string; role: string; initials?: string };
}

const defaultAccount = { name: 'Ramon Dela Cruz', email: 'mon@delacruzauto.ph', role: 'Owner' };
const tabClass = cn(
  'relative flex min-h-11 flex-col items-center justify-center gap-[3px] rounded-chip text-tiny leading-5 text-muted',
  focusRing,
  'focus-visible:ring-offset-frame',
);

export function PortalFrame({ current, pageName, leda, topBar, teamCount = 0, onAddPlatform, account = defaultAccount, onNavigate, children, ...shell }: PortalFrameProps) {
  const link = (dest: Dest) => onNavigate ? {
    onClick: (e: MouseEvent<HTMLElement>) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      onNavigate(dest);
    },
  } : {};
  const acct = onNavigate ? { onSettings: () => onNavigate({ to: 'settings' }), onLogout: () => onNavigate({ to: 'logout' }) } : {};
  useArrivalFocus(!!onNavigate);
  const name = pageName ?? byId(current).label;
  // Workshop initials: the first letters of the first two words (Ramon Dela Cruz = RD), unless given.
  const acctInitials = account.initials ?? account.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
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
  const moreCurrent = current === 'memory';
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
          <button type="button" aria-current={moreCurrent ? "page" : undefined} className={cn(tabClass, moreCurrent && 'font-medium text-text')}>
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
  return <PlatformShell {...shell} rail={rail} railLabel="Portal" topBar={bar} phoneNav={phoneNav} phoneNavLabel="Portal">{children}</PlatformShell>;
}

/**
 * After an in-prototype navigation the destination story re-mounts: put focus on the page's heading, but only when this
 * mount follows a navigation (a fresh hand-off), and only while focus is lost (focusIfLost). Watches until the person
 * touches the page, because the heading can be swapped when a loading state ends.
 */
function useArrivalFocus(enabled: boolean) {
  const [arrived] = useState(() => enabled && arrivedByNav());
  useEffect(() => {
    if (!arrived) return;
    clearHandoff();
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
