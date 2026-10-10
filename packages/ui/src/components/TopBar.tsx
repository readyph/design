import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface TopBarProps extends HTMLAttributes<HTMLElement> {
  /** Left slot — brand, nav toggle, breadcrumbs. */
  start?: ReactNode;
  /** Center slot — usually search. */
  center?: ReactNode;
  /** Right slot — actions, profile menu. */
  end?: ReactNode;
}

/**
 * A horizontal application bar with start / center / end slots. Height comes
 * from the `topbar` token. Compose freely; the package ships no app shell.
 */
export const TopBar = forwardRef<HTMLElement, TopBarProps>(function TopBar(
  { start, center, end, className, children, ...rest },
  ref,
) {
  return (
    <header
      ref={ref}
      className={cn('flex h-[3.25rem] items-center gap-4 bg-transparent px-4', className)}
      {...rest}
    >
      {children ?? (
        <>
          <div className="flex items-center gap-2">{start}</div>
          {center && <div className="flex flex-1 justify-center">{center}</div>}
          <div className={cn('flex items-center gap-2', !center && 'ml-auto')}>{end}</div>
        </>
      )}
    </header>
  );
});
