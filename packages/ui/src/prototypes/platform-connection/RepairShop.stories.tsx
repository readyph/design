import type { Meta, StoryObj } from '@storybook/react';
import { Package, ArrowSquareOut } from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { PageHeader } from '../../components/PageHeader';
import { SettingsSection } from '../../components/SettingsSection';
import { Skeleton } from '../../components/Skeleton';
import { Page, RetryNotice } from '../repair-shop/Page';
import { mobile } from '../repair-shop/params';
import { RepairFlow } from '../repair-shop/Flow';
import { ConnShell } from './ConnShell';
import { PORTAL } from './data';
import { LinkButton } from './LinkButton';

/** PROTOTYPE (RDY-120) - Repair shop branch Settings (new), the Parts empty state with a working action, and New quotation opening the intake from Today and Jobs. */
const meta: Meta = { title: 'Repair shop/Settings and parts', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

const crumb = <span className="text-sm font-semibold">Sunrise Auto Parts / Davao branch</span>;

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col gap-1"><span className="text-xs text-ink-subtle">{label}</span><span className="text-sm font-medium">{value}</span></div>;
}

function RepairSettings({ state = 'default' }: { state?: 'default' | 'loading' | 'error' }) {
  return (
    <ConnShell app="repair" activeKey="settings" activeId="rs-dvo" title={crumb}>
      <Page width="detail">
        <PageHeader title="Settings" description="Davao branch" />
        {state === 'loading' && <Skeleton height={320} />}
        {state === 'error' && <RetryNotice title="Couldn't load branch settings" />}
        {state === 'default' && (
          <>
            <SettingsSection title="Branch" description="Name and status are managed in the Portal.">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-4"><Row label="Branch name" value="Davao branch" /><Row label="Status" value="Active" /></div>
                <LinkButton size="sm" variant="secondary" rightIcon={ArrowSquareOut} href={`${PORTAL}/platforms`}>Manage in Portal</LinkButton>
              </div>
            </SettingsSection>
            <SettingsSection title="Parts source" description="Where parts and stock levels come from.">
              <div className="flex items-center gap-3 text-sm"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-50 text-primary-700"><Icon icon={Package} size="md" /></span><div className="flex flex-1 flex-col gap-1"><p className="font-medium">Main inventory</p><p className="flex items-center gap-2 text-xs text-ink-muted">214 products <Badge tone="success" size="sm">Linked</Badge></p></div></div>
            </SettingsSection>
            <SettingsSection title="Team access" description="Who can use this branch.">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <p className="text-sm text-ink-muted">4 members. Invite or change access from Portal &gt; Team.</p>
                <LinkButton size="sm" variant="secondary" rightIcon={ArrowSquareOut} href={`${PORTAL}/team`}>Manage team</LinkButton>
              </div>
            </SettingsSection>
          </>
        )}
      </Page>
    </ConnShell>
  );
}

export const Settings: Story = { render: () => <RepairSettings /> };
export const SettingsLoading: Story = { name: 'Settings (loading)', render: () => <RepairSettings state="loading" /> };
export const SettingsError: Story = { name: 'Settings (error)', render: () => <RepairSettings state="error" /> };
export const SettingsMobile: Story = { name: 'Settings (mobile 390)', parameters: mobile, render: () => <RepairSettings /> };

export const PartsNoInventory: Story = {
  name: 'Catalogue, Parts (no inventory linked)',
  render: () => (
    <ConnShell app="repair" activeKey="catalogue" activeId="rs-cdo" title={<span className="text-sm font-semibold">Sunrise Auto Parts / Cagayan branch</span>}>
      <Page>
        <PageHeader title="Catalogue" />
        <EmptyState icon={Package} title="No inventory linked" description="Parts come from a linked Inventory. Until one is linked, add parts by hand on each job."
          action={<LinkButton rightIcon={ArrowSquareOut} href={`${PORTAL}/platforms?connect=rs-cdo`}>Connect inventory in Portal</LinkButton>} />
      </Page>
    </ConnShell>
  ),
};

export const TodayNewQuotation: Story = { name: 'Today, New quotation opens the intake', render: () => <RepairFlow intake="blank" /> };
export const JobsNewQuotation: Story = { name: 'Jobs, New quotation opens the intake', render: () => <RepairFlow start="jobs" intake="blank" /> };
