import { useEffect, useState, type ReactNode } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Studio-only unsaved-change guard (NEW): wrap any "leave this sheet" action. Clean: it runs at once. Edited: a confirm asks first,
 * with Keep editing as the default focus. Used by the car sheet and the Edit customer sheet so both behave the same.
 */
export function useDirtyGuard(dirty: boolean, register?: (g: ((leave: () => void) => void) | null) => void): { guard: (leave?: () => void) => void; node: ReactNode } {
  const [pending, setPending] = useState<(() => void) | null>(null);
  const guard = (leave?: () => void) => { if (!leave) return; if (dirty) setPending(() => leave); else leave(); };
  // The host (phone top bar, Offcanvas backdrop and Esc) leaves through the same guard.
  useEffect(() => { register?.((leave) => guard(leave)); return () => register?.(null); });
  const node = (
    <ConfirmDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)} title="Discard your changes?" description="What you typed here has not been saved."
      confirmLabel="Discard changes" cancelLabel="Keep editing" tone="danger" onCancel={() => setPending(null)} onConfirm={() => { const f = pending; setPending(null); f?.(); }} />
  );
  return { guard, node };
}
