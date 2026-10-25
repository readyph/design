import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  /** Text variant only: render this many lines; the last one is shorter. */
  lines?: number;
}

const shape = {
  text: 'h-4 rounded-chip',
  rect: 'rounded-card',
  circle: 'rounded-full',
} as const;

/**
 * A skeleton bar (C32): a quiet placeholder in the final layout while data loads.
 * Pulses softly, and holds still under reduced motion. Hidden from assistive tech: wrap the
 * region in `aria-busy="true"` and give it a visible or screen-reader "Loading ..." label.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { variant = 'rect', width, height, lines, className, style, ...rest },
  ref,
) {
  if (variant === 'text' && lines && lines > 1) {
    return (
      <div ref={ref} aria-hidden className={cn('flex flex-col gap-2', className)} style={{ width, ...style }} {...rest}>
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className={cn('block bg-skeleton motion-safe:animate-pulse', shape.text, i === lines - 1 && 'w-3/5')} />
        ))}
      </div>
    );
  }
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn('bg-skeleton motion-safe:animate-pulse', shape[variant], className)}
      style={{ width, height, ...style }}
      {...rest}
    />
  );
});
