import { type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface SheetBarProps {
  /** Left: tabs (C5) or a breadcrumb (C42). Takes the free width and shrinks. */
  children?: ReactNode;
  /** Right: the Ask Leda bar (C6) and page buttons. Never shrinks. */
  actions?: ReactNode;
  /** From 641 to 1100px put the children on their own row under the actions (tabs). `false` keeps a short breadcrumb beside the Leda bar, as the prototype's `.where` does. Default true. */
  wrapChildren?: boolean;
  className?: string;
}

/** From 641 to 1100px the bar wraps (actions first, tabs or breadcrumb on a second row) so the tabs never collapse next to the Ask Leda bar (shell.css 354 in the prototype). */
const W = 'min-[641px]:max-[1100px]:h-auto min-[641px]:max-[1100px]:flex-wrap min-[641px]:max-[1100px]:gap-y-0.5 min-[641px]:max-[1100px]:pt-2';

/** Sheet bar (C5): 48px with the border PlatformShell draws under it, 24px side padding; tabs or breadcrumb left, Leda bar and buttons right. */
export function SheetBar({ children, actions, wrapChildren = true, className }: SheetBarProps) {
  return (
    <div className={cn('flex h-[calc(var(--sheet-bar)-1px)] items-stretch gap-4 bg-surface px-pad', W, className)}>
      <div className={cn('flex min-w-0 flex-1 items-center [&_[role=tablist]]:border-b-0', actions && wrapChildren && 'min-[641px]:max-[1100px]:order-last min-[641px]:max-[1100px]:h-10 min-[641px]:max-[1100px]:basis-full')}>{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-2 min-[641px]:max-[1100px]:order-first">{actions}</div>}
    </div>
  );
}
