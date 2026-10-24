import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Briefcase, CalendarCheck, Package, Users, Wrench, BookOpen, CreditCard, User } from '@phosphor-icons/react';
import { PlatformShell, type PlatformShellPlatform, type PlatformShellProps } from '../components/PlatformShell';
import { Skeleton } from '../components/Skeleton';
import { Notice } from '../components/Notice';
import { Card } from '../components/Card';

const mobile = {
  layout: 'fullscreen',
  viewport: {
    viewports: { rs390: { name: 'Mobile 390', styles: { width: '390px', height: '844px' } } },
    defaultViewport: 'rs390',
  },
} as const;

const meta: Meta = {
  title: 'Patterns/Platform shell',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Shared shell for every tenant platform: platforms rail, sidebar, top bar. Pass `hideLeda={false}` to show the Ask-Leda launcher.' } },
  },
};
export default meta;
type Story = StoryObj;

const one: PlatformShellPlatform[] = [
  { id: 'inventory', label: 'Inventory', icon: Package, status: 'active' },
  { id: 'davao', label: 'SMS - Davao', icon: Wrench, status: 'active', active: true },
];
const many: PlatformShellPlatform[] = [
  { id: 'inventory', label: 'Inventory', icon: Package, status: 'active' },
  { id: 'davao', label: 'SMS - Davao', icon: Wrench, status: 'active', active: true },
  { id: 'cebu', label: 'SMS - Cebu', avatar: 'Cebu Branch', status: 'degraded' },
  { id: 'manila', label: 'SMS - Manila', avatar: 'Manila Branch', status: 'active' },
  { id: 'iloilo', label: 'SMS - Iloilo', avatar: 'Iloilo Branch', status: 'offline' },
];

const base: Omit<PlatformShellProps, 'children'> = {
  platform: { name: 'Davao branch', icon: Wrench },
  company: 'Montauto Repairs',
  platforms: one,
  sections: [
    {
      items: [
        { key: 'today', label: 'Today', icon: CalendarCheck },
        { key: 'jobs', label: 'Jobs', icon: Briefcase, badge: '12' },
        { key: 'customers', label: 'Customers', icon: Users },
      ],
    },
    { title: 'Manage', items: [{ key: 'catalogue', label: 'Catalogue', icon: BookOpen }] },
  ],
  activeKey: 'today',
  footerLink: { label: 'Back to Portal', onClick: () => {} },
  title: 'Today',
  account: {
    name: 'Maricel Santos',
    email: 'maricel@montauto.ph',
    items: [{ label: 'Account', icon: User }, { label: 'Billing', icon: CreditCard }],
  },
};

const Content = () => (
  <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-2">
    <Card className="p-4"><p className="text-sm font-semibold text-ink">Jobs in progress</p><p className="mt-1 text-sm text-ink-muted">12 open jobs across the branch.</p></Card>
    <Card className="p-4"><p className="text-sm font-semibold text-ink">Ready for pickup</p><p className="mt-1 text-sm text-ink-muted">4 devices waiting for customers.</p></Card>
  </div>
);

export const Default: Story = { render: () => <PlatformShell {...base}><Content /></PlatformShell> };
export const ManyPlatforms: Story = { name: 'Many platforms', render: () => <PlatformShell {...base} platforms={many}><Content /></PlatformShell> };
export const WithLeda: Story = { name: 'With Leda launcher', render: () => <PlatformShell {...base} hideLeda={false}><Content /></PlatformShell> };
export const Loading: Story = {
  render: () => (
    <PlatformShell {...base}>
      <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-2" aria-busy="true">
        <Skeleton className="h-24" /><Skeleton className="h-24" />
      </div>
    </PlatformShell>
  ),
};
export const ErrorState: Story = {
  name: 'Error',
  render: () => (
    <PlatformShell {...base}>
      <div className="p-4 sm:p-6"><Notice tone="error" title="Could not load today's jobs">Check your connection and try again.</Notice></div>
    </PlatformShell>
  ),
};
export const Mobile: Story = { name: 'Mobile 390', parameters: mobile, render: () => <PlatformShell {...base}><Content /></PlatformShell> };
export const MobileMenuOpen: Story = {
  name: 'Mobile 390 (menu open)',
  parameters: mobile,
  render: () => {
    const [open, setOpen] = useState(true);
    return <PlatformShell {...base} menuOpen={open} onMenuOpenChange={setOpen}><Content /></PlatformShell>;
  },
};
