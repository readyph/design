import { CheckCircle, Circle, Prohibit } from '@phosphor-icons/react';
import { cn } from '../../../index';
import { REQUEST_STEPS, type RequestStatus } from '../mechModel';

const LABEL: Record<RequestStatus, string> = { Requested: 'Requested', Approved: 'Approved', 'Ready at stockroom': 'Ready at stockroom', Collected: 'Collected', Declined: 'Declined' };

/**
 * Studio-only RequestStepper (NEW): the four steps of a part request, left to right. Done = filled check, current = ringed dot + bold + `aria-current="step"`,
 * upcoming = empty circle. Every state has a mark AND a word (sr-only "done" / "not yet"), never colour alone. A declined request shows one
 * "Declined" stop instead and every step stays empty.
 */
export function RequestStepper({ status, className }: { status: RequestStatus; className?: string }) {
  if (status === 'Declined') {
    return <p className={cn('flex items-center gap-2 text-[14px] font-medium text-bad-ink', className)}><Prohibit size={20} weight="fill" aria-hidden />Declined</p>;
  }
  const at = REQUEST_STEPS.indexOf(status);
  return (
    <ol aria-label="Part request progress" className={cn('flex items-start', className)}>
      {REQUEST_STEPS.map((s, i) => {
        const done = i < at; const cur = i === at;
        return (
          <li key={s} aria-current={cur ? 'step' : undefined} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="flex items-center">
              <span aria-hidden className={cn('h-px flex-1', i === 0 ? 'bg-transparent' : i <= at ? 'bg-ok' : 'bg-rule')} />
              {done ? <CheckCircle size={20} weight="fill" aria-hidden className="flex-none text-ok" /> : cur ? <span aria-hidden className="grid size-5 flex-none place-items-center rounded-full border-2 border-accent"><span className="size-2 rounded-full bg-accent" /></span> : <Circle size={20} aria-hidden className="flex-none text-faint" />}
              <span aria-hidden className={cn('h-px flex-1', i === REQUEST_STEPS.length - 1 ? 'bg-transparent' : i < at ? 'bg-ok' : 'bg-rule')} />
            </span>
            <span className={cn('px-1 text-center text-[13px] leading-4', cur ? 'font-semibold text-text' : 'text-muted')}>{LABEL[s]}<span className="sr-only">{done ? ' (done)' : cur ? ' (now)' : ' (not yet)'}</span></span>
          </li>
        );
      })}
    </ol>
  );
}
