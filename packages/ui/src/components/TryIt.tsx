import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { CheckCircle, Prohibit, WarningCircle } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { focusIfLost } from '../utils/focusIfLost';
import { Button } from './Button';
import { LedaMark } from './Leda';
import { Modal } from './Modal';
import { Select, type SelectOption } from './Select';

/**
 * Try it tester (RDY-290, handover C30). A 720 x 640 panel modal (C13) with the Leda mark in the header well:
 * pick who the question is "About", pick a customer question, and see what customers' Leda would answer
 * (or refuse) right now, with one line saying why.
 */

export interface TryItAbout {
  value: string;
  /** "Any business", "The company" or a platform name. */
  label: string;
  /** Platform logo for the list and the button. */
  icon?: ReactNode;
}

export interface TryItQuestion {
  value: string;
  /** The customer's words. Long questions wrap inside the picker and the list. */
  label: string;
  /** `TryItAbout` values this question belongs to. Omit for every "About". */
  about?: string[];
}

export interface TryItAnswer {
  /** Leda's reply, or her refusal. Plain text, so it can be announced. */
  answer: string;
  /** The reason line: "Used the topic “Services and prices”, from Auto Works data." / "… is off" / "staff only" / "This is a blocked question…" / "request off". */
  reason: string;
  /** `ok` = Leda answered (check icon). `no` = she declined (prohibit icon). */
  tone: 'ok' | 'no';
}

export interface TryItProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  abouts: TryItAbout[];
  /** Selected "About" (controlled). Falls back to the first option. */
  about?: string;
  onAboutChange?: (value: string) => void;
  /** Fixed to one value (a platform's own page): shown as text, not a picker. */
  aboutFixed?: boolean;
  questions: TryItQuestion[];
  /** Selected question (controlled). Falls back to the first one that belongs to the current "About". */
  question?: string;
  onQuestionChange?: (value: string) => void;
  /**
   * Gets Leda's answer for the switches as they are now. Called on open and whenever "About" or the question
   * changes (and on Try again). May be async; a rejection shows the error line with Try again.
   */
  ask: (about: string, question: string) => TryItAnswer | Promise<TryItAnswer>;
  /** Minimum "Thinking…" time in ms. Default 900. */
  thinkingMs?: number;
  title?: string;
  description?: string;
  /** Runs when the modal has closed (see `Modal`); `preventDefault()` to place focus yourself. */
  onCloseAutoFocus?: (event: Event) => void;
}

type Run =
  | { kind: 'idle' }
  | { kind: 'thinking'; prev: Run }
  | { kind: 'done'; result: TryItAnswer; question: string }
  | { kind: 'error' };

const label = 'text-small font-medium text-muted';

export function TryIt({
  open,
  onOpenChange,
  abouts,
  about: aboutProp,
  onAboutChange,
  aboutFixed = false,
  questions,
  question: questionProp,
  onQuestionChange,
  ask,
  thinkingMs = 900,
  title = 'Try it',
  description = 'See what customers’ Leda would say right now.',
  onCloseAutoFocus,
}: TryItProps) {
  const uid = useId();
  const [aboutInner, setAboutInner] = useState(aboutProp ?? abouts[0]?.value ?? '');
  const [questionInner, setQuestionInner] = useState(questionProp ?? '');
  const about = aboutProp ?? aboutInner;
  const aboutItem = abouts.find((a) => a.value === about) ?? abouts[0];
  const aboutValue = aboutItem?.value ?? '';

  const visible = useMemo(() => questions.filter((q) => !q.about || q.about.includes(aboutValue)), [questions, aboutValue]);
  const wanted = questionProp ?? questionInner;
  const question = visible.find((q) => q.value === wanted)?.value ?? visible[0]?.value ?? '';

  const [run, setRun] = useState<Run>({ kind: 'idle' });
  const [attempt, setAttempt] = useState(0);
  const questionRef = useRef<HTMLButtonElement>(null);
  const replyRef = useRef<HTMLDivElement>(null);
  const askRef = useRef(ask);
  askRef.current = ask;

  // Ask on open and whenever the subject changes. The reply is laid out at once and hidden under "Thinking…".
  useEffect(() => {
    if (!open || !question) {
      setRun({ kind: 'idle' });
      return;
    }
    let live = true;
    setRun((prev) => ({ kind: 'thinking', prev: prev.kind === 'thinking' ? prev.prev : prev }));
    const wait = new Promise<void>((r) => setTimeout(r, thinkingMs));
    const answer = new Promise<TryItAnswer>((resolve) => resolve(askRef.current(aboutValue, question)))
      .then((result) => ({ result }), () => ({ result: null }));
    Promise.all([wait, answer]).then(([, { result }]) => {
      if (!live) return;
      setRun(result ? { kind: 'done', result, question } : { kind: 'error' });
    });
    return () => {
      live = false;
    };
  }, [open, aboutValue, question, attempt, thinkingMs]);

  // The question button is where the user is working. If a run ends and focus fell on nothing, put it back there.
  useLayoutEffect(() => {
    if (run.kind !== 'done' && run.kind !== 'error') return;
    // When the focused control disappears, the modal's focus trap parks focus on the dialog itself: that is lost too.
    const dialog = replyRef.current?.closest('[role="dialog"]');
    if (dialog && document.activeElement === dialog) questionRef.current?.focus({ preventScroll: true });
    else focusIfLost(replyRef.current, questionRef.current, { preventScroll: true });
  }, [run.kind]);

  const thinking = run.kind === 'thinking';
  const shown = run.kind === 'thinking' ? run.prev : run;
  const spoken =
    run.kind === 'thinking' ? 'Thinking…' : run.kind === 'done' ? `Leda says: ${run.result.answer} ${run.result.reason}` : run.kind === 'error' ? 'Couldn’t get Leda’s answer.' : '';

  const aboutOptions: SelectOption[] = abouts.map((a) => ({ value: a.value, label: a.label, icon: a.icon }));
  const questionOptions: SelectOption[] = visible.map((q) => ({ value: q.value, label: q.label }));

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="panel"
      title={title}
      description={description}
      iconNode={<LedaMark size={18} decorative effect="aurora" active={thinking} />}
      initialFocus={questionRef as RefObject<HTMLElement | null>}
      onCloseAutoFocus={onCloseAutoFocus}
    >
      <div className="flex flex-col gap-field-y">
        <div className="grid grid-cols-1 gap-field-y min-[641px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] min-[641px]:gap-x-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span id={`${uid}-about`} className={label}>About</span>
            {aboutFixed ? (
              <p aria-labelledby={`${uid}-about`} className="flex min-h-[var(--ctl-dropdown)] items-center gap-2 text-body text-text max-sm:min-h-11">
                {aboutItem?.icon ? <span className="inline-flex shrink-0 items-center">{aboutItem.icon}</span> : null}
                <span className="min-w-0 [overflow-wrap:anywhere]">{aboutItem?.label}</span>
              </p>
            ) : (
              <Select
                aria-labelledby={`${uid}-about`}
                options={aboutOptions}
                value={aboutValue}
                wrap
                onValueChange={(v) => {
                  setAboutInner(v);
                  onAboutChange?.(v);
                }}
              />
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span id={`${uid}-q`} className={label}>A customer asks</span>
            <Select
              ref={questionRef}
              aria-labelledby={`${uid}-q`}
              options={questionOptions}
              value={question}
              wrap
              placeholder="No questions yet"
              disabled={questionOptions.length === 0}
              onValueChange={(v) => {
                setQuestionInner(v);
                onQuestionChange?.(v);
              }}
            />
          </div>
        </div>

        {/* The reply slot: the final reply is laid out under "Thinking…", so nothing moves when it arrives. */}
        <div ref={replyRef} className="grid min-h-[168px] rounded-card border border-transparent bg-raised px-3 py-3" aria-busy={thinking || undefined}>
          <div className={cn('col-start-1 row-start-1 min-w-0', thinking && shown.kind !== 'error' && 'invisible')}>
            {shown.kind === 'done' && (
              <>
                <p className={label}>Customer</p>
                <p className="text-body text-text [overflow-wrap:anywhere]">{questions.find((q) => q.value === shown.question)?.label ?? ''}</p>
                <div className="mt-3 flex items-start gap-2">
                  <span aria-hidden className="mt-0.5 shrink-0">
                    <LedaMark size={16} tile decorative effect="aurora" active={thinking} />
                  </span>
                  <p className="min-w-0 text-body text-text [overflow-wrap:anywhere]">{shown.result.answer}</p>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-small text-muted">
                  {shown.result.tone === 'ok' ? (
                    <CheckCircle aria-hidden size={14} weight="fill" className="mt-0.5 shrink-0 text-ok-dot" />
                  ) : (
                    <Prohibit aria-hidden size={14} weight="bold" className="mt-0.5 shrink-0 text-bad-dot" />
                  )}
                  <span className="min-w-0 [overflow-wrap:anywhere]">{shown.result.reason}</span>
                </p>
              </>
            )}
            {shown.kind === 'idle' && <p className="text-body text-muted">Choose a question to see what Leda says.</p>}
            {shown.kind === 'error' && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="flex min-w-0 flex-1 basis-48 items-start gap-2 text-body text-text">
                  <WarningCircle aria-hidden size={16} className="mt-0.5 shrink-0 text-bad-dot" />
                  <span>{thinking ? 'Thinking…' : 'Couldn’t get Leda’s answer.'}</span>
                </p>
                <Button
                  variant="secondary"
                  aria-disabled={thinking || undefined}
                  aria-busy={thinking || undefined}
                  onClick={() => {
                    if (!thinking) setAttempt((n) => n + 1);
                  }}
                >
                  Try again
                </Button>
              </div>
            )}
          </div>
          {thinking && shown.kind !== 'error' && (
            <p aria-hidden className="col-start-1 row-start-1 flex items-start gap-2 text-body text-muted">
              <span className="mt-0.5 inline-flex shrink-0">
                <LedaMark size={16} tile decorative effect="aurora" active />
              </span>
              Thinking…
            </p>
          )}
        </div>
        <p role="status" aria-live="polite" className="sr-only">{spoken}</p>
      </div>
    </Modal>
  );
}
