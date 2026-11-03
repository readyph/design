import { Check } from '@phosphor-icons/react';
import { cn } from '../utils/cn';

export interface WizardStep { id: number; label: string; /** Why it cannot be opened yet. */ blocked?: string }

/**
 * Studio-only WizardStepper (NEW): numbered steps for a modal wizard. The current one is marked `aria-current="step"`, bold and underlined; finished ones show a check;
 * every reachable step is a button (jump back or ahead), a blocked one is disabled. Left-aligned to the modal gutter; reads "1 Services & price  2 Review & confirm" on a phone too.
 */
export function WizardStepper({ steps, current, onGo, className }: { steps: WizardStep[]; current: number; onGo: (id: number) => void; className?: string }) {
  return (
    <ol aria-label="Steps" className={cn('flex items-stretch gap-8 border-b border-rule px-pad max-[640px]:gap-4 max-[640px]:px-4', className)}>
      {steps.map((s) => {
        const on = s.id === current; const done = s.id < current;
        return (
          <li key={s.id} className="min-w-0">
            <button
              type="button" aria-current={on ? 'step' : undefined} disabled={!!s.blocked && !on} title={s.blocked && !on ? s.blocked : undefined} onClick={() => onGo(s.id)}
              className={cn('flex min-h-11 items-center gap-2 border-b-2 px-0 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:text-faint',
                on ? 'border-accent font-semibold text-text' : 'border-transparent text-muted hover:text-text')}
            >
              <span aria-hidden className={cn('inline-flex size-5 flex-none items-center justify-center rounded-full border text-[12px] tabular-nums', on ? 'border-accent bg-accent text-accent-ink' : done ? 'border-accent text-accent' : 'border-control')}>
                {done ? <Check size={12} weight="bold" /> : s.id}
              </span>
              <span className="truncate">{s.label}</span>
              {done && <span className="sr-only">, done</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
