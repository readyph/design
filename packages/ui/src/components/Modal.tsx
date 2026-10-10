import { type HTMLAttributes, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional trigger element (for uncontrolled use). */
  trigger?: ReactNode;
  /** Prop API: a simple title row. Omit when composing with `Modal.Header`. */
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Prop API: a footer actions row. Omit when composing with `Modal.Footer`. */
  footer?: ReactNode;
  size?: ModalSize;
  /** Hide the default close (×) button. */
  hideClose?: boolean;
  className?: string;
}

const sizes: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

const overlay =
  'fixed inset-0 z-modal bg-overlay data-[state=open]:animate-[ds-fade-in_150ms_ease] data-[state=closed]:animate-[ds-fade-out_150ms_ease] motion-reduce:animate-none';

const content =
  'fixed left-1/2 top-1/2 z-modal flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xl focus:outline-none data-[state=open]:animate-[ds-scale-in_150ms_ease] data-[state=closed]:animate-[ds-scale-out_150ms_ease] motion-reduce:animate-none';

function CloseButton({ className }: { className?: string }) {
  return (
    <Dialog.Close
      className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-base text-ink-subtle hover:bg-surface-muted hover:text-ink',
        focusRing,
        className,
      )}
      aria-label="Close"
    >
      <Icon icon={X} size="md" />
    </Dialog.Close>
  );
}

/**
 * Accessible modal dialog (focus trap, Esc to close) built on Radix Dialog.
 *
 * Two ways to use it:
 * - **Prop API** — pass `title` / `footer` for a quick dialog.
 * - **Composition** — use `Modal.Header`, `Modal.Body`, `Modal.Footer` for full
 *   control of the header / content / footer regions.
 *
 * The project owns the content and the actions.
 */
function ModalRoot({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideClose = false,
  className,
}: ModalProps) {
  const propMode = title != null || description != null || footer != null;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className={overlay} />
        <Dialog.Content className={cn('relative', content, sizes[size], className)}>
          {propMode ? (
            <>
              {(title || !hideClose) && (
                <div className="flex items-start justify-between gap-4 px-5 pt-5">
                  <div className="min-w-0">
                    {title && (
                      <Dialog.Title className="text-base font-semibold text-ink">{title}</Dialog.Title>
                    )}
                    {description && (
                      <Dialog.Description className="mt-1 text-sm text-ink-muted">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  {!hideClose && <CloseButton className="-mr-1" />}
                </div>
              )}
              {children && <div className="overflow-y-auto px-5 py-4 text-sm text-ink">{children}</div>}
              {footer && (
                <div className="flex items-center justify-end gap-2 px-5 py-3">
                  {footer}
                </div>
              )}
            </>
          ) : (
            <>
              {!hideClose && <CloseButton className="absolute right-3 top-3 z-10" />}
              {children}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Header region (provides the accessible dialog title). Use in composition mode. */
export function ModalHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-4', className)} {...rest}>
      <Dialog.Title className="text-base font-semibold text-ink">{children}</Dialog.Title>
    </div>
  );
}

/** Scrollable content region. */
export function ModalBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('overflow-y-auto px-5 py-4 text-sm text-ink', className)} {...rest}>
      {children}
    </div>
  );
}

/** Footer actions region (right-aligned). */
export function ModalFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-end gap-2 px-5 py-3', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});
