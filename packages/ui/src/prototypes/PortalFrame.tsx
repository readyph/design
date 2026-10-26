import type { ReactNode } from 'react';
import { BookOpen, FileText, Graph, House, List, Plus, Users, type Icon } from '@phosphor-icons/react';
import { AccountMenu } from '../components/AccountMenu';
import { IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer, CountBadge } from '../components/IconRail';
import { Menu } from '../components/Menu';
import { PlatformShell, type PlatformShellProps } from '../components/PlatformShell';
import { cn, focusRing } from '../utils/cn';

/**
 * Portal frame (prototype composition, NOT exported from the package index): the one chrome every Portal
 * prototype page wraps its content in. It fills PlatformShell's rail and phone slots so pages do not each
 * carry their own: the icon rail (Home, Platforms, Reports, Team, Memory, account), the phone top bar
 * (ReadyPH, page name, Leda entry, account avatar) and the phone nav (Home, Platforms, Reports, Team, More).
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
const byId = (id: PortalPage) => PAGES.find((p) => p.id === id)!;
/** Rail order: Memory before Team. */
const RAIL = ['home', 'platforms', 'reports', 'memory', 'team'].map((id) => byId(id as PortalPage));
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
  /** Signed-in person for the account menu. */
  account?: { name: string; email: string; role: string };
}

const defaultAccount = { name: 'Maria Santos', email: 'mon@delacruz.ph', role: 'Owner' };
const tabClass = cn(
  'relative flex min-h-11 flex-col items-center justify-center gap-[3px] rounded-control text-small text-muted',
  focusRing,
  'focus-visible:ring-offset-frame',
);

export function PortalFrame({ current, pageName, leda, topBar, teamCount = 0, onAddPlatform, account = defaultAccount, children, ...shell }: PortalFrameProps) {
  const name = pageName ?? byId(current).label;
  const rail = (
    <IconRailContent>
      <IconRailMark href="#home" />
      {RAIL.map((p) => <IconRailItem key={p.id} icon={p.icon} label={p.label} href={p.href} current={p.id === current} count={p.id === 'team' ? teamCount : 0} />)}
      {onAddPlatform ? <IconRailItem icon={Plus} label="Add a platform" onClick={onAddPlatform} className="mt-2" /> : null}
      <IconRailSpacer />
      <IconRailFoot><AccountMenu name={account.name} email={account.email} role={account.role} applyToDocument={false} /></IconRailFoot>
    </IconRailContent>
  );
  const bar = topBar ?? (
    <>
      <span className="font-semibold">ReadyPH</span>
      <span className="min-w-0 flex-1 truncate text-muted">{name}</span>
      {leda}
      <AccountMenu name={account.name} email={account.email} role={account.role} applyToDocument={false} />
    </>
  );
  const moreCurrent = current === 'memory';
  const phoneNav = (
    <div className="grid h-[60px] w-full grid-cols-5 items-stretch px-1">
      {PHONE_TABS.map((p) => {
        const on = p.id === current;
        const n = p.id === 'team' ? teamCount : 0;
        return (
          <a key={p.id} href={p.href} aria-current={on ? 'page' : undefined} aria-label={n ? `${p.label}, ${n}` : undefined} className={cn(tabClass, on && 'bg-frame-active font-medium text-text')}>
            <p.icon size={20} aria-hidden />
            <span aria-hidden={n ? true : undefined}>{p.label}</span>
            <CountBadge count={n} />
          </a>
        );
      })}
      <Menu
        side="top"
        align="end"
        trigger={
          <button type="button" aria-current={moreCurrent ? "page" : undefined} className={cn(tabClass, moreCurrent && 'bg-frame-active font-medium text-text')}>
            <List size={20} aria-hidden />
            <span>More</span>
          </button>
        }
        items={[
          { label: 'Memory', icon: BookOpen, href: byId('memory').href },
          ...(onAddPlatform ? [{ label: 'Add a platform', icon: Plus, onSelect: onAddPlatform }] : []),
        ]}
      />
    </div>
  );
  return <PlatformShell {...shell} rail={rail} railLabel="Portal" topBar={bar} phoneNav={phoneNav} phoneNavLabel="Portal">{children}</PlatformShell>;
}
