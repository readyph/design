import { type HTMLAttributes, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';

export interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  /** Prop API: a simple title row. Omit when composing with `OffCanvas.Header`. */
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Prop API: a footer actions row. Omit when composing with `OffCanvas.Footer`. */
  footer?: ReactNode;
  side?: 'right' | 'left';
  width?: string;
  hideClose?: boolean;
  className?: string;
}

/** Alias type — `OffCanvas` and `Drawer` are the same component. */
export type OffCanvasProps = DrawerProps;

const overlay =
  'fixed inset-0 z-drawer bg-overlay data-[state=open]:animate-[ds-fade-in_150ms_ease] data-[state=closed]:animate-[ds-fade-out_150ms_ease] motion-reduce:animate-none';

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
 * An off-canvas side panel built on Radix Dialog (focus trap, Esc to close).
 * Exported as both `Drawer` and `OffCanvas`.
 *
 * Two ways to use it:
 * - **Prop API** — pass `title` / `footer` for a quick panel.
 * - **Composition** — use `OffCanvas.Header`, `OffCanvas.Body`, `OffCanvas.Footer`
 *   for full control of the header / content / footer regions.
 */
function DrawerRoot({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  side = 'right',
  width = '22rem',
  hideClose = false,
  className,
}: DrawerProps) {
  const propMode = title != null || description != null || footer != null;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className={overlay} />
        <Dialog.Content
          style={{ width }}
          className={cn(
            'fixed inset-y-0 z-drawer flex max-w-[calc(100vw-2rem)] flex-col border-border bg-surface shadow-xl focus:outline-none motion-reduce:animate-none',
            side === 'right'
              ? 'right-0 border-l data-[state=open]:animate-[ds-slide-in-right_200ms_ease] data-[state=closed]:animate-[ds-slide-out-right_200ms_ease]'
              : 'left-0 border-r data-[state=open]:animate-[ds-slide-in-left_200ms_ease] data-[state=closed]:animate-[ds-slide-out-left_200ms_ease]',
            className,
          )}
        >
          {propMode ? (
            <>
              {(title || !hideClose) && (
                <div className="flex items-start justify-between gap-4 px-5 py-4">
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
              <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-ink">{children}</div>
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
export function OffCanvasHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-4', className)} {...rest}>
      <Dialog.Title className="text-base font-semibold text-ink">{children}</Dialog.Title>
    </div>
  );
}

/** Scrollable content region (grows to fill the panel). */
export function OffCanvasBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-5 py-4 text-sm text-ink', className)} {...rest}>
      {children}
    </div>
  );
}

/** Footer actions region (right-aligned). */
export function OffCanvasFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-end gap-2 px-5 py-3', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

const parts = {
  Header: OffCanvasHeader,
  Body: OffCanvasBody,
  Footer: OffCanvasFooter,
};

export const Drawer = Object.assign(DrawerRoot, parts);
/** Off-canvas side panel — same component as `Drawer`, with the off-canvas name. */
export const OffCanvas = Object.assign(DrawerRoot, parts);
