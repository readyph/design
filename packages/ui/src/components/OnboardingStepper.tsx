import { forwardRef, useEffect, useLayoutEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import { CaretDown, CheckCircle, CircleDashed, Lock } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { focusIfLost } from '../utils/focusIfLost';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';

export type StepperStatus = 'todo' | 'done' | 'skipped';

/** One step of the setup. */
export interface StepperStep {
  /** Stable id. The caller maps it to `?setup=N`. */
  id: string;
  /** Short name: "General info", "Leda & Memory". Wraps, never truncated. */
  label: string;
  /** `done` (saved), `skipped` (left for later) or `todo`. The current step is whichever `current` names. */
  status?: StepperStatus;
  /** Cannot be opened yet (for example until the platform exists). Stays in the list, out of the Tab order (`tabIndex=-1`); pressing it announces the reason. */
  locked?: boolean;
  /** Why it is locked, in plain words: "Add the platform first." Shown under the name and read to assistive tech. */
  reason?: string;
  /** Required steps have no "Skip for now". */
  required?: boolean;
}

export interface OnboardingStepperProps {
  steps: StepperStep[];
  /** Id of the open step. Controlled: the stepper never reads or writes the URL. */
  current: string;
  /** A step was chosen (never called for a locked step or the current one). Update `?setup=N` here. */
  onStepChange: (id: string) => void;
  /** Heading of the open section. Defaults to the step label. It takes focus when the step changes. */
  title?: ReactNode;
  /** One line under the heading. */
  description?: ReactNode;
  /** Slot between the heading and the form, e.g. a `LedaNote`. */
  intro?: ReactNode;
  /** The form. Consumer content. */
  children?: ReactNode;
  /** Primary button label: "Add and continue" (step 1), "Save and continue" (default), "Finish" (last). */
  continueLabel?: string;
  continueLoading?: boolean;
  continueDisabled?: boolean;
  /** Marks every footer button `aria-disabled` (still focusable, clicks ignored) while a save runs (the primary shows the spinner through `continueLoading`). */
  busy?: boolean;
  /** Save and go to the next step. */
  onContinue?: () => void;
  /** Mark the step skipped and go on. Not offered on a `required` step. */
  onSkip?: () => void;
  /** Go to the previous step without changing any status. Hidden on the first step. */
  onBack?: () => void;
  /** Leave setup. Drafts are the caller's to keep. Hidden without a handler. */
  onFinishLater?: () => void;
  /** Overrides the progress readout (default "2 of 5 steps done, 1 skipped"). */
  progressLabel?: string;
  /** Accessible name of the step list (default "Setup steps"). */
  listLabel?: string;
  /** Applied to the outer box. The layout is fixed and cannot be overridden. */
  className?: string;
  /**
   * `false` leaves the step list out (render a `StepList` yourself, e.g. in a page's place column). The section and footer then
   * fill the width. Default `true`.
   */
  list?: boolean;
  /** With `list={false}`: the element holding your `StepList`, so a step chosen there still moves focus to the new heading. */
  stepListRef?: RefObject<Element | null>;
}

export interface StepListProps {
  steps: StepperStep[];
  /** Id of the open step. */
  current: string;
  /** A step was chosen (never called for a locked step or the current one). */
  onStepChange: (id: string) => void;
  /** Overrides the progress readout (default "2 of 5 steps done, 1 skipped"). */
  progressLabel?: string;
  /** Accessible name of the step list (default "Setup steps"). */
  listLabel?: string;
  /**
   * `list` (default): every step in a column, with the progress bar. `header`: phone, one line "Step 2 of 5 · System" that opens
   * the same list (same `aria-current`, locked and skipped states) on press.
   */
  variant?: 'list' | 'header';
  className?: string;
}

export interface StepFooterProps {
  /** Primary button label: "Add and continue" (step 1), "Save and continue" (default), "Finish" (last). */
  continueLabel?: string;
  continueLoading?: boolean;
  continueDisabled?: boolean;
  /** Marks every button disabled while a save runs (the primary shows the spinner through `continueLoading`). */
  busy?: boolean;
  onContinue?: () => void;
  /** Not offered without a handler, or when `required`. */
  onSkip?: () => void;
  /** Hidden without a handler, or when `first`. */
  onBack?: () => void;
  /** Hidden without a handler. */
  onFinishLater?: () => void;
  /** The open step is the first one (no Back). */
  first?: boolean;
  /** The open step is required (no Skip for now). */
  required?: boolean;
  className?: string;
}

const word: Record<StepperStatus, string> = { todo: 'Not started', done: 'Done', skipped: 'Skipped' };

function StepIcon({ status, locked, current, n }: { status: StepperStatus; locked: boolean; current: boolean; n: number }) {
  if (locked) return <Lock size={16} weight="bold" aria-hidden className="shrink-0 text-muted" />;
  if (status === 'done') return <CheckCircle size={18} weight="fill" aria-hidden className="shrink-0 text-ok-ink" />;
  if (status === 'skipped') return <CircleDashed size={18} weight="bold" aria-hidden className="shrink-0 text-muted" />;
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-[18px] shrink-0 place-items-center rounded-full border text-[11px] font-semibold tabular-nums',
        current ? 'border-accent bg-accent text-accent-ink' : 'border-control text-muted',
      )}
    >
      {n}
    </span>
  );
}

function summarize(steps: StepperStep[], progressLabel?: string) {
  const done = steps.filter((s) => s.status === 'done').length;
  const skipped = steps.filter((s) => s.status === 'skipped').length;
  return { done, readout: progressLabel ?? `${done} of ${steps.length} steps done${skipped ? `, ${skipped} skipped` : ''}` };
}

/**
 * The step list on its own (C21): an `<ol>` of steps with the progress bar. Put it in a page's place column and pass
 * `OnboardingStepper` `list={false}`, or let `OnboardingStepper` render it. Locked steps are `aria-disabled`, out of the Tab order
 * (`tabIndex=-1`), described by their reason; pressing one announces the reason. `variant="header"` is the phone form.
 * Inside an `OnboardingStepper` below 720px the list becomes chips (container query); on its own it stays a column.
 */
export const StepList = forwardRef<HTMLDivElement, StepListProps>(function StepList(
  { steps, current, onStepChange, progressLabel, listLabel = 'Setup steps', variant = 'list', className },
  ref,
) {
  const uid = useId();
  const listRef = useRef<HTMLOListElement>(null);
  const prevDone = useRef<number | null>(null);
  const [say, setSay] = useState('');
  const [open, setOpen] = useState(false);
  const frame = useRef(0);
  // Clear, then set on the next frame: the same text twice still changes the region, so it is read again.
  const announce = (text: string) => {
    setSay('');
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setSay(text));
  };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const index = Math.max(0, steps.findIndex((s) => s.id === current));
  const { done, readout } = summarize(steps, progressLabel);
  const header = variant === 'header';

  // Chips scroll sideways: keep the open one in view (horizontal only, so the sheet does not jump).
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[aria-current="step"]');
    const list = listRef.current;
    if (el && list && list.scrollWidth > list.clientWidth) {
      const a = el.getBoundingClientRect();
      const l = list.getBoundingClientRect();
      const wider = a.width >= l.width;
      list.scrollLeft = Math.max(0, list.scrollLeft + a.left - l.left - (wider ? 0 : (l.width - a.width) / 2));
    }
  }, [current]);

  // The live region starts empty and speaks only the progress change; the heading focus announces the new step itself.
  useEffect(() => {
    if (prevDone.current !== null && prevDone.current !== done) announce(`${done} of ${steps.length} steps done.`);
    prevDone.current = done;
  }, [done, steps.length]);

  const choose = (s: StepperStep) => {
    if (s.locked) {
      announce(`${s.label} is locked.${s.reason ? ` ${s.reason}` : ''}`);
      return;
    }
    if (header) setOpen(false);
    if (s.id !== current) onStepChange(s.id);
  };

  return (
    <div ref={ref} className={cn(className, 'flex min-w-0 flex-col gap-4 @max-[719.98px]/stepper:gap-3')}>
      {header && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          onClick={() => setOpen((o) => !o)}
          className={cn('flex min-h-11 w-full items-center justify-between gap-2 rounded-control border border-control bg-surface px-3 text-left text-ui text-text', focusRing)}
        >
          <span className="min-w-0 [overflow-wrap:anywhere]"><span className="font-semibold">Step {index + 1} of {steps.length}</span>{steps[index] ? ` · ${steps[index].label}` : ''}</span>
          <CaretDown aria-hidden size={16} weight="bold" className={cn('shrink-0 text-muted transition-transform duration-hover', open && 'rotate-180')} />
        </button>
      )}
      <ol
        ref={listRef}
        id={`${uid}-list`}
        aria-label={listLabel}
        className={cn(header && !open ? 'hidden' : 'flex', 'm-0 list-none flex-col gap-1 p-0 @max-[719.98px]/stepper:flex-row @max-[719.98px]/stepper:gap-2 @max-[719.98px]/stepper:overflow-x-auto @max-[719.98px]/stepper:px-1 @max-[719.98px]/stepper:py-1')}
      >
        {steps.map((s, i) => {
          const status = s.status ?? 'todo';
          const isCurrent = s.id === current;
          const reasonId = s.locked && s.reason ? `${uid}-r${i}` : undefined;
          return (
            <li key={s.id} className="relative min-w-0 @max-[719.98px]/stepper:max-w-[min(16rem,80cqw)] @max-[719.98px]/stepper:shrink-0">
              <button
                type="button"
                onClick={() => choose(s)}
                tabIndex={s.locked ? -1 : undefined}
                aria-current={isCurrent ? 'step' : undefined}
                aria-disabled={s.locked || undefined}
                aria-describedby={reasonId}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-control border px-2.5 py-2 text-left text-ui transition-colors duration-hover',
                  '@max-[719.98px]/stepper:min-h-11 @max-[719.98px]/stepper:w-auto @max-[719.98px]/stepper:items-center @max-[719.98px]/stepper:rounded-full @max-[719.98px]/stepper:px-3 @max-[719.98px]/stepper:py-1.5',
                  focusRing,
                  status === 'skipped' && !isCurrent ? 'border-dashed border-control' : 'border-transparent',
                  isCurrent ? 'border-solid border-control bg-raised font-semibold text-text' : 'text-text',
                  s.locked ? 'cursor-not-allowed text-muted' : !isCurrent && 'hover:bg-raised',
                )}
              >
                <span className="mt-px @max-[719.98px]/stepper:mt-0"><StepIcon status={status} locked={!!s.locked} current={isCurrent} n={i + 1} /></span>
                <span className="flex min-w-0 flex-col @max-[719.98px]/stepper:flex-row @max-[719.98px]/stepper:items-center @max-[719.98px]/stepper:gap-1.5">
                  <span className="[overflow-wrap:anywhere]">{s.label}</span>
                  <span className={cn('text-small font-normal text-muted', '@max-[719.98px]/stepper:sr-only')}>
                    {s.locked ? 'Locked' : isCurrent ? 'In progress' : word[status]}
                  </span>
                  {s.locked && s.reason && (
                    <span id={reasonId} className="text-small font-normal text-muted [overflow-wrap:anywhere] @max-[719.98px]/stepper:sr-only">{s.reason}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <ProgressBar layout="full" tone="accent" value={done} max={steps.length} label={readout} className="@max-[719.98px]/stepper:px-1" />
      <span role="status" aria-live="polite" className="sr-only">{say}</span>
    </div>
  );
});

/**
 * The step footer on its own (C21): Back, Finish later, Skip for now and the primary button, in a group named "Step actions".
 * It sticks to the foot of the scrolling sheet.
 */
export const StepFooter = forwardRef<HTMLDivElement, StepFooterProps>(function StepFooter(
  { continueLabel = 'Save and continue', continueLoading, continueDisabled, busy, onContinue, onSkip, onBack, onFinishLater, first, required, className },
  ref,
) {
  const skippable = !!onSkip && !required;
  return (
    <div
      ref={ref}
      role="group"
      aria-label="Step actions"
      className={cn(className, 'sticky bottom-0 z-10 mt-6 flex flex-wrap items-center gap-2 border-t border-border bg-surface py-3 @max-[719.98px]/stepper:flex-col @max-[719.98px]/stepper:items-stretch @max-[719.98px]/stepper:gap-1 @max-[719.98px]/stepper:py-2')}
    >
      {((!first && onBack) || onFinishLater) && (
        <div className="flex items-center gap-2 @max-[719.98px]/stepper:gap-1">
          {!first && onBack && <Button variant="text" actionBar keepFocus disabled={busy} onClick={onBack}>Back</Button>}
          {onFinishLater && <Button variant="text" actionBar keepFocus disabled={busy} onClick={onFinishLater}>Finish later</Button>}
        </div>
      )}
      <div className="ml-auto flex items-center gap-2 @max-[719.98px]/stepper:ml-0 @max-[719.98px]/stepper:[&>*]:flex-1">
        {skippable && <Button variant="secondary" actionBar keepFocus disabled={busy} onClick={onSkip}>Skip for now</Button>}
        <Button actionBar keepFocus loading={continueLoading} disabled={busy || continueDisabled} onClick={onContinue}>
          {continueLabel}
        </Button>
      </div>
    </div>
  );
});

/**
 * Onboarding stepper (C21): a layout and state component for guided setup. Left (desktop): the `StepList` with a
 * progress bar; right: the open section (heading, optional intro, your form) and a sticky `StepFooter`. Below 720px (719px and under) of its own width
 * the list becomes a row of chips (scrolls sideways) above the section. With `list={false}` the list is yours to place (a page's place column).
 * Controlled: pass `current` and handle `onStepChange`; read and write `?id=…&setup=N` yourself.
 */
export const OnboardingStepper = forwardRef<HTMLDivElement, OnboardingStepperProps>(function OnboardingStepper(
  {
    steps, current, onStepChange, title, description, intro, children,
    continueLabel, continueLoading, continueDisabled, busy,
    onContinue, onSkip, onBack, onFinishLater, progressLabel, listLabel, className, list = true, stepListRef,
  },
  ref,
) {
  const uid = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const listBoxRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const prevCurrent = useRef(current);

  const index = Math.max(0, steps.findIndex((s) => s.id === current));
  const step = steps[index];

  // Focus the section heading when the step changes (not on first render), but only if focus was lost or the user
  // triggered the change from the step list or footer. The form is inside the stepper yet is NOT counted
  // (the user may be typing there while a save runs), so the containers are the list and the footer, then none
  // (body, removed or disabled control). A pressed Continue that stays enabled is inside the footer, so it counts.
  useLayoutEffect(() => {
    if (prevCurrent.current === current) return;
    prevCurrent.current = current;
    const h = headingRef.current;
    focusIfLost(listBoxRef.current ?? stepListRef?.current ?? null, h) || focusIfLost(footRef.current, h) || focusIfLost(null, h);
  }, [current, stepListRef]);

  return (
    <div ref={ref} className={cn(className, '@container/stepper w-full min-w-0')}>
      <div className={cn('grid w-full min-w-0 items-start gap-x-8', list ? 'grid-cols-[14rem_minmax(0,1fr)] @max-[719.98px]/stepper:grid-cols-1 @max-[719.98px]/stepper:gap-y-4' : 'grid-cols-1')}>
        {list && (
          <StepList
            ref={listBoxRef}
            steps={steps}
            current={current}
            onStepChange={onStepChange}
            progressLabel={progressLabel}
            listLabel={listLabel}
            className="sticky top-0 z-10 bg-surface py-1"
          />
        )}

        <section aria-labelledby={`${uid}-h`} className="flex min-w-0 flex-col">
          <p className="m-0 text-small text-muted">Step {index + 1} of {steps.length}</p>
          <h2 id={`${uid}-h`} ref={headingRef} tabIndex={-1} className="m-0 text-title font-semibold text-text outline-0 [overflow-wrap:anywhere]">
            {title ?? step?.label}
          </h2>
          {description && <p className="m-0 mt-1 text-ui text-muted">{description}</p>}
          {intro && <div className="mt-4">{intro}</div>}
          <div className="mt-4 min-w-0">{children}</div>

          <StepFooter
            ref={footRef}
            first={index === 0}
            required={step?.required}
            continueLabel={continueLabel}
            continueLoading={continueLoading}
            continueDisabled={continueDisabled}
            busy={busy}
            onContinue={onContinue}
            onSkip={onSkip}
            onBack={onBack}
            onFinishLater={onFinishLater}
          />
        </section>
      </div>
    </div>
  );
});
