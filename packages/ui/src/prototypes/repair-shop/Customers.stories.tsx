import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Plus, DotsThreeVertical, PencilSimple, Trash } from '@phosphor-icons/react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { Input } from '../../components/Input';
import { Menu } from '../../components/Menu';
import { Modal } from '../../components/Modal';
import { Notice } from '../../components/Notice';
import { Pagination } from '../../components/Pagination';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { Select } from '../../components/Select';
import { Table, type TableColumn } from '../../components/Table';
import { Textarea } from '../../components/Textarea';
import { RepairShell } from './Shell';
import { Page, RetryNotice } from './Page';
import { Skeleton } from '../../components/Skeleton';
import { CUSTOMERS, validEmail, validPhone, type Customer, type Vehicle } from './data';

/**
 * PROTOTYPE (RDY-18) - customers and their vehicles.
 * Customer delete is a soft delete: job history is kept.
 */
const meta: Meta = {
  title: 'Repair shop/Customers',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

type State = 'default' | 'empty' | 'loading' | 'error';

function CustomerForm({ open, customer, onClose }: { open: boolean; customer?: Customer; onClose: () => void }) {
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer ? customer.phone.replace('+63 ', '') : '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [tried, setTried] = useState(false);
  const errs = { name: !name && 'Enter the full name of the customer.', phone: !validPhone(phone) && '10-digit mobile number, without the leading zero.', email: !validEmail(email) && 'Enter a valid email address.' };
  const save = () => { setTried(true); if (!Object.values(errs).some(Boolean)) onClose(); };
  const e = (k: keyof typeof errs) => (tried && errs[k] ? (errs[k] as string) : undefined);
  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} title={customer ? 'Edit customer' : 'Add a new customer'} footer={<><Button variant="subtle" onClick={onClose}>Cancel</Button><Button onClick={save}>{customer ? 'Save customer' : 'Add customer'}</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Customer name" required error={e('name')}><Input value={name} onChange={(ev) => setName(ev.target.value)} placeholder="e.g., Juan Dela Cruz" /></Field>
        <Field label="Contact number" required error={e('phone')} hint="+63, then 10 digits"><Input value={phone} onChange={(ev) => setPhone(ev.target.value)} placeholder="917 123 4567" /></Field>
        <Field label="Email address" required error={e('email')}><Input value={email} onChange={(ev) => setEmail(ev.target.value)} placeholder="name@email.com" /></Field>
        <Field label="Address" hint={`${address.length}/220`}><Textarea rows={2} maxLength={220} value={address} onChange={(ev) => setAddress(ev.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function VehicleForm({ open, vehicle, onClose }: { open: boolean; vehicle?: Vehicle; onClose: () => void }) {
  const [plate, setPlate] = useState(vehicle?.plate ?? '');
  const [brand, setBrand] = useState(vehicle?.brand ?? '');
  const [tried, setTried] = useState(false);
  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} title={vehicle ? 'Edit vehicle' : 'Add a new vehicle'} footer={<><Button variant="subtle" onClick={onClose}>Cancel</Button><Button onClick={() => { setTried(true); if (plate && brand) onClose(); }}>{vehicle ? 'Save vehicle' : 'Add vehicle'}</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Plate number" required error={tried && !plate ? 'Enter the plate number.' : undefined}><Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="ABC 4555" /></Field>
        <Field label="Brand" required error={tried && !brand ? 'Select a brand.' : undefined} hint="Brands can be added from this field in the source app."><Select value={brand} onValueChange={setBrand} placeholder="Select brand" options={['Honda', 'Toyota', 'KIA', 'Mitsubishi'].map((b) => ({ value: b, label: b }))} /></Field>
        <Field label="Model"><Input defaultValue={vehicle?.model} placeholder="e.g., Vios" /></Field>
        <Field label="Variant"><Input defaultValue={vehicle?.variant} placeholder="e.g., 1.3 XLE CVT" /></Field>
        <Field label="Year manufactured"><Input defaultValue={vehicle?.year} placeholder="e.g., 2020" /></Field>
        <Field label="Mileage"><Input defaultValue={vehicle?.mileage} placeholder="e.g., 12,504" /></Field>
        <Field label="Chassis / VIN" className="col-span-2"><Input defaultValue={vehicle?.vin} /></Field>
      </div>
    </Modal>
  );
}

function CustomersList({ state = 'default', openForm = false, confirmDelete = false }: { state?: State; openForm?: boolean; confirmDelete?: boolean }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(openForm);
  const [del, setDel] = useState(confirmDelete);
  const rows = useMemo(() => (state === 'empty' ? [] : CUSTOMERS.filter((c) => `${c.name} ${c.phone} ${c.vehicles.map((v) => v.plate).join(' ')}`.toLowerCase().includes(q.toLowerCase()))), [q, state]);
  const cols: TableColumn<Customer>[] = [
    { key: 'id', header: 'ID', render: (c) => <span className="text-ink-muted">{c.id}</span> },
    { key: 'name', header: 'Customer', render: (c) => (<div><div className="font-medium">{c.name}</div><div className="text-xs text-ink-muted">{c.phone}</div></div>) },
    { key: 'vehicle', header: 'Vehicle / plate', render: (c) => c.vehicles.length === 0 ? <span className="text-ink-subtle">No vehicle</span> : `${c.vehicles[0].plate} / ${c.vehicles[0].brand} ${c.vehicles[0].model}${c.vehicles.length > 1 ? ` +${c.vehicles.length - 1}` : ''}` },
  ];
  return (
    <RepairShell active="customers">
      <Page>
        <PageHeader className="pb-0" title="Customers" description="Customers and the vehicles they bring in." actions={<Button leftIcon={Plus} onClick={() => setForm(true)}>Add customer</Button>} />
        <div className="max-w-md"><SearchBar aria-label="Search customers" placeholder="Search customers" value={q} onValueChange={setQ} /></div>
        {state === 'error' ? (
          <RetryNotice title="Could not load customers">Try again in a moment.</RetryNotice>
        ) : (
          <>
            <Card padding="none">
              <Table columns={cols} data={rows} rowKey={(c) => c.id} loading={state === 'loading'} empty={<EmptyState title="No customers yet" description={q ? 'Nothing matches your search.' : 'Add your first customer, or create one while writing a quotation.'} action={<Button size="sm" leftIcon={Plus} onClick={() => setForm(true)}>Add customer</Button>} />} />
            </Card>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted"><span>{rows.length} customers displayed</span><Pagination page={page} pageCount={1} onPageChange={setPage} /></div>
          </>
        )}
      </Page>
      <CustomerForm open={form} onClose={() => setForm(false)} />
      <ConfirmDelete open={del} onOpenChange={setDel} name="Clarke Sorento" />
    </RepairShell>
  );
}

function ConfirmDelete({ open, onOpenChange, name }: { open: boolean; onOpenChange: (o: boolean) => void; name: string }) {
  return <ConfirmDialog open={open} onOpenChange={onOpenChange} title="Delete customer" description={`Are you sure you want to delete ${name}? They will be removed from your customer list, but their job history will be kept.`} confirmLabel="Delete" tone="danger" onConfirm={() => onOpenChange(false)} />;
}

function CustomerDetail({ customer = CUSTOMERS[0], vehicleForm = false, confirmDelete = false, loading = false }: { customer?: Customer; vehicleForm?: boolean; confirmDelete?: boolean; loading?: boolean }) {
  const [edit, setEdit] = useState(false);
  const [veh, setVeh] = useState<Vehicle | 'new' | null>(vehicleForm ? 'new' : null);
  const [del, setDel] = useState(confirmDelete);
  if (loading) return <RepairShell active="customers"><Page><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full rounded-lg" /></Page></RepairShell>;
  const cols: TableColumn<Vehicle>[] = [
    { key: 'plate', header: 'Plate no.', render: (v) => v.plate },
    { key: 'bm', header: 'Brand / model', render: (v) => `${v.brand} ${v.model}` },
    { key: 'variant', header: 'Variant', render: (v) => v.variant || '-' },
    { key: 'year', header: 'Year', render: (v) => v.year },
    { key: 'mileage', header: 'Mileage', render: (v) => v.mileage },
    { key: 'vin', header: 'Chassis / VIN', render: (v) => v.vin || '-' },
    { key: 'a', header: '', align: 'right', render: (v) => <Menu trigger={<button aria-label="Row actions"><DotsThreeVertical size={18} /></button>} items={[{ label: 'Edit', icon: PencilSimple, onSelect: () => setVeh(v) }, { label: 'Delete', icon: Trash, danger: true }]} /> },
  ];
  return (
    <RepairShell active="customers">
      <Page>
        <PageHeader className="pb-0" title={customer.name} description={`${customer.phone}  ${customer.email}`} actions={<><Button variant="secondary" leftIcon={PencilSimple} onClick={() => setEdit(true)}>Edit</Button><Button variant="danger" leftIcon={Trash} onClick={() => setDel(true)}>Delete</Button></>} />
        <Card><div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">{[['Customer ID', String(customer.id)], ['Contact no.', customer.phone], ['Email', customer.email], ['Address', customer.address || '-']].map(([k, v]) => (<div key={k} className="flex flex-col"><span className="text-xs text-ink-muted">{k}</span><span className="font-medium">{v}</span></div>))}</div></Card>
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3"><div className="flex flex-col"><span className="font-semibold">Vehicles</span><span className="text-xs text-ink-muted">{customer.vehicles.length} vehicle{customer.vehicles.length === 1 ? '' : 's'}</span></div><Button size="sm" leftIcon={Plus} onClick={() => setVeh('new')}>Add vehicle</Button></div>
          <Table columns={cols} data={customer.vehicles} rowKey={(v) => v.plate} empty={<EmptyState title="No vehicles yet" description="Add a vehicle so this customer can be picked on a quotation." action={<Button size="sm" leftIcon={Plus} onClick={() => setVeh('new')}>Add vehicle</Button>} />} />
        </Card>
        <Notice tone="info">Gap in the source app: no job history on this page. Proposed: list this customer's jobs here.</Notice>
      </Page>
      <CustomerForm open={edit} customer={customer} onClose={() => setEdit(false)} />
      <VehicleForm open={veh !== null} vehicle={veh && veh !== 'new' ? veh : undefined} onClose={() => setVeh(null)} />
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
