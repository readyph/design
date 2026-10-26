import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Buildings, PencilSimple, Prohibit, Lock } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { Badge } from './Badge';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { ErrorBlock } from './ErrorBlock';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';
import { Select } from './Select';
import { List, ListCell, ListRow } from './List';
import { toast } from './toast/toastStore';

/** Where a blocked question applies: the company (every business) or one platform. */
export interface BlockedScope {
  /** Stable id. The scope whose id equals `everyScope` is the "Every business" one. */
  id: string;
  /** "Every business", "Auto Works Quezon City". */
  label: string;
  /** Leading icon or `PlatformLogo` in the "Blocked for" list. */
  icon?: ReactNode;
}

export interface BlockedQuestionItem {
  id: string;
  question: string;
  /** A `BlockedScope.id`. */
  scope: string;
}

export interface BlockQuestionInput {
  /** Trimmed, whitespace collapsed, surrounding quotes removed. */
  question: string;
  scope: string;
}

export interface BlockedQuestionsProps {
  /** Every blocked question, in the order to show. With `scope` set, the ones for other scopes are not listed. */
  items: BlockedQuestionItem[];
  /** The company ("Every business") first, then each platform. Drives the tags, the replies and the "Blocked for" list. */
  scopes: BlockedScope[];
  /** Id of the every-business scope. Default `company`. */
  everyScope?: string;
  /**
   * Fixed scope (the platform Leda & Memory tab): no "Blocked for" list, no tag on the rows, only this scope's
   * questions and reply, and a one-line note for the questions blocked for every business.
   */
  scope?: string;
  /** Leda's reply by scope id: the company's and one per platform. A scope without a reply shows none. */
  replies: Record<string, string>;
  /** Called with a valid, non-duplicate question. May return a promise; reject with an `Error` to show its message. */
  onBlock?: (input: BlockQuestionInput) => void | Promise<void>;
  /**
   * Called after the Remove confirmation with `{ undo: false }`, and again with `{ undo: true }` when the person
   * chooses Undo in the toast (put the same item back). May return a promise.
   */
  onRemove?: (item: BlockedQuestionItem, options: { undo: boolean }) => void | Promise<void>;
  /** "Try": open the Try-it tester (C30) on this question. Omit to hide the button. */
  onTry?: (item: BlockedQuestionItem) => void;
  /** Save an edited reply. May return a promise; reject with an `Error` to keep the editor open with its message. */
  onEditReply?: (scope: string, text: string) => void | Promise<void>;
  /** No adding, removing or editing. Try stays. */
  readOnly?: boolean;
  /** Line shown where the form would be, naming who can help: "Ask an owner, admin or manager." */
  readOnlyNote?: ReactNode;
  status?: 'ready' | 'loading' | 'error';
  onRetry?: () => void;
  /** First "Blocked for" value on the Memory tab. Default: the every-business scope. */
  defaultBlockScope?: string;
  /** Longest question. Default 160. */
  maxLength?: number;
  /** Longest reply. Default 400. */
  replyMaxLength?: number;
  /** Stop adding at this many questions (all scopes). Default 200. */
  maxItems?: number;
  /** The line under the heading. `false` hides it. */
  intro?: ReactNode | false;
  /** After the platform tab's every-business note: a link to Memory, e.g. `<a href="…">in Memory</a>`. */
  inheritedLink?: ReactNode;
  /** j / k / Enter over the rows. Default true; keep it on for one list per page, `false` on the others. */
  shortcuts?: boolean;
  /** Accessible name of the section. Default "Blocked questions". */
  'aria-label'?: string;
  /** Margin and width only: layout, columns and rules live on the parts. */
  className?: string;
}

/* ---- the one place that decides whether focus may move (swap for the shared helper when RDY-269 lands) ---- */
/**
 * Move focus to `target` only when the person's focus was actually lost: nothing focused, `body`, an element that
 * has since been removed, or `origin` (the control that started the action, which may be gone or disabled now).
 * If they have moved on to something else, even inside this component, leave it alone and return false so the
 * caller can announce instead. No timers.
 */
function focusIfLost(target: HTMLElement | null | undefined, origin?: Element | null): boolean {
  if (!target) return false;
  const a = document.activeElement;
  const lost = !a || a === document.body || a === document.documentElement || !a.isConnected || a === origin;
  if (lost) target.focus();
  return lost;
}

const WS = /\s+/g;
/** Case-insensitive, whitespace-trimmed, quote- and ending-punctuation-insensitive form used for the duplicate check. */
export function normalizeBlockedQuestion(q: string): string {
  return q
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[“”"'‘’]/g, '')
    .replace(WS, ' ')
    .trim()
    .replace(/[?.!\s]+$/, '');
}
function cleanQuestion(raw: string): string {
  return raw.replace(WS, ' ').trim().replace(/^["“]\s*/, '').replace(/\s*["”]$/, '').trim();
}

const field =
  'block w-full min-w-0 rounded-control border bg-surface px-3 text-body text-text placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-[readonly=true]:bg-raised';

/** j / k belong to the list; typing them in a form control (including the "Blocked for" list) must never move its cursor. */
function keepJK(e: KeyboardEvent<HTMLElement>) {
  if ((e.key === 'j' || e.key === 'k') && !e.metaKey && !e.ctrlKey && !e.altKey) e.stopPropagation();
}

function rowsOf(root: HTMLElement | null) {
  return root ? Array.from(root.querySelectorAll<HTMLElement>('[data-row-id]')) : [];
}
function controlOf(root: HTMLElement | null, id: string): HTMLElement | null {
  const row = rowsOf(root).find((r) => r.dataset.rowId === id);
  return row?.querySelector<HTMLElement>('[data-bq-focus]') ?? null;
}

type Pending =
  | { kind: 'removed'; item: BlockedQuestionItem; order: string[]; origin: Element | null }
  | { kind: 'restored'; item: BlockedQuestionItem; origin: Element | null };

/**
 * Blocked questions list (C29, new). The reply Leda gives (the company's and one per platform, each with an inline
 * "Edit reply"), the ruled rows (question, where it applies, Try, Remove with confirmation and Undo) and the form
 * that adds one (input + "Block question", plus "Blocked for" on Memory). One component for the platform Leda &
 * Memory tab (`scope`) and the Memory tab.
 *
 * Focus is never taken from the person: after any async result it moves only when it was lost (see `focusIfLost`);
 * otherwise the result is announced in the polite status region.
 */
export function BlockedQuestions({
  items,
  scopes,
  everyScope = 'company',
  scope,
  replies,
  onBlock,
  onRemove,
  onTry,
  onEditReply,
  readOnly = false,
  readOnlyNote,
  status = 'ready',
  onRetry,
  defaultBlockScope,
  maxLength = 160,
  replyMaxLength = 400,
  maxItems = 200,
  intro,
  inheritedLink,
  shortcuts = true,
  'aria-label': ariaLabel = 'Blocked questions',
  className,
}: BlockedQuestionsProps) {
  const uid = useId();
  const root = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blockBtn = useRef<HTMLButtonElement>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [blockScope, setBlockScope] = useState(defaultBlockScope ?? everyScope);
  const [say, setSay] = useState<{ n: number; text: string }>({ n: 0, text: '' });
  const announce = useCallback((t: string) => setSay((s) => ({ n: s.n + 1, text: t })), []);

  const fixed = scope != null;
  const byId = (id: string) => scopes.find((s) => s.id === id);
  const labelOf = (id: string) => byId(id)?.label ?? id;
  const isEvery = (id: string) => id === everyScope;
  const phrase = (id: string) => (isEvery(id) ? 'for every business' : `at ${labelOf(id)}`);
  const visible = fixed ? items.filter((i) => i.scope === scope) : items;
  const inherited = fixed && !isEvery(scope) ? items.filter((i) => isEvery(i.scope)) : [];
  const targetScope = fixed ? scope : blockScope;
  const replyScopes = (fixed ? [scope] : scopes.map((s) => s.id)).filter((id) => replies[id] !== undefined);
  const atLimit = items.length >= maxItems;
  const editable = !readOnly && status === 'ready';

  /* ---------- focus after the list changes (remove, undo) ---------- */
  const pending = useRef<Pending | null>(null);
  const [confirm, setConfirm] = useState<BlockedQuestionItem | null>(null);

  useEffect(() => {
    const p = pending.current;
    if (!p || confirm) return;
    const gone = !items.some((i) => i.id === p.item.id);
    if (p.kind === 'removed') {
      if (!gone) return; // the save has not landed yet
      pending.current = null;
      const ids = new Set(visible.map((i) => i.id));
      const at = p.order.indexOf(p.item.id);
      const next = p.order.slice(at + 1).find((id) => ids.has(id));
      const prev = [...p.order.slice(0, at)].reverse().find((id) => ids.has(id));
      const target = (next ?? prev) != null ? controlOf(root.current, (next ?? prev) as string) : inputRef.current ?? blockBtn.current;
      if (!focusIfLost(target, p.origin)) announce(`Removed: “${p.item.question}”.`);
    } else {
      if (gone) return;
      pending.current = null;
      if (!focusIfLost(controlOf(root.current, p.item.id), p.origin)) announce(`Restored: “${p.item.question}”.`);
      else announce(`Restored: “${p.item.question}”.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, confirm]);

  const requestRemove = (item: BlockedQuestionItem) => setConfirm(item);
  const doRemove = () => {
    const item = confirm;
    if (!item || !onRemove) return;
    const origin = document.activeElement;
    pending.current = { kind: 'removed', item, order: visible.map((i) => i.id), origin };
    setConfirm(null);
    const undo = () => {
      pending.current = { kind: 'restored', item, origin: document.activeElement };
      Promise.resolve(onRemove(item, { undo: true })).catch(() => {
        pending.current = null;
        toast.error(`Couldn’t restore “${item.question}”. Try again.`);
      });
    };
    const done = () => toast.undo(`Unblocked: “${item.question}”`, undo);
    // `origin` is the Remove button the dialog gave focus back to, or body: either counts as lost.
    Promise.resolve(onRemove(item, { undo: false })).then(done, () => {
      const p = pending.current;
      pending.current = null;
      toast.error(`Couldn’t remove “${item.question}”. Try again.`);
      if (p) focusIfLost(controlOf(root.current, item.id), p.origin);
    });
  };

  /* ---------- block ---------- */
  const clearError = () => error && setError(null);
  const block = async () => {
    if (busyRef.current) return;
    const origin = document.activeElement;
    const raw = text;
    const q = cleanQuestion(raw);
    const fail = (msg: string) => {
      setError(msg);
      focusIfLost(inputRef.current, origin === blockBtn.current ? origin : null);
    };
    if (!q) return fail('Type the question as a customer would ask it.');
    const key = normalizeBlockedQuestion(q);
    const dup = items.find((i) => normalizeBlockedQuestion(i.question) === key && (i.scope === targetScope || isEvery(i.scope)));
    if (dup) return fail(`That question is already blocked${isEvery(dup.scope) ? ' for every business' : ` at ${labelOf(dup.scope)}`}.`);
    if (atLimit) return fail(`You can block up to ${maxItems} questions. Remove one first.`);
    if (!onBlock) return;
    setError(null);
    busyRef.current = true;
    setBusy(true);
    try {
      await onBlock({ question: q, scope: targetScope });
      // Clear only what was sent: if they kept typing during a slow save, keep their new text.
      if (inputRef.current && inputRef.current.value === raw) setText('');
      focusIfLost(inputRef.current, origin === blockBtn.current ? origin : null);
      announce(`Blocked “${q}” ${phrase(targetScope)}.`);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Couldn’t block that question. Try again.');
      focusIfLost(inputRef.current, origin === blockBtn.current ? origin : null);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  /* ---------- reply editor ---------- */
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const editBtns = useRef<Record<string, HTMLButtonElement | null>>({});

  const openEditor = (id: string) => {
    setDraft(replies[id] ?? '');
    setReplyError(null);
    setEditing(id);
  };
  // Opening is the person's own action, so focus goes to the field at once (no timers).
  useEffect(() => {
    if (editing) areaRef.current?.focus();
  }, [editing]);

  // After the editor closes (save or cancel) its Edit button gets focus only if focus was lost with the editor.
  const afterClose = useRef<string | null>(null);
  useEffect(() => {
    const id = afterClose.current;
    if (editing !== null || id === null) return;
    afterClose.current = null;
    focusIfLost(editBtns.current[id], null);
  }, [editing]);
  const cancel = () => {
    if (!editing) return;
    afterClose.current = editing;
    setEditing(null);
    setReplyError(null);
  };
  const save = async () => {
    if (!editing || savingRef.current) return;
    const id = editing;
    const v = draft.trim();
    if (!v) {
      setReplyError('Write the reply Leda should give.');
      areaRef.current?.focus();
      return;
    }
    if (!onEditReply) return;
    savingRef.current = true;
    setSaving(true);
    setReplyError(null);
    try {
      await onEditReply(id, v);
      afterClose.current = id;
      setEditing(null);
      announce(`Reply saved${isEvery(id) ? '' : ` for ${labelOf(id)}`}.`);
    } catch (e) {
      setReplyError(e instanceof Error && e.message ? e.message : 'Couldn’t save the reply. Try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  /* ---------- render ---------- */
  const introText =
    intro === false
      ? null
      : intro ?? (fixed && !isEvery(scope) ? 'Leda won’t answer these, even when a topic could. Every one gets the same reply.' : 'Leda won’t answer these, even when a topic could. It gives your reply instead.');

  const columns = fixed ? 'minmax(0,1fr) auto' : 'minmax(0,1fr) 9.5rem auto';
  const errId = `${uid}-err`;
  const limitNote = atLimit && editable;

  const replyBlock = (id: string) => {
    const label = isEvery(id) ? (fixed ? 'Leda replies' : 'Leda replies, for the company and every business') : `At ${labelOf(id)}, Leda replies`;
    if (editing === id) {
      const eid = `${uid}-re-${id}`;
      const hid = `${eid}-h`;
      const xid = `${eid}-x`;
      return (
        <div key={id} data-bq-editor className="rounded-card bg-raised px-4 py-3.5" onKeyDown={keepJK}>
          <label htmlFor={eid} className="block text-small text-muted">
            {label}
          </label>
          <textarea
            ref={areaRef}
            id={eid}
            rows={3}
            value={draft}
            maxLength={replyMaxLength}
            readOnly={saving}
            aria-readonly={saving || undefined}
            aria-invalid={replyError ? true : undefined}
            aria-describedby={replyError ? `${xid} ${hid}` : hid}
            onChange={(e) => {
              setDraft(e.target.value);
              if (replyError) setReplyError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                cancel();
              } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void save();
              }
            }}
            className={cn(field, 'mt-2 min-h-[5.25rem] resize-none py-2 leading-5', replyError ? 'border-bad' : 'border-control')}
          />
          <div className="mt-1.5 flex flex-wrap items-start gap-x-3 gap-y-1">
            <div className="min-w-0 flex-1">
              {replyError ? (
                <p id={xid} role="alert" className="text-small text-bad-ink [overflow-wrap:anywhere]">
                  {replyError}
                </p>
              ) : null}
              <p id={hid} className="text-small text-muted">
                Keep it polite and short. Customers see it as Leda’s answer.
              </p>
            </div>
            <span className="shrink-0 text-small tabular-nums text-muted" aria-hidden>
              {replyMaxLength - draft.length} left
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="primary"
              actionBar
              aria-disabled={saving || undefined}
              onClick={() => void save()}
              className={cn(saving && 'cursor-progress opacity-70')}
            >
              {saving ? 'Saving…' : 'Save reply'}
            </Button>
            <Button variant="text" actionBar onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div key={id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-card bg-raised px-4 py-3">
        <span className="col-span-full min-w-0 text-small text-muted [overflow-wrap:anywhere]">{label}</span>
        <p className="min-w-0 text-ui text-text [overflow-wrap:anywhere]">“{replies[id]}”</p>
        {editable ? (
          <Button
            ref={(el) => {
              editBtns.current[id] = el;
            }}
            variant="text"
            leftIcon={PencilSimple}
            aria-label={`Edit reply, ${isEvery(id) ? 'for the company and every business' : labelOf(id)}`}
            onClick={() => openEditor(id)}
            className="max-sm:min-h-11"
          >
            Edit reply
          </Button>
        ) : null}
      </div>
    );
  };

  return (
    <section ref={root} aria-label={ariaLabel} aria-busy={status === 'loading' || undefined} className={cn('block min-w-0 max-w-full', className)}>
      {introText ? <p className="m-0 text-ui text-muted [overflow-wrap:anywhere]">{introText}</p> : null}

      {status === 'loading' ? (
        <div className="mt-4" role="status" aria-label="Loading blocked questions">
          <Skeleton height={64} className="mb-4" />
          {[0, 1, 2].map((n) => (
            <div key={n} className="border-t border-rule py-row-y">
              <Skeleton variant="text" width={n === 1 ? '55%' : '80%'} />
            </div>
          ))}
        </div>
      ) : status === 'error' ? (
        <ErrorBlock thing="blocked questions" onRetry={onRetry} className="mt-4" />
      ) : (
        <>
          {replyScopes.length ? <div className="mt-4 flex flex-col gap-2">{replyScopes.map(replyBlock)}</div> : null}

          <div className="mt-2">
            {visible.length ? (
              <List columns={columns} stackBelow={600} shortcuts={shortcuts} aria-label={`Blocked questions, ${visible.length}`} className="border-t border-rule">
                {visible.map((item) => {
                  const tag = labelOf(item.scope);
                  return (
                    <ListRow key={item.id} rowId={item.id} label={item.question}>
                      <ListCell kind="lead" className="min-w-0 text-ui">
                        “{item.question}”
                      </ListCell>
                      {!fixed ? (
                        <ListCell kind="body" flush>
                          <Badge tone={isEvery(item.scope) ? 'accent' : 'neutral'} title={tag} className="max-w-full">
                            {isEvery(item.scope) ? <Buildings size={12} aria-hidden className="shrink-0" /> : null}
                            <span className="min-w-0 truncate">{tag}</span>
                          </Badge>
                        </ListCell>
                      ) : null}
                      <ListCell kind="actions">
                        {onTry ? (
                          <Button
                            variant="text"
                            actionBar
                            aria-label={`Try it: ${item.question}`}
                            data-bq-focus={editable ? undefined : ''}
                            onClick={() => onTry(item)}
                            className="text-muted hover:text-text"
                          >
                            Try
                          </Button>
                        ) : null}
                        {editable ? (
                          <Button
                            variant="text"
                            actionBar
                            aria-label={`Remove blocked question: ${item.question}`}
                            data-bq-focus=""
                            onClick={() => requestRemove(item)}
                            className="text-muted hover:text-bad-ink"
                          >
                            Remove
                          </Button>
                        ) : null}
                      </ListCell>
                    </ListRow>
                  );
                })}
              </List>
            ) : (
              <div className="border-t border-rule">
                <EmptyState
                  align="start"
                  icon={Prohibit}
                  title="No blocked questions"
                  description="Leda answers anything its topics cover."
                  className="px-0"
                />
              </div>
            )}
          </div>

          {inherited.length ? (
            <p className="mt-3 flex min-w-0 items-start gap-1.5 text-ui text-muted [overflow-wrap:anywhere]">
              <Buildings size={14} aria-hidden className="mt-[3px] shrink-0" />
              <span className="min-w-0">
                {inherited.length === 1 ? '1 more question is' : `${inherited.length} more questions are`} blocked for every business{inheritedLink ? <>, {inheritedLink}</> : null}.
              </span>
            </p>
          ) : null}

          {editable && !limitNote ? (
            <form
              className="mt-4 flex flex-wrap items-end gap-2"
              onKeyDown={keepJK}
              onSubmit={(e) => {
                e.preventDefault();
                void block();
              }}
              noValidate
            >
              <div className="min-w-0 flex-[1_1_16rem]">
                <label htmlFor={`${uid}-q`} className="sr-only">
                  A question to block
                </label>
                <input
                  ref={inputRef}
                  id={`${uid}-q`}
                  type="text"
                  value={text}
                  maxLength={maxLength}
                  autoComplete="off"
                  placeholder="A question to block, like “Who is your parts supplier?”"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errId : undefined}
                  aria-busy={busy || undefined}
                  onChange={(e) => {
                    setText(e.target.value);
                    clearError();
                  }}
                  className={cn(field, 'h-[var(--ctl-dropdown)]', error ? 'border-bad' : 'border-control')}
                />
              </div>
              {!fixed && scopes.length > 1 ? (
                <div className="min-w-0 flex-[0_1_12rem] max-sm:flex-[1_1_100%]">
                  <span id={`${uid}-for`} className="mb-1 block text-small text-muted">
                    Blocked for
                  </span>
                  <Select
                    aria-labelledby={`${uid}-for`}
                    value={blockScope}
                    onValueChange={(v) => {
                      setBlockScope(v);
                      clearError();
                    }}
                    options={scopes.map((s) => ({ value: s.id, label: s.label, icon: s.icon, textValue: s.label }))}
                    className="[&_[role=listbox]]:max-w-full"
                  />
                </div>
              ) : null}
              <Button
                ref={blockBtn}
                type="submit"
                variant="secondary"
                leftIcon={Prohibit}
                actionBar
                aria-disabled={busy || undefined}
                onClick={(e) => {
                  if (busy) e.preventDefault();
                }}
                className={cn('max-sm:h-[var(--ctl-touch)] max-sm:flex-[1_1_100%] sm:h-[var(--ctl-dropdown)]', busy && 'cursor-progress opacity-70')}
              >
                {busy ? 'Blocking…' : 'Block question'}
              </Button>
              {error ? (
                <p id={errId} role="alert" className="m-0 basis-full text-small text-bad-ink [overflow-wrap:anywhere]">
                  {error}
                </p>
              ) : null}
            </form>
          ) : null}

          {limitNote ? <p className="mt-4 text-ui text-muted">You can block up to {maxItems} questions. Remove one to add another.</p> : null}
          {readOnly && readOnlyNote ? (
            <p className="mt-4 flex items-start gap-1.5 text-ui text-muted [overflow-wrap:anywhere]">
              <Lock size={14} aria-hidden className="mt-[3px] shrink-0" />
              <span className="min-w-0">{readOnlyNote}</span>
            </p>
          ) : null}
        </>
      )}

      <span role="status" aria-live="polite" className="sr-only">
        <span key={say.n}>{say.text}</span>
      </span>

      <ConfirmDialog
        open={confirm != null}
        onOpenChange={(o) => {
          if (!o) setConfirm(null);
        }}
        tone="danger"
        title="Remove this blocked question?"
        name={confirm ? `“${confirm.question}”` : undefined}
        context={confirm ? `Blocked ${phrase(confirm.scope)}` : undefined}
        description={confirm ? `Leda can answer it again ${isEvery(confirm.scope) ? 'at every business' : `at ${labelOf(confirm.scope)}`} when a topic that is on covers it.` : undefined}
        confirmLabel="Remove"
        onConfirm={doRemove}
      />
    </section>
  );
}
