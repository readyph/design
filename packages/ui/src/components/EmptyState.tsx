import { createElement, type ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { Lock } from '@phosphor-icons/react';
import { cn } from '../utils/cn';

export interface EmptyStateProps {
  icon?: PhosphorIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Primary action, usually the next step (a button or link). */
  action?: ReactNode;
  /** No-permission line naming who can help, e.g. "Ask Maria Santos (owner) for access." Shown with a lock. */
  restricted?: ReactNode;
  /** `center` fills a whole region; `start` is the left-aligned inline variant for panels and lists. */
  align?: 'center' | 'start';
  /** Render the title as a heading of this level. Default is a paragraph. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

/**
 * Empty state (C32): first-run copy plus the next step. Say what will appear here and how to
 * start; for no permission, name who can help. Use `align="start"` inside a panel or list.
 */
export function EmptyState({ icon, title, description, action, restricted, align = 'center', headingLevel, className }: EmptyStateProps) {
  const start = align === 'start';
  const titleClass = 'text-body font-semibold text-text';
  return (
    <div className={cn(start ? 'flex items-start gap-3 px-pad py-row-y' : 'mx-auto flex max-w-sm flex-col items-center gap-2 px-pad py-12 text-center', className)}>
      {icon && (
        <span aria-hidden className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full bg-raised-2 text-muted', !start && 'mb-1 h-12 w-12')}>
          {createElement(icon, { size: start ? 20 : 24 })}
        </span>
      )}
      <div className={cn('flex min-w-0 flex-col gap-1', !start && 'items-center')}>
        {headingLevel ? createElement(`h${headingLevel}`, { className: titleClass }, title) : <p className={titleClass}>{title}</p>}
        {description && <p className="text-body text-muted">{description}</p>}
        {restricted && (
          <p className="mt-1 inline-flex items-start gap-1.5 text-small text-muted">
            <Lock aria-hidden size={12} weight="bold" className="mt-1 shrink-0" />
            <span>{restricted}</span>
          </p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
