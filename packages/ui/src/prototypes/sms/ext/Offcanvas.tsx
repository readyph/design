import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../../index';

export interface OffcanvasProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the panel. */
  label: string;
  /** Slide over everything on a phone (fixed, full screen) instead of over the parent (absolute, 400px). */
  fullScreen?: boolean;
  children: ReactNode;
  className?: string;
}

/** Subpage timing from the tokens: 240ms in, 220ms out. The panel stays mounted this long after `open` turns false. */
const EXIT_MS = 220;

/**
 * Studio-only Offcanvas (NEW): a detail panel that slides in from the right over its positioned parent (the right panel stays mounted underneath,
 * so its tab, scroll and collapsed state are untouched). Stays mounted for the exit animation, Esc and a click outside close it, focus moves in on open
 * and back to the opener on close. Motion is the library's subpage slide (`animate-sub-in-r` / `sub-out-r`); under reduced motion it fades in and just leaves.
 */
export const Offcanvas = forwardRef<HTMLElement, OffcanvasProps>(function Offcanvas({ open, onClose, label, fullScreen, children, className }, ref) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const kept = useRef(children);
  if (open) kept.current = children;
  const root = useRef<HTMLElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (open) {
      setMounted(true); setClosing(false);
      const a = document.activeElement;
      if (a instanceof HTMLElement && a !== document.body && !root.current?.contains(a)) opener.current = a;
      root.current?.focus({ preventScroll: true });
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const t = window.setTimeout(() => {
      setMounted(false); setClosing(false);
      const target = opener.current;
      if (target?.isConnected && (!document.activeElement || document.activeElement === document.body)) target.focus({ preventScroll: true });
    }, EXIT_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (document.querySelector('[role="dialog"],[role="alertdialog"],[role="menu"],[role="listbox"],[aria-modal="true"]')) return;
      closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!mounted) return null;
  return (
    <>
      {!fullScreen && !closing && <div aria-hidden data-offcanvas-scrim className="absolute inset-0 z-30" onClick={() => closeRef.current()} />}
      <aside
        ref={(n) => { root.current = n; if (typeof ref === 'function') ref(n); else if (ref) (ref as { current: HTMLElement | null }).current = n; }}
        tabIndex={-1}
        aria-label={label}
        data-offcanvas=""
        className={cn(
          'flex min-h-0 flex-col overflow-hidden border-l border-border bg-surface text-text outline-0',
          fullScreen ? 'fixed inset-0 z-40 border-l-0' : 'absolute inset-y-0 right-0 z-30 w-[400px] max-w-full',
          closing ? 'animate-sub-out-r motion-reduce:animate-none motion-reduce:opacity-0' : 'animate-sub-in-r motion-reduce:animate-sub-fade',
          className,
        )}
      >
        <div className="min-h-0 flex-1 overflow-auto">{open ? children : kept.current}</div>
      </aside>
    </>
  );
});
