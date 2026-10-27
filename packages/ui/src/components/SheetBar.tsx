import { type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface SheetBarProps {
  /** Left: tabs (C5) or a breadcrumb (C42). Takes the free width and shrinks. */
  children?: ReactNode;
  /** Right: the Ask Leda bar (C6) and page buttons. Never shrinks. */
  actions?: ReactNode;
  /** From 641 to 1100px the `actions` become direct items of the wrapping bar (display: contents), first in order, so each can wrap onto its own row (the Memory page's Try it right, the Ask Leda bar on its own row). Default off. */
  flatActions?: boolean;
  className?: string;
}

/** From 641 to 1100px the bar wraps (actions first, tabs or breadcrumb on a second row) so the tabs never collapse next to the Ask Leda bar (shell.css 354 in the prototype). */
const W = 'min-[641px]:max-[1100px]:h-auto min-[641px]:max-[1100px]:flex-wrap min-[641px]:max-[1100px]:gap-y-0.5 min-[641px]:max-[1100px]:pt-2';

/** Sheet bar (C5): 48px, 24px side padding, bottom border; tabs or breadcrumb left, Leda bar and buttons right. */
export function SheetBar({ children, actions, flatActions, className }: SheetBarProps) {
  return (
    <div className={cn('flex h-[calc(var(--sheet-bar)-1px)] items-stretch gap-4 bg-surface px-pad', W, className)}>
      <div className={cn('flex min-w-0 flex-1 items-center [&_[role=tablist]]:border-b-0', actions && 'min-[641px]:max-[1100px]:order-last min-[641px]:max-[1100px]:h-10 min-[641px]:max-[1100px]:basis-full')}>{children}</div>
      {actions && <div className={cn('flex shrink-0 items-center gap-2', flatActions && 'min-[641px]:max-[1100px]:contents min-[641px]:max-[1100px]:[&>*]:order-first')}>{actions}</div>}
    </div>
  );
}
