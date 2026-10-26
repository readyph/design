import { createElement, useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, ChatCircle, Database, FileX, Lock, LockSimple, PencilSimpleLine, Trash, WarningCircle } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { focusIfLost } from '../utils/focusIfLost';
import { base as buttonBase, variants as buttonVariants } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import { ErrorBlock } from './ErrorBlock';
import { Select, type SelectOption } from './Select';
import { Skeleton } from './Skeleton';
import { Switch } from './Switch';

export interface TopicDocumentTopic {
  id: string;
  title: string;
  /** The topic's paragraph. Line breaks are kept. */
  body: string;
  /** Source label: "From Auto Works data", "Custom". */
  source: string;
  /** `custom` topics are written here and editable in place; `data` topics are read only. Default `data`. */
  sourceKind?: 'data' | 'custom';
  /** Customers' Leda may use it. */
  on: boolean;
  /** Off by default (sensitive): shows a lock line under the title. */
  locked?: boolean;
  /** Why it is locked, e.g. "Customers would see what you pay." */
  lockNote?: string;
  /** The sample question first, then up to two more. Only three show. */
  questions?: string[];
  /** "Last changed Mon 19 Oct, when Auto Works data changed". */
  lastChanged?: ReactNode;
}

/** What `onSave` / `onDelete` may return to refuse the change. `field` moves focus to that field. */
export interface TopicDocumentError {
  error: string;
  field?: 'title' | 'body';
}

export interface TopicDocumentDraft {
  title: string;
  body: string;
  /** The chosen folder, only for a new topic. */
  folder?: string;
}

export interface TopicDocumentProps {
  /** The topic. Omit for a new topic (`isNew`) or while `loading` / `missing`. */
  topic?: TopicDocumentTopic;
  /** A blank page: title and body empty, a folder picker, "Add topic". */
  isNew?: boolean;
  /** Folder options for a new topic (the page puts the open folder first). */
  folders?: SelectOption[];
  folder?: string;
  onFolderChange?: (folder: string) => void;
  /** No permission to change: switch disabled, custom topics read only. */
  readOnly?: boolean;
  /** Replaces the read-only line of a custom topic. */
  readOnlyNote?: ReactNode;
  /** Data topics: what it comes from, "Auto Works" or "company". */
  origin?: string;
  /** Data topics: where to edit it (a platform, its System tab, or Settings for company topics). */
  edit?: { href: string; label: string; how?: string };
  /** The memory room, in characters: `max` for the company and `others` used by every other entry. */
  room?: { max: number; others: number };
  /** Save (button or the save shortcut). Return a `TopicDocumentError` to refuse, or throw. May be async. */
  onSave?: (draft: TopicDocumentDraft) => void | TopicDocumentError | Promise<void | TopicDocumentError>;
  /** Discard (existing topic) or Cancel (new topic). The text goes back to what was saved. */
  onDiscard?: () => void;
  /** After the user confirms Delete. Return a `TopicDocumentError` to refuse. The page then goes back to the library and shows `toast.undo`. */
  onDelete?: () => void | TopicDocumentError | Promise<void | TopicDocumentError>;
  /** The switch saves at once: the page saves it, shows `toast.undo`, and passes the new `topic.on`. */
  onToggle?: (next: boolean) => void;
  /** Opens Try it on this question. */
  onTry?: (question: string) => void;
  /** Tells the page whether there is unsaved text (drive `useUnsavedGuard` and the leave prompt). */
  onDirtyChange?: (dirty: boolean) => void;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  /** The topic was deleted or the link is old. */
  missing?: boolean;
  /** "Back to Memory" in the missing state. */
  onBack?: () => void;
  /** Level of the title. Default 1; the questions heading is one lower. */
  headingLevel?: 1 | 2;
  className?: string;
}

const TITLE_MAX = 100;
const BODY_MAX = 8000;
const fmt = (n: number) => n.toLocaleString('en-US');
const same = (a: string, b: string) => a === b;

const field =
  'block w-full rounded-control border border-transparent bg-transparent text-text placeholder:text-faint hover:border-control focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-accent aria-[invalid=true]:border-bad';
const cell = '[grid-area:1/1/2/2]';

/** A button that stays focusable while it works: `aria-disabled` (never `disabled`) plus `aria-busy`. */
function BarButton({ variant, inert: dead, busy, onClick, children, buttonRef, className }: {
  variant: 'primary' | 'text';
  inert?: boolean;
  busy?: boolean;
  onClick: () => void;
  children: ReactNode;
  buttonRef?: React.Ref<HTMLButtonElement>;
  className?: string;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-disabled={dead || busy || undefined}
      aria-busy={busy || undefined}
      onClick={() => {
        if (!dead && !busy) onClick();
      }}
      className={cn(
        buttonBase,
        buttonVariants[variant],
        'aria-disabled:cursor-not-allowed aria-disabled:opacity-70 max-[640px]:h-[var(--ctl-touch)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        variant === 'primary' && 'aria-disabled:hover:bg-accent',
        variant === 'text' && 'aria-disabled:hover:bg-transparent',
        className,
      )}
    >
      {busy && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
        </span>
      )}
      <span className={cn('inline-flex items-center justify-center gap-2', busy && 'opacity-0')}>{children}</span>
    </button>
  );
}

/**
 * Warns before the browser leaves the page (reload, close tab, address bar) while `dirty`.
 * In-app leaving (back, folder, Esc, browser Back) is the page's job: ask with `UnsavedLeaveDialog`.
 */
export function useUnsavedGuard(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}

/** "Leave without saving?" Focus starts on Keep editing. Esc and the backdrop keep editing. */
export function UnsavedLeaveDialog({ open, title, onStay, onLeave }: { open: boolean; title?: ReactNode; onStay: () => void; onLeave: () => void }) {
  return (
    <ConfirmDialog
      open={open}
      title="Leave without saving?"
      name={title}
      context="Unsaved changes"
      icon={PencilSimpleLine}
      description="Your changes will be lost."
      confirmLabel="Leave"
      cancelLabel="Keep editing"
      tone="danger"
      onCancel={onStay}
      onConfirm={onLeave}
    />
  );
}

/**
 * Topic document page (C28): a topic as a page you read or write. Source line, title (24/32), switch, the
 * paragraph (16/27) in a 680px measure, "Questions this helps answer" with a link into Try it, and "last changed".
 * Custom topics are in-place document fields with an "Unsaved changes" bar (characters left, Delete, Discard,
 * Save; the save shortcut works while editing). Data topics are read only with a link to where to edit them.
 * Emit-only apart from the draft text: the page saves, checks the title and memory room, and navigates.
 * Save and Discard use `aria-disabled` (not `disabled`) so keyboard focus is never lost while saving.
 */
export function TopicDocument({
  topic,
  isNew = false,
  folders,
  folder,
  onFolderChange,
  readOnly = false,
  readOnlyNote,
  origin,
  edit,
  room,
  onSave,
  onDiscard,
  onDelete,
  onToggle,
  onTry,
  onDirtyChange,
  loading = false,
  error = false,
  onRetry,
  missing = false,
  onBack,
  headingLevel = 1,
  className,
}: TopicDocumentProps) {
  const uid = useId();
  const ids = { title: `${uid}-t`, body: `${uid}-b`, err: `${uid}-e`, heading: `${uid}-h`, qs: `${uid}-q`, folder: `${uid}-f` };
  const rootRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const editable = !readOnly && (isNew || topic?.sourceKind === 'custom');
  const savedTitle = isNew ? '' : topic?.title ?? '';
  const savedBody = isNew ? '' : topic?.body ?? '';

  const [baseline, setBaseline] = useState({ title: savedTitle, body: savedBody });
  const [title, setTitle] = useState(savedTitle);
  const [body, setBody] = useState(savedBody);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [err, setErr] = useState<TopicDocumentError | null>(null);
  const [said, setSaid] = useState('');

  // A different topic, or a saved value that changed underneath a clean draft, replaces the draft.
  const key = `${topic?.id ?? 'new'}|${isNew}`;
  const lastKey = useRef(key);
  useEffect(() => {
    if (lastKey.current !== key) {
      lastKey.current = key;
      setBaseline({ title: savedTitle, body: savedBody });
      setTitle(savedTitle);
      setBody(savedBody);
      setErr(null);
      setSaid('');
      return;
    }
    setBaseline((b) => {
      if (same(b.title, savedTitle) && same(b.body, savedBody)) return b;
      // Clean draft follows the saved text; a dirty one keeps the user's words.
      if (same(title, b.title) && same(body, b.body)) {
        setTitle(savedTitle);
        setBody(savedBody);
      }
      return { title: savedTitle, body: savedBody };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, savedTitle, savedBody]);

  const dirty = editable && (isNew ? !!(title.trim() || body.trim()) : !same(title, baseline.title) || !same(body, baseline.body));
  const lastDirty = useRef(false);
  useEffect(() => {
    if (lastDirty.current === dirty) return;
    lastDirty.current = dirty;
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const left = room ? room.max - room.others - title.length - body.length : null;

  const fail = useCallback((e: TopicDocumentError) => {
    if (!mounted.current) return;
    setErr(e);
    setSaid(e.error);
    const target = e.field === 'body' ? bodyRef.current : e.field === 'title' ? titleRef.current : null;
    // The user pressed Save and may have gone elsewhere meanwhile: only pull focus if it was still on the bar or lost.
    if (target) focusIfLost(barRef.current, target);
  }, []);

  const save = useCallback(async () => {
    if (!editable || saving || !onSave) return;
    const t = title.trim();
    if (!t) return fail({ error: 'Write a title.', field: 'title' });
    if (!body.trim()) return fail({ error: 'Write the paragraph.', field: 'body' });
    if (left !== null && left < 0) return fail({ error: 'The memory is full. Shorten or delete entries first.', field: 'body' });
    setErr(null);
    setSaving(true);
    const draft = { title: t, body, ...(isNew ? { folder } : {}) };
    try {
      const result = await onSave(draft);
      if (!mounted.current) return;
      if (result && typeof result === 'object' && 'error' in result) {
        fail(result);
      } else {
        setBaseline({ title: t, body });
        setTitle((cur) => (cur === title ? t : cur));
        setSaid(isNew ? 'Topic added.' : 'Saved.');
      }
    } catch {
      fail({ error: 'Couldn’t save. Try again.' });
    } finally {
      if (mounted.current) setSaving(false);
    }
  }, [editable, saving, onSave, title, body, left, isNew, folder, fail]);

  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    if (!editable) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.key.toLowerCase() !== 's') return;
      if (document.querySelector('[role="alertdialog"], [role="dialog"]')) return;
      e.preventDefault();
      if (dirty) void saveRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editable, dirty]);

  const discard = () => {
    if (!dirty || saving) return;
    setTitle(baseline.title);
    setBody(baseline.body);
    setErr(null);
    setSaid(isNew ? 'Cancelled.' : 'Changes discarded.');
    onDiscard?.();
    // The pressed button goes quiet: move focus to the document unless the page already moved it.
    focusIfLost(barRef.current, titleRef.current);
  };

  const confirmDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      const result = await onDelete();
      if (!mounted.current) return;
      setConfirmOpen(false);
      if (result && typeof result === 'object' && 'error' in result) fail(result);
    } catch {
      if (!mounted.current) return;
      setConfirmOpen(false);
      fail({ error: 'Couldn’t delete. Try again.' });
    } finally {
      if (mounted.current) setDeleting(false);
    }
  };

  const H = (level: number, props: Record<string, unknown>, children: ReactNode) => createElement(`h${level}`, props, children);

  if (loading) {
    return (
      <div aria-busy="true" className={cn('flex max-w-[var(--reading-measure)] flex-col gap-3', className)}>
        <span className="sr-only" role="status">Loading topic</span>
        <Skeleton variant="text" width={120} height={12} />
        <Skeleton height={32} className="w-3/5" />
        <Skeleton variant="text" lines={4} className="mt-3" />
      </div>
    );
  }
  if (error) return <ErrorBlock thing="topic" onRetry={onRetry} className={className} />;
  if (missing || (!topic && !isNew)) {
    return (
      <EmptyState
        align="start"
        icon={FileX}
        title="This topic is gone"
        description="It was deleted, or the link is old."
        headingLevel={headingLevel === 1 ? 2 : 3}
        action={
          onBack && (
            <button type="button" onClick={onBack} className={cn(buttonBase, buttonVariants.secondary, 'mt-2 max-[640px]:h-[var(--ctl-touch)]', 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent')}>
              Back to Memory
            </button>
          )
        }
        className={className}
      />
    );
  }

  const on = topic?.on ?? false;
  const shownTitle = editable ? title.trim() || (isNew ? 'New topic' : topic?.title ?? '') : topic?.title ?? '';
  const questions = (topic?.questions ?? []).filter((q, i, a) => q && a.indexOf(q) === i).slice(0, 3);
  const Kicker = isNew || topic?.sourceKind === 'custom' ? PencilSimpleLine : Database;
  const titleErr = err?.field === 'title';
  const bodyErr = err?.field === 'body';
  const describedBy = (bad: boolean) => (bad ? ids.err : undefined);

  const errorLine = err && (
    <p id={ids.err} role="alert" className="mt-1.5 flex items-start gap-1.5 text-ui text-bad">
      <WarningCircle aria-hidden size={14} weight="fill" className="mt-0.5 shrink-0" />
      <span>{err.error}</span>
    </p>
  );

  return (
    <article ref={rootRef} aria-labelledby={ids.heading} className={cn('max-w-[var(--reading-measure)] min-w-0', className)}>
      <p className="flex items-center gap-1.5 text-ui text-muted">
        <Kicker aria-hidden size={14} className="shrink-0" />
        <span>{isNew ? 'Custom · new topic' : topic?.source}</span>
      </p>

      {isNew && folders && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span id={ids.folder} className="text-ui text-muted">Folder</span>
          <Select size="sm" className="w-60 max-w-full" options={folders} value={folder} onValueChange={onFolderChange} aria-labelledby={ids.folder} />
        </div>
      )}

      <div className="mt-2 flex items-start gap-6 max-[640px]:flex-col max-[640px]:gap-3">
        <div className="min-w-0 flex-1 max-[640px]:w-full">
          {H(headingLevel, { id: ids.heading, className: editable ? 'sr-only' : 'break-words text-topic text-text' }, shownTitle)}
          {editable && (
            <>
              <label htmlFor={ids.title} className="sr-only">Title</label>
              <input
                ref={titleRef}
                id={ids.title}
                value={title}
                maxLength={TITLE_MAX}
                autoComplete="off"
                placeholder="A title, like “Senior citizen discount”"
                aria-invalid={titleErr || undefined}
                aria-describedby={describedBy(titleErr)}
                onChange={(e) => setTitle(e.target.value)}
                className={cn(field, 'h-10 -ml-[9px] w-[calc(100%+9px)] px-2 text-topic font-semibold placeholder:font-medium max-[640px]:h-[var(--ctl-touch)]')}
              />
            </>
          )}
        </div>
        {!isNew && topic && (
          <div className="shrink-0 max-w-60 pt-1.5 max-[640px]:max-w-none max-[640px]:pt-0">
            <Switch
              checked={on}
              disabled={readOnly}
              onCheckedChange={(next) => onToggle?.(next)}
              label={on ? 'Customers’ Leda can use this' : 'Off for customers'}
              description={on ? 'Saves as you switch it' : 'Leda won’t use it for customers'}
            />
          </div>
        )}
      </div>
      {errorLine}

      {topic?.locked && (
        <p className="mt-2.5 flex items-start gap-1.5 text-ui text-muted">
          <Lock aria-hidden size={12} weight="bold" className="mt-1 shrink-0" />
          <span>Off by default.{topic.lockNote ? ` ${topic.lockNote}` : ''}</span>
        </p>
      )}

      {editable ? (
        <div className="mt-[18px] -ml-[9px] grid min-h-[190px] w-[calc(100%+18px)]">
          <div aria-hidden className={cn(cell, 'invisible whitespace-pre-wrap break-words border border-transparent px-2 py-1.5 text-reading max-[640px]:leading-[26px]')}>
            {`${body}\n`}
          </div>
          <label htmlFor={ids.body} className="sr-only">What Leda should know</label>
          <textarea
            ref={bodyRef}
            id={ids.body}
            value={body}
            maxLength={BODY_MAX}
            placeholder="Write it as you would explain it to a customer, in full sentences. Leda answers from it in its own words."
            aria-invalid={bodyErr || undefined}
            aria-describedby={describedBy(bodyErr)}
            onChange={(e) => setBody(e.target.value)}
            className={cn(field, cell, 'h-full resize-none overflow-hidden px-2 py-1.5 text-reading max-[640px]:leading-[26px]')}
          />
        </div>
      ) : (
        <div className="mt-[18px] break-words text-reading text-text max-[640px]:leading-[26px]">
          <p className="whitespace-pre-line">{topic?.body}</p>
        </div>
      )}

      {editable ? (
        <div ref={barRef} className="mt-3.5 flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-rule pt-3 text-ui text-muted">
          {dirty ? (
            <span className="inline-flex items-center gap-1.5 text-warn">
              <PencilSimpleLine aria-hidden size={14} />
              Unsaved changes
            </span>
          ) : isNew ? (
            <span>Write a title and the paragraph</span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Check aria-hidden size={14} className="text-ok" />
              Saved
            </span>
          )}
          {left !== null && (
            <span className={cn(left < 0 && 'font-medium text-bad')}>
              {left < 0 ? `${fmt(-left)} characters over the memory room` : `${fmt(left)} characters left in memory`}
            </span>
          )}
          <span className="flex-1" />
          {!isNew && onDelete && (
            <BarButton buttonRef={deleteRef} variant="text" onClick={() => setConfirmOpen(true)}>
              <Trash aria-hidden size={14} className="text-bad" />
              Delete
            </BarButton>
          )}
          <BarButton variant="text" inert={!dirty} busy={false} onClick={discard}>{isNew ? 'Cancel' : 'Discard'}</BarButton>
          <BarButton variant="primary" inert={!dirty} busy={saving} onClick={() => void save()}>{isNew ? 'Add topic' : 'Save'}</BarButton>
        </div>
      ) : (
        <p className="mt-4 flex items-start gap-2 border-t border-rule pt-3 text-ui text-muted">
          {topic?.sourceKind === 'custom' ? <LockSimple aria-hidden size={14} className="mt-0.5 shrink-0" /> : <Database aria-hidden size={14} className="mt-0.5 shrink-0" />}
          {topic?.sourceKind === 'custom' ? (
            <span>{readOnlyNote ?? 'Written by your team. Only owners, admins and managers can change it.'}</span>
          ) : (
            <span>
              Comes from {origin} data
              {edit && (
                <>
                  {' · edit it in '}
                  <a href={edit.href} className="rounded-chip text-accent underline underline-offset-2 hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{edit.label}</a>
                  {edit.how && <span> ({edit.how})</span>}
                </>
              )}
            </span>
          )}
        </p>
      )}

      {questions.length > 0 && (
        <section aria-labelledby={ids.qs} className="mt-8">
          {H(headingLevel + 1, { id: ids.qs, className: 'text-ui font-semibold text-text' }, 'Questions this helps answer')}
          <ul className="mt-1.5">
            {questions.map((q) => (
              <li key={q} className="flex gap-2.5 border-t border-rule py-[9px] text-body first:border-t-0">
                <ChatCircle aria-hidden size={14} className="mt-[3px] shrink-0 text-muted" />
                <span className="min-w-0 break-words">“{q}”</span>
              </li>
            ))}
          </ul>
          {onTry && (
            <button
              type="button"
              onClick={() => onTry(questions[0])}
              className={cn(buttonBase, buttonVariants.text, 'mt-1.5 -ml-2 h-auto min-h-[var(--ctl-button)] whitespace-normal px-2 py-1.5 text-left max-[640px]:min-h-[var(--ctl-touch)]', 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent')}
            >
              <ArrowRight aria-hidden size={14} className="shrink-0" />
              <span>See what Leda says to “{questions[0]}”</span>
            </button>
          )}
        </section>
      )}

      {topic?.lastChanged && <p className="mt-7 text-small text-muted">{topic.lastChanged}</p>}

      <span className="sr-only" role="status" aria-live="polite">{said}</span>

      {editable && !isNew && onDelete && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={(o) => !deleting && setConfirmOpen(o)}
          title="Delete this topic?"
          name={topic?.title}
          context="Custom topic"
          description="Customers’ Leda stops using it. You can undo this for a few seconds."
          confirmLabel="Delete topic"
          tone="danger"
          loading={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </article>
  );
}
