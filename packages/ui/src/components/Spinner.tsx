import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  /** Accessible name, visually hidden. */
  label?: string;
}

const sizes: Record<SpinnerSize, string> = {
  sm: 'h-3.5 w-3.5 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

/** CSS spinner (RDY-314). Under reduced motion the animation is removed and a static ring with one solid quarter remains. */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', label = 'Loading', className, ...rest },
  ref,
) {
  return (
    <span ref={ref} role="status" className={cn('inline-flex items-center justify-center', className)} {...rest}>
      <span
        aria-hidden="true"
        data-spinner=""
        className={cn('block animate-spin rounded-full border-control border-t-accent motion-reduce:animate-none forced-colors:border-[GrayText] forced-colors:border-t-[Highlight]', sizes[size])}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
});
