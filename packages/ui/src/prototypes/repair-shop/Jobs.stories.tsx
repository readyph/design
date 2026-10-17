import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Plus, DownloadSimple, CalendarBlank, DotsThreeVertical, ChatText, Trash, WarningOctagon } from '@phosphor-icons/react';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { Input } from '../../components/Input';
import { Menu } from '../../components/Menu';
import { Modal } from '../../components/Modal';
import { Notice } from '../../components/Notice';
import { OffCanvas } from '../../components/Drawer';
import { Pagination } from '../../components/Pagination';
import { PageHeader } from '../../components/PageHeader';
import { RadioGroup } from '../../components/RadioGroup';
import { SearchBar } from '../../components/SearchBar';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { Table, type TableColumn } from '../../components/Table';
import { Tabs, TabPanel } from '../../components/Tabs';
import { Textarea } from '../../components/Textarea';
import { RepairShell } from './Shell';
import {
  JOBS, JOB_SERVICES, JOB_PARTS, JOB_STATUSES, PAYMENT_MODES, SERVICES, PARTS, CUSTOMERS,
  isLocked, jobTotals, nextStatuses, peso, statusMeta, validEmail, validPhone,
  type Job, type JobStatus,
} from './data';

/**
 * PROTOTYPE (RDY-18) - job pipeline, quotation intake, job detail.
 * Behaviour captured from the Montauto QA app; mock data; not exported from @readyph/ui.
 */
const meta: Meta = {
  title: 'Prototypes/Repair shop/Jobs',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: JobStatus }) {
  const m = statusMeta(status);
  return <Badge tone={m.tone} dot>{m.label}</Badge>;
}

// ---------------------------------------------------------------- Job list

type ListState = 'default' | 'empty' | 'loading' | 'error';

function JobsList({ state = 'default', initialTab = 'all', openIntake = false }: { state?: ListState; initialTab?: string; openIntake?: boolean }) {
  const [tab, setTab] = useState(initialTab);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [intake, setIntake] = useState(openIntake);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: JOBS.length };
    JOB_STATUSES.forEach((s) => (c[s.value] = JOBS.filter((j) => j.status === s.value).length));
    return c;
  }, []);

  const rows = useMemo(() => {
    if (state === 'empty') return [];
    return JOBS.filter((j) => (tab === 'all' || j.status === tab) &&
      `${j.customer} ${j.plate} ${j.brand} ${j.model}`.toLowerCase().includes(q.toLowerCase()));
  }, [tab, q, state]);

  const columns: TableColumn<Job>[] = [
    { key: 'id', header: 'Job order #', render: (j) => <span className="text-ink-muted">#{j.id}</span> },
    { key: 'customer', header: 'Customer', render: (j) => (<div><div className="font-medium">{j.customer}</div><div className="text-xs text-ink-muted">{j.phone}</div></div>) },
    { key: 'plate', header: 'Plate no.', render: (j) => j.plate },
    { key: 'vehicle', header: 'Vehicle', render: (j) => `${j.brand} ${j.model}` },
    { key: 'assignee', header: 'Assigned to', render: (j) => (j.assignee ? <span className="inline-flex items-center gap-2"><Avatar name={j.assignee} size="xs" />{j.assignee}</span> : <span className="text-ink-subtle">Unassigned</span>) },
    { key: 'status', header: 'Status', render: (j) => <StatusBadge status={j.status} /> },
    { key: 'since', header: 'Since when', render: (j) => j.since },
    { key: 'due', header: 'Due date', render: (j) => j.due },
  ];

  return (
    <RepairShell active="jobs">
      <PageHeader title="Jobs" description="Job orders from quotation to pick-up." actions={<Button leftIcon={Plus} onClick={() => setIntake(true)}>Add quotation</Button>} />
      <Tabs
        variant="pill"
        value={tab}
        onValueChange={(v) => { setTab(v); setPage(1); }}
        items={[{ value: 'all', label: 'All', badge: counts.all }, ...JOB_STATUSES.map((s) => ({ value: s.value, label: s.label, badge: counts[s.value] }))]}
      />
      <div className="my-4 max-w-md"><SearchBar placeholder="Search jobs" value={q} onValueChange={setQ} /></div>
      {state === 'error' ? (
        <Notice tone="error" title="Could not load jobs" icon={WarningOctagon}>Check your connection and try again. <Button size="sm" variant="secondary" className="ml-2">Retry</Button></Notice>
      ) : (
        <Card padding="none">
          <Table
            columns={columns}
            data={rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
            rowKey={(j) => j.id}
            loading={state === 'loading'}
            empty={<EmptyState title="No jobs here yet" description={q ? 'No job matches your search.' : 'Jobs in this status will show up here.'} action={<Button size="sm" leftIcon={Plus} onClick={() => setIntake(true)}>Add quotation</Button>} />}
          />
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-ink-muted">
            <span>{rows.length} jobs displayed</span>
            <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / PAGE_SIZE))} onPageChange={setPage} />
          </div>
        </Card>
      )}
      <QuotationIntake open={intake} onOpenChange={setIntake} />
    </RepairShell>
  );
}

export const JobsDefault: Story = { name: 'Job list - default', render: () => <JobsList /> };
export const JobsEmptyTab: Story = { name: 'Job list - empty tab (Quotation)', render: () => <JobsList state="empty" initialTab="quotation" /> };
export const JobsLoading: Story = { name: 'Job list - loading', render: () => <JobsList state="loading" /> };
export const JobsError: Story = { name: 'Job list - error', render: () => <JobsList state="error" /> };

// ---------------------------------------------------------- Quotation intake

function QuotationIntake({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [plate, setPlate] = useState('');
  const [svc, setSvc] = useState<number[]>([]);
  const [parts, setParts] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState<null | 'confirm' | 'pre'>(null);
  const [tried, setTried] = useState(false);

  const match = CUSTOMERS.find((c) => name.length >= 3 && c.name.toLowerCase().startsWith(name.toLowerCase()));
  const vehicles = match?.vehicles ?? [];
  const est = svc.reduce((a, id) => a + (SERVICES.find((s) => s.id === id)?.price ?? 0), 0) + parts.reduce((a, id) => a + (PARTS.find((p) => p.id === id)?.price ?? 0), 0);
  const errs = {
    name: !name && 'Enter the client name.',
    phone: !validPhone(phone) && '10-digit mobile number, without the leading zero.',
    email: !validEmail(email) && 'Enter a valid email address.',
    plate: !plate && 'Select or enter a plate number.',
  };
  const invalid = Object.values(errs).some(Boolean);
  const submit = (kind: 'confirm' | 'pre') => { setTried(true); if (!invalid) setSubmitted(kind); };
  const e = (k: keyof typeof errs) => (tried && errs[k] ? (errs[k] as string) : undefined);

  return (
    <OffCanvas
      open={open}
      onOpenChange={onOpenChange}
      title="New quotation"
      description="Pick an existing customer or enter a new one; only active services and parts can be added."
      width="560px"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button variant="subtle" onClick={() => onOpenChange(false)}>Cancel</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => submit('pre')}>Pre-approved</Button>
            <Button onClick={() => submit('confirm')}>Submit for confirmation</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {submitted && (
          <Notice tone="success" title={submitted === 'pre' ? 'Quotation created as pre-approved' : 'Quotation sent for customer confirmation'}>
            {submitted === 'pre' ? 'It goes straight to To-do.' : 'It waits under Quotation until the customer confirms.'}
          </Notice>
        )}
        <Field label="Client name" required error={e('name')}><Input value={name} onChange={(ev) => setName(ev.target.value)} placeholder="Search or enter name" /></Field>
        {match && <Notice tone="info">Existing customer found: {match.name} ({match.vehicles.length} vehicle{match.vehicles.length === 1 ? '' : 's'}). <button className="underline" onClick={() => { setName(match.name); setPhone(match.phone.replace('+63', '')); setEmail(match.email); setAddress(match.address); }}>Use details</button></Notice>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact number" required error={e('phone')} hint="+63, then 10 digits"><Input value={phone} onChange={(ev) => setPhone(ev.target.value)} placeholder="917 123 4567" /></Field>
          <Field label="Email address" required error={e('email')}><Input value={email} onChange={(ev) => setEmail(ev.target.value)} placeholder="name@email.com" /></Field>
        </div>
        <Field label="Address"><Input value={address} onChange={(ev) => setAddress(ev.target.value)} /></Field>
        <Field label="Plate number" required error={e('plate')} hint={vehicles.length === 0 && name ? 'No vehicle on file. Enter a plate; it is saved to the customer.' : undefined}>
          {vehicles.length > 0
            ? <Select value={plate} onValueChange={setPlate} placeholder="Select vehicle" options={vehicles.map((v) => ({ value: v.plate, label: `${v.plate} - ${v.brand} ${v.model}` }))} />
            : <Input value={plate} onChange={(ev) => setPlate(ev.target.value)} placeholder="ABC 4555" />}
        </Field>
        <div className="flex items-end justify-between"><div><div className="text-sm font-semibold">Scope of work</div><div className="text-xs text-ink-muted">Services and parts for the job order</div></div><div className="text-right"><div className="text-xs text-ink-muted">Estimated cost</div><div className="text-lg font-semibold">{peso(est)}</div></div></div>
        <Field label="Labor and services"><Select placeholder="Add from catalogue" value="" onValueChange={(v) => setSvc((s) => [...s, Number(v)])} options={SERVICES.filter((s) => s.active).map((s) => ({ value: String(s.id), label: `${s.name} - ${peso(s.price)}` }))} /></Field>
        {svc.length > 0 && <ul className="text-sm text-ink-muted">{svc.map((id, i) => <li key={i}>{SERVICES.find((s) => s.id === id)?.name}</li>)}</ul>}
        <Field label="Parts and materials" hint="Parts list is filtered to the vehicle brand in the source app."><Select placeholder="Add from catalogue" value="" onValueChange={(v) => setParts((s) => [...s, Number(v)])} options={PARTS.filter((p) => p.active).map((p) => ({ value: String(p.id), label: `${p.name} - ${peso(p.price)}` }))} /></Field>
        {parts.length > 0 && <ul className="text-sm text-ink-muted">{parts.map((id, i) => <li key={i}>{PARTS.find((p) => p.id === id)?.name}</li>)}</ul>}
        <Field label="Attachments" hint="Multiple files allowed."><div className="rounded-lg border border-dashed border-border-strong p-6 text-center text-sm text-ink-muted">Choose files or drag and drop</div></Field>
      </div>
    </OffCanvas>
  );
}

export const QuotationIntakeOpen: Story = { name: 'Quotation intake - open (try submitting empty)', render: () => <JobsList openIntake /> };

// ---------------------------------------------------------------- Job detail

type DetailState = 'default' | 'loading' | 'error';

function JobDetail({ status: initial = 'in_progress', state = 'default' }: { status?: JobStatus; state?: DetailState }) {
  const [status, setStatus] = useState<JobStatus>(initial);
  const [tab, setTab] = useState('details');
  const [paymentType, setPaymentType] = useState('down');
  const [mode, setMode] = useState<string>('GCash');
  const [down, setDown] = useState('5000');
  const [comments, setComments] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dueOpen, setDueOpen] = useState(false);
  const locked = isLocked(status);
  const t = jobTotals(JOB_SERVICES, JOB_PARTS);
  const balance = paymentType === 'full' ? 0 : Math.max(0, t.total - (Number(down) || 0));

  if (state === 'loading') return <RepairShell active="jobs"><div className="space-y-3"><div className="h-8 w-72 animate-pulse rounded bg-surface-muted" /><div className="h-40 animate-pulse rounded bg-surface-muted" /><div className="h-64 animate-pulse rounded bg-surface-muted" /></div></RepairShell>;
  if (state === 'error') return <RepairShell active="jobs"><Notice tone="error" title="Job not found or not available in this branch" icon={WarningOctagon}>It may have been removed, or belongs to another branch. <Button size="sm" variant="secondary" className="ml-2">Back to jobs</Button></Notice></RepairShell>;

  return (
    <RepairShell active="jobs">
      <PageHeader
        title="LLK 5515 / Honda Civic"
        description="James Castro, +63 95 1225 2522. Created by Staff Member."
        actions={
          <>
            <Button variant="secondary" leftIcon={DownloadSimple}>Invoice (PDF)</Button>
            <Menu trigger={<Button variant="secondary">{statusMeta(status).label}</Button>} items={nextStatuses(status).map((s) => ({ label: statusMeta(s).label, onSelect: () => setStatus(s) }))} />
            <Button variant="subtle" leftIcon={CalendarBlank} onClick={() => setDueOpen(true)}>Due Apr 7, 2026</Button>
          </>
        }
      />
      {locked && <Notice tone="neutral" title="Completed job" className="mb-4">Services and parts are locked. Reopen the job by changing its status.</Notice>}
      <Card className="mb-4">
        <div className="grid grid-cols-3 gap-4 text-sm sm:grid-cols-6">
          {[['Plate no.', 'LLK 5515'], ['Brand', 'Honda'], ['Model', 'Civic'], ['Variant', '1'], ['Year', '2012'], ['Mileage', '130,000']].map(([k, v]) => (<div key={k}><div className="text-xs text-ink-muted">{k}</div><div className="font-medium">{v}</div></div>))}
        </div>
      </Card>
      <Tabs value={tab} onValueChange={setTab} items={[{ value: 'details', label: 'Job order details' }, { value: 'history', label: 'History' }, { value: 'attachments', label: 'Attachments' }]}>
        <TabPanel value="details">
          <div className="mt-4 space-y-4">
            <Card padding="none">
              <div className="flex items-center justify-between p-4"><div><div className="font-semibold">Services checklist</div><div className="text-xs text-ink-muted">{peso(t.services)} - {JOB_SERVICES.length} items</div></div><Button size="sm" variant="secondary" leftIcon={Plus} disabled={locked}>Add services</Button></div>
              <Table
                data={JOB_SERVICES}
                rowKey={(s) => s.id}
                columns={[
                  { key: 'name', header: 'Service', render: (s) => (<div><div className="font-medium">{s.name}</div><div className="text-xs text-ink-muted">{s.description}</div></div>) },
                  { key: 'updated', header: 'Latest update', render: (s) => s.updated },
                  { key: 'assignee', header: 'Assigned to', render: (s) => (
                    <Menu trigger={<button className="text-sm underline decoration-dotted">{s.assignees.length ? s.assignees.join(', ') : 'Assign'}</button>} items={[{ label: 'Mechanic One' }, { label: 'Staff Member' }, { label: 'Unassign', danger: true }]} />) },
                  { key: 'price', header: 'Unit price', align: 'right', render: (s) => peso(s.price) },
                  { key: 'status', header: 'Status', render: (s) => <Badge tone={s.status === 'completed' ? 'success' : s.status === 'in_progress' ? 'primary' : 'info'}>{s.status === 'in_progress' ? 'In-progress' : s.status === 'todo' ? 'To-do' : 'Completed'}</Badge> },
                  { key: 'actions', header: '', align: 'right', render: (s) => (
                    <Menu trigger={<button aria-label="Row actions"><DotsThreeVertical size={18} /></button>} items={[{ label: `Comments (${s.comments})`, icon: ChatText, onSelect: () => setComments(s.id) }, { label: 'Delete', icon: Trash, danger: true, disabled: locked, onSelect: () => setDeleting(s.name) }]} />) },
                ]}
              />
            </Card>
            <Card padding="none">
              <div className="flex items-center justify-between p-4"><div><div className="font-semibold">Products used</div><div className="text-xs text-ink-muted">{peso(t.parts)} - {JOB_PARTS.length} items</div></div><Button size="sm" variant="secondary" leftIcon={Plus} disabled={locked}>Add products</Button></div>
              <Table
                data={JOB_PARTS}
                rowKey={(p) => p.id}
                columns={[
                  { key: 'name', header: 'Product', render: (p) => (<div><div className="font-medium">{p.name}</div><div className="text-xs text-ink-muted">#{p.sku}</div></div>) },
                  { key: 'qty', header: 'Qty used', render: (p) => `${p.qty} ${p.unit}` },
                  { key: 'unit', header: 'Unit price', align: 'right', render: (p) => peso(p.unitPrice) },
                  { key: 'total', header: 'Total', align: 'right', render: (p) => peso(p.qty * p.unitPrice) },
                  { key: 'actions', header: '', align: 'right', render: (p) => (<Menu trigger={<button aria-label="Row actions"><DotsThreeVertical size={18} /></button>} items={[{ label: 'Delete', icon: Trash, danger: true, disabled: locked, onSelect: () => setDeleting(p.name) }]} />) },
                ]}
              />
            </Card>
            <Card className="space-y-4">
              <div className="flex items-end justify-between"><div className="text-sm font-semibold">Payment</div><div className="text-right"><div className="text-xs text-ink-muted">Total cost</div><div className="text-2xl font-semibold">{peso(t.total)}</div></div></div>
              <RadioGroup value={paymentType} onValueChange={setPaymentType} orientation="horizontal" options={[{ value: 'full', label: 'Full payment', description: 'Pay the total amount upfront' }, { value: 'down', label: 'Downpayment', description: 'Pay a portion now, settle the balance later' }]} />
              {paymentType === 'down' && (<div className="grid max-w-md grid-cols-2 gap-3"><Field label="Downpayment amount"><Input value={down} onChange={(e) => setDown(e.target.value)} inputMode="decimal" /></Field><div><div className="text-xs text-ink-muted">Remaining balance</div><div className="text-lg font-semibold">{peso(balance)}</div></div></div>)}
              <Field label="Mode of payment"><SegmentedControl value={mode} onChange={setMode} options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))} /></Field>
              <Notice tone="neutral">Whether payments are recorded or advisory is an open question; the source app only passes the mode to the invoice.</Notice>
            </Card>
          </div>
        </TabPanel>
        <TabPanel value="history">
          <Card className="mt-4"><ul className="space-y-3 text-sm">
            {[['Staff Member', 'Updated the status from To-do to In-progress'], ['Staff Member', 'Approved this quotation'], ['Customer', 'Confirmed this quotation'], ['Staff Member', 'Created this quotation']].map(([who, what], i) => (<li key={i} className="flex gap-3"><Avatar name={who} size="xs" /><div><div><span className="font-medium">{who}</span> {what}</div><div className="text-xs text-ink-muted">6 months ago</div></div></li>))}
          </ul></Card>
        </TabPanel>
        <TabPanel value="attachments">
          <Card className="mt-4"><ul className="space-y-2 text-sm">{[['engine-bay.png', '0.10 MB'], ['dashboard-warning.png', '0.02 MB'], ['quote-note.png', '0.27 MB']].map(([n, s]) => <li key={n} className="flex justify-between"><span>{n}</span><span className="text-ink-muted">{s}</span></li>)}</ul></Card>
        </TabPanel>
      </Tabs>

      <Modal open={comments !== null} onOpenChange={(o) => !o && setComments(null)} title="Comments" footer={<><Button variant="subtle" onClick={() => setComments(null)}>Close</Button><Button>Post comment</Button></>}>
        <div className="space-y-4">
          <div className="text-sm"><div className="font-medium">Staff Member</div><div>discounted by manager</div><div className="text-xs text-ink-muted">4/7/2026, 5:37 PM</div></div>
          <Field label="Add a comment"><Textarea rows={3} /></Field>
          <Field label="Attachments (optional)"><div className="rounded-lg border border-dashed border-border-strong p-4 text-center text-sm text-ink-muted">Choose files or drag and drop</div></Field>
          <Notice tone="info">Show the author name, not the email address (the source app shows the email).</Notice>
        </div>
      </Modal>
      <ConfirmDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)} title={`Remove ${deleting}?`} description="It is removed from this job and the total is recalculated." confirmLabel="Remove" tone="danger" onConfirm={() => setDeleting(null)} />
      <Modal open={dueOpen} onOpenChange={setDueOpen} title="Change due date" size="sm" footer={<><Button variant="subtle" onClick={() => setDueOpen(false)}>Cancel</Button><Button onClick={() => setDueOpen(false)}>Save</Button></>}>
        <Field label="Due date"><Input type="date" defaultValue="2026-04-07" /></Field>
      </Modal>
    </RepairShell>
  );
}

export const JobDetailInProgress: Story = { name: 'Job detail - in progress', render: () => <JobDetail /> };
export const JobDetailCompleted: Story = { name: 'Job detail - completed (locked)', render: () => <JobDetail status="completed" /> };
export const JobDetailLoading: Story = { name: 'Job detail - loading', render: () => <JobDetail state="loading" /> };
export const JobDetailError: Story = { name: 'Job detail - error', render: () => <JobDetail state="error" /> };
