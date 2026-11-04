import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, EmptyState } from '../../../index';
import { SignOut } from '@phosphor-icons/react';
import { branch, mechanics, type Job } from '../../../components/sms/data';
import { useDirtyGuard } from '../../../components/DirtyGuard';
import { MechFrame, type MechCrumb } from '../../../components/MechFrame';
import { MechHome } from '../../../components/MechHome';
import { MechMe } from '../../../components/MechMe';
import { MechRequestForm, MechRequestSent } from '../../../components/MechRequest';
import { MechServiceBody, type ServiceDialog } from '../../../components/MechService';
import { markRead, requestPart, setPref } from '../../../components/sms/mechActions';
import { dayOf, plateOf, poolFor, resetMech, useMech, type MechScenario } from '../../../components/sms/mechModel';

const ME_PREFS = [
  { id: 'assigned', label: 'Tell me when I get a new car' },
  { id: 'reply', label: 'Tell me when my manager replies' },
  { id: 'part', label: 'Tell me when a part is ready' },
];

export type MechOverlay = 'none' | 'service detail open' | 'request part open' | 'scan sheet' | 'pause reason' | 'mark-done confirm';
export interface MechanicProps {
  /** Which mechanic is signed in (Jun, Arnel, Paolo, Ricky). */
  mechanicId?: string;
  /** Data state of the day. */
  scenario?: MechScenario;
  /** Many services, long titles. */
  stress?: boolean;
  /** Where the app opens. */
  overlay?: MechOverlay;
}

type Screen = { k: 'home' } | { k: 'service'; id: string } | { k: 'request'; jobId: string | null; askCar: boolean } | { k: 'me' };

/** The mechanic's phone app: Services, Service details (with its own part requests), Request a part, Me. One role-limited shell, no money anywhere. Moves are written to the shared store (mechModel) that the manager's Today reads. */
export function MechanicPage({ mechanicId = 'm-jun', scenario = 'normal', stress = false, overlay = 'none' }: MechanicProps) {
  useState(() => { resetMech(); return 0; });
  const s = useMech();
  const me = mechanics.find((m) => m.id === mechanicId) ?? mechanics[0];
  const pool = useMemo(() => poolFor(s, me, stress, scenario), [s, me, stress, scenario]);
  const day = useMemo(() => dayOf(s, me, scenario, stress), [s, me, scenario, stress]);
  const mine = pool.filter((j) => j.assigneeId === me.id && ['TODO', 'IN_PROGRESS', 'PENDING'].includes(j.status));
  const first = day.now ?? day.next[0] ?? day.blocked[0] ?? null;

  const initial: Screen = overlay === 'request part open' || overlay === 'scan sheet' ? { k: 'request', jobId: first?.id ?? null, askCar: !first }
    : overlay === 'service detail open' || overlay === 'pause reason' || overlay === 'mark-done confirm' ? (first ? { k: 'service', id: first.id } : { k: 'home' }) : { k: 'home' };
  const [screen, setScreen] = useState<Screen>(initial);
  const [dialog, setDialog] = useState<ServiceDialog>(overlay === 'pause reason' ? 'pause' : overlay === 'mark-done confirm' ? 'done' : null);
  const [scanOpen, setScanOpen] = useState(overlay === 'scan sheet');
  const [qty, setQty] = useState(1); const [sent, setSent] = useState(false);
  const [reqJob, setReqJob] = useState<string | null>(initial.k === 'request' ? initial.jobId : null); const [reqProduct, setReqProduct] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const flash = (m: string) => { setSnack(m); clearTimeout(timer.current); timer.current = setTimeout(() => setSnack(null), 3200); };

  const { guard, node: guardNode } = useDirtyGuard(screen.k === 'request' && !sent && !!reqProduct);
  const go = (to: Screen) => guard(() => { setDialog(null); setScreen(to); mainScroll(); });
  const mainScroll = () => document.getElementById('mech-main')?.scrollTo({ top: 0 });
  const openRequest = (jobId: string | null, productId?: string) => { setReqJob(jobId); setReqProduct(productId ?? null); setQty(1); setSent(false); go({ k: 'request', jobId, askCar: jobId === null }); };
  const openService = (id: string) => { setScreen({ k: 'service', id }); mainScroll(); };
  // Opening a service reads the manager's messages on it, so the unread flag on its card clears.
  const openId = screen.k === 'service' ? screen.id : null;
  useEffect(() => { if (openId) markRead(openId); }, [openId]);
  const onProfile = () => { if (screen.k !== 'me') go({ k: 'me' }); };
  const toHome = () => go({ k: 'home' });
  const homeCrumb: MechCrumb = { label: 'Services', onClick: toHome };

  if (signedOut) {
    return (
      <div className="grid min-h-dvh place-items-center bg-surface p-6"><EmptyState icon={SignOut} title="You are logged out" description="Log in again to see your services." action={<Button variant="primary" onClick={() => setSignedOut(false)}>Log in as {me.short}</Button>} /></div>
    );
  }
  const common = { me, business: branch.business, branchName: branch.name, onProfile, profileActive: screen.k === 'me', snack } as const;

  if (screen.k === 'service') {
    const job = pool.find((j) => j.id === screen.id);
    if (!job) return <MechFrame {...common} title="Service" crumbs={[homeCrumb, { label: 'Service' }]}><p className="text-muted">This service is not yours any more.</p></MechFrame>;
    return (
      <MechFrame {...common} title={`Service ${plateOf(job)}`} crumbs={[homeCrumb, { label: crumbOf(job) }]}>
        <MechServiceBody job={job} s={s} me={me} flash={flash} dialog={dialog} setDialog={setDialog} onNeedPart={(p) => openRequest(job.id, p)} onSentDone={() => setScreen({ k: 'home' })} />
      </MechFrame>
    );
  }
  if (screen.k === 'request') {
    const rjob = !screen.askCar && screen.jobId ? pool.find((j) => j.id === screen.jobId) : undefined;
    const leave = (to: Screen) => () => { setSent(false); go(to); };
    const crumbs: MechCrumb[] = [{ label: 'Services', onClick: leave({ k: 'home' }) }, ...(rjob ? [{ label: crumbOf(rjob), onClick: leave({ k: 'service', id: rjob.id }) }] : []), { label: 'Request a part' }];
    if (sent) return <MechFrame {...common} title="Need a part" crumbs={crumbs} overlay={guardNode}><MechRequestSent doneLabel={reqJob ? 'Back to this service' : 'Back to Services'} onDone={() => { setSent(false); setScreen(reqJob ? { k: 'service', id: reqJob } : { k: 'home' }); }} onAnother={() => openRequest(reqJob)} /></MechFrame>;
    return (
      <MechFrame {...common} title="Need a part" crumbs={crumbs} overlay={guardNode}
        bar={<div className="grid gap-2">{!reqProduct && <p className="text-[13px] text-muted">Pick a part first.</p>}<Button variant="primary" fullWidth disabled={!reqProduct} onClick={() => { requestPart({ productId: reqProduct!, qty, jobId: reqJob, by: me.id }); setSent(true); mainScroll(); }}>Send to manager</Button></div>}>
        <MechRequestForm jobs={mine} jobId={reqJob} setJobId={setReqJob} askCar={screen.askCar} productId={reqProduct} setProductId={setReqProduct} qty={qty} setQty={setQty} scanOpen={scanOpen} setScanOpen={setScanOpen} />
      </MechFrame>
    );
  }
  if (screen.k === 'me') return <MechFrame {...common} title="Profile" crumbs={[homeCrumb, { label: 'Profile' }]}><MechMe name={me.name} initials={me.initials} id={me.id} subtitle={`${me.bay} · ${branch.name}`} prefs={ME_PREFS.map((p) => ({ ...p, checked: !!s.prefs[p.id] }))} onPref={setPref} hoursText={scenario === 'day off' ? 'Today you are off.' : `Today ${me.shift}.`} onSignOut={() => setSignedOut(true)} /></MechFrame>;

  return (
    <MechFrame {...common} title="Services" crumbs={[{ label: 'Services' }]} flush>
      <MechHome me={me} day={day} scenario={scenario} pool={pool} s={s} onOpen={openService} />
    </MechFrame>
  );
}

/** Breadcrumb text for a service: its JO number and plate. */
const crumbOf = (j: Job) => `${j.number} ${plateOf(j)}`;
