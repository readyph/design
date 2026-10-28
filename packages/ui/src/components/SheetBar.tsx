import { type ReactNode } from 'react';
import { cn } from '../utils/cn';
import { PlatformLogo, type PlatformLogoProps } from './PlatformLogo';

export interface SheetBarProps {
  /** Left: tabs (C5) or a breadcrumb (C42). Takes the free width and shrinks. */
  children?: ReactNode;
  /** Right: the Ask Leda bar (C6) and page buttons. Never shrinks. */
  actions?: ReactNode;
  /** From 641 to 1100px put the children on their own row under the actions (tabs). `false` keeps a short breadcrumb beside the Leda bar, as the prototype's `.where` does. Default true. */
  wrapChildren?: boolean;
  /** From 641 to 1100px the actions go first (above the children). `false` (Inventory, RDY-382; home.html 34) keeps them on the right of the same row: `order-2`, pushed right. Default true. */
  actionsFirst?: boolean;
  className?: string;
}

/** From 641 to 1100px the bar wraps (actions first, tabs or breadcrumb on a second row) so the tabs never collapse next to the Ask Leda bar (shell.css 354 in the prototype). */
const W = 'min-[641px]:max-[1100px]:h-auto min-[641px]:max-[1100px]:flex-wrap min-[641px]:max-[1100px]:gap-y-0.5 min-[641px]:max-[1100px]:pt-2';

/** In that band the actions' own children join the bar's wrapping row (the prototype's .cmd-wrap / .sb-try are direct children of .sbar): first, centred. Between siblings: the bar's 16px gap + 8px (memory.css 219). */
const TABLET_FLAT = 'min-[641px]:max-[1100px]:contents min-[641px]:max-[1100px]:[&>*]:order-[-1] min-[641px]:max-[1100px]:[&>*]:shrink-0 min-[641px]:max-[1100px]:[&>*]:self-center';

/** Inventory: the actions stay to the right of the "where" crumb (home.html 34: `.sbar .cmd-wrap { order: 2; margin-left: auto }`). */
const TABLET_FLAT_AFTER = 'min-[641px]:max-[1100px]:contents min-[641px]:max-[1100px]:[&>*]:order-2 min-[641px]:max-[1100px]:[&>*]:ml-auto min-[641px]:max-[1100px]:[&>*]:shrink-0 min-[641px]:max-[1100px]:[&>*]:self-center';

/** Sheet bar (C5): 48px with the border PlatformShell draws under it, 24px side padding; tabs or breadcrumb left, Leda bar and buttons right. */
export function SheetBar({ children, actions, wrapChildren = true, actionsFirst = true, className }: SheetBarProps) {
  return (
    <div className={cn('flex h-[calc(var(--sheet-bar)-1px)] items-stretch gap-4 bg-surface px-pad', W, className)}>
      <div className={cn('flex min-w-0 flex-1 items-center [&_[role=tablist]]:border-b-0', actions && wrapChildren && 'min-[641px]:max-[1100px]:order-last min-[641px]:max-[1100px]:h-10 min-[641px]:max-[1100px]:basis-full')}>{children}</div>
      {actions && <div className={cn('flex shrink-0 items-center gap-4 [&>*+*]:ml-2', actionsFirst ? TABLET_FLAT : TABLET_FLAT_AFTER)}>{actions}</div>}
    </div>
  );
}

export interface SheetBarWhereProps {
  /** Platform name (bold) and logo. */
  platform: Pick<PlatformLogoProps, 'name' | 'src' | 'color' | 'initials'>;
  /** Page name after the "/". */
  page: string;
  /** Text after a "·", e.g. "Viewing as Ana, stocker" (shown when the viewer is not the manager). */
  note?: string;
  className?: string;
}

/**
 * The "where" crumb of the Inventory sheet bar (RDY-382; home.html 39-42): 18px platform logo, platform name (600, `--text`), "/" (`--control`),
 * page name, all 13px `--muted`, 8px apart. Pass it as the `SheetBar` children, with the Ask Leda bar in `actions` and `wrapChildren={false}`.
 */
export function SheetBarWhere({ platform, page, note, className }: SheetBarWhereProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2 text-[13px] text-muted', className)}>
      <PlatformLogo name={platform.name} src={platform.src} color={platform.color} initials={platform.initials} size={18} decorative />
      <b className="font-semibold text-text">{platform.name}</b>
      <span aria-hidden="true" className="text-control">/</span>
      <span>{page}</span>
      {note ? (
        <>
          <span aria-hidden="true" className="text-control">·</span>
          <span>{note}</span>
        </>
      ) : null}
    </div>
  );
}
