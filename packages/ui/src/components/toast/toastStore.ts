import { useSyncExternalStore } from 'react';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface ToastAction {
  /** Button text. "Undo" for a reverted write. */
  label: string;
  /** Runs once, then the toast closes. */
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  /** Bold lead-in, shown before the message on the same line. */
  title?: string;
  /** The message (one line). */
  description?: string;
  tone: ToastTone;
  /** Visible time in ms (default 5000). 0 keeps it until dismissed. */
  duration: number;
  /** Optional action (Undo). */
  action?: ToastAction;
  /** Written by Leda: shows the 16px Leda tile. */
  leda: boolean;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
  action?: ToastAction;
  leda?: boolean;
}

/** Default visible time (`--dur-toast`). */
export const TOAST_DURATION = 5000;

/**
 * One toast at a time (C11): a new toast replaces the one on screen. Undo reverts "the last write",
 * so an older toast's Undo has nothing left to revert and is dropped rather than queued.
 */
let toasts: ToastMessage[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return toasts;
}

let counter = 0;

export function addToast(opts: ToastOptions | string): string {
  const o = typeof opts === 'string' ? { description: opts } : opts;
  const id = `toast-${++counter}`;
  const msg: ToastMessage = {
    id,
    title: o.title,
    description: o.description,
    tone: o.tone ?? 'info',
    duration: o.duration ?? TOAST_DURATION,
    action: o.action,
    leda: o.leda ?? false,
  };
  toasts = [msg];
  emit();
  return id;
}

export function dismissToast(id: string) {
  if (!toasts.some((t) => t.id === id)) return;
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function clearToasts() {
  if (toasts.length === 0) return;
  toasts = [];
  emit();
}

/** Read the live toast list (at most one). Used by `Toaster`. */
export function useToasts(): ToastMessage[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

type Rest = Omit<ToastOptions, 'tone' | 'description'>;

/** Imperative API: call from anywhere, no hook required. */
export const toast = Object.assign(
  (opts: ToastOptions | string) => addToast(opts),
  {
    info: (description: string, opts?: Rest) => addToast({ ...opts, description, tone: 'info' }),
    success: (description: string, opts?: Rest) => addToast({ ...opts, description, tone: 'success' }),
    warning: (description: string, opts?: Rest) => addToast({ ...opts, description, tone: 'warning' }),
    error: (description: string, opts?: Rest) => addToast({ ...opts, description, tone: 'error' }),
    /** A saved write with Undo: `toast.undo('System settings saved.', revert)`. */
    undo: (description: string, onUndo: () => void, opts?: Omit<Rest, 'action'> & { tone?: ToastTone }) =>
      addToast({ tone: 'success', ...opts, description, action: { label: 'Undo', onClick: onUndo } }),
    dismiss: dismissToast,
    clear: clearToasts,
  },
);

/** Hook form for ergonomics in components. */
export function useToast() {
  return toast;
}
