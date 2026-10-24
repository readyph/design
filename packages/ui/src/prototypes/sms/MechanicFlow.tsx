import { useState } from 'react';
import { MechanicShell, type MechanicTab } from './MechanicShell';
import {
  MechanicCustomerDetail, MechanicCustomers, MechanicJobDetail, MechanicJobs, MechanicToday,
  type MDetailSheet, type MDetailState, type MState,
} from './MechanicScreens';
import { MY_CUSTOMERS, MY_JOBS, groupOf, mechanicNext, type MCustomer, type MechanicJob } from './MechanicData';
import { statusMeta, type JobStatus } from './data';
import { toast } from '../../components/toast/toastStore';

export interface MechanicFlowProps {
  tab?: MechanicTab;
  state?: MState;
  offline?: boolean;
  jobsQuery?: string;
  customersQuery?: string;
  /** Start on a job's detail (stories). */
  detail?: { jobId?: number; state?: MDetailState; sheet?: MDetailSheet; saveFailed?: JobStatus; failNext?: boolean };
  /** Start on a customer (stories). */
  customerId?: number;
}

/** Stateful wrapper: Today, Jobs and Customers behind the bottom tab bar, with job and customer drill-ins. */
export function MechanicFlow({ tab: start = 'today', state, offline, jobsQuery, customersQuery, detail, customerId }: MechanicFlowProps) {
  const [tab, setTab] = useState<MechanicTab>(start);
  const [jobs, setJobs] = useState<MechanicJob[]>(MY_JOBS);
  const [openId, setOpenId] = useState<number | null>(detail ? detail.jobId ?? 13 : null);
  const [customer, setCustomer] = useState<MCustomer | null>(MY_CUSTOMERS.find((c) => c.id === customerId) ?? null);

  const open = openId !== null ? jobs.find((j) => j.id === openId) : undefined;
  const save = (j: MechanicJob) => setJobs((all) => all.map((x) => (x.id === j.id ? j : x)));
  const openJob = (j: MechanicJob) => setOpenId(j.id);
  const advance = (j: MechanicJob) => {
    const n = mechanicNext(j.status);
    if (!n) return;
    save({ ...j, status: n.to });
    toast.success(`Job #${j.id} is now ${statusMeta(n.to).label}.`, { action: { label: 'Undo', onClick: () => save(j) } });
  };
  const counts = { today: jobs.filter((j) => groupOf(j) === 'now').length };

  const body = open ? (
    <MechanicJobDetail key={open.id} job={open} state={detail?.state} offline={offline} saveFailed={detail?.saveFailed} failNext={detail?.failNext} initialSheet={detail?.sheet} onBack={() => setOpenId(null)} onChange={save} />
  ) : customer ? (
    <MechanicCustomerDetail customer={customer} jobs={jobs} onBack={() => setCustomer(null)} onOpenJob={openJob} />
  ) : tab === 'jobs' ? (
    <MechanicJobs jobs={jobs} state={state} initialQuery={jobsQuery} onOpenJob={openJob} />
  ) : tab === 'customers' ? (
    <MechanicCustomers state={state} initialQuery={customersQuery} onOpen={setCustomer} />
  ) : (
    <MechanicToday jobs={jobs} state={state} onOpenJob={openJob} onAdvance={advance} onGoJobs={() => setTab('jobs')} />
  );

  return (
    <MechanicShell
      tab={tab} offline={offline} counts={counts} hideTabs={!!open}
      onTab={(t) => { setOpenId(null); setCustomer(null); setTab(t); }}
    >
      {body}
    </MechanicShell>
  );
}
