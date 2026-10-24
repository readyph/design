import { useMemo, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Plus, DotsThree, PencilSimple, Power } from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { Menu } from '../../components/Menu';
import { Pagination } from '../../components/Pagination';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { SettingsSection } from '../../components/SettingsSection';
import { Switch } from '../../components/Switch';
import { Table, type TableColumn } from '../../components/Table';
import { Textarea } from '../../components/Textarea';
import { RepairShell } from './Shell';
import { BackButton, Page, RetryNotice } from './Page';
import { SERVICES, peso, type ShopService } from './data';
import { LinkedInventory, type InvState } from './LinkedInventory';
import { mobile } from './params';

/**
 * PROTOTYPE (RDY-18, RDY-73) - service catalogue (RDY-34) and the read-only linked inventory section (RDY-33).
 * Parts are not a sms catalogue: they come from the linked Inventory platform. Add and edit are settings-type pages.
 */
const meta: Meta = {
  title: 'SMS/Catalogue',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

type ListState = 'default' | 'empty' | 'loading' | 'error';

function ActiveBadge({ active }: { active: boolean }) {
  return <Badge tone={active ? 'success' : 'neutral'} size="sm" dot>{active ? 'Active' : 'Inactive'}</Badge>;
}

const rowMenu = (label: string, active: boolean, onEdit: () => void) => (
  <span onClick={(e) => e.stopPropagation()}>
    <Menu trigger={<IconButton icon={DotsThree} label={`Actions for ${label}`} variant="subtle" size="sm" />} items={[{ label: 'Edit', icon: PencilSimple, onSelect: onEdit }, { label: active ? 'Deactivate' : 'Activate', icon: Power }]} />
  </span>
);

function Catalogue({ state = 'default', openForm = false, editing = false, linked = true, inv = 'default' }: { state?: ListState; openForm?: boolean; editing?: boolean; linked?: boolean; inv?: InvState }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [svcForm, setSvcForm] = useState<ShopService | 'new' | null>(openForm ? (editing ? SERVICES[1] : 'new') : null);

  const services = useMemo(() => (state === 'empty' ? [] : SERVICES.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))), [q, state]);

  const svcCols: TableColumn<ShopService>[] = [
    { key: 'name', header: 'Service', render: (s) => (<div><p className="font-medium text-ink">{s.name}</p><p className="max-w-md truncate text-xs text-ink-subtle">{s.description}</p></div>) },
    { key: 'scope', header: 'Scope of work', render: (s) => <span className="text-ink-muted">{s.scope || '-'}</span> },
    { key: 'price', header: 'Price', align: 'right', render: (s) => <span className="tabular-nums text-ink">{peso(s.price)}</span> },
    { key: 'added', header: 'Date added', render: (s) => <span className="whitespace-nowrap text-ink-muted">{s.added}</span> },
    { key: 'status', header: 'Status', render: (s) => <ActiveBadge active={s.active} /> },
    { key: 'actions', header: '', align: 'right', width: 48, render: (s) => rowMenu(s.name, s.active, () => setSvcForm(s)) },
  ];

  if (svcForm) return <RepairShell active="catalogue" title="Catalogue"><ServiceForm item={svcForm} onClose={() => setSvcForm(null)} startTried={openForm && !editing} /></RepairShell>;

  const empty = (
    <EmptyState
      title="No services yet"
      description={q ? 'Nothing matches your search.' : 'Add the labour and services your shop offers.'}
      action={<Button size="sm" leftIcon={Plus} onClick={() => setSvcForm('new')}>Add service</Button>}
    />
  );

  return (
    <RepairShell active="catalogue">
      <Page>
        <PageHeader
          title="Catalogue"
          description="Services that can be added to quotations and jobs."
          actions={<Button leftIcon={Plus} onClick={() => setSvcForm('new')}>Add service</Button>}
        />
        <SearchBar aria-label="Search services" placeholder="Search services…" shortcut="/" value={q} onValueChange={setQ} onClear={() => setQ('')} />
        {state === 'error' ? (
          <RetryNotice title="Could not load the catalogue">Try again in a moment.</RetryNotice>
        ) : (
          <>
            <Table columns={svcCols} data={services} rowKey={(s) => s.id} loading={state === 'loading'} empty={empty} onRowClick={setSvcForm} />
            {state !== 'loading' && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
                <span>{services.length} services displayed</span>
                <Pagination page={page} pageCount={1} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
        <LinkedInventory linked={linked} state={inv} />
      </Page>
    </RepairShell>
  );
}

/** A settings-type page: back button, header, SettingsSection blocks, actions at the bottom. */
function FormPage({ title, description, onClose, children, submitLabel, onSubmit }: { title: string; description: string; onClose: () => void; children: ReactNode; submitLabel: string; onSubmit: () => void }) {
  return (
    <Page width="form">
      <BackButton label="Catalogue" onClick={onClose} />
      <PageHeader title={title} description={description} />
      <div className="divide-y divide-border">{children}</div>
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <Button variant="subtle" onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </div>
    </Page>
  );
}

function ServiceForm({ item, onClose, startTried }: { item: ShopService | 'new'; onClose: () => void; startTried?: boolean }) {
  const edit = item !== 'new' ? item : null;
  const [name, setName] = useState(edit?.name ?? '');
  const [desc, setDesc] = useState(edit?.description ?? '');
  const [scope, setScope] = useState(edit?.scope ?? '');
  const [price, setPrice] = useState(edit ? edit.price.toFixed(2) : '');
  const [active, setActive] = useState(edit?.active ?? true);
  const [tried, setTried] = useState(!!startTried);
  const priceBad = price.trim() === '' || !(Number(price) >= 0);
  const errs = { name: !name.trim() && 'Enter a clear, specific name.', price: priceBad && 'Enter a price of 0 or more.' };
  const e = (k: keyof typeof errs) => (tried && errs[k] ? (errs[k] as string) : undefined);
  const save = () => { setTried(true); if (!Object.values(errs).some(Boolean)) onClose(); };
  return (
    <FormPage title={edit ? 'Update service' : 'Add a new service'} description="Services appear in quotations and on jobs." onClose={onClose} submitLabel={edit ? 'Update service' : 'Add service'} onSubmit={save}>
      <SettingsSection title="Details" description="What the customer sees on a quotation.">
        <Field label="Service name" required error={e('name')}><Input value={name} onChange={(ev) => setName(ev.target.value)} placeholder="e.g., Brake Pad Replacement" /></Field>
        <Field label="Scope of work" hint="Optional. For example, Mechanical or Air conditioning."><Input value={scope} onChange={(ev) => setScope(ev.target.value)} placeholder="e.g., Mechanical" /></Field>
        <Field label="Description" hint={`${desc.length}/220`}><Textarea rows={3} maxLength={220} value={desc} onChange={(ev) => setDesc(ev.target.value)} /></Field>
      </SettingsSection>
      <SettingsSection title="Price" description="Tax and parts are calculated separately.">
        <Field label="Price" required error={e('price')}>
          <Input value={price} onChange={(ev) => setPrice(ev.target.value)} onBlur={() => { if (price.trim() !== '' && Number(price) >= 0) setPrice(Number(price).toFixed(2)); }} inputMode="decimal" placeholder="0.00" />
        </Field>
      </SettingsSection>
      <SettingsSection title="Availability">
        <Switch checked={active} onCheckedChange={setActive} label="Status" description="Inactive services will not appear in search or quotations." />
      </SettingsSection>
    </FormPage>
  );
}

export const ServicesDefault: Story = { name: 'Services - default (inventory linked)', render: () => <Catalogue /> };
export const ServicesNotLinked: Story = { name: 'Services - inventory not linked', render: () => <Catalogue linked={false} /> };
export const ServicesEmpty: Story = { name: 'Services - empty', render: () => <Catalogue state="empty" /> };
export const ServicesLoading: Story = { name: 'Services - loading', render: () => <Catalogue state="loading" inv="loading" /> };
export const ServicesError: Story = { name: 'Services - error', render: () => <Catalogue state="error" inv="error" /> };
export const InventoryError: Story = { name: 'Linked inventory - error', render: () => <Catalogue inv="error" /> };
export const ServiceAddValidation: Story = { name: 'Service - add form (submit empty)', render: () => <Catalogue openForm /> };
export const ServiceEdit: Story = { name: 'Service - edit form', render: () => <Catalogue openForm editing /> };
export const ServicesMobile: Story = { name: 'Services - mobile 390', parameters: mobile, render: () => <Catalogue /> };
