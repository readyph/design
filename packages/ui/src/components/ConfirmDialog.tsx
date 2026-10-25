import { useRef, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Trash, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { Modal } from './Modal';
import { Button, type ButtonVariant } from './Button';

export interface ConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Question, e.g. "Delete this topic?". */
  title: ReactNode;
  /** The one plain consequence line (muted), e.g. "This cannot be undone." */
  description?: ReactNode;
  /** The item being acted on, shown in a tinted box. Omit for a plain question. */
  name?: ReactNode;
  /** Optional one-line context under the name, e.g. "Custom topic · changed Tue". */
  context?: ReactNode;
  /** Leading mark in the name box: a Phosphor icon (shown in the bad colour) or any node such as `<PlatformLogo decorative />`. Defaults to a trash icon on `danger`. */
  icon?: PhosphorIcon;
  /** Replaces `icon` with any node (platform logo, avatar). */
  iconNode?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual weight of the confirm button. */
  tone?: 'primary' | 'danger';
  /** Called when the user confirms. The project performs the action. */
  onConfirm?: () => void;
  /** Called for Cancel, Esc and the backdrop. */
  onCancel?: () => void;
  /** Keep the dialog open and show a spinner (async confirm). Cancel, Esc and the backdrop are ignored meanwhile. */
  loading?: boolean;
  /** Extra content under the consequence line. */
  children?: ReactNode;
}

/**
 * Delete / destructive confirmation (C12) on `Modal`: 420px, `role="alertdialog"`, focus starts on Cancel,
 * Esc / Cancel / backdrop cancel and return focus to the opener. Phone: centred, 44px full-width buttons.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  name,
  context,
  icon,
  iconNode,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  onCancel,
  loading = false,
  children,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmVariant: ButtonVariant = tone === 'danger' ? 'danger' : 'primary';
  const Mark = icon ?? (tone === 'danger' ? Trash : undefined);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // A running action cannot be cancelled by Esc or the backdrop.
      if (loading) return;
      onCancel?.();
    }
    onOpenChange?.(next);
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      role="alertdialog"
      size="confirm"
      hideClose
      initialFocus={cancelRef}
      title={title}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" actionBar onClick={() => handleOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} actionBar onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {name != null && (
        <div className="mb-3 flex items-center gap-3 rounded-card border border-border bg-raised px-3 py-2.5">
          {(iconNode || Mark) && (
            <span aria-hidden className="grid shrink-0 place-items-center text-bad">
              {iconNode ?? (Mark && <Mark size={20} />)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="break-words text-ui font-medium text-text">{name}</div>
            {context && <div className="mt-0.5 break-words text-[12px] leading-4 text-muted">{context}</div>}
          </div>
        </div>
      )}
      {description && <Dialog.Description className="break-words text-body text-muted">{description}</Dialog.Description>}
      {children}
    </Modal>
  );
}
