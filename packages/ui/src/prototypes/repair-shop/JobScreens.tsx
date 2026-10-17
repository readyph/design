import { useMemo, useRef, useState } from 'react';
import {
  Plus, DownloadSimple, CalendarBlank, DotsThreeVertical, ChatText, Trash, CaretDown, Paperclip, ClipboardText, Lock, CheckCircle,
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
import { toast } from '../../components/toast/toastStore';
import { QuotationIntake, type IntakeScenario, type NewQuotation } from './QuotationIntake';
import { LedaSlot } from './Leda';
import { Page, RetryNotice, Section } from './Page';
import {
  BRANCHES, JOBS, JOB_SERVICES, JOB_PARTS, JOB_STATUSES, PAYMENT_MODES,
  attentionReason, isDueToday, isLocked, isOverdue, jobTotals, nextAction, nextStatuses, peso, statusMeta,
  type Job, type JobPart, type JobService, type JobStatus, type NextAction,
} from './data';

const PAGE_SIZE = 8;
const branchOf = (id: string) => (BRANCHES.find((b) => b.id === id) ?? BRANCHES[0]).name;

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

/** The one suggested next step for a row. Secondary on rows: the only primary in a view is "New quotation" or the detail header. */
function NextButton({ job, onAdvance }: { job: Job; onAdvance?: (j: Job, a: NextAction) => void }) {
  const a = nextAction(job.status, job.balance);
  if (!a) return <span className="text-xs text-ink-muted">Nothing left to do</span>;
  return <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onAdvance?.(job, a); }}>{a.label}</Button>;
}

/** Shared by Today and Jobs: advance a job from its next action, or open it when the step needs input. */
export interface JobFlowProps {
  jobs?: Job[];
  onOpenJob?: (j: Job) => void;
  onAdvance?: (j: Job, a: NextAction) => void;
  onCreated?: (q: NewQuotation) => void;
}

// ---------------------------------------------------------------- Today

export type TodayState = 'default' | 'clear' | 'loading' | 'error';

export function TodayPage({
  state = 'default', branchId = 'davao', jobs = JOBS, intake, onOpenJob, onAdvance, onCreated,
}: { state?: TodayState; branchId?: string; intake?: IntakeScenario } & JobFlowProps) {
  const branchName = branchOf(branchId);
  const [intakeOpen, setIntakeOpen] = useState(intake !== undefined);
  const pending = state === 'loading' || state === 'error';
  const source = useMemo(() => (state === 'clear' ? [] : jobs.filter((j) => j.branch === branchId)), [state, jobs, branchId]);

  const dueToday = source.filter(isDueToday);
  const waiting = source.filter((j) => j.status === 'for_approval');
  const unpaid = source.filter((j) => j.balance > 0 && (j.status === 'for_pickup' || j.status === 'completed'));
  const rank = (j: Job) => ({ Overdue: 0, 'Due today': 1, 'Waiting on customer': 2 }[attentionReason(j)?.label ?? ''] ?? 3);
  const attention = source.filter((j) => attentionReason(j)).sort((a, b) => rank(a) - rank(b));

  return (
    <Page>
      <PageHeader
        className="pb-0"
        title="Today"
        description={`${branchName} \u00b7 Today`}
        actions={<Button leftIcon={Plus} onClick={() => setIntakeOpen(true)}>New quotation</Button>}
      />

      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {pending ? (
            ['Due today', 'Waiting on customer', 'Unpaid'].map((l) => <Stat key={l} label={l} value={<Skeleton className="h-8 w-12" />} />)
          ) : (
            <>
              <Stat label="Due today" value={dueToday.length} />
              <Stat label="Waiting on customer" value={waiting.length} />
              <Stat label="Unpaid" value={unpaid.length} delta={unpaid.length ? peso(unpaid.reduce((a, j) => a + j.balance, 0)) : undefined} deltaTone="error" />
            </>
          )}
        </div>
      </Card>

      <Section title="Needs attention">
        {state === 'error' ? (
          <RetryNotice title="Could not load today's jobs">Check your connection and try again.</RetryNotice>
        ) : state === 'loading' ? (
          <ul className="flex flex-col gap-3" aria-busy="true">
            {[0, 1, 2].map((i) => <li key={i}><Card className="flex flex-col gap-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-64" /><Skeleton className="h-5 w-24" /></Card></li>)}
          </ul>
        ) : attention.length === 0 ? (
          <Card><EmptyState icon={CheckCircle} title="All clear" description={`Nothing is due, waiting on a customer or unpaid in ${branchName}. Start a quotation when a customer walks in.`} /></Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {attention.map((j) => {
              const why = attentionReason(j)!;
              return (
                <li key={j.id}>
                  <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button className="flex min-h-12 min-w-0 flex-1 flex-col gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" onClick={() => onOpenJob?.(j)}>
                      <span className="flex flex-wrap items-center gap-2"><span className="font-medium">{j.customer}</span><Badge tone={why.tone} size="sm">{why.label}</Badge></span>
                      <span className="text-sm text-ink-muted">{j.plate} / {j.brand} {j.model} / #{j.id} / <StatusBadge status={j.status} /></span>
                    </button>
                    <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                      <NextButton job={j} onAdvance={onAdvance} />
                      <LedaSlot />
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <QuotationIntake open={intakeOpen} onOpenChange={setIntakeOpen} scenario={intake} onCreated={onCreated} />
    </Page>
  );
}

// ---------------------------------------------------------------- Job list

export type ListState = 'default' | 'empty-tab' | 'empty-branch' | 'loading' | 'error';

/**
 * Full job list. The seven statuses are a single field that staff can move between freely, so a drag board would
 * imply rules that do not exist; status tabs with counts and filters work on a phone. Each row suggests one next action.
 * The "what needs me today" strip lives on the Today page.
 */
export function JobList({
  state = 'default', initialTab = 'all', initialQuery = '', branchId = 'davao', jobs = JOBS, intake, onOpenJob, onAdvance, onCreated,
}: {
  state?: ListState; initialTab?: string; initialQuery?: string; branchId?: string; intake?: IntakeScenario;
} & JobFlowProps) {
  const branchName = branchOf(branchId);
  const [tab, setTab] = useState(initialTab);
  const [q, setQ] = useState(initialQuery);
  const [who, setWho] = useState('any');
  const [due, setDue] = useState('any');
  const [page, setPage] = useState(1);
  const [intakeOpen, setIntakeOpen] = useState(intake !== undefined);

  const source = useMemo(() => (state === 'empty-branch' || state === 'empty-tab' ? [] : jobs.filter((j) => j.branch === branchId)), [state, jobs, branchId]);
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
  const pending = state === 'loading' || state === 'error';

  const columns: TableColumn<Job>[] = [
    { key: 'job', header: 'Job', render: (j) => (<div className="flex flex-col"><span className="font-medium">{j.customer}</span><span className="text-xs text-ink-muted">#{j.id} / {j.phone}</span></div>) },
    { key: 'vehicle', header: 'Vehicle', render: (j) => (<div className="flex flex-col"><span className="font-medium">{j.plate}</span><span className="text-xs text-ink-muted">{j.brand} {j.model}</span></div>) },
    { key: 'assignee', header: 'Assigned to', render: (j) => (j.assignee ? <span className="inline-flex items-center gap-2"><Avatar name={j.assignee} size="xs" />{j.assignee}</span> : <span className="text-ink-muted">Unassigned</span>) },
    { key: 'status', header: 'Status', render: (j) => <StatusBadge status={j.status} /> },
    { key: 'due', header: 'Due date', render: (j) => <DueCell job={j} /> },
    { key: 'next', header: 'Next action', render: (j) => (<div className="flex flex-col items-start gap-2"><NextButton job={j} onAdvance={onAdvance} /><LedaSlot /></div>) },
  ];

  const empty = (
    <EmptyState
      icon={ClipboardText}
      title={state === 'empty-branch' ? `No jobs in ${branchName} yet` : q || who !== 'any' || due !== 'any' ? 'No job matches these filters' : 'No jobs in this status'}
      description={state === 'empty-branch' ? 'Create the first quotation for a walk-in customer.' : 'Clear a filter or pick another status.'}
      action={<Button size="sm" variant="secondary" leftIcon={Plus} onClick={() => setIntakeOpen(true)}>New quotation</Button>}
    />
  );

  return (
    <Page>
      <PageHeader
        className="pb-0"
        title="Jobs"
        description={`${branchName} \u00b7 All jobs, from quotation to pick-up`}
        actions={<Button leftIcon={Plus} onClick={() => setIntakeOpen(true)}>New quotation</Button>}
      />

      <div className="flex flex-col gap-3">
        <Tabs
          variant="pill"
          value={tab}
          onValueChange={(v) => { setTab(v); setPage(1); }}
          items={[{ value: 'all', label: 'All', badge: pending ? undefined : counts.all }, ...JOB_STATUSES.map((s) => ({ value: s.value, label: s.label, badge: pending ? undefined : counts[s.value] }))]}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchBar aria-label="Search jobs" className="sm:max-w-sm sm:flex-1" placeholder="Search jobs" value={q} onValueChange={(v) => { setQ(v); setPage(1); }} onClear={() => setQ('')} />
          <Field label={<span className="sr-only">Filter by assignee</span>} className="gap-0 sm:w-44"><Select value={who} onValueChange={setWho} options={[{ value: 'any', label: 'Anyone' }, { value: 'none', label: 'Unassigned' }, { value: 'Rey Bautista', label: 'Rey Bautista' }, { value: 'Dennis Alcala', label: 'Dennis Alcala' }, { value: 'Carlo Reyes', label: 'Carlo Reyes' }, { value: 'Joel Mendoza', label: 'Joel Mendoza' }, { value: 'Maricel Santos', label: 'Maricel Santos' }]} /></Field>
          <Field label={<span className="sr-only">Filter by due date</span>} className="gap-0 sm:w-44"><Select value={due} onValueChange={setDue} options={[{ value: 'any', label: 'Any due date' }, { value: 'overdue', label: 'Overdue' }, { value: 'today', label: 'Due today' }]} /></Field>
        </div>
      </div>

      {state === 'error' ? (
        <RetryNotice title="Could not load jobs">Check your connection and try again.</RetryNotice>
      ) : (
        <>
          <Card padding="none" className="hidden md:block">
            <Table columns={columns} data={paged} rowKey={(j) => j.id} loading={state === 'loading'} empty={empty} onRowClick={onOpenJob} />
          </Card>
          <ul className="flex flex-col gap-3 md:hidden">
            {state === 'loading' && [0, 1, 2, 3].map((i) => <li key={i}><Card className="flex flex-col gap-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /><Skeleton className="h-5 w-24" /></Card></li>)}
            {state !== 'loading' && paged.length === 0 && <li><Card>{empty}</Card></li>}
            {state !== 'loading' && paged.map((j) => (
              <li key={j.id}>
                <Card interactive className="flex flex-col gap-3">
                  <button className="flex min-h-12 w-full flex-col gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" onClick={() => onOpenJob?.(j)}>
                    <span className="flex items-center justify-between gap-2"><span className="font-medium">{j.customer}</span><StatusBadge status={j.status} /></span>
                    <span className="text-sm text-ink-muted">{j.plate} / {j.brand} {j.model} / #{j.id}</span>
                    <span className="flex items-center justify-between gap-2 text-sm"><span className="text-ink-muted">{j.assignee ?? 'Unassigned'}</span><DueCell job={j} /></span>
                  </button>
                  <div className="flex flex-wrap items-center justify-between gap-3"><NextButton job={j} onAdvance={onAdvance} /><LedaSlot /></div>
                </Card>
              </li>
            ))}
          </ul>
          {state !== 'loading' && rows.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
              <span>{rows.length} job{rows.length === 1 ? '' : 's'}</span>
              <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / PAGE_SIZE))} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      <QuotationIntake open={intakeOpen} onOpenChange={setIntakeOpen} scenario={intake} onCreated={onCreated} />
    </Page>
  );
}

// ---------------------------------------------------------------- Job detail

export type DetailState = 'default' | 'loading' | 'error' | 'validation' | 'empty-items';

const COMMENTS = [
  { who: 'Rey Bautista', text: 'Terminals were corroded. Cleaned them and replaced the battery.', when: 'Oct 13, 2026, 10:12 AM', on: 'Battery Services' },
  { who: 'Maricel Santos', text: 'Discounted by manager.', when: 'Oct 12, 2026, 5:37 PM', on: null as string | null },
];

function CommentThread({ filter, tried }: { filter?: string; tried?: boolean }) {
  const [text, setText] = useState('');
  const [posted, setPosted] = useState(false);
  const [attempted, setAttempted] = useState(!!tried);
  const list = COMMENTS.filter((c) => !filter || c.on === filter);
  const error = attempted && !text.trim() ? 'Write a comment before posting.' : undefined;
  return (
    <div className="flex flex-col gap-4">
      {list.length === 0 && <EmptyState icon={ChatText} title="No comments yet" description="Notes added here are visible to everyone on this job." />}
      <ul className="flex flex-col gap-4">
        {list.map((c, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <Avatar name={c.who} size="sm" />
            <div className="flex min-w-0 flex-col gap-1">
              <p><span className="font-medium">{c.who}</span> <span className="text-xs text-ink-muted">{c.when}{c.on ? ` / ${c.on}` : ''}</span></p>
              <p>{c.text}</p>
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

const DEFAULT_JOB = JOBS.find((j) => j.id === 13)!;

export function JobDetail({
  job = DEFAULT_JOB, status: initial, state = 'default', branchName = 'Davao City', items, onBack, onStatusChange,
}: {
  job?: Job; status?: JobStatus; state?: DetailState; branchName?: string;
  /** Lines for a job just created from the intake drawer; otherwise the sample job's lines. */
  items?: { services: JobService[]; parts: JobPart[] };
  onBack?: () => void; onStatusChange?: (id: number, s: JobStatus) => void;
}) {
  const [status, setStatus] = useState<JobStatus>(initial ?? job.status);
  const [tab, setTab] = useState('items');
  const [payments, setPayments] = useState(items ? [] : [{ amount: 5000, mode: 'GCash', when: 'Oct 12, 2026' }]);
  const [amount, setAmount] = useState(state === 'validation' ? '99999' : '');
  const [mode, setMode] = useState('GCash');
  const [tried, setTried] = useState(state === 'validation');
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dueOpen, setDueOpen] = useState(false);
  const payRef = useRef<HTMLDivElement>(null);

  if (state === 'loading') {
    return (
      <Page>
        <div aria-busy="true" className="flex flex-col gap-3"><Skeleton className="h-4 w-40" /><Skeleton className="h-8 w-72" /></div>
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-72 rounded-lg lg:col-span-2" /><Skeleton className="h-72 rounded-lg" /></div>
      </Page>
    );
  }
  if (state === 'error') {
    return (
      <Page>
        <Breadcrumbs items={[{ label: 'Jobs', onClick: onBack }, { label: 'Job' }]} />
        <RetryNotice title="This job is not available here" onRetry={onBack}>It may have been removed, or it belongs to another branch.</RetryNotice>
      </Page>
    );
  }

  const locked = isLocked(status);
  const noItems = state === 'empty-items';
  const services = noItems ? [] : items?.services ?? JOB_SERVICES;
  const parts = noItems ? [] : items?.parts ?? JOB_PARTS;
  const t = jobTotals(services, parts);
  const paid = payments.reduce((a, p) => a + p.amount, 0);
  const balance = Math.max(0, t.total - paid);
  const payState = t.total === 0 ? 'No charges' : balance === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
  const amt = Number(amount);
  const amountError = !tried ? undefined : !amount || !(amt > 0) ? 'Enter the amount received.' : amt > balance ? `This is more than the balance of ${peso(balance)}.` : undefined;
  const action = nextAction(status, balance);

  const move = (s: JobStatus) => {
    setStatus(s);
    onStatusChange?.(job.id, s);
    toast.success(`Job #${job.id} is now ${statusMeta(s).label}.`);
  };
  const recordPayment = () => {
    setTried(true);
    if (!(amt > 0) || amt > balance) return;
    setPayments((p) => [...p, { amount: amt, mode, when: 'Oct 17, 2026' }]);
    setAmount(''); setTried(false);
    toast.success(`Payment of ${peso(amt)} recorded.`);
  };
  const runNext = () => {
    if (!action) return;
    if (action.key === 'pay') {
      if (amount) { recordPayment(); return; }
      const el = payRef.current?.querySelector<HTMLInputElement>('input');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus({ preventScroll: true });
      return;
    }
    if (action.to) move(action.to);
  };

  const emptyItems = (what: string) => (
    <EmptyState title={`No ${what} yet`} description="Add them from the catalogue so the quotation has a cost." action={<Button size="sm" variant="secondary" leftIcon={Plus} disabled={locked}>Add {what}</Button>} />
  );
  const sectionHead = (title: string, sub: string, add: string) => (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-col"><h2 className="font-semibold">{title}</h2><p className="text-xs text-ink-muted">{sub}</p></div>
      <Button size="sm" variant="secondary" leftIcon={Plus} disabled={locked}>{add}</Button>
    </div>
  );

  return (
    <Page>
      <PageHeader
        className="pb-0"
        breadcrumbs={<Breadcrumbs items={[{ label: 'Jobs', onClick: onBack }, { label: `Job #${job.id}` }]} />}
        title={`${job.plate} / ${job.brand} ${job.model}`}
        description={<span className="inline-flex flex-wrap items-center gap-2"><StatusBadge status={status} />{job.customer}, {job.phone} {'·'} {branchName}</span>}
        actions={
          <>
            <Button variant="subtle" leftIcon={CalendarBlank} onClick={() => setDueOpen(true)}>Due {job.due.replace(', 2026', '')}</Button>
            <Menu
              trigger={<Button variant="secondary" rightIcon={CaretDown}>Change status</Button>}
              items={[{ type: 'label', label: 'Move or correct the status' }, ...nextStatuses(status).map((s) => ({ label: statusMeta(s).label, onSelect: () => move(s) }))]}
            />
            {action && <Button className="max-md:hidden" onClick={runNext}>{action.label}</Button>}
          </>
        }
      />

      {locked && <Notice tone="neutral" icon={Lock} title="Completed job">Services and parts are locked. Change the status to reopen the job.</Notice>}

      <Card>
        <DataList stacked className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" items={[
          { label: 'Plate no.', value: job.plate }, { label: 'Brand', value: job.brand }, { label: 'Model', value: job.model },
          { label: 'Year', value: '2012' }, { label: 'Mileage', value: '130,000 km' }, { label: 'Assigned to', value: job.assignee ?? 'Unassigned' },
        ]} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Tabs value={tab} onValueChange={setTab} items={[
            { value: 'items', label: 'Services and parts' },
            { value: 'comments', label: 'Comments', badge: COMMENTS.length },
            { value: 'history', label: 'History' },
            { value: 'files', label: 'Attachments', badge: 3 },
          ]}>
            <TabPanel value="items" className="flex flex-col gap-6">
              <Card className="flex flex-col gap-4">
                {sectionHead('Services', `${peso(t.services)} / ${services.length} item${services.length === 1 ? '' : 's'}`, 'Add service')}
                {services.length === 0 ? emptyItems('services') : (
                  <>
                    <div className="hidden md:block">
                      <Table data={services} rowKey={(s) => s.id} columns={[
                        { key: 'name', header: 'Service', render: (s) => (<div className="flex flex-col"><span className="font-medium">{s.name}</span><span className="text-xs text-ink-muted">{s.description}</span></div>) },
                        { key: 'who', header: 'Assigned to', render: (s) => (s.assignees.length ? s.assignees.join(', ') : <span className="text-ink-muted">Unassigned</span>) },
                        { key: 'status', header: 'Status', render: (s) => <Badge className="whitespace-nowrap" tone={s.status === 'completed' ? 'success' : s.status === 'in_progress' ? 'primary' : 'info'}>{s.status === 'in_progress' ? 'In progress' : s.status === 'todo' ? 'To-do' : 'Completed'}</Badge> },
                        { key: 'price', header: 'Price', align: 'right', render: (s) => <span className="tabular-nums">{peso(s.price)}</span> },
                        { key: 'a', header: '', align: 'right', render: (s) => (<Menu trigger={<IconButton icon={DotsThreeVertical} label={`Actions for ${s.name}`} variant="subtle" size="sm" />} items={[{ label: `Comments (${s.comments})`, icon: ChatText, onSelect: () => setCommentsFor(s.name) }, { label: 'Assign mechanic' }, { type: 'separator' }, { label: 'Remove', icon: Trash, danger: true, disabled: locked, onSelect: () => setDeleting(s.name) }]} />) },
                      ]} />
                    </div>
                    <ul className="flex flex-col gap-3 md:hidden">
                      {services.map((s) => (
                        <li key={s.id} className="flex items-start justify-between gap-2 text-sm">
                          <div className="flex min-w-0 flex-col gap-1"><p className="font-medium">{s.name}</p><p className="text-xs text-ink-muted">{s.assignees[0] ?? 'Unassigned'}</p><p className="tabular-nums">{peso(s.price)}</p></div>
                          <div className="flex items-center gap-2"><Badge tone={s.status === 'completed' ? 'success' : 'primary'}>{s.status === 'completed' ? 'Completed' : 'In progress'}</Badge>
                            <Menu trigger={<IconButton icon={DotsThreeVertical} label={`Actions for ${s.name}`} variant="subtle" />} items={[{ label: `Comments (${s.comments})`, icon: ChatText, onSelect: () => setCommentsFor(s.name) }, { label: 'Remove', icon: Trash, danger: true, disabled: locked, onSelect: () => setDeleting(s.name) }]} /></div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
              <Card className="flex flex-col gap-4">
                {sectionHead('Parts', `${peso(t.parts)} / ${parts.length} item${parts.length === 1 ? '' : 's'}`, 'Add part')}
                {parts.length === 0 ? emptyItems('parts') : (
                  <>
                    <div className="hidden md:block">
                      <Table data={parts} rowKey={(p) => p.id} columns={[
                        { key: 'name', header: 'Part', render: (p) => (<div className="flex flex-col"><span className="font-medium">{p.name}</span><span className="text-xs text-ink-muted">{p.sku}</span></div>) },
                        { key: 'qty', header: 'Qty', render: (p) => `${p.qty} ${p.unit}` },
                        { key: 'unit', header: 'Unit price', align: 'right', render: (p) => <span className="tabular-nums">{peso(p.unitPrice)}</span> },
                        { key: 'total', header: 'Total', align: 'right', render: (p) => <span className="tabular-nums">{peso(p.qty * p.unitPrice)}</span> },
                        { key: 'a', header: '', align: 'right', render: (p) => (<Menu trigger={<IconButton icon={DotsThreeVertical} label={`Actions for ${p.name}`} variant="subtle" size="sm" />} items={[{ label: 'Remove', icon: Trash, danger: true, disabled: locked, onSelect: () => setDeleting(p.name) }]} />) },
                      ]} />
                    </div>
                    <ul className="flex flex-col gap-3 md:hidden">
                      {parts.map((p) => (
                        <li key={p.id} className="flex items-start justify-between gap-2 text-sm">
                          <div className="flex min-w-0 flex-col gap-1"><p className="font-medium">{p.name}</p><p className="text-xs text-ink-muted">{p.qty} {p.unit} x {peso(p.unitPrice)}</p></div>
                          <div className="flex items-center gap-2"><span className="tabular-nums">{peso(p.qty * p.unitPrice)}</span>
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
              <Card><ul className="flex flex-col gap-3 text-sm">
                {[['Maricel Santos', 'moved the job from To-do to In progress', 'Oct 13, 2026'], ['Maricel Santos', 'approved the quotation', 'Oct 12, 2026'], [job.customer, 'confirmed the quotation', 'Oct 12, 2026'], ['Maricel Santos', 'created the quotation', 'Oct 12, 2026']].map(([who, what, when], i) => (
                  <li key={i} className="flex gap-3"><Avatar name={who} size="xs" /><div className="flex flex-col"><p><span className="font-medium">{who}</span> {what}</p><p className="text-xs text-ink-muted">{when}</p></div></li>
                ))}
              </ul></Card>
            </TabPanel>
            <TabPanel value="files">
              <Card><ul className="flex flex-col gap-2 text-sm">{[['engine-bay.jpg', '0.9 MB'], ['dashboard-warning.jpg', '0.4 MB'], ['quote-note.pdf', '0.3 MB']].map(([n, s]) => <li key={n} className="flex items-center justify-between gap-2"><span className="inline-flex min-w-0 items-center gap-2 truncate"><Paperclip size={16} />{n}</span><span className="text-ink-muted">{s}</span></li>)}</ul></Card>
            </TabPanel>
          </Tabs>
        </div>

        <div className="flex h-fit flex-col gap-6 lg:sticky lg:top-2">
          <LedaSlot variant="panel" />
          <Card id="payment" ref={payRef} className="flex scroll-mt-4 flex-col gap-4">
            <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Payment and invoice</h2><Badge tone={payState === 'Paid' ? 'success' : payState === 'Partial' ? 'warning' : 'neutral'} dot>{payState}</Badge></div>
            <div className="flex flex-col gap-3">
              <DataList items={[{ label: 'Services', value: <span className="tabular-nums">{peso(t.services)}</span> }, { label: 'Parts', value: <span className="tabular-nums">{peso(t.parts)}</span> }, { label: 'Total', value: <span className="font-semibold tabular-nums">{peso(t.total)}</span> }, { label: 'Paid', value: <span className="tabular-nums">{peso(paid)}</span> }]} />
              <div className="flex flex-col gap-1 rounded-xl bg-surface-subtle p-3"><p className="text-xs text-ink-muted">Balance</p><p className="text-2xl font-semibold tabular-nums">{peso(balance)}</p></div>
            </div>
            {payments.length > 0 && (
              <ul className="flex flex-col gap-2 text-sm">{payments.map((p, i) => <li key={i} className="flex justify-between gap-2"><span className="text-ink-muted">{p.when} / {p.mode}</span><span className="tabular-nums">{peso(p.amount)}</span></li>)}</ul>
            )}
            {balance > 0 ? (
              <div className="flex flex-col gap-4">
                <Field label="Amount received" error={amountError}><Input inputMode="decimal" value={amount} invalid={!!amountError} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></Field>
                <Field label="Mode of payment"><Select value={mode} onValueChange={setMode} options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))} /></Field>
                <Button fullWidth variant="secondary" onClick={recordPayment}>Record payment</Button>
              </div>
            ) : (
              <Notice tone="success">Fully paid. No balance left on this job.</Notice>
            )}
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-ink-muted">Invoice INV-2026-{String(job.id).padStart(4, '0')}</span>
              <Button variant="secondary" size="sm" leftIcon={DownloadSimple} disabled={noItems}>Download PDF</Button>
            </div>
          </Card>
        </div>
      </div>

      {action && (
        <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 bg-surface px-4 py-3 shadow-lg md:hidden">
          <div className="flex flex-col"><p className="text-xs text-ink-muted">Balance</p><p className="text-lg font-semibold tabular-nums">{peso(balance)}</p></div>
          <Button onClick={runNext}>{action.label}</Button>
        </div>
      )}

      <OffCanvas open={commentsFor !== null} onOpenChange={(o) => !o && setCommentsFor(null)} title={`Comments: ${commentsFor ?? ''}`} width="440px">
        <CommentThread filter={commentsFor ?? undefined} />
      </OffCanvas>
      <ConfirmDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)} title={`Remove ${deleting}?`} description="It is removed from this job and the total is recalculated." confirmLabel="Remove" tone="danger" onConfirm={() => setDeleting(null)} />
      <Modal open={dueOpen} onOpenChange={setDueOpen} title="Change due date" size="sm" footer={<><Button variant="subtle" onClick={() => setDueOpen(false)}>Cancel</Button><Button onClick={() => setDueOpen(false)}>Save due date</Button></>}>
        <Field label="Due date"><Input type="date" defaultValue="2026-10-19" /></Field>
      </Modal>
    </Page>
  );
}
