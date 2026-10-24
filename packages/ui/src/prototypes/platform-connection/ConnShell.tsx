import { useState, type ReactNode } from 'react';
import { Package, Wrench, Gauge, ArrowsLeftRight, Receipt, ChartBar, Gear, SquaresFour, Users, BookOpen, House, CalendarCheck, ClipboardText, UsersThree, CreditCard, User, Storefront } from '@phosphor-icons/react';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/Select';
import { Toaster } from '../../components/toast/Toaster';
import { toast } from '../../components/toast/toastStore';
import { PlatformShell, type PlatformShellPlatform, type PlatformShellSection } from '../../components/PlatformShell';
import type { StatusTone } from '../../components/StatusDot';
import { COMPANY, PLATFORMS, PORTAL, type AppKey } from './data';

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
    name: 'Service Management System',
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
    ...(p.kind === 'sms' ? { avatar: p.label } : { icon: p.kind === 'storefront' ? Storefront : Package }),
  }));
}

/** Add platform: pick the kind and name it. Opened by the rail "+" and the Platforms page. */
export function AddPlatformModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [kind, setKind] = useState('sms');
  const [name, setName] = useState('');
  const [tried, setTried] = useState(false);
  const close = (o: boolean) => { onOpenChange(o); if (!o) { setName(''); setTried(false); } };
  const add = () => {
    if (!name.trim()) { setTried(true); return; }
    close(false);
    toast.success(`${name.trim()} added. Connect data to finish setup.`);
  };
  return (
    <Modal open={open} onOpenChange={close} title="Add a platform" description="Add Inventory or a SMS branch to Sunrise Auto Parts."
      footer={<><Button variant="subtle" onClick={() => close(false)}>Cancel</Button><Button onClick={add}>Add platform</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Platform name" required error={tried && !name.trim() ? 'Enter a name.' : undefined}><Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Iloilo branch" /></Field>
        <Field label="Type"><Select value={kind} onValueChange={setKind} options={[{ value: 'sms', label: 'Service Management System' }, { value: 'inventory', label: 'Inventory' }]} /></Field>
      </div>
    </Modal>
  );
}

const leave = (url: string) => () => window.location.assign(url);

/**
 * PlatformShell wired the way every app should be after RDY-120: one real rail, Account and Billing
 * in the account menu everywhere. In the Portal they switch the Settings tab (onAccountTab, or a link to
 * Portal Settings from other pages); in the other apps they leave to Portal Settings. "+" opens the Add
 * platform flow in the Portal and leaves to it elsewhere. Sign out confirms with a toast.
 */
export function ConnShell({
  app, activeKey, activeId = null, title, onAccountTab, onAddPlatform, children,
}: { app: AppKey; activeKey: string; activeId?: string | null; title?: ReactNode; onAccountTab?: (tab: 'account' | 'billing') => void; onAddPlatform?: () => void; children: ReactNode }) {
  const cfg = NAV[app];
  const [addOpen, setAddOpen] = useState(false);
  const goTab = (tab: 'account' | 'billing') => (onAccountTab ? () => onAccountTab(tab) : leave(`${PORTAL}/settings?tab=${tab}`));
  const add = onAddPlatform ?? (app === 'portal' ? () => setAddOpen(true) : leave(`${PORTAL}/platforms?add=1`));
  return (
    <PlatformShell
      platform={{ name: cfg.name, icon: cfg.icon }}
      company={COMPANY}
      platforms={railFor(activeId)}
      sections={cfg.sections}
      activeKey={activeKey}
      title={title ?? <span className="text-sm font-semibold text-ink">{COMPANY}</span>}
      actions={<></>}
      homeHref={PORTAL}
      onAddPlatform={add}
      footerLink={cfg.footer ? { label: cfg.footer, href: PORTAL } : undefined}
      account={{
        name: 'Maria Santos',
        email: 'maria@sunrise.ph',
        items: [
          { label: 'Account', icon: User, onSelect: goTab('account') },
          { label: 'Billing', icon: CreditCard, onSelect: goTab('billing') },
        ],
        onSignOut: () => toast.success('Signed out of Portal, Inventory and SMS.'),
      }}
    >
      {children}
      {app === 'portal' && !onAddPlatform && <AddPlatformModal open={addOpen} onOpenChange={setAddOpen} />}
      <Toaster position="bottom-right" />
    </PlatformShell>
  );
}
