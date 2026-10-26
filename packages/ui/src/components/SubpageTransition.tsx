import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type MutableRefObject,
  type ReactNode,
  type UIEvent,
} from 'react';
import { cn } from '../utils/cn';
import { useMatchMedia } from '../utils/useMatchMedia';

/** 'in' = list to detail (new pane enters). 'out' = detail back to list (the detail leaves). */
export type SubpageDirection = 'in' | 'out';
/** The side a lane's detail pane comes from. Platform pages: the column from the left, the sheet from the right. */
export type SubpageSide = 'left' | 'right';

interface Opener {
  id: string;
  key: string | null;
  tag: string;
  text: string;
}

interface Ctx {
  paneKey: string;
  seq: number;
  direction: SubpageDirection;
  running: boolean;
  reduced: boolean;
  openerRef: MutableRefObject<Opener | null>;
  restoreFocus?: () => HTMLElement | null;
  register: (id: string, getPane?: () => HTMLElement | null) => () => void;
  screenEnded: (seq: number) => void;
  laneEnded: (id: string, seq: number) => void;
  lanes: Map<string, (() => HTMLElement | null) | undefined>;
}

const SubpageCtx = createContext<Ctx | null>(null);

const REDUCED = '(prefers-reduced-motion: reduce)';
/** The phone range of PlatformShell (640px and below). */
export const SUBPAGE_PHONE = '(max-width: 640px)';

/** True under `prefers-reduced-motion: reduce`. Live: follows the OS setting while mounted. */
export function usePrefersReducedMotion(): boolean {
  return useMatchMedia(REDUCED);
}

/** Reads a duration token (`--dur-subpage-in` ...) as milliseconds. */
function tokenMs(name: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  return raw.endsWith('ms') ? n : raw.endsWith('s') ? n * 1000 : fallback;
}

/** Slack added to the animation length before the timeout fallback removes the old pane (animationend may never fire). */
const FALLBACK_SLACK = 120;

function describeOpener(el: Element | null): Opener | null {
  if (!el || el === document.body || el === document.documentElement) return null;
  return {
    id: el.id,
    key: el.getAttribute('data-subpage-opener'),
    tag: el.tagName,
    text: (el.textContent ?? '').trim().slice(0, 80),
  };
}

function findOpener(root: HTMLElement, o: Opener): HTMLElement | null {
  if (o.id) {
    const byId = Array.from(root.querySelectorAll<HTMLElement>('[id]')).find((e) => e.id === o.id);
    if (byId) return byId;
  }
  if (o.key) {
    const byKey = Array.from(root.querySelectorAll<HTMLElement>('[data-subpage-opener]')).find((e) => e.getAttribute('data-subpage-opener') === o.key);
    if (byKey) return byKey;
  }
  if (o.text) {
    return Array.from(root.querySelectorAll<HTMLElement>(o.tag.toLowerCase())).find((e) => (e.textContent ?? '').trim().slice(0, 80) === o.text) ?? null;
  }
  return null;
}

export interface SubpageTransitionProps {
  /** Identifies what is on screen (route id, e.g. `platforms` or `platform:cebu`). A change starts a transition. */
  paneKey: string;
  /** 'in' for list to detail, 'out' for back. Read when `paneKey` changes. Browser Back and Esc are 'out'. */
  direction?: SubpageDirection;
  /** Called once when a transition has finished and the old pane is gone. Not called for an interrupted one. */
  onExited?: () => void;
  /** Custom focus target for 'out'. Default: the element that opened the detail (found by id, `data-subpage-opener`, or tag and text), else the pane heading. */
  restoreFocus?: () => HTMLElement | null;
  /** One or more `SubpageLane`s. */
  children?: ReactNode;
}

/**
 * Subpage transition (C15). The route-transition helper behind list to detail in the Portal.
 * Place it around the lanes of one page; give it the route key and the direction.
 *
 * It owns the timing (240ms in, 220ms out, `--ease-subpage`; the old pane drifts 6% and dims to 0.55), the focus move
 * and the cleanup. It renders no element of its own, so the rail, map and status bar of `PlatformShell` are never touched:
 * only the `SubpageLane`s you put inside the place column and the sheet move.
 *
 * Reduced motion: no slide, the old pane goes at once and the new one fades in over 140ms.
 */
export function SubpageTransition({ paneKey, direction = 'in', onExited, restoreFocus, children }: SubpageTransitionProps) {
  const reduced = usePrefersReducedMotion();
  const [st, setSt] = useState({ key: paneKey, seq: 0, running: false, direction });
  const openerRef = useRef<Opener | null>(null);
  if (st.key !== paneKey) {
    // Derived state: a new key starts transition number seq+1. The opener is read now, before the commit
    // removes it (reading activeElement here is idempotent, so a strict-mode double render is harmless).
    if (direction === 'in' && typeof document !== 'undefined') openerRef.current = describeOpener(document.activeElement);
    setSt({ key: paneKey, seq: st.seq + 1, running: st.seq + 1 > 0, direction });
  }

  const lanes = useRef(new Map<string, (() => HTMLElement | null) | undefined>());
  const ended = useRef({ seq: 0, set: new Set<string>() });
  const onExitedRef = useRef(onExited);
  useLayoutEffect(() => {
    onExitedRef.current = onExited;
  });

  const finish = useCallback((seq: number) => {
    setSt((s) => (s.seq === seq && s.running ? { ...s, running: false } : s));
  }, []);
  const finishedSeq = useRef(0);
  useEffect(() => {
    // Fires onExited exactly once per completed transition.
    if (!st.running && st.seq > 0 && finishedSeq.current !== st.seq) {
      finishedSeq.current = st.seq;
      onExitedRef.current?.();
    }
  }, [st.running, st.seq]);

  useEffect(() => {
    if (!st.running) return undefined;
    const ms = reduced ? tokenMs('--dur-reduced-fade', 140) : st.direction === 'in' ? tokenMs('--dur-subpage-in', 240) : tokenMs('--dur-subpage-out', 220);
    const seq = st.seq;
    ended.current = { seq, set: new Set() };
    const t = setTimeout(() => finish(seq), ms + FALLBACK_SLACK);
    return () => clearTimeout(t);
  }, [st.running, st.seq, st.direction, reduced, finish]);

  const register = useCallback((id: string, getPane?: () => HTMLElement | null) => {
    lanes.current.set(id, getPane);
    return () => {
      lanes.current.delete(id);
    };
  }, []);
  const laneEnded = useCallback(
    (id: string, seq: number) => {
      if (ended.current.seq !== seq) return;
      ended.current.set.add(id);
      if (lanes.current.size > 0 && Array.from(lanes.current.keys()).every((l) => ended.current.set.has(l))) finish(seq);
    },
    [finish],
  );

  const screenEnded = finish;
  const value = useMemo<Ctx>(
    () => ({ paneKey: st.key, seq: st.seq, direction: st.direction, running: st.running, reduced, openerRef, restoreFocus, register, screenEnded, laneEnded, lanes: lanes.current }),
    [st, reduced, restoreFocus, register, screenEnded, laneEnded],
  );
  return <SubpageCtx.Provider value={value}>{children}</SubpageCtx.Provider>;
}

/** Internal: what PlatformShell needs to slide the whole screen on a phone. Null outside a SubpageTransition. */
export function useSubpageShell(): { running: boolean; direction: SubpageDirection; reduced: boolean; seq: number; screenEnded: (seq: number) => void } | null {
  const c = useContext(SubpageCtx);
  return c ? { running: c.running, direction: c.direction, reduced: c.reduced, seq: c.seq, screenEnded: c.screenEnded } : null;
}
/** Internal: PlatformShell sets this true when it has a place column, so on a phone each region is a whole screen. */
export const SubpageScreensContext = createContext(false);

export interface SubpageLaneProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The side this lane's detail pane comes from. Column: 'left'. Sheet: 'right' (default). */
  from?: SubpageSide;
  /** The host surface behind the lane, so panes are opaque and never show through while sliding. 'frame' for the place column, 'surface' (default) for the sheet. */
  surface?: 'surface' | 'frame';
  /** Move focus into this lane's new pane (its `[data-subpage-focus]`, `h1`, then `h2`) when a transition starts. Default true. With several lanes the last one wins; set false on the others. */
  focus?: boolean;
  /** The pane scrolls (and its scroll position is restored on return). Set false when the content scrolls itself; mark that element `data-subpage-scroll`. Default true. */
  scroll?: boolean;
  /** The pane for the current `paneKey`. */
  children?: ReactNode;
}

interface Leaving {
  key: string;
  node: ReactNode;
}

// Literal class lookups so Tailwind sees every utility (keyframes and easing come from generate.ts).
const enterIn: Record<SubpageSide, string> = { right: 'animate-sub-in-r', left: 'animate-sub-in-l' };
const driftOut: Record<SubpageSide, string> = { right: 'animate-sub-drift-l', left: 'animate-sub-drift-r' };
const leaveOut: Record<SubpageSide, string> = { right: 'animate-sub-out-r', left: 'animate-sub-out-l' };
const backIn: Record<SubpageSide, string> = { right: 'animate-sub-back-l', left: 'animate-sub-back-r' };

function setInert(el: HTMLElement | null) {
  if (!el) return;
  el.setAttribute('inert', '');
}

/**
 * One lane of a subpage transition: a clipped box that holds the current pane and, while a transition runs, the old one.
 * `className` is merged underneath the lane's layout, so a caller can colour or space it but not move or unclip it.
 * Must sit inside `SubpageTransition`.
 *
 * Note: while a pane slides it carries a transform, so a `position: fixed` child is positioned against the pane, not the viewport,
 * until the transition ends. Portal overlays (Toaster, dialogs, menus) to `body`; sticky bars inside the pane are fine.
 * On a phone, inside `PlatformShell` with a place column, the shell slides the whole screen (region) and the lanes only choose which
 * content each region shows during the slide.
 */
export function SubpageLane({ from = 'right', surface = 'surface', focus = true, scroll = true, className, children, ...rest }: SubpageLaneProps) {
  const ctx = useContext(SubpageCtx);
  if (!ctx) throw new Error('SubpageLane must be rendered inside SubpageTransition');
  const curRef = useRef<HTMLDivElement | null>(null);
  const id = useId();
  const { register } = ctx;
  useEffect(() => register(id, () => curRef.current), [register, id]);
  const screens = useContext(SubpageScreensContext);
  const phone = useMatchMedia(SUBPAGE_PHONE);
  // Phone with a place column: each shell region is a whole screen and the shell slides it; the lanes only show the right content.
  const screenMode = screens && phone;

  const [lane, setLane] = useState<{ seq: number; leaving: Leaving | null }>({ seq: ctx.seq, leaving: null });
  const latest = useRef<{ key: string; node: ReactNode }>({ key: ctx.paneKey, node: children });
  if (lane.seq !== ctx.seq) {
    // A new transition: keep the previous pane's content (same key, so React keeps its DOM, focus and scroll).
    setLane({ seq: ctx.seq, leaving: ctx.reduced ? null : { key: latest.current.key, node: latest.current.node } });
  }
  useLayoutEffect(() => {
    latest.current = { key: ctx.paneKey, node: children };
  });

  const running = ctx.running && lane.seq === ctx.seq;
  const leaving = running ? lane.leaving : null;
  const dir = ctx.direction;

  // Scroll: remembered per pane key, restored when that pane (re)mounts.
  const scrolls = useRef(new Map<string, number>());
  const restored = useRef(new WeakSet<HTMLElement>());
  const scroller = (pane: HTMLElement) => pane.querySelector<HTMLElement>('[data-subpage-scroll]') ?? pane;
  const paneRef = (key: string) => (el: HTMLElement | null) => {
    if (!el || restored.current.has(el)) return;
    restored.current.add(el);
    const top = scrolls.current.get(key);
    if (top) scroller(el).scrollTop = top;
  };
  const onScrollCapture = (key: string) => (e: UIEvent<HTMLElement>) => {
    const t = e.target as HTMLElement;
    if (t === e.currentTarget || t.hasAttribute('data-subpage-scroll')) scrolls.current.set(key, t.scrollTop);
  };

  // The browser resets a pane's scroll when it becomes inert and animated: put the leaving pane back where it was.
  const leavingRef = useRef<HTMLDivElement | null>(null);
  const leavingKey = leaving?.key;
  useLayoutEffect(() => {
    const el = leavingRef.current;
    const top = leavingKey ? scrolls.current.get(leavingKey) : undefined;
    if (el && top) scroller(el).scrollTop = top;
  }, [leavingKey]);

  // A pane that was leaving and came back (rapid Back/Forward) is a reused node whose scroll the browser reset.
  const curKey = ctx.paneKey;
  useLayoutEffect(() => {
    const el = curRef.current;
    const top = scrolls.current.get(curKey);
    if (el && top && scroller(el).scrollTop === 0) scroller(el).scrollTop = top;
  }, [curKey]);

  // Focus: the new pane's heading ('in'), or the opener ('out').
  const focusedSeq = useRef(0);
  useLayoutEffect(() => {
    if (!focus || ctx.seq === 0 || focusedSeq.current === ctx.seq || lane.seq !== ctx.seq) return;
    focusedSeq.current = ctx.seq;
    const pane = curRef.current;
    if (!pane) return;
    // Only move focus that is lost or sits in the lanes (the pane that is going away). Never steal it from where the user put it.
    const act = document.activeElement;
    const inLanes = !!act && Array.from(ctx.lanes.values()).some((get) => get?.()?.closest('[data-subpage-lane]')?.contains(act));
    if (act && act !== document.body && act !== document.documentElement && !inLanes && !act.closest('[inert]')) return;
    let target: HTMLElement | null = null;
    if (ctx.direction === 'out') {
      target = ctx.restoreFocus?.() ?? null;
      // The opener may sit in another lane (on a phone the visible list is the place column).
      const o = ctx.openerRef.current;
      if (!target && o) for (const get of ctx.lanes.values()) { const root = get?.(); const f = root && findOpener(root, o); if (f) { f.focus({ preventScroll: true }); if (document.activeElement === f) { target = f; break; } } }
    }
    target ??= pane.querySelector<HTMLElement>('[data-subpage-focus]') ?? pane.querySelector<HTMLElement>('h1') ?? pane.querySelector<HTMLElement>('h2') ?? pane;
    if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (document.activeElement !== target && target !== pane) {
      // Hidden or detached opener: fall back to the pane heading.
      const h = pane.querySelector<HTMLElement>('[data-subpage-focus]') ?? pane.querySelector<HTMLElement>('h1') ?? pane;
      if (!h.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(h.tagName)) h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
  });

  const side = from;
  const curAnim = !running
    ? ''
    : ctx.reduced
      ? 'animate-sub-fade'
      : dir === 'in'
        ? cn('z-10', enterIn[side])
        : backIn[side];
  const leaveAnim = dir === 'in' ? driftOut[side] : cn('z-10', leaveOut[side]);

  const showLeavingOnPhone = (from === 'left') === (dir === 'in');
  const phoneLeaving = screenMode && leaving != null && !ctx.reduced;
  const bg = surface === 'frame' ? 'bg-frame max-[640px]:bg-surface' : 'bg-surface';
  const paneBase = cn(bg, 'col-start-1 row-start-1 h-full min-h-0 min-w-0 overscroll-contain', scroll ? 'overflow-y-auto' : 'overflow-hidden');
  const onEnd = (e: React.AnimationEvent<HTMLElement>) => {
    if (e.target === e.currentTarget && running) ctx.laneEnded(id, ctx.seq);
  };
  // The animation that decides "done" is the one that is longest: the entering pane for 'in', the leaving one for 'out'.
  const endsOnCurrent = ctx.reduced || dir === 'in';

  return (
    <div
      {...rest}
      data-subpage-lane={from}
      data-state={running ? 'running' : 'idle'}
      className={cn(
        className,
        'relative grid h-full min-h-0 w-full min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] data-[state=running]:overflow-hidden',
      )}
    >
      {[
        leaving && (
        <div
          key={leaving.key}
          ref={(el) => {
            leavingRef.current = el;
            setInert(el);
            paneRef(leaving.key)(el);
          }}
          aria-hidden="true"
          data-subpage-pane="leaving"
          onAnimationEnd={endsOnCurrent ? undefined : onEnd}
          className={cn(paneBase, 'pointer-events-none', phoneLeaving ? (showLeavingOnPhone ? '' : 'hidden') : leaveAnim)}
        >
          {leaving.node}
        </div>
        ),
        <div
        key={ctx.paneKey}
        ref={(el) => {
          curRef.current = el;
          // A pane that was leaving and came back (rapid Back/Forward) is the same DOM node: make it live again.
          el?.removeAttribute('inert');
          paneRef(ctx.paneKey)(el);
        }}
        data-subpage-pane="current"
        onScrollCapture={onScrollCapture(ctx.paneKey)}
        onAnimationEnd={endsOnCurrent ? onEnd : undefined}
        className={cn(paneBase, screenMode ? (phoneLeaving && showLeavingOnPhone ? 'hidden' : ctx.reduced && running ? 'animate-sub-fade' : '') : curAnim)}
      >
        {children}
      </div>
      ]}
    </div>
  );
}
