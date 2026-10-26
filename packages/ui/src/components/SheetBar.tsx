import { type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface SheetBarProps {
  /** Left: tabs (C5) or a breadcrumb (C42). Takes the free width and shrinks. */
  children?: ReactNode;
  /** Right: the Ask Leda bar (C6) and page buttons. Never shrinks. */
  actions?: ReactNode;
  className?: string;
}

/** Sheet bar (C5): 48px, 24px side padding, bottom border; tabs or breadcrumb left, Leda bar and buttons right. */
export function SheetBar({ children, actions, className }: SheetBarProps) {
  return (
    <div className={cn('flex h-sheet-bar items-stretch gap-4 border-b border-border bg-surface px-pad', className)}>
      <div className="flex min-w-0 flex-1 items-center [&_[role=tablist]]:border-b-0">{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
