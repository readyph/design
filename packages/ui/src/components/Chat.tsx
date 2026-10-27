import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { NotePencil, Prohibit, PaperPlaneRight, X } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { focusIfLost } from '../utils/focusIfLost';
import { useMatchMedia } from '../utils/useMatchMedia';
import { LedaMark } from './Leda';
import { LedaProposal, type LedaProposalProps } from './LedaProposal';
import { LedaRefusal, LedaNoteLink } from './LedaNote';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Leda conversation panel (RDY-268, handover C8). UPDATE of the `Chat` family: the old bubble chat is gone
 * (the RDY-244 reset removed it), so this is the family's current shape. Flat Slack-like rows (no bubbles), a block renderer,
 * a composer with a scope chip, word streaming, Aurora while thinking, and a persistence key.
 *
 * Parts: `Chat` (panel), `ChatHeader`, `ChatThread`, `ChatMessage`, `ChatBlocks`, `ChatChips`, `ChatEmpty`, `ChatComposer`,
 * `ChatScopeChip`. Data is plain JSON (`ChatMessageData`), so a thread can live in sessionStorage (`usePersistedChat`).
 */

/** sessionStorage key of the one global conversation (survives pages and reloads of the tab). */
export const LEDA_CONVERSATION_KEY = 'rph-leda-convo-v1';

const PHONE = '(max-width: 640px)';
const REDUCED = '(prefers-reduced-motion: reduce)';
const sr = 'absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]';

/* ------------------------------------------------------------------ data */

export interface ChatTableBlock {
  type: 'table';
  /** Name of the table for assistive tech. */
  caption: string;
  columns: { key: string; label: string; align?: 'left' | 'right' }[];
  rows: Record<string, string>[];
}
/** A table answer as the workshop draws it: no box, hairline rows, a bar under the lead figure, a total row. Cells are formatted by the caller. */
export interface ChatAnswerTableBlock {
  type: 'answerTable';
  caption: string;
  columns: string[];
  rows: { label: string; cells: string[]; /** A bar under cell `at`, `pct` wide. */ bar?: { at: number; pct: number }; lead?: boolean }[];
  /** The "All" row. */
  foot?: string[];
  unit?: string;
}
export interface ChatActionItem {
  id: string;
  label: string;
  /** With `href` the action is a link, otherwise a button that calls `onAction`. */
  href?: string;
}
export type ChatProposalData = Pick<
  LedaProposalProps,
  'title' | 'id' | 'topLabel' | 'lines' | 'linesLabel' | 'writes' | 'writesHeading' | 'notes' | 'cannot' | 'warning' | 'state' | 'confirmLabel' | 'discardLabel' | 'after' | 'doneAt' | 'discardedText' | 'openPage' | 'openHref'
> & { extraLabel?: string; doneActionLabel?: string };

export type ChatBlock =
  | { type: 'text'; text: string; /** Reveal word by word (once, on mount). */ stream?: boolean }
  | { type: 'meta'; text: string }
  | ChatTableBlock
  | { type: 'figure'; value: string; label: string; detail?: string }
  | ChatAnswerTableBlock
  | { type: 'answerFigure'; figure: string; sub: string }
  | { type: 'refuse'; text: string }
  | { type: 'refusal'; text: string; actions?: ChatActionItem[] }
  | { type: 'actions'; actions: ChatActionItem[] }
  | { type: 'proposal'; blockId: string; proposal: ChatProposalData }
  | { type: 'chips'; chips: ChatChip[] };

export interface ChatChip {
  id: string;
  label: string;
}

export interface ChatMessageData {
  id: string;
  from: 'owner' | 'leda';
  /** Display name. Owner: the person; Leda: "Leda". */
  name: string;
  /** Time text, e.g. "9:12 AM". */
  time?: string;
  /** Owner messages: the scope chip ("About Parts Stockroom"). */
  scope?: string;
  /** Leda is working on this reply: Aurora on the avatar and a "Thinking…" line. Blocks stay empty until it ends. */
  thinking?: boolean;
  blocks: ChatBlock[];
}

/** Read and write a JSON value in sessionStorage. Every access is guarded: private windows and blocked storage fall back to memory. */
export function usePersistedChat<T>(initial: T, key: string = LEDA_CONVERSATION_KEY): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(key) : null;
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* storage unavailable or corrupt: start from `initial` */
    }
    return initial;
  });
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          window.sessionStorage.setItem(key, JSON.stringify(v));
        } catch {
          /* ignore */
        }
        return v;
      });
    },
    [key],
  );
  return [value, set];
}

/* ------------------------------------------------------------------ panel */

export interface ChatProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /**
   * `overlay` (default): fixed, 440px, between the top inset and the status bar, over the right of the sheet; full screen at 640px and below.
   * Render it next to `PlatformShell`, not inside the sheet (the sheet is a container, which would trap `fixed`).
   * `inline`: fills its parent (for embedding and stories).
   */
  variant?: 'overlay' | 'inline';
  /** Accessible name of the region. Default "Leda conversation". */
  label?: string;
  /** Esc closes the panel unless a dialog, menu or list above it handled the key. Without it Esc does nothing. */
  onClose?: () => void;
  /** Play the 220ms exit. The consumer unmounts the panel on `onAnimationEnd`. */
  closing?: boolean;
  /** Where focus goes when the panel unmounts with focus inside it. Default: the element that was focused when it mounted. */
  returnFocusTo?: HTMLElement | RefObject<HTMLElement | null> | null;
  children?: ReactNode;
}

const resolveEl = (t: ChatProps['returnFocusTo']): HTMLElement | null => (t == null ? null : 'current' in t ? t.current : t);

/**
 * The panel: a labelled region (`section`) that stays open across pages until the owner closes it. Flat surface, 1px border,
 * 8px radius, no shadow. Opens with the subpage timing (240/220ms, a 140ms fade under reduced motion).
 * Focus: the composer takes focus on open (the panel itself on a phone, so no keyboard pops up); when it unmounts with
 * focus inside, focus returns to the opener, only if it was lost (`focusIfLost`).
 */
export const Chat = forwardRef<HTMLElement, ChatProps>(function Chat(
  { variant = 'overlay', label = 'Leda conversation', onClose, closing = false, returnFocusTo, className, children, ...rest },
  ref,
) {
  const root = useRef<HTMLElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const returnTo = useRef(returnFocusTo);
  returnTo.current = returnFocusTo;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const overlay = variant === 'overlay';

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const composer = el.querySelector<HTMLElement>('[data-chat-composer]');
    if (!el.contains(document.activeElement)) {
      if (composer && !window.matchMedia?.(PHONE).matches) composer.focus({ preventScroll: true });
      else el.focus({ preventScroll: true });
    }
    return () => {
      const target = resolveEl(returnTo.current) ?? opener.current;
      if (target?.isConnected) focusIfLost(el, target, { preventScroll: true });
    };
  }, []);

  // Esc closes the panel first, unless something above it (palette, menu, dialog) claimed the key.
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const above = document.querySelector('[role="dialog"],[role="alertdialog"],[role="menu"],[role="listbox"],[aria-modal="true"]');
      if (above) return;
      closeRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <section
      {...rest}
      ref={(n) => {
        root.current = n;
        if (typeof ref === 'function') ref(n);
        else if (ref) (ref as { current: HTMLElement | null }).current = n;
      }}
      tabIndex={-1}
      aria-label={label}
      data-leda-panel={overlay ? '' : undefined}
      className={cn(
        className,
        'flex min-h-0 min-w-0 flex-col overflow-hidden border border-border bg-surface text-text outline-0 rounded-sheet',
        overlay
          ? 'fixed bottom-[var(--status)] right-[var(--inset)] top-[var(--inset)] z-40 w-[min(440px,calc(100vw-var(--rail)-2*var(--inset)))] max-[640px]:inset-0 max-[640px]:w-auto max-[640px]:max-w-none max-[640px]:rounded-none max-[640px]:border-0'
          : 'h-full w-full',
        overlay && (closing ? 'animate-sub-out-r motion-reduce:animate-sub-fade' : 'animate-sub-in-r motion-reduce:animate-sub-fade'),
      )}
    >
      {children}
    </section>
  );
});

/* ------------------------------------------------------------------ header */

export interface ChatHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Leda is working: Aurora on the mark, the tagline becomes "Thinking…" under reduced motion. */
  busy?: boolean;
  /** Disables "New conversation" (nothing to clear). */
  empty?: boolean;
  /** Called after the owner confirms. Without it the button is not shown. */
  onNewConversation?: () => void;
  onClose?: () => void;
  /** Where focus goes when the confirm dialog closes after "Start new conversation" (the old thread is gone). Default: the composer. */
  newFocusRef?: RefObject<HTMLElement | null>;
  tagline?: string;
  /** The workshop's header: title and tagline on one line, "New conversation" with its pencil (icon only on a phone). Default: stacked. */
  layout?: 'stacked' | 'inline';
}

/** Header (48px): Leda mark 20px, "Leda", tagline, "New conversation" (asks first through `ConfirmDialog`), close. */
export function ChatHeader({ busy = false, empty = false, onNewConversation, onClose, newFocusRef, tagline = 'Ask Leda', layout = 'stacked', className, ...rest }: ChatHeaderProps) {
  const [asking, setAsking] = useState(false);
  const ranNew = useRef(false);
  return (
    <header {...rest} className={cn(className, 'flex h-12 shrink-0 items-center gap-2.5 border-b border-border pl-4 pr-2 max-[640px]:pr-1')}>
      <span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center">
        <LedaMark size={20} effect="aurora" active={busy} decorative />
      </span>
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <h2 className="truncate text-[15px] font-semibold leading-5">Leda</h2>
        <p className="whitespace-nowrap text-small leading-5 text-muted">
          <span className={busy ? 'motion-reduce:hidden' : undefined}>{tagline}</span>
          {busy && <span aria-hidden className="hidden motion-reduce:inline">Thinking…</span>}
        </p>
      </div>
      <span role="status" className={sr}>{busy ? 'Leda is thinking' : ''}</span>
      {onNewConversation && (
        <Button
          variant="text"
          leftIcon={NotePencil}
          title="Start a new conversation"
          keepFocus
          aria-disabled={empty || undefined}
          onClick={() => {
            if (!empty) setAsking(true);
          }}
          className={cn('shrink-0 max-[640px]:h-11 max-[640px]:w-11 max-[640px]:px-0 max-[640px]:[&_svg]:size-[18px]', empty && 'cursor-default text-muted opacity-50 hover:bg-transparent hover:text-muted')}
        >
          <span className="max-[640px]:sr-only">New conversation</span>
        </Button>
      )}
      {onClose && (
        <button
          type="button"
          aria-label="Close Leda"
          onClick={onClose}
          className={cn(
            'inline-grid h-8 w-8 shrink-0 place-items-center rounded-control text-muted hover:bg-raised hover:text-text max-[640px]:h-11 max-[640px]:w-11 max-[640px]:[&_svg]:size-[18px]',
            focusRing,
          )}
        >
          <X aria-hidden size={16} className="max-[640px]:size-[18px]" />
        </button>
      )}
      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        title="Start a new conversation?"
        description="The current conversation is cleared. Anything Leda already wrote stays written."
        tone="primary"
        confirmLabel="Start new conversation"
        iconNode={<LedaMark size={16} decorative />}
        onConfirm={() => {
          ranNew.current = true;
          setAsking(false);
          onNewConversation?.();
        }}
        onCancel={() => setAsking(false)}
        onCloseAutoFocus={(e) => {
          if (!ranNew.current) return;
          ranNew.current = false;
          // The old thread (and "New conversation", now disabled) is gone: put focus in the composer, but only if it was lost.
          e.preventDefault();
          const target = newFocusRef?.current ?? document.querySelector<HTMLElement>('[data-chat-composer]');
          focusIfLost(null, target);
        }}
      />
    </header>
  );
}

/* ------------------------------------------------------------------ thread */

export interface ChatThreadProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/**
 * The thread: `role="log"`, polite. Keeps the newest message in view while the owner is at the bottom; scrolling up stops it.
 * The scroller is focusable so the keyboard can scroll it.
 */
export const ChatThread = forwardRef<HTMLDivElement, ChatThreadProps>(function ChatThread({ className, children, ...rest }, ref) {
  const el = useRef<HTMLDivElement | null>(null);
  const stuck = useRef(true);
  const count = Array.isArray(children) ? children.length : children ? 1 : 0;
  useLayoutEffect(() => {
    const n = el.current;
    if (n && stuck.current) n.scrollTop = n.scrollHeight;
  }, [count, children]);
  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Conversation with Leda"
      tabIndex={0}
      {...rest}
      ref={(n) => {
        el.current = n;
        if (typeof ref === 'function') ref(n);
        else if (ref) (ref as { current: HTMLDivElement | null }).current = n;
      }}
      onScroll={(e) => {
        const n = e.currentTarget;
        stuck.current = n.scrollHeight - n.scrollTop - n.clientHeight < 48;
        rest.onScroll?.(e);
      }}
      className={cn(className, 'min-h-0 flex-1 overflow-y-auto overscroll-contain py-2 focus-visible:outline focus-visible:-outline-offset-2')}
    >
      {children}
    </div>
  );
});

/* ------------------------------------------------------------------ chips */

const chipBase =
  'inline-flex min-h-7 max-w-full items-center rounded-chip border border-control bg-surface px-2.5 py-1 text-left text-[13px] leading-[18px] text-text transition-colors duration-hover hover:border-accent motion-reduce:transition-none max-[640px]:min-h-9';

export interface ChatChipsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  chips: ChatChip[];
  onPick?: (chip: ChatChip) => void;
  /** Name of the group. Default "Suggestions". */
  label?: string;
  /** `overview`: the Home hero's chips (30px, 13px / 20px). */
  variant?: 'default' | 'overview' | 'strip';
}

/** Follow-up chips (28px, 13px, 5px radius; 40px on a phone). Wrap, never cut. */
export function ChatChips({ chips, onPick, label = 'Suggestions', className, variant = 'default', ...rest }: ChatChipsProps) {
  const box = useRef<HTMLDivElement>(null);
  const had = useRef(false);
  // A picked chip usually disappears (the empty state or the follow-ups are replaced by the thread). If focus was in the chips
  // when that happens, it is lost: move it to the composer, only if it really was lost.
  useLayoutEffect(
    () => () => {
      if (!had.current) return;
      const c = document.querySelector<HTMLElement>('[data-chat-composer]');
      if (c) focusIfLost(box.current, c, { preventScroll: true });
    },
    [],
  );
  return (
    <div
      ref={box}
      role="group"
      aria-label={label}
      {...rest}
      onFocus={(e) => { had.current = true; rest.onFocus?.(e); }}
      onBlur={(e) => { if (e.relatedTarget) had.current = false; rest.onBlur?.(e); }}
      className={cn(className, 'flex flex-wrap', variant === 'overview' ? 'gap-2' : 'gap-1.5', variant === 'strip' && 'flex-nowrap gap-2 overflow-x-auto [scrollbar-width:none]')}
    >
      {chips.map((c) => (
        <button key={c.id} type="button" onClick={() => onPick?.(c)} className={cn(chipBase, focusRing, '[overflow-wrap:anywhere]', variant === 'overview' && 'min-h-[30px] leading-5 hover:bg-raised', variant === 'strip' && 'shrink-0 whitespace-nowrap !min-h-9 leading-5')}>
          {c.label}
        </button>
      ))}
    </div>
  );
}

/** Scope chip (22px, `--raised-2`, 12px): what the question was about. Text, so never colour alone. */
export function ChatScopeChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex min-h-[22px] max-w-full items-center rounded-chip bg-raised-2 px-2 text-small [overflow-wrap:anywhere]', className)}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ streaming text */

/**
 * Word-by-word reveal. Every word is in the layout from the start (opacity only, nothing reflows). Assistive tech gets the full text once;
 * the animated words are hidden from it. Reduced motion: the reply shows at once.
 */
function StreamedText({ text, onDone, step = 32 }: { text: string; onDone?: () => void; step?: number }) {
  const reduced = useMatchMedia(REDUCED);
  const parts = useMemo(() => text.split(/(\s+)/), [text]);
  const total = useMemo(() => parts.filter((p) => p.trim()).length, [parts]);
  const [shown, setShown] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;
  const finished = reduced || shown >= total;
  useEffect(() => {
    if (finished) {
      done.current?.();
      return;
    }
    const t = setInterval(() => setShown((n) => n + 1), step);
    return () => clearInterval(t);
  }, [finished, step]);
  let w = 0;
  return (
    <p className="text-body text-text [overflow-wrap:anywhere]">
      <span className={sr}>{text}</span>
      <span aria-hidden>
        {parts.map((p, i) => {
          if (!p.trim()) return p;
          const on = finished || w++ < shown;
          return (
            <span key={i} className={cn('transition-opacity duration-150 motion-reduce:transition-none', on ? 'opacity-100' : 'opacity-0')}>
              {p}
            </span>
          );
        })}
      </span>
    </p>
  );
}

/* ------------------------------------------------------------------ blocks */

/** Boxes on `--raised` (proposal, refusal) step to `--raised-2` while the row is hovered, so they never vanish into it. */
const onRaised = 'group-hover/msg:[&>*]:bg-raised-2';
const actionBtn = 'inline-flex min-h-6 items-center rounded-chip text-ui font-medium text-accent underline underline-offset-2 hover:text-accent-hover max-[640px]:min-h-11';

export interface ChatBlocksProps {
  blocks: ChatBlock[];
  /** A chip was picked. */
  onChip?: (chip: ChatChip) => void;
  /** A button action ("Open Auto Works" without `href`). */
  onAction?: (action: ChatActionItem) => void;
  onConfirm?: (blockId: string) => void | Promise<unknown>;
  onDiscard?: (blockId: string) => void;
  /** "Change it first" and the done action ("Send invite now") buttons of a proposal. */
  onProposalAction?: (blockId: string, which: 'extra' | 'done') => void;
  onOpenPage?: (blockId: string) => void;
  /** A streamed text block finished revealing. */
  onStreamed?: () => void;
  /** `workshop`: streamed words land every 24 ms like the workshop's (default 32). */
  layout?: 'default' | 'workshop';
}

function Actions({ actions, onAction, secondary }: { actions: ChatActionItem[]; onAction?: (a: ChatActionItem) => void; secondary?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {actions.map((a) =>
        a.href ? (
          <LedaNoteLink key={a.id} href={a.href} onClick={() => onAction?.(a)} className={secondary ? 'focus-visible:ring-offset-surface' : undefined}>{a.label}</LedaNoteLink>
        ) : (
          <button key={a.id} type="button" onClick={() => onAction?.(a)} className={cn(actionBtn, focusRing)}>{a.label}</button>
        ),
      )}
    </div>
  );
}

/** Renders a message's blocks: text, meta, table, figure, refusal, actions, proposal card, chips. */
export function ChatBlocks({ blocks, onChip, onAction, onConfirm, onDiscard, onProposalAction, onOpenPage, onStreamed, layout = 'default' }: ChatBlocksProps) {
  const bodyText = 'text-body';
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'text':
            return b.stream ? <StreamedText key={i} text={b.text} onDone={onStreamed} step={layout === 'workshop' ? 24 : 32} /> : <p key={i} className={cn(bodyText, 'text-text [overflow-wrap:anywhere]')}>{b.text}</p>;
          case 'meta':
            return <p key={i} className="text-small text-muted [overflow-wrap:anywhere]">{b.text}</p>;
          case 'table':
            return (
              <div key={i} role="region" aria-label={b.caption} tabIndex={0} className={cn('max-w-full overflow-x-auto rounded-card border border-border px-3 py-2.5', focusRing, 'focus-visible:ring-offset-surface')}>
                <table className="w-full border-collapse text-ui">
                  <caption className={sr}>{b.caption}</caption>
                  <thead>
                    <tr>
                      {b.columns.map((c) => (
                        <th key={c.key} scope="col" className={cn('whitespace-nowrap pb-1.5 pr-2 text-small font-normal leading-[18px] text-muted last:pr-0', c.align === 'right' ? 'pl-3 text-right' : 'text-left')}>{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, ri) => (
                      <tr key={ri}>
                        {b.columns.map((c, ci) =>
                          ci === 0 ? (
                            <th key={c.key} scope="row" className="border-t border-rule py-[7px] pr-2 text-left font-normal text-text">{r[c.key]}</th>
                          ) : (
                            <td key={c.key} className={cn('border-t border-rule py-[7px] pr-2 text-text last:pr-0', c.align === 'right' ? 'pl-3 text-right tabular-nums' : 'text-left')}>{r[c.key]}</td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'figure':
            return (
              <div key={i} className="rounded-card border border-border px-3 py-2.5">
                <p className="text-figure-sm font-semibold tabular-nums text-text [overflow-wrap:anywhere]">{b.value}</p>
                <p className="text-ui text-text">{b.label}</p>
                {b.detail && <p className="text-small text-muted">{b.detail}</p>}
              </div>
            );
          case 'answerTable':
            return (
              <div key={i} className="min-w-0 overflow-x-auto rounded-card border border-border bg-surface px-3 py-2.5">
                <table className="w-full border-collapse text-ui leading-[18px]">
                  <caption className={sr}>{b.caption}</caption>
                  <thead>
                    <tr>
                      {b.columns.map((c, ci) => (
                        <th key={ci} scope="col" className={cn('whitespace-nowrap pb-1.5 pl-0 pr-2 pt-0 text-small font-normal leading-[18px] text-muted', ci ? 'pl-3 text-right tabular-nums' : 'text-left', ci === b.columns.length - 1 && 'pr-0')}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, ri) => (
                      <tr key={ri} className={r.lead ? 'font-medium' : undefined}>
                        <th scope="row" className="border-t border-rule py-[7px] pl-0 pr-2 text-left align-middle [font-weight:inherit]">{r.label}</th>
                        {r.cells.map((c, ci) => (
                          <td key={ci} className={cn('whitespace-nowrap border-t border-rule py-[7px] pl-3 pr-2 text-right align-middle tabular-nums', ci === r.cells.length - 1 && 'pr-0')}>
                            {c}
                            {r.bar && r.bar.at === ci ? <div className="mt-[5px] h-[3px] overflow-hidden rounded-[2px] bg-raised-2"><i className={cn('block h-full', r.lead ? 'bg-accent' : 'bg-control')} style={{ width: `${r.bar.pct}%` }} /></div> : null}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  {b.foot ? (
                    <tfoot>
                      <tr className="font-semibold">
                        <td className="border-t border-control py-[7px] pl-0 pr-2">All</td>
                        {b.foot.map((c, ci) => <td key={ci} className={cn('border-t border-control py-[7px] pl-3 pr-2 text-right tabular-nums', ci === b.foot!.length - 1 && 'pr-0')}>{c}</td>)}
                      </tr>
                    </tfoot>
                  ) : null}
                </table>
                {b.unit ? <p className="m-0 mt-2 text-small text-muted">{b.unit}</p> : null}
              </div>
            );
          case 'answerFigure':
            return (
              <div key={i} className="min-w-0 overflow-x-auto rounded-card border border-border bg-surface px-3 py-2.5">
                <p className="m-0 text-[30px] font-medium leading-9 tracking-[-0.01em] tabular-nums text-text">{b.figure}</p>
                <p className="m-0 mt-0.5 text-ui text-muted">{b.sub}</p>
              </div>
            );
          case 'refuse':
            return (
              <div key={i} className="flex items-start gap-2.5 rounded-card bg-raised px-3 py-2.5 text-ui leading-[19px]">
                <Prohibit aria-hidden size={18} className="mt-px shrink-0 text-muted" />
                <span>{b.text}</span>
              </div>
            );
          case 'refusal':
            return (
              <div key={i} className={onRaised}>
                <LedaRefusal action={b.actions ? <Actions actions={b.actions} onAction={onAction} /> : undefined}>{b.text}</LedaRefusal>
              </div>
            );
          case 'actions':
            return <Actions key={i} actions={b.actions} onAction={onAction} />;
          case 'proposal': {
            const { extraLabel, doneActionLabel, ...p } = b.proposal;
            const raisedBtn = 'focus-visible:ring-offset-raised';
            return (
              <div key={b.blockId} className={onRaised}>
              <LedaProposal
                {...p}
                extra={extraLabel ? <Button variant="secondary" className={raisedBtn} onClick={() => onProposalAction?.(b.blockId, 'extra')}>{extraLabel}</Button> : undefined}
                doneAction={doneActionLabel ? <Button variant="secondary" className={raisedBtn} onClick={() => onProposalAction?.(b.blockId, 'done')}>{doneActionLabel}</Button> : undefined}
                onConfirm={() => onConfirm?.(b.blockId)}
                onDiscard={() => onDiscard?.(b.blockId)}
                onOpenPage={() => onOpenPage?.(b.blockId)}
              />
              </div>
            );
          }
          case 'chips':
            return <ChatChips key={i} chips={b.chips} onPick={onChip} />;
        }
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ message */

export interface ChatMessageProps extends Omit<ChatBlocksProps, 'blocks'> {
  message: ChatMessageData;
  /** Initials for the owner's avatar. Default: from `message.name`. */
  initials?: string;
  /** The workshop's row: 28px avatar column with a 10px gap, 16px sides, the scope chip under what was said. Default: chip above. */
  layout?: 'default' | 'workshop';
}

const initialsFrom = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');

/**
 * One flat row: 28px avatar column (owner initials; Leda the bare 16px shard, no tile), name 13px 600 and time 12px tabular, then the blocks.
 * Hover `--raised`. The owner's row carries its scope chip. While `thinking`, the avatar plays Aurora above a reserved "Thinking…" line.
 */
export function ChatMessage({ message: m, initials, layout = 'default', ...handlers }: ChatMessageProps) {
  const leda = m.from === 'leda';
  return (
    <article aria-label={`${m.name}${m.time ? `, ${m.time}` : ''}`} className="group/msg grid grid-cols-[28px_minmax(0,1fr)] gap-x-2.5 px-4 py-2 hover:bg-raised max-[640px]:hover:bg-transparent" aria-busy={m.thinking || undefined}>
      <div className="grid h-7 w-7 shrink-0 place-items-center">
        {leda ? (
          <span aria-hidden className="grid h-7 w-7 place-items-center">
            <LedaMark size={28} effect="aurora" active={!!m.thinking} decorative />
          </span>
        ) : (
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-avatar-bg text-[11px] font-semibold text-avatar-text">{initials ?? initialsFrom(m.name)}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[13px] font-semibold leading-[18px] text-text">{m.name}</span>
          {m.time && <time className="text-small tabular-nums text-muted">{m.time}</time>}
        </p>
        <div className="flex min-w-0 flex-col gap-2">
          {m.thinking ? (
            <p className="min-h-5 text-body text-muted">Thinking…</p>
          ) : (
            <ChatBlocks blocks={m.blocks} {...handlers} />
          )}
          {m.scope && <ChatScopeChip className="self-start text-muted">{m.scope}</ChatScopeChip>}
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ empty */

export interface ChatEmptyProps extends HTMLAttributes<HTMLDivElement> {
  /** "Ask Leda about {scope}". */
  scope: string;
  chips?: ChatChip[];
  onPick?: (chip: ChatChip) => void;
  /** The one explanatory line. */
  description?: string;
  /** `workshop`: the workshop's spacing (24px sides, 16px title, 13px line, chips 14px below). */
  layout?: 'default' | 'workshop';
}

/** Empty thread: 32px bare shard, "Ask Leda about {scope}", one line, this page's questions as chips. */
export function ChatEmpty({
  scope,
  chips = [],
  onPick,
  description = 'She reads your platforms and answers here. When she drafts a change, you see exactly what it writes, and nothing is written until you confirm.',
  layout = 'default',
  className,
  ...rest
}: ChatEmptyProps) {
  const ws = layout === 'workshop';
  return (
    <div {...rest} className={cn(className, 'flex flex-col items-start', ws ? 'px-6 pb-2 pt-7' : 'gap-2 px-4 py-6')}>
      <LedaMark size={32} decorative />
      <h3 className={cn('font-semibold text-text', ws ? 'mt-3 text-dialog' : 'text-[15px] leading-5')}>Ask Leda about {scope}</h3>
      <p className={cn('text-ui text-muted', ws && 'mt-1 leading-[19px]')}>{description}</p>
      {chips.length > 0 && <ChatChips chips={chips} onPick={onPick} label={`Questions about ${scope}`} className={ws ? 'mt-3.5' : 'mt-1'} />}
    </div>
  );
}

/* ------------------------------------------------------------------ composer */

export interface ChatComposerProps extends Omit<HTMLAttributes<HTMLFormElement>, 'onSubmit' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  /** Enter or the send button. Not called for an empty value, nor while `busy`. */
  onSend: (value: string) => void;
  /** Leda is replying: sending is blocked, but the send button stays focusable (`aria-disabled`, `aria-busy`). */
  busy?: boolean;
  /** Scope chip text, always visible ("About Parts Stockroom"). */
  scope: string;
  /** Visually hidden label of the textarea. Default "Ask Leda". */
  label?: string;
  maxLength?: number;
  placeholder?: string;
  /** The workshop's composer: the box floats 12px in from the panel (8px on a phone) with no rule above it, the textarea is 14px with a faint placeholder, send is quiet until there is text. Default: ruled footer. */
  layout?: 'default' | 'workshop';
}

/**
 * Composer: bordered 6px box; textarea 40-136px that grows (Enter sends, Shift+Enter is a new line, 16px on a phone so iOS does not zoom);
 * bottom row: scope chip, hint (hidden under 1100px), 32px accent send button (40px phone).
 */
export const ChatComposer = forwardRef<HTMLTextAreaElement, ChatComposerProps>(function ChatComposer(
  { value, onChange, onSend, busy = false, scope, label = 'Ask Leda', maxLength, placeholder = 'Reply to Leda', className, ...rest },
  ref,
) {
  const id = useId();
  const ta = useRef<HTMLTextAreaElement | null>(null);
  const empty = value.trim().length === 0;
  const blocked = empty || busy;

  useLayoutEffect(() => {
    const n = ta.current;
    if (!n) return;
    n.style.height = 'auto';
    n.style.height = `${Math.min(136, Math.max(40, n.scrollHeight))}px`;
  }, [value]);

  const send = () => {
    if (blocked) return;
    onSend(value.trim());
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };
  return (
    <form
      {...rest}
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className={cn(className, 'mx-3 mb-3 shrink-0 max-[640px]:mx-2 max-[640px]:mb-2')}
    >
      <div className="flex min-w-0 flex-col rounded-card border border-control bg-surface focus-within:border-accent focus-within:outline focus-within:outline-1 focus-within:outline-accent">
        <label htmlFor={id} className={sr}>{label}</label>
        <textarea
          id={id}
          data-chat-composer=""
          ref={(n) => {
            ta.current = n;
            if (typeof ref === 'function') ref(n);
            else if (ref) (ref as { current: HTMLTextAreaElement | null }).current = n;
          }}
          rows={1}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKey}
          className="block max-h-[136px] min-h-10 w-full resize-none rounded-card bg-transparent px-3 pb-1 pt-2.5 text-body text-text outline-0 placeholder:text-faint max-[640px]:text-[16px]"
        />
        <div className="flex min-w-0 items-center gap-2 pb-1.5 pl-2.5 pr-1.5 pt-1">
          <ChatScopeChip className="h-6 min-w-0 shrink text-text">{scope}</ChatScopeChip>
          <span className="ml-auto hidden whitespace-nowrap text-[11px] text-faint min-[1101px]:block">Shift+Enter for a new line</span>
          <span className="flex-1 min-[1101px]:hidden" />
          <button
            type="submit"
            aria-label="Send"
            aria-disabled={blocked || undefined}
            aria-busy={busy || undefined}
            className={cn(
              'inline-grid h-8 w-8 shrink-0 place-items-center rounded-control transition-colors duration-hover motion-reduce:transition-none max-[640px]:h-10 max-[640px]:w-10',
              blocked ? 'cursor-default bg-raised-2 text-faint' : 'bg-accent text-accent-ink hover:bg-accent-hover',
              'forced-colors:border forced-colors:border-[ButtonText]',
              blocked && 'cursor-default bg-raised-2 text-faint hover:bg-raised-2',
              focusRing,
              'focus-visible:ring-offset-surface',
            )}
          >
            <PaperPlaneRight aria-hidden size={16} />
          </button>
        </div>
      </div>
    </form>
  );
});
