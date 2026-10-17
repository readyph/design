import { useState } from 'react';
import { toast } from '../../components/toast/toastStore';
import { RepairShell, type BranchState, type RepairNav } from './Shell';
import { JobDetail, JobList, TodayPage, type DetailState, type ListState, type TodayState } from './JobScreens';
import type { IntakeScenario, NewQuotation } from './QuotationIntake';
import { JOBS, statusMeta, type Job, type JobPart, type JobService, type NextAction } from './data';

export interface RepairFlowProps {
  start?: 'today' | 'jobs';
  branchState?: BranchState;
  menuOpen?: boolean;
  todayState?: TodayState;
  listState?: ListState;
  initialTab?: string;
  initialQuery?: string;
  intake?: IntakeScenario;
  /** Start on a job's detail (stories). */
  detail?: { jobId?: number; state?: DetailState };
}

/**
 * Stateful wrapper that wires Today, Jobs and the job detail together inside Shell A, so the
 * flow can be walked: Today -> next action, New quotation -> toast -> job detail, branch switch stays on the page.
 */
export function RepairFlow({ start = 'today', branchState, menuOpen, todayState, listState, initialTab, initialQuery, intake, detail }: RepairFlowProps) {
  const [page, setPage] = useState<RepairNav>(start);
  const [jobs, setJobs] = useState<Job[]>(JOBS);
  const [openId, setOpenId] = useState<number | null>(detail ? detail.jobId ?? 13 : null);
  const [created, setCreated] = useState<Record<number, { services: JobService[]; parts: JobPart[] }>>({});

  const advance = (j: Job, a: NextAction) => {
    if (a.key === 'pay' || !a.to) { setOpenId(j.id); return; }
    const to = a.to;
    setJobs((all) => all.map((x) => (x.id === j.id ? { ...x, status: to } : x)));
    toast.success(`Job #${j.id} is now ${statusMeta(to).label}.`);
  };
  const open = openId !== null ? jobs.find((j) => j.id === openId) : undefined;

  return (
    <RepairShell active={page === 'jobs' || page === 'today' ? page : 'today'} branchState={branchState} menuOpen={menuOpen} onNavigate={(k) => { setOpenId(null); if (k === 'today' || k === 'jobs') setPage(k); }}>
      {(b) => {
        const onOpenJob = (j: Job) => setOpenId(j.id);
        const onCreated = (q: NewQuotation) => {
          const id = Math.max(...jobs.map((j) => j.id)) + 1;
          const job: Job = {
            id, customer: q.customer, phone: q.phone, plate: q.plate, brand: q.brand, model: q.model, assignee: q.assignee,
            status: q.preApproved ? 'todo' : 'for_approval', since: 'Oct 17, 2026', due: 'Oct 24, 2026', branch: b.id, balance: q.total,
          };
          setJobs((all) => [job, ...all]);
          setCreated((c) => ({ ...c, [id]: { services: q.services, parts: q.parts } }));
          setOpenId(id);
        };
        if (open) {
          return <JobDetail key={open.id} job={open} state={detail?.state} branchName={b.name} items={created[open.id]} onBack={() => setOpenId(null)} onStatusChange={(id, s) => setJobs((all) => all.map((x) => (x.id === id ? { ...x, status: s } : x)))} />;
        }
        return page === 'jobs'
          ? <JobList key={b.id} branchId={b.id} jobs={jobs} state={listState} initialTab={initialTab} initialQuery={initialQuery} intake={intake} onOpenJob={onOpenJob} onAdvance={advance} onCreated={onCreated} />
          : <TodayPage key={b.id} branchId={b.id} jobs={jobs} state={todayState} intake={intake} onOpenJob={onOpenJob} onAdvance={advance} onCreated={onCreated} />;
      }}
    </RepairShell>
  );
}
