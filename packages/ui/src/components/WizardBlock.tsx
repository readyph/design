import type { ReactNode } from 'react';
import { Button } from './Button';

export const editLink = 'inline-flex min-h-8 items-center gap-1 text-[13px] font-semibold text-accent underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:min-h-11';

/** Label / value row shared by both steps: 112px label column, value right beside it (12px gap), both vertically centred on a 40px control line (stacked on a phone). */
export const Row = ({ k, v }: { k: string; v: ReactNode }) => (
  <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 py-1 text-[14px] max-[640px]:grid-cols-1 max-[640px]:gap-0"><dt className="flex min-h-10 items-center text-muted max-[640px]:min-h-0 max-[640px]:py-1">{k}</dt><dd className="min-h-10 min-w-0 content-center max-[640px]:min-h-0 max-[640px]:py-1">{v}</dd></div>
);

/**
 * Studio-only WizardBlock (NEW, revision 6): ONE ruled block used by both wizard steps so they look the same.
 * `open`: the controls are always shown (step 1, and the review's Schedule block). Otherwise it shows `children` (the review) with an Edit link that swaps in `edit` with Done / Cancel.
 * `summary` is a one-line value in the header, visible while read-only or editing.
 */
export function WizardBlock({ id, title, hint, summary, action, open = false, editing = false, canDone = true, onEdit, onDone, onCancel, edit, children }: {
  id: string; title: string; hint?: string; summary?: ReactNode; action?: ReactNode; open?: boolean; editing?: boolean; canDone?: boolean;
  onEdit?: () => void; onDone?: () => void; onCancel?: () => void; edit?: ReactNode; children?: ReactNode;
}) {
  return (
    <section aria-label={title} data-block={id} className="border-t border-rule py-6 first:border-t-0 first:pt-0">
      <div className="mb-3 flex min-h-8 items-center justify-between gap-4">
        <h3 className="min-w-0 text-[15px] font-semibold">{title}{hint && <span className="ml-2 text-[13px] font-normal text-muted">{hint}</span>}</h3>
        <div className="flex min-w-0 items-center gap-4">
          {summary && <p className="min-w-0 truncate text-[13px] tabular-nums text-muted max-[640px]:hidden">{summary}</p>}
          {!open && !editing && (action ?? <button type="button" className={editLink} onClick={onEdit} aria-label={`Edit ${title}`}>Edit</button>)}
        </div>
      </div>
      {summary && <p className="-mt-2 mb-3 text-[13px] tabular-nums text-muted min-[641px]:hidden">{summary}</p>}
      {open ? children : editing ? (
        <div>
          {edit}
          <div className="mt-4 flex items-center gap-3">
            <Button variant="primary" disabled={!canDone} onClick={onDone}>Done</Button>
            <Button variant="text" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      ) : children}
    </section>
  );
}
