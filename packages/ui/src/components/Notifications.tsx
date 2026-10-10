import { forwardRef, type HTMLAttributes } from 'react';
import {
  ShoppingCart,
  SealCheck,
  ShieldCheck,
  ChartLineUp,
  DotsThree,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { Icon } from './Icon';
import { Avatar } from './Avatar';
import { IconButton } from './IconButton';

export type NotificationKind = 'order' | 'payment' | 'security' | 'activity';

export interface NotificationItem {
  id: string;
  title: string;
  /** Optional supporting line. */
  body?: string;
  /** Pre-formatted timestamp, e.g. "Wednesday 8.30 pm". */
  time: string;
  kind?: NotificationKind;
  /** Show an initials avatar (e.g. a customer) instead of a kind icon. */
  avatarName?: string;
  /** Small count bubble on the icon/avatar. */
  count?: number;
  /** Which tab(s) this belongs to; matched against the active tab label. */
  tags?: string[];
}

export interface NotificationsProps extends HTMLAttributes<HTMLDivElement> {
  items: NotificationItem[];
  /** Tab labels; the first is treated as "all". Omit to hide tabs. */
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onViewAll?: () => void;
  onMore?: () => void;
}

const KIND_ICON: Record<NotificationKind, PhosphorIcon> = {
  order: ShoppingCart,
  payment: SealCheck,
  security: ShieldCheck,
  activity: ChartLineUp,
};

/** A notifications panel: header, filter tabs, a list of events, and a footer link. */
export const Notifications = forwardRef<HTMLDivElement, NotificationsProps>(function Notifications(
  { items, tabs, activeTab, onTabChange, onViewAll, onMore, className, ...rest },
  ref,
) {
  const active = activeTab ?? tabs?.[0];
  const shown =
    tabs && active && active !== tabs[0]
      ? items.filter((n) => n.tags?.includes(active))
      : items;

  return (
    <div
      ref={ref}
      className={cn(
        'flex w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface text-ink shadow-xl',
        className,
      )}
      {...rest}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
        <h3 className="text-lg font-bold tracking-tight">Notifications</h3>
        <IconButton icon={DotsThree} label="Notification options" variant="subtle" size="sm" className="rounded-full" onClick={onMore} />
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex gap-1 rounded-lg bg-surface-subtle p-0.5">
            {tabs.map((t) => {
              const on = t === active;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTabChange?.(t)}
                  className={cn(
                    'flex-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                    on ? 'bg-surface text-primary-600 shadow-sm' : 'text-ink-muted hover:text-ink',
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* List */}
      <div className="max-h-[22rem] divide-y divide-border overflow-y-auto">
        {shown.map((n) => (
          <button
            key={n.id}
            type="button"
            className="flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors hover:bg-surface-subtle"
          >
            <span className="relative shrink-0">
              {n.avatarName ? (
                <Avatar name={n.avatarName} size="md" shape="square" />
              ) : (
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600">
                  <Icon icon={KIND_ICON[n.kind ?? 'activity']} size="md" />
                </span>
              )}
              {typeof n.count === 'number' && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-error px-1 text-[0.6875rem] font-bold text-white ring-2 ring-surface">
                  {n.count}
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold leading-snug text-ink">{n.title}</span>
              {n.body && <span className="mt-0.5 block text-sm leading-snug text-ink-muted">{n.body}</span>}
              <span className="mt-1 block text-xs text-ink-subtle">{n.time}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <button
        type="button"
        onClick={onViewAll}
        className="border-t border-border px-5 py-3.5 text-center text-sm font-semibold text-primary-600 transition-colors hover:bg-surface-subtle"
      >
        View all notifications
      </button>
    </div>
  );
});
