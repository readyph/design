import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Package, Tag, Truck, PlugsConnected, ArrowSquareOut, Trash, Plus } from '@phosphor-icons/react';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { PageHeader } from '../../components/PageHeader';
import { SettingsSection } from '../../components/SettingsSection';
import { Skeleton } from '../../components/Skeleton';
import { StatusDot } from '../../components/StatusDot';
import { Tabs, TabPanel } from '../../components/Tabs';
import { toast } from '../../components/toast/toastStore';
import { Page, RetryNotice } from '../repair-shop/Page';
import { mobile } from '../repair-shop/params';
import { ConnShell } from './ConnShell';
import { PORTAL } from './data';
import { ButtonLink as LinkButton } from '../../components/ButtonLink';

/** PROTOTYPE (RDY-120) - Inventory Settings after the cut (Units and Reorder defaults removed), a real Platform tab with a Manage in Portal link, and the shared rail listing real platforms. */
const meta: Meta = { title: 'Inventory/Connected settings', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

function NameList({ title, description, initial, noun }: { title: string; description: string; initial: string[]; noun: string }) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string>();
  const add = () => {
    const v = draft.trim();
    if (!v) return setError(`Enter a ${noun} name.`);
    if (items.some((i) => i.toLowerCase() === v.toLowerCase())) return setError(`${v} is already in the list.`);
    setItems([...items, v]); setDraft(''); setError(undefined);
  };
  return (
    <SettingsSection title={title} description={description} actions={<Button size="sm" onClick={() => toast.success(`${title} saved.`)}>Save</Button>}>
      <Field label={`New ${noun}`} error={error}>
        <div className="flex gap-2"><Input value={draft} onChange={(e) => { setDraft(e.target.value); setError(undefined); }} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={`New ${noun}`} /><Button leftIcon={Plus} onClick={add}>Add</Button></div>
      </Field>
      {items.length === 0 && <p className="text-sm text-ink-muted">No {noun === 'category' ? 'categories' : 'suppliers'} yet.</p>}
      <ul className="flex flex-col divide-y divide-border">
        {items.map((i) => <li key={i} className="flex items-center justify-between py-2 text-sm">{i}<IconButton icon={Trash} label={`Delete ${i}`} variant="subtle" size="sm" onClick={() => setItems(items.filter((x) => x !== i))} /></li>)}
      </ul>
    </SettingsSection>
  );
}

function PlatformTab({ state }: { state: 'default' | 'loading' | 'error' }) {
  if (state === 'loading') return <div className="pt-6"><Skeleton height={120} /></div>;
  if (state === 'error') return <div className="pt-6"><RetryNotice title="Couldn't load the connection" /></div>;
  return (
    <div className="pt-6">
      <SettingsSection title="Connection" description="Live status from the Portal.">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary-50 text-primary-700"><Icon icon={Package} size="md" weight="fill" /></span>
          <div className="flex min-w-0 flex-1 flex-col gap-1"><p className="flex items-center gap-2 text-sm font-medium">Main inventory <StatusDot status="active" label="Active" /></p><p className="text-xs text-ink-subtle">Shared with Davao branch (stock and catalog)</p></div>
          <LinkButton size="sm" variant="secondary" rightIcon={ArrowSquareOut} href={`${PORTAL}/platforms`}>Manage in Portal</LinkButton>
        </div>
      </SettingsSection>
    </div>
  );
}

function InventorySettings({ tab = 'categories', state = 'default' }: { tab?: string; state?: 'default' | 'loading' | 'error' }) {
  const [t, setT] = useState(tab);
  return (
    <ConnShell app="inventory" activeKey="settings" activeId="inv" title={<span className="text-sm font-semibold">Settings</span>}>
      <Page width="detail">
        <PageHeader title="Settings" description="Catalog structure, suppliers, and platform connection." />
        <Tabs variant="underline" value={t} onValueChange={setT} items={[
          { value: 'categories', label: 'Categories', icon: Tag }, { value: 'suppliers', label: 'Suppliers', icon: Truck }, { value: 'platform', label: 'Platform', icon: PlugsConnected },
        ]}>
          <TabPanel value="categories"><div className="pt-6"><NameList title="Categories" description="Group products for browsing and reports." noun="category" initial={['Engine parts', 'Brakes', 'Filters', 'Lubricants']} /></div></TabPanel>
          <TabPanel value="suppliers"><div className="pt-6"><NameList title="Suppliers" description="Who you buy from on purchase orders." noun="supplier" initial={['Davao Auto Supply', 'Mindanao Lubricants Inc.', 'Cebu Brake Depot']} /></div></TabPanel>
          <TabPanel value="platform"><PlatformTab state={state} /></TabPanel>
        </Tabs>
      </Page>
    </ConnShell>
  );
}

export const SettingsCategories: Story = { name: 'Settings (Units and Reorder tabs removed)', render: () => <InventorySettings /> };
export const SettingsPlatform: Story = { name: 'Settings, Platform tab', render: () => <InventorySettings tab="platform" /> };
export const SettingsPlatformLoading: Story = { name: 'Settings, Platform tab (loading)', render: () => <InventorySettings tab="platform" state="loading" /> };
export const SettingsPlatformError: Story = { name: 'Settings, Platform tab (error)', render: () => <InventorySettings tab="platform" state="error" /> };
export const RailWithBranches: Story = {
  name: 'Rail lists real platforms and Repair shop branches',
  render: () => (
    <ConnShell app="inventory" activeKey="dashboard" activeId="inv" title={<span className="text-sm font-semibold">Dashboard</span>}>
      <Page><PageHeader title="Dashboard" description="214 products - 6 low stock" /></Page>
    </ConnShell>
  ),
};
export const Mobile: Story = { name: 'Mobile 390', parameters: mobile, render: () => <InventorySettings tab="platform" /> };
