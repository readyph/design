import * as RadixToast from '@radix-ui/react-toast';
import {
  CheckCircle,
  Info,
  Warning,
  WarningOctagon,
  X,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { cn, focusRing } from '../../utils/cn';
import { Icon } from '../Icon';
import { useToasts, dismissToast, type ToastTone } from './toastStore';

const toneIcon: Record<ToastTone, { icon: PhosphorIcon; color: string }> = {
  info: { icon: Info, color: 'text-info' },
  success: { icon: CheckCircle, color: 'text-success-fg' },
  warning: { icon: Warning, color: 'text-warning-fg' },
  error: { icon: WarningOctagon, color: 'text-error-fg' },
};

export interface ToasterProps {
  /** Viewport corner. */
  position?: 'top-right' | 'bottom-right' | 'top-center' | 'bottom-center';
}

const positions: Record<NonNullable<ToasterProps['position']>, string> = {
  'top-right': 'top-0 right-0 flex-col',
  'bottom-right': 'bottom-0 right-0 flex-col-reverse',
  'top-center': 'top-0 left-1/2 -translate-x-1/2 flex-col items-center',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 flex-col-reverse items-center',
};

/**
 * Mount once near the app root. Renders queued toasts with Radix Toast
 * (swipe-to-dismiss, screen-reader announcements, keyboard focus).
 */
export function Toaster({ position = 'bottom-right' }: ToasterProps) {
  const toasts = useToasts();
  return (
    <RadixToast.Provider swipeDirection="right">
      {toasts.map((t) => {
        const { icon, color } = toneIcon[t.tone];
        return (
          <RadixToast.Root
            key={t.id}
            duration={t.duration === 0 ? Infinity : t.duration}
            onOpenChange={(open) => {
              if (!open) dismissToast(t.id);
            }}
            className={cn(
              'pointer-events-auto flex w-80 items-start gap-3 rounded-md border border-border bg-surface p-3 shadow-lg',
              'data-[state=open]:animate-[ds-popover-in_150ms_ease] data-[swipe=end]:animate-[ds-fade-out_120ms_ease] motion-reduce:animate-none',
            )}
          >
            <Icon icon={icon} size="md" weight="fill" className={cn('mt-0.5', color)} />
            <div className="min-w-0 flex-1">
              {t.title && <RadixToast.Title className="text-sm font-semibold text-ink">{t.title}</RadixToast.Title>}
              {t.description && (
                <RadixToast.Description className={cn('text-sm text-ink-muted', t.title && 'mt-0.5')}>
                  {t.description}
                </RadixToast.Description>
              )}
              {t.action && (
                <RadixToast.Action altText={t.action.label} asChild>
                  <button
                    type="button"
                    onClick={t.action.onClick}
                    className={cn('mt-2 rounded-sm text-sm font-medium text-link hover:text-primary-700', focusRing)}
                  >
                    {t.action.label}
                  </button>
                </RadixToast.Action>
              )}
            </div>
            <RadixToast.Close
              aria-label="Dismiss"
              className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-sm text-ink-subtle hover:bg-surface-muted hover:text-ink', focusRing)}
            >
              <Icon icon={X} size="sm" />
            </RadixToast.Close>
          </RadixToast.Root>
        );
      })}
      <RadixToast.Viewport
        className={cn('pointer-events-none fixed z-toast m-0 flex max-h-screen w-fit gap-2 p-4', positions[position])}
      />
    </RadixToast.Provider>
  );
}
