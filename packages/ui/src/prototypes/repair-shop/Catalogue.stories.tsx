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
import { SegmentedControl } from '../../components/SegmentedControl';
import { SettingsSection } from '../../components/SettingsSection';
import { Select } from '../../components/Select';
import { Switch } from '../../components/Switch';
import { Table, type TableColumn } from '../../components/Table';
import { Textarea } from '../../components/Textarea';
import { RepairShell } from './Shell';
import { BackButton, Page, RetryNotice } from './Page';
import { PARTS, SCOPES, SERVICES, peso, type ShopPart, type ShopService } from './data';
import { mobile } from './params';

/**
 * PROTOTYPE (RDY-18) - service catalogue and parts catalogue, on the Inventory/Products list pattern. Add and edit are
 * settings-type pages (SettingsSection + Field). Inactive items are hidden from search and quotations. Row action is
 * Edit only in the source app; activate/deactivate is in its API and is shown here as proposed.
 */
const meta: Meta = {
  title: 'Repair shop/Catalogue',
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

function Catalogue({ initialTab = 'services', state = 'default', openForm = false, editing = false }: { initialTab?: string; state?: ListState; openForm?: boolean; editing?: boolean }) {
  const [tab, setTab] = useState(initialTab);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [svcForm, setSvcForm] = useState<ShopService | 'new' | null>(openForm && initialTab === 'services' ? (editing ? SERVICES[1] : 'new') : null);
  const [partForm, setPartForm] = useState<ShopPart | 'new' | null>(openForm && initialTab === 'parts' ? (editing ? PARTS[1] : 'new') : null);

  const services = useMemo(() => (state === 'empty' ? [] : SERVICES.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))), [q, state]);
  const parts = useMemo(() => (state === 'empty' ? [] : PARTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))), [q, state]);

  const svcCols: TableColumn<ShopService>[] = [
    { key: 'name', header: 'Service', render: (s) => (<div><p className="font-medium text-ink">{s.name}</p><p className="max-w-md truncate text-xs text-ink-subtle">{s.description}</p></div>) },
    { key: 'scope', header: 'Scope of work', render: (s) => <span className="text-ink-muted">{s.scope}</span> },
    { key: 'price', header: 'Price', align: 'right', render: (s) => <span className="tabular-nums text-ink">{peso(s.price)}</span> },
    { key: 'added', header: 'Date added', render: (s) => <span className="whitespace-nowrap text-ink-muted">{s.added}</span> },
    { key: 'status', header: 'Status', render: (s) => <ActiveBadge active={s.active} /> },
    { key: 'actions', header: '', align: 'right', width: 48, render: (s) => rowMenu(s.name, s.active, () => setSvcForm(s)) },
  ];
  const partCols: TableColumn<ShopPart>[] = [
    { key: 'name', header: 'Part', render: (p) => (<div><p className="font-medium text-ink">{p.name}</p><p className="max-w-md truncate text-xs text-ink-subtle">{p.description}</p></div>) },
    { key: 'category', header: 'Category', render: (p) => <span className="text-ink-muted">{p.category}</span> },
    { key: 'brand', header: 'Brand', render: (p) => <span className="text-ink-muted">{p.brand}</span> },
    { key: 'price', header: 'Unit price', align: 'right', render: (p) => <span className="tabular-nums text-ink">{peso(p.price)}</span> },
    { key: 'cost', header: 'Unit cost', align: 'right', render: (p) => <span className="tabular-nums text-ink-muted">{peso(p.cost)}</span> },
    { key: 'stock', header: 'Stock', align: 'right', render: (p) => <span className="tabular-nums text-ink">{p.stock} <span className="text-xs text-ink-subtle">{p.unit}</span></span> },
    { key: 'status', header: 'Status', render: (p) => (p.stock <= p.minStock ? <Badge tone="warning" size="sm" dot>Low stock</Badge> : <ActiveBadge active={p.active} />) },
    { key: 'actions', header: '', align: 'right', width: 48, render: (p) => rowMenu(p.name, p.active, () => setPartForm(p)) },
  ];

  const isServices = tab === 'services';
  const addNew = () => (isServices ? setSvcForm('new') : setPartForm('new'));

  if (svcForm) return <RepairShell active="catalogue" title="Catalogue"><ServiceForm item={svcForm} onClose={() => setSvcForm(null)} startTried={openForm && !editing} /></RepairShell>;
  if (partForm) return <RepairShell active="catalogue" title="Catalogue"><PartForm item={partForm} onClose={() => setPartForm(null)} startTried={openForm && !editing} /></RepairShell>;

  const empty = (
    <EmptyState
      title={isServices ? 'No services yet' : 'No parts yet'}
      description={q ? 'Nothing matches your search.' : isServices ? 'Add the labour and services your shop offers.' : 'Add the parts and materials you use on jobs.'}
      action={<Button size="sm" leftIcon={Plus} onClick={addNew}>{isServices ? 'Add service' : 'Add part'}</Button>}
    />
  );

  return (
    <RepairShell active="catalogue">
      <Page>
        <PageHeader
          title="Catalogue"
          description="Services and parts that can be added to quotations and jobs."
          actions={<Button leftIcon={Plus} onClick={addNew}>{isServices ? 'Add service' : 'Add part'}</Button>}
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:min-w-56 sm:flex-1">
            <SearchBar aria-label={isServices ? 'Search services' : 'Search parts'} placeholder={isServices ? 'Search services…' : 'Search parts…'} shortcut="/" value={q} onValueChange={setQ} onClear={() => setQ('')} />
          </div>
          <SegmentedControl
            aria-label="Catalogue type"
            value={tab}
            onChange={(v) => { setTab(v); setQ(''); setPage(1); }}
            options={[{ value: 'services', label: `Services ${SERVICES.length}` }, { value: 'parts', label: `Parts ${PARTS.length}` }]}
          />
        </div>
        {state === 'error' ? (
          <RetryNotice title="Could not load the catalogue">Try again in a moment.</RetryNotice>
        ) : (
          <>
            {isServices
              ? <Table columns={svcCols} data={services} rowKey={(s) => s.id} loading={state === 'loading'} empty={empty} onRowClick={setSvcForm} />
              : <Table columns={partCols} data={parts} rowKey={(p) => p.id} loading={state === 'loading'} empty={empty} onRowClick={setPartForm} />}
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
              <span>{(isServices ? services : parts).length} {isServices ? 'services' : 'parts'} displayed</span>
              <Pagination page={page} pageCount={1} onPageChange={setPage} />
            </div>
          </>
        )}
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
  const [price, setPrice] = useState(edit ? String(edit.price) : '');
  const [scope, setScope] = useState(edit?.scope ?? '');
  const [active, setActive] = useState(edit?.active ?? true);
  const [tried, setTried] = useState(!!startTried);
  const errs = { name: !name && 'Enter a clear, specific name.', desc: !desc && 'Describe the service.', price: !(Number(price) > 0) && 'Enter the service fee. Tax and parts are calculated separately.', scope: !scope && 'Choose the scope of work for filtering and reporting.' };
  const e = (k: keyof typeof errs) => (tried && errs[k] ? (errs[k] as string) : undefined);
  const save = () => { setTried(true); if (!Object.values(errs).some(Boolean)) onClose(); };
  return (
    <FormPage title={edit ? 'Update service' : 'Add a new service'} description="Services appear in quotations and on jobs." onClose={onClose} submitLabel={edit ? 'Update service' : 'Add service'} onSubmit={save}>
      <SettingsSection title="Details" description="What the customer sees on a quotation.">
        <Field label="Service name" required error={e('name')}><Input value={name} onChange={(ev) => setName(ev.target.value)} placeholder="e.g., Brake Pad Replacement" /></Field>
        <Field label="Description" required hint={`${desc.length}/220`} error={e('desc')}><Textarea rows={3} maxLength={220} value={desc} onChange={(ev) => setDesc(ev.target.value)} /></Field>
      </SettingsSection>
      <SettingsSection title="Price and scope" description="Used for totals, filtering and reporting.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Price" required error={e('price')}><Input value={price} onChange={(ev) => setPrice(ev.target.value)} inputMode="decimal" placeholder="0.00" /></Field>
          <Field label="Scope of work" required hint="Categories can be created from this field in the source app." error={e('scope')}><Select value={scope} onValueChange={setScope} placeholder="Select scope of work" options={SCOPES.map((s) => ({ value: s, label: s }))} /></Field>
        </div>
      </SettingsSection>
      <SettingsSection title="Availability">
        <Switch checked={active} onCheckedChange={setActive} label="Status" description="Inactive services will not appear in search or quotations." />
      </SettingsSection>
    </FormPage>
  );
}

function PartForm({ item, onClose, startTried }: { item: ShopPart | 'new'; onClose: () => void; startTried?: boolean }) {
  const edit = item !== 'new' ? item : null;
  const [name, setName] = useState(edit?.name ?? '');
  const [price, setPrice] = useState(edit ? String(edit.price) : '');
  const [cost, setCost] = useState(edit ? String(edit.cost) : '');
  const [qty, setQty] = useState(edit ? String(edit.stock) : '');
  const [min, setMin] = useState(edit ? String(edit.minStock) : '');
  const [active, setActive] = useState(edit?.active ?? true);
  const [tried, setTried] = useState(!!startTried);
  const bad = !name || !(Number(price) > 0);
  return (
    <FormPage title={edit ? 'Update part' : 'Add a new part'} description="Parts and materials used on jobs." onClose={onClose} submitLabel={edit ? 'Save part' : 'Add part'} onSubmit={() => { setTried(true); if (!bad) onClose(); }}>
      <SettingsSection title="Details" description="Name, code and images.">
        <div className="rounded-lg border border-dashed border-border-strong p-4 text-center text-sm text-ink-muted">Part images: choose or drop several files</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Part name" required error={tried && !name ? 'Enter a clear, specific name.' : undefined}><Input value={name} onChange={(ev) => setName(ev.target.value)} /></Field>
          <Field label="SKU"><Input defaultValue={edit ? `DB-${22000 + edit.id}` : ''} /></Field>
        </div>
        <Field label="Description"><Textarea rows={2} maxLength={220} defaultValue={edit?.description} /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category"><Select placeholder="Select category" defaultValue={edit?.category} options={['Brake System', 'Cleaning', 'Aircon Filter', 'Oil Filter'].map((c) => ({ value: c, label: c }))} /></Field>
          <Field label="Brand"><Select placeholder="Select brand" defaultValue={edit?.brand} options={['Bendix', 'Hybrid Solutions', 'Vic', 'Ac Filter'].map((c) => ({ value: c, label: c }))} /></Field>
        </div>
      </SettingsSection>
      <SettingsSection title="Pricing" description="Unit price is what the customer pays; unit cost is what you paid.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Price" required error={tried && !(Number(price) > 0) ? 'Enter the price.' : undefined}><Input value={price} onChange={(ev) => setPrice(ev.target.value)} inputMode="decimal" /></Field>
          <Field label="Unit cost"><Input value={cost} onChange={(ev) => setCost(ev.target.value)} inputMode="decimal" /></Field>
          <Field label="Unit specs"><Select placeholder="Select unit" defaultValue={edit?.unit} options={['Set (set)', 'Liter (L)', 'Pack (pack)', 'Box (box)', 'Ounce (oz)'].map((u) => ({ value: u, label: u }))} /></Field>
        </div>
      </SettingsSection>
      <SettingsSection title="Stock" description="Below the minimum quantity a low-stock alert shows.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Quantity" hint="Current units on hand."><Input value={qty} onChange={(ev) => setQty(ev.target.value)} inputMode="numeric" /></Field>
          <Field label="Minimum quantity"><Input value={min} onChange={(ev) => setMin(ev.target.value)} inputMode="numeric" /></Field>
        </div>
      </SettingsSection>
      <SettingsSection title="Availability">
        <Switch checked={active} onCheckedChange={setActive} label="Status" description="Inactive parts will not appear in search or quotations." />
      </SettingsSection>
    </FormPage>
  );
}

export const ServicesDefault: Story = { name: 'Services - default', render: () => <Catalogue /> };
export const ServicesEmpty: Story = { name: 'Services - empty', render: () => <Catalogue state="empty" /> };
export const ServicesLoading: Story = { name: 'Services - loading', render: () => <Catalogue state="loading" /> };
export const ServicesError: Story = { name: 'Services - error', render: () => <Catalogue state="error" /> };
export const ServiceAddValidation: Story = { name: 'Service - add form (submit empty)', render: () => <Catalogue openForm /> };
export const ServiceEdit: Story = { name: 'Service - edit form', render: () => <Catalogue openForm editing /> };
export const PartsDefault: Story = { name: 'Parts - default (low stock flagged)', render: () => <Catalogue initialTab="parts" /> };
export const PartsEmpty: Story = { name: 'Parts - empty', render: () => <Catalogue initialTab="parts" state="empty" /> };
export const PartAdd: Story = { name: 'Part - add form', render: () => <Catalogue initialTab="parts" openForm /> };
export const ServicesMobile: Story = { name: 'Services - mobile 390', parameters: mobile, render: () => <Catalogue /> };
