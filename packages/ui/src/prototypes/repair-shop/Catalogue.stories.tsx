import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Plus, DotsThreeVertical, PencilSimple } from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { Input } from '../../components/Input';
import { Menu } from '../../components/Menu';
import { Modal } from '../../components/Modal';
import { Pagination } from '../../components/Pagination';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { Select } from '../../components/Select';
import { Switch } from '../../components/Switch';
import { Table, type TableColumn } from '../../components/Table';
import { Tabs } from '../../components/Tabs';
import { Textarea } from '../../components/Textarea';
import { RepairShell } from './Shell';
import { Page, RetryNotice } from './Page';
import { PARTS, SCOPES, SERVICES, peso, type ShopPart, type ShopService } from './data';

/**
 * PROTOTYPE (RDY-18) - service catalogue and parts catalogue.
 * Inactive items are hidden from search and quotations. Row action is Edit only in the source app;
 * activate/deactivate and delete exist in its API and are shown here as proposed.
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
  return <Badge tone={active ? 'success' : 'neutral'} dot>{active ? 'Active' : 'Inactive'}</Badge>;
}

function Catalogue({ initialTab = 'services', state = 'default', openForm = false, editing = false }: { initialTab?: string; state?: ListState; openForm?: boolean; editing?: boolean }) {
  const [tab, setTab] = useState(initialTab);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [svcForm, setSvcForm] = useState<ShopService | 'new' | null>(openForm && initialTab === 'services' ? (editing ? SERVICES[1] : 'new') : null);
  const [partForm, setPartForm] = useState<ShopPart | 'new' | null>(openForm && initialTab === 'parts' ? (editing ? PARTS[1] : 'new') : null);

  const services = useMemo(() => (state === 'empty' ? [] : SERVICES.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))), [q, state]);
  const parts = useMemo(() => (state === 'empty' ? [] : PARTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))), [q, state]);

  const svcCols: TableColumn<ShopService>[] = [
    { key: 'id', header: 'ID', render: (s) => <span className="text-ink-muted">{s.id}</span> },
    { key: 'name', header: 'Name', render: (s) => (<div><div className="font-medium">{s.name}</div><div className="max-w-md truncate text-xs text-ink-muted">{s.description}</div></div>) },
    { key: 'scope', header: 'Scope of work', render: (s) => s.scope },
    { key: 'price', header: 'Price', align: 'right', render: (s) => peso(s.price) },
    { key: 'added', header: 'Date added', render: (s) => s.added },
    { key: 'status', header: 'Status', render: (s) => <ActiveBadge active={s.active} /> },
    { key: 'actions', header: '', align: 'right', render: (s) => <Menu trigger={<button aria-label="Row actions"><DotsThreeVertical size={18} /></button>} items={[{ label: 'Edit', icon: PencilSimple, onSelect: () => setSvcForm(s) }, { label: s.active ? 'Deactivate' : 'Activate' }]} /> },
  ];
  const partCols: TableColumn<ShopPart>[] = [
    { key: 'name', header: 'Name', render: (p) => (<div><div className="font-medium">{p.name}</div><div className="max-w-md truncate text-xs text-ink-muted">{p.description}</div></div>) },
    { key: 'price', header: 'Unit price', align: 'right', render: (p) => peso(p.price) },
    { key: 'cost', header: 'Unit cost', align: 'right', render: (p) => peso(p.cost) },
    { key: 'category', header: 'Category', render: (p) => p.category },
    { key: 'brand', header: 'Brand', render: (p) => p.brand },
    { key: 'stock', header: 'Stock', render: (p) => <Badge tone={p.stock <= p.minStock ? 'warning' : 'neutral'}>{p.stock <= p.minStock ? `${p.stock} low` : p.stock}</Badge> },
    { key: 'unit', header: 'Unit', render: (p) => p.unit },
    { key: 'status', header: 'Status', render: (p) => <ActiveBadge active={p.active} /> },
    { key: 'actions', header: '', align: 'right', render: (p) => <Menu trigger={<button aria-label="Row actions"><DotsThreeVertical size={18} /></button>} items={[{ label: 'Edit', icon: PencilSimple, onSelect: () => setPartForm(p) }, { label: p.active ? 'Deactivate' : 'Activate' }]} /> },
  ];

  const isServices = tab === 'services';
  const empty = (
    <EmptyState
      title={isServices ? 'No services yet' : 'No parts yet'}
      description={q ? 'Nothing matches your search.' : isServices ? 'Add the labour and services your shop offers.' : 'Add the parts and materials you use on jobs.'}
      action={<Button size="sm" leftIcon={Plus} onClick={() => (isServices ? setSvcForm('new') : setPartForm('new'))}>{isServices ? 'Add service' : 'Add product'}</Button>}
    />
  );

  return (
    <RepairShell active="catalogue">
      <Page>
        <PageHeader
          className="pb-0"
          title="Catalogue"
          description="Services and parts that can be added to quotations and jobs."
          actions={<Button leftIcon={Plus} onClick={() => (isServices ? setSvcForm('new') : setPartForm('new'))}>{isServices ? 'Add service' : 'Add product'}</Button>}
        />
        <div className="flex flex-col gap-3">
          <Tabs variant="pill" value={tab} onValueChange={(v) => { setTab(v); setQ(''); setPage(1); }} items={[{ value: 'services', label: 'Services', badge: SERVICES.length }, { value: 'parts', label: 'Parts', badge: PARTS.length }]} />
          <div className="max-w-md"><SearchBar aria-label={isServices ? 'Search a service' : 'Search a product'} placeholder={isServices ? 'Search a service' : 'Search a product'} value={q} onValueChange={setQ} /></div>
        </div>
        {state === 'error' ? (
          <RetryNotice title="Could not load the catalogue">Try again in a moment.</RetryNotice>
        ) : (
          <>
            <Card padding="none">
              {isServices
                ? <Table columns={svcCols} data={services} rowKey={(s) => s.id} loading={state === 'loading'} empty={empty} />
                : <Table columns={partCols} data={parts} rowKey={(p) => p.id} loading={state === 'loading'} empty={empty} />}
            </Card>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
              <span>{(isServices ? services : parts).length} {isServices ? 'services' : 'products'} displayed</span>
              <Pagination page={page} pageCount={1} onPageChange={setPage} />
            </div>
          </>
        )}
      </Page>
      <ServiceForm item={svcForm} onClose={() => setSvcForm(null)} />
      <PartForm item={partForm} onClose={() => setPartForm(null)} />
    </RepairShell>
  );
}

function ServiceForm({ item, onClose }: { item: ShopService | 'new' | null; onClose: () => void }) {
  const edit = item && item !== 'new' ? item : null;
  const [name, setName] = useState(edit?.name ?? '');
  const [desc, setDesc] = useState(edit?.description ?? '');
  const [price, setPrice] = useState(edit ? String(edit.price) : '');
  const [scope, setScope] = useState(edit?.scope ?? '');
  const [active, setActive] = useState(edit?.active ?? true);
  const [tried, setTried] = useState(false);
  const errs = { name: !name && 'Enter a clear, specific name.', desc: !desc && 'Describe the service.', price: !(Number(price) > 0) && 'Enter the service fee. Tax and parts are calculated separately.', scope: !scope && 'Choose the scope of work for filtering and reporting.' };
  const save = () => { setTried(true); if (!Object.values(errs).some(Boolean)) onClose(); };
  return (
    <Modal open={item !== null} onOpenChange={(o) => !o && onClose()} title={edit ? 'Update service' : 'Add a new service'} footer={<><Button variant="subtle" onClick={onClose}>Cancel</Button><Button onClick={save}>{edit ? 'Update service' : 'Add service'}</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Service name" required error={tried ? (errs.name as string) || undefined : undefined}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Brake Pad Replacement" /></Field>
        <Field label="Description" required hint={`${desc.length}/220`} error={tried ? (errs.desc as string) || undefined : undefined}><Textarea rows={3} maxLength={220} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
        <Field label="Price" required error={tried ? (errs.price as string) || undefined : undefined}><Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0.00" /></Field>
        <Field label="Scope of work" required hint="Categories can be created from this field in the source app." error={tried ? (errs.scope as string) || undefined : undefined}><Select value={scope} onValueChange={setScope} placeholder="Select scope of work" options={SCOPES.map((s) => ({ value: s, label: s }))} /></Field>
        <Switch checked={active} onCheckedChange={setActive} label="Status" description="Inactive services will not appear in search or quotations." />
      </div>
    </Modal>
  );
}

function PartForm({ item, onClose }: { item: ShopPart | 'new' | null; onClose: () => void }) {
  const edit = item && item !== 'new' ? item : null;
  const [name, setName] = useState(edit?.name ?? '');
  const [price, setPrice] = useState(edit ? String(edit.price) : '');
  const [cost, setCost] = useState(edit ? String(edit.cost) : '');
  const [qty, setQty] = useState(edit ? String(edit.stock) : '');
  const [min, setMin] = useState(edit ? String(edit.minStock) : '');
  const [active, setActive] = useState(edit?.active ?? true);
  const [tried, setTried] = useState(false);
  const bad = !name || !(Number(price) > 0);
  return (
    <Modal open={item !== null} onOpenChange={(o) => !o && onClose()} size="xl" title={edit ? 'Update product' : 'Add a new product'} footer={<><Button variant="subtle" onClick={onClose}>Cancel</Button><Button onClick={() => { setTried(true); if (!bad) onClose(); }}>{edit ? 'Save product' : 'Add product'}</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 rounded-lg border border-dashed border-border-strong p-4 text-center text-sm text-ink-muted">Product images: choose or drop several files</div>
        <Field label="Product name" required error={tried && !name ? 'Enter a clear, specific name.' : undefined}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="SKU"><Input defaultValue={edit ? `DB-${22000 + edit.id}` : ''} /></Field>
        <Field label="Description" className="col-span-2"><Textarea rows={2} maxLength={220} defaultValue={edit?.description} /></Field>
        <Field label="Unit specs"><Select placeholder="Select unit" defaultValue={edit?.unit} options={['Set (set)', 'Liter (L)', 'Pack (pack)', 'Box (box)', 'Ounce (oz)'].map((u) => ({ value: u, label: u }))} /></Field>
        <Field label="Price" required error={tried && !(Number(price) > 0) ? 'Enter the price.' : undefined}><Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" /></Field>
        <Field label="Unit cost"><Input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" /></Field>
        <Field label="Quantity" hint="Current units on hand."><Input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" /></Field>
        <Field label="Minimum quantity" hint="Below this a low-stock alert shows."><Input value={min} onChange={(e) => setMin(e.target.value)} inputMode="numeric" /></Field>
        <Field label="Category"><Select placeholder="Select category" defaultValue={edit?.category} options={['Brake System', 'Cleaning', 'Aircon Filter', 'Oil Filter'].map((c) => ({ value: c, label: c }))} /></Field>
        <Field label="Brand"><Select placeholder="Select brand" defaultValue={edit?.brand} options={['Bendix', 'Hybrid Solutions', 'Vic', 'Ac Filter'].map((c) => ({ value: c, label: c }))} /></Field>
        <div className="col-span-2"><Switch checked={active} onCheckedChange={setActive} label="Status" description="Inactive products will not appear in search or quotations." /></div>
      </div>
    </Modal>
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
