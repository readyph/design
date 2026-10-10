import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** Render smaller, for inline use inside dense controls. */
  size?: 'sm' | 'md';
}

/**
 * A styled keycap badge (brand-tinted). Used inline, in tooltips, in
 * button/nav key hints, and in a `?` shortcuts overlay. Purely presentational.
 *
 * @example <Kbd>⌘</Kbd><Kbd>K</Kbd>
 */
export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd(
  { size = 'md', className, children, ...rest },
  ref,
) {
  return (
    <kbd
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-sm border border-primary-200',
        'bg-primary-50 font-sans font-medium text-primary-700 tabular-nums',
        'shadow-[inset_0_-1px_0_rgb(var(--ds-primary-200))]',
        size === 'sm' ? 'h-4 min-w-4 px-1 text-[0.6875rem]' : 'h-5 min-w-5 px-1.5 text-xs',
        className,
      )}
      {...rest}
    >
      {children}
    </kbd>
  );
});
