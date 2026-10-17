import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Plus, DotsThree, PencilSimple, Trash } from '@phosphor-icons/react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataList } from '../../components/DataList';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { Menu } from '../../components/Menu';
import { Notice } from '../../components/Notice';
import { OffCanvas } from '../../components/Drawer';
import { Pagination } from '../../components/Pagination';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { Select } from '../../components/Select';
import { Skeleton } from '../../components/Skeleton';
import { Table, type TableColumn } from '../../components/Table';
import { Textarea } from '../../components/Textarea';
import { RepairShell } from './Shell';
import { BackButton, Page, RetryNotice } from './Page';
import { CUSTOMERS, validEmail, validPhone, type Customer, type Vehicle } from './data';
import { mobile } from './params';

/**
 * PROTOTYPE (RDY-18) - customers and their vehicles, on the Inventory/Products list pattern and the Purchase Orders
 * detail layout. Add and edit open in an off-canvas. Customer delete is a soft delete: job history is kept.
 */
const meta: Meta = {
  title: 'Repair shop/Customers',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

type State = 'default' | 'empty' | 'loading' | 'error';

function DrawerForm({ open, onClose, title, submitLabel, onSubmit, children }: { open: boolean; onClose: () => void; title: string; submitLabel: string; onSubmit: () => void; children: React.ReactNode }) {
  return (
    <OffCanvas open={open} onOpenChange={(o) => !o && onClose()} width="30rem">
      <OffCanvas.Header>{title}</OffCanvas.Header>
      <OffCanvas.Body className="space-y-4">{children}</OffCanvas.Body>
      <OffCanvas.Footer>
        <Button variant="subtle" onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </OffCanvas.Footer>
    </OffCanvas>
  );
}

function CustomerForm({ open, customer, onClose, startTried }: { open: boolean; customer?: Customer; onClose: () => void; startTried?: boolean }) {
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer ? customer.phone.replace('+63 ', '') : '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [tried, setTried] = useState(!!startTried);
  const errs = { name: !name && 'Enter the full name of the customer.', phone: !validPhone(phone) && '10-digit mobile number, without the leading zero.', email: !validEmail(email) && 'Enter a valid email address.' };
  const save = () => { setTried(true); if (!Object.values(errs).some(Boolean)) onClose(); };
  const e = (k: keyof typeof errs) => (tried && errs[k] ? (errs[k] as string) : undefined);
  return (
    <DrawerForm open={open} onClose={onClose} title={customer ? 'Edit customer' : 'Add a new customer'} submitLabel={customer ? 'Save customer' : 'Add customer'} onSubmit={save}>
      <Field label="Customer name" required error={e('name')}><Input value={name} onChange={(ev) => setName(ev.target.value)} placeholder="e.g., Juan Dela Cruz" /></Field>
      <Field label="Contact number" required error={e('phone')} hint="+63, then 10 digits"><Input value={phone} onChange={(ev) => setPhone(ev.target.value)} placeholder="917 123 4567" /></Field>
      <Field label="Email address" required error={e('email')}><Input value={email} onChange={(ev) => setEmail(ev.target.value)} placeholder="name@email.com" /></Field>
      <Field label="Address" hint={`${address.length}/220`}><Textarea rows={2} maxLength={220} value={address} onChange={(ev) => setAddress(ev.target.value)} /></Field>
    </DrawerForm>
  );
}

function VehicleForm({ open, vehicle, onClose }: { open: boolean; vehicle?: Vehicle; onClose: () => void }) {
  const [plate, setPlate] = useState(vehicle?.plate ?? '');
  const [brand, setBrand] = useState(vehicle?.brand ?? '');
  const [tried, setTried] = useState(false);
  return (
    <DrawerForm open={open} onClose={onClose} title={vehicle ? 'Edit vehicle' : 'Add a new vehicle'} submitLabel={vehicle ? 'Save vehicle' : 'Add vehicle'} onSubmit={() => { setTried(true); if (plate && brand) onClose(); }}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Plate number" required error={tried && !plate ? 'Enter the plate number.' : undefined}><Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="ABC 4555" /></Field>
        <Field label="Brand" required error={tried && !brand ? 'Select a brand.' : undefined}><Select value={brand} onValueChange={setBrand} placeholder="Select brand" options={['Honda', 'Toyota', 'KIA', 'Mitsubishi'].map((b) => ({ value: b, label: b }))} /></Field>
        <Field label="Model"><Input defaultValue={vehicle?.model} placeholder="e.g., Vios" /></Field>
        <Field label="Variant"><Input defaultValue={vehicle?.variant} placeholder="e.g., 1.3 XLE CVT" /></Field>
        <Field label="Year manufactured"><Input defaultValue={vehicle?.year} placeholder="e.g., 2020" /></Field>
        <Field label="Mileage"><Input defaultValue={vehicle?.mileage} placeholder="e.g., 12,504" /></Field>
      </div>
      <Field label="Chassis / VIN"><Input defaultValue={vehicle?.vin} /></Field>
    </DrawerForm>
  );
}

function CustomersList({ state = 'default', openForm = false, confirmDelete = false }: { state?: State; openForm?: boolean; confirmDelete?: boolean }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(openForm);
  const [del, setDel] = useState(confirmDelete);
  const [open, setOpen] = useState<Customer | null>(null);
  const rows = useMemo(() => (state === 'empty' ? [] : CUSTOMERS.filter((c) => `${c.name} ${c.phone} ${c.vehicles.map((v) => v.plate).join(' ')}`.toLowerCase().includes(q.toLowerCase()))), [q, state]);
  if (open) return <CustomerDetail customer={open} onBack={() => setOpen(null)} />;
  const cols: TableColumn<Customer>[] = [
    { key: 'name', header: 'Customer', render: (c) => (<div><p className="font-medium text-ink">{c.name}</p><p className="text-xs text-ink-subtle">#{c.id} · {c.phone}</p></div>) },
    { key: 'vehicle', header: 'Vehicle / plate', render: (c) => c.vehicles.length === 0 ? <span className="text-ink-subtle">No vehicle</span> : <span className="whitespace-nowrap text-ink-muted">{`${c.vehicles[0].plate} · ${c.vehicles[0].brand} ${c.vehicles[0].model}${c.vehicles.length > 1 ? ` +${c.vehicles.length - 1}` : ''}`}</span> },
    { key: 'email', header: 'Email', render: (c) => <span className="text-ink-muted">{c.email}</span> },
    { key: 'a', header: '', align: 'right', width: 48, render: (c) => (<span onClick={(e) => e.stopPropagation()}><Menu trigger={<IconButton icon={DotsThree} label={`Actions for ${c.name}`} variant="subtle" size="sm" />} items={[{ label: 'Open', onSelect: () => setOpen(c) }, { label: 'Edit', icon: PencilSimple, onSelect: () => setForm(true) }, { type: 'separator' }, { label: 'Delete', icon: Trash, danger: true, onSelect: () => setDel(true) }]} /></span>) },
  ];
  return (
    <RepairShell active="customers">
      <Page>
        <PageHeader title="Customers" description="Customers and the vehicles they bring in." actions={<Button leftIcon={Plus} onClick={() => setForm(true)}>Add customer</Button>} />
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:min-w-56 sm:flex-1">
            <SearchBar aria-label="Search customers" placeholder="Search name, phone or plate…" shortcut="/" value={q} onValueChange={setQ} onClear={() => setQ('')} />
          </div>
        </div>
        {state === 'error' ? (
          <RetryNotice title="Could not load customers">Try again in a moment.</RetryNotice>
        ) : (
          <>
            <Table columns={cols} data={rows} rowKey={(c) => c.id} loading={state === 'loading'} onRowClick={setOpen} empty={<EmptyState title="No customers yet" description={q ? 'Nothing matches your search.' : 'Add your first customer, or create one while writing a quotation.'} action={<Button size="sm" leftIcon={Plus} onClick={() => setForm(true)}>Add customer</Button>} />} />
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted"><span>{rows.length} customers displayed</span><Pagination page={page} pageCount={1} onPageChange={setPage} /></div>
          </>
        )}
      </Page>
      <CustomerForm key={String(form)} open={form} onClose={() => setForm(false)} startTried={openForm} />
      <ConfirmDelete open={del} onOpenChange={setDel} name="Clarke Sorento" />
    </RepairShell>
  );
}

function ConfirmDelete({ open, onOpenChange, name }: { open: boolean; onOpenChange: (o: boolean) => void; name: string }) {
  return <ConfirmDialog open={open} onOpenChange={onOpenChange} title="Delete customer" description={`Are you sure you want to delete ${name}? They will be removed from your customer list, but their job history will be kept.`} confirmLabel="Delete" tone="danger" onConfirm={() => onOpenChange(false)} />;
}

function CustomerDetail({ customer = CUSTOMERS[0], vehicleForm = false, confirmDelete = false, loading = false, onBack }: { customer?: Customer; vehicleForm?: boolean; confirmDelete?: boolean; loading?: boolean; onBack?: () => void }) {
  const [edit, setEdit] = useState(false);
  const [veh, setVeh] = useState<Vehicle | 'new' | null>(vehicleForm ? 'new' : null);
  const [del, setDel] = useState(confirmDelete);
  if (loading) {
    return (
      <RepairShell active="customers" title="Customer">
        <Page width="detail"><div aria-busy="true" className="space-y-6"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-64" /><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-48 rounded-lg lg:col-span-2" /><Skeleton className="h-48 rounded-lg" /></div></div></Page>
      </RepairShell>
    );
  }
  const cols: TableColumn<Vehicle>[] = [
    { key: 'plate', header: 'Plate no.', render: (v) => <span className="font-medium text-ink">{v.plate}</span> },
    { key: 'bm', header: 'Brand / model', render: (v) => `${v.brand} ${v.model}` },
    { key: 'variant', header: 'Variant', render: (v) => v.variant || '-' },
    { key: 'year', header: 'Year', render: (v) => v.year },
    { key: 'mileage', header: 'Mileage', align: 'right', render: (v) => <span className="tabular-nums">{v.mileage}</span> },
    { key: 'a', header: '', align: 'right', width: 48, render: (v) => <Menu trigger={<IconButton icon={DotsThree} label={`Actions for ${v.plate}`} variant="subtle" size="sm" />} items={[{ label: 'Edit', icon: PencilSimple, onSelect: () => setVeh(v) }, { label: 'Delete', icon: Trash, danger: true }]} /> },
  ];
  return (
    <RepairShell active="customers" title={customer.name}>
      <Page width="detail">
        <BackButton label="Customers" onClick={onBack} />
        <PageHeader title={customer.name} description={`${customer.phone} \u00b7 ${customer.email}`} actions={<><Button variant="secondary" leftIcon={PencilSimple} onClick={() => setEdit(true)}>Edit</Button><Button variant="danger" leftIcon={Trash} onClick={() => setDel(true)}>Delete</Button></>} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card padding="none">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex flex-col"><h2 className="text-sm font-semibold text-ink">Vehicles</h2><p className="text-xs text-ink-subtle">{customer.vehicles.length} vehicle{customer.vehicles.length === 1 ? '' : 's'}</p></div>
                <Button size="sm" variant="secondary" leftIcon={Plus} onClick={() => setVeh('new')}>Add vehicle</Button>
              </div>
              <div className="border-t border-border">
                <Table className="rounded-none border-0" columns={cols} data={customer.vehicles} rowKey={(v) => v.plate} empty={<EmptyState title="No vehicles yet" description="Add a vehicle so this customer can be picked on a quotation." action={<Button size="sm" leftIcon={Plus} onClick={() => setVeh('new')}>Add vehicle</Button>} />} />
              </div>
            </Card>
            <Notice tone="info">Gap in the source app: no job history on this page. Proposed: list this customer's jobs here.</Notice>
          </div>
          <div className="space-y-4">
            <Card>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Summary</h3>
              <DataList stacked items={[{ label: 'Customer ID', value: String(customer.id) }, { label: 'Contact no.', value: customer.phone }, { label: 'Email', value: customer.email }, { label: 'Address', value: customer.address || '-' }]} />
            </Card>
          </div>
        </div>
      </Page>
      <CustomerForm key={`c${edit}`} open={edit} customer={customer} onClose={() => setEdit(false)} />
      <VehicleForm key={`v${veh === null ? 'x' : veh === 'new' ? 'n' : veh.plate}`} open={veh !== null} vehicle={veh && veh !== 'new' ? veh : undefined} onClose={() => setVeh(null)} />
      <ConfirmDelete open={del} onOpenChange={setDel} name={customer.name} />
    </RepairShell>
  );
}

export const CustomersDefault: Story = { name: 'Customer list - default', render: () => <CustomersList /> };
export const CustomersEmpty: Story = { name: 'Customer list - empty', render: () => <CustomersList state="empty" /> };
export const CustomersLoading: Story = { name: 'Customer list - loading', render: () => <CustomersList state="loading" /> };
export const CustomersError: Story = { name: 'Customer list - error', render: () => <CustomersList state="error" /> };
export const CustomerAddValidation: Story = { name: 'Customer - add form (submit empty)', render: () => <CustomersList openForm /> };
export const CustomerDetailDefault: Story = { name: 'Customer detail - multiple vehicles', render: () => <CustomerDetail customer={CUSTOMERS[1]} /> };
export const CustomerDetailNoVehicles: Story = { name: 'Customer detail - no vehicles', render: () => <CustomerDetail customer={CUSTOMERS[3]} /> };
export const CustomerDetailLoading: Story = { name: 'Customer detail - loading', render: () => <CustomerDetail loading /> };
export const CustomerAddVehicle: Story = { name: 'Customer - add vehicle form', render: () => <CustomerDetail vehicleForm /> };
export const CustomerDeleteConfirm: Story = { name: 'Customer - delete confirmation', render: () => <CustomerDetail confirmDelete /> };
export const CustomersMobile: Story = { name: 'Customer list - mobile 390', parameters: mobile, render: () => <CustomersList /> };
