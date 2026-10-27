import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Warning } from '@phosphor-icons/react';
import { focusIfLost } from '../utils/focusIfLost';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';

interface DraftSaveArgs {
  dirty: boolean;
  saving: boolean;
  error?: ReactNode;
  /** How many saved roles this draft takes away. Above zero, Save asks first. */
  removedCount: number;
  save: () => void;
  discard: () => void;
}

export interface DraftSave {
  heading: RefObject<HTMLHeadingElement>;
  saveBtn: RefObject<HTMLButtonElement>;
  actions: RefObject<HTMLDivElement>;
  confirm: boolean;
  setConfirm: (open: boolean) => void;
  trySave: () => void;
  tryDiscard: () => void;
  confirmSave: () => void;
  onCloseAutoFocus: (e: Event) => void;
}

/**
 * The Save / Discard / confirm-removal behaviour and the focus hand-off that RolePicker's two modes share.
 * Save and Discard stay focusable (aria-disabled), so focus is never dropped while they work. When the work is over
 * (saved, discarded, or failed) focus goes to the heading, or back to Save on a failure, but only if the user has
 * not already moved on: `focusIfLost` leaves a focused input, dropdown or link alone.
 */
export function useDraftSave({ dirty, saving, error, removedCount, save, discard }: DraftSaveArgs): DraftSave {
  const [confirm, setConfirm] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const saveBtn = useRef<HTMLButtonElement>(null);
  const actions = useRef<HTMLDivElement>(null);
  const used = useRef(false);
  const complete = useRef(false);
  const toSave = useRef(false);
  const viaDialog = useRef(false);

  const place = () => {
    used.current = false;
    complete.current = false;
    focusIfLost(actions.current, toSave.current ? saveBtn.current : heading.current, { preventScroll: true });
  };
  useLayoutEffect(() => {
    if (!used.current || saving || (dirty && !error)) {
      complete.current = false;
      return;
    }
    complete.current = true;
    toSave.current = dirty;
    // Through the confirm dialog its own focus return runs after this; `onCloseAutoFocus` places focus then.
    if (!viaDialog.current) place();
  }, [dirty, saving, error]);

  return {
    heading,
    saveBtn,
    actions,
    confirm,
    setConfirm,
    trySave: () => {
      if (!dirty || saving) return;
      if (removedCount) return setConfirm(true);
      used.current = true;
      save();
    },
    tryDiscard: () => {
      if (!dirty || saving) return;
      used.current = true;
      discard();
    },
    confirmSave: () => {
      setConfirm(false);
      used.current = true;
      viaDialog.current = true;
      save();
    },
    onCloseAutoFocus: (e) => {
      if (!viaDialog.current) return;
      viaDialog.current = false;
      // Save and remove ran: the dialog's own return to Save would fight us. Place focus once, guarded.
      if (complete.current) {
        e.preventDefault();
        place();
      }
    },
  };
}

export interface DraftFooterProps {
  draft: DraftSave;
  dirty: boolean;
  saving: boolean;
  error?: ReactNode;
  saveLabel: string;
  /** Hide the buttons (read only). The confirm dialog stays closed. */
  hidden?: boolean;
  confirmTitle: ReactNode;
  confirmDescription: ReactNode;
  confirmLabel: string;
}

/** Error alert, Save, Discard, "Unsaved changes" and the removal confirm. */
export function DraftFooter({ draft, dirty, saving, error, saveLabel, hidden, confirmTitle, confirmDescription, confirmLabel }: DraftFooterProps) {
  return (
    <>
      {hidden ? null : (
        <div className="flex flex-col gap-2">
          {error ? (
            <p role="alert" className="m-0 flex items-start gap-2 rounded-card bg-bad-bg px-3 py-2 text-small text-bad-ink">
              <Warning aria-hidden size={14} weight="bold" className="mt-0.5 shrink-0" />
              <span className="min-w-0">{error}</span>
            </p>
          ) : null}
          <div ref={draft.actions} className="flex flex-wrap items-center gap-2">
            <Button
              ref={draft.saveBtn}
              variant="primary"
              onClick={draft.trySave}
              aria-disabled={!dirty || saving || undefined}
              aria-busy={saving || undefined}
              actionBar
              className="aria-disabled:cursor-not-allowed aria-disabled:opacity-70 aria-disabled:hover:bg-accent"
            >
              {saving ? <span aria-hidden className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" /> : null}
              {saving ? 'Saving' : saveLabel}
            </Button>
            <Button
              variant="secondary"
              onClick={draft.tryDiscard}
              aria-disabled={!dirty || saving || undefined}
              actionBar
              className="aria-disabled:cursor-not-allowed aria-disabled:opacity-70 aria-disabled:hover:border-control"
            >
              Discard
            </Button>
            {dirty ? (
              <span className="inline-flex items-center gap-1.5 text-small text-warn-ink">
                <span aria-hidden className="size-2 rounded-full bg-warn-dot" />
                Unsaved changes
              </span>
            ) : null}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={draft.confirm}
        onOpenChange={draft.setConfirm}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        tone="danger"
        onCancel={() => draft.setConfirm(false)}
        onCloseAutoFocus={draft.onCloseAutoFocus}
        onConfirm={draft.confirmSave}
      />
    </>
  );
}
