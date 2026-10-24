import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft, Camera, CaretRight, ChatText, CheckCircle, Circle, ClipboardText, DotsThree, FilePdf, Image as ImageIcon, Lock, Minus, Package,
  PauseCircle, Phone, Plus, Users,
} from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { Menu } from '../../components/Menu';
import { Notice } from '../../components/Notice';
import { OffCanvas } from '../../components/Drawer';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { Select } from '../../components/Select';
import { Skeleton } from '../../components/Skeleton';
import { Textarea } from '../../components/Textarea';
import { toast } from '../../components/toast/toastStore';
import { cn, focusRing } from '../../utils/cn';
import './mechanic.css';
import { INVENTORY, statusMeta, stockTone, type JobStatus } from './data';
import {
  GROUPS, HOLD_REASONS, MECHANIC_MOVES, MY_CUSTOMERS, MY_JOBS, dueLabel, groupOf, mechanicNext, urgency,
  type JobFile, type MCustomer, type MechanicJob, type UsedItem,
} from './MechanicData';
import { RetryNotice } from './Page';

/** Sentence-case section caption (the shared Page Caption is uppercase). */
function Caption({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-ink-muted">{children}</p>;
}

/** Local status chip: In progress must not read as the red Overdue chip. */
function StatusBadge({ status }: { status: JobStatus }) {
  const m = statusMeta(status);
  const tone = status === 'in_progress' ? 'info' : status === 'todo' ? 'neutral' : m.tone;
  return <Badge className="whitespace-nowrap" tone={tone} dot>{m.label}</Badge>;
}

export type MState = 'default' | 'empty' | 'loading' | 'error';

/** One column, 16px page padding, 24px between sections (LR-3). */
function MPage({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-6 p-4">{children}</div>;
}

const ROW = 'flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-subtle';

/** A System Settings style group: caption above, one rounded surface, rows divided by hairlines. */
function Group({ title, count, hint, children }: { title: string; count?: number; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2" aria-label={title}>
      <div className="flex min-h-11 items-center justify-between gap-2 px-1">
        <Caption>{title}{count !== undefined ? ` · ${count}` : ''}</Caption>
        {hint && <span className="truncate text-xs text-ink-subtle">{hint}</span>}
      </div>
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">{children}</ul>
    </section>
  );
}

/** The job's current step: the first task not done, else the customer's report. */
const currentTask = (j: MechanicJob) => j.tasks.find((t) => t.status !== 'done')?.name ?? 'All tasks done';

function JobRow({ job, onOpen }: { job: MechanicJob; onOpen?: (j: MechanicJob) => void }) {
  const g = groupOf(job);
  const due = dueLabel(job);
  const badge = (g === 'now' || g === 'waiting') && due.tone !== 'neutral' ? <Badge tone={due.tone} size="sm">{due.text}</Badge> : <StatusBadge status={job.status} />;
  return (
    <li>
      <button className={cn(ROW, focusRing)} onClick={() => onOpen?.(job)}>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="sr-only">Open job {job.id}: </span>
          <span className="text-sm font-semibold text-ink">{job.plate} · {job.vehicle}</span>
          <span className="flex">{badge}</span>
          <span className="truncate text-xs text-ink-muted">{job.customer} · {g === 'waiting' ? (job.holdReason ?? 'Pending') : currentTask(job)}</span>
        </span>
        <Icon icon={CaretRight} size="sm" className="shrink-0 text-ink-subtle" />
      </button>
    </li>
  );
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-2">
      <Skeleton className="h-3 w-24" />
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex min-h-14 flex-col justify-center gap-2 px-4 py-3"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-64" /></li>
        ))}
      </ul>
    </div>
  );
}

/** An unsent note, shown wherever the phone holds a change the server has not seen. */
function Unsent() {
  return <Badge size="sm" tone="warning" className="whitespace-nowrap">Not sent yet</Badge>;
}

// ---------------------------------------------------------------- Today

export interface TodayProps { jobs?: MechanicJob[]; state?: MState; onOpenJob?: (j: MechanicJob) => void; onAdvance?: (j: MechanicJob) => void; onGoJobs?: () => void }

/**
 * Today = the work queue. Every job that needs the mechanic shows its next action first: the top job's action is the
 * one primary, the rest are secondary. Waiting and ready-for-pick-up are one line each, pointing to Jobs.
 */
export function MechanicToday({ jobs = MY_JOBS, state = 'default', onOpenJob, onAdvance, onGoJobs }: TodayProps) {
  const source = state === 'empty' ? [] : jobs;
  const now = source.filter((j) => groupOf(j) === 'now').sort((a, b) => urgency(a) - urgency(b));
  const waiting = source.filter((j) => groupOf(j) === 'waiting').length;
  const pickup = source.filter((j) => groupOf(j) === 'pickup').length;
  const ready = state === 'default';

  return (
    <MPage>
      <PageHeader title="Today" description={ready ? `Fri, Oct 17 · ${now.length} job${now.length === 1 ? '' : 's'} need you` : 'Fri, Oct 17'} />
      {state === 'error' ? (
        <RetryNotice title="Could not load your jobs">Check your connection and try again.</RetryNotice>
      ) : state === 'loading' ? (
        <div aria-busy="true" className="flex flex-col gap-3">{[0, 1, 2].map((i) => <Card key={i} elevation="flat" className="flex flex-col gap-3 rounded-xl border border-border"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-64" /><Skeleton className="h-11 w-full" /></Card>)}</div>
      ) : now.length === 0 ? (
        <Card elevation="flat" className="rounded-xl border border-border"><EmptyState icon={CheckCircle} title="Nothing needs you right now" description="No jobs are waiting for you to start or finish. Check Jobs for pending work or jobs for pick-up." action={<Button variant="secondary" className="min-h-11" onClick={onGoJobs}>See all jobs</Button>} /></Card>
      ) : (
        <section aria-label="Needs you now" className="flex flex-col gap-2">
          <div className="px-1"><Caption>Needs you now · {now.length}</Caption></div>
          <ul className="flex flex-col gap-3">
            {now.map((j, i) => {
              const next = mechanicNext(j.status);
              const due = dueLabel(j);
              return (
                <li key={j.id}>
                  <Card elevation="flat" className="flex flex-col gap-3 rounded-xl border border-border">
                    <button className={cn('flex min-h-11 w-full items-start justify-between gap-3 rounded text-left', focusRing)} onClick={() => onOpenJob?.(j)}>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="sr-only">Open job {j.id}: </span>
                        <span className="text-sm font-semibold text-ink">{j.plate} · {j.vehicle}</span>
                        <span className="flex">{due.tone !== 'neutral' ? <Badge tone={due.tone} size="sm">{due.text}</Badge> : <StatusBadge status={j.status} />}</span>
                        <span className="text-xs text-ink-muted">{j.customer} · {currentTask(j)}</span>
                        <span className="line-clamp-2 text-xs text-ink-muted">{j.concern}</span>
                      </span>
                    </button>
                    {next && <Button fullWidth variant={i === 0 ? 'primary' : 'secondary'} className="min-h-11" onClick={() => onAdvance?.(j)}>{next.label}</Button>}
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {ready && (waiting > 0 || pickup > 0) && (
        <Group title="Elsewhere">
          {waiting > 0 && <li><button className={cn(ROW, focusRing)} onClick={onGoJobs}><span className="flex-1 text-sm text-ink">Waiting</span><span className="text-sm text-ink-muted">{waiting}</span><Icon icon={CaretRight} size="sm" className="text-ink-subtle" /></button></li>}
          {pickup > 0 && <li><button className={cn(ROW, focusRing)} onClick={onGoJobs}><span className="flex-1 text-sm text-ink">For pick-up</span><span className="text-sm text-ink-muted">{pickup}</span><Icon icon={CaretRight} size="sm" className="text-ink-subtle" /></button></li>}
        </Group>
      )}
    </MPage>
  );
}

// ---------------------------------------------------------------- Jobs

export interface JobsProps { jobs?: MechanicJob[]; state?: MState; initialQuery?: string; onOpenJob?: (j: MechanicJob) => void }

/** Jobs = everything assigned to me, grouped by what it asks of me. Rows open the job; the next action lives on Today and the job. */
export function MechanicJobs({ jobs = MY_JOBS, state = 'default', initialQuery = '', onOpenJob }: JobsProps) {
  const [q, setQ] = useState(initialQuery);
  const source = state === 'empty' ? [] : jobs;
  const visible = useMemo(() => source.filter((j) => `${j.customer} ${j.plate} ${j.vehicle} ${j.id}`.toLowerCase().includes(q.toLowerCase())), [source, q]);

  return (
    <MPage>
      <PageHeader title="Jobs" description={state === 'default' ? `${source.length} assigned to you` : undefined} />
      {state !== 'empty' && (
        <SearchBar aria-label="Search jobs" placeholder="Search jobs" value={q} onValueChange={setQ} onClear={() => setQ('')} size="lg" />
      )}
      {state === 'error' ? (
        <RetryNotice title="Could not load your jobs">Check your connection and try again.</RetryNotice>
      ) : state === 'loading' ? (
        <><ListSkeleton rows={3} /><ListSkeleton rows={2} /></>
      ) : source.length === 0 ? (
        <Card elevation="flat" className="rounded-xl border border-border"><EmptyState icon={ClipboardText} title="No jobs assigned to you" description="When the front desk assigns you a job, it shows up here." /></Card>
      ) : visible.length === 0 ? (
        <Card elevation="flat" className="rounded-xl border border-border"><EmptyState icon={ClipboardText} title="No job matches" description={`Nothing for "${q}". Check the plate number or customer name.`} action={<Button variant="secondary" className="min-h-11" onClick={() => setQ('')}>Clear search</Button>} /></Card>
      ) : (
        GROUPS.map((g) => {
          const rows = visible.filter((j) => groupOf(j) === g.key).sort((a, b) => urgency(a) - urgency(b));
          return rows.length ? <Group key={g.key} title={g.label} count={rows.length}>{rows.map((j) => <JobRow key={j.id} job={j} onOpen={onOpenJob} />)}</Group> : null;
        })
      )}
    </MPage>
  );
}

// ---------------------------------------------------------------- Customers

export interface CustomersProps { state?: MState; initialQuery?: string; onOpen?: (c: MCustomer) => void }

const callLink = 'grid h-11 w-11 shrink-0 place-items-center rounded-base text-ink-muted hover:bg-surface-muted hover:text-ink';

/** Customers = who I am working for, to call or check a vehicle. Read-only: no create or edit for a mechanic. */
export function MechanicCustomers({ state = 'default', initialQuery = '', onOpen }: CustomersProps) {
  const [q, setQ] = useState(initialQuery);
  const source = state === 'empty' ? [] : MY_CUSTOMERS;
  const visible = source.filter((c) => `${c.name} ${c.phone} ${c.vehicles.map((v) => v.plate).join(' ')}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <MPage>
      <PageHeader title="Customers" description={state === 'default' ? 'On your current jobs' : undefined} />
      {state !== 'empty' && <SearchBar aria-label="Search customers" placeholder="Search name or plate" value={q} onValueChange={setQ} onClear={() => setQ('')} size="lg" />}
      {state === 'error' ? (
        <RetryNotice title="Could not load customers">Check your connection and try again.</RetryNotice>
      ) : state === 'loading' ? (
        <ListSkeleton rows={4} />
      ) : source.length === 0 ? (
        <Card elevation="flat" className="rounded-xl border border-border"><EmptyState icon={Users} title="No customers yet" description="Customers on the jobs assigned to you show up here." /></Card>
      ) : visible.length === 0 ? (
        <Card elevation="flat" className="rounded-xl border border-border"><EmptyState icon={Users} title="No customer matches" description={`Nothing for "${q}".`} action={<Button variant="secondary" className="min-h-11" onClick={() => setQ('')}>Clear search</Button>} /></Card>
      ) : (
        <Group title="Customers" count={visible.length}>
          {visible.map((c) => (
            <li key={c.id} className="flex items-center hover:bg-surface-subtle">
              <button className={cn('flex min-h-14 min-w-0 flex-1 flex-col justify-center gap-0.5 px-4 py-3 text-left', focusRing)} onClick={() => onOpen?.(c)}>
                <span className="sr-only">Open </span>
                <span className="truncate text-sm font-medium text-ink">{c.name}</span>
                <span className="truncate text-xs text-ink-muted">{c.vehicles.map((v) => v.plate).join(', ')}</span>
              </button>
              <a href={`tel:${c.phone.replace(/\s/g, '')}`} aria-label={`Call ${c.name}`} className={cn(callLink, 'mr-2', focusRing)}><Icon icon={Phone} size="md" /></a>
            </li>
          ))}
        </Group>
      )}
    </MPage>
  );
}

function MBack({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn('inline-flex min-h-11 items-center gap-2 self-start rounded text-sm text-ink-muted hover:text-ink', focusRing)}>
      <Icon icon={ArrowLeft} size="sm" /> {label}
    </button>
  );
}

export function MechanicCustomerDetail({ customer = MY_CUSTOMERS[0], jobs = MY_JOBS, onBack, onOpenJob }: { customer?: MCustomer; jobs?: MechanicJob[]; onBack?: () => void; onOpenJob?: (j: MechanicJob) => void }) {
  const mine = jobs.filter((j) => j.customer === customer.name);
  return (
    <MPage>
      <MBack label="Customers" onClick={onBack} />
      <PageHeader title={customer.name} />
      <a href={`tel:${customer.phone.replace(/\s/g, '')}`} className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-base border border-border text-sm font-medium text-ink hover:bg-surface-subtle', focusRing)}>
        <Icon icon={Phone} size="sm" /> Call {customer.phone}
      </a>
      <Group title="Vehicles" count={customer.vehicles.length}>
        {customer.vehicles.map((v) => <li key={v.plate} className="flex min-h-14 flex-col justify-center gap-0.5 px-4 py-3"><span className="text-sm font-medium text-ink">{v.plate}</span><span className="text-xs text-ink-muted">{v.vehicle}</span></li>)}
      </Group>
      {mine.length > 0 && <Group title="Your jobs" count={mine.length}>{mine.map((j) => <JobRow key={j.id} job={j} onOpen={onOpenJob} />)}</Group>}
    </MPage>
  );
}

// ---------------------------------------------------------------- Job detail

export type MDetailState = 'default' | 'loading' | 'error';
export type MDetailSheet = 'status' | 'hold' | 'item' | 'item-validation' | 'comment' | 'comment-validation' | 'remove';

export interface MechanicDetailProps {
  job?: MechanicJob;
  state?: MDetailState;
  offline?: boolean;
  /** Show the "could not save" notice for this status change (story). */
  saveFailed?: JobStatus;
  /** First status change fails, then Retry works (story). */
  failNext?: boolean;
  initialSheet?: MDetailSheet;
  onBack?: () => void;
  onChange?: (j: MechanicJob) => void;
}

const FILE_ICON = { photo: ImageIcon, pdf: FilePdf } as const;

export function MechanicJobDetail({ job: source = MY_JOBS[0], state = 'default', offline, saveFailed, failNext, initialSheet, onBack, onChange }: MechanicDetailProps) {
  const [job, setJob] = useState(source);
  const [unsent, setUnsent] = useState<string[]>([]);
  const [failed, setFailed] = useState<JobStatus | null>(saveFailed ?? null);
  const [willFail, setWillFail] = useState(!!failNext);
  const [sheet, setSheet] = useState<MDetailSheet | null>(initialSheet ?? null);
  const [removing, setRemoving] = useState<UsedItem | null>(initialSheet === 'remove' ? source.items[0] ?? null : null);

  const update = (next: MechanicJob) => { setJob(next); onChange?.(next); };
  const locked = job.status === 'completed';
  const next = mechanicNext(job.status);
  const due = dueLabel(job);

  const move = (to: JobStatus, reason?: string) => {
    if (willFail) { setWillFail(false); setFailed(to); setSheet(null); return; }
    const before = job;
    setFailed(null);
    update({ ...job, status: to, holdReason: to === 'pending' ? reason : undefined });
    if (offline) setUnsent((u) => [...u, 'status']);
    setSheet(null);
    toast.success(`Job #${job.id} is now ${statusMeta(to).label}.${offline ? ' Saved on this phone, sends when you reconnect.' : ''}`, { action: { label: 'Undo', onClick: () => update(before) } });
  };

  if (state === 'loading') {
    return (
      <div aria-busy="true"><MPage>
        <Skeleton className="h-4 w-20" /><div className="flex flex-col gap-2"><Skeleton className="h-6 w-56" /><Skeleton className="h-4 w-40" /></div>
        <Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-32 w-full" />
      </MPage></div>
    );
  }
  if (state === 'error') {
    return (
      <MPage>
        <MBack label="Jobs" onClick={onBack} />
        <RetryNotice title="This job is not available" onRetry={onBack}>It may have been reassigned or removed. Go back to your jobs and try again.</RetryNotice>
      </MPage>
    );
  }

  const doneCount = job.tasks.filter((t) => t.status === 'done').length;
  const toggleTask = (id: number) => {
    if (locked) return;
    update({ ...job, tasks: job.tasks.map((t) => (t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t)) });
    if (offline) setUnsent((u) => [...u, `task${id}`]);
  };

  return (
    <div className="flex min-h-full flex-col">
      <MPage>
        <MBack label="Jobs" onClick={onBack} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-ink">{job.plate} · {job.vehicle}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={job.status} />
            {due.tone !== 'neutral' && job.status !== 'completed' && job.status !== 'for_pickup' && <Badge tone={job.status === 'pending' && due.tone === 'warning' ? 'neutral' : due.tone} size="sm">{due.text}</Badge>}
            {unsent.includes('status') && <Unsent />}
            <span className="text-xs text-ink-muted">Job #{job.id} · {due.tone === 'neutral' ? due.text : `Due ${job.due.replace(', 2026', '')}`}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-ink">{job.customer}</span>
            <a href={`tel:${job.phone.replace(/\s/g, '')}`} className={cn('inline-flex min-h-11 items-center gap-2 rounded-base border border-border px-3 text-sm font-medium text-ink hover:bg-surface-subtle', focusRing)}><Icon icon={Phone} size="sm" /> Call</a>
          </div>
        </div>

        {failed && (
          <Notice tone="error" title="Could not save the status">
            <div className="flex flex-wrap items-center gap-2">
              <span>The job is still {statusMeta(job.status).label}. Nothing was changed.</span>
              <Button size="sm" variant="secondary" className="min-h-11" onClick={() => move(failed)}>Retry</Button>
            </div>
          </Notice>
        )}
        {locked && <Notice tone="neutral" icon={Lock} title="Completed job">Tasks and items are locked. Ask the front desk to reopen it.</Notice>}
        {job.status === 'pending' && job.holdReason && <Notice tone="warning" icon={PauseCircle} title="Pending">{job.holdReason}</Notice>}
        {job.status === 'for_approval' && <Notice tone="neutral" title="Waiting for the customer">{job.holdReason}</Notice>}

        <Group title="Customer reported"><li className="px-4 py-3 text-sm text-ink">{job.concern}</li></Group>

        <Group title="Work to do" hint={`${doneCount} of ${job.tasks.length} done`}>
          {job.tasks.map((t) => (
            <li key={t.id}>
              <button
                role="checkbox" aria-checked={t.status === 'done'} disabled={locked} onClick={() => toggleTask(t.id)}
                className={cn(ROW, 'disabled:cursor-not-allowed disabled:opacity-60', focusRing)}
              >
                <Icon icon={t.status === 'done' ? CheckCircle : Circle} size="lg" weight={t.status === 'done' ? 'fill' : 'regular'} className={t.status === 'done' ? 'shrink-0 text-success-fg' : 'shrink-0 text-ink-subtle'} />
                <span className="flex min-w-0 flex-1 flex-col"><span className={cn('text-sm', t.status === 'done' ? 'text-ink-muted line-through' : 'font-medium text-ink')}>{t.name}</span>{t.status === 'in_progress' && <span className="text-xs text-ink-muted">In progress</span>}</span>
                {unsent.includes(`task${t.id}`) && <Unsent />}
              </button>
            </li>
          ))}
        </Group>

        <section className="flex flex-col gap-2" aria-label="Items used">
          <div className="flex min-h-11 items-center justify-between gap-2 px-1">
            <Caption>Items used · {job.items.length}</Caption>
            <Button size="sm" variant="secondary" className="min-h-11" leftIcon={Plus} disabled={locked} onClick={() => setSheet('item')}>Add item</Button>
          </div>
          {job.items.length === 0 ? (
            <Card elevation="flat" className="rounded-xl border border-border"><EmptyState icon={Package} title="No items used yet" description="Add the parts and supplies you use so the quotation and stock stay right." /></Card>
          ) : (
            <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {job.items.map((it) => (
                <li key={it.id} className="flex min-h-14 items-center gap-2 pl-4 pr-2">
                  <span className="flex min-w-0 flex-1 flex-col py-3"><span className="truncate text-sm font-medium text-ink">{it.name}</span><span className="text-xs text-ink-muted">{it.sku} · {it.qty} {it.unit}</span></span>
                  {it.pending && <Unsent />}
                  <Menu
                    trigger={<IconButton icon={DotsThree} label={`Actions for ${it.name}`} variant="subtle" className="h-11 w-11" disabled={locked} />}
                    items={[{ label: 'Remove', danger: true, onSelect: () => setRemoving(it) }]}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2" aria-label="Comments">
          <div className="flex min-h-11 items-center justify-between gap-2 px-1">
            <Caption>Comments · {job.comments.length}</Caption>
            <Button size="sm" variant="secondary" className="min-h-11" leftIcon={ChatText} onClick={() => setSheet('comment')}>Comment</Button>
          </div>
          {job.comments.length === 0 ? (
            <Card elevation="flat" className="rounded-xl border border-border"><EmptyState icon={ChatText} title="No comments yet" description="Leave a note for the front desk or the next mechanic." /></Card>
          ) : (
            <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {job.comments.map((c, i) => (
                <li key={i} className="flex flex-col gap-1 px-4 py-3 text-sm">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="font-medium text-ink">{c.who}</span><span className="text-xs text-ink-muted">{c.when}</span>{c.pending && <Unsent />}</p>
                  <p className="text-ink">{c.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2" aria-label="Attachments">
          <div className="flex min-h-11 items-center justify-between gap-2 px-1">
            <Caption>Attachments · {job.files.length}</Caption>
            <Button size="sm" variant="secondary" className="min-h-11" leftIcon={Camera} disabled={locked} onClick={() => { const f: JobFile = { name: `photo-${job.files.length + 1}.jpg`, size: '1.2 MB', kind: 'photo' }; update({ ...job, files: [...job.files, f] }); toast.success('Photo added.'); }}>Add photo</Button>
          </div>
          {job.files.length === 0 ? (
            <Card elevation="flat" className="rounded-xl border border-border"><EmptyState icon={Camera} title="No attachments" description="Take a photo of the problem or the finished work." /></Card>
          ) : (
            <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {job.files.map((f) => (
                <li key={f.name} className="flex min-h-14 items-center gap-3 px-4 py-3"><Icon icon={FILE_ICON[f.kind]} size="md" className="shrink-0 text-ink-subtle" /><span className="min-w-0 flex-1 truncate text-sm text-ink">{f.name}</span><span className="text-xs text-ink-muted">{f.size}</span></li>
              ))}
            </ul>
          )}
        </section>
      </MPage>

      {/* Sticky action bar: the next action is the one primary; Status holds free moves and corrections. */}
      <div className="mech-safe-bottom-bar sticky bottom-0 mt-auto flex items-center gap-3 border-t border-border bg-surface px-4 pt-4">
        <Button variant="secondary" className="min-h-11" disabled={locked} onClick={() => setSheet('status')}>Change status</Button>
        {next ? (
          <Button className="min-h-11 flex-1" onClick={() => move(next.to)}>{next.label}</Button>
        ) : (
          <p className="flex-1 text-right text-xs text-ink-muted">{locked ? 'Locked' : job.status === 'for_pickup' ? 'Waiting for the front desk' : 'Waiting for the customer'}</p>
        )}
      </div>

      <StatusSheet open={sheet === 'status' || sheet === 'hold'} startOnHold={sheet === 'hold'} current={job.status} onOpenChange={(o) => !o && setSheet(null)} onPick={move} />
      <AddItemSheet
        open={sheet === 'item' || sheet === 'item-validation'} tried={sheet === 'item-validation'} onOpenChange={(o) => !o && setSheet(null)}
        onAdd={(inv, qty) => {
          update({ ...job, items: [...job.items, { id: Date.now(), name: inv.name, sku: inv.sku, qty, unit: inv.unit, pending: offline }] });
          setSheet(null); toast.success(`${inv.name} added to the job.`);
        }}
      />
      <CommentSheet
        open={sheet === 'comment' || sheet === 'comment-validation'} tried={sheet === 'comment-validation'} onOpenChange={(o) => !o && setSheet(null)}
        onPost={(text) => { update({ ...job, comments: [{ who: 'Joel Mendoza', text, when: 'Just now', pending: offline }, ...job.comments] }); setSheet(null); toast.success('Comment posted.'); }}
      />
      <ConfirmDialog
        open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)} title={`Remove ${removing?.name}?`} description="It is taken off this job and returned to stock counts." confirmLabel="Remove" tone="danger"
        onConfirm={() => { if (removing) update({ ...job, items: job.items.filter((i) => i.id !== removing.id) }); setRemoving(null); }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- Sheets

const SHEET_W = '100%';

function StatusSheet({ open, startOnHold, current, onOpenChange, onPick }: { open: boolean; startOnHold?: boolean; current: JobStatus; onOpenChange: (o: boolean) => void; onPick: (s: JobStatus, reason?: string) => void }) {
  const [holding, setHolding] = useState(!!startOnHold);
  const [reason, setReason] = useState(HOLD_REASONS[0]);
  const [note, setNote] = useState('');
  return (
    <OffCanvas open={open} onOpenChange={(o) => { if (!o) setHolding(!!startOnHold); onOpenChange(o); }} width={SHEET_W}>
      <OffCanvas.Header>{holding ? 'Mark as pending' : 'Change status'}</OffCanvas.Header>
      <OffCanvas.Body>
        {holding ? (
          <div className="flex flex-col gap-4">
            <Field label="Why is it pending?"><Select value={reason} onValueChange={setReason} options={HOLD_REASONS.map((r) => ({ value: r, label: r }))} /></Field>
            <Field label="Note (optional)"><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. compressor clutch ordered, ETA Oct 19" /></Field>
            <div className="flex flex-col gap-2">
              <Button fullWidth className="min-h-11" onClick={() => onPick('pending', note ? `${reason}: ${note}` : reason)}>Mark as pending</Button>
              <Button fullWidth variant="subtle" className="min-h-11" onClick={() => setHolding(false)}>Back</Button>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl bg-surface-subtle" role="radiogroup" aria-label="Status">
            {MECHANIC_MOVES.map((m) => (
              <li key={m.value}>
                <button
                  role="radio" aria-checked={m.value === current} disabled={m.value === current}
                  onClick={() => (m.value === 'pending' ? setHolding(true) : onPick(m.value))}
                  className={cn(ROW, 'disabled:cursor-default', focusRing)}
                >
                  <span className="flex min-w-0 flex-1 flex-col"><span className="text-sm font-medium text-ink">{m.label}</span><span className="text-xs text-ink-muted">{m.hint}</span></span>
                  {m.value === current && <Icon icon={CheckCircle} size="md" weight="fill" className="text-primary-600" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </OffCanvas.Body>
    </OffCanvas>
  );
}

function AddItemSheet({ open, tried, onOpenChange, onAdd }: { open: boolean; tried?: boolean; onOpenChange: (o: boolean) => void; onAdd: (i: (typeof INVENTORY)[number], qty: number) => void }) {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [attempted, setAttempted] = useState(!!tried);
  const list = INVENTORY.filter((i) => `${i.name} ${i.sku}`.toLowerCase().includes(q.toLowerCase()));
  const item = INVENTORY.find((i) => i.id === picked);
  const error = attempted ? (!item ? 'Pick an item first.' : qty < 1 ? 'Quantity must be at least 1.' : qty > item.onHand ? `Only ${item.onHand} ${item.unit} on hand.` : undefined) : undefined;
  return (
    <OffCanvas open={open} onOpenChange={onOpenChange} width={SHEET_W}>
      <OffCanvas.Header>Add item used</OffCanvas.Header>
      <OffCanvas.Body>
        <div className="flex flex-col gap-4">
          <SearchBar aria-label="Search stock" placeholder="Search name or SKU" value={q} onValueChange={setQ} onClear={() => setQ('')} size="lg" />
          {list.length === 0 ? (
            <EmptyState icon={Package} title="No stock item matches" description="Check the name or SKU, or tell the front desk the item is missing." />
          ) : (
            <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl bg-surface-subtle" role="radiogroup" aria-label="Stock items">
              {list.map((i) => {
                const tone = stockTone(i);
                return (
                  <li key={i.id}>
                    <button role="radio" aria-checked={picked === i.id} disabled={i.onHand === 0} onClick={() => { setPicked(i.id); setQty(1); }} className={cn(ROW, picked === i.id && 'bg-primary-50', 'disabled:opacity-60', focusRing)}>
                      <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-sm font-medium text-ink">{i.name}</span><span className="text-xs text-ink-muted">{i.sku} · {i.onHand} {i.unit} on hand</span></span>
                      {tone === 'error' ? <Badge tone="error" size="sm">Out of stock</Badge> : tone === 'warning' ? <Badge tone="warning" size="sm">Low</Badge> : null}
                      {picked === i.id && <Icon icon={CheckCircle} size="md" weight="fill" className="text-primary-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <Field label="Quantity" error={error}>
            <div className="flex items-center gap-2">
              <IconButton icon={Minus} label="Decrease quantity" variant="secondary" className="h-11 w-11" onClick={() => setQty((n) => Math.max(0, n - 1))} />
              <Input inputMode="numeric" className="text-center" value={String(qty)} invalid={!!error} onChange={(e) => setQty(Number(e.target.value.replace(/\D/g, '')))} />
              <IconButton icon={Plus} label="Increase quantity" variant="secondary" className="h-11 w-11" onClick={() => setQty((n) => n + 1)} />
            </div>
          </Field>
          <Button fullWidth className="min-h-11" onClick={() => { setAttempted(true); if (item && qty >= 1 && qty <= item.onHand) onAdd(item, qty); }}>Add to job</Button>
        </div>
      </OffCanvas.Body>
    </OffCanvas>
  );
}

function CommentSheet({ open, tried, onOpenChange, onPost }: { open: boolean; tried?: boolean; onOpenChange: (o: boolean) => void; onPost: (t: string) => void }) {
  const [text, setText] = useState('');
  const [attempted, setAttempted] = useState(!!tried);
  const error = attempted && !text.trim() ? 'Write a comment before posting.' : undefined;
  return (
    <OffCanvas open={open} onOpenChange={onOpenChange} width={SHEET_W}>
      <OffCanvas.Header>Add a comment</OffCanvas.Header>
      <OffCanvas.Body>
        <div className="flex flex-col gap-4">
          <Field label="Comment" error={error}><Textarea rows={5} value={text} invalid={!!error} onChange={(e) => setText(e.target.value)} placeholder="What should the front desk or the next mechanic know?" /></Field>
          <Button fullWidth className="min-h-11" onClick={() => { setAttempted(true); if (text.trim()) { onPost(text.trim()); setText(''); setAttempted(false); } }}>Post comment</Button>
        </div>
      </OffCanvas.Body>
    </OffCanvas>
  );
}
