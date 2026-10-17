import { useMemo, useRef, useState } from 'react';
import {
  Plus, DownloadSimple, CalendarBlank, DotsThree, ChatText, Trash, CaretDown, Paperclip, ClipboardText, Lock, CheckCircle,
  CalendarCheck, Hourglass, Receipt, Warning, Clock, ArrowRight, UserPlus, type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataList } from '../../components/DataList';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { Menu } from '../../components/Menu';
import { Modal } from '../../components/Modal';
import { Notice } from '../../components/Notice';
import { OffCanvas } from '../../components/Drawer';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { SearchBar } from '../../components/SearchBar';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { Skeleton } from '../../components/Skeleton';
import { Table, type TableColumn } from '../../components/Table';
import { Tabs, TabPanel } from '../../components/Tabs';
import { Textarea } from '../../components/Textarea';
import { toast } from '../../components/toast/toastStore';
import { QuotationIntake, type IntakeScenario, type NewQuotation } from './QuotationIntake';
import { LedaSlot } from './Leda';
import { BackButton, Caption, Page, RetryNotice } from './Page';
import {
  BRANCHES, JOBS, JOB_SERVICES, JOB_PARTS, JOB_STATUSES, PAYMENT_MODES,
  attentionReason, isDueToday, isLocked, isOverdue, jobTotals, nextAction, nextStatuses, peso, statusMeta,
  type Job, type JobPart, type JobService, type JobStatus, type NextAction,
} from './data';

const PAGE_SIZE = 8;
const branchOf = (id: string) => (BRANCHES.find((b) => b.id === id) ?? BRANCHES[0]).name;

export function StatusBadge({ status }: { status: JobStatus }) {
  const m = statusMeta(status);
  return <Badge className="whitespace-nowrap" tone={m.tone} dot>{m.label}</Badge>;
}

function DueCell({ job }: { job: Job }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2 whitespace-nowrap">
      {job.due}
      {isOverdue(job) && <Badge tone="error" size="sm">Overdue</Badge>}
      {isDueToday(job) && <Badge tone="warning" size="sm">Today</Badge>}
    </span>
  );
}

/** The one suggested next step for an attention row. Secondary: the only primary in a view is "New quotation" or the detail header. */
function NextButton({ job, onAdvance }: { job: Job; onAdvance?: (j: Job, a: NextAction) => void }) {
  const a = nextAction(job.status, job.balance);
  if (!a) return <span className="text-xs text-ink-muted">Nothing left to do</span>;
  return <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onAdvance?.(job, a); }}>{a.label}</Button>;
}

/** Row menu for a job: the next action first, then the rest. Stops the click so the row does not also open. */
function JobMenu({ job, onOpenJob, onAdvance }: { job: Job; onOpenJob?: (j: Job) => void; onAdvance?: (j: Job, a: NextAction) => void }) {
  const a = nextAction(job.status, job.balance);
  return (
    <span onClick={(e) => e.stopPropagation()}>
      <Menu
        trigger={<IconButton icon={DotsThree} label={`Actions for job ${job.id}`} variant="subtle" size="sm" />}
        items={[
          ...(a ? [{ label: a.label, icon: ArrowRight, onSelect: () => onAdvance?.(job, a) }, { type: 'separator' as const }] : []),
          { label: 'Open job', onSelect: () => onOpenJob?.(job) },
          { label: job.assignee ? 'Reassign' : 'Assign mechanic', icon: UserPlus },
        ]}
      />
    </span>
  );
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

const REASON_ICON: Record<'error' | 'warning' | 'info', { icon: PhosphorIcon; cls: string }> = {
  error: { icon: Warning, cls: 'bg-error/10 text-error' },
  warning: { icon: Clock, cls: 'bg-warning/10 text-warning' },
  info: { icon: Hourglass, cls: 'bg-info/10 text-info' },
};

export function TodayPage({
  state = 'default', branchId = 'davao', jobs = JOBS, intake, onOpenJob, onAdvance, onCreated,
}: { state?: TodayState; branchId?: string; intake?: IntakeScenario } & JobFlowProps) {
  const branchName = branchOf(branchId);
  const [intakeOpen, setIntakeOpen] = useState(intake !== undefined);
  const source = useMemo(() => (state === 'clear' ? [] : jobs.filter((j) => j.branch === branchId)), [state, jobs, branchId]);

  const dueToday = source.filter(isDueToday);
  const waiting = source.filter((j) => j.status === 'for_approval');
  const unpaid = source.filter((j) => j.balance > 0 && (j.status === 'for_pickup' || j.status === 'completed'));
  const rank = (j: Job) => ({ Overdue: 0, 'Due today': 1, 'Waiting on customer': 2 }[attentionReason(j)?.label ?? ''] ?? 3);
  const attention = source.filter((j) => attentionReason(j)).sort((a, b) => rank(a) - rank(b));

  const tiles: { label: string; value: string | number; delta?: string; icon: PhosphorIcon; tone: string }[] = [
    { label: 'Due today', value: dueToday.length, icon: CalendarCheck, tone: 'text-primary-600' },
    { label: 'Waiting on customer', value: waiting.length, icon: Hourglass, tone: 'text-warning' },
    { label: 'Unpaid', value: unpaid.length, delta: unpaid.length ? peso(unpaid.reduce((a, j) => a + j.balance, 0)) : undefined, icon: Receipt, tone: 'text-error' },
  ];

  return (
    <Page>
      <PageHeader
        title="Today"
        description={`${branchName} · Today`}
        actions={<Button leftIcon={Plus} onClick={() => setIntakeOpen(true)}>New quotation</Button>}
      />

      {state !== 'error' && (
        <div className="grid grid-cols-3 gap-3">
          {tiles.map((s) => (
            <div key={s.label} className="min-w-0 rounded-xl bg-surface p-3.5">
              <div className="flex items-start gap-2">
                <Icon icon={s.icon} size="sm" className={`mt-px shrink-0 ${s.tone}`} />
                <span className="text-xs leading-tight text-ink-muted">{s.label}</span>
              </div>
              <div className="mt-2 text-xl font-extrabold tabular-nums text-ink">{state === 'loading' ? <Skeleton className="h-7 w-10" /> : s.value}</div>
              {s.delta && state !== 'loading' && <div className="text-xs font-semibold text-error">{s.delta}</div>}
            </div>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Caption>Needs attention</Caption>
          {state === 'default' && attention.length > 0 && <Badge tone="warning" size="sm">{attention.length}</Badge>}
        </div>
        {state === 'error' ? (
          <RetryNotice title="Could not load today's jobs">Check your connection and try again.</RetryNotice>
        ) : state === 'loading' ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-surface p-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex flex-1 flex-col gap-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-64" /></div>
              </div>
            ))}
          </div>
        ) : attention.length === 0 ? (
          <Card><EmptyState icon={CheckCircle} title="All clear" description={`Nothing is due, waiting on a customer or unpaid in ${branchName}. Start a quotation when a customer walks in.`} /></Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {attention.map((j) => {
              const why = attentionReason(j)!;
              const r = REASON_ICON[why.tone];
              return (
                <li key={j.id} className="flex flex-col gap-2 rounded-xl bg-surface p-3 transition-colors hover:bg-surface-subtle sm:flex-row sm:items-center sm:gap-3">
                  <button className="flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" onClick={() => onOpenJob?.(j)}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${r.cls}`}><Icon icon={r.icon} size="sm" weight="fill" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium leading-snug text-ink">{j.customer}</span><Badge tone={why.tone} size="sm">{why.label}</Badge></span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-subtle">{j.plate} · {j.brand} {j.model} · #{j.id} · <StatusBadge status={j.status} /></span>
                    </span>
                  </button>
                  <div className="flex flex-wrap items-center gap-3 pl-11 sm:flex-col sm:items-end sm:gap-2 sm:pl-0">
                    <NextButton job={j} onAdvance={onAdvance} />
                    <LedaSlot />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <QuotationIntake open={intakeOpen} onOpenChange={setIntakeOpen} scenario={intake} onCreated={onCreated} />
    </Page>
  );
}

// ---------------------------------------------------------------- Job list

export type ListState = 'default' | 'empty-tab' | 'empty-branch' | 'loading' | 'error';

const ASSIGNEES = ['Rey Bautista', 'Dennis Alcala', 'Carlo Reyes', 'Joel Mendoza', 'Maricel Santos'];

/**
 * Full job list, built like Inventory/Products: SearchBar, SegmentedControl and Select in one row, a plain Table with
 * onRowClick and a row Menu (next action first). The seven statuses are a single field that staff can move between
 * freely, so a drag board would imply rules that do not exist. The "what needs me today" strip lives on Today.
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
    { key: 'job', header: 'Job', render: (j) => (<div className="flex flex-col"><span className="font-medium text-ink">{j.customer}</span><span className="whitespace-nowrap text-xs text-ink-subtle">#{j.id} · {j.phone}</span></div>) },
    { key: 'vehicle', header: 'Vehicle', render: (j) => (<div className="flex flex-col"><span className="font-medium text-ink">{j.plate}</span><span className="text-xs text-ink-subtle">{j.brand} {j.model}</span></div>) },
    { key: 'assignee', header: 'Assigned to', render: (j) => (j.assignee ? <span className="inline-flex items-center gap-2 whitespace-nowrap"><Avatar name={j.assignee} size="xs" />{j.assignee}</span> : <span className="text-ink-muted">Unassigned</span>) },
    { key: 'status', header: 'Status', render: (j) => <StatusBadge status={j.status} /> },
    { key: 'due', header: 'Due date', render: (j) => <DueCell job={j} /> },
    { key: 'actions', header: '', align: 'right', width: 48, render: (j) => <JobMenu job={j} onOpenJob={onOpenJob} onAdvance={onAdvance} /> },
  ];

  const filtered = !!q || who !== 'any' || due !== 'any';
  const empty = (
    <EmptyState
      icon={ClipboardText}
      title={state === 'empty-branch' ? `No jobs in ${branchName} yet` : filtered ? 'No job matches these filters' : 'No jobs in this status'}
      description={state === 'empty-branch' ? 'Create the first quotation for a walk-in customer.' : 'Clear a filter or pick another status.'}
      action={<Button size="sm" variant="secondary" leftIcon={Plus} onClick={() => setIntakeOpen(true)}>New quotation</Button>}
    />
  );

  return (
    <Page>
      <PageHeader
        title="Jobs"
        description={`${branchName} · All jobs, from quotation to pick-up`}
        actions={<Button leftIcon={Plus} onClick={() => setIntakeOpen(true)}>New quotation</Button>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:min-w-56 sm:flex-1">
          <SearchBar aria-label="Search jobs" placeholder="Search customer, plate or job no.…" shortcut="/" value={q} onValueChange={(v) => { setQ(v); setPage(1); }} onClear={() => setQ('')} />
        </div>
        <div className="max-w-full overflow-x-auto">
          <SegmentedControl
            aria-label="Filter by status"
            value={tab}
            onChange={(v) => { setTab(v); setPage(1); }}
            options={[{ value: 'all', label: <span className="whitespace-nowrap">{pending ? 'All' : `All ${counts.all}`}</span> }, ...JOB_STATUSES.map((s) => ({ value: s.value, label: <span className="whitespace-nowrap">{pending ? s.label : `${s.label} ${counts[s.value]}`}</span> }))]}
          />
        </div>
        <Field label={<span className="sr-only">Filter by assignee</span>} className="w-full gap-0 sm:w-44">
          <Select value={who} onValueChange={(v) => { setWho(v); setPage(1); }} options={[{ value: 'any', label: 'Anyone' }, { value: 'none', label: 'Unassigned' }, ...ASSIGNEES.map((a) => ({ value: a, label: a }))]} />
        </Field>
        <Field label={<span className="sr-only">Filter by due date</span>} className="w-full gap-0 sm:w-44">
          <Select value={due} onValueChange={(v) => { setDue(v); setPage(1); }} options={[{ value: 'any', label: 'Any due date' }, { value: 'overdue', label: 'Overdue' }, { value: 'today', label: 'Due today' }]} />
        </Field>
      </div>

      {state === 'error' ? (
        <RetryNotice title="Could not load jobs">Check your connection and try again.</RetryNotice>
      ) : (
        <>
          <div className="hidden md:block">
            <Table columns={columns} data={paged} rowKey={(j) => j.id} loading={state === 'loading'} empty={empty} onRowClick={onOpenJob} />
          </div>
          <ul className="flex flex-col gap-3 md:hidden">
            {state === 'loading' && [0, 1, 2, 3].map((i) => <li key={i}><Card className="flex flex-col gap-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /><Skeleton className="h-5 w-24" /></Card></li>)}
            {state !== 'loading' && paged.length === 0 && <li><Card>{empty}</Card></li>}
            {state !== 'loading' && paged.map((j) => (
              <li key={j.id}>
                <Card interactive className="flex items-start gap-2">
                  <button className="flex min-h-12 min-w-0 flex-1 flex-col gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" onClick={() => onOpenJob?.(j)}>
                    <span className="flex items-center justify-between gap-2"><span className="font-medium text-ink">{j.customer}</span><StatusBadge status={j.status} /></span>
                    <span className="text-sm text-ink-muted">{j.plate} · {j.brand} {j.model} · #{j.id}</span>
                    <span className="flex items-center justify-between gap-2 text-sm"><span className="text-ink-muted">{j.assignee ?? 'Unassigned'}</span><DueCell job={j} /></span>
                  </button>
                  <JobMenu job={j} onOpenJob={onOpenJob} onAdvance={onAdvance} />
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

const SERVICE_BADGE = (s: JobService['status']) => (
  <Badge className="whitespace-nowrap" size="sm" tone={s === 'completed' ? 'success' : s === 'in_progress' ? 'primary' : 'info'}>{s === 'in_progress' ? 'In progress' : s === 'todo' ? 'To-do' : 'Completed'}</Badge>
);

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
      <Page width="detail">
        <div aria-busy="true" className="space-y-6">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-3"><Skeleton className="h-8 w-72" /><Skeleton className="h-4 w-56" /></div>
          <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-72 rounded-lg lg:col-span-2" /><Skeleton className="h-72 rounded-lg" /></div>
        </div>
      </Page>
    );
  }
  if (state === 'error') {
    return (
      <Page width="detail">
        <BackButton label="Jobs" onClick={onBack} />
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
  /** A titled Card with a header row and the table flush beneath it, as on Inventory/Purchase Orders. */
  const itemsCard = (title: string, sub: string, add: string, empty: boolean, what: string, desktop: React.ReactNode, mobile: React.ReactNode) => (
    <Card padding="none">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex flex-col"><h2 className="text-sm font-semibold text-ink">{title}</h2><p className="text-xs text-ink-subtle">{sub}</p></div>
        <Button size="sm" variant="secondary" leftIcon={Plus} disabled={locked}>{add}</Button>
      </div>
      <div className="border-t border-border">
        {empty ? <div className="p-4">{emptyItems(what)}</div> : (
          <>
            <div className="hidden md:block">{desktop}</div>
            <div className="md:hidden">{mobile}</div>
          </>
        )}
      </div>
    </Card>
  );
  const sideHeading = (text: string) => <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{text}</h3>;

  return (
    <Page width="detail">
      <BackButton label="Jobs" onClick={onBack} />

      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">{job.plate} / {job.brand} {job.model}<StatusBadge status={status} /></span>}
        description={`Job #${job.id} · ${job.customer}, ${job.phone} · ${branchName}`}
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Tabs value={tab} onValueChange={setTab} items={[
            { value: 'items', label: 'Services and parts' },
            { value: 'comments', label: 'Comments', badge: COMMENTS.length },
            { value: 'history', label: 'History' },
            { value: 'files', label: 'Attachments', badge: 3 },
          ]}>
            <TabPanel value="items" className="flex flex-col gap-4 pt-4">
              {itemsCard('Services', `${peso(t.services)} · ${services.length} item${services.length === 1 ? '' : 's'}`, 'Add service', services.length === 0, 'services',
                <Table className="rounded-none border-0" data={services} rowKey={(s) => s.id} columns={[
                  { key: 'name', header: 'Service', render: (s) => (<div className="flex flex-col"><span className="font-medium text-ink">{s.name}</span><span className="text-xs text-ink-subtle">{s.description}</span></div>) },
                  { key: 'who', header: 'Assigned to', width: '24%', render: (s) => (s.assignees.length ? s.assignees.join(', ') : <span className="text-ink-muted">Unassigned</span>) },
                  { key: 'status', header: 'Status', render: (s) => SERVICE_BADGE(s.status) },
                  { key: 'price', header: 'Price', align: 'right', render: (s) => <span className="tabular-nums">{peso(s.price)}</span> },
                  { key: 'a', header: '', align: 'right', width: 48, render: (s) => (<Menu trigger={<IconButton icon={DotsThree} label={`Actions for ${s.name}`} variant="subtle" size="sm" />} items={[{ label: `Comments (${s.comments})`, icon: ChatText, onSelect: () => setCommentsFor(s.name) }, { label: 'Assign mechanic' }, { type: 'separator' }, { label: 'Remove', icon: Trash, danger: true, disabled: locked, onSelect: () => setDeleting(s.name) }]} />) },
                ]} />,
                <ul className="flex flex-col divide-y divide-border">
                  {services.map((s) => (
                    <li key={s.id} className="flex items-start justify-between gap-2 px-4 py-3 text-sm">
                      <div className="flex min-w-0 flex-col gap-1"><p className="font-medium text-ink">{s.name}</p><p className="text-xs text-ink-subtle">{s.assignees[0] ?? 'Unassigned'}</p><p className="tabular-nums">{peso(s.price)}</p></div>
                      <div className="flex items-center gap-2">{SERVICE_BADGE(s.status)}
                        <Menu trigger={<IconButton icon={DotsThree} label={`Actions for ${s.name}`} variant="subtle" size="sm" />} items={[{ label: `Comments (${s.comments})`, icon: ChatText, onSelect: () => setCommentsFor(s.name) }, { label: 'Remove', icon: Trash, danger: true, disabled: locked, onSelect: () => setDeleting(s.name) }]} /></div>
                    </li>
                  ))}
                </ul>)}
              {itemsCard('Parts', `${peso(t.parts)} · ${parts.length} item${parts.length === 1 ? '' : 's'}`, 'Add part', parts.length === 0, 'parts',
                <Table className="rounded-none border-0" data={parts} rowKey={(p) => p.id} columns={[
                  { key: 'name', header: 'Part', render: (p) => (<div className="flex flex-col"><span className="font-medium text-ink">{p.name}</span><span className="text-xs text-ink-subtle">{p.sku}</span></div>) },
                  { key: 'qty', header: 'Qty', render: (p) => `${p.qty} ${p.unit}` },
                  { key: 'unit', header: 'Unit price', align: 'right', render: (p) => <span className="tabular-nums">{peso(p.unitPrice)}</span> },
                  { key: 'total', header: 'Total', align: 'right', render: (p) => <span className="tabular-nums">{peso(p.qty * p.unitPrice)}</span> },
                  { key: 'a', header: '', align: 'right', width: 48, render: (p) => (<Menu trigger={<IconButton icon={DotsThree} label={`Actions for ${p.name}`} variant="subtle" size="sm" />} items={[{ label: 'Remove', icon: Trash, danger: true, disabled: locked, onSelect: () => setDeleting(p.name) }]} />) },
                ]} />,
                <ul className="flex flex-col divide-y divide-border">
                  {parts.map((p) => (
                    <li key={p.id} className="flex items-start justify-between gap-2 px-4 py-3 text-sm">
                      <div className="flex min-w-0 flex-col gap-1"><p className="font-medium text-ink">{p.name}</p><p className="text-xs text-ink-subtle">{p.qty} {p.unit} x {peso(p.unitPrice)}</p></div>
                      <div className="flex items-center gap-2"><span className="tabular-nums">{peso(p.qty * p.unitPrice)}</span>
                        <Menu trigger={<IconButton icon={DotsThree} label={`Actions for ${p.name}`} variant="subtle" size="sm" />} items={[{ label: 'Remove', icon: Trash, danger: true, disabled: locked, onSelect: () => setDeleting(p.name) }]} /></div>
                    </li>
                  ))}
                </ul>)}
            </TabPanel>
            <TabPanel value="comments" className="pt-4"><Card><CommentThread tried={state === 'validation'} /></Card></TabPanel>
            <TabPanel value="history" className="pt-4">
              <Card><ul className="flex flex-col gap-3 text-sm">
                {[['Maricel Santos', 'moved the job from To-do to In progress', 'Oct 13, 2026'], ['Maricel Santos', 'approved the quotation', 'Oct 12, 2026'], [job.customer, 'confirmed the quotation', 'Oct 12, 2026'], ['Maricel Santos', 'created the quotation', 'Oct 12, 2026']].map(([who, what, when], i) => (
                  <li key={i} className="flex gap-3"><Avatar name={who} size="xs" /><div className="flex flex-col"><p><span className="font-medium">{who}</span> {what}</p><p className="text-xs text-ink-muted">{when}</p></div></li>
                ))}
              </ul></Card>
            </TabPanel>
            <TabPanel value="files" className="pt-4">
              <Card><ul className="flex flex-col gap-2 text-sm">{[['engine-bay.jpg', '0.9 MB'], ['dashboard-warning.jpg', '0.4 MB'], ['quote-note.pdf', '0.3 MB']].map(([n, s]) => <li key={n} className="flex items-center justify-between gap-2"><span className="inline-flex min-w-0 items-center gap-2 truncate"><Paperclip size={16} />{n}</span><span className="text-ink-muted">{s}</span></li>)}</ul></Card>
            </TabPanel>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            {sideHeading('Summary')}
            <DataList stacked items={[
              { label: 'Customer', value: `${job.customer}` }, { label: 'Plate no.', value: job.plate }, { label: 'Vehicle', value: `${job.brand} ${job.model}, 2012` },
              { label: 'Mileage', value: '130,000 km' }, { label: 'Assigned to', value: job.assignee ?? 'Unassigned' },
            ]} />
          </Card>

          <LedaSlot variant="panel" />

          <Card id="payment" ref={payRef} className="scroll-mt-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Payment</h3>
              <Badge tone={payState === 'Paid' ? 'success' : payState === 'Partial' ? 'warning' : 'neutral'} size="sm" dot>{payState}</Badge>
            </div>
            <DataList stacked items={[
              { label: 'Services', value: <span className="tabular-nums">{peso(t.services)}</span> },
              { label: 'Parts', value: <span className="tabular-nums">{peso(t.parts)}</span> },
              { label: 'Total', value: <span className="tabular-nums">{peso(t.total)}</span> },
              { label: 'Paid', value: <span className="tabular-nums">{peso(paid)}</span> },
              { label: 'Balance', value: <span className="text-lg font-semibold tabular-nums">{peso(balance)}</span> },
            ]} />
            {payments.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2 text-sm">{payments.map((p, i) => <li key={i} className="flex justify-between gap-2"><span className="text-ink-muted">{p.when} · {p.mode}</span><span className="tabular-nums">{peso(p.amount)}</span></li>)}</ul>
            )}
            <div className="mt-4 flex flex-col gap-4">
              {balance > 0 ? (
                <>
                  <Field label="Amount received" error={amountError}><Input inputMode="decimal" value={amount} invalid={!!amountError} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></Field>
                  <Field label="Mode of payment"><Select value={mode} onValueChange={setMode} options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))} /></Field>
                  <Button fullWidth variant="secondary" onClick={recordPayment}>Record payment</Button>
                </>
              ) : (
                <Notice tone="success">Fully paid. No balance left on this job.</Notice>
              )}
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-ink-muted">Invoice INV-2026-{String(job.id).padStart(4, '0')}</span>
                <Button variant="secondary" size="sm" leftIcon={DownloadSimple} disabled={noItems}>Download PDF</Button>
              </div>
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

      <OffCanvas open={commentsFor !== null} onOpenChange={(o) => !o && setCommentsFor(null)} width="30rem">
        <OffCanvas.Header>Comments: {commentsFor}</OffCanvas.Header>
        <OffCanvas.Body><CommentThread filter={commentsFor ?? undefined} /></OffCanvas.Body>
      </OffCanvas>
      <ConfirmDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)} title={`Remove ${deleting}?`} description="It is removed from this job and the total is recalculated." confirmLabel="Remove" tone="danger" onConfirm={() => setDeleting(null)} />
      <Modal open={dueOpen} onOpenChange={setDueOpen} title="Change due date" size="sm" footer={<><Button variant="subtle" onClick={() => setDueOpen(false)}>Cancel</Button><Button onClick={() => setDueOpen(false)}>Save due date</Button></>}>
        <Field label="Due date"><Input type="date" defaultValue="2026-10-19" /></Field>
      </Modal>
    </Page>
  );
}
