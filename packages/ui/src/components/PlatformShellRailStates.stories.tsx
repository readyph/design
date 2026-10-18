import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Briefcase, CalendarCheck, Package, Users, Wrench } from '@phosphor-icons/react';
import { PlatformShell, type PlatformShellPlatform, type PlatformShellProps } from './PlatformShell';
import { Card } from './Card';

/** Platform shell rail states. The rail never goes blank: loading shows three quiet placeholder tiles (opacity pulse only with motion allowed); error shows one short line and a Retry button. The Portal tile, "+" and account menu stay in every state. */
const meta: Meta = { title: 'Platform shell/Rail states', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

const platforms: PlatformShellPlatform[] = [
  { id: 'inventory', label: 'Inventory', icon: Package, status: 'active' },
  { id: 'davao', label: 'Repair shop - Davao', icon: Wrench, status: 'active', active: true },
  { id: 'cebu', label: 'Repair shop - Cebu', avatar: 'Cebu Branch', status: 'degraded' },
];

const base: Omit<PlatformShellProps, 'children'> = {
  platform: { name: 'Davao branch', icon: Wrench },
  company: 'Montauto Repairs',
  platforms,
  sections: [
    {
      items: [
        { key: 'today', label: 'Today', icon: CalendarCheck },
        { key: 'jobs', label: 'Jobs', icon: Briefcase, badge: '12' },
        { key: 'customers', label: 'Customers', icon: Users },
      ],
    },
  ],
  activeKey: 'today',
  footerLink: { label: 'Back to Portal', onClick: () => {} },
  title: 'Today',
  account: { name: 'Maricel Santos', email: 'maricel@montauto.ph' },
};

const Content = () => (
  <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-2">
    <Card className="p-4"><p className="text-sm font-semibold text-ink">Jobs in progress</p><p className="mt-1 text-sm text-ink-muted">12 open jobs across the branch.</p></Card>
    <Card className="p-4"><p className="text-sm font-semibold text-ink">Ready for pickup</p><p className="mt-1 text-sm text-ink-muted">4 devices waiting for customers.</p></Card>
  </div>
);

export const Ready: Story = { render: () => <PlatformShell {...base} railState="ready"><Content /></PlatformShell> };
export const Loading: Story = { render: () => <PlatformShell {...base} railState="loading"><Content /></PlatformShell> };
export const ErrorState: Story = {
  name: 'Error',
  render: () => <PlatformShell {...base} railState="error" onRetryPlatforms={() => {}}><Content /></PlatformShell>,
};
/** Retry moves error to loading, then ready. */
export const RetryFlow: Story = {
  name: 'Retry flow',
  render: () => {
    const [state, setState] = useState<'error' | 'loading' | 'ready'>('error');
    return (
      <PlatformShell
        {...base}
        railState={state}
        onRetryPlatforms={() => {
          setState('loading');
          setTimeout(() => setState('ready'), 1500);
        }}
      >
        <Content />
      </PlatformShell>
    );
  },
};
