import { useMemo, useState } from 'react';
import {
  Plus, DownloadSimple, CalendarBlank, DotsThreeVertical, ChatText, Trash, WarningOctagon, CaretDown, Paperclip, ClipboardText, Lock,
} from '@phosphor-icons/react';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataList } from '../../components/DataList';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { Menu } from '../../components/Menu';
import { Modal } from '../../components/Modal';
import { Notice } from '../../components/Notice';
import { OffCanvas } from '../../components/Drawer';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { SearchBar } from '../../components/SearchBar';
import { Select } from '../../components/Select';
import { Skeleton } from '../../components/Skeleton';
import { Stat } from '../../components/Stat';
import { Table, type TableColumn } from '../../components/Table';
import { Tabs, TabPanel } from '../../components/Tabs';
import { Textarea } from '../../components/Textarea';
import { QuotationIntake, type IntakeScenario } from './QuotationIntake';
import {
  JOBS, JOB_SERVICES, JOB_PARTS, JOB_STATUSES, PAYMENT_MODES,
  isDueToday, isLocked, isOverdue, jobTotals, nextStatuses, peso, statusMeta,
  type Job, type JobStatus,
} from './data';

const PAGE_SIZE = 8;

export function StatusBadge({ status }: { status: JobStatus }) {
  const m = statusMeta(status);
  return <Badge tone={m.tone} dot>{m.label}</Badge>;
}

function DueCell({ job }: { job: Job }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {job.due}
      {isOverdue(job) && <Badge tone="error" size="sm">Overdue</Badge>}
      {isDueToday(job) && <Badge tone="warning" size="sm">Today</Badge>}
    </span>
  );
}

// ---------------------------------------------------------------- Job list

export type ListState = 'default' | 'empty-tab' | 'empty-branch' | 'loading' | 'error';

/**
 * Job pipeline as a filtered list. The seven statuses are a single field that staff can move between freely
 * (any status except the current one), so a drag board would imply rules that do not exist; tabs with counts,
 * an attention strip and due-date filters answer "what needs me today" and work on a phone.
 */
export function JobList({
  state = 'default', initialTab = 'all', initialQuery = '', branchName = 'Davao City', intake, onOpenJob,
}: {
  state?: ListState; initialTab?: string; initialQuery?: string; branchName?: string; intake?: IntakeScenario; onOpenJob?: (j: Job) => void;
}) {
  const [tab, setTab] = useState(initialTab);
  const [q, setQ] = useState(initialQuery);
  const [who, setWho] = useState('any');
  const [due, setDue] = useState('any');
  const [page, setPage] = useState(1);
  const [intakeOpen, setIntakeOpen] = useState(intake !== undefined);

  const source = state === 'empty-branch' || state === 'empty-tab' ? [] : JOBS;
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: source.length };
    JOB_STATUSES.forEach((s) => (c[s.value] = source.filter((j) => j.status === s.value).length));
    return c;
  }, [source]);

  const rows = useMemo(
    () => source.filter((j) =>
      (tab === 'all' || j.status === tab) &&
      (who === 'any' || (who === 'none' ? !j.assignee : j.assignee === who)) &&
      (due === 'any' || (due === 'overdue' ? isOverdue(j) : isDueToday(j))) &&
      `${j.customer} ${j.plate} ${j.brand} ${j.model} ${j.id}`.toLowerCase().includes(q.toLowerCase())),
    [source, tab, who, due, q],
  );
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const open = source.filter((j) => j.status !== 'completed');

  const columns: TableColumn<Job>[] = [
    { key: 'job', header: 'Job', render: (j) => (<div><div className="font-medium">{j.customer}</div><div className="text-xs text-ink-muted">#{j.id} / {j.phone}</div></div>) },
    { key: 'vehicle', header: 'Vehicle', render: (j) => (<div><div className="font-medium">{j.plate}</div><div className="text-xs text-ink-muted">{j.brand} {j.model}</div></div>) },
    { key: 'assignee', header: 'Assigned to', render: (j) => (j.assignee ? <span className="inline-flex items-center gap-2"><Avatar name={j.assignee} size="xs" />{j.assignee}</span> : <span className="text-ink-muted">Unassigned</span>) },
    { key: 'status', header: 'Status', render: (j) => <StatusBadge status={j.status} /> },
    { key: 'due', header: 'Due date', render: (j) => <DueCell job={j} /> },
  ];

  const empty = (
    <EmptyState
      icon={ClipboardText}
      title={state === 'empty-branch' ? `No jobs in ${branchName} yet` : q || who !== 'any' || due !== 'any' ? 'No job matches these filters' : 'No jobs in this status'}
      description={state === 'empty-branch' ? 'Create the first quotation for a walk-in customer.' : 'Clear a filter or pick another status.'}
      action={<Button size="sm" leftIcon={Plus} onClick={() => setIntakeOpen(true)}>New quotation</Button>}
    />
  );

  return (
    <div className="space-y-4 pt-2">
      <PageHeader
        className="pb-0"
        title="Jobs"
        description={`Job orders in ${branchName}, from quotation to pick-up.`}
        actions={<Button leftIcon={Plus} onClick={() => setIntakeOpen(true)}>New quotation</Button>}
      />

      <Card>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Open jobs" value={state === 'loading' ? '-' : open.length} />
          <Stat label="Overdue" value={state === 'loading' ? '-' : source.filter(isOverdue).length} delta={source.some(isOverdue) ? 'Past due date' : undefined} deltaTone="error" />
          <Stat label="Due today" value={state === 'loading' ? '-' : source.filter(isDueToday).length} />
          <Stat label="For pick-up" value={state === 'loading' ? '-' : counts.for_pickup ?? 0} />
        </div>
      </Card>

      <Tabs
        variant="pill"
        value={tab}
        onValueChange={(v) => { setTab(v); setPage(1); }}
        items={[{ value: 'all', label: 'All', badge: counts.all }, ...JOB_STATUSES.map((s) => ({ value: s.value, label: s.label, badge: counts[s.value] }))]}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchBar className="sm:max-w-sm sm:flex-1" placeholder="Search customer, plate or job #" value={q} onValueChange={(v) => { setQ(v); setPage(1); }} onClear={() => setQ('')} />
        <Select className="sm:w-44" value={who} onValueChange={setWho} options={[{ value: 'any', label: 'Anyone' }, { value: 'none', label: 'Unassigned' }, { value: 'Mechanic One', label: 'Mechanic One' }, { value: 'Mechanic Two', label: 'Mechanic Two' }, { value: 'Staff Member', label: 'Staff Member' }]} />
        <Select className="sm:w-44" value={due} onValueChange={setDue} options={[{ value: 'any', label: 'Any due date' }, { value: 'overdue', label: 'Overdue' }, { value: 'today', label: 'Due today' }]} />
      </div>

      {state === 'error' ? (
        <Notice tone="error" title="Could not load jobs" icon={WarningOctagon}>
          Check your connection and try again. <Button size="sm" variant="secondary" className="ml-2">Retry</Button>
        </Notice>
      ) : (
        <Card padding="none">
          <div className="hidden md:block">
            <Table columns={columns} data={paged} rowKey={(j) => j.id} loading={state === 'loading'} empty={empty} onRowClick={onOpenJob} />
          </div>
          <ul className="divide-y divide-border/50 md:hidden">
            {state === 'loading' && [0, 1, 2, 3].map((i) => <li key={i} className="space-y-2 p-4"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /><Skeleton className="h-5 w-24" /></li>)}
            {state !== 'loading' && paged.length === 0 && <li>{empty}</li>}
            {state !== 'loading' && paged.map((j) => (
              <li key={j.id}>
                <button className="flex min-h-[3rem] w-full flex-col gap-1 p-4 text-left hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" onClick={() => onOpenJob?.(j)}>
                  <span className="flex items-center justify-between gap-2"><span className="font-medium">{j.customer}</span><StatusBadge status={j.status} /></span>
                  <span className="text-sm text-ink-muted">{j.plate} / {j.brand} {j.model} / #{j.id}</span>
                  <span className="flex items-center justify-between gap-2 text-sm"><span className="text-ink-muted">{j.assignee ?? 'Unassigned'}</span><DueCell job={j} /></span>
                </button>
              </li>
            ))}
          </ul>
          {state !== 'loading' && rows.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm text-ink-muted">
              <span>{rows.length} job{rows.length === 1 ? '' : 's'}</span>
              <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / PAGE_SIZE))} onPageChange={setPage} />
            </div>
          )}
        </Card>
      )}

      <QuotationIntake open={intakeOpen} onOpenChange={setIntakeOpen} scenario={intake} />
    </div>
  );
}

// ---------------------------------------------------------------- Job detail

export type DetailState = 'default' | 'loading' | 'error' | 'validation' | 'empty-items';

const COMMENTS = [
  { who: 'Mechanic One', text: 'Terminals were corroded. Cleaned them and replaced the battery.', when: 'Oct 13, 2026, 10:12 AM', on: 'Battery Services' },
  { who: 'Staff Member', text: 'Discounted by manager.', when: 'Oct 12, 2026, 5:37 PM', on: null as string | null },
];

function CommentThread({ filter, tried }: { filter?: string; tried?: boolean }) {
  const [text, setText] = useState('');
  const [posted, setPosted] = useState(false);
  const [attempted, setAttempted] = useState(!!tried);
  const list = COMMENTS.filter((c) => !filter || c.on === filter);
  const error = attempted && !text.trim() ? 'Write a comment before posting.' : undefined;
  return (
    <div className="space-y-4">
      {list.length === 0 && <EmptyState icon={ChatText} title="No comments yet" description="Notes added here are visible to everyone on this job." />}
      <ul className="space-y-4">
        {list.map((c, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <Avatar name={c.who} size="sm" />
            <div className="min-w-0">
              <p><span className="font-medium">{c.who}</span> <span className="text-xs text-ink-muted">{c.when}{c.on ? ` / ${c.on}` : ''}</span></p>
              <p className="mt-0.5">{c.text}</p>
            </div>
          </li>
        ))}
      </ul>
      {posted && <Notice tone="success" title="Comment posted" onDismiss={() => setPosted(false)} />}
      <Field label="Add a comment" error={error}>
        <Textarea rows={3} value={text} invalid={!!error} onChange={(e) => setText(e.target.value)} placeholder="What should the team know?" />
      </Field>
      <div className="flex items-center justify-between gap-2">
        <Button variant="subtle" leftIcon={Paperclip} size="sm">Attach files</Button>
        <Button variant="secondary" onClick={() => { setAttempted(true); if (text.trim()) { setPosted(true); setText(''); setAttempted(false); } }}>Post comment</Button>
      </div>
    </div>
  );
}

export function JobDetail({ status: initial = 'in_progress', state = 'default', onBack }: { status?: JobStatus; state?: DetailState; onBack?: () => void }) {
  const [status, setStatus] = useState<JobStatus>(initial);
  const [tab, setTab] = useState('items');
  const [payments, setPayments] = useState([{ amount: 5000, mode: 'GCash', when: 'Oct 12, 2026' }]);
  const [amount, setAmount] = useState(state === 'validation' ? '99999' : '');
  const [mode, setMode] = useState('GCash');
  const [tried, setTried] = useState(state === 'validation');
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dueOpen, setDueOpen] = useState(false);

  if (state === 'loading') {
    return (
      <div className="space-y-4 pt-2" aria-busy="true">
        <Skeleton className="h-4 w-40" /><Skeleton className="h-8 w-72" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-72 rounded-2xl lg:col-span-2" /><Skeleton className="h-72 rounded-2xl" /></div>
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className="space-y-4 pt-2">
        <Breadcrumbs items={[{ label: 'Jobs', onClick: onBack }, { label: 'Job' }]} />
        <Notice tone="error" title="This job is not available here" icon={WarningOctagon}>
          It may have been removed, or it belongs to another branch. <Button size="sm" variant="secondary" className="ml-2" onClick={onBack}>Back to jobs</Button>
        </Notice>
      </div>
    );
  }

  const locked = isLocked(status);
  const noItems = state === 'empty-items';
  const services = noItems ? [] : JOB_SERVICES;
  const parts = noItems ? [] : JOB_PARTS;
  const t = jobTotals(services, parts);
  const paid = payments.reduce((a, p) => a + p.amount, 0);
  const balance = Math.max(0, t.total - paid);
  const payState = t.total === 0 ? 'No charges' : balance === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
  const amt = Number(amount);
  const amountError = !tried ? undefined : !amount || !(amt > 0) ? 'Enter the amount received.' : amt > balance ? `This is more than the balance of ${peso(balance)}.` : undefined;

  const recordPayment = () => {
    setTried(true);
    if (!(amt > 0) || amt > balance) return;
    setPayments((p) => [...p, { amount: amt, mode, when: 'Oct 17, 2026' }]);
    setAmount(''); setTried(false);
  };

  const emptyItems = (what: string) => (
    <EmptyState title={`No ${what} yet`} description="Add them from the catalogue so the quotation has a cost." action={<Button size="sm" variant="secondary" leftIcon={Plus} disabled={locked}>Add {what}</Button>} />
  );

  return (
    <div className="space-y-4 pt-2">
      <PageHeader
        className="pb-0"
        breadcrumbs={<Breadcrumbs items={[{ label: 'Jobs', onClick: onBack }, { label: 'Job #13' }]} />}
        title="LLK 5515 / Honda Civic"
        description={<span className="inline-flex flex-wrap items-center gap-2"><StatusBadge status={status} />James Castro, +63 95 1225 2522</span>}
        actions={
          <>
            <Button variant="subtle" leftIcon={CalendarBlank} onClick={() => setDueOpen(true)}>Due Oct 19</Button>
            <Menu trigger={<Button variant="secondary" rightIcon={CaretDown}>Change status</Button>} items={nextStatuses(status).map((s) => ({ label: statusMeta(s).label, onSelect: () => setStatus(s) }))} />
          </>
        }
      />

      {locked && <Notice tone="neutral" icon={Lock} title="Completed job">Services and parts are locked. Change the status to reopen the job.</Notice>}

      <Card>
        <DataList stacked className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-6" items={[
          { label: 'Plate no.', value: 'LLK 5515' }, { label: 'Brand', value: 'Honda' }, { label: 'Model', value: 'Civic' },
          { label: 'Year', value: '2012' }, { label: 'Mileage', value: '130,000 km' }, { label: 'Assigned to', value: 'Mechanic One' },
        ]} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Tabs value={tab} onValueChange={setTab} items={[
            { value: 'items', label: 'Services and parts' },
            { value: 'comments', label: 'Comments', badge: COMMENTS.length },
            { value: 'history', label: 'History' },
            { value: 'files', label: 'Attachments', badge: 3 },
          ]}>
            <TabPanel value="items" className="space-y-4">
              <Card padding="none">
                <div className="flex items-center justify-between gap-2 p-4">
                  <div><h2 className="font-semibold">Services</h2><p className="text-xs text-ink-muted">{peso(t.services)} / {services.length} item{services.length === 1 ? '' : 's'}</p></div>
                  <Button size="sm" variant="secondary" leftIcon={Plus} disabled={locked}>Add service</Button>
                </div>
                {services.length === 0 ? emptyItems('services') : (
                  <>
                    <div className="hidden md:block">
                      <Table data={services} rowKey={(s) => s.id} columns={[
                        { key: 'name', header: 'Service', render: (s) => (<div><div className="font-medium">{s.name}</div><div className="text-xs text-ink-muted">{s.description}</div></div>) },
                        { key: 'who', header: 'Assigned to', render: (s) => (s.assignees.length ? s.assignees.join(', ') : <span className="text-ink-muted">Unassigned</span>) },
                        { key: 'status', header: 'Status', render: (s) => <Badge className="whitespace-nowrap" tone={s.status === 'completed' ? 'success' : s.status === 'in_progress' ? 'primary' : 'info'}>{s.status === 'in_progress' ? 'In-progress' : s.status === 'todo' ? 'To-do' : 'Completed'}</Badge> },
                        { key: 'price', header: 'Price', align: 'right', render: (s) => <span className="tabular-nums">{peso(s.price)}</span> },
                        { key: 'a', header: '', align: 'right', render: (s) => (<Menu trigger={<IconButton icon={DotsThreeVertical} label={`Actions for ${s.name}`} variant="subtle" size="sm" />} items={[{ label: `Comments (${s.comments})`, icon: ChatText, onSelect: () => setCommentsFor(s.name) }, { label: 'Assign mechanic' }, { type: 'separator' }, { label: 'Remove', icon: Trash, danger: true, disabled: locked, onSelect: () => setDeleting(s.name) }]} />) },
                      ]} />
                    </div>
                    <ul className="divide-y divide-border/50 md:hidden">
                      {services.map((s) => (
                        <li key={s.id} className="flex items-start justify-between gap-2 px-4 py-3 text-sm">
                          <div className="min-w-0"><p className="font-medium">{s.name}</p><p className="text-xs text-ink-muted">{s.assignees[0] ?? 'Unassigned'}</p><p className="mt-1 tabular-nums">{peso(s.price)}</p></div>
                          <div className="flex items-center gap-1"><Badge tone={s.status === 'completed' ? 'success' : 'primary'}>{s.status === 'completed' ? 'Completed' : 'In-progress'}</Badge>
                            <Menu trigger={<IconButton icon={DotsThreeVertical} label={`Actions for ${s.name}`} variant="subtle" />} items={[{ label: `Comments (${s.comments})`, icon: ChatText, onSelect: () => setCommentsFor(s.name) }, { label: 'Remove', icon: Trash, danger: true, disabled: locked, onSelect: () => setDeleting(s.name) }]} /></div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
              <Card padding="none">
                <div className="flex items-center justify-between gap-2 p-4">
                  <div><h2 className="font-semibold">Parts</h2><p className="text-xs text-ink-muted">{peso(t.parts)} / {parts.length} item{parts.length === 1 ? '' : 's'}</p></div>
                  <Button size="sm" variant="secondary" leftIcon={Plus} disabled={locked}>Add part</Button>
                </div>
                {parts.length === 0 ? emptyItems('parts') : (
                  <>
                    <div className="hidden md:block">
                      <Table data={parts} rowKey={(p) => p.id} columns={[
                        { key: 'name', header: 'Part', render: (p) => (<div><div className="font-medium">{p.name}</div><div className="text-xs text-ink-muted">{p.sku}</div></div>) },
                        { key: 'qty', header: 'Qty', render: (p) => `${p.qty} ${p.unit}` },
                        { key: 'unit', header: 'Unit price', align: 'right', render: (p) => <span className="tabular-nums">{peso(p.unitPrice)}</span> },
                        { key: 'total', header: 'Total', align: 'right', render: (p) => <span className="tabular-nums">{peso(p.qty * p.unitPrice)}</span> },
                        { key: 'a', header: '', align: 'right', render: (p) => (<Menu trigger={<IconButton icon={DotsThreeVertical} label={`Actions for ${p.name}`} variant="subtle" size="sm" />} items={[{ label: 'Remove', icon: Trash, danger: true, disabled: locked, onSelect: () => setDeleting(p.name) }]} />) },
                      ]} />
                    </div>
                    <ul className="divide-y divide-border/50 md:hidden">
                      {parts.map((p) => (
                        <li key={p.id} className="flex items-start justify-between gap-2 px-4 py-3 text-sm">
                          <div className="min-w-0"><p className="font-medium">{p.name}</p><p className="text-xs text-ink-muted">{p.qty} {p.unit} x {peso(p.unitPrice)}</p></div>
                          <div className="flex items-center gap-1"><span className="tabular-nums">{peso(p.qty * p.unitPrice)}</span>
                            <Menu trigger={<IconButton icon={DotsThreeVertical} label={`Actions for ${p.name}`} variant="subtle" />} items={[{ label: 'Remove', icon: Trash, danger: true, disabled: locked, onSelect: () => setDeleting(p.name) }]} /></div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            </TabPanel>
            <TabPanel value="comments"><Card><CommentThread tried={state === 'validation'} /></Card></TabPanel>
            <TabPanel value="history">
              <Card><ul className="space-y-3 text-sm">
                {[['Staff Member', 'moved the job from To-do to In-progress', 'Oct 13, 2026'], ['Staff Member', 'approved the quotation', 'Oct 12, 2026'], ['James Castro', 'confirmed the quotation', 'Oct 12, 2026'], ['Staff Member', 'created the quotation', 'Oct 12, 2026']].map(([who, what, when], i) => (
                  <li key={i} className="flex gap-3"><Avatar name={who} size="xs" /><div><p><span className="font-medium">{who}</span> {what}</p><p className="text-xs text-ink-muted">{when}</p></div></li>
                ))}
              </ul></Card>
            </TabPanel>
            <TabPanel value="files">
              <Card><ul className="space-y-2 text-sm">{[['engine-bay.jpg', '0.9 MB'], ['dashboard-warning.jpg', '0.4 MB'], ['quote-note.pdf', '0.3 MB']].map(([n, s]) => <li key={n} className="flex items-center justify-between gap-2"><span className="inline-flex min-w-0 items-center gap-2 truncate"><Paperclip size={16} />{n}</span><span className="text-ink-muted">{s}</span></li>)}</ul></Card>
            </TabPanel>
          </Tabs>
        </div>

        <Card id="payment" className="h-fit space-y-4 lg:sticky lg:top-2">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Payment and invoice</h2><Badge tone={payState === 'Paid' ? 'success' : payState === 'Partial' ? 'warning' : 'neutral'} dot>{payState}</Badge></div>
          <div className="space-y-1">
            <DataList items={[{ label: 'Services', value: <span className="tabular-nums">{peso(t.services)}</span> }, { label: 'Parts', value: <span className="tabular-nums">{peso(t.parts)}</span> }, { label: 'Total', value: <span className="font-semibold tabular-nums">{peso(t.total)}</span> }, { label: 'Paid', value: <span className="tabular-nums">{peso(paid)}</span> }]} />
            <div className="rounded-xl bg-surface-subtle p-3"><p className="text-xs text-ink-muted">Balance</p><p className="text-2xl font-semibold tabular-nums">{peso(balance)}</p></div>
          </div>
          {payments.length > 0 && (
            <ul className="space-y-1 text-sm">{payments.map((p, i) => <li key={i} className="flex justify-between gap-2"><span className="text-ink-muted">{p.when} / {p.mode}</span><span className="tabular-nums">{peso(p.amount)}</span></li>)}</ul>
          )}
          {balance > 0 ? (
            <div className="space-y-3">
              <Field label="Amount received" error={amountError}><Input inputMode="decimal" value={amount} invalid={!!amountError} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></Field>
              <Field label="Mode of payment"><Select value={mode} onValueChange={setMode} options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))} /></Field>
              <Button fullWidth onClick={recordPayment}>Record payment</Button>
            </div>
          ) : (
            <Notice tone="success">Fully paid. No balance left on this job.</Notice>
          )}
          <div className="flex items-center justify-between gap-2 pt-1 text-sm">
            <span className="text-ink-muted">Invoice INV-2026-0013</span>
            <Button variant="secondary" size="sm" leftIcon={DownloadSimple} disabled={noItems}>Download PDF</Button>
          </div>
        </Card>
      </div>

      <OffCanvas open={commentsFor !== null} onOpenChange={(o) => !o && setCommentsFor(null)} title={`Comments: ${commentsFor ?? ''}`} width="440px">
        <CommentThread filter={commentsFor ?? undefined} />
      </OffCanvas>
      <ConfirmDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)} title={`Remove ${deleting}?`} description="It is removed from this job and the total is recalculated." confirmLabel="Remove" tone="danger" onConfirm={() => setDeleting(null)} />
      <Modal open={dueOpen} onOpenChange={setDueOpen} title="Change due date" size="sm" footer={<><Button variant="subtle" onClick={() => setDueOpen(false)}>Cancel</Button><Button onClick={() => setDueOpen(false)}>Save due date</Button></>}>
        <Field label="Due date"><Input type="date" defaultValue="2026-10-19" /></Field>
      </Modal>
    </div>
  );
}
