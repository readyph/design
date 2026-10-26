import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Warning, WarningOctagon, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn } from '../../utils/cn';
import { LedaMark } from '../Leda';
import { dismissToast, useToasts, type ToastMessage, type ToastTone } from './toastStore';

export interface ToasterProps {
  /**
   * What the toast anchors to: a CSS selector, an element, or a ref. Default: the sheet of `PlatformShell` (`[data-shell="sheet"]`, else `main`).
   * Desktop: bottom-left of that element (24px in, 16px up). Phone (640px and below): a full-width bar above the
   * shell's bottom nav (`[data-shell="phone-nav"]`; other `<nav>` elements are ignored). With no anchor on the page it sits 16px from the viewport corner.
   */
  anchor?: string | HTMLElement | RefObject<HTMLElement | null>;
  /** Merged under the component classes: add a margin or colour, it cannot move the toast. */
  className?: string;
}

/** Shortest time left after the pointer or focus leaves (WCAG 2.2.1: never snap shut on the way out). */
const MIN_RESUME = 2000;
const PAD = 24;
const GAP = 16;
const PHONE_GAP = 8;
const PHONE = '(max-width: 640px)';

const toneIcon: Partial<Record<ToastTone, PhosphorIcon>> = {
  warning: Warning,
  error: WarningOctagon,
};

function resolve(anchor: ToasterProps['anchor']): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  if (anchor == null) return document.querySelector<HTMLElement>('[data-shell="sheet"]') ?? document.querySelector('main');
  if (typeof anchor === 'string') return document.querySelector<HTMLElement>(anchor);
  if ('current' in anchor) return anchor.current;
  return anchor;
}

const shown = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

/**
 * Place the toast from the shell's real geometry. A fixed element inside the sheet would be
 * positioned against the sheet (it is a container), so the Toaster lives in `document.body`
 * and reads the sheet and the phone nav with `getBoundingClientRect`.
 */
function place(el: HTMLElement, anchor: ToasterProps['anchor']) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const phone = window.matchMedia?.(PHONE).matches ?? false;
  let x = GAP;
  let b = GAP;
  let w = Math.min(620, vw - 2 * GAP);
  if (phone) {
    // Only the shell's own bottom nav: breadcrumbs and other <nav> landmarks must not capture the toast.
    const nav = Array.from(document.querySelectorAll('[data-shell="phone-nav"]')).find(shown);
    x = PHONE_GAP;
    w = vw - 2 * PHONE_GAP;
    b = nav ? vh - nav.getBoundingClientRect().top + PHONE_GAP : GAP;
  } else {
    const a = resolve(anchor);
    if (a && shown(a)) {
      const r = a.getBoundingClientRect();
      x = r.left + PAD;
      b = vh - r.bottom + GAP;
      w = Math.max(240, Math.min(620, r.right - x - GAP));
    }
  }
  // The Leda conversation panel (C8, `data-leda-panel`) is an overlay on the right of the sheet: keep clear of it.
  // Desktop: the toast ends 16px before the panel. Phone: the panel is full screen, so the toast pins under its 48px header.
  const panel = Array.from(document.querySelectorAll('[data-leda-panel]')).find(shown);
  if (panel && phone) {
    el.dataset.top = '';
    el.style.setProperty('--toast-t', `${Math.round(panel.getBoundingClientRect().top + 48 + PHONE_GAP)}px`);
  } else {
    delete el.dataset.top;
    if (panel) w = Math.max(240, Math.min(w, panel.getBoundingClientRect().left - GAP - x));
  }
  el.style.setProperty('--toast-x', `${Math.round(x)}px`);
  el.style.setProperty('--toast-b', `${Math.round(b)}px`);
  el.style.setProperty('--toast-w', `${Math.round(w)}px`);
}

/**
 * Toast with Undo (C11). Mount `Toaster` once near the app root, then call `toast.*` anywhere.
 *
 * - One toast at a time, bottom-left of the sheet (phone: above the bottom nav). A new toast replaces the one showing.
 * - 5000ms, paused while the pointer is over it or focus is inside it, then at least 2s more. Esc closes it.
 * - The wrapper is a permanent `role="status"` (polite) region, so each new toast is announced once.
 * - Warning and error get a small icon (the surface is ink, so the shape carries the tone); success and info are plain.
 * - Ink surface (`bg-text`, `text-surface`) so it inverts with the theme; 13px, 5px radius, float shadow; optional Leda tile.
 * - One line on desktop (truncated with a tooltip; the live region still reads it all); two lines on phone.
 */
export function Toaster({ anchor, className }: ToasterProps) {
  const toasts = useToasts();
  const current = toasts[0];
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const layout = useCallback(() => {
    if (ref.current) place(ref.current, anchor);
  }, [anchor]);

  // Re-measure when a toast appears, and whenever the window or the anchor changes size.
  useLayoutEffect(() => {
    if (mounted && current) layout();
  }, [mounted, current?.id, layout]);
  useEffect(() => {
    if (!mounted || !current) return;
    window.addEventListener('resize', layout);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(layout) : null;
    const a = resolve(anchor);
    if (ro && a) ro.observe(a);
    return () => {
      window.removeEventListener('resize', layout);
      ro?.disconnect();
    };
  }, [mounted, current?.id, anchor, layout]);

  if (!mounted) return null;
  return createPortal(
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        className,
        'pointer-events-none fixed z-[60] left-[var(--toast-x,16px)] bottom-[var(--toast-b,16px)] data-[top]:bottom-auto data-[top]:top-[var(--toast-t,56px)] w-[var(--toast-w,620px)] max-w-[calc(100vw-16px)]',
      )}
    >
      {current && <ToastItem key={current.id} toast={current} />}
    </div>,
    document.body,
  );
}

function ToastItem({ toast: t }: { toast: ToastMessage }) {
  const [entered, setEntered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  const left = useRef(t.duration);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hover = useRef(false);
  const focus = useRef(false);

  const stop = useCallback(() => {
    if (timer.current === undefined) return;
    clearTimeout(timer.current);
    timer.current = undefined;
    left.current = Math.max(MIN_RESUME, left.current - (Date.now() - startedAt.current));
  }, []);
  const start = useCallback(() => {
    if (t.duration === 0 || timer.current !== undefined || hover.current || focus.current) return;
    startedAt.current = Date.now();
    timer.current = setTimeout(() => {
      timer.current = undefined;
      dismissToast(t.id);
    }, left.current);
  }, [t.duration, t.id]);

  useEffect(() => {
    start();
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => {
      clearTimeout(timer.current);
      timer.current = undefined;
      cancelAnimationFrame(raf);
    };
  }, [start]);

  // Esc closes it when focus is on it, or when nothing else (dialog, menu) is claiming Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const inside = rootRef.current?.contains(document.activeElement);
      if (!inside && document.querySelector('[role="dialog"],[role="menu"],[role="listbox"],[aria-modal="true"]')) return;
      dismissToast(t.id);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [t.id]);

  const pause = (flag: typeof hover, on: boolean) => {
    flag.current = on;
    if (on) stop();
    else start();
  };

  const ToneIcon = toneIcon[t.tone];
  const text = [t.title, t.description].filter(Boolean).join(' ');

  return (
    <div
      ref={rootRef}
      onPointerEnter={() => pause(hover, true)}
      onPointerLeave={() => pause(hover, false)}
      onFocus={() => pause(focus, true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) pause(focus, false);
      }}
      className={cn(
        'pointer-events-auto flex w-fit max-w-full items-center gap-2 rounded-control bg-text px-[14px] py-2 text-ui text-surface shadow-float',
        'max-[640px]:min-h-[44px] max-[640px]:w-full max-[640px]:py-0',
        'transition-[opacity,transform] duration-hover ease-out motion-reduce:transition-none',
        entered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100',
      )}
    >
      {t.leda && <LedaMark tile size={16} label="Leda" className="shrink-0" />}
      {ToneIcon && <ToneIcon aria-hidden weight="fill" size={16} className="shrink-0" />}
      <span
        title={text}
        className="min-w-0 truncate max-[640px]:line-clamp-2 max-[640px]:whitespace-normal max-[640px]:my-2 max-[640px]:[overflow-wrap:anywhere]"
      >
        {t.title && <span className="font-medium">{t.title} </span>}
        {t.description}
      </span>
      {t.action && (
        <button
          type="button"
          onClick={() => {
            if (fired.current) return;
            fired.current = true;
            dismissToast(t.id);
            t.action!.onClick();
          }}
          className={cn(
            '-my-1 shrink-0 rounded-chip px-2 py-1 font-medium underline underline-offset-2',
            'hover:no-underline max-[640px]:min-h-[44px] max-[640px]:min-w-[44px]',
            'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface',
          )}
        >
          {t.action.label}
        </button>
      )}
    </div>
  );
}
