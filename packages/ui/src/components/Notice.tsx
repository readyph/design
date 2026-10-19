import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import {
  Info,
  CheckCircle,
  Warning,
  WarningOctagon,
  X,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';

export type NoticeTone = 'info' | 'success' | 'warning' | 'error' | 'neutral';

export interface NoticeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: NoticeTone;
  /** Optional heading above the body. */
  title?: ReactNode;
  /** Override the default tone icon, or pass `null` to hide it. */
  icon?: PhosphorIcon | null;
  /** Show a dismiss control; the project supplies the handler. */
  onDismiss?: () => void;
  children?: ReactNode;
}

const tones: Record<NoticeTone, { box: string; icon: string; defaultIcon: PhosphorIcon }> = {
  info: { box: 'border-info/30 bg-info/5', icon: 'text-info', defaultIcon: Info },
  success: { box: 'border-success/30 bg-success/5', icon: 'text-success-fg', defaultIcon: CheckCircle },
  warning: { box: 'border-warning/40 bg-warning/5', icon: 'text-warning-fg', defaultIcon: Warning },
  error: { box: 'border-error/30 bg-error/5', icon: 'text-error-fg', defaultIcon: WarningOctagon },
  neutral: { box: 'border-border bg-surface-subtle', icon: 'text-ink-muted', defaultIcon: Info },
};

/** Inline alert / banner with a tone, icon, optional title and dismiss. */
export const Notice = forwardRef<HTMLDivElement, NoticeProps>(function Notice(
  { tone = 'info', title, icon, onDismiss, className, children, ...rest },
  ref,
) {
  const t = tones[tone];
  const IconCmp = icon === null ? null : (icon ?? t.defaultIcon);
  return (
    <div
      ref={ref}
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-md border p-3 text-sm text-ink', t.box, className)}
      {...rest}
    >
      {IconCmp && <Icon icon={IconCmp} size="md" weight="fill" className={cn('mt-0.5', t.icon)} />}
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div className={cn('text-ink', title && 'mt-0.5')}>{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className={cn(
            'grid h-5 w-5 shrink-0 place-items-center rounded-sm text-ink-subtle hover:bg-black/5 hover:text-ink',
            focusRing,
          )}
        >
          <Icon icon={X} size="sm" />
        </button>
      )}
    </div>
  );
});
