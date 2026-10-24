import type { Meta, StoryObj } from '@storybook/react';
import { Briefcase, CalendarCheck, Package, Users, Wrench } from '@phosphor-icons/react';
import { PlatformShell, type PlatformShellProps } from './PlatformShell';
import { Card } from './Card';

/** `navigation="menu"`: no sidebar. The rail's top tile is a Menu button opening the nav as a dropdown (active item marked); below lg the rail is hidden and the top-bar button opens the off-canvas nav with nav sections, Platforms and account links. The `aside` slot sits right of `main`; `main` is a size container. */
const meta: Meta = { title: 'Platform shell/Menu navigation', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

const base: Omit<PlatformShellProps, 'children'> = {
  navigation: 'menu',
  platform: { name: 'Portal', icon: Wrench },
  company: 'Montauto Repairs',
  platforms: [
    { id: 'inventory', label: 'Inventory', icon: Package, status: 'active' },
    { id: 'sms', label: 'SMS', icon: Wrench, status: 'degraded' },
  ],
  sections: [
    {
      items: [
        { key: 'home', label: 'Home', icon: CalendarCheck },
        { key: 'jobs', label: 'Jobs', icon: Briefcase, badge: '12' },
      ],
    },
    { title: 'Settings', items: [{ key: 'team', label: 'Team', icon: Users }] },
  ],
  activeKey: 'jobs',
  title: 'Jobs',
  account: { name: 'Maricel Santos', email: 'maricel@montauto.ph' },
};

const Content = () => (
  <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-2">
    <Card className="p-4"><p className="text-sm font-semibold text-ink">Jobs in progress</p><p className="mt-1 text-sm text-ink-muted">12 open jobs.</p></Card>
    <Card className="p-4"><p className="text-sm font-semibold text-ink">Ready for pickup</p><p className="mt-1 text-sm text-ink-muted">4 devices waiting.</p></Card>
  </div>
);

export const Default: Story = { render: () => <PlatformShell {...base}><Content /></PlatformShell> };
export const WithAside: Story = {
  name: 'With aside',
  render: () => (
    <PlatformShell
      {...base}
      aside={<div className="hidden w-[22.5rem] shrink-0 border-l border-border bg-surface p-4 text-sm text-ink-muted lg:block">Docked side panel</div>}
    >
      <Content />
    </PlatformShell>
  ),
};
/** Open at 390px to see the off-canvas nav focused on the active item. */
export const MobileNavOpen: Story = {
  name: 'Mobile nav open',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <PlatformShell {...base} menuOpen><Content /></PlatformShell>,
};
