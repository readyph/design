import { createContext, useContext, useRef, type HTMLAttributes, type ReactNode, type RefObject } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';

/**
 * `sm` / `md` / `lg` are the original content-sized dialogs (height follows content).
 * `panel` (C13) is fixed 720 x 640, `marketplace` (C20) is fixed 904 x 744; both shrink to
 * the window less 24px each side and go full screen on a phone. Fixed size never changes with content.
 * `confirm` (C12) is 420 wide (the window less 48px), content-high, and stays a centred dialog on a phone.
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'confirm' | 'panel' | 'marketplace';

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional trigger element (for uncontrolled use). */
  trigger?: ReactNode;
  /** Header title. Omit when composing with `Modal.Header`. */
  title?: ReactNode;
  description?: ReactNode;
  /** Phosphor icon shown in the 32px well before the title. */
  icon?: PhosphorIcon;
  /** Any node for the 32px well instead of `icon`, e.g. `<LedaMark size={18} decorative />` (Try it, C30). */
  iconNode?: ReactNode;
  children?: ReactNode;
  /** Footer actions row. Omit when composing with `Modal.Footer`. */
  footer?: ReactNode;
  size?: ModalSize;
  /** Hide the close (X) button. */
  hideClose?: boolean;
  /** Accessible name when there is no visible title (composition without Modal.Header). */
  'aria-label'?: string;
  /** `alertdialog` for confirmations that interrupt (ConfirmDialog). Default `dialog`. */
  role?: 'dialog' | 'alertdialog';
  /** Element that takes focus on open instead of the first control (e.g. Cancel in a confirmation). */
  initialFocus?: RefObject<HTMLElement | null>;
  /**
   * Runs when the modal has closed and focus is about to return to the opener. Call `event.preventDefault()` to skip
   * that return and decide yourself (for example with `focusIfLost`). Not calling it keeps the default.
   */
  onCloseAutoFocus?: (event: Event) => void;
  className?: string;
}

const sizes: Record<ModalSize, string> = {
  sm: 'max-w-sm max-h-[calc(100vh-48px)]',
  md: 'max-w-md max-h-[calc(100vh-48px)]',
  lg: 'max-w-lg max-h-[calc(100vh-48px)]',
  confirm: 'w-[min(420px,calc(100vw-48px))] max-h-[calc(100vh-48px)]',
  panel: 'h-[min(640px,calc(100vh-48px))] w-[min(720px,calc(100vw-48px))]',
  marketplace: 'h-[min(744px,calc(100vh-48px))] w-[min(904px,calc(100vw-48px))]',
};

const overlay = 'fixed inset-0 z-50 bg-scrim';

const content =
  'fixed left-1/2 top-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-sheet border border-border bg-surface text-text shadow-float focus:outline-none';

/** Phone: every size but `confirm` becomes a full-screen sheet. */
const sheet =
  'max-sm:inset-0 max-sm:h-full max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0';

const ModalContext = createContext({ hideClose: false });

function CloseButton({ className, label }: { className?: string; label?: string }) {
  return (
    <Dialog.Close
      aria-label={label ? `Close ${label}` : 'Close'}
      className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-control text-muted hover:bg-raised hover:text-text max-sm:h-11 max-sm:w-11',
        focusRing,
        className,
      )}
    >
      <X size={18} aria-hidden />
    </Dialog.Close>
  );
}

/** 32px icon well (raised surface, card radius, accent icon). Holds a Phosphor `icon` or any `children` (the Leda mark). */
export function ModalIconWell({ icon: Ico, children }: { icon?: PhosphorIcon; children?: ReactNode }) {
  return (
    <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-card bg-raised text-accent">
      {Ico ? <Ico size={18} /> : children}
    </span>
  );
}

export interface ModalHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: PhosphorIcon;
  iconNode?: ReactNode;
  description?: ReactNode;
  /** Replaces the title's type style (default `text-dialog`). */
  titleClassName?: string;
  /** Replaces the description's type style (default 13/18 muted). */
  descriptionClassName?: string;
}

/** Header region: optional icon well, title (accessible name), description and close button. */
export function ModalHeader({ icon, iconNode, description, titleClassName, descriptionClassName, className, children, ...rest }: ModalHeaderProps) {
  const { hideClose } = useContext(ModalContext);
  return (
    <div className={cn('flex shrink-0 items-start gap-3 border-b border-rule px-pad py-4 max-sm:px-4', className)} {...rest}>
      {(icon || iconNode) && <ModalIconWell icon={icon}>{iconNode}</ModalIconWell>}
      <div className="min-w-0 flex-1">
        <Dialog.Title className={cn(titleClassName ?? 'text-dialog', 'text-text')}>{children}</Dialog.Title>
        {description && <Dialog.Description className={cn('mt-0.5 text-muted', descriptionClassName ?? 'text-[13px] leading-[18px]')}>{description}</Dialog.Description>}
      </div>
      {!hideClose && <CloseButton label={typeof children === 'string' ? children : undefined} />}
    </div>
  );
}

/** Body region: takes the remaining height and scrolls inside. */
export function ModalBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      tabIndex={0}
      className={cn('min-h-0 flex-1 overflow-y-auto px-pad py-5 text-body text-text max-sm:px-4', focusRing, 'focus-visible:ring-inset focus-visible:ring-offset-0', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Footer actions region (right-aligned; stacks full width on a phone). */
export function ModalFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex shrink-0 items-center justify-end gap-3 border-t border-rule px-pad py-3 max-sm:flex-col-reverse max-sm:items-stretch max-sm:px-4', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Accessible modal dialog (focus trap, Esc, backdrop click, focus returns to the trigger) on Radix Dialog.
 *
 * Quick: `title` / `icon` / `description` / `footer` props. Composed: `Modal.Header`, `Modal.Body`, `Modal.Footer`.
 * Use `size="panel"` (720 x 640) or `"marketplace"` (904 x 744) for fixed-size panels.
 */
function ModalRoot({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  icon,
  iconNode,
  children,
  footer,
  size = 'md',
  hideClose = false,
  role,
  initialFocus,
  onCloseAutoFocus,
  'aria-label': ariaLabel,
  className,
}: ModalProps) {
  const opener = useRef<HTMLElement | null>(null);
  const quick = title != null;
  const isFixed = size === 'panel' || size === 'marketplace';
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className={overlay} />
        <Dialog.Content
          className={cn(content, size !== 'confirm' && sheet, sizes[size], className)}
          role={role ?? 'dialog'}
          aria-label={ariaLabel}
          data-size={size}
          onOpenAutoFocus={(e) => {
            opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            if (initialFocus?.current) {
              e.preventDefault();
              initialFocus.current.focus();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Esc on an open Select closes only its listbox; the next Esc closes the modal.
            const t = e.target;
            if (t instanceof Element && t.closest('[role="listbox"], [role="combobox"][aria-expanded="true"]')) e.preventDefault();
          }}
          onCloseAutoFocus={(e) => {
            onCloseAutoFocus?.(e);
            if (e.defaultPrevented) return;
            // Controlled use has no Dialog.Trigger, so return focus to whatever opened the modal.
            if (!trigger && opener.current?.isConnected) {
              e.preventDefault();
              opener.current.focus();
            }
          }}
        >
          <ModalContext.Provider value={{ hideClose }}>
            {quick ? (
              <>
                <ModalHeader icon={icon} iconNode={iconNode} description={description}>{title}</ModalHeader>
                {(isFixed || children) && <ModalBody>{children}</ModalBody>}
                {footer && <ModalFooter>{footer}</ModalFooter>}
              </>
            ) : (
              children
            )}
          </ModalContext.Provider>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});
