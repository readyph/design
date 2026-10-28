import { type ReactNode } from 'react';
import { cn } from '../utils/cn';

/*
 * RDY-394 I10. Transcribed from inventory-home round-1/final:
 *  - ProgressSteps: purchase-orders.css 69-81 (base), 196 (<=1099 gap), 237-238 (<=640 stacked), 304/307 (print); markup purchase-orders.js 275.
 *  - SideSteps: order-list.css 128-132 (base), 154-160 (@container sheet max-width 1100px: three columns), 203 (<=640 media: hidden); markup order-list.js 180.
 * Not interactive. The decorative .pd dot is display:none in the source and is not built.
 */
export type ProgressStepState = 'done' | 'now' | 'next' | 'off';

export type ProgressStep = {
  /** Status word, e.g. Drafted, Sent, Received, Part in, Cancelled. */
  label: string;
  /** One-line note under the word. May be empty. */
  note?: string;
  state: ProgressStepState;
  /** Note in red 600 (late). */
  flag?: boolean;
};

const bar: Record<ProgressStepState, string> = {
  done: 'before:bg-control',
  now: 'before:bg-accent print:before:bg-black',
  next: 'before:bg-rule',
  off: 'before:bg-faint before:h-px',
};
const word: Record<ProgressStepState, string> = {
  done: '',
  now: 'text-text',
  next: 'text-muted font-medium',
  off: 'text-muted font-medium',
};

export type ProgressStepsProps = { steps: ProgressStep[]; 'aria-label'?: string; className?: string };

/** Progress steps (I10): full-width step bar. Each step has a 2px top rule (done control, now accent, next rule, off faint 1px), a word and a note. `now` carries aria-current="step". */
export function ProgressSteps({ steps, 'aria-label': ariaLabel = 'Where this order is', className }: ProgressStepsProps) {
  return (
    <ol
      aria-label={ariaLabel}
      className={cn(
        'm-0 mt-8 grid list-none grid-cols-3 gap-x-8 p-0',
        'max-[1099px]:gap-x-5 max-[640px]:mt-6 max-[640px]:grid-cols-1 max-[640px]:gap-y-0 print:mt-4',
        className,
      )}
    >
      {steps.map((s, i) => (
        <li
          key={`${s.label}-${i}`}
          aria-current={s.state === 'now' ? 'step' : undefined}
          className={cn(
            "relative flex flex-col gap-[3px] pt-[14px] before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:content-['']",
            'max-[640px]:grid max-[640px]:grid-cols-[92px_minmax(0,1fr)] max-[640px]:gap-x-3 max-[640px]:pb-[10px] max-[640px]:pt-3',
            bar[s.state],
          )}
        >
          <b className={cn('text-[14px] font-semibold', word[s.state])}>{s.label}</b>
          <span className={cn('text-[13px] leading-[19px]', s.flag ? 'font-semibold text-bad' : 'text-muted')}>{s.note}</span>
        </li>
      ))}
    </ol>
  );
}

export type SideStep = { title: string; note: ReactNode };
export type SideStepsProps = { steps: SideStep[]; 'aria-label'?: string; className?: string };

/** Side steps (I10): numbered steps down the side ("1 · Check it"); three columns when the host container named `sheet` is 1100px wide or less; hidden at 640px and below. The host shell must set `container: sheet / inline-size` (as the workshop .sheet does). The number is part of the title text. */
export function SideSteps({ steps, 'aria-label': ariaLabel, className }: SideStepsProps) {
  return (
    <ol
      aria-label={ariaLabel}
      className={cn(
        'm-0 list-none p-0 [@container_sheet_(max-width:1100px)]:grid [@container_sheet_(max-width:1100px)]:grid-cols-3 [@container_sheet_(max-width:1100px)]:gap-x-6 max-[640px]:!hidden',
        className,
      )}
    >
      {steps.map((s, i) => (
        <li
          key={`${s.title}-${i}`}
          className={cn(
            'flex flex-col items-start gap-1 border-t border-rule py-4',
            '[@container_sheet_(max-width:1100px)]:border-t-0 [@container_sheet_(max-width:1100px)]:pt-3',
            i === 0 && 'border-t-transparent',
          )}
        >
          <b className="text-[14px] font-semibold">{s.title}</b>
          <span className="text-[13px] leading-[19px] text-muted">{s.note}</span>
        </li>
      ))}
    </ol>
  );
}
