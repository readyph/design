import { ChatCircleText, X } from '@phosphor-icons/react';
import { Badge, Button, Fact, FactsLine } from '../../../index';
import type { Inquiry, Job } from '../data';
import { hm, viewOf } from '../floorModel';

export interface InquiryDetailProps {
  inquiry: Inquiry;
  /** Reply time this session, if sent. */
  repliedAt?: string;
  job?: Job | null;
  onReply: (q: Inquiry) => void;
  onNewService: (q: Inquiry) => void;
  onOpenJob: (j: Job) => void;
  onClose: () => void;
}

/** Studio-only InquiryDetail (NEW): the off-canvas body for an inquiry. Reply and New service live here, not on the list row. */
export function InquiryDetail({ inquiry: q, repliedAt, job, onReply, onNewService, onOpenJob, onClose }: InquiryDetailProps) {
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
      <p className="border-t border-rule px-4 py-3 text-[14px] leading-6">{q.text}</p>
      {job && (
        <div className="border-t border-rule px-4 py-3">
          <h3 className="mb-2 text-[13px] font-semibold">Linked service</h3>
          <FactsLine><Fact value={job.number}>{viewOf(job).vehicle}</Fact></FactsLine>
          <Button variant="text" className="-ml-2 mt-1" onClick={() => onOpenJob(job)}>Open service {job.number}</Button>
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-rule px-4 py-3">
        {!done && <Button variant="primary" onClick={() => onReply(q)}>Reply</Button>}
        {!done && !job && <Button variant="secondary" onClick={() => onNewService(q)}>New service</Button>}
        {done && <p className="text-[13px] text-muted">Replied at {done}.</p>}
      </div>
    </div>
  );
}
