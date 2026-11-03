import { ChatCircleText, X } from '@phosphor-icons/react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Fact, FactsLine } from './FactsLine';
import { Skeleton } from './Skeleton';
import { hm } from './today/model';
import type { TodayInquiry, TodayJob, TodayJobView } from './today/types';

export interface InquiryDetailProps<J extends TodayJob = TodayJob> {
  inquiry: TodayInquiry;
  /** Reply time this session, if sent. */
  repliedAt?: string;
  /** The service the inquiry is linked to, with its car and customer. */
  job?: J | null;
  jobView?: TodayJobView;
  /** `loading`: skeleton body while the inquiry loads. */
  state?: 'ready' | 'loading';
  onReply: (q: TodayInquiry) => void;
  onNewService: (q: TodayInquiry) => void;
  onOpenJob: (j: J) => void;
  onClose: () => void;
}

/** InquiryDetail: the off-canvas body for an inquiry. Reply and New service live here, not on the list row. Data-agnostic: the inquiry, its linked job and that job's view are props. */
export function InquiryDetail<J extends TodayJob = TodayJob>({ inquiry: q, repliedAt, job, jobView, state = 'ready', onReply, onNewService, onOpenJob, onClose }: InquiryDetailProps<J>) {
  const done = repliedAt ?? (q.repliedAt ? hm(q.repliedAt) : undefined);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-2 px-4 pb-3 pt-3">
        <span aria-hidden className="flex size-5 flex-none items-center justify-center pt-0.5 text-muted"><ChatCircleText size={20} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><span className="text-[13px] text-muted">{q.channel} · {hm(q.at)}</span><Badge tone={done ? 'neutral' : 'warn'}>{done ? `Replied ${done}` : 'Reply'}</Badge></div>
          <h2 className="mt-1 text-[16px] font-semibold leading-6">{q.name}</h2>
        </div>
        <button type="button" aria-label="Close inquiry" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-control text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:size-11"><X size={16} aria-hidden /></button>
      </div>
      {state === 'loading' ? (
        <div role="status" aria-label="Loading the inquiry" className="space-y-2 border-t border-rule px-4 py-3"><Skeleton variant="rect" width="90%" height={14} /><Skeleton variant="rect" width="60%" height={14} /></div>
      ) : <p className="border-t border-rule px-4 py-3 text-[14px] leading-6">{q.text}</p>}
      {job && (
        <div className="border-t border-rule px-4 py-3">
          <h3 className="mb-2 text-[13px] font-semibold">Linked service</h3>
          <FactsLine><Fact value={job.number}>{jobView?.vehicle}</Fact></FactsLine>
          <Button variant="text" className="-ml-2 mt-1" onClick={() => onOpenJob(job)}>Open service {job.number}</Button>
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-rule px-4 py-3">
        {state === 'ready' && !done && <Button variant="primary" onClick={() => onReply(q)}>Reply</Button>}
        {state === 'ready' && !done && !job && <Button variant="secondary" onClick={() => onNewService(q)}>New service</Button>}
        {state === 'ready' && done && <p className="text-[13px] text-muted">Replied at {done}.</p>}
      </div>
    </div>
  );
}
