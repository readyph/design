import { forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes } from 'react';
import { cn, focusRing } from '../utils/cn';
import { LedaMark } from './Leda';

/** Timings from handover 4.7. */
export const ASK_LEDA_TIMING = {
  /** One halo pass. */
  pass: 2800,
  /** First pass after load (or after the rhythm restarts). */
  first: 1200,
  /** Gap between scheduled passes. */
  every: 17000,
  /** Idle time before one extra pass. */
  idle: 10000,
  /** The B Scan plays one pass (stops just before its loop restarts). */
  scan: 2200,
} as const;

export type AskLedaOpenSource = 'click' | 'shortcut' | 'slash';

export interface AskLedaBarProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children' | 'type' | 'aria-label'> {
  /** `bar`: 320px / 34px in the sheet bar (a 44px icon button at 640px and below). `overview`: centred 560px / 44px (full width when narrower). `field`: full width, 44px, 15px text, with the halo on a phone (Platforms column, prototype `.pask`). */
  variant?: 'bar' | 'overview' | 'field';
  /** Page or platform short name: placeholder becomes "Ask Leda about {scope}". */
  scope?: string;
  /** Opens the palette. Called on click, on Cmd/Ctrl+K and on "/" (the palette itself is a separate component). */
  onOpen?: (source: AskLedaOpenSource) => void;
  /** Pause the halo and Scan (pass `true` while the palette is open); the rhythm restarts when it closes. */
  paused?: boolean;
  /** `hold` freezes the halo and Scan (no shimmer, ever). */
  shine?: 'auto' | 'hold';
  /** Listen for Cmd/Ctrl+K and "/" on the document. Keep it on for one bar per page. */
  shortcuts?: boolean;
  /** Text of the shortcut hint. Default: Cmd K on Apple platforms, "Ctrl K" elsewhere. */
  shortcutLabel?: string;
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '');

function isTyping(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

/**
 * The shimmer rhythm: first pass 1.2s after mount, then every 17s, plus once after 10s without
 * activity. Stops (and restarts from the first pass) while `enabled` is false or the tab is hidden.
 */
export function useAskLedaShine(enabled: boolean) {
  const [pass, setPass] = useState(0);
  const [halo, setHalo] = useState(false);
  const [scan, setScan] = useState(false);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;
    let first: ReturnType<typeof setTimeout> | undefined;
    let every: ReturnType<typeof setInterval> | undefined;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let end: ReturnType<typeof setTimeout> | undefined;
    let scanEnd: ReturnType<typeof setTimeout> | undefined;
    let playing = false;
    let running = false;

    const play = () => {
      if (playing) return;
      playing = true;
      setPass((p) => p + 1);
      setHalo(true);
      setScan(true);
      end = setTimeout(() => { playing = false; setHalo(false); }, ASK_LEDA_TIMING.pass);
      scanEnd = setTimeout(() => setScan(false), ASK_LEDA_TIMING.scan);
    };
    const armIdle = () => {
      clearTimeout(idle);
      idle = setTimeout(play, ASK_LEDA_TIMING.idle);
    };
    const stop = () => {
      running = false;
      clearTimeout(first); clearInterval(every); clearTimeout(idle); clearTimeout(end); clearTimeout(scanEnd);
      playing = false;
      setHalo(false);
      setScan(false);
    };
    const start = () => {
      if (running) return;
      running = true;
      first = setTimeout(() => {
        play();
        every = setInterval(play, ASK_LEDA_TIMING.every);
      }, ASK_LEDA_TIMING.first);
      armIdle();
    };
    const onVisibility = () => (document.visibilityState === 'hidden' ? stop() : start());
    const onActivity = () => { if (running) armIdle(); };
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'scroll'] as const;

    if (document.visibilityState !== 'hidden') start();
    document.addEventListener('visibilitychange', onVisibility);
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true, capture: true }));
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      events.forEach((e) => window.removeEventListener(e, onActivity, { capture: true }));
    };
  }, [enabled]);

  return { pass, halo, scan };
}

const VARIANT = {
  bar: {
    outer: 'inline-flex w-auto max-w-full shrink-0 basis-auto',
    wrap: 'w-leda-w shrink-0 max-[640px]:w-[var(--ctl-touch)]',
    bar: 'text-ui leading-5 h-[var(--ctl-leda-bar)] gap-2.5 pl-2.5 pr-1.5 max-[640px]:h-[var(--ctl-touch)] max-[640px]:justify-center max-[640px]:border-transparent max-[640px]:bg-transparent max-[640px]:px-0',
    mark: 20,
  },
  overview: {
    outer: 'flex w-full max-w-leda-w-overview shrink basis-auto',
    wrap: 'w-full max-w-leda-w-overview',
    bar: 'text-body leading-5 h-[var(--ctl-touch)] gap-3 pl-3.5 pr-2 max-[640px]:gap-2.5 max-[640px]:pl-3 max-[640px]:pr-3 max-[640px]:text-[15px]',
    mark: 22,
  },
  field: {
    outer: 'flex w-full shrink basis-auto',
    wrap: 'w-full',
    bar: 'h-[var(--ctl-touch)] gap-2.5 px-3 text-[15px]',
    mark: 22,
  },
} as const;

/**
 * Ask Leda bar (C6, replaces `LedaLauncher`). A real button that asks the page to open the
 * command palette; the palette and conversation panel are separate components.
 * Leda colours (`--ld-*`, `--hl*`) paint only the mark and the halo, never the bar.
 */
export const AskLedaBar = forwardRef<HTMLButtonElement, AskLedaBarProps>(function AskLedaBar(
  { variant = 'bar', scope, onOpen, paused = false, shine = 'auto', shortcuts = true, shortcutLabel, className, ...rest },
  ref,
) {
  const v = VARIANT[variant];
  const placeholder = scope ? `Ask Leda about ${scope}` : 'Ask Leda or tell it what to do';
  const [kbd, setKbd] = useState(shortcutLabel ?? '⌘K');
  useEffect(() => { setKbd(shortcutLabel ?? (isMac() ? '⌘K' : 'Ctrl K')); }, [shortcutLabel]);

  const { pass, halo, scan } = useAskLedaShine(shine === 'auto' && !paused);

  const open = useRef(onOpen);
  open.current = onOpen;
  useEffect(() => {
    if (!shortcuts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open.current?.('shortcut');
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e.target)) {
        e.preventDefault();
        open.current?.('slash');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shortcuts]);

  return (
    // The caller's className lands on an outer box (margin, placement); the bar's own box is fixed inside it.
    <span className={cn(className, v.outer)}>
    <span data-ask-leda={variant} className={cn('relative isolate inline-flex rounded-control', v.wrap)}>
      {halo && (
        <span key={`g${pass}`} aria-hidden="true" data-halo="glow" className={cn('pointer-events-none absolute -inset-[3px] overflow-hidden rounded-control blur-[9px] animate-halo-glow [--halo-peak:.75] dark:[--halo-peak:.8] motion-reduce:hidden', variant === 'bar' && 'max-[640px]:hidden')}>
          <span className="absolute left-1/2 top-1/2 aspect-square w-[200%] bg-halo animate-halo-spin" />
        </span>
      )}
      <button
        ref={ref}
        type="button"
        aria-label={placeholder}
        onClick={() => open.current?.('click')}
        {...rest}
        className={cn(
          'relative z-[1] flex w-full items-center gap-2.5 rounded-control border border-control bg-surface pl-2.5 pr-1.5 text-left leading-5 text-text transition-colors duration-hover hover:border-accent hover:[&_[data-ph]]:text-text motion-reduce:transition-none',
          focusRing,
          v.bar,
        )}
      >
        <span className="inline-flex shrink-0 items-center">
          <LedaMark key={pass} size={v.mark} effect="scan" active={scan} once decorative className={cn(variant === 'bar' && 'max-[640px]:h-6 max-[640px]:w-6')} />
        </span>
        <span data-ph className={cn('min-w-0 flex-1 truncate text-muted', variant === 'bar' && 'max-[640px]:hidden')} aria-hidden="true">{placeholder}</span>
        <kbd aria-hidden="true" className={cn('inline-block h-4 min-w-[18px] shrink-0 rounded-[3px] bg-raised-2 px-1 text-center font-sans text-tiny leading-4 text-text max-[640px]:hidden')}>{kbd}</kbd>
      </button>
      {halo && (
        <span key={`r${pass}`} aria-hidden="true" data-halo="ring" className={cn('pointer-events-none absolute -inset-px z-[2] overflow-hidden rounded-control p-[2px] [mask-image:linear-gradient(#000_0_0),linear-gradient(#000_0_0)] [mask-clip:content-box,border-box] [mask-composite:exclude] dark:p-[1.5px] animate-halo-fade motion-reduce:animate-halo-fade-reduced', variant === 'bar' && 'max-[640px]:hidden')}>
          <span className="absolute left-1/2 top-1/2 aspect-square w-[200%] bg-halo animate-halo-spin motion-reduce:animate-none motion-reduce:[transform:translate(-50%,-50%)_rotate(140deg)]" />
        </span>
      )}
    </span>
    </span>
  );
});
