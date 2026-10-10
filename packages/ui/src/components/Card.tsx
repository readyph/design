import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Elevation; `flat` is a plain filled panel. */
  elevation?: 'flat' | 'sm' | 'md';
  /** Hover affordance for clickable cards. */
  interactive?: boolean;
  children?: ReactNode;
}

const paddings = { none: 'p-0', sm: 'p-3', md: 'p-4', lg: 'p-6' };
const elevations = { flat: 'shadow-none', sm: 'shadow-sm', md: 'shadow-md' };

/** A surface container. Compose header/body/footer as children. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = 'md', elevation = 'sm', interactive = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg bg-surface',
        paddings[padding],
        elevations[elevation],
        interactive && 'transition-shadow duration-DEFAULT hover:shadow-md',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/** Optional header row with a bottom divider. */
export const CardHeader = forwardRef<HTMLDivElement, CardSectionProps>(function CardHeader(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn('flex items-center justify-between gap-3 pb-3', className)} {...rest}>
      {children}
    </div>
  );
});

/** Optional footer row with a top divider. */
export const CardFooter = forwardRef<HTMLDivElement, CardSectionProps>(function CardFooter(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn('flex items-center justify-end gap-2 pt-3', className)} {...rest}>
      {children}
    </div>
  );
});
