import { forwardRef, type ForwardedRef, type ReactElement, type ReactNode, type Ref } from 'react';
import { Button } from './Button';
import { cn } from '../utils/cn';
import { PersonAvatar } from './avatarTone';
import { STATUS_SHORT, dayWord, flagOf, nextAction, reasonOf, serviceTitle } from './today/model';
import type { NextAction, TodayEnv, TodayJob, TodayJobView, TodayMechanic } from './today/types';

export interface JobRowProps<J extends TodayJob = TodayJob> {
  job: J;
  /** The clock and the stock rules behind the flag and the next action. */
  env: TodayEnv;
  /** Car and customer shown on the row. */
  view: TodayJobView;
  /** The shop's mechanics; the assignee shows as an avatar. */
  mechanics: TodayMechanic[];
  density?: 'row' | 'compact' | 'two-line';
  selected?: boolean;
  onOpen?: (job: J) => void;
  onAction?: (job: J, a: NextAction) => void;
  /** Slot under the row (part chip, Leda note). */
  below?: ReactNode;
  className?: string;
}

/**
 * JobRow: plate in mono, make/model/year, customer, mechanic avatar, promised time against Now, flag, next action.
 * `two-line` is the phone density: plate and time on line one, vehicle and flag on line two, the action as a 44px button.
 * Data-agnostic: the job, its view, the mechanics and the clock all arrive as props.
 */
function JobRowInner<J extends TodayJob>({ job, env, view: v, mechanics, density = 'row', selected, onOpen, onAction, below, className }: JobRowProps<J>, ref: ForwardedRef<HTMLDivElement>) {
  const flag = flagOf(env, job);
  const act = nextAction(env, job);
  const m = mechanics.find((x) => x.id === job.assigneeId);
  const time = job.promisedAt ? dayWord(job.promisedAt, env.today) : 'no time';
  const title = serviceTitle(job);
  const open = () => onOpen?.(job);
  const tone = flag?.tone === 'bad' ? 'text-bad font-medium' : 'text-text font-medium';
  const actionBtn = act && (
    <Button variant="text" onClick={(e) => { e.stopPropagation(); onAction?.(job, act); }} className={density === 'two-line' ? 'min-h-11' : undefined}>{act.label}</Button>
  );
  if (density === 'two-line') {
    return (
      <div ref={ref} className={cn('-mx-2 border-b border-rule px-2 py-2', reasonOf(env, job) && 'bg-warn-bg', className)}>
        <button type="button" onClick={open} className="flex w-full min-h-11 items-start gap-3 text-left">
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2"><span className="font-mono text-[13px]">{job.number}</span><span className="min-w-0 flex-1 truncate text-[14px] font-medium">{v.vehicle.replace(/ \d{4}$/, '')}</span><span className="ml-auto flex-none whitespace-nowrap text-[13px] tabular-nums text-muted">{time}</span></span>
            <span title={title} className="mt-0.5 line-clamp-2 break-words text-[13px] leading-5">{title}</span>
            <span className="mt-0.5 flex min-w-0 items-center gap-2 text-[13px] text-muted"><span className="inline-flex flex-none items-center gap-1.5 text-text"><span aria-hidden className={cn('size-1.5 rounded-full', STATUS_SHORT[job.status].dot)} />{STATUS_SHORT[job.status].label}</span><span className="min-w-0 truncate">{v.customer}</span>{flag && <span className={cn('flex-none whitespace-nowrap', tone)}>{flag.word}</span>}</span>
          </span>
        </button>
        {(actionBtn || below) && <div className="flex flex-wrap items-center gap-2">{actionBtn}{below}</div>}
      </div>
    );
  }
  return (
    <div ref={ref} className={cn('border-b border-rule', reasonOf(env, job) && 'bg-warn-bg', selected && 'bg-raised', className)}>
      <div className={cn('flex items-center gap-3 px-2', density === 'compact' ? 'min-h-9' : 'min-h-11')}>
        <button type="button" onClick={open} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-current={selected || undefined}>
          <span className="w-[68px] flex-none font-mono text-[13px]">{job.number}</span>
          <span title={`${title} · ${v.vehicle} · ${v.plate} · ${v.customer}`} className="min-w-0 flex-1 truncate text-[14px]"><span className="font-medium">{title}</span> <span className="text-muted">{v.vehicle}</span> <span className="font-mono text-[12px] text-muted">{v.plate}</span> <span className="text-muted">· {v.customer}</span></span>
          {m ? <PersonAvatar personId={m.id} name={m.name} initials={m.initials} size={24} /> : <span className="w-6" />}
          <span className="inline-flex w-24 flex-none items-center gap-1.5 text-[13px]"><span aria-hidden className={cn('size-1.5 rounded-full', STATUS_SHORT[job.status].dot)} />{STATUS_SHORT[job.status].label}</span>
          <span className="w-16 flex-none text-right text-[13px] tabular-nums text-muted">{time}</span>
          {flag ? <span className={cn('w-36 flex-none truncate text-[13px]', tone)}>{flag.word}</span> : <span className="w-36 flex-none" />}
        </button>
        {actionBtn}
      </div>
      {below && <div className="px-2 pb-2 pl-[92px]">{below}</div>}
    </div>
  );
}

export const JobRow = forwardRef(JobRowInner) as <J extends TodayJob = TodayJob>(props: JobRowProps<J> & { ref?: Ref<HTMLDivElement> }) => ReactElement | null;
