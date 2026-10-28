import { useEffect, useState } from 'react';
import { ArrowsDownUp, FileText, House, List, ListChecks, Package, Receipt, SlidersHorizontal } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { AccountMenu, applyTheme } from '../components/AccountMenu';
import { AskLedaBar } from '../components/AskLedaBar';
import { CountBadge, IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer } from '../components/IconRail';
import { PlatformShell } from '../components/PlatformShell';
import { SettingsModal, type SettingsTabId, type SettingsTheme, type SettingsValue } from '../components/SettingsModal';
import { SheetBar, SheetBarWhere } from '../components/SheetBar';
import { InventoryStatusBar } from '../components/StatusBar';
import { cn } from '../utils/cn';
import { TENANTS, channelsFor, ledaScopeFor, notificationsFor, valueFor, type MySettingsRole, type MySettingsTenant } from './MySettings.data';

/* RDY-409. Page: My settings. `?settings=1|profile|display|notifications|leda|account` opens the modal (I20) over the page you are on (Home, handover 2.8);
   `?tenant=a|b`, `?as=manager|clerk|owner`, `?state=loading|error`, `?fail=1` (settings.js header 21-23). The Home sheet itself is RDY-403: this frame keeps the sheet empty. */
export interface MySettingsPageProps {
  tenant?: MySettingsTenant;
  as?: MySettingsRole;
  /** `?settings=`: a tab, or open on the last used one. */
  settings?: SettingsTabId | '1';
  state?: 'loading' | 'error';
  /** `?fail=1`: the first Save fails. */
  fail?: boolean;
}

const NAV: { id: string; label: string; short?: string; icon: PhosphorIcon; needs?: string; soon?: boolean }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'pos', label: 'Purchase orders', short: 'Orders', icon: Receipt },
  { id: 'moves', label: 'Movements', icon: ArrowsDownUp },
  { id: 'reports', label: 'Reports', icon: FileText, soon: true },
  { id: 'setup', label: 'Setup', icon: SlidersHorizontal, needs: 'setup', soon: true },
];

export function MySettingsPage({ tenant = 'a', as = 'manager', settings = '1', state, fail }: MySettingsPageProps) {
  const t = TENANTS[tenant];
  const me = t.people[as];
  const canSetup = as !== 'clerk';
  const [open, setOpen] = useState(true);
  const [theme, setTheme] = useState<SettingsTheme>('system');
  const [saved, setSaved] = useState<SettingsValue>(() => valueFor(as, me.phone));
  const [failed, setFailed] = useState(!!fail);
  useEffect(() => { setSaved(valueFor(as, me.phone)); setFailed(!!fail); setOpen(true); }, [tenant, as, fail, settings]);

  const items = NAV.filter((n) => !n.needs || canSetup);
  const platform = { name: t.platform, initials: t.initials };
  const rail = (
    <IconRailContent>
      <IconRailMark variant="letter" href="#portal" label="Back to the ReadyPH Portal" animate={false} />
      {items.map((n) => (n.soon
        ? <IconRailItem key={n.id} icon={n.icon} label={n.label} onClick={() => undefined} />
        : <IconRailItem key={n.id} icon={n.icon} label={n.label} href={`#${n.id}`} current={n.id === 'home'} />))}
      <IconRailSpacer />
      <IconRailFoot><AccountMenu name={me.name} email={me.email} role={me.roleLabel} initials={me.initials} applyToDocument={false} onSettings={() => setOpen(true)} /></IconRailFoot>
    </IconRailContent>
  );
  const tab = 'relative flex min-h-11 flex-col items-center justify-center gap-[3px] text-tiny text-muted';
  const phoneNav = (
    <div className="grid h-[60px] w-full grid-cols-5 items-stretch">
      {items.slice(0, 4).map((n) => (
        <a key={n.id} href={`#${n.id}`} aria-current={n.id === 'home' ? 'page' : undefined} className={cn(tab, n.id === 'home' && 'font-medium text-text')}>
          <n.icon size={20} aria-hidden />
          {n.short ?? n.label}
          {n.id === 'pos' && <CountBadge count={2} placement="tab" />}
        </a>
      ))}
      <button type="button" className={tab}><List size={20} aria-hidden />More</button>
    </div>
  );
  const topBar = (
    <>
      <span className="flex-none whitespace-nowrap text-[15px] font-semibold">{t.platform}</span>
      <span className="min-w-0 truncate text-[13px] text-muted max-[480px]:hidden">· Home</span>
      <span className="flex-1" />
      <button type="button" className="relative inline-flex h-9 flex-none items-center gap-1.5 rounded-control border border-control px-2.5 text-[13px] font-semibold text-text">
        <ListChecks size={18} aria-hidden />Order lists
        <span className="h-4 min-w-4 rounded-[3px] bg-text px-1 text-center text-tiny font-medium leading-4 text-surface">2</span>
      </button>
      <AskLedaBar variant="bar" scope="Home" shortcuts={false} />
      <span className="contents [&>button]:size-11"><AccountMenu name={me.name} email={me.email} role={me.roleLabel} initials={me.initials} applyToDocument={false} onSettings={() => setOpen(true)} /></span>
    </>
  );
  return (
    <>
      <PlatformShell
        railWidth="wide"
        railLabel="Inventory"
        rail={rail}
        topBar={topBar}
        phoneNav={phoneNav}
        heading={t.platform}
        hideSheetBarOnPhone
        sheetBar={<SheetBar wrapChildren={false} actionsFirst={false} actions={<AskLedaBar variant="bar" scope="Home" shortcuts={false} />}><SheetBarWhere platform={platform} page="Home" note={as !== 'manager' ? `Viewing as ${me.name.split(' ')[0]}, ${me.roleLabel.toLowerCase()}` : undefined} /></SheetBar>}
        statusLabel="Status"
        status={
          <InventoryStatusBar
            platform={platform}
            dataLink={tenant === 'a' ? { with: t.company, status: 'linked', since: '8:50', title: 'Parts and job orders' } : undefined}
            viewer={{ name: me.name.split(' ')[0], role: me.roleLabel }}
            leda={{ canDecide: as !== 'clerk', managerName: TENANTS[tenant].people.manager.name.split(' ')[0] }}
            updatedAt="9:12 AM"
          />
        }
      >
        <div className="p-pad" />
      </PlatformShell>
      <SettingsModal
        open={open}
        onOpenChange={setOpen}
        tab={settings === '1' ? undefined : settings}
        platform={t.platform}
        person={{ name: me.name, initials: me.initials, title: me.title, roleLabel: me.roleLabel }}
        notifications={notificationsFor(as)}
        channels={channelsFor(me.email)}
        ledaScope={ledaScopeFor(as)}
        value={saved}
        state={state}
        lastLoaded="9:10 AM"
        onRetry={() => undefined}
        savedAt="9:12 AM"
        portalHref="#portal"
        signOutHref="#signed-out"
        theme={theme}
        onThemeChange={(next) => { setTheme(next); applyTheme(next); }}
        onSave={(next) => {
          if (failed) {
            setFailed(false);
            throw new Error('fail');
          }
          setSaved(next);
        }}
      />
    </>
  );
}
