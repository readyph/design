import { useState } from 'react';
import { LinkBreak } from '@phosphor-icons/react';
import { EmptyState, Skeleton, Toaster, toast } from '../../../index';
import { branch, manager } from '../../../components/sms/data';
import { useMech, nextId, nowIso, patchMech } from '../../../components/sms/mechModel';
import {
  INVALID_TOKEN, SCENARIO_JOB, ensureLink, feedForCustomer, liveJob, quotesFor, regenerateLink, resolveLink, seedTracker, studioPost, useLinks,
  type ThreadSeed, type TrackerScenario,
} from '../../../components/sms/trackerModel';
import { ChatPanel } from '../../../components/CustomerChat';
import { ItemsBlock, PaymentBlock, QuoteCard, StatusBlock, TrackerFrame, UpdatesBlock, WhoBlock } from '../../../components/TrackerBlocks';

export type TrackerState = 'ready' | 'loading' | 'invalid link' | 'replaced link';
export interface TrackerProps {
  /** Which service the customer is following, seeded into the shared stores (story control). */
  scenario?: TrackerScenario;
  /** Customer chat history on load. */
  thread?: ThreadSeed;
  /** `loading` = skeleton; `invalid link` = a token nobody issued; `replaced link` = the manager made a new one. */
  state?: TrackerState;
  /** Open an already-seeded token instead of seeding (tests). */
  token?: string;
  /** Studio-only strip under the page: simulate the manager's side. Off in tests that check the pure customer view. */
  studioBar?: boolean;
}

/** Friendly dead end. No account talk, no error codes: say what happened and who to call. */
function DeadLink({ replaced }: { replaced: boolean }) {
  return (
    <div className="py-10">
      <EmptyState
        icon={LinkBreak}
        title={replaced ? 'This link was replaced' : 'We could not open this link'}
        description={replaced ? `${branch.name} sent a newer link for this service. Please use the latest text message, or call us and we will send it again.` : `It may be mistyped or too old. Links stop working a week after pick-up. Please call ${branch.name} on ${manager.phone} and we will send a new one.`}
      />
    </div>
  );
}

/** The customer's tracking page: no login, one column, opened from a text message or QR code on the job order. Reads the same stores as the staff pages. */
export function TrackerPage({ scenario = 'in progress', thread = 'none', state = 'ready', token, studioBar = true }: TrackerProps) {
  const [boot] = useState(() => {
    if (token) return { token, jobId: null as string | null };
    const jobId = seedTracker(scenario, thread);
    if (state === 'invalid link') return { token: INVALID_TOKEN, jobId };
    if (state === 'replaced link') { const old = ensureLink(jobId); regenerateLink(jobId); return { token: old, jobId }; }
    return { token: ensureLink(jobId), jobId };
  });
  useLinks();
  const s = useMech();
  const link = resolveLink(boot.token);
  const job = link.state === 'ok' ? liveJob(s, link.jobId) : null;

  const body = state === 'loading' ? (
    <div aria-busy="true" aria-label="Loading your service" className="flex flex-col gap-10">
      <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-6 w-2/3" /><Skeleton className="h-5 w-1/2" /></div>
      <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-12 w-full" /></div>
      <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
    </div>
  ) : !job ? <DeadLink replaced={link.state === 'replaced'} /> : (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-10 [&>section]:mt-0">
        <div><WhoBlock job={job} /><StatusBlock job={job} /></div>
        {quotesFor(s, job).map((q) => <QuoteCard key={q.id} q={q} />)}
        <ItemsBlock job={job} />
        <PaymentBlock job={job} />
        <UpdatesBlock job={job} posts={feedForCustomer(s, job)} />
      </div>
      <ChatPanel job={job} s={s} className="lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1" />
    </div>
  );

  const bar = studioBar && job ? (
    <div data-studio-bar className="border-t border-rule bg-raised px-4 py-3 text-[12px] leading-5 text-muted">
      <p className="mb-1 font-semibold">Studio only: act as the manager</p>
      <div className="flex flex-wrap gap-x-4">
        <button type="button" className="min-h-8 underline underline-offset-2" onClick={() => { studioPost(job.id, 'Update from the shop: we are about halfway through.', { photos: 1 }); toast('Update posted to the customer'); }}>Post an update</button>
        <button type="button" className="min-h-8 underline underline-offset-2" onClick={() => { studioPost(job.id, 'Internal: ask the supplier for a discount.', { internal: true }); toast('Internal note added (customer cannot see it)'); }}>Add an internal note</button>
        <button type="button" className="min-h-8 underline underline-offset-2" onClick={() => { patchMech((m) => ({ custMsgs: [...m.custMsgs, { id: nextId('cm'), jobId: job.id, from: 'manager', text: 'Thanks for waiting. We will call you when it is done.', at: nowIso(), read: false }] })); }}>Reply to the chat</button>
      </div>
    </div>
  ) : undefined;

  return <><TrackerFrame footer={bar}>{body}</TrackerFrame><Toaster /></>;
}
export { SCENARIO_JOB };
