import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Package, Tag, Truck, PlugsConnected, Plus, ArrowSquareOut, Wrench, Warning, WifiSlash, Lock } from '@phosphor-icons/react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { Input } from '../../components/Input';
import { Notice } from '../../components/Notice';
import { PageHeader } from '../../components/PageHeader';
import { SettingsSection } from '../../components/SettingsSection';
import { Spinner } from '../../components/Spinner';
import { StatusDot } from '../../components/StatusDot';
import { Tabs, TabPanel } from '../../components/Tabs';
import { Badge } from '../../components/Badge';
import { Page } from '../repair-shop/Page';
import { mobile } from '../repair-shop/params';
import { ConnShell } from './ConnShell';

/** PROTOTYPE (RDY-120) - Inventory and Repair shop: connected rail, trimmed Settings, working links to the Portal, and the cross-app handoff states. */
const meta: Meta = { title: 'Platform connection/Inventory and Repair shop', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

function InventorySettings({ tab = 'categories' }: { tab?: string }) {
  const [t, setT] = useState(tab);
  return (
    <ConnShell app="inventory" activeKey="settings" activeId="inv" title={<span className="text-sm font-semibold">Settings</span>}>
      <Page width="detail">
        <PageHeader title="Settings" description="Catalog structure, suppliers, and platform connection." />
        <Tabs variant="underline" value={t} onValueChange={setT} items={[
          { value: 'categories', label: 'Categories', icon: Tag }, { value: 'suppliers', label: 'Suppliers', icon: Truck }, { value: 'platform', label: 'Platform', icon: PlugsConnected },
        ]}>
          <TabPanel value="categories"><Notice tone="neutral">Unchanged: add and delete categories (already wired). Units and Reorder defaults tabs are removed; unit and reorder level stay on each product.</Notice></TabPanel>
          <TabPanel value="suppliers"><Notice tone="neutral">Unchanged: add and delete suppliers (already wired).</Notice></TabPanel>
          <TabPanel value="platform">
            <div className="space-y-4">
              <SettingsSection title="Connection" description="Live status from the Portal.">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary-50 text-primary-700"><Icon icon={Package} size="md" weight="fill" /></span>
                  <div className="flex-1"><p className="flex items-center gap-2 text-sm font-medium">Main inventory <StatusDot status="active" label="Active" /></p><p className="text-xs text-ink-subtle">Shared with Davao branch (stock and catalog)</p></div>
                  <Button size="sm" variant="secondary" rightIcon={ArrowSquareOut}>Manage in Portal</Button>
                </div>
              </SettingsSection>
              <Notice tone="neutral">Account and Billing: top-left menu opens Portal Settings. Billing is a company-level setting and lives only in the Portal.</Notice>
            </div>
          </TabPanel>
        </Tabs>
      </Page>
    </ConnShell>
  );
}

export const InventorySettingsCategories: Story = { name: 'Inventory - Settings (Units and Reorder tabs removed)', render: () => <InventorySettings /> };
export const InventorySettingsPlatform: Story = { name: 'Inventory - Settings > Platform (real connection)', render: () => <InventorySettings tab="platform" /> };
export const InventoryRailBranches: Story = {
  name: 'Inventory - rail lists real platforms incl. Repair shop branches',
  render: () => (
    <ConnShell app="inventory" activeKey="dashboard" activeId="inv" title={<span className="text-sm font-semibold">Dashboard</span>}>
      <Page><PageHeader title="Dashboard" /><Notice tone="neutral">Rail: Main inventory (active), Davao branch, Cagayan branch (offline, setup needed). Each tile opens its app; the "+" opens Portal &gt; Platforms &gt; Add. The hard-coded Mobile app and Storefront tiles are gone.</Notice></Page>
    </ConnShell>
  ),
};
export const InventoryMobile: Story = { name: 'Inventory - mobile 390 (menu works)', parameters: mobile, render: () => <InventorySettings tab="platform" /> };

function RepairSettings() {
  return (
    <ConnShell app="repair" activeKey="settings" activeId="rs-dvo" title={<span className="text-sm font-semibold">Sunrise Auto Parts / Davao branch</span>}>
      <Page width="detail">
        <PageHeader title="Settings" description="Davao branch" />
        <SettingsSection title="Branch" description="Name and status are managed in the Portal." actions={<Button size="sm" variant="secondary" rightIcon={ArrowSquareOut}>Manage in Portal</Button>}>
          <Field label="Branch name"><Input value="Davao branch" disabled readOnly /></Field>
        </SettingsSection>
        <SettingsSection title="Parts source" description="Where parts and stock levels come from.">
          <div className="flex items-center gap-3 text-sm"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-50 text-primary-700"><Icon icon={Package} size="md" /></span><div className="flex-1"><p className="font-medium">Main inventory</p><p className="text-xs text-ink-subtle">Linked - 214 products</p></div><Badge tone="success" size="sm">Linked</Badge></div>
        </SettingsSection>
        <SettingsSection title="Team access" description="Who can use this branch.">
          <p className="text-sm text-ink-muted">4 members. Invite or change access from Portal &gt; Team.</p>
          <Button size="sm" variant="secondary" rightIcon={ArrowSquareOut}>Manage team</Button>
        </SettingsSection>
      </Page>
    </ConnShell>
  );
}
export const RepairShopSettings: Story = { name: 'Repair shop - Settings (new)', render: () => <RepairSettings /> };

export const RepairPartsNoInventory: Story = {
  name: 'Repair shop - Catalogue > Parts with no inventory linked',
  render: () => (
    <ConnShell app="repair" activeKey="catalogue" activeId="rs-cdo" title={<span className="text-sm font-semibold">Sunrise Auto Parts / Cagayan branch</span>}>
      <Page>
        <PageHeader title="Catalogue" />
        <EmptyState icon={Package} title="No inventory linked" description="Parts come from a linked Inventory. Until one is linked, parts are entered manually on each job."
          action={<Button rightIcon={ArrowSquareOut}>Connect inventory in Portal</Button>} />
      </Page>
    </ConnShell>
  ),
};

export const RepairTodayNewQuotation: Story = {
  name: 'Repair shop - Today > New quotation',
  render: () => (
    <ConnShell app="repair" activeKey="today" activeId="rs-dvo" title={<span className="text-sm font-semibold">Sunrise Auto Parts / Davao branch</span>}>
      <Page>
        <PageHeader title="Today" description="Davao branch" actions={<Button leftIcon={Plus}>New quotation</Button>} />
        <Notice tone="neutral">New quotation opens the quotation intake from prototype RDY-18 (Repair shop / Quotation intake). It does not route to /jobs/new, which the app reads as a job id and errors. The Jobs list gets the same button.</Notice>
      </Page>
    </ConnShell>
  ),
};

function Handoff({ icon, title, description, children, tone = 'neutral' }: { icon: typeof Wrench; title: string; description: string; children?: React.ReactNode; tone?: 'neutral' | 'error' }) {
  return (
    <div className="ds-root grid min-h-screen place-items-center bg-surface-canvas p-6 font-sans text-ink">
      <Card padding="lg" className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <span className={tone === 'error' ? 'grid h-12 w-12 place-items-center rounded-full bg-error-50 text-error' : 'grid h-12 w-12 place-items-center rounded-full bg-primary-50 text-primary-700'}><Icon icon={icon} size="lg" /></span>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-ink-muted">{description}</p>
        {children}
      </Card>
    </div>
  );
}

export const HandoffOpening: Story = { name: 'Handoff - opening the app', render: () => <Handoff icon={Wrench} title="Opening Davao branch" description="Signing you in."><Spinner size="lg" className="text-ink-subtle" /></Handoff> };
export const HandoffExpired: Story = { name: 'Handoff - session expired', render: () => <Handoff icon={Lock} title="Your session expired" description="Sign in again to continue to Davao branch."><Button fullWidth>Sign in</Button></Handoff> };
export const HandoffUnreachable: Story = { name: 'Handoff - app unreachable', render: () => <Handoff icon={WifiSlash} tone="error" title="Davao branch isn't responding" description="Your data is safe. Try again in a moment."><div className="flex w-full gap-2"><Button fullWidth variant="secondary">Back to Portal</Button><Button fullWidth>Try again</Button></div></Handoff> };
export const HandoffNoAccess: Story = { name: 'Handoff - no access to this platform', render: () => <Handoff icon={Warning} tone="error" title="You don't have access" description="Ask your company owner to give you access to Davao branch in Portal > Team."><Button fullWidth variant="secondary">Back to Portal</Button></Handoff> };
