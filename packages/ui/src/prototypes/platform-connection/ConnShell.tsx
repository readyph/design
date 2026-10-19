import type { ReactNode } from 'react';
import { Package, Wrench, Gauge, ArrowsLeftRight, Receipt, ChartBar, Gear, SquaresFour, Users, BookOpen, House, CalendarCheck, ClipboardText, UsersThree, CreditCard, User, Storefront } from '@phosphor-icons/react';
import { Toaster } from '../../components/toast/Toaster';
import { PlatformShell, type PlatformShellPlatform, type PlatformShellSection } from '../../components/PlatformShell';
import type { StatusTone } from '../../components/StatusDot';
import { COMPANY, PLATFORMS, type AppKey } from './data';

const NAV: Record<AppKey, { name: string; icon: typeof Package; sections: PlatformShellSection[]; footer?: string }> = {
  portal: {
    name: 'Portal',
    icon: House,
    sections: [
      { items: [
        { key: 'home', label: 'Home', icon: House }, { key: 'reports', label: 'Reports', icon: ChartBar },
        { key: 'team', label: 'Team', icon: Users }, { key: 'platforms', label: 'Platforms', icon: SquaresFour }, { key: 'memory', label: 'Memory', icon: BookOpen },
      ] },
      { title: 'Settings', items: [{ key: 'settings', label: 'Settings', icon: Gear }] },
    ],
  },
  inventory: {
    name: 'Inventory',
    icon: Package,
    footer: 'Back to Portal',
    sections: [
      { items: [
        { key: 'dashboard', label: 'Dashboard', icon: Gauge }, { key: 'products', label: 'Products', icon: Package },
        { key: 'movements', label: 'Stock & Movements', icon: ArrowsLeftRight }, { key: 'purchase-orders', label: 'Purchase Orders', icon: Receipt }, { key: 'reports', label: 'Reports', icon: ChartBar },
      ] },
      { title: 'Manage', items: [{ key: 'settings', label: 'Settings', icon: Gear }] },
    ],
  },
  repair: {
    name: 'Repair shop',
    icon: Wrench,
    footer: 'Back to Portal',
    sections: [
      { items: [
        { key: 'today', label: 'Today', icon: CalendarCheck }, { key: 'jobs', label: 'Jobs', icon: ClipboardText }, { key: 'customers', label: 'Customers', icon: UsersThree },
      ] },
      { title: 'Manage', items: [{ key: 'catalogue', label: 'Catalogue', icon: BookOpen }, { key: 'settings', label: 'Settings', icon: Gear }] },
    ],
  },
};

const tone: Record<string, StatusTone> = { active: 'active', degraded: 'degraded', offline: 'offline' };

/** The one rail every app renders: the tenant's real platforms, each a real link to its own app. */
export function railFor(activeId: string | null): PlatformShellPlatform[] {
  return PLATFORMS.map((p) => ({
    id: p.id,
    label: p.label,
    status: tone[p.status],
    active: p.id === activeId,
    href: `https://${p.appUrl}`,
    ...(p.kind === 'repair_shop' ? { avatar: p.label } : { icon: p.kind === 'storefront' ? Storefront : Package }),
  }));
}

/**
 * PlatformShell wired the way every app should be after RDY-120: one real rail, Account and Billing
 * in the account menu everywhere (in the Portal they open Settings tabs, in the other apps they leave
 * to the Portal), "Back to Portal" footer outside the Portal.
 */
export function ConnShell({
  app, activeKey, activeId = null, title, children,
}: { app: AppKey; activeKey: string; activeId?: string | null; title?: ReactNode; children: ReactNode }) {
  const cfg = NAV[app];
  return (
    <PlatformShell
      platform={{ name: cfg.name, icon: cfg.icon }}
      company={COMPANY}
      platforms={railFor(activeId)}
      sections={cfg.sections}
      activeKey={activeKey}
      title={title ?? <span className="text-sm font-semibold text-ink">{COMPANY}</span>}
      actions={<span />}
      homeHref="https://portal.readyph.app"
      onAddPlatform={() => undefined}
      footerLink={cfg.footer ? { label: cfg.footer, href: 'https://portal.readyph.app' } : undefined}
      account={{
        name: 'Maria Santos',
        email: 'maria@sunrise.ph',
        items: [
          { label: 'Account', icon: User, onSelect: () => undefined },
          { label: 'Billing', icon: CreditCard, onSelect: () => undefined },
        ],
        onSignOut: () => undefined,
      }}
    >
      {children}
      <Toaster position="bottom-right" />
    </PlatformShell>
  );
}
