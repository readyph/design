import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ArrowSquareOut, LinkSimple, Plus, Warning, Package, Wrench, Buildings, Clock, CreditCard, User, Check } from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Notice } from '../../components/Notice';
import { PageHeader } from '../../components/PageHeader';
import { ProgressBar } from '../../components/ProgressBar';
import { Select } from '../../components/Select';
import { SettingsSection } from '../../components/SettingsSection';
import { Skeleton } from '../../components/Skeleton';
import { StatusDot } from '../../components/StatusDot';
import { Tabs, TabPanel } from '../../components/Tabs';
import { Page } from '../repair-shop/Page';
import { RetryNotice } from '../repair-shop/Page';
import { mobile } from '../repair-shop/params';
import { ConnShell } from './ConnShell';
import { PLATFORMS, type DemoPlatform } from './data';

/** PROTOTYPE (RDY-120) - Portal: Platforms launch, Settings (Company, Account, Billing) and Team invite. */
const meta: Meta = { title: 'Platform connection/Portal', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

type Launch = 'idle' | 'opening' | 'unreachable';

function PlatformCard({ p, launch, onOpen }: { p: DemoPlatform; launch: Launch; onOpen: () => void }) {
  const offline = p.status === 'offline' && !p.setupNeeded;
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface-muted text-ink"><Icon icon={p.kind === 'inventory' ? Package : Wrench} size="md" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{p.label}</span>
            <span className="flex items-center gap-1 text-xs text-ink-muted"><StatusDot status={p.status === 'offline' ? 'offline' : p.status} /> {p.setupNeeded ? 'Setup needed' : p.status === 'active' ? 'Active' : p.status === 'degraded' ? 'Degraded' : 'Offline'}</span>
          </div>
          <p className="mt-1 text-sm">{p.setupNeeded ? 'No data source linked yet' : p.metric}</p>
          <p className="text-xs text-ink-subtle">{p.kind === 'inventory' ? 'Inventory' : 'Repair shop'} - {p.appUrl}</p>
        </div>
      </div>
      {launch === 'unreachable' && !p.setupNeeded && <Notice tone="error" className="mt-3" title="Couldn't open Davao branch">The app didn't respond. Try again, or check the platform status.</Notice>}
      <div className="mt-4 flex items-center gap-2">
        {p.setupNeeded ? (
          <Button size="sm" leftIcon={LinkSimple}>Finish setup</Button>
        ) : (
          <Button size="sm" leftIcon={ArrowSquareOut} loading={launch === 'opening'} disabled={offline} onClick={onOpen}>{launch === 'opening' ? 'Opening' : 'Open'}</Button>
        )}
        <Button size="sm" variant="secondary" leftIcon={LinkSimple}>Connect data</Button>
      </div>
    </Card>
  );
}

function PlatformsPage({ state = 'default', launch = 'idle' }: { state?: 'default' | 'loading' | 'empty' | 'error'; launch?: Launch }) {
  return (
    <ConnShell app="portal" activeKey="platforms" title={<span className="text-sm font-semibold">Connected platforms</span>}>
      <Page>
        <PageHeader title="Connected platforms" description={state === 'default' ? '3 platforms - 2 branches - 1 data link' : undefined} actions={<Button leftIcon={Plus}>Add platform</Button>} />
        {state === 'loading' && <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><Skeleton height={150} /><Skeleton height={150} /></div>}
        {state === 'error' && <RetryNotice title="Couldn't load your platforms">Check your connection and try again.</RetryNotice>}
        {state === 'empty' && <EmptyState icon={Package} title="No platforms yet" description="Add Inventory or a Repair shop branch to start." action={<Button leftIcon={Plus}>Add platform</Button>} />}
        {state === 'default' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{PLATFORMS.map((p) => <PlatformCard key={p.id} p={p} launch={p.id === 'rs-dvo' ? launch : 'idle'} onOpen={() => undefined} />)}</div>
        )}
        {state === 'default' && <Notice tone="neutral">Open signs you in to the platform automatically. The menu no longer lists View activity until an activity feed exists.</Notice>}
      </Page>
    </ConnShell>
  );
}

export const PlatformsDefault: Story = { name: 'Platforms - default (Open, Finish setup, offline)', render: () => <PlatformsPage /> };
export const PlatformsOpening: Story = { name: 'Platforms - opening (handoff in progress)', render: () => <PlatformsPage launch="opening" /> };
export const PlatformsUnreachable: Story = { name: 'Platforms - app unreachable', render: () => <PlatformsPage launch="unreachable" /> };
export const PlatformsLoading: Story = { name: 'Platforms - loading', render: () => <PlatformsPage state="loading" /> };
export const PlatformsEmpty: Story = { name: 'Platforms - empty', render: () => <PlatformsPage state="empty" /> };
export const PlatformsError: Story = { name: 'Platforms - error', render: () => <PlatformsPage state="error" /> };

type SettingsState = 'default' | 'loading' | 'error' | 'saved' | 'validation';

function CompanyTab({ state }: { state: SettingsState }) {
  if (state === 'loading') return <div className="pt-6"><Skeleton height={320} /></div>;
  if (state === 'error') return <div className="pt-6"><RetryNotice title="Couldn't load the company" /></div>;
  return (
    <div className="space-y-4 pt-6">
      {state === 'saved' && <Notice tone="success" icon={Check}>Company profile saved.</Notice>}
      <SettingsSection title="Company profile" description="Customers see this. Leda answers inquiries from it." actions={<Button size="sm">Save</Button>}>
        <Field label="Company name"><Input defaultValue="Sunrise Auto Parts" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Contact email" error={state === 'validation' ? 'Enter a valid email.' : undefined}><Input type="email" defaultValue={state === 'validation' ? 'hello@sunrise' : 'hello@sunrise.ph'} /></Field>
          <Field label="Phone"><Input placeholder="Add a phone number" /></Field>
        </div>
        <Field label="Address"><Input placeholder="Add your business address" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Website"><Input placeholder="example.com" /></Field>
          <Field label="Timezone"><Select value="Asia/Manila" onValueChange={() => undefined} options={[{ value: 'Asia/Manila', label: 'Asia/Manila (GMT+8)' }]} /></Field>
        </div>
      </SettingsSection>
      <Notice tone="neutral">Every field here is saved to the company. Fields with no value show their own prompt instead of sample data.</Notice>
    </div>
  );
}

function AccountTab() {
  return (
    <div className="space-y-4 pt-6">
      <SettingsSection title="Your profile" actions={<Button size="sm">Save</Button>}>
        <Field label="Full name"><Input defaultValue="Maria Santos" /></Field>
        <Field label="Email" hint="Sign-in email. Contact your owner to change it."><Input defaultValue="maria@sunrise.ph" disabled /></Field>
      </SettingsSection>
      <SettingsSection title="Password" description="Used across Portal, Inventory and Repair shop." actions={<Button size="sm" variant="secondary">Change password</Button>}>
        <p className="text-sm text-ink-muted">Changing it signs you out of every app.</p>
      </SettingsSection>
    </div>
  );
}

function UsageRow({ label, value, pct }: { label: string; value: string; pct: number }) {
  return <div><div className="mb-1 flex justify-between text-sm"><span className="text-ink-muted">{label}</span><span className="tabular-nums">{value}</span></div><ProgressBar value={pct} /></div>;
}

function BillingTab({ state }: { state: SettingsState }) {
  if (state === 'loading') return <div className="pt-6"><Skeleton height={260} /></div>;
  if (state === 'error') return <div className="pt-6"><RetryNotice title="Couldn't load plan and usage" /></div>;
  return (
    <div className="space-y-4 pt-6">
      <SettingsSection title="Plan" description="Your current subscription." actions={<Button size="sm" variant="secondary">Request plan change</Button>}>
        <div className="flex items-center gap-3"><span className="text-lg font-semibold">Starter</span><Badge tone="success" size="sm">Active</Badge></div>
        <ul className="space-y-1 text-sm text-ink-muted"><li>Up to 3 platforms and 10 team members</li><li>1,000 Leda messages per month</li></ul>
      </SettingsSection>
      <SettingsSection title="Usage this month" description="Resets on the 1st. Usage is measured, not yet billed.">
        <div className="space-y-4">
          <UsageRow label="Leda messages" value="640 of 1,000" pct={64} />
          <UsageRow label="Platforms" value="3 of 3" pct={100} />
          <UsageRow label="Team members" value="8 of 10" pct={80} />
        </div>
        {state === 'saved' && <Notice tone="warning" icon={Warning}>You are at your platform limit. Request a plan change to connect more.</Notice>}
      </SettingsSection>
      <Notice tone="neutral" icon={CreditCard}>Payments and invoices are out of scope for this phase (decision on the ticket). Plan changes are handled by our team within one business day.</Notice>
    </div>
  );
}

function SettingsPage({ tab = 'company', state = 'default' }: { tab?: string; state?: SettingsState }) {
  const [t, setT] = useState(tab);
  return (
    <ConnShell app="portal" activeKey="settings" title={<span className="text-sm font-semibold">Settings</span>}>
      <Page width="form">
        <Tabs value={t} onValueChange={setT} items={[
          { value: 'company', label: 'Company', icon: Buildings }, { value: 'schedule', label: 'Schedule', icon: Clock },
          { value: 'account', label: 'Account', icon: User }, { value: 'billing', label: 'Billing', icon: CreditCard },
        ]}>
          <TabPanel value="company"><CompanyTab state={state} /></TabPanel>
          <TabPanel value="schedule"><div className="pt-6"><Notice tone="neutral">Schedule is unchanged: saved business hours per day (already wired).</Notice></div></TabPanel>
          <TabPanel value="account"><AccountTab /></TabPanel>
          <TabPanel value="billing"><BillingTab state={state} /></TabPanel>
        </Tabs>
      </Page>
    </ConnShell>
  );
}

export const SettingsCompany: Story = { name: 'Settings - Company (all fields saved)', render: () => <SettingsPage /> };
export const SettingsCompanyValidation: Story = { name: 'Settings - Company validation', render: () => <SettingsPage state="validation" /> };
export const SettingsCompanySaved: Story = { name: 'Settings - Company saved', render: () => <SettingsPage state="saved" /> };
export const SettingsCompanyLoading: Story = { name: 'Settings - Company loading', render: () => <SettingsPage state="loading" /> };
export const SettingsCompanyError: Story = { name: 'Settings - Company error', render: () => <SettingsPage state="error" /> };
export const SettingsAccount: Story = { name: 'Settings - Account (new)', render: () => <SettingsPage tab="account" /> };
export const SettingsBilling: Story = { name: 'Settings - Billing (plan and usage)', render: () => <SettingsPage tab="billing" /> };
export const SettingsBillingAtLimit: Story = { name: 'Settings - Billing at limit', render: () => <SettingsPage tab="billing" state="saved" /> };
export const SettingsBillingLoading: Story = { name: 'Settings - Billing loading', render: () => <SettingsPage tab="billing" state="loading" /> };
export const SettingsBillingError: Story = { name: 'Settings - Billing error', render: () => <SettingsPage tab="billing" state="error" /> };
export const SettingsBillingMobile: Story = { name: 'Settings - Billing mobile 390', parameters: mobile, render: () => <SettingsPage tab="billing" /> };

export const TeamInvite: Story = {
  name: 'Team - Invite member modal',
  render: () => (
    <ConnShell app="portal" activeKey="team" title={<span className="text-sm font-semibold">Team</span>}>
      <Page>
        <PageHeader title="Team" actions={<Button leftIcon={Plus}>Invite member</Button>} />
        <Modal open onOpenChange={() => undefined} title="Invite a team member" description="They get an email to join and choose which platforms they can use."
          footer={<><Button variant="subtle">Cancel</Button><Button>Send invite</Button></>}>
          <div className="space-y-4">
            <Field label="Email" required><Input type="email" placeholder="name@company.ph" /></Field>
            <Field label="Role"><Select value="staff" onValueChange={() => undefined} options={[{ value: 'staff', label: 'Staff' }, { value: 'mechanic', label: 'Mechanic' }, { value: 'admin', label: 'Admin' }]} /></Field>
            <Field label="Platform access" hint="Inventory and each Repair shop branch can be allowed separately."><Select value="all" onValueChange={() => undefined} options={[{ value: 'all', label: 'All platforms' }, { value: 'inv', label: 'Main inventory only' }]} /></Field>
          </div>
        </Modal>
      </Page>
    </ConnShell>
  ),
};
